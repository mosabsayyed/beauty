import os
import json
from mcp_router.tool_runner import run_script


def test_run_script_handles_nonzero_exit():
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'mcp_router', 'tools', 'fail.py'))
    cmd = f"python3 {script_path}"
    resp = run_script(cmd, {}, timeout=5)
    assert resp.get('success') is False
    assert resp.get('status') == 500
    assert 'details' in resp and 'stderr' in resp['details']


def test_run_script_handles_invalid_json_stdout(tmp_path):
    # Create a script that prints invalid JSON
    script = tmp_path / 'bad_stdout.py'
    script.write_text('print("not a json")\n')
    script_path = str(script)
    cmd = f"python3 {script_path}"
    resp = run_script(cmd, {}, timeout=5)
    assert resp.get('success') is False
    assert resp.get('status') == 502
