# Memory Architecture: Design Specification (Phase 2–3)

**Document Status:** Design Specification | Awaiting Implementation | Links to Main Roadmap

---

## Executive Summary

JOSOOR's memory system has 4 conceptual banks (personal/departmental/ministry/secrets) but is missing two critical components:

1. **Conversation Compression** — Summarizing long conversations to keep context window small
2. **Local Browser Temp Memory** — Daily chunking to enable offline recall + sync

This doc specifies the design, mechanics, and implementation strategy for both.

---

## Current State (Phase 1)

### ✅ Exists
- **4 Memory Scopes** (stored in Neo4j): personal, departmental, ministry, secrets
- **MCP Service** (`mcp_service.py`, `mcp_service_maestro.py`) — scope enforcement
- **Vector Embeddings** via OpenAI (text-embedding-3-small)
- **Semantic Search** — find memories by query + embeddings

### ❌ Missing
- **Conversation Compression** — No way to summarize long conversations
- **Local Browser Temp Memory** — No daily chunking; no client-side persistence
- **Daily Chunking** — No mechanism to split conversations by day/window
- **Cross-Session Memory** — Previous session's insights not available to next session

### Impact
- **Large conversations** → Groq gets oversized payload → 400 errors
- **Session isolation** → Each conversation is a silo (no learning across sessions)
- **Offline capability** → Can't recall previous chats without internet
- **Daily insights** — No "what did we learn today?" summary mechanism

---

## Component 1: Conversation Compression

### Design Goal
Reduce history size by 70–90% while preserving intent, key decisions, and context.

### Trigger Strategy

**Option A: Message-Based Trigger (Recommended for MVP)**
```
if len(history) >= 5:
    summarize_older_messages(history[:-3])  # Keep last 3 messages; compress 4+
    result: history = [compressed_summary] + last_3_messages
```
**Pros:** Simple, predictable, no async needed.  
**Cons:** Summaries might drop nuance.

**Option B: Token-Based Trigger**
```
if token_count(history) > 3000:
    compress_from_oldest_until(token_count <= 1500)
```
**Pros:** Precise; adapts to message length.  
**Cons:** More complex; requires tokenizer.

**Option C: Time-Based Trigger (Daily)**
```
if today() != last_compression_date:
    summarize_all_messages_from_yesterday()
    result: history = [yesterday_summary, today_messages]
```
**Pros:** Clean boundaries; good for "daily standup" use case.  
**Cons:** Doesn't help mid-session if messages pile up.

**Recommendation for MVP:** Use **Option A** (message-based, >= 5 messages). Revisit to Option B or C after evaluation in Phase 2.

### Compression Format

```python
class CompressedConversation(BaseModel):
    original_message_count: int          # e.g., 10
    compressed_message_count: int        # e.g., 1 (the summary)
    compression_ratio: float             # e.g., 0.9 (90% reduction)
    timespan: str                        # e.g., "10:00–14:30"
    summary: str                         # Key insight: "User asked X, we discovered Y, next step is Z"
    intent: str                          # Primary user goal
    key_facts: List[str]                 # 2–3 bullet points
    decisions: List[str]                 # Key decisions made
    missing_data: List[str]              # Data gaps identified
    timestamp: str                       # When compression happened
    model_used: str                      # Which LLM did compression
```

### Compression Execution Flow

```
1. Check if compression needed: if len(history) >= 5?
2. Identify compression window: last 5–10 messages (or all before today)
3. Build compression prompt:
   - List all messages in window
   - Ask: "Summarize the key intent, discoveries, decisions, next steps"
   - Request JSON output (CompressedConversation schema)
4. Call LLM with compression prompt
5. Validate JSON response
6. Store compressed result in Neo4j (scope=compressed_session)
7. Return new history: [compressed_summary_json] + last_3_messages
```

### Storage Strategy

**Option A: In-Memory Cache**
- Store compressed history in Python dict (Orchestrator state).
- Lose compression on process restart.
- **Pro:** Simple. **Con:** Not persistent.

**Option B: Supabase Table**
- Table: `conversation_compressions(id, conversation_id, compressed_data, timestamp)`
- Query: `SELECT compressed_data FROM conversation_compressions WHERE conversation_id = X ORDER BY timestamp DESC LIMIT 1`
- **Pro:** Persistent, queryable. **Con:** Extra DB call per LLM invocation.

**Option C: Neo4j Memory Bank**
- Store in `compressed_session` scope (special tier; not personal/departmental/ministry/secrets)
- Link: `(Conversation)-[:HAS_COMPRESSION]->(CompressedConversation)`
- **Pro:** Integrated with memory system. **Con:** Neo4j lookup on every request.

