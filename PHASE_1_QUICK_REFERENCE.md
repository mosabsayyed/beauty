# PHASE 1: Quick Reference Card (TODAY)

**Print this. Use this. Don't lose focus.**

---

## 🎯 Goal (Tonight)
Live investor demo: Deterministic chains + AI deep dives, no hallucination.

---

## 🔧 4 Workstreams (Parallel)

### 1️⃣ Backend Model Switching (3–4 hrs)
```bash
Files to Edit:
  • /backend/app/config/__init__.py               → Add model env vars
  • /backend/app/services/orchestrator_universal.py  → Model selection logic
  • /backend/app/api/routes/chat.py               → model_override param

Code Snippets:
  ✓ Add GROQ_MODEL_PRIMARY, GROQ_MODEL_FALLBACK, GROQ_MODEL_ALT
  ✓ Add LOCAL_LLM_ENABLED, OLLAMA_URL
  ✓ Add __init__ logic: if local → use ollama; else use groq
  ✓ Add _invoke_llm_with_tools() router
  ✓ Add _invoke_groq_llm() + retry on 400
  ✓ Add _invoke_local_llm() fallback to groq
  ✓ Update ChatRequest.model_override

Quick Test:
  python /backend/test_phase1.py
```

### 2️⃣ Named Chains Endpoint (2–3 hrs)
```bash
Files to Create:
  • /backend/app/api/routes/chains.py             → Named query endpoint

Code Snippets:
  ✓ Pre-verified CYPHER dict (from /docs/verified_business_chains.md)
  ✓ GET /api/v1/chains/{chain_key}?id=X&year=Y
  ✓ Return: { chain_key, id, year, nodes, edges, summary, clarification_needed }
  ✓ If empty: clarification_needed=true, missing_data=[]

Registration:
  • /backend/app/main.py → app.include_router(chains.router, ...)

Quick Test:
  curl "http://localhost:8008/api/v1/chains/SectorOps?id=sector_001&year=2025"
```

### 3️⃣ Frontend Quick-Action Buttons (2–3 hrs)
```bash
Files to Create:
  • /frontend/src/lib/services/chainsService.ts        → Chain API client
  • /frontend/src/components/chat/QuickChainsPanel.tsx  → UI buttons & results
  • /frontend/src/components/chat/QuickChainsPanel.css  → Styles

Files to Modify:
  • /frontend/src/components/chat/ChatContainer.tsx → Import + render QuickChainsPanel

Code Snippets:
  ✓ 3 buttons: "SectorOps Loop", "Strategy→Tactics", "Risk Operate"
  ✓ Each button → call chainsService.executeChain()
  ✓ Display: nodes + edges + summary + provenance
  ✓ Show "Data missing" if clarification_needed=true
  ✓ "Deep Dive" button → send result to /chat/message

Quick Test:
  Click buttons in sidebar; verify results appear
```

### 4️⃣ Demo Prep (1–2 hrs)
```bash
Files to Create:
  • /docs/INVESTOR_DEMO_RUNBOOK.md  (in PHASE_1_EXECUTION_PLAN.md)

Pre-Demo Checklist (15 min before):
  ✓ Start backend: ./sb.sh --fg
  ✓ Start frontend: ./sf1.sh
  ✓ Pre-warm cache: run each chain once
  ✓ Verify latency: all < 500ms
  ✓ Test observability: http://localhost:3000/admin/observability
  ✓ Run test script: python /backend/test_phase1.py

Demo Script (5 min):
  1. Show observability (30s)
  2. Click "SectorOps Loop" (30s)
  3. Show provenance + data source (30s)
  4. Click "Deep Dive" (1 min)
  5. Switch model 20B→70B (optional, 1 min)
  6. Show local fallback config (optional, 30s)
```

---

## 🚨 Acceptance Criteria (Phase 1)

Before demoing, MUST pass all:

- [ ] `GROQ_MODEL_PRIMARY` env var controls model selection
- [ ] Fallback from 20B → 70B works on timeout/error
- [ ] Local model mode (if enabled) routes to Ollama
- [ ] `/api/v1/chains/{chain_key}?id=X&year=Y` returns valid JSON
- [ ] All 3 chains execute < 2.5s latency
- [ ] Empty results show "Data missing" (no LLM hallucination)
- [ ] Quick-action buttons display + clickable
- [ ] Results show provenance (chain, id, year visible)
- [ ] "Deep Dive" button sends data to chat without hallucination
- [ ] Observability traces visible at /admin/observability
- [ ] No HTTP 500 errors

---

## 🌍 Environment Variables

Create/update `/backend/.env`:

```env
# Phase 1: Model Selection (Groq)
GROQ_MODEL_PRIMARY=openai/gpt-oss-20b
GROQ_MODEL_FALLBACK=llama-3.3-70b-versatile
GROQ_MODEL_ALT=openai/gpt-oss-120b

# Phase 1: Demo Mode (Deterministic)
DEMO_MODE=true
DEMO_TEMPERATURE=0

# Phase 1: Local Model (Optional)
LOCAL_LLM_ENABLED=false
# LOCAL_LLM_ENABLED=true  # Uncomment to test local
OLLAMA_URL=http://localhost:11434
LOCAL_MODEL_NAME=llama2:7b-q4_K_M

# Existing (No Change)
GROQ_API_KEY=<your-key>
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
NEO4J_URI=<your-uri>
NEO4J_PASSWORD=<your-password>
NOOR_MCP_ROUTER_URL=http://127.0.0.1:8201
MAESTRO_MCP_ROUTER_URL=http://127.0.0.1:8202
```

