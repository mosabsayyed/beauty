"""Unified v3.4 Single-Call MCP Orchestrator with persona-aware MCP tools.

Multi-persona architecture:
- Noor (staff): MCP router on 8201; memory scopes personal/departmental/ministry.
- Maestro (executive): MCP router on 8202; memory scopes personal/departmental/ministry/secrets.

This orchestrator is an infrastructure layer: single LLM call (Responses API) with server-side MCP tools,
Tier 1 prompt fetched from the database, and JSON parsing/guards applied in code.
"""

import os
import json
import re
import ast
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

import requests

from app.config import settings
from app.db.neo4j_client import neo4j_client
from app.utils.debug_logger import log_debug
from app.services.tier1_assembler import get_tier1_prompt, get_tier1_token_count
from app.services.admin_settings_service import admin_settings_service

logger = logging.getLogger(__name__)


def load_tier1_bundle(persona: str) -> str:
    """Load Tier 1 prompt from database (Step 0 + Step 5)."""
    try:
        prompt = get_tier1_prompt(persona=persona, use_cache=True)
        token_info = get_tier1_token_count(persona=persona)
        log_debug(2, "tier1_loaded", {
            "persona": persona,
            "source": "database",
            "element_count": token_info.get("element_count"),
            "total_tokens": token_info.get("total_tokens"),
        })
        return prompt
    except Exception as e:
        log_debug(1, "tier1_load_failed", {"error": str(e), "persona": persona})
        return f"You are {persona.capitalize()}. Respond: 'System instructions unavailable.'"


