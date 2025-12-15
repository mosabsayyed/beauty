import os
import json
from mcp_router.tool_runner import run_script


def test_run_hello_script():
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'mcp_router', 'tools', 'hello.py'))
    cmd = f"python3 {script_path}"
    input_json = {'args': {'example': 'value'}}
    resp = run_script(cmd, input_json, timeout=5)
    assert resp.get('success') is True
    assert resp.get('data') is not None
    assert resp['data'].get('message') == 'hello from mcp-router hello tool'
