Tooling Plan for LLM — schema query, Supabase read/write, and memory tool

Objective
---------
Provide a concise plan for implementing a set of tools usable by the orchestrator (Groq/OpenAI) via MCP, enabling schema queries, DB read/write (Supabase), and a user interaction memory tool.

High-level tool definitions
---------------------------
- schema_query
  - Purpose: Returns a schema structure for a given DB label (columns, types, indexes) or table (Supabase). Used to help LLM craft safe queries.
  - Backend: `mcp-forward` => route to Neo4j or Supabase schema endpoint.
  - Inputs: label/table name, year, optional filter limit.
  - Outputs: JSON { columns:[...], indexes:[...], constraints:[...] }

- neo4j_read
  - Purpose: Read nodes/relationships from Neo4j with strict parameters and return small sanitized results.
  - Backend: Neo4j MCP (implemented as tool in Neo4j server or via script frontend).
  - Inputs: label, year, projection columns, limit (-> default 30), keyset pagination token.
  - Outputs: List of objects with id, name, type and optionally selected fields (no embeddings or sensitive fields).

- supabase_read
  - Purpose: Read data from Supabase (Postgres) via a safe wrapper (server-side script) that enforces caps & sanitization.
  - Backend: script that calls Supabase.client.{from(table).select(...)}, hosted as a script tool with a service account local to the delete.
  - Input: table name, columns list, filters (simple), limit
  - Output: rows array.

- supabase_write
  - Purpose: Perform safe writes to Supabase (e.g., append a memory row or log). Strictly limited and requires an admin token.
  - Backend: script runtime with service credential stored in environment; server-side policy to limit which tables can be written and which columns are writable.
  - Input: table name, row JSON.
  - Output: success/fail results and affected id.

- memory_append / memory_read
  - Purpose: Append and retrieve a per-user memory store for personalized interactions.
  - Backend: Either Supabase table `llm_memories` or a Neo4j memory index, depending on desired structure. For vector/semantic memories, store compact vectors (but memory tool only returns ids and snippets by default).
  - Input (append): user_id, interaction snippet (sanitized), tags, ephemeral flag.
  - Output (read): last N memory items, or similarity-based results using a vector index.

Implementation & architecture choices
------------------------------------
1) Tool contract and schema
   - Use `router_config.example.yaml` tools entries for each new tool. Mark type=script or type=mcp depending on backend.
   - For `supabase_write` and `memory_append`, require `admin_tool` or `auth` to prevent abuse.
   - Provide `input_schema` as JSON Schema in the `tools/` fields so the LLM knows how to call them.

2) Backend implementation
   - Neo4j read & schema: Add tools to Neo4j MCP server (or extend create_mcp_server) to provide `schema_query` and `read` tools. Reuse `read_neo4j_cypher` tool pattern and create sanitized return shapes.
   - Supabase read/write: Create scripts in `backend` (e.g., `backend/tools/supabase_read.py`, `supabase_write.py`) which call Supabase client with service account configured via environment variables. These scripts are executed by the MCP router as `script` backends for tools.
   - Memory store: Add `backend/app/services/memory_service.py` that uses Supabase or a dedicated Neo4j subgraph to store user memories. Use a simple schema (id, user_id, snippet, tags, created_at) and a vector column optionally for semantic memory.

3) Authentication & Security
   - Supabase writes and memory appends require service-level authentication and accurate logging; use `MCP_ROUTER_SERVICE_TOKEN` and admin authorization checks.
   - For per-user memory reads/writes, enforce user_id/auth binding to avoid cross-user memory leaks; implement server-side checks.

4) Population and usage plan
   - Memory population: append events whenever a user interaction results in a memory-worthy event (explicit save, or model decides via tool invocation). Optionally use an auto-filter to redact PII.
   - Vector memory: If storing vectors, compute embeddings using `backend/embeddings_scripts/02_generate_embeddings.py` (or `EmbeddingService`) to keep dims and models consistent (`text-embedding-3-small`).

5) Testing & acceptance
   - Unit tests for each script tool (simulate run_script() and check results and sanitization).
   - Integration test: Start mcp-router, register supabase script tool, call `tools/call` for a supabase_read, verify JSON result.
   - End-to-end: Use the orchestrator with `tools` injected and test a flow: Model requests `supabase_read` or `neo4j_read` and memory append is invoked on user interaction.

6) Auditing & telemetry
   - Emit `audit_event` for every tool call (read & write), store `request_id`, `tool_name`, caller and success/failure.
   - Increment metrics counters for read/writes and memory operations.

Implementation example (router config snippet) 
---------------------------------------------
Add to `router_config.example.yaml` (tools):

```yaml
- name: supabase_read
  backend: supabase-script
  type: script
  schema: src/mcp_router/tools/supabase_read.schema.json

- name: supabase_write
  backend: supabase-script
  type: script
  policy:
    admin_only: true
```

Parallel approach to implement memory as a graph
------------------------------------------------
- If using Neo4j memory: create a small graph model `(:Memory{user_id, snippet, created_at, tags, embedding})` and vector index, enabling semantic similarity memory reads.
- If using Supabase: use a table `llm_memory` with `payload JSONB` and `embedding vector` (if using Qdrant or pgvector) and build a service layer to manage writes and reads.
- Use `memory_append` as a server-side script tool that writes sanitized snippets; `memory_read` can optionally return last N or similarity-based results.

Operational & safety notes
--------------------------
- Restrict writes by a policy layer and always sanitize inputs (no embedding arrays returned in read results).
- If adding vector memory, constrain dimensions and use the same model as embeddings generator `text-embedding-3-small`.

Next steps
----------
1. Add planned `supabase_read` and `schema_query` scripts to `backend/tools` and add them to `router_config`.
2. Add `memory` service in the backend, set up table or graph schema and the `memory_append`/`memory_read` tools.
3. Extend the orchestrator tools payload with the explicit definitions (refer to `orchestrator_mcp_integration_steps.md`).

End of tooling plan
