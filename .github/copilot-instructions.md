# Copilot instructions (JOSOOR / chatmodule)

## Big picture
- Services/ports: frontend (React) `frontend/` on **:3000**, graph sidecar `graph-server/` on **:3001**, backend (FastAPI) `backend/` on **:8008**, MCP routers **:8201 (Noor)** / **:8202 (Maestro)**, Neo4j MCP server **:8080**. See [00_START_HERE.md](../00_START_HERE.md) and [docs/BACKEND_ARCHITECTURE.md](../docs/BACKEND_ARCHITECTURE.md).
- Core chat flow: frontend → `POST /api/v1/chat/message` → backend orchestrator → Groq Responses API with **MCP tool** → persona MCP router (`NOOR_MCP_ROUTER_URL`/`MAESTRO_MCP_ROUTER_URL`) → tools (e.g. `retrieve_instructions`, `read_neo4j_cypher`, `recall_memory`) → JSON response w/ artifacts → frontend renders.

## Dev workflow (scripts first)
- Backend stack: `./sb.sh` (starts ngrok, Neo4j MCP server on :8080, MCP routers on :8201/:8202/:8203, then backend via `backend/run_groq_server.sh`; logs under `logs/` + `backend/logs/`).
- Frontend stack: `./sf1.sh` (starts graph-server on :3001, then frontend on :3000; logs under `logs/` + `frontend/logs/`).
- Stop everything: `./stop_dev.sh` (kills project-root processes + common dev binaries).
- Note: `./sb.sh` starts the FastAPI backend (:8008) plus the MCP stack (ngrok, Neo4j MCP server, and persona routers).

## Project conventions / gotchas
- Styling: do **not** introduce Tailwind utility classes. Use CSS variables from [frontend/src/styles/theme.css](../frontend/src/styles/theme.css) and the existing CSS files in `frontend/src/styles/`.
- Proxy split (important for debugging “wrong server” bugs): the Vite dev server proxies `/api/neo4j/*`, `/api/graph/*`, `/api/dashboard/*`, `/api/business-chain/*`, `/api/debug/*` to the graph-server (:3001) per [frontend/vite.config.ts](../frontend/vite.config.ts).
- Backend data access: Supabase is used via the REST client in `backend/app/db/supabase_client.py` (not raw SQL); Neo4j access is via `backend/app/db/neo4j_client.py` and `backend/app/services/neo4j_service.py`.
- Orchestration pattern: `backend/app/services/orchestrator_universal.py` performs a **single** Groq call and lets the model call MCP tools; Tier 1 prompt content is loaded from DB by `backend/app/services/tier1_assembler.py`.
- Tracing/observability: backend initializes OpenTelemetry in [backend/app/main.py](../backend/app/main.py); debug endpoints include `GET /api/v1/debug/traces` (see [00_START_HERE.md](../00_START_HERE.md)).

## Where to make changes
- Backend routes: `backend/app/api/routes/*.py` (registered in [backend/app/main.py](../backend/app/main.py)).
- Frontend API calls: `frontend/src/lib/services/chatService.ts` and `frontend/src/lib/services/authService.ts`; types live in `frontend/src/types/*`.

## Config (common env vars)
- Backend (typically `backend/.env`): `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEO4J_URI`, `NEO4J_PASSWORD`, `NOOR_MCP_ROUTER_URL`, `MAESTRO_MCP_ROUTER_URL`, `BACKEND_ALLOW_ORIGINS`.
- Start here for details: [docs/BACKEND_ARCHITECTURE.md](../docs/BACKEND_ARCHITECTURE.md) and [docs/FRONTEND_ARCHITECTURE.md](../docs/FRONTEND_ARCHITECTURE.md).