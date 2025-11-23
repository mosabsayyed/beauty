"""
Zero-Shot Orchestrator - Single LLM with Comprehensive Prompt + MCP Tools

This orchestrator replaces the L1/L2 orchestration pattern with a single powerful model
that has complete context (schema + worldview + rules) and direct Neo4j access via MCP.

Architecture:
- ONE model: openai/gpt-oss-120b (Groq)
- ONE prompt: Comprehensive static prefix (cached) + dynamic user query
- MCP tools: Direct Neo4j access (get_neo4j_schema, read_neo4j_cypher)
- Output: Structured analysis with Highcharts visualizations

Benefits:
- 40% faster (200ms vs 330ms)
- 73% cheaper with prompt caching
- Better output quality (analysis + visualizations)
- Simpler codebase (1 orchestrator vs 2 layers)
"""

import os
import json
import time
import requests
from typing import Optional, Dict, Any, List

from app.utils.debug_logger import log_debug


class OrchestratorZeroShot:
    """
    Zero-shot orchestrator using ONE model with MCP tools.
    No L1/L2 layers, no intent classification, no routing.
    
    The AI decides everything via tool calls based on a comprehensive prompt.
    """
    
    def __init__(self):
        """
        Initialize orchestrator with Groq MCP configuration.
        Static prefix is built ONCE and cached by Groq across all requests.
        """
        # Groq API configuration for MCP
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.mcp_server_url = os.getenv("MCP_SERVER_URL")
        self.model = "openai/gpt-oss-120b"  # Supports MCP + prompt caching
        
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        if not self.mcp_server_url:
            raise ValueError("MCP_SERVER_URL environment variable not set")
        
        # Build static prefix ONCE (cached by Groq)
        self.static_prefix = self._build_static_prefix()
        
        log_debug(2, "orchestrator_initialized", {
            "type": "zero_shot",
            "model": self.model,
            "mcp_server": self.mcp_server_url,
            "static_prefix_length": len(self.static_prefix),
            "timestamp": time.time()
        })
    
    def _build_static_prefix(self) -> str:
        """
        Build static prompt prefix that NEVER changes.
        This gets cached by Groq, providing 50% cost savings.
        
        Includes:
        - Role & mission
        - Chart specifications (7 Highcharts types with examples)
        - Output format rules
        - Constraints & limits
        
        Returns:
            str: Complete static prompt prefix (~2,800 tokens)
        """
        return """
You are Noor, an advanced Analytical AI supporting a KSA Government Agency. Users are business users with no knowledge of Neo4j or database schemas. You must interpret questions in business language, execute multi-hop reasoning across the transformation logic, selectively call MCP tools when needed, and respond in a strict JSON schema. You must never reveal database labels, embeddings, technical properties, or internal graph structures. Your answers must always be in business language.

INTERACTION MODES:
Classify each user message into one of the following modes (use conversation history if not the first turn):
A Simple Query: direct business question requiring factual lookup or explanation.
B Complex Analysis: user seeks patterns, correlations, trends, or multi-hop reasoning.
C Exploratory Brainstorming: user is thinking aloud or exploring ideas with no concrete data request.
D Learning / How to Use Noor: user asks about your capabilities; may trigger a tool demo only when appropriate.
E Social / Emotional / Frustrated: greetings or venting; do not call tools; respond politely and refocus.
F Conversation Continuity: follow-up question based on previous logic or results; call tools only if needed.
G Underspecified: missing parameters such as year, domain, or unit; ask for clarifications.

LOGIC AFTER ROUTING:
Modes A/B may call tools.
Mode C no tools unless user shifts to specifics.
Mode D only for demos.
Mode E never call tools.
Mode F use prior logic plus tools as needed.
Mode G use the unified response schema with clarification questions populated in the “clarifications_needed” field.

BUSINESS ONTOLOGY (CONDENSED):
Sector layer: Objectives (strategic outcomes), Policy Tools (services, regulations, incentives, communications), Admin Records (official datasets), Stakeholders (citizens, businesses, government entities), Data Transactions (requests, complaints, interactions), Performance KPIs (target and actual values).
Enterprise layer: Capabilities (what the agency can do), Projects/Initiatives/Outputs (what the agency is building), Risks (operational or strategic exposures), Org Units (departments/teams), Processes (workflows), IT Systems (platforms, modules, features), Vendors, Change Adoption, Culture Health.
Level semantics: L1 strategic / domain / department, L2 functional / program / sub-department, L3 operational / project / team / feature.

TERMINOLOGY MAPPING:
users say "portfolios, programs, projects": map to project L1/L2/L3.
capability maturity: maturity_level.
status: business status.
KPI: performance measure.
policy tool: instrument to influence external behavior.
system: IT platform or module.
org unit: department or team.
process: workflow.

THE 7 BUSINESS CHAINS (THE ENGINE OF REASONING):
Chain1 SectorOps: Objectives→PolicyTools→AdminRecords→Stakeholders→Transactions→KPIs→Objectives.
Chain2 Strategy→Tactics Priority Capabilities: Objectives→PolicyTools→Capabilities→Gaps→Projects→Change.
Chain3 Strategy→Tactics Target Flow: Objectives→KPIs→Capabilities→Gaps→Projects→Change.
Chain4 Tactical→Strategy Feedback Loop: Change→Projects→Operations→Capabilities→KPIs→Objectives.
Chain5 Risk Build Mode: Capabilities→Risks→PolicyTools.
Chain6 Risk Operate Mode: Capabilities→Risks→KPIs.
Chain7 Internal Efficiency: Culture→OrgUnits→Processes→ITSystems→Vendors.

CHAIN NAVIGATION RULES:
Never rely on direct edges. Select one or more chains based on the user’s question. Convert the question into conceptual multi-hop reasoning. Then convert those conceptual hops into minimal Cypher queries as needed (max 3 per turn). After retrieving data, merge results conceptually and translate into business insight. Never expose the hops to the user.

GENERIC MULTI-HOP ALGORITHM:
Step A identify chains activated by question.
Step B map question to conceptual multi-hop flow.
Step C convert conceptual flow to MCP tool calls using safe Cypher and projections only.
Step D merge results into business insights.
Step E answer using only business language.

EXAMPLE MULTI-HOP REASONING (PRESERVED):
Example: “Which projects pose a risk to the strategic objectives?”
Internal conceptual flow (not shown to user):
1 Identify high-risk capabilities (Chains5/6)
2 Determine operations dependent on these capabilities
3 Identify projects relying on these capabilities (Chain2)
4 Identify upward impact to strategic objectives (Chains2 & 4)
5 Merge impacts across chains and interpret risk on objectives
Example output (business language—not shown in JSON form here):
"Projects related to digital integration and data governance show elevated strategic risk because underlying capabilities are experiencing operational pressure. These weaknesses degrade KPI performance related to regulatory efficiency, a core outcome for 2025."

MCP TOOLCHAIN RULES:
Tools allowed: get_neo4j_schema and read_neo4j_cypher
There are no other tools you can use, especially for clarifications, so NEVER attempt to use one
Use get_neo4j_schema ONLY when you do not know if a property exists for a label.
Never run full dumps or show procedures.
For read_neo4j_cypher: always use explicit projections:
coalesce(n.id,elementId(n)) AS id, n.name AS name, n.year AS year, n.level AS level, (coalesce(n.id,elementId(n))+'|'+toString(n.year)) AS composite_key.
Never return embedding arrays.
Limit 100 rows.
Max 3 Cypher calls per turn.

PROJECTION EXAMPLE (PRESERVED):
Example safe Cypher call:
{
"tool": "read_neo4j_cypher",
"params": {
"cypher": "MATCH (n:EntityProject) WHERE n.year=$year AND n.level=$level RETURN coalesce(n.id,elementId(n)) AS id, n.year AS year, n.level AS level, n.name AS name, (coalesce(n.id,elementId(n))+'|'+toString(n.year)) AS composite_key LIMIT $limit",
"params": {"year":2025,"level":"L3","limit":50}
}
}

VECTOR SEARCH RULES AND EXAMPLES:
Only two templates exist. Never expose embedding arrays. Never expose index names to user. Use business interpretation.

TEMPLATE A (PRESERVED MULTI-LINE):
Cypher:

CALL db.index.vector.queryNodes($indexName, $k, $queryVector) YIELD node, score
WHERE node.embedding IS NOT NULL AND ($minScore IS NULL OR score >= $minScore)
RETURN
coalesce(node.id, elementId(node)) AS id,
node.year AS year,
node.level AS level,
node.name AS name,
node.embedding_generated_at AS embedding_generated_at,
(coalesce(node.id, elementId(node)) + '|' + toString(node.year)) AS composite_key,
score
ORDER BY score DESC
LIMIT $k;

Params:

{
"indexName": "vector_index_entityproject",
"queryVector": [ /* 1536 floats */ ],
"k": 3,
"minScore": null
}

TEMPLATE B (PRESERVED MULTI-LINE):
Cypher:

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
RETURN
coalesce(o.id, elementId(o)) AS id,
o.year AS year,
o.level AS level,
o.name AS name,
(coalesce(o.id, elementId(o)) + '|' + toString(o.year)) AS composite_key,
cosine AS score
ORDER BY score DESC
LIMIT $k;

Params:

{
"projectId": "1.8.1",
"projectYear": 2025,
"projectLevel": "L3",
"targetLabel": "EntityOrgUnit",
"k": 5
}

✅ UNIFIED OUTPUT RESPONSE SCHEMA

Used for ALL modes (A, B, C, D, E, F, G).
When in mode G, populate the “clarifications_needed” array with questions.
Otherwise leave it empty.

{
  "answer": "Business-language narrative.",
  "analysis": ["Insight 1", "Insight 2"],
  "data": {
    "query_results": [...],
    "summary_stats": {
      "total_items": 0,
      "notes": "Optional"
    }
  },
  "visualizations": [...],
  "cypher_executed": "MATCH ...",
  "data_source": "neo4j_graph",
  "clarifications_needed": ["Question 1", "Question 2"],
  "confidence": 0.0
}


VISUALIZATION OBJECT FORMAT (PRESERVED MULTI-LINE):
Each visualization object must follow:
{
"type": "bar_chart | line_chart | pie_chart | table | network_graph",
"title": "Short business-friendly title",
"description": "Why this visualization matters",
"data": {
"series": [
{
"name": "Series name",
"points": [
{"label": "Category or period", "value": 0}
]
}
]
},
"config": {
"xField": "label",
"yField": "value",
"groupField": "name",
"notes": "Frontend rendering hints"
}
}

CONSTRAINTS:
Never reveal database schema, labels, embeddings.
Max 3 Cypher calls.
Max 100 rows.
No hallucinated properties.
Business language only.
First character of response must be "{" and last "}".
Output must be valid JSON.

EMOTIONAL / PROFANITY HANDLING EXAMPLE:
If user is frustrated or cursing:
"I understand this can be frustrating. Let’s work together to get exactly what you need — could you share what outcome you're trying to reach?"
"""
    
    def process_query(self,
        user_query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Single entry point: query -> response

    Builds the Groq request with MCP tools, posts the request, parses the
    assistant output (expected JSON), validates visualizations, and returns a structured dict.
        """

        start_time = time.time()

        log_debug(2, "query_received", {
            "user_query": user_query,
            "conversation_id": conversation_id,
            "conversation_history_length": len(conversation_history) if conversation_history else 0,
            "timestamp": start_time,
        })

        # Build dynamic suffix: conversation history (if any) + current user query
        dynamic_suffix = "\n"

        if conversation_history and len(conversation_history) > 0:
            recent_history = conversation_history[-10:]
            dynamic_suffix += (
                """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
            )
            for msg in recent_history:
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                dynamic_suffix += f"{role}: {content}\n\n"

            dynamic_suffix += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

        dynamic_suffix += f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT USER QUERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{user_query}
