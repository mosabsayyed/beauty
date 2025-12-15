# Maestro Configuration Guide

## Environment Variables

Add these to `backend/.env`:

```bash
# Maestro LLM Model (different from Noor for higher executive reasoning)
MAESTRO_LLM_MODEL=openai/gpt-oss-120b  # Override with executive-tier model

# Maestro MCP Router (dedicated instance)
MAESTRO_MCP_ROUTER_URL=http://localhost:8202/mcp/

# Orchestrator Version (optional - personas override this)
ORCHESTRATOR_VERSION=v2  # v2 (legacy), v3 (single-call), or omit for persona routing
```

## MCP Router Setup

Maestro uses a **dedicated MCP router instance** on port 8202.

### Why Dedicated Router?

1. **Memory Bank Access**: Maestro accesses ALL THREE memory banks (project, workspace, shared)
2. **Tool Isolation**: Separate router prevents tool conflicts between Noor/Maestro
3. **Scalability**: Independent scaling for executive vs operational workloads
4. **Monitoring**: Separate metrics/logs for executive queries

### Starting Maestro MCP Router

```bash
# Option 1: Modify existing mcp-router startup script
cd mcp-router
export MCP_ROUTER_PORT=8202
export MCP_ROUTER_NAME="maestro-router"
./start_mcp_router.sh

# Option 2: Run directly with different port
cd mcp-router
uvicorn mcp_router.main:app --host 0.0.0.0 --port 8202 --reload
```

### MCP Router Configuration Differences

#### Noor Router (port 8201)
- Memory access: project + workspace only
- Focus: operational queries
- Users: staff

#### Maestro Router (port 8202)
- Memory access: project + workspace + shared
- Focus: strategic/executive queries  
- Users: executives

## Memory Bank Access Matrix

| Memory Bank | Noor | Maestro | Purpose |
|-------------|------|---------|---------|
| **Project** | ✅ | ✅ | Project-specific operational data |
| **Workspace** | ✅ | ✅ | Workspace/team shared context |
| **Shared** | ❌ | ✅ | Cross-functional strategic knowledge |
| **Personal** | ❌ | ❌ | Individual user notes (not for agents) |

## Routing Configuration

Role-based routing happens in `chat.py`:

```python
# User role determines persona
if user_role == 'staff':
    request.persona_name = 'noor'  # → NoorAgenticOrchestrator
elif user_role == 'exec':
    request.persona_name = 'maestro'  # → MaestroOrchestrator

# Factory selects orchestrator
orchestrator = get_orchestrator_instance(persona_name=request.persona_name)
```

## Testing Maestro

### 1. Start Backend with Maestro Router
```bash
# Terminal 1: Start Maestro MCP Router
cd mcp-router
export MCP_ROUTER_PORT=8202
./start_mcp_router.sh

# Terminal 2: Start Backend
cd backend
./sb.sh --fg
```

### 2. Register Exec User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "exec@josoor.com",
    "password": "test123",
    "name": "Executive User",
    "role": "exec"
  }'
```

### 3. Login and Get Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "exec@josoor.com",
    "password": "test123"
  }'

# Response includes: {"access_token": "...", "user": {"role": "exec"}}
```

### 4. Test Chat (Auto-routes to Maestro)
```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "What are our top strategic risks?",
    "persona": "maestro"
  }'

# Should use MaestroOrchestrator and access all three memory banks
```

### 5. Verify Logs
```bash
# Check backend logs
tail -f backend/logs/backend_restart.log

# Look for:
# [Maestro][session_id] Calling LLM with X messages
# [Maestro][session_id] Query completed in X.XXs - Mode: A
```

## Production Deployment

### 1. Model Configuration
Update `.env` with executive-tier model:
```bash
MAESTRO_LLM_MODEL=anthropic/claude-3-opus  # or gpt-4, etc.
```

### 2. MCP Router High Availability
- Deploy Maestro router separately (Kubernetes/Docker)
- Use service mesh for routing
- Configure health checks on :8202/health

### 3. Memory Bank Permissions
Configure in MCP router's memory service:
```python
# mcp-router memory service
MEMORY_ACCESS_CONFIG = {
    'noor': ['project', 'workspace'],
    'maestro': ['project', 'workspace', 'shared']  # Expanded access
}
```

### 4. Monitoring
- Executive query latency (should be <2s)
- Memory bank access patterns
- Strategic element usage
- Maestro vs Noor query distribution

## Architecture Diagram

```
User (role=exec)
    ↓
Login → JWT with role
    ↓
Chat Request
    ↓
chat.py: if role=='exec' → persona='maestro'
    ↓
get_orchestrator_instance('maestro')
    ↓
MaestroOrchestrator
    ↓
MCP Router :8202 (dedicated)
    ├─ recall_memory → ALL THREE BANKS
    ├─ retrieve_instructions → strategic elements
    └─ read_neo4j_cypher → institutional memory
    ↓
Executive Response (strategic language)
```

## Troubleshooting

### Maestro Router Not Found
```
Error: Connection refused to localhost:8202
```
**Fix**: Start Maestro MCP router on port 8202

### Memory Bank Access Denied
```
Error: Maestro cannot access shared memory
```
**Fix**: Configure MCP router with expanded permissions

### Wrong Orchestrator Selected
```
Log shows: [Noor][session_id] when should be Maestro
```
**Fix**: Verify user role in JWT token and routing logic in chat.py

## Next Steps

1. **Start Maestro Router**: Deploy dedicated MCP instance
2. **Test Role Routing**: Register exec user, verify Maestro selection
3. **Configure Memory Access**: Enable all three banks in Maestro router
4. **Update Frontend**: Implement role-based auth (see ROLE_BASED_ROUTING_ARCHITECTURE.md)
5. **Production Model**: Configure executive-tier LLM for Maestro
