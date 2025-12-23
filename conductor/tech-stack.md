# Technology Stack: JOSOOR

## Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **UI Components:** Radix UI primitives
- **Styling:** CSS Modules / CSS Variables (Strictly **NO Tailwind**)
- **State Management:** React Context + React Query

## Backend
- **Framework:** FastAPI (Python)
- **LLM Provider:** Groq (Model: `openai/gpt-oss-120b`)
- **Orchestration:** MCP (Model Context Protocol) for tool-calling and agentic loops
- **Observability:** OpenTelemetry (Distributed Tracing)

## Databases
- **Relational:** Supabase (PostgreSQL) - Handles user data, conversations, and instruction bundles.
- **Graph:** Neo4j - Houses the Enterprise Transformation Knowledge Graph and hierarchical memory.
- **Vector Search:** Neo4j Vector Index (1536-dim embeddings via OpenAI).

## Infrastructure & Integration
- **API Architecture:** RESTful endpoints with persona-based routing (Noor/Maestro).
- **Tooling:** FastMCP for router servers.
