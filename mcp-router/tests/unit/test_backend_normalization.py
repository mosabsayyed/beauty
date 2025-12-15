import json
import tempfile
import pytest
from mcp_router.tool_registry import ToolRegistry


def test_backend_has_auth_header_key(tmp_path):
    config = {
        'backends': [
            {'name': 'stub-backend', 'type': 'http_mcp', 'url': 'http://127.0.0.1:9000/mcp/', 'auth_header_key': 'MY_TOKEN'}
        ],
        'tools': [
            {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward'}
        ]
    }
    cfg_path = write_tmp_config(tmp_path, config)
    registry = ToolRegistry(cfg_path)
    backend = registry.get_backend('stub-backend')
    assert backend.get('auth_header_key') == 'MY_TOKEN'


def write_tmp_config(tmp_path, data):
    p = tmp_path / 'router_config.yaml'
    p.write_text(json.dumps(data))
    return str(p)


def test_backend_name_resolves_to_backend_dict(tmp_path):
    config = {
        'backends': [
            {'name': 'stub-backend', 'type': 'http_mcp', 'url': 'http://127.0.0.1:9000/mcp/'}
        ],
        'tools': [
            {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward'}
        ]
    }
    cfg_path = write_tmp_config(tmp_path, config)
    registry = ToolRegistry(cfg_path)
    tool = registry.get_tool('test_tool')
    assert tool is not None
    backend_value = tool.get('backend')
    # backend remains a string in the tool entry
    assert isinstance(backend_value, str)
    backend = registry.get_backend(backend_value)
    assert isinstance(backend, dict)
    assert backend.get('url') == 'http://127.0.0.1:9000/mcp/'
