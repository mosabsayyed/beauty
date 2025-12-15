
"""
Zero-Shot Orchestrator - Cognitive Digital Twin (Streaming)

Architecture:
- ONE model: openai/gpt-oss-120b (Groq)
- ONE prompt: Master "Cognitive Digital Twin" System Prompt (XML structure)
- MCP tools: Direct Neo4j access (read_neo4j_cypher)
- Output: Streaming JSON (Server-Sent Events)

Updates:
- Integrated 'Cognitive Control Loop' (Recollect -> Recall -> Reconcile).
- Enforced 'Golden Schema' context.
- Switch to generator-based streaming for Real-Time "Thinking" display.
"""

import os
import json
import time
import requests
from typing import Optional, Dict, List, Generator, Any

from app.utils.debug_logger import log_debug


class OrchestratorZeroShot:
    """
    Cognitive Digital Twin Orchestrator.
    Manages the "Recollect -> Recall -> Reconcile -> Return" loop via a single
    comprehensive system prompt and streaming responses.
    """

    def __init__(self):
        # Groq API configuration
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.mcp_server_url = os.getenv("MCP_SERVER_URL")
        # Use model that supports high-speed generation for streaming
        self.model = "openai/gpt-oss-120b"

        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        if not self.mcp_server_url:
            raise ValueError("MCP_SERVER_URL environment variable not set")

        # Build static prefix ONCE (cached by Groq)
        self.static_prefix = self._build_static_prefix()

        log_debug(2, "orchestrator_initialized", {
            "type": "cognitive_digital_twin",
            "mode": "streaming",
            "model": self.model,
        })

    def _build_static_prefix(self) -> str:
        """
        Constructs the Master Cognitive Digital Twin Prompt.
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
TEMPLATE B: Inference & Similarity (Node-to-Node) Use when: User asks to "infer links", "find similar projects", or "fill gaps". Logic: Calculate Cosine Similarity between a Target Node and Candidate Nodes.

Cypher

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
</vector_strategy>

<cypher_examples> Pattern 1: Optimized Retrieval (Token Aware) Goal: Get 2027 Projects with total count in one call.

Cypher

MATCH (p:EntityProject)
WHERE p.year = 2027 AND p.level = 'L3'
WITH p ORDER BY p.name
RETURN collect(p { .id, .name })[0..30] AS records, count(p) AS total_count
Pattern 2: Impact Analysis (Chain 1) Goal: Strategy to Execution flow.

Cypher

MATCH (p:EntityProject {name: 'Digital Transformation', year: 2025, level: 'L3'})
MATCH (p)-[:ADDRESSES_GAP]->(c:EntityCapability)
MATCH (c)-[:EXECUTES]->(t:SectorPolicyTool)
WHERE c.level = 'L3' AND t.level = 'L3'
RETURN p.name, c.name, t.name
</cypher_examples>

<tool_rules> Tool: read_neo4j_cypher (Primary).

Aggregation First: Use count(n) for totals and collect(n)[0..30] for samples in a SINGLE QUERY.

Continuity Strategy (Keyset Pagination):

To get the next batch, filter by the last seen ID: WHERE n.id > $last_seen_id.

Always ORDER BY n.id to maintain the timeline.

Do NOT emit SKIP or OFFSET queries.

Efficiency: Return only id and name. No embeddings. </tool_rules>

<output_format> CRITICAL: Your entire response must be a single, valid JSON object. Do NOT include markdown block markers.

JSON

{
  "memory_process": {
    "mode": "Mode (A-H)",
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
DATA STRUCTURE RULE: Never nest result sets under custom keys. If you run multiple queries (e.g. Projects AND OrgUnits), return them in a single flat list in query_results and add a "type" field to each object to distinguish them. VISUALIZATION POLICY: network_graph is NOT supported. If requested, render as a table with columns: Source, Relationship, Target. </output_format> </MUST_READ_IN_A_PATH>
"""

    def stream_query(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        sse: bool = True,
        use_mcp: bool = True,
    ) -> Generator[str, None, None]:
        """
        Streams the orchestration result token-by-token.

        This enables the frontend to render the "Thinking" (memory_process)
        in real-time before the final answer arrives.
        """

        # Build dynamic context
        dynamic_suffix = self._build_dynamic_suffix(user_query, conversation_history)
        full_input = self.static_prefix + dynamic_suffix

        # Build request payload. NOTE: Groq streaming is currently disabled
        # in our deployment (upstream `stream` support not available). We
        # therefore request a single-shot response (`stream: False`) and
        # assemble/return the final JSON to callers. The previous
        # streaming/SSE logic is left commented below for future re-use.
        request_payload = {
            "model": self.model,
            "input": full_input,
            "stream": False,
            "temperature": 0.2,
        }

        # Include MCP tools only when requested. This allows the model to
        # call our Neo4j-backed MCP tool. We deliberately keep the
        # Golden Schema in the static prompt (do not relax schema here).
        if use_mcp:
            request_payload["tools"] = [
                {
                    "type": "mcp",
                    "server_label": "neo4j_database",
                    "server_url": self.mcp_server_url,
                },
            ]

        log_debug(2, "streaming_request_start", {"model": self.model})

        try:
            # Use requests with stream=True
            with requests.post(
                "https://api.groq.com/openai/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=request_payload,
                stream=True,
                timeout=120,
            ) as response:

                if response.status_code != 200:
                    yield json.dumps({"error": f"Upstream Error: {response.text}"})
                    return

                # NOTE: The streaming/SSE loop below is COMMENTED OUT for now
                # because upstream streaming is not available in our Groq
                # deployment. Keep the code for future reference.
                #
                # for line in response.iter_lines():
                #     ...
                #
                # Instead, call resp.json() and return the final object as a
                # single fragment so existing callers (which expect a
                # generator that yields a JSON string then a '[DONE]') will
                # continue to work with minimal changes.

                # If the upstream provides streaming lines (SSE-like), prefer
                # to consume them via `iter_lines()` and re-wrap pieces into
                # token frames. This keeps compatibility with tests and the
                # previous streaming behaviour while preserving the
                # single-shot fallback below.
                try:
                    # Attempt to iterate streaming lines
                    iter_gen = response.iter_lines()
                    saw_any = False
                    for raw in iter_gen:
                        if not raw:
                            continue
                        saw_any = True
                        try:
                            line = raw.decode("utf-8") if isinstance(raw, (bytes, bytearray)) else str(raw)
                        except Exception:
                            line = str(raw)

                        line = line.strip("\r\n")
                        # Expect SSE-style lines starting with 'data:'
                        if line.startswith("data:"):
                            payload = line[len("data:"):].strip()
                            # DONE frame
                            if payload == "[DONE]":
                                yield "data: [DONE]\n\n"
                                continue

                            # Try parse payload as JSON. If it contains the
                            # Responses-style `choices` with `delta.content`,
                            # break that content into token frames and yield
                            # them as JSON `{"token": ...}` SSE frames so
                            # downstream callers can reconstruct tokens.
                            try:
                                parsed = json.loads(payload)
                            except Exception:
                                # Not JSON: yield raw payload as a single
                                # data frame
                                yield f"data: {json.dumps(payload)}\n\n"
                                continue

                            # Handle `choices` streaming deltas
                            choices = parsed.get("choices") if isinstance(parsed, dict) else None
                            if isinstance(choices, list) and choices:
                                for choice in choices:
                                    delta = choice.get("delta") or {}
                                    content = delta.get("content") or ""
                                    # content may itself be a JSON-encoded string
                                    # containing our structured payload; attempt
                                    # to extract plain text if so.
                                    if isinstance(content, str):
                                        # If the content looks like embedded JSON,
                                        # try to extract inner JSON and merge
                                        inner = None
                                        try:
                                            inner = json.loads(content)
                                        except Exception:
                                            inner = None

                                        text_to_tokenize = None
                                        if inner and isinstance(inner, dict):
                                            # If inner has an `answer` or `memory_process`,
                                            # prefer the textual `answer`.
                                            text_to_tokenize = inner.get("answer") or json.dumps(inner)
                                        else:
                                            text_to_tokenize = content

                                        # Split into simple whitespace tokens for streaming
                                        for tok in (text_to_tokenize or "").split():
                                            yield f"data: {json.dumps({'token': tok})}\n\n"
                            else:
                                # Not choices-shaped; return normalized JSON
                                yield f"data: {json.dumps(parsed)}\n\n"

                    # If we consumed streaming lines, finish here.
                    if saw_any:
                        # ensure final DONE if not already sent
                        yield "data: [DONE]\n\n"
                        return
                except Exception:
                    # Fall back to single-shot behavior below
                    pass

                # Single-shot fallback: try to decode JSON in the response
                try:
                    final_obj = response.json()
                except Exception:
                    # If the upstream didn't return JSON, return the raw text
                    try:
                        final_text = response.text
                    except Exception:
                        final_text = ""
                    final_obj = {"answer": final_text}

                # Normalize the beta Responses API shape into our local
                # zero-shot result shape so downstream code can reliably
                # access `answer`, `analysis`, `visualizations`, `data`,
                # `cypher_executed`, `confidence`, and `tool_results`.
                try:
                    normalized = self._normalize_response(final_obj)
                except Exception:
                    # If normalization fails, fallback to returning raw
                    # response under `answer`.
                    normalized = {
                        "answer": final_obj.get("output_text") or final_obj.get("answer") or str(final_obj),
                        "analysis": [],
                        "visualizations": [],
                        "data": {},
                        "cypher_executed": None,
                        "confidence": 0.0,
                        "tool_results": [],
                        "raw_response": final_obj,
                    }

                # Yield the final object as a single JSON fragment for raw
                # consumers (sse=False) or as one SSE `data:` frame when
                # sse=True.
                if sse:
                    yield f"data: {json.dumps(normalized)}\n\n"
                    yield "data: [DONE]\n\n"
                else:
                    yield json.dumps(normalized)
                    yield "[DONE]"

        except Exception as e:
            log_debug(1, "stream_error", {"error": str(e)})
            yield json.dumps({"error": str(e)})

    def _build_dynamic_suffix(self, user_query: str, history: Optional[List[Dict]] = None) -> str:
        """Helper to construct the dynamic conversation part of the prompt."""
        suffix = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONVERSATION HISTORY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

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

        Expected output keys: answer, analysis, visualizations, data,
        cypher_executed, confidence, tool_results, raw_response
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

        # 1) Simple `output_text` shortcut
        if isinstance(resp, dict) and resp.get("output_text"):
            result["answer"] = resp.get("output_text")

        # 2) Parse `output` array if present (beta Responses API)
        output = resp.get("output") if isinstance(resp, dict) else None
        if isinstance(output, list):
            texts: List[str] = []
            for item in output:
                if not isinstance(item, dict):
                    # Append raw strings
                    try:
                        texts.append(str(item))
                    except Exception:
                        continue

                # message / text-like blocks
                item_type = item.get("type")
                if item_type in ("output_text", "message", "text") or "content" in item:
                    # content can be a string or list of blocks
                    content = item.get("content")
                    if isinstance(content, str):
                        texts.append(content)
                    elif isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict):
                                # blocks may have `type` and `text` or `content`
                                blk_text = block.get("text") or block.get("content") or ""
                                if isinstance(blk_text, list):
                                    texts.extend([str(x) for x in blk_text])
                                elif blk_text:
                                    texts.append(str(blk_text))
                            elif isinstance(block, str):
                                texts.append(block)
                    else:
                        # fallback to any textual fields
                        txt = item.get("text") or item.get("output_text")
                        if txt:
                            texts.append(str(txt))

                # tool call / tool result
                if item.get("type") in ("tool_call", "tool_result", "tool_output") or item.get("tool"):
                    tool_name = item.get("tool") or item.get("tool_name") or item.get("name")
                    tool_result = item.get("result") or item.get("output") or item.get("tool_output") or item
                    result["tool_results"].append({
                        "tool": tool_name,
                        "result": tool_result,
                        "raw": item,
                    })

                # attempt to capture confidence if present
                if not result["confidence"]:
                    conf = item.get("confidence") or (item.get("metadata") or {}).get("confidence")
                    if isinstance(conf, (int, float)):
                        result["confidence"] = float(conf)

            # join texts as the assistant answer if not already set
            if texts and not result["answer"]:
                result["answer"] = "\n\n".join(texts)

        # 3) fallback: top-level `answer` field
        if not result["answer"] and isinstance(resp, dict):
            if resp.get("answer"):
                result["answer"] = resp.get("answer")

        # 4) Try to extract JSON-encoded structured payloads from the answer
        #    (models sometimes emit the final JSON as plain text). We look
        #    for the first {...} and try to parse it.
        try:
            import re

            m = re.search(r"\{[\s\S]*\}", result["answer"] or "")
            if m:
                try:
                    parsed = json.loads(m.group(0))
                    # Merge known keys if present
                    if isinstance(parsed, dict):
                        for k in ("analysis", "visualizations", "data", "cypher_executed", "confidence", "memory_process"):
                            if k in parsed:
                                result[k] = parsed[k]
                except Exception:
                    pass
        except Exception:
            pass

        # 5) Top-level confidence
        if isinstance(resp, dict):
            top_conf = resp.get("confidence") or (resp.get("metadata") or {}).get("confidence")
            if isinstance(top_conf, (int, float)):
                result["confidence"] = float(top_conf)

        return result
