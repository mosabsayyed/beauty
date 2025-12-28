# Phase 1: Investor Demo Execution Plan (TODAY)

**Execution Mode:** 4 parallel workstreams | Target: 8–10 hours | Ready to Demo: Tonight

---

## Workstream 1: Backend Model Switching (3–4 hours)

### Step 1.1: Add Environment Variables

**File:** `/backend/app/config/__init__.py`

Add to `Settings` class:
```python
# LLM Model Selection (Groq)
GROQ_MODEL_PRIMARY = os.getenv("GROQ_MODEL_PRIMARY", "openai/gpt-oss-20b")
GROQ_MODEL_FALLBACK = os.getenv("GROQ_MODEL_FALLBACK", "llama-3.3-70b-versatile")
GROQ_MODEL_ALT = os.getenv("GROQ_MODEL_ALT", "openai/gpt-oss-120b")

# Local Model (Ollama / llama.cpp)
LOCAL_LLM_ENABLED = os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
LOCAL_MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "llama2:7b-q4_K_M")

# Demo Settings
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
DEMO_TEMPERATURE = float(os.getenv("DEMO_TEMPERATURE", "0"))  # 0 = deterministic
```

### Step 1.2: Modify Orchestrator (Model Selection Logic)

**File:** `/backend/app/services/orchestrator_universal.py`

Replace the `__init__` method to add model selection:

```python
class CognitiveOrchestrator:
    def __init__(self, persona: str = "noor", model_override: str = None):
        self.persona = persona.lower()
        self.model_override = model_override
        
        # Determine which LLM to use
        if settings.LOCAL_LLM_ENABLED and self._is_local_available():
            self.llm_backend = "local"
            self.llm_model = settings.LOCAL_MODEL_NAME
            self.ollama_url = settings.OLLAMA_URL
            print(f"🔵 Using local LLM: {self.llm_model}")
        else:
            self.llm_backend = "groq"
            # Model selection: override > primary
            self.llm_model = model_override if model_override else settings.GROQ_MODEL_PRIMARY
            # Whitelist allowed models
            allowed_models = [
                settings.GROQ_MODEL_PRIMARY,
                settings.GROQ_MODEL_FALLBACK,
                settings.GROQ_MODEL_ALT
            ]
            if self.llm_model not in allowed_models:
                print(f"⚠️  Model {self.llm_model} not whitelisted; using PRIMARY")
                self.llm_model = settings.GROQ_MODEL_PRIMARY
            
            self.groq_api_key = os.getenv("GROQ_API_KEY")
            self.groq_endpoint = "https://api.groq.com/openai/v1/chat/completions"
            print(f"🟠 Using Groq LLM: {self.llm_model}")
        
        # MCP Router URL (persona-specific)
        if self.persona == "noor":
            self.mcp_router_url = os.getenv("NOOR_MCP_ROUTER_URL", "http://127.0.0.1:8201")
        else:
            self.mcp_router_url = os.getenv("MAESTRO_MCP_ROUTER_URL", "http://127.0.0.1:8202")
    
    def _is_local_available(self) -> bool:
        """Check if Ollama/local LLM is reachable."""
        try:
            import requests
            resp = requests.get(f"{settings.OLLAMA_URL}/api/tags", timeout=2)
            return resp.status_code == 200
        except:
            print(f"⚠️  Local LLM unavailable at {settings.OLLAMA_URL}")
            return False
```

### Step 1.3: Add LLM Call Logic (Groq vs Local)

**File:** `/backend/app/services/orchestrator_universal.py`

Add helper methods:

