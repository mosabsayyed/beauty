import os
import pytest
from mcp_router.tool_registry import ToolRegistry

CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'router_config.example.yaml'))


def test_load_registry_and_get_tools():
    registry = ToolRegistry(CONFIG_PATH)
    tools = registry.get_tools()
    assert isinstance(tools, list)
    # Example config contains at least one tool
    assert len(tools) >= 1
    t = tools[0]
    assert 'name' in t


def test_get_tool_schema():
    registry = ToolRegistry(CONFIG_PATH)
    tool = registry.get_tools()[0]
    schema = registry.get_tool_schema(tool['name'])
    # Schema might be None for simple tools; ensure call returns value or None
    assert schema is None or isinstance(schema, str)
