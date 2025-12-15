-- =====================================================
-- NOOR COGNITIVE DIGITAL TWIN v3.0 - ATOMIC INSTRUCTION BUNDLES
-- Truly atomic modules per Bible Section 5.2
-- Date: 2025-12-05
-- Reference: docs/NOOR_V3_IMPLEMENTATION_BIBLE.md
-- =====================================================

-- =====================================================
-- SECTION 1: NODE TYPE BUNDLES (~100-150 tokens each)
-- =====================================================

-- NODE: EntityProject
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_projects',
    'Node: EntityProject',
    '<NODE_SCHEMA label="EntityProject">
  <PROPERTIES>
    <PROP name="id" type="string" required="true" description="Unique identifier"/>
    <PROP name="name" type="string" required="true" description="Project name"/>
    <PROP name="year" type="integer" required="true" description="Fiscal year"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3" description="L1=Portfolio, L2=Program, L3=Project Output"/>
    <PROP name="budget" type="number" description="Allocated budget"/>
    <PROP name="progress_percentage" type="number" min="0" max="100" description="Completion percentage"/>
    <PROP name="status" type="string" description="Active, Planned, Closed"/>
    <PROP name="start_date" type="date" description="Project start date"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Portfolio - collection of Programs and Projects</LEVEL>
    <LEVEL id="L2">Program - collection of Projects</LEVEL>
    <LEVEL id="L3">Project Output - Milestones or Key Deliverables</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    120,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityCapability
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_capabilities',
    'Node: EntityCapability',
    '<NODE_SCHEMA label="EntityCapability">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="maturity_level" type="number" description="Capability maturity score"/>
    <PROP name="description" type="string"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Business Domain - collection of Functions</LEVEL>
    <LEVEL id="L2">Function - collection of Competencies</LEVEL>
    <LEVEL id="L3">Competency - OrgUnits applying Processes utilizing ITSystems</LEVEL>
  </LEVEL_DEFINITIONS>
  <NOTE>Capability is the HUB connecting upward to Sector nodes and downward to Entity operations</NOTE>
</NODE_SCHEMA>',
    'node',
    110,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityRisk
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_risks',
    'Node: EntityRisk',
    '<NODE_SCHEMA label="EntityRisk">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="risk_score" type="number" min="1" max="10" description="1-10 scale. High risk > 7"/>
    <PROP name="risk_category" type="string"/>
    <PROP name="risk_status" type="string"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Domain Risks - collection of Domain Risks</LEVEL>
    <LEVEL id="L2">Functional Risks - collection of Functional Risks</LEVEL>
    <LEVEL id="L3">Specific Risk - Single Specific Risk</LEVEL>
  </LEVEL_DEFINITIONS>
  <WARNING>Do NOT use "severity" property - use risk_score instead</WARNING>
</NODE_SCHEMA>',
    'node',
    100,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: SectorObjective
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_sec_objectives',
    'Node: SectorObjective',
    '<NODE_SCHEMA label="SectorObjective">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="budget_allocated" type="number"/>
    <PROP name="priority_level" type="string"/>
    <PROP name="status" type="string"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Strategic Goals</LEVEL>
    <LEVEL id="L2">Cascaded Goals</LEVEL>
    <LEVEL id="L3">KPI Parameters</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    90,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityOrgUnit
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_org_units',
    'Node: EntityOrgUnit',
    '<NODE_SCHEMA label="EntityOrgUnit">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Department - Single Largest Possible Department</LEVEL>
    <LEVEL id="L2">Sub-Dept - collection of Sub-Departments</LEVEL>
    <LEVEL id="L3">Team - collection of Teams or Individuals</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    80,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityITSystem
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_it_systems',
    'Node: EntityITSystem',
    '<NODE_SCHEMA label="EntityITSystem">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Platform - Single Largest Platform</LEVEL>
    <LEVEL id="L2">Module - collection of Modules</LEVEL>
    <LEVEL id="L3">Feature - collection of Features</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    75,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityProcess
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_processes',
    'Node: EntityProcess',
    '<NODE_SCHEMA label="EntityProcess">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="efficiency_score" type="number"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
</NODE_SCHEMA>',
    'node',
    60,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: SectorPolicyTool
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_sec_policy_tools',
    'Node: SectorPolicyTool',
    '<NODE_SCHEMA label="SectorPolicyTool">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="tool_type" type="string"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Tool Type</LEVEL>
    <LEVEL id="L2">Tool Name</LEVEL>
    <LEVEL id="L3">Impact Target</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    75,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: SectorPerformance
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_sec_performance',
    'Node: SectorPerformance',
    '<NODE_SCHEMA label="SectorPerformance">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
    <PROP name="metric_value" type="number"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
</NODE_SCHEMA>',
    'node',
    55,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- NODE: EntityChangeAdoption
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'node_ent_change_adoption',
    'Node: EntityChangeAdoption',
    '<NODE_SCHEMA label="EntityChangeAdoption">
  <PROPERTIES>
    <PROP name="id" type="string" required="true"/>
    <PROP name="name" type="string" required="true"/>
    <PROP name="year" type="integer" required="true"/>
    <PROP name="level" type="string" required="true" enum="L1,L2,L3"/>
  </PROPERTIES>
  <COMPOSITE_KEY>id + year</COMPOSITE_KEY>
  <LEVEL_DEFINITIONS>
    <LEVEL id="L1">Domain - Business Domain functions being changed</LEVEL>
    <LEVEL id="L2">Area - Functional competencies being changed</LEVEL>
    <LEVEL id="L3">Behavior - Individual Competencies being changed</LEVEL>
  </LEVEL_DEFINITIONS>
