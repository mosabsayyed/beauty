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

MCP_PORT=${NEO4J_MCP_SERVER_PORT:-8080}
echo "Using MCP port: $MCP_PORT"

# Run mode: background (default) or foreground (on-screen).
# Usage: ./sb.sh --fg to run on-screen
MODE="bg"
if [ "${1:-}" = "--fg" ] || [ "${1:-}" = "-f" ]; then
  MODE="fg"
fi
echo "Run mode: $MODE"

echo "Ensuring ngrok is running to expose MCP (port ${MCP_PORT})..."
# If an ngrok process is already running, reuse it. Otherwise start a new one.
EXISTING_NGROK_PID=$(pgrep -x ngrok || true)
if [ -n "$EXISTING_NGROK_PID" ]; then
  NGROK_PID=$(echo "$EXISTING_NGROK_PID" | awk '{print $1}')
  echo "Found existing ngrok process (pid $NGROK_PID); will reuse it."
else
  echo "Starting ngrok..."
  nohup ngrok http "$MCP_PORT" --log=stdout >> "$ROOT_DIR/logs/ngrok.log" 2>&1 &
  NGROK_PID=$!
  sleep 1
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

echo "All backend services started successfully. PIDs: ngrok=$NGROK_PID MCP=${MCP_PID:-unknown} backend=$BACKEND_PID"
exit 0
