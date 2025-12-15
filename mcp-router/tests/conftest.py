import sys
import os
import pytest

# Add the sandbox package `src` into sys.path so imports like 'mcp_router' resolve
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
if SRC not in sys.path:
    sys.path.insert(0, SRC)

# Compatibility glue: some tests use 'aiohttp_unused_port' fixture name from older setups.
# Map it to pytest's 'unused_tcp_port' fixture if available.


@pytest.fixture
def aiohttp_unused_port(unused_tcp_port):
    # Return a factory like the original aiohttp_unused_port that can be called
    def _factory():
        return unused_tcp_port
    return _factory
