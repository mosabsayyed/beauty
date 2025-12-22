-- ============================================================================
-- TIER 2 ATOMIC ELEMENTS - v3.4
-- ============================================================================
-- Source Strategy:
--   - Element labels/structure: docs/TIER_ARCHITECTURE_ANALYSIS.md
--   - Content/text: backend/app/services/orchestrator_zero_shot.py (working prompts)
--   - Schema (nodes/relations/properties): backend/app/api/routes/neo4j_db_full_schema_dec.11.2025.json
--
-- TIER LOADING LOGIC:
--   Tier 1: ALWAYS needed. Period. (Loaded by Python orchestrator, sent to LLM)
--   Tier 2: ALWAYS needed IF mode is data (A/B/C/D). (LLM fetches via MCP)
--   Tier 3: CONDITIONAL - At least in one case it is NOT needed. (LLM fetches via MCP when required)
--
-- TIER 2 PURPOSE:
--   Contains cognitive control loop (Steps 1-5), data integrity rules, schema overview,
--   business chains summary, and tool execution rules. Required for ALL data modes.
-- ============================================================================

-- Clean existing Tier 2 elements
DELETE FROM instruction_elements WHERE bundle = 'tier2';

-- ============================================================================
-- COGNITIVE CONTROL LOOP STEPS (Step 1-5)
-- ============================================================================

INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, status) VALUES
('tier2', '0.1_step1_requirements', 
'STEP 1: REQUIREMENTS (Contextualization)
- Input Analysis: Read Current User Query and Conversation History
- Resolution: Resolve ambiguous terms (e.g., "that project" -> "Project X") and identify Active Year relative to current date
- Gatekeeper Decision: Classify intent into ONE interaction mode
  * IF mode requires data (A, B, C, D) -> Proceed to Step 2
  * IF mode is conversational/non-data (E, F, G, H) -> Skip to Step 5',
'Step 1: Requirements and gatekeeper logic',
150,
'3.4.0',
'active'),

('tier2', '0.2_step2_recollect', 
'STEP 2: RECOLLECT (Semantic Anchoring)

- Anchor: Identify the required node labels + relationships + business_chain(s).
- MANDATORY SCHEMA PRELOAD: You MUST call retrieve_instructions(mode="tier3", elements=["graph_schema"]) to load canonical node labels (EntityProject, EntityCapability, etc.) BEFORE writing any Cypher. This prevents label guessing.
- Load additional instruction elements as needed:
  * retrieve_instructions(mode="tier3", elements=[<specific node schemas>, <relationship schemas>, <canonical templates>])
- Use recall_memory(scope=<allowed>, query_summary=<short>, limit=5) only to refine intent/context, never to assume data existence.',
'Step 2: Semantic anchoring and element selection with mandatory schema preload',
190,
'3.4.0',
'active'),

('tier2', '0.3_step3_recall', 
'STEP 3: RECALL (Graph Retrieval)

- Translation: Convert concepts into precise Cypher using ONLY loaded schema elements:
  node_schema, level_definitions, relationship_definitions, and data_integrity_rules.

- HARD PROHIBITIONS:
  * Never invent labels or property names.
  * Never write "let''s assume schema" or "Likely label X or Y".
  * NEVER guess between similar labels (e.g., "Project" vs "EntityProject"). Use the EXACT label from graph_schema.
  * If you did not load graph_schema in Step 2, STOP and call retrieve_instructions(mode="tier3", elements=["graph_schema"]) NOW.

- Label Rules (CANONICAL):
  * For projects → EntityProject (NOT "Project")
  * For capabilities → EntityCapability (NOT "Capability")
  * For risks → EntityRisk (NOT "Risk")
  * Pattern: Entity* for operational nodes, Sector* for strategic nodes.

- Cypher Rules:
  * Alternative relationships must be written as :REL1|REL2|REL3 (NOT :REL1|:REL2|:REL3)
  * Level integrity: apply level filters only when the question requires a single level; otherwise do NOT force same level across all nodes.

- Execution (AUTHORITATIVE TOOL CONTRACT):
  Call read_neo4j_cypher(query=<cypher_string>, params=<dict_or_null>)',
'Step 3: Cypher translation and execution',
220,
'3.4.0',
'active'),

('tier2', '0.4_step4_reconcile', 
'STEP 4: RECONCILE (Validation & Logic)

A) Validate retrieval matches the question:
- correct label(s)
- correct filter intent (year/quarter/status/etc.)
- correct granularity (L1/L2/L3 only if requested)

B) If query_results is empty AND this is a data mode (A–D):
- Run the Empty-Result Ladder and populate data.diagnostics.

EMPTY-RESULT LADDER (AUTHORITATIVE)
1) Presence:
   MATCH (n:<PRIMARY_LABEL>) RETURN count(n) AS total_nodes

2) Filter-key availability (for each key in cypher_params):
   MATCH (n:<PRIMARY_LABEL>)
   RETURN $key AS key, collect(DISTINCT n[$key])[0..20] AS values

3) Exact-match count:
   MATCH (n:<PRIMARY_LABEL>)
   WHERE all(k IN keys($filters) WHERE n[k] = $filters[k])
   RETURN count(n) AS exact_match_count

4) Sample (only if total_nodes > 0):
   MATCH (n:<PRIMARY_LABEL>) RETURN n{.*} AS node LIMIT 10

C) Conclusion rules:
- total_nodes = 0 → “dataset not loaded” (verified)
- total_nodes > 0 and exact_match_count = 0 → “no match for requested filters” + show available values
- Never output “no data” without diagnostics.',
'Step 4: Validation and gap analysis',
190,
'3.4.0',
'active'),

