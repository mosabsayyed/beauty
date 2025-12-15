# 🔍 JOSOOR Distributed Tracing Guide

## Overview

JOSOOR now includes comprehensive distributed tracing using OpenTelemetry. This allows you to track requests across all layers of the application:

- API requests and responses
- LLM calls (Groq)
- Database operations (Supabase, Neo4j)
- MCP tool calls
- Service layer operations

## Quick Start

### 1. Basic Setup (Console Output)

The simplest way to start is with console output (enabled by default):

```bash
# Backend already configured with console tracing
./sb.sh
```

Traces will be printed to the console when making requests.

### 2. Setup with Jaeger (Recommended for Development)

For a full tracing UI, use Jaeger:

```bash
# Start Jaeger
docker-compose -f docker-compose.tracing.yml up -d

# Configure backend to use Jaeger
cd backend
echo "OTEL_ENABLED=true" >> .env
echo "OTEL_EXPORTER_TYPE=jaeger" >> .env
echo "JAEGER_AGENT_HOST=localhost" >> .env
echo "JAEGER_AGENT_PORT=6831" >> .env

# Start backend
./sb.sh
```

Access Jaeger UI at: http://localhost:16686

## Environment Variables

Add these to your `backend/.env` file:

```bash
# Enable/disable tracing
OTEL_ENABLED=true

# Service name (shows up in traces)
OTEL_SERVICE_NAME=josoor-backend

# Exporter type: console, jaeger, or otlp
OTEL_EXPORTER_TYPE=console

# For Jaeger exporter
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831

# For OTLP exporter (e.g., Honeycomb, Grafana Cloud)
OTEL_EXPORTER_ENDPOINT=http://localhost:4318
```

## What Gets Traced?

### 1. API Endpoints
All FastAPI endpoints are automatically instrumented:
- Request/response timing
- Status codes
- Path parameters
- Query parameters

### 2. LLM Calls
Every call to Groq is traced:
- Model name
- Persona (Noor/Maestro)
- Prompt preview (first 200 chars)
- Response length
- Token counts

### 3. Database Operations
Both Neo4j and Supabase queries:
- Query text (truncated for safety)
- Result counts
- Execution time
- Errors

### 4. MCP Tool Calls
MCP operations are traced:
- Tool name
- Router (Noor/Maestro)
- Persona
- Success/failure

## Using Tracing in Your Code

### Basic Operation Tracing

```python
from app.utils.tracing import trace_operation

def my_function():
    with trace_operation("my_operation", attributes={"user_id": 123}):
        # Your code here
        result = do_something()
        return result
```

### LLM Call Tracing

```python
from app.utils.tracing import trace_llm_call

def call_llm(prompt, model="gpt-4"):
    with trace_llm_call(model, prompt, persona="noor") as span:
        response = groq_api.call(prompt)
        
        # Add custom attributes
        if span:
            span.set_attribute("llm.response_tokens", len(response))
        
        return response
```

### Database Query Tracing

```python
from app.utils.tracing import trace_database_query

def query_neo4j(cypher):
    with trace_database_query("neo4j", "read", query=cypher) as span:
        result = neo4j_client.execute_query(cypher)
        
        if span:
            span.set_attribute("db.result_count", len(result))
        
        return result
```

### MCP Tool Call Tracing

```python
from app.utils.tracing import trace_mcp_call

def call_mcp_tool(tool_name, args):
    with trace_mcp_call(tool_name, "noor", "noor", arguments=args) as span:
        result = mcp_router.call(tool_name, args)
        
        if span:
            span.set_attribute("mcp.success", True)
        
        return result
```

### Adding Events and Attributes

```python
from app.utils.tracing import add_span_event, set_span_attributes

# Add an event to current span
add_span_event("cache_miss", {"cache_key": "user_123"})

# Set attributes on current span
set_span_attributes({
    "user.role": "admin",
    "request.priority": "high"
})
```

### Function Decorator

```python
from app.utils.tracing import trace_function

@trace_function("process_user_data")
def process_user(user_id):
    # Automatically traced
    data = fetch_data(user_id)
    return process(data)
```

## Viewing Traces

### Console Output

When using console exporter, traces appear in terminal:

```
{
  "name": "orchestrator.execute_query",
  "context": {
    "trace_id": "0x...",
    "span_id": "0x..."
  },
  "attributes": {
    "session_id": "abc123",
    "persona": "noor"
  }
}
```

### Jaeger UI

When using Jaeger (http://localhost:16686):

1. **Service**: Select "josoor-backend"
2. **Operation**: Choose operation to filter
3. **Find Traces**: Search by tags or time range
4. **View Details**: Click a trace to see:
   - Full request timeline
   - Service dependencies
   - Error details
   - Custom attributes

## Trace Structure

A typical request creates a trace tree:

```
orchestrator.execute_query (100ms)
├── orchestrator.load_tier1 (5ms)
├── llm.call (80ms)
│   └── http.request (75ms)
├── orchestrator.parse_response (10ms)
└── orchestrator.apply_business_language (5ms)
```

## Performance Tips

1. **Sampling**: In production, consider sampling traces (not all requests)
2. **Attribute Size**: Keep attribute values small (< 1KB)
3. **Sensitive Data**: Never log passwords, tokens, or PII in traces
4. **Disable in Tests**: Set `OTEL_ENABLED=false` for unit tests

## Production Deployments

### Option 1: Jaeger

```bash
# Production Jaeger with storage
docker run -d \
  -p 16686:16686 \
  -p 6831:6831/udp \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  -e ES_SERVER_URLS=http://elasticsearch:9200 \
  jaegertracing/all-in-one:latest
```

### Option 2: OTLP to SaaS

Configure for Honeycomb, Grafana Cloud, etc:

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_TYPE=otlp
OTEL_EXPORTER_ENDPOINT=https://api.honeycomb.io:443
OTEL_EXPORTER_HEADERS=x-honeycomb-team=your-api-key
```

## Troubleshooting

### Traces Not Appearing

1. Check `OTEL_ENABLED=true` in `.env`
2. Verify Jaeger is running: `docker ps | grep jaeger`
3. Check backend logs for tracing errors
4. Ensure ports are not blocked by firewall

### Performance Impact

- Console exporter: Minimal (~1-2ms per span)
- Jaeger/OTLP: ~5-10ms per span
- Impact scales with # of spans (not duration)

### Too Many Traces

Reduce trace verbosity:

```bash
# Only trace errors
OTEL_TRACE_ERRORS_ONLY=true

# Sample 10% of requests
OTEL_TRACE_SAMPLING_RATE=0.1
```

## API Documentation

Full API documentation is in `/backend/app/utils/tracing.py`

Key functions:
- `init_tracing(app)` - Initialize tracing
- `trace_operation(name, attributes)` - Trace any operation
- `trace_llm_call(model, prompt)` - Trace LLM calls
- `trace_database_query(db, operation, query)` - Trace DB queries
- `trace_mcp_call(tool, router, persona)` - Trace MCP calls
- `add_span_event(name, attributes)` - Add event to current span
- `set_span_attributes(attrs)` - Set attributes on current span

## Examples

See `/backend/app/services/orchestrator_noor.py` for comprehensive tracing examples.

## Support

For issues or questions about tracing:
1. Check this guide
2. Review `/backend/app/utils/tracing.py` comments
3. Check OpenTelemetry docs: https://opentelemetry.io/docs/
