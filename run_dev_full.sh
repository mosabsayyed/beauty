#!/usr/bin/env bash
set -euo pipefail

# run_dev_full.sh - start MCP, ngrok, backend and frontend in background and record PIDs
ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

# Optional flag: --no-tail will start services and exit (do not tail logs)
NO_TAIL=0
if [ "${1-}" = "--no-tail" ]; then
  NO_TAIL=1
  shift
fi

mkdir -p "$ROOT_DIR/logs"
mkdir -p "$ROOT_DIR/backend/logs"
mkdir -p "$ROOT_DIR/frontend/logs"

PID_FILE="$ROOT_DIR/.dev_pids"
rm -f "$PID_FILE"

echo "Activating venv if present..."
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.venv/bin/activate"
fi

echo "Loading backend/.env into environment (if present)..."
if [ -f "$ROOT_DIR/backend/.env" ]; then
  # Safer env loader: export all variables defined in backend/.env into the environment
  # Use `set -a` so sourced variables are exported. This handles quoted values better.
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/backend/.env"
  set +a
fi

MCP_PORT=${NEO4J_MCP_SERVER_PORT:-8080}
export NEO4J_MCP_SERVER_PORT="$MCP_PORT"
echo "Starting ngrok to expose MCP (port ${MCP_PORT}) (web UI should be on 127.0.0.1:4040)..."
# Start ngrok first (required by Groq/MCP flow). Write its PID to PID_FILE.
nohup ngrok http "$MCP_PORT" 2>&1 | python3 -u -c "import sys,time
for l in sys.stdin:
  sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)
  sys.stdout.flush()" >> "$ROOT_DIR/logs/ngrok.log" 2>/dev/null &
echo $! >> "$PID_FILE"
sleep 1

# Wait briefly for ngrok web API to become available and print public tunnels
NGROK_API="http://127.0.0.1:4040/api/tunnels"
for i in 1 2 3 4 5; do
  if curl -s "$NGROK_API" | grep -q "public_url"; then
  # Append ngrok tunnels info (do not overwrite existing logs)
  echo "ngrok tunnels:" >> "$ROOT_DIR/logs/ngrok_tunnels.log"
  curl -s "$NGROK_API" | jq '.' >> "$ROOT_DIR/logs/ngrok_tunnels.log" 2>/dev/null || true
  echo "Appended ngrok tunnels to $ROOT_DIR/logs/ngrok_tunnels.log"
    break
  fi
  sleep 1
done

echo "Starting MCP server (HTTP) on 127.0.0.1:${MCP_PORT}/mcp/..."
# If MCP port already in use, skip starting a new instance to avoid bind errors
if ss -ltnp 2>/dev/null | grep -q "127.0.0.1:$MCP_PORT"; then
  echo "MCP port $MCP_PORT already in use; skipping starting a new MCP instance."
else
  nohup "$ROOT_DIR/.venv/bin/mcp-neo4j-cypher" \
    --transport http \
    --server-host 127.0.0.1 \
    --server-port "$MCP_PORT" \
    --server-path /mcp/ \
    --db-url "$NEO4J_URI" --username "$NEO4J_USERNAME" --password "$NEO4J_PASSWORD" --database "$NEO4J_DATABASE" \
    2>&1 | python3 -u -c "import sys,time\nfor l in sys.stdin:\n    sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)\n    sys.stdout.flush()" >> "$ROOT_DIR/backend/logs/mcp_server.log" 2>/dev/null &
  echo $! >> "$PID_FILE"
  sleep 1
fi

echo "Starting backend (uvicorn) via backend/run_groq_server.sh..."
chmod +x "$ROOT_DIR/backend/run_groq_server.sh"
nohup "$ROOT_DIR/backend/run_groq_server.sh" 2>&1 | python3 -u -c "import sys,time
for l in sys.stdin:
  sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)
  sys.stdout.flush()" >> "$ROOT_DIR/logs/backend_start.log" 2>/dev/null &
echo $! >> "$PID_FILE"
sleep 1

echo "Starting frontend dev server (npm start) in background..."
nohup npm --prefix "$ROOT_DIR/frontend" start 2>&1 | python3 -u -c "import sys,time
for l in sys.stdin:
  sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)
  sys.stdout.flush()" >> "$ROOT_DIR/frontend/logs/frontend.log" 2>/dev/null &
echo $! >> "$PID_FILE"

echo "All PIDs written to $PID_FILE"
if [ "$NO_TAIL" -eq 1 ]; then
  echo "No-tail mode: printing PIDs and ngrok tunnels and exiting."
  echo "PIDs:"; cat "$PID_FILE" || true
  if command -v curl >/dev/null 2>&1; then
    echo "ngrok tunnels (if available):"
    curl -s http://127.0.0.1:4040/api/tunnels || echo "(ngrok API not yet available)"
  fi
  exit 0
else
  echo "Tailing important logs (mcp / backend); press Ctrl-C to stop tailing" 
  tail -n 40 -f "$ROOT_DIR/backend/logs/mcp_server.log" "$ROOT_DIR/logs/backend_start.log"
fi
