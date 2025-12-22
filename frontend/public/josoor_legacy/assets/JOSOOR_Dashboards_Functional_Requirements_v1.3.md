# JOSOOR Dashboards — Master Functional Requirements

Document purpose Convert the UI concepts (Control Tower, Dependency Desk, Risk Desk, Deep Dive, Sector Insights) into buildable dashboard requirements with explicit data fields, data types, and how each value is produced (direct extract vs calculation vs hybrid).

Structuring choice (decision) Screen-by-screen requirements, with data requirements embedded per visual, plus a shared Data Dictionary & Metric Definitions appendix. This keeps every UI element traceable to a queryable graph pattern.

Version v1.3 (The Monster Spec)  
Base Version v0.2 (Strict Adherence to Structure)  
Architecture Aligned with DATA_ARCHITECTURE.md 

## ---

0) Hard rules (must hold across all screens)

1. Deterministic dashboards (no free-form AI) Dashboards render from DB + graph queries only.  
2. Dual-Database Strategy (Architecture Alignment)  
    High-Speed Metrics (Radars, Grids) Query Supabase temp_ tables.  
    Complex Relations (Graphs, Paths) Query Neo4j (Verified Schema).  
    Missing Data (Gap Fill) Use dashboard_decisions (Supabase) for missing operational data.  
3. Deep dives are context-bound Deep dive runs only after a user selects a record on a desk.  
4. Evidence gating Any narrative claim must cite evidence_id + node_id.  
5. Empty-result guard If required data is missing (e.g., no graph path  no evidence), the backend returns an empty payload, and UI shows an explicit empty state (not hallucinated text).  
6. Single source of truth Every displayed number must be reproducible from stored facts + defined formulas in this doc.  
7. Time-windowed All calculations must accept a time_window (e.g., “Q4 2025”) and compute within it unless explicitly marked “lifetime”.

## ---

1) Scope

### 1.1 In scope

 Transformation Control Tower (S1) Dual-Lens HUD, Health Grid, Signals.  
 Dependency Desk (S2) 3D Graph, Business Chains, Knots.  
 Risk Desk (S3) Heatmap, Propagation.  
 Deep Dive (S4) Evidence-First Analysis.  
 Sector Insights (S5) [NEW] Macro-economic impact & Investment analysis.  
 Shared navigation, lenspersona toggles, and deep-dive query bar (as deterministic template execution).

### 1.2 Out of scope

 Pixel-perfect UI specs (spacing, exact colors).  
 Full IAM  SSO design (only functional access requirements are listed).  
 Full conversational agent design (only deterministic “targeted prompts” and business chains are in scope).

## ---

2) Canonical graph + relational prerequisites (Verified Schema)

CRITICAL UPDATE The v0.2 hypothetical schema has been replaced with the verified entities from DATA_ARCHITECTURE.md. Milestone and DecisionItem nodes DO NOT exist in Neo4j. Logic adapted to EntityProject and Supabase tables.

### 2.1 Core entities (nodes) and minimum fields

 Entity (Node Label)  Verified Source  Primary ID field  Key Verified Fields (name → type) 
 ----  ----  ----  ---- 
 SectorObjective  Neo4j  id  namestr, quarterstr (verified), priority_levelstr, levelstr (L1L2) 
 SectorPerformance  Neo4j  id  namestr (KPI), actualfloat, targetfloat, thresholdsstr, quarterstr 
 EntityProject  Neo4j  id  namestr, statusstr, progress_percentageint, budgetfloat (missing in node, use Supabase), quarterstr 
 EntityRisk  Neo4j  id  namestr, risk_scorefloat (Impact), likelihood_of_delayfloat (Likelihood), risk_categorystr, statusstr 
 EntityCapability  Neo4j  id  namestr, maturity_levelint, target_maturity_levelint 
 EntityITSystem  Neo4j  id  namestr, operational_statusstr, vendor_supplierstr, criticalitystr 
 EntityVendor  Neo4j  id  namestr, performance_ratingfloat, contract_valuefloat 
 EntityOrgUnit  Neo4j  id  namestr, headcountint, budgetfloat 
 dashboard_decisions  Supabase  id  titlestr, statusenum, priorityenum, linked_project_namestr, due_datetimestamp (Gap Fill) 
 temp_quarterly_dashboard_data  Supabase  id  dimensionstr, health_scorefloat, kpi_actualfloat, kpi_final_targetfloat, trendstr 
 EvidenceItem  Neo4j  id  textstr (Chunk), fileNamestr (Document), embeddingvector 

