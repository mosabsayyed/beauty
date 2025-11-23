#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
HOOKS_DIR="$ROOT_DIR/.git/hooks"
mkdir -p "$HOOKS_DIR"
cp "$ROOT_DIR/scripts/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "Installed pre-commit hook to $HOOKS_DIR/pre-commit"
