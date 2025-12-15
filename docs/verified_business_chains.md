
# Verified Business Chain Documentation

This document serves as the canonical reference for the 7 verified business chains in the Knowledge Graph. These deterministic Cypher queries have been rigorously tested and confirmed to traverse the graph successfully.

They are designed to help the LLM and developers retrieve high-value insights without needing to construct complex joins manually.

---

## 1. SectorOps (Operational Feedback Loop)

**Description:**
Traces the full operational feedback loop: from a high-level strategic **Objective**, through **Policy Tools** and **Administrative Records**, down to **Stakeholders** (Businesses/Citizens), capturing their **Data Transactions**, and finally measuring the outcome via **Performance** indicators which aggregate back to the original Objective.

**Traversal Path:**
`Objective` -> `Policy` -> `AdminRecord` -> `Stakeholder` -> `DataTransaction` -> `Performance` -> `Objective`

**Inputs:**
*   `$id` (string): ID of the starting `SectorObjective`.
*   `$year` (integer): Fiscal year context (e.g., 2025).

**Expected Outputs:**
Returns the full path, allowing access to:
*   `obj.name` (Strategic Goal)
*   `tool.name` (Policy used)
*   `stakeholder.name` (Entity impacted)
*   `txn.volume` / `txn.type` (Real-world activity)
*   `perf.value` (KPI result)

**Deterministic Query:**
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

---

## 2. Strategy to Tactics (Priority Direction)

**Description:**
Map how a strategic **Objective** drives **Policy**, which in turn prioritizes specific **Capabilities**. It then identifies **Gaps** (Role, Knowledge, Automation) in the operational layer (Org/Process/System) and links them to the **Projects** launched to close those gaps.

**Traversal Path:**
`Objective` -> `Policy` -> `Capability` -> `[GAPS]` -> `OpsLayer` <- `Project` -> `ChangeAdoption`

**Inputs:**
*   `$id` (string): ID of the starting `SectorObjective`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   Targeted Capabilities
*   Specific Operational Gaps (e.g., "Missing Automation in HR Process")
*   Alignment of Projects to Strategy

**Deterministic Query:**
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

---

## 3. Strategy to Tactics (Targets Direction)

**Description:**
Similar to the Priority chain but focuses on **Performance Targets**. It traces how Objectives cascade into KPI targets for Capabilities, revealing the operational gaps hindering those targets and the Projects assigned to fix them.

**Traversal Path:**
`Objective` -> `Performance` -> `Capability` -> `[GAPS]` -> `OpsLayer` <- `Project` -> `ChangeAdoption`

**Inputs:**
*   `$id` (string): ID of the starting `SectorObjective`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   KPI Targets defined for Capabilities
*   Operational bottlenecks affecting performance
*   Remediation Projects

**Deterministic Query:**
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

---

## 4. Tactical to Strategy (Bottom-Up Impact)

**Description:**
A bottom-up view starting from **Change Adoption** (user readiness). It traces how adoption success/failure impacts a **Project**, which closes gaps in the **Ops Layer**, enabling a **Capability**, which then executes/reports to the **Strategy Layer** (Policy or Performance), ultimately impacting the **Objective**.

**Traversal Path:**
`ChangeAdoption` -> `Project` -> `OpsLayer` -> `Capability` -> `StrategyLayer` -> `Objective`

**Inputs:**
*   `$id` (string): ID of the starting `EntityChangeAdoption`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   Impact analysis of user adoption on high-level goals.
*   Traceability from "people readiness" to "strategic success".

**Deterministic Query:**
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

---

## 5. Risk Build Mode (Planning)

**Description:**
Analyzes **Capabilities** during their design/build phase. It identifies the **Risks** monitoring these capabilities and how those risks inform **Policy Tools** (preventative measures).

**Traversal Path:**
`Capability` -> `Risk` -> `PolicyTool`

**Inputs:**
*   `$id` (string): ID of the starting `EntityCapability`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   Identified risks in capability design.
*   Policies mitigated or informed by these risks.

**Deterministic Query:**
```cypher
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (tool:SectorPolicyTool {year: $year})
RETURN path
```

---

## 6. Risk Operate Mode (Execution)

**Description:**
Analyzes **Capabilities** during active operation. It highlights **Risks** that are materializing and how they impact **Sector Performance** (KPIs/Metrics).

**Traversal Path:**
`Capability` -> `Risk` -> `Performance`

**Inputs:**
*   `$id` (string): ID of the starting `EntityCapability`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   Operational risks affecting performance.
*   Direct impact link between risk realization and KPI degradation.

**Deterministic Query:**
```cypher
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (perf:SectorPerformance {year: $year})
RETURN path
```

---

## 7. Internal Efficiency

**Description:**
Focuses on organizational health. Traces **Culture Health** (employee sentiment/alignment) to the **Org Units** it monitors, the **Processes** they apply, the **IT Systems** automating those processes, and the **Vendors** supported.

**Traversal Path:**
`CultureHealth` -> `OrgUnit` -> `Process` -> `ITSystem` -> `Vendor`

**Inputs:**
*   `$id` (string): ID of the starting `EntityCultureHealth`.
*   `$year` (integer): Fiscal year.

**Expected Outputs:**
*   Correlation between internal culture and operational efficiency.
*   Supply chain dependency (Vendor) linked to internal health.

**Deterministic Query:**
```cypher
MATCH path = (cult:EntityCultureHealth {id: $id, year: $year})
  -[:MONITORS_FOR]-> (org:EntityOrgUnit {year: $year})
  -[:APPLY]-> (proc:EntityProcess {year: $year})
  -[:AUTOMATION]-> (sys:EntityITSystem {year: $year})
  -[:DEPENDS_ON]-> (vend:EntityVendor {year: $year})
RETURN path
```
