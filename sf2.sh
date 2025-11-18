#!/usr/bin/env bash
set -euo pipefail

# sf2.sh - start frontend2 dev server. Exits non-zero if start fails.

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

FRONTEND2_DIR="$ROOT_DIR/frontend2"
LOG_DIR="$FRONTEND2_DIR/logs"
mkdir -p "$LOG_DIR"

echo "Starting frontend2 (in $FRONTEND2_DIR)"
cd "$FRONTEND2_DIR"
MODE="bg"
if [ "${1:-}" = "--fg" ] || [ "${1:-}" = "-f" ]; then
  MODE="fg"
fi

if [ "$MODE" = "bg" ]; then
  nohup npm --prefix "$FRONTEND2_DIR" run dev >> "$LOG_DIR/frontend2.log" 2>&1 &
  FRONTEND2_PID=$!
  sleep 2
  if ! kill -0 "$FRONTEND2_PID" 2>/dev/null; then
    echo "frontend2 failed to start (pid $FRONTEND2_PID). See $LOG_DIR/frontend2.log"
    tail -n 200 "$LOG_DIR/frontend2.log" || true
    exit 1
  fi

  echo "Waiting for frontend2 dev server to announce readiness in logs..."
  for i in $(seq 1 12); do
    if tail -n 200 "$LOG_DIR/frontend2.log" | grep -Eq "Local:|ready|Vite|http://127.0.0.1|http://localhost"; then
      echo "frontend2 appears ready (logs contain readiness markers)."
      break
    fi
    sleep 1
    if [ "$i" -eq 12 ]; then
      echo "frontend2 did not report readiness in logs; see $LOG_DIR/frontend2.log"
      tail -n 200 "$LOG_DIR/frontend2.log" || true
      exit 1
    fi
  done

  echo "frontend2 started successfully (pid $FRONTEND2_PID)"
  exit 0
else
  echo "Running frontend2 on-screen (foreground). Press Ctrl-C to stop. Logs are written to $LOG_DIR/frontend2.log"
  npm --prefix "$FRONTEND2_DIR" run dev 2>&1 | tee "$LOG_DIR/frontend2.log"
fi
