# JOSOOR MVP: Investor Demo → Enterprise Ready (Integrated Roadmap)

**Document Status:** Master Reference | Last Updated: December 15, 2025 | Phase 1 Ready for Execution Today

---

## Executive Summary

**What:** JOSOOR is a Transformation Control Tower — deterministic desks + AI-powered deep dives for enterprise transformation PMO.

**Why:** Reduce reporting load, expose cross-cutting dependencies, turn status noise into early warnings.

**For Whom:** Public-sector PMOs and transformation leaders (demo tonight with investors).

**Architecture:**
- **Frontend:** React 19 + Vite (3000), deterministic desks + quick-action chains.
- **Backend:** FastAPI (8008), multi-model LLM orchestration (Groq 20B/70B/120B + local option).
- **Graph:** Neo4j (graph DB) + Supabase (PostgreSQL), 7 verified business chains.
- **Memory:** 4 banks (personal/departmental/ministry/secrets) + conversation compression + browser temp memory.
- **Observability:** OpenTelemetry tracing + evaluation framework (Phase 4).

---

## Phase 1: Investor Demo (TODAY — Execution Phase)

**Goal:** Live, reliable demo with 3 deterministic quick-action chains + deep dives.

### 1.1 Backend: Model Switching + Named Chains Endpoint

**What:**
- Add env-driven model selector: `GROQ_MODEL_PRIMARY=openai/gpt-oss-20b`, `GROQ_MODEL_FALLBACK=llama-3.3-70b-versatile`, `GROQ_MODEL_ALT=openai/gpt-oss-120b`.
- Add `/api/v1/chains/{chain_key}` endpoint (or extend graph endpoint) to run pre-verified Cypher queries deterministically.
- Local fallback: detect `LOCAL_LLM_ENABLED=true` + `OLLAMA_URL=http://localhost:11434` to route to local llama.cpp/ollama instead of Groq.
- Enforce missing-data guards: if chain returns empty, return `{ "clarification_needed": true, "missing_data": [...], "nodes": [], "edges": [] }`.
- Add one retry on malformed JSON; cap history to 5 messages before sending to LLM.

**Acceptance Criteria:**
- [ ] `GROQ_MODEL_PRIMARY` controls which Groq model is used; fallback is automatic on timeout/error.
- [ ] Switching between 20B/70B/120B works via env or query param (whitelist only).
- [ ] `/api/v1/chains/SectorOps?id=X&year=2025` returns `{ nodes, edges, summary, chain, id, year, clarification_needed }`.
- [ ] Local mode routes to Ollama when `LOCAL_LLM_ENABLED=true`; graceful fallback to cloud if local unavailable.
- [ ] Empty results return honest "data missing" instead of hallucination.

**Time Estimate:** 3–4 hours.

**Files to Touch:**
- `/backend/app/config/__init__.py` — add model env vars.
- `/backend/app/services/orchestrator_universal.py` — model switching logic + local detection.
- `/backend/app/api/routes/neo4j_routes.py` or new `/backend/app/api/routes/chains.py` — named query endpoint.
- `/backend/app/core/llm_contract.py` — missing-data guard (from earlier assessment).

---

### 1.2 Frontend: Quick-Action Chains Panel

**What:**
- Add a "Quick Chains" card on the Chat sidebar (or top of chat area) with 3 buttons:
  1. **SectorOps Loop** → runs `business_chain_SectorOps`.
  2. **Strategy→Tactics (Priority)** → runs `business_chain_Strategy_to_Tactics_Priority`.
  3. **Risk Operate Mode** → runs `business_chain_Risk_Operate_Mode`.
- Each button accepts `id` and `year` as inputs (pre-fill with 2–3 known-good values for the demo).
- On click: fetch `/api/v1/chains/{chain_key}?id=X&year=Y`; display result as:
  - Compact node list (name, type).
  - Edge list (relationship, count).
  - Short summary text.
  - Provenance: "Data source: <chain> | year=Y | id=X".
- Show "Data missing" message if clarification_needed=true; no LLM hallucination.
- Add "Deep Dive" button below result: sends a templated prompt to `/chat/message` with result data as context.

**Acceptance Criteria:**
- [ ] Three buttons visible on sidebar/chat.
- [ ] Clicking a button fetches and displays chain results (no hallucination if empty).
- [ ] Result shows provenance + chain name + summary.
- [ ] "Deep Dive" button available; uses temperature=0, short history, persona=noor.
- [ ] Latency <2.5s round-trip (pre-warm Neo4j cache).

