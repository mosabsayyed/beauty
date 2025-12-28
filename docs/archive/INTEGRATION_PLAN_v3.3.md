# Noor v3.3 Bootstrap Prompt Integration Plan

**Created:** 2025-12-08  
**Status:** Planning Phase  
**Goal:** Integrate cognitive_bootstrap_prompt_v3.3.md into the complete application stack

---

## 1. Current State Analysis

### ✅ COMPLETE
- **cognitive_bootstrap_prompt_v3.3.md** (Tier 1): Source of truth file exists with all scope parameters updated
- **Neo4j Memory Scopes**: Cleaned (global scope removed, 4 remaining: personal/departmental/ministry/secrets)
- **sb.sh**: Router URLs exported (NOOR_MCP_ROUTER_URL=8201, MAESTRO_MCP_ROUTER_URL=8202)

### ❌ MISSING / MISALIGNED
- **Tier 2 (Database)**: Mode-specific bundles (mode_A/B/C/D_definitions) NOT in instruction_bundles table
- **Tier 3 (Database)**: instruction_elements table - unknown status (needs verification)
- **orchestrator_noor.py**: Hardcoded COGNITIVE_CONT_BUNDLE is STALE (doesn't match v3.3 prompt)
- **orchestrator_maestro.py**: Hardcoded COGNITIVE_CONT_BUNDLE is STALE (missing scope guidance)
- **mcp_service.py (Noor)**: Scope enum verified but needs final validation
- **mcp_service_maestro.py (Maestro)**: Scope enum verified but needs final validation
- **Environment**: Router URLs in sb.sh but not verified in actual service startup

---

## 2. Integration Checklist (In Priority Order)

### Phase 1: Environment & Service Configuration
**Goal:** Ensure routers and environment are properly wired

- [ ] **Task 1.1: Verify sb.sh exports router URLs**
  - File: `/home/mosab/projects/chatmodule/sb.sh`
  - Check: Lines export NOOR_MCP_ROUTER_URL and MAESTRO_MCP_ROUTER_URL
  - Expected: `export NOOR_MCP_ROUTER_URL=http://127.0.0.1:8201`
  - Expected: `export MAESTRO_MCP_ROUTER_URL=http://127.0.0.1:8202`
  - Action: If missing, add exports; if present, confirm they're BEFORE service startup

- [ ] **Task 1.2: Verify backend services receive router URLs**
  - Files: `orchestrator_noor.py`, `orchestrator_maestro.py`
  - Check: Services read NOOR_MCP_ROUTER_URL and MAESTRO_MCP_ROUTER_URL from environment
  - Action: If not reading, add `os.getenv("NOOR_MCP_ROUTER_URL")` etc.

### Phase 2: Memory Scope Configuration
**Goal:** Ensure Noor and Maestro have correct scope enforcement

- [ ] **Task 2.1: mcp_service.py (Noor) - Verify scope enforcement**
  - File: `/home/mosab/projects/chatmodule/backend/app/services/mcp_service.py`
  - Required signature: `recall_memory(scope: Literal['personal', 'departmental', 'ministry'], ...)`
  - Required behavior: Raise `PermissionError` if `scope in {'secrets', 'csuite'}`
  - Check code around `allowed_scopes` and validation logic

- [ ] **Task 2.2: mcp_service_maestro.py (Maestro) - Verify scope access**
  - File: `/home/mosab/projects/chatmodule/backend/app/services/mcp_service_maestro.py`
  - Required signature: `recall_memory(scope: Literal['personal', 'departmental', 'ministry', 'secrets'], ...)`
  - Required behavior: Allow all 4 scopes without fallback

- [ ] **Task 2.3: Neo4j memory scopes - Final verification**
  - Command: `MATCH (m:Memory) RETURN m.scope as scope, count(m) as count ORDER BY scope`
  - Expected: 4 nodes (personal=1, departmental=1, ministry=1, secrets=1)
  - Ensure: NO global, NO csuite

### Phase 3: Prompt Template Synchronization
**Goal:** Ensure orchestrators have the correct Tier 1 prompt

- [ ] **Task 3.1: Extract Tier 1 from cognitive_bootstrap_prompt_v3.3.md**
  - File: `/home/mosab/projects/chatmodule/backend/app/services/cognitive_bootstrap_prompt_v3.3.md`
  - Extract: Everything from "# Cognitive Bootstrap..." through "---" that ends Tier 1 (before "## TIER 2")
  - Save as: `TIER_1_EXTRACTED.md` temporarily for comparison

- [ ] **Task 3.2: Update orchestrator_noor.py hardcoded bundle**
  - File: `/home/mosab/projects/chatmodule/backend/app/services/orchestrator_noor.py`
  - Find: Variable `COGNITIVE_CONT_BUNDLE = """..."""`
  - Replace with: Extracted Tier 1 from Task 3.1
  - Verify: All scope parameters are explicit (scope="personal", scope="departmental", scope="ministry")
  - Verify: NO mention of 'secrets' scope (Noor must not be guided to access secrets)

- [ ] **Task 3.3: Update orchestrator_maestro.py hardcoded bundle**
  - File: `/home/mosab/projects/chatmodule/backend/app/services/orchestrator_maestro.py`
  - Find: Variable `COGNITIVE_CONT_BUNDLE = """..."""`
  - Replace with: Extracted Tier 1 from Task 3.1 + explicit guidance on secrets scope
  - Add to bundle: Guidance on when/how to use secrets scope (executive contexts only)
  - Verify: Explicit scope parameter shows all 4 options for Maestro

### Phase 4: Database Schema & Data Population
**Goal:** Ensure Tier 2 and Tier 3 are in database

  - Table: `instruction_bundles`
  - Required 4 new rows:
    - `tag`: mode_A_definitions | `category`: data_mode | `version`: v1.0.0 | `status`: active
    - `tag`: mode_B_definitions | `category`: data_mode | `version`: v1.0.0 | `status`: active
    - `tag`: mode_C_definitions | `category`: data_mode | `version`: v1.0.0 | `status`: active
    - `tag`: mode_D_definitions | `category`: data_mode | `version`: v1.0.0 | `status`: active
  - Content: Each row's `content` field = Steps 2-5 guidance for that mode (to be extracted from architecture doc or created)
  - Note: These contain full Cypher patterns, element references, gap analysis logic

### ⚠️ ARCHITECTURE MISMATCH DETECTED

**Issue:** Bootstrap prompt v3.3 describes Tier 2 as separate `retrieve_instructions(tier="data_mode_definitions", mode="A")` calls, but the current database architecture uses PER-BUNDLE trigger modes instead.

**Current System (Database):**
- Bundles have `trigger_modes` array (e.g., cognitive_cont triggers [A,B,C,D,E,F,G,H])
- LLM receives ALL triggered bundles for the mode
- No `tier` parameter in retrieve_instructions call

**Bootstrap Prompt Expectation:**
- Separate mode_A/B/C/D_definitions bundles
- LLM calls `retrieve_instructions(tier="data_mode_definitions", mode="A")`
- LLM receives only ONE bundle with Steps 2-5 guidance for that mode

**Decision Needed BEFORE Task 4.1:**
Option A: Align bootstrap prompt to match current database architecture (simpler, no DB changes)
Option B: Redesign database to match bootstrap prompt (more complex, better separation)

**Recommendation:** Option A - Keep current database architecture, update bootstrap prompt to teach LLM to work with trigger_modes-based routing instead of tier/mode parameters.
- [ ] **Task 4.2: Create/update Tier 3 elements in database**
  - Table: `instruction_elements` (verify it exists first)
  - Required: All 62 granular elements referenced in bootstrap prompt
  - Examples: EntityProject, EntityCapability, cypher_query_patterns, memory_bank_structure, etc.
  - Each element: ~150-400 tokens
  - Action: Run `create_instruction_elements_table.sql` if not yet executed

- [ ] **Task 4.3: Update instruction_metadata for mode routing**
  - Table: `instruction_metadata`
  - Update rows for modes A/B/C/D to reference new mode_X_definitions bundles
  - Ensure: trigger_modes array contains correct modes [A], [B], [C], [D]

### Phase 5: Validation & Testing
**Goal:** Verify everything works end-to-end

- [ ] **Task 5.1: Smoke test - Noor blocks secrets scope**
  - Script: Run test that calls `recall_memory(scope="secrets")`
  - Expected: `PermissionError` raised
  - File: `backend/tests/test_memory_access_gate.py`

- [ ] **Task 5.2: Smoke test - Maestro allows secrets scope**
  - Script: Run test that calls `recall_memory(scope="secrets")`
  - Expected: Returns results (empty array [] is OK if no data)
  - File: `backend/tests/test_memory_access_gate.py`

- [ ] **Task 5.3: Smoke test - Routers are available**
  - Command: Check NOOR_MCP_ROUTER_URL and MAESTRO_MCP_ROUTER_URL are reachable
  - Expected: Both routers respond to health checks
  - Timeout: 5 seconds max per router

- [ ] **Task 5.4: Smoke test - Orchestrators load correct prompt**
  - Script: Call orchestrator_noor.py and inspect logs
  - Expected: Logs show COGNITIVE_CONT_BUNDLE contains scope="ministry" (not secrets)
  - Script: Call orchestrator_maestro.py and inspect logs
  - Expected: Logs show COGNITIVE_CONT_BUNDLE contains scope="secrets" guidance

---

## 3. File Dependency Map

```
cognitive_bootstrap_prompt_v3.3.md (SOURCE OF TRUTH - Tier 1)
    ↓
    └─→ orchestrator_noor.py (extract Tier 1, hardcode as COGNITIVE_CONT_BUNDLE)
    └─→ orchestrator_maestro.py (extract Tier 1 + secrets guidance, hardcode)
    └─→ instruction_bundles table (Tier 2: mode_A/B/C/D_definitions)
    └─→ instruction_elements table (Tier 3: 62 atomic elements)

mcp_service.py (Noor)
    ↓
    └─→ Enforces scope='personal'|'departmental'|'ministry' (blocks secrets)

mcp_service_maestro.py (Maestro)
    ↓
    └─→ Enforces scope='personal'|'departmental'|'ministry'|'secrets'

sb.sh
    ↓
    └─→ Exports NOOR_MCP_ROUTER_URL=8201, MAESTRO_MCP_ROUTER_URL=8202
    └─→ Passes to backend services

Neo4j Database
    ↓
    └─→ Memory nodes with 4 scopes (personal, departmental, ministry, secrets)
```

---

## 4. Known Issues to Fix

1. **Hardcoded bundles are stale**: orchestrator_noor.py and orchestrator_maestro.py contain old COGNITIVE_CONT_BUNDLE strings that don't match the updated prompt
2. **Tier 2 missing**: No mode_A/B/C/D_definitions in instruction_bundles table
3. **Tier 3 unknown**: Status of instruction_elements table is unclear
4. **No dynamic loading**: Both orchestrators hardcode the bundle instead of loading from database dynamically
5. **Scope parameter explicit**: All recall_memory calls in prompt now have explicit scope, but this guidance must reach LLM (via hardcoded bundle)

---

## 5. Success Criteria

✅ All 10 tasks in Phases 1-5 are complete  
✅ Smoke tests pass for both Noor and Maestro  
✅ Neo4j has exactly 4 memory scopes  
✅ instruction_bundles table has 14 rows (10 original + 4 new mode definitions)  
✅ instruction_elements table has all 62 elements  
✅ Orchestrators' hardcoded COGNITIVE_CONT_BUNDLE matches v3.3 prompt exactly  
✅ Router URLs are properly exported and used  

---

## 6. Timeline Estimate

- Phase 1: 15 minutes (environment verification)
- Phase 2: 10 minutes (scope validation)
- Phase 3: 30 minutes (extract & update orchestrators)
- Phase 4: 45 minutes (database population + element creation)
- Phase 5: 20 minutes (testing)
- **Total: ~2 hours**

