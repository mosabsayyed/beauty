#!/usr/bin/env bash
set -euo pipefail

# stop_dev.sh - stop any processes started by run_dev_full.sh
# This version:
# - Reads PIDs from .dev_pids and tries graceful shutdown (TERM -> wait -> KILL)
# - Attempts targeted cleanup of processes started under the project root
# - Falls back to pkill for known dev binaries (ngrok, mcp-neo4j-cypher, uvicorn, npm)

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

PID_FILE="$ROOT_DIR/.dev_pids"
GRACE_PERIOD=5

if [ -f "$PID_FILE" ]; then
  echo "Stopping PIDs listed in $PID_FILE"
  # Read all PIDs into an array (skip empty lines)
  mapfile -t PIDS < <(grep -E '^[0-9]+$' "$PID_FILE" || true)

  for pid in "${PIDS[@]:-}"; do
    if [ -z "$pid" ]; then
      continue
    fi
    if kill -0 "$pid" 2>/dev/null; then
      echo "Terminating PID $pid"
      kill "$pid" 2>/dev/null || true
      # wait up to GRACE_PERIOD seconds for process to exit
      for i in $(seq 1 $GRACE_PERIOD); do
        if ! kill -0 "$pid" 2>/dev/null; then
          break
        fi
        sleep 1
      done
      # If still alive, force kill
      if kill -0 "$pid" 2>/dev/null; then
        echo "PID $pid did not exit, force killing"
        kill -9 "$pid" 2>/dev/null || true
      else
        echo "PID $pid stopped"
      fi
    else
      echo "PID $pid not running"
    fi
  done

  rm -f "$PID_FILE"
fi

echo "Port-based cleanup: kill processes on project ports"
# Kill processes listening on project-specific ports: 3000, 3001, 8008, 8080, 8201, 8202, 8203
PROJECT_PORTS=(3000 3001 8008 8080 8201 8202 8203)

for port in "${PROJECT_PORTS[@]}"; do
  echo "Checking port $port..."
  PORT_PIDS=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$PORT_PIDS" ]; then
    for p in $PORT_PIDS; do
      if [ -n "$p" ] && kill -0 "$p" 2>/dev/null; then
        PROC_CMD=$(ps -p "$p" -o cmd= 2>/dev/null || echo "unknown")
        echo "Terminating PID $p on port $port: $PROC_CMD"
        kill "$p" 2>/dev/null || true
        sleep 1
        if kill -0 "$p" 2>/dev/null; then
          echo "Force killing PID $p"
          kill -9 "$p" 2>/dev/null || true
        fi
      fi
    done
  fi
done

echo "Cleanup complete. You can inspect logs in $ROOT_DIR/logs and $ROOT_DIR/backend/logs"

echo "Remaining matching processes (if any):"
ps aux | egrep "($ROOT_DIR|mcp-neo4j-cypher|uvicorn|ngrok|react-scripts|context7-mcp|mcp-server)" | egrep -v egrep || true

echo
echo "Listening ports (3000/3001/8008/8080):"
ss -ltnp 2>/dev/null | egrep -w "(:3000|:3001|:8008|:8080)" || true
