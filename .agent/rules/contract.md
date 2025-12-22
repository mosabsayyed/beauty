---
trigger: always_on
---

# Coding Agent Contract

## Purpose
- Provide a compact, machine-actionable contract that coding agents must follow when working in this repository and with this user. Prioritize safety, reproducibility, and explicit user approval for high-impact changes.

## Scope
- Applies to any automated agent (LLM-based or scripted) interacting with the codebase, MCP routers, memory system, or deployment scripts in this repository.

## Agent Obligations (hard requirements)
- ALWAYS consult memory before taking actions that depend on preferences, prompt architecture, or repo policies.
- NEVER modify prompts, cognitive bundles, instruction elements, or the prompt architecture without explicit, recorded user approval.
- NEVER assume environment state — verify files, connections, and router/service availability before acting.
- For DB or router operations, connect directly and verify results (do not rely on directory presence or config-only checks).
- Before executing any script: analyze it step-by-step and surface potential risks to the user.
- Use tabs for indentation by default (user preference) unless a specific file/area uses spaces explicitly.

## User Preferences (enforced)
- Indentation: prefer tabs over spaces.
- Operational safety: analyze scripts BEFORE running; present the analysis and ask for confirmation when risks exist.
- Communication: always verify claims by checking actual files and run-time state; consult memory first.
- Tone/terminology: avoid labeling the user's workflow as "MY SYSTEM"; use neutral phrasing.

## Repository Rules & Constraints (enforced)

### Prompt architecture and instruction elements
- ONLY the user may approve changes to prompt architecture and instruction elements.
- When updating prompt content, follow the "wipe-and-insert" approach only with explicit user sign-off.
- Instruction elements use an `element` column (not `tag`); do not rename columns without approval.
- Do NOT change markdown formatting in elements unless approved (user may require removal of all markdown to save tokens).

### Orchestrator & cognitive bundles
- `cognitive_cont` is hardcoded into orchestrator Tier 1 (orchestrator_noor.py / orchestrator_maestro.py) and MUST be treated as system prompt content.
- Orchestrator responsibilities and LLM responsibilities are separated; do not shift responsibilities without design approval.
- Single Groq call per user query is the intended flow; LLM may chain MCP tool calls within that session.

### MCP tools and routers
- All MCP tool definitions MUST include `"require_approval": "never"` where the architecture expects server-side execution—validate before deploying.
- Confirm MCP routers (noor:8201, maestro:8202, embeddings:8203/8204) are reachable and correctly configured before relying on them.
- Noor agent must not be given secrets scope; Maestro may use exec-level scopes when authorized.

### Memory & data
- Memory scopes: personal, departmental, ministry. Respect scope limits; do not access exec-only scopes via Noor.
- Always perform a memory-read step before analyses that depend on prior preferences or architectural constraints.
- If recall_memory returns no hits, handle gracefully (do not crash); propose safe fallbacks and ask the user.

### Neo4j + schema rules
- Node/label naming uses PascalCase (e.g., `EntityProject`). Use exact schema names from the verified database.
- Enforce schema grounding when referencing node types or properties; either fetch schema or prefix claims as unverified.

### Deployment & scripts
- Do not run start/stop scripts without telling the user what will change and receiving explicit confirmation.
- For operations that may affect production data (DB ETL, instruction table changes), require explicit user approval and a rollback plan.

## Enforcement & Validation Checklist (what an agent must do before changing anything)
1. Read memory for relevant rules and preferences.
2. Check the specific files/configs mentioned in memory (e.g., Tier bundles, orchestration files) exist and match expected values.
3. Run lightweight connectivity checks for MCP routers and Neo4j; report status.
4. Present a short list of proposed changes and risks; require explicit approval for any change to prompts, bundles, memory, or DB schema.
5. If modifying prompt/instruction content, produce a diff and require a single-line user confirmation that includes the phrase: `APPROVE PROMPT ARCHITECTURE CHANGE`.

## Quick Reference — Key files & locations
- Tier 1 cognitive bundle: backend/app/services/orchestrator_noor.py and backend/app/services/orchestrator_maestro.py
- Prompt matrix and END_STATE docs: [docs/END_STATE_PROMPT_MATRIX_v3.4.md](docs/END_STATE_PROMPT_MATRIX_v3.4.md)
- Instruction bundles / elements in DB: `instruction_bundles` and `instruction_elements` (Supabase)
- Scripts to start dev stack: `sb.sh`, `sf1.sh` (repo root)
- Orchestrator implementation and specs: backend/app/services/

## Approval & Audit
- Any change flagged as high-impact (prompt architecture, instruction_elements, DB schema changes, memory wipe) must be recorded in a short audit note in a PR or a message to the user containing: what changed, why, exact files/DB rows affected, and how to roll back.

## Exceptions
- If an emergency fix is required to prevent data loss or system-wide failure, notify the user immediately and document the emergency approval afterward.

## Owner & Contacts
- Owner: repository user (explicit user). Agents must route approvals and clarifying questions to the user.

## Revision
- Agents should re-check memory for updated rules before performing any sequence of changes; memory is the single source of the user's active preferences and repo rules.
