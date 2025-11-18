#!/usr/bin/env bash
set -euo pipefail

# dev_with_ngrok.sh
# Start backend (uvicorn), run ngrok to expose backend, extract public URL, then start the frontend
# Usage: ./scripts/dev_with_ngrok.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found in PATH. Install ngrok and authenticate it first: https://ngrok.com/"
  exit 1
fi

cd "$ROOT_DIR"
# Ensure logs dir exists before redirecting
mkdir -p "$ROOT_DIR/logs"

# Start backend (uvicorn) in background
echo "Starting backend (uvicorn) in $BACKEND_DIR on port 8008..."
# It's expected that the backend has a working venv or your system python can run uvicorn
pushd "$BACKEND_DIR" >/dev/null
# Try to use virtualenv if available
if [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi
# Start uvicorn; output goes to log files (backgrounded in current shell so $! is available)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload 2>&1 | python3 -u -c "import sys,time
for l in sys.stdin:
  sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)
  sys.stdout.flush()" >> "$ROOT_DIR/logs/uvicorn.log" 2>/dev/null &
UVICORN_PID=$!
echo "uvicorn started (pid $UVICORN_PID) - logs: $ROOT_DIR/logs/uvicorn.log"
popd >/dev/null

# Start ngrok and point it at 8008
echo "Starting ngrok to expose port 8008..."
nohup ngrok http 8008 --log=stdout 2>&1 | python3 -u -c "import sys,time
for l in sys.stdin:
  sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)
  sys.stdout.flush()" >> "$ROOT_DIR/logs/ngrok.log" 2>/dev/null &
NGROK_PID=$!

# Ensure we clean up children on exit
cleanup() {
  echo "Stopping ngrok (pid $NGROK_PID) and uvicorn (pid $UVICORN_PID)"
  kill $NGROK_PID 2>/dev/null || true
  kill $UVICORN_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for ngrok API to be available
echo "Waiting for ngrok to report tunnels (this may take a few seconds)..."
for i in {1..30}; do
  sleep 1
  if curl -s http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    break
  fi
done

TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels || true)
if [ -z "$TUNNELS_JSON" ]; then
  echo "Failed to query ngrok API at http://127.0.0.1:4040/api/tunnels"
  echo "Check $ROOT_DIR/logs/ngrok.log for details"
  exit 1
fi

# Parse the public URL for the first http tunnel using python for robustness
PUBLIC_URL=$(printf "%s" "$TUNNELS_JSON" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin)
  for t in d.get('tunnels',[]):
    if t.get('proto')=='http':
      print(t.get('public_url'))
      sys.exit(0)
  print('')
except Exception:
  print('')
")

if [ -z "$PUBLIC_URL" ]; then
  echo "Could not determine ngrok public URL. See $ROOT_DIR/logs/ngrok.log"
  exit 1
fi

echo "ngrok public URL: $PUBLIC_URL"

# Compose API URL expected by the frontend
API_URL="$PUBLIC_URL/api/v1/chat/message"

# Start frontend with REACT_APP_API_URL set so the dev server uses the ngrok backend
echo "Starting frontend with REACT_APP_API_URL=$API_URL"
cd "$FRONTEND_DIR"
REACT_APP_API_URL="$API_URL" npm start

# wait for frontend to exit, then cleanup will run
wait
