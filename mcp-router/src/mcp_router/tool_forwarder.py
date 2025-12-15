import aiohttp
import asyncio
import json
import time
from typing import Dict, Any, Optional
from .logging_utils import log_event, redact_headers, audit_event
import uuid
from .telemetry import inc_forward_count, observe_forward_latency, inc_auth_failure


async def forward_http_mcp(url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None, timeout: int = 30) -> Dict[str, Any]:
    # Ensure we always have a headers dict
    headers = headers or {}
    # Set content type header
    headers['Content-Type'] = 'application/json'
    # Set Accept header to support SSE and JSON
    headers['Accept'] = 'application/json, text/event-stream'

    # Log the outbound forward event with redaction
    log_event('forward.request', {'url': url, 'payload': payload, 'headers': redact_headers(headers)})
    tool = None
    try:
        tool = payload.get('params', {}).get('name')
    except Exception:
        tool = 'unknown'
    backend = url
    start = time.monotonic()
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers, timeout=timeout) as resp:
            if 'text/event-stream' in resp.headers.get('Content-Type', ''):
                # Handle SSE: read full text and parse
                text = await resp.text()
                body = None
                for line in text.splitlines():
                    line = line.strip()
                    if line.startswith('data: '):
                        data_str = line[6:]
                        try:
                            body = json.loads(data_str)
                            break
                        except Exception:
                            pass
                if body is None:
                    # If we didn't find data, maybe it was an error or empty stream
                    # Try to see if the whole text is JSON (sometimes backend might send JSON even with SSE header?)
                    try:
                        body = json.loads(text)
                    except:
                        raise RuntimeError(f"SSE stream closed without valid data. Response: {text[:100]}...")
            else:
                try:
                    body = await resp.json()
                except Exception:
                    body = await resp.text()
            if resp.status != 200:
                log_event('forward.error', {'url': url, 'status': resp.status, 'body': (body if isinstance(body, dict) else {'body': str(body)})})
                # Emit audit event for the failed forward
                try:
                    request_id = payload.get('id') or str(uuid.uuid4())
                except Exception:
                    request_id = str(uuid.uuid4())
                try:
                    audit_event(request_id=request_id, tool_name=str(tool), backend=backend, caller={'headers': redact_headers(headers)}, arguments=(payload.get('params', {}).get('arguments') if isinstance(payload, dict) else {}), status=str(resp.status), duration_ms=(time.monotonic() - start) * 1000.0, success=False)
                except Exception:
                    pass
                if resp.status == 401:
                    inc_auth_failure(backend=backend, tool=str(tool))
                raise RuntimeError(f"Backend return non-200 status {resp.status}: {body}")
            duration = time.monotonic() - start
            inc_forward_count(backend=backend, tool=str(tool))
            observe_forward_latency(duration, backend=backend, tool=str(tool))
            # Log the response safely
            log_event('forward.response', {'url': url, 'response': (body if isinstance(body, dict) else {'body': str(body)}), 'duration_seconds': duration})
            # Emit audit event: use payload id if provided, otherwise generate a uuid
            try:
                request_id = payload.get('id') or str(uuid.uuid4())
            except Exception:
                request_id = str(uuid.uuid4())
            try:
                audit_event(request_id=request_id, tool_name=str(tool), backend=backend, caller={'headers': redact_headers(headers)}, arguments=(payload.get('params', {}).get('arguments') if isinstance(payload, dict) else {}), status='ok', duration_ms=duration * 1000.0, success=True)
            except Exception:
                pass
            return body

# Synchronous wrapper for tests that need to run without an event loop

def forward_http_mcp_sync(url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None, timeout: int = 30) -> Dict[str, Any]:
    return asyncio.get_event_loop().run_until_complete(forward_http_mcp(url, payload, headers=headers, timeout=timeout))
