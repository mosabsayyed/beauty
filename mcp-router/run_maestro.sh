#!/usr/bin/env bash
export MCP_ROUTER_PORT=8202
export MCP_ROUTER_NAME="maestro-router"
# Reuse the existing run_local.sh logic but on port 8202
./run_local.sh
