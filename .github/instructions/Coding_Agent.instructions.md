---
applyTo: '**'
---

# JOSOOR Codebase Navigation

## 🚨 CRITICAL: Start Here

Before doing ANY work on this codebase, read these files in order:

1. **Entry Point:** `/00_START_HERE.md` - Ports, run commands, quick navigation
2. **Backend Work:** `/docs/BACKEND_ARCHITECTURE.md` - Full backend reference
3. **Frontend Work:** `/docs/FRONTEND_ARCHITECTURE.md` - Full frontend reference

## Quick Reference

### Servers & Ports
| Service | Port |
|---------|------|
| Frontend (React/Vite) | 3000 |
| Backend (FastAPI) | 8008 |
| Graph Server | 3001 |
| MCP Router Noor | 8201 |
| MCP Router Maestro | 8202 |

### Run Commands
```bash
./sb.sh    # Backend + MCP (routers + Neo4j MCP server)
./sf1.sh   # Frontend + Graph server
./stop_dev.sh  # Stop all
```

### Key Facts
- **Backend:** FastAPI on port 8008, uses Supabase + Neo4j
- **Frontend:** React 19 + Vite on port 3000
- **Styling:** CSS variables from `theme.css` — **NO TAILWIND**
- **Languages:** English + Arabic (RTL support)

### Directory Structure
```
/backend/app/           # FastAPI application
  ├── main.py           # Entry point
  ├── api/routes/       # API endpoints
  ├── services/         # Business logic (orchestrator, etc.)
  └── db/               # Database clients

/frontend/src/          # React application
  ├── App.tsx           # Entry point
  ├── pages/            # Route pages
  ├── components/       # UI components
  ├── lib/services/     # API clients
  └── styles/           # CSS files (use theme.css variables)
```

## Do NOT
- Use Tailwind classes (use CSS variables)
- Assume port 5173 (it's 3000)
- Skip reading architecture docs
- Make changes without understanding the system