**Recommendation:** Start with **Option A** (in-memory) for Phase 2 MVP; migrate to **Option B** (Supabase) in Phase 2.5 if persistence needed.

### Implementation Sketch

```python
# File: /backend/app/services/conversation_compressor.py (NEW)

class ConversationCompressor:
    def __init__(self, model: str = "openai/gpt-oss-20b"):
        self.model = model
        self.compression_threshold = 5  # Compress if >= 5 messages
        self.keep_recent = 3            # Always keep last 3 messages
    
    def should_compress(self, history: List[Dict]) -> bool:
        return len(history) >= self.compression_threshold
    
    def compress_history(self, history: List[Dict]) -> Tuple[str, List[Dict]]:
        """Compress older messages; keep recent."""
        
        if not self.should_compress(history):
            return None, history
        
        # Split: messages to compress vs. keep recent
        to_compress = history[:-self.keep_recent]
        to_keep = history[-self.keep_recent:]
        
        # Build compression prompt
        prompt = self._build_compression_prompt(to_compress)
        
        # Call LLM (use same model as main orchestrator)
        try:
            compressed_summary = self._call_llm_for_compression(prompt)
            
            # Validate JSON
            compressed_data = json.loads(compressed_summary)
            
            # Return: compressed summary message + recent messages
            summary_message = {
                "role": "system",
                "content": f"COMPRESSED CONTEXT: {compressed_data['summary']}. Intent: {compressed_data['intent']}. Key facts: {', '.join(compressed_data['key_facts'])}"
            }
            
            new_history = [summary_message] + to_keep
            return compressed_data, new_history
        
        except Exception as e:
            print(f"⚠️  Compression failed: {e}; returning original history")
            return None, history
    
    def _build_compression_prompt(self, messages: List[Dict]) -> str:
        """Build LLM prompt for compression."""
        
        msg_text = "\n".join([
            f"[{m['role'].upper()}]: {m['content'][:200]}..."  # Truncate long messages
            for m in messages
        ])
        
        return f"""Summarize this conversation segment into a JSON object with:
- summary (1–2 sentences of key insight)
- intent (main goal the user is trying to achieve)
- key_facts (list of 2–3 important discoveries)
- decisions (list of key decisions made)
- missing_data (data gaps that were identified)

Messages:
{msg_text}

Respond ONLY with valid JSON, no markdown."""
    
    def _call_llm_for_compression(self, prompt: str) -> str:
        """Call LLM to compress."""
        # Implementation: call Groq with temperature=0 for deterministic compression
        pass
```

---

## Component 2: Local Browser Temp Memory

### Design Goal
Enable offline conversation recall; allow users to "chunk" conversations by day; sync with server.

### Storage Strategy

**Option A: localStorage (Simple, Persistent)**
```javascript
// Key: josoor_daily_chunk_{date}_{conversation_id}
// Value: JSON array of messages for that day
localStorage.setItem(
  'josoor_daily_chunk_2025-12-15_conv_123',
  JSON.stringify({
    date: '2025-12-15',
    conversation_id: 123,
    messages: [...],
    compressed_summary: "...",  // Optional; from compression service
    timestamp: '2025-12-15T23:59:59Z'
  })
);
```
**Pros:** Automatic persistence (survives refresh), 5–10 MB quota per origin.  
**Cons:** Hard quota limit; not encrypted; visible in DevTools.

**Option B: IndexedDB (More Storage, Async)**
```javascript
// Database: 'josoor_memory'
// Store: 'daily_chunks'
// Key: `${date}_${conversation_id}`
const chunk = {
  date: '2025-12-15',
  conversation_id: 123,
  messages: [...],
  compressed_summary: "...",
  timestamp: '2025-12-15T23:59:59Z'
};
db.add('daily_chunks', chunk);
```
**Pros:** Larger quota (50+ MB), async API, structured queries.  
**Cons:** More complex; async complexity in React.

**Option C: Service Worker Cache (Offline-First)**
```javascript
// Cache API for offline HTTP responses
cache.addAll([
  '/api/v1/chat/conversations/123/messages?date=2025-12-15',
  // ...
]);
```
**Pros:** Works offline; can sync in background.  
**Cons:** Requires Service Worker; overkill for MVP.

**Recommendation:** Use **Option A (localStorage)** for Phase 2 MVP. Migrate to **Option B (IndexedDB)** if quota exceeded.

### Daily Chunking Mechanics

