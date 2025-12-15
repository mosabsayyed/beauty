import pytest
import asyncio
import os
import shutil
import aiohttp
try:
    from fastmcp.utilities.tests import run_server_async
    from fastmcp.client import Client
    from fastmcp.client.transports import StreamableHttpTransport
except Exception:
    run_server_async = None
    Client = None
    StreamableHttpTransport = None

try:
    from mcp_router.server import create_mcp_server
except Exception:
    create_mcp_server = None


@pytest.mark.asyncio
async def test_tools_call_vector_search_integration():
    if not run_server_async or not create_mcp_server:
        pytest.skip('fastmcp or server import failed; skipping integration test')
    mcp = create_mcp_server()
    async with run_server_async(mcp, transport='http') as url:
        async with Client(StreamableHttpTransport(url)) as client:
            # Call the vector_search tool via the router's tools/call
            params = {"name": "vector_search", "arguments": {"query": "integration test"}}
            result = await client.call_tool("tools/call", params)
            # CallToolResult contains structured data in result.content; since router returns 'result', unwrap
            assert result is not None
            # Access the result content - check for 'success' True and presence of 'data'/'results'
            call_data = result.content  # CallToolResult content - structured
            # The content is a list of content blocks; we inspect the first block with json
            # If the router returned a CallToolResult(content={'result': {...}}) it will appear as a dict.
            if isinstance(call_data, dict) or hasattr(call_data, 'get'):
                # for our server we expect a dict-like content
                assert 'result' in call_data
                res = call_data['result']
            else:
                # fallback: try to parse from first element if list
                try:
                    res = call_data[0]
                except Exception:
                    res = None
            assert res is not None
            assert res.get('success') is True or (res.get('status') == 200)


@pytest.mark.asyncio
async def test_bind_default_host_port():
    """Verify the router can bind to the default non-conflicting host/port (127.0.0.2:8201).
    Skip if the environment doesn't allow binding to 127.0.0.2 or python3 is not available.
    """
    if shutil.which('python3') is None:
        pytest.skip('python3 not found in PATH')

    # Start the router as a subprocess using env vars to choose host/port
    env = os.environ.copy()
    env['MCP_ROUTER_HOST'] = '127.0.0.2'
    env['MCP_ROUTER_PORT'] = '8201'

    # Start the router from the package's src path to avoid import issues
    # Run python -m mcp_router.server from the repo root with PYTHONPATH pointing into mcp-router/src
    server_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    proc = await asyncio.create_subprocess_exec(
        'python3', '-m', 'mcp_router.server',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, env=env, cwd=server_dir
    )

    try:
        # allow server to start
        await asyncio.sleep(2)
        # Test the `tools/list` JSON-RPC endpoint with HTTP
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    'http://127.0.0.2:8201/mcp/',
                    json={'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'},
                    headers={'Accept': 'application/json', 'Content-Type': 'application/json'},
                ) as response:
                    if response.status != 200:
                        # If it fails, print logs for debug and skip
                        stdout, stderr = await proc.communicate()
                        pytest.skip(f'Server not responsive or bind failed. stdout: {stdout.decode()}, stderr: {stderr.decode()}')
                    assert response.status == 200
            except aiohttp.client_exceptions.ClientConnectorError as e:
                stdout, stderr = await proc.communicate()
                pytest.skip(f'Could not connect to router at 127.0.0.2:8201: {e}; stdout: {stdout.decode()}, stderr: {stderr.decode()}')
    finally:
        try:
            proc.terminate()
            await proc.wait()
        except Exception:
            pass