**Time Estimate:** 2–3 hours.

**Files to Create/Touch:**
- `/frontend/src/components/chat/QuickChainsPanel.tsx` (new).
- `/frontend/src/lib/services/chainsService.ts` (new) — wrapper around `/api/v1/chains`.
- `/frontend/src/components/chat/QuickChainsPanel.css` (new).
- `/frontend/src/components/chat/ChatContainer.tsx` — import and place QuickChainsPanel.

---

### 1.3 Demo Prep: Pre-Warmed Data + Runbook

**What:**
- Identify 2–3 known-good `(id, year)` pairs for each chain; test locally before the meeting.
- Pre-warm Neo4j query cache: run each chain query once to ensure <500ms latency.
- Document a 5-step demo script:
  1. Show Control Tower overview (Observability page).
  2. Click "SectorOps Loop" → show result with provenance.
  3. Click "Deep Dive" → show templated AI analysis (temp=0, brief output).
  4. Switch model from 20B → 70B (show env toggle); re-run SectorOps → compare quality.
  5. Show local fallback option (if available).

**Acceptance Criteria:**
- [ ] 3 chains tested end-to-end with sample data.
- [ ] Each chain query <500ms.
- [ ] Demo script documented in `/docs/INVESTOR_DEMO_RUNBOOK.md`.
- [ ] Observability page accessible; traces visible.

**Time Estimate:** 1–2 hours.

---

### 1.4 Phase 1 Summary

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| Model switching (20B/70B/120B + local) | In Progress | Backend | Today |
| Named chains endpoint | In Progress | Backend | Today |
| Quick-action buttons + UI | In Progress | Frontend | Today |
| Demo runbook + pre-warm | In Progress | Ops | Today |

**Total Phase 1 Time:** ~8–10 hours (can be parallelized).

**Demo Outcome:** Live, reliable demo that showcases deterministic chains + AI deep dives without hallucination.

---

## Phase 2: Foundation Hardening (Post-Demo, Next 3 Days)

**Goal:** Stabilize core after demo; prepare for memory + evaluation integration.

### 2.1 LLM Contract Enforcement

**What:**
- Deploy `llm_contract.py` from earlier assessment: enforce `final_answer`, `evidence`, `missing_data`, `artifacts` schema.
- Add "canonical template" enforcement: if LLM response doesn't match 7-part deep-dive structure (signal summary, what changed, root causes, impact, actions, stakeholders, missing data), wrap it forcibly.
- Reject responses without evidence if tooling was used; retry once with stricter prompt.
- Auto-recovery: if JSON parse fails, extract last valid JSON block; if none, return honest "parsing failed" message.

**Acceptance Criteria:**
- [ ] All LLM responses conform to `LlmPayload` schema.
- [ ] Evidence gating enforced: no grounded claims without evidence entries.
- [ ] Empty tool outputs trigger `clarification_needed=true` and `missing_data` population.
- [ ] One retry on malformed JSON; graceful failure if retry fails.

**Files to Create/Touch:**
- `/backend/app/core/llm_contract.py` (already drafted).
- `/backend/app/api/routes/chat.py` — apply enforcement before returning ChatResponse.
- `/backend/app/services/orchestrator_universal.py` — call contract enforcement at end of `execute_query()`.

**Time Estimate:** 2–3 hours.

---

### 2.2 Conversation Compression (First Pass)

**What:**
- Implement lightweight conversation summarization: after 5+ messages, summarize older messages (keep only: intent, key facts, last action) before sending to LLM.
- Trim artifact attachments: strip large JSON/chart payloads, keep only type + title + brief content.
- Store compressed version in memory bank (tier: `compressed_session`) for later retrieval.
- Keep browser temp memory in localStorage: every message auto-saves; on page reload, restore last 3 messages.

**Acceptance Criteria:**
- [ ] History payload to Groq <4000 tokens after 5+ messages.
- [ ] Artifacts trimmed; no large JSON blobs sent to LLM.
- [ ] Browser localStorage persists last 3 messages; restored on reload.
- [ ] Compressed history retrievable from memory bank for offline analysis.

**Files to Create/Touch:**
- `/backend/app/services/conversation_compression.py` (new) — summarization logic.
- `/backend/app/services/orchestrator_universal.py` — call compression before Groq API.
- `/frontend/src/lib/services/chatService.ts` — localStorage sync on every message.
- `/frontend/src/contexts/AuthContext.tsx` — restore from localStorage on app mount.

