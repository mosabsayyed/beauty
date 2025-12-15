# Noor v3.2 - Systematic Audit Based on Actual State
**Date:** 2025-12-06  
**Methodology:** Design 3.2 = "what SHOULD be" | Config files + DB = "what EXISTS"

---

## 1. MCP Router Architecture Audit

### What SHOULD Exist (per Design 3.2 & User Clarification):

**THREE MCP ROUTERS:**
1. **Noor Read-Only Router** - For staff agent data access
2. **Maestro Read/Write Router** - For executive agent with elevated privileges
3. **Embeddings Router** - For vector/embedding operations

These are separate from the **MCP SERVERS** (neo4j-cypher, neo4j-memory, etc.)

### What EXISTS (per Config Files):

**Found Configs:**
- `backend/mcp-server/servers/mcp-router/router_config.yaml`

**Single Router Config Content:**
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
```

**Environment Variables (.env):**
```
MCP_ROUTER_URL="https://eun-inheritable-fiddly.ngrok-free.dev/mcp/"
```

**Runtime Status:**
- ngrok endpoint: ❌ OFFLINE
- Local router on port 8201: ❓ NOT CHECKED
- No separate Noor/Maestro/Embeddings router configs found

**GAP:**
- ❌ Missing: Maestro read/write router config
- ❌ Missing: Embeddings router config
- ❌ Current config unclear if it's for Noor or generic
- ⚠️ Only ONE router config exists, need THREE

---

## 2. Graph Schema Audit

### What EXISTS in orchestrator_zero_shot.py (Lines 299-400):

**Digital Twin Nodes:**
1. EntityProject (id, name, year, level, budget, progress_percentage, status)
2. EntityCapability (id, name, year, level, maturity_level, description)
3. EntityRisk (id, name, year, level, risk_score, risk_category, risk_status)
4. EntityProcess (id, name, year, level, efficiency_score)
5. EntityITSystem (id, name, year, level)
6. EntityOrgUnit (id, name, year, level)
7. SectorObjective (id, name, year, level, budget_allocated, priority_level, status)

**Plus referenced in relationships:**
- SectorPolicyTool
- SectorPerformance
- SectorAdminRecord
- SectorBusiness
- SectorGovEntity
- SectorCitizen
- SectorDataTransaction
- EntityChangeAdoption
- EntityCultureHealth
- EntityVendor

**Total Node Types in Schema:** ~17 types

**Level Definitions (from orchestrator):**
- L1/L2/L3 hierarchy defined for each node type
- Example: EntityProject L1=Portfolio, L2=Program, L3=Project

**Business Chains (from orchestrator):**
1. SectorOps
2. Strategy_to_Tactics_Priority_Capabilities
3. Strategy_to_Tactics_Capabilities_Targets
(Continued in file...)

### What EXISTS in Neo4j DB (Verified):

**Constraints:** 35 total
**Vector Indexes:** 35 total including:
- memory_semantic_index on Memory.embedding
- vector_index_entityproject on EntityProject.embedding
- vector_index_capability on EntityCapability.embedding
- vector_index_sectorobjective on SectorObjective.embedding
... (31 more)

**Memory Nodes:** 3 nodes exist

**GAP ANALYSIS:**
- ✅ Vector indexes exist for most node types
- ✅ Memory infrastructure exists (constraint + index + 3 nodes)
- ❓ Need to verify Composite Key constraints (id, year) per Design 3.2
- ❓ Need to compare 17 node types in schema vs 35 vector indexes

---

## 3. Instruction Bundles Audit

### What EXISTS in Supabase (Verified):

**Total Bundles:** 5
**All Status:** active

1. `cognitive_cont` v1.0.0
2. `module_memory_management_noor` v1.0.0
3. `strategy_gap_diagnosis` v1.0.0
4. `module_business_language` v1.0.0
5. `tool_rules_core` v1.0.0

### What SHOULD Exist (per Design 3.2 Section 2.3):

**From END_STATE "How to Access Information" doc:**
The system mentions "10 atomic instruction modules" for dynamic loading.

**Need to Extract from Design 3.2:**
- [ ] Read Section 2.3 (STEP 2: RECOLLECT) for complete bundle list
- [ ] Identify which 5 additional bundles are missing

**PRELIMINARY GAP:**
- ✅ 5 critical bundles exist
- ❌ ~5 bundles potentially missing (need Design 3.2 confirmation)

---

## 4. Step 0 (REMEMBER) Implementation Audit

### What SHOULD Exist (per Design 3.2 + User Clarification):

**Dual-Layer Implementation:**
1. **Orchestrator Script (Python):** Basic checks, preprocessing
2. **LLM:** Non-orthodox qualifiers, edge cases

**MCP Tool:** `recall_memory(scope, query_summary, limit)`

**Requirements:**
- Semantic similarity search via Neo4j vector index
- Scope validation (reject 'csuite' for Noor)
- Fallback logic: Departmental → Global

### What EXISTS:

**In orchestrator_zero_shot.py:**
❓ Need to search for Step 0 implementation

**In mcp_service.py:**
✅ recall_memory function exists (verified earlier)

**In Neo4j:**
✅ memory_semantic_index exists
✅ 3 Memory nodes exist

**GAP:**
- ❓ Need to verify orchestrator script's "basic checks" implementation
- ❓ Need to verify LLM prompt includes "non-orthodox qualifiers" instructions

---

## 5. Current Orchestrator Status

### orchestrator_zero_shot.py (v3.6):

**Version:** v3.6 (component version)
**Lines:** 1032 total
**Architecture:** Server-Side MCP via Groq

**Key Sections Found:**
- Lines 148-600: Massive static prompt (cognitive control loop, graph schema, business chains)
- Lines 299-338: `<graph_schema>` section
- Lines 338-400: `<direct_relationships>` and `<business_chains>`

**MCP Integration:**
- Uses `MCP_ROUTER_URL` environment variable
- Single router endpoint for all tools

**QUESTION:**
- Does this represent Design 3.2 compliant implementation?
- Or is this the "old monolithic pattern" that needs refactoring?

User said: *"rely on the zero shot script and the actual DB. The design will help u in what is not there (memory)"*

**INTERPRETATION:**
- ✅ orchestrator_zero_shot.py is the CURRENT TRUTH for what's implemented
- ✅ DB state is CURRENT TRUTH for data
- ⚠️ Design 3.2 is GUIDE for features NOT YET implemented (especially memory features)

---

## 6. MCP Service Layer Audit

### What EXISTS (from previous grep):

**File:** `backend/app/services/mcp_service.py`

**MCP Tools Defined:**
1. ✅ `recall_memory` - Memory retrieval
2. ✅ `retrieve_instructions` - Dynamic bundle loading
3. ✅ `read_neo4j_cypher` - Cypher execution

**Constraint Enforcement (from previous read):**
- Keyset pagination (reject SKIP/OFFSET)
- Level integrity validation
- Scope access control (reject csuite for Noor)

**MCP_TOOL_DEFINITIONS:** Exported for orchestrator use

---

## 7. DESIGN 3.2 EXTRACTION RESULTS ✅

### Question 1: Complete Bundle List ✅ EXTRACTED

**From END_STATE Section 2.3 (STEP 2: RECOLLECT):**

**EXPLICITLY MENTIONED (6 bundles):**
1. `cognitive_cont` - Initial System Prompt (static, fallback bundle)
2. `knowledge_context` - Foundation: Neo4j schema + domain worldview map (Step 3)
3. `tool_rules_core` - Foundation: MCP tool constraints (Keyset Pagination, Level Integrity)
4. `strategy_gap_diagnosis` - Strategy: Gap Classification + "Absence is signal" framework (Step 4)
5. `module_memory_management_noor` - Memory: Memory access rules (Personal R/W, Dept/Global R/O) (Step 0 + 5)
6. `module_business_language` - Normalization: Technical→Business translation glossary

**STATUS:** Design states "10 atomic instruction modules" but only explicitly names 6 bundles.

**SUPABASE HAS 5 BUNDLES:**
1. ✅ `cognitive_cont` v1.0.0
2. ✅ `module_memory_management_noor` v1.0.0
3. ✅ `strategy_gap_diagnosis` v1.0.0
4. ✅ `module_business_language` v1.0.0
5. ✅ `tool_rules_core` v1.0.0

**MISSING FROM SUPABASE:**
- ❌ `knowledge_context` (Foundation bundle with Neo4j schema)

**UNKNOWN 4 BUNDLES:** Design mentions 10 total but doesn't explicitly name remaining 4.

---

### Question 2: MCP Tool Complete Specs ✅ EXTRACTED

**From END_STATE Phase 2 (MCP Tool Layer Development):**

**3 MANDATORY MCP TOOLS:**

1. **`read_neo4j_cypher(cypher_query: str) -> list[dict]`**
   - **Purpose:** Step 3 (RECALL) - Execute Cypher queries with constraint enforcement
   - **Constraints Enforced:**
     - ✅ Keyset Pagination (REJECT SKIP/OFFSET keywords)
     - ✅ Level Integrity (detect L2↔L3 jumps)
     - ✅ No Embedding Retrieval (reject embedding properties)
   - **Return:** Structured data (id and name only)

2. **`recall_memory(scope: Literal['personal', 'departmental', 'global'], query_summary: str, limit: int = 5) -> str`**
   - **Purpose:** Step 0 (REMEMBER) - Hierarchical memory retrieval
   - **Constraints Enforced:**
     - ✅ Scope Validation (REJECT 'csuite' for Noor)
     - ✅ Semantic Similarity Search via memory_semantic_index
     - ✅ Fallback Logic (Departmental → Global if no results)
   - **Return:** Recalled memory content

3. **`retrieve_instructions(mode: str) -> dict`**
   - **Purpose:** Step 2 (RECOLLECT) - Dynamic bundle loading
   - **Action:** Query PostgreSQL instruction_bundles table for bundles matching mode
   - **Return:** Bundles content (XML instruction blocks)

**NOTED:** Design mentions "4 Mandatory Tools" including optional utility tools (e.g., read_file).

---

### Question 3: Neo4j Schema Requirements ✅ EXTRACTED

**From END_STATE Phase 1 + AGENT_CONCERNS_RESOLUTION:**

**10 CORE DIGITAL TWIN NODE TYPES (per AGENT_CONCERNS):**
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

**REQUIRED CONSTRAINTS:**
- ✅ Composite Key (id, year) IS NODE KEY for ALL 10 core node types
- ✅ Memory node: (scope, key) IS UNIQUE

**REQUIRED VECTOR INDEX:**
- ✅ `memory_semantic_index` on Memory.embedding (1536 dimensions, cosine similarity)

**STANDARD PROPERTIES (all nodes):**
- id (STRING), year (INTEGER), level (L1|L2|L3), quarter (Q1|Q2|Q3|Q4)

**🚨 CRITICAL DISCREPANCY FOUND:**

**orchestrator_zero_shot.py (lines 299-400) has DIFFERENT schema:**
- Uses `EntityProject`, `EntityCapability`, `EntityRisk`, `EntityProcess`, `EntityITSystem`, `EntityOrgUnit`, `SectorObjective`
- ~17 node types total (not 10)
- Uses camelCase (Entity/Sector) NOT snake_case (ent_/sec_)

**QUESTION:** Which schema is correct?
- Design 3.2 specifies: sec_objectives, ent_capabilities (snake_case)
- orchestrator_zero_shot.py has: EntityProject, SectorObjective (CamelCase)

**USER SAID:** "rely on the zero shot script and the actual DB. The design will help u in what is not there"

**INTERPRETATION:** orchestrator_zero_shot.py graph schema = CURRENT TRUTH | Design 3.2 = GUIDANCE for missing features

---

### Question 4: Memory Architecture ✅ EXTRACTED

**From END_STATE Section 2.1 (Step 0: REMEMBER):**

**DUAL-LAYER IMPLEMENTATION:**
1. **Orchestrator Script (Python):** Basic checks, preprocessing
2. **LLM:** Non-orthodox qualifiers, edge cases

**HIERARCHICAL MEMORY SCOPES:**
- Personal (Noor R/W)
- Departmental (Noor R/O, Maestro R/W)
- Global (Noor R/O, Maestro R/W)
- C-suite (Maestro only)

**RETRIEVAL STRATEGY:**
- Semantic similarity search via Neo4j vector index
- Fallback: Departmental → Global if no results
- Scope validation enforced by MCP tool (not LLM prompt)

**CITING REQUIREMENT:**
- LLM must cite memory source (key, scope) in Step 4 synthesis if used

---

### Question 5: Three Router Specifications ❓ NOT FOUND YET

**From User Clarification:**
- THREE MCP ROUTERS should exist (separate from MCP servers)
- Noor read-only router (for staff agent)
- Maestro read/write router (for executive agent with elevated privileges)
- Embeddings router (for vector/embedding operations)

**SEARCH STATUS:** Need to search Design 3.2 for router architecture specifications

---

## Next Actions (Priority Order)

### 1. Navigate Design 3.2 Using "How To" Doc (~30 min)
- [ ] Extract complete bundle list from Section 2.3
- [ ] Extract complete MCP tool specs from Section 3.1
- [ ] Extract Neo4j schema requirements from Section 3.2
- [ ] Find THREE router architecture specifications

### 2. Complete Gap Analysis (~20 min)
- [ ] Bundles: Required vs Existing (5 vs ?)
- [ ] MCP Tools: Spec vs Implementation
- [ ] Neo4j Schema: Required vs 35 constraints/indexes
- [ ] Routers: 3 required vs 1 config found

### 3. Verify Runtime State (~15 min)
- [ ] Check if local MCP router on port 8201 is running
- [ ] Verify which MCP servers are actually operational
- [ ] Test orchestrator connection to router

### 4. Document Findings (~15 min)
- [ ] Create evidence-based gap report
- [ ] List specific missing components
- [ ] Provide implementation roadmap

**Total Estimated Time:** ~1.5 hours

---

## Lessons Applied

1. ✅ THREE MCP ROUTERS are separate architectural components (not server directories)
2. ✅ Referring to Design 3.2 for "what should be"
3. ✅ Referring to config files + DB for "what exists"
4. ✅ Understanding orchestrator v3.6 is component version, v3.2 is app version
5. ✅ Using orchestrator_zero_shot.py + DB as current truth
6. ✅ Using Design 3.2 for guidance on what's NOT implemented yet

---

**Status:** AUDIT IN PROGRESS - Ready to navigate Design 3.2 document systematically
