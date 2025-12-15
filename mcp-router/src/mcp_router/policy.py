import os
from typing import Dict, Any


def build_forward_headers(headers: Dict[str, str] | None, backend: Dict[str, Any] | None) -> Dict[str, str]:
    forward_headers: Dict[str, str] = {}
    if headers:
        forward_headers.update(headers)
    # Service token fallback
    service_token = os.environ.get('MCP_ROUTER_SERVICE_TOKEN')
    if service_token and 'Authorization' not in forward_headers:
        forward_headers['Authorization'] = f"Bearer {service_token}"
    # Backend specific auth header injection
    if backend and backend.get('auth_header_key') and 'Authorization' not in forward_headers:
        env_key = backend.get('auth_header_key')
        token = os.environ.get(env_key)
        if token:
            forward_headers['Authorization'] = f"Bearer {token}"
    return forward_headers


def enforce_tool_policy(tool: Dict[str, Any], arguments: Dict[str, Any]) -> None:
    """Raise exception if tool invocation violates declared policies.
    This is a simple, extensible policy enforcement helper: raises ValueError on violations.
    """
    policy = tool.get('policy', {}) or {}
    # Read-only enforcement
    if policy.get('read_only'):
        # Heuristic: common write operations flagged via 'op' in arguments; tests should use op: 'write' to emulate attempts
        if isinstance(arguments, dict) and arguments.get('op') in ('write', 'create', 'update', 'delete', 'mutate'):
            raise ValueError('Tool is read-only; write operations are not permitted')
    # max_rows enforcement
    max_rows = policy.get('max_rows')
    if max_rows is not None:
        # If arguments contain 'limit' and it's greater than max_rows, reject
        limit = None
        if isinstance(arguments, dict):
            limit = arguments.get('limit')
        if limit is not None and isinstance(limit, int) and limit > int(max_rows):
            raise ValueError(f"Requested limit {limit} exceeds allowed max_rows {max_rows}")
