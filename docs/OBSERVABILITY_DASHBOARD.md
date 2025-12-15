# Observability Dashboard - Technical Documentation

## Overview

The Observability Dashboard is an admin-only diagnostic tool that provides deep visibility into the LLM cognitive pipeline. It enables developers to:

- **Trace conversation flows** through the entire cognitive architecture
- **Monitor tool calls** made via MCP (Model Context Protocol) servers
- **Inspect reasoning steps** from the LLM's thinking process
- **Debug errors** with full context and stack traces
- **View raw JSON** for complete transparency

**Access URL:** `http://localhost:3000/admin/observability`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OBSERVABILITY SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐   │
│  │   Frontend UI   │────▶│   Debug API      │────▶│   Log Files        │   │
│  │ ObservabilityPage│    │  /api/v1/debug/* │     │ logs/chat_debug_*  │   │
│  └─────────────────┘     └──────────────────┘     └────────────────────┘   │
│         ▲                        ▲                         ▲                │
│         │                        │                         │                │
│         │                        │                         │                │
│  ┌──────┴────────────────────────┴─────────────────────────┴──────────┐    │
│  │                        DebugLogger                                   │    │
│  │  - Initialized per conversation (conversation_id)                   │    │
│  │  - Logs events to JSON files in /backend/logs/                      │    │
│  │  - Captures: LLM requests, responses, tool calls, errors            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Components

### 1. Debug Logger (`/backend/app/utils/debug_logger.py`)

The core logging utility that captures all cognitive pipeline events.

#### Key Functions:

```python
# Initialize logger for a conversation
init_debug_logger(conversation_id: str) -> DebugLogger

# Log a flat event (top-level)
logger.log_event(event_type: str, data: Any)

# Log a layer-specific event
logger.log_layer(layer_num: int, event_type: str, data: Any)

# Convenience function (uses global logger)
log_debug(layer_num: int, event_type: str, data: Any)

# Retrieve logs for a conversation
get_debug_logs(conversation_id: str) -> Dict[str, Any]
```

#### Log File Structure:

```json
{
  "conversation_id": "374",
  "created_at": "2025-12-13 14:30:45",
  "turns": [
    {
      "timestamp": "2025-12-13 14:30:45",
      "turn_number": 1
    }
  ],
  "events": [
    {
      "event_type": "llm_request",
      "timestamp": "2025-12-13 14:30:46",
      "data": { "question": "What is the revenue trend?" }
    }
  ],
  "layers": {
    "layer2": {
      "events": [
        {
          "event_type": "tier1_loaded",
          "timestamp": "2025-12-13 14:30:45",
          "data": { "persona": "maestro", "token_count": 1270 }
        },
        {
          "event_type": "groq_full_trace",
          "timestamp": "2025-12-13 14:30:48",
          "data": {
            "tool_calls_count": 2,
            "tool_calls": [...],
            "reasoning_steps": [...],
            "mcp_operations": [...]
          }
        }
      ]
    }
  }
}
```

#### Log File Location:
```
/backend/logs/chat_debug_{conversation_id}.json
```

---

### 2. Debug API Routes (`/backend/app/api/routes/debug.py`)

RESTful API endpoints for the observability dashboard.

#### Endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/debug/traces` | GET | List all conversation traces |
| `/api/v1/debug/traces/{id}` | GET | Get full trace details |
| `/api/v1/debug/prompts/toggle` | POST | Enable/disable debug mode |
| `/api/v1/debug/prompts/status` | GET | Check debug mode status |
| `/api/v1/debug/database-config` | GET | Check database configuration |

#### List Traces Response:

```json
{
  "traces": [
    {
      "conversation_id": "374",
      "created_at": "2025-12-13 14:30:45",
      "query": "What is the revenue trend for...",
      "persona": "maestro",
      "tool_calls_count": 3,
      "has_error": false,
      "file_size": 15234,
      "turns": 2
    }
  ],
  "total": 50
}
```

#### Get Trace Detail Response:

```json
{
  "conversation_id": "374",
  "created_at": "2025-12-13 14:30:45",
  "turns": [...],
  "timeline": [
    {
      "timestamp": "2025-12-13 14:30:45",
      "type": "tier1_loaded",
      "layer": "layer2",
      "data": { "persona": "maestro" }
    }
  ],
  "tool_calls": [
    {
      "tool": "read_neo4j_cypher",
      "server": "mcp_router",
      "arguments": "{\"query\": \"MATCH (n:Entity)...\"}"
    }
  ],
  "reasoning": [
    {
      "thought": [{ "text": "I need to query the graph database..." }]
    }
  ],
  "mcp_operations": [...],
  "errors": [],
  "raw": { /* Full raw log data */ }
}
```

---

### 3. Orchestrator Logging (`/backend/app/services/orchestrator_universal.py`)

The orchestrator logs key events during LLM processing:

```python
# Log tier1 instructions loaded
log_debug(2, "tier1_loaded", {
    "persona": persona,
    "token_count": token_count
})

