import logging
import json
from typing import Dict, Any, List

DEFAULT_REDACT_KEYS = ['Authorization', 'authorization', 'password', 'token']


def redact_keys_in_dict(d: Dict[str, Any], keys_to_redact: List[str] = DEFAULT_REDACT_KEYS) -> Dict[str, Any]:
    result = {}
    for k, v in d.items():
        if k in keys_to_redact:
            result[k] = 'REDACTED'
        else:
            # If nested dict, recursively redact shallowly
            if isinstance(v, dict):
                result[k] = redact_keys_in_dict(v, keys_to_redact)
            else:
                result[k] = v
    return result


def redact_headers(headers: Dict[str, str], keys_to_redact: List[str] = DEFAULT_REDACT_KEYS) -> Dict[str, str]:
    headers = headers or {}
    return {k: ('REDACTED' if k in keys_to_redact else v) for k, v in headers.items()}


def log_event(event_name: str, payload: Dict[str, Any], logger_name: str = 'mcp_router', redact: List[str] = DEFAULT_REDACT_KEYS, level: int = logging.INFO):
    logger = logging.getLogger(logger_name)
    # Prepare a sanitized payload for logs
    safe_payload = {}
    for k, v in (payload or {}).items():
        if isinstance(v, dict):
            safe_payload[k] = redact_keys_in_dict(v, redact)
        else:
            safe_payload[k] = ('REDACTED' if k in redact else v)
    # Add event name
    log_entry = {'event': event_name, 'payload': safe_payload}
    logger.log(level, json.dumps(log_entry))


def audit_event(request_id: str, tool_name: str, backend: str, caller: Dict[str, Any], arguments: Dict[str, Any], status: str, duration_ms: float, success: bool, extra: Dict[str, Any] = None):
    """Emit a structured audit event for tool calls and script runs.
    Arguments are sanitized using redact_keys_in_dict before logging.
    """
    payload = {
        'request_id': request_id,
        'tool_name': tool_name,
        'backend': backend,
        'caller': caller or {},
        'arguments': redact_keys_in_dict(arguments or {}),
        'status': status,
        'duration_ms': duration_ms,
        'success': success,
    }
    if extra:
        payload['extra'] = extra
    log_event('audit.tool_call', payload)
