# Track Spec: v3.4 Prompt Consolidation

## Goal
Unify the v3.4 Cognitive Architecture prompts and hard-code them into the FastAPI backend service layer to ensure deterministic behavior, reduce DB latency, and simplify persona-based orchestration.

## Background
Currently, the "source of truth" for prompts is scattered across multiple Markdown files (`COGNITIVE_ARCHITECTURE_SPECIFICATION.md`, `new.prompt.prompt.md`) and partially loaded dynamically from Supabase via `tier1_assembler.py`. To achieve the "agentic AI recruit" impact, the backend needs a rock-solid, static baseline for its cognitive control loop.

## Requirements
1. **Unification:** Extract the definitive v3.4 prompts (Tier 1, 2, and 3) from `COGNITIVE_ARCHITECTURE_SPECIFICATION.md`.
2. **Hard-coding:** Create a `PromptService` in the backend that stores these prompts as Python-accessible static strings or local resources.
3. **Persona Logic:** The service must handle placeholders for "Noor" vs. "Maestro" (e.g., memory scope restrictions).
4. **Integration:** Refactor `orchestrator_universal.py` to retrieve prompts from the new `PromptService` instead of the database.
5. **Validation:** Ensure the 5-Step Cognitive Control Loop receives the correct unified prompt.

## Out of Scope
- Modifying the actual content of the prompts (unless required for formatting).
- Changing the Neo4j or Supabase data schemas.
