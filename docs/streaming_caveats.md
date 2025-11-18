# Streaming Caveats and Deployment Guidance

This document describes deployment considerations for the Cognitive Digital Twin streaming endpoint (`/api/chat/message/stream`).

## Reverse Proxy Buffering (Critical)
Most enterprise reverse proxies (NGINX, AWS ALB, Cloudflare) buffer responses by default. This can prevent real-time streaming from reaching clients until a buffer threshold is reached.

### NGINX recommendation (location-specific):

```
location /api/chat/message/stream {
    proxy_pass http://backend_upstream;
    # Critical for SSE/Streaming
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Notes:
- Add this to the server/location configuration that routes to your backend.
- `X-Accel-Buffering: no` response header is also honored by NGINX as a hint.

## AWS ALB / ELB
- ALBs generally forward upstream responses but may buffer at the client side. Test with your environment.
- Consider using WebSockets if ALB behavior is inconsistent.

## Cloudflare
- Cloudflare and other CDNs may buffer responses. Disable HTTP caching for this endpoint and consider bypassing Cloudflare for streaming traffic.

## FastAPI / Uvicorn Headers
Ensure the FastAPI response includes headers that reduce buffering risk:

```python
return StreamingResponse(
    stream_generator,
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    },
)
```

## Testing Tips
- Use `curl --no-buffer` or `http --stream` to test streaming locally.
- Test with Arabic or emoji characters to verify `TextDecoder({stream:true})` handling on the frontend.

## Fallback
- If proxies cannot be configured, consider a WebSocket-based fallback which is less likely to be buffered by intermediaries.

## Security
- Ensure proper authentication/authorization for the streaming endpoint before enabling in production.
