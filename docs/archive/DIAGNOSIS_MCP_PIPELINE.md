# MCP Pipeline Diagnosis

## Problem Statement
- Frontend sends message → Backend LLM call returns successfully
- BUT: LM Studio getting GET requests to `/mcp/` returning `406 Not Acceptable`
- ERROR: `anyio.ClosedResourceError` in MCP stream handling

## MCP Call Flow

### 1. ORCHESTRATOR Constructs MCP Request
**File:** `backend/app/services/orchestrator_universal.py:629-705`

```python
def _call_local_llm(self, messages, model_name):
    # Build MCP tools payload
    tools = [{
        "type": "mcp",
        "server_label": binding_label,
        "server_url": "http://127.0.0.1:8201",  # ← MCP Router
        "allowed_tools": ["recall_memory", "retrieve_instructions", "read_neo4j_cypher"]
    }]
    
    # Send to LM Studio on port 8000
    payload = {
        "model": "model",
        "input": messages,
        "instructions": "...",
        "tools": tools,  # ← MCP tool definition
        "tool_choice": "auto",
        "max_output_tokens": 8000
    }
    
    resp = requests.post(
        "http://localhost:8000/v1/responses",  # ← LM Studio endpoint
        json=payload,
        timeout=120
    )
```

### 2. LM STUDIO Receives Request
- Gets the MCP tool definition with `server_url: http://127.0.0.1:8201`
- Should internally call MCP router when model needs to use tools

### 3. MCP ROUTER Receives Call
**File:** `/mcp-router/src/mcp_router/server.py`

```python
mcp = FastMCP('mcp-router', stateless_http=True)
loop.create_task(mcp.run_http_async(host='127.0.0.1', port=8201, path='/mcp/'))
```

- Expects POST to `/mcp/` with MCP JSON-RPC protocol
- NOT GET requests

## ROOT CAUSE HYPOTHESIS

### Issue 1: GET /mcp/ errors
Something is making a GET request to the MCP server's `/mcp/` endpoint instead of POST.

Possible causes:
1. **Health check** - Some service checking if MCP is alive with GET request
2. **Wrong endpoint** - Client connecting to wrong URL
3. **Proxy/Gateway issue** - Reverse proxy forwarding GET as-is

### Issue 2: ClosedResourceError
```
anyio.ClosedResourceError in anyio/streams/memory.py:93
```
This happens when:
- Connection is closed unexpectedly
- Stream reader tries to receive from closed channel
- Could be caused by GET requests killing the connection before proper handshake

## Questions to Answer

1. What is sending GET requests to `/mcp/`?
   - Check if LM Studio is doing a health check
   - Check if there's a probe/checker service

2. Is LM Studio properly configured with MCP endpoint?
   - What version of LM Studio is running?
   - Does it support MCP tools properly?
   - Is the endpoint configuration correct?

3. Is the MCP request payload correct?
   - Is the `tools` field being sent correctly?
   - Does LM Studio understand the MCP tool format?

4. What happens after LM Studio calls MCP?
   - Does MCP router receive the tool call?
   - Does it execute the tool properly?
   - What response is returned?

## Next Steps

### Step 1: Enable verbose logging in MCP router
Check if it logs incoming tool calls or rejects them.

### Step 2: Analyze what LM Studio version is running
Check if it supports MCP tool calling via HTTP.

### Step 3: Add request/response logging
Log what the LLM is actually sending and receiving.

### Step 4: Test MCP endpoint directly
```bash
# Test direct MCP call
curl -X POST http://127.0.0.1:8201/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {"name": "recall_memory", "arguments": {"scope": "personal", "query_summary": "test"}}
  }'
```

## Related Code Sections

### API Call Construction
- `orchestrator_universal.py` line 672: `endpoint_url = self.local_llm_base_url.rstrip("/") + "/v1/responses"`
- Sends MCP tools in payload under `tools` key

### LM Studio Response Parsing
- `orchestrator_universal.py` line 690-718: Response extraction from `/v1/responses`
- Looks for text content in nested `output` structures

### MCP Server Startup
- `mcp-router/src/mcp_router/server.py` line 168-170: HTTP server setup
- Uses FastMCP with `stateless_http=True`

## Performance Impact
- 406 errors might not block response (if LLM handles gracefully)
- But repeated connection errors slow down tool execution
- ClosedResourceError suggests stream is being terminated prematurely