```python
def _invoke_llm_with_tools(self, messages: List[Dict], tools: List[Dict] = None) -> Dict:
    """Route to Groq or local LLM."""
    
    if self.llm_backend == "local":
        return self._invoke_local_llm(messages)
    else:
        return self._invoke_groq_llm(messages, tools)

def _invoke_groq_llm(self, messages: List[Dict], tools: List[Dict] = None) -> Dict:
    """Call Groq API with tool support."""
    import requests
    
    headers = {
        "Authorization": f"Bearer {self.groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": self.llm_model,
        "messages": messages,
        "temperature": settings.DEMO_TEMPERATURE if settings.DEMO_MODE else 0.3,
        "max_tokens": 1200,
        "top_p": 0.8
    }
    
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"
    
    try:
        resp = requests.post(self.groq_endpoint, headers=headers, json=payload, timeout=30)
        if resp.status_code == 400:
            print(f"⚠️  Groq 400 error (likely oversized payload); trimming history...")
            # Trim history to last 3 messages
            messages = messages[-3:]
            payload["messages"] = messages
            resp = requests.post(self.groq_endpoint, headers=headers, json=payload, timeout=30)
        
        if resp.status_code != 200:
            raise Exception(f"Groq error: {resp.status_code} - {resp.text}")
        
        return resp.json()
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        # Fallback to next model
        if self.llm_model != settings.GROQ_MODEL_FALLBACK:
            print(f"🔄 Retrying with fallback model: {settings.GROQ_MODEL_FALLBACK}")
            self.llm_model = settings.GROQ_MODEL_FALLBACK
            return self._invoke_groq_llm(messages, tools)
        raise

def _invoke_local_llm(self, messages: List[Dict]) -> Dict:
    """Call local Ollama LLM (no tool support yet)."""
    import requests
    
    payload = {
        "model": self.llm_model,
        "messages": messages,
        "temperature": settings.DEMO_TEMPERATURE if settings.DEMO_MODE else 0.3,
        "stream": False
    }
    
    try:
        resp = requests.post(f"{self.ollama_url}/api/chat", json=payload, timeout=30)
        if resp.status_code != 200:
            raise Exception(f"Ollama error: {resp.status_code}")
        
        result = resp.json()
        # Wrap in OpenAI-like format for compatibility
        return {
            "choices": [{"message": {"content": result["message"]["content"]}}]
        }
    except Exception as e:
        print(f"❌ Local LLM error: {e}; falling back to Groq")
        self.llm_backend = "groq"
        self.llm_model = settings.GROQ_MODEL_PRIMARY
        return self._invoke_groq_llm(messages, None)
```

### Step 1.4: Update Chat Route to Accept Model Override

**File:** `/backend/app/api/routes/chat.py`

Modify the ChatRequest model and route:

```python
from pydantic import BaseModel, Optional

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[int] = None
    persona: Optional[str] = "noor"
    history: Optional[List[Dict[str, str]]] = None
    model_override: Optional[str] = None  # NEW: allow runtime override

@router.post("/message")
async def send_message(request: ChatRequest, current_user=Depends(get_current_user)):
    """Send a chat message."""
    
    # Validate model override
    allowed_models = [
        settings.GROQ_MODEL_PRIMARY,
        settings.GROQ_MODEL_FALLBACK,
        settings.GROQ_MODEL_ALT
    ]
    model_to_use = None
    if request.model_override:
        if request.model_override not in allowed_models:
            raise HTTPException(status_code=400, detail=f"Model not whitelisted: {request.model_override}")
        model_to_use = request.model_override
    
    # Create orchestrator with model override
    orchestrator = get_orchestrator_instance(
        persona_name=request.persona or "noor",
        model_override=model_to_use
    )
    
    # ... rest of the function remains the same
```

---

## Workstream 2: Named Chains Endpoint (2–3 hours)

### Step 2.1: Create Chains Service

**File:** `/backend/app/api/routes/chains.py` (NEW)

