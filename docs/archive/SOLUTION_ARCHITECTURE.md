# JOSOOR Solution Architecture & Design Document

**Project:** JOSOOR - Transformation Analytics Platform  
**Version:** 1.0.0  
**Date:** December 4, 2025  
**Status:** Current Implementation (Reverse-Engineered)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements & Value Proposition](#business-requirements--value-proposition)
3. [System Overview & Core Architecture](#system-overview--core-architecture)
4. [Design Modules](#design-modules)
5. [Technology Stack](#technology-stack)
6. [Data Architecture](#data-architecture)
7. [API Contract & Communication](#api-contract--communication)
8. [Security & Authentication](#security--authentication)
9. [Conversation & Memory Management](#conversation--memory-management)
10. [Error Handling & Resilience](#error-handling--resilience)
11. [Deployment & Configuration](#deployment--configuration)

---

## Executive Summary

**JOSOOR** is an autonomous analytical agent platform designed for enterprise transformation analytics. It enables organizations to:

- **Ask natural language questions** about organizational transformation, strategy, and risk across multiple dimensions
- **Get intelligent, multi-layered responses** combining intent understanding, hybrid data retrieval, analytical reasoning, and interactive visualizations
- **Maintain conversation context** across multiple sessions with persistent storage
- **Visualize complex relationships** using graph databases (Neo4j) and semantic knowledge graphs
- **Support multi-user environments** with role-based access and user-scoped conversations

The platform operates as a **Cognitive Digital Twin** — a semantic understanding system that interprets business intent and translates it into precise data retrieval and synthesis across PostgreSQL (relational) and Neo4j (graph) databases.

---

## Business Requirements & Value Proposition

### Primary Use Cases

| Use Case | User Intent | System Behavior | Output |
|----------|------------|-----------------|--------|
| **Simple Query** | "List all projects in 2024" | Fact lookup, direct retrieval | Filtered dataset with relevant fields |
| **Complex Analysis** | "Show transformation health for education sector" | Multi-hop graph traversal, aggregation | Dashboard with KPIs, risks, capabilities, trends |
| **Exploratory** | "What if we shifted resources to digital transformation?" | Hypothetical scenario reasoning | Conversational analysis with considerations |
| **Risk Assessment** | "Which capabilities have high-risk exposure?" | Risk correlation analysis | Risk matrix, capability mapping, trend analysis |
| **Trend Detection** | "How has PM maturity evolved over 3 years?" | Historical data aggregation, trend analysis | Time-series visualization, insights |

### Key Business Drivers

1. **Data-Driven Decision Making** — Enable leaders to query transformation data in natural language rather than waiting for reports
2. **Multi-Perspective Analytics** — Connect strategic objectives, policy tools, capabilities, and risks in a single semantic model
3. **Temporal Tracking** — Support year-over-year and quarterly progression across all entities
4. **Knowledge Preservation** — Maintain conversation history and reasoning chains for audit and learning
5. **Democratization** — Allow non-technical users to access complex analytical queries without SQL/Cypher expertise

### Target Users

- **Chief Transformation Officers** — Monitor transformation health and progress
- **Program Managers** — Track project milestones, resource allocation, and risk exposure
- **Policy Makers** — Understand impact of policy tools on organizational outcomes
- **Analysts** — Deep-dive into relationships and correlations across domains
- **Executives** — Real-time performance dashboards and health checks

---

## System Overview & Core Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE (FRONTEND)                   │
│                    React + TypeScript (Vite/CRA)                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ • Chat Interface (Messages, Artifacts, Visualizations)         │  │
│  │ • Canvas Manager (Force-graph, 2D/3D Visualization)           │  │
│  │ • Conversation Sidebar (History Management)                   │  │
│  │ • Debug Panel (Query Inspection, Logs)                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTP/REST + SSE Streaming
┌────────────────────────▼─────────────────────────────────────────────┐
│                    API GATEWAY & ORCHESTRATION LAYER                  │
│                    FastAPI (Python) - Port 8008                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  JOSOOR Orchestrator (OrchestratorZeroShot)                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ Single-Model Cognitive Digital Twin                     │  │  │
│  │  │ • Input: Natural language query + World-View Map        │  │  │
│  │  │ • Process: Requirements → Recollect → Recall → Return   │  │  │
│  │  │ • Output: Structured analysis + Visualizations         │  │  │
│  │  │ • LLM: Groq (gpt-oss-120b) via Replit/OpenAI APIs      │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Supporting Services:                                         │  │
│  │  • Conversation Manager (Supabase)                            │  │
│  │  • Embedding Service (OpenAI text-embedding-3-small)          │  │
│  │  • Schema Loader & World-View Map Loader                      │  │
│  │  • User Service & Authentication (JWT/Demo)                   │  │
│  │  • Data Sync Service (Neo4j ↔ Supabase)                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────────────┘
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼─────┐  ┌────▼──────┐  ┌───▼────────┐
    │PostgreSQL│  │   Neo4j   │  │  OpenAI   │
    │(Supabase)│  │  (Graph)  │  │(Embeddings)│
    │          │  │           │  │            │
    │• Conv.   │  │• Nodes    │  │• Vector    │
    │• Messages│  │• Edges    │  │  Search   │
    │• Users   │  │• Chains   │  │           │
    │• Metadata│  │• Rules    │  │           │
    └──────────┘  └───────────┘  └────────────┘
```

### Core Components

#### 1. **Frontend Layer** (React/TypeScript)
- **Chat Interface**: Message display, artifact rendering, visualization components
- **Canvas Manager**: Force-graph 2D/3D visualization of knowledge graphs
- **Conversation Management**: Sidebar for conversation history and switching
- **Services**: 
  - `chatService.ts` — API communication wrapper
  - Supabase client for authentication (planned)
  - Response streaming handler (SSE)

#### 2. **Orchestration Layer** (FastAPI)
- **OrchestratorZeroShot**: Single-model cognitive twin that:
  1. **Analyzes Intent** (input normalization, entity extraction)
  2. **Retrieves Context** (world-view map, conversation history, schema)
  3. **Constructs Prompt** (static prefix + dynamic suffix with MCP tools)
  4. **Calls LLM** (Groq gpt-oss-120b with MCP tool access)
  5. **Processes Response** (JSON parsing, visualization generation)
  6. **Streams Results** (SSE format to frontend)

#### 3. **Service Layer**
- **Conversation Manager** — Persists/retrieves conversations and messages
- **Embedding Service** — Generates and searches vector embeddings
- **Neo4j Service** — Graph database access, Cypher execution
- **Schema/WorldView Loaders** — Semantic domain knowledge
- **User Service** — Authentication and authorization (currently demo user)

#### 4. **Data Layer**
- **PostgreSQL (Supabase)** — Relational storage for conversations, messages, users
- **Neo4j (Graph)** — Knowledge graph of transformation domain entities and relationships
- **Vector Store (OpenAI)** — Embeddings for semantic search

---

## Design Modules

### Module 1: Intent Understanding & Context Enrichment

**Responsibility**: Parse user query and extract semantic intent within conversation context.

**Key Components**:
- `QueryPreprocessor` — Normalizes input, resolves ambiguities ("that project" → specific ID)
- `WorldViewMapLoader` — Provides semantic domain knowledge (nodes, edges, chains, rules)
- `Conversation Context Builder` — Retrieves and summarizes previous messages

**Process Flow**:
```
User Query → Tokenization → Entity Extraction → Ambiguity Resolution
                             ↓
                    World-View Map Lookup
                             ↓
                    Conversation History (last N messages)
                             ↓
                    Intent Classification (A-H modes)
                             ↓
                    Enriched Context Object
```

**Output**: Intent object with resolved entities, interaction mode, and required context chains

**Interaction Modes**:
- **A**: Simple Query (direct lookup)
- **B**: Complex Analysis (multi-hop reasoning)
- **C**: Exploratory (hypothetical, no data required)
- **D**: Acquaintance (questions about JOSOOR role)
- **E**: Learning (concept explanations)
- **F**: Social/Emotional (greetings)
- **G**: Report Generation (structured output)
- **H**: Graph Navigation (explore relationships)

---

### Module 2: Semantic Anchoring & Data Retrieval

**Responsibility**: Translate intent into precise data retrieval strategies (Cypher, SQL, Vector Search).

**Key Components**:
- `Neo4j Service` — Executes Cypher queries against graph database
- `SQL Executor` — Executes SQL for relational data
- `Semantic Search` — Vector-based entity and document discovery
- `Composite Key Resolver` — Handles temporal/hierarchical composite keys

**Data Retrieval Strategies**:
1. **Graph Retrieval** (Neo4j) — Multi-hop path traversal for relationships
2. **Relational Retrieval** (PostgreSQL) — Structured queries with filters and aggregations
3. **Semantic Retrieval** (Vector) — Concept-based similarity search
4. **Hybrid Retrieval** — Combine multiple strategies for complex queries

**Rules Engine**:
- **Chain Selection** — Match user intent to predefined 7 business chains (e.g., "2A_Strategy_to_Tactics_Tools")
- **Level Matching** — Enforce same hierarchical level (L1, L2, L3) across entity paths
- **Temporal Filtering** — Apply year/quarter constraints automatically
- **Pagination** — Keyset-based strategy with limit of 30 items per result

**Output**: Structured result set with execution metadata (query executed, rows returned, confidence)

---

### Module 3: Analytical Reasoning & Synthesis

**Responsibility**: Transform raw data into business insights using LLM reasoning.

**Key Components**:
- `OrchestratorZeroShot` — Main reasoning engine (single comprehensive prompt)
- `LLM Provider` (Groq gpt-oss-120b) — Large language model for synthesis
- `Output Format Validator` — Ensures JSON structure compliance
- `Analysis Generator` — Produces multi-point business analysis

**Reasoning Cycle** ("Requirements → Recollect → Recall → Reconcile → Return"):
1. **Requirements** — Input analysis, resolution, gatekeeper decision
2. **Recollect** — Identify anchoring entities and business chains
3. **Recall** — Convert to precise Cypher/SQL with validation
4. **Reconcile** — Execute queries and verify constraint compliance
5. **Return** — Synthesize JSON response with analysis and language rules

**Output Structure**:
```json
{
  "answer": "Natural language explanation",
  "analysis": ["Point 1", "Point 2", "Point 3"],
  "visualizations": [
    {
      "type": "highcharts",
      "config": { /* Highcharts config */ }
    }
  ],
  "data": { /* Raw result data */ },
  "cypher_executed": "Cypher query if applicable",
  "confidence": 0.85,
  "data_source": "neo4j_graph"
}
```

---

### Module 4: Artifact Generation & Visualization

**Responsibility**: Transform analytical results into interactive, business-consumable artifacts.

**Supported Artifact Types**:
- **Tables** — Structured data display with sorting/filtering
- **Charts** (Highcharts) — Time-series, bar, pie, funnel, heatmap visualizations
- **Graphs** (Force-graph) — Interactive node-link diagrams for relationships
- **Reports** — Multi-section structured documents
- **Dashboards** — Aggregated KPIs and metrics

**Visualization Config**:
- Each artifact includes Highcharts-compatible configuration
- Client-side Chart Renderer processes and displays
- Interactive features: drill-down, hover details, export

**Output Storage**:
- Artifacts stored in `messages.extra_metadata` (JSON)
- Frontend deserializes and renders based on artifact type

---

### Module 5: Conversation Management & Memory

**Responsibility**: Maintain stateful conversation context across multiple interactions.

**Key Components**:
- `SupabaseConversationManager` — PostgreSQL persistence
- `Conversation Entity` — Aggregates messages, metadata, user ownership
- `Message Entity` — Individual user/assistant messages with metadata
- `Conversation Context Builder` — Summarizes recent history

**Features**:
- **Persistent Storage** — All conversations and messages in PostgreSQL
- **Multi-turn Support** — Maintains conversation_id across turns
- **Metadata Tracking** — Stores artifacts, insights, execution details
- **User Scoping** — Conversations owned by single user (multi-user support in development)
- **Caching Strategy** — World-View Map sent once per conversation, cached by LLM

**Conversation Flow**:
```
1. User message → Create/append to conversation
2. System processes → Stores debug metadata
3. Assistant response → Stored with artifacts in extra_metadata
4. Next turn → Retrieved history informs context
```

---

### Module 6: Authentication & Authorization

**Responsibility**: Verify user identity and enforce access control.

**Current State** (MVP):
- Demo user (user_id = 1) used for all requests
- No authentication required (endpoints accept unauthenticated calls)
- All conversations and messages assigned to demo user

**Planned State** (Multi-User Phase):
- **Frontend**: Supabase auth client (signup/login/JWT)
- **Backend**: JWT validation middleware
  - Extract `user_id` from token `sub` claim
  - Enforce ownership checks on all conversation/message endpoints
  - Return 403 Forbidden if user doesn't own resource
- **Database**: Supabase RLS policies (optional)
  - Restrict SELECT/UPDATE/DELETE to `(select auth.uid()) = user_id`
  - Enforce INSERT validation with `WITH CHECK`

**Authorization Rules**:
- User can only read/modify their own conversations
- System-level admin features (if any) enforced separately
- Guest mode (local-only, no persistence) supported for unauthenticated access

---

### Module 7: Error Handling & Resilience

**Responsibility**: Gracefully handle failures and provide actionable error feedback.

**Error Categories**:
1. **User Input Errors** — Ambiguous queries, unresolvable entities
2. **Data Retrieval Errors** — Database connection failures, query timeouts
3. **LLM Errors** — Model unavailability, rate limits, parsing failures
4. **Infrastructure Errors** — Neo4j down, Supabase down, OpenAI API errors

**Handling Strategy**:
- **Graceful Degradation** — Fall back to alternative data sources if primary fails
- **Logging** — Comprehensive debug logging to `logs/` with context metadata
- **User Messaging** — Return human-readable error descriptions
- **Structured Responses** — Even error responses maintain JSON structure with `error` flag

**Error Response Format**:
```json
{
  "answer": "I encountered an error processing your query: [specific reason]",
  "analysis": ["Error: DatabaseConnectionFailed", "Details: Neo4j timeout"],
  "visualizations": [],
  "data": {"error": "specific error details"},
  "confidence": 0.0,
  "error": true
}
```

---

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 19.2.0 |
| **Language** | TypeScript | 4.9.5 |
| **Build Tool** | Vite | 7.2.2 |
| **Styling** | CSS + Tailwind | 3.4.0 |
| **Visualization** | Highcharts | 12.4.0 |
| **Graphs** | Force-Graph 2D/3D | 1.29.0 |
| **UI Components** | Radix UI | Latest |
| **Data Fetching** | React Query | 5.90.10 |
| **Routing** | React Router | 6.8.0 |
| **PDF Export** | jsPDF + html2canvas | Latest |
| **Spreadsheet Export** | XLSX | 0.18.5 |
| **Auth Client** | Supabase JS | 2.81.1 |
| **Streaming** | Native SSE (fetch/ReadableStream) | N/A |

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | FastAPI | 0.104.1 |
| **Language** | Python | 3.10+ |
| **Server** | Uvicorn | 0.24.0 |
| **Data Validation** | Pydantic | 2.5.0 |
| **ORM/DB Access** | SQLAlchemy | 2.0.23 |
| **PostgreSQL Driver** | asyncpg + psycopg2 | 0.29.0 + 2.9.9 |
| **Graph DB** | Neo4j Python Driver | 5.8.0+ |
| **Supabase Client** | supabase-py | 2.11.0 |
| **LLM Provider** | Groq (gpt-oss-120b) | Via Replit API |
| **Embeddings** | OpenAI text-embedding-3-small | Latest |
| **Vector Store** | pgvector (PostgreSQL) | 0.2.4 |
| **Auth** | JWT (Pydantic/passlib) | 1.7.4 |
| **Testing** | pytest-asyncio | 0.21.0 |

### Infrastructure
| Component | Service |
|-----------|---------|
| **Primary Database** | PostgreSQL (Supabase) |
| **Graph Database** | Neo4j |
| **Embedding Search** | OpenAI API |
| **LLM** | Groq via Replit |
| **Auth Provider** | Supabase (planned) |
| **Hosting** | Docker containers / Cloud platform (configurable) |

---

## Data Architecture

### Entity-Relationship Model (PostgreSQL)

```
┌─────────────────────────┐
│       users             │
├─────────────────────────┤
│ id (PK)                 │
│ email                   │
│ password                │
│ created_at              │
│ updated_at              │
└────────────┬────────────┘
             │ 1:M
             │
┌────────────▼──────────────────┐
│   conversations                │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id (FK → users)           │
│ title                          │
│ created_at                     │
│ updated_at                     │
│ summary (for sidebar display)  │
└────────────┬───────────────────┘
             │ 1:M
             │
┌────────────▼──────────────────┐
│    messages                    │
├────────────────────────────────┤
│ id (PK)                        │
│ conversation_id (FK)           │
│ role (user/assistant)          │
│ content (text)                 │
│ extra_metadata (JSON)          │
│   ├─ artifacts []              │
│   ├─ insights []               │
│   ├─ visualizations []         │
│   └─ debug info {}             │
│ created_at                     │
└────────────────────────────────┘
```

### Graph Model (Neo4j)

**Nodes** (with `id`, `year` temporal keys):
- `sec_objectives` — Strategic/departmental goals, performance parameters
- `sec_policy_tools` — Policy types, individual tools, targeted impacts
- `sec_admin_records` — Admin reference, data categories, datasets
- `sec_businesses` — Business size, domain, specific topics
- `sec_citizens` — Citizen type, region, districts
- `sec_gov_entities` — Government entity types, domains, topics
- `sec_data_transactions` — Domain utilization, department productivity, metrics
- `sec_performance` — Strategic KPIs, operational KPIs, transactional metrics
- `ent_capabilities` — Business domains, functional knowledge, competencies
- `ent_risks` — Risk categories, specific risks (FK to capabilities)

**Edges** (predefined relationships):
- Strategic objectives → Policy tools → Admin records
- Objectives → Gov entities → Citizen segments
- Capabilities → Risks
- Performance metrics → Objectives (impact)
- Data transactions → Objectives (enabling)

**Business Chains** (predefined traversal paths):
1. `2A_Strategy_to_Tactics_Tools` — sec_objectives → sec_policy_tools → ent_capabilities → ent_projects
2. `4_Risk_Build` — ent_capabilities → ent_risks → sec_policy_tools
3. ... 5 additional chains

**Rules**:
- All paths must match same level (L1, L2, L3) — no mixing hierarchies
- Temporal key filtering: `(id, year)` composite
- Pagination: Keyset-based, max 30 items per result
- Risk FK exception: `ent_risks.capability_id` → `ent_capabilities.id`

### World-View Map (Config JSON)

Located: `backend/app/config/worldview_map.json`

Structure:
```json
{
  "meta": {
    "version": "1.0",
    "temporal_key": ["id", "year"],
    "levels": ["L1", "L2", "L3"]
  },
  "rules": { /* constraint rules */ },
  "nodes": { /* node definitions with levels */ },
  "edges": { /* relationship definitions */ },
  "chains": { /* predefined business chains */ }
}
```

**Sent to LLM Once Per Conversation** — cached by model for subsequent turns.

---

## API Contract & Communication

### REST Endpoints (FastAPI)

#### Chat Endpoints

**POST `/api/v1/chat/message`**
- **Purpose**: Submit query, return analysis + artifacts
- **Auth**: Demo user (user_id=1), planned JWT
- **Request**:
  ```json
  {
    "query": "string",
    "conversation_id": "int (optional)",
    "persona": "string (optional, default: transformation_analyst)"
  }
  ```
- **Response** (SSE Streaming or JSON):
  ```json
  {
    "conversation_id": "int",
    "message": "string",
    "visualization": { /* chart config */ },
    "insights": ["string"],
    "artifacts": [
      {
        "artifact_type": "table|chart|graph|report",
        "title": "string",
        "content": { /* varies by type */ },
        "description": "string (optional)"
      }
    ],
    "data_source": "neo4j_graph|sql_db|vector_search"
  }
  ```

**GET `/api/v1/chat/conversations`**
- **Purpose**: List all conversations for user
- **Response**:
  ```json
  {
    "conversations": [
      {
        "id": "int",
        "title": "string",
        "created_at": "ISO8601",
        "updated_at": "ISO8601",
        "message_count": "int"
      }
    ]
  }
  ```

**GET `/api/v1/chat/conversations/{conversation_id}`**
- **Purpose**: Get conversation detail with all messages
- **Response**:
  ```json
  {
    "id": "int",
    "title": "string",
    "created_at": "ISO8601",
    "messages": [
      {
        "id": "int",
        "role": "user|assistant",
        "content": "string",
        "metadata": { /* artifacts, insights */ }
      }
    ]
  }
  ```

**DELETE `/api/v1/chat/conversations/{conversation_id}`**
- **Purpose**: Delete conversation
- **Response**: `{ "status": "deleted" }`

**GET `/api/v1/chat/conversations/{conversation_id}/messages`**
- **Purpose**: Get messages only (for pagination)
- **Response**:
  ```json
  {
    "messages": [ /* message objects */ ]
  }
  ```

**GET `/api/v1/debug_logs/{conversation_id}`**
- **Purpose**: Retrieve debug logs for query inspection
- **Response**: Raw debug logs with execution details

#### Embeddings Endpoints

**POST `/api/v1/embeddings/populate`**
- **Purpose**: Vectorize schema and entities for semantic search
- **Response**: `{ "status": "completed", "count": "int" }`

**POST `/api/v1/embeddings/search`**
- **Purpose**: Semantic search by query
- **Request**: `{ "query": "string", "limit": "int" }`
- **Response**: `{ "results": [{ "entity": "string", "similarity": "float" }] }`

#### Setup & Health Endpoints

**GET `/api/v1/health`**
- **Purpose**: Health check
- **Response**: `{ "status": "healthy", "timestamp": "ISO8601" }`

**GET `/api/v1/setup`**
- **Purpose**: Initialization and setup status
- **Response**: `{ "initialized": "bool", "databases": { ... } }`

### Streaming Protocol (SSE)

**Endpoint**: POST `/api/v1/chat/message` with `Accept: text/event-stream` header

**Frame Format**:
```
data: {"token": "chunk of text"}\n\n
data: {"token": "more text"}\n\n
...
data: [DONE]\n\n
```

**Client Handling**:
1. Use `fetch()` with `response.body.getReader()`
2. Decode with `TextDecoder({stream: true})`
3. Parse SSE frames (`data:` prefix)
4. Accumulate token fields into buffer
5. On `[DONE]`, parse full JSON from buffer

---

## Security & Authentication

### Current State (MVP)

- **No authentication** — All endpoints accept unauthenticated calls
- **Demo user** — All requests use user_id = 1
- **CORS** — Configured for localhost:3000, localhost:5173, localhost:8008

**Environment Variables**:
```bash
BACKEND_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173
SECRET_KEY=super-secret-key  # CHANGE IN PRODUCTION
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Planned Implementation (Multi-User Phase)

#### 1. Frontend Auth
- Supabase signup/login
- JWT token stored in localStorage
- Token attached to every API request: `Authorization: Bearer <token>`

#### 2. Backend Token Validation
```python
# Middleware to validate token and extract user_id
async def validate_token(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    user_id = extract_user_id_from_token(token)  # Supabase validation
    request.state.user_id = user_id
```

#### 3. Endpoint Authorization
```python
# Before returning conversation, verify ownership
if conversation.user_id != request.state.user_id:
    raise HTTPException(status_code=403, detail="Access denied")
```

#### 4. Database RLS (Supabase)
```sql
CREATE POLICY "Users access own conversations"
ON public.conversations
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
```

### Data Protection

- **In Transit**: HTTPS (enforced in production)
- **At Rest**: Database encryption (Supabase managed)
- **Secrets**: Environment variables only, never hardcoded
- **Logs**: Debug logs sanitized of sensitive data

---

## Conversation & Memory Management

### Conversation Lifecycle

```
1. User sends first message
   ├─ No conversation_id provided
   ├─ Backend creates new conversation (user_id = authenticated user)
   └─ Assigns conversation_id

2. System processes query
   ├─ Builds context from world-view map (once per conversation)
   ├─ Retrieves previous messages (conversation history)
   ├─ Constructs full prompt
   └─ Sends to LLM

3. User sends follow-up message
   ├─ Provides conversation_id
   ├─ System appends to existing conversation
   └─ LLM maintains cached context (world-view map)

4. User views conversation list
   ├─ Backend returns all conversations for user
   ├─ Sidebar displays with titles and timestamps
   └─ User can switch between conversations

5. User deletes conversation
   ├─ Soft-delete or hard-delete (configurable)
   └─ Messages remain but marked as deleted/archived
```

### Context Caching Strategy

**Goal**: Minimize redundant data transmission while maintaining semantic understanding.

**Implementation**:
1. **Turn 1** of a conversation:
   - Send full `worldview_map.json` (nodes, edges, chains, rules)
   - LLM caches in conversation memory
   - Send user query

2. **Turn 2+** of same conversation:
   - Omit `worldview_map` (already cached)
   - Send user query
   - LLM references cached map
   - Reduces token usage by ~75%

3. **New conversation**:
   - Repeat process with new cache

### Conversation History Retrieval

```python
# Get last N messages for context
messages = await conversation_manager.get_messages(
    conversation_id=id,
    limit=5,
    offset=0
)

# Build context for LLM
context = [
    {"role": "user", "content": msg.content}
    if msg.role == "user"
    else {"role": "assistant", "content": msg.content}
    for msg in messages
]
```

### Metadata Tracking

Each message stores execution metadata in `extra_metadata`:

```json
{
  "artifacts": [
    {
      "type": "table",
      "title": "Projects 2024",
      "content": { ... }
    }
  ],
  "insights": [
    "3 projects at risk of delay",
    "Budget overrun in Digital Transformation"
  ],
  "debug": {
    "cypher_executed": "MATCH ... RETURN ...",
    "execution_time_ms": 245,
    "rows_returned": 42,
    "data_source": "neo4j_graph",
    "confidence": 0.87
  }
}
```

---

## Error Handling & Resilience

### Error Handling Strategy

**Layered Approach**:

#### Layer 1: Input Validation
```python
# Reject invalid queries early
if not query or len(query) > 5000:
    return error_response("Query too short or too long")
```

#### Layer 2: Data Retrieval
```python
# Try Neo4j first, fall back to SQL
try:
    result = neo4j.query(cypher)
except Exception:
    result = sql_executor.query(sql)  # Fallback
```

#### Layer 3: LLM Processing
```python
# Handle model unavailability
try:
    response = llm.complete(prompt)
except RateLimitError:
    return error_response("Service temporarily unavailable, please retry")
except TimeoutError:
    return cached_response() or error_response("Query timeout")
```

#### Layer 4: Response Formatting
```python
# Ensure response structure even on error
try:
    structured = json.loads(raw_response)
except JSONDecodeError:
    structured = {
        "answer": raw_response[:500],
        "error": True
    }
```

### Common Error Scenarios

| Error | Cause | Handling |
|-------|-------|----------|
| **Entity Not Found** | User references non-existent entity | Suggest similar entities via semantic search |
| **Ambiguous Query** | Multiple interpretations possible | Ask for clarification |
| **Neo4j Timeout** | Graph query too complex | Simplify or suggest alternative data source |
| **Database Unavailable** | Connection failure | Return cached response or "service unavailable" |
| **Rate Limited** | LLM provider rate limit hit | Queue request or return cached response |
| **JSON Parse Error** | LLM returned non-JSON | Extract text and return as plain response |

### Logging & Debugging

**Log Levels**:
- **DEBUG**: Fine-grained execution details (query construction, token counts)
- **INFO**: Successful operations (conversation created, query executed)
- **WARNING**: Recoverable issues (fallback used, partial data)
- **ERROR**: Critical failures (database down, LLM error)

**Debug Logger**:
```python
from app.utils.debug_logger import log_debug

log_debug(
    level=2,  # 1=DEBUG, 2=INFO, 3=WARNING, 4=ERROR
    action="query_execution",
    details={
        "conversation_id": conv_id,
        "query_type": "complex_analysis",
        "execution_time_ms": 250,
        "rows_returned": 42
    }
)
```

**Debug Endpoint**:
- **GET** `/api/v1/debug_logs/{conversation_id}`
- Returns all debug metadata for conversation inspection

---

## Deployment & Configuration

### Environment Configuration

**Backend (.env)**:
```bash
# LLM Provider
LLM_PROVIDER=replit  # replit, openai, anthropic
REPLIT_API_KEY=xxx
OPENAI_API_KEY=xxx
OPENAI_BASE_URL=https://api.openai.com/v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/josoor
PGHOST=localhost
PGPORT=5432
PGUSER=user
PGPASSWORD=pass
PGDATABASE=josoor

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxx

# Embeddings
AI_INTEGRATIONS_OPENAI_API_KEY=xxx
EMBEDDING_MODEL=text-embedding-3-small

# Server
BACKEND_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Debug
DEBUG_MODE=true
DEBUG_PROMPTS=false
```

**Frontend (.env)**:
```bash
REACT_APP_API_URL=http://localhost:8008
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

### Docker Deployment

**Backend Dockerfile**:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8008"]
```

**Frontend Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build
CMD ["npx", "vite", "preview"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: xxx
      POSTGRES_DB: josoor
    ports:
      - "5432:5432"

  neo4j:
    image: neo4j:5.8
    environment:
      NEO4J_AUTH: neo4j/password
    ports:
      - "7687:7687"

  backend:
    build: ./backend
    ports:
      - "8008:8008"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/josoor
      NEO4J_URI: bolt://neo4j:7687
    depends_on:
      - postgres
      - neo4j

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8008
    depends_on:
      - backend
```

### Scaling Considerations

**Horizontal Scaling**:
- Backend: Stateless orchestrator, scale via load balancer
- Frontend: Static assets, deploy to CDN
- Databases: Use managed services (Supabase, Neo4j Cloud)

**Performance Optimizations**:
- Prompt caching (world-view map sent once per conversation)
- Vector search for fast semantic lookup
- Connection pooling (asyncpg, Neo4j driver)
- Result pagination (keyset-based)

---

## Summary

**JOSOOR** is an enterprise-grade transformation analytics platform that combines:

1. **Semantic Understanding** via a single comprehensive LLM prompt (cognitive digital twin)
2. **Hybrid Data Access** from both relational (PostgreSQL) and graph (Neo4j) databases
3. **Business-Centric Design** with predefined chains, levels, and rules enforcing semantic integrity
4. **User-Friendly Interface** supporting natural language queries and rich visualizations
5. **Scalable Architecture** suitable for both development and production deployment

The reverse-engineered design reveals a carefully layered system where each module has clear responsibilities, and data flows through an intelligent orchestrator that maintains context and enforces semantic constraints at every step.

---

**Document Version**: 1.0.0  
**Last Updated**: December 4, 2025  
**Author**: Architecture Review & Reverse Engineering  
**Status**: Ready for Team Review & Enhancement
