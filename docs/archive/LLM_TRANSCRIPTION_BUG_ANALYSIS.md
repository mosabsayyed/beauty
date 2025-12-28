# CRITICAL BUG FOUND: LLM Transcription Error Not Caught by Guards

## Problem Statement

When MCP returns `count(p) = 104`, the LLM **sometimes incorrectly formats** this as `"Project Count": 0` in the visualization. The orchestrator's empty result guard does NOT catch this because:

```python
# Current guard (line 334-336)
query_results = (data or {}).get("query_results") if isinstance(data, dict) else None
if query_results:
    return response  # ❌ BUG: Returns immediately if query_results exists
```

**The guard checks if `query_results` is EMPTY, not if the COUNT is WRONG.**

---

## Root Cause: No Validation Between MCP Result and LLM Output

### The Pipeline Failure Point

```
1. User asks: "How many Q4 2025 projects?"
   ↓
2. Groq LLM calls MCP tool: read_neo4j_cypher
   ↓
3. MCP executes: MATCH (p:EntityProject) WHERE p.quarter = 4 AND p.year = 2025 RETURN count(p)
   ↓
4. Neo4j returns: [{projectCount: 104}]  ✅ CORRECT
   ↓
5. MCP wrapper returns to Groq: {"content": [{"type": "text", "text": "104"}]}
   ↓
6. ❌ LLM TRANSCRIPTION ERROR: LLM formats response as:
   {
     "visualizations": [{
       "data": [{"Project Count": 0}]  ← WRONG! Should be 104
     }]
   }
   ↓
7. ❌ Guard FAILS TO DETECT: 
   - query_results exists (not empty)
   - Guard returns response without validation
   ↓
8. Frontend displays: 0 projects  ← USER SEES THIS
```

---

## Why This Happens

### 1. LLM Hallucination/Transcription Error
- The LLM receives the correct count from MCP
- But when formatting the response, it **hallucinates** or **miscopies** the number
- This is a known issue with LLMs - they can make arithmetic/transcription errors

### 2. No Cross-Validation
The orchestrator has **no mechanism** to validate that:
- The LLM's formatted output matches the raw MCP tool result
- The visualization data matches the query_results data
- The answer text matches the actual counts

### 3. Guard is Too Permissive
```python
# Current logic:
if query_results:  # If ANY results exist
    return response  # Trust the LLM completely
```

Should be:
```python
# Should validate:
if query_results and _counts_match_mcp_results(response):
    return response
else:
    # Fetch ground truth from Neo4j and correct the response
```

---

## Phase 2 Fixes Required (From INVESTOR_DEMO_TO_ENTERPRISE_ROADMAP.md)

### 2.1 LLM Contract Enforcement ⚠️ **NOT YET IMPLEMENTED**

From the roadmap document:

> **What:**
> - Deploy `llm_contract.py` from earlier assessment: enforce `final_answer`, `evidence`, `missing_data`, `artifacts` schema.
> - Add "canonical template" enforcement: if LLM response doesn't match 7-part deep-dive structure, wrap it forcibly.
> - Reject responses without evidence if tooling was used; retry once with stricter prompt.
> - Auto-recovery: if JSON parse fails, extract last valid JSON block; if none, return honest "parsing failed" message.
>
> **Acceptance Criteria:**
> - [ ] All LLM responses conform to `LlmPayload` schema.
> - [ ] Evidence gating enforced: no grounded claims without evidence entries.
> - [ ] Empty tool outputs trigger `clarification_needed=true` and `missing_data` population.
> - [ ] One retry on malformed JSON; graceful failure if retry fails.

**Status**: ❌ NOT IMPLEMENTED

### 2.2 Cross-Validation Guard **NEW - MUST ADD**

Add validation that checks:
1. **MCP tool result vs LLM formatted output**
   - Extract counts from MCP tool results
   - Compare against counts in visualizations
   - If mismatch > 10%: trigger correction

2. **Visualization data vs query_results consistency**
   - Same count in both places
   - Same records

3. **Auto-correction when mismatch detected**
   - Re-query Neo4j directly
   - Override LLM output with ground truth
   - Log the discrepancy

---

## Immediate Fix (Minimal - For Today)

Modify `_apply_empty_result_guard` to also check for **wrong counts**:

```python
def _apply_empty_result_guard(self, user_query: str, response: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced guard: catch both empty results AND wrong counts."""
    try:
        data = response.get("data") if isinstance(response, dict) else None
        query_results = (data or {}).get("query_results") if isinstance(data, dict) else None
        
        # ❌ OLD: if query_results: return response
        
        # ✅ NEW: Check if results are suspicious
        # 1. Empty results → run full guard
        # 2. Results with count=0 but MCP succeeded → suspicious, validate
        # 3. Results with suspiciously low count for temporal query → validate
        
        needs_validation = False
        
        if not query_results:
            needs_validation = True
        elif isinstance(query_results, list) and len(query_results) > 0:
            first_result = query_results[0] if isinstance(query_results[0], dict) else {}
            # Check for count fields that are 0 or suspiciously low
            count_fields = ['projectCount', 'project_count', 'count', 'total']
            for field in count_fields:
                if field in first_result:
                    count_val = first_result.get(field, -1)
                    if isinstance(count_val, (int, float)) and count_val == 0:
                        needs_validation = True
                        break
        
        if not needs_validation:
            return response
        
        # Rest of the guard logic...
```