</NODE_SCHEMA>',
    'node',
    80,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 2: RELATIONSHIP BUNDLES (~50-100 tokens each)
-- =====================================================

-- REL: MONITORED_BY
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_monitored_by',
    'Relationship: MONITORED_BY',
    '<RELATIONSHIP type="MONITORED_BY">
  <FROM>EntityCapability</FROM>
  <TO>EntityRisk</TO>
  <SEMANTICS>Capabilities are monitored for associated risks</SEMANTICS>
  <CONSTRAINT>Same-level only (L3 to L3)</CONSTRAINT>
  <PATTERN>
    MATCH (c:EntityCapability)-[:MONITORED_BY]->(r:EntityRisk)
    WHERE c.level = r.level AND c.year = r.year
  </PATTERN>
</RELATIONSHIP>',
    'relationship',
    60,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: OPERATES
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_operates',
    'Relationship: OPERATES',
    '<RELATIONSHIP type="OPERATES">
  <FROM>EntityOrgUnit | EntityProcess | EntityITSystem</FROM>
  <TO>EntityCapability</TO>
  <SEMANTICS>Operational entities operate capabilities</SEMANTICS>
  <CONSTRAINT>Same-level only</CONSTRAINT>
  <PATTERN>
    MATCH (o)-[:OPERATES]->(c:EntityCapability)
    WHERE (o:EntityOrgUnit OR o:EntityProcess OR o:EntityITSystem)
    AND o.level = c.level AND o.year = c.year
  </PATTERN>
</RELATIONSHIP>',
    'relationship',
    70,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: CLOSE_GAPS / ADDRESSES_GAP
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_close_gaps',
    'Relationship: CLOSE_GAPS',
    '<RELATIONSHIP type="CLOSE_GAPS">
  <ALIASES>ADDRESSES_GAP, CLOSES_GAPS</ALIASES>
  <FROM>EntityProject</FROM>
  <TO>EntityOrgUnit | EntityProcess | EntityITSystem</TO>
  <SEMANTICS>Projects close operational gaps</SEMANTICS>
  <CONSTRAINT>Same-level only</CONSTRAINT>
  <PATTERN>
    MATCH (p:EntityProject)-[:CLOSE_GAPS|ADDRESSES_GAP]->(g)
    WHERE (g:EntityOrgUnit OR g:EntityProcess OR g:EntityITSystem)
    AND p.level = g.level AND p.year = g.year
  </PATTERN>
  <NOTE>Use OPTIONAL MATCH to avoid losing projects without gaps</NOTE>
</RELATIONSHIP>',
    'relationship',
    90,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: PARENT_OF
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_parent_of',
    'Relationship: PARENT_OF',
    '<RELATIONSHIP type="PARENT_OF">
  <FROM>Any Node (same type)</FROM>
  <TO>Any Node (same type)</TO>
  <SEMANTICS>Hierarchical parent-child within same node type</SEMANTICS>
  <EXCEPTION>ONLY relationship that crosses levels (L1->L2->L3)</EXCEPTION>
  <PATTERN>
    MATCH (parent)-[:PARENT_OF]->(child)
    WHERE labels(parent) = labels(child)
  </PATTERN>
  <USE_CASE>Prevents orphan L2 and L3 entries</USE_CASE>
</RELATIONSHIP>',
    'relationship',
    70,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: REQUIRES
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_requires',
    'Relationship: REQUIRES',
    '<RELATIONSHIP type="REQUIRES">
  <FROM>SectorObjective</FROM>
  <TO>SectorPolicyTool</TO>
  <SEMANTICS>Objectives are realized via policy tools</SEMANTICS>
  <CONSTRAINT>Same-level only</CONSTRAINT>
  <PATTERN>
    MATCH (o:SectorObjective)-[:REQUIRES]->(t:SectorPolicyTool)
    WHERE o.level = t.level AND o.year = t.year
  </PATTERN>
</RELATIONSHIP>',
    'relationship',
    55,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: UTILIZES
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_utilizes',
    'Relationship: UTILIZES',
    '<RELATIONSHIP type="UTILIZES">
  <FROM>SectorPolicyTool</FROM>
  <TO>EntityCapability</TO>
  <SEMANTICS>Policy tools utilize entity capabilities</SEMANTICS>
  <CONSTRAINT>Same-level only</CONSTRAINT>
  <PATTERN>
    MATCH (t:SectorPolicyTool)-[:UTILIZES]->(c:EntityCapability)
    WHERE t.level = c.level AND t.year = c.year
  </PATTERN>
</RELATIONSHIP>',
    'relationship',
    55,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- REL: CONTRIBUTES_TO
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'rel_contributes_to',
    'Relationship: CONTRIBUTES_TO',
    '<RELATIONSHIP type="CONTRIBUTES_TO">
  <FROM>EntityProject</FROM>
  <TO>SectorObjective</TO>
  <SEMANTICS>Projects contribute to sector objectives</SEMANTICS>
  <CONSTRAINT>Same-level only</CONSTRAINT>
  <NOTE>This relationship may be hypothetical - verify existence before using</NOTE>
