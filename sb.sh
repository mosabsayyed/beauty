#!/usr/bin/env bash
set -euo pipefail

# sb.sh - start backend-related services (ngrok, MCP server, backend)
# Exits non-zero if any service fails to start or healthchecks fail.

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

mkdir -p "$ROOT_DIR/logs" "$ROOT_DIR/backend/logs" || true

echo "Activating venv if present..."
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.venv/bin/activate"
fi

echo "Loading backend/.env into environment (if present)..."
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/backend/.env"
  set +a
fi

# Also load root .env for OPENAI_API_KEY and other shared secrets
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

MCP_PORT=${NEO4J_MCP_SERVER_PORT:-8080}
echo "Using MCP port: $MCP_PORT"

# Run mode: background (default) or foreground (on-screen).
# Usage: ./sb.sh --fg to run on-screen
MODE="bg"
if [ "${1:-}" = "--fg" ] || [ "${1:-}" = "-f" ]; then
  MODE="fg"
fi
echo "Run mode: $MODE"

# Persona MCP router URLs (defaults for local dev)
export NOOR_MCP_ROUTER_URL="${NOOR_MCP_ROUTER_URL:-http://127.0.0.1:8201}"
export MAESTRO_MCP_ROUTER_URL="${MAESTRO_MCP_ROUTER_URL:-http://127.0.0.1:8202}"

echo "Ensuring ngrok is running to expose MCP (Noor on 8201 only)..."
# If an ngrok process is already running, reuse it. Otherwise start a single tunnel for 8201.
EXISTING_NGROK_PID=$(pgrep -x ngrok || true)
if [ -n "$EXISTING_NGROK_PID" ]; then
  NGROK_PID=$(echo "$EXISTING_NGROK_PID" | awk '{print $1}')
  echo "Found existing ngrok process (pid $NGROK_PID); will reuse it."
else
  echo "Starting ngrok (single https tunnel -> localhost:8201 for Noor)..."
  nohup ngrok http --log=stdout 8201 >> "$ROOT_DIR/logs/ngrok.log" 2>&1 &
  NGROK_PID=$!
  sleep 2
  if ! kill -0 "$NGROK_PID" 2>/dev/null; then
    echo "ngrok failed to start (pid $NGROK_PID). See $ROOT_DIR/logs/ngrok.log"
    tail -n 200 "$ROOT_DIR/logs/ngrok.log" || true
    exit 1
  fi
fi

# wait for ngrok API
NGROK_API="http://127.0.0.1:4040/api/tunnels"
for i in $(seq 1 10); do
  if curl -sS --max-time 2 "$NGROK_API" | grep -q "public_url"; then
    echo "ngrok API available"
    break
  fi
  sleep 1
  if [ "$i" -eq 10 ]; then
    echo "ngrok API not responding after wait; see logs"
    tail -n 200 "$ROOT_DIR/logs/ngrok.log" || true
    exit 1
  fi
done

