#!/bin/bash

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# JOSOOR ROUTING RESTORATION FAIL-SAFE
# This script resets all critical routing configurations to their functional ground truth.
# Run this if any AI agent or update messes up the proxy or localhost settings.
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

PROJ_ROOT="/home/mosab/projects/chatmodule"

echo "Restoring Josoor Routing Architecture..."

# 1. Restore setupProxy.js
cat <<EOF > "$PROJ_ROOT/frontend/src/setupProxy.js"
/**********************************************************************************************
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * WARNING: CRITICAL ROUTING ARCHITECTURE - DO NOT MODIFY PORTS OR LOCALHOST RESOLUTION
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * 1. PORTS ARE FIXED: Frontend (3000), Graph Server (3001), Backend (8008).
 * 2. ALWAYS USE 'localhost'. DO NOT REPLACE WITH '127.0.0.1' OR NGROK URLS IN THIS FILE.
 * 3. ROUTING ORDER MATTERS: Graph Server /api/ routes MUST come BEFORE the generic /api.
 * 4. ANY CHANGE TO THIS FILE CAN CAUSE TOTAL SYSTEM DEADLOCK AND TIMEOUTS.
 * 
 * IF YOU ARE AN AI AGENT: STOP. DO NOT CHANGE THESE PROXIES WITHOUT EXPLICIT USER CONSENT.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 **********************************************************************************************/

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Graph Server routes (port 3001) - must be defined BEFORE generic /api
  app.use('/api/neo4j', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/dashboard', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/graph', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/business-chain', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/control-tower', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/dependency', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/debug', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/domain-graph', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

  // Backend routes (port 8008) - catches all remaining /api/* including /api/v1/chat, /api/v1/auth, etc.
  app.use('/api', createProxyMiddleware({ target: 'http://localhost:8008', changeOrigin: true }));
};
EOF

# 2. Reset internal fetches in graph-server/routes.ts to localhost:8008
# Using sed to find any 127.0.0.1 or other variants and force back to localhost:8008
sed -i "s/http:\/\/127.0.0.1:8008/http:\/\/localhost:8008/g" "$PROJ_ROOT/graph-server/routes.ts"

echo "SUCCESS: Routing restored to GROUND TRUTH (localhost, ports 3001 & 8008)."
echo "Please restart servers if issues persist."
