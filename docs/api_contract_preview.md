API Contract Preview — Discovered Existing Backend Surface

Scope chosen: Preview of existing chat-related endpoints and models discovered in the codebase for approval before generating TypeScript contract.

Files inspected (primary):
- [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:1)

Summary of discovered REST endpoints (from [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:171))
- POST /message
  - Handler: `send_message`
  - Purpose: send user query, store messages, run orchestrator, return AI response with artifacts
  - Request model in code: [`ChatRequest`](backend/app/api/routes/chat.py:122)
  - Response model in code: [`ChatResponse`](backend/app/api/routes/chat.py:135)

- GET /conversations
  - Handler: `list_conversations`
  - Response model: [`ConversationListResponse`](backend/app/api/routes/chat.py:154)

- GET /conversations/{conversation_id}
  - Handler: `get_conversation_detail`
  - Response model: [`ConversationDetailResponse`](backend/app/api/routes/chat.py:166)

- DELETE /conversations/{conversation_id}
  - Handler: `delete_conversation`

- GET /conversations/{conversation_id}/messages
  - Handler: `get_conversation_messages`
  - Returns: JSON { messages: [...] } with message fields mapped from DB (note: code renames extra_metadata -> metadata) (see function at [`backend/app/api/routes/chat.py:463`](backend/app/api/routes/chat.py:463))

- GET /debug_logs/{conversation_id}
  - Handler: `get_debug_logs` (raw debug logs for conversation) ([`backend/app/api/routes/chat.py:480`](backend/app/api/routes/chat.py:480))

Primary Pydantic models and shapes (exact names in code)
- [`ChatRequest`](backend/app/api/routes/chat.py:122)
  - fields: query: str, conversation_id?: int, persona?: str

- [`Artifact`](backend/app/api/routes/chat.py:128)
  - fields: artifact_type, title, content, description?

- [`ChatResponse`](backend/app/api/routes/chat.py:135)
  - fields: conversation_id, message, visualization?, insights: List[str], artifacts: List[Artifact], clarification flags

- [`ConversationSummary`](backend/app/api/routes/chat.py:146)
- [`ConversationListResponse`](backend/app/api/routes/chat.py:154)
- [`MessageResponse`](backend/app/api/routes/chat.py:158)
- [`ConversationDetailResponse`](backend/app/api/routes/chat.py:166)

Other backend modules and routes found (may be relevant later)
- Embeddings endpoints: [`backend/app/api/routes/embeddings.py`](backend/app/api/routes/embeddings.py:1) (populate and search endpoints)
- Sync endpoints: [`backend/app/api/routes/sync.py`](backend/app/api/routes/sync.py:1) (neo4j sync APIs)
- Setup and health endpoints: [`backend/app/api/v1/setup.py`](backend/app/api/v1/setup.py:1), [`backend/app/api/v1/health.py`](backend/app/api/v1/health.py:1)
- Debug endpoints: [`backend/app/api/routes/debug.py`](backend/app/api/routes/debug.py:1)

Runtime and implementation notes (from code)
- Authentication: current handlers use a demo user (user_id = 1) and include TODO to replace with JWT auth (see comment in [`backend/app/api/routes/chat.py:186`](backend/app/api/routes/chat.py:186)).
- Conversation storage and retrieval are implemented via `SupabaseConversationManager` (dependency returned by `get_conversation_manager`) — see [`backend/app/api/routes/chat.py:17`](backend/app/api/routes/chat.py:17).
- Orchestration is performed by `OrchestratorZeroShot` in [`backend/app/api/routes/chat.py:231`](backend/app/api/routes/chat.py:231) which returns a result dict with keys like answer, analysis, visualizations, data, cypher_executed.
- Message persistence: assistant responses are stored with extra metadata including artifacts and insights (see add_message usage at [`backend/app/api/routes/chat.py:319`](backend/app/api/routes/chat.py:319)).
- Streaming / WebSocket: no explicit WS handlers found in `chat.py`; current implementation is synchronous request/response returning aggregated artifacts. If streaming exists, it's implemented elsewhere or not yet implemented.

Gaps and items that must be represented in the package
- Exact field types for `artifacts.content` and visualization config (Highcharts config) are loosely typed as dicts in Python; TypeScript contract should mirror this as generic Record<string, any> or more specific when we inspect visualizer code.
- No existing WS event schema present in `chat.py` — do not invent WS events. If frontend requires streaming, agree with backend owners on WS design or confirm alternate streaming implementation.
- Auth: code currently uses demo user; package should mark auth as TODO and capture current behavior (no auth required, demo user) so frontend mock can reflect reality.

Proposed preview deliverable
- A precise list of endpoints and Pydantic models (this file) for your review
- After approval I will generate an in-repo TypeScript contract file that maps these exact endpoints and models (no invented endpoints). The TS file will clearly annotate uncertain/loose fields (e.g., artifact content) and mark TODOs (auth, streaming) for follow-up.

Questions for you before I generate the TS contract package
1) Should the TypeScript contract encode the current demo-auth behavior (calls work without auth and use demo user) or should it assume the TODO (JWT auth) and include auth headers in client signatures? (I will mark it as demo-mode by default and add a well-labeled TODO if you want.)

2) Do you want WS/streaming included in the TS package now, or should I omit WebSocket types until backend implements a streaming API? (Current code shows no WS in chat endpoints.)

Please review this preview. If you approve, I will produce the TypeScript contract file under [`shared/api-contract.ts`](shared/api-contract.ts:1) that directly reflects the models above and create a small README mapping TS types to the original Python Pydantic models.