# Fetch public URL for the active tunnel
NGROK_TUNNELS=$(curl -sS --max-time 3 "$NGROK_API" || true)
NGROK_PUBLIC_URL=$(printf "%s" "$NGROK_TUNNELS" | python3 -c "import sys,json
try:
    d=json.load(sys.stdin)
    tunnels=d.get('tunnels',[])
    # Prefer the https tunnel that points to 8201
    for t in tunnels:
        cfg=t.get('config',{})
        if t.get('proto')=='https' and str(cfg.get('addr','')).endswith(':8201'):
            print(t.get('public_url',''))
            break
except Exception:
    pass")

if [ -n "$NGROK_PUBLIC_URL" ]; then
  export NOOR_MCP_ROUTER_URL_PUBLIC="$NGROK_PUBLIC_URL/mcp/"
  echo "ngrok public URL (Noor): $NGROK_PUBLIC_URL"
  # Override localhost default with public URL if still set to local
  if [ "${NOOR_MCP_ROUTER_URL}" = "http://127.0.0.1:8201" ]; then
    export NOOR_MCP_ROUTER_URL="$NOOR_MCP_ROUTER_URL_PUBLIC"
  fi
  # Explicitly disable Maestro public routing in single-persona mode
  export MAESTRO_MCP_ROUTER_URL=""
  export MAESTRO_MCP_ROUTER_URL_PUBLIC=""
fi

echo "Checking MCP port ($MCP_PORT) binding..."
if ss -ltnp 2>/dev/null | egrep -q "[:.]$MCP_PORT\b"; then
  echo "MCP port $MCP_PORT already in use; assuming MCP is running."
else
  echo "Starting MCP server (http) on 127.0.0.1:${MCP_PORT}/mcp/ ..."
  # Prefer isolating MCP server into its own venv to avoid dependency conflicts
  MCP_SERVER_DIR="$ROOT_DIR/backend/mcp-server/servers/mcp-neo4j-cypher"
  MCP_VENV="$ROOT_DIR/backend/mcp-server/.venv"
  if [ ! -x "$MCP_VENV/bin/python" ]; then
    echo "Creating MCP venv at $MCP_VENV and installing server dependencies..."
    python3 -m venv "$MCP_VENV"
    "$MCP_VENV/bin/pip" install --upgrade pip wheel build
    (cd "$MCP_SERVER_DIR" && "$MCP_VENV/bin/pip" install .) || {
      echo "Failed to install MCP server package in $MCP_VENV. See pip output above.";
      exit 1
    }
  fi

  if [ -x "$MCP_VENV/bin/mcp-neo4j-cypher" ]; then
    if [ "$MODE" = "bg" ]; then
      nohup "$MCP_VENV/bin/mcp-neo4j-cypher" \
        --transport http \
        --server-host 127.0.0.1 \
        --server-port "$MCP_PORT" \
        --server-path /mcp/ \
        --db-url "$NEO4J_URI" --username "$NEO4J_USERNAME" --password "$NEO4J_PASSWORD" --database "$NEO4J_DATABASE" \
        >> "$ROOT_DIR/backend/logs/mcp_server.log" 2>&1 &
      MCP_PID=$!
      sleep 1
      if ! kill -0 "$MCP_PID" 2>/dev/null; then
        echo "MCP process died immediately (pid $MCP_PID). See $ROOT_DIR/backend/logs/mcp_server.log"
        tail -n 200 "$ROOT_DIR/backend/logs/mcp_server.log" || true
        exit 1
      fi
    else
      # foreground mode: start MCP in background (logs to file) and leave backend on-screen
      "$MCP_VENV/bin/mcp-neo4j-cypher" \
        --transport http \
        --server-host 127.0.0.1 \
        --server-port "$MCP_PORT" \
        --server-path /mcp/ \
        --db-url "$NEO4J_URI" --username "$NEO4J_USERNAME" --password "$NEO4J_PASSWORD" --database "$NEO4J_DATABASE" \
        >> "$ROOT_DIR/backend/logs/mcp_server.log" 2>&1 &
      MCP_PID=$!
      sleep 1
      if ! kill -0 "$MCP_PID" 2>/dev/null; then
        echo "MCP process died immediately (pid $MCP_PID). See $ROOT_DIR/backend/logs/mcp_server.log"
        tail -n 200 "$ROOT_DIR/backend/logs/mcp_server.log" || true
        exit 1
      fi
    fi
  else
    echo "mcp-neo4j-cypher CLI not found in MCP venv at $MCP_VENV/bin/mcp-neo4j-cypher"
    exit 1
  fi

  # Start MCP Routers (3 instances: Noor, Maestro, Embeddings)
  echo "Starting MCP Routers..."
  MCP_ROUTER_DIR="$ROOT_DIR/backend/mcp-server/servers/mcp-router"
  
  # Use the isolated router venv to avoid dependency conflicts (fastmcp vs pydantic)
  MCP_ROUTER_VENV="$MCP_ROUTER_DIR/.venv-mcp-router"
  if [ -x "$MCP_ROUTER_VENV/bin/python" ]; then
      ROUTER_PYTHON="$MCP_ROUTER_VENV/bin/python"
  else
      echo "Router venv not found at $MCP_ROUTER_VENV, falling back to shared venv..."
      ROUTER_PYTHON="$MCP_VENV/bin/python"
      "$ROUTER_PYTHON" -m pip install -r "$MCP_ROUTER_DIR/requirements.txt" >/dev/null 2>&1 || echo "Warning: Failed to install router deps"
  fi

  # Set PYTHONPATH to include router src
  export PYTHONPATH="$MCP_ROUTER_DIR/src:${PYTHONPATH:-}"
  
  # 1. Noor Router (Read-Only, Port 8201)
  echo "  - Starting Noor Router (read-only) on port 8201..."
  NOOR_CONFIG="$MCP_ROUTER_DIR/router_config.yaml"
  if [ ! -f "$NOOR_CONFIG" ]; then
      NOOR_CONFIG="$MCP_ROUTER_DIR/router_config.example.yaml"
  fi
  
  if [ "$MODE" = "bg" ]; then
    nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8201, config_path='$NOOR_CONFIG')" \
      >> "$ROOT_DIR/backend/logs/mcp_router_noor.log" 2>&1 &
    NOOR_ROUTER_PID=$!
    sleep 1
    if ! kill -0 "$NOOR_ROUTER_PID" 2>/dev/null; then
      echo "    ❌ Noor Router died immediately (pid $NOOR_ROUTER_PID). See logs"
      tail -n 20 "$ROOT_DIR/backend/logs/mcp_router_noor.log" || true
    else
      echo "    ✅ Noor Router started (pid $NOOR_ROUTER_PID)"
    fi
  else
    nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8201, config_path='$NOOR_CONFIG')" \
      >> "$ROOT_DIR/backend/logs/mcp_router_noor.log" 2>&1 &
    NOOR_ROUTER_PID=$!
  fi

  # 2. Maestro Router (Read/Write, Port 8202)
  echo "  - Starting Maestro Router (read/write) on port 8202..."
  MAESTRO_CONFIG="$MCP_ROUTER_DIR/maestro_router_config.yaml"
  
  if [ -f "$MAESTRO_CONFIG" ]; then
    if [ "$MODE" = "bg" ]; then
      nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8202, config_path='$MAESTRO_CONFIG')" \
        >> "$ROOT_DIR/backend/logs/mcp_router_maestro.log" 2>&1 &
      MAESTRO_ROUTER_PID=$!
      sleep 1
      if ! kill -0 "$MAESTRO_ROUTER_PID" 2>/dev/null; then
        echo "    ❌ Maestro Router died immediately (pid $MAESTRO_ROUTER_PID). See logs"
        tail -n 20 "$ROOT_DIR/backend/logs/mcp_router_maestro.log" || true
      else
        echo "    ✅ Maestro Router started (pid $MAESTRO_ROUTER_PID)"
      fi
    else
      nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8202, config_path='$MAESTRO_CONFIG')" \
        >> "$ROOT_DIR/backend/logs/mcp_router_maestro.log" 2>&1 &
      MAESTRO_ROUTER_PID=$!
    fi
  else
    echo "    ⚠️ Maestro config not found at $MAESTRO_CONFIG - skipping"
    MAESTRO_ROUTER_PID="not_started"
  fi

  # 3. Start Embeddings Server (Port 8204)
  echo "  - Starting Embeddings Server on port 8204..."
  EMBEDDINGS_SERVER="$ROOT_DIR/backend/mcp-server/servers/embeddings-server/embeddings_server.py"
  
  if [ -f "$EMBEDDINGS_SERVER" ]; then
    if [ "$MODE" = "bg" ]; then
      nohup "$ROUTER_PYTHON" "$EMBEDDINGS_SERVER" \
        >> "$ROOT_DIR/backend/logs/embeddings_server.log" 2>&1 &
      EMBEDDINGS_SERVER_PID=$!
      sleep 2
      if ! kill -0 "$EMBEDDINGS_SERVER_PID" 2>/dev/null; then
        echo "    ❌ Embeddings Server died immediately (pid $EMBEDDINGS_SERVER_PID). See logs"
        tail -n 20 "$ROOT_DIR/backend/logs/embeddings_server.log" || true
      else
        echo "    ✅ Embeddings Server started (pid $EMBEDDINGS_SERVER_PID)"
      fi
    else
      nohup "$ROUTER_PYTHON" "$EMBEDDINGS_SERVER" \
        >> "$ROOT_DIR/backend/logs/embeddings_server.log" 2>&1 &
      EMBEDDINGS_SERVER_PID=$!
    fi
  else
    echo "    ⚠️ Embeddings Server not found at $EMBEDDINGS_SERVER - skipping"
    EMBEDDINGS_SERVER_PID="not_started"
  fi

  # 4. Embeddings Router (Port 8203)
  echo "  - Starting Embeddings Router on port 8203..."
  EMBEDDINGS_CONFIG="$MCP_ROUTER_DIR/embeddings_router_config.yaml"
  
  if [ -f "$EMBEDDINGS_CONFIG" ]; then
    # Wait for embeddings server to be ready
    sleep 2
    if [ "$MODE" = "bg" ]; then
      nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8203, config_path='$EMBEDDINGS_CONFIG')" \
        >> "$ROOT_DIR/backend/logs/mcp_router_embeddings.log" 2>&1 &
      EMBEDDINGS_ROUTER_PID=$!
      sleep 1
      if ! kill -0 "$EMBEDDINGS_ROUTER_PID" 2>/dev/null; then
        echo "    ❌ Embeddings Router died immediately (pid $EMBEDDINGS_ROUTER_PID). See logs"
        tail -n 20 "$ROOT_DIR/backend/logs/mcp_router_embeddings.log" || true
      else
        echo "    ✅ Embeddings Router started (pid $EMBEDDINGS_ROUTER_PID)"
      fi
    else
      nohup "$ROUTER_PYTHON" -c "from mcp_router.server import run_http; run_http(port=8203, config_path='$EMBEDDINGS_CONFIG')" \
        >> "$ROOT_DIR/backend/logs/mcp_router_embeddings.log" 2>&1 &
      EMBEDDINGS_ROUTER_PID=$!
    fi
  else
    echo "    ⚠️ Embeddings Router config not found at $EMBEDDINGS_CONFIG - skipping"
    EMBEDDINGS_ROUTER_PID="not_started"
  fi
  
  ROUTER_PID=$NOOR_ROUTER_PID  # For backward compatibility
