-- PROMPT ARCHITECTURE v3.4 - INSTRUCTION ELEMENTS (COMPLETE)
-- PURPOSE: Wipe instruction_elements table and insert fresh v3.4 content
-- 
-- TIER RELOCATION APPLIED (per Prompt Matrix Analysis):
--   Elements MOVED to Tier 1/2 are NOT included here:
--   - interaction_modes → Already in Tier 1 COGNITIVE_CONT_BUNDLE
--   - data_integrity_rules → MOVED to Tier 2 data_mode_definitions
--   - level_definitions → MOVED to Tier 2 data_mode_definitions  
--   - gap_diagnosis_rules → MOVED to Tier 2 data_mode_definitions
--   - tool_rules_core → MOVED to Tier 2 data_mode_definitions
--
-- TIER 3 COMPLETE INVENTORY (per Prompt Matrix Analysis Final Architecture 3.4):
--   - Node schemas: 17 types (EntityProject, EntityCapability, EntityRisk, EntityProcess,
--                   EntityITSystem, EntityOrgUnit, SectorObjective, SectorPolicyTool,
--                   SectorPerformance, SectorAdminRecord, SectorBusiness, SectorGovEntity,
--                   SectorCitizen, SectorDataTransaction, EntityVendor, EntityCultureHealth,
--                   EntityChangeAdoption)
--   - Relationship schemas: 23 types (MONITORED_BY, OPERATES, CLOSE_GAPS, CONTRIBUTES_TO,
--                   REALIZED_VIA, GOVERNED_BY, CASCADED_VIA, REFERS_TO, APPLIED_ON,
--                   TRIGGERS_EVENT, MEASURED_BY, AGGREGATES_TO, INFORMS, SETS_PRIORITIES,
--                   SETS_TARGETS, EXECUTES, REPORTS, ROLE_GAPS, KNOWLEDGE_GAPS, AUTOMATION_GAPS,
--                   MONITORS_FOR, APPLY, AUTOMATION, DEPENDS_ON, GAPS_SCOPE, ADOPTION_RISKS,
--                   INCREASE_ADOPTION)
--   - Business chains: 7 patterns (SectorOps, Strategy_to_Tactics_Priority, Strategy_to_Tactics_Targets,
--                   Tactical_to_Strategy, Risk_Build_Mode, Risk_Operate_Mode, Internal_Efficiency)
--   - Query patterns: 3 (vector_strategy, optimized_retrieval, impact_analysis)
--   - Visualization definitions: 10 types (schema + 9 chart types)
--   - Aggregate schemas: 3 (graph_schema, direct_relationships, business_chains)
--
-- TOTAL ELEMENTS: 67
-- FORMAT: Step.SubStep_Tier numbering, no markdown

-- ============================================
-- STEP 1: DELETE ALL EXISTING ELEMENTS
-- ============================================
DELETE FROM instruction_elements;

-- ============================================
-- STEP 2: INSERT TIER 3 ELEMENTS ONLY
-- ============================================

-- DESIGN CLEANUP (v3.4 END STATE)
-- After inserts, remove aggregates and gap-type relationships that are not part of the final T3 set.
-- This keeps the table aligned with the 56-element target (17 nodes, 23 rels, 7 chains, 9 charts, 3 patterns).


-- 1.1_3 GRAPH SCHEMA (comprehensive node/relationship overview)
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'graph_schema',
    '1.1_3 GRAPH SCHEMA

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

-- 1.2_3 DIRECT RELATIONSHIPS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'direct_relationships',
    '1.2_3 DIRECT RELATIONSHIPS (Same-Level Only)

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

-- 1.3_3 BUSINESS CHAINS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chains',
    '1.3_3 BUSINESS CHAINS

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

-- 2.2_3 OPTIMIZED RETRIEVAL (Query Patterns)
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'optimized_retrieval',
    '2.2_3 OPTIMIZED RETRIEVAL

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

-- 2.3_3 IMPACT ANALYSIS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'impact_analysis',
    '2.3_3 IMPACT ANALYSIS PATTERN

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

-- ============================================
-- NODE SCHEMAS (3.x_3)
-- ============================================

-- 3.1_3 ENTITY PROJECT
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityProject',
    '3.1_3 EntityProject Node

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

-- 3.2_3 ENTITY CAPABILITY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityCapability',
    '3.2_3 EntityCapability Node

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

-- 3.3_3 ENTITY RISK
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityRisk',
    '3.3_3 EntityRisk Node

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

-- 3.4_3 ENTITY ORGUNIT
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityOrgUnit',
    '3.4_3 EntityOrgUnit Node

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