### 2.2 Core relationships (edges) and verified paths

 Relationship  From → To  Purpose  Business Chain Map 
 ----  ----  ----  ---- 
 GOVERNED_BY  PolicyTool → Objective  Strategic alignment  Chain 2.0_18 
 ALIGNS_WITH  Project → Objective  Impact contribution  Lens B Radar 
 DEPENDS_ON  ITSystem → Vendor  Supply chain risk  Chain 2.0_24 
 MONITORED_BY  Capability → Risk  Risk origin  Chain 2.0_22 
 INFORMS  Risk → PolicyTool  Risk mitigation  Chain 2.0_22 
 AGGREGATES_TO  Performance → Objective  KPI rollup  Chain 2.0_20 
 CLOSE_GAPS  Project → OrgUnit  Execution  Chain 2.0_19 

## ---

3) Global filters and shared UI states

### 3.1 Shared filters (apply to all desks unless stated)

 time_window_id (e.g., Q4-2025). Verified EntityRisk and SectorObjective now have quarter.  
 org_scope (Allowlist of EntityOrgUnit IDs).  
 lens (enum) maestro_executive  noor_delivery.  
 persona (enum) stakeholder_liaison  dependency_architect  risk_sentinel.

### 3.2 Shared UI states

 Loading  
 Empty (no data) explicit message + list missing prerequisites (which query returned 0).  
 Partial (missing inputs) show what’s missing and down-weight confidence; do not fabricate.  
 Stale data show freshness drop and last updated timestamps.

## ---

4) Screen S1 — Transformation Control Tower (Reporting Desk view)

### 4.1 Purpose

One page to summarize portfolio state, surface decisions, highlight missing inputs, show leading signals, and provide a deep-dive entry point once a record is selected.

### 4.2 Visual inventory (what must render)

1. Left navigation Control Tower, Dashboards, Graph, Conversations, Observability  
2. Top header Page title + Persona toggles + Desk tabs  
3. Main widgets  
    W0 Dual-Lens HUD Two Radar Charts (Health vs Impact) [NEW]  
    W1 Internal Transformation Outputs Health Grid (8 cards) [UPDATED]  
    W2 Decisions Needed Ranked list (Supabase) [UPDATED]  
    W3 Missing Inputs List of overduedue items  
    W4 Risk Signals List of leading indicators  drifts  
    W5 Deep Dive (from selection) Selection card + targeted prompts + guards  
4. Bottom Deep Dive Query input + Send

### 4.3 Data requirements per widget

#### W0 — Dual-Lens HUD (Top Header) [NEW]

Lens A Operational Health Radar (Sustainability)

 Visual Radar Chart (8 Axes).  
 Question Are our internal engines healthy  
 Alert Logic If Area  60% $rightarrow$ Burnout Risk label active.

 Output Field  Type  How produced  Source type  Source Field  Logic 
 ----  ----  ----  ----  ---- 
 axis_1  float  Direct Extract  Supabase  health_score WHERE dimension='Strategic Plan Alignment' 
 axis_2  float  Direct Extract  Supabase  health_score WHERE dimension='Operational Efficiency' 
 axis_3  float  Direct Extract  Supabase  health_score WHERE dimension='Risk Mitigation Rate' 
 axis_4  float  Direct Extract  Supabase  health_score WHERE dimension='Investment Portfolio ROI' 
 axis_5  float  Direct Extract  Supabase  health_score WHERE dimension='Active Investor Rate' 
 axis_6  float  Direct Extract  Supabase  health_score WHERE dimension='Employee Engagement' 
 axis_7  float  Direct Extract  Supabase  health_score WHERE dimension='Project Delivery Velocity' 
 axis_8  float  Direct Extract  Supabase  health_score WHERE dimension='Tech Stack SLA' 
 burnout_flag  bool  Calculated  Calculated  True if avg(all_axes)  60 

