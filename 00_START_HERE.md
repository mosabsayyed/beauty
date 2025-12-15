# 🚀 JOSOOR - Coding Agent Entry Point

> **READ THIS FIRST:** This file is the single entry point for any coding agent working on this codebase.  
> **Last Updated:** December 2025

---

## 📍 Quick Navigation

| What You Need | Go To |
|---------------|-------|
| **Backend Architecture** | [`/docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) |
| **Frontend Architecture** | [`/docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md) |
| **Dev Server Ports** | See [Servers & Ports](#servers--ports) below |
| **Start Dev Environment** | See [Run Commands](#run-commands) below |

---

## 🌐 Servers & Ports

| Service | Port | URL | Start Script |
|---------|------|-----|--------------|
| **Frontend (Vite/React)** | 3000 | http://localhost:3000 | `./sf1.sh` |
| **Backend (FastAPI)** | 8008 | http://localhost:8008 | `./sb.sh` |
| **Graph Server** | 3001 | http://localhost:3001 | `./sf1.sh` |
| **MCP Router (Noor)** | 8201 | http://127.0.0.1:8201 | `./sb.sh` |
| **MCP Router (Maestro)** | 8202 | http://127.0.0.1:8202 | `./sb.sh` |
| **Embeddings Router** | 8203 | http://127.0.0.1:8203 | `./sb.sh` |
| **MCP Neo4j Cypher** | 8080 | http://127.0.0.1:8080 | `./sb.sh` |
| **Ngrok Dashboard** | 4040 | http://127.0.0.1:4040 | (if ngrok running) |

### API Endpoints (Backend on 8008)

| Endpoint | Purpose |
|----------|---------|
| `GET /docs` | Swagger API documentation |
| `GET /api/v1/health` | Health check |
| `POST /api/v1/chat/message` | Send chat message |
| `GET /api/v1/chat/conversations` | List conversations |
| `POST /api/v1/auth/login` | User login |
| `POST /api/v1/auth/guest` | Create guest session |
| `GET /api/v1/debug/traces` | Observability traces |
| `GET /api/v1/dashboard/*` | Dashboard analytics |

### Graph Server Proxy Routes (via Vite → port 3001)

The frontend proxies these routes to the graph server, NOT the backend:
- `/api/neo4j/*` → Graph server
- `/api/dashboard/*` → Graph server  
- `/api/graph/*` → Graph server
- `/api/business-chain/*` → Graph server
- `/api/debug/*` → Graph server (some routes)

---

## 🏃 Run Commands

### Start Everything (Recommended)

```bash
# Terminal 1: Backend + MCP routers
./sb.sh

# Terminal 2: Frontend + Graph server
./sf1.sh
```

### Individual Services

```bash
# Backend only
./sb.sh

# Backend with --fg (foreground, see logs)
./sb.sh --fg

# Stop all dev services
./stop_dev.sh
```

### Manual Start

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload

# Frontend
cd frontend
npm start
```

---

## 📚 Architecture Documentation

### Backend (`/docs/BACKEND_ARCHITECTURE.md`)

Comprehensive reference covering:
- Directory structure
- FastAPI app entry point, route registration
- Database layer (Supabase REST, Neo4j)
- All API routes with endpoints and models
- Service layer (orchestrator, tier1_assembler, MCP, embeddings)
- Authentication (JWT + Supabase dual validation)
- Orchestrator architecture (multi-persona, MCP integration)
- Debug/observability system
- Environment variables (required + optional)
- Request flow diagrams

### Frontend (`/docs/FRONTEND_ARCHITECTURE.md`)

Comprehensive reference covering:
- Directory structure
- Vite config, build commands
- React app entry, provider hierarchy
- Routing with protected routes
- Context providers (Auth, Language)
- Services (chatService, authService)
- Component inventory (chat, ui, renderers, graph)
- Type definitions
- **Styling system (CSS variables, NO Tailwind)**
- Authentication flow (including guest mode)
- Chat architecture (3-column layout)
- Artifact rendering system
- i18n (English/Arabic, RTL support)
- Environment variables

---

## 🔑 Key Facts

### Backend
- **Framework:** FastAPI (Python)
- **Port:** 8008
- **Databases:** Supabase (PostgreSQL REST) + Neo4j (graph)
- **LLM:** Groq API (`openai/gpt-oss-120b`)
- **Personas:** Noor (staff, port 8201) / Maestro (exec, port 8202)

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Port:** 3000
- **Styling:** CSS variables (theme.css) — **NO Tailwind**
- **Languages:** English + Arabic (RTL)
- **Auth:** Supabase + localStorage

---

## 🗂️ Directory Overview

```
chatmodule/
├── 00_START_HERE.md          # ← YOU ARE HERE
├── docs/
│   ├── BACKEND_ARCHITECTURE.md    # Backend reference
│   └── FRONTEND_ARCHITECTURE.md   # Frontend reference
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── config/          # Settings
│   │   ├── api/routes/      # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database clients
│   │   └── utils/           # Utilities
│   └── logs/                # Debug logs
├── frontend/                 # React app
│   ├── src/
│   │   ├── App.tsx          # Entry point
│   │   ├── pages/           # Route pages
│   │   ├── components/      # UI components
│   │   ├── lib/services/    # API clients
│   │   ├── contexts/        # React contexts
│   │   ├── styles/          # CSS files
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── mcp-router/              # MCP router server
├── sb.sh                    # Start backend + MCP
├── sf1.sh                   # Start frontend
└── stop_dev.sh              # Stop all
```

---

## ⚠️ Common Gotchas

1. **Tailwind:** The frontend does NOT use Tailwind. Use CSS variables from `theme.css`.

2. **Port 5173:** Ignore references to port 5173. Frontend runs on **port 3000**.

3. **API Proxy Split:** Frontend proxies some routes to graph server (3001), others to backend (8008). See proxy config above.

4. **MCP Routers:** Must be running for chat to work. Use `./sb.sh` to start them.

5. **Supabase Keys:** Both backend and frontend need Supabase credentials in `.env`.

6. **Guest Mode:** Frontend supports guest mode (no login) with localStorage persistence.

---

## 🔍 Distributed Tracing

JOSOOR now includes comprehensive OpenTelemetry tracing for monitoring:
- API requests and responses
- LLM calls (Groq)
- Database operations (Supabase, Neo4j)
- MCP tool calls
- Service layer operations

**Quick Start:**
```bash
# Already enabled by default! Just start backend:
./sb.sh

# Traces print to console automatically
```

**Full Documentation:** See [TRACING_QUICKSTART.md](TRACING_QUICKSTART.md) or [docs/TRACING_GUIDE.md](docs/TRACING_GUIDE.md)

---

## 🧭 For Coding Agents

**When you start a task:**

1. **Read this file first** to understand the system
2. **Check the architecture doc** for the layer you're working on:
   - Backend work → `/docs/BACKEND_ARCHITECTURE.md`
   - Frontend work → `/docs/FRONTEND_ARCHITECTURE.md`
3. **Find the specific file** using the directory structure
4. **Check ports** if your change involves API calls
5. **Follow styling patterns** (CSS variables, not Tailwind)

**When in doubt:** The architecture docs are ground truth, based on actual code analysis.

---

*This is the authoritative entry point. Update this file when architecture changes.*
