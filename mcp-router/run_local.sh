#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
VENV_DIR="$ROOT_DIR/.venv-mcp-router"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  echo "Creating venv: $VENV_DIR"
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/python" -m pip install --upgrade pip
  "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/requirements.txt"
  "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/../../backend/requirements.txt" || true
  # Optional dev/test packages (prometheus_client and pytest-aiohttp)
  "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/requirements-dev.txt" || true
fi

source "$VENV_DIR/bin/activate"
export PYTHONPATH="$ROOT_DIR/src"

# Start the router server in background with log capture if requested
# Usage: START_SERVER_BG=1 LOG_FILE=/tmp/mcp-router.log MCP_ROUTER_HOST=127.0.0.2 MCP_ROUTER_PORT=8201 ./run_local.sh
START_SERVER_BG="${START_SERVER_BG:-0}"
LOG_FILE="${LOG_FILE:-$ROOT_DIR/mcp-router.log}"
MCP_ROUTER_HOST="${MCP_ROUTER_HOST:-127.0.0.2}"
MCP_ROUTER_PORT="${MCP_ROUTER_PORT:-8201}"
POPULATE_EMBEDS="${POPULATE_EMBEDS:-0}"
# Default to the repo-level backend script; careful path: mcp-router/../backend
EMBEDDINGS_SCRIPT_PATH="${EMBEDDINGS_SCRIPT_PATH:-$(realpath "$ROOT_DIR/../backend/embeddings_scripts/02_generate_embeddings.py")}" 
POPULATE_EMBEDS_LOG="${POPULATE_EMBEDS_LOG:-$ROOT_DIR/../backend/logs/populate_embeddings.log}"

SERVER_PID=""
EMBED_PID=""
start_background_server() {
  # If server already listening, skip
  if ss -ltnp 2>/dev/null | grep -q "${MCP_ROUTER_HOST}:${MCP_ROUTER_PORT}"; then
    echo "MCP Router already listening on ${MCP_ROUTER_HOST}:${MCP_ROUTER_PORT}; skipping start"
    return
  fi

  echo "Starting MCP Router in background (host=${MCP_ROUTER_HOST}, port=${MCP_ROUTER_PORT}) -> logging to ${LOG_FILE}"
  nohup "$VENV_DIR/bin/python" -m mcp_router.server >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!

  # Kill background server when the script exits
  trap 'if [ -n "${SERVER_PID}" ]; then echo "Stopping background server (${SERVER_PID})"; kill "${SERVER_PID}" || true; fi' EXIT INT TERM

  # Wait for the server to be ready (max 20s)
  for i in {1..20}; do
    # Check port listening
    if ss -ltnp 2>/dev/null | grep -q "${MCP_ROUTER_HOST}:${MCP_ROUTER_PORT}"; then
      echo "MCP Router is listening on ${MCP_ROUTER_HOST}:${MCP_ROUTER_PORT}"
      return
    fi
    sleep 1
  done
  echo "Timed out waiting for MCP Router to start; check ${LOG_FILE} for details"
}

if [ "$START_SERVER_BG" = "1" ]; then
  start_background_server
  # Show last 10 lines of the server log so developers can see immediate startup issues
  echo "Server log tail (first 10 lines):"
  sleep 1
  head -n 10 "$LOG_FILE" || true
fi

echo "Running unit tests..."
pytest "$ROOT_DIR/tests/unit" -q

# Optionally populate embeddings using the backend generator (uses OpenAI text-embedding-3-small)
if [ "$POPULATE_EMBEDS" = "1" ]; then
  echo "POPULATE_EMBEDS=1, attempting to run embeddings generator: $EMBEDDINGS_SCRIPT_PATH"
  if [ ! -f "$EMBEDDINGS_SCRIPT_PATH" ]; then
    echo "Embeddings script not found: $EMBEDDINGS_SCRIPT_PATH" >&2
  else
    echo "Populating embeddings (log -> $POPULATE_EMBEDS_LOG). This can be slow." 
    # Ensure logs dir exists
    mkdir -p "$(dirname "$POPULATE_EMBEDS_LOG")"
    # Run generator in the background but wait up to a short time for start so caller can continue
    # Prefer explicit EMBEDDINGS_PYTHON override, then backend venv, then system python
    EMBEDDINGS_PYTHON="${EMBEDDINGS_PYTHON:-}";
    BACKEND_VENV_PYTHON="$(realpath "$ROOT_DIR/../backend/.venv/bin/python" 2>/dev/null || true)"
    PY_CMD=${EMBEDDINGS_PYTHON:-${BACKEND_VENV_PYTHON:-python3}}
    echo "Running embeddings generator using: $PY_CMD"
    # Print which embedding model will be used by the backend generator for clarity
    echo "Embedding generator uses model: text-embedding-3-small (OpenAI)"

    # Warn if required env vars for the embedding generator are missing
    REQ_VARS=(OPENAI_API_KEY NEO4J_URI NEO4J_USERNAME NEO4J_PASSWORD)
    missing_envs=()
    for v in "${REQ_VARS[@]}"; do
      if [ -z "${!v:-}" ]; then
        missing_envs+=("$v")
      fi
    done
    if [ ${#missing_envs[@]} -ne 0 ]; then
      echo "WARNING: Missing environment variables for embeddings: ${missing_envs[*]}. The generator may fail if these are not set." >&2
    fi

    # Verify python environment has the 'openai' module
    if "$PY_CMD" -c "import openai" >/dev/null 2>&1; then
      nohup "$PY_CMD" "$EMBEDDINGS_SCRIPT_PATH" >"$POPULATE_EMBEDS_LOG" 2>&1 &
      EMBED_PID=$! 
      # Ensure generator is killed on script exit
      trap 'if [ -n "${EMBED_PID:-}" ]; then echo "Stopping embeddings generator (${EMBED_PID})"; kill "${EMBED_PID}" || true; fi' EXIT INT TERM
    else
      echo "ERROR: The selected Python ($PY_CMD) does not have the required 'openai' package installed." >&2
      echo "Please create or activate the backend venv (backend/.venv) and install backend requirements (backend/requirements.txt) or set EMBEDDINGS_PYTHON to the correct python executable." >&2
    fi
    if [ -n "${EMBED_PID:-}" ]; then
      echo "Embeddings generation started (PID=${EMBED_PID}), tailing logs for 5 seconds:"
      sleep 1
      tail -n 20 -f "$POPULATE_EMBEDS_LOG" &
      TAIL_PID=$!
      # Give a short startup window and then kill the tail but leave generation running
      sleep 5
      kill "$TAIL_PID" 2>/dev/null || true
      echo "Embeddings generator is running in background (PID=${EMBED_PID}). Logs: $POPULATE_EMBEDS_LOG"
    else
      echo "Embeddings generator not started due to missing dependencies or other errors."
    fi
  fi
fi

if [ "${INTEGRATION:-0}" = "1" ]; then
  echo "Running integration tests (this may skip if fastmcp isn't installed in this venv)..."
  PYTEST_ADDOPTS="-q" pytest "$ROOT_DIR/tests/integration" || true
else
  echo "Skipping integration tests; set INTEGRATION=1 to run them."
fi

echo "Done"