Lens B Strategic Impact Radar (Outcomes)

 Visual Radar Chart (5 Axes).  
 Question Are we achieving the Vision

 Output Field  Type  How Produced  Source Type  Logic Notes 
 ----  ----  ----  ----  ---- 
 axis_label  str  Extract  Neo4j (SectorObjective)  o.name 
 score  float  Calculated  Neo4j Calculation  Weighted avg 70% KPI + 30% Project 
 kpi_component  float  Aggregation  Neo4j (SectorPerformance)  avg(k.actual  k.target) 
 proj_component  float  Aggregation  Neo4j (EntityProject)  avg(p.progress_percentage) 

#### W1 — Internal Transformation Outputs (Health Grid)

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 kpi_actual  float  Extract  Supabase  kpi_actual column 
 trend  enum  Extract  Supabase  trend column ('up''down') 
 progress_pct  float  Calculated  Calculated  (kpi_actual - kpi_base_value)  (kpi_final_target - kpi_base_value) 
 target_label  str  Extract  Supabase  kpi_final_target 
 base_label  str  Extract  Supabase  kpi_base_value 

#### W2 — Decisions Needed (Ranked List)

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 decision_id  uuid  Extract  Supabase  id 
 title  str  Extract  Supabase  title 
 status  enum  Extract  Supabase  status ('pending') 
 priority  enum  Extract  Supabase  priority 
 linked_project  str  Extract  Supabase  linked_project_name 
 due_date  date  Extract  Supabase  due_date 
 rank_score  float  Calculated  Supabase  Sort by priority (High  Med  Low) + due_date 

#### W3 — Missing Inputs (Data Hygiene)

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 entity_name  str  Extract  Neo4j  n.name 
 missing_type  str  Constant  Constant  'Project Update' or 'KPI Data' 
 days_overdue  int  Calculated  Neo4j  date() - n.last_updated (if available) 
 stale_quarter  str  Extract  Neo4j  n.quarter (if != current) 

#### W4 — Risk Signals

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 signal_name  str  Extract  Neo4j  r.name 
 severity  float  Extract  Neo4j  r.risk_score 
 trend  float  Extract  Neo4j  r.likelihood_of_delay 
 category  str  Extract  Neo4j  r.risk_category 
 severity_band  enum  Calculated  Calculated  High (0.8), Med (0.5), Low 

#### W5 — Deep Dive (from selection) side panel

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 selected_node_id  str  UI selection  User Input   
 selected_node_type  enum  UI selection  User Input   
 selected_summary  object  Extract  Neo4j  Basic node fields + counts 
 linked_counts  object  Calculated  Neo4j  1-hop neighbor counts 
 targeted_prompts[]  list[str]  Hybrid  Constant  Deterministic list per type 
 ai_plan_steps[]  list[str]  Constant  Constant  “What the AI will do” text 
 guards  object  User Input  User Input  Current toggles 

## ---

5) Screen S2 — Dependency Desk

### 5.1 Purpose

Show cross-cutting dependency structure (graph view), rank the highest-risk dependency knots, and enable deep dives that produce coordination actions grounded in evidence.

### 5.2 Visual inventory

 W6 Cross-Cutting Dependency Map (3D Graph) with Chain Selector.  
 W7 Top Dependency Knots (age + impact) table.  
 Deep Dive panel + prompts + guards.  
 Bottom Deep Dive Query input.

### 5.3 W6 — Cross-Cutting Dependency Map (3D Graph) [UPDATED]

Inputs

 selected_node_id (from click)  
 chain_id (from dropdown) [NEW]  
 time_window_id

Outputs  
 Output  Type  How produced  Source type   
 ---  ---  ---  ---   
 nodes[]  list[object]  run_business_chain tool  Extract (Neo4j)   
 edges[]  list[object]  run_business_chain tool  Extract (Neo4j)   
 node_style_meta  object  derived (typestatus)  Calculated   
Business Chain Options  
 Chain Option  Chain ID  Logic Path (Nodes Traversed)   
 ---  ---  ---   
 Sector Ops  2.0_18  Objective → Policy → AdminRecord   
 Strategy to Priority  2.0_19  Objective → Capability → Project   
 Strategy to Targets  2.0_20  Objective → KPI → Project   
 Tactical Feedback  2.0_21  Project → Capability → Objective   
 Risk (Build)  2.0_22  Capability → Risk → Policy   
 Risk (Operate)  2.0_23  Capability → Risk → KPI   
 Internal Efficiency  2.0_24  Culture → Process → System 