fi

echo "Verifying MCP HTTP endpoint..."
if ! curl -sS --max-time 3 "http://127.0.0.1:${MCP_PORT}/mcp/" >/dev/null; then
  echo "MCP HTTP endpoint not responding at ${MCP_PORT}/mcp/";
  tail -n 200 "$ROOT_DIR/backend/logs/mcp_server.log" || true
  exit 1
fi

echo "Starting backend (run_groq_server.sh)..."
# If port 8008 is already bound, assume backend is running and reuse it.
if ss -ltnp 2>/dev/null | egrep -q '[:.]8008\b'; then
  EXISTING_BACKEND_PID=$(ss -ltnp 2>/dev/null | egrep '[:.]8008\b' | awk '{print $6}' | sed -E 's/.*pid=([0-9]+),.*/\1/' | head -n1 || true)
  echo "Backend port 8008 already in use; assuming backend is running (pid ${EXISTING_BACKEND_PID:-unknown})."
  BACKEND_PID=${EXISTING_BACKEND_PID:-unknown}
else
  chmod +x "$ROOT_DIR/backend/run_groq_server.sh"
  if [ "$MODE" = "bg" ]; then
    nohup "$ROOT_DIR/backend/run_groq_server.sh" >> "$ROOT_DIR/logs/backend_start.log" 2>&1 &
    BACKEND_PID=$!
    sleep 1
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "Backend failed to start (pid $BACKEND_PID). See $ROOT_DIR/logs/backend_start.log"
      tail -n 200 "$ROOT_DIR/logs/backend_start.log" || true
      exit 1
    fi
  else
    # foreground mode: run backend on-screen and tee logs to file
    echo "Running backend on-screen (foreground). Logs will also be written to $ROOT_DIR/logs/backend_start.log"
    exec "$ROOT_DIR/backend/run_groq_server.sh" 2>&1 | tee "$ROOT_DIR/logs/backend_start.log"
  fi
fi

echo "Waiting for backend health endpoint..."
# Follow redirects and wait up to 30 seconds for a JSON health response containing "status".
for i in $(seq 1 30); do
  if curl -sS -L --max-time 3 http://127.0.0.1:8008/api/v1/health | grep -q '"status"'; then
    echo "Backend is healthy"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo 'Backend health check failed; see logs'
    tail -n 200 "$ROOT_DIR/logs/backend_start.log" || true
    exit 1
  fi
done

echo "All backend services started successfully."
echo "PIDs:"
echo "  - ngrok: $NGROK_PID"
echo "  - MCP Server: ${MCP_PID:-unknown}"
echo "  - Noor Router (8201): ${NOOR_ROUTER_PID:-unknown}"
echo "  - Maestro Router (8202): ${MAESTRO_ROUTER_PID:-not_started}"
echo "  - Embeddings Server (8204): ${EMBEDDINGS_SERVER_PID:-not_started}"
echo "  - Embeddings Router (8203): ${EMBEDDINGS_ROUTER_PID:-not_started}"
echo "  - Backend: $BACKEND_PID"
exit 0