-- 3.5_3 ENTITY ITSYSTEM
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityITSystem',
    '3.5_3 EntityITSystem Node

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

-- 3.6_3 ENTITY PROCESS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityProcess',
    '3.6_3 EntityProcess Node

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

-- 3.7_3 SECTOR OBJECTIVE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorObjective',
    '3.7_3 SectorObjective Node

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

-- 3.8_3 SECTOR POLICY TOOL
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorPolicyTool',
    '3.8_3 SectorPolicyTool Node

Properties:
- id (string): Unique identifier
- name (string): Policy tool name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:REALIZED_VIA]-(SectorObjective)
- [:GOVERNED_BY]->(SectorObjective)
- [:REFERS_TO]->(SectorAdminRecord)
- [:SETS_PRIORITIES]->(EntityCapability)
- <-[:EXECUTES]-(EntityCapability)
- <-[:INFORMS]-(EntityRisk)

Level Meaning:
- L1: Tool Type
- L2: Tool Name
- L3: Impact Target',
    'SectorPolicyTool node schema',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.9_3 SECTOR PERFORMANCE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorPerformance',
    '3.9_3 SectorPerformance Node

Properties:
- id (string): Unique identifier
- name (string): Performance indicator name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:CASCADED_VIA]-(SectorObjective)
- [:AGGREGATES_TO]->(SectorObjective)
- [:SETS_TARGETS]->(EntityCapability)
- <-[:REPORTS]-(EntityCapability)
- <-[:MEASURED_BY]-(SectorDataTransaction)
- <-[:INFORMS]-(EntityRisk)

Level Meaning:
- L1: Strategic KPIs
- L2: Operational KPIs
- L3: Tactical Metrics',
    'SectorPerformance node schema',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.10_3 SECTOR ADMIN RECORD
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorAdminRecord',
    '3.10_3 SectorAdminRecord Node

Properties:
- id (string): Unique identifier
- name (string): Administrative record name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:REFERS_TO]-(SectorPolicyTool)
- [:APPLIED_ON]->(SectorBusiness)
- [:APPLIED_ON]->(SectorGovEntity)
- [:APPLIED_ON]->(SectorCitizen)

Level Meaning:
- L1: Record Category
- L2: Record Type
- L3: Specific Record',
    'SectorAdminRecord node schema',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.11_3 SECTOR BUSINESS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorBusiness',
    '3.11_3 SectorBusiness Node

Properties:
- id (string): Unique identifier
- name (string): Business entity name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:APPLIED_ON]-(SectorAdminRecord)
- [:TRIGGERS_EVENT]->(SectorDataTransaction)

Level Meaning:
- L1: Business Sector
- L2: Business Category
- L3: Specific Business',
    'SectorBusiness node schema',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.12_3 SECTOR GOV ENTITY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorGovEntity',
    '3.12_3 SectorGovEntity Node

Properties:
- id (string): Unique identifier
- name (string): Government entity name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:APPLIED_ON]-(SectorAdminRecord)
- [:TRIGGERS_EVENT]->(SectorDataTransaction)

Level Meaning:
- L1: Ministry/Department
- L2: Agency/Division
- L3: Specific Office',
    'SectorGovEntity node schema',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.13_3 SECTOR CITIZEN
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorCitizen',
    '3.13_3 SectorCitizen Node

Properties:
- id (string): Unique identifier
- name (string): Citizen segment name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:APPLIED_ON]-(SectorAdminRecord)
- [:TRIGGERS_EVENT]->(SectorDataTransaction)

Level Meaning:
- L1: Population Segment
- L2: Demographic Group
- L3: Specific Cohort',
    'SectorCitizen node schema',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.14_3 SECTOR DATA TRANSACTION
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SectorDataTransaction',
    '3.14_3 SectorDataTransaction Node

Properties:
- id (string): Unique identifier
- name (string): Transaction name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:TRIGGERS_EVENT]-(SectorBusiness|SectorGovEntity|SectorCitizen)
- [:MEASURED_BY]->(SectorPerformance)

Level Meaning:
- L1: Transaction Category
- L2: Transaction Type
- L3: Specific Transaction',
    'SectorDataTransaction node schema',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.15_3 ENTITY VENDOR
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityVendor',
    '3.15_3 EntityVendor Node

Properties:
- id (string): Unique identifier
- name (string): Vendor name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:DEPENDS_ON]-(EntityITSystem)

Level Meaning:
- L1: Vendor Category
- L2: Vendor Type
- L3: Specific Vendor',
    'EntityVendor node schema',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.16_3 ENTITY CULTURE HEALTH
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityCultureHealth',
    '3.16_3 EntityCultureHealth Node

