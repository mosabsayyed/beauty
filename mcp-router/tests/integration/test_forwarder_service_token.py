import os
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
async def test_forwarder_injects_service_token(aiohttp_unused_port, monkeypatch):
    port = aiohttp_unused_port()

    async def handler(request):
        # Ensure Authorization header present and matches the service token
        auth_header = request.headers.get('Authorization')
        assert auth_header == 'Bearer svc-abc'
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
        # create runtime config override
        registry_config = {
            'backends': [
                {'name': 'stub-backend', 'type': 'http_mcp', 'url': f'http://127.0.0.1:{port}/mcp/'}
            ],
            'tools': [
                {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward'}
            ]
        }

        import tempfile, json
        tmpf = tempfile.NamedTemporaryFile('w+', delete=False)
        json.dump(registry_config, tmpf)
        tmpf.flush()
        tmpf_name = tmpf.name
        tmpf.close()

        # Set service token env var so router will inject it when no Authorization provided
        monkeypatch.setenv('MCP_ROUTER_SERVICE_TOKEN', 'svc-abc')

        from mcp_router.server import create_mcp_server
        mcp = create_mcp_server(tmpf_name)
        async with run_server_async(mcp, transport='http') as url:
            async with Client(StreamableHttpTransport(url)) as client:
                params = {'name': 'test_tool', 'arguments': {}}
                # Call tools/call with no Authorization header; expect service token injection
                result = await client.call_tool('tools/call', params)
                assert result is not None
                assert result.content is not None
    finally:
        await runner.cleanup()
