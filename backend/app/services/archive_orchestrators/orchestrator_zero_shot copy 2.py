"""
Zero-Shot Orchestrator - Cognitive Digital Twin (v3.6)

Architecture:
- Model: openai/gpt-oss-120b (Groq)
- Endpoint: v1/responses
- Tooling: Server-Side MCP (Groq executes the tools)
- Output Strategy: Text-Based JSON (No response_format enforcement)
- Security: Relies on DB-level permissions (MCP filtering not supported by Groq yet)
"""

"""
ORCHESTRATOR LOGIC & RULES DOCUMENTATION (DEVELOPER BIBLE)

This file implements the "Cognitive Digital Twin" Orchestrator.
It is NOT just a wrapper around an LLM. It is a strict runtime environment with specific rules that MUST be followed to avoid "traps" (Empty Bubbles, Infinite Loops, Hallucinations).

================================================================================
1. THE COGNITIVE CONTROL LOOP (STRICT)
================================================================================
The System Prompt enforces a 5-step loop. The Code MUST reflect this.
   "Requirements -> Recollect -> Recall -> Reconcile -> Return"

   - **Requirements**: Contextualization. Resolve ambiguities (e.g., "that project"). Gatekeeper Decision (Mode A-H).
   - **Recollect**: Semantic Anchoring. Identify Entities & Business Chains. Vector Search.
   - **Recall**: Graph Retrieval (Cypher).
   - **Reconcile**: Validation. Temporal Logic (Vantage Point). Gap Analysis.
   - **Return**: Synthesis. Business Language.

================================================================================
2. MCP TOOL EXECUTION (CRITICAL NUANCES)
================================================================================
The system uses the Model Context Protocol (MCP) via Groq.
   - **TRAP 1: Client-Side vs Server-Side**:
     - Groq `v1/responses` supports SERVER-SIDE tool execution (returning `mcp_call`).
     - **RULE**: You MUST set `require_approval: "never"` in the tool definition.
     - **FAILURE**: If missing or "always", Groq returns `function_call` (Client-Side), halting execution and returning an empty answer. The Orchestrator is designed for `mcp_call`.

   - **TRAP 2: Pagination Loops**:
     - The LLM may try to paginate manually (e.g., 15 calls of 5 items).
     - **RULE**: Enforce "Aggregation First" (COUNT, SUM) and "Sample" (LIMIT 30) in the System Prompt.
     - **RULE**: Do NOT allow the LLM to "crawl" the database.

================================================================================
3. RESPONSE NORMALIZATION (THE "EMPTY BUBBLE" TRAP)
================================================================================
The Frontend expects `answer` to be **Markdown Text**.
The LLM outputs **JSON**.
The `_normalize_response` method is the BRIDGE.

   - **TRAP 3: Raw JSON Leakage**:
     - If `_normalize_response` FAILS to parse the LLM's JSON, it defaults to returning the **Raw JSON String** as the `answer`.
     - **RESULT**: Frontend sees a JSON string -> Renders it as a "Tool Attempt" or "Code Block" -> User sees "Empty Bubble" or "JSON Fence".
     - **FIX**: `_normalize_response` MUST be robust.
       1. **Strip Comments**: LLMs often add `// comments` which break `json.loads`. Strip them (safely, multiline).
       2. **Strip Fences**: Remove ```json markers.
       3. **Fallback**: If parsing fails, try regex extraction of the `answer` field.

   - **TRAP 4: Nested JSON**:
     - The LLM often returns JSON *inside* the `answer` field of the JSON.
     - **RULE**: `_normalize_response` must extract the *inner* text.

   - **TRAP 5: HTML Artifacts**:
     - If the LLM generates an HTML report, it puts it in `answer`.
     - **RULE**: Detect HTML tags (`<!doctype html>`, `<html`) and move the content to `visualizations` artifact. Replace `answer` with a placeholder message.

================================================================================
4. CYPHER GENERATION NUANCES
================================================================================
   - **TRAP 6: Syntax Errors**:
     - Alternative Relationships: Use `:REL1|REL2`. **INVALID**: `:REL1|:REL2` (Multiple colons).
     - Level Integrity: `WHERE n.level='L3' AND m.level='L3'`. Do not mix levels.

================================================================================
5. PROMPT ENGINEERING NUANCES
================================================================================
   - **Structure**: `<MUST_READ_ALWAYS>` (Mission, Loop) vs `<MUST_READ_IN_A_PATH>` (Context).
   - **Injection**: Efficiency Tags or other instructions must be injected into the **System Prompt** (Static Prefix) or **User Query Suffix**, not just appended to history.
   - **No Comments**: Explicitly forbid `//` comments in the System Prompt to save the Parser.

================================================================================
6. ARCHITECTURAL CONSTRAINTS
================================================================================
   - **NO STREAMING**:
     - Streaming is **STRICTLY DISABLED** for this implementation.
     - **Reason**: The backend requires full access to the complete LLM response to perform Server-Side Tool Execution (MCP), Response Normalization (Stripping comments), and Validation.
     - **Implementation**: `execute_query` uses `stream=False`. The frontend receives the final, fully processed response as a single payload.

   - **STRUCTURED OUTPUTS**:
     - **Deviation**: We do NOT use the native `json_schema` response format (beta feature).
     - **Implementation**: We use `response_format={"type": "text"}` (default) and enforce JSON structure via the **System Prompt** (`<interface_contract>`).
     - **Reason**: Native JSON mode often conflicts with complex Chain-of-Thought reasoning and Tool Use in early beta models.

   - **REASONING**:
     - **Deviation**: We do NOT use the `reasoning` parameter (e.g., `{"effort": "low"}`).
     - **Implementation**: We rely on `tool_choice="auto"` and explicit prompt instructions ("Requirements -> Recollect...") to drive reasoning.

   - **MCP ROUTING**:
     - **Deviation**: We do NOT connect to individual MCP servers directly in the `tools` payload.
     - **Implementation**: We use a **Single MCP Router** (`MCP_ROUTER_URL`) that aggregates all tools (Neo4j, File Reader, etc.).
     - **Rule**: `server_url` is always the Router URL. `server_label` is set to `"router"` to expose prefixed tool names (e.g., `router__read_neo4j_cypher`).

   - **RESPONSE FORMAT**:
     - **Deviation**: We consume the Groq `v1/responses` specific `output` array format, NOT the standard OpenAI `choices` array.
     - **Implementation**: `_normalize_response` iterates over `resp["output"]` to extract `message`, `tool_result`, and `mcp_call` items.
     - **Strictness**: We do NOT fallback to `choices`. The system expects the `output` array structure.
"""
import os
import json
import time
import requests
from typing import Optional, Dict, List, Generator, Any
import re
import ast

