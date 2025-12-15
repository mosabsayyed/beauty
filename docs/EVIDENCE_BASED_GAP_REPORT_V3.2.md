# Noor v3.2 - Evidence-Based Gap Report
**Date:** 2025-12-06  
**Methodology:** Design 3.2 = "SHOULD" | Configs + DB + orchestrator_zero_shot.py = "EXISTS"

---

## EXECUTIVE SUMMARY

**Critical Finding:** Schema naming mismatch between Design 3.2 (snake_case: sec_objectives, ent_capabilities) and orchestrator_zero_shot.py implementation (CamelCase: EntityProject, SectorObjective).

**User Guidance:** *"rely on the zero shot script and the actual DB. The design will help u in what is not there"*

**Interpretation:** orchestrator_zero_shot.py + Neo4j DB = CURRENT TRUTH | Design 3.2 = GUIDE for missing features

---

## 1. INSTRUCTION BUNDLES AUDIT

### What SHOULD Exist (per Design 3.2 Section 2.3):

**Design States:** "10 atomic instruction modules" for dynamic loading

**Explicitly Named (6 bundles):**
1. `cognitive_cont` - Initial System Prompt (static, fallback)
2. `knowledge_context` - Foundation: Neo4j schema + domain worldview
3. `tool_rules_core` - Foundation: MCP constraints
4. `strategy_gap_diagnosis` - Strategy: Gap Classification framework
5. `module_memory_management_noor` - Memory: Access rules
6. `module_business_language` - Normalization: Translation glossary

**Unnamed (4 bundles):** Design mentions 10 total but doesn't name remaining 4

### What EXISTS (per Supabase instruction_bundles table):

**Total:** 5 bundles, all status='active', all v1.0.0

1. ✅ `cognitive_cont` v1.0.0
2. ✅ `module_memory_management_noor` v1.0.0
3. ✅ `strategy_gap_diagnosis` v1.0.0
4. ✅ `module_business_language` v1.0.0
5. ✅ `tool_rules_core` v1.0.0

### GAP ANALYSIS:

**Missing from Supabase:**
- ❌ `knowledge_context` (Foundation bundle - contains Neo4j schema + domain worldview)

**Impact:** Step 3 (RECALL) cannot access schema documentation from bundle. Current workaround: schema hardcoded in orchestrator_zero_shot.py lines 299-400.

**Unknown 4 Bundles:** Design mentions 10 total but provides only 6 names. Remaining 4 bundles unspecified.

---

## 2. MCP TOOLS AUDIT

### What SHOULD Exist (per Design 3.2 Phase 2):

**3 Mandatory MCP Tools:**

1. **`read_neo4j_cypher(cypher_query: str) -> list[dict]`**
   - Enforces Keyset Pagination (reject SKIP/OFFSET)
   - Validates Level Integrity (detect L2↔L3 jumps)
   - Rejects embedding retrieval
   - Returns structured data (id and name only)

2. **`recall_memory(scope, query_summary, limit) -> str`**
   - Validates scope (reject 'csuite' for Noor)
   - Semantic similarity search via memory_semantic_index
   - Fallback logic: Departmental → Global
   - Returns recalled memory content

3. **`retrieve_instructions(mode: str) -> dict`**
   - Queries PostgreSQL instruction_bundles table
   - Loads bundles matching interaction mode
   - Returns XML instruction blocks

### What EXISTS (per mcp_service.py + Previous Verification):

**Confirmed Tools:**
- ✅ `recall_memory` - Memory retrieval function exists
- ✅ `retrieve_instructions` - Bundle loading exists
- ✅ `read_neo4j_cypher` - Cypher execution exists

**Constraint Enforcement (from previous read):**
- ✅ Keyset pagination enforcement
- ✅ Level integrity validation
- ✅ Scope access control

### GAP ANALYSIS:

**Implementation Status:** ✅ ALL 3 MANDATORY TOOLS EXIST

**Verification Needed:**
- ⚠️ Confirm all constraint enforcement logic matches Design 3.2 specifications
- ⚠️ Verify fallback logic (Dept → Global) in recall_memory
- ⚠️ Test retrieve_instructions bundle matching logic

---

## 3. NEO4J SCHEMA AUDIT

### What SHOULD Exist (per Design 3.2 Phase 1):

