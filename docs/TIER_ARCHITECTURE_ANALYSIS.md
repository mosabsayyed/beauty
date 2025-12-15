# Tier Architecture Analysis - v3.4

## Framework Definition

| Tier | Role | Loading Rule | **Loader** | Analogy |
|------|------|--------------|------------|---------|
| **Tier 1** | ROUTER | ALWAYS loaded | **Python (orchestrator)** → sent TO LLM | Traffic controller |
| **Tier 2** | ORCHESTRATOR | ALWAYS loaded IF mode is A/B/C/D | **LLM calls MCP** → fetched BY LLM | Conductor |
| **Tier 3** | LIBRARY | CONDITIONAL - only when needed | **LLM calls MCP** → fetched BY LLM | Reference books |

### CRITICAL: Loading Model Distinction
```
Tier 1: orchestrator_maestro.py loads from DB → sends as system prompt → LLM receives
Tier 2/3: LLM decides → calls retrieve_instructions() MCP → receives elements
```
**Tier 1 is NOT fetched by LLM.** It is injected by Python before the LLM runs.

### Tier Placement Rule
> If there is NO scenario where an element is NOT needed for data modes → it belongs in Tier 1 or 2, NOT Tier 3.

---

## CURRENT STATE

### Storage Locations
| Location | Content | Count |
|----------|---------|-------|
| `instruction_elements` table | Tier 1 | 13 elements |
| `instruction_elements` table | Tier 2 | 10 elements |
| `instruction_elements` table | Tier 3 | 64 elements |

Notes:
- Tier 1 is injected by Python (orchestrator) from DB.
- Tier 2/3 are fetched by the LLM via `retrieve_instructions()`.

### Tier 3 Breakdown (ACTUAL - from instruction_elements table)
| Category | Count | Elements |
|----------|-------|----------|
| **Node Schemas** | 17 | EntityProject, EntityCapability, EntityRisk, EntityOrgUnit, EntityITSystem, EntityProcess, EntityVendor, EntityCultureHealth, EntityChangeAdoption, SectorObjective, SectorPolicyTool, SectorPerformance, SectorAdminRecord, SectorBusiness, SectorGovEntity, SectorCitizen, SectorDataTransaction |
| **Relationship Schemas** | 27 | MONITORED_BY, OPERATES, CLOSE_GAPS, CONTRIBUTES_TO, REALIZED_VIA, GOVERNED_BY, CASCADED_VIA, REFERS_TO, APPLIED_ON, TRIGGERS_EVENT, MEASURED_BY, AGGREGATES_TO, INFORMS, SETS_PRIORITIES, SETS_TARGETS, EXECUTES, REPORTS, ROLE_GAPS, KNOWLEDGE_GAPS, AUTOMATION_GAPS, MONITORS_FOR, APPLY, AUTOMATION, DEPENDS_ON, GAPS_SCOPE, ADOPTION_RISKS, INCREASE_ADOPTION |
| **Business Chain Elements** | 7 | business_chain_SectorOps, business_chain_Strategy_to_Tactics_Priority, business_chain_Strategy_to_Tactics_Targets, business_chain_Tactical_to_Strategy, business_chain_Risk_Build_Mode, business_chain_Risk_Operate_Mode, business_chain_Internal_Efficiency |
| **Chart Type Schemas** | 9 | chart_type_Column, chart_type_Line, chart_type_Table, chart_type_Pie, chart_type_Radar, chart_type_Scatter, chart_type_Bubble, chart_type_Combo, chart_type_Html |
| **Query Patterns** | 3 | vector_strategy, optimized_retrieval, impact_analysis |
| **Cypher Examples** | 1 | cypher_examples |
| **TOTAL** | **64** | |

---

## PROMPT QUALITY ISSUES

### Problem: Written as Documentation, Not as Agent Instructions

**Current Pattern (Documentation Style):**
```
Memory scopes (Maestro has FULL access including secrets):
1. Personal — User's conversation history and preferences (user-scoped)
2. Departmental — Department-level facts and patterns (department-scoped)
...
Cost: ~150-300 tokens per call (returns matched entities and relations only)
Storage: Neo4j as Entity/Relation/Observations graphs partitioned by scope
```

**Required Pattern (Prompt Architect Style):**
```
MEMORY RECALL
Tool: recall_memory(scope, query_summary, limit=5)
Scopes: personal | departmental | ministry | secrets
When: Call BEFORE graph queries if user context would improve results.
Action: Inject retrieved memories into your reasoning.
```

### Fat to Remove (Zero Value to LLM):

