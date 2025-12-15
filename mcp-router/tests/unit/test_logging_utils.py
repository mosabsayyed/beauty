import json
import logging
import pytest
from mcp_router.logging_utils import redact_headers, log_event


def test_redact_headers():
    headers = {'Authorization': 'Bearer secret', 'mcp-session-id': 's-123'}
    redacted = redact_headers(headers)
    assert redacted['Authorization'] == 'REDACTED'
    assert redacted['mcp-session-id'] == 's-123'


def test_log_event_redacts_sensitive_fields(caplog):
    caplog.set_level(logging.INFO, logger='mcp_router')
    payload = {
        'headers': {'Authorization': 'Bearer secret', 'mcp-session-id': 's-222'},
        'args': {'query': 'test', 'token': 'secret-token'}
    }
    log_event('test.event', payload)
    # Find our log
    found = None
    for rec in caplog.records:
        if 'test.event' in rec.getMessage() or 'test.event' in rec.message:
            found = rec.getMessage()
            break
    assert found is not None
    parsed = json.loads(found)
    assert parsed['event'] == 'test.event'
    # Headers Authorization should be redacted and mcp-session-id preserved
    assert parsed['payload']['headers']['Authorization'] == 'REDACTED'
    assert parsed['payload']['headers']['mcp-session-id'] == 's-222'
    # Token in args should be redacted
    assert parsed['payload']['args']['token'] == 'REDACTED'
