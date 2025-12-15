🚫 WARNING: SANDBOXED MCP ROUTER - DO NOT MODIFY UNLESS WORKING ON MCP ROUTER

This sandbox has been moved to `mcp-router/` (root) to avoid interfering with other backend servers that live under `backend/mcp-server`. Please DO NOT change or reference files in this directory unless you are actively working on the MCP Router project. Any modifications made here should be intentional and limited to tasks related to the MCP Router.

Objective
---------
This folder contains the design, documentation, and early-stage implementation artifacts for the Universal MCP Router — a service that aggregates, forwards, and executes MCP tools (script-based or existing MCP backends) using JSON-RPC.

Why sandboxed
-------------
- Avoid accidental port conflicts with other MCP servers (default router port: 8201)
- Keep development isolated from the product codebase until the router is stable and reviewed
- All changes must be deliberate and approved; accidental merges could disrupt other developers

How to use
----------
1. If you are working on the MCP Router, move into the folder and follow the README within the docs directory for the design and implementation plan.
2. Developer commands (run from repository root):
```bash
# Run router in stdio mode (development):
cd mcp-router/src/mcp_router && python3 -m server

# Run router in HTTP dev mode (port 8201):
cd mcp-router/src/mcp_router && python3 -m server
```
If you are not working on the MCP Router, avoid editing anything here; it is intentionally separated from the backend folder.

- This folder is intended to be a more visible top-level sandbox for the router to avoid accidental collisions or integration mistakes.

Notes
-----
- The development server uses default port 8201 for HTTP; change via env var `MCP_ROUTER_PORT`.
- Use `MCP_ROUTER_HOST` to change the host binding; default is `127.0.0.2`.

Developer dependencies
----------------------
Install in a dedicated venv so other MCP servers are not impacted:
```bash
python3 -m venv .venv-mcp-router && source .venv-mcp-router/bin/activate
pip install -r mcp-router/requirements.txt
```

Run unit tests under the sandbox (from repository root):
```bash
PYTHONPATH=mcp-router/src pytest mcp-router/tests/unit -q
```

To run with these defaults from the repo root:
```bash
# from `mcp-router` folder
cd mcp-router/src/mcp_router && python3 -m server
# or with environment override
MCP_ROUTER_HOST=127.0.0.2 MCP_ROUTER_PORT=8201 python3 -m server
```

Installing the router's venv and dependencies (recommended):
```bash
python3 -m venv .venv-mcp-router && source .venv-mcp-router/bin/activate
pip install -r mcp-router/requirements.txt
```

Run local helper script to create a venv and run tests:
```bash
cd mcp-router && ./run_local.sh
```

Phase 3 — Note on relocation validation
-------------------------------------
Per the Phase Continuity Protocol, Phase 3 must start from the exact end-state of Phase 2. Before running Phase 3 unit and integration tests, run the relocation validation step to ensure all tests from previous phases were copied, adapted, and run successfully from `mcp-router/tests`. Use `./run_local.sh` to validate the relocated tests before continuing to Phase 3 implementation tasks.

Phase Continuity Protocol Reference
----------------------------------
Follow `docs/implementation_plan.md` and `docs/phase2_todos.md` for the Phase Continuity Protocol. This top-level sandbox follows the same rules as the backend ones; see the docs for the full protocol and the `Phase Execution Protocol` rules.
