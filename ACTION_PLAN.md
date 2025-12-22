# Action Plan: Fix 30-Second Latency & Artifact Code Degradation

**Priority:** CRITICAL  
**Complexity:** Medium  
**Estimated Effort:** 4-6 hours work + testing

---

## Quick Reference: The Three Fixes

| Fix | Effort | Impact | Prerequisite |
|-----|--------|--------|---------------|
| **Fix 1: Startup Caching** | 1 hour | 🔴 -15 seconds latency | None |
| **Fix 2: Unified Artifacts** | 2 hours | 🟡 Prevent degradation | None |
| **Fix 3: Logging Separation** | 1.5 hours | 🟡 Clarity only (UX) | None |

---

## Fix 1: Startup Caching (Remove Per-Request DB Calls)

### The Problem
```python
# Current (WRONG):
def execute_query(...):
    cognitive_prompt = self._build_cognitive_prompt()  # ← DB CALL per request
    # ...
    dynamic_settings = admin_settings_service.merge_with_env_defaults()  # ← DB CALL per request
    # ...
    dynamic_settings = admin_settings_service.merge_with_env_defaults()  # ← ANOTHER DB CALL
```

### The Fix

**Step 1:** Cache Tier-1 at Orchestrator Init

Replace per-request loading with init-time loading:

```python
class CognitiveOrchestrator:
    def __init__(self, persona: str = "noor"):
        # ... existing code ...
        
        # LOAD TIER-1 ONCE AT INIT (not per-request)
        self._tier1_prompt_cached = load_tier1_bundle(persona=self.persona)
        self._tier1_loaded_at = datetime.now()
        
    def _build_cognitive_prompt(self) -> str:
        """Build Tier 1 prompt from cache (not from DB)."""
        today = datetime.now().strftime("%B %d, %Y")
        # USE CACHED TIER-1 (no DB call)
        tier1_prompt = self._tier1_prompt_cached
        
        # ... rest of function unchanged ...
        
        return tier1_prompt.replace("<datetoday>", today) + tool_guard + user_context
```

**Step 2:** Cache Admin Settings at Init

```python
class CognitiveOrchestrator:
    def __init__(self, persona: str = "noor"):
        # ... existing code ...
        
        # LOAD ADMIN SETTINGS ONCE AT INIT (not per-request)
        self._admin_settings_cached = admin_settings_service.merge_with_env_defaults()
        
    def _call_local_llm(self, messages, model_name):
        """Route to local LLM."""
        # ... existing code up to line 607 ...
        
        # USE CACHED SETTINGS (no DB call)
        dynamic_settings = self._admin_settings_cached  # ← NO DB CALL
        mcp_config = dynamic_settings.mcp
        
        # ... rest unchanged ...
```

**Step 3:** Pre-Resolve MCP Endpoints at Init

```python
class CognitiveOrchestrator:
    def __init__(self, persona: str = "noor"):
        # ... existing code ...
        
        # BUILD MCP ENDPOINT LOOKUP MAP AT INIT (O(1) lookup later)
        dynamic_settings = admin_settings_service.merge_with_env_defaults()
        mcp_config = dynamic_settings.mcp
        self._mcp_endpoint_map = {}
        
        for endpoint in mcp_config.endpoints:
            self._mcp_endpoint_map[endpoint.label] = endpoint.url
        
    def _call_local_llm(self, messages, model_name):
        """Route to local LLM."""
        # ... existing code ...
        
        binding_label = mcp_config.persona_bindings.get(self.persona)
        # USE PRE-BUILT MAP (O(1) lookup, no loop)
        resolved_router_url = self._mcp_endpoint_map.get(binding_label) or self.mcp_router_url
```

### Expected Impact

