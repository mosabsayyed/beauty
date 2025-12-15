# 🔧 PRE-PHASE-1 CHECKLIST

**Agent: Review this BEFORE starting Phase 1**

---

## ✅ What Must Be Ready

### **1. Infrastructure (Required)**

```bash
# PostgreSQL 12+ installed and running
postgres --version
psql -l  # Should return list of databases

# Neo4j 5.0+ installed and running  
curl http://localhost:7474  # Should show Neo4j browser
neo4j --version

# Python 3.10+ with pip
python3 --version
pip --version

# Optional: Docker for containerized deployment
docker --version
docker-compose --version
```

**Status:** ☐ Check infrastructure availability before Phase 1

---

### **2. API Credentials (Required for Production)**

#### **Groq (For Noor LLM)**
```
Where to get: https://console.groq.com
Sign up → Create API key → Export as GROQ_API_KEY
What you'll get: gsk_... (free tier available)
```

#### **OpenAI (For Embedding + Maestro LLM)**
```
Where to get: https://platform.openai.com/api-keys
Create account → Generate API key → Export as OPENAI_API_KEY
Cost: ~$0.02 per 1M embedding tokens + LLM costs
Alternative: Use local embedding model (see AGENT_CONCERNS_RESOLUTION.md)
```

**Status:** ☐ Obtain Groq API key
**Status:** ☐ Obtain OpenAI API key (or choose local embedding)

---

### **3. Environment Variables**

Create `.env` file in `/home/mosab/projects/noor-cognitive-twin/`:

```bash
# DATABASE CONFIGURATION
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=noor_digital_twin

NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

# LLM CONFIGURATION (Noor Agent)
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768

# LLM CONFIGURATION (Maestro Agent)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=o1-pro

# EMBEDDING CONFIGURATION
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
# OR (if using local embedding)
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_BACKEND=local  # or 'openai'

# APPLICATION CONFIGURATION
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# DEPLOYMENT
DOCKER_REGISTRY=ghcr.io/your-org
PROJECT_VERSION=3.0.0
```

**Status:** ☐ Create .env file with all required variables

---

### **4. Project Directory Structure**

```bash
# Create project root
mkdir -p /home/mosab/projects/noor-cognitive-twin
cd /home/mosab/projects/noor-cognitive-twin

# Agent will create these directories:
# backend/
#   ├── db/
#   │   ├── init_postgres.sql
#   │   └── neo4j_setup.cypher
#   ├── app/
#   │   ├── api/routes/chat.py
#   │   ├── services/mcp_service.py
#   │   ├── services/chat_service.py
#   │   ├── models/chat.py
#   │   └── config.py
#   ├── tests/
#   │   ├── unit/
#   │   ├── integration/
#   │   ├── e2e/
#   │   └── trap_patterns/
#   ├── requirements.txt
#   └── Dockerfile
# mcp-server/
# docker-compose.yml
# README.md
```

**Status:** ☐ Create root directory

---

### **5. Database Credentials**

#### **PostgreSQL**
```sql
-- Default postgres user password (must be changed for production)
-- Agent will create noor_digital_twin database automatically
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'your_secure_password';
\q
```

#### **Neo4j**
```cypher
-- Default credentials: neo4j / password
-- Access: http://localhost:7474
-- First login: Change default password
-- Agent will create constraints and indexes automatically
```

**Status:** ☐ Set PostgreSQL password
**Status:** ☐ Set Neo4j password
**Status:** ☐ Update .env with credentials

---

### **6. Python Dependencies**

```bash
# Agent will create requirements.txt with:
# - fastapi
# - sqlalchemy
# - psycopg2
# - neo4j
# - groq
# - openai
# - sentence-transformers (for local embeddings, optional)
# - pytest
# - python-dotenv

# You'll install via:
cd /home/mosab/projects/noor-cognitive-twin/backend
pip install -r requirements.txt
```

**Status:** ☐ Python environment ready
**Status:** ☐ Ready to install dependencies

