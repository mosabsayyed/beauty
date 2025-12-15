"""
Unified v3.4 Single-Call MCP Orchestrator

MULTI-PERSONA ARCHITECTURE:
This orchestrator serves BOTH Noor and Maestro personas through a single codebase.
Persona is passed as a parameter to __init__ and determines:
  1. MCP Router URL (Noor: port 8201, Maestro: port 8202)
  2. Tier 1 content assembly (different memory scopes)
  3. Fallback messages (persona-specific)

Architecture:
- LLM autonomously executes Steps 0-5 using MCP tools
- Orchestrator: Infrastructure layer only (dumb pipe)
- Model: openai/gpt-oss-120b (Groq)
- Tooling: MCP with server-side execution (require_approval: never)
- Tier 1: Loaded from database (atomic elements assembled with persona placeholders)

Personas:
- Noor: Staff-facing, routers on 8201, memory scopes: personal/departmental/ministry
- Maestro: Executive-facing, routers on 8202, memory scopes: personal/departmental/ministry/secrets
"""

import os
import json
import re
import ast
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests  # Use requests for Groq /v1/responses endpoint

# Deterministic backend diagnostics (used only as a safety net)
from app.db.neo4j_client import neo4j_client

# Configure logging
logger = logging.getLogger(__name__)

# Import debug logger (same as zero-shot)
from app.utils.debug_logger import log_debug

# Import Tier 1 assembler
from app.services.tier1_assembler import get_tier1_prompt, get_tier1_token_count

# ==============================================================================
# TIER 1 PROMPT (LOADED FROM DATABASE)
# ==============================================================================
# Tier 1 is now assembled from atomic elements in instruction_elements table
# This replaces the hardcoded COGNITIVE_CONT_BUNDLE

def load_tier1_bundle(persona: str) -> str:
    """
    Load Tier 1 prompt from database (Step 0 + Step 5)
    
    Args:
        persona: Either "noor" or "maestro"
    
    Returns:
        Assembled prompt with persona-specific content (~1,200 tokens)
    """
    try:
        prompt = get_tier1_prompt(persona=persona, use_cache=True)
        token_info = get_tier1_token_count(persona=persona)
        
        log_debug(2, "tier1_loaded", {
            "persona": persona,
            "source": "database",
            "element_count": token_info["element_count"],
            "total_tokens": token_info["total_tokens"]
        })
        
        return prompt
    except Exception as e:
        log_debug(1, "tier1_load_failed", {"error": str(e), "persona": persona})
        return f"You are {persona.capitalize()}. Respond: 'System instructions unavailable.'"


