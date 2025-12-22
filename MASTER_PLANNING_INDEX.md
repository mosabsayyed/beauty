# JOSOOR Master Planning Index

**Purpose:** Single source of truth for all planning docs. Links all phases, prevents scope creep, ensures focus.

**Created:** December 15, 2025 | Status: Active | Owner: Development Team

---

## 📋 Core Planning Documents

| Document | Purpose | Status | Link |
|----------|---------|--------|------|
| **Investor Demo → Enterprise Ready Roadmap** | Master timeline + phases 1–5 | 🔵 Active | `/INVESTOR_DEMO_TO_ENTERPRISE_ROADMAP.md` |
| **Phase 1 Execution Plan** | Detailed TODAY tasks (model switch + quick chains) | 🟢 Ready to Execute | `/PHASE_1_EXECUTION_PLAN.md` |
| **Memory Architecture Design** | Conversation compression + browser temp memory specs | 🔵 Specification | `/MEMORY_ARCHITECTURE_DESIGN.md` |
| **Investor Demo Runbook** | 5-min demo script + pre-checks | 📄 In Phase 1 Doc | PHASE_1_EXECUTION_PLAN.md § 4.1 |

---

## 🎯 Phase Summary

### Phase 1: Investor Demo (TODAY — 8–10 hrs)
**Goal:** Live, reliable demo showcasing deterministic chains + AI deep dives.

**Deliverables:**
- ✅ Model switching (Groq 20B/70B/120B + local fallback)
- ✅ Named-query endpoint for 7 verified business chains
- ✅ Quick-action UI (3 buttons on chat sidebar)
- ✅ Demo script (5 min, tested, pre-warmed)

**Go/No-Go Criteria:**
- All chains < 2.5s latency
- Zero hallucination on empty results
- Observability traces visible

**Next Decision:** Demo success → proceed to Phase 2 | Demo fails → debug + retry Phase 1

---

### Phase 2: Foundation Hardening (Days 1–3 Post-Demo)
**Goal:** Stabilize core after demo; prepare for memory integration.

**Deliverables:**
- LLM contract enforcement (canonical response schema)
- Conversation compression (MVP: message-based + in-memory)
- Local browser temp memory (MVP: daily chunks in localStorage)
- Memory scope gating (4 scopes: personal/departmental/ministry/secrets)
- Model switching validation (regression tests)

**Time:** ~8–10 hours over 3 days.

**Details:** See `/MEMORY_ARCHITECTURE_DESIGN.md` for compression + browser memory design.

---

### Phase 3: Memory + Observability (Days 4–7)
**Goal:** Full memory architecture + real-time observability.

**Deliverables:**
- Nightly ETL for memory banks (daily chunking + compression)
- Real-time observability dashboard (latency, errors, model distribution)
- Persistent compression (migrate from in-memory to Supabase)
- Cross-session memory (memories available across conversations)

**Time:** ~12–15 hours over 4 days.

---

### Phase 4: Phase A Desks + Evaluation (Days 8–14)
**Goal:** Deterministic UI desks + evaluation framework.

**Deliverables:**
- 3 Phase A desks (Control Tower, Dependency, Risk) — deterministic, no LLM on load
- Deep Dive panel — AI-only on selection
- Evaluation framework (5–10 metrics, 20–30 test cases)
- Nightly evaluation job + regression detection

**Time:** ~20–22 hours over 7 days.

---

### Phase 5: Enterprise Hardening (Days 15–21)
**Goal:** Production readiness.

**Deliverables:**
- RBAC + rate limiting
- CI/CD pipeline + automated testing
- Full documentation + runbooks
- Security hardening (auth, secrets, audit)

**Time:** ~15–17 hours over 7 days.

---

## 🚫 Scope Locks (Prevent Creep)

### Phase 1 LOCKED (No Additions)
- ❌ Do NOT add Phase A desks to Phase 1
- ❌ Do NOT add evaluation framework to Phase 1
- ❌ Do NOT add memory ETL to Phase 1
- ✅ Focus: Quick chains + model switch + demo success

### Phase 2 LOCKED (Until Phase 1 Complete)
- ✅ Do compress conversations
- ✅ Do add local browser memory
- ✅ Do NOT add desks (Phase 4)
- ✅ Do NOT add evaluation framework (Phase 4)

### Phase 3 LOCKED (Until Phase 2 Complete)
- ✅ Do implement full memory ETL
- ✅ Do add observability dashboard
- ❌ Do NOT start evaluation framework (Phase 4)
- ❌ Do NOT start desks (Phase 4)

