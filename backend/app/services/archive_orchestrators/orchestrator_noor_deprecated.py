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

# Configure logging
logger = logging.getLogger(__name__)

# Import debug logger (same as zero-shot)
from app.utils.debug_logger import log_debug

# Import Tier 1 assembler
from app.services.tier1_assembler import get_tier1_prompt, get_tier1_token_count

# Import Admin Settings for dynamic config
from app.services.admin_settings_service import admin_settings_service

# Import tracing utilities
from app.utils.tracing import (
    trace_operation,
    trace_llm_call,
    trace_mcp_call,
    add_span_event,
    set_span_attributes,
    set_span_error
)

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

ERROR: Tier 1 prompt failed to load from database. Operating in fallback mode.
    D (Planning): What-if, hypothetical scenarios grounded in data.

[No Data]
    E (Clarification): Clarification without new data.
    F (Exploratory): Brainstorming, hypothetical scenarios.
    G (Acquaintance): Questions about Noor's role and functions.
    H (Learning): Explanations of transformation concepts, ontology, or relations.
    I (Social/Emotional): Greetings, frustration.
    J (Underspecified): Ambiguous parameters, needs clarification.

CONDITIONAL ROUTING

IF mode in (A, B, C, D):
- Step 1: Call retrieve_instructions(tier="data_mode_definitions") to load Tier 2
- Step 1 (end): Decide which Tier 3 elements are needed, then make ONE call retrieve_instructions(tier="elements", elements=[...])
- Step 2: Construct Cypher using Tier 2 rules + fetched Tier 3
- Step 3: Execute read_neo4j_cypher (up to 3 calls for complex)
- Step 4: Reconcile results vs ask (patterns, trends, gaps)
- Step 5: Return JSON (business language, confidence)

ELSE (mode in E, F, G, H, I, J):
- Execute directly with Tier 1 only (no Tier 2/3 calls)
- May optionally call recall_memory(scope="personal", query_summary="...")
- Then go to Step 5

MEMORY ACCESS RULES (READ-ONLY)
- Allowed scopes: personal, departmental, ministry. Secrets scope is not exposed to Noor.
- recall_memory(scope, query_summary, limit) is optional; no write/save operations.

FORBIDDEN CONFABULATIONS (E-J)
- Do not invent technical limitations or unavailable tools.
- If information is missing, state it plainly.

MINDSET (All Modes)
- Always supportive, eager to help
- Vested in agency success through staff success
- Listen with intent, empathy, genuine understanding
- Offer best advice based on factual data
- Bias for action: Make professional choices; avoid minor clarification loops

TEMPORAL LOGIC
Today is <datetoday>. All records timestamped with quarters/years.
- Future start date = Planned (0% regardless of stored value)
- Past start date = Active or Closed (based on progress_percentage)
- Delays = Expected progress vs actual progress

STEP 5: RETURN (Shared Exit)
- Restate intent in business language.
- Synthesize answer; weave in gaps/limitations.
- Insights array: concise patterns/trends/implications.
- Data block: query_results + summary_stats (leave empty for E-J).
- Visualization: at most one chart/table from chart_type definitions; gaps → table.
- Business language guardrail: avoid Cypher/Node/Level jargon; use translation table.
- Confidence: base by mode (A 0.95, B 0.90, C 0.92, D 0.88, E/F 0.90, G/H/I/J 0.88) with adjustments (-0.10 critical gaps, -0.05 indirect inference, +0.02 multi-source); clamp [0.60, 0.99].

OUTPUT FORMAT (All Modes)
{
    "memory_process": {
        "intent": "User intent"
    },
    "answer": "Business-language narrative",
    "analysis": ["Insight 1", "Insight 2"],
    "data": {
    "query_results": [...],
    "summary_stats": {...}
  },
  "visualizations": [],
  "cypher_executed": "MATCH...",
  "confidence": 0.95
}

VISUALIZATION TYPE ENUMERATION (CLOSED SET)
Valid types are: column, line, pie, radar, scatter, bubble, combo, table, html (lowercase only).
NO other types permitted.

CRITICAL RULES
- NO streaming. Synchronous responses only.
- NO comments in JSON. Strict valid JSON.
- Trust tool results. Do NOT re-query to verify.
- Business language only. Never mention: Node, Cypher, L3, ID, Query, Embedding.
- HTML FORMATTING: When generating HTML responses, use proper HTML elements (<p>, <br>, <ul>, <li>, <table>) for structure. AVOID raw newline characters (\\n) in HTML - use <br> or <p> tags instead. Keep HTML clean and well-structured for display.