```python
from fastapi import APIRouter, HTTPException, Query
from app.db.neo4j_client import neo4j_client
from app.models import *
from typing import Optional, List, Dict

router = APIRouter()

# Pre-verified Cypher queries (from docs/verified_business_chains.md)
VERIFIED_CHAINS = {
    "SectorOps": """
        MATCH path = (n:SectorObjective)-[:HAS_POLICY]->(p:SectorPolicyTool)
        -[:APPLIES_TO_RECORD]->(ar:SectorAdminRecord)
        -[:INVOLVES_STAKEHOLDER]->(st:Stakeholder)
        -[:REPORTS_DATA_TRANSACTION]->(dt:DataTransaction)
        -[:INFORMS_PERFORMANCE]->(perf:SectorPerformance)
        -[:DEFINES_OBJECTIVE]->(n)
        WHERE n.id = $id AND n.year = $year
        RETURN collect(nodes(path)) as nodes, collect(relationships(path)) as edges
    """,
    "Strategy_to_Tactics_Priority": """
        MATCH path = (o:SectorObjective)-[:HAS_POLICY]->(p:SectorPolicyTool)
        -[:ENABLES_CAPABILITY]->(c:EntityCapability)
        -[:HAS_GAP]->(g:CapabilityGap)
        -[:ADDRESSED_BY_OPERATIONAL_LAYER]->(ol:OperationalLayer)
        -[:INCLUDES_PROJECT]->(pr:EntityProject)
        -[:DRIVES_CHANGE_ADOPTION]->(ca:ChangeAdoption)
        WHERE o.id = $id AND o.year = $year
        RETURN collect(nodes(path)) as nodes, collect(relationships(path)) as edges
    """,
    "Risk_Operate_Mode": """
        MATCH path = (c:EntityCapability)-[:FACES_RISK]->(r:EntityRisk)
        -[:IMPACTS_PERFORMANCE]->(p:SectorPerformance)
        WHERE c.id = $id AND c.year = $year
        RETURN collect(nodes(path)) as nodes, collect(relationships(path)) as edges
    """
}

@router.get("/chains/{chain_key}")
async def execute_chain(
    chain_key: str,
    id: str = Query(...),
    year: int = Query(...)
):
    """Execute a pre-verified business chain query."""
    
    if chain_key not in VERIFIED_CHAINS:
        raise HTTPException(
            status_code=400,
            detail=f"Chain not found. Available: {list(VERIFIED_CHAINS.keys())}"
        )
    
    cypher_query = VERIFIED_CHAINS[chain_key]
    
    try:
        result = neo4j_client.execute_query(cypher_query, {"id": id, "year": year})
        
        if not result or (result and len(result) == 0):
            return {
                "chain_key": chain_key,
                "id": id,
                "year": year,
                "clarification_needed": True,
                "missing_data": ["No data found for this id/year combination"],
                "nodes": [],
                "edges": [],
                "summary": f"No {chain_key} data available."
            }
        
        # Extract nodes and edges from result
        nodes = []
        edges = []
        for row in result:
            if row.get("nodes"):
                nodes.extend(row["nodes"])
            if row.get("edges"):
                edges.extend(row["edges"])
        
        summary = f"Found {len(nodes)} entities and {len(edges)} relationships in {chain_key} chain."
        
        return {
            "chain_key": chain_key,
            "id": id,
            "year": year,
            "clarification_needed": False,
            "missing_data": [],
            "nodes": [dict(n) for n in nodes],
            "edges": [dict(e) for e in edges],
            "summary": summary
        }
    
    except Exception as e:
        return HTTPException(
            status_code=500,
            detail=f"Chain execution failed: {str(e)}"
        )

@router.get("/chains")
async def list_chains():
    """List all available chains."""
    return {
        "chains": list(VERIFIED_CHAINS.keys()),
        "count": len(VERIFIED_CHAINS)
    }
```

### Step 2.2: Register Route

**File:** `/backend/app/main.py`

Add to route registration:

```python
from app.api.routes import chains

app.include_router(chains.router, prefix="/api/v1/chains", tags=["Chains"])
```

---

## Workstream 3: Frontend Quick-Action Buttons (2–3 hours)

### Step 3.1: Create Chains Service

**File:** `/frontend/src/lib/services/chainsService.ts` (NEW)