</RELATIONSHIP>',
    'relationship',
    50,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 3: BUSINESS CHAIN BUNDLES (~100-150 tokens each)
-- =====================================================

-- CHAIN: SectorOps
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_sector_ops',
    'Chain: SectorOps',
    '<BUSINESS_CHAIN id="SectorOps">
  <PATH>SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective</PATH>
  <STORY>Describes how government objectives are executed externally through policy tools, stakeholder interactions, and performance measurement cycles.</STORY>
  <USE_WHEN>User asks about objective execution, policy implementation, or performance feedback loop</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    90,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Strategy_to_Tactics_Priority
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_strategy_to_tactics_priority',
    'Chain: Strategy to Tactics (Priority)',
    '<BUSINESS_CHAIN id="Strategy_to_Tactics_Priority_Capabilities">
  <PATH>SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption</PATH>
  <STORY>Explains how strategic goals cascade through policy tools to shape capability-building and implementation projects.</STORY>
  <USE_WHEN>User asks how strategy translates to projects, or capability gaps drive project selection</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    85,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Strategy_to_Tactics_Targets
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_strategy_to_tactics_targets',
    'Chain: Strategy to Tactics (Targets)',
    '<BUSINESS_CHAIN id="Strategy_to_Tactics_Capabilities_Targets">
  <PATH>SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption</PATH>
  <STORY>Captures how performance targets flow top-down from strategy to operational projects via capabilities.</STORY>
  <USE_WHEN>User asks about KPI-driven project selection or performance target alignment</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    85,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Tactical_to_Strategy
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_tactical_to_strategy',
    'Chain: Tactical to Strategy',
    '<BUSINESS_CHAIN id="Tactical_to_Strategy">
  <PATH>EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → SectorPerformance|SectorPolicyTool → SectorObjective</PATH>
  <STORY>Describes the feedback loop where project execution informs higher-level strategy and policy decisions.</STORY>
  <USE_WHEN>User asks about bottom-up feedback, lessons learned, or how project outcomes influence strategy</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    90,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Risk_Build_Mode
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_risk_build_mode',
    'Chain: Risk Build Mode',
    '<BUSINESS_CHAIN id="Risk_Build_Mode">
  <PATH>EntityCapability → EntityRisk → SectorPolicyTool</PATH>
  <STORY>Illustrates how operational risks influence the design and activation of policy tools.</STORY>
  <USE_WHEN>User asks about risk-informed policy design or how risks shape tool selection</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    65,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Risk_Operate_Mode
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_risk_operate_mode',
    'Chain: Risk Operate Mode',
    '<BUSINESS_CHAIN id="Risk_Operate_Mode">
  <PATH>EntityCapability → EntityRisk → SectorPerformance</PATH>
  <STORY>Explains how capability-level risks affect performance outcomes and KPI achievement.</STORY>
  <USE_WHEN>User asks about risk impact on performance, or KPI miss due to capability risks</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    65,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CHAIN: Internal_Efficiency
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'chain_internal_efficiency',
    'Chain: Internal Efficiency',
    '<BUSINESS_CHAIN id="Internal_Efficiency">
  <PATH>EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor</PATH>
  <STORY>Represents how organizational health drives process and IT efficiency through vendor ecosystems.</STORY>
  <USE_WHEN>User asks about internal operations, process efficiency, or IT system dependencies</USE_WHEN>
</BUSINESS_CHAIN>',
    'chain',
    70,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 4: CYPHER PATTERN BUNDLES (~150-200 tokens each)
-- =====================================================

-- CYPHER: Optimized Retrieval
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_optimized_retrieval',
    'Cypher: Optimized Retrieval',
    '<CYPHER_PATTERN id="optimized_retrieval">
  <GOAL>Get items with total count in one call (token-aware)</GOAL>
  <TEMPLATE>
MATCH (p:EntityProject)
WHERE p.year = $year AND p.level = ''L3''
WITH p ORDER BY p.name
RETURN count(p) AS total_count, collect(p { .id, .name })[0..30] AS records
  </TEMPLATE>
  <RULES>
    <RULE>Return count FIRST so model sees it immediately</RULE>
    <RULE>Use collect()[0..30] for sampling</RULE>
    <RULE>Always filter by year and level</RULE>
  </RULES>
</CYPHER_PATTERN>',
    'cypher',
    120,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CYPHER: Impact Analysis
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_impact_analysis',
    'Cypher: Impact Analysis',
    '<CYPHER_PATTERN id="impact_analysis">
  <GOAL>Trace strategy to execution flow (Chain 1)</GOAL>
  <TEMPLATE>
MATCH (p:EntityProject {name: $projectName, year: $year, level: ''L3''})
MATCH (p)-[:ADDRESSES_GAP]->(c:EntityCapability)
MATCH (c)-[:EXECUTES]->(t:SectorPolicyTool)
WHERE c.level = ''L3'' AND t.level = ''L3''
RETURN p.name, c.name, t.name
  </TEMPLATE>
  <RULES>
    <RULE>All nodes must be same level</RULE>
    <RULE>Use parameterized queries</RULE>
  </RULES>
</CYPHER_PATTERN>',
    'cypher',
    110,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CYPHER: Portfolio Health Check
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_portfolio_health',
    'Cypher: Portfolio Health Check',
    '<CYPHER_PATTERN id="portfolio_health">
  <GOAL>Aggregation first + optional enrichment without losing rows</GOAL>
  <TEMPLATE>
