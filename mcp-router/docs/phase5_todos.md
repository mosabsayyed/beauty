# Phase 5 — Sanitize & Audit + Telemetry

Objective: Finalize data sanitation and audit trails, add telemetry/operational signals, and prepare the router for safe production testing. This includes logging/audit policy, telemetry metrics, request/response redaction rules, and a small operational telemetry dashboard (or suggestions for monitoring) as a follow-on.

Acceptance Criteria:
- Router logs requests and responses (redacted) and generates structured audit events for `tools/call` forwards and script runner invocations.
- Telemetry counters and histograms for forwarded request counts, forward latency, script-run success/fail counts, and authorization failures are added and emit metrics to a pluggable backend (statsd/Prometheus or log lines).
- Auditable events are searchable via simple CLI/grep in logs; the repo includes examples to query recent forward events.
- Integration tests validate that the audit logs contain a record for a forwarded request, and that telemetry counters increment.

Tasks (sequential):

1) Add structured logging and redaction policy
   - Implement a simple logging wrapper that writes structured JSON logs (with base fields: timestamp, request_id, method, tool, status, duration), redacting Authorization-like headers and secrets.
   - Add unit tests to assert logs redact Authorization and other sensitive fields while still including the `mcp-session-id` and tool name.
   - Acceptance: Unit tests that check for sanitized output.

2) Add audit event hooks for forwards and script-run
   - Emit an audit event after each `tools/call` forward or script-run, with a unique request id, source caller id (if available), backend name, result/HTTP status and sanitized arguments.
   - Acceptance: Unit test that parses emitted audit log lines or event objects.

3) Add telemetry counters/histograms
   - Add an in-process Prometheus-compatible metrics registry to collect counters and histograms (forward_count, forward_latency, script_run_count, script_run_latency, auth_failure_count).
   - Add helper to expose a simple `/metrics` endpoint when running as HTTP (FastMCP's HTTP transport) for local testing, or make a per-venv debug output in `run_local.sh` with sample metrics prints.
      - The `/metrics` endpoint will run on `port+1` by default, configurable via `MCP_ROUTER_METRICS_PORT` env var. Example: `MCP_ROUTER_METRICS_PORT=8202`.
   - Acceptance: A small smoke test showing metrics are incremented on a forward and script-run.

4) Integration test for telemetry & audit
   - Add integration tests that start router and a stub backend, perform a forwarded call and verify a) an audit event is recorded and b) counters increment.
   - This test will be marked to skip gracefully if Prometheus or required dependencies are missing but should run in CI where possible.
   - Acceptance: Integration test passes when environment supports it.

5) Operational docs and runbook
   - Add `docs/phase5_metrics_and_audit.md` describing how to set up metrics export, log collection, and redaction rules for production use.
   - Add runbook steps for generating a one-shot request trace for an incident and how to reproduce in the sandbox using the `run_local.sh` and `INTEGRATION=1` flags.

6) Final task: Create `phase6_todos.md` (Harden for production & Docker/CI) describing containerization, system-level safety checks, and performance tuning.

Notes:
- Tests and features should be run/testable in an isolated venv. If standard monitoring dependencies (prometheus_client) are not available, tests should skip and integrate in CI.
- This phase focuses on developer visibility and safety: logs must be redacted, telemetry helps detect regressions, and audit logs must be precise and readable.


*** End of Phase 5 TODOs
