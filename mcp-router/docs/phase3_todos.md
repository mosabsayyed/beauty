# Phase 3 — HTTP Forwarder & Session Propagation

Objective: Implement an HTTP forwarder for `http_mcp` backends and ensure `mcp-session-id` and `Authorization` headers are propagated to backend MCP servers. This phase will solidify end-to-end behavior by connecting the router to existing HTTP MCP backends.

Acceptance Criteria:
- `tools/call` with a tool mapped to an `http_mcp` backend forwards JSON-RPC requests to the backend URL, including `mcp-session-id` and `Authorization` headers.
- The router returns the backend response intact to the client (preserving success/error semantics).
- Unit tests exercise forwarder behavior for correct header propagation, JSON-RPC payload forwarding, and error handling.
- Integration test runs the router in an isolated venv and a stub HTTP backend verifying received headers and payload.

Phase 3 Test Phase — START WITH RELOCATION VALIDATION (MANDATORY)
---------------------------------------------------------------
Per the Phase Continuity Protocol, before running Phase 3 unit or integration tests, validate that all tests from the prior phases were successfully relocated to the sandbox and that the relocated test suite runs under `mcp-router/`.

Relocation and Validation Tasks (first in the test phase):
1) Relocate Tests
   - Copy unit & integration tests from `backend/mcp-server/servers/mcp-router/tests/*` into `mcp-router/tests/` preserving directory structure (`unit/`, `integration/`).
   - Update any path-based imports and relative paths so tests import from `mcp_router` package in the new sandbox.
   - Ensure `mcp-router/tests/conftest.py` provides compatibility fixtures (e.g., `aiohttp_unused_port`) and any required test helpers.
   - Acceptance: All test files exist under `mcp-router/tests` and import successfully.

2) Local test smoke-run
   - Add a smoke test or script step that runs the relocated test suite with `PYTHONPATH=mcp-router/src` and the per-sandbox venv. This script should return a clear status (pass/fail) with a log artifact for debugging.
   - Acceptance: The smoke-run passes for basic tests such as `test_forwarder.py`.

3) CI Integration
   - Update CI or add a `mcp-router/run_local.sh` venv-based integration script and optionally a GitHub Actions workflow to run relocated tests from `mcp-router/tests` using the sandbox `requirements.txt`. This should be run early in CI to detect regression/relocation failures.
   - Acceptance: CI job runs relocated tests and reports status under `mcp-router` context.

4) Re-check Phase 2 End-State
   - Validate that the functional contract required at the end of Phase 2 (script-runner, registry, config loader) is intact in the sandbox and that all relocated tests that asserted Phase 2 behavior still pass.
   - Acceptance: Phase 2 tests succeed in the sandbox (`vector_search` and script runner tests pass).

Core Phase 3 Tasks (after relocation validation):

1) Forwarder Implementation
   - Create or refine `tool_forwarder.py` to forward JSON-RPC to HTTP MCP backends safely.
   - Ensure headers (mcp-session-id, Authorization) are forwarded and that defaults (e.g., `MCP_ROUTER_SERVICE_TOKEN`) can be injected if required.
   - Acceptance: Unit tests verifying header propagation will pass.

2) Integrate forwarder into `tools/call`
   - Update `mcp_router.server` `tools/call` to call forwarder when tool backend type is `http_mcp`.
   - Acceptance: `tools/call` forwards requests and returns backend response as tool result.

3) Add Unit Tests
   - Add `tests/unit/test_forwarder.py` and other forwarder specific unit tests that validate header propagation, JSON-RPC payload, and error return semantics.
   - Add tests to validate token injection semantics when `MCP_ROUTER_SERVICE_TOKEN` is configured.

4) Add Integration Tests
   - Add `tests/integration/test_http_forwarder.py` verifying the router forwards to stub HTTP backend (assert headers and payload).
   - Add `tests/integration/test_http_rpc_transport.py` that verifies the router binds to the default host and port and responds to `tools/list` calls.

5) Policy enforcement & config
   - Add `auth_header_key` support to backends in `router_config.example.yaml` and propagate to `ToolRegistry`.
   - Acceptance: Tests validating authorization header mapping pass.

6) Documentation & Handover
   - Update `README.md` with Phase 3 run instructions and test run examples. Update `docs/implementation_plan.md` and `mcp-router/README.md` references to reflect sandboxed test paths.
   - Final task: Create `docs/phase4_todos.md` with detailed tasks for `Auth Integration & Policy Enforcement` as the Phase Continuity Protocol mandates.

Notes & Developer Tips
- Always start the phase from the precise last-phase end-state — confirm script-runner and config loader tests pass before continuing.
- If the relocated test suite has incompatible dependencies (e.g., fastmcp or aiohttp), isolate via a per-sandbox venv and update `mcp-router/run_local.sh` to install `mcp-router/requirements.txt`.
- If tests are skipped due to missing deps, update the test skip rules to give clear error messages and add a reproducible fix path in Phase 3 tasks.

---

This `phase3_todos.md` file follows the Phase Continuity Protocol and includes relocation validation at the START of the Phase 3 test schedule per the `mcp-router/README.md` and `docs/implementation_plan.md` guidance.
