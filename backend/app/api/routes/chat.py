# backend/app/api/routes/chat.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import json
from app.db.supabase_client import supabase_client
from app.services.supabase_conversation_manager import SupabaseConversationManager
from app.services.orchestrator_zero_shot import OrchestratorZeroShot
from app.services.sql_executor import SQLExecutorService
from app.utils.debug_logger import init_debug_logger

router = APIRouter()
sql_executor = SQLExecutorService()



async def get_conversation_manager() -> SupabaseConversationManager:
    """Dependency to get Supabase conversation manager"""
    await supabase_client.connect()
    return SupabaseConversationManager(supabase_client)


def _generate_artifacts_from_specs(artifact_specs: List[dict], tool_results: List[dict]) -> List[dict]:
    """
    Generate artifacts from LLM-specified specs
    
    artifact_specs: list of dicts with type, data_source, title, etc.
    tool_results: list of {"tool": name, "result": data}
    """
    artifacts = []
    for spec in artifact_specs:
        artifact_type = spec.get("type", "TABLE")
        title = spec.get("title", "Data Visualization")
        description = spec.get("description", "")
        
        # Get data
        data_source = spec.get("data_source", {})
        data = []
        if "tool_index" in data_source:
            idx = data_source["tool_index"]
            if 0 <= idx < len(tool_results):
                result = tool_results[idx]["result"]
                if result.get("ok"):
                    data = result.get("rows") or result.get("data") or []
                    if result.get("columns") and isinstance(data, list) and data and isinstance(data[0], list):
                        columns = result["columns"]
                        data = [dict(zip(columns, row)) for row in data]
        elif "sql" in data_source:
            sql = data_source["sql"]
            params = data_source.get("params", [])
            try:
                result = sql_executor.execute(sql, params)
                data = result.get("rows", [])
                if result.get("columns") and isinstance(data, list) and data and isinstance(data[0], list):
                    columns = result["columns"]
                    data = [dict(zip(columns, row)) for row in data]
            except Exception as e:
                print(f"Error executing SQL for artifact: {e}")
                continue
        
        if not data:
            continue
        
        columns = list(data[0].keys()) if data else []
        
        if artifact_type == "TABLE":
            artifacts.append({
                "artifact_type": "TABLE",
                "title": title,
                "content": {
                    "columns": columns,
                    "data": data[:100]
                },
                "description": description
            })
        elif artifact_type == "CHART":
            chart_type = spec.get("chart_type", "bar")
            category_col = spec.get("category_column")
            value_cols = spec.get("value_columns", [])
            
            if not category_col or not value_cols:
                # Fallback to simple logic
                numeric_cols = []
                text_col = None
                for col in columns:
                    if col.lower() in ['id', 'year']:
                        continue
                    values = [row.get(col) for row in data if row.get(col) is not None]
                    if values and all(isinstance(v, (int, float)) for v in values):
                        numeric_cols.append(col)
                    elif not text_col:
                        text_col = col
                category_col = text_col
                value_cols = numeric_cols[:3]
            
            categories = [str(row.get(category_col, '')) for row in data]
            series = []
            for col in value_cols:
                series.append({
                    "name": col.replace('_', ' ').title(),
                    "data": [float(row.get(col, 0)) if row.get(col) is not None else 0 for row in data]
                })
            
            artifacts.append({
                "artifact_type": "CHART",
                "title": title,
                "content": {
                    "type": chart_type,
                    "chart_title": title,
                    "categories": categories,
                    "series": series,
                    "x_axis_label": category_col.replace('_', ' ').title() if category_col else "Category",
                    "y_axis_label": "Value"
                },
                "description": description
            })
        # For REPORT, perhaps create a composite, but for now skip or handle as table
    
    return artifacts


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
    visualization: Optional[dict] = None
    insights: List[str] = []  # Changed from List[dict] to List[str]
    artifacts: List[Artifact] = []  # Changed to list for multiple artifacts
    clarification_needed: Optional[bool] = False
    clarification_questions: Optional[List[str]] = []
    clarification_context: Optional[str] = None


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


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
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
    # For MVP: Use demo user (id=1)
    # TODO: Replace with JWT authentication
    user_id = 1
    
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
        
        # Use OrchestratorZeroShot only - no fallbacks
        orchestrator = OrchestratorZeroShot()
        zero_shot_result = orchestrator.process_query(
            user_query=request.query,
            conversation_history=conversation_context,
            conversation_id=conversation_id
        )
        
        # Transform zero-shot response to match expected format
        # Zero-shot returns: {answer, analysis[], visualizations[], data, cypher_executed, confidence}
        # Endpoint expects: {message, insights[], artifacts[]}
        
        answer = zero_shot_result.get("answer", "")
        # LLM returns "analysis" not "insights"
        insights = zero_shot_result.get("analysis", zero_shot_result.get("insights", []))
        
        # Check if this is a clarification request
        clarification_needed = zero_shot_result.get("clarification_needed", False)
        clarification_questions = zero_shot_result.get("questions", [])
        clarification_context = zero_shot_result.get("context", "")
        
        # Convert visualizations to artifacts
        artifacts = []
        visualizations = zero_shot_result.get("visualizations", [])
        for viz in visualizations:
            artifacts.append(Artifact(
                artifact_type="CHART",
                title=viz.get("title", "Visualization"),
                content=viz.get("config", {}),  # Highcharts config
                description=viz.get("description", "")
            ))
        
        # Convert query_results to TABLE artifact if present
        data_dict = zero_shot_result.get("data", {})
        query_results = data_dict.get("query_results", [])
        if query_results and isinstance(query_results, list) and len(query_results) > 0:
            # Extract column names from first row
            first_row = query_results[0]
            if isinstance(first_row, dict):
                columns = list(first_row.keys())
                rows = [[row.get(col, "") for col in columns] for row in query_results]
                
                # Create better title based on query or data source
                table_title = f"Query Results ({len(rows)} rows)"
                if zero_shot_result.get("cypher_executed"):
                    # Try to extract entity type from cypher query
                    cypher = zero_shot_result.get("cypher_executed", "")
                    if "EntityProject" in cypher:
                        table_title = f"Projects Data ({len(rows)} rows)"
                    elif "EntityCapability" in cypher:
                        table_title = f"Capabilities Data ({len(rows)} rows)"
                    elif "EntityObjective" in cypher:
                        table_title = f"Objectives Data ({len(rows)} rows)"
                    elif "EntityRisk" in cypher:
                        table_title = f"Risks Data ({len(rows)} rows)"
                
                artifacts.append(Artifact(
                    artifact_type="TABLE",
                    title=table_title,
                    content={
                        "columns": columns,
                        "rows": rows,
                        "total_rows": len(rows)
                    },
                    description=f"Data table with {len(rows)} rows and {len(columns)} columns"
                ))
        
        # Log zero-shot success
        debug_logger.log_layer(2, "zero_shot_success", {
            "insights_count": len(insights),
            "visualizations_count": len(visualizations),
            "confidence": zero_shot_result.get("confidence", 0.0),
            "cypher_executed": zero_shot_result.get("cypher_executed", "")
        })
        
        orchestrator_result = {
            "answer": answer,
            "entities": [],
            "tables": [],
            "data": zero_shot_result.get("data", {}),
            "tool_results": []
        }

        # Store orchestrator response as assistant message WITH ARTIFACTS
        await conversation_manager.add_message(
            conversation_id,
            "assistant",
            answer,
            {
                "entities": orchestrator_result.get("entities", []),
                "tables": orchestrator_result.get("tables", []),
                "data": orchestrator_result.get("data", {}),
                "artifacts": [
                    {
                        "artifact_type": art.artifact_type,
                        "title": art.title,
                        "content": art.content,
                        "description": art.description
                    }
                    for art in artifacts
                ],
                "insights": insights,
                "clarification_needed": clarification_needed,
                "clarification_questions": clarification_questions if clarification_needed else [],
                "clarification_context": clarification_context if clarification_needed else None
            }
        )

        return ChatResponse(
            conversation_id=conversation_id,
            message=answer,
            visualization=None,
            insights=insights,
            artifacts=artifacts,
            clarification_needed=clarification_needed,
            clarification_questions=clarification_questions if clarification_needed else [],
            clarification_context=clarification_context if clarification_needed else None
        )

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
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    """List all conversations for current user"""
    user_id = 1  # Demo user
    
    try:
        conversations = await conversation_manager.list_conversations(
            user_id=user_id,
            limit=50
        )
        
        summaries = []
        for conv in conversations:
            summaries.append(ConversationSummary(
                id=conv['id'],
                title=conv['title'],
                message_count=0,  # TODO: Add message count
                created_at=conv['created_at'],
                updated_at=conv['updated_at']
            ))
        
        return ConversationListResponse(conversations=summaries)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    """Get conversation with all messages"""
    user_id = 1  # Demo user
    
    try:
        conversation = await conversation_manager.get_conversation(
            conversation_id=conversation_id,
            user_id=user_id
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = await conversation_manager.get_messages(conversation_id)
        
        return ConversationDetailResponse(
            conversation={
                "id": conversation['id'],
                "title": conversation['title'],
                "created_at": conversation['created_at']
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


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    """Delete a conversation"""
    user_id = 1  # Demo user
    
    try:
        deleted = await conversation_manager.delete_conversation(
            conversation_id=conversation_id,
            user_id=user_id
        )
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    conversation_manager: SupabaseConversationManager = Depends(get_conversation_manager)
):
    """Get all messages for a conversation"""
    try:
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
        return {"conversation_id": conversation_id, "logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load debug logs: {str(e)}")
