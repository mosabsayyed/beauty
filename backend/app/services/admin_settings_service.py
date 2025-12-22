import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, HttpUrl, ValidationError, model_validator, validator

SETTINGS_PATH = Path(__file__).parent.parent.parent / "config" / "admin_settings.json"


DEFAULT_MCP_TOOLS = ["recall_memory", "retrieve_instructions", "read_neo4j_cypher"]


class MCPEntry(BaseModel):
    label: str = Field(..., min_length=1, max_length=100)
    url: str
    allowed_tools: List[str] = Field(default_factory=lambda: DEFAULT_MCP_TOOLS.copy())

    @validator("allowed_tools", pre=True)
    def _normalize_tools(cls, v):
        if v is None:
            return DEFAULT_MCP_TOOLS.copy()
        return [tool for tool in v if tool]


class MCPConfig(BaseModel):
    endpoints: List[MCPEntry] = Field(default_factory=list)
    persona_bindings: Dict[str, str] = Field(
        default_factory=lambda: {"noor": "noor-router", "maestro": "maestro-router"}
    )


class ProviderConfig(BaseModel):
    local_llm_enabled: bool = False
    local_llm_base_url: Optional[str] = None
    local_llm_model: Optional[str] = None
    local_llm_timeout: int = 60
    use_responses_api: bool = True
    openrouter_api_endpoint: Optional[str] = None
    openrouter_model_primary: Optional[str] = None
    openrouter_model_fallback: Optional[str] = None
    openrouter_model_alt: Optional[str] = None
    max_output_tokens: Optional[int] = 8000
    temperature: Optional[float] = 0.1

    @model_validator(mode='after')
    def _sanitize(self) -> 'ProviderConfig':
        # Guard negative values
        if self.local_llm_timeout is not None and self.local_llm_timeout <= 0:
            self.local_llm_timeout = 300
        if self.max_output_tokens is not None and self.max_output_tokens <= 0:
            self.max_output_tokens = 8000
        return self


class AdminSettings(BaseModel):
    provider: ProviderConfig = Field(default_factory=ProviderConfig)
    mcp: MCPConfig = Field(default_factory=MCPConfig)
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    audit: List[Dict[str, Any]] = Field(default_factory=list)


class AdminSettingsService:
    def __init__(self, path: Path = SETTINGS_PATH):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _now(self) -> str:
        return datetime.utcnow().isoformat() + "Z"

    def _load_raw(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        try:
            with self.path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_raw(self, data: Dict[str, Any]) -> None:
        with self.path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True)

    def load_settings(self) -> AdminSettings:
        raw = self._load_raw()
        try:
            return AdminSettings(**raw)
        except ValidationError:
            # Fall back to defaults if corrupted
            return AdminSettings()

    def save_settings(self, settings: AdminSettings, actor: str) -> AdminSettings:
        payload = settings.dict()
        timestamp = self._now()
        payload["updated_at"] = timestamp
        payload["updated_by"] = actor

        # Append audit entry (cap to last 50)
        audit = payload.get("audit", [])
        audit.append(
            {
                "updated_at": timestamp,
                "updated_by": actor,
                "provider": payload.get("provider"),
                "mcp": payload.get("mcp"),
            }
        )
        payload["audit"] = audit[-50:]

        self._save_raw(payload)
        return AdminSettings(**payload)

    def merge_with_env_defaults(self) -> AdminSettings:
        settings = self.load_settings()
        env_defaults = {
            "local_llm_enabled": os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true",
            "local_llm_base_url": os.getenv("LOCAL_LLM_BASE_URL"),
            "local_llm_model": os.getenv("LOCAL_LLM_MODEL"),
            "local_llm_timeout": int(os.getenv("LOCAL_LLM_TIMEOUT", "300")),
            "use_responses_api": os.getenv("LOCAL_LLM_USE_RESPONSES_API", "true").lower() == "true",
            "openrouter_api_endpoint": os.getenv(
                "OPENROUTER_API_ENDPOINT", "https://openrouter.ai/api/v1/responses"
            ),
            "openrouter_model_primary": os.getenv("OPENROUTER_MODEL_PRIMARY"),
            "openrouter_model_fallback": os.getenv("OPENROUTER_MODEL_FALLBACK"),
            "openrouter_model_alt": os.getenv("OPENROUTER_MODEL_ALT"),
        }

        provider_dict = settings.provider.dict()
        for key, val in env_defaults.items():
            if provider_dict.get(key) in [None, "", 0]:
                provider_dict[key] = val
        settings.provider = ProviderConfig(**provider_dict)
        return settings


admin_settings_service = AdminSettingsService()
