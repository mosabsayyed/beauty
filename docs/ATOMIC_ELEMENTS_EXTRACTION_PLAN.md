# 🚨 CRITICAL: Atomic Elements Extraction & Bundle Creation Plan
**Date:** 2025-12-06  
**Priority:** SUPER CRITICAL (User Priority #4)

---

## TERMINOLOGY ALIGNMENT ✅

**Atomic Elements** = Individual instructions/rules/examples/templates (MANY ~40+)  
**Bundles** = Collections of atomic elements organized per execution path (6-10 bundles)

**Source:** orchestrator_zero_shot.py prompt contains ALL atomic elements  
**Target:** PostgreSQL instruction_bundles table (currently has 5 bundles)

---

## ATOMIC ELEMENTS INVENTORY (from orchestrator_zero_shot.py)

**Found 18 Atomic Element Types:**

### Cognitive Architecture (5):
1. `<system_mission>` - Role definition, bias for action, vantage point logic
2. `<cognitive_control_loop>` - 5-step loop (REQUIREMENTS → RECOLLECT → RECALL → RECONCILE → RETURN)
3. `<interaction_modes>` - 8 modes (A-H) classification taxonomy
4. `<output_format>` - Response structure and formatting rules
5. `<response_template>` - JSON structure template

### Graph Knowledge (4):
6. `<graph_schema>` - Node types (EntityProject, EntityCapability, etc.) and properties
7. `<level_definitions>` - L1/L2/L3 hierarchy per node type
8. `<direct_relationships>` - Direct node-to-node relationships (same-level only)
9. `<business_chains>` - 7 predefined multi-hop paths for indirect relations

### Data Quality (2):
10. `<data_integrity_rules>` - Composite keys, level alignment, temporal filtering
11. `<data_structure_rules>` - Result set flattening, network graph prohibition

### Query Construction (3):
12. `<vector_strategy>` - 2 templates (Concept Search, Inference/Similarity)
13. `<cypher_examples>` - 3 optimized patterns (Retrieval, Impact Analysis, Portfolio Health)
14. `<tool_rules>` - 16 rules for read_neo4j_cypher tool usage

### Interface (4):
15. `<interface_contract>` - Markdown + RAW JSON output requirements
16. `<visualization_schema>` - Chart types and config structure
17. `<file_handling>` - read_file tool usage when files attached
18. `<b>` - Special marker (unclear purpose - need investigation)

**Total Estimated Atomic Elements:** ~40+ individual rules/examples/templates within these 18 sections

---

## CURRENT BUNDLE STATE (Supabase)

**5 Existing Bundles:**
1. `cognitive_cont` v1.0.0 - status: active
2. `module_memory_management_noor` v1.0.0 - status: active
3. `strategy_gap_diagnosis` v1.0.0 - status: active
4. `module_business_language` v1.0.0 - status: active
5. `tool_rules_core` v1.0.0 - status: active

**Bundle Contents (Need Verification):**
- ⚠️ Need to query Supabase to see actual XML content
- ⚠️ Need to verify which atomic elements are in each bundle
- ⚠️ Need to identify which atomic elements are missing from bundles

---

## DESIGN 3.2 BUNDLE SPECIFICATION

**6 Named Bundles (from Design 3.2):**
1. `cognitive_cont` ✅ EXISTS - Initial System Prompt (static, fallback)
2. `knowledge_context` ❌ MISSING - Neo4j schema + domain worldview
3. `tool_rules_core` ✅ EXISTS - MCP tool constraints
4. `strategy_gap_diagnosis` ✅ EXISTS - Gap Classification framework
5. `module_memory_management_noor` ✅ EXISTS - Memory access rules
6. `module_business_language` ✅ EXISTS - Translation glossary

**Design States:** "10 atomic modules" but only names 6

---

## ATOMIC ELEMENTS → BUNDLES MAPPING (PROPOSED)

### Bundle 1: `cognitive_cont` (Foundation - ALWAYS LOADED)
**Atomic Elements:**
- `<system_mission>`
- `<cognitive_control_loop>`
- `<interaction_modes>`
- `<output_format>`
- `<response_template>`
- `<interface_contract>`
- `<data_structure_rules>`

**Purpose:** Core cognitive architecture and output formatting

---

### Bundle 2: `knowledge_context` (Foundation - MISSING)
**Atomic Elements:**
- `<graph_schema>`
- `<level_definitions>`
- `<direct_relationships>`
- `<business_chains>`
- `<data_integrity_rules>`

**Purpose:** Complete graph ontology and relationship map  
**Status:** ❌ CRITICAL - Must be extracted and created

---

### Bundle 3: `tool_rules_core` (Foundation - EXISTS)
**Atomic Elements:**
- `<tool_rules>` (16 rules for read_neo4j_cypher)
- `<file_handling>` (read_file tool rules)

**Purpose:** MCP tool usage constraints and best practices  
**Status:** ✅ EXISTS - Verify content matches orchestrator

---

### Bundle 4: `strategy_gap_diagnosis` (Strategy - EXISTS)
**Atomic Elements:**
- Gap Classification rules (4 types: Level Mismatch, Temporal Gap, Direct Relationship Missing, Structural Gap)
- "Absence is signal, not silence" framework
- Gap severity scoring

**Purpose:** Step 4 (RECONCILE) gap analysis protocol  
**Status:** ✅ EXISTS - Verify content

---

### Bundle 5: `module_memory_management_noor` (Memory - EXISTS)
**Atomic Elements:**
- Hierarchical memory scope rules (Personal R/W, Dept/Global R/O, C-suite forbidden)
- Semantic retrieval strategy
- Fallback logic (Dept → Global)
- Memory citation requirements

**Purpose:** Step 0 (REMEMBER) memory access protocol  
**Status:** ✅ EXISTS - Verify content

---

### Bundle 6: `module_business_language` (Normalization - EXISTS)
**Atomic Elements:**
- Technical-to-business translation glossary
- Forbidden terms: "Node", "Cypher", "L3", "ID", "Query"
- Business equivalents: "L3" → "Function", "EntityProject L3" → "Project Output"

**Purpose:** Step 4 (RECONCILE) language normalization  
**Status:** ✅ EXISTS - Verify content

---

### Bundle 7: `cypher_query_patterns` (Execution - PROPOSED NEW)
**Atomic Elements:**
- `<cypher_examples>` (3 patterns: Optimized Retrieval, Impact Analysis, Safe Portfolio Health)
- `<vector_strategy>` (2 templates: Concept Search, Inference)
- Query optimization rules
- Keyset pagination examples

**Purpose:** Step 3 (RECALL) query construction guidance  
**Status:** ❌ MISSING - Should be created

---

### Bundle 8: `visualization_config` (Presentation - PROPOSED NEW)
**Atomic Elements:**
- `<visualization_schema>` (Chart types: column, line, radar, bubble, bullet, combo, table, html)
- Chart configuration rules
- Data structure formatting

**Purpose:** Step 5 (RETURN) visualization generation  
**Status:** ❌ MISSING - Should be created

---

### Bundle 9: `mode_specific_strategies` (Conditional - PROPOSED NEW)
**Atomic Elements:**
- Mode A (Simple Query) specific rules
- Mode B (Complex Analysis) specific rules
- Mode G (Continuation) specific rules
- Quick Exit Path logic for Modes D/F

**Purpose:** Mode-specific execution strategies  
**Status:** ❌ MISSING - Should be created

---

### Bundle 10: `temporal_vantage_logic` (Context - PROPOSED NEW)
**Atomic Elements:**
- Vantage Point logic (using `<datetoday>` as reference)
- Active vs Planned project classification
- Start date filtering rules
- Temporal gap detection

**Purpose:** Temporal reasoning and project status determination  
**Status:** ❌ MISSING - Should be created

---

## 🔴 CRITICAL GAPS IDENTIFIED

### Gap 1: knowledge_context Bundle MISSING ✅ CONFIRMED
**Impact:** HIGH - Schema must be hardcoded in orchestrator instead of loaded dynamically  
**Atomic Elements Affected:** 5 (graph_schema, level_definitions, direct_relationships, business_chains, data_integrity_rules)  
**Action:** Extract from orchestrator_zero_shot.py lines 299-400, format as XML bundle, insert into Supabase

### Gap 2: 4 Additional Bundles NOT CREATED
**Missing Bundles:**
- `cypher_query_patterns` (execution guidance)
- `visualization_config` (presentation rules)
- `mode_specific_strategies` (conditional logic)
- `temporal_vantage_logic` (temporal reasoning)

**Impact:** MODERATE - Currently all atomic elements are in monolithic prompt (inefficient)  
**Action:** Extract relevant atomic elements, organize into bundles, insert into Supabase

### Gap 3: Existing Bundle Contents NOT VERIFIED
**Status:** 5 bundles exist in Supabase but actual XML content unknown  
**Risk:** Bundles might be empty, incomplete, or misaligned with orchestrator  
**Action:** Query Supabase to retrieve bundle content, compare with orchestrator atomic elements

---

## VERIFICATION TASKS (Priority Order)

### Priority 1 - Database Verification (IMMEDIATE):
```bash
# 1. Check Neo4j constraints for Composite Keys
docker exec -it neo4j-container cypher-shell -u neo4j -p Aam@12345 "SHOW CONSTRAINTS"

# 2. Query Supabase for bundle contents
# Connect to Supabase and run:
SELECT tag, LENGTH(content) as content_length, version, status 
FROM instruction_bundles 
ORDER BY tag;

# Then retrieve full content:
SELECT tag, content FROM instruction_bundles WHERE tag = 'knowledge_context';
```

### Priority 2 - Atomic Element Extraction (CRITICAL):
1. **Extract knowledge_context Bundle:**
   - Source: orchestrator_zero_shot.py lines 299-452
   - Sections: graph_schema, level_definitions, direct_relationships, business_chains, data_integrity_rules
   - Format: XML INSTRUCTION_BUNDLE structure
   - Insert: Supabase instruction_bundles table

2. **Extract Remaining Atomic Elements:**
   - `<cypher_examples>` → cypher_query_patterns bundle
   - `<visualization_schema>` → visualization_config bundle
   - `<interaction_modes>` (mode-specific rules) → mode_specific_strategies bundle
   - Vantage Point logic → temporal_vantage_logic bundle

### Priority 3 - Bundle Content Verification:
- Compare existing 5 bundles with orchestrator atomic elements
- Identify mismatches or missing rules
- Update bundles if needed

---

## THREE MCP ROUTERS ARCHITECTURE 🔴 CRITICAL

### Current State:
**1 Router Config Found:** `backend/mcp-server/servers/mcp-router/router_config.yaml`
- Tools: read_neo4j_cypher, get_neo4j_schema
- Backend: neo4j-cypher at http://127.0.0.1:8080/mcp/
- Port: 8201
- Policy: read_only=true

### Required State (User Clarification):
**3 MCP Router Instances with Different Configs:**

1. **Noor Router (Read-Only)** ✅ PARTIALLY EXISTS
   - Current: router_config.yaml (port 8201)
   - Agent: Noor (Staff Agent)
   - Privileges: Read-only access to Neo4j
   - Tools: read_neo4j_cypher, get_neo4j_schema, recall_memory (personal R/W, dept/global R/O)
   - Status: EXISTS but needs verification of scope constraints

2. **Maestro Router (Read/Write)** ❌ MISSING
   - Target File: `maestro_router_config.yaml` OR `router_config_maestro.yaml`
   - Agent: Maestro (Executive Agent)
   - Privileges: Read/write access to Neo4j + ALL memory scopes (including c-suite)
   - Tools: read_neo4j_cypher, write_neo4j_cypher(?), recall_memory (all scopes), save_memory (all scopes)
   - Port: TBD (8202?)
   - Status: MUST BE CREATED

3. **Embeddings Router** ❌ MISSING
   - Target File: `embeddings_router_config.yaml` OR `router_config_embeddings.yaml`
   - Purpose: Vector/embedding operations
   - Tools: generate_embedding, vector_search, similarity_query
   - Port: TBD (8203?)
   - Backend: TBD (separate embedding service?)
   - Status: MUST BE CREATED

### Architecture Questions for User:
1. Should Maestro router be on a different port (8202) or same port with different routing logic?
2. Where should the 2 new router configs be placed? Same directory or separate?
3. Does Embeddings router need a separate backend service or can it use existing neo4j-memory?
4. How do agents select which router to use? Via environment variable or config?

---

## SCRIPTS STATUS ✅ CONFIRMED

**User activated servers using:**
- `sb.sh` - Backend server
- `sb.sh` - backend + MCP (routers + Neo4j MCP server)
- `sf1.sh` - Frontend server

**Next Action:** Test router endpoints after understanding correct ports

---

## IMMEDIATE ACTION PLAN

### Step 1: Verify Database Constraints (5 min)
```bash
# Test Neo4j connection and check constraints
./sb.sh --fg
# Then in another terminal:
docker exec -it <neo4j-container> cypher-shell -u neo4j -p Aam@12345 "SHOW CONSTRAINTS" | head -40
```

### Step 2: Query Supabase Bundles (5 min)
```sql
-- Retrieve bundle contents
SELECT tag, LEFT(content, 200) as content_preview, version, status, avg_tokens
FROM instruction_bundles 
ORDER BY tag;
```

### Step 3: Extract knowledge_context Bundle (30 min)
- Read orchestrator_zero_shot.py lines 299-452
- Format as XML INSTRUCTION_BUNDLE
- Insert into Supabase with tag='knowledge_context', version='1.0.0', status='active'

### Step 4: Create Maestro Router Config (15 min)
- Copy router_config.yaml → maestro_router_config.yaml
- Update port to 8202
- Add write privileges
- Add c-suite memory access

### Step 5: Create Embeddings Router Config (15 min)
- Create embeddings_router_config.yaml
- Define embedding tools
- Configure backend service

### Step 6: Test All 3 Routers (10 min)
```bash
# Test Noor router (port 8201)
curl -X POST http://127.0.0.1:8201/execute -H "Content-Type: application/json" -d '{"tool_name":"get_neo4j_schema","arguments":{}}'

# Test Maestro router (port 8202)
curl -X POST http://127.0.0.1:8202/execute -H "Content-Type: application/json" -d '{"tool_name":"get_neo4j_schema","arguments":{}}'

# Test Embeddings router (port 8203)
curl -X POST http://127.0.0.1:8203/execute -H "Content-Type: application/json" -d '{"tool_name":"generate_embedding","arguments":{"text":"test"}}'
```

---

## QUESTIONS FOR USER (BLOCKING)

### Q1: Bundle Creation History
**You mentioned:** "I recall you created them (close to 40 instructions) but i do not know where you saved them if ever."

**Questions:**
1. Were these 40 atomic elements extracted and formatted as bundles previously?
2. If yes, in which format? (XML, JSON, SQL?)
3. Should I search workspace for any bundle creation files?
4. Or should I extract fresh from orchestrator_zero_shot.py?

### Q2: Router Architecture Details
**You clarified:** "3 routers are three instances of the mcp router with different configurations and priviliges"

**Questions:**
1. Should all 3 routers run on different ports (8201, 8202, 8203)?
2. Or should they run on same port with request-based routing (via agent_id)?
3. Where should maestro_router_config.yaml be placed?
4. Does Embeddings router need a separate backend service or use existing neo4j-memory?

### Q3: Verification Priority
**You prioritized:** "1- the script and then the LIVE DATABASE - DONT FORGET"

**Action Confirmation:**
1. Verify orchestrator_zero_shot.py atomic elements first ✅
2. Then verify Neo4j constraints (Composite Keys) ✅
3. Then verify Supabase bundle contents ✅
4. Correct order?

---

**Status:** READY FOR USER INPUT - Blocking on Bundle Creation History and Router Architecture Details
