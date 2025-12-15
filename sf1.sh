#!/usr/bin/env bash
set -euo pipefail

# sf1.sh - start primary frontend (frontend folder). Exits non-zero if start fails.

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

FRONTEND_DIR="$ROOT_DIR/frontend"
GRAPH_SERVER_DIR="$ROOT_DIR/graph-server" # Added/changed this line based on instruction
LOG_DIR="$FRONTEND_DIR/logs" # This line remains as it was, assuming LOG_DIR refers to frontend logs
mkdir -p "$LOG_DIR"

# Start Graph Server Sidecar
GRAPH_SERVER_DIR="$ROOT_DIR/graph-server"
GRAPH_LOG_DIR="$ROOT_DIR/logs"
echo "Starting Graph Server Sidecar (Port 3001) in $GRAPH_SERVER_DIR..."
if [ ! -d "$GRAPH_SERVER_DIR/node_modules" ]; then
  echo "Installing graph server dependencies..."
  (cd "$GRAPH_SERVER_DIR" && npm install >> "$GRAPH_LOG_DIR/graph_server_install.log" 2>&1)
fi
(cd "$GRAPH_SERVER_DIR" && PORT=3001 nohup npm run dev >> "$GRAPH_LOG_DIR/graph_server.log" 2>&1 &)
echo "Graph Server started in background."

echo "Starting frontend (in $FRONTEND_DIR)"
cd "$FRONTEND_DIR"
MODE="bg"
if [ "${1:-}" = "--fg" ] || [ "${1:-}" = "-f" ]; then
  MODE="fg"
fi

if [ "$MODE" = "bg" ]; then
  nohup npm --prefix "$FRONTEND_DIR" start >> "$LOG_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  sleep 2
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Frontend failed to start (pid $FRONTEND_PID). See $LOG_DIR/frontend.log"
    tail -n 200 "$LOG_DIR/frontend.log" || true
    exit 1
  fi

  echo "Waiting for frontend dev server to announce readiness in logs..."
  for i in $(seq 1 12); do
    if tail -n 200 "$LOG_DIR/frontend.log" | grep -Eq "Local:|ready|Vite|http://127.0.0.1|http://localhost"; then
      echo "Frontend appears ready (logs contain readiness markers)."
      break
    fi
    sleep 1
    if [ "$i" -eq 12 ]; then
      echo "Frontend did not report readiness in logs; see $LOG_DIR/frontend.log"
      tail -n 200 "$LOG_DIR/frontend.log" || true
      exit 1
    fi
  done

  echo "Frontend started successfully (pid $FRONTEND_PID)"
  exit 0
else
  echo "Running frontend on-screen (foreground). Press Ctrl-C to stop. Logs are written to $LOG_DIR/frontend.log"
  npm --prefix "$FRONTEND_DIR" start 2>&1 | tee "$LOG_DIR/frontend.log"
fi
