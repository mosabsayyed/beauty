## Prompt Changes
- 2025-12-07: Noor bootstrap v3.3 now treats memory scopes as Personal/Departmental/Ministry only; Secrets/admin scope is excluded for Noor and must be ignored.
- 2025-12-07: Maestro prompt updated to explicitly allow Personal/Departmental/Ministry/Secrets scopes via semantic recall; Secrets use restricted to executive contexts.
- 2025-12-08: Bootstrap prompt v3.3 updated to require explicit scope parameter in recall_memory calls. Example: `recall_memory(scope="personal", query_summary="...")` (used in Steps 1, 4, and conversational modes). Global scope removed from Neo4j; database now contains only: personal, departmental, ministry, secrets.
- 2025-12-08: Fixed recall_memory embedding path to use `embedding_service.generate_embedding_async`; requires OPENAI_API_KEY with `model.request` scope (root `.env` service account key).
- 2025-12-12: END_STATE_PROMPT_MATRIX_v3.4 now documents dual agents: Noor (router 8201) cannot see secrets; Maestro (router 8202) may use secrets scope for exec-only contexts.
- 2025-12-14: Added repo-level Copilot guidance at `.github/copilot-instructions.md` (ports, run scripts, proxy split, and “no Tailwind classes” styling rule).
- 2025-12-14: Removed `sbn.sh` and standardized all docs/scripts on `sb.sh` to start backend + MCP stack.
- 2025-12-14: Applied quarter-query reliability fixes: updated Tier 1 `temporal_logic` + `rules_of_thumb`, updated Tier 2 `0.3_step3_recall` + `0.4_step4_reconcile` (schema-loading + Empty-Result Ladder), added Tier 3 quarter template/probe elements, and added a backend empty-result guard in `backend/app/services/orchestrator_universal.py`.
- 2025-12-14: Applied second-phase fixes from docs/fixes.md: updated Tier 1 `conditional_routing` contract, expanded Tier 1 output schema expectations (mode, evidence, query_plan, cypher_params, diagnostics), added Tier 1 `evidence_gating` element, aligned Tier 2 Step 2/3/4 + tool execution rules to `read_neo4j_cypher(query, params)` and mandatory diagnostics for empty results, and added Tier 3 `3.0_4_canonical_templates`.
- 2025-12-14: Frontend connectivity hardening: chat/observability clients now resolve API base via Vite (`import.meta.env.VITE_API_URL|VITE_API_BASE`) or CRA (`process.env.REACT_APP_API_URL|REACT_APP_API_BASE` via `globalThis.process.env`), and Vite dev server proxies `/api/v1/*` to backend `http://localhost:8008` to match CRA proxy behavior.
- 2025-12-14: Tier 1 schema drift mitigation: Tier 1 assembly now prefers normalized `bundle='tier1'` numeric elements (0.* and 5.*) and only appends unmatched legacy step-bundle elements (e.g., `evidence_gating`) to avoid contradictory duplicates; orchestrator adds a tooling-contract guard to prevent phantom tool calls like `json/JSON`.
- 2025-12-15: Groq 400 mitigation: compact assistant history (strip large JSON blobs down to just `answer/message`) before sending to Groq; orchestrator retries once on 400s that mention tool validation or malformed tool-call JSON (common when the model hallucinates a `json` tool or truncates arguments).

## Memory ETL
- 2025-12-08: Nightly ETL now reprocesses conversations when `updated_at` or message hash changes; merges on `source_session`, updates embedding/content, and tracks message_count/hash + source_updated_at_ts to keep growing threads fresh.
- 2025-12-17: ETL scripts aligned with 4-scope model: `backend/scripts/nightly_memory_etl.py` and `backend/scripts/backfill_memory_etl.py` updated to use (personal/departmental/ministry/secrets) and added verification routine to log scope distribution after each run. Removed legacy `global` scope references and updated docstrings.

## Memory Scopes Implementation Status
- **Database:** ✅ Neo4j contains 4 scopes (personal, departmental, ministry, secrets)
- **Noor Service:** ✅ mcp_service.py enforces personal/departmental/ministry only; blocks secrets
- **Maestro Service:** ✅ mcp_service_maestro.py allows all 4 scopes (personal/departmental/ministry/secrets)
- **Bootstrap Prompt:** ✅ cognitive_bootstrap_prompt_v3.3.md updated with explicit scope=X parameter in all recall_memory calls
- **ETL Scripts:** ✅ nightly_memory_etl.py and backfill_memory_etl.py use 4-scope model with TODO for department/role lookup

## Instruction Elements v3.4
- 2025-12-12: Cleaned `v3.4_instruction_elements_CORRECTED.sql` to remove aggregates and gap-type relationships (graph_schema, direct_relationships, business_chains, visualization_schema, AUTOMATION, AUTOMATION_GAPS, KNOWLEDGE_GAPS, ROLE_GAPS, GAPS_SCOPE). Target table shape is 56 elements: 17 nodes, 23 relationships, 7 business chains, 9 chart types, 3 query patterns.

