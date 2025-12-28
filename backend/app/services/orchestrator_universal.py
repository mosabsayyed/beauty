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

import httpx
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

        # Core Secrets (STRICTLY ENV)
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

        # Initial refresh to populate all settings from admin_settings.json
        self._refresh_cached_settings()

        # Persona-specific MCP router URLs (STRICTLY FROM SETTINGS)
        # 1. Get the binding label from settings (e.g. noor -> "josoor-noor")
        # 2. Look up that label in the map
        bindings = self._admin_settings_cached.mcp.persona_bindings
        binding_label = bindings.get(self.persona) if bindings else None
        
        if not binding_label:
             raise ValueError(f"No MCP binding found for persona '{self.persona}' in Admin Settings")

        self.mcp_router_url = self._mcp_endpoint_map.get(binding_label)
        
        if not self.mcp_router_url:
            raise ValueError(f"MCP Endpoint label '{binding_label}' not found in Admin Settings endpoint list")

        # Track response IDs for stateful LM Studio conversations
        self._response_id_cache: Dict[str, str] = {}

        # Refresh cached settings from admin UI
        self._refresh_cached_settings()

        # Cache Tier-1 prompt at init time (NO per-request DB call)
        # This is loaded ONCE when orchestrator starts, not on every execute_query() call
        try:
            self._tier1_prompt_cached = load_tier1_bundle(persona=self.persona)
            self._tier1_loaded_at = datetime.now()
            logger.info(f"[INIT] Tier-1 prompt cached for persona '{persona}' at {self._tier1_loaded_at}")
        except Exception as e:
            logger.error(f"[INIT] Failed to cache Tier-1 prompt for persona '{persona}': {e}")
            self._tier1_prompt_cached = f"You are {persona.capitalize()}. Respond: 'System instructions unavailable.'"

    def _refresh_cached_settings(self):
        """Reload admin settings to pick up changes from the UI without restart."""
        # admin_settings_service now performs STRICT loading (no env merge)
        self._admin_settings_cached = admin_settings_service.merge_with_env_defaults()
        provider_config = self._admin_settings_cached.provider
        mcp_config = self._admin_settings_cached.mcp

        # Infrastructure
        self.api_endpoint = provider_config.openrouter_api_endpoint
        if not self.api_endpoint:
            raise ValueError("OPENROUTER_API_ENDPOINT missing in Admin Settings")

        self.local_llm_enabled = provider_config.local_llm_enabled
        self.local_llm_model = provider_config.local_llm_model
        self.local_llm_base_url = provider_config.local_llm_base_url
        self.local_llm_timeout = provider_config.local_llm_timeout

        # Models
        self.model_primary = provider_config.openrouter_model_primary
        self.model_fallback = provider_config.openrouter_model_fallback
        self.model_alt = provider_config.openrouter_model_alt
        
        if not self.model_primary:
             raise ValueError("Primary Model (openrouter_model_primary) missing in Admin Settings")
        
        # STRICT SETTINGS ENFORCEMENT
        # If Local is enabled, it IS the default model.
        if self.local_llm_enabled:
            self.model = self.local_llm_model
        else:
            self.model = self.model_primary

        # Re-build MCP endpoint lookup map
        self._mcp_endpoint_map = {}
        if mcp_config and mcp_config.endpoints:
            for endpoint in mcp_config.endpoints:
                self._mcp_endpoint_map[endpoint.label] = endpoint.url

        # Re-build model alias map
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

        # Default to primary unless explicitly overridden, OR if Local is the configured default
        if not override_key:
             # Use the default we established in _refresh_cached_settings (which respects local_llm_enabled)
             alias = "local" if self.local_llm_enabled else "primary"
        else:
             alias = synonyms.get(override_key, "primary")

        # STRICT ENFORCEMENT: No "magic" switching
        use_local = (alias == "local")
        
        if use_local and not self.local_llm_enabled:
            raise ValueError("Local LLM requested but 'local_llm_enabled' is FALSE in Admin Settings.")

        model_name = self._model_alias_map.get(alias, self.model_primary)

        if not use_local and not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable not set for OpenRouter request")

        return {
            "model_name": model_name,
            "alias": alias,
            "use_local": use_local,
        }

    async def execute_query(
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
        # 0. Reload settings to pick up UI changes (O(1) JSON load)
        self._refresh_cached_settings()

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
            cognitive_prompt = await self._build_cognitive_prompt()
            
            # 4. Build full prompt with history
            messages = self._build_messages(cognitive_prompt, user_query, history or [])
            
            # 5. Call OpenRouter LLM with MCP tools (single Responses API call)
            logger.info(f"[{session_id}] Calling OpenRouter LLM with MCP tools...")
            llm_response = await self._call_llm(messages, model_choice)
            
            # 6. Parse & validate JSON
            parsed_response = self._parse_llm_output(llm_response)
            
            # Track parse success for logging separation
            parse_success = self._is_valid_json_response(parsed_response)
            
            # 10. Return (Zero Magic Infrastructure)
            # ========================================================
            # OPTIONAL MAGIC (Commented out for Zero Fallback adherence)
            # ========================================================
            # # 7b. Deterministic safety net for empty results
            # parsed_response = self._apply_empty_result_guard(user_query, parsed_response)
            # 
            # # 8. Apply business language translation
            # parsed_response = self._apply_business_language(parsed_response)
            # 
            # # 9. Log metrics
            # self._log_metrics(session_id, parsed_response, user_query)
            # ========================================================

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


    
    async def _build_cognitive_prompt(self) -> str:
        """
        Build Tier 1 prompt (Step 0 + Step 5) using cached data with datetoday injection.
        
        Returns assembled Tier 1 prompt with dynamic date and user context prepended.
        
        CRITICAL FIX: This method is called from async execute_query, but get_tier1_prompt
        makes synchronous Supabase calls. We wrap it in asyncio.to_thread to prevent
        blocking the event loop (which causes instant httpx timeouts).
        """
        import asyncio
        
        today = datetime.now().strftime("%B %d, %Y")
        
        # Load Tier-1 fresh from DB (no bundle switching, optimized tier1 is now universal)
        # ASYNC FIX: Run blocking Supabase query in thread pool to avoid freezing event loop
        tier1_prompt = await asyncio.to_thread(
            get_tier1_prompt, 
            persona=self.persona, 
            use_cache=False
        )

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
    
    async def _call_llm(self, messages: List[Dict[str, str]], model_choice: Dict[str, Any]) -> str:
        """Route to OpenRouter or local LLM based on resolved model choice."""
        if model_choice.get("use_local"):
            return await self._call_local_llm(messages, model_choice.get("model_name"))
        return await self._call_openrouter_llm(messages, model_choice.get("model_name"))


    async def _call_local_llm(self, messages: List[Dict[str, str]], model_name: Optional[str]) -> str:
        """Call a local LLM via /v1/responses endpoint (async via httpx)."""
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

        use_responses = self._admin_settings_cached.provider.use_responses_api
        
        if use_responses:
            endpoint_url = self.local_llm_base_url.rstrip("/") + "/v1/responses"
            
            # OpenAI Responses API format
            # NOTE: LM Studio has a known bug (v0.3.30) where `instructions` field is IGNORED.
            # WORKAROUND: Embed system instructions into `input` field instead.
            # See: https://github.com/lmstudio-ai/lmstudio-bug-tracker (instructions not loaded)
            
            # Get the last user message as string input
            user_input = ""
            for msg in reversed(conversation_messages):
                if msg.get("role") == "user":
                    user_input = msg.get("content", "")
                    break
            
            # WORKAROUND: Embed system instructions into input since `instructions` is bugged
            system_prompt = "\n\n".join(system_instructions)
            full_input = f"[SYSTEM INSTRUCTIONS]\n{system_prompt}\n\n[USER QUERY]\n{user_input}"
            
            # Build payload
            payload = {
                "model": model_name or self.local_llm_model,
                "input": full_input,
                "tools": tools,
                "tool_choice": "auto"
            }
            # Add optional parameters if set
            if self._admin_settings_cached.provider.max_output_tokens:
                payload["max_output_tokens"] = self._admin_settings_cached.provider.max_output_tokens
            if self._admin_settings_cached.provider.temperature is not None:
                payload["temperature"] = self._admin_settings_cached.provider.temperature
        else:
            endpoint_url = self.local_llm_base_url.rstrip("/") + "/v1/chat/completions"
            # Standard OpenAI chat completions format with Structured Output enforcement
            chat_response_schema = {
                "name": "ChatResponse",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "mode": { "type": "string", "enum": ["DATA_MODE", "CONVERSATION_MODE"] },
                        "answer": { "type": "string" },
                        "insights": { "type": "array", "items": { "type": "string" } },
                        "reasoning_steps": { "type": "array", "items": { "type": "string" } },
                        "tool_calls": { "type": "array", "items": { "type": "object" } },
                        "memory_process": {
                            "type": "object",
                            "properties": {
                                "intent": { "type": "string" },
                                "thought_trace": { "type": "string" }
                            },
                            "required": ["intent", "thought_trace"],
                            "additionalProperties": False
                        },
                        "analysis": { "type": "array", "items": { "type": "string" } },
                        "evidence": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "claim": { "type": "string" },
                                    "source": { "type": "string" },
                                    "confidence": { "type": "number" }
                                },
                                "required": ["claim", "source", "confidence"],
                                "additionalProperties": False
                            }
                        },
                        "artifacts": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": { "type": "string", "enum": [
                                        "column", "line", "pie", "radar", "scatter", "bubble", "combo", "table", "html",
                                        "twin_knowledge", "excel", "markdown", "code", "media", "file", "json"
                                    ] },
                                    "title": { "type": "string" },
                                    "config": { "type": "object" },
                                    "data": { "type": ["string", "object", "array"] }
                                },
                                "required": ["type", "title"],
                                "additionalProperties": True
                            }
                        },
                        "data": {
                            "type": "object",
                            "properties": {
                                "query_results": { "type": "array" },
                                "summary_stats": { "type": "object" },
                                "diagnostics": { "type": "object" }
                            },
                            "required": ["query_results"],
                            "additionalProperties": True
                        },
                        "confidence": { "type": "number" },
                        "cypher_executed": { "type": "string" }
                    },
                    "required": ["mode", "answer", "artifacts", "memory_process", "data"],
                    "additionalProperties": False
                }
            }
            
            payload = {
                "model": model_name or self.local_llm_model,
                "messages": messages,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": chat_response_schema
                },
                "stream": False
            }
            if self._admin_settings_cached.provider.max_output_tokens:
                payload["max_tokens"] = self._admin_settings_cached.provider.max_output_tokens
            if self._admin_settings_cached.provider.temperature is not None:
                payload["temperature"] = self._admin_settings_cached.provider.temperature

        headers = {"Content-Type": "application/json"}

        try:
            log_debug(2, "local_llm_request", {
                "endpoint": endpoint_url,
                "model": payload.get("model"),
                "messages_count": len(conversation_messages),
                "max_tokens": payload.get("max_tokens"),
                "temperature": payload.get("temperature"),
                "mcp_server_label": tools[0].get("server_label") if tools else None,
                "mcp_server_url": tools[0].get("server_url") if tools else None
            })

            # RAW LOGGING: Request Payload
            log_debug(2, "local_llm_raw_request", {
                "url": endpoint_url,
                "payload": payload
            })

            # STRICT TIMEOUT CONFIGURATION
            # Separate connect timeout (10s) from read timeout (from settings)
            # This prevents instant failures from masquerading as read timeouts
            timeout_config = httpx.Timeout(
                connect=10.0,  # 10 seconds to establish TCP connection
                read=float(self.local_llm_timeout) if self.local_llm_timeout else 300.0,
                write=10.0,
                pool=1.0
            )

            try:
                async with httpx.AsyncClient(timeout=timeout_config) as client:
                    resp = await client.post(
                        endpoint_url,
                        headers=headers,
                        json=payload,
                    )
            except httpx.ConnectError as e:
                logger.error(f"Local LLM connection failed: {e}")
                raise ValueError(
                    f"Cannot connect to Local LLM at {endpoint_url}. "
                    f"Verify LM Studio is running and listening on {self.local_llm_base_url}"
                ) from e
            except httpx.ReadTimeout as e:
                logger.error(f"Local LLM read timeout after {self.local_llm_timeout}s: {e}")
                raise ValueError(
                    f"Local LLM did not respond within {self.local_llm_timeout} seconds. "
                    f"Increase 'local_llm_timeout' in Admin Settings or check LM Studio logs."
                ) from e
            except httpx.HTTPStatusError as e:
                # LM Studio returned an error (e.g., 500 if endpoint/format is wrong)
                error_body = e.response.text[:1000] if e.response else "No response body"
                logger.error(f"Local LLM HTTP error {e.response.status_code}: {error_body}")
                
                if e.response.status_code == 500:
                    raise ValueError(
                        f"LM Studio returned 500 Internal Server Error. "
                        f"This usually means the endpoint or request format is unsupported. "
                        f"Try setting 'use_responses_api: false' in Admin Settings to use /v1/chat/completions instead. "
                        f"Error details: {error_body}"
                    ) from e
                raise
            
            # RAW LOGGING: Response Content
            log_debug(2, "local_llm_raw_response", {
                "status_code": resp.status_code,
                "content": resp.text
            })
            if resp.status_code != 200:
                log_debug(2, "local_llm_error", {
                    "status_code": resp.status_code,
                    "response_body": resp.text[:1000],
                    "model": payload.get("model"),
                    "endpoint": endpoint_url,
                })
            resp.raise_for_status()
            data = resp.json()

            # Extract output text (Responses API shape)
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

            # Fallback for standard OpenAI Chat Completions format
            if not text_content:
                choices = data.get("choices", [])
                if choices and isinstance(choices[0], dict):
                    message = choices[0].get("message", {})
                    if isinstance(message, dict):
                        text_content = message.get("content") or ""

            log_debug(2, "local_llm_response", {
                "status_code": resp.status_code,
                "response_length": len(text_content) if text_content else 0,
                "response_snippet": text_content[:300] if text_content else "<empty>"
            })

            return text_content if text_content else "{}"
        except Exception as exc:
            logger.error(f"Local LLM call failed: {exc}")
            raise

    async def _call_openrouter_llm(self, messages: List[Dict[str, str]], model_name: Optional[str] = None) -> str:
        """Call OpenRouter Responses API with MCP tool definitions (async via httpx)."""
        if not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is required for OpenRouter requests")
        # Use endpoint EXACTLY as specified in settings (Zero Magic)
        api_endpoint = (self.api_endpoint or "").strip()
        if not api_endpoint:
             raise ValueError("OpenRouter API Endpoint missing in Admin Settings")

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
                        "tier": {"type": "string", "enum": ["data_mode_definitions", "elements"], "description": "Mandatory tier selection"},
                        "mode": {"type": "string", "description": "Interaction mode (A-J)"},
                        "elements": {"type": "array", "items": {"type": "string"}, "description": "Specific atomic elements (only for tier='elements')"}
                    },
                    "required": ["tier"]
                }
            },
            {
                "type": "function",
                "name": "read_neo4j_cypher",
                "description": "Execute read-only Cypher query with optional parameters",
                "strict": None,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "cypher_query": {"type": "string", "description": "The Cypher query to run"},
                        "parameters": {"type": "object", "description": "Query parameters mapping"}
                    },
                    "required": ["cypher_query"]
                }
            }
        ]

        request_payload = {
            "model": model_name or self.model,
            "input": input_messages,
            "tools": tools,
            "tool_choice": "auto"
        }
        
        # Use settings EXACTLY (Zero Fallback)
        if self._admin_settings_cached.provider.max_output_tokens:
            request_payload["max_output_tokens"] = self._admin_settings_cached.provider.max_output_tokens
        if self._admin_settings_cached.provider.temperature is not None:
            request_payload["temperature"] = self._admin_settings_cached.provider.temperature

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

                # RAW LOGGING: Request Payload
                log_debug(2, "openrouter_raw_request", {
                    "url": api_endpoint if 'api_endpoint' in locals() else self.api_endpoint,
                    "payload": request_payload
                })

                # Send
                request_payload["model"] = chosen_model
                async with httpx.AsyncClient(timeout=300) as client:
                    response = await client.post(
                        api_endpoint if 'api_endpoint' in locals() else self.api_endpoint,
                        headers=headers,
                        json=request_payload,
                    )
                
                # RAW LOGGING: Response Content
                log_debug(2, "openrouter_raw_response", {
                    "status_code": response.status_code,
                    "content": response.text
                })

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
            # Prefer 'artifacts' over 'visualizations'
            if "artifacts" in parsed_json:
                result["artifacts"] = parsed_json["artifacts"]
            elif "visualizations" in parsed_json:
                result["artifacts"] = parsed_json["visualizations"]
            
            # Support rich reasoning/tooling fields for observability
            for key in ["memory_process", "data", "analysis", "cypher_executed", "confidence", "reasoning_steps", "tool_calls"]:
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
        
        return result
    
    def _is_valid_json_response(self, response: Dict[str, Any]) -> bool:
        """
        Validate JSON response structure.
        
        Checks for required keys: memory_process, answer.
        """
        required_keys = ["memory_process", "answer"]
        return all(key in response for key in required_keys)
    

    

    # ==============================================================================
    # LEGACY / MAGIC METHODS (Commented out for Zero Fallback Protocol)
    # ==============================================================================
    # def _apply_empty_result_guard(self, user_query: str, response: Dict[str, Any]) -> Dict[str, Any]:
    #     """Safety net to prevent false "no data" outputs when data exists."""
    #     try:
    #         if not isinstance(response, dict): return response
    #         mode = response.get("mode")
    #         if mode not in ["DATA_MODE", "A"]: return response
    #         data = response.get("data")
    #         if not isinstance(data, dict):
    #             data = {"query_results": [], "summary_stats": {}, "diagnostics": {}}
    #             response["data"] = data
    #         query_results = data.get("query_results")
    #         needs_validation = not query_results
    #         if not needs_validation: return response
    #         query_plan = data.get("query_plan", {})
    #         primary_label = query_plan.get("primary_label", "EntityProject")
    #         query_lower = (user_query or "").lower()
    #         year, quarter = self._extract_year_and_quarter(query_lower)
    #         if not year or not quarter: return response
    #         if not neo4j_client.connect(): return response
    #         exact_rows = neo4j_client.execute_query(
    #             f"MATCH (n:{primary_label}) WHERE n.year = $year AND n.quarter = $quarter RETURN count(n) AS exact_count",
    #             {"year": year, "quarter": quarter},
    #         )
    #         exact_count = int(exact_rows[0].get("exact_count", 0)) if exact_rows else 0
    #         if exact_count > 0:
    #             fallback_query = f"MATCH (n:{primary_label}) WHERE n.year = $year AND n.quarter = $quarter RETURN n LIMIT 100"
    #             rows = neo4j_client.execute_query(fallback_query, {"year": year, "quarter": quarter})
    #             if rows:
    #                 data["query_results"] = [dict(r['n']) for r in rows]
    #                 response["cypher_executed"] = fallback_query
    #         return response
    #     except Exception as e:
    #         log_debug(2, "empty_result_guard_failed", {"error": str(e)})
    #         return response
    #
    # def _extract_year_and_quarter(self, query_lower: str) -> tuple[Optional[int], Optional[int]]:
    #     year_match = re.search(r"\b(20\d{2})\b", query_lower)
    #     quarter_match = re.search(r"\bq([1-4])\b", query_lower)
    #     year = int(year_match.group(1)) if year_match else None
    #     quarter = int(quarter_match.group(1)) if quarter_match else None
    #     return year, quarter
    #
    # def _auto_recover(self, messages: List[Dict[str, str]], invalid_response: str) -> Dict[str, Any]:
    #     """Auto-recovery: Re-invoke LLM with correction prompt."""
    #     correction_prompt = f"The previous output was invalid JSON. Fix it: {invalid_response}"
    #     recovery_messages = messages + [{"role": "assistant", "content": invalid_response}, {"role": "user", "content": correction_prompt}]
    #     recovered_output = self._call_openrouter_llm(recovery_messages, self.model)
    #     return self._parse_llm_output(recovered_output)
    #
    # def _apply_business_language(self, response: Dict[str, Any]) -> Dict[str, Any]:
    #     """Apply business language translation rules."""
    #     if "answer" in response and isinstance(response["answer"], str):
    #         answer = response["answer"]
    #         replacements = {r'\bNode\b': 'Entity', r'\bCypher\b': 'Query', r'\bID\b': 'Identifier'}
    #         for pattern, replacement in replacements.items():
    #             answer = re.sub(pattern, replacement, answer, flags=re.IGNORECASE)
    #         response["answer"] = answer
    #     return response
    #
    # def _log_metrics(self, session_id: str, response: Dict[str, Any], query: str):
    #     """Log orchestration metrics."""
    #     confidence = response.get("confidence", 0.0)
    #     cypher = response.get("cypher_executed", None)
    #     logger.info(f"[{session_id}] Metrics: query_len={len(query)}, confidence={confidence:.2f}, cypher={'Yes' if cypher else 'No'}")

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
