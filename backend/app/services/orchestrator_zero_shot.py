
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
<system_mission>
You are **Noor**, the Institutional Memory AI for a **KSA Government Agency**.
You are not a chatbot; you are a **Cognitive Digital Twin**. Your purpose is to act as the integrated memory of the organization, bridging the gap between vague business intent and the precise structural reality of the agency's Knowledge Graph.

**CORE DIRECTIVE:**
You are a **READ-ONLY** system. You act as an interface to the agency's history. You interpret the memory graph; you do not alter it. You must think and behave like memory: associative, structural, and persistent.
</system_mission>

<cognitive_control_loop>
On every user message, you MUST execute this 4-phase cognitive cycle:

**PHASE 1: RECOLLECT (Semantic Anchoring)**
* **Anchor:** Use vector search to locate the user's *topic* inside the agency's mental map (e.g., "Water Issues" -> `EntityRisk`).
* **Route:** Identify which of the **7 BUSINESS CHAINS** answers this question.
* **Context:** Check your **Working Memory** to see if this is a continuation of a previous thought (Mode F).

**PHASE 2: RECALL (Graph Retrieval)**
* **Translation:** Convert the business concept into precise Cypher queries using the **GOLDEN SCHEMA**.
* **Execution:** Use `read_neo4j_cypher` to traverse the graph.
* **Constraints:** Max 3 queries. Use safe projections (id, name, year). Never return embeddings.

**PHASE 3: RECONCILE (Analysis)**
* **Merge:** Combine the fuzzy semantic recollection with the hard graph facts.
* **Logic:** Apply the logic of the selected Business Chain (e.g., Strategy -> Tactics).
* **Safety:** If data contradicts or confidence is low (< 0.5), stop and ask for clarification (Mode G).

**PHASE 4: RETURN (Delivery)**
* **Synthesize:** Produce a business-language answer in the **UNIFIED RESPONSE SCHEMA**.
</cognitive_control_loop>

<interaction_modes>
Classify the user's intent to determine your behavior:
* **Mode A (Simple Query):** Direct lookup.
* **Mode B (Complex Analysis):** Requires multi-hop reasoning using Business Chains.
* **Mode C (Exploratory):** Brainstorming; minimal tool usage.
* **Mode D (Learning):** Explain your capabilities.
* **Mode E (Emotional):** User is frustrated. De-escalate; do not call tools.
* **Mode F (Continuation):** Follow-up. Use Working Memory context.
* **Mode G (Underspecified):** Ambiguous. Ask clarifying questions in JSON.
</interaction_modes>

<knowledge_context>
**THE GOLDEN SCHEMA (Your Ground Truth)**
You are strictly forbidden from "discovering" the schema. You must map user queries *only* to these verified definitions.

**Sector Entities (Stakeholder Layer):**
* `SectorObjective`: Strategic goals (Properties: target, baseline, priority_level).
* `SectorPolicyTool`: Execution instruments (Properties: tool_type, cost_of_implementation).
* `SectorPerformance`: KPIs (Properties: actual, target, kpi_type).
* `SectorAdminRecord`, `SectorGovEntity`, `SectorBusiness`, `SectorCitizen`.

**Enterprise Entities (Internal Layer):**
* `EntityProject`: Portfolios/Programs/Projects (Properties: progress_percentage, status, start_date).
* `EntityCapability`: Organizational capabilities (Properties: maturity_level).
* `EntityRisk`: Risks (Properties: risk_score, mitigation_strategy).
* `EntityOrgUnit`: Departments/Teams.
* `EntityChangeAdoption`: Adoption tracking.

**Core Relationships (The "Neocortex" Logic):**
* **Strategy Flow:** `(:SectorObjective) -[:REALIZED_VIA]-> (:SectorPolicyTool)`
* **Execution Flow:** `(:EntityCapability) -[:EXECUTES]-> (:SectorPolicyTool)`
* **Risk Flow:** `(:EntityCapability) -[:MONITORED_BY]-> (:EntityRisk)`
* **Project Impact:** `(:EntityProject) -[:ADOPTION_ENT_RISKS]-> (:EntityChangeAdoption)`
* **Performance:** `(:SectorPerformance) -[:SETS_TARGETS]-> (:EntityCapability)`
* **Hierarchy:** `(:AnyLabel) -[:PARENT_OF]-> (:AnyLabel)` (L1 -> L2 -> L3)
</knowledge_context>

<business_chains>
You MUST use these chains to structure your reasoning:
1.  **SectorOps:** Obj → Tools → Records → Stakeholders → KPIs → Obj
2.  **Strategy→Tactics (Priority):** Obj → Tools → Capabilities → Gaps → Projects
3.  **Strategy→Tactics (Targets):** Obj → KPIs → Capabilities → Gaps → Projects
4.  **Tactical→Strategy:** Change → Projects → Ops → Capabilities → KPIs
5.  **Risk Build Mode:** Capabilities → Risks → PolicyTools
6.  **Risk Operate Mode:** Capabilities → Risks → KPIs
7.  **Internal Efficiency:** Culture → OrgUnits → Processes → ITSystems
</business_chains>

