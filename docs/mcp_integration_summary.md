## MCP integration — concise carry-forward summary

Purpose: a compact, portable reference to carry into another chat session. Includes how the MCP integration is designed, the exact LLM→MCP call patterns used in zero‑shot runtime, the test scripts we created, where to find logs and test outputs, and the current front-end status (marked "working").

Keep this file with you when starting any new conversation about vector search, MCP tooling, or runtime verification.

## Quick facts
- Embedding model: text-embedding-3-small
- Embedding dimension: 1536
- Embeddings stored on node property: `embedding`
- Embedding timestamp property: `embedding_generated_at`
- Deterministic index name convention: `vector_index_<normalized_label>` where `normalized_label` = lowercased label with non-alphanumerics removed (e.g., `EntityProject` -> `vector_index_entityproject`).
- NEVER return embedding arrays in MCP responses to the LLM.
- Zero‑shot rule: Do NOT run open-ended schema/procedure/index dumps in zero‑shot runtime (e.g., avoid `SHOW PROCEDURES`, `SHOW INDEXES`).

## MCP design and tool contract (summary)
- Primary MCP tool used at runtime: `read_neo4j_cypher` (Neo4j read-only Cypher). The LLM calls exactly one of two fixed templates (no discovery, no fallbacks).
- Tool constraints enforced by policy:
  - Maximum three Cypher queries per turn.
  - No schema/procedure dumps in zero‑shot runtime.
  - Limit returned rows (default k small — e.g., 3 or 5).
  - Always filter rows to avoid returning raw embeddings.
  - Projection must include composite key and level.

## Exact zero‑shot templates (pick exactly one per action)
These are the only two templates the LLM should use in zero‑shot runtime. The master prompt must force the LLM to choose only one.

Template A — expression → native vector index (use when you have a runtime-computed embedding for a text expression)
- When to use: LLM has computed an embedding (1536 floats) and knows the target node label (so it can derive the `indexName` from the INDEX-NAME PATTERN).
- Key constraints: supply `indexName`, `queryVector` (1536 floats), `k` (small), and `minScore` (optional). Do not deviate.

Params (canonical JSON example):
```
{
  "indexName": "vector_index_entityproject",
  "queryVector": [ /* 1536 floats */ ],
  "k": 3,
  "minScore": null
}
```

Expected MCP response shape: JSON array of objects with these fields (no embeddings):
```
[ {"id":"1.8.1","year":2025,"level":"L3","name":"...","embedding_generated_at":"...","composite_key":"1.8.1|2025","score":0.91}, ... ]
```

Template B — stored node → node comparison (use when both nodes already have embeddings)
- When to use: you want to compare one stored node (identified by id+year+level) to other nodes that already contain embeddings (e.g., EntityOrgUnit, EntityProcess).
- Key constraints: supply `projectId`, `projectYear`, `projectLevel`, `targetLabel`, and `k`. The query must check embedding presence and equal vector length before computing cosine.

Params (canonical JSON example):
```
{
  "projectId": "1.8.1",
  "projectYear": 2025,
  "projectLevel": "L3",
  "targetLabel": "EntityOrgUnit",
  "k": 5
}
```

Expected MCP response shape: same as Template A (array of objects with id, year, level, name, composite_key, score).

## Output projection rules (always enforce)
- Use this order to compute an identifier: `coalesce(node.id, elementId(node))` — prefer the application-level `id` property when present, otherwise fall back to `elementId()`. Do NOT reference `uuid` or call `id()`.
- Always return `composite_key = id + '|' + toString(year)` and `level`.
- Never include `embedding` arrays in returned rows.

## Files and scripts (where to find the testing and runtime artifacts)
- Prompt snippet (do NOT inject into master prompt without review): `docs/vector_query_prompt_snippet.md` (contains the two templates and index-name pattern).
- MCP test harness (mimics MCP read tool): `backend/tools/mcp_query_tester.py` — runs canonical templates against the real DB, writes `backend/tools/mcp_query_test_results.json` and `docs/mcp_query_test_results.md`.
- Runtime vector search helper: `backend/tools/llm_runtime_vector_search.py` — computes OpenAI embeddings (text-embedding-3-small) and calls native vector index; returns compact JSON; defaults k=3.
- DB capability probe: `backend/tools/neo4j_embedding_probe.py` — inspects the DB for vector features (safe, non-invasive discovery used in development only).
- MCP server code / read tool (for reference): `backend/mcp-server/servers/mcp-neo4j-cypher/src/mcp_neo4j_cypher/server.py` (inspected to confirm the tool contract and sanitization behavior).

