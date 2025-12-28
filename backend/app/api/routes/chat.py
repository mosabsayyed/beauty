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
from app.db.supabase_client_async import supabase_client
from app.services.supabase_conversation_manager import SupabaseConversationManager
from app.services.orchestrator_universal import CognitiveOrchestrator, NoorOrchestrator
from app.services.sql_executor import SQLExecutorService, get_sql_executor_service
import asyncio
from app.utils.debug_logger import init_debug_logger, log_debug
from app.utils.auth_utils import get_current_user, get_optional_user
from app.services.user_service import User

router = APIRouter()

# =============================================================================
# ORCHESTRATOR VERSION FACTORY
# =============================================================================

# Lazy orchestrator instances
_orchestrator_noor_instance = None
_orchestrator_maestro_instance = None
_orchestrator_default_instance = None

def get_orchestrator_instance(persona_name: str = None):
    """
    Factory function to get the appropriate orchestrator by persona.
    
    Persona-based routing:
    - persona='noor' → CognitiveOrchestrator(noor)
    - persona='maestro' → CognitiveOrchestrator(maestro)
    - else → CognitiveOrchestrator(noor)  # default
    """
    global _orchestrator_noor_instance, _orchestrator_maestro_instance, _orchestrator_default_instance
    
    if persona_name == 'noor':
        if _orchestrator_noor_instance is None:
            _orchestrator_noor_instance = CognitiveOrchestrator(persona="noor")
        return _orchestrator_noor_instance
    
    elif persona_name == 'maestro':
        if _orchestrator_maestro_instance is None:
            _orchestrator_maestro_instance = CognitiveOrchestrator(persona="maestro")
        return _orchestrator_maestro_instance
    
    if _orchestrator_default_instance is None:
        _orchestrator_default_instance = CognitiveOrchestrator(persona="noor")
    return _orchestrator_default_instance



async def get_conversation_manager() -> SupabaseConversationManager:
    """Dependency to get Supabase conversation manager"""
    await supabase_client.connect()
    return SupabaseConversationManager(supabase_client)




class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "noor"  # ignored; backend derives from user role
    # Optional conversation history (used for guest-mode queries; list of role/content dicts)
    history: Optional[List[Dict[str, str]]] = None
    push_to_graph_server: Optional[bool] = False
    file_ids: Optional[List[str]] = None  # NEW: Accept file IDs
    model_override: Optional[str] = None  # Allow client to request a specific model alias


class Artifact(BaseModel):
    artifact_type: str  # CHART, TABLE, REPORT, DOCUMENT
    title: str
    content: dict
    description: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message: str
    answer: Optional[str] = None
    # Removed visualization field - unified to artifacts only
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





# =============================================================================
# BACKGROUND PROCESSING FUNCTION (Phase 1: Quick Win)
# =============================================================================
# =============================================================================

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
    Send message and process LLM synchronously (Phase 2: True Async).
    
    Awaits LLM processing before returning (~30-300s response time, non-blocking).
    Other requests process concurrently on event loop via async httpx.
    Frontend gets full response immediately, no polling needed.
    """
    user_id = current_user.id if current_user else None
    
    # Role-based routing: ignore client-provided `persona` and derive from authenticated user role.
    # Reason: prevent client-side privilege escalation and ensure consistent MCP router + Tier-1 prompt per role.
    user_role = current_user.role if current_user and hasattr(current_user, 'role') else 'user'
    if user_role == 'staff':
        persona_name = 'noor'
    elif user_role == 'exec':
        persona_name = 'maestro'
    else:
        persona_name = 'noor'  # default
    
    # Validate model_override
    allowed_model_aliases = {"20b", "70b", "120b", "primary", "fallback", "alt", "local"}
    if request.model_override and request.model_override.lower() not in allowed_model_aliases:
        raise HTTPException(status_code=400, detail="Invalid model_override")
    
    try:
        # ====================================================================
        # FAST PATH: Get or create conversation (DB write ~200ms)
        # ====================================================================
        if request.conversation_id and user_id is not None:
            conversation = await conversation_manager.get_conversation(
                request.conversation_id, user_id
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation_id = request.conversation_id
        elif user_id is not None:
            # Create new conversation
            conversation = await conversation_manager.create_conversation(
                user_id,
                persona_name,
                request.query[:50] + ("..." if len(request.query) > 50 else "")
            )
            if not conversation:
                raise HTTPException(status_code=500, detail="Failed to create conversation")
            conversation_id = conversation['id']
        else:
            # Guest mode
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Use guest mode in frontend."
            )

        # Initialize debug logger for this conversation and log the full user message
        try:
            init_debug_logger(str(conversation_id))
            log_debug(1, 'user_message', {
                'conversation_id': conversation_id,
                'persona': persona_name,
                'content': request.query
            })
        except Exception:
            # Non-fatal: continue even if logging fails
            pass
        
        # ====================================================================
        # STORE USER MESSAGE (DB write ~200ms, inline for consistency)
        # ====================================================================
        await conversation_manager.add_message(
            conversation_id,
            "user",
            request.query,
            {"persona": persona_name}
        )
        
        # ====================================================================
        # PROCESS LLM SYNCHRONOUSLY (30-300s, but non-blocking via async httpx)
        # ====================================================================
        # Build conversation context
        conversation_context = await conversation_manager.build_conversation_context(
            conversation_id, 10
        )
        
        # Get orchestrator and execute (AWAIT for response)
        orchestrator = get_orchestrator_instance(persona_name=persona_name)
        session_id = str(conversation_id)
        
        llm_response = await orchestrator.execute_query(
            user_query=request.query,
            session_id=session_id,
            history=conversation_context,
            user_id=user_id,
            model_override=request.model_override
        )
        
        # Extract payload
        llm_payload = llm_response if isinstance(llm_response, dict) else {}
        
        # Store assistant message
        content_to_store = json.dumps(llm_payload) if isinstance(llm_payload, dict) else str(llm_response)
        metadata_to_store = llm_payload.copy() if isinstance(llm_payload, dict) else {}
        
        # Prune heavy fields
        for key in ['raw_response', 'history', 'context']:
            if key in metadata_to_store:
                del metadata_to_store[key]
        
        await conversation_manager.add_message(
            conversation_id,
            'assistant',
            content_to_store,
            metadata_to_store
        )

        # Log assistant message (raw + parsed) for observability
        try:
            log_debug(1, 'assistant_message_raw', {
                'conversation_id': conversation_id,
                'content': content_to_store
            })
            log_debug(1, 'assistant_message_parsed', {
                'conversation_id': conversation_id,
                'parsed': llm_payload
            })
        except Exception:
            pass
        
        # ====================================================================
        # RETURN WITH FULL LLM RESPONSE (no polling needed)
        # ====================================================================
        return {
            "conversation_id": conversation_id,
            "status": "complete",
            "llm_payload": llm_payload
        }

    except HTTPException:
        raise
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"send_message error: {str(e)}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
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
