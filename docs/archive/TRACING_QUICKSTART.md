# 🚀 Quick Start: Distributed Tracing

## TL;DR

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Test setup (optional)
python ../scripts/test_tracing.py

# 3. Start backend (tracing enabled by default)
cd ..
./sb.sh

# 4. Make requests - see traces in console!
```

## What You Get

OpenTelemetry tracing is now integrated across JOSOOR:

✅ **API Requests** - Track every HTTP request  
✅ **LLM Calls** - Monitor Groq API performance  
✅ **Database Queries** - Trace Neo4j and Supabase  
✅ **MCP Tools** - Track tool execution  
✅ **Service Operations** - Monitor orchestrator flow  

## Three Setup Options

### Option 1: Console Output (Default)

**Already configured!** Just start the backend:

```bash
./sb.sh
```

Traces print to console. No additional setup needed.

### Option 2: Jaeger UI (Recommended)

**Get a visual UI for traces:**

```bash
# Start Jaeger
docker-compose -f docker-compose.tracing.yml up -d

# Configure backend
cd backend
cat >> .env << EOF
OTEL_EXPORTER_TYPE=jaeger
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831
EOF

# Start backend
cd ..
./sb.sh
```

**View traces:** http://localhost:16686

### Option 3: Cloud Provider (Production)

**Send to Honeycomb, Grafana Cloud, etc:**

```bash
cd backend
cat >> .env << EOF
OTEL_EXPORTER_TYPE=otlp
OTEL_EXPORTER_ENDPOINT=https://api.honeycomb.io:443
OTEL_EXPORTER_HEADERS=x-honeycomb-team=YOUR_API_KEY
EOF
```

## Quick Test

After setup, verify tracing works:

```bash
# Test script
python scripts/test_tracing.py

# Make a request
curl -X POST http://localhost:8008/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Noor",
    "conversation_id": "test-123",
    "persona": "noor"
  }'

# Check traces:
# - Console: See output in terminal
# - Jaeger: Open http://localhost:16686
```

## What Gets Traced?

Every request shows:

```
Request Flow
├── API Handler (FastAPI)
├── Orchestrator
│   ├── Load Tier1 Instructions
│   ├── LLM Call (Groq)
│   │   ├── MCP Tool: retrieve_instructions
│   │   ├── MCP Tool: read_neo4j_cypher
│   │   └── MCP Tool: recall_memory
│   ├── Parse Response
│   └── Apply Business Language
└── Return Response

With timing, attributes, and errors for each step!
```

## Configuration

Add to `backend/.env`:

```bash
# Enable/disable
OTEL_ENABLED=true

# Service name (appears in UI)
OTEL_SERVICE_NAME=josoor-backend

# Output type
OTEL_EXPORTER_TYPE=console  # or jaeger, or otlp

# Jaeger settings (if using)
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831

# OTLP settings (if using)
OTEL_EXPORTER_ENDPOINT=http://localhost:4318
```

## Disable Tracing

```bash
# In backend/.env
OTEL_ENABLED=false
```

## Full Documentation

- **Complete Guide:** `/docs/TRACING_GUIDE.md`
- **API Reference:** `/backend/app/utils/tracing.py`
- **Examples:** `/backend/app/services/orchestrator_noor.py`

## Troubleshooting

### "Module not found: opentelemetry"

```bash
cd backend
pip install -r requirements.txt
```

### Traces not appearing

1. Check `OTEL_ENABLED=true` in `.env`
2. Check backend logs for errors
3. For Jaeger: `docker ps | grep jaeger`

### Performance concerns

Tracing adds ~5-10ms per request. Disable in production load tests:

```bash
OTEL_ENABLED=false
```

## Support

Questions? Check:
1. This file (you are here!)
2. `/docs/TRACING_GUIDE.md` - Full documentation
3. `/backend/app/utils/tracing.py` - API reference
4. OpenTelemetry docs: https://opentelemetry.io/

---

**Status:** ✅ Ready to use  
**Default:** Console output enabled  
**Optional:** Jaeger UI or cloud providers  
