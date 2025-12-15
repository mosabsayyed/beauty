import json
import logging
import pytest
from mcp_router.tool_runner import run_script
from mcp_router.logging_utils import redact_keys_in_dict, log_event


def test_run_script_logs_start_and_complete(caplog, tmp_path):
    caplog.set_level(logging.INFO, logger='mcp_router')
    script = tmp_path / 'echo.py'
    script.write_text('import sys, json\nprint(json.dumps({"success": True, "data": {"msg": "ok"}}))\n')
    cmd = f"python3 {str(script)}"
    input_json = {'args': {'query': 'hi', 'token': 'secret'}}
    resp = run_script(cmd, input_json, timeout=5)
    assert resp.get('success') is True
    # Check logs for start and complete events
    messages = [rec.getMessage() for rec in caplog.records if rec.name == 'mcp_router']
    assert any('script.run.start' in m for m in messages)
    assert any('script.run.complete' in m for m in messages)


def test_redact_keys_in_dict():
    payload = {'args': {'q': 'hi', 'token': 'secret'}, 'password': 'abc'}
    redacted = redact_keys_in_dict(payload)
    assert redacted['args']['token'] == 'REDACTED'
    assert redacted['password'] == 'REDACTED'
