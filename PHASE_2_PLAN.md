# Phase 2: Full Async Orchestrator Refactoring

## Overview
**Goal:** Make the Orchestrator fully async so background task processing doesn't block on network I/O.

**Why:** Phase 1 returns response immediately (BackgroundTasks), but the background task itself blocks on synchronous HTTP requests to LM Studio. Phase 2 removes that blocking so multiple concurrent chat requests can execute without resource starvation.

---

## Current State (Phase 1)
```
Backend gets request
  ↓
Returns immediately with conversation_id
  ↓
Queues background task (still synchronous, blocks on requests.post())
  ↓
Frontend polls for response
```

## Target State (Phase 2)
```
Backend gets request
  ↓
Returns immediately with conversation_id
  ↓
Queues background task (fully async, doesn't block on network I/O)
  ↓
Frontend polls for response
```

---

## File to Modify
**`backend/app/services/orchestrator_universal.py`**

### Change 1: Replace `requests` with `httpx`
**Lines:** Import section (currently has `import requests`)

```python
# REMOVE:
import requests

# ADD:
import httpx
```

### Change 2: Make `execute_query()` async
**Lines:** Constructor + main execute method signature

**Current:**
```python
def execute_query(self, user_query: str, session_id: str, history=None, user_id=None, model_override=None) -> Dict:
    # synchronous method
```

**Target:**
```python
async def execute_query(self, user_query: str, session_id: str, history=None, user_id=None, model_override=None) -> Dict:
    # async method - can await on HTTP calls
```

### Change 3: Make `_call_local_llm()` async
**Lines:** ~629-705 (the LM Studio call method)

**Current:**
```python
def _call_local_llm(self, messages, model_name):
    # ...
    resp = requests.post(
        "http://localhost:8000/v1/responses",  # ← BLOCKING
        json=payload,
        timeout=120
    )
    return resp.json()
```

**Target:**
```python
async def _call_local_llm(self, messages, model_name):
    # ...
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(  # ← NON-BLOCKING
            "http://localhost:1234/v1/responses",  # ← CORRECT PORT
            json=payload
        )
    return resp.json()
```

### Change 4: Make `_call_remote_llm()` async
**Lines:** ~560-628 (the OpenRouter call method)

Similar to `_call_local_llm()`, replace `requests.post()` with async httpx.

### Change 5: Update all internal HTTP calls
Search for any other `requests.post()` or `requests.get()` calls in the file and convert to async httpx equivalents.

---

## Integration Point: Backend chat.py

**File:** `backend/app/api/routes/chat.py`

The `process_llm_in_background()` function will need to be updated to await the orchestrator:

**Current (Phase 1):**
```python
async def process_llm_in_background(...):
    orchestrator = get_orchestrator_instance(...)
    llm_response = orchestrator.execute_query(...)  # ← Not awaiting
```

**Phase 2:**
```python
async def process_llm_in_background(...):
    orchestrator = get_orchestrator_instance(...)
    llm_response = await orchestrator.execute_query(...)  # ← Await async call
```

---

## Testing Strategy
1. Syntax check: `python3 -m py_compile app/services/orchestrator_universal.py`
2. Backend start: `./sb.sh` or manual uvicorn
3. Send message in frontend
4. Monitor logs: Should see orchestrator executing async
5. Performance: Multiple concurrent messages should not queue up

---

## Dependencies to Install
```bash
# If httpx not already installed:
pip install httpx
```

---

## Rollback Plan
If Phase 2 causes issues:
1. Revert orchestrator_universal.py to pre-Phase 2 state
2. Keep chat.py changes (BackgroundTasks pattern still works)
3. Fall back to Phase 1 (still much better than original sync waterfall)

---

## Expected Outcome
- Multiple concurrent chat requests execute in parallel (not queued)
- No thread starvation waiting on network I/O
- Frontend polling still works unchanged
- Backend can scale to handle more simultaneous users