Properties:
- id (string): Unique identifier
- name (string): Culture health indicator name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- [:MONITORS_FOR]->(EntityOrgUnit)

Level Meaning:
- L1: Culture Domain
- L2: Culture Area
- L3: Specific Health Indicator',
    'EntityCultureHealth node schema',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 3.17_3 ENTITY CHANGE ADOPTION
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EntityChangeAdoption',
    '3.17_3 EntityChangeAdoption Node

Properties:
- id (string): Unique identifier
- name (string): Change adoption name
- year (integer): Fiscal year
- quarter (string): Q1/Q2/Q3/Q4
- level (string): L1/L2/L3

Key Relationships:
- <-[:ADOPTION_RISKS]-(EntityProject)
- [:INCREASE_ADOPTION]->(EntityProject)

Level Meaning:
- L1: Domain (Collection of Business Domain functions being changed)
- L2: Area (Collection of Functional competencies being changed)
- L3: Behavior (Collection of Individual Competencies being changed)',
    'EntityChangeAdoption node schema',
    120,
    '3.4.0',
    NOW(),
    NOW()
);

-- ============================================
-- RELATIONSHIP SCHEMAS (4.x_3)
-- ============================================

-- 4.1_3 MONITORED BY RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'MONITORED_BY',
    '4.1_3 MONITORED_BY Relationship

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

-- 4.2_3 OPERATES RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'OPERATES',
    '4.2_3 OPERATES Relationship

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

-- 4.3_3 CLOSE GAPS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'CLOSE_GAPS',
    '4.3_3 CLOSE_GAPS Relationship

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

-- 4.4_3 CONTRIBUTES TO RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'CONTRIBUTES_TO',
    '4.4_3 CONTRIBUTES_TO Relationship

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

-- 4.5_3 REALIZED_VIA RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'REALIZED_VIA',
    '4.5_3 REALIZED_VIA Relationship

Pattern: (SectorObjective)-[:REALIZED_VIA]->(SectorPolicyTool)

Description: Links strategic objectives to the policy tools that realize them.

Usage:
MATCH (obj:SectorObjective {level: ''L3''})-[:REALIZED_VIA]->(tool:SectorPolicyTool {level: ''L3''})
WHERE obj.year = $year AND tool.year = $year
RETURN obj.name, tool.name

Domain: Sector Operations',
    'REALIZED_VIA relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.6_3 GOVERNED_BY RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'GOVERNED_BY',
    '4.6_3 GOVERNED_BY Relationship

Pattern: (SectorPolicyTool)-[:GOVERNED_BY]->(SectorObjective)

Description: Policy tools governed by strategic objectives.

Usage:
MATCH (tool:SectorPolicyTool {level: ''L3''})-[:GOVERNED_BY]->(obj:SectorObjective {level: ''L3''})
WHERE tool.year = $year AND obj.year = $year
RETURN tool.name, obj.name

Domain: Sector Operations',
    'GOVERNED_BY relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.7_3 CASCADED_VIA RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'CASCADED_VIA',
    '4.7_3 CASCADED_VIA Relationship

Pattern: (SectorObjective)-[:CASCADED_VIA]->(SectorPerformance)

Description: Objectives cascaded through performance indicators.

Usage:
MATCH (obj:SectorObjective {level: ''L3''})-[:CASCADED_VIA]->(perf:SectorPerformance {level: ''L3''})
WHERE obj.year = $year AND perf.year = $year
RETURN obj.name, perf.name

Domain: Sector Operations',
    'CASCADED_VIA relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.8_3 REFERS_TO RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'REFERS_TO',
    '4.8_3 REFERS_TO Relationship

Pattern: (SectorPolicyTool)-[:REFERS_TO]->(SectorAdminRecord)

Description: Policy tools referencing administrative records.

Usage:
MATCH (tool:SectorPolicyTool {level: ''L3''})-[:REFERS_TO]->(rec:SectorAdminRecord {level: ''L3''})
WHERE tool.year = $year AND rec.year = $year
RETURN tool.name, rec.name

Domain: Sector Operations',
    'REFERS_TO relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.9_3 APPLIED_ON RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'APPLIED_ON',
    '4.9_3 APPLIED_ON Relationship

Pattern: (SectorAdminRecord)-[:APPLIED_ON]->(SectorBusiness|SectorGovEntity|SectorCitizen)

Description: Administrative records applied on stakeholders.