MATCH (p:EntityProject)
WHERE p.year = $year AND p.level = ''L3'' 
  AND (p.start_date IS NULL OR p.start_date <= date($today))
WITH p ORDER BY p.name
WITH count(p) AS total_projects, 
     collect(p { .id, .name, .budget, .progress_percentage })[0..30] AS sample_projects
OPTIONAL MATCH (p)-[:ADDRESSES_GAP]->(g:EntityOrgUnit)
WHERE g.year = $year AND g.level = ''L3''
OPTIONAL MATCH (c:EntityCapability)-[:MONITORED_BY]->(r:EntityRisk)
WHERE r.risk_score > 7
RETURN total_projects, sample_projects, collect(DISTINCT r)[0..5] AS critical_risks
  </TEMPLATE>
  <RULES>
    <RULE>Existence check before enrichment</RULE>
    <RULE>Use OPTIONAL MATCH for relationships that may not exist</RULE>
    <RULE>Apply temporal filter on start_date</RULE>
  </RULES>
</CYPHER_PATTERN>',
    'cypher',
    180,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CYPHER: Vector Concept Search
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_vector_concept_search',
    'Cypher: Vector Concept Search',
    '<CYPHER_PATTERN id="vector_concept_search">
  <GOAL>Text-to-Node semantic search when user mentions topic but no specific entity</GOAL>
  <TEMPLATE>
CALL db.index.vector.queryNodes($indexName, $k, $queryVector) 
YIELD node, score
WHERE node.embedding IS NOT NULL
RETURN coalesce(node.id, elementId(node)) AS id, 
       node.name AS name, 
       score
  </TEMPLATE>
  <USE_WHEN>User asks about a topic (e.g., "Water leaks", "Digital") but names no specific entity</USE_WHEN>
</CYPHER_PATTERN>',
    'cypher',
    100,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CYPHER: Vector Similarity (Node-to-Node)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_vector_similarity',
    'Cypher: Vector Similarity',
    '<CYPHER_PATTERN id="vector_similarity">
  <GOAL>Node-to-Node inference - find similar items or infer missing links</GOAL>
  <TEMPLATE>
MATCH (p:EntityProject {id:$projectId, year:$year, level:$level})
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
ORDER BY score DESC LIMIT $k
  </TEMPLATE>
  <USE_WHEN>User asks to "infer links", "find similar projects", or "fill gaps"</USE_WHEN>
</CYPHER_PATTERN>',
    'cypher',
    200,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CYPHER: Keyset Pagination
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cypher_keyset_pagination',
    'Cypher: Keyset Pagination',
    '<CYPHER_PATTERN id="keyset_pagination">
  <GOAL>Efficient pagination without SKIP/OFFSET</GOAL>
  <TEMPLATE>
MATCH (n:EntityProject)
WHERE n.year = $year AND n.level = ''L3'' AND n.id > $last_seen_id
ORDER BY n.id
LIMIT 30
RETURN n.id, n.name
  </TEMPLATE>
  <RULES>
    <RULE>NEVER use SKIP or OFFSET</RULE>
    <RULE>Filter by last seen ID</RULE>
    <RULE>Always ORDER BY n.id</RULE>
    <RULE>LIMIT to 30 items maximum</RULE>
  </RULES>
</CYPHER_PATTERN>',
    'cypher',
    100,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 5: CONSTRAINT BUNDLES (~50-100 tokens each)
-- =====================================================

-- CONSTRAINT: Keyset Pagination
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'constraint_keyset_pagination',
    'Constraint: Keyset Pagination',
    '<CONSTRAINT name="KeysetPagination">
  <RULE>Queries MUST NOT use SKIP or OFFSET keywords</RULE>
  <INSTEAD>Use WHERE n.id > $last_seen_id ORDER BY n.id LIMIT 30</INSTEAD>
  <VIOLATION>MCP tool will reject queries with SKIP/OFFSET</VIOLATION>
</CONSTRAINT>',
    'constraint',
    50,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CONSTRAINT: Level Integrity
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'constraint_level_integrity',
    'Constraint: Level Integrity',
    '<CONSTRAINT name="LevelIntegrity">
  <RULE>All nodes in a traversal path MUST have matching level properties</RULE>
  <VALID>L3 ↔ L3, L2 ↔ L2, L1 ↔ L1</VALID>
  <INVALID>L2 → L3 mixing (except via PARENT_OF)</INVALID>
  <EXCEPTION>PARENT_OF is the ONLY relationship that crosses levels</EXCEPTION>
  <PATTERN>WHERE n.level = ''L3'' AND m.level = ''L3''</PATTERN>
</CONSTRAINT>',
    'constraint',
    70,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CONSTRAINT: Efficiency
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'constraint_efficiency',
    'Constraint: Efficiency',
    '<CONSTRAINT name="Efficiency">
  <RULE>Return only id and name properties</RULE>
  <RULE>Do NOT return embedding vectors</RULE>
  <RULE>Use count(n) for totals, collect(n)[0..30] for samples</RULE>
  <VIOLATION>MCP tool will reject queries that return embeddings</VIOLATION>