- **Before:** 4-7s (Tier-1 DB call) + 2-3s (admin settings #1) + 2-3s (admin settings #2) + 1s (MCP loop) = **9-14 seconds**
- **After:** All cached at init, per-request overhead = **~0.5 seconds**
- **Latency saved:** **-8 to -13 seconds** ✓

---

## Fix 2: Unified Artifact Schema (Prevent Degradation)

### The Problem

Current state:
```python
# Backend returns:
{
    "visualizations": [],      # LEGACY (orchestrator)
    "artifacts": [],           # NEW (chat.py expects)
    "data": {...}              # Results, not artifacts
}

# Frontend expects:
response.artifacts        // New code uses this
response.visualizations   // Old code uses this
```

### The Fix

**Step 1:** Standardize Orchestrator Output

**File:** `backend/app/services/orchestrator_universal.py` (lines 925-930)

Change:
```python
result: Dict[str, Any] = {
    "answer": "",
    "memory_process": {},
    "analysis": [],
    "visualizations": [],          # ← REMOVE
    "data": {"query_results": [], "summary_stats": {}},
    "cypher_executed": None,
    "confidence": 0.0,
}
```

To:
```python
result: Dict[str, Any] = {
    "answer": "",
    "memory_process": {},
    "analysis": [],
    "artifacts": [],               # ← NEW (unified)
    "data": {"query_results": [], "summary_stats": {}},
    "cypher_executed": None,
    "confidence": 0.0,
}
```

**Step 2:** Update Artifact Structure

Add clear schema for all artifact types:

```python
# In _parse_llm_output():

# When HTML is detected:
if re.search(r"<!doctype html>|<html\b", answer_str, re.IGNORECASE):
    result["artifacts"].append({
        "artifact_type": "HTML",
        "title": "HTML Report",
        "content": clean_html,
        "description": "Rendered HTML content"
    })

# When visualizations are parsed:
if parsed_json and "visualizations" in parsed_json:
    result["artifacts"] = parsed_json["visualizations"]
    # Ensure each has artifact_type:
    for artifact in result["artifacts"]:
        if "artifact_type" not in artifact:
            artifact["artifact_type"] = artifact.get("type", "UNKNOWN").upper()
```

**Step 3:** Update Chat API Response Model

**File:** `backend/app/api/routes/chat.py` (lines 99-104)

Change:
```python
class ChatResponse(BaseModel):
    visualization: Optional[dict] = None          # ← REMOVE
    artifacts: List[Artifact] = []
```

Keep `artifacts` only (remove `visualization`).

**Step 4:** Update Chat Route

**File:** `backend/app/api/routes/chat.py` (lines 440-450)

Change:
```python
visualizations = llm_payload.get('visualizations') or []
# ↓
artifacts = llm_payload.get('artifacts') or llm_payload.get('visualizations') or []
```

**Step 5:** Update Frontend

**File:** `frontend/src/services/chatService.ts` (lines 84-95)

Change:
```typescript
if (response.artifacts) {
    response.artifacts = response.artifacts.map((artifact: any) => {
        const type = String(artifact.artifact_type || artifact.type || '').toLowerCase();
        // ... existing code ...
    });
}

if (response.visualizations) {  // ← REMOVE THIS BLOCK
    // ...
}
```

To:
```typescript
if (response.artifacts) {
    response.artifacts = response.artifacts.map((artifact: any) => {
        const type = String(artifact.artifact_type || artifact.type || '').toLowerCase();
        // ... existing code ...
    });
}
// Remove response.visualizations handling entirely
```

### Expected Impact

- **Code clarity:** Single artifact code path (not dual)
- **Maintenance:** Changes to one field propagate everywhere
- **Risk reduction:** Prevents silent divergence between layers

---

## Fix 3: Logging Separation (Clarity & Testing)

### The Problem

Current logs show:
```
"llm_response": {
    "data": { query_results: [...], cypher_executed: "..." }  # ← Came from fallback, not LLM!
}
```

### The Fix

**Step 1:** Add Parse Failure Tracking

**File:** `backend/app/services/orchestrator_universal.py` (lines 200-220)

Add after JSON parsing:

```python
# 6. Parse & validate JSON
parse_success = False
parsed_response = self._parse_llm_output(llm_response)

# 7. Check if parse succeeded
if not parsed_response.get("has_parse_error"):
    parse_success = True
    log_debug(2, "llm_parse_success", {
        "session_id": session_id,
        "has_answer": bool(parsed_response.get("answer")),
        "has_artifacts": len(parsed_response.get("artifacts", [])) > 0,
    })
else:
    log_debug(1, "llm_parse_failed", {
        "session_id": session_id,
        "error": parsed_response.get("parse_error"),
    })
```

**Step 2:** Mark Fallback Execution Explicitly

**File:** `backend/app/services/orchestrator_universal.py` (lines 212-220)

Change auto-recovery to be explicit:

```python
# 7. Auto-recovery if invalid JSON
if not self._is_valid_json_response(parsed_response):
    logger.warning(f"[{session_id}] Invalid JSON detected, attempting auto-recovery...")
    log_debug(1, "fallback_triggered", {
        "session_id": session_id,
        "reason": "json_parse_failed",
        "llm_raw_output_length": len(llm_response)
    })
    parsed_response = self._auto_recover(messages, llm_response)
    parsed_response["fallback_executed"] = True  # ← MARK IT
```

**Step 3:** Separate Logs in Debug Output

**File:** `backend/app/utils/debug_logger.py` (if needed)

Add structure to logs:

```python
log_debug(2, "llm_raw_response", {
    "session_id": session_id,
    "source": "model",  # ← MARK SOURCE
    "response_length": len(llm_response),
    "response_snippet": llm_response[:500],
})

# Later, if fallback executes:
log_debug(2, "agent_result_from_fallback", {  # ← DIFFERENT EVENT
    "session_id": session_id,
    "source": "fallback_executor",  # ← MARK SOURCE
    "cypher_executed": "...",
    "query_results": [...]
})
```

### Expected Impact

- **Clarity:** Logs show which parts came from LLM vs fallback
- **Testing:** Can identify "why does this test pass?" (fallback or real output?)
- **Validation:** Can measure model compliance (% of requests with parse success)

---

## Implementation Order

1. **First:** Fix 1 (Caching) — **Eliminates 30-second latency immediately**
2. **Second:** Fix 2 (Unified Artifacts) — **Prevents future degradation**
3. **Third:** Fix 3 (Logging) — **Enables proper testing & validation**

---

## Testing Plan

### Test 1: Latency Baseline

```bash
# Before fixes:
time curl -X POST http://localhost:8008/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "conversation_id": 1}'
# Expected: ~30 seconds

# After Fix 1:
time curl -X POST http://localhost:8008/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "conversation_id": 1}'
# Expected: ~5-10 seconds (LM Studio only)
```

### Test 2: Artifact Rendering

Send a query that triggers chart generation:

```bash
curl -X POST http://localhost:8008/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "show projects by status as a chart", "conversation_id": 1}' \
  | jq '.llm_payload.artifacts'
# Expected: [{ artifact_type: "CHART", content: {...} }]
```

### Test 3: Frontend Integration

1. Open frontend at http://localhost:3000
2. Send query from Test 2
3. Check browser console: no errors
4. Check Canvas panel: chart renders (not blank)

---

## Risk Assessment

| Fix | Risk | Mitigation |
|-----|------|-----------|
| **Fix 1** | Cache invalidation on config change | Add `refresh_tier1_cache()` endpoint |
| **Fix 2** | Breaking change for old clients | Add backward-compat field (`visualizations`) |
| **Fix 3** | More verbose logs | Log only to debug level |

---

## Summary

| Phase | Action | Latency | Code Quality |
|-------|--------|---------|--------------|
| **Current** | No caching, dual artifacts | 30s | At risk |
| **After Fix 1** | Caching at init | ~5s | (unchanged) |
| **After Fix 2** | + Unified schema | ~5s | Stable |
| **After Fix 3** | + Clear logging | ~5s | Debuggable |