### 5.4 W7 — Top Dependency Knots (SPOF)

A Knot is a System or Vendor shared by 3 Projects as a dependency (replaces Milestone logic).

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 knot_name  str  Extract  Neo4j  s.name (EntityITSystem) 
 impact_count  int  Calculated  Neo4j  count(p) (dependents) 
 status  str  Extract  Neo4j  s.operational_status 
 knot_type  str  Label  Neo4j  'System' or 'Vendor' 
 rank_score  float  Calculated  Neo4j  impact_count  weight 

## ---

6) Screen S3 — Risk Desk

### 6.1 Purpose

Detect, classify, and explain emerging risks using leading signals + propagation paths; deep dives propose mitigations.

### 6.2 Visual inventory

 W8 Risk Heatmap (2×2 Likelihood × Impact).  
 W9 Leading Signals (auto-detected drifts list).  
 W10 Propagation Path (selected risk) (chain visualization).  
 Deep Dive panel.

### 6.3 W8 — Risk Heatmap

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 risk_id  str  Extract  Neo4j  r.id 
 x_val (Likelihood)  float  Extract  Neo4j  r.likelihood_of_delay 
 y_val (Impact)  float  Extract  Neo4j  r.risk_score 
 color_group  str  Extract  Neo4j  r.risk_category 
 quadrant  enum  Calculated  Calculated  LowLow, HighHigh, etc. 

### 6.4 W10 — Propagation Path

Uses Business Chain 2.0_23 (Risk Operate).

 Output Field  Type  How Produced  Source Type 
 ----  ----  ----  ---- 
 path_nodes[]  list  Traversal  Neo4j 
 impact_kpi  str  Extract  Neo4j (SectorPerformance) 
 root_capability  str  Extract  Neo4j (EntityCapability) 

## ---

7) Screen S4 — Deep Dive Evidence-First Analysis

### 7.1 Header & Signal Summary

 Field  Type  How produced  Source type 
 ----  ----  ----  ---- 
 title_line  str  template  hybrid 
 linked_entities[]  list  traversal 1–2 hops  extract (graph) 
 owner_name  str  via OWNS  extract 
 status  enum  stored  extract 

### 7.2 Evidence (Inline)

Data needed Chunk nodes linked to Document.  
Query Vector similarity search against selected node name.

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 snippet_text  str  Extract  Neo4j (Chunk)  c.text 
 source_doc  str  Extract  Neo4j (Document)  d.fileName 
 page_num  int  Extract  Neo4j (Chunk)  c.page_number 
 relevance  float  Calculated  Vector Search  Similarity Score 

### 7.3 Immediate Actions

Source Supabase (dashboard_decisions).  
Actions Draft Exec Update, Create Decision Item (Insert into Supabase).

## ---

8) Screen S5 — Sector Insights [NEW]

### 8.1 Purpose

Macro-level view of investment health and economic impact.

### 8.2 Visual Inventory

 W11 Investment Portfolio Health (Scatter).  
 W12 Projects & Ops Integration (Bar).  
 W13 Macroeconomic Impact (BarLine).

### 8.3 Data requirements per widget

#### W11 Investment Portfolio Health

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 bubble_label  str  Extract  Supabase  initiative_name 
 x_val (Risk)  float  Extract  Supabase  risk_score 
 y_val (Alignment)  float  Extract  Supabase  alignment_score 
 size (Budget)  float  Extract  Supabase  budget 

#### W12 Projects & Ops Integration

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 period  str  Extract  Supabase  quarter 
 series_1_val  float  Extract  Supabase  kpi_actual WHERE dimension='Project Delivery Velocity' 
 series_2_val  float  Extract  Supabase  kpi_actual WHERE dimension='Operational Efficiency' 

#### W13 Macroeconomic Impact

 Output Field  Type  How Produced  Source Type  Notes 
 ----  ----  ----  ----  ---- 
 jobs_val  float  Extract  Supabase  jobs_created_actual 
 fdi_val  float  Extract  Supabase  fdi_actual 
 quarter  str  Extract  Supabase  quarter 

