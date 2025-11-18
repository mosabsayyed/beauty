# Streaming Protocol for Cognitive Digital Twin

This document documents the Streaming Server-Sent Events (SSE) protocol used by the Cognitive Digital Twin.

## Framing
- The backend emits strictly SSE-framed messages. Each event is separated by a double newline (`\n\n`).
- Each event contains a `data:` prefix followed by a JSON payload.

Example event (token):

```
data: {"token": "partial text here"}

```

Termination event:

```
data: [DONE]

```

## Payload formats
- Token payload: `{"token": "..."}` — appends to the accumulated text buffer on the client.
- Upstream providers may use different chunk shapes. The orchestrator normalizes upstream frames to this SSE format.

## Client expectations
- The frontend should use `response.body.getReader()` and `TextDecoder('utf-8')` with `{stream: true}`.
- Accumulate text from each parsed `token` field into a single `accumulatedRaw` string.
- Detect `memory_process.thought_trace` and `answer` by parsing `accumulatedRaw` or by parsing token-level JSON when available.
- On receiving `data: [DONE]` the client should perform a final `JSON.parse(accumulatedRaw)` to extract full structured fields like `visualizations`, `data`, and `analysis`.

## Error frames
- The orchestrator may emit `data: {"error": "..."}` frames on upstream issues. Clients should handle these gracefully and surface errors to the user.

## Notes on multibyte characters
- Use `TextDecoder({stream: true})` to correctly handle multibyte sequences that may be split across chunks.

## Security and CORS
- Ensure CORS allows the frontend origin to connect to the streaming endpoint and that authentication is validated when appropriate.
