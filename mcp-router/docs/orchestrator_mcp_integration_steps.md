Orchestrator MCP Integration - Edit Steps (Do NOT apply changes; instructions only)

Objective
---------
Describe what to change in `backend/app/services/orchestrator_zero_shot.py` to add explicit LLM tools that call the MCP server and where to insert them.

High-level idea
----------------
- The orchestrator currently injects a minimal `tools` definition into the request payload (type=mcp, server_url, server_label).
- To make the orchestrator use a richer set of tools (schema query, read/write DB, memory tools), we will add explicit `tools` definitions in the `request_payload` and (optionally) provide tool descriptions and input/output schemas that the LLM can use for safe calls.

Files to change
---------------
- `backend/app/services/orchestrator_zero_shot.py`

Specific locations and edits
---------------------------
1) Where to inject tools (currently implemented):
   - Function: `OrchestratorZeroShot.stream_query`
   - Location: around the `# 3. Inject Tools (if enabled)` comment block. Example snippet shows:

```py
# 3. Inject Tools (if enabled)
if use_mcp:
    request_payload["tools"] = [
        {
            "type": "mcp",
            "server_label": "neo4j_database",
            "server_url": self.mcp_server_url,
        },
    ]
```

2) Edits to add: replace the simple list with detailed tool descriptions. Add a small helper near `__init__` or top-of-file to build tools metadata:

```py
# Add a helper in __init__ or as a method:
self.mcp_tools = [
    {
        "name": "schema_query",
        "type": "mcp",  # mcp type used by Groq "tools"
        "server_label": "neo4j_database",
        "server_url": self.mcp_server_url,
        "description": "Retrieve a schema structure for the specified label and year.",
        "input_schema": { "type": "object", "properties": { "label": {"type": "string"}, "year": {"type": "integer"}, "limit": {"type": "integer"} }, "required": ["label", "year"] },
        "output_schema": { "type": "object", "properties": { "columns": {"type": "array", "items": {"type": "string"}} } }
    },
    {
        "name": "neo4j_read",
        "type": "mcp",
        "server_label": "neo4j_database",
        "server_url": self.mcp_server_url,
        "description": "Read nodes or relationships for a label and filters.",
        "input_schema": { "type": "object", "required": ["label","year"],"properties": {"label": {"type":"string"},"year":{"type":"integer"},"filters":{"type":"object"}} },
        "output_schema": {"type":"object"}
    },
    {
        "name": "supabase_read",
        "type": "mcp",
        "server_label": "supabase_db",
        "server_url": self.mcp_server_url,
        "description": "Read from Supabase external table via MCP wrapper.",
        "input_schema": {"type":"object"},
        "output_schema": {"type":"object"}
    },
    {
        "name": "supabase_write",
        "type": "mcp",
        "server_label": "supabase_db",
        "server_url": self.mcp_server_url,
        "description": "Write to a Supabase table (restricted)." ,
        "input_schema": {"type":"object"},
        "output_schema": {"type":"object"}
    },
    {
        "name": "memory_append",
        "type": "mcp",
        "server_label": "memory_db",
        "server_url": self.mcp_server_url,
        "description": "Append a user memory snippet to the LLM memory store (safe, sanitized)." ,
        "input_schema": {"type":"object"},
        "output_schema": {"type":"object"}
    },
]
```

3) Update injection in `stream_query` to include the richer set:
```py
if use_mcp:
    request_payload["tools"] = self.mcp_tools
```

4) Security & policy notes (where to add checks):
   - Before adding `supabase_write` or `memory_append` tools, add policy enforcement or a whitelist to prevent open writes; instrument `tool_choice` or any additional field (e.g., `allowed_tool_roles`) to make the model aware of restrictions.
   - The LLM can be given a `tool_policy` block in `tools` metadata with requirements (e.g., admin token) or a server-side policy that rejects write calls without admin-level headers.

5) Additional integrational tasks (not code changes here):
   - Add JSON Schema to each tool's `input_schema` to help the LLM format requests correctly and safely.
   - Add tests verifying `tools/list` or `tools/describe` from the mcp server; update `ToolRegistry` if needed to include new tools.

Files to verify after edits
--------------------------
- `backend/app/services/orchestrator_zero_shot.py` (you will edit `stream_query` and `__init__` section).
- `backend/mcp-server/servers/mcp-router/router_config.example.yaml`: you may need to add registry entries for `supabase_db`, `memory_db`, and the new tools if they are to be routed through mcp-router.

Notes
-----
- The recommended approach is to add tools gradually (first `schema_query`, `neo4j_read`, then `supabase_read`, `memory_append`) and verify each step with unit and integration tests.

End of orchestrator integration plan
