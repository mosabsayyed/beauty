"""
MCP Router Server - MCP Standard Compliant

This router exposes tools defined in router_config.example.yaml as proper MCP tools.
Each tool is directly callable via standard MCP protocol:
  {"method": "tools/call", "params": {"name": "tool_name", "arguments": {...}}}

Tool backends:
- script: Executes local Python scripts via tool_runner
- http_mcp: Forwards to upstream MCP servers (e.g., Neo4j MCP)

NOTE: FastMCP requires explicit parameter signatures - no **kwargs allowed.
"""
import os
import json
from typing import Optional, Dict, Any, List
from fastmcp.server import FastMCP
from fastmcp.tools.tool import ToolResult
from .tool_registry import ToolRegistry
from .tool_runner import run_script
from .tool_forwarder import forward_http_mcp
from .policy import build_forward_headers
import aiohttp.web as web
from mcp_router.telemetry import get_metrics_text

DEFAULT_CONFIG = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'router_config.example.yaml'))

# Global registry - populated during server creation
_registry: ToolRegistry = None


def _get_backend(tool_name: str) -> dict:
    """Get the backend configuration for a tool."""
    tool = _registry.get_tool(tool_name)
    if not tool:
        return {}
    backend = tool.get('backend')
    if isinstance(backend, str):
        backend = _registry.get_backend(backend)
    return backend or {}


def _execute_script_tool(tool_name: str, tool_args: dict) -> ToolResult:
    """Execute a script-based tool."""
    backend = _get_backend(tool_name)
    input_json = {
        'tool_meta': {'name': tool_name},
        'args': tool_args
    }
    cmd = backend.get('command')
    backend_args = backend.get('args', [])
    if backend_args:
        cmd = [cmd] + backend_args if isinstance(cmd, str) else list(cmd) + backend_args
    try:
        resp = run_script(cmd, input_json, timeout=30)
        return ToolResult(content=[{"type": "text", "text": json.dumps(resp)}])
    except Exception as e:
        return ToolResult(content=[{"type": "text", "text": f"Error: {e}"}], is_error=True)


async def _execute_http_mcp_tool(tool_name: str, tool_args: dict) -> ToolResult:
    """Forward to an HTTP MCP backend (e.g., Neo4j MCP server)."""
    backend = _get_backend(tool_name)
    try:
        jsonrpc_payload = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {'name': tool_name, 'arguments': tool_args},
        }
        forward_headers = build_forward_headers({}, backend)
        service_token = os.environ.get('MCP_ROUTER_SERVICE_TOKEN')
        if service_token and 'Authorization' not in forward_headers:
            forward_headers['Authorization'] = f"Bearer {service_token}"
        
        resp = await forward_http_mcp(backend.get('url'), jsonrpc_payload, headers=forward_headers)
        return ToolResult(content=[{"type": "text", "text": json.dumps(resp)}])
    except Exception as e:
        return ToolResult(content=[{"type": "text", "text": f"Error: {e}"}], is_error=True)