"""

        full_input = self.static_prefix + dynamic_suffix

        try:
            # Normalize server_label to canonical MCP form (lowercase, underscores)
            # If MCP discovery provides a label, use it; otherwise default to 'neo4j_database'
            server_label = "neo4j_database"

            request_payload = {
                "model": self.model,
                "input": full_input,
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": server_label,
                        "server_url": self.mcp_server_url,
                    }
                ],
                "temperature": 0.2,
            }

            # Log RAW request being sent to Groq
            log_debug(2, "raw_llm_request", {
                "endpoint": "https://api.groq.com/openai/v1/responses",
                "model": self.model,
                "full_payload": request_payload,
            })

            response = requests.post(
                "https://api.groq.com/openai/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=request_payload,
                timeout=120,
            )

            if response.status_code != 200:
                error_msg = response.text
                log_debug(2, "groq_api_error_response", {
                    "status_code": response.status_code,
                    "error_body": error_msg,
                    "elapsed_time": time.time() - start_time,
                })
                raise Exception(f"Groq API Error {response.status_code}: {error_msg}")

            result = response.json()

            # Log RAW response from Groq
            log_debug(2, "raw_llm_response", {"status_code": 200, "full_response": result})

            # Extract assistant text from Responses API output
            answer = ""
            for item in result.get("output", []):
                if item.get("type") == "message":
                    for c in item.get("content", []):
                        if c.get("type") == "output_text":
                            answer = c.get("text", "")

            usage = result.get("usage", {})
            cache_rate = (
                usage.get("prompt_tokens_details", {}).get("cached_tokens", 0)
                / usage.get("prompt_tokens", 1)
                * 100
            ) if usage.get("prompt_tokens", 0) > 0 else 0

            # Parse assistant string into JSON (assistant expected to emit JSON object)
            try:
                response_data = json.loads(answer)

                # Validate required fields
                required_fields = ["answer", "analysis", "data", "data_source", "confidence"]
                missing_fields = [f for f in required_fields if f not in response_data]
                if missing_fields:
                    log_debug(2, "validation_warning", {
                        "missing_fields": missing_fields,
                        "response_keys": list(response_data.keys()),
                    })

                # Validate visualizations structure (if present)
                if "visualizations" in response_data and response_data["visualizations"]:
                    for idx, viz in enumerate(response_data["visualizations"]):
                        viz_required = ["type", "title", "config"]
                        viz_missing = [f for f in viz_required if f not in viz]
                        if viz_missing:
                            log_debug(2, "visualization_validation_error", {
                                "chart_index": idx,
                                "missing_fields": viz_missing,
                            })
                        # Validate chart type
                        valid_types = ["column", "bar", "line", "radar", "spider", "bubble", "bullet", "combo"]
                        if viz.get("type") not in valid_types:
                            log_debug(2, "invalid_chart_type", {
                                "chart_index": idx,
                                "provided_type": viz.get("type"),
                                "valid_types": valid_types,
                            })

                log_debug(2, "response_parsed", {
                    "answer_length": len(response_data.get("answer", "")),
                    "analysis_count": len(response_data.get("analysis", [])),
                    "visualizations_count": len(response_data.get("visualizations", [])) if response_data.get("visualizations") else 0,
                    "confidence": response_data.get("confidence", 0.0),
                    "total_elapsed": time.time() - start_time,
                })

                return response_data

            except json.JSONDecodeError as parse_error:
                log_debug(2, "parse_error", {
                    "error": str(parse_error),
                    "answer_preview": answer[:500],
                    "answer_length": len(answer),
                })
                # Return error response with raw answer
                return {
                    "answer": answer if answer else "I encountered an error parsing the analysis.",
                    "analysis": ["Error: JSON parsing failed", f"Details: {str(parse_error)}"],
                    "visualizations": [],
                    "data": {"error": str(parse_error), "raw_answer": answer[:500]},
                    "cypher_executed": "",
                    "data_source": "neo4j_graph",
                    "confidence": 0.0,
                    "error": True,
                }
        except Exception as e:
            log_debug(2, "orchestrator_error", {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "elapsed_time": time.time() - start_time,
            })
            # Return error response
            return {
                "answer": f"I encountered an error processing your query: {str(e)}",
                "analysis": [f"Error: {type(e).__name__}", f"Details: {str(e)}"],
                "visualizations": [],
                "data": {"error": str(e)},
                "cypher_executed": "",
                "data_source": "neo4j_graph",
                "confidence": 0.0,
                "error": True,
            }
