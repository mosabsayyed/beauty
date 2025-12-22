# Neo4j Ontology — Current-State Snapshot (December 2025)

> Purpose: A concise, authoritative snapshot of the live graph ontology used by Josoor. This documents node labels, relationships, common properties, and core traversal chains as implemented today. It serves as the baseline for validation and future V2 planning.

## Overview
- Dual domains: Sector (strategy/performance/admin/policy) and Entity (capabilities/operations/projects/risks/IT).
- Year-aware graph: Most queries filter by `year` and optionally by `id` or `elementId()`.
- Deterministic chain patterns: Strategy → Capability → Gaps/Projects → Adoption → Back to Strategy; plus risk chains and sector operations chains.

## Node Labels
Sector domain:
- `SectorObjective`
- `SectorPolicyTool`
- `SectorAdminRecord`
- `SectorBusiness`
- `SectorGovEntity`
- `SectorCitizen`
- `SectorDataTransaction`
- `SectorPerformance`

Entity domain:
- `EntityCapability`
- `EntityOrgUnit`
- `EntityProcess`
- `EntityITSystem`
- `EntityProject`
- `EntityChangeAdoption`
- `EntityRisk`
- `EntityCultureHealth`
- `EntityVendor`

Notes:
- Visualization color mapping for common labels is defined in backend (see Backend Architecture: Node Color Mapping).
- Additional labels may exist; this list reflects labels actively used in chain queries and graph-server ontology.

## Relationships
Strategy / Sector chains:
- `REALIZED_VIA` (Objective → Policy Tool)
- `REFERS_TO` (Policy Tool → Admin Record)
- `APPLIED_ON` (Admin Record → Stakeholder)
- `TRIGGERS_EVENT` (Stakeholder → Sector Data Transaction)
- `MEASURED_BY` (Transaction → Sector Performance)
- `AGGREGATES_TO` (Performance → Objective)
- `CASCADED_VIA` (Objective → Performance)
- `SETS_TARGETS` (Performance → Capability)
- `SETS_PRIORITIES` (Policy Tool → Capability)
- `GOVERNED_BY` (Strategic Layer → Objective)

Capability / Operations / Project chains:
- `ROLE_GAPS` | `KNOWLEDGE_GAPS` | `AUTOMATION_GAPS` (Capability → Org/Process/IT gap layers)
- `GAPS_SCOPE` (Gap layer → Project)
- `ADOPTION_RISKS` (Project → Change Adoption)
- `INCREASE_ADOPTION` (Change Adoption → Project)
- `CLOSE_GAPS` (Project → Org/Process/IT ops layers)
- `OPERATES` (Ops layer → Capability)
- `REPORTS` | `EXECUTES` (Capability → Strategic layer)

Risk chains:
- `MONITORED_BY` (Capability → Risk)
- `INFORMS` (Risk → Policy Tool or Performance)

Internal efficiency chain:
- `MONITORS_FOR` (Culture Health → Org Unit)
- `APPLY` (Org Unit → Process)
- `AUTOMATION` (Process → IT System)
- `DEPENDS_ON` (IT System → Vendor)

## Common Properties (Observed)
- `id`: string identifier occasionally used for filtering (`$id IS NULL OR node.id = $id OR elementId(node) = $id`).
- `year`: integer used to scope data (`$year = 0 OR node.year = $year`).
- `name`: present on several nodes (e.g., `SectorObjective`).
- `expected_outcomes`: present on `SectorObjective` (as per sample query).

Note: Property presence varies by label; the above reflect properties referenced by current queries and utilities.

## Core Chain Definitions
Source: graph-server `GraphOntology` and `CHAINS` (see `graph-server/ontology.ts`).

1) Sector Operations (`sector_ops`)
```
Objective -[:REALIZED_VIA]-> Policy Tool -[:REFERS_TO]-> Admin Record
Admin Record -[:APPLIED_ON]-> Stakeholder (Business | GovEntity | Citizen)
Stakeholder -[:TRIGGERS_EVENT]-> Sector Data Transaction -[:MEASURED_BY]-> Sector Performance
Sector Performance -[:AGGREGATES_TO]-> Objective
Filters: optional `$id` on `SectorObjective`; `$year` on Objective/Tool
```

2) Strategy → Tactics (Priorities) (`strategy_to_tactics_priority`)
```
Objective -[:REALIZED_VIA]-> Policy Tool -[:SETS_PRIORITIES]-> Capability
Capability -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> Gap Layer (OrgUnit | Process | ITSystem)
Gap Layer -[:GAPS_SCOPE]-> Project -[:ADOPTION_RISKS]-> Change Adoption
Filters: optional `$id` on `SectorObjective`; `$year` on Objective/Tool
```