**How to enforce:** Review this doc before every decision. If new work falls outside current phase, defer to next phase.

---

## 📁 File Structure (By Phase)

### Phase 1 Files
```
/backend/app/config/__init__.py              ← Add model env vars
/backend/app/services/orchestrator_universal.py  ← Model switching logic
/backend/app/api/routes/chains.py            ← Named chains endpoint (NEW)
/backend/app/api/routes/chat.py              ← Model override param
/frontend/src/components/chat/QuickChainsPanel.tsx  ← UI buttons (NEW)
/frontend/src/lib/services/chainsService.ts   ← Chain API wrapper (NEW)
/docs/INVESTOR_DEMO_RUNBOOK.md               ← In PHASE_1_EXECUTION_PLAN.md
```

### Phase 2 Files
```
/backend/app/core/llm_contract.py            ← Response schema enforcement (NEW)
/backend/app/services/conversation_compressor.py  ← Compression logic (NEW)
/backend/app/services/mcp_service.py         ← Scope gating validation
/frontend/src/lib/services/dailyChunkService.ts  ← Browser chunks (NEW)
/frontend/src/pages/DailyChunksPanel.tsx     ← UI for chunks (NEW)
```

### Phase 3 Files
```
/backend/scripts/nightly_memory_etl.py       ← Daily memory job (NEW)
/backend/app/services/memory_etl_service.py  ← ETL orchestration (NEW)
/backend/app/api/routes/metrics.py           ← Observability metrics (NEW)
/frontend/src/pages/MetricsPage.tsx          ← Dashboard UI (NEW)
```

### Phase 4 Files
```
/frontend/src/components/content/control_tower/ControlTowerOverviewView.tsx
/frontend/src/components/content/control_tower/DependencyDeskView.tsx
/frontend/src/components/content/control_tower/RiskDeskView.tsx
/frontend/src/components/content/control_tower/DeepDivePanel.tsx
/backend/scripts/evaluation_test_cases.py    ← Test dataset (NEW)
/backend/scripts/run_evaluation.py           ← Nightly evaluator (NEW)
/backend/app/core/evaluators.py              ← Custom evaluators (NEW)
```

---

## 🔄 Weekly Sync Checklist

**Every Monday (or phase boundary):**

- [ ] Review current phase progress (% complete)
- [ ] Check for scope creep (any work outside current phase?)
- [ ] Identify blockers (waiting on external dependencies?)
- [ ] Validate acceptance criteria (are we on track?)
- [ ] Decide: Continue current phase, or move to next?

**Template:**
```
Phase X Progress:
- Completed: [list items]
- In Progress: [list items]
- Blocked: [list items + mitigation]
- On Track? (Yes/No)
  - If No: Why? Adjust timeline? Need help?
- Proceed to Phase X+1? (Yes/No/Maybe)
```

---

## 🎯 Success Metrics by Phase

### Phase 1 (Tonight)
- [ ] Demo delivered to investors
- [ ] 3 chains execute reliably (<2.5s)
- [ ] Model switch works (20B → 70B)
- [ ] Observability traces visible
- [ ] No hallucination on empty results

### Phase 2 (Day 3)
- [ ] History < 4000 tokens before Groq
- [ ] Page reload restores context
- [ ] localStorage persists 7 days of chunks
- [ ] Zero data loss

### Phase 3 (Day 7)
- [ ] Nightly ETL processes all chunks
- [ ] Observability dashboard live
- [ ] Cross-conversation recall working
- [ ] "Week Review" Deep Dive available

### Phase 4 (Day 14)
- [ ] 3 desks render (Control Tower, Dependency, Risk)
- [ ] Evaluation metrics established
- [ ] Baseline accuracy ≥ 85%
- [ ] Regression tests passing

### Phase 5 (Day 21)
- [ ] RBAC enforced
- [ ] CI/CD pipeline fully automated
- [ ] All documentation complete
- [ ] Security audit passed

---

## 🔗 Dependencies Between Phases

```
Phase 1 (Demo) ✅
    ↓
Phase 2 (Foundation) — needs Phase 1 success
    ↓
Phase 3 (Memory + Observability) — needs Phase 2 completion
    ↓
Phase 4 (Desks + Eval) — needs Phase 3 completion
    ↓
Phase 5 (Enterprise) — needs Phase 4 completion
```

**Hard Blocker:** Cannot start Phase X+1 until Phase X acceptance criteria are met.

---

## 📞 Decision Escalation Path

**If decision needed about scope/timeline:**

