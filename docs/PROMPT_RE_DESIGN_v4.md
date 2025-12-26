# PROMPT RE-DESIGN v4: Hard-Coded & Chain-Driven

**Status:** Draft / Proposed
**Date:** December 24, 2025
**Goal:** Eliminate LLM hallucinations by hard-coding prompts and enforcing code-side logic for complex business chains.

---

## 1. Core Philosophy
1.  **Code-Side Logic > Prompt Instructions:** Move complex graph traversal logic out of the prompt and into Python functions (`chains.py`).
2.  **Hard-Coded Prompts:** Eliminate database latency and "drift" by storing the definitive prompt strings in `backend/app/services/prompt_service.py`.
3.  **Deterministic Chains:** The 7 Business Chains are no longer just "patterns" for the LLM to learn; they are **named functions** the LLM must call.

---

## 2. The 7 Deterministic Business Chains
The LLM will be instructed to map user intent to one of these keys. The backend will execute the optimized Cypher.

| Chain Key | Trigger Intent | Backend Function |
|-----------|----------------|------------------|
| `sector_ops` | "How is the sector operating?" / "Trace objective execution" | `get_sector_ops_chain(year)` |
| `strategy_to_tactics_priority` | "Show priority cascade" / "Strategic alignment" | `get_strategy_priority_chain(year)` |
| `strategy_to_tactics_targets` | "Show target cascade" / "KPI alignment" | `get_strategy_targets_chain(year)` |
| `tactical_to_strategy` | "Bottom-up feedback" / "Impact of project X on strategy" | `get_tactical_feedback_chain(id, year)` |
| `risk_build_mode` | "Risks in design phase" / "Policy risks" | `get_risk_build_chain(year)` |
| `risk_operate_mode` | "Risks in operation" / "Performance risks" | `get_risk_operate_chain(year)` |
| `internal_efficiency` | "Process efficiency" / "Vendor dependencies" | `get_internal_efficiency_chain(year)` |

---

## 3. New Prompt Structure (Tier 1 & 2)

### Tier 1: Identity & Routing (Hard-Coded)
*   **Role:** Noor (Staff) or Maestro (Exec).
*   **Routing:** 
    *   If query matches a Business Chain -> Call `execute_chain(chain_key, params)`.
    *   If query is simple lookup -> Call `read_neo4j_cypher` (strictly constrained).
    *   If query is conversational -> Respond directly.

### Tier 2: Atomic Elements (Hard-Coded Library)
Instead of loading "bundles", the system provides a catalog of **Tools** and **Schemas**.

#### The "Chain of Thought" Requirement
The prompt will enforce a strict thought process:
1.  **Analyze Request:** Identify entities and intent.
2.  **Check Chain Registry:** Does this match one of the 7 deterministic chains?
    *   *YES:* Select chain key. STOP. Call `execute_chain`.
    *   *NO:* Is it a simple single-node lookup? 
        *   *YES:* Construct simple Cypher (MATCH n WHERE...). Call `read_neo4j_cypher`.
        *   *NO:* Refuse to hallucinate complex traversals. Ask for clarification.

---

## 4. Implementation Plan (Refined)

### Phase 0: Documentation Refresh (Current)
*   Update `docs/BACKEND_ARCHITECTURE.md` to reflect `StaticPromptService` and `ChainService`.
*   Update `docs/DATA_ARCHITECTURE.md` to confirm the 7 chains are exposed as API/Tools.

### Phase 1: Chain Service Hardening
*   Verify `backend/app/api/routes/chains.py` implements the 7 queries efficiently.
*   Ensure they accept `year` and `level` parameters correctly.

### Phase 2: Static Prompt Service
*   Create `backend/app/services/prompt_service.py`.
*   Hard-code the "v3.4" prompt text (sourced from `v3.4_tier1_atomic_elements.sql` and `v3.4_instruction_elements_CORRECTED.sql` but adapted for this new "Chain-First" logic).

### Phase 3: Orchestrator Integration
*   Wire `CognitiveOrchestrator` to use `StaticPromptService`.
*   Expose `execute_chain` as a new MCP tool.

---

## 5. Verification
*   **Test:** Ask "Show me the strategy to tactics priority flow for 2025".
*   **Success:** Agent calls `execute_chain('strategy_to_tactics_priority', {'year': 2025})`.
*   **Failure:** Agent tries to write a complex `MATCH (o)-[:REALIZED_VIA]->...` Cypher query.