**Time Estimate:** 2–3 hours.

---

### 2.3 Memory Banks Integration (Partial)

**What:**
- Activate all 4 scopes in Neo4j memory store: `personal`, `departmental`, `ministry`, `secrets`.
- Enforce scope gating in MCP service: Noor persona can access personal/departmental/ministry only; Maestro can access all.
- Add a memory debug endpoint `/api/v1/debug/memory-scopes` to show scope usage during development.
- Test semantic search + vector embedding via OpenAI for small memory corpus.

**Acceptance Criteria:**
- [ ] 4 scopes defined and gated per persona.
- [ ] Scope validation enforced in `mcp_service.py` + `mcp_service_maestro.py`.
- [ ] Debug endpoint shows scope counts + recent entries.
- [ ] Vector embeddings generated and searchable (latency <500ms for small corpus).

**Files to Touch:**
- `/backend/app/services/mcp_service.py` — enforce scope gating.
- `/backend/app/services/mcp_service_maestro.py` — enable all scopes.
- `/backend/app/api/routes/debug.py` — add memory-scopes endpoint.
- `/backend/app/services/embedding_service.py` — validate OpenAI key + test embedding generation.

**Time Estimate:** 2 hours.

---

### 2.4 Phase 2 Summary

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| LLM contract enforcement | To Do | Backend | +2 days |
| Conversation compression | To Do | Backend + Frontend | +2 days |
| Memory banks + scope gating | To Do | Backend | +1 day |
| Model switching validation | To Do | Ops | +1 day |

**Total Phase 2 Time:** ~8–10 hours spread over 3 days.

**Outcome:** Stable, honest responses; compressed history; memory foundation ready.

---

## Phase 3: Memory + Observability (Days 4–7)

**Goal:** Full memory architecture + real-time observability dashboard.

### 3.1 Complete Memory Architecture

**What:**
- Nightly ETL: process all conversations daily; extract entities, compress, vectorize, store in 4-scope banks.
- Daily chunking: split long conversations into daily buckets; add to `departmental` scope for team recall.
- Conversation compression: Store weekly summaries in `ministry` scope (available to all staff + exec).
- Cross-persona memory: Noor memories (personal/departmental/ministry) available to Maestro; Maestro memories (secrets) blocked from Noor.

**Acceptance Criteria:**
- [ ] Nightly ETL runs; processes conversations without blocking.
- [ ] Daily chunking visible in memory bank; searchable by date + scope.
- [ ] Compression reduces conversation size by 80–90% without losing intent.
- [ ] Cross-persona gating enforced; audit log created.

**Files to Create/Touch:**
- `/backend/scripts/nightly_memory_etl.py` (new) — ETL job.
- `/backend/app/services/conversation_compressor.py` (expand from Phase 2).
- `/backend/app/services/memory_etl_service.py` (new) — orchestrates nightly job.
- Cron job in deployment (or k8s cronjob).

**Time Estimate:** 4–5 hours.

---

### 3.2 Observability Dashboard (MVP)

**What:**
- Real-time metrics page (extend `/api/v1/debug/traces`):
  - Query success rate (%).
  - Avg latency (p50, p95, p99).
  - Tool call accuracy (by tool type).
  - LLM model distribution (% 20B vs 70B vs 120B).
  - Error rate by type (JSON parse, tool timeout, empty result, etc.).
- Charts: latency distribution, error trend, model comparison.
- No complex dashboarding tool required; simple React page + OpenTelemetry metrics export.

**Acceptance Criteria:**
- [ ] Real-time metrics visible on dashboard.
- [ ] Latency histogram + error breakdown displayed.
- [ ] Model A/B comparison available (e.g., 20B vs 70B avg latency).
- [ ] Dashboard updates every 5–10s (WebSocket or polling).

**Files to Create/Touch:**
- `/frontend/src/pages/MetricsPage.tsx` (new).
- `/backend/app/api/routes/metrics.py` (new) — expose Prometheus/OTEL metrics as JSON.
- `/frontend/src/lib/services/metricsService.ts` (new).

**Time Estimate:** 3–4 hours.

---

### 3.3 Phase 3 Summary

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| Full memory architecture | To Do | Backend | +4 days |
| Daily chunking + ETL | To Do | Backend | +4 days |
| MVP observability dashboard | To Do | Backend + Frontend | +3 days |

**Total Phase 3 Time:** ~12–15 hours over 4 days.