3) Strategy → Tactics (Targets) (`strategy_to_tactics_targets`)
```
Objective -[:CASCADED_VIA]-> Sector Performance -[:SETS_TARGETS]-> Capability
Capability -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> Gap Layer (OrgUnit | Process | ITSystem)
Gap Layer -[:GAPS_SCOPE]-> Project -[:ADOPTION_RISKS]-> Change Adoption
Filters: optional `$id` on `SectorObjective`; `$year` on Objective/Performance
```

4) Tactics → Strategy (`tactical_to_strategy`)
```
Change Adoption -[:INCREASE_ADOPTION]-> Project -[:CLOSE_GAPS]-> Ops Layer (OrgUnit | Process | ITSystem)
Ops Layer -[:OPERATES]-> Capability -[:REPORTS|EXECUTES]-> Strategic Layer -[:AGGREGATES_TO|GOVERNED_BY]-> Objective
Filters: optional `$id` on `EntityChangeAdoption`; `$year` on Adoption/Project
```

5) Risk — Build Mode (`risk_build_mode`)
```
Capability -[:MONITORED_BY]-> Risk -[:INFORMS]-> Policy Tool
Filters: optional `$id` on `EntityCapability`; `$year` on Capability/Risk
```

6) Risk — Operate Mode (`risk_operate_mode`)
```
Capability -[:MONITORED_BY]-> Risk -[:INFORMS]-> Sector Performance
Filters: optional `$id` on `EntityCapability`; `$year` on Capability/Risk
```

7) Internal Efficiency (`internal_efficiency`)
```
Culture Health -[:MONITORS_FOR]-> Org Unit -[:APPLY]-> Process
Process -[:AUTOMATION]-> IT System -[:DEPENDS_ON]-> Vendor
Filters: optional `$id` on `EntityCultureHealth`; `$year` on Culture/Org
```

8) Aggregate Bridge Query (Capabilities as bridge)
```
MATCH path = (high:SectorObjective|SectorPerformance)
  -[:REALIZED_VIA|CASCADED_VIA|SETS_TARGETS|SETS_PRIORITIES*1..2]-> (cap:EntityCapability)
  -[:MONITORED_BY|ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS|GAPS_SCOPE*1..2]-> (low:EntityProject|EntityRisk|EntityOrgUnit|EntityProcess|EntityITSystem)
WHERE ($year = 0 OR cap.year = $year)
```

## Cypher Examples (Validation)
Verify label presence:
```
MATCH (n) WITH labels(n) AS lbls UNWIND lbls AS l RETURN l, count(*) ORDER BY l;
```

Check year coverage by label:
```
MATCH (n) WHERE exists(n.year) RETURN labels(n)[0] AS label, collect(distinct n.year) AS years LIMIT 100;
```

Confirm sector ops chain instances:
```
MATCH path = (obj:SectorObjective)-[:REALIZED_VIA]->(:SectorPolicyTool)-[:REFERS_TO]->(:SectorAdminRecord)
                -[:APPLIED_ON]->(:SectorBusiness|:SectorGovEntity|:SectorCitizen)
                -[:TRIGGERS_EVENT]->(:SectorDataTransaction)-[:MEASURED_BY]->(:SectorPerformance)-[:AGGREGATES_TO]->(obj)
RETURN count(path) AS paths;
```

Capabilities bridge health:
```
MATCH (cap:EntityCapability)
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk)
OPTIONAL MATCH (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
RETURN count(cap) AS capabilities, count(risk) AS risks_linked, count(gap) AS gaps_linked;
```

## Constraints & Keys (Observed/Recommended)
Observed usage:
- Filtering often uses `id` or `elementId()`; queries assume `year` exists where relevant.

Recommended (to validate/confirm in DB):
- Unique `(label, id)` per year where applicable.
- Indexes on `year` for high-traffic labels (Objectives, Performance, Capability, Project, Risk).
- Existence constraints for mandatory properties for dashboard nodes (e.g., `name` on `SectorObjective`).

## Namespaces & Domain Boundaries
- Sector namespace: policy, admin, stakeholders, transactions, performance, objectives.
- Entity namespace: capabilities, operations (org/process/IT), projects, adoption, risks, culture, vendors.
- Bridge: `EntityCapability` connects sector strategy/performance with operational layers and risks.

## Data Hygiene Checks
- No orphaned `EntityProject` without inbound `GAPS_SCOPE` or outbound `CLOSE_GAPS` edges.
- No `EntityCapability` without any of: `MONITORED_BY`, `ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS`, `OPERATES`.
- Year consistency: connected nodes in a chain should share year or be explicitly cross-year if designed.

## References
- Implementation source: `graph-server/ontology.ts`, `graph-server/query.ts`.
- Backend color mapping and routes: see `docs/BACKEND_ARCHITECTURE.md`.
- Frontend proxies and dashboards: see `docs/FRONTEND_ARCHITECTURE.md`.