Usage:
MATCH (rec:SectorAdminRecord {level: ''L3''})-[:APPLIED_ON]->(stakeholder)
WHERE rec.year = $year AND stakeholder.year = $year AND stakeholder.level = ''L3''
RETURN rec.name, labels(stakeholder)[0] AS type, stakeholder.name

Domain: Sector Operations',
    'APPLIED_ON relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.10_3 TRIGGERS_EVENT RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'TRIGGERS_EVENT',
    '4.10_3 TRIGGERS_EVENT Relationship

Pattern: (SectorBusiness|SectorGovEntity|SectorCitizen)-[:TRIGGERS_EVENT]->(SectorDataTransaction)

Description: Stakeholders triggering data transactions.

Usage:
MATCH (stakeholder)-[:TRIGGERS_EVENT]->(tx:SectorDataTransaction {level: ''L3''})
WHERE stakeholder.year = $year AND tx.year = $year AND stakeholder.level = ''L3''
RETURN labels(stakeholder)[0] AS type, stakeholder.name, tx.name

Domain: Sector Operations',
    'TRIGGERS_EVENT relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.11_3 MEASURED_BY RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'MEASURED_BY',
    '4.11_3 MEASURED_BY Relationship

Pattern: (SectorDataTransaction)-[:MEASURED_BY]->(SectorPerformance)

Description: Data transactions measured by performance indicators.

Usage:
MATCH (tx:SectorDataTransaction {level: ''L3''})-[:MEASURED_BY]->(perf:SectorPerformance {level: ''L3''})
WHERE tx.year = $year AND perf.year = $year
RETURN tx.name, perf.name

Domain: Sector Operations',
    'MEASURED_BY relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.12_3 AGGREGATES_TO RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'AGGREGATES_TO',
    '4.12_3 AGGREGATES_TO Relationship

Pattern: (SectorPerformance)-[:AGGREGATES_TO]->(SectorObjective)

Description: Performance metrics aggregating to strategic objectives.

Usage:
MATCH (perf:SectorPerformance {level: ''L3''})-[:AGGREGATES_TO]->(obj:SectorObjective {level: ''L3''})
WHERE perf.year = $year AND obj.year = $year
RETURN perf.name, obj.name

Domain: Sector Operations',
    'AGGREGATES_TO relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.13_3 INFORMS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'INFORMS',
    '4.13_3 INFORMS Relationship

Pattern: (EntityRisk)-[:INFORMS]->(SectorPerformance|SectorPolicyTool)

Description: Risks informing performance or policy decisions.

Usage:
MATCH (r:EntityRisk {level: ''L3''})-[:INFORMS]->(target)
WHERE r.year = $year AND target.year = $year AND target.level = ''L3''
RETURN r.name, labels(target)[0] AS type, target.name

Domain: Strategic Integrated Risk Management',
    'INFORMS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.14_3 SETS_PRIORITIES RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SETS_PRIORITIES',
    '4.14_3 SETS_PRIORITIES Relationship

Pattern: (SectorPolicyTool)-[:SETS_PRIORITIES]->(EntityCapability)

Description: Policy tools setting capability priorities.

Usage:
MATCH (tool:SectorPolicyTool {level: ''L3''})-[:SETS_PRIORITIES]->(cap:EntityCapability {level: ''L3''})
WHERE tool.year = $year AND cap.year = $year
RETURN tool.name, cap.name

Domain: Sector and Entity Relations',
    'SETS_PRIORITIES relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.15_3 SETS_TARGETS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'SETS_TARGETS',
    '4.15_3 SETS_TARGETS Relationship

Pattern: (SectorPerformance)-[:SETS_TARGETS]->(EntityCapability)

Description: Performance indicators setting capability targets.

Usage:
MATCH (perf:SectorPerformance {level: ''L3''})-[:SETS_TARGETS]->(cap:EntityCapability {level: ''L3''})
WHERE perf.year = $year AND cap.year = $year
RETURN perf.name, cap.name

Domain: Sector and Entity Relations',
    'SETS_TARGETS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.16_3 EXECUTES RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'EXECUTES',
    '4.16_3 EXECUTES Relationship

Pattern: (EntityCapability)-[:EXECUTES]->(SectorPolicyTool)

Description: Capabilities executing policy tools.

Usage:
MATCH (cap:EntityCapability {level: ''L3''})-[:EXECUTES]->(tool:SectorPolicyTool {level: ''L3''})
WHERE cap.year = $year AND tool.year = $year
RETURN cap.name, tool.name

Domain: Sector and Entity Relations',
    'EXECUTES relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.17_3 REPORTS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'REPORTS',
    '4.17_3 REPORTS Relationship

