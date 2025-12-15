# Backend Architecture Reference

> **Purpose:** Comprehensive reference for coding agents and developers working on the JOSOOR backend.  
> **Grounded in:** Actual codebase analysis, no assumptions.  
> **Last Updated:** Based on current codebase state

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Application Entry Point](#application-entry-point)
4. [Configuration](#configuration)
5. [Database Layer](#database-layer)
6. [API Routes](#api-routes)
7. [Service Layer](#service-layer)
8. [Authentication & Authorization](#authentication--authorization)
9. [Orchestrator Architecture](#orchestrator-architecture)
10. [MCP Router Integration](#mcp-router-integration)
11. [Debug & Observability](#debug--observability)
12. [Environment Variables](#environment-variables)
13. [Request Flow Diagrams](#request-flow-diagrams)

---

## Overview

JOSOOR is a **Cognitive Digital Twin** platform built with FastAPI. It provides an AI-powered analytical agent that answers questions about enterprise transformation data stored in both PostgreSQL (Supabase) and Neo4j (graph database).

**Key Characteristics:**
- **Framework:** FastAPI (Python)
- **Port:** 8008
- **Databases:** Supabase (PostgreSQL REST API) + Neo4j (Graph)
- **LLM Provider:** Groq (model: `openai/gpt-oss-120b`)
- **Architecture:** Single-call MCP orchestration with persona-based routing

---

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── config/
│   │   └── __init__.py            # Settings class (environment loading)
│   ├── api/
│   │   ├── v1/
│   │   │   ├── health.py          # Health check endpoints
│   │   │   └── setup.py           # Setup/initialization endpoints
│   │   └── routes/
│   │       ├── auth.py            # Authentication (login, register, sync)
│   │       ├── chat.py            # Chat API (main conversation endpoint)
│   │       ├── dashboard.py       # Dashboard data endpoints
│   │       ├── debug.py           # Observability/debug endpoints
│   │       ├── embeddings.py      # Embedding generation endpoints
│   │       ├── files.py           # File upload/management
│   │       ├── neo4j_routes.py    # Neo4j graph API
│   │       └── sync.py            # Data synchronization
│   ├── db/
│   │   ├── neo4j_client.py        # Neo4j driver wrapper
│   │   └── supabase_client.py     # Supabase REST API client
│   ├── models/
│   │   └── (Pydantic models)
│   ├── services/
│   │   ├── orchestrator_universal.py   # Main LLM orchestrator
│   │   ├── tier1_assembler.py          # Tier 1 prompt loading from DB
│   │   ├── mcp_service.py              # MCP tool implementations (Noor)
│   │   ├── mcp_service_maestro.py      # MCP tool implementations (Maestro)
│   │   ├── embedding_service.py        # OpenAI embedding generation
│   │   ├── semantic_search.py          # Unified semantic search
│   │   ├── neo4j_service.py            # Neo4j graph operations
│   │   ├── conversation_manager.py     # Conversation CRUD (SQLAlchemy)
│   │   ├── supabase_conversation_manager.py  # Conversation via Supabase
│   │   └── user_service.py             # User CRUD operations
│   └── utils/
│       ├── auth_utils.py          # JWT handling, token validation
│       └── debug_logger.py        # Debug logging utilities
├── logs/                          # Debug log files (JSON)
└── uploads/                       # File upload storage
```

---

## Application Entry Point

**File:** `/backend/app/main.py`

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await supabase_client.connect()
    neo4j_client.connect()
    yield
    await supabase_client.disconnect()
    neo4j_client.disconnect()

app = FastAPI(
    title="JOSOOR - Transformation Analytics Platform",
    version="1.0.0",
    lifespan=lifespan
)
```

### Route Registration

| Prefix | Router Module | Description |
|--------|---------------|-------------|
| `/api/v1/health` | `health.router` | Health checks |
| `/api/v1/setup` | `setup.router` | System setup |
| `/api/v1/chat` | `chat.router` | Chat/conversation API |
| `/api/v1` | `debug.router` | Debug/observability |
| `/api/v1/embeddings` | `embeddings.router` | Embedding generation |
| `/api/v1/sync` | `sync.router` | Data synchronization |
| `/api/v1/auth` | `auth.router` | Authentication |
| `/api/v1/files` | `files.router` | File management |
| `/api/v1/dashboard` | `dashboard.router` | Dashboard data |
| `/api` | `neo4j_routes.router` | Neo4j graph API |

### CORS Configuration

```python
# Environment variable: BACKEND_ALLOW_ORIGINS (comma-separated)
# Default origins (if not set):
allow_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
```

---

## Configuration

**File:** `/backend/app/config/__init__.py`

The `Settings` class loads all configuration from environment variables:

```python
class Settings:
    # LLM Provider
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "replit")
    
    # PostgreSQL (Supabase)
    DATABASE_URL = os.getenv("DATABASE_URL")
    PGHOST = os.getenv("PGHOST")
    PGPORT = os.getenv("PGPORT")
    PGDATABASE = os.getenv("PGDATABASE")
    PGUSER = os.getenv("PGUSER")
    PGPASSWORD = os.getenv("PGPASSWORD")
    
    # Supabase REST API
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Neo4j
    NEO4J_URI = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
    NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")
    
    # OpenAI (for embeddings)
    OPENAI_API_KEY = os.getenv("AI_INTEGRATIONS_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    EMBEDDING_MODEL = "text-embedding-3-small"
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # Debug
    DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
    DEBUG_PROMPTS = os.getenv("DEBUG_PROMPTS", "false").lower() == "true"
```

---

## Database Layer

### Supabase Client

**File:** `/backend/app/db/supabase_client.py`

Uses the Supabase Python client for REST API operations (not raw SQL):

```python
class SupabaseClient:
    async def connect(self) -> None
    async def disconnect(self) -> None
    
    # CRUD Operations
    async def table_select(self, table: str, columns: str = "*", 
                          filters: Optional[Dict] = None,
                          order: Optional[Dict] = None,
                          limit: Optional[int] = None) -> List[Dict]
    
    async def table_insert(self, table: str, data: Dict | List[Dict]) -> List[Dict]
    async def table_update(self, table: str, data: Dict, filters: Dict) -> List[Dict]
    async def table_delete(self, table: str, filters: Dict) -> List[Dict]
    async def table_count(self, table: str, filters: Optional[Dict] = None) -> int
```

**Usage Pattern:**
```python
# Select with filter
users = await supabase_client.table_select("users", "*", {"email": "test@example.com"})

# Insert
new_record = await supabase_client.table_insert("messages", {"content": "Hello"})

# Update
await supabase_client.table_update("users", {"role": "admin"}, {"id": 123})
```

### Neo4j Client

**File:** `/backend/app/db/neo4j_client.py`

Wraps the Neo4j Python driver:

```python
class Neo4jClient:
    def connect(self) -> bool
    def disconnect(self) -> None
    def is_connected(self) -> bool
    
    def execute_query(self, query: str, parameters: Optional[Dict] = None) -> List[Dict]
```

**Usage Pattern:**
```python
results = neo4j_client.execute_query(
    "MATCH (n:Project) WHERE n.year = $year RETURN n LIMIT 10",
    {"year": 2025}
)
```

---

## API Routes

### Chat API (`/api/v1/chat`)

**File:** `/backend/app/api/routes/chat.py`

Primary endpoint for AI conversations.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/message` | Send message and get AI response |
| `GET` | `/conversations` | List user's conversations |
| `POST` | `/conversations/{conversation_id}/messages` | Persist a message into an existing conversation |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `GET` | `/conversations/{conversation_id}/messages` | List messages for a conversation |

#### Request/Response Models

```python
class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "transformation_analyst"
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    conversation_id: int
    llm_payload: Dict

# llm_payload is the canonical LLM-produced JSON block. It may include:
# - mode
# - cypher_executed + cypher_params
# - data.query_plan + data.diagnostics
# - evidence[] (evidence gating)
```

#### Orchestrator Selection (Persona-Based)

```python
def get_orchestrator_instance(persona_name: str = "noor") -> CognitiveOrchestrator:
    """Factory function for persona-specific orchestrator"""
    persona = persona_name.lower()
    if persona not in ["noor", "maestro"]:
        persona = "noor"  # Default fallback
    return CognitiveOrchestrator(persona=persona)
```

**Persona Routing:**
- `noor` → Staff-facing, MCP router on port **8201**
- `maestro` → Executive-facing, MCP router on port **8202**

---

### Authentication API (`/api/v1/auth`)

**File:** `/backend/app/api/routes/auth.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/login` | Login with email/password, returns JWT |
| `POST` | `/register` | Register new user |
| `GET` | `/users/me` | Get current authenticated user |
| `POST` | `/sync` | Sync Supabase auth user to local table |

#### Models

```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str      # "bearer"
    user: dict           # {id, email, role}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "user"  # 'user', 'staff', 'exec'
```

---

### Dashboard API (`/api/v1/dashboard`)

**File:** `/backend/app/api/routes/dashboard.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard-data` | KPI dimension data with optional quarter filter |
| `GET` | `/outcomes-data` | Outcomes data |
| `GET` | `/investment-initiatives` | Investment initiatives data |

**Query Parameters:**
- `quarter_filter`: Optional, e.g., `"Q4 2025"`

---

### Files API (`/api/v1/files`)

**File:** `/backend/app/api/routes/files.py`

Handles secure file uploads with multi-layer validation.

#### Configuration

```python
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.csv', '.txt', '.md', '.png', '.jpg', '.jpeg'}

MAX_FILE_SIZES = {
    'image/png': 10 * 1024 * 1024,      # 10 MB
    'application/pdf': 50 * 1024 * 1024, # 50 MB
    'text/csv': 20 * 1024 * 1024,       # 20 MB
    # ...
}
```

#### Validation Layers

1. **Extension whitelist** - File extension check
2. **MIME type verification** - Content-Type header
3. **Size validation** - Per-type size limits
4. **Filename sanitization** - Path traversal prevention
5. **Magic number check** - File signature verification (optional, requires `python-magic`)

---

### Neo4j Graph API (`/api`)

**File:** `/backend/app/api/routes/neo4j_routes.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/neo4j/graph` | Get full graph data for visualization |
| `GET` | `/neo4j/dashboard/metrics` | Dashboard metrics from graph |
| `GET` | `/neo4j/sectors` | List available sectors |

#### Node Color Mapping

```python
color_map = {
    'SectorObjective': '#A855F7',      # Purple
    'SectorPolicyTool': '#F59E0B',     # Amber
    'SectorAdminRecord': '#10B981',    # Emerald
    'SectorPerformance': '#00F0FF',    # Cyan
    'EntityCapability': '#F97316',     # Orange
    'EntityProject': '#06B6D4',        # Sky Blue
    'EntityITSystem': '#F43F5E',       # Rose
    # ...
}
```

---

### Debug/Observability API (`/api/v1`)

**File:** `/backend/app/api/routes/debug.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/debug/prompts/toggle` | Enable/disable debug mode |
| `GET` | `/debug/prompts/status` | Check debug mode status |
| `GET` | `/debug/traces` | List conversation traces |
| `GET` | `/debug/traces/{conversation_id}` | Get full trace details |
| `GET` | `/debug/database-config` | Check database configuration |

#### Trace Structure

```python
{
    "conversation_id": "abc123",
    "created_at": "2025-01-15 10:30:00",
    "timeline": [
        {"timestamp": "...", "type": "llm_request", "layer": "orchestrator", "data": {...}},
        {"timestamp": "...", "type": "tier1_loaded", "layer": "layer2", "data": {...}},
        # ...
    ],
    "tool_calls": [...],
    "reasoning": [...],
    "mcp_operations": [...],
    "errors": [...],
    "raw": {...}  # Full raw log data
}
```

---

## Service Layer

### CognitiveOrchestrator

**File:** `/backend/app/services/orchestrator_universal.py`

The main orchestration engine for AI conversations.

#### Architecture Overview

```
v3.4 Single-Call MCP Orchestrator

RESPONSIBILITIES:
1. Input validation & authentication
2. Fast-path greeting detection (Step 0 pre-filter)
3. Load Tier 1 from database with persona-specific placeholders
4. Build prompt with datetoday and persona injection
5. Call Groq LLM with MCP tools (ONE call)
6. Parse & validate JSON response
7. Auto-recovery if invalid JSON
8. Apply business language translation
9. Log metrics
10. Return

DOES NOT:
- Retrieve bundles (LLM calls retrieve_instructions)
- Call MCPs directly (LLM calls them)
- Classify mode (LLM does it)
- Decide which bundles to load (LLM does it)
```

#### Constructor

```python
class CognitiveOrchestrator:
    def __init__(self, persona: str = "noor"):
        self.persona = persona.lower()  # "noor" or "maestro"
        
        # Groq API
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.model = "openai/gpt-oss-120b"
        self.groq_endpoint = "https://api.groq.com/openai/v1/responses"
        
        # MCP Router URL (persona-specific)
        if self.persona == "noor":
            self.mcp_router_url = os.getenv("NOOR_MCP_ROUTER_URL")  # port 8201
        else:
            self.mcp_router_url = os.getenv("MAESTRO_MCP_ROUTER_URL")  # port 8202
        
        # MCP tool definition for Groq
        self.mcp_tools = [{
            "type": "mcp",
            "server_label": "mcp_router",
            "server_url": self.mcp_router_url,
            "require_approval": "never"  # Server-side execution
        }]
```

#### Main Execution Method

```python
def execute_query(
    self,
    user_query: str,
    session_id: str,
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Main orchestration method."""
    
    # 1. Input validation
    # 2. Fast-path greeting detection
    # 3. Load Tier 1 prompt from database
    # 4. Build messages array
    # 5. Call Groq LLM with MCP tools
    # 6. Parse JSON response
    # 7. Auto-recovery if needed
    # 8. Apply business language translation
    # 9. Log metrics
    # 10. Return parsed response
```

---

### Tier 1 Assembler

**File:** `/backend/app/services/tier1_assembler.py`

Loads system prompt elements from the database.

```python
def get_tier1_prompt(persona: str = "noor", use_cache: bool = True) -> str:
    """Get Tier 1 prompt (with per-persona caching)"""

def load_tier1_elements(persona: str = "noor") -> List[Dict]:
    """Load Tier 1 elements from instruction_elements table"""

def assemble_tier1_prompt(persona: str = "noor") -> str:
    """Assemble elements with persona placeholders:
       <persona> → "Noor" or "Maestro"
       <memory_scopes> → persona-specific scopes
    """
```

**Database Table:** `instruction_elements`
- Columns: `element`, `content`, `avg_tokens`, `bundle`, `status`
- Filter: `bundle = 'tier1'` AND `status = 'active'`
    - Step 0 elements use the `0.x_step0_*` prefix
    - Step 5 elements use the `5.x_step5_*` prefix (includes evidence gating)

---

### MCP Service

**File:** `/backend/app/services/mcp_service.py`

Implements the 3 core MCP tools:

| Tool | Step | Description |
|------|------|-------------|
| `recall_memory` | 0 (REMEMBER) | Semantic vector search for hierarchical memory |
| `retrieve_instructions` | 2 (RECOLLECT) | Dynamic bundle loading from PostgreSQL |
| `read_neo4j_cypher` | 3 (RECALL) | Constrained Cypher execution |

#### Scope Constraints (Noor)

```python
# Noor is FORBIDDEN from:
forbidden_scopes = {'secrets', 'csuite'}

# Noor CAN access:
allowed_scopes = {'personal', 'departmental', 'ministry'}
```

---

### Embedding Service

**File:** `/backend/app/services/embedding_service.py`

Generates embeddings via OpenAI API.

```python
class EmbeddingService:
    model = "text-embedding-3-small"
    dimensions = 1536
    
    def generate_embedding(self, text: str) -> Optional[List[float]]
    def generate_embeddings_batch(self, texts: List[str], batch_size: int = 100) -> List
    async def generate_embedding_async(self, text: str) -> Optional[List[float]]
```

**Note:** Requires `OPENAI_API_KEY` environment variable. Does NOT use Replit AI Integration (not supported for embeddings).

---

### User Service

**File:** `/backend/app/services/user_service.py`

User CRUD operations with password handling.

```python
class User(BaseModel):
    id: Optional[int]
    email: EmailStr
    password: Optional[str]
    supabase_id: Optional[str]
    full_name: Optional[str]
    role: Optional[str] = "user"  # 'user', 'staff', 'exec'

class UserService:
    def get_password_hash(self, password: str) -> str
    def verify_password(self, plain: str, hashed: str, email: str = None) -> bool
    async def get_user_by_email(self, email: str) -> Optional[User]
    async def get_user_by_id(self, user_id: int) -> Optional[User]
    async def create_user(...) -> Optional[User]
    async def get_user_by_supabase_id(self, supabase_id: str) -> Optional[User]
```

**Password Migration:** Supports legacy formats (MD5, plaintext) with automatic migration to bcrypt on successful login.

---

## Authentication & Authorization

**File:** `/backend/app/utils/auth_utils.py`

### JWT Configuration

```python
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM  # HS256
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES  # 30
```

### Token Creation

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str
```

### Token Validation

The `get_current_user` dependency supports dual validation:

1. **Local JWT** - Validates against `SECRET_KEY`
2. **Supabase Token** - If local fails, validates via Supabase `/auth/v1/user` endpoint

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # 1. Try local JWT validation
    # 2. If JWTError, try Supabase validation
    # 3. Auto-create local user if Supabase validates but no local record
```

---

## Orchestrator Architecture

### Multi-Persona Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CognitiveOrchestrator                    │
│                   (Single Codebase)                         │
├─────────────────────────────────────────────────────────────┤
│  __init__(persona="noor")     __init__(persona="maestro")   │
│         │                              │                    │
│         ▼                              ▼                    │
│  MCP Router: 8201              MCP Router: 8202             │
│  Memory: personal,             Memory: personal,            │
│          departmental,                 departmental,        │
│          ministry                      ministry,            │
│                                        secrets              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. User Query
      │
      ▼
2. Chat Route (/api/v1/chat/send)
      │
      ▼
3. get_orchestrator_instance(persona)
      │
      ▼
4. orchestrator.execute_query(query, session_id, history)
      │
      ├──▶ Fast-path greeting check
      │
      ├──▶ Load Tier 1 from DB
      │
      ├──▶ Build messages array
      │
      ├──▶ Call Groq /v1/responses
      │         │
      │         ▼
      │    Groq executes MCP tools server-side
      │         │
      │         ▼
      │    MCP Router (8201/8202)
      │         │
      │         ├──▶ recall_memory → Semantic search
      │         ├──▶ retrieve_instructions → DB lookup
      │         └──▶ read_neo4j_cypher → Graph query
      │
      ├──▶ Parse JSON response
      │
      ├──▶ Auto-recovery if needed
      │
      └──▶ Return ChatResponse
```

---

## MCP Router Integration

**Location:** `/mcp-router/src/mcp_router/`

The MCP Router is a separate FastMCP server that exposes tools to the Groq LLM.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Groq LLM  │────▶│ MCP Router  │────▶│  Backends   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   script tools      http_mcp         Neo4j MCP
   (Python)          (upstream)       (external)
```

### Key Files

| File | Purpose |
|------|---------|
| `server.py` | FastMCP server creation, tool registration |
| `tool_registry.py` | Loads tools from YAML config |
| `tool_runner.py` | Executes script-based tools |
| `tool_forwarder.py` | Forwards to upstream MCP servers |
| `policy.py` | Header/auth policy handling |

### Registered Tools

```python
@mcp.tool(description="Search personal or project memory...")
def recall_memory(scope: str, query_summary: str, limit: int = 5, user_id: str = None)

@mcp.tool(description="Load instruction bundles...")
def retrieve_instructions(mode: str, tier: str = None, elements: List[str] = None)

@mcp.tool(description="Execute read-only Cypher query...")
async def read_neo4j_cypher(query: str, params: Dict = None)
```

### Port Configuration

| Persona | MCP Router Port | Environment Variable |
|---------|-----------------|---------------------|
| Noor | 8201 | `NOOR_MCP_ROUTER_URL` |
| Maestro | 8202 | `MAESTRO_MCP_ROUTER_URL` |

---

## Debug & Observability

### DebugLogger

**File:** `/backend/app/utils/debug_logger.py`

Captures detailed execution traces per conversation.

```python
class DebugLogger:
    def __init__(self, conversation_id: str):
        self.log_file = log_dir / f"chat_debug_{conversation_id}.json"
    
    def log_event(self, event_type: str, data: Any)
    def log_layer(self, layer_num: int, event_type: str, data: Any)
```

### Log File Structure

```json
{
    "conversation_id": "abc123",
    "created_at": "2025-01-15 10:30:00",
    "turns": [
        {"timestamp": "...", "turn_number": 1}
    ],
    "events": [
        {"event_type": "llm_request", "timestamp": "...", "data": {...}}
    ],
    "layers": {
        "layer2": {
            "events": [
                {"event_type": "tier1_loaded", "data": {...}},
                {"event_type": "groq_full_trace", "data": {...}}
            ]
        }
    }
}
```

### Event Types

| Event | Layer | Description |
|-------|-------|-------------|
| `llm_request` | orchestrator | Query sent to LLM |
| `llm_response` | orchestrator | Response received |
| `llm_raw_response` | orchestrator | Full raw response |
| `llm_parsed_response` | orchestrator | Parsed JSON |
| `tier1_loaded` | layer2 | Tier 1 prompt loaded |
| `groq_full_trace` | layer2 | Full Groq execution trace |
| `groq_api_error` | layer2 | API error details |
| `json_parse_failed` | layer2 | JSON parsing error |

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for LLM calls |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEO4J_URI` | Neo4j connection URI |
| `NEO4J_PASSWORD` | Neo4j password |
| `NOOR_MCP_ROUTER_URL` | Noor MCP router URL (e.g., `http://127.0.0.1:8201`) |
| `MAESTRO_MCP_ROUTER_URL` | Maestro MCP router URL (e.g., `http://127.0.0.1:8202`) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | Required for embeddings |
| `SECRET_KEY` | `"super-secret-key"` | JWT signing key |
| `ALGORITHM` | `"HS256"` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiry |
| `DEBUG_MODE` | `"false"` | Enable debug logging |
| `DEBUG_PROMPTS` | `"false"` | Log prompts to console |
| `BACKEND_ALLOW_ORIGINS` | localhost | CORS origins (comma-separated) |
| `NEO4J_USERNAME` | `"neo4j"` | Neo4j username |
| `NEO4J_DATABASE` | `"neo4j"` | Neo4j database name |

---

## Request Flow Diagrams

### Chat Request Flow

```
Client                Backend                 Groq                MCP Router
  │                      │                      │                      │
  │ POST /chat/send      │                      │                      │
  │─────────────────────▶│                      │                      │
  │                      │                      │                      │
  │                      │ get_orchestrator     │                      │
  │                      │ load_tier1_bundle    │                      │
  │                      │                      │                      │
  │                      │ POST /v1/responses   │                      │
  │                      │─────────────────────▶│                      │
  │                      │                      │                      │
  │                      │                      │ tools/call           │
  │                      │                      │─────────────────────▶│
  │                      │                      │                      │
  │                      │                      │◀─────────────────────│
  │                      │                      │     tool result      │
  │                      │                      │                      │
  │                      │◀─────────────────────│                      │
  │                      │   final response     │                      │
  │                      │                      │                      │
  │◀─────────────────────│                      │                      │
  │   ChatResponse       │                      │                      │
```

### Authentication Flow

```
Client                  Backend                 Supabase Auth
  │                        │                        │
  │ POST /auth/login       │                        │
  │───────────────────────▶│                        │
  │                        │                        │
  │                        │ get_user_by_email      │
  │                        │ verify_password        │
  │                        │                        │
  │◀───────────────────────│                        │
  │ {access_token, user}   │                        │
  │                        │                        │
  │                        │                        │
  │ GET /users/me          │                        │
  │ (Bearer: token)        │                        │
  │───────────────────────▶│                        │
  │                        │                        │
  │                        │ decode_jwt (local)     │
  │                        │ OR                     │
  │                        │ validate via Supabase ─────────────────────▶│
  │                        │◀────────────────────────────────────────────│
  │◀───────────────────────│                        │
  │ {user details}         │                        │
```

---

## Quick Reference

### Starting the Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
```

### API Documentation

- Swagger UI: `http://localhost:8008/docs`
- ReDoc: `http://localhost:8008/redoc`

### Key Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `conversations` | Chat sessions |
| `messages` | Chat messages |
| `instruction_elements` | Tier 1/2/3 prompt elements |
| `temp_quarterly_dashboard_data` | Dashboard KPIs |
| `temp_quarterly_outcomes_data` | Outcomes data |
| `temp_investment_initiatives` | Investment initiatives |

### Neo4j Node Types

- `SectorObjective`, `SectorPolicyTool`, `SectorAdminRecord`
- `EntityCapability`, `EntityProject`, `EntityRisk`, `EntityITSystem`
- `EntityOrgUnit`, `EntityProcess`, `EntityVendor`

---

*This document is auto-generated from codebase analysis. Update as architecture evolves.*
