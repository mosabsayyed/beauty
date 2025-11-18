# Project Overview: Frontend & Backend Integration

## Frontend Setup

- **Location:** `frontend/`
- **Framework:** React (bootstrapped with Create React App)
- **Language:** TypeScript
- **Entry Point:** `src/index.tsx` renders `<App />` from `src/App.tsx`.
- **Main Features:**
  - Chat interface (`src/components/Chat/Chat.tsx`)
  - Canvas visualization (`src/components/Canvas/CanvasManager.tsx`)
  - Sidebar for conversations
  - Debug panel
- **Styling:**
  - Uses CSS files: `src/styles/integrate-full.css`, `src/index.css`, `src/App.css`, `src/canvas.css`
- **API Communication:**
  - Uses environment variable `REACT_APP_API_URL` (see `.env.example`) for backend API endpoint.
  - If not set, defaults to relative `/api/v1` paths or uses proxy (`package.json` proxy: `http://localhost:8008`).
  - All API calls are made via `src/services/chatService.ts`.
- **Build & Run:**
  - `npm start` for development (default port 3000)
  - `npm run build` for production build
  - See `frontend/README.md` for more details

## Backend Setup

- **Location:** `backend/`
- **Framework:** FastAPI (Python)
- **Entry Point:** `app/main.py`
- **Main Features:**
  - REST API endpoints for chat, embeddings, sync, debug (see `app/api/routes/`)
  - Handles chat requests, conversation management, artifact generation
  - Integrates with Supabase (PostgreSQL) and Neo4j (GraphDB)
- **Configuration:**
  - Uses `.env` file in `backend/` for secrets and DB config (see `app/config/__init__.py`)
  - Database schema defined in `db_schema.sql` and `app/config/schema_definition.json`
  - Worldview mapping in `app/config/worldview_map.json`
- **Dependencies:**
  - Listed in `backend/requirements.txt` (FastAPI, SQLAlchemy, asyncpg, supabase, neo4j, etc.)
- **Run:**
  - Typically started via a script (e.g., `sb.sb.sh`, `sf1.sh`, `sf2.sh`)
  - Serves API on configured port (default: 8008)

## Integration: How Frontend & Backend Work Together

- **API Contract:**
  - Frontend sends chat and other requests to backend REST API endpoints (default `/api/v1/chat/message`)
  - Backend processes requests, manages conversations, generates responses and artifacts (tables, charts)
  - Artifacts and responses are returned as JSON and rendered in the frontend
- **Authentication:**
  - MVP uses demo user (id=1); JWT authentication is planned (see backend code comments)
- **Data Flow:**
  1. User interacts with chat UI in frontend
  2. Frontend sends request to backend API
  3. Backend processes request, interacts with Supabase/Neo4j, generates response
  4. Response (including artifacts) is sent back to frontend and displayed

  ## Streaming Cognitive Digital Twin (Experimental)

  - The backend exposes a streaming endpoint at `/api/chat/message/stream` which returns Server-Sent Events (SSE) for real-time "thinking" updates from the Cognitive Digital Twin orchestrator.
  - The frontend includes helpers to consume SSE (`frontend/src/utils/streaming.ts`) and a `MessageBubble` component to render the real-time `thought_trace` while the model is streaming.
  - See `docs/streaming_protocol.md` and `docs/streaming_caveats.md` for details on framing, proxy configuration, and testing tips.

## Configuration Files & References

- **Frontend:**
  - `.env.example` (API endpoint config)
  - `package.json` (proxy, dependencies)
- **Backend:**
  - `.env` (DB/API secrets)
  - `requirements.txt` (Python dependencies)
  - `db_schema.sql`, `app/config/schema_definition.json` (DB schema)
  - `app/config/worldview_map.json` (domain mapping)

---

_All information above is based strictly on the codebase and configuration files. No assumptions or inferences have been made._
