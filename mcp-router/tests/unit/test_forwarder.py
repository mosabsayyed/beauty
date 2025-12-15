import asyncio
import json
import pytest
from aiohttp import web
from mcp_router.tool_forwarder import forward_http_mcp


@pytest.mark.asyncio
async def test_forward_http_mcp_success(aiohttp_unused_port):
    port = aiohttp_unused_port()

    async def handler(request):
        payload = await request.json()
        # echo back content with a custom field
        return web.json_response({'received': payload, 'ok': True})

    app = web.Application()
    app.router.add_post('/mcp/', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', port)
    await site.start()
    try:
        url = f'http://127.0.0.1:{port}/mcp/'
        payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}
        headers = {'mcp-session-id': 's-123', 'Authorization': 'Bearer token'}
        resp = await forward_http_mcp(url, payload, headers=headers)
        assert resp.get('ok') is True
        assert resp.get('received') == payload
    finally:
        await runner.cleanup()
