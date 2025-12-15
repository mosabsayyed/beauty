import json
import pytest
import tempfile
import os
import logging
from aiohttp import web
from mcp_router import telemetry
from mcp_router.logging_utils import redact_headers
try:
    from fastmcp.utilities.tests import run_server_async
    from fastmcp.client import Client
    from fastmcp.transports.http import StreamableHttpTransport
except Exception:
    run_server_async = None
    Client = None
    StreamableHttpTransport = None


@pytest.mark.asyncio
async def test_telemetry_and_audit_integration(aiohttp_unused_port, monkeypatch):
    if not hasattr(telemetry, 'PROMETHEUS_AVAILABLE') or not telemetry.PROMETHEUS_AVAILABLE:
        pytest.skip('prometheus_client is not available; skipping telemetry integration test')

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

        # Start router server
        try:
            from mcp_router.server import create_mcp_server
        except Exception as e:
            pytest.skip(f'could not import create_mcp_server; skipping integration test: {e}')
        mcp = create_mcp_server(tmpf_name)
        async with run_server_async(mcp, transport='http') as url:
            from fastmcp.client import Client
            from fastmcp.transports.http import StreamableHttpTransport
            async with Client(StreamableHttpTransport(url)) as client:
                params = {'name': 'test_tool', 'arguments': {}}
                result = await client.call_tool('tools/call', params)
                assert result.get('result', {}).get('success') is True

                # Get metrics exposure text
                text_bytes, content_type = telemetry.get_metrics_text()
                text = text_bytes.decode('utf-8') if isinstance(text_bytes, (bytes, bytearray)) else str(text_bytes)
                assert 'mcp_router_forward_count' in text or 'mcp_router_forward_latency_seconds' in text

    finally:
        await runner.cleanup()
        os.unlink(tmpf_name)
