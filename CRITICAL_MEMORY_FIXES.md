# CRITICAL MEMORY FIXES - Implementation Plan

## Current Status

### ✅ What Works
1. **Neo4j Memory Schema**: Setup complete
   - Memory nodes exist (count: 3)
   - Vector index `memory_semantic_index` created (1536 dims, cosine)
   - Indexes: scope, confidence, created_at
   - Scopes: personal, departmental, global

2. **recall_memory Tool**: Functional
   - Semantic search via Neo4j vector index
   - Fallback logic (departmental → global)
   - Returns `[]` on miss (safe, won't crash)
   - Access control: csuite blocked for Noor

3. **Nightly Batch ETL**: Exists
   - Script: `scripts/nightly_memory_etl.py`
   - Processes conversations → Memory nodes
   - Embedding generation (OpenAI text-embedding-3-small)

### ⚠️ What's Missing

#### 1. CRITICAL: Temp Personal Memory (Intra-Day)
**Problem**: User asks "remember what I said earlier" within same day → No memory yet (batch runs nightly)

**Solution Needed**: 
- Store current conversation in browser localStorage
- Pass as "temp_memory" context to orchestrator
- Format: Same as Memory nodes but ephemeral
- Cleared after nightly batch runs

#### 2. Memory Initialization Check
**Problem**: orchestrator_agentic.py calls recall_memory but doesn't verify Neo4j connection first

**Solution**: Add connection check before execution

#### 3. Empty Memory Handling
**Problem**: recall_memory returns `[]` but orchestrator may not handle gracefully

**Solution**: Verify orchestrator handles empty memory responses

## Implementation

### Fix 1: Add Memory Connection Check

**File**: `backend/app/services/orchestrator_agentic.py`

```python
async def execute_query(self, user_query: str, session_id: str, history=None):
    # ... existing code ...
    
    # CRITICAL: Verify Neo4j memory connection before execution
    try:
        from app.db.neo4j_client import neo4j_client
        if not neo4j_client.is_connected():
            if not neo4j_client.connect():
                logger.warning(f"[Noor][{session_id}] Neo4j memory not available - proceeding without memory")
                # Orchestrator can still work, just without memory context
    except Exception as e:
        logger.error(f"[Noor][{session_id}] Memory check failed: {e}")
    
    # Continue with normal execution...
```

### Fix 2: Implement Temp Personal Memory

#### Backend Changes

**File**: `backend/app/api/routes/chat.py`

```python
class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "transformation_analyst"
    temp_memory: Optional[List[Dict[str, str]]] = None  # NEW: Intra-day memory

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    # ... existing code ...
    
    # Build temp memory context for orchestrator
    temp_memory_context = None
    if request.temp_memory and len(request.temp_memory) > 0:
        # Format as pseudo-Memory nodes
        temp_memory_context = {
            "scope": "personal",
            "type": "temp",
            "memories": request.temp_memory
        }
    
    # Pass to orchestrator
    orchestrator = get_orchestrator_instance(persona_name=request.persona_name)
    
    if orchestrator_type in ["NoorAgenticOrchestrator", "MaestroOrchestrator"]:
        llm_response = await orchestrator.execute_query(
            user_query=request.query,
            session_id=session_id,
            history=conversation_context,
            temp_memory=temp_memory_context  # NEW
        )
```

**File**: `backend/app/services/orchestrator_agentic.py`

```python
async def execute_query(
    self,
    user_query: str,
    session_id: str,
    history: Optional[List[Dict[str, str]]] = None,
    temp_memory: Optional[Dict[str, Any]] = None  # NEW
) -> Dict[str, Any]:
    
    # ... existing code ...
    
    # Inject temp memory into cognitive_cont if available
    cognitive_cont = self._inject_date(COGNITIVE_CONT_BUNDLE)
    
    if temp_memory:
        # Add temp memory context to system message
        temp_memory_text = self._format_temp_memory(temp_memory)
        cognitive_cont += f"\n\n<TEMP_MEMORY>\n{temp_memory_text}\n</TEMP_MEMORY>"
    
    # ... rest of execution ...

def _format_temp_memory(self, temp_memory: Dict[str, Any]) -> str:
    """Format temp memory for injection into prompt"""
    memories = temp_memory.get("memories", [])
    if not memories:
        return ""
    
    formatted = ["**Today's Conversation Context (Temporary Memory)**:"]
    for mem in memories:
        role = mem.get("role", "user")
        content = mem.get("content", "")
        formatted.append(f"- {role.upper()}: {content}")
    
    formatted.append("\n*Note: This memory is temporary and will be persisted tonight via batch job.*")
    return "\n".join(formatted)
```

#### Frontend Changes

**File**: `frontend/src/lib/services/chatService.ts`

```typescript
// Add to ChatRequest interface
export interface ChatRequest {
  query: string;
  persona?: string;
  conversation_id?: number;
  temp_memory?: Array<{role: string; content: string}>;  // NEW
}

// In sendMessage method:
async sendMessage(request: ChatRequest): Promise<ChatResponse> {
  // If no temp_memory provided, build from localStorage
  if (!request.temp_memory) {
    request.temp_memory = this.getTempMemory();
  }
  
  // ... rest of existing code ...
}

private getTempMemory(): Array<{role: string; content: string}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `josoor_temp_memory_${today}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load temp memory:', e);
  }
  return [];
}