**Outcome:** Persistent, multi-scope memory; real-time observability.

---

## Phase 4: Phase A Desks + Evaluation (Days 8–14)

**Goal:** Deterministic UI desks (Control Tower, Dependency, Risk) + evaluation framework.

### 4.1 Phase A Desks (from Transition Plan)

**What:**
- Build 3 desk views (Control Tower Overview, Dependency Desk, Risk Desk) using existing dashboard endpoints.
- Each desk: summary metrics + ranked list + Deep Dive panel (AI-powered on selection only).
- Desks are deterministic (no LLM on load); only Deep Dive calls LLM (with context).
- Add quick-action buttons for each desk in sidebar.

**Acceptance Criteria:**
- [ ] All 3 desks load in <1s without LLM calls.
- [ ] Deep Dive gated to selection; uses evidence-gating contract.
- [ ] Missing data displayed safely (no hallucination).
- [ ] Sidebar buttons navigate to desks; pre-set id/year for demo.

**Files to Create/Touch:**
- `/frontend/src/components/content/control_tower/ControlTowerOverviewView.tsx` (from Transition Plan).
- `/frontend/src/components/content/control_tower/DependencyDeskView.tsx` (from Transition Plan).
- `/frontend/src/components/content/control_tower/RiskDeskView.tsx` (from Transition Plan).
- `/frontend/src/components/content/control_tower/DeepDivePanel.tsx` (from Transition Plan).
- `/frontend/src/components/content/control_tower/ControlTowerViews.css` (from Transition Plan).

**Time Estimate:** 6–8 hours.

---

### 4.2 Evaluation Framework (MVP)

**What:**
- Define 5–10 evaluation metrics:
  - **Task Adherence:** Does response answer the user question? (1–5 scale).
  - **Evidence Grounding:** Are claims backed by graph data? (yes/no).
  - **Clarity:** Is response well-structured and concise? (1–5 scale).
  - **Tool Use Accuracy:** Did LLM call the right tools? (% correct).
  - **Hallucination Rate:** Did LLM invent data? (% yes).
- Build 20–30 test cases (queries + expected answers) for regression.
- Use Azure AI Evaluation SDK (or simple custom evaluators).
- Run nightly; report metrics.

**Acceptance Criteria:**
- [ ] Metrics defined; test cases created.
- [ ] Evaluation runs nightly; stores results.
- [ ] Comparison available: 20B vs 70B vs 120B performance.
- [ ] Regressions detected automatically.

**Files to Create/Touch:**
- `/backend/scripts/evaluation_test_cases.py` (new).
- `/backend/scripts/run_evaluation.py` (new) — nightly evaluation job.
- `/backend/app/core/evaluators.py` (new) — custom evaluator logic.

**Time Estimate:** 4–5 hours.

---

### 4.3 Phase 4 Summary

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| Phase A desks (3 views) | To Do | Frontend | +6 days |
| Deep Dive panel | To Do | Frontend | +6 days |
| Evaluation framework | To Do | Backend | +4 days |
| Nightly evaluation job | To Do | DevOps | +4 days |

**Total Phase 4 Time:** ~20–22 hours over 7 days.

**Outcome:** Deterministic UI; objective performance metrics.

---

## Phase 5: Enterprise Hardening (Days 15–21)

**Goal:** Production readiness; authentication, rate limits, security, CI/CD.

### 5.1 Security & Auth Hardening

**What:**
- Enforce role-based access control (RBAC): staff → Noor, exec → Maestro.
- Rate limiting: 10 queries/min per user; 100 queries/hour per IP.
- Input validation: sanitize all user inputs; block SQL/code injection.
- Secrets management: rotate API keys; store in env or vault (not git).
- Audit logging: log who accessed what, when, why.

**Time Estimate:** 3–4 hours.

---

### 5.2 CI/CD + Deployment

**What:**
- GitHub Actions workflow: run tests + lint + security scan on every push.
- Automated evaluation on staging; block deploy if metrics regress.
- Blue-green deployment: zero-downtime updates.
- Helm charts for k8s (or Docker Compose for smaller deployments).

**Time Estimate:** 4–5 hours.

---

### 5.3 Documentation + Runbooks

**What:**
- API documentation (OpenAPI/Swagger).
- Deployment guide; scaling guide; troubleshooting runbooks.
- Memory architecture guide; evaluation guide.
- User guide; admin guide.

**Time Estimate:** 3–4 hours.

---

