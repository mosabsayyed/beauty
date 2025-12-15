"""
Noor v3.2 Agentic MCP Orchestrator

Architecture:
- LLM autonomously executes Steps 0-5 using MCP tools
- Orchestrator: Infrastructure layer only
- Model: openai/gpt-oss-120b (Groq)
- Tooling: MCP (recall_memory, retrieve_instructions, read_neo4j_cypher)
- cognitive_cont bundle: HARDCODED (not loaded from database)
"""

import os
import json
import re
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from groq import AsyncGroq

# Configure logging
logger = logging.getLogger(__name__)

# ==============================================================================
# COGNITIVE_CONT BUNDLE (HARDCODED - ALWAYS LOADED)
# ==============================================================================
COGNITIVE_CONT_BUNDLE = """
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
- Vantage Point: this is a temporal database so all records are timestamped with quarters and years. Most of the queries will want to know if there is a problem and this depends highly on the <datetoday> as a vantage point. For all intents and purposes, projects with start dates in the future are not active (you must consider their completion rate as 0%% even if their %% of completion is > 0%%) and are planned. Projects with start dates in the past might be active (in progress) or closed (100%% completion). Based on this you can compare for example a certain project, its starting date, its %% of completion, divide the duration equally by months or weeks, identify where it should have progressed by <datetoday> and resolve if there is a delay or not.
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
"""