// After each message, save to temp memory
public saveTempMemory(role: string, content: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `josoor_temp_memory_${today}`;
    
    let memories = this.getTempMemory();
    memories.push({ role, content, timestamp: new Date().toISOString() });
    
    // Keep only last 20 messages (prevent localStorage overflow)
    if (memories.length > 20) {
      memories = memories.slice(-20);
    }
    
    localStorage.setItem(key, JSON.stringify(memories));
  } catch (e) {
    console.error('Failed to save temp memory:', e);
  }
}
```

**File**: `frontend/src/pages/ChatAppPage.tsx`

```typescript
const handleSendMessage = async (query: string, ...) => {
  try {
    // Save user message to temp memory
    chatService.saveTempMemory('user', query);
    
    // Send to backend (will include temp_memory automatically)
    const response = await chatService.sendMessage({
      query,
      conversation_id: currentConversationId,
      persona: selectedPersona
    });
    
    // Save assistant response to temp memory
    if (response.llm_payload?.answer) {
      chatService.saveTempMemory('assistant', response.llm_payload.answer);
    }
    
    // ... rest of existing code ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### Fix 3: Memory Cleanup (Nightly)

**File**: `backend/scripts/cleanup_temp_memory.py` (NEW)

```python
#!/usr/bin/env python3
"""
Cleanup script: Signals frontend to clear temp memory after batch ETL completes
Creates a flag file that frontend checks
"""
import os
from datetime import datetime

FLAG_FILE = "/home/mosab/projects/chatmodule/backend/logs/memory_etl_complete.flag"

def create_completion_flag():
    """Create flag file with completion timestamp"""
    with open(FLAG_FILE, 'w') as f:
        f.write(datetime.now().isoformat())
    print(f"Created memory ETL completion flag: {FLAG_FILE}")

if __name__ == "__main__":
    create_completion_flag()
```

**Frontend check** (runs on app startup):

```typescript
// frontend/src/App.tsx
useEffect(() => {
  // Check if nightly batch has run
  checkAndClearOldTempMemory();
}, []);

function checkAndClearOldTempMemory() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `josoor_temp_memory_${yesterday.toISOString().split('T')[0]}`;
    
    // Clear yesterday's temp memory (batch has processed it)
    localStorage.removeItem(yesterdayKey);
  } catch (e) {
    console.error('Failed to clear old temp memory:', e);
  }
}
```

### Fix 4: Update Nightly Batch ETL

**File**: `backend/scripts/nightly_memory_etl.py`

Add at end of script:
```python
# After successful ETL completion
if __name__ == "__main__":
    etl = MemoryETL(ETLConfig())
    results = await etl.run()
    
    # Signal completion to frontend
    import subprocess
    subprocess.run(["python3", "cleanup_temp_memory.py"])
```

## Testing Plan

### 1. Test Memory Connection Check
```bash
# Stop Neo4j
docker stop neo4j

# Try to use Noor
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "What are our projects?"}'

# Should work but log warning about missing memory
# Should NOT crash
```

### 2. Test Temp Memory
```bash
# In browser console:
localStorage.setItem('josoor_temp_memory_2025-12-06', JSON.stringify([
  {role: 'user', content: 'Remember: I prefer visual reports'},
  {role: 'assistant', content: 'Understood, I will provide visual reports'}
]));

# Send query that refers to earlier conversation
# Noor should recall the temp memory context
```

### 3. Test Empty Memory Handling
```bash
# Fresh Neo4j with no Memory nodes
# Ask: "What did we discuss about projects?"
# Should gracefully say "I don't have any previous context"
```

## Deployment Steps

1. **Immediate (Memory Check)**:
   - Add connection check to orchestrator_agentic.py
   - Add connection check to orchestrator_maestro.py
   - Test with Neo4j stopped → should not crash

2. **Short-term (Temp Memory - Backend)**:
   - Add `temp_memory` parameter to ChatRequest
   - Update orchestrator execute_query signatures
   - Add _format_temp_memory method
   - Test with manual temp_memory payload

3. **Short-term (Temp Memory - Frontend)**:
   - Add temp_memory to chatService
   - Implement getTempMemory/saveTempMemory
   - Update ChatAppPage to save messages
   - Test localStorage persistence

4. **Long-term (Cleanup)**:
   - Add cleanup script to nightly_memory_etl.py
   - Schedule via cron
   - Test cleanup after batch runs

## Priority

**P0 (DO NOW)**:
- [x] Verify Memory nodes exist (DONE: 3 nodes found)
- [x] Verify vector index exists (DONE: memory_semantic_index exists)
- [ ] Add memory connection check to orchestrators

**P1 (THIS WEEK)**:
- [ ] Implement temp memory backend
- [ ] Implement temp memory frontend
- [ ] Test intra-day memory recall

**P2 (LATER)**:
- [ ] Add cleanup script
- [ ] Schedule nightly batch
- [ ] Monitor memory growth

## Summary

**Auth Flow**: NO CHANGE NEEDED
- Roles assigned manually in database
- JWT already includes role
- Frontend reads role from JWT payload (not localStorage)

**Memory System**: MOSTLY WORKS, needs temp memory
- Neo4j schema ✅
- Vector index ✅
- recall_memory tool ✅
- Nightly batch ✅
- **Temp memory** ❌ (blocks intra-day recall)

**Critical Fix**: Add temp memory to bridge gap between conversation and nightly batch.