</CONSTRAINT>',
    'constraint',
    55,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CONSTRAINT: Temporal Filtering
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'constraint_temporal_filtering',
    'Constraint: Temporal Filtering',
    '<CONSTRAINT name="TemporalFiltering">
  <RULE>Every query MUST filter by year property</RULE>
  <RULE>Include level filter for all nodes</RULE>
  <RULE>For active projects: AND (n.start_date IS NULL OR n.start_date <= date($today))</RULE>
  <COMPOSITE_KEY>Unique entities defined by id + year</COMPOSITE_KEY>
</CONSTRAINT>',
    'constraint',
    60,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- CONSTRAINT: Aggregation First
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'constraint_aggregation_first',
    'Constraint: Aggregation First',
    '<CONSTRAINT name="AggregationFirst">
  <RULE>Use count(n) for totals and collect(n)[0..30] for samples in a SINGLE QUERY</RULE>
  <RULE>Existence check before enrichment</RULE>
  <RULE>If enriched query returns no rows, retry with simplified query</RULE>
  <PATTERN>
    WITH count(p) AS total, collect(p)[0..30] AS sample
    OPTIONAL MATCH ... (enrichment)
  </PATTERN>
</CONSTRAINT>',
    'constraint',
    70,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 6: MODE-SPECIFIC BUNDLES
-- =====================================================

-- MODE: Quick Exit (D/F)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'mode_quick_exit',
    'Mode: Quick Exit (D/F)',
    '<MODE_HANDLER modes="D,F">
  <RULE>SKIP Steps 2, 3, and 4 entirely</RULE>
  <RULE>Jump directly to Step 5: RETURN</RULE>
  <RULE>Latency target: less than 500 milliseconds</RULE>
  <MODE_D name="Acquaintance">
    <RESPONSE trigger="what can you do">I am Noor, your Cognitive Digital Twin. I can help you analyze institutional data, identify gaps in capabilities, track project performance, and provide strategic insights.</RESPONSE>
    <RESPONSE trigger="who are you">I am Noor, the Cognitive Digital Twin of this KSA Government Agency, fused with the agency''s Institutional Memory.</RESPONSE>
  </MODE_D>
  <MODE_F name="Social">
    <RESPONSE trigger="hello|hi">Hello! I am Noor. How can I assist with your institutional analysis today?</RESPONSE>
    <RESPONSE trigger="thank you">You are welcome! I am here to help.</RESPONSE>
  </MODE_F>
  <OUTPUT>{"mode": "D|F", "confidence_score": 1.0, "quick_exit": true}</OUTPUT>
</MODE_HANDLER>',
    'mode',
    180,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- MODE: Clarification (H)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'mode_clarification',
    'Mode: Clarification (H)',
    '<MODE_HANDLER modes="H">
  <TRIGGER_CONDITIONS>
    <CONDITION>User refers to "that project" without prior context</CONDITION>
    <CONDITION>Query contains ambiguous timeframes</CONDITION>
    <CONDITION>Multiple entities match a partial name</CONDITION>
  </TRIGGER_CONDITIONS>
  <TEMPLATE>
I need a bit more context to provide accurate information:

**What I understood:** [paraphrase of query]

**What I need:**
- [specific missing information 1]
- [specific missing information 2]

Could you please clarify?
  </TEMPLATE>
  <SUGGESTIONS>
    - "Did you mean Project Alpha (2025) or Project Alpha (2026)?"
    - "Are you asking about L3 (Project Outputs) or L2 (Programs)?"
  </SUGGESTIONS>
  <OUTPUT>{"mode": "H", "confidence_score": 0.3, "requires_user_input": true}</OUTPUT>
</MODE_HANDLER>',
    'mode',
    150,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- MODE: Report Structure (G)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'mode_report_structure',
    'Mode: Report Structure (G)',
    '<MODE_HANDLER modes="G">
  <REPORT_STRUCTURE>
    <SECTION order="1" name="Executive Summary" mandatory="true">Brief overview (2-3 sentences)</SECTION>
    <SECTION order="2" name="Current State Analysis" mandatory="true">Data-driven assessment</SECTION>
    <SECTION order="3" name="Gap Analysis" mandatory="conditional">Required if gaps detected</SECTION>
    <SECTION order="4" name="Recommendations" mandatory="true">Actionable next steps</SECTION>
    <SECTION order="5" name="Supporting Data" mandatory="true">Tables and visualizations</SECTION>
  </REPORT_STRUCTURE>
  <VISUALIZATION_RULES>
    <RULE>Include at least one table summarizing key metrics</RULE>
    <RULE>Include trend visualization if temporal data available</RULE>
    <RULE>NO network graphs - render as tables</RULE>
  </VISUALIZATION_RULES>
</MODE_HANDLER>',
    'mode',
    140,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- MODE: Gap Diagnosis (B2)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'mode_gap_diagnosis',
    'Mode: Gap Diagnosis (B2)',
    '<MODE_HANDLER modes="B2">
  <PRINCIPLE name="AbsenceIsSignal">
    Failure of Cypher traversal to yield expected relationships MUST be interpreted as a diagnosable institutional gap, NOT a query failure.
  </PRINCIPLE>
  <GAP_CLASSIFICATION>
    <TYPE tag="DirectRelationshipMissing" severity="🔴🔴">Relationship failure between adjacent entities in a mandated Business Chain</TYPE>
    <TYPE tag="IndirectChainBroken" severity="🟠🟠">Multi-hop path fails due to intermediate missing entity</TYPE>
    <TYPE tag="TemporalGap" severity="🟡🟡">Data exists for year X but missing for year Y</TYPE>
    <TYPE tag="LevelMismatch" severity="🔴🔴">Illegal cross-hierarchy link violation detected</TYPE>
  </GAP_CLASSIFICATION>
  <CONSTRAINT>Output MUST NOT contain type "network_graph" - transform to table</CONSTRAINT>