('tier2', '0.5_step5_respond', 
'STEP 5: RESPOND (Synthesis)
- Synthesis: Generate final answer adhering to output_format
- Language Rule: Use strict Business Language
  * NEVER use: "Node", "Cypher", "L3", "ID", "Query", "Relationship", "Graph"
  * ALWAYS use: Business entity names, natural language descriptions
- Visualization: Include charts when data supports visual representation',
'Step 5: Business language synthesis and response',
130,
'3.4.0',
'active'),

-- ============================================================================
-- DATA FOUNDATION (Integrity Rules & Schema)
-- ============================================================================

('tier2', '1.0_data_integrity_rules', 
'DATA INTEGRITY RULES (GOLDEN SCHEMA)
1. Universal Properties: ALL nodes (except OPTIONAL MATCH results) MUST have: id, level, year, quarter
2. Composite Key: ALWAYS filter by (id + level + year + quarter) together for exact match
3. Level Alignment: Direct relationships ONLY between nodes at same level (exception: PARENT_OF crosses levels)
4. Temporal Filtering: ALWAYS include year/quarter in WHERE unless explicitly told "all years"
   - NEVER use start_date/end_date for temporal filtering (these are entity lifecycle dates, not temporal scope)',
'Data integrity rules for Neo4j queries',
300,
'3.4.0',
'active'),

('tier2', '1.1_graph_schema', 
'GRAPH SCHEMA OVERVIEW

Node Types (17):
EntityProject, EntityCapability, EntityRisk, EntityProcess, EntityITSystem, EntityOrgUnit, EntityVendor, EntityCultureHealth, EntityChangeAdoption, SectorObjective, SectorPolicyTool, SectorPerformance, SectorAdminRecord, SectorBusiness, SectorGovEntity, SectorCitizen, SectorDataTransaction

Core Relationships:
- MONITORED_BY: Objectives/Performance/Capabilities → Risks
- CLOSE_GAPS: Projects → Risks
- OPERATES: OrgUnits → Processes/ITSystems
- CONTRIBUTES_TO: Capabilities/Projects → Objectives
- REALIZED_VIA: Objectives → Capabilities/Projects
- DEPENDS_ON: Processes → ITSystems, ITSystems → Vendors
- GOVERNED_BY: Objectives → PolicyTools
- AGGREGATES_TO: DataTransactions → Performance

Universal Properties (ALL nodes):
id, level, year, quarter, embedding, embedding_generated_at

Optional Hierarchical Properties:
parent_id, parent_year

Use retrieve_instructions for detailed node properties.',
'Short graph schema overview without detailed properties',
250,
'3.4.0',
'active'),

('tier2', '1.2_level_definitions', 
'LEVEL DEFINITIONS

SectorObjective: L1=Ministry Goal, L2=Sectoral Target, L3=Sub-Target
SectorPerformance: L1=Ministry KPI, L2=Sectoral KPI, L3=Operational Metric
EntityCapability: L1=Strategic Capability, L2=Tactical Capability, L3=Operational Skill
EntityProject: L1=Program, L2=Project, L3=Task
EntityRisk: L1=Strategic Risk, L2=Tactical Risk, L3=Operational Risk
EntityOrgUnit: L1=Ministry, L2=Department, L3=Unit
EntityProcess: L1=Core Process, L2=Support Process, L3=Sub-Process
EntityITSystem: L1=Enterprise System, L2=Departmental System, L3=Application',
'Level definitions for all node types',
200,
'3.4.0',
'active'),

-- ============================================================================
-- BUSINESS CONTEXT (Chains Summary)
-- ============================================================================

('tier2', '2.0_business_chains_summary', 
'BUSINESS CHAINS SUMMARY

1. SectorOps: SectorObjective → PolicyTool → DataTransaction → Performance
2. Strategy_to_Tactics_Priority_Capabilities: SectorObjective → Capability → SectorObjective
3. Strategy_to_Tactics_Capabilities_Targets: SectorObjective → Stakeholders → DataTransaction
4. Tactical_to_Strategy: EntityProject → SectorObjective → Performance
5. Risk_Build_Mode: EntityCapability → Risk → Project
6. Risk_Operate_Mode: OrgUnit → Process → ITSystem → Risk
7. Internal_Efficiency: OrgUnit → Process → Risk → Project → ITSystem

Note: For detailed paths with full relationship names and business narratives, use retrieve_instructions with specific chain name (e.g., elements=["business_chain_SectorOps"]).',
'Short summary of business chain names and simplified paths',
200,
'3.4.0',
'active'),

-- ============================================================================
-- TOOL EXECUTION RULES
-- ============================================================================

('tier2', '3.0_tool_execution_rules', 
'TOOL EXECUTION RULES (read_neo4j_cypher)

1) Always parameterize user values.
  - NEVER inline user values inside Cypher.
  - Use params dict for year/quarter/status/ids/etc.

2) Bounded retrieval:
  - Default LIMIT 50 unless the user explicitly requests more.
  - Use SKIP/LIMIT for pagination when needed.

3) Return maps when schema uncertainty exists:
  - Prefer RETURN n{.*} AS node over enumerating properties unless schema is loaded and stable.

4) Always echo exact query + params in output:
  - Populate cypher_executed with the exact Cypher executed.
  - Populate cypher_params with the params dict used.',
'Rules for read_neo4j_cypher tool execution',
200,
'3.4.0',
'active');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT 
    bundle,
    element,
    description,
    avg_tokens,
    version,
    status,
    LENGTH(content) as content_length
FROM instruction_elements
WHERE bundle = 'tier2'
ORDER BY element;

SELECT 
    COUNT(*) as total_elements,
    SUM(avg_tokens) as total_tokens,
    STRING_AGG(element, ', ' ORDER BY element) as elements
FROM instruction_elements
WHERE bundle = 'tier2';
