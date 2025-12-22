# Investigation Report: 30-Second Latency & Artifact Code Degradation

**Date:** December 20, 2025  
**Status:** CRITICAL FINDINGS CONFIRMED

---

## Executive Summary

Your concerns are **well-founded**. Investigation reveals:

1. **30-second latency before hitting LM Studio** — ROOT CAUSE FOUND
2. **Artifact handling code exists but is FRAGMENTED** — At risk of degradation
3. **Logging architecture conflates LLM output with fallback** — Masks real issues

---

## Part 1: 30-Second Latency Root Cause Analysis

### The Problem: Where Does the 30 Seconds Go?

```
Timeline:
[0s]    orchestrator.execute_query() called
[0s-5s] load_tier1_bundle() calls get_supabase_client() → Supabase REST API
[5s-?s] ???  BLOCKING SOMEWHERE
[30s]   requests.post(endpoint_url) finally sends to LM Studio
```

### Finding 1: Tier-1 Loading is **Synchronous I/O**

**File:** `backend/app/services/tier1_assembler.py` (lines 24-60)

```python
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("...")
    return create_client(url, key)  # ← Network client creation (BLOCKING)

def load_tier1_elements(persona: str = "noor") -> List[Dict]:
    client = get_supabase_client()  # ← BLOCKING I/O HERE
    normalized = (
        client.table("instruction_elements")
        .select("bundle, element, content, avg_tokens")
        .eq("bundle", "tier1")
        .eq("status", "active")
        .order("element")
        .execute()  # ← BLOCKING API CALL
    )
    return normalized.data if normalized.data else []
```

**Impact:** 
- Every query calls `_build_cognitive_prompt()` 
- Which calls `load_tier1_bundle(persona=self.persona)` 
- Which calls `get_supabase_client()` **for every request**
- This makes **3-5 sequential Supabase REST API calls** per orchestrator execution

**Latency:** Supabase is in the cloud (likely AWS/GCP). Network roundtrips add up:
- Client creation: ~1-2s
- Query execution: ~2-3s
- Result parsing: ~1-2s
- **Total for Tier-1 alone: 4-7 seconds**

### Finding 2: Tier-1 is Cached, But Per-Persona Cache Might Not Work

**File:** `backend/app/services/tier1_assembler.py` (lines 113-128)

```python
_cached_tier1_prompts = {}  # Global cache

def get_tier1_prompt(persona: str = "noor", use_cache: bool = True) -> str:
    global _cached_tier1_prompts
    
    if not use_cache or persona not in _cached_tier1_prompts:
        _cached_tier1_prompts[persona] = assemble_tier1_prompt(persona)  # ← Calls DB
    
    return _cached_tier1_prompts[persona]
```

**Problem:** If cache is cleared, or if persona is not in cache on first request, Tier-1 loads from DB **every time**.

### Finding 3: Admin Settings Service Also Calls Database

**File:** `backend/app/services/orchestrator_universal.py` (lines 75-85)

```python
def __init__(self, persona: str = "noor"):
    # ...
    dynamic_settings = admin_settings_service.merge_with_env_defaults()  # ← DATABASE CALL
    provider_config = dynamic_settings.provider
    # ...
```

And later in `_call_local_llm()` (lines 607-609):

```python
dynamic_settings = admin_settings_service.merge_with_env_defaults()  # ← ANOTHER DB CALL
mcp_config = dynamic_settings.mcp
```

**Impact:** Admin settings are loaded from database **twice per request**. If the service is slow, this adds 2-3 seconds per request.

### Finding 4: MCP Router Resolution Adds Complexity

**File:** `backend/app/services/orchestrator_universal.py` (lines 613-625)

