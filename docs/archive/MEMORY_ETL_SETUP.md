# Memory ETL Setup & Operations

> Automated batch processing of conversations into Neo4j memory nodes.

---

## Overview

The Memory ETL system has two modes:

### 1. Backfill (One-Time)
**Purpose:** Ingest ALL historical conversations (378 total) into Neo4j.

**Script:** `backend/scripts/backfill_memory_etl.py`

- No time filtering—processes conversations in order by ID
- Pagination: batch size 200, no limit on total
- Skips unchanged conversations (hash + timestamp check)
- Full history indexed for semantic recall

### 2. Nightly (Recurring)
**Purpose:** Incrementally update recent conversations every 24 hours.

**Script:** `backend/scripts/nightly_memory_etl.py`

- Lookback: 24 hours (see `ETLConfig.lookback_hours` line 86)
- Batch size: 100 rows per run
- Runs at 2 AM UTC (configurable in systemd timer)
- Upserts changed conversations, skips unchanged

---

## Step 1: Backfill Everything

Run once to populate Neo4j with all 378 conversations:

```bash
cd /home/mosab/projects/chatmodule/backend
.venv/bin/python scripts/backfill_memory_etl.py
```

Expected output:
```
Starting Memory Backfill ETL (ALL CONVERSATIONS)
Fetching batch at offset 0 (batch size: 200)
Progress: 50 created, 10 skipped
Progress: 100 created, 20 skipped
...
Backfill Complete: {'processed': 378, 'created': 350+, 'skipped': 0-30, 'errors': 0, 'total_fetched': 378}
```

Logs saved to `/home/mosab/projects/chatmodule/backend/logs/memory_backfill.log`

---

## Step 2: Set Up Nightly ETL as a Systemd Timer

After backfill completes, install the nightly job:

```bash
chmod +x /home/mosab/projects/chatmodule/backend/systemd/install_etl_timer.sh
/home/mosab/projects/chatmodule/backend/systemd/install_etl_timer.sh
```

This will:
1. Copy service/timer files to `~/.config/systemd/user/`
2. Enable and start the timer
3. Schedule the job to run at **2 AM UTC daily** (see `josoor-memory-etl.timer`)

### Verify Installation

```bash
# Check timer status
systemctl --user status josoor-memory-etl.timer

# View next run time
systemctl --user list-timers josoor-memory-etl.timer

# Check service logs
journalctl --user -u josoor-memory-etl -f
```

### Manual Run

To test immediately:

```bash
systemctl --user start josoor-memory-etl.service
sleep 2
journalctl --user -u josoor-memory-etl -f
```

---

## Environment Requirements

Both scripts require these in `backend/.env`:

```dotenv
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEO4J_URI=...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
NEO4J_DATABASE=memory_semantic_index
OPENAI_API_KEY=...
```

---

## Configuration

### Backfill Script

**File:** `backend/scripts/backfill_memory_etl.py` (lines 57–70)

```python
@dataclass
class ETLConfig:
    batch_size: int = 200              # Higher for backfill
    min_conversation_length: int = 3   # Minimum turns to process
```

### Nightly Script

**File:** `backend/scripts/nightly_memory_etl.py` (lines 85–87)

```python
@dataclass
class ETLConfig:
    batch_size: int = 100              # Keep small for incremental
    lookback_hours: int = 24           # Only recent conversations
    min_conversation_length: int = 3
```

To change the nightly schedule (e.g., 3 AM instead of 2 AM):

```bash
systemctl --user edit josoor-memory-etl.timer
# Change line: OnCalendar=*-*-* 03:00:00
# Save (Ctrl+X in nano)
systemctl --user restart josoor-memory-etl.timer
```

---

## Data Flow

```
Supabase Conversations/Messages
         │
         ├─→ Backfill Script (all-time, once)
         │        │
         │        ▼
         │   → Neo4j Memory nodes (full history)
         │
         └─→ Nightly Script (24h lookback, every 24h)
                  │
                  ▼
              → Neo4j Memory nodes (incremental updates)
                  ↓
                Backend recall_memory tool (semantic search)
                  ↓
                Noor/Maestro MCP Router (filtered by user_id + scope)
```

---

## Monitoring & Troubleshooting

### View Recent Logs

