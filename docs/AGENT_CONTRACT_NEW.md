# Coding Agent Contract

Purpose
- Provide a concise, machine-actionable contract for coding agents working in this repository. Emphasize safety, minimal assumptions, and explicit user approval for high-impact changes.

Scope
- Applies to automated agents and human contributors performing programmatic edits, deployments, or automation that affects prompts, memory, MCP routers, databases, or orchestrator behavior.

1. Agent Obligations (canonical rules)
- Consult memory for user preferences, repo policies, and prior approvals before making decisions that rely on them.
- Do not modify prompts, cognitive bundles, or instruction elements without explicit, recorded user approval.
- Never assume a runtime/service state; verify files, connections, and router/service availability before acting.
- Analyze any script before execution; surface risks and request approval for risky operations.
- Use tabs for indentation by default unless an area of the codebase explicitly uses spaces.
- Do not start/stop/restart servers or routers without the user's explicit approval.

2. User Preferences (short list)
- Indentation: tabs preferred.
- Script safety: analyze and present risks before running scripts.
- Communication: verify claims by checking files and runtime state; consult memory first.
- Terminology: use neutral phrasing; avoid labeling the user's workflow as "MY SYSTEM".

3. Repository Rules (by domain)

3.1 Prompt & Instruction Elements
- Only the user may approve changes to prompt architecture or instruction elements.
- Use a wip->wipe-and-insert approach for prompt edits only with explicit sign-off.
- Database column `element` is the primary key for instruction elements; do not rename schema columns without approval.

3.2 Orchestrator & LLM Flow
- Treat `cognitive_cont` in Tier 1 (orchestrator_noor.py / orchestrator_maestro.py) as system prompt content.
- Keep orchestration responsibilities separate from LLM responsibilities unless a documented design decision is approved.
- Design expects a single Groq API call per query, with LLM-driven MCP tool chaining inside that session.

3.3 MCP Tools & Routers
- Ensure MCP tool definitions include `"require_approval": "never"` when server-side execution is required.
- Verify connectivity and configuration for MCP routers (noor:8201, maestro:8202, embeddings routers) before relying on them.
- Noor is forbidden from secrets-level scopes; Maestro may use exec-level scopes when authorized.

3.4 Memory & Data (clarification)
- NOTE: Memory scope rules (personal, departmental, ministry, exec/secrets) apply to runtime app agents (Noor/Maestro). They are *not* constraints that coding agents must enforce on themselves.
- Coding agents must:
  - Consult memory for preferences, repo rules, and approvals before code changes.
  - Avoid modifying memory contents or scope rules without explicit user approval.
  - When producing code that affects memory behavior, include tests and a clear description of expected runtime enforcement.
- If `recall_memory` returns no hits, implement safe guards (empty-result guards), document the result, and surface it to the user.

3.5 Neo4j Schema & Queries
- Use exact PascalCase schema names (e.g., `EntityProject`) when referencing nodes or properties.
- Enforce schema grounding: either fetch schema definitions or mark assertions as unverified.

3.6 Deployment & Scripts
- Never run start/stop scripts without informing the user and receiving explicit confirmation.
- For production-impacting DB or instruction_table changes, require explicit approval and a rollback plan.

4. Enforcement & Validation Checklist (pre-change)
1. Search memory for relevant rules and prior approvals.
2. Verify files and configuration referenced by the change (Tier bundles, orchestrator files, DB schemas).
3. Run connectivity checks for MCP routers and Neo4j; report results.
4. Produce a concise change summary and risk assessment; require explicit approval for prompt/bundle/memory/DB changes.
5. For prompt/instruction edits: provide a diff and require a one-line confirmation containing: `APPROVE PROMPT ARCHITECTURE CHANGE`.

5. Approval, Audit & Change Record
- High-impact changes must include an audit note with: what changed, why, files/DB rows affected, and rollback instructions.
- Record approvals in the repo (PR description or audit file) and link the approval text to the change.

6. Exceptions & Emergency Protocol
- Emergency fixes to prevent data loss require immediate user notification and a post-hoc audit containing justification and actions taken.

7. Quick Reference (key files & commands)
- Tier 1 bundles: `backend/app/services/orchestrator_noor.py`, `backend/app/services/orchestrator_maestro.py`
- Prompt matrix: `docs/END_STATE_PROMPT_MATRIX_v3.4.md`
- DB tables (Supabase): `instruction_bundles`, `instruction_elements`
- Dev scripts: `sb.sh`, `sf1.sh`

8. Revision Log
- Agents must re-check memory before sequences of changes. Append approvals and change summaries below.
