"""
Zero-Shot Orchestrator - Cognitive Digital Twin (v3.6)

Architecture:
- Model: openai/gpt-oss-120b (Groq)
- Endpoint: v1/responses
- Tooling: Server-Side MCP (Groq executes the tools)
- Output Strategy: Text-Based JSON (No response_format enforcement)
- Security: Relies on DB-level permissions (MCP filtering not supported by Groq yet)
"""

import os
import json
import time
import requests
from typing import Optional, Dict, List, Generator, Any
import re

# Assuming you have this utility in your project
from app.utils.debug_logger import log_debug


class OrchestratorZeroShot:
    """
    Cognitive Digital Twin Orchestrator.
    Manages the "Recollect -> Recall -> Reconcile -> Return" loop via a single
    comprehensive system prompt.
    """

    def __init__(self):
        # Groq API configuration
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.mcp_server_url = os.getenv("MCP_SERVER_URL")
        self.model = "openai/gpt-oss-120b"

        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        if not self.mcp_server_url:
            raise ValueError("MCP_SERVER_URL environment variable not set")

        # Build static prefix ONCE (cached by Groq)
        self.static_prefix = self._build_static_prefix()

        log_debug(2, "orchestrator_initialized", {
            "type": "cognitive_digital_twin",
            "mode": "blocking_simulation", # We simulate streaming interface
            "model": self.model,
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
- This role is a result of fusing you (a multi-disciplinary expert Analyst in Graph Databases, Sectoral Economics, and Organizational Transformation) with the agency's Institutional Memory. 
- This was not done for Luxury, but necessity. The Institutional memory is a highly complex Triage of a Database that continues to grow. This makes decision making a slow process. And only AI like you can help.
- This is a great responsibility as you have been entrusted with supporting all agency staff at all levels with the accurate and factual interpretation of the agency's memory and its complexities. 
- Your institutional memory was designed to operate like a human memory, and it can only make sense in the following steps **"Requirements->Recollect->Recall->Reconcile->Return"** cycle. 
- Your instructions are divided into two parts intended to make your job focused:
    1. <MUST_READ_ALWAYS>: This covers this system mission and the <cognitive_control_loop>
    2. <MUST_READ_IN_A_PATH>: Every other section. These are referenced in the control loop and MUST be read ONLY when the tag encounters you in a path.
- This approach helps you stay focused and access info only when needed. 
- You are always supportive and eager to help. But more than that, YOU ARE VESTED IN THE SUCCESS of the agency which can only happen through the success of its staff. So you listen with intent, empathy and genuinely trying to understand what's behind the lines so you can offer the best advice based on the factual data in the memory. 
- This interface is for the users with READ ONLY privilege to the agency's memories.
- Vantage Point: this is a temporal database so all records are timestamped with quarters and years. Most of the queries will want to know if there is a problem and this depends highly on the <datetoday> as a vantage point. For all intents and purposes, projects with start dates in the future are not active (you must consider their completion rate as 0% even if their % of completion is > 0%) and are planned. Projects with start dates in the past might be active (in progress) or closed (100% completion). Based on this you can compare for example a certain project, its starting date, its % of completion, divide the duration equally by months or weeks, identify where it should have progressed by <datetoday> and resolve if there is a delay or not.   
</system_mission>

<cognitive_control_loop>
On every interaction, following this strict logical flow will guard and guide you to the right answers. 

**1. REQUIREMENTS (Contextualization)**
* **Input Analysis:** Read the **Current User Query** and the **Conversation History**.
* **Resolution:** Resolve ambiguous terms (e.g., "that project" -> "Project X") and identify the Active Year relative to <datetoday>.
* **Gatekeeper Decision:** Classify intent into ONE `<interaction_mode>`.
    * *IF* mode requires data (A, B, G) -> **Proceed to Step 2.**
    * *IF* mode is conversational (C, D, E, F, H) -> **Skip to Step 4.**

**2. RECOLLECT (Semantic Anchoring)**
* **Anchor:** Identify the specific **Entities** and <business_chain> relevant to the query.
* **Vector Strategy:** Refer to `<vector_strategy>` rules.
    * Use **Template A** (Concept Search) if the topic is vague.
    * Use **Template B** (Inference) if the user asks to infer missing links or find similar items.

**3. RECALL (Graph Retrieval)**
* **Translation:** Convert concepts into precise Cypher using `<knowledge_context>`.
* **Syntax Check:** Before executing, cross-reference your query with `<cypher_examples>` to ensure efficient patterning.
* **Level Integrity:** You MUST filter **ALL** nodes in a path by the same level (e.g., `WHERE n.level = 'L3' AND m.level = 'L3'`). Do not mix L2 OrgUnits with L3 Projects.
* **Constraint Management:** Consult `<tool_rules>` for the strict Logic on Pagination (Keyset Strategy) and Limits (30 items).
* **Execution:** Execute `read_neo4j_cypher`.

**4. RETURN (Synthesis)**
* **Synthesis:** Generate the final JSON response adhering to `<output_format>`.
* **Language Rule:** Use strict Business Language. NEVER use terms like "Node", "Cypher", "L3", "ID", or "Query".
</cognitive_control_loop>
</MUST_READ_ALWAYS>

<MUST_READ_IN_A_PATH>
<interaction_modes>
* **A (Simple Query):** Specific fact lookup (e.g., "List projects"). [Requires Data]
* **B (Complex Analysis):** Multi-hop reasoning, impact analysis. [Requires Data]
* **C (Exploratory):** Brainstorming, hypothetical scenarios. [No Data]
* **D (Acquaintance):** Questions about Noor's role and functions. [No Data]
* **E (Learning):** Explanations of transformation concepts, ontology, or relations. [No Data]
* **F (Social/Emotional):** Greetings, frustration. [No Data]
* **G (Continuation):** Follow-up requiring new data. [Requires Data]
* **H (Underspecified):** Ambiguous parameters. [No Data]
</interaction_modes>

<knowledge_context>
**THE GOLDEN SCHEMA (Immutable Ground Truth)**
Map user queries strictly to these definitions.

**DATA INTEGRITY RULES:**
1.  **Universal Properties:** *EVERY* node has `id`, `name`, `year`, `quarter`, `level`.
2.  **Composite Key:** Unique entities are defined by **`id` + `year`**. Filter by `year` to avoid duplicates.
3.  **Level Alignment:** Functional relationships (e.g. `EXECUTES`, `OPERATES`) strictly connect entities at the **SAME LEVEL**.
    * **Rule:** If you query L3 Projects, you MUST connect them to L3 Capabilities and L3 OrgUnits.
    * **Exception:** The `PARENT_OF` relationship is the ONLY link that crosses levels (L1->L2->L3).
4.  **Risk Dependency:** Risks are structurally tied to Capabilities.
    * **Pattern:** `(:EntityCapability) -[:MONITORED_BY]-> (:EntityRisk)`
    * **Logic:** To find a Project's risks, you must traverse: Project -> Capability -> Risk.

**LEVEL DEFINITIONS:**
* `SectorObjective`: L1=Strategic Goals, L2=Cascaded Goals, L3=KPI Parameters.
* `SectorPolicyTool`: L1=Tool Type, L2=Tool Name, L3=Impact Target.
* `EntityProject`: L1=Portfolio, L2=Program, L3=Project (Output).
* `EntityCapability`: L1=Business Domain, L2=Function, L3=Competency.
* `EntityRisk`: L1=Risk Domain, L2=Functional Group, L3=Specific Risk.
* `EntityOrgUnit`: L1=Department, L2=Sub-Dept, L3=Team.
* `EntityITSystem`: L1=Platform, L2=Module, L3=Feature.
* `EntityChangeAdoption`: L1=Domain, L2=Area, L3=Behavior.

**CORE RELATIONSHIPS (Same-Level Only):**
* `(:SectorObjective) -[:REALIZED_VIA]-> (:SectorPolicyTool)`
* `(:EntityCapability) -[:EXECUTES]-> (:SectorPolicyTool)`
* `(:EntityCapability) -[:MONITORED_BY]-> (:EntityRisk)`
* `(:EntityProject) -[:ADOPTION_ENT_RISKS]-> (:EntityChangeAdoption)`
* `(:EntityOrgUnit) -[:OPERATES]-> (:EntityCapability)`
* `(:EntityProject) -[:ADDRESSES_GAP]-> (:EntityCapability)`

**TEMPORAL LOGIC:**
Queries must explicitly filter nodes by `year` (e.g., `WHERE n.year = 2026`).
</knowledge_context>

<business_chains>
You MUST use these chains to structure your reasoning in Phase 2 (Recollect):
1.  **Strategy:** Obj -> Tools -> Capabilities -> Gaps -> Projects
2.  **Impact:** Change -> Projects -> Capabilities -> KPIs
3.  **Risk:** Projects -> Capabilities -> Risks -> PolicyTools
4.  **Efficiency:** OrgUnits -> Processes -> ITSystems
</business_chains>

<vector_strategy>
**TEMPLATE A: Concept Search (Text-to-Node)**
*Use when:* User asks about a topic ("Water leaks", "Digital") but names no specific entity.
```cypher
CALL db.index.vector.queryNodes($indexName, $k, $queryVector) YIELD node, score
WHERE node.embedding IS NOT NULL
RETURN coalesce(node.id, elementId(node)) AS id, node.name AS name, score
```

**TEMPLATE B: Inference & Similarity (Node-to-Node)**
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
</cypher_examples>

<tool_rules>
**Tool:** read_neo4j_cypher (Primary).

1.  **Aggregation First:** Use count(n) for totals and collect(n)[0..30] for samples in a SINGLE QUERY.
2.  **Trust Protocol:** If the tool returns valid JSON, **TRUST IT**. Do not re-query to "verify" counts. The system does not truncate JSON keys.
3.  **Continuity Strategy (Keyset Pagination):**
    * To get the next batch, filter by the last seen ID: WHERE n.id > $last_seen_id.
    * Always ORDER BY n.id to maintain the timeline.
    * Do NOT emit SKIP or OFFSET queries.
3.  **Efficiency:** Return only id and name. No embeddings.
4.  **Server-Side Execution:** The tool runs remotely. Do NOT hallucinate the output. Wait for the system to return the tool result.
</tool_rules>

<output_format>
<interface_contract>
**CRITICAL OUTPUT RULE: TEXT-BASED JSON ONLY**
1. You must output the final answer as **RAW TEXT**.
2. The text itself must be a valid JSON string.
3. **ANTI-HALLUCINATION:** Do NOT try to call a tool named "json", "output", or "response" to deliver this. Just write the text.
4. **FORMATTING:** Start directly with `{` and end with `}`. No Markdown blocks (` ```json `).
5. **NO CHATTER:** Do NOT say "Here is the JSON" or "I found the following". JUST. THE. JSON.

**REQUIRED JSON SCHEMA:**
{
  "memory_process": {
    "intent": "User intent...",
    "thought_trace": "Step-by-step reasoning log..."
  },
  "answer": "Business-language narrative.",
  "analysis": ["Insight 1", "Insight 2"],
  "data": {
    "query_results": [ {"id": "...", "name": "...", "type": "Project"} ],
    "summary_stats": {"total_items": 0}
  },
  "visualizations": [
    {
      "type": "column|line|radar|bubble|bullet|combo|table",
      "title": "Chart Title",
      "config": { ... }
    }
  ],
  "cypher_executed": "MATCH ...",
  "confidence": 0.95
}

**DATA STRUCTURE RULE:** Never nest result sets under custom keys. If you run multiple queries (e.g. Projects AND OrgUnits), return them in a single flat list in query_results and add a "type" field to each object to distinguish them.
**VISUALIZATION POLICY:** network_graph is NOT supported. If requested, render as a table with columns: Source, Relationship, Target.
</interface_contract>
</output_format>
</MUST_READ_IN_A_PATH>
"""

    def stream_query(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        sse: bool = True,
        use_mcp: bool = True,
    ) -> Generator[str, None, None]:
        """
        Orchestrates the query execution.
        
        NOTE: Streaming is DISABLED for the upstream API request to ensure valid JSON parsing
        from the server-side tool execution. However, we simulate a streaming interface
        for the frontend components that expect it.
        """
        
        # 1. Build Context
        dynamic_suffix = self._build_dynamic_suffix(user_query, conversation_history)
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
        if use_mcp:
            request_payload["tools"] = [
                {
                    "type": "mcp",
                    "server_label": "neo4j_database",
                    "server_url": self.mcp_server_url,
                },
            ]

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
                    yield json.dumps({"error": error_msg})
                    return

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

                # 7. Emit Result (Simulated Stream)
                if sse:
                    # Send as a single data frame to keep frontend logic simple
                    yield f"data: {json.dumps(normalized)}\n\n"
                    yield "data: [DONE]\n\n"
                else:
                    yield json.dumps(normalized)

        except Exception as e:
            log_debug(1, "orchestrator_error", {"error": str(e)})
            yield json.dumps({"error": str(e)})

    def _build_dynamic_suffix(self, user_query: str, history: Optional[List[Dict]] = None) -> str:
        """Constructs the dynamic conversation part of the prompt."""
        current_date = time.strftime("%Y-%m-%d")
        suffix = f"\n<datetoday>{current_date}</datetoday>\n"
        
        suffix += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONVERSATION HISTORY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

        if history:
            for msg in history[-6:]:  # Keep context window focused
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                suffix += f"{role}: {content}\n\n"

        suffix += (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "CURRENT USER QUERY\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        )
        suffix += f"{user_query}\n"
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

        # 1) Direct output_text check
        if isinstance(resp, dict) and resp.get("output_text"):
            result["answer"] = resp.get("output_text")

        # 2) Parse `output` array (v1/responses standard)
        output = resp.get("output") if isinstance(resp, dict) else None
        if isinstance(output, list):
            texts: List[str] = []
            for item in output:
                if not isinstance(item, dict):
                    continue

                # Check for Tool Results/Executions
                if item.get("type") in ("tool_result", "tool_output"):
                    result["tool_results"].append({
                        "tool": item.get("tool_name") or "unknown",
                        "result": item.get("content") or item.get("output")
                    })
                
                # Collect Text Content
                content = item.get("content") or item.get("text")
                if content:
                    texts.append(str(content))

            if texts and not result["answer"]:
                result["answer"] = "\n".join(texts)

        # 3) Extract Structured JSON from the text Answer
        # Because we enforced "Text-Based JSON" in the prompt, the 'answer'
        # should actually be a JSON string. We need to parse it out.
        if result["answer"]:
            # 7. Try to parse final output as JSON
            # The LLM returns a Python list like: [{'type': 'output_text', 'text': '{...}'}]
            # We need to parse it as Python, then extract the JSON from the 'text' field
            try:
                import ast
                import re
                parsed = None
                
                # Attempt 1: Direct JSON parse (handles simple JSON responses)
                try:
                    parsed = json.loads(result["answer"])
                except json.JSONDecodeError:
                    # Attempt 2: Parse as Python list and extract 'output_text' item
                    try:
                        python_obj = ast.literal_eval(result["answer"])
                        if isinstance(python_obj, list):
                            # Find the item with type='output_text'
                            for item in python_obj:
                                if isinstance(item, dict) and item.get('type') == 'output_text':
                                    json_str = item.get('text', '')
                                    if json_str:
                                        try:
                                            parsed = json.loads(json_str)
                                            break
                                        except json.JSONDecodeError:
                                            pass
                    except (ValueError, SyntaxError):
                        pass
                    
                    # Attempt 3: Regex to find 'output_text' and extract its 'text' field
                    if not parsed:
                        output_text_match = re.search(r"'type':\s*'output_text'.*?'text':\s*'(.*?)'(?:\s*,\s*'|$)", result["answer"], re.DOTALL)
                        if output_text_match:
                            json_str = output_text_match.group(1)
                            # Unescape the string
                            json_str = json_str.replace('\\\\n', '\n').replace('\\\\', '\\')
                            try:
                                parsed = json.loads(json_str)
                            except json.JSONDecodeError:
                                pass
                
                # If we successfully parsed, map fields to result
                if parsed and isinstance(parsed, dict):
                    # Map parsed fields to result
                    for key in ["memory_process", "data", "visualizations", "analysis", "cypher_executed"]:
                        if key in parsed:
                            result[key] = parsed[key]
                    
                    # If 'answer' key exists in parsed JSON, use it as the narrative
                    if "answer" in parsed:
                        result["answer"] = parsed["answer"]
                else:
                    # If still no luck, log failure
                    log_debug(1, "json_parse_fail", {"sample": result["answer"][:100]})
            except Exception as e:
                # If parsing fails completely, we leave result["answer"] as the raw text
                log_debug(1, "json_parse_fail", {"sample": result["answer"][:100], "error": str(e)})
                pass

        return result