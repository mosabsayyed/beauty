import pytest
import asyncio
from aiohttp import web
from mcp_router.tool_forwarder import forward_http_mcp


@pytest.mark.asyncio
async def test_forward_http_mcp_non200_raises(aiohttp_unused_port):
    port = aiohttp_unused_port()

    async def handler(request):
        return web.json_response({'error': 'server error'}, status=500)

    app = web.Application()
    app.router.add_post('/mcp/', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', port)
    await site.start()
    try:
        url = f'http://127.0.0.1:{port}/mcp/'
        payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}
        with pytest.raises(RuntimeError):
            await forward_http_mcp(url, payload, headers={})
    finally:
        await runner.cleanup()