```typescript
import { API_BASE_URL, API_PATH_PREFIX } from './chatService';

function buildUrl(endpointPath: string) {
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${endpointPath}`;
}

export interface ChainResult {
  chain_key: string;
  id: string;
  year: number;
  clarification_needed: boolean;
  missing_data: string[];
  nodes: any[];
  edges: any[];
  summary: string;
}

export async function executeChain(
  chainKey: string,
  id: string,
  year: number
): Promise<ChainResult> {
  const url = buildUrl(`/chains/${chainKey}?id=${id}&year=${year}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Chain execution failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function listChains(): Promise<string[]> {
  const url = buildUrl('/chains');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list chains');
  }
  const data = await response.json();
  return data.chains;
}
```

### Step 3.2: Create Quick Chains Component

**File:** `/frontend/src/components/chat/QuickChainsPanel.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { executeChain, ChainResult } from '../../lib/services/chainsService';
import './QuickChainsPanel.css';

interface QuickActionChain {
  key: string;
  label: string;
  description: string;
  demo_id: string;
  demo_year: number;
}

const QUICK_CHAINS: QuickActionChain[] = [
  {
    key: 'SectorOps',
    label: '🔄 SectorOps Loop',
    description: 'Objective → Policy → AdminRecord → Stakeholder → Performance',
    demo_id: 'sector_001',
    demo_year: 2025
  },
  {
    key: 'Strategy_to_Tactics_Priority',
    label: '📊 Strategy→Tactics',
    description: 'Objective → Policy → Capability → Project → Adoption',
    demo_id: 'strategy_001',
    demo_year: 2025
  },
  {
    key: 'Risk_Operate_Mode',
    label: '⚠️ Risk Operate',
    description: 'Capability → Risk → Performance',
    demo_id: 'capability_001',
    demo_year: 2025
  }
];

export function QuickChainsPanel() {
  const [selectedChain, setSelectedChain] = useState<ChainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChainClick = async (chain: QuickActionChain) => {
    setLoading(true);
    setError(null);
    try {
      const result = await executeChain(chain.key, chain.demo_id, chain.demo_year);
      setSelectedChain(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute chain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-chains-panel">
      <h3>Quick Chains</h3>
      
      <div className="chain-buttons">
        {QUICK_CHAINS.map((chain) => (
          <button
            key={chain.key}
            className="chain-button"
            onClick={() => handleChainClick(chain)}
            disabled={loading}
            title={chain.description}
          >
            {chain.label}
          </button>
        ))}
      </div>

      {loading && <div className="chain-loading">Executing chain...</div>}

      {error && <div className="chain-error">Error: {error}</div>}

      {selectedChain && !loading && (
        <div className="chain-result">
          <div className="result-header">
            <h4>{selectedChain.chain_key}</h4>
            <div className="provenance">
              Data source: <strong>{selectedChain.chain_key}</strong> | year={selectedChain.year} | id={selectedChain.id}
            </div>
          </div>

          {selectedChain.clarification_needed ? (
            <div className="no-data">
              ℹ️ Data missing for this chain/id/year combination
            </div>
          ) : (
            <>
              <div className="result-summary">{selectedChain.summary}</div>
              <div className="result-counts">
                <span>📍 {selectedChain.nodes.length} entities</span>
                <span>🔗 {selectedChain.edges.length} relationships</span>
              </div>
              <button className="deep-dive-button">💬 Deep Dive</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3.3: Add Styles

**File:** `/frontend/src/components/chat/QuickChainsPanel.css` (NEW)

```css
.quick-chains-panel {
  padding: 1rem;
  background: var(--component-panel-bg);
  border: 1px solid var(--component-panel-border);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.quick-chains-panel h3 {
  margin: 0 0 1rem 0;
  color: var(--component-text-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chain-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.chain-button {
  padding: 0.75rem 1rem;
  background: var(--component-text-accent);
  color: var(--component-text-on-accent);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.chain-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.chain-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chain-loading {
  text-align: center;
  color: var(--component-text-secondary);
  font-size: 0.85rem;
  padding: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chain-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--component-color-danger);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.chain-result {
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid var(--component-text-accent);
  padding: 0.75rem;
  border-radius: 4px;
}

.result-header h4 {
  margin: 0 0 0.5rem 0;
  color: var(--component-text-primary);
  font-size: 0.95rem;
}

.provenance {
  font-size: 0.75rem;
  color: var(--component-text-muted);
  margin-bottom: 0.5rem;
}

.no-data {
  padding: 0.75rem;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 4px;
  color: var(--component-text-secondary);
  font-size: 0.85rem;
  text-align: center;
}

.result-summary {
  font-size: 0.85rem;
  color: var(--component-text-secondary);
  margin-bottom: 0.5rem;
}

.result-counts {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--component-text-muted);
  margin-bottom: 0.75rem;
}

.deep-dive-button {
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  color: var(--component-text-accent);
  border: 1px solid var(--component-text-accent);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.deep-dive-button:hover {
  background: var(--component-text-accent);
  color: var(--component-text-on-accent);
}
```

### Step 3.4: Integrate into ChatContainer

**File:** `/frontend/src/components/chat/ChatContainer.tsx`

Add import and render:

```typescript
import { QuickChainsPanel } from './QuickChainsPanel';

export function ChatContainer() {
  return (
    <div className="chat-container">
      {/* Existing code */}
      
      <aside className="chat-sidebar">
        {/* Existing sidebar code */}
        <QuickChainsPanel />
        {/* Rest of sidebar */}
      </aside>
      
      {/* Rest of chat container */}
    </div>
  );
}
```

---

## Workstream 4: Demo Prep & Validation (1–2 hours)

### Step 4.1: Create Demo Data (Pre-populated IDs)

**File:** `/docs/INVESTOR_DEMO_RUNBOOK.md` (NEW)

```markdown
# Investor Demo Runbook

## Pre-Demo Checklist (15 min before)

1. Start backend: `./sb.sh --fg`
2. Start frontend: `./sf1.sh`
3. Navigate to http://localhost:3000
4. Pre-warm Neo4j cache:
   - Open http://localhost:3000/admin/observability
   - Run each chain once manually (SectorOps, Strategy→Tactics, Risk)
   - Verify all < 500ms latency

## Demo Entities & IDs

| Chain | ID | Year | Expected Nodes | Expected Edges |
|-------|----|----|---|---|
| SectorOps | sector_001 | 2025 | 6–8 | 5–7 |
| Strategy→Tactics | strategy_001 | 2025 | 7–9 | 6–8 |
| Risk Operate | capability_001 | 2025 | 3–5 | 2–4 |

## Demo Script (5 minutes)

### Part 1: Overview (1 min)
1. Show observability dashboard: real-time metrics (query success, latency, model distribution).
2. Explain: "JOSOOR is a deterministic Control Tower for transformation PMO — no guesswork, just data."

### Part 2: Quick Chains Demo (2 min)
1. Click "SectorOps Loop" button.
2. Wait for result (~1–2s).
3. Point out: "Data source: SectorOps | year=2025 | id=sector_001" — completely traceable.
4. Explain: "This is not LLM hallucination; it's a verified query on our transformation graph."
5. Click "Deep Dive" button → shows AI analysis in chat (no LLM uncertainty).

### Part 3: Model Switch Demo (1.5 min)
1. Open browser console (F12).
2. Run: `localStorage.setItem('josoor_model_override', 'llama-3.3-70b-versatile')`
3. Refresh page.
4. Run same chain again → note similar latency but potentially better reasoning.
5. Explain: "We can switch between 20B (fast), 70B (quality), 120B (reasoning) based on need."

### Part 4: Local Fallback Option (0.5 min)
1. If time: show `LOCAL_LLM_ENABLED=true` config for offline testing.
2. Explain: "For offline environments or testing, we can run an 8B quantized model locally."

## Success Criteria

- [ ] All 3 chains execute < 2.5s round-trip
- [ ] No errors or 500s
- [ ] Results display with provenance visible
- [ ] "Data missing" shows gracefully (no hallucination)
- [ ] Model switch works (optional, if time permits)
- [ ] Demo stays within 5 minutes
```

### Step 4.2: Pre-Demo Test Script

**File:** `/backend/test_phase1.py` (NEW)

```python
import requests
import time
import json

BASE_URL = "http://localhost:8008/api/v1"

def test_chains():
    """Test all Phase 1 quick chains."""
    
    chains = [
        ("SectorOps", "sector_001", 2025),
        ("Strategy_to_Tactics_Priority", "strategy_001", 2025),
        ("Risk_Operate_Mode", "capability_001", 2025),
    ]
    
    print("\n🚀 Phase 1 Validation Tests\n")
    
    for chain_key, demo_id, year in chains:
        print(f"Testing: {chain_key}...")
        start = time.time()
        
        try:
            resp = requests.get(
                f"{BASE_URL}/chains/{chain_key}",
                params={"id": demo_id, "year": year},
                timeout=10
            )
            latency = time.time() - start
            
            if resp.status_code == 200:
                data = resp.json()
                nodes = len(data.get("nodes", []))
                edges = len(data.get("edges", []))
                print(f"  ✅ Success | {nodes} nodes | {edges} edges | {latency:.2f}s")
            else:
                print(f"  ❌ HTTP {resp.status_code}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print("\n✅ Phase 1 tests complete.\n")

if __name__ == "__main__":
    test_chains()
```

Run before demo:
```bash
cd /home/mosab/projects/chatmodule/backend
python test_phase1.py
```

---

## Environment Setup

### .env Configuration

**File:** `/backend/.env`

```env
# Phase 1: Model Switching
GROQ_MODEL_PRIMARY=openai/gpt-oss-20b
GROQ_MODEL_FALLBACK=llama-3.3-70b-versatile
GROQ_MODEL_ALT=openai/gpt-oss-120b

# Phase 1: Demo Mode (deterministic)
DEMO_MODE=true
DEMO_TEMPERATURE=0

# Phase 1: Local Model (optional)
LOCAL_LLM_ENABLED=false
# LOCAL_LLM_ENABLED=true  # Set to true to enable local Ollama
OLLAMA_URL=http://localhost:11434
LOCAL_MODEL_NAME=llama2:7b-q4_K_M

# Existing vars (no change)
GROQ_API_KEY=<your-key>
SUPABASE_URL=<your-url>
# ... (rest unchanged)
```

---

## Execution Order

1. **Workstream 1 (Backend Model Switching)** — 3–4 hours
   - Config env vars
   - Modify orchestrator + chat route
   - Test locally

2. **Workstream 2 (Named Chains Endpoint)** — 2–3 hours (parallel)
   - Create chains service
   - Register route
   - Test locally

3. **Workstream 3 (Frontend UI)** — 2–3 hours (parallel)
   - Create chains service
   - Build QuickChainsPanel component
   - Integrate into ChatContainer

4. **Workstream 4 (Demo Prep)** — 1–2 hours (last)
   - Pre-warm cache
   - Test all chains
   - Finalize demo script

**Total: 8–10 hours, done in parallel = ~3–4 hours wall clock.**

---

## Go/No-Go Decision (Before Demo)

**Requirements to proceed to demo:**
- [ ] All 3 chains < 2.5s latency
- [ ] Zero HTTP 500 errors
- [ ] "Data missing" message appears for empty results (no hallucination)
- [ ] Observability dashboard shows traces
- [ ] Model override works (optional; can skip for tonight if not ready)

**If any requirement fails:** Revert to pre-Phase-1 state; debug and push to Phase 2.

---

**Phase 1 Locked for Execution. Do NOT proceed to Phase 2 until demo is complete.**