# Log full Groq trace (tool calls, reasoning, MCP ops)
log_debug(2, "groq_full_trace", {
    "tool_calls_count": len(tool_calls),
    "tool_calls": tool_calls,
    "mcp_operations": mcp_operations,
    "reasoning_steps": reasoning_steps,
    "output_items_count": len(output_array),
    "output_types": [item.get("type") for item in output_array]
})
```

---

## Frontend Components

### 1. ObservabilityPage (`/frontend/src/pages/ObservabilityPage.tsx`)

The main React component for the observability dashboard.

#### Component Hierarchy:

```
ObservabilityPage
├── Header (title, back button)
├── Error Banner (conditional)
└── Main Grid
    ├── TraceList (left panel - 320px)
    │   └── TraceItem[] (clickable trace cards)
    └── DetailPanel (right panel - flex)
        ├── Empty State (when no trace selected)
        └── TraceDetailView (when trace selected)
            ├── Header (trace ID, badges)
            ├── Summary Cards (4 metrics)
            └── Tabs Container
                ├── Timeline Tab
                ├── Reasoning Tab
                ├── Tool Calls Tab
                ├── Errors Tab
                └── Raw JSON Tab
```

#### Sub-Components:

| Component | Purpose |
|-----------|---------|
| `TraceList` | Displays list of conversation traces with metadata |
| `Timeline` | Chronological view of all events with expandable details |
| `ReasoningPanel` | Shows LLM reasoning/thinking steps |
| `ToolCallsPanel` | Displays MCP tool calls with arguments |
| `ErrorsPanel` | Lists errors with full context |
| `TraceDetailView` | Main detail view with tabs |

---

### 2. Styling (`/frontend/src/pages/ObservabilityPage.css`)

Custom CSS using the site's design system variables.

#### Key CSS Variables Used:

```css
/* Backgrounds */
--component-bg-primary       /* Page background */
--component-panel-bg         /* Panel backgrounds */
--component-bg-secondary     /* Card backgrounds */

/* Text */
--component-text-primary     /* Primary text */
--component-text-secondary   /* Secondary text */
--component-text-muted       /* Muted/meta text */
--component-text-accent      /* Accent color (gold) */

/* Borders */
--component-panel-border     /* Panel borders */

/* Status Colors */
--component-color-success    /* Success states (green) */
--component-color-warning    /* Warning states (gold) */
--component-color-danger     /* Error states (red) */

/* Typography */
--component-font-family      /* Body font */
--component-font-mono        /* Code/monospace font */
```

#### Key CSS Classes:

| Class | Purpose |
|-------|---------|
| `.observability-page` | Main container |
| `.observability-header` | Top header bar |
| `.trace-list-panel` | Left sidebar panel |
| `.trace-item` | Individual trace card |
| `.detail-panel` | Right detail panel |
| `.tabs-container` | Tab navigation system |
| `.timeline-event` | Timeline event card |
| `.code-block` | JSON/code display |
| `.badge-*` | Status badges |

---

## Event Types Reference

Events logged during cognitive processing:

| Event Type | Layer | Description |
|------------|-------|-------------|
| `llm_request` | Orchestrator | Initial user query received |
| `llm_response` | Orchestrator | Final response generated |
| `tier1_loaded` | Layer 2 | System instructions loaded from DB |
| `tier1_load_failed` | Layer 2 | Failed to load system instructions |
| `groq_full_trace` | Layer 2 | Complete LLM interaction trace |
| `mcp_tools_available` | Layer 2 | List of available MCP tools |
| `json_parse_failed` | Layer 2 | Failed to parse LLM JSON output |

---

## Usage Guide

### Accessing the Dashboard

1. Start the development servers:
   ```bash
   ./sb.sh --fg
   ```

2. Navigate to:
   ```
   http://localhost:3000/admin/observability
   ```

### Reading a Trace

1. **Select a trace** from the left panel
2. **Review summary cards** for quick metrics
3. **Timeline tab** - See chronological event flow
4. **Reasoning tab** - Inspect LLM thinking process
5. **Tool Calls tab** - View MCP tool invocations
6. **Errors tab** - Debug any failures
7. **Raw JSON tab** - Access complete log data

### Debugging Tips

1. **No traces showing?**
   - Check `backend/logs/` directory exists
   - Verify conversations are being logged (send a chat message first)

2. **Tool calls not appearing?**
   - Look for `groq_full_trace` events in timeline
   - Check `tool_calls_count` in trace list

3. **Missing reasoning steps?**
   - Extended thinking must be enabled in Groq API
   - Check `reasoning_steps` in `groq_full_trace` event

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG_PROMPTS` | `false` | Enable verbose prompt logging |
| `REACT_APP_API_URL` | `""` | API base URL for frontend |

### Toggle Debug Mode

```bash
# Enable debug mode (via API)
curl -X POST http://localhost:8008/api/v1/debug/prompts/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Check status
curl http://localhost:8008/api/v1/debug/prompts/status
```

---

## Security Considerations

⚠️ **Admin Only** - This dashboard exposes sensitive information:
- Full LLM prompts and responses
- System instructions (tier1)
- Tool call arguments (may contain queries)
- Raw conversation data

**Recommendations:**
1. Do NOT expose in production
2. Add authentication if deployed
3. Consider log rotation/cleanup for storage
4. Redact sensitive data in logs if needed

---

## File Reference

| File | Purpose |
|------|---------|
| `/frontend/src/pages/ObservabilityPage.tsx` | React dashboard component |
| `/frontend/src/pages/ObservabilityPage.css` | Dashboard styling |
| `/frontend/src/App.tsx` | Route registration |
| `/backend/app/api/routes/debug.py` | API endpoints |
| `/backend/app/utils/debug_logger.py` | Logging utility |
| `/backend/app/services/orchestrator_universal.py` | Event emission |
| `/backend/logs/chat_debug_*.json` | Log files |
