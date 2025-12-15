import pytest
import asyncio
from aiohttp import web
try:
    from fastmcp.utilities.tests import run_server_async
    from fastmcp.client import Client
    from fastmcp.client.transports import StreamableHttpTransport
except Exception:
    run_server_async = None
    Client = None
    StreamableHttpTransport = None


@pytest.mark.asyncio
async def test_http_forwarder_forwards_headers(aiohttp_unused_port):
    # Start a stub backend that checks for headers and returns a canned result
    port = aiohttp_unused_port()

    async def handler(request):
        assert request.headers.get('mcp-session-id') == 'test-session'
        assert 'Authorization' in request.headers
        payload = await request.json()
        return web.json_response({'success': True, 'payload': payload})

    app = web.Application()
    app.router.add_post('/mcp/', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', port)
    await site.start()
    if not run_server_async:
        pytest.skip('fastmcp utilities or client not available; skipping integration test')
    try:
        # Start the router with the config pointing to this backend
        # Create a simple in-memory router config that uses http_mcp backend
        import os
        from mcp_router.server import create_mcp_server
        from mcp_router.tool_registry import ToolRegistry

        # Create runtime config override
        registry_config = {
            'backends': [
                {'name': 'stub-backend', 'type': 'http_mcp', 'url': f'http://127.0.0.1:{port}/mcp/'}
            ],
            'tools': [
                {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward'}
            ]
        }

        # Write config to a temp file for the registry
        import tempfile, json
        tmpf = tempfile.NamedTemporaryFile('w+', delete=False)
        json.dump(registry_config, tmpf)
        tmpf.flush()
        tmpf_name = tmpf.name
        tmpf.close()

        mcp = create_mcp_server(tmpf_name)
        async with run_server_async(mcp, transport='http') as url:
            async with Client(StreamableHttpTransport(url)) as client:
                params = {'name': 'test_tool', 'arguments': {}}
                # Pass headers via run_server_async client if possible - use Session headers on the transport
                result = await client.call_tool('tools/call', params, headers={'mcp-session-id': 'test-session', 'Authorization': 'Bearer abc'})
                # The forwarder returns the backend's JSON
                assert result is not None
                assert result.content is not None
    finally:
        await runner.cleanup()
