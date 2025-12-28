Graphv001 Integration Implementation Plan (Final)
Goal
Integrate the fully functional Graphv001 application into the chat module with a real Neo4j connection.

Integration Point: "Demo with Noor" button -> Opens Canvas in Zen Mode -> Shows Graph App.
Architecture: Sidecar Node.js server (Port 3001) + Vite Proxy.
Data Strategy: Real DB connection with a Static Snapshot Fallback for large queries.
User Review Required
NOTE

Proxy Explanation: We use a Vite Proxy (/api/neo4j -> localhost:3001) because:

Avoids CORS: Browsers block requests between ports (3000 -> 3001) by default. The proxy makes it look like one server.
Preserves Logic: We can run the original Graphv001 server code "as is" without rewriting 1000+ lines of Cypher queries into the main Python backend.
IMPORTANT

Static Snapshot Strategy:

We will create a 
static_snapshot.json
 file in the frontend.
Logic: If the user requests a graph with a limit > 1000 nodes (configurable), the app will SKIP the DB call and load this static file instead.
Proposed Changes
Phase 1: Sidecar Server Setup
[NEW] Create Graph Server Directory
Target: frontend/graph-server/

Copy Graphv001/server/ contents
Copy Graphv001/package.json (server dependencies only)
Create tsconfig.json for server
[MODIFY] Script Modifications
1. Start Script (sf1.sh): Modify sf1.sh to start the graph server sidecar before the main frontend:

# Inside sf1.sh
GRAPH_SERVER_DIR="$FRONTEND_DIR/graph-server"
echo "Starting Graph Server Sidecar (Port 3001)..."
(cd "$GRAPH_SERVER_DIR" && npm install && nohup npm run dev -- --port 3001 >> "$LOG_DIR/graph_server.log" 2>&1 &)
2. Stop Script (stop_dev.sh): Ensure the graph server is killed:

# Inside stop_dev.sh
pkill -f "npm run dev -- --port 3001" 2>/dev/null || true
[MODIFY] Vite Configuration (Proxy Setup)
File: frontend/vite.config.ts

server: {
  proxy: {
    '/api/neo4j': 'http://localhost:3001',
    '/api/dashboard': 'http://localhost:3001',
    '/api/graph': 'http://localhost:3001',
    '/api/business-chain': 'http://localhost:3001',
    '/api/debug': 'http://localhost:3001'
  }
}
Phase 2: Frontend Migration & Snapshot Logic
[NEW] Component Migration
Target: frontend/src/components/graphv001/

Copy Graphv001/client/src/components -> frontend/src/components/graphv001/components
Copy Graphv001/client/src/pages/Dashboard.tsx -> frontend/src/components/graphv001/GraphDashboard.tsx
Copy Graphv001/client/src/lib -> frontend/src/components/graphv001/lib
[NEW] Static Snapshot File
File: frontend/src/components/graphv001/static_snapshot.json

{
  "nodes": [],
  "links": [],
  "timestamp": "2024-01-01T00:00:00Z",
  "note": "Paste your full Cypher query result here"
}
[MODIFY] GraphDashboard.tsx (Data Logic)
Refactor the data fetching logic to implement the threshold check:

import staticSnapshot from './static_snapshot.json';
const fetchGraphData = async (filters: any) => {
  if (filters.limit > 1000) {
    return staticSnapshot;
  }
  const response = await fetch(buildGraphUrl(filters));
  return response.json();
};
[NEW] Install Frontend Dependencies
File: frontend/package.json

{
  "dependencies": {
    "react-force-graph-2d": "^1.25.0",
    "react-force-graph-3d": "^1.25.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
Phase 3: Canvas & Quick Action Integration
[MODIFY] UniversalCanvas Component
File: frontend/src/components/chat/UniversalCanvas.tsx

import { GraphDashboard } from '../graphv001/GraphDashboard';
if (type === 'graphv001') {
  return (
    <div className="w-full h-full bg-gray-900 text-white overflow-hidden">
      <GraphDashboard />
    </div>
  );
}
[MODIFY] CanvasPanel Component
File: frontend/src/components/chat/CanvasPanel.tsx

Auto-trigger Zen mode when artifact_type === 'graphv001'.
[MODIFY] ChatAppPage & Sidebar
Implement handleOpenGraphDemo to open Canvas with type: 'graphv001'.
Wire up "Demo with Noor" button.
Phase 4: Environment Configuration
[MODIFY] Environment Variables
File: frontend/graph-server/.env (and root .env)

NEO4J_AURA_URI=...
NEO4J_AURA_USERNAME=...
NEO4J_AURA_PASSWORD=...
NEO4J_DATABASE=neo4j
PORT=3001
Failure Analysis (End-State)
1. Sidecar Server Failure
Scenario: The Node.js sidecar (port 3001) crashes or fails to start.
Symptom: Frontend receives 502 Bad Gateway or 504 Gateway Timeout from Vite proxy when calling /api/*.
Mitigation: Frontend GraphDashboard must have error boundaries and show a "Connection Failed" message, possibly offering a retry button.
2. Port Conflict (3001)
Scenario: Port 3001 is already in use by another process.
Symptom: Sidecar fails to bind. sf1.sh might continue, but API calls will fail.
Mitigation: sf1.sh should check if port 3001 is free before starting.
3. Database Connection Failure
Scenario: Real Neo4j DB is down or credentials in .env are wrong.
Symptom: Sidecar starts, but returns 500 Internal Server Error for API calls.
Mitigation: The /api/neo4j/health endpoint check in GraphDashboard should detect this and show a specific "Database Disconnected" error.
4. Zombie Processes
Scenario: stop_dev.sh fails to kill the sidecar.
Symptom: Next sf1.sh run fails due to port conflict.
Mitigation: stop_dev.sh explicitly kills processes matching the sidecar command.
Verification Plan
Manual Verification
Setup:
Run npm install in frontend
Run npm install in frontend/graph-server
Start Main App: npm run dev (Port 3000)
Start Graph Server: cd frontend/graph-server && npm run dev (Port 3001)
Connection Test:
Verify http://localhost:3001/api/neo4j/health returns {status: "connected"}
Integration Test:
Click "Demo with Noor"
Verify Canvas opens in Zen Mode
Verify Dashboard loads data from Neo4j (Network tab shows successful calls to /api/...)
 Verify graph visualization loads from Neo4j
 Confirm static snapshot fallback works
 Ensure sidecar server starts/stops correctly
 Test API proxying
 Verify builds (frontend and graph-server) pass without errors