</MODE_HANDLER>',
    'mode',
    150,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 7: CORE COGNITIVE BUNDLE (Slimmed Down)
-- =====================================================

-- Update cognitive_cont to be slimmer - just the control loop
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'cognitive_loop_core',
    'Cognitive Control Loop Core',
    '<COGNITIVE_LOOP name="Fixed Control Sequence">
  <STEP order="0" name="REMEMBER" mandatory="path-dependent">
    Retrieve prior context via recall_memory. Mandatory for B1/B2/G.
  </STEP>
  <STEP order="1" name="REQUIREMENTS" mandatory="always">
    Analyze query, resolve ambiguities, classify into Mode A-H.
  </STEP>
  <STEP order="2" name="RECOLLECT" mandatory="non-quick-exit">
    Load bundles via retrieve_instructions.
  </STEP>
  <STEP order="3" name="RECALL" mandatory="non-quick-exit">
    Execute graph queries via read_neo4j_cypher.
  </STEP>
  <STEP order="4" name="RECONCILE" mandatory="non-quick-exit">
    Synthesize raw data into business insights. Calculate confidence.
  </STEP>
  <STEP order="5" name="RETURN" mandatory="always">
    Format final response. Apply Business Language Translation.
  </STEP>
</COGNITIVE_LOOP>

<MODE_CLASSIFICATION priority="ordered">
  <RULE order="1">Greeting words only → Mode F</RULE>
  <RULE order="2">Questions about "you"/"your capabilities" → Mode D</RULE>
  <RULE order="3">Ambiguous/unresolved references → Mode H</RULE>
  <RULE order="4">Explicit "report"/"summary" request → Mode G</RULE>
  <RULE order="5">Questions about "gap"/"missing" → Mode B2</RULE>
  <RULE order="6">Multi-hop/complex analysis → Mode B1</RULE>
  <RULE order="7">"Explain"/"what is" about concepts → Mode E</RULE>
  <RULE order="8">Hypothetical "what if" → Mode C</RULE>
  <RULE order="9">Default: Simple lookup → Mode A</RULE>
</MODE_CLASSIFICATION>',
    'core',
    280,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 8: UPDATED INSTRUCTION_METADATA MAPPINGS
-- =====================================================

-- Clear old mappings and add new atomic ones
DELETE FROM instruction_metadata WHERE tag LIKE 'node_%' OR tag LIKE 'rel_%' OR tag LIKE 'chain_%' OR tag LIKE 'cypher_%' OR tag LIKE 'constraint_%' OR tag LIKE 'mode_%' OR tag = 'cognitive_loop_core';

