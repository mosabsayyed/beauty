# backend/app/api/routes/chat.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from app.db.supabase_client import supabase_client
from app.services.supabase_conversation_manager import SupabaseConversationManager
from app.services.orchestrator_zero_shot import OrchestratorZeroShot
import asyncio
from app.utils.debug_logger import init_debug_logger
from app.utils.auth_utils import get_current_user
from app.services.user_service import User

router = APIRouter()

# Lazy orchestrator instance to avoid import-time environment variable errors
_orchestrator_instance: Optional[OrchestratorZeroShot] = None

def get_orchestrator_instance() -> OrchestratorZeroShot:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = OrchestratorZeroShot()
    return _orchestrator_instance



async def get_conversation_manager() -> SupabaseConversationManager:
    """Dependency to get Supabase conversation manager"""
    await supabase_client.connect()
    return SupabaseConversationManager(supabase_client)




class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "transformation_analyst"


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


class StreamChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []
    conversation_id: Optional[str] = None


@router.post("/message/stream")
async def chat_stream(request: StreamChatRequest, conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)):
    """
    Streaming endpoint for Cognitive Digital Twin.
    Returns Server-Sent Events (SSE) containing JSON tokens.
    """
    try:
        orchestrator = get_orchestrator_instance()

        # If a conversation_id is provided, build server-side conversation context
        conversation_context = request.history or []
        if request.conversation_id:
            try:
                # Build context BEFORE storing the current message
                conversation_context = await conversation_manager.build_conversation_context(
                    int(request.conversation_id),
                    10,
                )

                # Persist user message into conversation
                await conversation_manager.add_message(int(request.conversation_id), 'user', request.message, {})
            except Exception as e:
                # If conversation lookup fails, continue using provided history
                pass

        # Use the generator method we created in the orchestrator
        stream_generator = orchestrator.stream_query(
            user_query=request.message,
            conversation_history=conversation_context,
        )

        # return StreamingResponse with text/event-stream media type and anti-buffer headers
        return StreamingResponse(
            stream_generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message/stream_raw")
async def chat_stream_raw(request: StreamChatRequest, conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)):
    """
    Raw JSON streaming endpoint for Cognitive Digital Twin.
    Returns a plain streaming response (no SSE framing) to support streaming JSON parsers.
    """
    try:
        orchestrator = get_orchestrator_instance()

        conversation_context = request.history or []
        if request.conversation_id:
            try:
                conversation_context = await conversation_manager.build_conversation_context(
                    int(request.conversation_id),
                    10,
                )
                await conversation_manager.add_message(int(request.conversation_id), 'user', request.message, {})
            except Exception:
                pass

        # Use the generator method with sse=False to yield raw tokens
        stream_generator = orchestrator.stream_query(
            user_query=request.message,
            conversation_history=conversation_context,
            sse=False,
        )

        return StreamingResponse(
            stream_generator,
            media_type="application/json",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    current_user: User = Depends(get_current_user),
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
    # Use authenticated user
    user_id = current_user.id
    
    try:
        # Get or create conversation
        if request.conversation_id:
            # Verify conversation exists and belongs to user
            conversation = await conversation_manager.get_conversation(
                request.conversation_id,
                user_id
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation_id = request.conversation_id
        else:
            # Create new conversation
            conversation = await conversation_manager.create_conversation(
                user_id,
                request.persona or "transformation_analyst",
                request.query[:50] + ("..." if len(request.query) > 50 else "")
            )
            if not conversation:
                raise HTTPException(status_code=500, detail="Failed to create conversation")
            conversation_id = conversation['id']
        
        # Initialize debug logger AFTER we have the real conversation_id
        debug_logger = init_debug_logger(str(conversation_id))
        
        # Build conversation context BEFORE storing current message
        # This prevents the current query from appearing twice in the prompt
        conversation_context = await conversation_manager.build_conversation_context(
            conversation_id,
            10
        )
        
        # Store user message AFTER building context
        await conversation_manager.add_message(
            conversation_id,
            "user",
            request.query,
            {"persona": request.persona}
        )
        
        # Use OrchestratorZeroShot stream API directly. We consume the raw
        # JSON token stream (sse=False) and assemble the final document.
        # This avoids adding a synchronous 'process_query' shim on the
        # orchestrator and keeps the orchestrator as the single source of truth.
        orchestrator = OrchestratorZeroShot()

        # Consume the single-shot generator returned by the orchestrator.
        gen = orchestrator.stream_query(
            user_query=request.query,
            conversation_history=conversation_context,
            sse=False,
            use_mcp=True,
        )
        # Capture the first non-empty fragment from the orchestrator stream
        first_frag = None
        try:
            for frag in gen:
                if frag == "[DONE]":
                    break
                if frag:
                    first_frag = frag
                    break
        except Exception:
            first_frag = None
        # Directly return the raw LLM API response (as parsed JSON) to the frontend and persist it
        if not first_frag:
            llm_response = {}
        else:
            try:
                llm_response = json.loads(first_frag)
            except Exception:
                llm_response = {"raw": str(first_frag)}

        # Log LLM request and response
        debug_logger.log_event("llm_request", {
            "history": conversation_context,
            "question": request.query,
            "conversation_id": conversation_id
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

        # Persist assistant message: content is the canonical structured block (string), metadata keeps raw_response for traceability
        metadata_to_store = llm_response if isinstance(llm_response, dict) else {'raw': str(llm_response)}
        await conversation_manager.add_message(
            conversation_id,
            'assistant',
            content_to_store,
            metadata_to_store
        )

        # Build response payload: include conversation_id, the llm_payload (if found) as-is, and raw_response for debugging
        response_payload = {'conversation_id': conversation_id}
        if isinstance(llm_payload, dict):
            response_payload['llm_payload'] = llm_payload
        else:
            # no structured block found; return the full parsed llm_response under 'raw_response'
            response_payload['llm_payload'] = None
        # Attach raw_response for completeness (may be large)
        response_payload['raw_response'] = llm_response.get('raw_response') if isinstance(llm_response, dict) else llm_response

        return response_payload

    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"orchestrator_zero_shot_error: {str(e)}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")

        # Print to stdout for debugging
        print(f"\n{'='*80}")
        print(f"ORCHESTRATOR ERROR")
        print(f"{'='*80}")
        print(f"Error: {str(e)}")
        print(f"\nFull Traceback:")
        print(traceback.format_exc())
        print(f"{'='*80}\n")

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
        
        summaries = []
        for conv in conversations:
            # Attempt to compute message count for each conversation
            try:
                msgs = await conversation_manager.get_messages(conv['id'])
                msg_count = len(msgs) if msgs is not None else 0
            except Exception:
                msg_count = 0

            summaries.append(ConversationSummary(
                id=conv['id'],
                title=conv['title'],
                message_count=msg_count,
                created_at=conv['created_at'],
                updated_at=conv['updated_at']
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
        # Rename extra_metadata to metadata for frontend compatibility
        for msg in messages:
            if 'extra_metadata' in msg:
                msg['metadata'] = msg.pop('extra_metadata')
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