1. **Rank:** Is this Phase 1, 2, 3, 4, or 5 work?
2. **Check:** Does current phase allow this work?
3. **If Yes:** Proceed; log in Phase doc.
4. **If No:** Defer to appropriate phase; add to backlog for that phase.
5. **If Urgent:** Escalate; require explicit trade-off (drop something to make room).

**Example:**
- User: "Can we add Deep Dive panel to Phase 1?"
- Answer: "No, that's Phase 4 work. Phase 1 is quick chains + model switch only. We can add a basic text analysis in Phase 2 if needed."

---

## 🧠 Key Design Decisions (Locked)

| Decision | Phase | Status | Rationale |
|----------|-------|--------|-----------|
| Model switch: 20B primary, 70B fallback, 120B alt | Phase 1 | ✅ Locked | Demo needs fastest option; fallback for quality |
| Named chains: pre-verified Cypher (not LLM-generated) | Phase 1 | ✅ Locked | Deterministic, no hallucination |
| Compression trigger: message-based (>= 5 messages) | Phase 2 | 🔵 Specification | Simple MVP; revisit to token-based if needed |
| Browser storage: localStorage (Option A) | Phase 2 | 🔵 Specification | Simple MVP; migrate to IndexedDB Phase 2.5 |
| Memory scopes: 4 banks (personal/departmental/ministry/secrets) | Phase 2 | ✅ Locked | Matches org structure |
| Desks: deterministic on load, AI only on Deep Dive | Phase 4 | 🔵 Specification | No hallucination; bounded AI |
| Evaluation: 5–10 metrics, 20–30 test cases | Phase 4 | 🔵 Specification | MVP evaluation; expand Phase 5 |

---

## ⚠️ Known Risks (With Mitigations)

| Risk | Severity | Mitigation | Phase |
|------|----------|-----------|-------|
| Groq latency > 2.5s for chains | 🔴 High | Pre-warm cache; use 20B; local fallback | Phase 1 |
| Conversation history bloats → 400 errors | 🔴 High | Compression in Phase 2 | Phase 2 |
| localStorage quota exceeded | 🟠 Medium | Archival strategy; migrate to IndexedDB Phase 2.5 | Phase 2 |
| Memory scope gating bugs leak sensitive data | 🔴 High | Test Noor/Maestro separately; audit log | Phase 2 |
| Eval metrics don't align with business needs | 🟠 Medium | Baseline from Phase 1; adjust Phase 4 | Phase 4 |
| Enterprise hardening skipped (security debt) | 🔴 High | Phase 5 mandatory before production | Phase 5 |

---

## 📊 Timeline Summary

| Phase | Duration | Start | End | Owner |
|-------|----------|-------|-----|-------|
| Phase 1 | 1 day | Today | Today | Backend + Frontend |
| Phase 2 | 3 days | Day 1 | Day 3 | Backend + Frontend |
| Phase 3 | 4 days | Day 4 | Day 7 | Backend |
| Phase 4 | 7 days | Day 8 | Day 14 | Frontend + Backend |
| Phase 5 | 7 days | Day 15 | Day 21 | Backend + DevOps |
| **Total** | **26 days** | — | **January 5** | All |

**Estimated effort:** ~73–74 hours.

---

## 🎁 Deliverables (Summary)

### By Demo Night (Phase 1)
- Working quick-action buttons (3 deterministic chains)
- Model switching capability
- Demo runbook + success criteria

### By End of Phase 2
- Stable history management (compression + chunking)
- Local persistence (localStorage)
- Memory scope gating enforced

### By End of Phase 3
- Real-time observability dashboard
- Nightly memory ETL
- Cross-session memory available

### By End of Phase 4
- 3 deterministic desks (Control Tower, Dependency, Risk)
- Evaluation framework + baseline metrics
- Deep Dive panel

### By End of Phase 5 (January 5)
- Production-ready system
- Full RBAC + rate limiting
- CI/CD pipeline
- Complete documentation

---

## 🚀 How to Use This Index

1. **Before Daily Standup:** Check this index for current phase + acceptance criteria.
2. **Before Adding Work:** Check phase lock + scope rules. If outside current phase, defer.
3. **Weekly Review:** Use checklist; validate progress; decide next phase.
4. **If Stuck:** Review risks + mitigations; escalate if needed.
5. **End of Phase:** Update acceptance criteria section; lock phase; move to next.

---

**This index is the source of truth. Update it weekly. Never skip a phase.**

**Last Updated:** December 15, 2025  
**Next Review:** December 22, 2025 (End of Phase 2)  
**Locked By:** Development Lead