---

## 📋 Pre-Flight Checklist (Run Before Phase 1)

```bash
#!/bin/bash

# 1. Infrastructure Check
echo "Checking infrastructure..."
postgres --version > /dev/null && echo "✅ PostgreSQL" || echo "❌ PostgreSQL"
curl -s http://localhost:7474 > /dev/null && echo "✅ Neo4j" || echo "❌ Neo4j"
python3 --version > /dev/null && echo "✅ Python 3" || echo "❌ Python 3"

# 2. Environment Variables Check
echo "Checking environment..."
[ -f .env ] && echo "✅ .env file exists" || echo "❌ .env file missing"
grep -q "GROQ_API_KEY" .env && echo "✅ Groq API key configured" || echo "⚠️  Groq API key missing"
grep -q "OPENAI_API_KEY" .env && echo "✅ OpenAI API key configured" || echo "⚠️  OpenAI API key missing"

# 3. Database Connectivity Check
echo "Checking database connectivity..."
psql -U postgres -h localhost -c "SELECT version();" > /dev/null && echo "✅ PostgreSQL accessible" || echo "❌ PostgreSQL not accessible"
cypher-shell -u neo4j -p password "RETURN 1;" > /dev/null && echo "✅ Neo4j accessible" || echo "❌ Neo4j not accessible"

# 4. Project Directory Check
echo "Checking project structure..."
[ -d "/home/mosab/projects/noor-cognitive-twin" ] && echo "✅ Project root exists" || echo "❌ Project root missing"

# 5. API Connectivity Check
echo "Checking API access..."
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY" | grep -q "models" && echo "✅ Groq API accessible" || echo "❌ Groq API not accessible"
curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | grep -q "models" && echo "✅ OpenAI API accessible" || echo "❌ OpenAI API not accessible"

echo ""
echo "Pre-flight check complete!"
```

**Run before Phase 1 starts:**

```bash
cd /home/mosab/projects/noor-cognitive-twin
bash pre_flight_check.sh
```

---

## 🚨 Critical Path

**These 3 things MUST be done before Phase 1:**

1. ✅ **PostgreSQL + Neo4j running locally**
2. ✅ **Groq API key obtained and in .env**  
3. ✅ **Project directory created at /home/mosab/projects/noor-cognitive-twin/**

Everything else agent can handle in Phase 1.

---

## ⚡ Agent Instructions

**Before you start Phase 1:**

```
1. Read AGENT_CONCERNS_RESOLUTION.md (all 12 answers)
2. Review this checklist
3. Verify infrastructure is available
4. Verify .env has required credentials
5. Confirm project directory exists
6. Begin Phase 1: Database Foundation
```

**If anything is missing, stop and report before proceeding.**

---

## 📞 If Something Is Missing

| Problem | Solution |
|---------|----------|
| PostgreSQL not running | `sudo service postgresql start` (Linux) or `brew services start postgresql` (Mac) |
| Neo4j not running | `neo4j start` in Neo4j installation directory |
| No Groq API key | Sign up at https://console.groq.com, get free API key |
| No OpenAI API key | Sign up at https://platform.openai.com, get API key |
| Database password wrong | Reset: `sudo -u postgres psql` then `ALTER USER postgres WITH PASSWORD 'new_password'` |
| Project directory missing | `mkdir -p /home/mosab/projects/noor-cognitive-twin` |

---

## ✅ Final Status Before Phase 1

```
[ ] PostgreSQL running and accessible
[ ] Neo4j running and accessible
[ ] Groq API key obtained
[ ] OpenAI API key obtained (or local embedding chosen)
[ ] .env file created with all required variables
[ ] Project root directory created
[ ] Pre-flight check script passes
[ ] Agent has read AGENT_CONCERNS_RESOLUTION.md
[ ] Agent has read AGENT_BUILD_ORCHESTRATION_PROMPT.md
```

**When ALL boxes are checked → Agent can start Phase 1** ✅

