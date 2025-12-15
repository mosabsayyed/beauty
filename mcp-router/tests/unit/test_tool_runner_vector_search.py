import os
import json
from mcp_router.tool_runner import run_script


def test_run_vector_search_script():
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'mcp_router', 'tools', 'vector_search.py'))
    cmd = f"python3 {script_path}"
    input_json = {'args': {'query': 'test search'}}
    resp = run_script(cmd, input_json, timeout=5)
    assert resp.get('success') is True
    assert 'data' in resp
    assert isinstance(resp['data'].get('results'), list)
    # Ensure no raw embedding data is returned (sanitized)
    for r in resp['data']['results']:
        assert 'embedding' not in r
