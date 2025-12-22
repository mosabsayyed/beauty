# PROJECT RULES & BEST PRACTICES

## 1. Robust Planning Rule (CRITICAL)
**"The Memory Reset Rule"**
When creating a plan, you MUST write it in a way that if your memory resets or a different model is introduced, the plan is **sufficient and ensures no drift**.
*   **Do not just link** to documents; **embed** critical context (key queries, API contracts, specific constraints) directly into the plan steps.
*   Assume the next agent has **zero** prior conversation history, only the files on disk.

## 2. JOSOOR Specific Sources of Truth
*   **Data & Logic & APIs**: `frontend/public/josoor_legacy/assets/JOSOOR_Dashboards_Functional_Requirements_v1.3.md` is the **Absolute Authority**.
    *   Use its provided Cypher queries, API Contracts, and Formulas.
    *   Do not invent data fields.
*   **Layout & Visuals**: Use the **Screenshots** (`josoor_control_tower_overview_v2.png`, etc.) as the layout guide, unless V1.3 explicitly overrides a specific widget (e.g., W0 Dual-Lens HUD).
*   **Styling**:
    *   **NO TAILWIND CSS**: Strictly forbidden. Use standard CSS or the `SimpleUI` library.
    *   **Theme**: Gold/Dark premium aesthetic.

## 3. Dashboard-First Philosophy
*   The site is Dashboard-First, not Chat-First.
*   Chat is a **context-aware sidecar** triggered by selection (e.g., clicking a node in the dashboard updates the chat context).

---

## 4. Server Management (CRITICAL)

**Rule:** **DO NOT start, stop, or restart any servers without explicit user approval.**

*   The development servers run with **hot-reloading** enabled.
*   Code changes are **automatically applied** without requiring a restart.
*   Any `fuser -k`, `pkill`, `./sf1.sh`, `./sb.sh`, or `npm run dev` commands that affect running servers are **STRICTLY FORBIDDEN** unless the user explicitly requests it.

**Rationale:** The frontend (port 3000) and graph-server (port 3001) use hot-reload. Code edits take effect immediately. Restarting kills the user's session and wastes time.