class CognitiveOrchestrator:
    """v3.4 Unified Single-Call MCP Orchestrator (Multi-Persona)."""

    def __init__(self, persona: str = "noor"):
        """Initialize orchestrator for the specified persona."""
        self.persona = persona.lower()

        if self.persona not in ["noor", "maestro"]:
            raise ValueError(f"Invalid persona: {persona}. Must be 'noor' or 'maestro'")

        self.api_endpoint = os.getenv("OPENROUTER_API_ENDPOINT", "https://openrouter.ai/api/v1/responses")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

        # Model configuration (env-driven with OpenRouter-friendly defaults)
        self.model_primary = os.getenv("OPENROUTER_MODEL_PRIMARY", "google/gemma-3-27b-it")
        self.model_fallback = os.getenv("OPENROUTER_MODEL_FALLBACK", "google/gemini-2.5-flash")
        self.model_alt = os.getenv("OPENROUTER_MODEL_ALT", "mistralai/devstral-2512:free")
        self.model = self.model_primary

        # Persona-specific MCP router URLs
        if self.persona == "noor":
            self.mcp_router_url = os.getenv("NOOR_MCP_ROUTER_URL")
            if not self.mcp_router_url:
                raise ValueError("NOOR_MCP_ROUTER_URL environment variable not set (e.g., http://127.0.0.1:8201)")
        else:
            self.mcp_router_url = os.getenv("MAESTRO_MCP_ROUTER_URL")
            if not self.mcp_router_url:
                raise ValueError("MAESTRO_MCP_ROUTER_URL environment variable not set (e.g., http://127.0.0.1:8202)")

        # Local LLM settings (cached from admin settings at init time - NO per-request DB calls)
        # Load admin settings ONCE at init, then cache it for all requests
        self._admin_settings_cached = admin_settings_service.merge_with_env_defaults()
        provider_config = self._admin_settings_cached.provider

        self.local_llm_enabled = provider_config.local_llm_enabled
        self.local_llm_model = provider_config.local_llm_model
        self.local_llm_base_url = provider_config.local_llm_base_url
        self.local_llm_timeout = provider_config.local_llm_timeout

        # Pre-build MCP endpoint lookup map at init (O(1) lookup later, not O(n) loop)
        mcp_config = self._admin_settings_cached.mcp
        self._mcp_endpoint_map = {}
        if mcp_config and mcp_config.endpoints:
            for endpoint in mcp_config.endpoints:
                self._mcp_endpoint_map[endpoint.label] = endpoint.url

        # Cache Tier-1 prompt at init time (NO per-request DB call)
        # This is loaded ONCE when orchestrator starts, not on every execute_query() call
        try:
            self._tier1_prompt_cached = load_tier1_bundle(persona=self.persona)
            self._tier1_loaded_at = datetime.now()
            logger.info(f"[INIT] Tier-1 prompt cached for persona '{persona}' at {self._tier1_loaded_at}")
        except Exception as e:
            logger.error(f"[INIT] Failed to cache Tier-1 prompt for persona '{persona}': {e}")
            self._tier1_prompt_cached = f"You are {persona.capitalize()}. Respond: 'System instructions unavailable.'"

        # Track response IDs for stateful LM Studio conversations
        self._response_id_cache: Dict[str, str] = {}

        # Model alias map
        self._model_alias_map = {
            "primary": self.model_primary,
            "fallback": self.model_fallback,
            "alt": self.model_alt,
        }
        if self.local_llm_enabled:
            self._model_alias_map["local"] = self.local_llm_model
    
    def _resolve_model_choice(self, model_override: Optional[str]) -> Dict[str, Any]:
        """Resolve which model to use based on override and env configuration."""
        override_key = (model_override or "").strip().lower()
        synonyms = {
            "primary": "primary",
            "fallback": "fallback",
            "alt": "alt",
            "local": "local",
            "gemma": "primary",
            "flash": "fallback",
            "devstral": "alt",
        }

        alias = synonyms.get(override_key) if override_key else None
        if alias not in self._model_alias_map:
            # If no valid override, check if local LLM is enabled globally.
            # If enabled, it becomes the default "primary" choice.
            if self.local_llm_enabled:
                alias = "local"
            else:
                alias = "primary"

        # If local was requested (or defaulted) but strictly not enabled, fall back to primary
        use_local = alias == "local" and self.local_llm_enabled
        if alias == "local" and not self.local_llm_enabled:
            alias = "primary"
            use_local = False

        model_name = self._model_alias_map.get(alias, self.model_primary)

        if not use_local and not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable not set for OpenRouter request")

        return {
            "model_name": model_name,
            "alias": alias,
            "use_local": use_local,
        }

    def execute_query(
        self,
        user_query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[str] = None,
        model_override: Optional[str] = None
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

            # 2b. Resolve model selection (env-driven with optional override)
            model_choice = self._resolve_model_choice(model_override)
            self.model = model_choice["model_name"]
            
            # 3. Load cognitive_cont bundle with datetoday injection
            cognitive_prompt = self._build_cognitive_prompt()
            
            # 4. Build full prompt with history
            messages = self._build_messages(cognitive_prompt, user_query, history or [])
            
            # 5. Call OpenRouter LLM with MCP tools (single Responses API call)
            logger.info(f"[{session_id}] Calling OpenRouter LLM with MCP tools...")
            log_debug(2, "llm_request", {
                "session_id": session_id,
                "query": user_query,
                "history_length": len(history) if history else 0,
                "model": self.model,
                "model_alias": model_choice.get("alias"),
                "use_local_llm": model_choice.get("use_local", False)
            })
            llm_response = self._call_llm(messages, model_choice)
            
            # Log raw LLM response for debugging
            log_debug(2, "llm_raw_response", {
                "session_id": session_id,
                "response_length": len(llm_response) if llm_response else 0,
                "response_snippet": (llm_response[:500] if llm_response else "<empty>"),
                "full_response": llm_response
            })
            
            # 6. Parse & validate JSON
            parsed_response = self._parse_llm_output(llm_response)
            
            # Track parse success for logging separation
            parse_success = self._is_valid_json_response(parsed_response)
            
            # Log parsed response with parse success indicator
            log_debug(2, "llm_parsed_response", {
                "session_id": session_id,
                "parse_success": parse_success,
                "has_answer": bool(parsed_response.get("answer")),
                "has_artifacts": bool(parsed_response.get("artifacts")),  # Updated to artifacts
                "confidence": parsed_response.get("confidence", 0)
            })
            
            # 7. Auto-recovery if invalid JSON
            if not parse_success:
                logger.warning(f"[{session_id}] Invalid JSON detected, attempting auto-recovery...")
                parsed_response = self._auto_recover(messages, llm_response)
                # Mark that fallback execution occurred
                parsed_response["fallback_executed"] = True
                parsed_response["original_parse_failed"] = True
                
                # Log fallback execution result separately
                log_debug(2, "agent_result_from_fallback", {
                    "session_id": session_id,
                    "fallback_success": self._is_valid_json_response(parsed_response),
                    "has_answer": bool(parsed_response.get("answer")),
                    "has_artifacts": bool(parsed_response.get("artifacts")),
                    "confidence": parsed_response.get("confidence", 0)
                })

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

        This runs when:
        - The model returned an empty result set (0 rows), OR
        - The model returned a suspiciously low count (e.g., 0 for a temporal query), OR
        - Visualization counts don't match query_results counts

        If Neo4j shows data exists for the requested year/quarter, the guard will
        fetch the correct rows and attach them to the response.
        """
        try:
            data = response.get("data") if isinstance(response, dict) else None
            query_results = (data or {}).get("query_results") if isinstance(data, dict) else None
            
            # Enhanced validation: check for suspicious results
            needs_validation = False
            
            # Case 1: Empty results
            if not query_results:
                needs_validation = True
            # Case 2: Results exist but contain suspicious zeros
            elif isinstance(query_results, list) and len(query_results) > 0:
                first_result = query_results[0] if isinstance(query_results[0], dict) else {}
                # Check common count field names
                count_fields = ['projectCount', 'project_count', 'count', 'count_projects', 'total', 'total_projects']
                for field in count_fields:
                    if field in first_result:
                        count_val = first_result.get(field)
                        # If count is 0 or None for a temporal query, validate against Neo4j
                        if count_val is None or (isinstance(count_val, (int, float)) and count_val == 0):
                            needs_validation = True
                            break
            
            # Case 3: Check visualization data for count=0
            if not needs_validation:
                visualizations = response.get("visualizations", [])
                if isinstance(visualizations, list):
                    for viz in visualizations:
                        if isinstance(viz, dict) and "data" in viz:
                            viz_data = viz.get("data", [])
                            if isinstance(viz_data, list) and len(viz_data) > 0:
                                first_viz = viz_data[0]
                                if isinstance(first_viz, dict):
                                    # Check for "Project Count" = 0 or similar
                                    for key, value in first_viz.items():
                                        if "count" in key.lower() and isinstance(value, (int, float)) and value == 0:
                                            needs_validation = True
                                            break
                        if needs_validation:
                            break
            
            if not needs_validation:
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

    def _extract_year_and_quarter(self, query_lower: str) -> tuple[Optional[int], Optional[int]]:
        year_match = re.search(r"\b(20\d{2})\b", query_lower)
        quarter_match = re.search(r"\bq([1-4])\b", query_lower)

        year = int(year_match.group(1)) if year_match else None
        quarter = int(quarter_match.group(1)) if quarter_match else None
        return year, quarter
    
    def _build_cognitive_prompt(self) -> str:
        """
        Build Tier 1 prompt (Step 0 + Step 5) using cached data with datetoday injection.
        
        Uses cached Tier-1 from init (no per-request DB calls).
        Returns assembled Tier 1 prompt with dynamic date and user context prepended.
        """
        today = datetime.now().strftime("%B %d, %Y")
        # Load Tier-1 fresh from DB (no cached prompt)
        tier1_prompt = get_tier1_prompt(persona=self.persona, use_cache=False)

        # Replace date placeholders (support both <datetoday> and <date_today>)
        tier1_with_runtime = tier1_prompt.replace("<datetoday>", today).replace("<date_today>", today)

        # Build authenticated user info block
        user_info_block = None
        if hasattr(self, '_current_user_id') and self._current_user_id:
            user_info_block = (
                f"AUTHENTICATED USER CONTEXT\n"
                f"- Current user_id: {self._current_user_id}\n"
                f"- When calling recall_memory with scope='personal', ALWAYS pass user_id={self._current_user_id} to ensure proper memory isolation.\n"
                f"- Personal memories MUST be filtered by the authenticated user's ID to prevent cross-user data leakage.\n\n"
            )

        # Replace <user_auth_info> placeholder when present, else prepend for back-compat
        if user_info_block:
            if "<user_auth_info>" in tier1_with_runtime:
                tier1_with_runtime = tier1_with_runtime.replace("<user_auth_info>", user_info_block)
            else:
                tier1_with_runtime = user_info_block + tier1_with_runtime

        return tier1_with_runtime
    
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
        
        # Add compacted conversation history (limit to last 10 turns to prevent context overflow)
        MAX_HISTORY_TURNS = 10
        recent_history = history[-MAX_HISTORY_TURNS:] if len(history) > MAX_HISTORY_TURNS else history
        
        for turn in recent_history:
            compacted = _compact_history_turn(turn)
            if compacted:
                messages.append(compacted)
        
        # Add current query
        messages.append({"role": "user", "content": user_query})
        
        return messages
    
    def _call_llm(self, messages: List[Dict[str, str]], model_choice: Dict[str, Any]) -> str:
        """Route to OpenRouter or local LLM based on resolved model choice."""
        if model_choice.get("use_local"):
            return self._call_local_llm(messages, model_choice.get("model_name"))
        return self._call_openrouter_llm(messages, model_choice.get("model_name"))


    def _call_local_llm(self, messages: List[Dict[str, str]], model_name: Optional[str]) -> str:
        """Call a local LLM via /v1/responses endpoint."""
        # Separate system prompt and format conversation for Responses API
        system_instructions = []
        conversation_messages = []
        
        for msg in messages:
            role = (msg.get("role") or "user").strip().lower()
            content_text = msg.get("content") or ""
            
            if role == "system":
                system_instructions.append(content_text)
            else:
                # Use simple string content to avoid schema issues with 'input' union
                conversation_messages.append({
                    "role": role,
                    "content": content_text
                })

        # LM Studio MCP tools format for /v1/responses endpoint
        tools = []
        
        # Use cached MCP config and endpoint map (loaded at init, not per-request)
        # This eliminates per-request DB calls and config loops
        mcp_config = self._admin_settings_cached.mcp
        
        # 1. Find binding label for current persona
        binding_label = mcp_config.persona_bindings.get(self.persona) if mcp_config else None
        
        # 2. Find endpoint URL using pre-built O(1) map (no loop, no DB call)
        resolved_router_url = self.mcp_router_url # Default fallback
        if binding_label and binding_label in self._mcp_endpoint_map:
            resolved_router_url = self._mcp_endpoint_map[binding_label]
        
        # Use a list of standard tools (or fetch from endpoint config if we were fully generic)
        allowed_tools = ["recall_memory", "retrieve_instructions", "read_neo4j_cypher"]
        
        tools = [{
            "type": "mcp",
            "server_label": binding_label or f"{self.persona}-router",
            "server_url": resolved_router_url,
            "allowed_tools": allowed_tools
        }]

        endpoint_url = self.local_llm_base_url.rstrip("/") + "/v1/responses"

        payload = {
            "model": model_name or self.local_llm_model,
            "input": conversation_messages,
            "instructions": "\n\n".join(system_instructions),
            "tools": tools,
            "tool_choice": "auto",
            "max_output_tokens": 8000,
            "temperature": 0.1
        }

        headers = {"Content-Type": "application/json"}

        try:
            log_debug(2, "local_llm_request", {
                "endpoint": endpoint_url,
                "model": payload.get("model"),
                "messages_count": len(conversation_messages),
                "mcp_server_label": tools[0].get("server_label") if tools else None,
                "mcp_server_url": tools[0].get("server_url") if tools else None
            })

            resp = requests.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=self.local_llm_timeout,
            )
            if resp.status_code != 200:
                log_debug(2, "local_llm_error", {
                    "status_code": resp.status_code,
                    "response_body": resp.text[:1000],
                    "model": payload.get("model"),
                    "endpoint": endpoint_url,
                })
            resp.raise_for_status()
            data = resp.json()

            # Extract output text from Responses API format
            text_content = ""
            # Some providers may include aggregated output_text at the root
            if isinstance(data, dict) and isinstance(data.get("output_text"), str):
                text_content = data.get("output_text") or ""

            output = data.get("output")
            if isinstance(output, dict):
                text_content = output.get("text") or ""
            elif isinstance(output, list) and output:
                for item in output:
                    if not isinstance(item, dict):
                        continue
                    text_candidate = item.get("text") or item.get("output_text")
                    if text_candidate:
                        text_content = text_candidate
                        break
                    content_blocks = item.get("content") or []
                    for block in content_blocks:
                        if isinstance(block, dict):
                            text_candidate = block.get("text") or block.get("output_text")
                            if text_candidate:
                                text_content = text_candidate
                                break
                    if text_content:
                        break

            log_debug(2, "local_llm_response", {
                "status_code": resp.status_code,
                "response_length": len(text_content) if text_content else 0,
                "response_snippet": text_content[:300] if text_content else "<empty>"
            })

            return text_content if text_content else "{}"
        except Exception as exc:
            logger.error(f"Local LLM call failed: {exc}")
            raise

    def _call_openrouter_llm(self, messages: List[Dict[str, str]], model_name: Optional[str] = None) -> str:
        """Call OpenRouter Responses API with MCP tool definitions."""
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is required for OpenRouter requests")
        # Normalize endpoint to Responses API when an env mistakenly points to completions
        api_endpoint = (self.api_endpoint or "").strip()
        if "/chat/completions" in api_endpoint or api_endpoint.endswith("/completions"):
            log_debug(2, "openrouter_endpoint_normalized", {
                "from": api_endpoint,
                "to": "https://openrouter.ai/api/v1/responses"
            })
            api_endpoint = "https://openrouter.ai/api/v1/responses"

        # Convert messages to Responses API input format
        input_messages = []
        for msg in messages:
            role = (msg.get("role") or "user").strip()
            content_text = msg.get("content") or ""
            input_messages.append({
                "type": "message",
                "role": role,
                "content": [
                    {
                        "type": "input_text",
                        "text": content_text
                    }
                ]
            })

        # OpenRouter Responses API tool calling uses OpenAI function format.
        # Define our tools so the model can request function calls; we will execute them server-side.
        tools = [
            {
                "type": "function",
                "name": "recall_memory",
                "description": "Search personal/departmental/ministry memory by summary",
                "strict": None,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "scope": {"type": "string", "description": "personal | departmental | ministry"},
                        "query_summary": {"type": "string"},
                        "limit": {"type": "integer"},
                        "user_id": {"type": "string"}
                    },
                    "required": ["scope", "query_summary"]
                }
            },
            {
                "type": "function",
                "name": "retrieve_instructions",
                "description": "Load instruction bundles by mode/tier/elements",
                "strict": None,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mode": {"type": "string"},
                        "tier": {"type": "string"},
                        "elements": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["mode"]
                }
            },
            {
                "type": "function",
                "name": "read_neo4j_cypher",
                "description": "Execute read-only Cypher query with optional params",
                "strict": None,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "params": {"type": "object"}
                    },
                    "required": ["query"]
                }
            }
        ]

        request_payload = {
            "model": model_name or self.model,
            "input": input_messages,
            "tools": tools,
            "tool_choice": "auto",
            "max_output_tokens": 8000,
            "temperature": 0.1,
        }

        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        referer = os.getenv("OPENROUTER_REFERER")
        if referer:
            headers["HTTP-Referer"] = referer

        app_name = os.getenv("OPENROUTER_APP_NAME")
        if app_name:
            headers["X-Title"] = app_name

        try:
            # Attempt request, optionally retry once with alt model if policy blocks current model
            chosen_model = request_payload.get("model")
            attempted_alt = False
            while True:
                # Log outbound request metadata (safe fields only)
                log_debug(2, "openrouter_request", {
                    "endpoint": api_endpoint if 'api_endpoint' in locals() else self.api_endpoint,
                    "model": chosen_model,
                    "messages_count": len(input_messages),
                    "tools": [t.get("name") for t in tools if isinstance(t, dict)],
                    "has_referer": bool(headers.get("HTTP-Referer")),
                    "has_title": bool(headers.get("X-Title")),
                })

                # Send
                request_payload["model"] = chosen_model
                response = requests.post(
                    api_endpoint if 'api_endpoint' in locals() else self.api_endpoint,
                    headers=headers,
                    json=request_payload,
                    timeout=300,
                )

                if response.status_code != 200:
                    body_snippet = response.text[:2000]
                    error_details = {
                        "status_code": response.status_code,
                        "response_body": body_snippet,
                        "request_model": chosen_model,
                        "messages_count": len(input_messages),
                    }
                    logger.error(f"OpenRouter API error {response.status_code}: {body_snippet[:500]}")
                    log_debug(2, "openrouter_api_error", error_details)

                    # Auto-fallback on OpenRouter policy blocks to alt model (single retry)
                    if not attempted_alt and chosen_model != self.model_alt and response.status_code in (403, 404) and ("data policy" in body_snippet.lower() or "no endpoints found" in body_snippet.lower()):
                        chosen_model = self.model_alt
                        attempted_alt = True
                        log_debug(2, "openrouter_retry_model", {"new_model": chosen_model})
                        continue

                # Raise if still not ok
                response.raise_for_status()
                break
            result = response.json()

            log_debug(2, "openrouter_full_response", {
                "model": result.get("model"),
                "usage": result.get("usage"),
                "output_type": type(result.get("output")).__name__,
            })

            # Extract output text (Responses API shape)
            text_content = ""
            # Some providers may include aggregated output_text at the root
            if isinstance(result, dict) and isinstance(result.get("output_text"), str):
                text_content = result.get("output_text") or ""
            output = result.get("output")
            if isinstance(output, dict):
                text_content = output.get("text") or ""
            elif isinstance(output, list) and output:
                for item in output:
                    if not isinstance(item, dict):
                        continue
                    text_candidate = item.get("text") or item.get("output_text")
                    if text_candidate:
                        text_content = text_candidate
                        break
                    content_blocks = item.get("content") or []
                    for block in content_blocks:
                        if isinstance(block, dict):
                            text_candidate = block.get("text") or block.get("output_text")
                            if text_candidate:
                                text_content = text_candidate
                                break
                    if text_content:
                        break

            # Fallback: OpenAI-style choices (if Responses format absent)
            if not text_content:
                choices = result.get("choices") or []
                if choices:
                    message = (choices[0].get("message") or {}) if isinstance(choices[0], dict) else {}
                    text_content = message.get("content") or ""
                    tool_calls = message.get("tool_calls")
                    if tool_calls:
                        log_debug(2, "openrouter_tool_calls", {
                            "tool_count": len(tool_calls),
                            "tools": [tc.get("function", {}).get("name") for tc in tool_calls if isinstance(tc, dict)],
                        })

            return text_content if text_content else "{}"

        except requests.RequestException as e:
            logger.error(f"OpenRouter API request error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {e}")
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
            "artifacts": [],  # Unified schema - replaces visualizations
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
            if result.get("artifacts"):  # Updated to unified artifacts field
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
            
            if "artifacts" not in result:  # Updated to unified artifacts field
                result["artifacts"] = []
            result["artifacts"].append(html_artifact)
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
        recovered_output = self._call_openrouter_llm(recovery_messages, self.model)
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


# Alias for backward compatibility
NoorOrchestrator = CognitiveOrchestrator
