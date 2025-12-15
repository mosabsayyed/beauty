# Phase 4 — Auth Integration & Policy Enforcement

Objective: Implement per-backend and per-tool authorization header injection, and policy enforcement for tools (e.g., read_only, max_rows). This phase will close the security and governance loops for the router.

Acceptance Criteria:
- Tools mapped to HTTP backends with `auth_header_key` in config will inject the backend authorization header using env var values.
- `ToolRegistry` resolves `auth_header_key` and the server includes any required headers to the forwarder.
- Tool-specific policy enforcement is validated via unit & integration tests (e.g., read-only prevention, max_rows enforced).
- Integration tests validate that unauthorized forwards are rejected and that allowed ones pass.

Tasks (sequential):
1) Add `auth_header_key` parsing in `router_config_loader` and `ToolRegistry`:
   - Parse backend `auth_header_key` and attach to backend entries.
   - Acceptance: `ToolRegistry.get_tool` includes `auth_header_key` for backends when present.

2) Implement Authorization injection:
   - Update `server.py` `tools/call` to attach headers from `ToolRegistry` backend config: if `auth_header_key` set and there's no Authorization header, inject `Authorization: Bearer <env[auth_header_key]>`.
   - Acceptance: Integration test verifies the header is injected when env var is set and Authorization not passed.

3) Policy enforcement capability:
   - Implement policy enforcement checks in `tools/call` based on tool metadata (e.g., `read_only`, `max_rows`). The enforcement should reject or sanitize requests accordingly.
   - Add unit tests for per-tool policies.

4) Integration tests for Auth & Policy enforcement:
   - Add integration tests that start router and stub backends with specific behaviors: require header auth, enforce read-only, etc.
   - Acceptance: Policy violations are rejected with meaningful JSON-RPC errors; valid calls forward and succeed.

5) Document & Hand-off
   - Update `router_config.example.yaml` to show `auth_header_key` usage and provide an example of a tool-level policy (read-only, max_rows).
   - Add acceptance examples and test commands to `mcp-router/README.md`, and add `phase5_todos.md`.

Notes:
- Add unit tests first, then integration tests that exercise a live router and backend, using stubbed endpoints.
- Where CI or per-sandbox environment rules limit capability (e.g., binding to 127.0.0.2), ensure tests skip gracefully with clear messages and instructions to reproduce locally using `run_local.sh`.