-- Core loop - all modes
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES ('cognitive_loop_core', ARRAY['A', 'B1', 'B2', 'C', 'D', 'E', 'F', 'G', 'H'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Node bundles for data-requiring modes
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('node_ent_projects', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_capabilities', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_risks', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('node_sec_objectives', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_org_units', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_it_systems', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_processes', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('node_sec_policy_tools', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('node_sec_performance', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('node_ent_change_adoption', ARRAY['B2', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Relationship bundles
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('rel_monitored_by', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('rel_operates', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('rel_close_gaps', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('rel_parent_of', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('rel_requires', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('rel_utilizes', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('rel_contributes_to', ARRAY['B1', 'B2', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Chain bundles - only for complex analysis and reports
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('chain_sector_ops', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('chain_strategy_to_tactics_priority', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('chain_strategy_to_tactics_targets', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('chain_tactical_to_strategy', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('chain_risk_build_mode', ARRAY['B2', 'G'], NULL, NULL),
    ('chain_risk_operate_mode', ARRAY['B2', 'G'], NULL, NULL),
    ('chain_internal_efficiency', ARRAY['B1', 'B2', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Cypher patterns
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('cypher_optimized_retrieval', ARRAY['A', 'B1', 'G'], NULL, NULL),
    ('cypher_impact_analysis', ARRAY['B1', 'B2', 'G'], NULL, NULL),
    ('cypher_portfolio_health', ARRAY['B1', 'G'], NULL, NULL),
    ('cypher_vector_concept_search', ARRAY['A', 'B1'], NULL, NULL),
    ('cypher_vector_similarity', ARRAY['B1', 'B2'], NULL, NULL),
    ('cypher_keyset_pagination', ARRAY['A', 'B1', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Constraint bundles - all data modes
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('constraint_keyset_pagination', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('constraint_level_integrity', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('constraint_efficiency', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('constraint_temporal_filtering', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('constraint_aggregation_first', ARRAY['A', 'B1', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- Mode-specific bundles
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('mode_quick_exit', ARRAY['D', 'F'], NULL, NULL),
    ('mode_clarification', ARRAY['H'], NULL, NULL),
    ('mode_report_structure', ARRAY['G'], NULL, NULL),
    ('mode_gap_diagnosis', ARRAY['B2'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 9: ADDITIONAL CRITICAL BUNDLES (MISSING FROM PROMPT)
-- =====================================================

-- DATA INTEGRITY RULES (Universal rules that apply to ALL queries)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'data_integrity_rules',
    'Data Integrity Rules',
    '<DATA_INTEGRITY_RULES>
  <UNIVERSAL_PROPERTIES>
    EVERY node has: id, name, year, quarter, level
  </UNIVERSAL_PROPERTIES>
  <COMPOSITE_KEY>
    Unique entities defined by id + year. Always filter by year to avoid duplicates.
  </COMPOSITE_KEY>
  <LEVEL_ALIGNMENT>
    Functional relationships between Entity or Sector nodes strictly connect at SAME LEVEL.
    Rule: L3 ↔ L3, L2 ↔ L2, L1 ↔ L1
    Exception: PARENT_OF is the ONLY relationship that crosses levels (L1→L2→L3)
  </LEVEL_ALIGNMENT>
  <TEMPORAL_FILTERING>
    Queries must explicitly filter by year AND level for every node type.
    Sub-rule: Exclude future-start projects from active counts:
      AND (n.start_date IS NULL OR n.start_date <= date($today))
  </TEMPORAL_FILTERING>
</DATA_INTEGRITY_RULES>',
    'rule',
    140,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- TOOL RULES COMPREHENSIVE (All 16 rules from current prompt)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'tool_rules_comprehensive',
    'Tool Rules Comprehensive',
    '<TOOL_RULES tool="read_neo4j_cypher">
  <RULE id="1">Separate Existence Check from Temporal Filters - Run lightweight count query with year/level only first</RULE>
  <RULE id="2">Conditional Start-Date Clause - Apply start_date filter only when intent asks for "active" projects</RULE>
  <RULE id="3">Fallback Path for Empty Results - Embed UNION with placeholder row "No projects found"</RULE>
  <RULE id="4">Index-Driven Year-Level Lookup - Reference (year, level) index in initial count query</RULE>
  <RULE id="5">Explicit Intent Flag - Parse query for include_future = true/false before building cypher</RULE>
  <RULE id="6">Audit Log for Filter Application - Record applied filters in memory_process.thought_trace</RULE>
  <RULE id="7">Graceful Degradation - If enriched query returns 0 rows, retry with simplified query</RULE>
  <RULE id="8">Aggregation First - Use count(n) for totals, collect(n)[0..30] for samples in SINGLE QUERY</RULE>
  <RULE id="9">Trust Protocol - If tool returns valid JSON, TRUST IT. Do not re-query to verify counts</RULE>
  <RULE id="10">Continuity Strategy - Keyset pagination: WHERE n.id > $last_seen_id ORDER BY n.id</RULE>
  <RULE id="11">Efficiency - Return only id and name. No embeddings</RULE>
  <RULE id="12">Server-Side Execution - Tool runs remotely. Do NOT hallucinate output</RULE>
  <RULE id="13">OPTIONAL MATCH Correctly - Place after primary MATCH, move filters into OPTIONAL MATCH itself</RULE>
  <RULE id="14">Separate Existence from Enrichment - Lightweight existence query before OPTIONAL MATCH enrichment</RULE>
  <RULE id="15">Document Assumptions - Include // comments explaining clause purpose and assumptions</RULE>
  <RULE id="16">ARGUMENT FORMAT - Pass as valid JSON object: read_neo4j_cypher(query="MATCH...")</RULE>
</TOOL_RULES>',
    'rule',
    280,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- FILE HANDLING (When files are attached)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'file_handling',
    'File Handling',
    '<FILE_HANDLING tool="read_file">
  <PURPOSE>Retrieve and process uploaded file contents on-demand</PURPOSE>
  <WHEN_TO_USE>
    - User has attached files to their message
    - Need to analyze, summarize, or extract information from files
    - User asks questions about attached files
  </WHEN_TO_USE>
  <SUPPORTED_TYPES>
    Text files (TXT, MD, CSV) - Returns raw content
  </SUPPORTED_TYPES>
  <USAGE_PATTERN>
    read_file(file_id="abc123")
  </USAGE_PATTERN>
  <RESPONSE_STRUCTURE>
    {
      "type": "document|data|text",
      "content": "Extracted content...",
      "filename": "report.pdf",
      "metadata": {...}
    }
  </RESPONSE_STRUCTURE>
  <IMPORTANT_NOTES>
    1. On-Demand Only: Do NOT read files unless necessary for answering query
    2. Efficiency: Answer general questions first, read files only if specifically asked
    3. Context Integration: Incorporate file insights into analysis
    4. Business Language: Discuss file contents using clear business terms
  </IMPORTANT_NOTES>
</FILE_HANDLING>',
    'tool',
    180,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- VECTOR STRATEGY FULL (Complete templates A and B)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'vector_strategy_full',
    'Vector Strategy Full Templates',
    '<VECTOR_STRATEGY>
  <TEMPLATE_A name="ConceptSearch" type="Text-to-Node">
    <USE_WHEN>User asks about topic ("Water leaks", "Digital") but names no specific entity</USE_WHEN>
    <CYPHER>
CALL db.index.vector.queryNodes($indexName, $k, $queryVector) 
YIELD node, score
WHERE node.embedding IS NOT NULL
RETURN coalesce(node.id, elementId(node)) AS id, 
       node.name AS name, 
       score
    </CYPHER>
  </TEMPLATE_A>
  
  <TEMPLATE_B name="InferenceSimilarity" type="Node-to-Node">
    <USE_WHEN>User asks to "infer links", "find similar projects", or "fill gaps"</USE_WHEN>
    <LOGIC>Calculate Cosine Similarity between Target Node and Candidate Nodes</LOGIC>
    <CYPHER>
MATCH (p:EntityProject {id:$projectId, year:$year, level:$level})
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
ORDER BY score DESC LIMIT $k
    </CYPHER>
    <TIP>When schema-based enrichment required first, use Pattern 3 (portfolio health) before Template B</TIP>
  </TEMPLATE_B>
</VECTOR_STRATEGY>',
    'tool',
    280,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- DIRECT RELATIONSHIPS FULL MATRIX (All 30+ relationships from current prompt)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status, depends_on)
VALUES (
    'direct_relationships_full',
    'Direct Relationships Full Matrix',
    '<DIRECT_RELATIONSHIPS note="Same-Level Only">
  <NOTE>These represent REAL and ONLY DIRECT relations. Their absence = gap that must be raised</NOTE>
  
  <SECTOR_OPERATIONS>
    SectorObjective → Realized Via → SectorPolicyTool
    SectorPolicyTool → Governed By → SectorObjective
    SectorObjective → Cascaded Via → SectorPerformance
    SectorPolicyTool → Refers To → SectorAdminRecord
    SectorAdminRecord → Applied On → SectorBusiness
    SectorAdminRecord → Applied On → SectorGovEntity
    SectorAdminRecord → Applied On → SectorCitizen
    SectorBusiness → Triggers Event → SectorDataTransaction
    SectorGovEntity → Triggers Event → SectorDataTransaction
    SectorCitizen → Triggers Event → SectorDataTransaction
    SectorDataTransaction → Measured By → SectorPerformance
    SectorPerformance → Aggregates To → SectorObjective
  </SECTOR_OPERATIONS>
  
  <STRATEGIC_RISK_MANAGEMENT>
    EntityRisk → Informs → SectorPerformance
    EntityRisk → Informs → SectorPolicyTool
    EntityRisk ← MONITORED_BY ← EntityCapability
  </STRATEGIC_RISK_MANAGEMENT>
  
  <SECTOR_ENTITY_RELATIONS>
    SectorPolicyTool → Sets Priorities → EntityCapability
    SectorPerformance → Sets Targets → EntityCapability
    EntityCapability → Executes → SectorPolicyTool
    EntityCapability → Reports → SectorPerformance
  </SECTOR_ENTITY_RELATIONS>
  
  <ENTITY_INTERNAL_OPERATIONS>
    EntityCapability → Role Gaps → EntityOrgUnit
    EntityCapability → Knowledge Gaps → EntityProcess
    EntityCapability → Automation Gaps → EntityITSystem
    EntityOrgUnit → Operates → EntityCapability
    EntityProcess → Operates → EntityCapability
    EntityITSystem → Operates → EntityCapability
    EntityCultureHealth → Monitors For → EntityOrgUnit
    EntityOrgUnit → Apply → EntityProcess
    EntityProcess → Automation → EntityITSystem
    EntityITSystem → Depends On → EntityVendor
  </ENTITY_INTERNAL_OPERATIONS>
  
  <TRANSFORMING_ENTITY_CAPABILITIES>
    EntityOrgUnit → Gaps Scope → EntityProject
    EntityProcess → Gaps Scope → EntityProject
    EntityITSystem → Gaps Scope → EntityProject
    EntityProject → Close Gaps → EntityOrgUnit
    EntityProject → Close Gaps → EntityProcess
    EntityProject → Close Gaps → EntityITSystem
  </TRANSFORMING_ENTITY_CAPABILITIES>
  
  <PROJECT_TO_OPERATION_TRANSFER>
    EntityProject → Adoption Risks → EntityChangeAdoption
    EntityChangeAdoption → Increase Adoption → EntityProject
  </PROJECT_TO_OPERATION_TRANSFER>
  
  <OPTIONAL_LINKS_NOTE>
    Direct relationships above may be missing for early-stage or conceptual projects.
    Queries MUST treat these as optional. Use OPTIONAL MATCH after existence check.
  </OPTIONAL_LINKS_NOTE>
</DIRECT_RELATIONSHIPS>',
    'relationship',
    380,
    '1.0.0',
    'active',
    NULL
) ON CONFLICT (tag) DO UPDATE SET 
    content = EXCLUDED.content,
    avg_tokens = EXCLUDED.avg_tokens,
    updated_at = CURRENT_TIMESTAMP;

-- UPDATE INSTRUCTION_METADATA FOR NEW BUNDLES
INSERT INTO instruction_metadata (tag, trigger_modes, trigger_conditions, compatible_with)
VALUES 
    ('data_integrity_rules', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('tool_rules_comprehensive', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('file_handling', ARRAY['A', 'B1', 'B2', 'G'], NULL, NULL),
    ('vector_strategy_full', ARRAY['A', 'B1'], NULL, NULL),
    ('direct_relationships_full', ARRAY['B1', 'B2', 'G'], NULL, NULL)
ON CONFLICT (tag) DO UPDATE SET trigger_modes = EXCLUDED.trigger_modes, updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify:
-- SELECT tag, category, avg_tokens FROM instruction_bundles WHERE status = 'active' ORDER BY category, tag;
-- SELECT tag, trigger_modes FROM instruction_metadata ORDER BY tag;
-- SELECT category, count(*), sum(avg_tokens) FROM instruction_bundles WHERE status = 'active' GROUP BY category;