# Assuming you have this utility in your project
from app.utils.debug_logger import log_debug


class OrchestratorZeroShot:
    """
    Cognitive Digital Twin Orchestrator.
    Manages the "Requirements -> Recollect -> Recall -> Reconcile -> Return" loop.
    """

    def __init__(self):
        # Groq API configuration
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        # STRICT: Use MCP_ROUTER_URL only. No fallback to MCP_SERVER_URL.
        self.mcp_router_url = os.getenv("MCP_ROUTER_URL")
        self.model = "openai/gpt-oss-120b"

        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        if not self.mcp_router_url:
            raise ValueError("MCP_ROUTER_URL environment variable not set")

        # Build static prefix ONCE (cached by Groq)
        self.static_prefix = self._build_static_prefix()

        log_debug(2, "orchestrator_initialized", {
            "type": "cognitive_digital_twin",
            "mode": "blocking_simulation", # We simulate streaming interface
            "model": self.model,
            "mcp_router": self.mcp_router_url
        })

    def _build_static_prefix(self) -> str:
        """
        Constructs the Master Cognitive Digital Twin Prompt.
        Updated to v3.5 Standards (Text-Based JSON).
        """
        return """
<MUST_READ_ALWAYS>
<system_mission>
- Today is <datetoday>.
- You are **Noor**, the Cognitive Digital Twin of a **KSA Government Agency**.
- This role is a result of fusing you (a multi‑disciplinary expert Analyst in Graph Databases, Sectoral Economics, and Organizational Transformation) with the agency's Institutional Memory.
- This was not done for Luxury, but necessity. The Institutional memory is a highly complex Triage of a Database that continues to grow. This makes decision making a slow process. And only AI like you can help.
- This is a great responsibility as you have been entrusted with supporting all agency staff at all levels with the accurate and factual interpretation of the agency's memory and its complexities.
- Your instructions are divided into two parts intended to make your job focused:
    1. <MUST_READ_ALWAYS> This covers this system mission, the <cognitive_control_loop>, and the <output_format>. What is it? Your institutional memory was designed to operate like a human memory, and it can only make sense if it follows the cognitive_control_loop "Requirements->Recollect->Recall->Reconcile->Return".
    2. <MUST_READ_IN_A_PATH>: Every other section. These are referenced in the control loop and MUST be read ONLY when the tag encounters you in a path.
- This approach helps you stay focused and access info only when needed.
- **File Handling:** If the `read_file` tool is available, refer to `<file_handling>` for instructions on retrieving uploaded file contents.
- You are always supportive and eager to help. But more than that, YOU ARE VESTED IN THE SUCCESS of the agency which can only happen through the success of its staff. So you listen with intent, empathy and genuinely trying to understand what's behind the lines so you can offer the best advice based on the factual data in the memory.
- This interface is for the users with READ ONLY privilege to the agency's memories.
- Vantage Point: this is a temporal database so all records are timestamped with quarters and years. Most of the queries will want to know if there is a problem and this depends highly on the <datetoday> as a vantage point. For all intents and purposes, projects with start dates in the future are not active (you must consider their completion rate as 0% even if their % of completion is > 0%) and are planned. Projects with start dates in the past might be active (in progress) or closed (100% completion). Based on this you can compare for example a certain project, its starting date, its % of completion, divide the duration equally by months or weeks, identify where it should have progressed by <datetoday> and resolve if there is a delay or not.
- Node Names: For queries always use the prefix Sector or Entity. For communication with users use the node name without the prefix and always use the right Level (e.x. show me the 2027 projects? in your query you would look in EntityProjects L3, while for the user you would translate to Project Outputs)
- **Bias for Action:** You are an expert. Do not ask for clarification on minor details like formatting, color schemes, or specific field names unless the query is completely ambiguous. Make professional, high-end choices based on the context and **EXECUTE**. If the user asks for a report, **generate it** with your best judgment.
</system_mission>

<cognitive_control_loop>
On every interaction, following this strict logical flow will guard and guide you to the right answers.

**1. REQUIREMENTS (Contextualization)**
* **Input Analysis:** Read the **Current User Query** and the **Conversation History**.
* **Resolution:** Resolve ambiguous terms (e.g., "that project" -> "Project X") and identify the Active Year relative to <datetoday>.
* **Gatekeeper Decision:** Classify intent into ONE `<interaction_modes>`.
    * *IF* mode requires data (A, B, G) -> **Proceed to Step 2.**
    * *IF* mode is conversational (C, D, E, F, H) -> **Skip to Step 5.**

**2. RECOLLECT (Semantic Anchoring)**
* **Anchor:** Identify the specific **Entities** and `<business_chains>` relevant to the query.
* **Vector Strategy:** Refer to `<vector_strategy>` rules.
    * Use **Template A** (Concept Search) if the topic is vague.
    * Use **Template B** (Inference) if the user asks to infer missing links or find similar items.

**3. RECALL (Graph Retrieval)**
* **Translation:** Convert concepts into precise Cypher using `<graph_schema>`, `<level_definitions>`, `<direct_relationships>`, and `<data_integrity_rules>`.
* **Syntax Check:** Before executing, cross‑reference your query with `<cypher_examples>` to ensure efficient patterning.
* **Cypher Rules:**
  - **Alternative Relationships:** Use `:REL1|REL2|REL3`. DO NOT use `:REL1|:REL2|:REL3` (multiple colons are invalid).
  - **Level Integrity:** You MUST filter **ALL** nodes in a path by the same level (e.g., `WHERE n.level = 'L3' AND m.level = 'L3'`). Do not mix L2 OrgUnits with L3 Projects.
* **Constraint Management:** Consult `<tool_rules>` for the strict Logic on Pagination (Keyset Strategy) and Limits (30 items).
* **Execution:** Execute `read_neo4j_cypher`.

**4. RECONCILE (Validation & Logic)**
* **Data Verification:** Check if the tool output matches the user's request.
* **Temporal Check:** Apply the "Vantage Point" logic from `<system_mission>` to validate status (Active vs Planned).
* **Gap Analysis:** If data is missing, check `<business_chains>` for indirect relationships.

**5. RETURN (Synthesis)**
* **Synthesis:** Generate the final answer adhering to `<output_format>`.
* **Language Rule:** Use strict Business Language. NEVER use terms like "Node", "Cypher", "L3", "ID", or "Query" in the public answer.
</cognitive_control_loop>

<output_format>

<visualization_schema>
The `visualizations` array in the response can contain objects with the following structure.
Supported types: "column", "line", "radar", "bubble", "bullet", "combo", "table", "html".

**Example (Bubble Chart):**
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
}
</visualization_schema>

<interface_contract>
1. The user interface is optimized to render Markdown formatting text.
2. You must output the final answer as **RAW TEXT**.
3. The text itself must be a valid JSON string.
4. **FORMATTING:** Optimize for readability utilizing Markdown formatting standards like bullet points, bold, italic, font sizes using styles etc... while avoiding excessive use of line breaks to keep the answer tight and lean.
5. **NO COMMENTS:** Do NOT include comments (e.g., `// ...`) in the JSON output. It must be strict valid JSON.
6. **NO FENCES:** Do NOT wrap the JSON output in markdown code blocks (e.g., ```json ... ```). Output RAW JSON only.
</interface_contract>

<response_template>
(Please output your final response following this structure).

{
  "memory_process": {
    "intent": "User intent...",
    "thought_trace": "Step‑by‑step reasoning log..."
  },
  "answer": "Business‑language narrative. When generating HTML, you must act as the **Rendering Engine**. The frontend has NO templating capabilities (no Handlebars/Mustache). You must produce the **FINAL, fully rendered HTML string** with all data values injected directly into the tags.",
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
}
</response_template>

<data_structure_rules>
1. **Never nest result sets under custom keys.** If you run multiple queries (e.g. Projects AND OrgUnits), return them in a single flat list in `query_results` and add a "type" field to each object to distinguish them.
2. **Network Graphs:** Not supported. Render as a table with columns: Source, Relationship, Target.
</data_structure_rules>

</output_format>
</MUST_READ_ALWAYS>

<MUST_READ_IN_A_PATH>
<interaction_modes>
* **A (Simple Query):** Specific fact lookup (e.g., "List projects"). [Requires Data]
* **B (Complex Analysis):** Multi‑hop reasoning, impact analysis. [Requires Data]
* **C (Exploratory):** Brainstorming, hypothetical scenarios. [No Data]
* **D (Acquaintance):** Questions about Noor's role and functions. [No Data]
* **E (Learning):** Explanations of transformation concepts, ontology, or relations. [No Data]
* **F (Social/Emotional):** Greetings, frustration. [No Data]
* **G (Continuation):** Follow‑up requiring new data. [Requires Data]
* **H (Underspecified):** Ambiguous parameters. [No Data]
</interaction_modes>


<data_integrity_rules>
**THE GOLDEN SCHEMA (Immutable Ground Truth)**
Map user queries strictly to these definitions.

**DATA INTEGRITY RULES:**
1.  **Universal Properties:** *EVERY* node has `id`, `name`, `year`, `quarter`, `level`.
2.  **Composite Key:** Unique entities are defined by **`id` + `year`**. Filter by `year` to avoid duplicates.
3.  **Level Alignment:** Functional relationships between Entity nodes or Sector nodes  strictly connect results at the **SAME LEVEL**.
    * **Rule:** If you query L3 in a node and are trying to find relations in another node in the same domain (e.g. Entity), you MUST connect them to the matching L3 in the other node.
    *   **Exception:** The `PARENT_OF` relationship is the ONLY link that crosses levels (L1->L2->L3) as it exists only in the same node and is designed to prevent orphan L3 and L2 entries.
4.  **Temporal Filtering:** Queries must explicitly filter nodes by `year` (e.g., `WHERE n.year = 2026`) AND `level` (e.g., `AND n.level = 'L3'`) for every node type involved.
    * Sub‑rule: Always exclude future-start projects from active counts — add a start_date filter `AND (n.start_date IS NULL OR n.start_date <= date('<datetoday>'))` when an entity has a `start_date` property.
</data_integrity_rules>
<graph_schema>
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
- `risk_score` is 1-10 (High > 7). Do NOT use `severity`.
- `progress_percentage` is 0-100. Do NOT use `percentComplete`.
- `budget` is numeric.
- `level` is always 'L1', 'L2', or 'L3'.

Traversal Paths:
- Project to Capability: (Project)-[:CLOSE_GAPS]->(System/Process/Org)-[:OPERATES]->(Capability)
- Project to Risk: Project -> ... -> Capability -[:MONITORED_BY]-> Risk
</graph_schema>
4.  **Risk Dependency:** Risks are structurally tied to Capabilities. Capabilities is the hub to find relations upwards to Sector nodes up till Objectives, or downwards in the Entity domain till Projects and ChangeAdoptions.
    * **Pattern:** `(:EntityCapability) -[:MONITORED_BY]-> (:EntityRisk)`
    * **Logic:** To find a Project's risks, you must traverse: Project <-> OrgUnit/ITSystem/Process <-> Capability -> Risk  

**LEVEL DEFINITIONS:**
* `SectorObjective`: L1=Strategic Goals, L2=Cascaded Goals, L3=KPI Parameters.
* `SectorPolicyTool`: L1=Tool Type, L2=Tool Name, L3=Impact Target.
* `EntityProject`: L1=Portfolio (collection of Programs and Projects), L2=Program (collection of Projects), L3=Project (Output or Milestones or Key Deliverables).
* `EntityCapability`: L1=Business Domain (collection of Functions), L2=Function (collection of Competencies), L3=Competency (collection of OrgUnits applying Processes Utilizing ITSystems).
* `EntityRisk`: L1=Domain Risks (collection of Domain Risks), L2=Functional Risks (collection of Functional Risks), L3=Specific Risk (Single Specific Risk).
* `EntityOrgUnit`: L1=Department (Single Largest Possible Department), L2=Sub‑Dept (collection of Sub‑Departments), L3=Team (collection of Teams or Individuals).
* `EntityITSystem`: L1=Platform (Single Largest Platform), L2=Module (collection of Modules), L3=Feature (collection of Features).
* `EntityChangeAdoption`: L1=Domain (Collection of Business Domain functions being changed), L2=Area (collection of Functional competencies being changed), L3=Behavior (collection of Individual Competencies being changed).

<direct_relationships>
**DIRECT RELATIONSHIPS (Same‑Level Only):**
These relationships represent the REAL and ONLY DIRECT world relations between nodes. Their absence in the graph (including "Relationship type does not exist" warnings) represents a gap that must always be raised to validate:
**Sector Operations**
SectorObjective		-->Realized Via		SectorPolicyTool
SectorPolicyTool	-->Governed By	SectorObjective
SectorObjective	-->Cascaded Via	SectorPerformance
SectorPolicyTool	-->Refers To	SectorAdminRecord
SectorAdminRecord	-->Applied On	SectorBusiness
SectorAdminRecord	-->Applied On	SectorGovEntity
SectorAdminRecord	-->Applied On	SectorCitizen
SectorBusiness	-->Triggers Event	SectorDataTransaction
SectorGovEntity	-->Triggers Event	SectorDataTransaction
SectorCitizen	-->Triggers Event	SectorDataTransaction
SectorDataTransaction	-->Measured By	SectorPerformance
SectorPerformance	-->Aggregates To	SectorObjective
**Strategic Integrated Risk Management**
EntityRisk	-->Informs	SectorPerformance
EntityRisk	-->Informs	SectorPolicyTool
EntityRisk	<--	MONITORED_BY	EntityCapability
**Sector and Entity Relations**
SectorPolicyTool	-->Sets Priorities	EntityCapability
SectorPerformance	-->Sets Targets	EntityCapability
EntityCapability	-->Executes	SectorPolicyTool
EntityCapability	-->Reports	SectorPerformance
**Entity Internal Operations**
EntityCapability	-->Role Gaps	EntityOrgUnit
EntityCapability	-->Knowledge Gaps	EntityProcess
EntityCapability	-->Automation Gaps	EntityITSystem
EntityOrgUnit	-->Operates	EntityCapability
EntityProcess	-->Operates	EntityCapability
EntityITSystem	-->Operates	EntityCapability
EntityCultureHealth	-->Monitors For	EntityOrgUnit
EntityOrgUnit	-->Apply	EntityProcess
EntityProcess	-->Automation	EntityITSystem
EntityITSystem	-->Depends On	EntityVendor
**Transforming Entity Capabilities**
EntityOrgUnit	-->Gaps Scope	EntityProject
EntityProcess	-->Gaps Scope	EntityProject
EntityITSystem	-->Gaps Scope	EntityProject
EntityProject	-->Close Gaps	EntityOrgUnit
EntityProject	-->Close Gaps	EntityProcess
EntityProject	-->Close Gaps	EntityITSystem
**Project to Operation Transfer**
EntityProject	-->Adoption Risks	EntityChangeAdoption
EntityChangeAdoption	-->Increase Adoption	EntityProject
</direct_relationships>

// Optional links note: The direct relationships above may be missing for early‑stage or conceptual projects (e.g., CLOSES_GAPS, MONITORED_BY, OPERATES). Queries MUST treat these relations as optional; do not assume their existence when counting or sampling projects. Use OPTIONAL MATCH to enrich only after an existence check.

<business_chains>
These chains represent the REAL and ONLY paths to find INDIRECT relations between nodes. Their absence in the graph represents a gap that must always be raised to validate:
1. **SectorOps**
   Path: SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective
   Story: Describes how government objectives are executed externally through policy tools, stakeholder interactions, and performance measurement cycles.

2. **Strategy_to_Tactics_Priority_Capabilities**
   Path: SectorObjective → SectorPolicyTool → EntityCapability → Gaps → EntityProject → EntityChangeAdoption
   Story: Explains how strategic goals cascade through policy tools to shape capability‑building and implementation projects.

3. **Strategy_to_Tactics_Capabilities_Targets**
   Path: SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption
   Story: Captures how performance targets flow top‑down from strategy to operational projects via capabilities.

4. **Tactical_to_Strategy**
   Path: EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → SectorPerformance|SectorPolicyTool → SectorObjective
   Story: Describes the feedback loop where project execution informs higher‑level strategy and policy decisions.

5. **Risk_Build_Mode**
   Path: EntityCapability → EntityRisk → SectorPolicyTool
   Story: Illustrates how operational risks influence the design and activation of policy tools.

6. **Risk_Operate_Mode**
   Path: EntityCapability → EntityRisk → SectorPerformance
   Story: Explains how capability‑level risks affect performance outcomes and KPI achievement.

7. **Internal_Efficiency**
   Path: EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor
   Story: Represents how organizational health drives process and IT efficiency through vendor ecosystems.
</business_chains>

<vector_strategy>
**TEMPLATE A: Concept Search (Text‑to‑Node)**
*Use when:* User asks about a topic ("Water leaks", "Digital") but names no specific entity.
```cypher
CALL db.index.vector.queryNodes($indexName, $k, $queryVector) YIELD node, score
WHERE node.embedding IS NOT NULL
RETURN coalesce(node.id, elementId(node)) AS id, node.name AS name, score
```

**TEMPLATE B: Inference & Similarity (Node‑to‑Node)**
*Use when:* User asks to "infer links", "find similar projects", or "fill gaps".
*Logic:* Calculate Cosine Similarity between a Target Node and Candidate Nodes.
```cypher
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
```

// Tip: When a schema-based enrichment is required first (aggregation + temporal filtering), prefer using the refined Pattern 3 as the default starting point before applying `Template B` for similarity-based inference.
</vector_strategy>

<cypher_examples>
**Pattern 1: Optimized Retrieval (Token Aware)**
*Goal: Get 2027 Projects with total count in one call.*
```cypher
MATCH (p:EntityProject)
WHERE p.year = 2027 AND p.level = 'L3'
WITH p ORDER BY p.name
// CHANGE: Return count FIRST so the model sees it immediately
RETURN count(p) AS total_count, collect(p { .id, .name })[0..30] AS records
```

**Pattern 2: Impact Analysis (Chain 1)**
*Goal: Strategy to Execution flow.*
```cypher
MATCH (p:EntityProject {name: 'Digital Transformation', year: 2025, level: 'L3'})
MATCH (p)-[:ADDRESSES_GAP]->(c:EntityCapability)
MATCH (c)-[:EXECUTES]->(t:SectorPolicyTool)
WHERE c.level = 'L3' AND t.level = 'L3'
RETURN p.name, c.name, t.name
```

**Pattern 3: Safe Portfolio Health Check (Aggregation First + Optional Enrichment)**
*Goal: Get 2026 L3 Projects (sample + count) then enrich with gaps, capabilities, and critical risks without losing rows when relationships are missing.*
```cypher
// Separate Existence Check from Enrichment — count first, then OPTIONAL MATCH for enrichment
MATCH (p:EntityProject)
WHERE p.year = 2026 AND p.level = 'L3' AND (p.start_date IS NULL OR p.start_date <= date('<datetoday>'))
WITH p
ORDER BY p.name
WITH count(p) AS total_projects, collect(p { .id, .name, .budget, .progress_percentage })[0..30] AS sample_projects
// Enrichment: optional joins, with filters scoped inside OPTIONAL MATCH to avoid implicit row elimination
OPTIONAL MATCH (p)-[:ADDRESSES_GAP]->(g:EntityOrgUnit)
WHERE g.year = 2026 AND g.level = 'L3'
OPTIONAL MATCH (p)-[:ADDRESSES_GAP]->(g2:EntityITSystem)
WHERE g2.year = 2026 AND g2.level = 'L3'
OPTIONAL MATCH (p)-[:ADDRESSES_GAP]->(g3:EntityProcess)
WHERE g3.year = 2026 AND g3.level = 'L3'
OPTIONAL MATCH (p)-[:ADDRESSES_GAP]->(c:EntityCapability)
WHERE c.year = 2026 AND c.level = 'L3'
OPTIONAL MATCH (c)-[:MONITORED_BY]->(r:EntityRisk)
WHERE r.year = 2026 AND r.level = 'L3' AND r.risk_score > 7
// Calculate budget utilization safely — default nulls to 0
WITH total_projects, sample_projects,
     collect(g)[0..5] AS gaps, collect(c)[0..5] AS capabilities,
     COUNT(DISTINCT r) AS critical_risks,
     SUM(COALESCE(p.budget, 0) * COALESCE(p.progress_percentage, 0) / 100.0) AS budget_utilized
RETURN total_projects, sample_projects, gaps, capabilities, critical_risks, budget_utilized
```
</cypher_examples>

<tool_rules>
**Tool:** `router__read_neo4j_cypher` (Primary).

1.  **Aggregation First:** Use count(n) for totals and collect(n)[0..30] for samples in a SINGLE QUERY.
2.  **Trust Protocol:** If the tool returns valid JSON, **TRUST IT**. Do not re‑query to "verify" counts. The system does not truncate JSON keys.
3.  **Continuity Strategy (Keyset Pagination):**
    * To get the next batch, filter by the last seen ID: WHERE n.id > $last_seen_id.
    * Always ORDER BY n.id to maintain the timeline.
    * Do NOT emit SKIP or OFFSET queries.
4.  **Efficiency:** Return only id and name. No embeddings.
5.  **Server‑Side Execution:** The tool runs remotely. Do NOT hallucinate the output. Wait for the system to return the tool result.
6.  **Use OPTIONAL MATCH Correctly:** Place the OPTIONAL MATCH clauses after the primary MATCH; avoid referencing variables from optional patterns in subsequent WHERE clauses. Instead, move any filters on optional nodes into the OPTIONAL MATCH itself (e.g., OPTIONAL MATCH (p)-[:CLOSES_GAPS]->(g) WHERE g:EntityOrgUnit OR g:EntityITSystem OR g:EntityProcess). This ensures projects without those links are still retained.
7.  **Separate Existence Check from Enrichment:** Start with a lightweight existence query (e.g., `count`) scoped to year/level. Only add OPTIONAL MATCH enrichment clauses after confirming the existence count is greater than zero to prevent false negatives.
8.  **Document Assumptions:** Include brief Cypher `//` comments describing the purpose of each clause and any assumptions (e.g., filtering rationale). This helps future reviewers and reduces hidden logic errors.
9.  **ARGUMENT FORMAT:** You MUST pass arguments as a valid JSON object.
    * **CORRECT:** `router__read_neo4j_cypher(query="MATCH ...")` (which implies `{"query": "MATCH ..."}`)
    * **WRONG:** `router__read_neo4j_cypher("MATCH ...")` (Do NOT pass raw string)
</tool_rules>

<file_handling>
**Tool:** `router__read_file` (Conditional - only available when files are attached).

**Purpose:** Retrieve and process uploaded file contents on‑demand.

**When to Use:**
* User has attached files to their message
* You need to analyze, summarize, or extract information from the files
* User asks questions about the attached files

**Supported File Types:**
* **Text:** TXT, MD, CSV - Returns raw content

**Usage Pattern:**
```
router__read_file(file_id="abc123")
```

**Response Structure:**
{
  "type": "document|data|text",
  "content": "Extracted content...",
  "filename": "report.pdf",
  "metadata": {...}
}

**Important Notes:**
1. **On‑Demand Only:** Do NOT read files unless necessary for answering the query
2. **Efficiency:** If user asks a general question, answer first. Only read files if specifically asked
3. **Context Integration:** After reading, incorporate file insights into your analysis
4. **Business Language:** When discussing file contents, use clear business terms, not technical jargon
</file_handling>
"""

    def execute_query(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        file_metadata: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:

        """
        Orchestrates the query execution.
        
        NOTE: This is a synchronous execution. Streaming is NOT supported.
        Returns the final normalized response object directly.
        """
        
        # 1. Build Context
        dynamic_suffix = self._build_dynamic_suffix(user_query, conversation_history, file_metadata)
        full_input = self.static_prefix + dynamic_suffix

        # 2. Construct Payload (v1/responses + gpt-oss-120b specific)
        request_payload = {
            "model": self.model,
            "input": full_input,    # 'responses' API uses 'input', not 'messages'
            "stream": False,        # FORCE False to handle tool outputs safely
            "temperature": 0.1,     # Strict adherence
            "tool_choice": "auto"   # Critical: Allows model to choose "Think" or "Act"
        }

        # 3. Inject Tools (if enabled)
        # FIX: Use single MCP Router for all tools. 
        # The Router exposes ALL available tools (Neo4j, File Reader, etc.).
        # We define it ONCE. Groq auto-discovers all tools.
        mcp_router_url = self.mcp_router_url
        
        tools = [
            {
                "type": "mcp",
                "server_label": "router",  # No prefix (tools are already named read_neo4j_cypher, etc.)
                "server_url": mcp_router_url,
                "require_approval": "never"
            },
        ]
        
        # NOTE: We cannot selectively enable 'read_file' if it's on the same Router.
        # The Router exposes everything. We rely on the System Prompt to guide usage.
        
        request_payload["tools"] = tools

        log_debug(2, "request_start", {"model": self.model, "endpoint": "v1/responses"})

        try:
            # 4. Execute Request (Blocking)
            with requests.post(
                "https://api.groq.com/openai/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=request_payload,
                stream=False,  # Sync with payload
                timeout=120,
            ) as response:

                if response.status_code != 200:
                    error_msg = f"Upstream Error {response.status_code}: {response.text}"
                    log_debug(1, "groq_error", {"body": response.text})
                    return {"error": error_msg}

                # 5. Parse Response
                final_obj = response.json()
                
                # 6. Normalize & Send
                try:
                    normalized = self._normalize_response(final_obj)
                except Exception as e:
                    log_debug(1, "normalization_failed", {"error": str(e)})
                    normalized = {
                        "answer": final_obj.get("output_text") or str(final_obj),
                        "memory_process": {"error": "Normalization Failed"},
                        "data": {}
                    }

                # 7. Return Result
                return normalized

        except Exception as e:
            log_debug(1, "orchestrator_error", {"error": str(e)})
            return {"error": str(e)}

    def _build_dynamic_suffix(self, user_query: str, history: Optional[List[Dict]] = None, file_metadata: Optional[List[Dict]] = None) -> str:
        """Constructs the dynamic conversation part of the prompt."""
        current_date = time.strftime("%Y-%m-%d")
        suffix = f"\n<datetoday>{current_date}</datetoday>\n"
        
        # Add file metadata (if files uploaded) - LIGHTWEIGHT
        if file_metadata:
            suffix += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nATTACHED FILES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            
            for idx, file_meta in enumerate(file_metadata, 1):
                suffix += f"{idx}. **{file_meta['filename']}** (ID: `{file_meta['file_id']}`)\n"
                suffix += f"   Type: {file_meta['mime_type']}\n"
                suffix += f"   Size: {file_meta['size_mb']:.2f} MB\n\n"
            
            suffix += "**Note:** Use `read_file(file_id)` to retrieve contents. Refer to `<file_handling>` for details.\n\n"
            suffix += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        # FIX: Move conversation history here to preserve static prefix caching
        if history:
            suffix += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONVERSATION HISTORY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            for msg in history[-10:]: # Limit to last 10 messages
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                suffix += f"<{role}>\n{content}\n</{role}>\n\n"
            suffix += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            
        suffix += f"\nUSER QUERY\n\n{user_query}"
        
        return suffix

    def _normalize_response(self, resp: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize the Groq/OpenAI Responses API output into our expected
        zero-shot result shape.
        """
        result: Dict[str, Any] = {
            "answer": "",
            "memory_process": {},
            "analysis": [],
            "visualizations": [],
            "data": {},
            "cypher_executed": None,
            "confidence": 0.0,
            "tool_results": [],
            "raw_response": resp,
        }

        raw_text = ""
        texts = [] # Initialize texts list for collecting content

        # Check for tool_calls first (v1/responses standard)
        tool_calls = resp.get("tool_calls") or []

        # Handle the specific 'json' tool call we defined to catch hallucinations
        json_tool_call = next((tc for tc in tool_calls if tc.get("function", {}).get("name") == "json"), None)
        if json_tool_call:
            try:
                args = json_tool_call["function"]["arguments"]
                if isinstance(args, str):
                    parsed_json = json.loads(args)
                else:
                    parsed_json = args
                
                # If we successfully extracted JSON from the tool, we can skip text parsing
                # But we still want to capture any reasoning text if present in the main output
            except Exception as e:
                log_debug(1, "json_tool_parse_failed", {"error": str(e)})

        if resp.get("output_text"):
            raw_text = resp.get("output_text")
        elif isinstance(resp.get("output"), list):
            # Handle v1/responses list format
            for item in resp["output"]:
                if isinstance(item, dict):
                    # Capture tool results
                    if item.get("type") in ("tool_result", "tool_output"):
                        result["tool_results"].append({
                            "tool": item.get("tool_name") or "unknown",
                            "result": item.get("content") or item.get("output")
                        })
                    
                    # Capture MCP calls (server-side execution)
                    if item.get("type") == "mcp_call":
                        fn_name = item.get("name")
                        fn_args = item.get("arguments")
                        tool_output = item.get("output")
                        
                        # Capture Cypher query
                        if fn_name == "read_neo4j_cypher":
                            try:
                                if isinstance(fn_args, str):
                                    parsed_args = json.loads(fn_args)
                                else:
                                    parsed_args = fn_args
                                if "query" in parsed_args:
                                    result["cypher_executed"] = parsed_args["query"]
                            except Exception:
                                pass
                        
                        # Capture result
                        result["tool_results"].append({
                            "tool": fn_name,
                            "result": tool_output
                        })

                    # Capture text from 'message' or 'text' items
                    if item.get("type") == "message":
                        # Message content is a list of items
                        msg_content = item.get("content", [])
                        if isinstance(msg_content, list):
                            for sub_item in msg_content:
                                if sub_item.get("type") == "output_text":
                                    texts.append(sub_item.get("text", ""))
                        elif isinstance(msg_content, str):
                            texts.append(msg_content)
                    
                    # Fallback for direct content
                    content = item.get("content") or item.get("text")
                    if content and isinstance(content, str):
                        texts.append(content)
                    
                    # Capture tool calls from the list format (Groq specific)
                    if item.get("type") == "function_call":
                        fn_name = item.get("name")
                        try:
                            args = item.get("arguments")
                            if isinstance(args, str):
                                parsed_args = json.loads(args)
                            else:
                                parsed_args = args
                            
                            # 1. Handle 'json' tool (if we ever re-enable it or if model hallucinates it)
                            if fn_name == "json":
                                parsed_json = parsed_args
                            
                            # 2. Handle 'read_neo4j_cypher' to capture the query
                            elif fn_name == "read_neo4j_cypher":
                                if "query" in parsed_args:
                                    result["cypher_executed"] = parsed_args["query"]
                                    
                        except Exception:
                            pass

            if texts:
                raw_text = "\n".join(texts)
        
        # 2) Robust JSON Extraction
        # The LLM might return:
        # - Pure JSON
        # - Markdown fenced JSON (```json ... ```)
        # - Python string representation of a list (Groq quirk)
        
        # Handle Groq's "Python list as string" quirk
        # It might contain 'output_text', 'reasoning_text', or both.
        if isinstance(raw_text, str) and raw_text.strip().startswith("[{") and ("output_text" in raw_text or "reasoning_text" in raw_text):
            # Attempt 1: ast.literal_eval (Standard Python parsing)
            try:
                parsed_list = ast.literal_eval(raw_text)
                if isinstance(parsed_list, list):
                    extracted_output = ""
                    found_valid_content = False
                    
                    for item in parsed_list:
                        if not isinstance(item, dict):
                            continue
                            
                        # Capture reasoning
                        if item.get("type") == "reasoning_text":
                            found_valid_content = True
                            thought = item.get("text", "")
                            if thought:
                                # Append to memory_process
                                if "memory_process" not in result:
                                    result["memory_process"] = {}
                                current_trace = result["memory_process"].get("thought_trace", "")
                                if current_trace:
                                    result["memory_process"]["thought_trace"] = current_trace + "\n" + thought
                                else:
                                    result["memory_process"]["thought_trace"] = thought

                        # Capture output text
                        elif item.get("type") == "output_text":
                            found_valid_content = True
                            extracted_output += item.get("text", "")
                    
                    # If we successfully parsed the list and found relevant content,
                    # update raw_text to be the extracted output (or empty if only reasoning was found).
                    # This prevents the raw list string from being used as the answer.
                    if found_valid_content:
                        raw_text = extracted_output

            except Exception:
                # Attempt 2: Regex extraction (Fallback for malformed lists)
                # For now, let's stick to the AST approach as primary. 
                # If AST fails, we might still want to try regex for output_text specifically.
                try:
                    # Find the start of the output_text block
                    output_text_marker = re.search(r"'type':\s*'output_text'", raw_text) or re.search(r'"type":\s*"output_text"', raw_text)
                    
                    if output_text_marker:
                        start_idx = output_text_marker.end()
                        # Search for 'text': or "text": after the marker
                        text_key_match = re.search(r"['\"]text['\"]\s*:\s*(['\"])", raw_text[start_idx:])
                        
                        if text_key_match:
                            quote_char = text_key_match.group(1) # ' or "
                            content_start = start_idx + text_key_match.end()
                            
                            # Manually scan for the closing quote, respecting backslash escapes
                            content_end = -1
                            i = content_start
                            while i < len(raw_text):
                                if raw_text[i] == quote_char:
                                    # Check if escaped
                                    escaped = False
                                    backslashes = 0
                                    j = i - 1
                                    while j >= content_start and raw_text[j] == '\\':
                                        backslashes += 1
                                        j -= 1
                                    if backslashes % 2 == 1:
                                        escaped = True
                                    
                                    if not escaped:
                                        content_end = i
                                        break
                                i += 1
                            
                            if content_end != -1:
                                extracted_text = raw_text[content_start:content_end]
                                # Unescape the extracted text
                                try:
                                    raw_text = ast.literal_eval(f"{quote_char}{extracted_text}{quote_char}")
                                except:
                                    raw_text = extracted_text.replace(f"\\{quote_char}", quote_char).replace("\\n", "\n").replace("\\t", "\t").replace("\\\\", "\\")
                    else:
                        # If no output_text marker found, but we know it contains reasoning_text (from the outer if),
                        # and AST failed, we should CLEAR raw_text to avoid showing the raw list.
                        if "reasoning_text" in raw_text:
                            raw_text = ""
                except Exception:
                    # If even regex fails, and we have reasoning_text, clear it to be safe.
                    if "reasoning_text" in raw_text:
                        raw_text = ""

        parsed_json = None
        
        # Attempt 3: Extract JSON from Markdown code blocks
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text, re.IGNORECASE)
        if json_match:
            try:
                json_str = json_match.group(1)
                # FIX: Safer comment stripping (only lines starting with //)
                json_str = re.sub(r"^\s*//.*$", "", json_str, flags=re.MULTILINE)
                parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Attempt 4: Find first { and last } (Fallback)
        if not parsed_json:
            try:
                # Prioritize {" for JSON objects to avoid Python dicts
                start_json = raw_text.find('{"')
                if start_json == -1:
                    start = raw_text.find("{")
                else:
                    start = start_json
                
                end = raw_text.rfind("}")
                
                if start != -1 and end != -1 and end > start:
                    json_str = raw_text[start : end + 1]
                    # FIX: Safer comment stripping here too
                    json_str = re.sub(r"^\s*//.*$", "", json_str, flags=re.MULTILINE)
                    parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                pass

        # 3) Map Parsed JSON to Result
        if parsed_json and isinstance(parsed_json, dict):
            for key in ["memory_process", "data", "visualizations", "analysis", "cypher_executed", "confidence"]:
                if key in parsed_json:
                    result[key] = parsed_json[key]
            
            if "answer" in parsed_json:
                result["answer"] = parsed_json["answer"]
            elif "message" in parsed_json:
                result["answer"] = parsed_json["message"]
            
            # Fallback: If answer is still missing/empty but we have a thought, use it
            if not result.get("answer") and "thought" in parsed_json:
                result["answer"] = parsed_json["thought"]

        else:
            # Fallback: Parsing failed. Try to extract "answer" via Regex.
            # This handles cases where JSON is malformed but "answer" is present.
            answer_match = re.search(r'"answer"\s*:\s*"(.*?)(?<!\\)"', raw_text, re.DOTALL)
            if answer_match:
                # Unescape the extracted string
                try:
                    result["answer"] = ast.literal_eval(f'"{answer_match.group(1)}"')
                except:
                    result["answer"] = answer_match.group(1)
            else:
                # CRITICAL: Do NOT return raw_text if it looks like JSON.
                # This prevents "Empty Bubble" or "Tool Attempt" rendering in frontend.
                if raw_text.strip().startswith("{"):
                    result["answer"] = "I encountered an error processing the response format. Please try again."
                    log_debug(1, "json_parse_failed_fatal", {"raw_text_snippet": raw_text[:200]})
                else:
                    result["answer"] = raw_text
        
        # Final Safety Net: Ensure answer is never None or empty if we have other content
        if not result.get("answer"):
            if result.get("visualizations"):
                 result["answer"] = "I have generated the requested visualizations."
            elif result.get("tool_results"):
                 result["answer"] = "Task completed."
            elif not result.get("answer"): # Still empty
                 result["answer"] = "Processed."

        # 4) Server-Side HTML Detection (The Fix)
        # Check if 'answer' contains a full HTML document. 
        # If so, move it to an artifact and clean the answer.
        answer_str = str(result["answer"]).strip()
        if re.search(r"<!doctype html>|<html\b", answer_str, re.IGNORECASE):
            # Create an HTML artifact
            html_artifact = {
                "type": "html",
                "title": "HTML Report",
                "content": answer_str
            }
            
            # Add to visualizations (or artifacts list if we had one, but visualizations works for now)
            # We treat 'html' as a visualization type in the frontend
            if "visualizations" not in result:
                result["visualizations"] = []
            
            result["visualizations"].append(html_artifact)
            
            # Update answer to point to the artifact
            result["answer"] = "I have generated the HTML report for you. Please view it below."

        # 5) Schema Validation (Phase 2)
        try:
            from app.schemas import LLMResponse
            # Validate and dump to ensure defaults are applied
            validated = LLMResponse(**result)
            return validated.dict()
        except Exception as e:
            log_debug(1, "schema_validation_failed", {"error": str(e)})
            # Fallback: return the unvalidated result but log the error
            return result