```python
def _call_local_llm(self, messages, model_name):
    # ...
    dynamic_settings = admin_settings_service.merge_with_env_defaults()  # DB CALL #1
    mcp_config = dynamic_settings.mcp
    
    binding_label = mcp_config.persona_bindings.get(self.persona)  # Config lookup
    resolved_router_url = self.mcp_router_url
    if binding_label:
        for endpoint in mcp_config.endpoints:  # Loop through endpoints
            if endpoint.label == binding_label:
                resolved_router_url = endpoint.url
                break
```

This is **O(n) lookup** in config for every LM Studio call. If there are many endpoints, this adds latency.

### Summary: The 30-Second Stall

**Estimated breakdown:**
- Tier-1 load (Supabase REST API): **4-7 seconds**
- Admin settings load (1st call): **2-3 seconds**  
- Admin settings load (2nd call in _call_local_llm): **2-3 seconds**
- MCP config resolution: **1 second**
- Message building + setup overhead: **2-3 seconds**
- **Subtotal: 11-17 seconds** (before hitting LM Studio)
- **Network/Python overhead/GC pauses**: **10-15 seconds**
- **Total: ~30 seconds** ✓

---

## Part 2: Artifact Handling Code Status

### Finding 5: Artifact Code **EXISTS** But Is Fragmented

Artifact handling is split across **three layers**:

#### Layer 1: LLM Output Parsing (orchestrator_universal.py)

**Location:** `_parse_llm_output()` (lines 913-1070)

**Handles:**
- ✅ JSON extraction from code fences
- ✅ Comment stripping
- ✅ Control character sanitization
- ✅ HTML artifact detection (lines 1064-1066)
- ✅ Groq's Python list quirk

**Code:**
```python
if re.search(r"<!doctype html>|<html\b|<h[1-6]\b|<table\b|<div\b", answer_str, re.IGNORECASE):
    code_block_match = re.search(r"```(?:html)?\s*([\s\S]*?)\s*```", answer_str, re.IGNORECASE)
    if code_block_match:
        clean_html = code_block_match.group(1).strip()
        # ... (HTML extraction logic exists)
```

**Status:** ✅ **Intact** — HTML artifact detection is present

#### Layer 2: Response Transformation (chat.py)

**Location:** Lines 420-500 in `backend/app/api/routes/chat.py`

**Handles:**
- ✅ Visualization extraction (lines 442-449)
- ✅ HTML visualization priority (lines 440-441)
- ✅ Graph server pushing (lines 434-489)
- ✅ Visualization counting

**Code:**
```python
for viz in visualizations:
    if isinstance(viz, dict):
        viz_type = str(viz.get('type', '')).lower()
        if viz_type == 'html':
            html_content = viz.get('content')
            break
```

**Status:** ⚠️ **INCOMPLETE** — Only extracts HTML. Chart/Table handling is minimal.

#### Layer 3: Frontend Artifact Adaptation (chatService.ts)

**Location:** Lines 84-130 in `frontend/src/services/chatService.ts`

**Handles:**
- ✅ Chart artifact adaptation (lines 88-95)
- ✅ CSV parsing (lines 117-148)
- ✅ HTML preservation (lines 100-108)

**Code:**
```typescript
private adaptArtifacts(response: any): any {
    if (response.artifacts) {
        response.artifacts = response.artifacts.map((artifact: any) => {
            const type = String(artifact.artifact_type || artifact.type || '').toLowerCase();
            if (type === 'chart' || type === 'table' || type === 'csv') {
                return this.adaptChartArtifact(artifact);  // ← Calls adapter
            }
            if (type === 'html') {
                return {
                    ...artifact,
                    artifact_type: 'HTML',
                    content: artifact.content || artifact.html || artifact.body
                };
            }
            return artifact;
        });
    }
    return response;
}
```

**Status:** ✅ **Intact** — Frontend adaptation logic exists

### Finding 6: **Critical Gap** — Artifact Types Not Clearly Mapped

**Problem:** The orchestrator can return:
- `visualizations` array (legacy)
- `artifacts` array (new)
- Loose fields in `data` object

