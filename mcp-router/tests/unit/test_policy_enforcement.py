import pytest
from mcp_router.policy import enforce_tool_policy


def test_read_only_policy_blocks_write_ops():
    tool = {'policy': {'read_only': True}}
    with pytest.raises(ValueError):
        enforce_tool_policy(tool, {'op': 'write'})


def test_read_only_policy_allows_read():
    tool = {'policy': {'read_only': True}}
    # Should not raise
    enforce_tool_policy(tool, {'op': 'read'})


def test_max_rows_blocks_large_limit():
    tool = {'policy': {'max_rows': 5}}
    with pytest.raises(ValueError):
        enforce_tool_policy(tool, {'limit': 10})


def test_max_rows_allows_small_limit():
    tool = {'policy': {'max_rows': 5}}
    enforce_tool_policy(tool, {'limit': 2})