### 🔴 CURRENT OPEN ISSUES (DB-Backed Architecture)

### 🔴 ISSUE 1: Tier 1 ↔ Tier 2 numbering collisions
Tier 1 and Tier 2 currently share numeric prefixes `0.1`..`0.5` (e.g., `0.1_mode_classification` vs `0.1_step1_requirements`), which breaks deterministic assembly order in any workflow that sorts across tiers by the `element` key.

### 🔴 ISSUE 2: Tier 3 element ordering is not deterministic-by-design
Tier 3 element names are not numeric-prefixed (they are semantic names like `EntityRisk`, `AUTOMATION_GAPS`, `business_chain_*`, `chart_type_*`), so ordering is purely lexicographic and not aligned to any intended “schema → query → response” reading order.

### 🔴 ISSUE 3: Metadata columns exist but are not populated
The `dependencies` and `use_cases` columns are present in the schema, but the current Tier 1/2/3 insert workflows do not populate them, which blocks programmatic validation and safe automated retrieval planning.
|-----------|-------|----------|
| Pattern + Desc + Usage + Domain | 23 | Most relationships |
| Pattern + Desc + Usage + KeyRule | 3 | MONITORED_BY, OPERATES, CLOSE_GAPS |
| Pattern + Desc + Usage only | 1 | CONTRIBUTES_TO |

**Problem**: Inconsistent structure makes LLM parsing unpredictable

### 🔴 ISSUE 9: Tier 1 References Non-Existent Elements
Tier 1 (hardcoded) tells LLM to load elements that don't exist:
```
elements=["EntityProject", "data_integrity_rules", "optimized_retrieval", "tool_rules_core"]
```
- `data_integrity_rules` - NOT in Tier 3
- `tool_rules_core` - NOT in Tier 3

### 🔴 ISSUE 10: Memory Instructions Have Fat and Inaccuracies

**Actual Memory Design (from mcp_service_maestro.py):**
```python
recall_memory(scope, query_summary, limit=5, user_id=None)
```
- 4 distinct scopes: personal, departmental, ministry, secrets
- Scopes are INDEPENDENT - no hierarchy, no fallback
- READ-ONLY - no save_memory capability
- Maestro allowed: all 4 scopes | Noor: TBD based on mcp_service.py

**Current Tier 1 Memory Content (Hardcoded - lines 101-115):**
```
MEMORY INTEGRATION (Available to All Modes - Query Optionally)
Semantic memory available via recall_memory(scope="personal|departmental|ministry|secrets", query_summary="...")
Memory scopes (Maestro has FULL access including secrets):
1. Personal — User's conversation history and preferences (user-scoped)
2. Departmental — Department-level facts and patterns (department-scoped)
3. Ministry — Ministry-level strategic information (ministry-scoped)
4. Secrets — Classified information (admin-only, Maestro has access)
Call pattern: recall_memory(scope="personal", query_summary="<specific context for recall>")
Cost: ~150-300 tokens per call (returns matched entities and relations only)
Storage: Neo4j as Entity/Relation/Observations graphs partitioned by scope
NOTE: Maestro has access to ALL scopes including secrets.
```

**Problems with current Tier 1 Memory content:**
1. "Cost: ~150-300 tokens per call" - USELESS to LLM, remove
2. "Storage: Neo4j as Entity/Relation/Observations" - USELESS to LLM, remove
3. "Maestro has FULL access" stated TWICE (header + note) - redundant
4. "(admin-only, Maestro has access)" on Secrets - restates the obvious
5. Written as documentation, NOT as prompt architecture
6. Missing: WHEN to call (decision trigger), WHAT to do with results

**Recommended Memory Prompt (Action-Oriented):**
```
MEMORY RECALL
Tool: recall_memory(scope, query_summary, limit=5)
Scopes: personal | departmental | ministry | secrets
When: Call BEFORE graph queries if user context would improve results.
Action: Inject retrieved memories into your reasoning. Do not cite memory IDs.
```

---

## RECOMMENDED ARCHITECTURE

### Tier 1 (Router) - ~600 tokens
Should contain ONLY:
1. **Identity/Role** - Who is Maestro
2. **Mode Classification** - The A-J mode list
3. **Routing Logic** - IF data mode → load Tier 2, ELSE respond directly
4. **Output Format** - JSON structure
5. **Critical Rules** - Business language, no streaming, etc.