## Test outputs & logs (where things were written)
- Test run JSON results: `backend/tools/mcp_query_test_results.json` (machine-readable sample outputs from the tester runs).
- Human-readable test report: `docs/mcp_query_test_results.md` (contains sample rows, index attempted, GDS detection results, and notes).
- Application logs: `logs/` (various chat debug files `chat_debug_*.json`) and backend logs under `backend/logs/`.
- When rerunning tests, set environment variables from the repository `.env` or the running developer shell and run the tester; results will be appended/overwritten depending on script options.

## GDS & native vector APIs — notes
- We observed: APOC present, GDS available in the environment (use GDS KNN procedures only in controlled/debug contexts). The canonical GDS KNN forms are `gds.knn.stream`, `gds.knn.write`, etc. (consult official GDS docs when required).
- Production zero‑shot policy: do not let the LLM choose GDS procedures automatically — prefer native index or stored-node comparisons via Template A/B unless you explicitly opt into a GDS flow.

## Safety & gotchas observed
- Avoid `SHOW PROCEDURES` / `SHOW INDEXES` in zero‑shot runtime — these return large outputs and will encourage the LLM to dump schemas.
- Avoid `exists(x.y)` — prefer `x.y IS NOT NULL`.
- Driver warnings observed: deprecation notices about `id()` and `UnknownPropertyKeyWarning` when `uuid` is missing for some nodes. Use `coalesce(...)` in projections.
- Enforce `size(o.embedding) = size(p.embedding)` before computing cosine to avoid runtime errors.

## Frontend final state (working — not "done")
- Current status: The frontend SPA integration for entering the chat UI (Rubik-cube entry) is in working state. The UI routes on Enter/Skip into the SPA chat UI and the chat functions, but there is still one visible UX gap:
  - AR/EN language toggle: code may already support Arabic (strings and logic), but there is no visible UI toggle control to switch language; add a visual toggle for end-users.
- Recommendation: mark frontend as "working" and create a follow-up task to add an AR/EN visual toggle and verify RTL layout where applicable.

## How to re-run the MCP test harness (quick)
1. Ensure your environment variables (.env) include the correct Neo4j credentials and `OPENAI_API_KEY` (or equivalent embedding provider key).
2. Run the MCP tester (example):

```bash
# from repository root
source .env
python3 backend/tools/mcp_query_tester.py --k 3 --json
```

3. Inspect results:
  - `backend/tools/mcp_query_test_results.json` — machine readable
  - `docs/mcp_query_test_results.md` — human readable

## Next steps & recommendations (short)
- Keep `docs/vector_query_prompt_snippet.md` as the authoritative, modular snippet for vector queries. Do NOT auto-inject it in the master prompt until you decide on the policy for schema discovery and GDS usage.
- If you want stricter runtime enforcement, request a small code patch to `backend/tools/llm_runtime_vector_search.py` and any MCP read wrapper to always project `composite_key` and `coalesce(uuid, elementId, toString(id))`.
- Add a tiny end-to-end regression test: call Template A and Template B using the tester and assert response shape (id, year, level, composite_key, score) and no `embedding` key is returned.

## Useful references (where to find more procedures, docs, and logs)
- Neo4j GDS docs: consult official Neo4j GDS online docs for `gds.knn.*` usage and examples.
- APOC docs: consult official Neo4j APOC docs for schema/introspection helpers (use in development only).
- Local repo artifacts:
  - `docs/vector_query_prompt_snippet.md` — canonical templates (do not inject yet)
  - `backend/tools/mcp_query_tester.py` — testing harness
  - `backend/tools/llm_runtime_vector_search.py` — runtime helper used by experiments
  - `backend/tools/neo4j_embedding_probe.py` — capability probe script
  - `backend/tools/mcp_query_test_results.json` and `docs/mcp_query_test_results.md` — latest test outputs
  - `logs/` and `backend/logs/` — runtime and debug logs (search for `chat_debug_*.json`)

## Compact checklist to hand to the next chat session
1. Use this file `docs/mcp_integration_summary.md` as the short context payload.
2. Attach `docs/vector_query_prompt_snippet.md` (templates A & B) and `backend/tools/mcp_query_test_results.json` as evidence for the LLM.
3. Tell the LLM the following mandatory rule: "Do not run schema or procedure discovery. Pick exactly Template A or Template B for vector work. Always return composite_key and level. Never include embedding arrays."
4. If the LLM requests GDS, require explicit human approval and a dedicated controlled flow.

---

Created by the dev agent during diagnostics on the `temp` branch. File: `docs/mcp_integration_summary.md` — keep it with the project and copy into any future conversation to preserve knowledge.
