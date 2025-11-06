#!/usr/bin/env bash
# Robust startup script for local dev
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"
# Activate repo-level virtualenv if present
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
	# shellcheck disable=SC1091
	source "$ROOT_DIR/.venv/bin/activate"
fi

uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