## ---

9) Metric definitions (calculations + constants)

### 9.1 Confidence score (0–1)

Used in Control Tower (portfolio), deep dives, and risk items.

Inputs

 completeness_score (0–1) fraction of required fieldsevidence present.  
 freshness_score (0–1) based on age of last updates vs thresholds.  
 evidence_coverage (0–1) fraction of narrative claims backed by evidence.

Formula (baseline)

 confidence = 0.50completeness_score + 0.30freshness_score + 0.20evidence_coverage

Constants

 freshness thresholds by artifact type (days)  
   Project update 7  
   KPI update 7  
   Meeting minutes 14  
   Contract clause 365

### 9.2 Signal drift (% or absolute)

Examples procurement cycle time drift +18% (3w).

 Percent drift ((current_period_value - baseline_period_value)  baseline_period_value)  100

### 9.3 Propagation impact score (0–100)

Quantifies how damaging a knot or risk is based on downstream reach and weight.

Inputs

 downstream_kpis_affectedint  
 downstream_objectives_affectedint  
 blocking_weight_sumfloat (assumed 1.0 for all blocks if unweighted)

Example scoring

 impact_score = 10downstream_kpis_affected + 5downstream_objectives_affected  
 Capped at 100.

## ---

10) Backend API contracts (minimum endpoints + payloads)

### 10.1 Control Tower

 GET apicontrol-towerhud-lens-a (Supabase)  
   Returns { axes [{ label, value }], burnout bool }  
 GET apicontrol-towerhud-lens-b (Neo4j)  
   Returns { axes [{ label, value, kpi_part, proj_part }] }  
 GET apicontrol-towerhealth-grid (Supabase)  
 GET apicontrol-towerdecisions (Supabase)  
   Returns [ { id, title, status, priority, due_date } ]  
 GET apicontrol-towermissing-inputs (Neo4j)

### 10.2 Dependency Desk

 POST apichainsrun (Body {chain_id, root_name})  
   Returns { nodes [], edges [] }  
 GET apidependencyknots (Neo4j)  
   Returns [ { name, impact_count, status, type } ]

### 10.3 Risk Desk

 GET apiriskheatmap (Neo4j)  
   Returns [ { id, x, y, group } ]  
 GET apiriskleading-signals (Neo4j)  
 GET apiriskpropagation-path (Neo4j)

### 10.4 Deep Dive (context-bound)

 POST apideep-diverun  
   input {selected_node_id, selected_node_type, guards}  
   output deep dive payload (S4), or empty when guard triggers.

### 10.5 Deterministic “button actions”

 POST apideep-divedraft-exec-update → {lines[str]} (exactly 6 lines)  
 POST apideep-divegenerate-decision-items → {decisions[DecisionItemDraft]}  
 POST apideep-divegenerate-validation-cypher → {queries[{name,cypher,params}]}

## ---

11) Data dictionary (field-level types; DB feasibility checklist)

### 11.1 IDs and typing

 All IDs string (UUID or stable business key)  
 Dates ISO YYYY-MM-DD  
 Datetimes ISO YYYY-MM-DDTHHMMSSZ (store timezone-aware)  
 Floats double precision  
 Enums constrained strings

### 11.2 EvidenceItem minimum (Neo4j)

 Field  Type  Required  Notes 
 ----  ----  ----  ---- 
 evidence_id  str  yes  Chunk ID 
 evidence_type  enum  yes  docdashboardmeeting 
 title  str  yes  Document Title 
 snippet  str  no  max 240 chars 
 source_ref  str  yes  URL or system reference 
 timestamp  datetime  yes   
 node_id  str  yes  the node supported 

## ---

12) Minor gaps  recommendations for v1.1 (feasibility hardening)

1. Temporal Edge Modeling Edges (DEPENDS_ON) currently lack valid_from properties. Analysis assumes all edges are active if the Nodes are active in the window.  
2. Org scope filtering Should be a precomputed allowlist passed as org_unit_ids[] into queries.  
3. Materialize heavy computations Top Knots should be a scheduled job if graph size  100k nodes.  
4. Evidence model Linked to Nodes (SUPPORTED_BY_EVIDENCE), not Claims.  
5. Signal computation Define whether signals live as KPI time series or separate Signal nodes.  
6. Indexing Ensure indices on quarter, status, owner_org_id.  
7. Prompt governance UI must enforce the Allowlist (Section 13).  
8. Confidence scoring Lock constants in config table.  
9. Performance budget Cap max hops (5) and max nodes (50).  
10. Auditability Store executed query parameters.