### 5.4 Phase 5 Summary

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| RBAC + rate limiting | To Do | Backend | +3 days |
| CI/CD pipeline | To Do | DevOps | +2 days |
| Documentation | To Do | Docs | +3 days |

**Total Phase 5 Time:** ~15–17 hours over 7 days.

**Outcome:** Production-ready; secure; auditable; scalable.

---

## Consolidated Timeline

| Phase | Focus | Duration | Target Date |
|-------|-------|----------|-------------|
| **Phase 1** | Investor Demo | Today (8–10 hrs) | **December 15** |
| **Phase 2** | Foundation | 3 days (8–10 hrs) | December 18 |
| **Phase 3** | Memory + Observability | 4 days (12–15 hrs) | December 22 |
| **Phase 4** | Desks + Evaluation | 7 days (20–22 hrs) | December 29 |
| **Phase 5** | Enterprise Hardening | 7 days (15–17 hrs) | January 5 |

**Total Effort:** ~73–74 hours over ~26 days to MVP + enterprise ready.

---

## Reference: Architecture Components by Phase

### Phase 1 (Today)
- Model switching (Groq 20B/70B/120B + local).
- Named chains endpoint (deterministic Cypher).
- Quick-action UI buttons.
- Demo runbook.

### Phase 2
- LLM contract enforcement.
- Conversation compression.
- Memory scope gating (Noor/Maestro).

### Phase 3
- Full memory ETL.
- Daily chunking.
- Real-time observability.

### Phase 4
- Phase A desks (3 views).
- Deep Dive panel.
- Evaluation framework.

### Phase 5
- RBAC + rate limiting.
- CI/CD + deployment.
- Full documentation.

---

## Success Criteria (Investor Demo, Phase 1)

1. ✅ Three deterministic chains run reliably (<2.5s latency).
2. ✅ No hallucination on empty results.
3. ✅ Model switching (20B → 70B) works live.
4. ✅ Deep Dive provides honest AI analysis without making up data.
5. ✅ Observability shows end-to-end trace for each query.
6. ✅ Demo script is documented and tested.

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| LLM latency (>2.5s) | Pre-warm cache; use 20B primarily; local fallback available. |
| Empty graph results | Enforce missing-data guard; show honest "data missing" message. |
| Model JSON failures | Contract enforcement + one retry; graceful failure if retry fails. |
| Memory scope gating bugs | Test Noor/Maestro personas separately; audit log created. |
| Evaluation metrics drift | Baseline metrics from Phase 1; flag regressions in Phase 4. |

---

## How to Use This Document

1. **Phase 1 (Today):** Execute sections 1.1–1.4; do NOT start Phase 2 until demo is complete.
2. **After Demo:** Review Phase 1 outcome; decide go/no-go for Phase 2.
3. **Phases 2–5:** Execute sequentially; lock section at the start of each phase to prevent scope creep.
4. **Weekly Sync:** Review Phase X progress; adjust timeline if blockers emerge.

---

## Appendix: File Inventory

### Backend Files (To Create/Modify)

**Model Switching:**
- `/backend/app/config/__init__.py` — add model env vars.
- `/backend/app/services/orchestrator_universal.py` — model selection + local detection.
- `/backend/app/api/routes/chains.py` (new) — named chains endpoint.

**Phase 2+:**
- `/backend/app/core/llm_contract.py` — LLM response validation.
- `/backend/app/services/conversation_compression.py` — history compression.
- `/backend/app/services/memory_etl_service.py` — nightly memory job.
- `/backend/app/api/routes/metrics.py` — observability metrics.

### Frontend Files (To Create/Modify)

**Phase 1:**
- `/frontend/src/components/chat/QuickChainsPanel.tsx` (new).
- `/frontend/src/lib/services/chainsService.ts` (new).
- `/frontend/src/components/chat/QuickChainsPanel.css` (new).
- `/frontend/src/components/chat/ChatContainer.tsx` — integrate QuickChainsPanel.

**Phase 4+:**
- `/frontend/src/components/content/control_tower/ControlTowerOverviewView.tsx`.
- `/frontend/src/components/content/control_tower/DependencyDeskView.tsx`.
- `/frontend/src/components/content/control_tower/RiskDeskView.tsx`.
- `/frontend/src/components/content/control_tower/DeepDivePanel.tsx`.
- `/frontend/src/pages/MetricsPage.tsx` (new).

---

**Document locked for Phase 1 execution. Do not modify until Phase 1 complete.**
