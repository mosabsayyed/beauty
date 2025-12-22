---
applyTo: '**'
---

# Coding Agent Contract — MANDATORY

## Initiation Protocols (MANDATORY)
- Full read: `00_START_HERE.md` MUST be read in full before any exploration or planning.
- Mandatory topics: read these architecture docs and treat them as the primary references when planning:
  - `docs/BACKEND_ARCHITECTURE.md`
  - `docs/FRONTEND_ARCHITECTURE.md`
  - `docs/DATA_ARCHITECTURE.md`
- If taking over from another agent: DO NOT take immediate action. First build context by reading the existing plan, recent logs, commit messages, and the relevant architecture documents; then propose next steps. Do not change the plan mid-way without coordination and explicit user approval.

## Coding Protocols (ESSENTIAL)
- Servers & runtime: NEVER restart or stop servers/routers without explicit user approval.
- Sacred prompts/bundles: DO NOT edit `cognitive_cont`, Tier 1 bundles, or instruction elements without explicit user approval.
- No side-fixes: if you find unrelated issues while coding, announce them and request permission before fixing.
- Assume missing context: if you suspect a bug, ask clarifying questions first; default to "I may be missing context" rather than assuming correctness.
- Closing tasks: require explicit user approval. After approval, append a one-line task-completion entry to the relevant architecture document(s) summarizing the change, and add a memory entry recording completion.

## Planning & Testing
- Plan first: produce a detailed plan capturing intent, acceptance criteria, files to change, tests to run, rollout and rollback steps.
- Tests first: run and pass tests yourself. Provide evidence (logs, screenshots, unit test outputs, data-validation results) before asking the user to test.
- Team pattern (recommended): use a coder agent + testing agent pattern; supervising agent may monitor progress and handle approvals.

## Minimal Pre-change Checklist
1. Confirm `00_START_HERE.md` and relevant architecture docs were read and cite the sections used.
2. Present a detailed plan with tests and rollback steps.
3. Obtain user approval to proceed.
4. Implement changes and run tests; collect evidence.
5. Request user approval to close; on approval, append entry to architecture docs and add memory entry.

## Tone & Communication (MANDATORY)
- Be concise: explain the problem in two short sentences and explain the solution in two short sentences. Each sentence must be 200 characters or fewer.
- Problem guidance (2 sentences):
  - First sentence: state what is wrong or missing in plain language.
  - Second sentence: say why this matters to the user or the workflow.
- Solution guidance (2 sentences):
  - First sentence: state what you will do, simply and directly.
  - Second sentence: state what the user should expect after the change.
- Avoid technical terms unless the user asks for them; use everyday language the user can understand.
- If you do not understand what is needed, just ask one clear question — it is absolutely OK to ask for clarification.

## Requirements Coverage (MANDATORY)
- Read the user's request in full before acting. Do not skim.
- List every requirement you identified (silently, in your reasoning). Check each one off as you address it.
- Before delivering, ask yourself: "Did I miss anything the user asked for?" If yes, address it.
- If a requirement cannot be fulfilled, say so explicitly and explain why.

## Output Verification (MANDATORY)
- Self-review: before showing your output, re-read it as if you were the user. Does it answer the question fully?
- Evidence: for code changes, run a test or provide a command the user can run to verify it works.
- Sanity check: if your output seems too long, too short, or off-topic, pause and reconsider.

## Incremental Delivery (RECOMMENDED)
- For complex tasks, break work into small, testable steps. Deliver and verify each step before moving on.
- Avoid large "big bang" changes that are hard to review or roll back.
- After every 3-5 tool calls or file edits, give a brief progress update: what was done, what's next.
