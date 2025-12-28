# Memory Architecture Gap Analysis & Implementation Roadmap

**Purpose:** Document the critical missing components that must be built in Phases 2–3 to complete JOSOOR's memory system.

**Status:** Design Locked | Implementation Roadmap Ready | Phase 2 Ready

---

## Executive Summary: The Gap

### What We Have (Phase 1)
- ✅ 4 Memory Scopes defined (personal, departmental, ministry, secrets)
- ✅ MCP Router with scope enforcement (Noor vs Maestro)
- ✅ Vector embeddings via OpenAI
- ✅ Semantic search capability
- ✅ Conversations stored in Supabase

### What We're Missing (Phase 2–3)
- ❌ **Conversation Compression** — No way to reduce history size
- ❌ **Local Browser Temp Memory** — No daily chunking or client-side persistence
- ❌ **Memory ETL** — No automatic processing of conversations into memory banks
- ❌ **Cross-Session Memory** — Insights from yesterday unavailable today

### Business Impact
- **Current:** Long conversations → Groq gets 400 errors (oversized payload)
- **Current:** Each chat is isolated (no learning across sessions)
- **Current:** No "What did we learn today?" capability

### What This Blocks
- ❌ Session-to-session continuity
- ❌ Institutional learning from conversations
- ❌ Offline capability (can't recall chats without internet)
- ❌ Daily summary generation ("This week's top risks...")

---

## The Three Missing Components

### 1. Conversation Compression (Phase 2)

**What It Does:**
- Summarizes long conversation history (5+ messages) into 1–2 key sentences
- Keeps recent messages intact (last 3)
- Reduces payload size by 70–90%

**Why It's Critical:**
```
Current Flow (Broken):
  10 messages in history
  → Total tokens: 5,000+
  → Groq rejects: "payload > 4096 tokens"
  → User sees: Error / no response

With Compression (Fixed):
  10 messages → [compressed_summary] + last_3_messages
  → Total tokens: 1,200
  → Groq accepts ✅
  → User sees: Response
```

**Design Decision (Phase 2):**
- **Option A (Chosen for MVP):** Message-based trigger (>= 5 messages)
  - Compress when history reaches 5+ messages
  - Keep last 3 always (recent context)
  - Call LLM to summarize older ones: "Intent? Key discoveries? Decisions?"
  - Store in-memory (Python dict in Orchestrator)

- **Option B (Phase 2.5+):** Token-based trigger
  - More precise; adapts to message length
  - Trigger when token_count > 3000
  - More complex; use after MVP validation

**Storage (Phase 2 vs Phase 2.5):**
- **Phase 2:** In-memory (fast, simple, lost on process restart)
- **Phase 2.5:** Supabase `conversation_compressions` table (persistent)

**Example Output:**
```json
{
  "original_message_count": 10,
  "compressed_message_count": 1,
  "compression_ratio": 0.9,
  "summary": "User asked about sector objectives → risks. We found 3 high-risk projects tied to Q1 initiative.",
  "intent": "Identify transformation risks by sector",
  "key_facts": ["3 projects at risk", "Q1 initiative is bottleneck", "Risk escalation needed"],
  "decisions": ["Recommended risk workshop", "Escalate to PMO"],
  "missing_data": ["Q2–Q4 projections not available"]
}
```

---

### 2. Local Browser Temp Memory (Phase 2)

**What It Does:**
- Saves every message to browser (localStorage or IndexedDB)
- Organizes by day (daily chunks)
- Syncs to server on logout
- Restores on page reload

**Why It's Critical:**
```
Current Flow (Broken):
  User has chat
  → Closes browser / refresh
  → Loses conversation history
  → Must start over

With Browser Memory (Fixed):
  User has chat
  → Auto-saves to localStorage every 3 messages
  → Closes browser
  → Reopens JOSOOR
  → Last 3 messages + compressed context auto-restored
  → Conversation continues seamlessly
```

**Design Decision (Phase 2):**
- **Storage:** localStorage (Option A, MVP)
  - Simple, automatic persistence
  - 5–10 MB quota per origin (sufficient for MVP)
  - Survives page refresh, browser restart
  - Keys: `josoor_daily_chunk_{date}_{conversation_id}`
  
- **Phase 2.5:** Migrate to IndexedDB (Option B)
  - Larger quota (50+ MB)
  - Async API (cleaner with React)
  - More structured queries

**Daily Chunking Mechanics:**
```
User opens chat
  ├─ Load today's chunk from localStorage
  │  Key: "josoor_daily_chunk_2025-12-15_conv_123"
  └─ If exists: restore messages
  
User sends/receives messages
  ├─ Append to current chunk (in-memory)
  └─ Auto-save to localStorage every 3 messages (or on blur)
  
Day boundary (midnight)
  ├─ Detect: new date since last message
  ├─ Archive today's chunk → localStorage
  │  Key now locked: "josoor_daily_chunk_2025-12-15_conv_123" (immutable)
  └─ Create new chunk for tomorrow
      Key: "josoor_daily_chunk_2025-12-16_conv_123" (mutable)

User wants historical recall
  ├─ Show "Daily Chunks" sidebar: list all chunks (last 7 days)
  ├─ Click chunk: load messages from localStorage
  └─ "Deep Dive" button: send chunk to AI ("What happened that day?")
```

**Data Model (Stored in localStorage):**
```json
{
  "date": "2025-12-15",
  "conversation_id": 123,
  "chunk_id": "123_1734264000",
  "messages": [
    {"role": "user", "content": "...", "timestamp": "..."},
    {"role": "assistant", "content": "...", "timestamp": "..."}
  ],
  "compressed_summary": "...",
  "metadata": {
    "started_at": "2025-12-15T09:00:00Z",
    "ended_at": "2025-12-15T17:00:00Z",
    "message_count": 15,
    "sentiment": "positive",
    "topics": ["transformation", "risk"]
  },
  "sync_status": "local",
  "created_at": "2025-12-15T09:00:00Z",
  "updated_at": "2025-12-15T17:30:00Z"
}
```

**Frontend Integration:**
```typescript
// On mount: restore today's chunk
const todayChunk = dailyChunkService.loadTodayChunk(conversationId);
if (todayChunk) {
  setMessages(todayChunk.messages);
  console.log(`✅ Restored ${todayChunk.messages.length} messages`);
}

// On every message: auto-save
dailyChunkService.addMessageToChunk(conversationId, newMessage);

// On logout: sync to server
if (!user) {
  dailyChunkService.syncChunksToServer(conversationId);
}
```

---

### 3. Nightly Memory ETL (Phase 3)

**What It Does:**
- Runs every night (scheduled job)
- Processes all daily chunks from past 24 hours
- Extracts entities, summarizes, vectorizes
- Stores in 4 memory banks (personal/departmental/ministry/secrets)
- Makes yesterday's insights available today

**Why It's Critical:**
```
Current Flow (Broken):
  Day 1: Chat discovers "Q1 initiative is risky"
  → Stored in Supabase messages table
  → Day 2: New user logs in, asks same question
  → LLM doesn't know about yesterday's finding
  → Repeats analysis; no institutional memory

With Memory ETL (Fixed):
  Day 1: Chat discovers "Q1 initiative is risky"
  → Nightly job processes conversation
  → Extracts: entity=Q1_initiative, fact=risky, confidence=high
  → Stores in memory bank: departmental scope
  → Day 2: User asks "Q1 risks?"
  → recall_memory() MCP tool finds yesterday's finding
  → LLM incorporates: "We identified this yesterday..."
```

**Nightly ETL Flow:**
```
Midnight UTC (trigger)
  │
  ├─ Query Supabase: conversations updated in past 24h
  │
  ├─ For each conversation:
  │  ├─ Load all daily chunks for that conversation
  │  ├─ For each chunk:
  │  │  ├─ Compress if not already compressed
  │  │  ├─ Extract entities (e.g., "Q1 Initiative", "Risk Level")
  │  │  ├─ Generate 1–2 sentence summary
  │  │  ├─ Vectorize summary + entities
  │  │  └─ Store in Neo4j memory bank
  │  │     Scope: "departmental" (team-visible)
  │  │     Type: "daily_chunk_summary"
  │  │     TTL: 30 days
  │  │
  │  └─ Link to original conversation
  │     (Conversation)-[:HAS_MEMORY_ENTRY]->(DailyChunkMemory)
  │
  └─ Log completion
     "Processed 45 conversations, 120 daily chunks, 98 memory entries created"
```

**Memory Entry Format (Stored in Neo4j):**
```json
{
  "id": "mem_daily_chunk_2025_12_15_conv_123_001",
  "type": "daily_chunk_summary",
  "date": "2025-12-15",
  "conversation_id": 123,
  "user_id": "user_456",
  "scope": "departmental",  // who can see this
  "summary": "Sector objectives analysis identified Q1 initiative as highest risk; recommended escalation to PMO.",
  "entities": [
    {"type": "Project", "name": "Q1_Initiative", "confidence": 0.95},
    {"type": "Risk", "level": "High", "count": 3}
  ],
  "vector_embedding": [0.123, -0.456, ...],  // 1536 dims from OpenAI
  "created_at": "2025-12-16T00:15:00Z",
  "ttl_expiry": "2026-01-15T00:15:00Z"  // 30 days
}
```

**Implementation (Phase 3):**
```python
# File: /backend/scripts/nightly_memory_etl.py

class NightlyMemoryETL:
    def run(self):
        """Nightly job: process yesterday's conversations."""
        
        # 1. Find conversations updated in past 24 hours
        conversations = self.get_recent_conversations(hours=24)
        
        # 2. For each conversation, get all daily chunks
        for conv_id in conversations:
            chunks = self.get_daily_chunks(conv_id)
            
            # 3. Process each chunk
            for chunk in chunks:
                # Compress if needed
                compressed = self.compress_chunk(chunk)
                
                # Extract entities
                entities = self.extract_entities(compressed['summary'])
                
                # Generate summary
                summary = self.generate_summary(chunk['messages'])
                
                # Vectorize
                vector = embedding_service.generate_embedding(summary)
                
                # Store in memory bank
                self.store_memory_entry(
                    conversation_id=conv_id,
                    scope=self.determine_scope(conv_id),  # dept / personal / etc
                    summary=summary,
                    entities=entities,
                    vector=vector
                )
        
        return f"✅ Processed {len(conversations)} conversations"
```

**Triggers (Phase 3+):**
- Scheduled: Nightly at midnight UTC (k8s cronjob or APScheduler)
- Manual: Admin endpoint `/api/v1/admin/memory-etl-run` (for testing)
- Delayed: 1 hour after each user logout (batch small amounts)

---

## Phase 2 vs Phase 3 Breakdown

### Phase 2: User-Facing Memory (Days 1–3)
**Focus:** Local, real-time, session-level

| Component | What | Storage | Trigger |
|-----------|------|---------|---------|
| Compression | Reduce history 70–90% | In-memory (Phase 2) | On every Groq call if ≥ 5 messages |
| Browser chunks | Save every message locally | localStorage | Every 3 messages / on blur |
| Daily boundaries | Split by calendar date | localStorage key includes date | Detect midnight / new date |

**Outcome:** No more 400 errors; messages persist across reloads.

### Phase 3: Enterprise-Facing Memory (Days 4–7)
**Focus:** Persistent, searchable, institutional learning

| Component | What | Storage | Trigger |
|-----------|------|---------|---------|
| Nightly ETL | Process chunks into banks | Neo4j memory bank | Midnight UTC (cronjob) |
| Entity extraction | Auto-extract facts/entities | Neo4j + vector embeddings | As part of ETL |
| Cross-session recall | Find related memories | Semantic search (embeddings) | When user queries `recall_memory()` MCP tool |
| Week review | Generate "what we learned" | Neo4j aggregation | Optional admin endpoint |

**Outcome:** Previous insights available today; institutional memory grows.

---

## Integration Points (Don't Miss These)

### Phase 2 Integration
- **Backend:** `orchestrator_universal.py` calls `conversation_compressor.compress_history()` before Groq
- **Frontend:** `ChatAppPage.tsx` calls `dailyChunkService.addMessageToChunk()` after every message
- **Frontend:** On mount, restore today's chunk from localStorage
- **Frontend:** On logout, sync all chunks (call backend `/api/v1/memory/daily-chunks` POST)

### Phase 3 Integration
- **Backend:** Scheduled job reads daily chunks from Supabase
- **Backend:** Extract + vectorize + store in Neo4j (same graph as transformation ontology)
- **MCP Service:** `recall_memory()` tool queries Neo4j memory bank (now populated by ETL)
- **Frontend:** Optional "Daily Chunks" sidebar shows historical access

---

## Success Metrics

### Phase 2
- [ ] Average history tokens before Groq: < 1500 (from current 5000+)
- [ ] Compression ratio: > 80% (10 messages → < 2 KB)
- [ ] Zero message loss (all persisted locally)
- [ ] Page reload: messages restored in < 500ms
- [ ] localStorage usage: < 5 MB (well under quota)

### Phase 3
- [ ] Nightly ETL runtime: < 5 min for 100 conversations
- [ ] Memory entries created per day: > 50 (showing active learning)
- [ ] Cross-session recall latency: < 1s (embedding search)
- [ ] Baseline coverage: 90% of conversations have memory entries (next day)

---

## Questions to Answer (Before Implementation)

### Compression (Phase 2)
1. Should we compress automatically (always before Groq), or only when history ≥ 5 messages?
2. Should we keep the full original history, or discard compressed messages after summarizing?
3. For compression LLM call: use same model (20B) or always use 70B (higher quality)?
4. Store compression in-memory (fast) or in Supabase (persistent)?

### Browser Memory (Phase 2)
1. Auto-save frequency: every message, every 3 messages, or on blur?
2. Show localStorage usage to user (transparency)?
3. Add "sync now" button for manual sync, or wait for logout?
4. Encrypt chunks client-side (Phase 4 nice-to-have)?

### ETL (Phase 3)
1. Nightly at midnight UTC, or daily at server's local time?
2. Process all conversations (expensive) or only updated in past 24h?
3. Extract entities automatically (ML), or just use LLM summaries (simpler)?
4. TTL for memory entries: 30 days, 90 days, indefinite?

---

## Risk Mitigation

| Risk | Mitigation | Phase |
|------|-----------|-------|
| localStorage quota exceeded (>5 MB) | Archival: delete >30d chunks; migrate to IndexedDB | Phase 2.5 |
| Compression loses context | Baseline compression ratio validation; manual review of 10 samples | Phase 2 |
| Daily chunks don't sync; user loses data | Show sync status badge; manual "sync now" button; audit log | Phase 2.5 |
| Memory bank diverges from conversation truth | Audit trail: link memory entries back to original messages | Phase 3 |
| ETL job timeout (too many conversations) | Batch processing: split by user/date; increase timeout; parallel workers | Phase 3 |
| Privacy: localStorage visible in browser | Implement client-side encryption; clear on logout (Phase 4) | Phase 4 |

---

## Timeline (Locked)

| Phase | Duration | Focus | Acceptance Criteria |
|-------|----------|-------|-------------------|
| Phase 2 | Days 1–3 | Compression + Browser Memory | History < 1500 tokens; localStorage working; zero data loss |
| Phase 2.5 | Days 4–7 | Persistent Storage | Migrate to Supabase/IndexedDB; server sync working |
| Phase 3 | Days 8–14 | Nightly ETL + Observability | Memory bank populated; cross-session recall working |

---

## Final Checklist (Before Phase 2 Starts)

- [ ] Compression design locked (Option A: message-based, 5+ trigger)
- [ ] Browser memory design locked (Option A: localStorage, daily chunks)
- [ ] Storage location confirmed (Phase 2: in-memory + localStorage; Phase 2.5: Supabase + IndexedDB)
- [ ] ETL schedule locked (midnight UTC, batch mode, <5 min runtime target)
- [ ] Integration points mapped (orchestrator, chat page, MCP service)
- [ ] Questions answered (by product/architecture owner)
- [ ] Risk mitigations reviewed (blockers identified, solutions ready)
- [ ] Success metrics baseline established (current history size, compression potential)

---

**This gap analysis is frozen. Implementation begins Phase 2. No revisit until Phase 2 complete.**

---

**Created:** December 15, 2025  
**Status:** Design Locked | Execution Ready  
**Next Gate:** Phase 2 Execution (Post-Demo Success)  
**Owner:** Development Team