def create_mcp_server(config_path: str = DEFAULT_CONFIG) -> FastMCP:
    """
    Create an MCP server with tools from router_config.
    
    Tools are registered with explicit signatures for FastMCP compatibility.
    """
    global _registry
    
    mcp = FastMCP('mcp-router', stateless_http=True)
    _registry = ToolRegistry(config_path)
    
    tools = _registry.get_tools()
    print(f"Loading {len(tools)} tools from config: {[t['name'] for t in tools]}")
    
    # ==================== SCRIPT TOOLS ====================
    
    @mcp.tool(description="Search personal or project memory using semantic vector search.")
    def recall_memory(
        scope: str,
        query_summary: str,
        limit: int = 5,
        user_id: Optional[str] = None,
    ) -> ToolResult:
        """Search memory with semantic vector search.

        Args:
            scope: Memory scope - one of 'personal', 'departmental', 'ministry'
            query_summary: Natural language description of what to search for
            limit: Maximum number of results to return (default 5)
            user_id: Optional user ID for per-user filtering
        """
        return _execute_script_tool("recall_memory", {
            "scope": scope,
            "query_summary": query_summary,
            "limit": limit,
            "user_id": user_id
        })
    
    @mcp.tool(description="Load instruction bundles based on interaction mode. Supports v3.3 three-tier architecture.")
    def retrieve_instructions(
        mode: str,
        tier: Optional[str] = None,
        elements: Optional[List[str]] = None
    ) -> ToolResult:
        """Retrieve instruction bundles for the given mode.
        
        v3.3 Three-Tier Architecture:
        - Tier 1: Core bootstrap (~600 tokens, hardcoded)
        - Tier 2: Mode definitions (~2700 tokens) - use tier="data_mode_definitions"
        - Tier 3: Atomic elements - use tier="elements" with elements=["name1", "name2"]
        
        Args:
            mode: Interaction mode - one of 'A', 'B', 'C', 'D'
            tier: Optional tier to retrieve: "data_mode_definitions" or "elements"
            elements: Optional list of element names for Tier 3 retrieval
        """
        tool_args = {"mode": mode}
        if tier:
            tool_args["tier"] = tier
        if elements:
            tool_args["elements"] = elements
        return _execute_script_tool("retrieve_instructions", tool_args)
    
    # ==================== NEO4J MCP TOOLS (http_mcp) ====================
    
    @mcp.tool(description="Execute a read-only Cypher query against Neo4j knowledge graph via Neo4j MCP server.")
    async def read_neo4j_cypher(
        query: str,
        params: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        """Execute a read-only Cypher query on the Neo4j knowledge graph.
        
        Args:
            query: The Cypher query to execute
            params: Optional parameters for parameterized queries
        """
        tool_args = {"query": query}
        if params:
            tool_args["params"] = params
        return await _execute_http_mcp_tool("read_neo4j_cypher", tool_args)
    
    @mcp.tool(description="Get the Neo4j database schema including nodes, properties, and relationships.")
    async def get_neo4j_schema(
        sample_size: int = 1000
    ) -> ToolResult:
        """Get the Neo4j database schema.
        
        Args:
            sample_size: Sample size for schema inference (default 1000, use -1 for entire graph)
        """
        return await _execute_http_mcp_tool("get_neo4j_schema", {"sample_size": sample_size})
    
    @mcp.tool(description="Execute a write Cypher query against Neo4j knowledge graph (creates/updates/deletes data).")
    async def write_neo4j_cypher(
        query: str,
        params: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        """Execute a write Cypher query on the Neo4j knowledge graph.
        
        Args:
            query: The Cypher query to execute
            params: Optional parameters for parameterized queries
        """
        tool_args = {"query": query}
        if params:
            tool_args["params"] = params
        return await _execute_http_mcp_tool("write_neo4j_cypher", tool_args)
    
    for tool_def in tools:
        print(f"  Registered tool: {tool_def['name']} -> backend: {tool_def.get('backend')}")
    
    return mcp


def run_http(host: str = None, port: int = None, config_path: str = DEFAULT_CONFIG):
    """Start the MCP router as an HTTP server."""
    host = host or os.environ.get('MCP_ROUTER_HOST', '127.0.0.1')
    port = int(port or os.environ.get('MCP_ROUTER_PORT', '8201'))
    
    print(f"Starting MCP Router on {host}:{port} with config {config_path}")
    mcp = create_mcp_server(config_path)
    
    # Start HTTP server
    import asyncio
    loop = asyncio.get_event_loop()
    loop.create_task(mcp.run_http_async(host=host, port=port, path='/mcp/', middleware=[]))
    
    # Optional metrics endpoint
    metrics_port = int(os.environ.get('MCP_ROUTER_METRICS_PORT', str(port + 1)))
    async def metrics_handler(request):
        body, content_type = get_metrics_text()
        return web.Response(body=body, content_type=content_type)
    metrics_app = web.Application()
    metrics_app.router.add_get('/metrics', metrics_handler)
    
    async def start_metrics():
        runner = web.AppRunner(metrics_app)
        await runner.setup()
        site = web.TCPSite(runner, host, metrics_port)
        await site.start()
    
    loop.create_task(start_metrics())
    loop.run_forever()


if __name__ == '__main__':
    run_http()