```
1. User opens chat
   ├─ Load today's chunk from localStorage (or IndexedDB)
   │  Key: josoor_daily_chunk_${today}_${conversation_id}
   ├─ If exists: restore last 3 messages + set as "session context"
   └─ If not exists: create new chunk

2. User sends/receives messages
   ├─ Append to current session chunk (in-memory)
   └─ Auto-save to localStorage every N messages (e.g., N=3) or on blur

3. Day boundary (midnight)
   ├─ Detect: today() changed since last message
   ├─ Action: Archive today's chunk → localStorage (key includes date)
   ├─ Action: Start new chunk for tomorrow
   └─ Action: (Optional) Send archive to server for syncing

4. User wants historical recall
   ├─ Show "Daily Chunks" sidebar: list all chunks (last 7 days)
   ├─ Click chunk: load messages from localStorage + display context
   └─ "Deep Dive" button: send chunk content to AI for analysis ("What did we learn that day?")

5. Server sync (optional, Phase 2.5+)
   ├─ On logout: POST all daily chunks to /api/v1/memory/daily-chunks
   ├─ On login (other device): GET /api/v1/memory/daily-chunks to hydrate
   └─ Conflict resolution: server wins (or user chooses)
```

### Data Model

```python
# Stored in localStorage
class DailyChunk(BaseModel):
    date: str                           # ISO date: "2025-12-15"
    conversation_id: int                # Which conversation
    chunk_id: str                       # Unique ID for chunk
    messages: List[Dict]                # All messages sent/received that day
    compressed_summary: Optional[str]   # Summary of day (optional)
    metadata: Dict = {
        'started_at': "...",
        'ended_at': "...",
        'message_count': 15,
        'sentiment': 'positive',        # Optional ML enrichment
        'topics': ['transformation', 'risk']  # Optional topic extraction
    }
    sync_status: str = "local"          # "local" | "syncing" | "synced" | "error"
    created_at: str                     # Timestamp
    updated_at: str                     # Timestamp
```

### Implementation Sketch (Frontend)

```typescript
// File: /frontend/src/lib/services/dailyChunkService.ts (NEW)

export interface DailyChunk {
  date: string;
  conversation_id: number;
  chunk_id: string;
  messages: Message[];
  compressed_summary?: string;
  metadata: {
    started_at: string;
    ended_at: string;
    message_count: number;
  };
  sync_status: 'local' | 'syncing' | 'synced' | 'error';
  created_at: string;
  updated_at: string;
}

export class DailyChunkService {
  private storagePrefix = 'josoor_daily_chunk_';
  private autoSaveInterval = 3;  // Save every 3 messages

  getTodayKey(conversationId: number): string {
    const today = new Date().toISOString().split('T')[0];
    return `${this.storagePrefix}${today}_${conversationId}`;
  }

  loadTodayChunk(conversationId: number): DailyChunk | null {
    const key = this.getTodayKey(conversationId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  saveTodayChunk(conversationId: number, chunk: DailyChunk): void {
    const key = this.getTodayKey(conversationId);
    localStorage.setItem(key, JSON.stringify(chunk));
  }

  addMessageToChunk(conversationId: number, message: Message): void {
    let chunk = this.loadTodayChunk(conversationId);
    
    if (!chunk) {
      chunk = {
        date: new Date().toISOString().split('T')[0],
        conversation_id: conversationId,
        chunk_id: `${conversationId}_${Date.now()}`,
        messages: [],
        metadata: { started_at: new Date().toISOString(), ended_at: '', message_count: 0 },
        sync_status: 'local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    chunk.messages.push(message);
    chunk.metadata.message_count = chunk.messages.length;
    chunk.metadata.ended_at = new Date().toISOString();
    chunk.updated_at = new Date().toISOString();
    
    if (chunk.messages.length % this.autoSaveInterval === 0) {
      this.saveTodayChunk(conversationId, chunk);
    }
  }

  getAllChunksForWeek(conversationId: number): DailyChunk[] {
    const chunks: DailyChunk[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${this.storagePrefix}${dateStr}_${conversationId}`;
      
      const stored = localStorage.getItem(key);
      if (stored) {
        chunks.push(JSON.parse(stored));
      }
    }
    
    return chunks;
  }

  async syncChunksToServer(conversationId: number): Promise<void> {
    const chunks = this.getAllChunksForWeek(conversationId);
    
    for (const chunk of chunks) {
      if (chunk.sync_status === 'local' || chunk.sync_status === 'error') {
        try {
          chunk.sync_status = 'syncing';
          this.saveTodayChunk(conversationId, chunk);
          
          // POST to backend
          const response = await fetch('/api/v1/memory/daily-chunks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk)
          });
          
          if (response.ok) {
            chunk.sync_status = 'synced';
            this.saveTodayChunk(conversationId, chunk);
          } else {
            chunk.sync_status = 'error';
            this.saveTodayChunk(conversationId, chunk);
          }
        } catch (e) {
          chunk.sync_status = 'error';
          this.saveTodayChunk(conversationId, chunk);
          console.error('Sync failed:', e);
        }
      }
    }
  }
}
```

### Integration with ChatAppPage

```typescript
// In ChatAppPage.tsx