Pattern: (EntityCapability)-[:REPORTS]->(SectorPerformance)

Description: Capabilities reporting to performance indicators.

Usage:
MATCH (cap:EntityCapability {level: ''L3''})-[:REPORTS]->(perf:SectorPerformance {level: ''L3''})
WHERE cap.year = $year AND perf.year = $year
RETURN cap.name, perf.name

Domain: Sector and Entity Relations',
    'REPORTS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.18_3 ROLE_GAPS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'ROLE_GAPS',
    '4.18_3 ROLE_GAPS Relationship

Pattern: (EntityCapability)-[:ROLE_GAPS]->(EntityOrgUnit)

Description: Capability role gaps identified in organizational units.

Usage:
MATCH (cap:EntityCapability {level: ''L3''})-[:ROLE_GAPS]->(org:EntityOrgUnit {level: ''L3''})
WHERE cap.year = $year AND org.year = $year
RETURN cap.name, org.name

Domain: Entity Internal Operations',
    'ROLE_GAPS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.19_3 KNOWLEDGE_GAPS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'KNOWLEDGE_GAPS',
    '4.19_3 KNOWLEDGE_GAPS Relationship

Pattern: (EntityCapability)-[:KNOWLEDGE_GAPS]->(EntityProcess)

Description: Capability knowledge gaps identified in processes.

Usage:
MATCH (cap:EntityCapability {level: ''L3''})-[:KNOWLEDGE_GAPS]->(proc:EntityProcess {level: ''L3''})
WHERE cap.year = $year AND proc.year = $year
RETURN cap.name, proc.name

Domain: Entity Internal Operations',
    'KNOWLEDGE_GAPS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.20_3 AUTOMATION_GAPS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'AUTOMATION_GAPS',
    '4.20_3 AUTOMATION_GAPS Relationship

Pattern: (EntityCapability)-[:AUTOMATION_GAPS]->(EntityITSystem)

Description: Capability automation gaps identified in IT systems.

Usage:
MATCH (cap:EntityCapability {level: ''L3''})-[:AUTOMATION_GAPS]->(sys:EntityITSystem {level: ''L3''})
WHERE cap.year = $year AND sys.year = $year
RETURN cap.name, sys.name

Domain: Entity Internal Operations',
    'AUTOMATION_GAPS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.21_3 MONITORS_FOR RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'MONITORS_FOR',
    '4.21_3 MONITORS_FOR Relationship

Pattern: (EntityCultureHealth)-[:MONITORS_FOR]->(EntityOrgUnit)

Description: Culture health monitoring organizational units.

Usage:
MATCH (health:EntityCultureHealth {level: ''L3''})-[:MONITORS_FOR]->(org:EntityOrgUnit {level: ''L3''})
WHERE health.year = $year AND org.year = $year
RETURN health.name, org.name

Domain: Entity Internal Operations',
    'MONITORS_FOR relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.22_3 APPLY RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'APPLY',
    '4.22_3 APPLY Relationship

Pattern: (EntityOrgUnit)-[:APPLY]->(EntityProcess)

Description: Organizational units applying processes.

Usage:
MATCH (org:EntityOrgUnit {level: ''L3''})-[:APPLY]->(proc:EntityProcess {level: ''L3''})
WHERE org.year = $year AND proc.year = $year
RETURN org.name, proc.name

Domain: Entity Internal Operations',
    'APPLY relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.23_3 AUTOMATION RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'AUTOMATION',
    '4.23_3 AUTOMATION Relationship

Pattern: (EntityProcess)-[:AUTOMATION]->(EntityITSystem)

Description: Processes automated by IT systems.

Usage:
MATCH (proc:EntityProcess {level: ''L3''})-[:AUTOMATION]->(sys:EntityITSystem {level: ''L3''})
WHERE proc.year = $year AND sys.year = $year
RETURN proc.name, sys.name

Domain: Entity Internal Operations',
    'AUTOMATION relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.24_3 DEPENDS_ON RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'DEPENDS_ON',
    '4.24_3 DEPENDS_ON Relationship

Pattern: (EntityITSystem)-[:DEPENDS_ON]->(EntityVendor)

Description: IT systems depending on vendors.

Usage:
MATCH (sys:EntityITSystem {level: ''L3''})-[:DEPENDS_ON]->(vendor:EntityVendor {level: ''L3''})
WHERE sys.year = $year AND vendor.year = $year
RETURN sys.name, vendor.name

Domain: Entity Internal Operations',
    'DEPENDS_ON relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.25_3 GAPS_SCOPE RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'GAPS_SCOPE',
    '4.25_3 GAPS_SCOPE Relationship