---

## 📋 Execution Checklist

### Day Kickoff
- [ ] Read this card
- [ ] Read `/PHASE_1_EXECUTION_PLAN.md`
- [ ] Check `.env` configured
- [ ] Review demo script

### Workstream 1 (Backend Model Switch)
- [ ] Config added to Settings
- [ ] Orchestrator modified + tested locally
- [ ] Chat route updated
- [ ] Groq + local routing works

### Workstream 2 (Named Chains)
- [ ] chains.py created + registered
- [ ] CYPHER dict populated (from docs/verified_business_chains.md)
- [ ] Endpoint tested via curl
- [ ] Returns valid JSON

### Workstream 3 (Frontend UI)
- [ ] chainsService.ts created
- [ ] QuickChainsPanel.tsx created + styled
- [ ] Integrated into ChatContainer
- [ ] Buttons visible + clickable

### Workstream 4 (Demo Prep)
- [ ] Neo4j cache pre-warmed (each chain run once)
- [ ] All chains < 500ms latency confirmed
- [ ] Test script passes
- [ ] Demo script finalized

### Final Go/No-Go
- [ ] All acceptance criteria met?
  - YES → Proceed to demo ✅
  - NO → Debug + retry (do not skip)

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| HTTP 400 "oversized payload" | Trim history to 3 messages before Groq call (done in code) |
| Chain returns empty result | Check graph data exists; run Cypher in Neo4j manually |
| Buttons not appearing | Check ChatContainer imports QuickChainsPanel |
| Model override doesn't work | Check env var; whitelist model name in code |
| Latency > 2.5s | Pre-warm cache; use 20B instead of 70B; check Neo4j memory |
| "Data missing" for valid IDs | Verify graph IDs match Cypher parameters; check Neo4j query |
| Observability page blank | Check OpenTelemetry setup in /backend/app/main.py |

---

## 📞 Decision Gates

**If blocked:**
1. Which workstream? (1, 2, 3, 4)
2. What's the blocker? (code, external, scope)
3. Can you unblock it? (yes → do it | no → escalate)
4. Does it affect demo? (yes → critical | no → defer to Phase 2)

---

## ✅ Demo Success Checklist

Immediately before entering room:

- [ ] Backend running (`./sb.sh`)
- [ ] Frontend running (`./sf1.sh`)
- [ ] All 3 chains tested + < 500ms each
- [ ] Observability accessible
- [ ] Demo script printed / memorized
- [ ] Internet stable (or local fallback tested)
- [ ] Phone set to silent
- [ ] Timer ready (5 min max)

---

## 🎬 Demo Script (Word-for-Word)

```
"Thank you for being here. JOSOOR is a transformation Control Tower — 
deterministic reporting + AI deep dives. No guesswork. Just data.

[SHOW OBSERVABILITY]
This is our real-time dashboard: query success rate, latency, model 
performance. We track everything.

[CLICK 'SECTOROPS LOOP']
Now I'm running a complex business chain: from Sector Objective through 
Policy, Admin Records, Stakeholders, Performance. This isn't AI hallucination — 
this is a verified query on our transformation graph. You can see the data source 
right here: SectorOps | year 2025 | id sector_001.

[SHOW RESULT]
6 entities, 5 relationships. Completely traceable.

[CLICK 'DEEP DIVE']
Now we ask AI to analyze the chain results. No LLM ambiguity — the AI works 
from grounded facts. If data is missing, it tells us. No invention.

[OPTIONAL: MODEL SWITCH]
Behind the scenes, we can switch between multiple LLM models: 20B for speed, 
70B for quality, 120B for deep reasoning. Depending on the question.

[CLOSE]
That's JOSOOR. Deterministic Control Tower with intelligent analysis. 
Questions?"

Total time: 5 min.
```

---

## 🚀 Post-Demo (Same Night)

**If demo succeeds:**
1. Celebrate 🎉
2. Document what worked
3. Save trace logs for Phase 2 analysis
4. Plan Phase 2 kickoff (tomorrow or next week)

**If demo has issues:**
1. Capture error logs
2. Identify root cause (code, config, data)
3. Patch immediately if possible
4. Document for Phase 2 hardening

---

**Status:** 🟢 READY TO EXECUTE  
**Last Updated:** December 15, 2025  
**Execution Timeline:** TODAY (8–10 hours)  
**Next Gate:** Demo Success (Tonight)  
**Next Phase:** Phase 2 Foundation (Post-Demo)

---

## 📚 Reference Docs (Don't Leave Home Without)

1. `/PHASE_1_EXECUTION_PLAN.md` — Full detailed steps
2. `/INVESTOR_DEMO_TO_ENTERPRISE_ROADMAP.md` — Master roadmap (read Phases 1–2)
3. `/MEMORY_ARCHITECTURE_DESIGN.md` — Memory architecture (for Phase 2 context)
4. `/MASTER_PLANNING_INDEX.md` — Scope locks + weekly sync template
5. `/docs/verified_business_chains.md` — Canonical Cypher queries (copy into chains.py)
6. `00_START_HERE.md` — Quick navigation (ports, URLs, env setup)

---

**You've got this. Lock in, execute, and ship it tonight. 💪**
