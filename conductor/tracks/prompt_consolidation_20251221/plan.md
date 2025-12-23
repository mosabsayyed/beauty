# Track Plan: v3.4 Prompt Consolidation

## Phase 1: Core Prompt Service Implementation
Goal: Create a reliable, hard-coded source for all cognitive prompts.

- [x] Task: Write Failing Tests for `StaticPromptService` (TDD) [4aae67f]
- [x] Task: Implement `StaticPromptService` with unified v3.4 bundles (extracted from Spec) [8091528]
- [ ] Task: Conductor - User Manual Verification 'Core Prompt Service Implementation' (Protocol in workflow.md)

## Phase 2: Orchestrator Integration
Goal: Switch the universal orchestrator to use the new static prompt source.

- [ ] Task: Write Failing Tests for Orchestrator static prompt integration (TDD)
- [ ] Task: Refactor `orchestrator_universal.py` to use `StaticPromptService`
- [ ] Task: Conductor - User Manual Verification 'Orchestrator Integration' (Protocol in workflow.md)

## Phase 3: Cleanup & Final Validation
Goal: Remove legacy loading logic and verify end-to-end performance.

- [ ] Task: Write Failing Tests for full cognitive loop consistency (TDD)
- [ ] Task: Deprecate `tier1_assembler.py` and remove DB-loading dependencies
- [ ] Task: Conductor - User Manual Verification 'Cleanup & Final Validation' (Protocol in workflow.md)