Pattern: (EntityOrgUnit|EntityProcess|EntityITSystem)-[:GAPS_SCOPE]->(EntityProject)

Description: Operational layers scoping project gaps.

Usage:
MATCH (ops)-[:GAPS_SCOPE]->(proj:EntityProject {level: ''L3''})
WHERE ops.year = $year AND proj.year = $year AND ops.level = ''L3''
RETURN labels(ops)[0] AS type, ops.name, proj.name

Domain: Transforming Entity Capabilities',
    'GAPS_SCOPE relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.26_3 ADOPTION_RISKS RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'ADOPTION_RISKS',
    '4.26_3 ADOPTION_RISKS Relationship

Pattern: (EntityProject)-[:ADOPTION_RISKS]->(EntityChangeAdoption)

Description: Projects with adoption risks.

Usage:
MATCH (proj:EntityProject {level: ''L3''})-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {level: ''L3''})
WHERE proj.year = $year AND adopt.year = $year
RETURN proj.name, adopt.name

Domain: Project to Operation Transfer',
    'ADOPTION_RISKS relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- 4.27_3 INCREASE_ADOPTION RELATIONSHIP
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'INCREASE_ADOPTION',
    '4.27_3 INCREASE_ADOPTION Relationship

Pattern: (EntityChangeAdoption)-[:INCREASE_ADOPTION]->(EntityProject)

Description: Change adoptions increasing project adoption.

Usage:
MATCH (adopt:EntityChangeAdoption {level: ''L3''})-[:INCREASE_ADOPTION]->(proj:EntityProject {level: ''L3''})
WHERE adopt.year = $year AND proj.year = $year
RETURN adopt.name, proj.name

Domain: Project to Operation Transfer',
    'INCREASE_ADOPTION relationship definition',
    100,
    '3.4.0',
    NOW(),
    NOW()
);

-- ============================================
-- INDIVIDUAL BUSINESS CHAIN SCHEMAS (5.x_3)
-- ============================================

-- 5.1_3 BUSINESS CHAIN: SECTOR OPS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_SectorOps',
    '5.1_3 Business Chain: SectorOps

Path: SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective

Story: Describes how government objectives are executed externally through policy tools, stakeholder interactions, and performance measurement cycles.

Query Pattern:
MATCH (obj:SectorObjective {level: ''L3'', year: $year})
OPTIONAL MATCH (obj)-[:REALIZED_VIA]->(tool:SectorPolicyTool {level: ''L3''})
OPTIONAL MATCH (tool)-[:REFERS_TO]->(rec:SectorAdminRecord {level: ''L3''})
OPTIONAL MATCH (rec)-[:APPLIED_ON]->(stakeholder)
WHERE stakeholder.level = ''L3''
OPTIONAL MATCH (stakeholder)-[:TRIGGERS_EVENT]->(tx:SectorDataTransaction {level: ''L3''})
OPTIONAL MATCH (tx)-[:MEASURED_BY]->(perf:SectorPerformance {level: ''L3''})
OPTIONAL MATCH (perf)-[:AGGREGATES_TO]->(result:SectorObjective {level: ''L3''})
RETURN obj.name, tool.name, rec.name, labels(stakeholder)[0], tx.name, perf.name, result.name
LIMIT 30',
    'SectorOps business chain with full query pattern',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.2_3 BUSINESS CHAIN: STRATEGY TO TACTICS PRIORITY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Strategy_to_Tactics_Priority',
    '5.2_3 Business Chain: Strategy_to_Tactics_Priority_Capabilities

Path: SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption

Story: Explains how strategic goals cascade through policy tools to shape capability-building and implementation projects.

