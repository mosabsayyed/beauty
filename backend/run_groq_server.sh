#!/usr/bin/env bash
# Robust startup script for local dev
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
# Ensure we run from the backend package directory so `app` is importable
# Determine the backend directory (script is located in backend/)
BACKEND_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$BACKEND_DIR"

# Ensure Python can import the `app` package when uvicorn runs
export PYTHONPATH="$BACKEND_DIR":${PYTHONPATH-}
# Activate repo-level virtualenv if present
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
	# shellcheck disable=SC1091
	source "$ROOT_DIR/.venv/bin/activate"
fi

uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