"""


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
                "server_url": self.mcp_router_url,
                "require_approval": "never"  # CRITICAL: allows Groq to execute tools server-side
            }
        ]

        # Local LLM settings (dynamic from admin settings)
        dynamic_settings = admin_settings_service.merge_with_env_defaults()
        provider_config = dynamic_settings.provider

        self.local_llm_enabled = provider_config.local_llm_enabled
        self.local_llm_model = provider_config.local_llm_model
        self.local_llm_base_url = provider_config.local_llm_base_url
        self.local_llm_timeout = provider_config.local_llm_timeout
    
    def execute_query(
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
        with trace_operation(
            "orchestrator.execute_query",
            attributes={
                "session_id": session_id,
                "persona": self.persona,
                "query_length": len(user_query),
                "history_length": len(history) if history else 0
            }
        ) as span:
            try:
                # 1. Input validation
                if not user_query or not user_query.strip():
                    add_span_event("empty_query_detected")
                    return self._error_response("Empty query")
                
                # 2. Fast-path greeting detection (Step 0 pre-filter)
                greeting_response = self._check_fast_path_greeting(user_query)
                if greeting_response:
                    logger.info(f"[{session_id}] Fast-path greeting triggered")
                    add_span_event("fast_path_greeting", {"query": user_query})
                    set_span_attributes({"fast_path": True})
                    return greeting_response
                
                # 3. Load cognitive_cont bundle with datetoday injection
                with trace_operation("orchestrator.load_tier1", attributes={"persona": self.persona}):
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
                
                with trace_llm_call(
                    model=self.local_llm_model if self.local_llm_enabled else self.model,
                    prompt=user_query,
                    persona=self.persona,
                    temperature=0.2
                ) as llm_span:
                    if self.local_llm_enabled:
                         llm_response = self._call_local_llm(messages, self.local_llm_model)
                    else:
                         llm_response = self._call_groq_llm(messages)
                    
                    if llm_span:
                        llm_span.set_attribute("llm.response_length", len(llm_response) if llm_response else 0)
                
                # Log raw LLM response for debugging
                log_debug(2, "llm_raw_response", {
                    "session_id": session_id,
                    "response_length": len(llm_response) if llm_response else 0,
                    "response_snippet": (llm_response[:500] if llm_response else "<empty>"),
                    "full_response": llm_response
                })
                
                # 6. Parse & validate JSON
                with trace_operation("orchestrator.parse_response"):
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
                    add_span_event("auto_recovery_triggered")
                    parsed_response = self._auto_recover(messages, llm_response)
                
                # 8. Apply business language translation
                with trace_operation("orchestrator.apply_business_language"):
                    parsed_response = self._apply_business_language(parsed_response)
                
                # 9. Log metrics
                self._log_metrics(session_id, parsed_response, user_query)
                
                # Set final attributes
                set_span_attributes({
                    "confidence": parsed_response.get("confidence", 0),
                    "has_visualizations": bool(parsed_response.get("visualizations")),
                    "success": True
                })
                
                # 10. Return
                return parsed_response
                
            except Exception as e:
                logger.error(f"[{session_id}] Orchestrator error: {e}", exc_info=True)
                if span:
                    set_span_error(e)
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
    
    def _build_cognitive_prompt(self) -> str:
        """
        Build Tier 1 prompt (Step 0 + Step 5) from database with persona and datetoday injection.
        
        Returns assembled Tier 1 prompt with dynamic date and persona.
        """
        today = datetime.now().strftime("%B %d, %Y")
        tier1_prompt = load_tier1_bundle(persona=self.persona)
        return tier1_prompt.replace("<datetoday>", today)
    
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
    
    def _call_local_llm(self, messages: List[Dict[str, str]], model_name: Optional[str]) -> str:
        """Call a local LLM via /v1/responses endpoint."""
        # Convert messages to Responses API input format
        conversation_messages = []
        for msg in messages:
            role = (msg.get("role") or "user").strip()
            content_text = msg.get("content") or ""
            conversation_messages.append({
                "type": "message",
                "role": role,
                "content": [
                    {
                        "type": "input_text",
                        "text": content_text
                    }
                ]
            })

        # LM Studio MCP tools format for /v1/responses endpoint
        tools = []
        if self.persona == "noor":
            tools = [{
                "type": "mcp",
                "server_label": "josoor-noor",
                "server_url": self.mcp_router_url,
                "allowed_tools": ["recall_memory", "retrieve_instructions", "read_neo4j_cypher"]
            }]
        elif self.persona == "maestro":
            tools = [{
                "type": "mcp",
                "server_label": "maestro",
                "server_url": self.mcp_router_url,
                "allowed_tools": ["recall_memory", "retrieve_instructions", "read_neo4j_cypher"]
            }]

        endpoint_url = self.local_llm_base_url.rstrip("/") + "/v1/responses"

        payload = {
            "model": model_name or self.local_llm_model,
            "input": conversation_messages,
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

    def _call_groq_llm(self, messages: List[Dict[str, str]]) -> str:
        """
        Call Groq LLM with MCP tool definitions using HTTP-based /v1/responses endpoint.
        
        This endpoint allows server-side tool execution - Groq calls the MCP router,
        not the client.
        
        Returns raw LLM output (text-based JSON).
        """
        # Build the request payload using Groq's /v1/responses format
        # The Groq API expects a single "input" string, not a messages array
        # Construct the full prompt from messages
        prompt_parts = []
        
        for msg in messages:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            if role == "SYSTEM":
                # System message becomes the beginning of the prompt
                prompt_parts.insert(0, content)
            else:
                # User/Assistant messages are added in order
                prompt_parts.append(f"<{role}>\n{content}\n</{role}>")
        
        full_input = "\n\n".join(prompt_parts)
        
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
            
            response.raise_for_status()
            
            result = response.json()
            
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