Query Pattern:
MATCH (obj:SectorObjective {level: ''L3'', year: $year})
OPTIONAL MATCH (obj)-[:REALIZED_VIA]->(tool:SectorPolicyTool {level: ''L3''})
OPTIONAL MATCH (tool)-[:SETS_PRIORITIES]->(cap:EntityCapability {level: ''L3''})
OPTIONAL MATCH (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
WHERE ops.level = ''L3''
OPTIONAL MATCH (ops)<-[:CLOSE_GAPS]-(proj:EntityProject {level: ''L3''})
OPTIONAL MATCH (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {level: ''L3''})
RETURN obj.name, tool.name, cap.name, labels(ops)[0], proj.name, adopt.name
LIMIT 30',
    'Strategy to Tactics Priority business chain with query pattern',
    220,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.3_3 BUSINESS CHAIN: STRATEGY TO TACTICS TARGETS
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Strategy_to_Tactics_Targets',
    '5.3_3 Business Chain: Strategy_to_Tactics_Capabilities_Targets

Path: SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption

Story: Captures how performance targets flow top-down from strategy to operational projects via capabilities.

Query Pattern:
MATCH (obj:SectorObjective {level: ''L3'', year: $year})
OPTIONAL MATCH (obj)-[:CASCADED_VIA]->(perf:SectorPerformance {level: ''L3''})
OPTIONAL MATCH (perf)-[:SETS_TARGETS]->(cap:EntityCapability {level: ''L3''})
OPTIONAL MATCH (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
WHERE ops.level = ''L3''
OPTIONAL MATCH (ops)<-[:CLOSE_GAPS]-(proj:EntityProject {level: ''L3''})
OPTIONAL MATCH (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {level: ''L3''})
RETURN obj.name, perf.name, cap.name, labels(ops)[0], proj.name, adopt.name
LIMIT 30',
    'Strategy to Tactics Targets business chain with query pattern',
    220,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.4_3 BUSINESS CHAIN: TACTICAL TO STRATEGY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Tactical_to_Strategy',
    '5.4_3 Business Chain: Tactical_to_Strategy

Path: EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → SectorPerformance|SectorPolicyTool → SectorObjective

Story: Describes the feedback loop where project execution informs higher-level strategy and policy decisions.

Query Pattern:
MATCH (adopt:EntityChangeAdoption {level: ''L3'', year: $year})
OPTIONAL MATCH (adopt)-[:INCREASE_ADOPTION]->(proj:EntityProject {level: ''L3''})
OPTIONAL MATCH (proj)-[:CLOSE_GAPS]->(ops)
WHERE ops.level = ''L3''
OPTIONAL MATCH (ops)-[:OPERATES]->(cap:EntityCapability {level: ''L3''})
OPTIONAL MATCH (cap)-[:REPORTS]->(perf:SectorPerformance {level: ''L3''})
OPTIONAL MATCH (cap)-[:EXECUTES]->(tool:SectorPolicyTool {level: ''L3''})
OPTIONAL MATCH (perf)-[:AGGREGATES_TO]->(obj:SectorObjective {level: ''L3''})
OPTIONAL MATCH (tool)-[:GOVERNED_BY]->(obj2:SectorObjective {level: ''L3''})
RETURN adopt.name, proj.name, labels(ops)[0], cap.name, perf.name, tool.name, COALESCE(obj.name, obj2.name)
LIMIT 30',
    'Tactical to Strategy business chain with query pattern',
    250,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.5_3 BUSINESS CHAIN: RISK BUILD MODE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Risk_Build_Mode',
    '5.5_3 Business Chain: Risk_Build_Mode

Path: EntityCapability → EntityRisk → SectorPolicyTool

Story: Illustrates how operational risks influence the design and activation of policy tools.

Query Pattern:
MATCH (cap:EntityCapability {level: ''L3'', year: $year})
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk {level: ''L3''})
WHERE risk.risk_score > 7
OPTIONAL MATCH (risk)-[:INFORMS]->(tool:SectorPolicyTool {level: ''L3''})
RETURN cap.name, risk.name, risk.risk_score, tool.name
LIMIT 30',
    'Risk Build Mode business chain with query pattern',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.6_3 BUSINESS CHAIN: RISK OPERATE MODE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Risk_Operate_Mode',
    '5.6_3 Business Chain: Risk_Operate_Mode

Path: EntityCapability → EntityRisk → SectorPerformance

Story: Explains how capability-level risks affect performance outcomes and KPI achievement.

Query Pattern:
MATCH (cap:EntityCapability {level: ''L3'', year: $year})
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk {level: ''L3''})
WHERE risk.risk_score > 7
OPTIONAL MATCH (risk)-[:INFORMS]->(perf:SectorPerformance {level: ''L3''})
RETURN cap.name, risk.name, risk.risk_score, perf.name
LIMIT 30',
    'Risk Operate Mode business chain with query pattern',
    150,
    '3.4.0',
    NOW(),
    NOW()
);

-- 5.7_3 BUSINESS CHAIN: INTERNAL EFFICIENCY
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'business_chain_Internal_Efficiency',
    '5.7_3 Business Chain: Internal_Efficiency

Path: EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor

Story: Represents how organizational health drives process and IT efficiency through vendor ecosystems.

