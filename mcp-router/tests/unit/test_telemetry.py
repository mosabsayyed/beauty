import logging
import pytest
from mcp_router import telemetry
from mcp_router.logging_utils import audit_event


def test_telemetry_functions_noop_run():
    # Basic smoke test: functions should not raise
    telemetry.inc_forward_count('b', 't')
    telemetry.observe_forward_latency(0.123, 'b', 't')
    telemetry.inc_script_run_count('script.sh', True)
    telemetry.observe_script_run_latency(0.05, 'script.sh', True)
    telemetry.inc_auth_failure('b', 't')


def test_get_metrics_text_returns_bytes_or_message():
    body, content_type = telemetry.get_metrics_text()
    assert isinstance(body, (bytes, str)) or hasattr(body, 'startswith')
    assert 'text' in content_type


def test_audit_event_logs(caplog):
    caplog.set_level(logging.INFO, logger='mcp_router')
    audit_event('rid-1', 'mytool', 'http://backend', {'headers': {'Authorization': 'Bearer secret'}}, {'q': 'hello', 'token': 'secret'}, 'ok', 12.3, True)
    found = False
    for rec in caplog.records:
        if 'audit.tool_call' in rec.getMessage() or 'audit.tool_call' in rec.message:
            found = True
            break
    assert found
