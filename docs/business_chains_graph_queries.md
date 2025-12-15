# Business Chains Standard Cypher Queries

This document defines the standard Cypher traversal queries for the 7 core business chains in the ontology. These queries are designed to be deterministic and parameterised for use by the LLM and the application backend.

**Data Integrity Constraints:**
*   All queries assume `year` parameter logic (nodes are year-specific).
*   All queries assume `level` consistency where applicable, though chains often scale across node types holding different inherent levels.
*   **Structure:** Queries return the full `path` of the traversal.

## 1. SectorOps
**Story:** Describes how government objectives are executed externally through policy tools, stakeholder interactions, and performance measurement cycles.
**Path:** `SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective`

```cypher
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (tool:SectorPolicyTool {year: $year})
  -[:REFERS_TO]-> (record:SectorAdminRecord {year: $year})
  -[:APPLIED_ON]-> (stakeholder)
  -[:TRIGGERS_EVENT]-> (txn:SectorDataTransaction {year: $year})
  -[:MEASURED_BY]-> (perf:SectorPerformance {year: $year})
  -[:AGGREGATES_TO]-> (obj)
WHERE (stakeholder:SectorBusiness OR stakeholder:SectorGovEntity OR stakeholder:SectorCitizen)
  AND stakeholder.year = $year
RETURN path
```

## 2. Strategy to Tactics (Priority Capabilities)
**Story:** Explains how strategic goals cascade through policy tools to shape capability-building and implementation projects.
**Path:** `SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption`
*Note: "Gaps" represents the path via OrgUnit (Role Gaps), Process (Knowledge Gaps), or ITSystem (Automation Gaps).*

```cypher
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (tool:SectorPolicyTool {year: $year})
  -[:SETS_PRIORITIES]-> (cap:EntityCapability {year: $year})
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
  -[:GAPS_SCOPE]-> (proj:EntityProject {year: $year})
  -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption {year: $year})
WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
  AND gap_layer.year = $year
RETURN path
```

## 3. Strategy to Tactics (Capabilities Targets)
**Story:** Captures how performance targets flow top-down from strategy to operational projects via capabilities.
**Path:** `SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption`

```cypher
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:CASCADED_VIA]-> (perf:SectorPerformance {year: $year})
  -[:SETS_TARGETS]-> (cap:EntityCapability {year: $year})
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
  -[:GAPS_SCOPE]-> (proj:EntityProject {year: $year})
  -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption {year: $year})
WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
  AND gap_layer.year = $year
RETURN path
```

## 4. Tactical to Strategy
**Story:** Describes the feedback loop where project execution informs higher-level strategy and policy decisions.
**Path:** `EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → (SectorPerformance OR SectorPolicyTool) → SectorObjective`

```cypher
MATCH path = (adopt:EntityChangeAdoption {id: $id, year: $year})
  -[:INCREASE_ADOPTION]-> (proj:EntityProject {year: $year})
  -[:CLOSE_GAPS]-> (ops_layer)
  -[:OPERATES]-> (cap:EntityCapability {year: $year})
  -[:REPORTS|EXECUTES]-> (strategic_layer)
  -[:AGGREGATES_TO|GOVERNED_BY]-> (obj:SectorObjective {year: $year})
WHERE (ops_layer:EntityOrgUnit OR ops_layer:EntityProcess OR ops_layer:EntityITSystem)
  AND ops_layer.year = $year
  AND (
    (strategic_layer:SectorPerformance AND (cap)-[:REPORTS]->(strategic_layer) AND (strategic_layer)-[:AGGREGATES_TO]->(obj))
    OR
    (strategic_layer:SectorPolicyTool AND (cap)-[:EXECUTES]->(strategic_layer) AND (strategic_layer)-[:GOVERNED_BY]->(obj))
  )
RETURN path
```

## 5. Risk Build Mode
**Story:** Illustrates how operational risks influence the design and activation of policy tools.
**Path:** `EntityCapability → EntityRisk → SectorPolicyTool`

```cypher
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (tool:SectorPolicyTool {year: $year})
RETURN path
```

## 6. Risk Operate Mode
**Story:** Explains how capability-level risks affect performance outcomes and KPI achievement.
**Path:** `EntityCapability → EntityRisk → SectorPerformance`

```cypher
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (perf:SectorPerformance {year: $year})
RETURN path
```

## 7. Internal Efficiency
**Story:** Represents how organizational health drives process and IT efficiency through vendor ecosystems.
**Path:** `EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor`

```cypher
MATCH path = (cult:EntityCultureHealth {id: $id, year: $year})
  -[:MONITORS_FOR]-> (org:EntityOrgUnit {year: $year})
  -[:APPLY]-> (proc:EntityProcess {year: $year})
  -[:AUTOMATION]-> (sys:EntityITSystem {year: $year})
  -[:DEPENDS_ON]-> (vend:EntityVendor {year: $year})
RETURN path
```