**10 Core Digital Twin Node Types (snake_case naming):**
1. `sec_objectives` - Strategic/departmental goals
2. `sec_policy_tools` - Policy types, targeted impacts
3. `ent_capabilities` - Functional competencies
4. `ent_risks` - Risk categories
5. `sec_goals` - Strategic goals at each level
6. `ent_dependencies` - Capability dependencies, resource needs
7. `perf_metrics` - Performance measurement points
8. `sec_constraints` - Boundary conditions, compliance rules
9. `ent_governance_roles` - Role definitions, authority structures
10. `sys_resources` - System/infrastructure assets

**Required Constraints:**
- Composite Key (id, year) IS NODE KEY for ALL 10 core nodes
- Memory node: (scope, key) IS UNIQUE

**Required Vector Index:**
- memory_semantic_index on Memory.embedding (1536 dimensions, cosine)

**Standard Properties:**
- id (STRING), year (INTEGER), level (L1|L2|L3), quarter (Q1|Q2|Q3|Q4)

### What EXISTS in orchestrator_zero_shot.py (lines 299-400):

**7 Primary Digital Twin Nodes (CamelCase naming):**
1. `EntityProject` (id, name, year, level, budget, progress_percentage, status)
2. `EntityCapability` (id, name, year, level, maturity_level, description)
3. `EntityRisk` (id, name, year, level, risk_score, risk_category, risk_status)
4. `EntityProcess` (id, name, year, level, efficiency_score)
5. `EntityITSystem` (id, name, year, level)
6. `EntityOrgUnit` (id, name, year, level)
7. `SectorObjective` (id, name, year, level, budget_allocated, priority_level, status)

**Additional Nodes Referenced:**
- SectorPolicyTool, SectorPerformance, SectorAdminRecord, SectorBusiness
- SectorGovEntity, SectorCitizen, SectorDataTransaction
- EntityChangeAdoption, EntityCultureHealth, EntityVendor

**Total Node Types:** ~17 types

**Level Definitions:** L1/L2/L3 hierarchy defined per node type

**Business Chains:** 3 predefined chains (SectorOps, Strategy_to_Tactics_Priority_Capabilities, Strategy_to_Tactics_Capabilities_Targets)

### What EXISTS in Neo4j DB (Verified):

**Constraints:** 35 total

**Vector Indexes:** 35 total including:
- memory_semantic_index on Memory.embedding ✅
- vector_index_entityproject on EntityProject.embedding
- vector_index_capability on EntityCapability.embedding
- vector_index_sectorobjective on SectorObjective.embedding
- (31 more)

**Memory Nodes:** 3 Memory nodes exist

### 🚨 CRITICAL DISCREPANCY:

**Schema Naming Convention Mismatch:**
- **Design 3.2 specifies:** snake_case names (`sec_objectives`, `ent_capabilities`)
- **orchestrator_zero_shot.py uses:** CamelCase names (`EntityProject`, `SectorObjective`)

**Node Count Mismatch:**
- **Design 3.2 specifies:** 10 core node types
- **orchestrator_zero_shot.py has:** ~17 node types

**Examples:**
| Design 3.2 (snake_case) | orchestrator_zero_shot.py (CamelCase) | Match? |
|---|---|---|
| `sec_objectives` | `SectorObjective` | ⚠️ Similar concept, different name |
| `ent_capabilities` | `EntityCapability` | ⚠️ Similar concept, different name |
| `ent_risks` | `EntityRisk` | ⚠️ Similar concept, different name |
| `sec_policy_tools` | `SectorPolicyTool` | ⚠️ Similar concept, different name |
| `perf_metrics` | ❌ NOT FOUND | Missing |
| `sys_resources` | ❌ NOT FOUND | Missing |
| N/A | `EntityProject` | Extra node type |
| N/A | `EntityProcess` | Extra node type |
| N/A | `EntityITSystem` | Extra node type |

**User Guidance:** *"rely on the zero shot script and the actual DB"*

**RESOLUTION:** orchestrator_zero_shot.py schema is CURRENT TRUTH. Design 3.2 snake_case naming appears to be an older or alternative specification.

### GAP ANALYSIS:

**Implementation Status:** ✅ Schema EXISTS with CamelCase naming

**Verification Needed:**
- ⚠️ Confirm 35 constraints include Composite Keys (id, year) for all node types
- ⚠️ Verify Memory node has (scope, key) UNIQUE constraint
- ⚠️ Test Level Integrity enforcement in read_neo4j_cypher

**Documentation Gap:** Design 3.2 schema specification doesn't match implemented schema

---

