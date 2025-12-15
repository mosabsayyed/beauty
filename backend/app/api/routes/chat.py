# backend/app/api/routes/chat.py
"""
Chat API Routes - Noor Cognitive Digital Twin

Supports both v2.x (OrchestratorZeroShot) and v3.0 (OrchestratorV3) orchestrators.
Version selection via environment variable: ORCHESTRATOR_VERSION=v2|v3
Default: v2 (for backward compatibility)
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
import json
import os
from app.db.supabase_client import supabase_client
from app.services.supabase_conversation_manager import SupabaseConversationManager
from app.services.orchestrator_universal import CognitiveOrchestrator, NoorOrchestrator
from app.services.sql_executor import SQLExecutorService, get_sql_executor_service
import asyncio
from app.utils.debug_logger import init_debug_logger
from app.utils.auth_utils import get_current_user, get_optional_user
from app.services.user_service import User

router = APIRouter()

# =============================================================================
# ORCHESTRATOR VERSION FACTORY
# =============================================================================

# Version selection: v2 (legacy), v3 (new Single-Call MCP), v3.2 (agentic)
ORCHESTRATOR_VERSION = os.getenv("ORCHESTRATOR_VERSION", "v2").lower()

# Lazy orchestrator instances to avoid import-time environment variable errors
_orchestrator_v3_instance = None  # Type hint avoided for lazy import
_orchestrator_noor_instance = None  # Noor v3.2 agentic
_orchestrator_maestro_instance = None  # Maestro v3.2 agentic

def get_orchestrator_instance(persona_name: str = None):
    """
    Factory function to get the appropriate orchestrator based on version and persona.
    
    Persona-based routing (v3.2+):
    - persona='noor' → NoorAgenticOrchestrator (staff operations)
    - persona='maestro' → MaestroOrchestrator (executive, MORE privileges)
    - else → version-based fallback
    
    Version-based fallback:
    - ORCHESTRATOR_VERSION=v3 → OrchestratorV3
    - ORCHESTRATOR_VERSION=v2 → OrchestratorZeroShot (default)
    """
    global _orchestrator_v2_instance, _orchestrator_v3_instance
    global _orchestrator_noor_instance, _orchestrator_maestro_instance
    
    # Persona-based routing for v3.2+
    if persona_name == 'noor':
        if _orchestrator_noor_instance is None:
            _orchestrator_noor_instance = CognitiveOrchestrator(persona="noor")
        return _orchestrator_noor_instance
    
    elif persona_name == 'maestro':
        if _orchestrator_maestro_instance is None:
            _orchestrator_maestro_instance = CognitiveOrchestrator(persona="maestro")
        return _orchestrator_maestro_instance
    
    # Version-based fallback - always use v3
    if _orchestrator_v3_instance is None:
        _orchestrator_v3_instance = CognitiveOrchestrator(persona="noor")
    return _orchestrator_v3_instance



async def get_conversation_manager() -> SupabaseConversationManager:
    """Dependency to get Supabase conversation manager"""
    await supabase_client.connect()
    return SupabaseConversationManager(supabase_client)




class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "transformation_analyst"
    # Optional conversation history (used for guest-mode queries; list of role/content dicts)
    history: Optional[List[Dict[str, str]]] = None
    push_to_graph_server: Optional[bool] = False
    file_ids: Optional[List[str]] = None  # NEW: Accept file IDs


class Artifact(BaseModel):
    artifact_type: str  # CHART, TABLE, REPORT, DOCUMENT
    title: str
    content: dict
    description: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message: str
    answer: Optional[str] = None
    visualization: Optional[dict] = None
    insights: List[str] = []  # Changed from List[dict] to List[str]
    artifacts: List[Artifact] = []  # Changed to list for multiple artifacts
    clarification_needed: Optional[bool] = False
    clarification_questions: Optional[List[str]] = []
    clarification_context: Optional[str] = None
    memory_process: Optional[dict] = None
    tool_results: Optional[List[dict]] = []
    # Optional fields for the canonical LLM JSON block (evidence gating + diagnostics)
    mode: Optional[str] = None
    data: Optional[dict] = None
    evidence: Optional[List[dict]] = None
    cypher_executed: Optional[str] = None
    cypher_params: Optional[dict] = None
    confidence: Optional[float] = None
    raw_response: Optional[dict] = None


class ConversationSummary(BaseModel):
    id: int
    title: str
    message_count: int
    created_at: str
    updated_at: str


class ConversationListResponse(BaseModel):
    conversations: List[ConversationSummary]


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str
    metadata: Optional[dict] = None


class ConversationDetailResponse(BaseModel):
    conversation: dict
    messages: List[MessageResponse]





@router.post("/conversations/{conversation_id}/messages")
async def post_conversation_message(
    conversation_id: int,
    payload: dict,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager),
    current_user: User = Depends(get_current_user),
):
    """Persist an assistant (or other) message into the conversation."""
    try:
        role = payload.get("role", "assistant")
        content = payload.get("content", "")
        metadata = payload.get("metadata", {})

        # Verify ownership of the conversation before writing
        conv = await conversation_manager.get_conversation(conversation_id, current_user.id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")

        await conversation_manager.add_message(conversation_id, role, content, metadata)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message")
async def send_message(
    request: ChatRequest,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Send message and get AI response with conversation memory
    
    This endpoint:
    1. Creates new conversation OR continues existing one
    2. Stores user message
    3. Processes query through 4-layer agent WITH CONTEXT
    4. Stores agent response
    5. Returns response with conversation_id
    """
    # Use authenticated user if present; otherwise treat as guest
    user_id = current_user.id if current_user else None
    
    # =================================================================
    # ROLE-BASED ROUTING: staff → Noor, exec → Maestro
    # =================================================================
    user_role = current_user.role if current_user and hasattr(current_user, 'role') else 'user'
    
    # Override persona based on role (using existing 'persona' field)
    persona_name = request.persona  # Default from request
    if user_role == 'staff':
        persona_name = 'noor'  # Staff always uses Noor
    elif user_role == 'exec':
        persona_name = 'maestro'  # Execs always use Maestro
    
    try:
        # Get or create conversation (only when authenticated)
        if request.conversation_id and user_id is not None:
            # Verify conversation exists and belongs to user
            conversation = await conversation_manager.get_conversation(
                request.conversation_id,
                user_id
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation_id = request.conversation_id
        elif user_id is not None:
            # Create new conversation for authenticated user
            conversation = await conversation_manager.create_conversation(
                user_id,
                request.persona or "transformation_analyst",
                request.query[:50] + ("..." if len(request.query) > 50 else "")
            )
            if not conversation:
                raise HTTPException(status_code=500, detail="Failed to create conversation")
            conversation_id = conversation['id']
        else:
            # Guest path: no persistence; conversation_id remains None
            conversation = None
            conversation_id = None
        
        # Initialize debug logger AFTER we have the real conversation_id (or 'guest')
        debug_logger = init_debug_logger(str(conversation_id if conversation_id is not None else 'guest'))
        
        # Build conversation context BEFORE storing current message
        # For authenticated users, load stored context from DB; for guests, use provided history (if any)
        if conversation_id is not None:
            conversation_context = await conversation_manager.build_conversation_context(
                conversation_id,
                10
            )
        else:
            conversation_context = request.history or []
        
        # Store user message AFTER building context (only if authenticated)
        if user_id is not None and conversation_id is not None:
            await conversation_manager.add_message(
                conversation_id,
                "user",
                request.query,
                {"persona": request.persona}
            )
        
        # Build file metadata (if files attached)
        file_metadata = None
        if request.file_ids:
            from app.api.routes.files import temp_files
            
            file_metadata = []
            for file_id in request.file_ids:
                if file_id in temp_files:
                    file_info = temp_files[file_id]
                    # Verify user owns this file (skip check for guest users)
                    if user_id is None or file_info["user_id"] == user_id:
                        file_metadata.append({
                            "file_id": file_id,
                            "filename": file_info["original_filename"],
                            "mime_type": file_info["mime_type"],
                            "size_mb": file_info["size"] / (1024 * 1024)
                        })
            
            # If no valid files found, set to None
            if not file_metadata:
                file_metadata = None
        
        # =================================================================
        # ORCHESTRATOR EXECUTION (Persona & Version-aware)
        # =================================================================
        # Get orchestrator based on persona (for v3.2) or version (fallback)
        orchestrator = get_orchestrator_instance(persona_name=persona_name)
        
        # Detect orchestrator type for execution
        orchestrator_type = type(orchestrator).__name__
        
        # v3.2 Agentic (Noor/Maestro) - synchronous with session_id
        if orchestrator_type in ["CognitiveOrchestrator", "NoorOrchestrator"]:
            session_id = str(conversation_id) if conversation_id else "guest"
            llm_response = orchestrator.execute_query(
                user_query=request.query,
                session_id=session_id,
                history=conversation_context,  # Note: history not conversation_history
                user_id=user_id  # Pass authenticated user ID for memory isolation
            )
        # v3.0 Single-Call MCP Architecture (deprecated) - now synchronous
        elif orchestrator_type == "NoorV3Orchestrator":
            session_id = str(conversation_id) if conversation_id else "guest"
            llm_response = orchestrator.execute_query(
                user_query=request.query,
                session_id=session_id,
                history=conversation_context,
                user_id=user_id  # Pass authenticated user ID for memory isolation
            )
        else:
            # v2.x Legacy synchronous orchestrator
            llm_response = orchestrator.execute_query(
                user_query=request.query,
                conversation_history=conversation_context,
                file_metadata=file_metadata,
            )

        # Log LLM request and response
        debug_logger.log_event("llm_request", {
            "history": conversation_context,
            "question": request.query,
            "conversation_id": conversation_id,
            "orchestrator_version": ORCHESTRATOR_VERSION
        })
        debug_logger.log_event("llm_response", llm_response)

        # Extract the mandated structured block produced by the LLM (if present)
        # Primary extraction path: raw_response.output -> find item.type=='message' -> content[*].text or output_text
        llm_payload = None
        try:
            raw_resp = llm_response.get('raw_response') if isinstance(llm_response, dict) else None
            if raw_resp and isinstance(raw_resp, dict):
                outputs = raw_resp.get('output') or []
                for item in outputs:
                    try:
                        if item and item.get('type') == 'message' and isinstance(item.get('content'), list):
                            for block in item.get('content'):
                                txt = None
                                if isinstance(block, dict):
                                    txt = block.get('text') or block.get('output_text') or block.get('content')
                                elif isinstance(block, str):
                                    txt = block
                                if isinstance(txt, str):
                                    # Attempt to parse the JSON string inside the block
                                    try:
                                        cand = json.loads(txt)
                                        if isinstance(cand, dict):
                                            llm_payload = cand
                                            break
                                    except Exception:
                                        # try to extract first {...} substring and parse
                                        import re
                                        m = re.search(r"\{[\s\S]*\}", txt)
                                        if m:
                                            try:
                                                cand = json.loads(m.group(0))
                                                if isinstance(cand, dict):
                                                    llm_payload = cand
                                                    break
                                            except Exception:
                                                pass
                            if llm_payload:
                                break
                    except Exception:
                        continue

            # If not found, check top-level llm_response for a structured payload string
            if not llm_payload and isinstance(llm_response, dict):
                # Often orchestrator may place the structured block in llm_response['message'] or llm_response['answer'] as a JSON string
                for key in ('message', 'answer'):
                    val = llm_response.get(key)
                    if isinstance(val, str):
                        try:
                            cand = json.loads(val)
                            if isinstance(cand, dict):
                                llm_payload = cand
                                break
                        except Exception:
                            import re
                            m = re.search(r"\{[\s\S]*\}", val)
                            if m:
                                try:
                                    cand = json.loads(m.group(0))
                                    if isinstance(cand, dict):
                                        llm_payload = cand
                                        break
                                except Exception:
                                    pass

        except Exception:
            llm_payload = None

        # Prepare content to store: prefer the canonical llm_payload (stringified) when available
        try:
            if isinstance(llm_payload, dict):
                content_to_store = json.dumps(llm_payload)
            else:
                # Fallback: store the stringified full llm_response
                content_to_store = json.dumps(llm_response)
        except Exception:
            try:
                content_to_store = str(llm_payload or llm_response)
            except Exception:
                content_to_store = ''

        # Persist assistant message: content is the canonical structured block (string), metadata keeps raw_response for traceability (only if authenticated)
        # UPDATE: Prune heavy fields from metadata before storage to avoid DB bloat and slow reads
        metadata_to_store = llm_response.copy() if isinstance(llm_response, dict) else {'raw': str(llm_response)}
        if isinstance(metadata_to_store, dict):
            for key in ['raw_response', 'history', 'context']:
                if key in metadata_to_store:
                    del metadata_to_store[key]

        if user_id is not None and conversation_id is not None:
            await conversation_manager.add_message(
                conversation_id,
                'assistant',
                content_to_store,
                metadata_to_store
            )

        # Build response payload: include conversation_id, the llm_payload (if found) as-is
        response_payload = {'conversation_id': conversation_id}
        if isinstance(llm_payload, dict):
            response_payload['llm_payload'] = llm_payload
        else:
            # no structured block found; return the full parsed llm_response as the payload
            # The orchestrator.execute_query returns a normalized dict, so we should use it directly.
            response_payload['llm_payload'] = llm_response
        
        # Attach raw_response only if strictly necessary (e.g. debugging), otherwise omit to save bandwidth
        # response_payload['raw_response'] = llm_response.get('raw_response') if isinstance(llm_response, dict) else llm_response


        # If requested, push summary to graph server
        if request.push_to_graph_server:
            try:
                # Determine what text to push
                summary_text = ""
                
                # Check for HTML visualization first
                html_content = None
                visualizations = []
                
                if isinstance(llm_payload, dict):
                    visualizations = llm_payload.get('visualizations') or []
                elif isinstance(llm_response, dict):
                    visualizations = llm_response.get('visualizations') or []
                    
                for viz in visualizations:
                    if isinstance(viz, dict):
                        viz_type = str(viz.get('type', '')).lower()
                        if viz_type == 'html':
                            html_content = viz.get('content')
                            break
                
                if html_content:
                    summary_text = html_content
                elif isinstance(llm_payload, dict):
                    # If it's a structured payload, try to find a summary or message
                    summary_text = llm_payload.get('summary') or llm_payload.get('message') or llm_payload.get('answer') or json.dumps(llm_payload)
                elif isinstance(llm_response, dict):
                    summary_text = llm_response.get('answer') or llm_response.get('message') or json.dumps(llm_response)
                else:
                    summary_text = str(llm_response)
                
                if summary_text:
                    print(f"DEBUG: Pushing summary to graph server. Length: {len(summary_text)}")
                    print(f"DEBUG: Summary preview: {summary_text[:100]}...")
                    import httpx
                    async with httpx.AsyncClient() as client:
                        resp = await client.post(
                            "http://localhost:3001/api/update-summary",
                            json={"summary": summary_text},
                            timeout=5.0
                        )
                        print(f"DEBUG: Push response: {resp.status_code} {resp.text}")
                        response_payload['graph_server_debug'] = {
                            'pushed': True,
                            'status': resp.status_code,
                            'summary_length': len(summary_text),
                            'visualizations_count': len(visualizations),
                            'extraction_source': 'html_viz' if html_content else 'payload_fallback'
                        }
                else:
                    print("DEBUG: No summary_text found to push.")
                    response_payload['graph_server_debug'] = {
                        'pushed': False,
                        'reason': 'no_summary_text_found',
                        'prevented_viz': [str(v.get('type')) for v in visualizations] if visualizations else [],
                        'llm_payload_keys': list(llm_payload.keys()) if isinstance(llm_payload, dict) else str(type(llm_payload))
                    }

            except Exception as e:
                print(f"Failed to push summary to graph server: {e}")
                import traceback
                traceback.print_exc()
                response_payload['graph_server_debug'] = {
                    'pushed': False,
                    'error': str(e)
                }

        return response_payload

    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"orchestrator_zero_shot_error: {str(e)}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")

        # Print to stdout for debugging - DISABLED to reduce clutter
        # print(f"\n{'='*80}")
        # print(f"ORCHESTRATOR ERROR")
        # print(f"{'='*80}")
        # print(f"Error: {str(e)}")
        # print(f"\nFull Traceback:")
        # print(traceback.format_exc())
        # print(f"{'='*80}\n")

        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    """List all conversations for current user"""
    try:
        conversations = await conversation_manager.list_conversations(
            user_id=current_user.id,
            limit=limit
        )
        
        # Avoid performing an N+1 query for messages here (can be very expensive).
        # Instead, return the conversation list and use a stored `message_count`
        # field when available. This is a safe, fast fallback — frontend can
        # request message lists for a specific conversation when needed.
        summaries = []
        for conv in conversations:
            msg_count = conv.get('message_count') or 0
            summaries.append(ConversationSummary(
                id=conv['id'],
                title=conv.get('title') or "",
                message_count=msg_count,
                created_at=conv.get('created_at') or '',
                updated_at=conv.get('updated_at') or ''
            ))
        
        return ConversationListResponse(conversations=summaries)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager),
    current_user: User = Depends(get_current_user),
):
    """Get conversation with all messages"""
    try:
        conversation = await conversation_manager.get_conversation(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = await conversation_manager.get_messages(conversation_id)
        
        return ConversationDetailResponse(
            conversation={
                "id": conversation['id'],
                "title": conversation['title'],
                "created_at": conversation['created_at'],
                "updated_at": conversation['updated_at'], # Added
                "user_id": conversation['user_id'] # Added
            },
            messages=[MessageResponse(
                id=msg['id'],
                role=msg['role'],
                content=msg['content'],
                created_at=msg['created_at'],
                metadata=msg.get('extra_metadata')
            ) for msg in messages]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DeleteConversationResponse(BaseModel):
    success: bool
    message: str

@router.delete("/conversations/{conversation_id}", response_model=DeleteConversationResponse)
async def delete_conversation(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation"""
    try:
        deleted = await conversation_manager.delete_conversation(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return DeleteConversationResponse(success=True, message="Conversation deleted successfully")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager),
    current_user: User = Depends(get_current_user),
):
    """Get all messages for a conversation"""
    try:
        # Verify conversation belongs to the current user
        conv = await conversation_manager.get_conversation(conversation_id, current_user.id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")

        messages = await conversation_manager.get_messages(conversation_id, limit=100)
        # Rename extra_metadata to metadata for frontend compatibility and prune heavy fields
        for msg in messages:
            if 'extra_metadata' in msg:
                msg['metadata'] = msg.pop('extra_metadata')
            
            # Prune heavy fields from metadata to reduce payload size
            if msg.get('metadata'):
                # Create a copy to avoid modifying the original dict if it's used elsewhere (though here it's fresh from DB)
                meta = msg['metadata']
                for key in ['raw_response', 'history', 'context']:
                    if key in meta:
                        del meta[key]
                    
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load messages: {str(e)}")


@router.get("/debug_logs/{conversation_id}")
async def get_debug_logs(conversation_id: str):
    """Get debug logs for a conversation - RAW layer outputs"""
    from app.utils.debug_logger import get_debug_logs
    
    try:
        logs = get_debug_logs(conversation_id)
        # Return the logs structure directly (already contains conversation_id, layers, etc.)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load debug logs: {str(e)}")
