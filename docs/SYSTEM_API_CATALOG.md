# 🧭 JOSOOR System API Catalog & Table of Contents (v1.1)

This document is the **Ground Truth** for all server-side communication in the Josoor ecosystem. It synthesizes architecture from `00_START_HERE.md` with the live implementation in `backend/app/main.py` and `graph-server/routes.ts`.

---

## 1. System Topology (Servers & Ports)

| Service | Port | Description | Primary File |
| :--- | :--- | :--- | :--- |
| **Frontend (React)** | 3000 | Primary User Interface (Vite/React 19) | `frontend/src/App.tsx` |
| **Backend (FastAPI)** | 8008 | Core Logic, Chat, & User Orchestration | `backend/app/main.py` |
| **Graph Server (Express)** | 3001 | High-perf Neo4j Proxy & Viz Sidecar | `graph-server/app.ts` |
| **MCP Router (Noor)** | 8201 | Staff Operations (Portfolio/Program) | `./sb.sh` |
| **MCP Router (Maestro)**| 8202 | Executive Insights (Strategy/Secrets) | `./sb.sh` |
| **Embeddings Router** | 8203 | Semantic Memory Retrieval (Vector DB) | `./sb.sh` |
| **MCP Neo4j Cypher** | 8080 | Deterministic Graph Query Service | `./sb.sh` |

---

## 2. Backend API Catalog (Port 8008)

### 2.1 Chat & Intelligence (`/api/v1/chat`)
- **`POST /message`**: Primary chat entry point.
    - **Req**: `{ query: string, conversation_id?: number, persona?: "noor"|"maestro", history?: list }`
    - **Res**: `ChatResponse` (See UNIFIED_AGENT_CONTRACT.md)
- **`GET /conversations`**: List current user's chat history.
- **`GET /conversations/{id}`**: Get full message thread with metadata/artifacts.

### 2.2 Control Tower (`/api/v1/control-tower`)
- **`GET /lens-b`**: Strategic Outcomes (GDP, Jobs, UX, Security, Regulations).
## 1. System Topology & Ports

| Component | Port | Primary Protocol | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend** | 3000 (Vite) | HTTPS (Browser) | UX, Canvas Rendering, Local State |
| **Backend** | 8008 (FastAPI) | REST API | **Supabase/Postgres**, Auth, Orchestration |
| **Graph Server** | 3001 (Express) | REST API | **Neo4j**, Visualization Proxy, Dashboards |
| **Noor MCP** | 8201 (HTTP) | JSON-RPC | Tool Consolidation (Read-Only) |
| **Maestro MCP** | 8202 (HTTP) | JSON-RPC | Tool Consolidation (Read/Write) |
| **Embeddings** | 8203 (HTTP) | JSON-RPC | Vector Search / Semantic Indexing |

---

## 2. Backend (8008) - The Supabase Hub
**Base URL**: `/api/v1/*`

| Endpoint | Method | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| `/chat` | POST | Single-call MCP Orchestration | Orchestrator Logic |
| `/auth/login` | POST | JWT Issuance | Supabase `users` |
| `/auth/register` | POST | User onboarding | Supabase `users` |
| `/auth/sync` | POST | Supabase Auth → App User Sync | Supabase Auth Hub |
| `/dashboard/dashboard-data` | GET | Raw KPI records (Axes 1-8) | `temp_quarterly_dashboard_data` |
| `/dashboard/outcomes-data` | GET | Macroeconomic metrics | `temp_quarterly_outcomes_data` |
| `/dashboard/investment-initiatives`| GET | Project portfolios | `temp_investment_initiatives` |
| `/control-tower/*` | GET | Direct Lens A / HUD sourcing | Dashboard Tables |
| `/files/*` | GET/POST | Artifact & Document storage | Supabase Storage / `files` |
| `/admin/settings` | GET/PUT | Global System Adaptation | Postgres `admin_settings` |
| `/sync/*` | POST | Ingestion & ETL Triggers | Python Integration Layer |

---

## 3. Graph Server (3001) - The Visualization Proxy
**Base URL**: `/api/*`

| Endpoint | Method | Purpose | Underlying Action |
| :--- | :--- | :--- | :--- |
| `/neo4j/schema` | GET | Graph Meta-Knowledge | `CALL db.labels()` |
| `/dashboard/metrics` | GET | Aggregated Dash Stats | **Proxy to 8008** + Neo4j merge |
| `/control-tower/hud-lens-b` | GET | Strategic Impact (Lens B) | Neo4j + Synthetic Model |
| `/control-tower/health-grid` | GET | Operational Health Grid | **Proxy to 8008** |
| `/neo4j/years` | GET | Temporal availability | Neo4j scan |

---

## 4. MCP Tools Catalog (8201/8202)
Consolidated via `mcp_router`.

### A. Memory & Context
- **`recall_memory(scope, query_summary, limit)`**
  - *Arguments*: `scope` (personal\|ministry), `query_summary` (text), `limit` (int).
  - *Backend*: Semantic vector search via Embeddings Server (8203).

### B. Instructions
- **`retrieve_instructions(mode, tier, elements)`**
  - *Arguments*: `mode` (DATA_MODE\|CONVERSATION_MODE), `tier` (1\|2\|3), `elements` (List[str]).
  - *Backend*: Instruction Elements DB (Postgres).

### C. Knowledge Graph
- **`read_neo4j_cypher(cypher_query, parameters)`**
  - *Arguments*: `cypher_query` (string), `parameters` (dict).
  - *Backend*: Direct Neo4j Bolt driver execution.

---

## 5. Architectural Boundaries & Proxies
1.  **Vite Proxy Protocol**:
    - `/api/v1/*` → Backend (8008)
    - `/api/neo4j/*`, `/api/dashboard/*`, `/api/control-tower/*` → Graph Server (3001)
2.  **Display Aggregation**: The Graph Server (3001) is the "Display Master". It often fetches raw data from 8008, processes it for specific HUD layouts, and returns a unified JSON.
3.  **Supabase Lock**: No direct Supabase calls from 3001 or Frontend. All Postgres access MUST pass through 8008.