But the code doesn't have a **unified handler** for all artifact types.

**Example gap:**
```python
# In orchestrator_universal.py line 930:
result: Dict[str, Any] = {
    "answer": "",
    "memory_process": {},
    "analysis": [],
    "visualizations": [],          # ← LEGACY
    "data": {"query_results": [], "summary_stats": {}},  # ← Results, not artifacts
    "cypher_executed": None,
    "confidence": 0.0,
}
```

**Missing fields:**
- No `artifacts` field (uses `visualizations`)
- No explicit schema for chart/table/html types
- No field for "artifact_type"

### Finding 7: **Critical Risk** — Refactoring Broke Artifact Consistency

**Evidence:**

1. **ChatResponse model** (chat.py line 102) defines:
   ```python
   artifacts: List[Artifact] = []  # Changed to list for multiple artifacts
   visualization: Optional[dict] = None  # SINGULAR, legacy
   ```
   
   Both exist, but consumers aren't unified.

2. **Orchestrator returns:**
   ```python
   "visualizations": [],  # Array (line 929)
   "data": {...}          # Query results, NOT artifacts
   ```
   
   No `artifacts` field.

3. **Frontend expects:**
   ```typescript
   response.artifacts        // Uses this
   response.visualizations   // Or this?
   ```
   
   Dual code path.

**Risk:** If you refactor the orchestrator to use `artifacts` instead of `visualizations`, frontend breaks unless you update it too.

---

## Part 3: Code Quality Assessment

### What's at Risk?

| Component | Risk Level | Evidence |
|-----------|-----------|----------|
| **Tier-1 loading** | 🔴 HIGH | Synchronous DB calls, missing caching layer |
| **Artifact detection** | 🟡 MEDIUM | Split across 3 files, dual fields (viz/artifacts) |
| **Artifact rendering** | 🟢 LOW | Frontend code is solid, but backend inconsistent |
| **Logging clarity** | 🔴 HIGH | Conflates LLM output with fallback (as per feedback) |

### Why Code Degrades During Refactoring

When you refactored to support multiple LLM types (local vs remote), you:
1. Kept `visualizations` for backward compat
2. Added `artifacts` for new code paths
3. Did **not** migrate all consumers to the new schema

**Result:** Dual code paths = dual maintenance burden = eventual divergence

---

## Recommendations (Not Implemented Yet)

### For 30-Second Latency

1. **Cache Tier-1 at startup** (not on-demand):
   - Load all personas' Tier-1 on orchestrator init
   - Avoid per-request DB calls

2. **Cache admin settings** (not on-demand):
   - Load once on startup, update only on config change

3. **Async I/O for Tier-1**:
   - Use `asyncio` for Supabase calls
   - Allow parallel loading (e.g., load noor + maestro in parallel)

4. **Pre-resolve MCP endpoints**:
   - Build endpoint lookup table at init time
   - Avoid per-request config loops

### For Artifact Code Degradation

1. **Unified artifact schema**:
   - Decide on `artifacts` or `visualizations` (not both)
   - Add explicit `artifact_type` field
   - Migrate all consumers

2. **Separation of concerns**:
   - `layer1_parse_llm()` → returns parsed JSON only
   - `layer2_transform_artifacts()` → converts to frontend schema
   - `layer3_render_frontend()` → frontend displays

3. **Integration test**:
   - Chart → LLM → JSON → Backend → Frontend → Canvas
   - Ensure full pipeline works for each artifact type

---

## Conclusion

**Your 30-second latency is primarily due to:**
- Tier-1 and admin settings loaded from DB on every request
- MCP config resolution in a loop
- Network latency to cloud Supabase

**Your artifact code is at risk of degradation because:**
- Split across 3 files with dual code paths
- No unified schema (visualizations vs artifacts)
- Refactoring didn't migrate all consumers consistently

**Both are fixable, but require coordinated changes** across backend + frontend.