## ---

13) Targeted Prompts allowlist (Node Type → Allowed Prompts)

Rule API rejects prompt actions not in allowlist. UI disables them.

 Node Type  Allowed promptsactions 
 ----  ---- 
 Project  Explain delay (evidence+graph), Show dependency chain, Risk propagation, Generate decision items, Draft exec update, Stakeholder chain 
 Risk  Explain why emerged, What breaks next (top impacts), Mitigation options, Draft briefing 
 Objective  Show contributing risksprojects, KPI drift explanation 
 KPI  Show drivers (graph path), Evidence list 
 Vendor  Show obligations + linked deliverables, Show blocking edges 
 System  Show dependent projects, Data freshness impacts 
 PolicyTool  Show governed projects, Compliance blockers 
 OrgUnit  Show owned nodes + blockers, Missing inputs list 

## ---

Appendix A Critical Cypher Queries (Verified Schema)

Q1 Strategic Impact Radar (Lens B)

Cypher

MATCH (oSectorObjective {level 'L1'})  
 Verified Uses 'level' property found in schema  
OPTIONAL MATCH (kSectorPerformance)-[AGGREGATES_TO]-(o)  
OPTIONAL MATCH (pEntityProject)-[ALIGNS_WITH]-(o)  
WITH o,  
     avg(CASE WHEN k.target  0 THEN (k.actual  k.target) ELSE 0 END) as kpi_score,  
     avg(p.progress_percentage)  100.0 as proj_score  
RETURN o.name as Axis,  
       ((coalesce(kpi_score, 0)  0.7) + (coalesce(proj_score, 0)  0.3))  100 as Score  
ORDER BY o.name LIMIT 5

Q2 Top Dependency Knots (SPOF)

Cypher

MATCH (sEntityITSystem)-[DEPENDS_ON]-(pEntityProject)  
 Replaces 'Milestone' logic with 'EntityProject'  
WITH s, count(p) as dependents  
WHERE dependents  3  
RETURN s.name as Knot, dependents as Impact_Count, s.operational_status as Status  
ORDER BY dependents DESC

## ---

Appendix B Tool Definition (MCP)

Tool Name run_business_chain  
Description Executes a validated logic chain to trace graph relationships.

JSON

{  
  name run_business_chain,  
  input_schema {  
    type object,  
    properties {  
      chain_id {  
        type string,  
        enum [  
          2.0_18, 2.0_19, 2.0_20, 2.0_21,  
          2.0_22, 2.0_23, 2.0_24  
        ],  
        description The ID of the chain (e.g., '2.0_24' for Internal Efficiency).  
      },  
      parameters {  
        type object,  
        properties {  
          root_name { type string },  
          limit { type integer }  
        },  
        required [root_name]  
      }  
    },  
    required [chain_id]  
  }  
}

## ---

Appendix C Supabase Migration Script

Run this SQL to create the missing 'Decisions' infrastructure.

SQL

CREATE TABLE IF NOT EXISTS dashboard_decisions (  
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
    title TEXT NOT NULL,  
    status TEXT DEFAULT 'pending', -- pending, approved, rejected  
    priority TEXT DEFAULT 'medium', -- high, medium, low  
    owner_id UUID REFERENCES users(id),  
    linked_project_name TEXT,  
    due_date TIMESTAMP,  
    created_at TIMESTAMP DEFAULT NOW()  
);

-- Seed Data  
INSERT INTO dashboard_decisions (title, status, priority, linked_project_name, due_date)  
VALUES  
('Approve Cloud Vendor Contract', 'pending', 'high', 'Digital ID Program', NOW() + INTERVAL '2 days'),  
('Authorize Q4 Budget Variance', 'pending', 'medium', 'Data Platform', NOW() + INTERVAL '5 days');

fileName JOSOOR_Master_FRD_v1.3_Unabridged.md  
}