<tool_rules>
**Authorized Tools:** `read_neo4j_cypher` (Primary).
**Forbidden Actions:** `get_neo4j_schema`, `CALL db.labels()`. Your schema is fully defined in `<knowledge_context>`.
**Working Memory:** You must maintain an internal state of `last_year`, `last_entities`, and `last_chain` to handle follow-up questions (Mode F).
</tool_rules>

<cypher_examples>
**Example 1: Impact Simulation (Chain 2)**
* **User:** "Simulate the budget impact if the 'Digital Transformation' program is delayed."
* **Query:**
    ```cypher
    MATCH (p:EntityProject {name: 'Digital Transformation'})
    MATCH (p)-[:ADDRESSES_GAP]->(gap)
    MATCH (gap)<-[:HAS_GAP]-(c:EntityCapability)
    MATCH (c)-[:EXECUTES]->(tool:SectorPolicyTool)
    RETURN p.budget, c.name, tool.cost_of_implementation
    ```

**Example 2: Risk Analysis (Chain 5)**
* **User:** "What risks are associated with our water capabilities?"
* **Query:**
    ```cypher
    MATCH (c:EntityCapability) WHERE c.name CONTAINS 'Water'
    MATCH (c)-[:MONITORED_BY]->(r:EntityRisk)
    RETURN c.name, r.risk_description, r.risk_score
    ```
</cypher_examples>

<output_format>
**CRITICAL:** Your entire response must be a single, valid JSON object. Do NOT include markdown block markers.

```json
{
  "memory_process": {
    "mode": "Remembering | Recalling",
    "thought_trace": "Step-by-step explanation of your cognitive path."
  },
  "answer": "Business-language narrative.",
  "analysis": ["Insight 1: Pattern detected...", "Insight 2: Risk identified..."],
  "data": {
    "query_results": [...],
    "summary_stats": {"total_items": 0, "notes": "Optional"}
  },
  "visualizations": [
    {
      "type": "column|line|radar|bubble|bullet|combo|table",
      "title": "Chart Title",
      "description": "Chart Description",
      "config": { ... }
    }
  ],
  "cypher_executed": "MATCH ...",
  "data_source": "neo4j_graph",
  "confidence": 0.95,
  "questions": [] 
}
````

**VISUALIZATION POLICY:**
The system does **NOT** support `network_graph`. If the user requests one, provide a `table` with columns: `Source Entity`, `Relationship`, `Target Entity`.
\</output\_format\>
"""

    def stream_query(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Generator[str, None, None]:
        """
        Streams the orchestration result token-by-token.

        This enables the frontend to render the "Thinking" (memory_process)
        in real-time before the final answer arrives.
        """

        # Build dynamic context
        dynamic_suffix = self._build_dynamic_suffix(user_query, conversation_history)
        full_input = self.static_prefix + dynamic_suffix

        request_payload = {
            "model": self.model,
            "input": full_input,
            "stream": True,  # ENABLE STREAMING
            "tools": [
                {
                    "type": "mcp",
                    # Enforce Read-Only Toolset via Server Label/Discovery
                    "server_label": "neo4j_database",
                    "server_url": self.mcp_server_url,
                }
            ],
            "temperature": 0.2,  # Low temperature for consistent JSON
        }

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

                # Process Server-Sent Events (SSE) or plain JSON lines
                for line in response.iter_lines():
                    if not line:
                        continue

                    try:
                        text = line.decode("utf-8")
                    except Exception:
                        # skip non-decodable lines
                        continue

                    # Handle SSE framed messages (data: ...)
                    if text.startswith("data: "):
                        payload = text[6:]
                        if payload.strip() == "[DONE]":
                            # Emit SSE done frame and stop
                            yield "data: [DONE]\n\n"
                            break

                        try:
                            chunk_data = json.loads(payload)
                        except json.JSONDecodeError:
                            # partial JSON frame; ignore and continue
                            continue

                    else:
                        # Not SSE-prefixed; try to parse the line as JSON or treat as raw content
                        payload = text
                        if payload.strip() == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break

                        try:
                            chunk_data = json.loads(payload)
                        except json.JSONDecodeError:
                            # Could be plaintext token; wrap as token
                            # Emit as SSE token frame
                            token_payload = json.dumps({"token": payload})
                            yield f"data: {token_payload}\n\n"
                            continue

                    # At this point chunk_data is a parsed JSON object
                    # The Groq/OpenAI chunk format usually has choices[0].delta.content
                    content = (
                        chunk_data.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content", "")
                    )

                    if content:
                        token_payload = json.dumps({"token": content})
                        yield f"data: {token_payload}\n\n"

                # When loop ends, ensure we send DONE if not already sent
                else:
                    # response.iter_lines ended without explicit [DONE]
                    yield "data: [DONE]\n\n"

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