## Instruction Elements (DB Ops)
- 2025-12-13: DB maintenance scripts (`backend/apply_tier2.py`, `backend/fix_tier3.py`) load Supabase settings from `backend/.env` (fail fast if missing `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`).
- 2025-12-13: “No-cypher” policy for Tier 3 until Neo4j testing passes: remove `cypher_examples`, delete single-relationship Tier 3 elements, and strip Cypher/query-pattern sections from `business_chain_*` elements.
- 2025-12-13: Tier 3 caller-step naming: Tier 3 `element` names are `x.y_3_<base>` where `x.y` is the Tier-2 step that USES the element.
	- Step 2 (Recollect) elements (schemas + business chains): `2.0_3_<base>`
	- Step 3 (Recall) elements (query patterns): `3.0_3_<base>`
	- Step 5 (Return) elements (visualizations/chart types): `5.0_3_<base>`
	- Applied via `backend/renumber_tier3_by_usage.py --apply`
- 2025-12-13: Backward-compat: `retrieve_instructions(..., tier="elements")` resolves requested names by base-name, supporting legacy (`EntityProject`), old numeric (`3.2_EntityProject`), and step-prefixed (`2.0_3_EntityProject`).

## Components (2025-12-15)
- Backend Chains API: `/api/v1/chains/{chain_key}?id=X&year=Y` in `backend/app/api/routes/chains.py` using the 7 verified Cypher chains (sector_ops, strategy_to_tactics_priority/targets, tactical_to_strategy, risk_build_mode, risk_operate_mode, internal_efficiency). Registered in `backend/app/main.py`.
- Backend model selection: `orchestrator_universal` supports env-driven model aliases (primary/fallback/alt) with optional local LLM (Ollama-compatible) via `LOCAL_LLM_ENABLED`. Targeted switching is done in `backend/.env` via `GROQ_MODEL_PRIMARY|GROQ_MODEL_FALLBACK|GROQ_MODEL_ALT` (no code edits).
- Backend tracing/telemetry: OpenTelemetry tracing can be disabled via `OTEL_ENABLED=false` in `backend/.env` (prevents OTLP exporter retry spam).
- Frontend quick actions: `QuickChainsPanel` renders three deterministic chain buttons with ID/year inputs; uses `chainsService` calling `/api/v1/chains/*`. Mounted on Chat welcome screen.
- Frontend observability: `ReasoningPanel` in `frontend/src/pages/ObservabilityPage.tsx` normalizes `step.thought` (array/object/string) before rendering to avoid runtime crashes when traces contain non-array `thought`.
- Tier 2 schema enforcement (2025-12-15 CSV-BASED): Root cause identified in log 378 - LLM guessing `MATCH (p:Project)` instead of `EntityProject` due to non-mandatory schema preload in Tier 2 Step 2. **APPROACH CHANGED to CSV-based workflow:** Source of truth is now `docs/instruction_elements_latest.csv` (rows 361/362 for Step 2/Step 3). Required fix: Add "MANDATORY SCHEMA PRELOAD" to Step 2 and explicit label rules to Step 3. SQL files (`backend/TIER2_ATOMIC_ELEMENTS.sql`, `backend/sql/v3.4_instruction_elements*.sql`) deprecated in favor of CSV→database workflow. Full analysis in `TIER2_CSV_DB_COMPARISON.md`.
- 2025-12-17: DATA_ARCHITECTURE.md now documents the 7 deterministic business chains (keys, start labels, path summaries, and endpoints) under the Neo4j section.
- 2025-12-17: `backend/app/services/orchestrator_universal.py` cleaned and shifted to OpenRouter Responses API (`/api/v1/responses`) with `input` message array and `tools/tool_choice` schema; auto-recovery now reuses the OpenRouter call path. Default models now target OpenRouter-friendly defaults (`google/gemma-3-27b-it`, `google/gemini-2.5-flash`, `mistralai/devstral-2512:free`).

## Investor Demo UI (2025-12-15)
- Frontend investor walkthrough hub: `frontend/src/components/content/InvestorDemoHub.tsx` shows the full system visually via existing screenshots under `frontend/public/att/landing-screenshots/*` and includes exactly one live DB-backed proof using the Chains API sample+execute flow.
- Sidebar quick action `id='demo'` now opens the Investor Demo hub (instead of jumping straight into a single dashboard).
- Chat welcome screen no longer foregrounds deterministic chains; the live proof is presented inside the investor demo context.

## Implementation Notes (2025-12-15)
- Smoke test: backend stack up via `./sb.sh --fg` (backend pid 40422); chains endpoint hit `GET /api/v1/chains/sector_ops?id=OBJ-TEST&year=2025` returned 200 with count=0 (expected with dummy id). Backend health confirmed.
