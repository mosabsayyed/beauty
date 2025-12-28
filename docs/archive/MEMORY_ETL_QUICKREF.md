# Memory ETL - Quick Reference

## System Status Check

```bash
# Check if cron job is installed
crontab -l | grep memory_etl

# Count Memory nodes
cd /home/mosab/projects/chatmodule/backend && .venv/bin/python -c "
from neo4j import GraphDatabase
from dotenv import dotenv_values
env = dotenv_values('.env')
driver = GraphDatabase.driver(env['NEO4J_URI'], auth=(env.get('NEO4J_USER','neo4j'), env['NEO4J_PASSWORD']))
with driver.session(database=env.get('NEO4J_DATABASE','memory_semantic_index')) as session:
    res = session.run('MATCH (m:Memory) WHERE m.id IS NOT NULL RETURN COUNT(m) AS total')
    print(f'Total Memory nodes: {res.single()[\"total\"]}')
driver.close()
"
```

## View Logs

```bash
# Nightly ETL logs
tail -50 /home/mosab/projects/chatmodule/backend/logs/memory_etl_cron.log

# Watch in real-time
tail -f /home/mosab/projects/chatmodule/backend/logs/memory_etl_cron.log
```

## Manual ETL Runs

```bash
# Backfill (safe - skips existing)
cd /home/mosab/projects/chatmodule/backend
.venv/bin/python scripts/backfill_memory_etl.py

# Nightly (manual trigger)
.venv/bin/python scripts/nightly_memory_etl.py
```

## Test Semantic Recall

```bash
cd /home/mosab/projects/chatmodule/backend && .venv/bin/python - <<'PY'
import asyncio, sys, json
sys.path.insert(0, '/home/mosab/projects/chatmodule/backend')
from app.services.mcp_service import recall_memory

async def test():
    results_json = await recall_memory(
        scope="personal",
        query_summary="projects and reports",
        limit=3,
        user_id="61"
    )
    results = json.loads(results_json)
    print(f"Found {len(results)} results:")
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['id']} | User: {r['user_id']} | Score: {r['score']:.3f}")

asyncio.run(test())
PY
```

## Cron Schedule

```
0 2 * * * cd /home/mosab/projects/chatmodule/backend && .venv/bin/python scripts/nightly_memory_etl.py >> logs/memory_etl_cron.log 2>&1
```

Runs daily at **2:00 AM UTC**.

## Files

| File | Purpose |
|------|---------|
| `backend/scripts/backfill_memory_etl.py` | One-time historical ingestion |
| `backend/scripts/nightly_memory_etl.py` | Daily incremental updates |
| `backend/scripts/install_etl_cron.sh` | Cron job installer |
| `MEMORY_ETL_SETUP.md` | Setup guide |
| `MEMORY_ETL_COMPLETE.md` | Implementation summary |
| `MEMORY_ETL_VALIDATED.md` | Validation results |

## Current Status

✅ **Production Ready**
- 78 Memory nodes indexed
- User isolation validated
- Semantic search working
- Nightly automation configured

Next monitoring checkpoint: **Tomorrow at 2 AM UTC** (first nightly run)
