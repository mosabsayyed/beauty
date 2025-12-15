"""
MCP Service Layer - Maestro (Executive) variant

Differences vs mcp_service (Noor):
- Allows memory scopes: personal, departmental, ministry, secrets (admin).
- No csuite prohibition; Secrets are permitted for Maestro.
- Uses the same embedding/vector index path (memory_semantic_index) for semantic recall.
- Shares retrieve_instructions and read_neo4j_cypher behaviors.
"""
import json
import logging
from typing import Literal, List, Dict, Any, Optional

from app.services import mcp_service
from app.services.mcp_service import (
    retrieve_instructions,
    read_neo4j_cypher,
    generate_embedding,
    _execute_vector_query,
)

logger = logging.getLogger(__name__)


# =============================================================================
# TOOL 1: recall_memory (Maestro - Secrets permitted)
# =============================================================================

async def recall_memory(
    scope: Literal["personal", "departmental", "ministry", "secrets"],
    query_summary: str,
    limit: int = 5,
    user_id: Optional[str] = None,
) -> str:
    """
    Retrieves hierarchical memory using semantic search for Maestro.

    Scope policy (Maestro):
    - Allowed: personal, departmental, ministry, secrets
    - No automatic downgrades across scopes; exact scope is honored
    """
    allowed_scopes = {"personal", "departmental", "ministry", "secrets"}
    if scope not in allowed_scopes:
        raise ValueError(f"Invalid scope '{scope}'. Allowed: {sorted(allowed_scopes)}")

    if scope == "personal" and not user_id:
        raise ValueError("user_id is required for personal scope recall to enforce per-user isolation")

    query_embedding = await generate_embedding(query_summary)
    results = await _execute_vector_query(scope, query_embedding, limit, user_id=user_id)
    if results:
        logger.info("recall_memory (maestro): %s results in scope %s", len(results), scope)
        return json.dumps(results)

    logger.info("recall_memory (maestro): no results in scope %s", scope)
    return "[]"


__all__ = [
    "recall_memory",
    "retrieve_instructions",
    "read_neo4j_cypher",
]
