Backend API — Full Chat Surface (extracted from code)

This document captures the EXISTING backend surface for the chat features so the frontend can implement mocks and integrate without assumptions. All fields and endpoints below are discovered directly from the codebase; no new endpoints are invented.

Primary source file (chat endpoints):
- [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:171)

1) High-level summary
- Transport: REST request/response (no WebSocket handlers found in chat.py).
- Auth: demo-mode in current code (server uses demo user id=1). There are TODO comments to replace with JWT later. See the login comments in [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:186).
- Main flow: frontend POSTs a user query to /message; backend builds conversation context, runs orchestrator, stores user + assistant messages and returns an aggregated response containing answer, insights, and artifacts (visualizations / tables).

2) Endpoints (discovered in chat.py)
- POST /message — handler: send_message
  - Request model: [`ChatRequest`](backend/app/api/routes/chat.py:122)
  - Response model: [`ChatResponse`](backend/app/api/routes/chat.py:135)
  - Purpose: send query, orchestrate LLM pipeline, store messages, return answer + artifacts.

- GET /conversations — handler: list_conversations
  - Response model: [`ConversationListResponse`](backend/app/api/routes/chat.py:154)
  - Purpose: list user conversations (demo user currently used).

- GET /conversations/{conversation_id} — handler: get_conversation_detail
  - Response model: [`ConversationDetailResponse`](backend/app/api/routes/chat.py:166)
  - Purpose: get conversation metadata + messages.

- DELETE /conversations/{conversation_id} — handler: delete_conversation
  - Purpose: delete conversation for demo user.

- GET /conversations/{conversation_id}/messages — handler: get_conversation_messages
  - Purpose: returns JSON { messages: [...] } where messages are read from DB and the code renames extra_metadata -> metadata for frontend compatibility. See code at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:463).

- GET /debug_logs/{conversation_id} — handler: get_debug_logs
  - Purpose: return raw debug events (llm_request, llm_response) for a conversation. See [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:480).

3) Pydantic models (exact names and fields from chat.py)
- ChatRequest (line reference: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:122))
  - query: str
  - conversation_id: Optional[int]
  - persona: Optional[str] = "transformation_analyst"

- Artifact (line reference: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:128))
  - artifact_type: str  # CHART, TABLE, REPORT, DOCUMENT
  - title: str
  - content: dict
  - description: Optional[str]

- ChatResponse (line reference: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:135))
  - conversation_id: int
  - message: str
  - visualization: Optional[dict]
  - insights: List[str]
  - artifacts: List[Artifact]
  - clarification_needed: Optional[bool]
  - clarification_questions: Optional[List[str]]
  - clarification_context: Optional[str]

- ConversationSummary / ConversationListResponse (lines: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:146) and [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:154))
  - ConversationSummary: id:int, title:str, message_count:int, created_at:str, updated_at:str
  - ConversationListResponse: conversations: List[ConversationSummary]

- MessageResponse (line [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:158))
  - id: int
  - role: str
  - content: str
  - created_at: str
  - metadata: Optional[dict]

- ConversationDetailResponse (line [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:166))
  - conversation: dict
  - messages: List[MessageResponse]

4) Example request / response (inferred from models)
- Example POST /message request (JSON)
{
  "query": "Show me projects with highest risk",
  "conversation_id": null,
  "persona": "transformation_analyst"
}

- Example POST /message response (JSON, simplified)
{
  "conversation_id": 42,
  "message": "Here are the top projects by risk...",
  "visualization": null,
  "insights": ["Insight A", "Insight B"],
  "artifacts": [
    {
      "artifact_type": "CHART",
      "title": "Risk by Project",
      "content": { /* chart config, Highcharts style */ },
      "description": "Top risks"
    },
    {
      "artifact_type": "TABLE",
      "title": "Query Results (10 rows)",
      "content": {
        "columns": ["project_id", "name", "risk_score"],
        "rows": [[1, "Alpha", 0.9], [2, "Beta", 0.87]]
      },
      "description": "Data table"
    }
  ],
  "clarification_needed": false,
  "clarification_questions": [],
  "clarification_context": null
}

Notes: artifact content is a dict and may contain chart configs or table rows. The code creates TABLE artifacts by packing columns and rows.

5) Runtime notes and behavior (important for frontend)
- Demo user: Current endpoints operate under a demo user (user_id = 1). There is an explicit TODO to replace with JWT auth. See comment at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:186).
- Orchestrator output: The orchestrator returns a dictionary structure (see usage at lines ~231-316 in [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:231)). Keys include: answer, analysis (insights), visualizations (list), data (query_results), cypher_executed, confidence.
- Artifacts: visualizations are converted into Artifact objects; query_results are converted into TABLE artifacts. The artifact content shape is not strongly typed in Python and should be treated as Record<string, any> by the frontend.
- Streaming: chat.py implements synchronous request/response. There are no delta streaming or websocket event handlers in this file. If the frontend requires streaming, backend changes will be necessary.

6) Session / conversation identification
- Conversations are numeric ids (int) created by SupabaseConversationManager. When creating a new conversation the endpoint returns the newly created conversation id. Conversation ids are used in subsequent GETs to fetch messages and details.
- Message ordering/pagination: get_conversation_messages uses limit=100 by default in the code; the endpoint signature does not currently expose cursor pagination params in chat.py (frontend should fetch messages and can page by calling the endpoint with server-side changes later).

7) CORS, base URL, and config notes
- The backend app main is in [`backend/app/main.py`](backend/app/main.py:1) which configures FastAPI and CORS middleware. Check that file if you need allowed origins or dev vs prod host settings.
- For local dev the frontend can point to the API base path used in the repository (e.g., http://localhost:8000) depending on how you run the backend.

8) Where to read more code for behavior
- Orchestration and LLM logic: [`backend/app/services/orchestrator_zero_shot.py`](backend/app/services/orchestrator_zero_shot.py:1)
- Conversation persistence and message CRUD: `SupabaseConversationManager` referenced in [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:17)
- Embeddings and other routes: [`backend/app/api/routes/embeddings.py`](backend/app/api/routes/embeddings.py:1)

9) Recommendations for frontend mock and integration
- Mock behavior should implement the exact REST endpoints above and return the same JSON shapes (especially `ChatResponse` and `MessageResponse`).
- Model artifact.content as an opaque object (Record<string, any>) and render it with canvas components based on artifact_type (TABLE, CHART).
- Do not assume streaming or WebSocket until backend implements it; implement UI that can accept a single full response first.
- For auth during integration: use demo-mode (no auth headers) when talking to the current dev backend unless the backend owner confirms JWT is enforced.

10) Next steps I can take (if you want me to produce artifacts)
- Generate a precise TypeScript contract file in-repo that mirrors the Pydantic models from [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:122) and a README mapping the types. (Will reflect demo-mode auth and omit WS types unless you request otherwise.)
- Or produce an OpenAPI spec extracted from the FastAPI app for frontend SDK generation.

If you want the TS contract generated now, reply in chat and I will create [`shared/api-contract.ts`](shared/api-contract.ts:1) that mirrors the models exactly (demo-mode by default).