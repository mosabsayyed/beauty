## Local Dev Servers

- **Ngrok (web UI/API):** `127.0.0.1:4040`
- **MCP server (mcp-neo4j-cypher):** `127.0.0.1:8080`
- **MCP Router:** `127.0.0.1:8201`
- **Backend (FastAPI / uvicorn):** `0.0.0.0:8008`
- **Frontend (React Scripts):** `3000`
- **Graph server:** `3001`

## Run / Stop Scripts

- **Start backend & routing stack:** `./sb.sh`
- **Start full backend (router + MCP + backend):** `./sb.sh`
- **Start frontend + graph server:** `./sf1.sh`
- **Stop development services:** `./stop_dev.sh`
