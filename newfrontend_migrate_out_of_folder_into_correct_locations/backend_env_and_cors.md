Backend CORS and Environment / Config Details

Source: [`backend/app/main.py`](backend/app/main.py:1)

CORS Middleware
- Configured with:
  - allow_origins: ["*"]
  - allow_credentials: True
  - allow_methods: ["*"]
  - allow_headers: ["*"]

Implications for frontend:
- The dev backend currently allows all origins and headers. This makes local frontend dev straightforward (no CORS blocking).
- For production, consider tightening allow_origins to the deployed frontend domain(s) and turning off broad wildcard origins.

App routes and prefixes (important base paths):
- Health: /api/v1/health
- Setup: /api/v1/setup
- Chat: /api/v1/chat
- Embeddings: /api/v1/embeddings
- Sync: /api/v1/sync

Static files
- If a frontend directory exists in the repo root, the backend mounts it at /static and serves index.html at root (/).

Environment and runtime notes
- The FastAPI app runs a lifespan that connects to Supabase (REST-based client) and Neo4j at startup. See the printed messages in `lifespan` for connection success/failure.
- No explicit environment variable names are referenced in `main.py` itself; check `backend/.env` or other config files for DB credentials and API host settings.

Recommendation
- Frontend teams can point to http://localhost:8000 as the dev base URL when running the backend locally using the included backend run scripts.
- Confirm production base URL and update allowed origins before deploying to production.