Query Pattern:
MATCH (health:EntityCultureHealth {level: ''L3'', year: $year})
OPTIONAL MATCH (health)-[:MONITORS_FOR]->(org:EntityOrgUnit {level: ''L3''})
OPTIONAL MATCH (org)-[:APPLY]->(proc:EntityProcess {level: ''L3''})
OPTIONAL MATCH (proc)-[:AUTOMATION]->(sys:EntityITSystem {level: ''L3''})
OPTIONAL MATCH (sys)-[:DEPENDS_ON]->(vendor:EntityVendor {level: ''L3''})
RETURN health.name, org.name, proc.name, sys.name, vendor.name
LIMIT 30',
    'Internal Efficiency business chain with query pattern',
    180,
    '3.4.0',
    NOW(),
    NOW()
);

-- ============================================
-- VISUALIZATION SCHEMAS (6.x_3)
-- ============================================

-- 6.1_3 VISUALIZATION SCHEMA (Overview)
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'visualization_schema',
    '5.1_3 VISUALIZATION SCHEMA

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

-- 5.2_3 CHART TYPE COLUMN
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Column',
    '5.2_3 Column Chart (type: "column")

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

-- 5.3_3 CHART TYPE LINE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Line',
    '5.3_3 Line Chart (type: "line")

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

-- 5.4_3 CHART TYPE TABLE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Table',
    '5.4_3 Table (type: "table")

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

-- 5.5_3 CHART TYPE PIE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Pie',
    '5.5_3 Pie Chart (type: "pie")

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

-- 5.6_3 CHART TYPE RADAR
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Radar',
    '5.6_3 Radar Chart (type: "radar")

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

-- 5.7_3 CHART TYPE SCATTER
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Scatter',
    '5.7_3 Scatter Chart (type: "scatter")

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

-- 5.8_3 CHART TYPE BUBBLE
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Bubble',
    '5.8_3 Bubble Chart (type: "bubble")

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

-- 5.9_3 CHART TYPE COMBO
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Combo',
    '5.9_3 Combo Chart (type: "combo")

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

-- 5.10_3 CHART TYPE HTML
INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, created_at, updated_at) VALUES (
    'tier3_elements',
    'chart_type_Html',
    '5.10_3 HTML Visualization (type: "html")

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

-- ============================================
-- DESIGN CLEANUP (v3.4 END STATE)
-- ============================================

-- Remove aggregates and gap-type relationships that are not part of the final T3 set
DELETE FROM instruction_elements
WHERE element IN (
    'graph_schema', 'direct_relationships', 'business_chains', 'visualization_schema',
    'AUTOMATION', 'AUTOMATION_GAPS', 'KNOWLEDGE_GAPS', 'ROLE_GAPS', 'GAPS_SCOPE'
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify element count (should be 56 elements per END STATE v3.4)
-- Breakdown: 17 nodes, 23 relationships, 7 business chains, 9 chart types, 3 query patterns
-- SELECT COUNT(*) as element_count FROM instruction_elements;

-- Verify no duplicates
-- SELECT element, COUNT(*) as count FROM instruction_elements GROUP BY element HAVING COUNT(*) > 1;

-- Verify removed elements are NOT present (moved to Tier 1/2 or removed by design)
-- SELECT element FROM instruction_elements WHERE element IN ('graph_schema', 'direct_relationships', 'business_chains', 'visualization_schema', 'AUTOMATION', 'AUTOMATION_GAPS', 'KNOWLEDGE_GAPS', 'ROLE_GAPS', 'GAPS_SCOPE');

-- Verify all 17 node types present
-- SELECT element FROM instruction_elements WHERE bundle = 'tier3_elements' AND (element LIKE 'Entity%' OR element LIKE 'Sector%');

-- Verify all 23 relationship types present
-- SELECT element FROM instruction_elements WHERE element IN ('ADOPTION_RISKS', 'AGGREGATES_TO', 'APPLIED_ON', 'APPLY', 'CASCADED_VIA', 'CLOSE_GAPS', 'CONTRIBUTES_TO', 'DEPENDS_ON', 'EXECUTES', 'GOVERNED_BY', 'INCREASE_ADOPTION', 'INFORMS', 'MEASURED_BY', 'MONITORED_BY', 'MONITORS_FOR', 'OPERATES', 'PARENT_OF', 'REALIZED_VIA', 'REFERS_TO', 'REPORTS', 'SETS_PRIORITIES', 'SETS_TARGETS', 'TRIGGERS_EVENT');

-- Verify all 7 business chains present
-- SELECT element FROM instruction_elements WHERE element LIKE 'business_chain_%';

-- Verify version is 3.4.0
-- SELECT element, version FROM instruction_elements WHERE version = '3.4.0' LIMIT 5;
