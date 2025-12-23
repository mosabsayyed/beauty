from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.db.supabase_client import supabase_client
from datetime import datetime

router = APIRouter()

@router.get("", response_model=HealthCheckResponse, include_in_schema=False)
@router.get("/", response_model=HealthCheckResponse)
@router.get("/check", response_model=HealthCheckResponse)
async def health_check():
    """Simple health check without database queries"""
    return HealthCheckResponse(
        status="healthy",
        health_score=100,
        warnings={},
        data_completeness={
            "backend": "running",
            "note": "Database connections established on first request"
        },
        last_check=datetime.now()
    )