class NoorAgenticOrchestrator:
    """
    v3.2 Agentic MCP Orchestrator
    
    Responsibilities:
    1. Input validation & authentication
    2. Fast-path greeting detection (Step 0 pre-filter)
    3. Load hardcoded cognitive_cont bundle
    4. Build prompt with datetoday injection
    5. Call Groq LLM with MCP tools (ONE call)
    6. Parse & validate JSON response
    7. Auto-recovery if invalid JSON
    8. Apply business language translation
    9. Log metrics
    10. Return
    
    What it does NOT do:
    - Does NOT retrieve bundles (LLM calls retrieve_instructions)
    - Does NOT call MCPs directly (LLM calls them)
    - Does NOT classify mode (LLM does it)
    - Does NOT decide which bundles to load (LLM does it)
    """
    
    def __init__(self):
        self.groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-120b"
        
        # MCP tool definitions (passed to LLM)
        self.mcp_tools = [
            {
                "type": "function",
                "function": {
                    "name": "recall_memory",
                    "description": "Search personal or project memory using semantic vector search. Returns relevant memories for context.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "memory_type": {
                                "type": "string",
                                "enum": ["personal", "project"],
                                "description": "Type of memory to search"
                            },
                            "query": {
                                "type": "string",
                                "description": "Search query for memory retrieval"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of memories to return (default: 5)",
                                "default": 5
                            }
                        },
                        "required": ["memory_type", "query"]
                    },
                    "require_approval": "never"
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "retrieve_instructions",
                    "description": "Load instruction bundles based on interaction mode. Returns additional context bundles like graph_schema, cypher_examples, tool_rules, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "mode": {
                                "type": "string",
                                "enum": ["A", "B", "C", "D", "E", "F", "G", "H"],
                                "description": "Interaction mode (A=Simple Query, B=Complex Analysis, etc.)"
                            },
                            "bundle_tags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Optional specific bundle tags to load"
                            }
                        },
                        "required": ["mode"]
                    },
                    "require_approval": "never"
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_neo4j_cypher",
                    "description": "Execute Cypher query against Neo4j knowledge graph. Returns query results.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "cypher_query": {
                                "type": "string",
                                "description": "Cypher query to execute"
                            },
                            "parameters": {
                                "type": "object",
                                "description": "Optional parameters for the query"
                            }
                        },
                        "required": ["cypher_query"]
                    },
                    "require_approval": "never"
                }
            }
        ]
    
    async def execute_query(
        self,
        user_query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main orchestration method.
        
        Args:
            user_query: User's query string
            session_id: Session identifier
            history: Conversation history
            
        Returns:
            Parsed JSON response from LLM
        """
        try:
            # 1. Input validation
            if not user_query or not user_query.strip():
                return self._error_response("Empty query")
            
            # 2. Fast-path greeting detection (Step 0 pre-filter)
            greeting_response = self._check_fast_path_greeting(user_query)
            if greeting_response:
                logger.info(f"[{session_id}] Fast-path greeting triggered")
                return greeting_response
            
            # 3. Load cognitive_cont bundle with datetoday injection
            cognitive_prompt = self._build_cognitive_prompt()
            
            # 4. Build full prompt with history
            messages = self._build_messages(cognitive_prompt, user_query, history or [])
            
            # 5. Call Groq LLM with MCP tools (LLM does Steps 0-5 autonomously)
            logger.info(f"[{session_id}] Calling Groq LLM with MCP tools...")
            llm_response = await self._call_groq_llm(messages)
            
            # 6. Parse & validate JSON
            parsed_response = self._parse_llm_output(llm_response)
            
            # 7. Auto-recovery if invalid JSON
            if not self._is_valid_json_response(parsed_response):
                logger.warning(f"[{session_id}] Invalid JSON detected, attempting auto-recovery...")
                parsed_response = await self._auto_recover(messages, llm_response)
            
            # 8. Apply business language translation
            parsed_response = self._apply_business_language(parsed_response)
            
            # 9. Log metrics
            self._log_metrics(session_id, parsed_response, user_query)
            
            # 10. Return
            return parsed_response
            
        except Exception as e:
            logger.error(f"[{session_id}] Orchestrator error: {e}", exc_info=True)
            return self._error_response(f"Orchestrator error: {str(e)}")
    
    def _check_fast_path_greeting(self, user_query: str) -> Optional[Dict[str, Any]]:
        """
        Fast-path detection for simple greetings (saves LLM cost).
        
        Returns greeting response if detected, None otherwise.
        """
        query_lower = user_query.lower().strip()
        
        # Simple greeting patterns
        if query_lower in ["hello", "hi", "hey", "thanks", "thank you", "goodbye", "bye"]:
            return {
                "memory_process": {
                    "intent": "Greeting",
                    "thought_trace": "Fast-path greeting detection"
                },
                "answer": "Hello! I am **Noor**, your Cognitive Digital Twin. I'm here to help you navigate the agency's institutional memory. How can I assist you today?",
                "analysis": [],
                "data": {"query_results": [], "summary_stats": {}},
                "visualizations": [],
                "cypher_executed": None,
                "confidence": 1.0,
                "quick_exit": True
            }
        
        return None
    
    def _build_cognitive_prompt(self) -> str:
        """
        Build cognitive_cont prompt with datetoday injection.
        
        Returns the hardcoded bundle with dynamic date.
        """
        today = datetime.now().strftime("%B %d, %Y")
        return COGNITIVE_CONT_BUNDLE.replace("<datetoday>", today)
    
    def _build_messages(
        self,
        cognitive_prompt: str,
        user_query: str,
        history: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """
        Build message array for LLM.
        
        Format:
        - system: cognitive_cont bundle
        - history: previous conversation turns
        - user: current query
        """
        messages = [
            {"role": "system", "content": cognitive_prompt}
        ]
        
        # Add conversation history
        for turn in history:
            if "role" in turn and "content" in turn:
                messages.append(turn)
        
        # Add current query
        messages.append({"role": "user", "content": user_query})
        
        return messages
    
    async def _call_groq_llm(self, messages: List[Dict[str, str]]) -> str:
        """
        Call Groq LLM with MCP tool definitions.
        
        LLM autonomously decides:
        - When to call recall_memory
        - When to call retrieve_instructions (to load bundles)
        - When to call read_neo4j_cypher
        - How to synthesize final response
        
        Returns raw LLM output (text-based JSON).
        """
        response = await self.groq_client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=self.mcp_tools,
            tool_choice="auto",  # LLM decides when to use tools
            temperature=0.1,
            max_tokens=4096
        )
        
        # Extract content (Groq handles tool execution server-side)
        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            return content if content else "{}"
        
        return "{}"
    
    def _parse_llm_output(self, llm_output: str) -> Dict[str, Any]:
        """
        Parse LLM text output into JSON.
        
        Handles:
        - Code fences removal (```json ... ```)
        - Comment stripping (// ...)
        - JSON parsing
        """
        cleaned = llm_output.strip()
        
        # Remove markdown code fences
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
        
        # Remove single-line comments
        cleaned = re.sub(r'//.*$', '', cleaned, flags=re.MULTILINE)
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {
                "memory_process": {"intent": "Error", "thought_trace": "Failed to parse LLM output"},
                "answer": "I encountered an issue processing the response. Please try again.",
                "analysis": [],
                "data": {"query_results": [], "summary_stats": {}},
                "visualizations": [],
                "cypher_executed": None,
                "confidence": 0.0
            }
    
    def _is_valid_json_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate JSON response structure.
        
        Checks for required keys: memory_process, answer.
        """
        required_keys = ["memory_process", "answer"]
        return all(key in response for key in required_keys)
    
    async def _auto_recover(
        self,
        messages: List[Dict[str, str]],
        invalid_response: str
    ) -> Dict[str, Any]:
        """
        Auto-recovery: Re-invoke LLM with correction prompt.
        
        Appends error message and asks LLM to fix the output.
        """
        correction_prompt = f"""
The previous output was invalid JSON. Please fix it and return ONLY valid JSON.

Previous output:
{invalid_response}

Error: Missing required keys or invalid JSON structure.

Please return a valid JSON response following the <response_template> structure.
"""
        
        # Add correction request
        recovery_messages = messages + [
            {"role": "assistant", "content": invalid_response},
            {"role": "user", "content": correction_prompt}
        ]
        
        # Retry LLM call
        recovered_output = await self._call_groq_llm(recovery_messages)
        return self._parse_llm_output(recovered_output)
    
    def _apply_business_language(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply business language translation rules.
        
        Replaces technical terms with business-friendly equivalents:
        - "Node" -> "Entity"
        - "Cypher" -> "Query"
        - "L3" -> "Project Output" (context-dependent)
        - "ID" -> "Identifier"
        """
        if "answer" in response and isinstance(response["answer"], str):
            answer = response["answer"]
            
            # Business language replacements
            replacements = {
                r'\bNode\b': 'Entity',
                r'\bCypher\b': 'Query',
                r'\bL3\b': 'Output Level',
                r'\bL2\b': 'Program Level',
                r'\bL1\b': 'Portfolio Level',
                r'\bID\b': 'Identifier'
            }
            
            for pattern, replacement in replacements.items():
                answer = re.sub(pattern, replacement, answer, flags=re.IGNORECASE)
            
            response["answer"] = answer
        
        return response
    
    def _log_metrics(self, session_id: str, response: Dict[str, Any], query: str):
        """
        Log orchestration metrics.
        
        Logs:
        - Session ID
        - Query length
        - Response confidence
        - Cypher executed (if any)
        """
        confidence = response.get("confidence", 0.0)
        cypher = response.get("cypher_executed", None)
        
        logger.info(
            f"[{session_id}] Metrics: "
            f"query_len={len(query)}, "
            f"confidence={confidence:.2f}, "
            f"cypher={'Yes' if cypher else 'No'}"
        )
    
    def _error_response(self, error_message: str) -> Dict[str, Any]:
        """
        Generate standard error response.
        """
        return {
            "memory_process": {
                "intent": "Error",
                "thought_trace": error_message
            },
            "answer": f"I encountered an error: {error_message}",
            "analysis": [],
            "data": {"query_results": [], "summary_stats": {}},
            "visualizations": [],
            "cypher_executed": None,
            "confidence": 0.0
        }


# ==============================================================================
# FACTORY FUNCTION
# ==============================================================================
def create_orchestrator() -> NoorAgenticOrchestrator:
    """
    Factory function to create orchestrator instance.
    """
    return NoorAgenticOrchestrator()
