from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.api.v1 import health, setup
from app.api.routes import chat, debug, embeddings, sync, auth, files # Import files router
from app.db.supabase_client import supabase_client
from app.db.neo4j_client import neo4j_client
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await supabase_client.connect()
    print("✅ Supabase connected successfully via REST API")
    
    if neo4j_client.connect():
        print("✅ Neo4j connected successfully")
    else:
        print("⚠️  Neo4j not available (graph features will be disabled)")
    
    yield
    
    await supabase_client.disconnect()
    print("👋 Supabase disconnected")
    
    neo4j_client.disconnect()
    print("👋 Neo4j disconnected")

app = FastAPI(
    title="JOSOOR - Transformation Analytics Platform",
    description="Autonomous analytical agent for enterprise transformation analytics",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS origins via env `BACKEND_ALLOW_ORIGINS` (comma-separated),
# or leave empty to use sensible local defaults.
env_allowed = os.getenv("BACKEND_ALLOW_ORIGINS", "").strip()
if env_allowed:
    if env_allowed == "*":
        allow_origins = ["*"]
    else:
        allow_origins = [o.strip() for o in env_allowed.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

# If a wildcard origin is used, browsers will not accept credentials for security reasons.
allow_credentials = False if allow_origins == ["*"] else True

print(f"CORS allow_origins={allow_origins}, allow_credentials={allow_credentials}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(setup.router, prefix="/api/v1/setup", tags=["Setup"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(debug.router, prefix="/api/v1", tags=["Debug"])
app.include_router(embeddings.router, prefix="/api/v1/embeddings", tags=["Embeddings"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["Data Sync"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"]) # Include files router

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def root():
    frontend_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {
        "message": "Welcome to JOSOOR Transformation Analytics Platform",
        "version": "1.0.0",
        "docs": "/docs"
    }
