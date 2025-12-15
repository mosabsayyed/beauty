import json
import pytest
import tempfile
import os
import logging
from aiohttp import web
try:
    from fastmcp.utilities.tests import run_server_async
    from fastmcp.client import Client
    from fastmcp.transports.http import StreamableHttpTransport
except Exception:
    run_server_async = None
    Client = None
    StreamableHttpTransport = None


@pytest.mark.asyncio
async def test_audit_event_emitted_for_forward(aiohttp_unused_port, monkeypatch, caplog):
    port = aiohttp_unused_port()

    async def handler(request):
        data = await request.json()
        return web.json_response({'jsonrpc': '2.0', 'id': data.get('id'), 'result': {'success': True}})

    app = web.Application()
    app.router.add_post('/mcp/', handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', port)
    await site.start()
    try:
        registry_config = {
            'backends': [
                {'name': 'stub-backend', 'type': 'http_mcp', 'url': f'http://127.0.0.1:{port}/mcp/', 'auth_header_key': None}
            ],
            'tools': [
                {'name': 'test_tool', 'backend': 'stub-backend', 'type': 'mcp-forward'}
            ]
        }
        tmpf = tempfile.NamedTemporaryFile('w+', delete=False)
        json.dump(registry_config, tmpf)
        tmpf.flush()
        tmpf_name = tmpf.name
        tmpf.close()

        try:
            from mcp_router.server import create_mcp_server
        except Exception as e:
            pytest.skip(f'could not import create_mcp_server; skipping integration test: {e}')
        from mcp_router.logging_utils import DEFAULT_REDACT_KEYS
        caplog.set_level(logging.INFO, logger='mcp_router')

        mcp = create_mcp_server(tmpf_name)
        async with run_server_async(mcp, transport='http') as url:
            from fastmcp.client import Client
            from fastmcp.transports.http import StreamableHttpTransport
            async with Client(StreamableHttpTransport(url)) as client:
                params = {'name': 'test_tool', 'arguments': {}}
                result = await client.call_tool('tools/call', params)
                assert result.get('result', {}).get('success') is True

                # Check logs for an audit entry
                found = False
                for rec in caplog.records:
                    if 'audit.tool_call' in rec.getMessage() or 'audit.tool_call' in getattr(rec, 'message', ''):
                        found = True
                        break
                assert found
    finally:
        await runner.cleanup()
        os.unlink(tmpf_name)