## 4. MCP ROUTER ARCHITECTURE AUDIT

### What SHOULD Exist (per User Clarification):

**User Statement:** *"there SHOULD be 3 mcp routers"*

**THREE MCP ROUTERS:**
1. **Noor read-only router** - For staff agent data access
2. **Maestro read/write router** - For executive agent with elevated privileges
3. **Embeddings router** - For vector/embedding operations

**Note:** These are separate from actual MCP SERVERS (neo4j-cypher, neo4j-memory, etc.)

### What Design 3.2 Specifies:

**ONE "MCP Router Service"** (per Phase 2, Section 2.2):
- Configuration-driven gateway running in `chatmodule/mcp-router`
- Manages multiple backends:
  - Local Scripts (vector_search.py, read_file.py)
  - Remote MCP Servers (neo4j-mcp via HTTP)

**Architecture:**
```
Backend App (mcp_client.py)
    ↓
MCP Router Service (single gateway)
    ↓
Multiple Backends (scripts + remote servers)
```

### What EXISTS (per Config Files):

**Found:** 1 router config file
**Location:** `backend/mcp-server/servers/mcp-router/router_config.yaml`

**Configuration:**
```yaml
backends:
  - name: neo4j-cypher
    type: http_mcp
    url: http://127.0.0.1:8080/mcp/

tools:
  - name: read_neo4j_cypher
    backend: neo4j-cypher
    policy:
      read_only: true
      max_rows: 100
      
  - name: get_neo4j_schema
    backend: neo4j-cypher
    policy:
      read_only: true

server:
  host: 127.0.0.1
  port: 8201
  transport: http
```

**Environment:**
```
MCP_ROUTER_URL="https://eun-inheritable-fiddly.ngrok-free.dev/mcp/"
```

**Runtime Status:**
- ngrok endpoint: ❌ OFFLINE (ERR_NGROK_3200)
- Local router port 8201: ❓ NOT TESTED
- Process check: No router processes found in `ps aux`

### 🚨 CRITICAL GAP:

**Architecture Requirement vs Reality:**
- **User expects:** 3 separate MCP routers (Noor read-only, Maestro read/write, Embeddings)
- **Design 3.2 describes:** 1 MCP Router Service (single gateway)
- **Implementation has:** 1 router config file

