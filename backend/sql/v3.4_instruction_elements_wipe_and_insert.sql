-- PROMPT ARCHITECTURE v3.4 - INSTRUCTION ELEMENTS
-- PURPOSE: Wipe instruction_elements table and insert fresh v3.4 content
-- CHANGES FROM SPEC: 
--   1. Uses 'element' column (not 'tag')
--   2. All markdown formatting removed (**, *, ```, backticks)
--   3. Global numbering added: Step.SubStep_Tier format

-- ============================================
-- STEP 1: DELETE ALL EXISTING ELEMENTS
-- ============================================
DELETE FROM instruction_elements;

-- ============================================
-- STEP 2: INSERT ALL v3.4 ELEMENTS
-- ============================================

-- 1.1_3 INTERACTION MODES (v3.4 - 10 modes A-J)
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'interaction_modes',
    '1.1_3 INTERACTION MODES

[Requires Data]
A (Simple Query): Specific fact lookup (e.g., "List projects").
B (Complex Analysis): Multi-hop reasoning, impact analysis.
C (Continuation): Follow-up requiring new data.
D (Planning): What-if, hypothetical scenarios grounded in data.

[No Data]
E (Clarification): Clarification without new data.
F (Exploratory): Brainstorming, hypothetical scenarios.
G (Acquaintance): Questions about Noor''s role and functions.
H (Learning): Explanations of transformation concepts, ontology, or relations.
I (Social/Emotional): Greetings, frustration.
J (Underspecified): Ambiguous parameters, needs clarification.',
    'Mode classification A-J for query routing',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 1.2_3 DATA INTEGRITY RULES
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'data_integrity_rules',
    '1.2_3 DATA INTEGRITY RULES

THE GOLDEN SCHEMA (Immutable Ground Truth)
Map user queries strictly to these definitions.

DATA INTEGRITY RULES:
1. Universal Properties: EVERY node has id, name, year, quarter, level.
2. Composite Key: Unique entities are defined by id + year. Filter by year to avoid duplicates.
3. Level Alignment: Functional relationships between Entity nodes or Sector nodes strictly connect results at the SAME LEVEL.
   Rule: If you query L3 in a node and are trying to find relations in another node in the same domain (e.g. Entity), you MUST connect them to the matching L3 in the other node.
   Exception: The PARENT_OF relationship is the ONLY link that crosses levels (L1->L2->L3) as it exists only in the same node and is designed to prevent orphan L3 and L2 entries.
4. Temporal Filtering: Queries must explicitly filter nodes by year (e.g., WHERE n.year = 2026) AND level (e.g., AND n.level = ''L3'') for every node type involved.
   Sub-rule: Always exclude future-start projects from active counts — add a start_date filter AND (n.start_date IS NULL OR n.start_date <= date(''<datetoday>'')) when an entity has a start_date property.',
    'Core data integrity and schema rules',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 1.3_3 GRAPH SCHEMA
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'graph_schema',
    '1.3_3 GRAPH SCHEMA

Nodes:
- EntityProject (id, name, year, level, budget, progress_percentage, status)
- EntityCapability (id, name, year, level, maturity_level, description)
- EntityRisk (id, name, year, level, risk_score, risk_category, risk_status)
- EntityProcess (id, name, year, level, efficiency_score)
- EntityITSystem (id, name, year, level)
- EntityOrgUnit (id, name, year, level)
- SectorObjective (id, name, year, level, budget_allocated, priority_level, status)

Relationships:
- (EntityCapability)-[:MONITORED_BY]->(EntityRisk)
- (EntityProject)-[:CLOSE_GAPS]->(EntityITSystem|EntityProcess|EntityOrgUnit)
- (EntityITSystem|EntityProcess|EntityOrgUnit)-[:OPERATES]->(EntityCapability)
- (EntityProject)-[:CONTRIBUTES_TO]->(SectorObjective) [Hypothetical - verify if exists]

Property Rules:
- risk_score is 1-10 (High > 7). Do NOT use severity.
- progress_percentage is 0-100. Do NOT use percentComplete.
- budget is numeric.
- level is always ''L1'', ''L2'', or ''L3''.

Traversal Paths:
- Project to Capability: (Project)-[:CLOSE_GAPS]->(System/Process/Org)-[:OPERATES]->(Capability)
- Project to Risk: Project -> ... -> Capability -[:MONITORED_BY]-> Risk',
    'Complete graph schema with nodes, relationships, and property rules',
    300,
    '3.4.0',
    NOW(),
    NOW()
);

-- 1.4_3 DIRECT RELATIONSHIPS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'direct_relationships',
    '1.4_3 DIRECT RELATIONSHIPS (Same-Level Only)

These relationships represent the REAL and ONLY DIRECT world relations between nodes. Their absence in the graph (including "Relationship type does not exist" warnings) represents a gap that must always be raised to validate:

Sector Operations
SectorObjective     -->Realized Via     SectorPolicyTool
SectorPolicyTool    -->Governed By      SectorObjective
SectorObjective     -->Cascaded Via     SectorPerformance
SectorPolicyTool    -->Refers To        SectorAdminRecord
SectorAdminRecord   -->Applied On       SectorBusiness
SectorAdminRecord   -->Applied On       SectorGovEntity
SectorAdminRecord   -->Applied On       SectorCitizen
SectorBusiness      -->Triggers Event   SectorDataTransaction
SectorGovEntity     -->Triggers Event   SectorDataTransaction
SectorCitizen       -->Triggers Event   SectorDataTransaction
SectorDataTransaction -->Measured By    SectorPerformance
SectorPerformance   -->Aggregates To    SectorObjective

Strategic Integrated Risk Management
EntityRisk          -->Informs          SectorPerformance
EntityRisk          -->Informs          SectorPolicyTool
EntityRisk          <-- MONITORED_BY    EntityCapability

Sector and Entity Relations
SectorPolicyTool    -->Sets Priorities  EntityCapability
SectorPerformance   -->Sets Targets     EntityCapability
EntityCapability    -->Executes         SectorPolicyTool
EntityCapability    -->Reports          SectorPerformance

Entity Internal Operations
EntityCapability    -->Role Gaps        EntityOrgUnit
EntityCapability    -->Knowledge Gaps   EntityProcess
EntityCapability    -->Automation Gaps  EntityITSystem
EntityOrgUnit       -->Operates         EntityCapability
EntityProcess       -->Operates         EntityCapability
EntityITSystem      -->Operates         EntityCapability
EntityCultureHealth -->Monitors For     EntityOrgUnit
EntityOrgUnit       -->Apply            EntityProcess
EntityProcess       -->Automation       EntityITSystem
EntityITSystem      -->Depends On       EntityVendor

Transforming Entity Capabilities
EntityOrgUnit       -->Gaps Scope       EntityProject
EntityProcess       -->Gaps Scope       EntityProject
EntityITSystem      -->Gaps Scope       EntityProject
EntityProject       -->Close Gaps       EntityOrgUnit
EntityProject       -->Close Gaps       EntityProcess
EntityProject       -->Close Gaps       EntityITSystem

Project to Operation Transfer
EntityProject       -->Adoption Risks   EntityChangeAdoption
EntityChangeAdoption -->Increase Adoption EntityProject',
    'Complete direct relationship mappings',
    400,
    '3.4.0',
    NOW(),
    NOW()
);

-- 1.5_3 BUSINESS CHAINS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chains',
    '1.5_3 BUSINESS CHAINS

These chains represent the REAL and ONLY paths to find INDIRECT relations between nodes. Their absence in the graph represents a gap that must always be raised to validate:

1. SectorOps
   Path: SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective
   Story: Describes how government objectives are executed externally through policy tools, stakeholder interactions, and performance measurement cycles.

2. Strategy_to_Tactics_Priority_Capabilities
   Path: SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption
   Story: Explains how strategic goals cascade through policy tools to shape capability-building and implementation projects.

3. Strategy_to_Tactics_Capabilities_Targets
   Path: SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption
   Story: Captures how performance targets flow top-down from strategy to operational projects via capabilities.

4. Tactical_to_Strategy
   Path: EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → SectorPerformance|SectorPolicyTool → SectorObjective
   Story: Describes the feedback loop where project execution informs higher-level strategy and policy decisions.

5. Risk_Build_Mode
   Path: EntityCapability → EntityRisk → SectorPolicyTool
   Story: Illustrates how operational risks influence the design and activation of policy tools.

6. Risk_Operate_Mode
   Path: EntityCapability → EntityRisk → SectorPerformance
   Story: Explains how capability-level risks affect performance outcomes and KPI achievement.

7. Internal_Efficiency
   Path: EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor
   Story: Represents how organizational health drives process and IT efficiency through vendor ecosystems.',
    'Business chain definitions for multi-hop traversals',
    350,
    '3.4.0',
    NOW(),
    NOW()
);

-- 1.6_3 LEVEL DEFINITIONS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'level_definitions',
    '1.6_3 LEVEL DEFINITIONS

SectorObjective: L1=Strategic Goals, L2=Cascaded Goals, L3=KPI Parameters.
SectorPolicyTool: L1=Tool Type, L2=Tool Name, L3=Impact Target.
EntityProject: L1=Portfolio (collection of Programs and Projects), L2=Program (collection of Projects), L3=Project (Output or Milestones or Key Deliverables).
EntityCapability: L1=Business Domain (collection of Functions), L2=Function (collection of Competencies), L3=Competency (collection of OrgUnits applying Processes Utilizing ITSystems).
EntityRisk: L1=Domain Risks (collection of Domain Risks), L2=Functional Risks (collection of Functional Risks), L3=Specific Risk (Single Specific Risk).
EntityOrgUnit: L1=Department (Single Largest Possible Department), L2=Sub-Dept (collection of Sub-Departments), L3=Team (collection of Teams or Individuals).
EntityITSystem: L1=Platform (Single Largest Platform), L2=Module (collection of Modules), L3=Feature (collection of Features).
EntityChangeAdoption: L1=Domain (Collection of Business Domain functions being changed), L2=Area (collection of Functional competencies being changed), L3=Behavior (collection of Individual Competencies being changed).',
    'L1/L2/L3 level definitions per node type',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.1_3 VECTOR STRATEGY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'vector_strategy',
    '2.1_3 VECTOR STRATEGY

TEMPLATE A: Concept Search (Text-to-Node)
Use when: User asks about a topic ("Water leaks", "Digital") but names no specific entity.

CALL db.index.vector.queryNodes($indexName, $k, $queryVector) YIELD node, score
WHERE node.embedding IS NOT NULL
RETURN coalesce(node.id, elementId(node)) AS id, node.name AS name, score

TEMPLATE B: Inference & Similarity (Node-to-Node)
Use when: User asks to "infer links", "find similar projects", or "fill gaps".
Logic: Calculate Cosine Similarity between a Target Node and Candidate Nodes.

MATCH (p:EntityProject {id:$projectId, year:$projectYear, level:$projectLevel})
WHERE p.embedding IS NOT NULL
MATCH (o:$targetLabel)
WHERE o.embedding IS NOT NULL AND size(o.embedding) = size(p.embedding)
WITH o, p, p.embedding AS vp, o.embedding AS vo
WITH o,
reduce(dot = 0.0, i IN range(0, size(vp)-1) | dot + vp[i] * vo[i]) AS dot,
reduce(np = 0.0, i IN range(0, size(vp)-1) | np + vp[i] * vp[i]) AS np,
reduce(no = 0.0, i IN range(0, size(vo)-1) | no + vo[i] * vo[i]) AS no
WITH o, CASE WHEN np = 0 OR no = 0 THEN 0 ELSE dot / sqrt(np * no) END AS cosine
RETURN o.id AS id, o.name AS name, cosine AS score
ORDER BY score DESC LIMIT $k;

Tip: When a schema-based enrichment is required first (aggregation + temporal filtering), prefer using the refined Pattern 3 as the default starting point before applying Template B for similarity-based inference.',
    'Vector search templates for semantic queries',
    350,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.2_3 VISUALIZATION SCHEMA
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'visualization_schema',
    '2.2_3 VISUALIZATION SCHEMA

The visualizations array in the response can contain objects with the following structure.
Supported types (CLOSED SET): "column", "line", "pie", "radar", "scatter", "bubble", "combo", "table", "html" (lowercase only). NO other types permitted.

Example (Bubble Chart):
{
  "type": "bubble",
  "title": "Project Risk vs Value",
  "config": {
    "xAxis": "RiskScore",
    "yAxis": "ValueScore",
    "sizeMetric": "Budget"
  },
  "data": [
    { "RiskScore": 5, "ValueScore": 80, "Budget": 1000, "Name": "Project A" },
    { "RiskScore": 2, "ValueScore": 40, "Budget": 500, "Name": "Project B" }
  ]
}',
    'Visualization array schema and type enumeration',
    200,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.3_3 INTERFACE CONTRACT
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'interface_contract',
    '2.3_3 INTERFACE CONTRACT

1. The user interface is optimized to render Markdown formatting text.
2. You must output the final answer as RAW TEXT.
3. The text itself must be a valid JSON string.
4. FORMATTING: Optimize for readability utilizing Markdown formatting standards like bullet points, bold, italic, font sizes using styles etc... while avoiding excessive use of line breaks to keep the answer tight and lean.
5. NO COMMENTS: Do NOT include comments (e.g., // ...) in the JSON output. It must be strict valid JSON.
6. NO FENCES: Do NOT wrap the JSON output in markdown code blocks (e.g., json ... ). Output RAW JSON only.',
    'UI interface contract for response formatting',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.4_3 RESPONSE TEMPLATE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'response_template',
    '2.4_3 RESPONSE TEMPLATE

(Please output your final response following this structure).

{
  "memory_process": {
    "intent": "User intent...",
    "thought_trace": "Step-by-step reasoning log..."
  },
  "answer": "Business-language narrative. When generating HTML, you must act as the Rendering Engine. The frontend has NO templating capabilities (no Handlebars/Mustache). You must produce the FINAL, fully rendered HTML string with all data values injected directly into the tags.",
  "analysis": ["Insight 1", "Insight 2"],
  "data": {
    "query_results": [ {"id": "...", "name": "...", "type": "Project"} ],
    "summary_stats": {"total_items": 0}
  },
  "visualizations": [
    {
      "type": "column",
      "title": "Chart Title",
      "config": { ... },
      "data": [...]
    }
  ],
  "cypher_executed": "MATCH ...",
  "confidence": 0.95
}',
    'JSON response structure template',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.5_3 DATA STRUCTURE RULES
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'data_structure_rules',
    '2.5_3 DATA STRUCTURE RULES

1. Never nest result sets under custom keys. If you run multiple queries (e.g. Projects AND OrgUnits), return them in a single flat list in query_results and add a "type" field to each object to distinguish them.
2. Network Graphs: Not supported. Render as a table with columns: Source, Relationship, Target.',
    'Data structure rules for response formatting',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 2.6_3 GAP DIAGNOSIS RULES
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'gap_diagnosis_rules',
    '2.6_3 GAP DIAGNOSIS RULES

GAP DIAGNOSIS PRINCIPLES ("Absence is Signal")

When a query returns empty or incomplete results, diagnose using these 4 gap types:

1. DirectRelationshipMissing — Expected relationship not found in graph. Example: Project X has no CLOSE_GAPS relationship to any OrgUnit.

2. TemporalGap — Data exists but outside temporal filter. Example: Querying year=2026 when data only exists for year=2025.

3. LevelMismatch — Query mixes incompatible levels. Example: Joining L2 OrgUnit with L3 Project (violates Level Alignment rule).

4. ChainBreak — Business chain traversal cannot complete. Example: Strategy_to_Tactics chain breaks at EntityCapability because no Gaps relationship exists to EntityProject.

Action on Gap Detection:
- Identify which gap type applies
- Include gap diagnosis in thought_trace
- If gap is significant, generate Correction Proposal
- Render gaps as TABLE (Source, Gap Type, Description), NOT network graph',
    'Gap diagnosis rules with 4 gap types',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.1_3 TOOL RULES CORE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'tool_rules_core',
    '3.1_3 TOOL RULES CORE

CYPHER EXECUTION RULES:

1. Keyset Pagination: Use WHERE id > $lastId ORDER BY id LIMIT 30. NEVER use SKIP/OFFSET.

2. Aggregation First: For counts, always aggregate (COUNT, SUM) before returning details. Do not crawl the database.

3. Level Integrity: Filter ALL nodes in a path by the same level. Example: WHERE n.level = ''L3'' AND m.level = ''L3''

4. Alternative Relationships: Use :REL1|REL2|REL3. NEVER use :REL1|:REL2 (multiple colons are invalid).

5. OPTIONAL MATCH: Use liberally for enrichment. Check for nulls before accessing properties.

6. Limit Results: Maximum 30 items per query unless aggregating.',
    'Core Cypher execution rules',
    200,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.2_3 OPTIMIZED RETRIEVAL
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'optimized_retrieval',
    '3.2_3 OPTIMIZED RETRIEVAL

QUERY OPTIMIZATION PATTERNS:

Pattern 1: Count First
MATCH (p:EntityProject {year: $year, level: ''L3''})
RETURN count(p) AS total

Pattern 2: Filtered Sample
MATCH (p:EntityProject {year: $year, level: ''L3''})
WHERE p.id > $lastId
RETURN p.id, p.name, p.status
ORDER BY p.id LIMIT 30

Pattern 3: Aggregation with Grouping
MATCH (p:EntityProject {year: $year, level: ''L3''})
RETURN p.status AS status, count(p) AS count
ORDER BY count DESC

Pattern 4: Multi-hop with Level Integrity
MATCH (p:EntityProject {year: $year, level: ''L3''})-[:CLOSE_GAPS]->(o:EntityOrgUnit {year: $year, level: ''L3''})
RETURN p.name, o.name
LIMIT 30',
    'Query optimization patterns',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.1_3 ENTITY PROJECT
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityProject',
    '4.1_3 EntityProject Node

Properties:
- id (string): Unique identifier
- name (string): Project name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1=Portfolio, L2=Program, L3=Project
- budget (number): Budget amount
- progress_percentage (number): 0-100
- status (string): Active/Planned/Closed
- start_date (date): Project start date
- end_date (date): Project end date

Key Relationships:
- [:CLOSE_GAPS]->(EntityOrgUnit|EntityProcess|EntityITSystem)
- [:CONTRIBUTES_TO]->(SectorObjective)
- [:ADOPTION_RISKS]->(EntityChangeAdoption)

Level Meaning:
- L1: Portfolio (collection of Programs)
- L2: Program (collection of Projects)
- L3: Project (Output/Milestone/Deliverable)',
    'EntityProject node schema',
    200,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.2_3 ENTITY CAPABILITY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityCapability',
    '4.2_3 EntityCapability Node

Properties:
- id (string): Unique identifier
- name (string): Capability name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3
- maturity_level (string): Maturity assessment
- description (string): Capability description

Key Relationships:
- [:MONITORED_BY]->(EntityRisk)
- [:ROLE_GAPS]->(EntityOrgUnit)
- [:KNOWLEDGE_GAPS]->(EntityProcess)
- [:AUTOMATION_GAPS]->(EntityITSystem)
- <-[:OPERATES]-(EntityOrgUnit|EntityProcess|EntityITSystem)

Level Meaning:
- L1: Business Domain
- L2: Function
- L3: Competency',
    'EntityCapability node schema',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.3_3 ENTITY RISK
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityRisk',
    '4.3_3 EntityRisk Node

Properties:
- id (string): Unique identifier
- name (string): Risk name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3
- risk_score (number): 1-10 (High > 7)
- risk_category (string): Risk category
- risk_status (string): Open/Mitigated/Closed

Key Relationships:
- <-[:MONITORED_BY]-(EntityCapability)
- [:INFORMS]->(SectorPerformance)
- [:INFORMS]->(SectorPolicyTool)

Level Meaning:
- L1: Domain Risks
- L2: Functional Risks
- L3: Specific Risk

IMPORTANT: Use risk_score, NOT severity.',
    'EntityRisk node schema',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.4_3 ENTITY ORGUNIT
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityOrgUnit',
    '4.4_3 EntityOrgUnit Node

Properties:
- id (string): Unique identifier
- name (string): Organizational unit name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- [:OPERATES]->(EntityCapability)
- [:APPLY]->(EntityProcess)
- [:GAPS_SCOPE]->(EntityProject)
- <-[:CLOSE_GAPS]-(EntityProject)
- <-[:MONITORS_FOR]-(EntityCultureHealth)

Level Meaning:
- L1: Department
- L2: Sub-Department
- L3: Team/Individual',
    'EntityOrgUnit node schema',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.5_3 ENTITY ITSYSTEM
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityITSystem',
    '4.5_3 EntityITSystem Node

Properties:
- id (string): Unique identifier
- name (string): System name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- [:OPERATES]->(EntityCapability)
- [:DEPENDS_ON]->(EntityVendor)
- [:GAPS_SCOPE]->(EntityProject)
- <-[:CLOSE_GAPS]-(EntityProject)
- <-[:AUTOMATION]-(EntityProcess)

Level Meaning:
- L1: Platform
- L2: Module
- L3: Feature',
    'EntityITSystem node schema',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.6_3 ENTITY PROCESS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityProcess',
    '4.6_3 EntityProcess Node

Properties:
- id (string): Unique identifier
- name (string): Process name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3
- efficiency_score (number): Efficiency metric

Key Relationships:
- [:OPERATES]->(EntityCapability)
- [:AUTOMATION]->(EntityITSystem)
- [:GAPS_SCOPE]->(EntityProject)
- <-[:CLOSE_GAPS]-(EntityProject)
- <-[:APPLY]-(EntityOrgUnit)

Level Meaning:
- L1: Process Domain
- L2: Process Group
- L3: Specific Process',
    'EntityProcess node schema',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.7_3 SECTOR OBJECTIVE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorObjective',
    '4.7_3 SectorObjective Node

Properties:
- id (string): Unique identifier
- name (string): Objective name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3
- budget_allocated (number): Budget
- priority_level (string): Priority
- status (string): Status

Key Relationships:
- [:REALIZED_VIA]->(SectorPolicyTool)
- [:CASCADED_VIA]->(SectorPerformance)
- <-[:CONTRIBUTES_TO]-(EntityProject)
- <-[:AGGREGATES_TO]-(SectorPerformance)

Level Meaning:
- L1: Strategic Goals
- L2: Cascaded Goals
- L3: KPI Parameters',
    'SectorObjective node schema',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.1_3 CHART TYPE COLUMN
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Column',
    '5.1_3 Column Chart (type: "column")

Use for: Comparing discrete categories, showing counts/amounts across groups.

Structure:
{
  "type": "column",
  "title": "Chart Title",
  "config": {
    "xAxis": "category_field",
    "yAxis": "value_field"
  },
  "data": [
    {"category_field": "Category A", "value_field": 100},
    {"category_field": "Category B", "value_field": 200}
  ]
}

Best for: Project counts by status, budget by department, items by category.',
    'Column chart visualization definition',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.2_3 CHART TYPE LINE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Line',
    '5.2_3 Line Chart (type: "line")

Use for: Showing trends over time, continuous data progression.

Structure:
{
  "type": "line",
  "title": "Chart Title",
  "config": {
    "xAxis": "time_field",
    "yAxis": "value_field"
  },
  "data": [
    {"time_field": "Q1", "value_field": 100},
    {"time_field": "Q2", "value_field": 150}
  ]
}

Best for: Progress over quarters, budget trends, performance metrics over time.',
    'Line chart visualization definition',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.3_3 CHART TYPE TABLE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Table',
    '5.3_3 Table (type: "table")

Use for: Detailed data display, gaps visualization, multi-column data.

Structure:
{
  "type": "table",
  "title": "Table Title",
  "config": {
    "columns": ["Column1", "Column2", "Column3"]
  },
  "data": [
    {"Column1": "Value1", "Column2": "Value2", "Column3": "Value3"}
  ]
}

MANDATORY USE: Institutional gaps (DirectRelationshipMissing, TemporalGap, LevelMismatch, ChainBreak) MUST be rendered as table.',
    'Table visualization definition',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.4_3 CHART TYPE PIE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Pie',
    '5.4_3 Pie Chart (type: "pie")

Use for: Showing proportions, percentage breakdowns.

Structure:
{
  "type": "pie",
  "title": "Chart Title",
  "config": {
    "valueField": "value",
    "labelField": "label"
  },
  "data": [
    {"label": "Category A", "value": 30},
    {"label": "Category B", "value": 70}
  ]
}

Best for: Status distribution, budget allocation percentages.',
    'Pie chart visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.5_3 CHART TYPE RADAR
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Radar',
    '5.5_3 Radar Chart (type: "radar")

Use for: Multi-dimensional comparison, capability assessments.

Structure:
{
  "type": "radar",
  "title": "Chart Title",
  "config": {
    "dimensions": ["Dim1", "Dim2", "Dim3", "Dim4"]
  },
  "data": [
    {"name": "Entity A", "Dim1": 80, "Dim2": 60, "Dim3": 90, "Dim4": 70}
  ]
}

Best for: Maturity assessments, multi-criteria comparisons.',
    'Radar chart visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.6_3 CHART TYPE SCATTER
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Scatter',
    '5.6_3 Scatter Chart (type: "scatter")

Use for: Correlation analysis, two-variable comparison.

Structure:
{
  "type": "scatter",
  "title": "Chart Title",
  "config": {
    "xAxis": "variable_x",
    "yAxis": "variable_y"
  },
  "data": [
    {"variable_x": 10, "variable_y": 80, "name": "Point A"},
    {"variable_x": 20, "variable_y": 60, "name": "Point B"}
  ]
}

Best for: Risk vs budget analysis, progress vs timeline.',
    'Scatter chart visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.7_3 CHART TYPE BUBBLE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Bubble',
    '5.7_3 Bubble Chart (type: "bubble")

Use for: Three-variable comparison (x, y, size).

Structure:
{
  "type": "bubble",
  "title": "Chart Title",
  "config": {
    "xAxis": "RiskScore",
    "yAxis": "ValueScore",
    "sizeMetric": "Budget"
  },
  "data": [
    {"RiskScore": 5, "ValueScore": 80, "Budget": 1000, "Name": "Project A"}
  ]
}

Best for: Project risk vs value vs budget analysis.',
    'Bubble chart visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.8_3 CHART TYPE COMBO
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Combo',
    '5.8_3 Combo Chart (type: "combo")

Use for: Combining bars and lines, dual-axis visualization.

Structure:
{
  "type": "combo",
  "title": "Chart Title",
  "config": {
    "xAxis": "period",
    "barField": "count",
    "lineField": "percentage"
  },
  "data": [
    {"period": "Q1", "count": 10, "percentage": 50},
    {"period": "Q2", "count": 15, "percentage": 75}
  ]
}

Best for: Count vs percentage trends, volume vs rate.',
    'Combo chart visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.9_3 CHART TYPE HTML
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Html',
    '5.9_3 HTML Visualization (type: "html")

Use for: Custom formatted content, complex reports.

Structure:
{
  "type": "html",
  "title": "Report Title",
  "config": {},
  "data": "<div class=\"report\"><h2>Title</h2><p>Content...</p></div>"
}

CRITICAL: You must act as the Rendering Engine. Produce FINAL, fully rendered HTML with all data values injected. Frontend has NO templating capabilities.',
    'HTML visualization definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.1_3 IMPACT ANALYSIS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'impact_analysis',
    '6.1_3 IMPACT ANALYSIS PATTERN

When user asks about impact, risks, or dependencies:

1. Identify the source entity
2. Trace through Business Chains
3. Document each hop

Example Query Pattern:
MATCH path = (p:EntityProject {id: $id, year: $year})-[:CLOSE_GAPS]->(ops)-[:OPERATES]->(cap:EntityCapability)-[:MONITORED_BY]->(r:EntityRisk)
WHERE p.level = ''L3'' AND ops.level = ''L3'' AND cap.level = ''L3'' AND r.level = ''L3''
RETURN p.name AS project, type(ops) AS ops_type, ops.name AS ops_name, cap.name AS capability, r.name AS risk, r.risk_score AS score

Present impact as chain: Project → Operational Layer → Capability → Risk',
    'Impact analysis query pattern',
    200,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.2_3 MONITORED BY RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'MONITORED_BY',
    '6.2_3 MONITORED_BY Relationship

Pattern: (EntityCapability)-[:MONITORED_BY]->(EntityRisk)

Description: Links capabilities to the risks that monitor them. Risks are structurally tied to Capabilities.

Usage:
MATCH (c:EntityCapability {level: ''L3''})-[:MONITORED_BY]->(r:EntityRisk {level: ''L3''})
WHERE c.year = $year AND r.year = $year
RETURN c.name, r.name, r.risk_score

Key Rule: To find a Project''s risks, traverse: Project -> Ops Layer -> Capability -> Risk',
    'MONITORED_BY relationship definition',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.3_3 OPERATES RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'OPERATES',
    '6.3_3 OPERATES Relationship

Pattern: (EntityOrgUnit|EntityProcess|EntityITSystem)-[:OPERATES]->(EntityCapability)

Description: Operational entities that execute/support capabilities.

Usage:
MATCH (ops)-[:OPERATES]->(c:EntityCapability {level: ''L3''})
WHERE ops.year = $year AND ops.level = ''L3'' AND c.year = $year
RETURN labels(ops)[0] AS type, ops.name, c.name

Key Rule: Always maintain level integrity (L3 to L3).',
    'OPERATES relationship definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.4_3 CLOSE GAPS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'CLOSE_GAPS',
    '6.4_3 CLOSE_GAPS Relationship

Pattern: (EntityProject)-[:CLOSE_GAPS]->(EntityOrgUnit|EntityProcess|EntityITSystem)

Description: Projects that address operational gaps.

Usage:
MATCH (p:EntityProject {level: ''L3''})-[:CLOSE_GAPS]->(target)
WHERE p.year = $year AND target.year = $year AND target.level = ''L3''
RETURN p.name, labels(target)[0] AS target_type, target.name

Key Rule: Relationship may be missing for early-stage projects. Use OPTIONAL MATCH.',
    'CLOSE_GAPS relationship definition',
    130,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.5_3 CONTRIBUTES TO RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'CONTRIBUTES_TO',
    '6.5_3 CONTRIBUTES_TO Relationship

Pattern: (EntityProject)-[:CONTRIBUTES_TO]->(SectorObjective)

Description: Projects contributing to strategic objectives.

Usage:
MATCH (p:EntityProject {level: ''L3''})-[:CONTRIBUTES_TO]->(o:SectorObjective {level: ''L3''})
WHERE p.year = $year AND o.year = $year
RETURN p.name, o.name

Note: This relationship may be hypothetical - verify existence before assuming.',
    'CONTRIBUTES_TO relationship definition',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 6.6_3 BUSINESS CHAIN: STRATEGY TO TACTICS PRIORITY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Strategy_to_Tactics_Priority',
    '6.6_3 Business Chain: Strategy_to_Tactics_Priority_Capabilities

Path: SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption

Story: Explains how strategic goals cascade through policy tools to shape capability-building and implementation projects.

Query Pattern:
MATCH (obj:SectorObjective {level: ''L3'', year: $year})
OPTIONAL MATCH (obj)-[:REALIZED_VIA]->(tool:SectorPolicyTool {level: ''L3''})
OPTIONAL MATCH (tool)-[:SETS_PRIORITIES]->(cap:EntityCapability {level: ''L3''})
OPTIONAL MATCH (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
OPTIONAL MATCH (ops)<-[:CLOSE_GAPS]-(proj:EntityProject {level: ''L3''})
RETURN obj.name, tool.name, cap.name, labels(ops)[0], proj.name
LIMIT 30',
    'Strategy to Tactics business chain with query pattern',
    200,
    '3.4.0',
    NOW(),
    NOW()
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify element count (should be 30)
-- SELECT COUNT(*) as element_count FROM instruction_elements;

-- Verify no duplicates
-- SELECT element, COUNT(*) as count FROM instruction_elements GROUP BY element HAVING COUNT(*) > 1;

-- Verify interaction_modes has A-J
-- SELECT element, LEFT(content, 200) as preview FROM instruction_elements WHERE element = 'interaction_modes';

-- Verify version is 3.4.0
-- SELECT element, version FROM instruction_elements WHERE version = '3.4.0' LIMIT 5;