### Tier 2 (Orchestrator) - Should be ATOMIC elements
Break into these elements (all with tier='2'):
1. `step1_requirements` - Memory call, foundational levels
2. `step2_recollect` - Tool execution rules, schema filtering
3. `step3_recall` - Cypher translation, proactive gap check
4. `step4_reconcile` - Validation, named entity verification
5. `step5_respond` - Language guardrail, gap visualization
6. `gap_type_definitions` - The 4 gap types
7. `data_integrity_rules` - GOLDEN SCHEMA rules
8. `level_definitions` - L1/L2/L3 meanings per node type
9. `tool_execution_rules` - Keyset pagination, aggregation first
10. `graph_schema_summary` - Overview of all nodes/relationships

**View**: Create `tier2_combined` view that aggregates all tier='2' elements

### Tier 3 (Library) - Conditional elements only
Should contain ONLY items with optional paths:
- **Node Schemas** (17) - Only load when that node is queried
- **Relationship Schemas** (27) - Only load for specific traversals
- **Business Chains** (7) - Only load for multi-hop analysis
- **Visualization Schemas** (10) - Only load when visualization needed
- **Query Patterns** (3) - Load based on query complexity

---

## SEAMLESS INTEGRATION MATRIX

### Step-to-Element Mapping

| Step | Tier 1 (Router) | Tier 2 (Orchestrator) | Tier 3 (Library) |
|------|-----------------|----------------------|------------------|
| **Step 0: Classify** | Mode classification | - | - |
| **Step 1: Requirements** | Routing logic | step1_requirements, gap_type_definitions, level_definitions | - |
| **Step 2: Recollect** | Element selection examples | step2_recollect, tool_execution_rules, graph_schema_summary | Node schemas, Relationship schemas, Business chains |
| **Step 3: Recall** | - | step3_recall, data_integrity_rules | Query patterns |
| **Step 4: Reconcile** | - | step4_reconcile, gap_type_definitions | - |
| **Step 5: Respond** | Output format, critical rules | step5_respond | Visualization schemas |

### No Duplication Guarantee
- Gap types: Tier 2 ONLY (step4 uses them, step1 defines them)
- Level definitions: Tier 2 ONLY (referenced by all steps)
- Node schemas: Tier 3 ONLY (conditionally loaded)
- Output format: Tier 1 ONLY (always needed)

---

## IMPLEMENTATION PLAN

### Phase 1: Fix Tier 3 Node Schemas
1. Regenerate all 17 node schemas from Neo4j JSON
2. Include ALL properties from actual database
3. Deploy to `instruction_elements`

### Phase 2: Remove Duplications
1. Remove gap type definitions from Tier 3 elements
2. Keep only in Tier 2

### Phase 3: Atomize Tier 2
1. Create 10 atomic elements with tier='2' label
2. Create database view `tier2_combined`
3. Update `retrieve_instructions` to use view for tier="data_mode_definitions"

### Phase 4: Move Tier 1 to Database
1. Insert Tier 1 into `instruction_bundles` with tag='tier1_router'
2. Update orchestrator code to load from database
3. Add caching (Tier 1 rarely changes)

### Phase 5: Validate Cross-Tier Integration
1. Test that Tier 1 → Tier 2 → Tier 3 flow works
2. Verify no missing element references
3. Confirm no duplications

---

## BLINDSPOTS IDENTIFIED

1. **No versioning on Tier 1** - Changes to hardcoded Tier 1 require deployment
2. **No validation layer** - Nothing checks that referenced elements exist
3. **Missing elements referenced** - `data_integrity_rules`, `tool_rules_core` mentioned but don't exist
4. **Incomplete property mappings** - LLM can't generate correct Cypher without knowing all properties (79% missing for EntityRisk)
5. **No tier labeling in current schema** - `instruction_elements` has no `tier` column
6. **Aggregate + individual redundancy** - Both `business_chains` AND 7 individual chain elements exist
7. **Numbering collisions** - 7 pairs of elements share the same Step.SubStep_Tier number in Step 5
8. **Prompts written as documentation, not as agent instructions** - Explanatory prose vs action-oriented directives
9. **Fat in prompts** - Token costs, storage details, redundant statements that provide no value to LLM
10. **Tier 1/2/3 loading model not clearly distinguished** - Tier 1 = Python-loaded, sent TO LLM. Tier 2/3 = LLM-fetched via MCP at runtime.
11. **100% empty metadata** - All 67 elements have empty `dependencies` and `use_cases` fields
12. **EXTRA properties in Tier 3** - 6 properties defined in Tier 3 don't exist in actual Neo4j schema
13. **Inconsistent relationship structures** - 3 different patterns used across 27 relationships