class CognitiveOrchestrator:
    """
    v3.4 Unified Single-Call MCP Orchestrator (Multi-Persona)
    
    HANDLES BOTH NOOR AND MAESTRO PERSONAS
    Persona is determined by initialization parameter, which controls:
      - MCP router URL (port 8201 vs 8202)
      - Tier 1 content (different memory scopes)
      - Fallback messages
    
    Responsibilities:
    1. Input validation & authentication
    2. Fast-path greeting detection (Step 0 pre-filter)
    3. Load Tier 1 from database with persona-specific placeholders
    4. Build prompt with datetoday and persona injection
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
    
    def __init__(self, persona: str = "noor"):
        """
        Initialize orchestrator for specified persona
        
        Args:
            persona: Either "noor" (staff) or "maestro" (executive)
        """
        self.persona = persona.lower()
        
        if self.persona not in ["noor", "maestro"]:
            raise ValueError(f"Invalid persona: {persona}. Must be 'noor' or 'maestro'")
        
        # Groq API Configuration
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        self.model = "openai/gpt-oss-120b"
        self.groq_endpoint = "https://api.groq.com/openai/v1/responses"
        
        # MCP Router URL - persona-specific
        if self.persona == "noor":
            self.mcp_router_url = os.getenv("NOOR_MCP_ROUTER_URL")
            if not self.mcp_router_url:
                raise ValueError("NOOR_MCP_ROUTER_URL environment variable not set (e.g., http://127.0.0.1:8201)")
        else:  # maestro
            self.mcp_router_url = os.getenv("MAESTRO_MCP_ROUTER_URL")
            if not self.mcp_router_url:
                raise ValueError("MAESTRO_MCP_ROUTER_URL environment variable not set (e.g., http://127.0.0.1:8202)")
        
        # MCP tool definition (passed to Groq API)
        # Single MCP server definition - Groq executes tools server-side via this URL
        self.mcp_tools = [
            {
                "type": "mcp",
                "server_label": "mcp_router",
                "server_url": self.mcp_router_url,
                "require_approval": "never"  # CRITICAL: allows Groq to execute tools server-side
            }
        ]
    
    def execute_query(
        self,
        user_query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main orchestration method.
        
        Args:
            user_query: User's query string
            session_id: Session identifier
            history: Conversation history
            user_id: Optional authenticated user ID for memory isolation
            
        Returns:
            Parsed JSON response from LLM
        """
        # Store user_id for use in prompt building
        self._current_user_id = user_id
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
            log_debug(2, "llm_request", {
                "session_id": session_id,
                "query": user_query,
                "history_length": len(history) if history else 0,
                "model": self.model
            })
            llm_response = self._call_groq_llm(messages)
            
            # Log raw LLM response for debugging
            log_debug(2, "llm_raw_response", {
                "session_id": session_id,
                "response_length": len(llm_response) if llm_response else 0,
                "response_snippet": (llm_response[:500] if llm_response else "<empty>"),
                "full_response": llm_response
            })
            
            # 6. Parse & validate JSON
            parsed_response = self._parse_llm_output(llm_response)
            
            # Log parsed response
            log_debug(2, "llm_parsed_response", {
                "session_id": session_id,
                "has_answer": bool(parsed_response.get("answer")),
                "has_visualizations": bool(parsed_response.get("visualizations")),
                "confidence": parsed_response.get("confidence", 0)
            })
            
            # 7. Auto-recovery if invalid JSON
            if not self._is_valid_json_response(parsed_response):
                logger.warning(f"[{session_id}] Invalid JSON detected, attempting auto-recovery...")
                parsed_response = self._auto_recover(messages, llm_response)

            # 7b. Deterministic safety net for empty results
            parsed_response = self._apply_empty_result_guard(user_query, parsed_response)
            
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
                "answer": f"Hello! I am **{self.persona.capitalize()}**, your Cognitive Digital Twin. I'm here to help you navigate the agency's institutional memory. How can I assist you today?",
                "analysis": [],
                "data": {"query_results": [], "summary_stats": {}},
                "visualizations": [],
                "cypher_executed": None,
                "confidence": 1.0,
                "quick_exit": True
            }
        
        return None

    def _apply_empty_result_guard(self, user_query: str, response: Dict[str, Any]) -> Dict[str, Any]:
        """Safety net to prevent false "no data" outputs when data exists.

        This runs ONLY when:
        - The model returned an empty result set (0 rows)
        - The user intent looks like a list/report request
        - The query mentions a year + quarter
        - The query is about projects (EntityProject)

        If Neo4j shows data exists for the requested year/quarter, the guard will
        fetch the correct rows and attach them to the response.
        """
        try:
            data = response.get("data") if isinstance(response, dict) else None
            query_results = (data or {}).get("query_results") if isinstance(data, dict) else None
            if query_results:
                return response

            # Ensure top-level fields exist for downstream evidence gating.
            if isinstance(response, dict) and not response.get("mode"):
                # Best-effort inference: this guard only triggers for data-like intents.
                response["mode"] = "A"

            query_lower = (user_query or "").lower()
            if not self._query_implies_list_or_report(query_lower):
                return response

            if "project" not in query_lower:
                return response

            year, quarter = self._extract_year_and_quarter(query_lower)
            if not year or not quarter:
                return response

            # If Neo4j isn't configured/available, do nothing.
            if not neo4j_client.connect():
                return response

            # Diagnostics: cheap count + encoding probes
            total_rows = neo4j_client.execute_query(
                "MATCH (p:EntityProject) RETURN count(p) AS total_projects"
            )
            total_projects = int(total_rows[0].get("total_projects", 0)) if total_rows else 0

            year_rows = neo4j_client.execute_query(
                "MATCH (p:EntityProject) WHERE p.year = $year "
                "RETURN count(p) AS year_count, collect(DISTINCT p.quarter)[0..20] AS quarters_for_year",
                {"year": year},
            )
            year_count = int(year_rows[0].get("year_count", 0)) if year_rows else 0
            quarters_for_year = (year_rows[0].get("quarters_for_year") if year_rows else []) or []

            exact_rows = neo4j_client.execute_query(
                "MATCH (p:EntityProject) WHERE p.year = $year AND p.quarter = $quarter "
                "RETURN count(p) AS exact_count",
                {"year": year, "quarter": quarter},
            )
            exact_count = int(exact_rows[0].get("exact_count", 0)) if exact_rows else 0

            # Attach diagnostics into summary_stats (keeps response shape stable)
            if "data" not in response or not isinstance(response.get("data"), dict):
                response["data"] = {"query_results": [], "summary_stats": {}}
            if "summary_stats" not in response["data"] or not isinstance(response["data"].get("summary_stats"), dict):
                response["data"]["summary_stats"] = {}

            response["data"].setdefault("diagnostics", {})
            response["data"].setdefault(
                "query_plan",
                {"primary_label": "EntityProject", "filters": {}, "limit": 50, "skip": 0},
            )

            guard_diagnostics = {
                "entity": "EntityProject",
                "year": year,
                "quarter": quarter,
                "total_projects": total_projects,
                "year_count": year_count,
                "quarters_for_year": quarters_for_year,
                "exact_count": exact_count,
            }

            # Keep backward-compatible location (summary_stats) and new location (diagnostics).
            response["data"]["summary_stats"]["empty_result_guard"] = guard_diagnostics
            if isinstance(response["data"].get("diagnostics"), dict):
                response["data"]["diagnostics"].setdefault("empty_result_guard", guard_diagnostics)

            # Ensure query_plan reflects the intended filter even when the model omitted it.
            if isinstance(response["data"].get("query_plan"), dict):
                response["data"]["query_plan"].update(
                    {
                        "primary_label": "EntityProject",
                        "filters": {"year": year, "quarter": quarter},
                        "limit": 100,
                        "skip": 0,
                    }
                )

            # Ensure cypher_params exists (required by evidence gating).
            if isinstance(response, dict) and not isinstance(response.get("cypher_params"), dict):
                response["cypher_params"] = {"year": year, "quarter": quarter}

            # If data exists for the requested slice but the model returned 0 rows, fetch correct results.
            if exact_count > 0:
                cypher_results_query = (
                    "MATCH (p:EntityProject) "
                    "WHERE p.year = $year AND p.quarter = $quarter "
                    "RETURN "
                    "  p.id AS id, "
                    "  p.name AS name, "
                    "  p.level AS level, "
                    "  p.status AS status, "
                    "  p.progress_percentage AS progress_percentage, "
                    "  p.budget AS budget, "
                    "  p.start_date AS start_date, "
                    "  p.end_date AS end_date "
                    "ORDER BY p.level, p.name "
                    "LIMIT $limit"
                )
                rows = neo4j_client.execute_query(
                    cypher_results_query,
                    {"year": year, "quarter": quarter, "limit": 100},
                )

                cypher_stats_query = (
                    "MATCH (p:EntityProject) "
                    "WHERE p.year = $year AND p.quarter = $quarter "
                    "RETURN "
                    "  count(p) AS count_projects, "
                    "  avg(p.progress_percentage) AS avg_progress, "
                    "  sum(p.budget) AS total_budget"
                )
                stats = neo4j_client.execute_query(
                    cypher_stats_query,
                    {"year": year, "quarter": quarter},
                )
                if rows is not None:
                    response["data"]["query_results"] = rows
                if stats:
                    response["data"]["summary_stats"].update(stats[0])

                # Reflect the deterministic query we executed so downstream layers can cite it.
                response["cypher_executed"] = cypher_results_query
                response["cypher_params"] = {"year": year, "quarter": quarter, "limit": 100}

                # Nudge the answer to reflect what was returned (avoid technical jargon).
                answer = response.get("answer") if isinstance(response.get("answer"), str) else ""
                if answer:
                    answer += "\n\n"
                response["answer"] = (
                    answer
                    + f"Automatic check: projects exist for {year} {quarter}. I retrieved the matching records using year/quarter filtering."
                )
                return response

            # If projects exist but this quarter encoding doesn't match, add a helpful diagnostic.
            if total_projects > 0 and exact_count == 0:
                answer = response.get("answer") if isinstance(response.get("answer"), str) else ""
                if answer:
                    answer += "\n\n"
                available = ", ".join(str(q) for q in quarters_for_year) if quarters_for_year else "<none>"
                response["answer"] = (
                    answer
                    + f"Automatic check: projects exist, but none match the quarter value '{quarter}' for year {year}. "
                    + f"Available quarter values for {year}: {available}."
                )
            elif total_projects == 0:
                answer = response.get("answer") if isinstance(response.get("answer"), str) else ""
                if answer:
                    answer += "\n\n"
                response["answer"] = answer + "Automatic check: no projects are currently loaded in the graph database."

            return response

        except Exception as e:
            log_debug(2, "empty_result_guard_failed", {"error": str(e)})
            return response

    def _query_implies_list_or_report(self, query_lower: str) -> bool:
        keywords = ["report", "list", "show", "generate", "status", "table", "summary"]
        return any(k in query_lower for k in keywords)

    def _extract_year_and_quarter(self, query_lower: str) -> tuple[Optional[int], Optional[str]]:
        year_match = re.search(r"\b(20\d{2})\b", query_lower)
        quarter_match = re.search(r"\bq([1-4])\b", query_lower)

        year = int(year_match.group(1)) if year_match else None
        quarter = f"Q{quarter_match.group(1)}" if quarter_match else None
        return year, quarter
    
    def _build_cognitive_prompt(self) -> str:
        """
        Build Tier 1 prompt (Step 0 + Step 5) from database with persona and datetoday injection.
        
        Returns assembled Tier 1 prompt with dynamic date and persona.
        """
        today = datetime.now().strftime("%B %d, %Y")
        tier1_prompt = load_tier1_bundle(persona=self.persona)

        # Guard against models emitting phantom tool calls (e.g., json/JSON) which Groq rejects
        # when the tool is not declared in request.tools.
        tool_guard = (
            "\n\n"
            "TOOLING CONTRACT (MANDATORY)\n"
            "- You may ONLY call tools that are explicitly provided in the request 'tools' list.\n"
            "- Do NOT invent or call any other tool names (including 'json' or 'JSON').\n"
            "- When returning the final response, emit the required JSON as plain message text (not as a tool call).\n"
        )

        # Inject user_id context for memory isolation if authenticated
        user_context = ""
        if hasattr(self, '_current_user_id') and self._current_user_id:
            user_context = (
                "\n\n"
                f"AUTHENTICATED USER CONTEXT\n"
                f"- Current user_id: {self._current_user_id}\n"
                f"- When calling recall_memory with scope='personal', ALWAYS pass user_id={self._current_user_id} to ensure proper memory isolation.\n"
                f"- Personal memories MUST be filtered by the authenticated user's ID to prevent cross-user data leakage.\n"
            )

        return tier1_prompt.replace("<datetoday>", today) + tool_guard + user_context
    
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

        def _compact_history_turn(turn: Dict[str, Any]) -> Optional[Dict[str, str]]:
            if not isinstance(turn, dict):
                return None
            role = (turn.get("role") or "user").strip()
            content = turn.get("content")
            if content is None:
                return None
            if not isinstance(content, str):
                content = str(content)
            raw = content.strip()

            # Keep user turns short to avoid runaway context.
            if role == "user":
                return {"role": "user", "content": (raw[:1399] + "…") if len(raw) > 1400 else raw}

            # For assistant turns, if it's a big JSON blob, keep only the answer/message.
            if role == "assistant" and raw.startswith("{") and len(raw) > 2400:
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, dict):
                        answer = parsed.get("answer") or parsed.get("message")
                        if isinstance(answer, str) and answer.strip():
                            ans = answer.strip()
                            return {"role": "assistant", "content": (ans[:2399] + "…") if len(ans) > 2400 else ans}
                except Exception:
                    pass

            # Fallback truncation.
            max_chars = 2400 if role == "assistant" else 1400
            return {"role": role, "content": (raw[: max_chars - 1] + "…") if len(raw) > max_chars else raw}
        
        # Add compacted conversation history
        for turn in history:
            compacted = _compact_history_turn(turn)
            if compacted:
                messages.append(compacted)
        
        # Add current query
        messages.append({"role": "user", "content": user_query})
        
        return messages
    
    def _call_groq_llm(self, messages: List[Dict[str, str]]) -> str:
        """
        Call Groq LLM with MCP tool definitions using HTTP-based /v1/responses endpoint.
        
        This endpoint allows server-side tool execution - Groq calls the MCP router,
        not the client.
        
        Returns raw LLM output (text-based JSON).
        """
        def _messages_to_input(msgs: List[Dict[str, str]]) -> str:
            """Convert role-tagged messages to a single input string.

            Note: Groq /v1/responses supports `input` as a string; we keep this
            representation for backward compatibility with the current system.
            """
            prompt_parts: List[str] = []
            for msg in msgs:
                role = (msg.get("role", "user") or "user").upper()
                content = msg.get("content", "") or ""
                if role == "SYSTEM":
                    prompt_parts.insert(0, content)
                else:
                    prompt_parts.append(f"<{role}>\n{content}\n</{role}>")
            return "\n\n".join(prompt_parts)

        def _is_groq_tool_validation_400(body: str) -> bool:
            text = (body or "").lower()
            return (
                "tool call validation failed" in text
                or "failed to parse tool call arguments as json" in text
                or "attempted to call tool 'json'" in text
            )

        def _slim_messages_for_retry(msgs: List[Dict[str, str]]) -> List[Dict[str, str]]:
            """Retry with minimal context to reduce hallucinated tool calls.

            Keeps:
            - system prompt
            - last 2 non-system turns
            - final user question
            """
            if not msgs:
                return msgs
            system = [msgs[0]] if msgs[0].get("role") == "system" else []
            non_system = [m for m in msgs if m.get("role") != "system"]
            tail = non_system[-3:] if len(non_system) >= 3 else non_system
            # Ensure final turn is user
            if tail and tail[-1].get("role") != "user":
                # If last isn't user, append the most recent user turn if present
                last_user = next((m for m in reversed(non_system) if m.get("role") == "user"), None)
                if last_user and last_user not in tail:
                    tail.append(last_user)
            return system + tail

        full_input = _messages_to_input(messages)
        
        request_payload = {
            "model": self.model,
            "input": full_input,  # Groq /v1/responses uses "input" not "messages"
            "tools": self.mcp_tools,  # MCP server contract format
            "temperature": 0.1,
            "tool_choice": "auto",
            "stream": False  # Required for proper tool handling
        }
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                self.groq_endpoint,
                headers=headers,
                json=request_payload,
                timeout=120
            )
            
            # CRITICAL: Log error details BEFORE raise_for_status()
            if response.status_code != 200:
                error_details = {
                    "status_code": response.status_code,
                    "response_body": response.text[:2000],
                    "request_model": request_payload.get("model"),
                    "input_length": len(request_payload.get("input", "")),
                    "tools": request_payload.get("tools"),
                }
                logger.error(f"Groq API error {response.status_code}: {response.text[:500]}")
                # Use standard log_debug pattern (same as zero-shot)
                log_debug(2, "groq_api_error", error_details)

                # Targeted retry: Groq 400s caused by tool validation / malformed tool-call JSON.
                if response.status_code == 400 and _is_groq_tool_validation_400(response.text):
                    retry_messages = _slim_messages_for_retry(messages)
                    retry_input = _messages_to_input(retry_messages)
                    retry_payload = dict(request_payload)
                    retry_payload["input"] = retry_input
                    retry_payload["temperature"] = 0.0
                    log_debug(2, "groq_api_retry", {
                        "reason": "tool_validation_or_bad_tool_args_json",
                        "original_input_length": len(request_payload.get("input", "")),
                        "retry_input_length": len(retry_input),
                    })
                    retry_resp = requests.post(
                        self.groq_endpoint,
                        headers=headers,
                        json=retry_payload,
                        timeout=120,
                    )
                    if retry_resp.status_code != 200:
                        log_debug(2, "groq_api_retry_error", {
                            "status_code": retry_resp.status_code,
                            "response_body": retry_resp.text[:2000],
                            "retry_input_length": len(retry_payload.get("input", "")),
                        })
                    retry_resp.raise_for_status()
                    result = retry_resp.json()
                    output_text = ""
                    if isinstance(result, dict) and "output" in result:
                        output_array = result.get("output", [])
                        if isinstance(output_array, list):
                            for item in output_array:
                                if item.get("type") == "message" and item.get("role") == "assistant":
                                    content = item.get("content", [])
                                    if content and isinstance(content, list):
                                        for content_item in content:
                                            if content_item.get("type") == "output_text":
                                                output_text = content_item.get("text", "")
                                                break
                                    if output_text:
                                        break
                    return output_text if output_text else "{}"
            
            response.raise_for_status()
            
            result = response.json()
            
            # =================================================================
            # LOG FULL GROQ RESPONSE FOR OBSERVABILITY
            # This captures tool calls, reasoning, and all intermediate steps
            # =================================================================
            if isinstance(result, dict) and "output" in result:
                output_array = result.get("output", [])
                
                # Extract and log all tool calls and reasoning steps
                tool_calls = []
                reasoning_steps = []
                mcp_operations = []
                
                for item in output_array:
                    item_type = item.get("type", "unknown")
                    
                    # Log MCP tool discovery
                    if item_type == "mcp_list_tools":
                        mcp_operations.append({
                            "operation": "list_tools",
                            "server": item.get("server_label"),
                            "tools": [t.get("name") for t in item.get("tools", [])][:20]  # First 20 tool names
                        })
                    
                    # Log MCP tool calls
                    elif item_type == "mcp_call":
                        tool_calls.append({
                            "tool": item.get("name"),
                            "server": item.get("server_label"),
                            "arguments": item.get("arguments", {})
                        })
                    
                    # Log MCP tool results
                    elif item_type == "mcp_call_result":
                        # Truncate large results for logging
                        result_content = item.get("content", [])
                        truncated = str(result_content)[:1000] if result_content else ""
                        mcp_operations.append({
                            "operation": "call_result",
                            "call_id": item.get("call_id"),
                            "result_preview": truncated
                        })
                    
                    # Log reasoning/thinking
                    elif item_type == "reasoning":
                        reasoning_steps.append({
                            "thought": item.get("content", "")[:500]
                        })
                
                # Log the full trace
                log_debug(2, "groq_full_trace", {
                    "tool_calls_count": len(tool_calls),
                    "tool_calls": tool_calls,
                    "mcp_operations": mcp_operations,
                    "reasoning_steps": reasoning_steps,
                    "output_items_count": len(output_array),
                    "output_types": [item.get("type") for item in output_array]
                })
            
            # Extract content from Groq's /v1/responses format
            # The response has an 'output' array with multiple items (mcp_list_tools, reasoning, message, etc.)
            # We need to extract the text from the 'message' item with role='assistant'
            output_text = ""
            
            if isinstance(result, dict) and "output" in result:
                output_array = result.get("output", [])
                if isinstance(output_array, list):
                    for item in output_array:
                        if item.get("type") == "message" and item.get("role") == "assistant":
                            content = item.get("content", [])
                            if content and isinstance(content, list):
                                for content_item in content:
                                    if content_item.get("type") == "output_text":
                                        output_text = content_item.get("text", "")
                                        break
                            if output_text:
                                break
            
            return output_text if output_text else "{}"
            
        except requests.RequestException as e:
            logger.error(f"Groq API request error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calling Groq LLM: {e}")
            raise
    
    
    def _parse_llm_output(self, llm_output: str) -> Dict[str, Any]:
        """
        Robust LLM output parser (ported from zero-shot).
        
        Handles:
        - Code fences removal (```json ... ```)
        - Comment stripping (// ...)
        - Groq's Python list quirk ([{'type': 'output_text'...}])
        - Multiple JSON extraction fallbacks
        - Control character sanitization
        - HTML artifact detection
        """
        result: Dict[str, Any] = {
            "answer": "",
            "memory_process": {},
            "analysis": [],
            "visualizations": [],
            "data": {"query_results": [], "summary_stats": {}},
            "cypher_executed": None,
            "confidence": 0.0,
        }
        
        raw_text = llm_output.strip() if llm_output else ""
        
        # Log raw input for debugging
        log_debug(2, "parse_llm_input", {
            "raw_length": len(raw_text),
            "raw_snippet": raw_text[:300] if raw_text else "<empty>"
        })
        
        # Handle Groq's "Python list as string" quirk
        if isinstance(raw_text, str) and raw_text.strip().startswith("[{") and ("output_text" in raw_text or "reasoning_text" in raw_text):
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
                                current_trace = result["memory_process"].get("thought_trace", "")
                                if current_trace:
                                    result["memory_process"]["thought_trace"] = current_trace + "\n" + thought
                                else:
                                    result["memory_process"]["thought_trace"] = thought
                        
                        # Capture output text
                        elif item.get("type") == "output_text":
                            found_valid_content = True
                            extracted_output += item.get("text", "")
                    
                    if found_valid_content:
                        raw_text = extracted_output
            except Exception as e:
                log_debug(2, "groq_list_parse_failed", {"error": str(e)})
                # Continue with raw_text as-is
        
        parsed_json = None
        
        # Attempt 1: Extract JSON from Markdown code blocks
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text, re.IGNORECASE)
        if json_match:
            try:
                json_str = json_match.group(1)
                # Safer comment stripping (only lines starting with //)
                json_str = re.sub(r"^\s*//.*$", "", json_str, flags=re.MULTILINE)
                # Sanitize control characters that break JSON
                json_str = re.sub(r'[\x00-\x1f\x7f]', lambda m: f'\\u{ord(m.group(0)):04x}' if m.group(0) not in '\n\r\t' else m.group(0), json_str)
                parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Attempt 2: Direct JSON parse (no fences)
        if not parsed_json:
            try:
                cleaned = raw_text
                # Remove single-line comments
                cleaned = re.sub(r'//.*$', '', cleaned, flags=re.MULTILINE)
                # Sanitize control characters
                cleaned = re.sub(r'[\x00-\x1f\x7f]', lambda m: f'\\u{ord(m.group(0)):04x}' if m.group(0) not in '\n\r\t' else m.group(0), cleaned)
                parsed_json = json.loads(cleaned)
            except json.JSONDecodeError:
                pass
        
        # Attempt 3: Find first { and last } (Fallback)
        if not parsed_json:
            try:
                start_json = raw_text.find('{"')
                if start_json == -1:
                    start_json = raw_text.find("{")
                end = raw_text.rfind("}")
                
                if start_json != -1 and end != -1 and end > start_json:
                    json_str = raw_text[start_json : end + 1]
                    json_str = re.sub(r"^\s*//.*$", "", json_str, flags=re.MULTILINE)
                    # Sanitize control characters
                    json_str = re.sub(r'[\x00-\x1f\x7f]', lambda m: f'\\u{ord(m.group(0)):04x}' if m.group(0) not in '\n\r\t' else m.group(0), json_str)
                    parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Map Parsed JSON to Result
        if parsed_json and isinstance(parsed_json, dict):
            for key in ["memory_process", "data", "visualizations", "analysis", "cypher_executed", "confidence"]:
                if key in parsed_json:
                    result[key] = parsed_json[key]
            
            if "answer" in parsed_json:
                result["answer"] = parsed_json["answer"]
            elif "message" in parsed_json:
                result["answer"] = parsed_json["message"]
        else:
            # Fallback: Try regex extraction of "answer" field
            answer_match = re.search(r'"answer"\s*:\s*"(.*?)(?<!\\)"', raw_text, re.DOTALL)
            if answer_match:
                try:
                    result["answer"] = ast.literal_eval(f'"{answer_match.group(1)}"')
                except:
                    result["answer"] = answer_match.group(1)
            else:
                # Log the failure with full output
                log_debug(2, "json_parse_failed", {
                    "error": "All parse attempts failed",
                    "raw_output_length": len(llm_output) if llm_output else 0,
                    "raw_output_snippet": (llm_output[:500] if llm_output else "<empty>"),
                    "full_raw_output": llm_output
                })
                
                if raw_text.strip().startswith("{"):
                    result["answer"] = "I encountered an error processing the response format. Please try again."
                else:
                    result["answer"] = raw_text if raw_text else "I encountered an issue processing the response."
        
        # Safety net: Ensure answer is never empty
        if not result.get("answer"):
            if result.get("visualizations"):
                result["answer"] = "I have generated the requested visualizations."
            else:
                result["answer"] = "Processed."
        
        # Clean up excessive line breaks
        if isinstance(result.get("answer"), str):
            result["answer"] = re.sub(r'(\n\s*){3,}', '\n\n', result["answer"])
        
        # HTML artifact detection
        answer_str = str(result.get("answer", "")).strip()
        if re.search(r"<!doctype html>|<html\b|<h[1-6]\b|<table\b|<div\b", answer_str, re.IGNORECASE):
            code_block_match = re.search(r"```(?:html)?\s*([\s\S]*?)\s*```", answer_str, re.IGNORECASE)
            if code_block_match:
                clean_html = code_block_match.group(1).strip()
            else:
                clean_html = answer_str.strip()
            
            # Clean up excessive newlines in HTML content
            # Remove multiple consecutive newlines (3+) -> single newline
            clean_html = re.sub(r'(\n\s*){3,}', '\n', clean_html)
            # Remove newlines between closing and opening tags (they render as unwanted whitespace)
            clean_html = re.sub(r'>\s*\n\s*<', '><', clean_html)
            # Remove leading/trailing whitespace from each line but preserve structure
            clean_html = re.sub(r'\n\s+', '\n', clean_html)
            clean_html = re.sub(r'\s+\n', '\n', clean_html)
            
            html_artifact = {
                "type": "html",
                "title": "HTML Report",
                "content": clean_html
            }
            
            if "visualizations" not in result:
                result["visualizations"] = []
            result["visualizations"].append(html_artifact)
            result["answer"] = "I have generated the HTML report for you. Please view it below."
        
        return result
    
    def _is_valid_json_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate JSON response structure.
        
        Checks for required keys: memory_process, answer.
        """
        required_keys = ["memory_process", "answer"]
        return all(key in response for key in required_keys)
    
    def _auto_recover(
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
        recovered_output = self._call_groq_llm(recovery_messages)
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
# FACTORY FUNCTIONS
# ==============================================================================
def create_orchestrator(persona: str = "noor") -> CognitiveOrchestrator:
    """
    Factory function to create orchestrator instance for specified persona.
    
    Args:
        persona: Either "noor" (staff) or "maestro" (executive)
    
    Returns:
        CognitiveOrchestrator instance configured for the persona
    """
    return CognitiveOrchestrator(persona=persona)

# Backward compatibility aliases
def create_noor_orchestrator() -> CognitiveOrchestrator:
    """Create Noor orchestrator (staff persona)"""
    return CognitiveOrchestrator(persona="noor")

def create_maestro_orchestrator() -> CognitiveOrchestrator:
    """Create Maestro orchestrator (executive persona)"""
    return CognitiveOrchestrator(persona="maestro")

# Class alias for backward compatibility with imports
NoorOrchestrator = CognitiveOrchestrator