**Missing Configs:**
- ❌ Maestro read/write router config
- ❌ Embeddings router config
- ❌ Noor-specific read-only router (current config doesn't specify agent ownership)

**Documentation Gap:** Design 3.2 doesn't describe three-router architecture. User's requirement not reflected in END_STATE document.

### GAP ANALYSIS:

**Implementation Status:** ❌ INCOMPLETE - Only 1 router config exists, need 3

**Critical Questions:**
1. Should there be 3 separate router processes OR 1 router with 3 backend configurations?
2. How do Noor vs Maestro agents select their router?
3. Where should Embeddings router config be placed?

**Possible Interpretations:**
- **Interpretation A:** 3 separate router_config.yaml files (noor_router.yaml, maestro_router.yaml, embeddings_router.yaml)
- **Interpretation B:** 1 router config with 3 backend groups, agents select via routing logic

---

## 5. MEMORY ARCHITECTURE AUDIT

### What SHOULD Exist (per Design 3.2 Section 2.1):

**Dual-Layer Implementation:**
1. **Orchestrator Script (Python):** Basic checks, preprocessing
2. **LLM:** Non-orthodox qualifiers, edge cases

**Hierarchical Memory Scopes:**
- Personal (Noor R/W, Maestro R/W)
- Departmental (Noor R/O, Maestro R/W)
- Global (Noor R/O, Maestro R/W)
- C-suite (Maestro only)

**Retrieval Strategy:**
- Semantic similarity search via memory_semantic_index
- Fallback logic: Departmental → Global if no results
- Scope validation enforced by MCP tool layer

**LLM Requirements:**
- Must cite memory source (key, scope) in Step 4 synthesis

### What EXISTS:

**Neo4j:**
- ✅ memory_semantic_index exists (1536 dimensions, cosine)
- ✅ 3 Memory nodes exist
- ⚠️ Need to verify (scope, key) UNIQUE constraint

**MCP Tool:**
- ✅ recall_memory function exists in mcp_service.py
- ⚠️ Need to verify scope validation logic
- ⚠️ Need to verify fallback logic (Dept → Global)

**orchestrator_zero_shot.py:**
- ⚠️ Need to search for Step 0 (REMEMBER) implementation
- ⚠️ Need to verify orchestrator's "basic checks" before LLM

### GAP ANALYSIS:

**Implementation Status:** ⚠️ PARTIAL - Infrastructure exists, logic verification needed

**Verification Tasks:**
1. Confirm recall_memory rejects 'csuite' scope for Noor
2. Test fallback logic: Departmental → Global
3. Verify orchestrator Step 0 preprocessing logic
4. Check LLM prompt includes citing requirements

---

## 6. ORCHESTRATOR LOOP AUDIT

### What SHOULD Exist (per Design 3.2 Phase 3):

**Fixed 6-Step Cognitive Control Loop:**
- Step 0: REMEMBER (memory retrieval)
- Step 1: REQUIREMENTS (intent classification, gatekeeper)
- Step 2: RECOLLECT (bundle loading)
- Step 3: RECALL (Cypher execution)
- Step 4: RECONCILE (synthesis, gap analysis)
- Step 5: RETURN (formatting, logging)

**Quick Exit Path:** Modes D (Acquaintance) and F (Social) bypass Steps 2-4 for <0.5s latency

**Agentic MCP Architecture:** All 6 steps execute within ONE LLM inference call

**Interaction Mode Taxonomy:** 8 modes (A-H)

### What EXISTS in orchestrator_zero_shot.py:

**File:** `backend/app/services/orchestrator_zero_shot.py` (1032 lines)

**Version:** v3.6 (component version, not app version)

**Architecture:** Server-Side MCP via Groq

**Key Sections:**
- Lines 148-600: Massive static prompt (cognitive control loop, graph schema, business chains)
- Lines 299-338: `<graph_schema>` section
- Lines 338-400: `<direct_relationships>` and `<business_chains>`

**MCP Integration:**
- Uses MCP_ROUTER_URL environment variable
- Single router endpoint for all tools

### GAP ANALYSIS:

**Implementation Status:** ✅ Orchestrator EXISTS with embedded cognitive loop

**Verification Needed:**
- ⚠️ Confirm 6-step loop structure in prompt (lines 148-600)
- ⚠️ Verify Quick Exit Path logic for Modes D/F
- ⚠️ Check agentic MCP integration (single-call execution)
- ⚠️ Test 8 Interaction Mode taxonomy

**Design Alignment:** orchestrator_zero_shot.py is CURRENT TRUTH per user guidance. Design 3.2 provides guidance for missing features.

---

## 7. SUMMARY OF CRITICAL GAPS

### 🔴 CRITICAL (Blocking Issues):

1. **Schema Naming Mismatch**
   - Design 3.2: snake_case (sec_objectives, ent_capabilities)
   - Implementation: CamelCase (EntityProject, SectorObjective)
   - Impact: Documentation doesn't match reality
   - Resolution: Use orchestrator_zero_shot.py schema as truth

2. **MCP Router Architecture Incomplete**
   - **User Clarification:** "3 routers are three instances of the mcp router with different configurations and priviliges"
   - Expected: 3 router instances (Noor read-only port 8201, Maestro read/write port 8202?, Embeddings port 8203?)
   - Found: 1 router config (router_config.yaml - port 8201, read_only=true)
   - Missing: Maestro router config (read/write + c-suite access) + Embeddings router config
   - Impact: CRITICAL - Cannot enforce agent-specific privileges (Noor vs Maestro)
   - Action Required: Create maestro_router_config.yaml + embeddings_router_config.yaml

3. **MCP_ROUTER_URL Endpoint Offline**
   - Current: https://eun-inheritable-fiddly.ngrok-free.dev/mcp/ (ngrok down)
   - Impact: Orchestrator cannot connect to router
   - Action Required: Start local router on port 8201 OR update ngrok endpoint

### 🔴 CRITICAL (User Priority #4 - SUPER CRITICAL):

4. **Atomic Elements Not Extracted into Bundles**
   - **Terminology:** Atomic Elements = individual instructions/rules/examples/templates (~40+) | Bundles = collections per path (6-10)
   - **Found:** orchestrator_zero_shot.py contains 18 atomic element types with ~40+ individual rules
   - **Current State:** All atomic elements in monolithic prompt (inefficient, violates Design 3.2)
   - **Missing:** knowledge_context bundle + 4 additional bundles (cypher_query_patterns, visualization_config, mode_specific_strategies, temporal_vantage_logic)
   - **Impact:** SUPER CRITICAL - Cannot achieve 40-48% token savings per Design 3.2 architecture
   - **Action:** Extract atomic elements from orchestrator, organize into bundles, insert into Supabase
   - **User Note:** "I recall you created them (close to 40 instructions) but i do not know where you saved them if ever."

5. **Existing Bundle Contents Not Verified**
   - 5 bundles exist in Supabase but actual XML content unknown
   - Need to verify which atomic elements are in each bundle
   - Risk: Bundles might be empty, incomplete, or misaligned with orchestrator
   - Action: Query Supabase to retrieve and verify bundle contents

6. **Constraint Verification Pending**
   - 35 Neo4j constraints exist
   - Need to verify Composite Keys (id, year) for all nodes
   - Need to verify Memory (scope, key) UNIQUE constraint
   - Action: Query Neo4j constraints to confirm compliance

### 🟢 MINOR (Documentation Only):

7. **Design 3.2 Outdated**
   - Specifies 10 core nodes with snake_case
   - Implementation has ~17 nodes with CamelCase
   - Impact: None (orchestrator is truth per user)
   - Action: Document discrepancy for future reference

---

## 8. RECOMMENDED NEXT ACTIONS

### Priority 1 - MCP Router Setup (CRITICAL):

1. **Test Local Router:**
   ```bash
   curl -X POST http://127.0.0.1:8201/execute \
     -H "Content-Type: application/json" \
     -d '{"tool_name":"get_neo4j_schema","arguments":{}}'
   ```

2. **If Router Not Running, Start It:**
   - Check for router start script in `backend/mcp-server/servers/mcp-router/`
   - OR investigate how to run router from router_config.yaml

3. **Clarify Three Router Architecture with User:**
   - Should there be 3 separate router processes?
   - OR 1 router with 3 backend configurations?
   - Where should Maestro and Embeddings router configs be placed?

### Priority 2 - Verification Tasks (MODERATE):

4. **Verify Neo4j Constraints:**
   ```cypher
   SHOW CONSTRAINTS
   ```
   Check for:
   - Composite Keys (id, year) on all node types
   - Memory (scope, key) UNIQUE constraint

5. **Test MCP Tool Constraints:**
   - Test recall_memory rejects 'csuite' scope
   - Test read_neo4j_cypher rejects SKIP/OFFSET
   - Test retrieve_instructions loads correct bundles

6. **Extract knowledge_context Bundle:**
   - Copy schema from orchestrator_zero_shot.py lines 299-400
   - Create XML bundle format
   - Insert into Supabase instruction_bundles table

### Priority 3 - Documentation (LOW):

7. **Update SYSTEMATIC_AUDIT_V3.2.md:**
   - Document schema naming discrepancy
   - Note orchestrator_zero_shot.py as source of truth
   - List all findings from this gap report

8. **Create Implementation Roadmap:**
   - Based on confirmed gaps
   - Prioritize router architecture resolution
   - Include verification checklists

---

## APPENDIX A: VERIFICATION CHECKLIST

### Neo4j Schema Verification:
- [ ] Run `SHOW CONSTRAINTS` and verify Composite Keys exist
- [ ] Verify Memory (scope, key) UNIQUE constraint
- [ ] Count vector indexes: should be 35+
- [ ] Confirm memory_semantic_index exists (1536 dimensions, cosine)

### MCP Tool Verification:
- [ ] Test recall_memory with scope='csuite' (should fail for Noor)
- [ ] Test read_neo4j_cypher with SKIP keyword (should fail)
- [ ] Test retrieve_instructions with Mode B2 (should load strategy_gap_diagnosis)
- [ ] Test fallback logic in recall_memory (Dept → Global)

### Router Verification:
- [ ] Test local router: curl http://127.0.0.1:8201/execute
- [ ] Locate Maestro router config
- [ ] Locate Embeddings router config
- [ ] Update MCP_ROUTER_URL in .env (if using local)

### Bundle Verification:
- [ ] Confirm 5 bundles in Supabase are loadable
- [ ] Extract knowledge_context from orchestrator
- [ ] Clarify remaining 4 unnamed bundles

### Orchestrator Verification:
- [ ] Read orchestrator_zero_shot.py lines 148-600 (cognitive loop prompt)
- [ ] Verify 6-step structure (Step 0-5)
- [ ] Check Quick Exit Path logic (Modes D/F)
- [ ] Confirm agentic MCP integration

---

**Status:** GAP ANALYSIS COMPLETE - Ready for user review and priority decisions