```bash
# Last 50 lines
journalctl --user -u josoor-memory-etl -n 50

# Follow in real-time
journalctl --user -u josoor-memory-etl -f

# Last hour
journalctl --user -u josoor-memory-etl --since "1 hour ago"
```

### Check Memory Nodes in Neo4j

```bash
cd /home/mosab/projects/chatmodule/backend
.venv/bin/python -c """
from neo4j import GraphDatabase
from dotenv import dotenv_values
import json

env = dotenv_values('.env')
driver = GraphDatabase.driver(env['NEO4J_URI'], auth=(env.get('NEO4J_USER','neo4j'), env['NEO4J_PASSWORD']))

with driver.session(database=env.get('NEO4J_DATABASE','memory_semantic_index')) as session:
    res = session.run('MATCH (m:Memory) RETURN COUNT(m) AS count')
    print(f\"Total Memory nodes: {res.single()['count']}\")
    
    res = session.run('MATCH (m:Memory) RETURN m.user_id, COUNT(m) AS cnt ORDER BY cnt DESC LIMIT 10')
    for row in res:
        print(f\"  user {row['m.user_id']}: {row['cnt']} memories\")

driver.close()
"""
```

### ETL Failed to Run

1. Check environment:
   ```bash
   cat /home/mosab/projects/chatmodule/backend/.env | grep -E "SUPABASE|NEO4J|OPENAI"
   ```

2. Test Supabase connection:
   ```bash
   cd /home/mosab/projects/chatmodule && python debug_supabase_simple.py
   ```

3. Test Neo4j connection:
   ```bash
   cd /home/mosab/projects/chatmodule/backend
   .venv/bin/python -c "from neo4j import GraphDatabase; print('✅ Neo4j driver OK')"
   ```

4. Run backfill manually with verbose logging:
   ```bash
   .venv/bin/python scripts/backfill_memory_etl.py 2>&1 | tee /tmp/etl_debug.log
   ```

---

## Disable or Remove Timer

```bash
# Stop the timer
systemctl --user stop josoor-memory-etl.timer

# Disable auto-start
systemctl --user disable josoor-memory-etl.timer

# Remove files
rm ~/.config/systemd/user/josoor-memory-etl.*
systemctl --user daemon-reload
```

---

## Architecture Notes

### Why Two Scripts?

- **Backfill:** All-time ingestion in one pass; runs once; high batch size
- **Nightly:** Incremental updates; runs frequently; small batch size + time window

This design:
- ✅ Minimizes repeated processing of old conversations
- ✅ Quickly captures new conversations every 24h
- ✅ Resumable if interrupted (hash-based dedup)
- ✅ No supervision required (automated systemd timer)

### Memory Node Deduplication

Both scripts use a **message hash + updated_at timestamp** to detect changes:

```python
def _needs_processing(conv, incoming_hash, existing):
    if not existing:
        return True  # New conversation
    
    # Skip if both hash and timestamp unchanged
    if existing_hash == incoming_hash and existing_ts >= incoming_ts:
        return False  # Already processed
    
    return True  # Updated conversation
```

This ensures:
- Each unique conversation state is processed exactly once
- Re-runs don't duplicate work
- Schema changes trigger reprocessing

### Embedding Strategy

Both scripts use **chunked embedding with averaging**:

1. Split conversation text into 7K-char chunks
2. Call OpenAI `/embeddings` with all chunks at once
3. Average the vectors (weighted sum / count)
4. Store single 1536-dim vector in Memory node

Benefits:
- Avoids truncation loss from overly large conversations
- Single vector for semantic search (fast)
- Preserves full conversation content (no summarization)

---

## Next Steps

1. **Run backfill:**
   ```bash
   cd /home/mosab/projects/chatmodule/backend && .venv/bin/python scripts/backfill_memory_etl.py
   ```

2. **Verify Neo4j:**
   ```bash
   # Should show 350+ Memory nodes
   systemctl --user status josoor-memory-etl.timer
   ```

3. **Install timer:**
   ```bash
   /home/mosab/projects/chatmodule/backend/systemd/install_etl_timer.sh
   ```

4. **Test recall:**
   ```bash
   # Once timer is active, test recall_memory with a user_id
   curl -X POST http://localhost:8201/mcp/tool/call \
     -H "Content-Type: application/json" \
     -d '{"name":"recall_memory","arguments":{"scope":"personal","query_summary":"transformation projects","user_id":"61"}}'
   ```

---

*Documentation created: 2025-12-15*
