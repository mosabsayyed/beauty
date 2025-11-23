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

echo "Targeted cleanup: kill any processes started from project root"
# Find processes whose command line contains the project root and kill them gracefully
PROJECT_PIDS=$(pgrep -af "$ROOT_DIR" | awk '{print $1}') || true
if [ -n "$PROJECT_PIDS" ]; then
  for p in $PROJECT_PIDS; do
    if [ -n "$p" ]; then
      if kill -0 "$p" 2>/dev/null; then
        echo "Terminating project-related PID $p"
        kill "$p" 2>/dev/null || true
        sleep 1
        if kill -0 "$p" 2>/dev/null; then
          echo "Force killing project-related PID $p"
          kill -9 "$p" 2>/dev/null || true
        fi
      fi
    fi
  done
fi

echo "Fallback: ensure common dev binaries are not running"
pkill -f mcp-neo4j-cypher 2>/dev/null || true
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f ngrok 2>/dev/null || true
pkill -f "npm --prefix" 2>/dev/null || true
pkill -f "node .*react-scripts" 2>/dev/null || true

echo "Cleanup complete. You can inspect logs in $ROOT_DIR/logs and $ROOT_DIR/backend/logs"

echo "Remaining matching processes (if any):"
ps aux | egrep "($ROOT_DIR|mcp-neo4j-cypher|uvicorn|ngrok|react-scripts|context7-mcp|mcp-server)" | egrep -v egrep || true

echo
echo "Listening ports (3000/3001/8008/8080):"
ss -ltnp 2>/dev/null | egrep -w "(:3000|:3001|:8008|:8080)" || true
