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
async def test_policy_read_only_blocks_write(aiohttp_unused_port):
    port = aiohttp_unused_port()

    async def handler(request):
        # Should not be called; if called, indicate failure
        payload = await request.json()
        return web.json_response({'should_not_receive': True, 'payload': payload})

    app = web.Application()
    app.router.add_post('/mcp/', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', port)
    await site.start()
    try:
        # runtime registry
        registry_config = {
            'backends': [
                {'name': 'stub-backend', 'type': 'http_mcp', 'url': f'http://127.0.0.1:{port}/mcp/'}
            ],
            'tools': [
                {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward', 'policy': {'read_only': True}}
            ]
        }

        import tempfile, json
        tmpf = tempfile.NamedTemporaryFile('w+', delete=False)
        json.dump(registry_config, tmpf)
        tmpf.flush()
        tmpf_name = tmpf.name
        tmpf.close()

        if not run_server_async:
            pytest.skip('fastmcp utilities or client not available; skipping integration test')

        from mcp_router.server import create_mcp_server
        mcp = create_mcp_server(tmpf_name)
        async with run_server_async(mcp, transport='http') as url:
            async with Client(StreamableHttpTransport(url)) as client:
                params = {'name': 'test_tool', 'arguments': {'op': 'write'}}
                # Call tools/call with a write op which should be blocked by policy
                result = await client.call_tool('tools/call', params)
                assert result is not None
                assert result.content is not None
                # For policy enforcement we return an error ToolResult - check isError or error fields
                if isinstance(result.content, dict):
                    assert result.content.get('isError') is True or 'error' in result.content
                else:
                    # fallback: assert the call failed
                    assert False, 'Expected policy enforcement error'
    finally:
        await runner.cleanup()