const dailyChunkService = new DailyChunkService();

// On mount: restore today's chunk
useEffect(() => {
  if (activeConversationId) {
    const todayChunk = dailyChunkService.loadTodayChunk(activeConversationId);
    if (todayChunk && todayChunk.messages.length > 0) {
      setMessages(todayChunk.messages);
      console.log(`✅ Restored ${todayChunk.messages.length} messages from today's chunk`);
    }
  }
}, [activeConversationId]);

// On every message: auto-save to daily chunk
const handleSendMessage = async (text: string) => {
  // ... existing send logic ...
  
  // Auto-save to daily chunk
  if (activeConversationId) {
    dailyChunkService.addMessageToChunk(activeConversationId, {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });
  }
};

// On logout: sync chunks to server
useEffect(() => {
  if (!user) {
    // User logged out; sync all chunks
    if (activeConversationId) {
      dailyChunkService.syncChunksToServer(activeConversationId);
    }
  }
}, [user]);

// Show daily chunks sidebar
const dailyChunks = dailyChunkService.getAllChunksForWeek(activeConversationId);
return (
  <div>
    {/* Existing chat UI */}
    
    {/* Daily Chunks Sidebar */}
    <aside className="daily-chunks">
      <h3>Daily Chunks (Last 7 Days)</h3>
      {dailyChunks.map((chunk) => (
        <div key={chunk.chunk_id} className="chunk-item">
          <div className="chunk-date">{chunk.date}</div>
          <div className="chunk-count">{chunk.metadata.message_count} messages</div>
          <button onClick={() => loadChunk(chunk)}>View</button>
        </div>
      ))}
    </aside>
  </div>
);
```

---

## Integration Timeline

### Phase 2 (Next 3 days)
- [ ] Conversation Compression (MVP, Option A: message-based + in-memory storage)
- [ ] Local Browser Temp Memory (MVP, Option A: localStorage daily chunks)
- [ ] Auto-save on every 3 messages
- [ ] Restore on page reload

### Phase 2.5 (Days 4–7)
- [ ] Migrate compression storage to Supabase (persistent)
- [ ] Migrate daily chunks to IndexedDB (quota increase)
- [ ] Add server sync endpoint: `/api/v1/memory/daily-chunks`

### Phase 3 (Days 8–14)
- [ ] Full nightly ETL: process all daily chunks into memory banks
- [ ] Add "What did we learn this week?" Deep Dive panel
- [ ] Cross-conversation memory recall (e.g., "Similar to yesterday's topic X")

### Phase 4+ (Enterprise)
- [ ] ML enrichment: sentiment, topics, key entities extracted from chunks
- [ ] Advanced retrieval: search across all chunks (Elasticsearch or similar)
- [ ] Privacy: encrypt chunks client-side (optional)

---

## Success Criteria

### Phase 2
- [ ] Conversation history < 4000 tokens before Groq call (no more 400 errors)
- [ ] Page refresh restores last 3 messages + compressed context
- [ ] localStorage shows ~7 days of daily chunks
- [ ] Zero data loss (all messages persisted locally)

### Phase 2.5
- [ ] Daily chunks replicate to Supabase on logout/logout
- [ ] Multi-device sync: login on device B → restore device A's chunk
- [ ] Compression ratio > 80% (e.g., 10 messages → 2 KB summary)

### Phase 3
- [ ] Nightly ETL processes all chunks; stores in memory banks
- [ ] Cross-conversation recall works: "Similar question from 2 days ago..."
- [ ] "Week Review" Deep Dive provides actionable insights

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| localStorage quota exceeded (>5 MB) | Migrate to IndexedDB (Phase 2.5); archival strategy (delete >30d chunks) |
| Compression loses critical context | Use Option B (token-based); validate on small test set |
| Daily chunks don't sync; user loses offline edits | Show sync status badge; manual sync button in UI |
| Cross-device sync conflicts (same conv on 2 devices) | Server-wins strategy; add merge logic Phase 3 |
| Privacy: localStorage is visible | Implement client-side encryption Phase 4 |

---

## Questions for Phase 2 Implementation

1. **Compression trigger:** Should we use Option A (message-based >= 5) or Option C (daily)? Or hybrid?
2. **Storage:** Start with Option A (in-memory), or go straight to Option B (Supabase)?
3. **Daily chunks:** Should they auto-archive at midnight, or when user navigates to next day?
4. **Server sync:** MVP without sync (Phase 2.5), or include basic endpoint in Phase 2?

---

**This spec is frozen for Phase 1. Implementation begins Phase 2.**
