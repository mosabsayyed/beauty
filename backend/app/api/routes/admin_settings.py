from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from pydantic import ValidationError

from app.services.admin_settings_service import (
    AdminSettings,
    admin_settings_service,
)
from app.utils.auth_utils import get_optional_user

router = APIRouter()


def get_actor(user=Depends(get_optional_user)):
    # Dev-only: allow unauthenticated access (actor falls back to 'dev-admin')
    return user


@router.get("/settings", response_model=AdminSettings)
async def get_settings(_: Dict = Depends(get_actor)):
    """Return current admin-configurable settings (merged with env defaults)."""
    return admin_settings_service.merge_with_env_defaults()


@router.put("/settings", response_model=AdminSettings)
async def update_settings(payload: Dict, user=Depends(get_actor)):
    """Validate and persist admin-configurable settings (auth paused for dev)."""
    try:
        settings = AdminSettings(**payload)
    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=ve.errors())

    actor = getattr(user, "email", None) if user else None
    saved = admin_settings_service.save_settings(settings, actor=actor or "dev-admin")
    return saved
