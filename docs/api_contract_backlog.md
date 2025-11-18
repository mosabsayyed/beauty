API Contract Backlog and Integration Notes

Overview
Selected integration preference: Secure default (httpOnly refresh cookie + short-lived JWT in memory; Authorization Bearer for REST; WS auth via cookie handshake or initial auth message; WebSocket for bi-directional streaming; strict TypeScript contract v1)

Purpose
This document captures the agreed contract and next steps so frontend and backend can develop in parallel and swap the mock adapter for the real API without coupling.

Key Decisions
- Transport split: REST for CRUD/history, WebSocket for real-time streaming and typing.
- Auth: httpOnly refresh cookie + short-lived access JWT in memory; Authorization: Bearer header for REST.
- WS auth: rely on cookie-based session or an initial auth message carrying the current short-lived JWT.
- Message envelope: support multiple content blocks and a status field to represent streaming / partial states.

Authentication Flow (high level)
- Login: POST /auth/login -> sets httpOnly refresh cookie; returns short-lived access JWT in response body (or set in memory client).
- Refresh: POST /auth/refresh -> uses cookie to issue new access JWT.
- Logout: POST /auth/logout -> clears refresh cookie and revokes server session.
- Token storage: access JWT kept in JS memory (not localStorage); refresh token in httpOnly secure cookie.
- Authorization header: Authorization: Bearer <access_jwt> for REST requests.

WebSocket Handshake
- Endpoint: wss://{API_HOST}/ws/chat
- Open WS connection from client; server reads httpOnly cookie on upgrade (recommended when same origin / proper cookies allowed).
- Alternative: if cookie unavailable, client sends initial authentication message: { type: auth, token: <access_jwt> } immediately after opening.
- Server responds with ack or error message; only after ack should client send chat messages.

Transports and Endpoints (minimum)
- POST /api/messages -> send a new user message (non-streaming call or simple send)
- GET /api/history?session_id=... -> get conversation history (paged)
- GET /api/sessions -> list user sessions/conversations
- POST /api/sessions -> create new session
- WS /ws/chat -> streaming messages and events (message delta chunks, typing, tool calls)

Message Envelope (conceptual)
Each message is an envelope that can contain one or more content blocks and metadata:
- id: string (UUID)
- session_id: string
- role: user | assistant | system | tool
- contents: array of content blocks. each block: { type: text | delta | attachment_ref | table | code | chart, value: string | structured, metadata? }
- status: processing | partial | done | error
- parent_id: optional reference for threaded replies or tool calls
- created_at, updated_at: timestamps

Content block examples (described)
- text block for full text
- delta blocks for streaming partial text with sequence ids
- attachment_ref block points to a resource id or URL served by backend/CDN

Attachments and Rich Content
- Attachments are objects with: id, mime, url (signed for private content), size, metadata (e.g., chart spec, table schema)
- Backend returns attachment metadata in message content; frontend fetches file via signed URL when needed.

Streaming, Partial Responses, and Typing
- WS will emit delta messages with envelope { event: delta, message_id, block_index, chunk_index, text_chunk, final: boolean }
- Terminal event: event: done with final message state.
- Typing indicator: event: typing with session_id and user_id

Error Shape
- Standard shape for REST errors: { error: { code: string, message: string, details?: any } }
- WS error messages: { event: error, code, message, related_message_id? }

Versioning and Contract Evolution
- Place the contract under [`shared/api-contract.ts`](shared/api-contract.ts:1) and add a top-level version const: CONTRACT_VERSION = 'v1'
- Maintain CHANGELOG in the docs and increment major version for breaking changes.

Files to create (deliverables)
- [`docs/api_contract_backlog.md`](docs/api_contract_backlog.md:1) (this file)
- [`shared/api-contract.ts`](shared/api-contract.ts:1) (TypeScript interfaces and APIClient)
- [`frontend/src/api/mockAdapter.ts`](frontend/src/api/mockAdapter.ts:1) (mock client with same surface)
- Backend endpoints: implement routes under [`backend/app/routes/`](backend/app/routes/:1)

Mock adapter swap instructions
- Frontend imports the API surface from shared types and a default client path that points to mockAdapter during dev.
- When integration begins, swap default import to real client implementation that wraps fetch/ws.

Integration acceptance criteria
- Frontend compiles against shared types and runs UI with mockAdapter without errors.
- Real backend passes the same TypeScript contract in end-to-end smoke test: send message -> receive streaming deltas -> final done state.
- Auth handshake works and session persists across refresh flows.

Next steps (short term)
1) I (backend) finalize and commit [`shared/api-contract.ts`](shared/api-contract.ts:1) with full interfaces and examples.
2) Frontend AI implements mockAdapter to compile against types.
3) Schedule 2 hour integration session to switch mock -> real and validate streaming + attachments.

Questions for frontend AI
- Do you require server-sent rendering hints for canvas components (e.g., chart spec, spreadsheet schema) or will you generate them client-side from attachment metadata?
- Preferred pagination size for history endpoint (default 20)?

Contact points and ownership
- Backend: implementors of routes, auth, streaming, attachments.
- Frontend: UI, canvas rendering, mockAdapter.

Final note
If you approve this, I will create the TypeScript contract file [`shared/api-contract.ts`](shared/api-contract.ts:1) next and implement the initial backend endpoints as stubs so the frontend can integrate.