---

## Comprehensive Fix (Phase 2 - Next 3 Days)

### Step 1: Create LLM Contract Enforcer

**File**: `/backend/app/core/llm_contract.py`

```python
class LlmContractEnforcer:
    """Enforces response schema and validates LLM output against tool results."""
    
    def validate_response(self, llm_response: Dict, mcp_tool_results: List[Dict]) -> ValidationResult:
        """
        Cross-validate LLM's formatted response against raw MCP results.
        
        Checks:
        1. Schema compliance (required fields present)
        2. Evidence gating (claims have evidence)
        3. Count consistency (visualizations match tool results)
        4. Data integrity (no hallucinated records)
        """
        
    def extract_counts_from_mcp(self, tool_results: List[Dict]) -> Dict[str, int]:
        """Extract numeric counts from raw MCP tool results."""
        
    def extract_counts_from_response(self, response: Dict) -> Dict[str, int]:
        """Extract counts from LLM's formatted visualizations/query_results."""
        
    def correct_response(self, response: Dict, ground_truth: Dict) -> Dict:
        """Override LLM output with validated ground truth from Neo4j."""
```

### Step 2: Capture MCP Tool Results

Modify `_call_groq_llm` to capture and store tool results:

```python
def _call_groq_llm(self, messages: List[Dict[str, str]], model_name: Optional[str]) -> Tuple[str, List[Dict]]:
    """Returns: (output_text, mcp_tool_results)"""
    # ... existing code ...
    
    # Extract MCP tool results from Groq response
    mcp_tool_results = []
    for item in output_array:
        if item.get("type") == "mcp_call_result":
            mcp_tool_results.append({
                "call_id": item.get("call_id"),
                "content": item.get("content", []),
                "tool_name": item.get("name")  # Need to track which tool was called
            })
    
    return output_text, mcp_tool_results
```

### Step 3: Add Validation to execute_query

```python
def execute_query(self, user_query: str, session_id: str, ...) -> Dict[str, Any]:
    # ... existing code ...
    
    # 5. Call Groq LLM (now returns tool results too)
    llm_response, mcp_tool_results = self._call_llm(messages, model_choice)
    
    # 6. Parse & validate JSON
    parsed_response = self._parse_llm_output(llm_response)
    
    # 7. NEW: Cross-validate against MCP tool results
    validator = LlmContractEnforcer()
    validation = validator.validate_response(parsed_response, mcp_tool_results)
    
    if not validation.is_valid:
        logger.warning(f"[{session_id}] LLM output failed validation: {validation.errors}")
        
        # Auto-correct if possible
        if validation.can_auto_correct:
            parsed_response = validator.correct_response(parsed_response, validation.ground_truth)
            log_debug(2, "llm_output_corrected", {
                "errors": validation.errors,
                "corrections": validation.corrections
            })
        else:
            # Retry with stricter prompt
            parsed_response = self._retry_with_evidence_enforcement(messages, mcp_tool_results)
    
    # ... rest of execute_query ...
```

---

## Testing Plan

### Test Case 1: Count Mismatch Detection
```python
# MCP returns: 104 projects
# LLM formats: 0 projects
# Expected: Guard detects mismatch, queries Neo4j, corrects to 104
```

### Test Case 2: Empty Results (Existing)
```python
# MCP returns: (no data)
# LLM formats: empty
# Expected: Guard detects, queries Neo4j, adds diagnostic
```

### Test Case 3: Hallucinated Records
```python
# MCP returns: 5 projects [A, B, C, D, E]
# LLM formats: 7 projects [A, B, C, D, E, F, G]
# Expected: Validator rejects, overwrites with ground truth
```

---

## Metrics to Track

1. **LLM Transcription Errors**: Count how often LLM output != MCP result
2. **Auto-Correction Rate**: % of responses corrected by guard
3. **Validation Failures**: Errors that couldn't be auto-corrected
4. **Retry Success Rate**: % of retries that fixed the issue

---

## Timeline

| Task | Time | Priority |
|------|------|----------|
| Enhance empty_result_guard (minimal fix) | 30 min | 🔴 URGENT |
| Create llm_contract.py skeleton | 1 hour | 🟠 HIGH |
| Capture MCP tool results in orchestrator | 1 hour | 🟠 HIGH |
| Implement count cross-validation | 2 hours | 🟠 HIGH |
| Add retry with evidence enforcement | 2 hours | 🟡 MEDIUM |
| Full contract enforcement (schema, evidence gating) | 4 hours | 🟡 MEDIUM |
| Testing & metrics dashboard | 2 hours | 🟢 LOW |

**Total**: ~12 hours for complete Phase 2.1 implementation

---

## Next Steps

1. ✅ **IMMEDIATE**: Apply minimal fix to `_apply_empty_result_guard`
2. ⏳ **TODAY**: Capture MCP tool results in orchestrator
3. ⏳ **TOMORROW**: Implement count cross-validation
4. ⏳ **DAY 3**: Full contract enforcement + retry logic

This fixes the Q4 2025 projects issue AND prevents future LLM hallucination/transcription errors.
