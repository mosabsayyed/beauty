# backend/app/api/routes/debug.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import json
import glob

router = APIRouter()

class DebugToggleRequest(BaseModel):
    enabled: bool

@router.post("/debug/prompts/toggle")
async def toggle_debug_prompts(request: DebugToggleRequest):
    """
    Enable or disable debug mode to see actual prompts sent to LLM
    
    WARNING: Debug mode prints sensitive prompts to console logs
    Only use in development
    """
    if request.enabled:
        os.environ["DEBUG_PROMPTS"] = "true"
        return {
            "status": "enabled",
            "message": "Debug mode ON - All LLM prompts will be logged to console",
            "warning": "Check server logs to see prompts"
        }
    else:
        os.environ["DEBUG_PROMPTS"] = "false"
        return {
            "status": "disabled",
            "message": "Debug mode OFF"
        }

@router.get("/debug/prompts/status")
async def get_debug_status():
    """Check if debug mode is enabled"""
    enabled = os.getenv("DEBUG_PROMPTS", "false").lower() == "true"
    return {
        "debug_enabled": enabled,
        "message": "Debug logs visible in server console" if enabled else "Debug mode disabled"
    }


# =============================================================================
# OBSERVABILITY API ENDPOINTS
# =============================================================================

@router.get("/debug/traces")
async def list_traces(limit: int = 50):
    """
    List all available conversation traces (debug log files).
    Returns metadata about each trace without full content.
    """
    log_dir = Path(__file__).parent.parent.parent.parent / "logs"
    
    if not log_dir.exists():
        return {"traces": [], "total": 0}
    
    traces = []
    log_files = sorted(log_dir.glob("chat_debug_*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
    
    for log_file in log_files[:limit]:
        try:
            with open(log_file, 'r') as f:
                data = json.load(f)
            
            # Extract conversation ID from filename
            conv_id = log_file.stem.replace("chat_debug_", "")
            
            # Get summary info
            events = data.get("events", [])
            layers = data.get("layers", {})
            
            # Find the query from events
            query = ""
            tool_calls_count = 0
            has_error = False
            persona = "unknown"
            
            for event in events:
                if event.get("event_type") == "llm_request":
                    query = event.get("data", {}).get("question", "") or event.get("data", {}).get("query", "")
                if event.get("event_type") == "llm_response":
                    if event.get("data", {}).get("confidence", 1) == 0:
                        has_error = True
            
            # Check layer2 for more details
            layer2_events = layers.get("layer2", {}).get("events", [])
            for event in layer2_events:
                if event.get("event_type") == "tier1_loaded":
                    persona = event.get("data", {}).get("persona", "unknown")
                if event.get("event_type") == "groq_full_trace":
                    tool_calls_count = event.get("data", {}).get("tool_calls_count", 0)
                if event.get("event_type") in ["json_parse_failed", "tier1_load_failed"]:
                    has_error = True
            
            traces.append({
                "conversation_id": conv_id,
                "created_at": data.get("created_at", ""),
                "query": query[:100] + ("..." if len(query) > 100 else ""),
                "persona": persona,
                "tool_calls_count": tool_calls_count,
                "has_error": has_error,
                "file_size": log_file.stat().st_size,
                "turns": len(data.get("turns", []))
            })
        except Exception as e:
            continue
    
    return {"traces": traces, "total": len(traces)}


@router.get("/debug/traces/{conversation_id}")
async def get_trace(conversation_id: str):
    """
    Get full trace details for a specific conversation.
    Returns the complete debug log with all events, tool calls, and reasoning.
    """
    log_dir = Path(__file__).parent.parent.parent.parent / "logs"
    log_file = log_dir / f"chat_debug_{conversation_id}.json"
    
    if not log_file.exists():
        raise HTTPException(status_code=404, detail=f"Trace not found for conversation {conversation_id}")
    
    try:
        with open(log_file, 'r') as f:
            data = json.load(f)
        
        # Enrich with parsed structure for frontend
        enriched = {
            "conversation_id": conversation_id,
            "created_at": data.get("created_at", ""),
            "turns": data.get("turns", []),
            "timeline": [],  # Flattened timeline of all events
            "tool_calls": [],
            "reasoning": [],
            "mcp_operations": [],
            "errors": [],
            "raw": data  # Include raw data for advanced view
        }
        
        # Process events from top level
        for event in data.get("events", []):
            enriched["timeline"].append({
                "timestamp": event.get("timestamp"),
                "type": event.get("event_type"),
                "layer": "orchestrator",
                "data": event.get("data")
            })
        
        # Process layer events
        for layer_name, layer_data in data.get("layers", {}).items():
            for event in layer_data.get("events", []):
                event_type = event.get("event_type")
                event_data = event.get("data", {})
                
                enriched["timeline"].append({
                    "timestamp": event.get("timestamp"),
                    "type": event_type,
                    "layer": layer_name,
                    "data": event_data
                })
                
                # Extract tool calls
                if event_type == "groq_full_trace":
                    for tc in event_data.get("tool_calls", []):
                        enriched["tool_calls"].append(tc)
                    for r in event_data.get("reasoning_steps", []):
                        enriched["reasoning"].append(r)
                    for m in event_data.get("mcp_operations", []):
                        enriched["mcp_operations"].append(m)
                
                # Extract errors
                if "error" in event_type.lower() or "failed" in event_type.lower():
                    enriched["errors"].append({
                        "type": event_type,
                        "data": event_data
                    })
        
        # Sort timeline by timestamp
        enriched["timeline"].sort(key=lambda x: x.get("timestamp", ""))
        
        return enriched
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load trace: {str(e)}")

@router.get("/debug/database-config")
async def get_database_config():
    """Check which database the server is connected to"""
    from app.config import settings
    
    # Test the logic directly
    test_value = os.getenv("SUPABASE_HOST") or os.getenv("PGHOST", "localhost")
    
    return {
        "settings_PGHOST": settings.PGHOST,
        "settings_PGPORT": settings.PGPORT,
        "settings_PGDATABASE": settings.PGDATABASE,
        "settings_PGUSER": settings.PGUSER,
        "env_SUPABASE_HOST": os.getenv("SUPABASE_HOST"),
        "env_PGHOST": os.getenv("PGHOST"),
        "env_SUPABASE_PORT": os.getenv("SUPABASE_PORT"),
        "env_SUPABASE_DATABASE": os.getenv("SUPABASE_DATABASE"),
        "env_SUPABASE_USER": os.getenv("SUPABASE_USER"),
        "test_logic_result": test_value
    }
