#!/bin/bash
set -euo pipefail

# dev.sh - Master script to start all development services (MCP, Ngrok, Backend, Frontend)

# --- Configuration ---
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
MCP_PORT=${NEO4J_MCP_SERVER_PORT:-8080}
BACKEND_PORT=8008
PID_FILE=".dev_pids"
NGROK_API="http://127.0.0.1:4040/api/tunnels"

# --- Functions ---

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    source .env
fi

# Function to clean up background processes
cleanup() {
    echo -e "\n\nStopping all background services..."
    # Kill any running ngrok processes explicitly to free up the reserved domain
    if command -v pkill >/dev/null 2>&1; then
        pkill -f "ngrok http $MCP_PORT" || true
    fi

    if [ -f "$PID_FILE" ]; then
        PIDS=$(cat "$PID_FILE")
        if [ -n "$PIDS" ]; then
            echo "Killing processes: $PIDS"
            kill $PIDS 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    echo "Cleanup complete."
}

# Trap signals to ensure cleanup runs on exit
trap cleanup EXIT

# Function to start a service
start_service() {
    local name=$1
    local cmd=$2
    local cwd=$3

    echo "Starting $name in $cwd..."
    echo "CMD: (cd \"$cwd\" && nohup bash -c \"$cmd\" &)"
    # Use nohup to ensure the process continues after the script exits, and capture its PID
    # Launch background process and capture PID using a more reliable method
    (cd "$cwd" && nohup bash -c "$cmd") >/dev/null 2>&1 &
    local bg_pid=$!
    # Verify PID is valid before storing
    if [ -n "${bg_pid:-}" ] && kill -0 "$bg_pid" 2>/dev/null; then
        echo "$bg_pid" >> "$PID_FILE"
        echo "[$bg_pid] $name started."
    else
        echo "Error: Failed to start $name - could not capture valid PID"
        return 1
    fi
}

# Function to get ngrok public URL
get_ngrok_url() {
    for i in {1..10}; do
        sleep 1
        TUNNELS_JSON=$(curl -s "$NGROK_API" || true)
        if [ -n "$TUNNELS_JSON" ] && echo "$TUNNELS_JSON" | grep -q "public_url"; then
            # Use python to safely parse JSON and extract the public URL
            PUBLIC_URL=$(printf "%s" "$TUNNELS_JSON" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    for tunnel in tunnels:
        if tunnel.get('proto') == 'https' and tunnel.get('public_url'):
            print(tunnel.get('public_url'))
            sys.exit(0)
except (json.JSONDecodeError, KeyError, AttributeError):
    sys.exit(1)
" || true)
            if [ -n "$PUBLIC_URL" ]; then
                echo "$PUBLIC_URL"
                return 0
            fi
        fi
    done
    return 1
}

# --- Main Execution ---

# 1. Clear previous PIDs and create log directories
rm -f "$PID_FILE"
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$FRONTEND_DIR/logs"
mkdir -p "logs"

# 2. Activate venv if present (for Python services)
VENV_ACTIVATE=""
if [ -f ".venv/bin/activate" ]; then
  VENV_ACTIVATE="source .venv/bin/activate && "
fi

# 3. Start MCP Server (Neo4j Cypher)
# This is the service the LLM will call via ngrok.
MCP_CMD="${VENV_ACTIVATE}.venv/bin/mcp-neo4j-cypher --transport http --server-host 127.0.0.1 --server-port $MCP_PORT --server-path /mcp/ --db-url $NEO4J_URI --username $NEO4J_USERNAME --password $NEO4J_PASSWORD --database $NEO4J_DATABASE 2>&1 | python3 -u -c \"import sys,time\nfor l in sys.stdin:\n    sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)\n    sys.stdout.flush()\" >> \"$BACKEND_DIR/logs/mcp_server.log\""
if ss -ltnp 2>/dev/null | grep -q "127.0.0.1:$MCP_PORT"; then
    echo "MCP port $MCP_PORT already in use; skipping start to avoid duplicate bind. Check existing process." 
else
    if [ -f ".venv/bin/mcp-neo4j-cypher" ]; then
        start_service "MCP Server (Neo4j)" "$MCP_CMD" "."
    else
        echo "Error: MCP server executable not found. Please ensure it is installed in the venv."
        exit 1
    fi
fi

# 4. Start ngrok to expose MCP (port $MCP_PORT)
if command -v ngrok >/dev/null 2>&1; then
    # Pipe ngrok output through timestamping and append to log (do not overwrite)
    start_service "Ngrok Tunnel (MCP)" "ngrok http $MCP_PORT --log=stdout 2>&1 | python3 -u -c \"import sys,time\nfor l in sys.stdin:\n    sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)\n    sys.stdout.flush()\" >> logs/ngrok.log" "."
else
    echo "Error: ngrok not found. Please install ngrok and authenticate it."
    exit 1
fi

# 5. Wait for ngrok URL and export it for the backend
echo "Waiting for ngrok public URL for MCP tool use..."
NGROK_PUBLIC_URL=$(get_ngrok_url)

if [ -z "$NGROK_PUBLIC_URL" ]; then
    echo "Error: Failed to get ngrok public URL. Check logs/ngrok.log"
    exit 1
fi

export NGROK_PUBLIC_URL
echo "✅ NGROK_PUBLIC_URL exported: $NGROK_PUBLIC_URL"

# 6. Start Backend FastAPI (uvicorn)
# The backend needs NGROK_PUBLIC_URL to pass to the LLM for tool calling.
BACKEND_CMD="${VENV_ACTIVATE}uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload 2>&1 | python3 -u -c \"import sys,time\nfor l in sys.stdin:\n    sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)\n    sys.stdout.flush()\" >> logs/uvicorn.log"
start_service "Backend FastAPI" "$BACKEND_CMD" "$BACKEND_DIR"

# 7. Start Frontend (Vite)
# Frontend needs to know the local backend URL (port 8008)
# Set PORT=3001 to avoid conflicts with other services defaulting to 3000
start_service "Frontend (Vite)" "PORT=3000 REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api/v1/chat/message npm start 2>&1 | python3 -u -c \"import sys,time\nfor l in sys.stdin:\n    sys.stdout.write(time.strftime('[%Y-%m-%d %H:%M:%S] ')+l)\n    sys.stdout.flush()\" >> $FRONTEND_DIR/logs/frontend.log" "$FRONTEND_DIR"

echo -e "\nAll services started. Press Ctrl+C to stop them."

# Keep the main script running until interrupted
wait