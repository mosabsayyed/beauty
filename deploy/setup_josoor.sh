#!/usr/bin/env bash
set -euo pipefail

# JOSOOR Full Deployment Script (Linux)
# - Installs system dependencies, Node.js 20 LTS, Python venvs
# - Builds frontend and configures Nginx
# - Registers PM2 processes for backend+MCP stack (sb.sh) and graph server (sf1.sh)
# - Sets PM2 startup with systemd
#
# Assumptions:
# - Repo already cloned at $REPO_DIR (defaults to current directory)
# - Backend env in backend/.env; Frontend env in frontend/.env
# - You will provide valid Supabase + Neo4j + LLM keys in backend/.env
#
# Usage:
#   sudo bash deploy/setup_josoor.sh [--domain example.com] [--repo /home/USER/projects/chatmodule]
#

DOMAIN="localhost"
REPO_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"; shift 2;;
    --repo)
      REPO_DIR="$2"; shift 2;;
    *)
      echo "Unknown arg: $1"; exit 1;;
  esac
done

echo "==> Using DOMAIN=$DOMAIN"
echo "==> Using REPO_DIR=$REPO_DIR"

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (use sudo)." >&2
  exit 1
fi

echo "==> Installing base system packages"
apt-get update -y
apt-get install -y git curl wget build-essential pkg-config ca-certificates nginx python3 python3-venv python3-pip gnupg

echo "==> Installing Node.js 20 (Nodesource)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//')" != 20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> Installing PM2 globally"
npm install -g pm2
pm2 -v

echo "==> Installing pm2-logrotate"
pm2 install pm2-logrotate || true
pm2 set pm2-logrotate:max_size 100M || true
pm2 set pm2-logrotate:retain 10 || true

echo "==> Preparing Python backend venv"
cd "$REPO_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip wheel

# Install backend dependencies. If requirements.txt exists, use it; else install a minimal set.
if [[ -f requirements.txt ]]; then
  pip install -r requirements.txt
else
  pip install fastapi uvicorn[standard] httpx python-jose[cryptography] passlib[bcrypt] pydantic neo4j opentelemetry-sdk opentelemetry-api opentelemetry-instrumentation
  # Supabase client
  pip install supabase
fi
deactivate

echo "==> Preparing MCP router venvs (if present)"
if [[ -d "$REPO_DIR/mcp-router" ]]; then
  cd "$REPO_DIR/mcp-router"
  python3 -m venv .venv-mcp-router
  source .venv-mcp-router/bin/activate
  if [[ -f requirements.txt ]]; then
    pip install -r requirements.txt
  else
    # FastMCP and common tool deps; adjust if your router has a specific list
    pip install fastapi uvicorn[standard]
  fi
  deactivate
fi

echo "==> Installing frontend dependencies and building"
cd "$REPO_DIR/frontend"
npm install
npm run build

echo "==> Configuring Nginx site for JOSOOR"
SITE_SRC="$REPO_DIR/deploy/nginx/josoor.conf"
SITE_DST="/etc/nginx/sites-available/josoor"
if [[ ! -f "$SITE_SRC" ]]; then
  echo "ERROR: Nginx site file not found at $SITE_SRC" >&2
  exit 1
fi
sed "s#__ROOT__#${REPO_DIR}/frontend/dist#g" "$SITE_SRC" | sed "s#__DOMAIN__#${DOMAIN}#g" > "$SITE_DST"
ln -sf "$SITE_DST" /etc/nginx/sites-enabled/josoor
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Registering PM2 processes"
cd "$REPO_DIR"

# Backend + MCP routers via sb.sh
if [[ -f ./sb.sh ]]; then
  pm2 start ./sb.sh --name josoor-backend-stack --interpreter bash -- --fg
else
  echo "WARN: sb.sh not found; starting uvicorn directly"
  pm2 start "$REPO_DIR/backend/.venv/bin/uvicorn" --name josoor-backend \
    -- app.main:app --host 0.0.0.0 --port 8008 --reload
fi

# Graph server via sf1.sh (it starts graph on :3001; frontend is served by Nginx static build)
if [[ -f ./sf1.sh ]]; then
  pm2 start ./sf1.sh --name josoor-graph --interpreter bash
else
  echo "WARN: sf1.sh not found; attempting generic graph-server start"
  if [[ -d "$REPO_DIR/graph-server" ]]; then
    cd "$REPO_DIR/graph-server"
    npm install
    pm2 start npm --name graph-server -- start
    cd "$REPO_DIR"
  fi
fi

echo "==> Saving PM2 config and enabling system startup"
pm2 save
pm2 startup systemd -u "$SUDO_USER" --hp "/home/$SUDO_USER" | bash

echo "==> Summary"
echo "Nginx: serving frontend build from $REPO_DIR/frontend/dist at http://$DOMAIN"
echo "Backend API proxied at /api/v1 -> http://127.0.0.1:8008"
echo "Graph routes proxied to http://127.0.0.1:3001 via Nginx"
echo "PM2 processes:"; pm2 ls || true
echo "Nginx status:"; systemctl status nginx --no-pager || true
echo "Done. Verify environment variables in backend/.env before use."
