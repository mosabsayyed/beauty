This implementation roadmap details the complete end-state solution for the \*\*Noor Cognitive Digital Twin v3.2\*\* architecture. This guide focuses on migrating the existing monolithic \`OrchestratorZeroShot\` code pattern to the rigorously defined \*\*Agentic Model Context Protocol (MCP) Architecture\*\*, achieving the target \*\*40-48% token savings\*\*. The project requires the Python language (3.10+) and FastAPI framework, leveraging Neo4j 5.x and PostgreSQL/Supabase.

---

## **Implementation Roadmap: Noor Cognitive Digital Twin v3.2**

| Phase | Title | Estimated Effort | Dependencies | Success Criteria |
| :---- | :---- | :---- | :---- | :---- |
| **1** | **Data & Schema Foundation** | 4 Weeks | Infrastructure Provisioning | Neo4j Vector Index live; PostgreSQL `instruction_bundles` table is queryable and enforces versioning constraints. |
| **2** | **MCP Tool Layer Development** | 5 Weeks | Phase 1 | All three MCP tools pass integration tests; Cypher validation successfully rejects `SKIP`/`OFFSET` queries. |
| **3** | **Orchestrator Rewrite (Agentic Loop)** | 6 Weeks | Phase 2 | Full 5-step loop (Step 0-5) executes in one Agentic Session; Quick Exit Path latency \< 0.5s. |
| **4** | **Productionization & Observability** | 4 Weeks | Phase 3 | Structured logs validate average Noor Input Tokens $\\leq 7,500$; Blue-Green bundle rollout confirmed functional. |

---

## **Phase 1: Data & Schema Foundation**

This phase locks down the dual data architecture required for the Digital Twin ontology (Neo4j) and dynamic instruction loading (PostgreSQL).

### **Deliverables:**

1. Neo4j Digital Twin Schema with **Composite Key Constraints**.  
2. Neo4j **Vector Index** for Hierarchical Memory.  
3. PostgreSQL **Instruction Store** (`instruction_bundles`) supporting Semantic Versioning.

### **1.1 Neo4j Digital Twin Schema and Vector Index Setup**

All Digital Twin entities (e.g., `sec_objectives`, `ent_capabilities`) must adhere to **Universal Design Principles**.

**File:** `backend/db/neo4j_setup.cypher`

// 1\. Digital Twin Node Constraints

// Nodes MUST include temporal and hierarchical data for integrity enforcement (Level Integrity Rule).

CREATE CONSTRAINT IF NOT EXISTS FOR (n:sec\_objectives) REQUIRE (n.id, n.year) IS NODE KEY;

CREATE CONSTRAINT IF NOT EXISTS FOR (n:ent\_capabilities) REQUIRE (n.id, n.year) IS NODE KEY;

// ... (Apply to all 10 core nodes) ...

// 2\. Hierarchical Memory Node Specification

// Node: :Memory (Stores context across four scopes)

CREATE CONSTRAINT IF NOT EXISTS FOR (m:Memory) REQUIRE (m.scope, m.key) IS UNIQUE;

// 3\. Vector Index Strategy (Step 0: REMEMBER prerequisite)

// Retrieval must use semantic similarity search.

// Assuming 1536 dimensions (e.g., OpenAI text-embedding-3-small) and cosine similarity.

CALL db.index.vector.createNodeIndex(

'memory\_semantic\_index',

'Memory',

'embedding',

1536,

'cosine'

);

**Architecture Decision Point: Neo4j Schema Structure**

* *Option:* Store memory context using traditional relationships (`(User)-[:REMEMBERED]->(Context)`).  
* *v3.2 Decision:* Used the dedicated **`:Memory` node label** partitioned by `scope` (personal, departmental, global, csuite).  
* *Rationale:* This structure supports the non-negotiable **Hierarchical Memory Control** model where R/W access is determined solely by the `scope` property, enforced by the MCP tool layer, not the LLM prompt. It also optimizes semantic retrieval using vector indexes.

### **1.2 PostgreSQL Instruction Store Schema**

This schema stores the **10 atomic instruction modules** used for dynamic loading during Step 2: RECOLLECT.

**File:** `backend/db/init_postgres.sql`

\-- Table 1\. instruction\_bundles (Core Content Store)

CREATE TABLE instruction\_bundles (

tag TEXT PRIMARY KEY,                       \\-- Unique Bundle identifier (MUST match Prompt Tag exactly)

content TEXT NOT NULL,                      \\-- Full XML instruction block

version TEXT NOT NULL,                      \\-- Semantic Version (MAJOR.MINOR.PATCH)

status TEXT NOT NULL,                       \\-- Lifecycle state ('active', 'deprecated', 'draft') for Blue-Green deployment

avg\\\_tokens INTEGER,                         \\-- Estimated token count

category TEXT,

experiment\\\_group TEXT                       \\-- A/B test group name

);

\-- Table 2\. instruction\_metadata (Trigger Rules)

CREATE TABLE instruction\_metadata (

tag TEXT REFERENCES instruction\\\_bundles(tag),

trigger\\\_modes TEXT\\\[\\\] NOT NULL,              \\-- Interaction Modes (A, B, H, etc.) that trigger this bundle

trigger\\\_conditions JSONB,

PRIMARY KEY (tag)

);

---

## **Phase 2: MCP Tool Layer Development**

The Service Layer components (residing in `backend/app/services/mcp_router.py`) function as the security and constraint gatekeepers for all data access.

### **Deliverables:**

1. **Memory Tools** (`recall_memory`, `save_memory`) implementing Noor's R/W constraints.  
2. **Cypher Tool** (`read_neo4j_cypher`) enforcing anti-pattern constraints.  
3. **Instruction Tool** (`retrieve_instructions`) for dynamic bundle loading.

### **2.1 API Endpoint Specification (FastAPI)**

All traffic is handled by the orchestrator, which then calls internal services. The primary endpoint handles the chat request.

**File:** `backend/app/api/routes/chat.py`

from fastapi import APIRouter

from app.services.chat\_service import orchestrator\_zero\_shot \# The core logic

from app.models.chat import ChatInput, ChatOutput \# Pydantic models

router \= APIRouter()

@router.post("/query", response\_model=ChatOutput)

async def handle\_chat\_query(request: ChatInput, user\_role: str):

"""

Main entry point for all user queries.

This function triggers the Single-Call MCP Orchestration loop (Step 0 to Step 5).

"""

\\\# Note: user\\\_role is extracted via JWT middleware (Planned State)

response \\= await orchestrator\\\_zero\\\_shot(

    user\\\_query=request.message,

    session\\\_id=request.session\\\_id,

    user\\\_role=user\\\_role

)

return response

### 2.2 MCP Client and Router Service

The architecture delegates tool execution to a standalone **MCP Router Service**. The backend application contains a **Client** (`mcp_client.py`) that communicates with this service.

**File:** `backend/app/services/mcp_client.py`

\# backend/app/services/mcp\_client.py

import httpx

from app.config import settings

async def route\_tool\_call(tool\_name: str, args: dict):

    """

    Forwards the tool call to the external MCP Router Service.

    The Router Service then dispatches to the specific backend (Script or HTTP Server).

    """

    url \= f"{settings.MCP\_SERVICE\_URL}/execute"

    payload \= {

        "tool\_name": tool\_name,

        "arguments": args

    }

    

    async with httpx.AsyncClient() as client:

        response \= await client.post(url, json=payload)

        response.raise\_for\_status()

        return response.json()

#### **The MCP Router Service Architecture**

The **MCP Router** is a configuration-driven gateway (running in `chatmodule/mcp-router`) that manages multiple backends:

1. **Local Scripts:** (e.g., `vector_search.py`, `read_file.py`) executed directly.  
2. **Remote MCP Servers:** (e.g., `neo4j-mcp`) accessed via HTTP.

#### A. Tool: `read_neo4j_cypher`

This tool prevents the **6 Trap Patterns** related to database anti-patterns.

from neo4j import GraphDatabase, AccessMode

from app.config import settings

\# Global Driver initialization (Best practice: connection pooling)

driver \= GraphDatabase.driver(settings.NEO4J\_URI, \*\*settings.NEO4J\_AUTH)

def read\_neo4j\_cypher(cypher\_query: str) \-\> list\[dict\]:

"""Executes validated Cypher query, enforcing constraints and preventing traps."""

\\\# TRAP PREVENTION 1 & 3: Database Anti-Patterns (Keyset Pagination)

if "SKIP" in cypher\\\_query.upper() or "OFFSET" in cypher\\\_query.upper():

    raise ValueError("MCP Constraint Violation: Must use Keyset Pagination.")

\\\# TRAP PREVENTION: Hierarchy Violation (Level Integrity Enforcement)

\\\# Detailed check logic would analyze Cypher structure for L2-\\\>L3 or L3-\\\>L2 jumps

if 'level: "L2"' in cypher\\\_query and 'level: "L3"' in cypher\\\_query:

    raise ValueError("MCP Constraint Violation: Level Integrity (Same-Level Rule) failed.")

\\\# TRAP PREVENTION: Efficiency (Reject Embeddings retrieval)

if "embedding" in cypher\\\_query.lower() or "embed" in cypher\\\_query.lower():

    \\\# Enforcing the rule that read\\\_neo4j\\\_cypher must return only id and name

    raise ValueError("MCP Constraint Violation: Embedding properties cannot be returned.")

with driver.session(mode=AccessMode.READ) as session:

    \\\# Best Practice: Run query in a Read Transaction

    result \\= session.run(cypher\\\_query)

    \\\# Return structured data, enforcing the "id and name only" rule

    return \\\[record.data() for record in result.data()\\\]

#### **B. Tool: `recall_memory` (Step 0\)**

This tool enforces the **Hierarchical Memory Access Control**.

from typing import Literal

# Placeholder for embedding generation service

def generate\_embedding(text: str) \-\> list\[float\]: \# Must use OpenAI text-embedding-3-small return \[0.1\] \* 1536

def recall\_memory(scope: Literal\['personal', 'departmental', 'global'\], query\_summary: str, limit: int \= 5\) \-\> str: """Retrieves context using semantic search based on scope."""

\# STEP 0 CONSTRAINT: Read Access Validation

if scope \== 'csuite':

    \# The MCP tool automatically filters and excludes C-suite memories

    raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.")

query\\\_embedding \\= generate\\\_embedding(query\\\_summary)

\\\# STEP 0 MECHANISM: Semantic Similarity Search (Mandatory Retrieval Strategy)

cypher\\\_query \\= """

CALL db.index.vector.queryNodes('memory\\\_semantic\\\_index', $limit, $query\\\_embedding)

YIELD node AS m, score

WHERE m.scope \\= $scope

RETURN m.content, m.confidence

ORDER BY score DESC

"""

\\\# ... execute Cypher ... (Logic must implement Departmental \\-\\\> Global fallback)

return "Recalled Memory: \[Content List\]"

**Architectural Decision Point: Memory Hierarchy Trade-offs**

* *Option:* Allow Noor to write to all memory tiers it can read from (Personal, Dept, Global).  
* *v3.2 Decision:* **Strictly limit Noor (Staff Agent) to Personal R/W**. Departmental and Global scopes are R/O for Noor and **curated** (R/W) exclusively by Maestro (Executive Agent).  
* *Rationale:* This prevents unverified staff corrections from polluting institutional knowledge and maintains data quality, requiring insights to be strategically validated by Maestro before broader adoption.

---

## **Phase 3: Orchestrator Rewrite (Agentic Loop)**

This phase implements the **Agentic Cognitive Control Loop** (Step 0-5), ensuring the LLM autonomously drives all required actions, including tool calls, via the **MCP Router**.

### **Deliverables:**

1. Core `orchestrator_zero_shot` function implementing the 5-step sequence.  
2. Quick Exit Path logic for Modes D and F.  
3. Dynamic Context Construction prioritizing efficient token loading.  
4. Integration of LLM (Groq) with MCP tools.

### **3.2 LLM Integration and Agentic Loop**

Noor uses **Groq `gpt-oss-120b`**. The orchestration initializes the session and hands control to the LLM. The LLM decides when to recall memory, load instructions, or execute queries.

**File:** `backend/app/services/chat_service.py` (Main Loop)

from app.services import mcp\_client \# Renamed from mcp\_service/router

\# The client forwards calls to the external MCP Router Service.

from app.llm\_client import invoke\_agentic\_loop

from app.utils.logger import log\_completion

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str, user\_role: str):

    """

    Main entry point for all user queries.

    Acts as a 'Dumb Pipe' routing the user query to the Agentic LLM Loop.

    The LLM autonomously executes the 5-step cognitive process via MCP tools.

    """

    

    \# 1\. Initialize System Context

    \# The System Prompt (cognitive\_cont) contains the 'Zero-Shot' instructions

    \# telling the LLM how to use the tools to perform Steps 0-5.

    system\_prompt \= mcp\_client.load\_static\_prompt("cognitive\_cont")

    \# 2\. Invoke Agentic Loop (Groq)

    \# The Orchestrator passes the query and tools; the LLM drives the flow.

    \# Flow: User Query \-\> LLM \-\> Tool Call (Client) \-\> Router Service \-\> Script \-\> Result \-\> LLM

    final\_response \= await invoke\_agentic\_loop(

        user\_query=user\_query,

        session\_id=session\_id,

        system\_prompt=system\_prompt,

        available\_tools=\[

            mcp\_client.recall\_memory,       \# Step 0: Context Retrieval

            mcp\_client.retrieve\_instructions, \# Step 2: Dynamic Bundle Loading

            mcp\_client.read\_neo4j\_cypher    \# Step 3: Execution

        \]

    )

    \# 3\. Post-Loop Logging (Observability)

    \# Metrics are extracted from the final agent state

    log\_completion(

        session\_id, 

        mode=final\_response.mode, 

        tokens\_in=final\_response.total\_tokens,

        confidence=final\_response.confidence\_score

    )

    return final\_response.formatted\_output

\\\# LLM formats output/memory decision (Step 5: RETURN).

\\\# \\--- POST-INFERENCE: STEP 5: RETURN (Final Response) \\---

\\\# No explicit memory save tool call.

\\\# Persistence is handled asynchronously via the Conversation Ingestion Pipeline.

\\\# Log metrics required for Dashboard 4 (Cost Optimization)

log\\\_completion(session\\\_id, mode, tokens\\\_in=final\\\_llm\\\_output.tokens\\\_input,

               confidence=confidence\\\_score, bundles\\\_used=required\\\_tags)

return final\\\_llm\\\_output.formatted\\\_json\\\_output

---

## **Phase 4: Productionization & Observability**

This phase ensures the system is resilient, scalable, and adheres to the required testing and monitoring standards.

### **Deliverables:**

1. Multi-Agent Deployment (Noor/Maestro) with **Role-Based Routing**.  
2. CI/CD procedures for zero-downtime **Bundle Rollback**.  
3. Structured Logging to validate **Token Economics**.  
4. Testing strategy covering V3.2 constraints.

### **4.1 Production Patterns: Preventing the 6 Critical Trap Patterns**

The architecture prevents runtime errors and logical flaws through layered enforcement (Orchestrator, MCP, and LLM instructions).

| Trap Pattern (Prohibited Behavior) | Enforcement Layer | Prevention Mechanism | Source(s) |
| :---- | :---- | :---- | :---- |
| **1\. Hallucinating Data** | LLM (Step 4: RECONCILE) | Instruction mandates explicit statement of limitation if Step 3 returns empty data. |  |
| **2\. Brute Force Pagination** | MCP (Step 3: RECALL) | `read_neo4j_cypher` **rejects** `SKIP` or `OFFSET` keywords; enforces **Keyset Pagination**. |  |
| **3\. Hierarchy Violation** | MCP (Step 3: RECALL) | `read_neo4j_cypher` validates Cypher path for L2 $\\leftrightarrow$ L3 **Level Mismatch**. |  |
| **4\. Failure to Backtrack** | LLM (Step 3: RECALL) | After EACH tool call, LLM instruction dictates mandatory validation and **BACKTRACKING** to an alternative strategy if results fail. |  |
| **5\. Using Technical Jargon** | LLM (Step 4: RECONCILE) | **Business Language Translation** enforced by `module_business_language`. Technical terms (e.g., "Cypher," "L3," "Node") must be replaced. |  |
| **6\. Ignoring Ambiguity** | Orchestrator (Step 1\) | QueryPreprocessor normalizes input ("that project" $\\rightarrow$ specific ID). If ambiguity remains, LLM initiates **Clarification Mode (H)**. |  |

### **4.2 Multi-Agent Deployment and Routing**

Noor and Maestro agents are independently deployed. **NO handoff or escalation protocol** exists between them. Both agents utilize the **Agentic MCP Architecture** (Dynamic Bundles), but they differ in **privileges** and **model intelligence**.

**Deployment Specification (`docker-compose.yml` fragment)**

**Deployment Specification (`docker-compose.yml` fragment)**

version: '3.8'

services:

\# 1\. NOOR Staff Agent (Token Optimized, Groq LLM)

noor\_agent:

build: ./noor-agent-service

ports: \\\["8002:8002"\\\]

environment:

  \\- LLM\\\_PROVIDER=Groq

  \\- LLM\\\_MODEL=gpt-oss-120b

  \\- MCP\\\_SERVICE\\\_URL=http://mcp\\\_service:8001

\\\# ... depends\\\_on: \\\[mcp\\\_service, neo4j\\\] ...

\# 2\. MAESTRO Executive Agent (Reasoning Optimized, OpenAI LLM)

maestro\_agent:

build: ./maestro-agent-service

ports: \\\["8003:8003"\\\]

environment:

  \\- LLM\\\_PROVIDER=OpenAI

  \\- LLM\\\_MODEL=o1-pro

\# Note: Maestro uses the same Agentic MCP Architecture (Dynamic Bundles)

\# Distinction: Maestro has elevated privileges (C-Suite/Global Write) and advanced reasoning tools.

\\\# ... depends\\\_on: \\\[mcp\\\_service, neo4j\\\] ...

\# 3\. API Gateway / Router (Mandatory Role-Based Routing)

api\_gateway:

image: nginx:latest

ports: \\\["80:80"\\\]

\\\# ... routing logic implemented here:

\\\# IF user\\\_role is C-suite, route to http://maestro\\\_agent:8003

\\\# ELSE, route to http://noor\\\_agent:8002

### **4.3 Observability and Monitoring**

Structured logging is required to capture the full trace of the Single-Call MCP loop, enabling validation of token savings.

**Structured Logging Implementation (Python)**

**File:** `backend/app/utils/logger.py`

import json, logging, datetime

logger \= logging.getLogger('noor\_cognitive\_twin')

\# ... configuration to use JSONFormatter ...

def log\_completion(session\_id, mode, tokens\_in, confidence, bundles\_used, agent\_id='Noor'):

"""Logs necessary fields for token economics and integrity tracking."""

log\\\_data \\= {

    'timestamp': datetime.datetime.now().isoformat(),

    'session\\\_id': session\\\_id,

    'user\\\_id': get\\\_current\\\_user\\\_id(), \\\# Must be extracted via JWT

    'agent\\\_id': agent\\\_id,              \\\# (Noor vs Maestro)

    'intent\\\_mode': mode,               \\\# (A, B, F, etc.)

    'bundles\\\_loaded': bundles\\\_used,    \\\# Validates Step 2: RECOLLECT

    'tokens\\\_input': tokens\\\_in,         \\\# CRITICAL for cost analysis

    'confidence\\\_score': confidence,    \\\# Generated in Step 4: RECONCILE

    'success': True

}

logger.info("Query completed", extra=log\\\_data)

**Key Observability Metrics:**

* **Token Optimization:** Monitor `tokens_input`. Alert if the average token count for Noor exceeds the estimated **7,500 tokens** (Average).  
* **Memory System:** Track `memory_recall_hit_rate` per tier (Personal/Dept/Global).  
* **Quality:** Monitor `Average Probabilistic Confidence`.

### **4.4 Testing Strategy (Phase 4 Validation)**

The testing strategy focuses on regression to guarantee the new architectural constraints are preserved.

| Test Category | Objective | Mechanism | Source(s) |
| :---- | :---- | :---- | :---- |
| **Cognitive Integrity** | Verify sequential execution of the 5-step loop (REMEMBER $\\rightarrow$ RECONCILE). | Integration Tests assert the Step 4 JSON analysis is present only after a mock tool call (Step 3\) occurred. |  |
| **Memory Access Control** | Validate Noor's Read-Only permissions. | Component Tests: Verify `recall_memory` strictly allows 'personal', 'dept', 'global' and rejects 'csuite'. |  |
| **Cypher Integrity** | Validate the MCP tool rejects anti-patterns. | Unit Tests: Send Cypher containing `SKIP 100` or `n.level='L2', m.level='L3'` and assert `ValueError`. |  |
| **Bundle Rollout** | Verify seamless switching between bundle versions. | E2E Tests: Update PostgreSQL `status` field from `active` to `draft` (rollback), assert Orchestrator immediately loads the correct active version. |  |

The Noor Cognitive Digital Twin operates under the **Agentic MCP Architecture**, meaning the entire thought process—from intent analysis (Step 1\) through execution (Step 3\) and synthesis (Step 4)—is contained within **one Agentic Session**. This approach ensures consistency and optimizes the execution latency for the Noor Staff Agent.

The process follows a **Fixed Cognitive Control Loop**.

## **Mandatory Pre-Step: STEP 0: REMEMBER (Hierarchical Memory Recall)**

This step ensures the LLM retrieves long-term context before interpreting the immediate query.

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | Retrieval of prior context or user preferences stored in the Hierarchical Memory System. This is done using high-precision **semantic similarity search** (vector search) across the graph database. |
| **2\. Input data** | The raw `user_query`, the current conversation path/mode status, and the user's `session_id`. |
| **3\. Processing logic** | **Memory Management:** The LLM evaluates the user query to determine if historical context is needed. If so, it calls `recall_memory` to retrieve relevant nodes from the graph. |
| **4\. Output data** | **`recalled_context`**: A structured string or list of memory snippets, including content, retrieval score, and source scope. |
| **5\. Failure modes** | **Permission Violation:** Noor attempts to access the **`csuite`** tier. Recovery: The MCP server returns an error, as Noor is explicitly forbidden access to this tier. **Semantic Miss:** If semantic search fails to find relevant context, the tool returns an empty set. Recovery: If retrieval from `departmental` fails, the MCP automatically attempts search in the `global` scope (Fallback Logic). |
| **6\. Code implementation** | **Conceptual MCP Tool Logic:** `python # STEP 0 CONSTRAINT: Scope Validation if scope == 'csuite': raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.") # Retrieval Strategy (Neo4j Vector Search) cypher_query = """ CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding) YIELD node AS m, score WHERE m.scope = $scope RETURN m.content, score ORDER BY score DESC """ # ... execute query ...` |
| **7\. Integration points** | **MCP Tool:** Executes `recall_memory(scope, query_summary, limit)`. **Neo4j:** Queries the **`:Memory`** node label using the vector index. |
| **8\. Example execution** | User asks: "How does Project Alpha impact risk levels?" The path (Mode B1/G) mandates memory recall. Step 0 retrieves: "Project Alpha previously showed high risk correlation in Q4 2024" from the `departmental` scope (Read-Only). |
| **Special Rule: Hierarchical Memory** | The structure (Personal, Departmental, Global, C-suite) enforces **strict access control**: Noor is R/W for **Personal** and R/O for **Departmental/Global**. |

---

## **STEP 1: REQUIREMENTS (Intent Classification and Gatekeeper)**

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | The LLM analyzes the query and the optional `recalled_context` to perform input normalization, entity extraction, and classify the query into one of the **8 Interaction Modes (A-H)**. This step contains the **Gatekeeper Logic**. |
| **2\. Input data** | The `user_query` and the base instructions (e.g., the `cognitive_cont` bundle defining classification rules). |
| **3\. Processing logic** | The LLM runs classification logic to determine the `interaction_mode` (A, B1, C, D, F, G, H, etc.). **Gatekeeper Decision:** If the mode is classified as **D (Acquaintance) or F (Social)**, the LLM executes the **Quick Exit Path**. |
| **4\. Output data** | **`interaction_mode`** (A-H), and the **Quick Exit Flag** status. |
| **5\. Failure modes** | **Ambiguous Query**. Recovery: If the LLM cannot resolve entities or intent, it classifies the query as Mode H (Clarification). Mode H then triggers the recovery protocol (Ask clarifying question, suggest alternative formulation). |
| **6\. Code implementation** | **Agentic Logic:** The LLM generates the response immediately if the intent is conversational (Mode D/F), bypassing tool calls. |
| **7\. Integration points** | **LLM:** Executes internal classification reasoning. **Instruction Bundles:** Uses the rules defined in `cognitive_cont`. |
| **Special Rule: Quick Exit Path** | If **Modes D (Acquaintance) or F (Social)** are triggered, the LLM skips **Step 2 (Recollect) and Step 3 (Recall)**. This is the basis for the latency improvement (2.5s $\\rightarrow$ \<0.5s for greetings). |

## **STEP 2: RECOLLECT (Strategy Determination and Dynamic Loading)**

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | If the Quick Exit Path was **NOT** triggered, the LLM determines which specific **Task-Specific Instruction Bundles** are required for the identified mode (e.g., Mode B2 requires `strategy_gap_diagnosis`). It then calls the MCP tool to fetch this content dynamically. |
| **2\. Input data** | `interaction_mode` (A, B1, B2, C, E, G, H) from Step 1\. |
| **3\. Processing logic** | The LLM executes the **`retrieve_instructions` MCP tool**. The MCP queries PostgreSQL metadata tables to find bundles matching the mode. **Caching Strategy:** The retrieved bundles are injected into the active context window by the LLM to guide subsequent steps. |
| **4\. Output data** | **`bundles_content`**: A string of necessary instructions (e.g., XML blocks for strategies and tool rules). |
| **5\. Failure modes** | **Bundle Retrieval Failure:** The database is unreachable or the requested `tag` is not found. Recovery: The MCP server propagates the error; the LLM uses embedded fallback instructions and states a warning to the user. |
| **6\. Code implementation** | **Agentic Logic:** The LLM calls `retrieve_instructions(mode)` to load the necessary context. |
| **7\. Integration points** | **MCP Tool:** Executes `retrieve_instructions(mode)`. **PostgreSQL:** Accesses `instruction_bundles` and `instruction_metadata` tables. |
| **Special Rule: Mode A-H Effect** | The mode (Step 1\) dictates which Strategy Bundles are loaded (Step 2). For example, Mode B2 (Gap Diagnosis) mandates loading `strategy_gap_diagnosis`. |

## **STEP 3: RECALL (Execution and Validation)**

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | The LLM, informed by the instructions loaded in Step 2, translates the user goal into Cypher/SQL or vector retrieval queries. It executes these queries by calling the specialized **`read_neo4j_cypher` MCP tool**. |
| **2\. Input data** | The **Current Context** (including loaded Bundles from Step 2 and any Recalled Memory from Step 0\) and the schema knowledge. |
| **3\. Processing logic** | The LLM calls the MCP tool with the generated query. **MCP CONSTRAINT ENFORCEMENT:** The MCP service rigorously validates the query before execution: it **rejects** `SKIP`/`OFFSET` (enforcing Keyset Pagination), checks for **Level Integrity** (no L2 $\\leftrightarrow$ L3 mixing), and prevents returning large data types like `embedding` vectors. **Validation & Backtracking:** After the tool returns raw data, the LLM internally validates the result (e.g., checks for empty sets) and is **MANDATED** to **BACKTRACK** to an alternative strategy (Phase 2\) if validation fails. |
| **4\. Output data** | **`raw_query_results`**: Structured data from Neo4j (constrained to `id` and `name` properties for efficiency). |
| **5\. Failure modes** | **Cypher Integrity Violation:** LLM generates a prohibited query (`SKIP`, `OFFSET`, `L2-L3` link). Recovery: The MCP tool raises a `ValueError`. The LLM receives the error and initiates the **Backtracking Protocol** to regenerate a compliant query. |
| **6\. Code implementation** | **Agentic Logic:** The LLM calls `read_neo4j_cypher` with the generated query. The MCP router validates it before execution. |
| **7\. Integration points** | **LLM** calls **`read_neo4j_cypher` MCP tool**. **Neo4j:** Executes graph retrieval for multi-hop path traversal. |
| **Example execution** | LLM executes `read_neo4j_cypher("MATCH (c:ent_capabilities {year: 2024}) ... RETURN c.name LIMIT 30")`. Output: A list of capability names for the specified year. |

## **STEP 4: RECONCILE (Synthesis, Gap Diagnosis, and Insight)**

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | This step transforms raw data into **actionable institutional intelligence**. This process is **CRITICAL AND SEPARATE** from Step 3 execution. It includes Gap Analysis, Confidence Scoring, and Artifact Generation. |
| **2\. Input data** | `raw_query_results` from Step 3, synthesis instructions (primarily from `strategy_gap_diagnosis` and `module_business_language`). |
| **3\. Processing logic** | **Gap Analysis:** The LLM applies the principle **"Absence is signal, not silence"**. If data is missing or constraints were violated (Step 3), the LLM diagnoses the gap using one of four classifications (Direct, Indirect Chain, Temporal Gap, Level Mismatch). **Quality Control:** Calculates the **Probabilistic Confidence Score**. **Output Formatting:** Applies **Business Language Translation** (e.g., replacing "L3" with "Function"). **Artifact Rule:** Generates visualization specs, explicitly constrained to **NOT** support `network_graph` (must be rendered as a table). |
| **4\. Output data** | A complete JSON object containing: `business_insight`, `gap_diagnosis` (type, severity), `confidence_score`, and `artifact_specification` (e.g., table structure). |
| **5\. Failure modes** | **Hallucination:** If raw results were empty, the LLM must **NOT** synthesize data. Recovery: The LLM must explicitly state the knowledge limitation and suggest alternative query formulations. |
| **6\. Code implementation** | **Conceptual LLM Instruction Snippet (from `strategy_gap_diagnosis`):** `xml <RULE name="AbsenceIsSignal"> IF (GapType = "Temporal Gap") THEN Severity: 🟡🟡. Explain: "Data exists for year X but not for year Y, preventing trend analysis." </RULE> <RULE name="VisualizationConstraint"> IF (OutputVisualizationType = "Network Graph") THEN REPLACE with: "Table (Source, Relationship, Target)". </RULE>` |
| **7\. Integration points** | Internal LLM reasoning, highly dependent on the quality constraints provided by the dynamic bundles. |
| **Special Rule: Absence is signal, not silence** | This rule dictates that a lack of data (e.g., a missing relationship or entity during multi-hop traversal) must be interpreted as a **diagnosable business gap** (e.g., a process link is broken), not merely a data retrieval failure. |

## **STEP 5: RETURN (Final Formatting)**

| Point | Specification |
| :---- | :---- |
| **1\. What exactly happens** | Final formatting of the synthesis into the required JSON schema. **No explicit memory save tool is called.** Persistence is handled asynchronously via the **Conversation Ingestion Pipeline** (Supabase \-\> Nightly ETL \-\> Neo4j). |
| **2\. Input data** | The finalized JSON object from Step 4, including the calculated `confidence_score`. |
| **3\. Processing logic** | **Response Formatting:** The LLM formats the final answer. **Context embedding:** The conversation is automatically embedded locally in the browser for intra-day context and synced to Supabase for nightly vectorization. |
| **4\. Output data** | The **Final JSON Response** (containing insights, score, artifacts, and optional **`memory_metadata`** field to signal importance to the background pipeline). |
| **5\. Failure modes** | **Formatting Error:** LLM produces invalid JSON. Recovery: Orchestrator fallback parser extracts raw text. |
| **6\. Code implementation** | **Frontend/Background Logic:** `BrowserEmbeddingService.update_context(user_query, response)` |
| **7\. Integration points** | **Frontend:** Updates local vector store. **Supabase:** Logs chat history. **PostgreSQL:** Logs structured metrics (e.g., `tokens_input`, `confidence_score`). |
| **Example execution** | The LLM formats the response. The frontend receives the stream and updates its local "Recall Context" for the next turn. |

This design details the mandatory **Model Context Protocol (MCP) tool system** and the **Hierarchical Memory Architecture**, which together form the foundation for the Noor Cognitive Digital Twin v3.2's **Single-Call Architecture**.

## **1\. MCP Tool Specifications**

The MCP is the secure layer residing in the FastAPI service (`mcp_client.py`) that acts as the intermediary between the LLM and the data stores (Neo4j, PostgreSQL).

### **Core MCP Tools Design (4 Mandatory Tools)**

| Tool Name | Purpose | Inputs (LLM Provided) | Outputs (MCP Response) | Validation Rules | Error Handling |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **`recall_memory`** (Step 0\) | Contextual Retrieval | `scope` (personal, dept, global), `query_summary`, `limit`. | List of memory snippets (`key`, `content`, `confidence`, `score`). | **Noor Scope Read Constraint:** Must reject `csuite` scope. Must use **semantic vector search**. | `PermissionError` (if `csuite`). Automatic Fallback Logic (Dept $\\rightarrow$ Global). |
| **`retrieve_instructions`** (Step 2\) | Dynamic Bundle Loading | `mode` (A-H). | Structured content of active bundles (XML/Markdown). | Must retrieve bundles with `status = 'active'` only. | `NotFoundError` if the required bundle tag is missing. |
| **`read_neo4j_cypher`** (Step 3\) | Data Execution | `cypher_query`, `parameters`. | List of entity data (constrained to `id` and `name`). | **No Brute Force Pagination:** Reject `SKIP`/`OFFSET`. **No Hierarchy Violation:** Enforce Same-Level Rule. **Efficiency:** Reject `embedding` retrieval. | `ValueError` for constraint violation. `DatabaseError` for execution failure (triggers LLM backtracking). |
| **`read_file`** (Utility) | File Access | `file_path`, `limit`. | Content of local files (logs, user uploads). | **Read-Only:** Write operations forbidden. **Path Constraints:** Sandbox directory only. | `PermissionError` for path violation. `FileNotFoundError`. |
| **`read_file`** (Utility) | File Access | `file_path`, `limit`. | Content of local files (logs, user uploads). | **Read-Only:** Write operations forbidden. **Path Constraints:** Sandbox directory only. | `PermissionError` for path violation. `FileNotFoundError`. |

---

### **MCP Tool Approval and Execution Logic**

### **D. `read_file` (Utility)**

| Point | Specification |
| :---- | :---- |
| **Purpose** | Allows the Agent to read local file content (e.g., logs, user uploads) when required for analysis. |
| **Inputs** | `file_path`, `limit`. |
| **Outputs** | File content string (truncated if exceeding limit). |
| **Validation Rules** | **Read-Only:** Write operations are forbidden. **Path Constraints:** Access restricted to allowed sandbox directories. |
| **Error Handling** | `PermissionError` if path is outside sandbox. `FileNotFoundError` if file does not exist. |
| **Integration** | Uses standard filesystem I/O via the MCP Router's `file_handler`. |

---

### **Why `require_approval: never` Matters**

For the Noor v3.2 architecture, the entire execution flow (Step 1 through Step 5\) must occur in a single, high-speed LLM call to meet latency and efficiency targets.

* **`require_approval: never`:** This setting is mandatory for the Agentic MCP Architecture. It instructs the LLM framework that when the LLM suggests a tool call (e.g., `read_neo4j_cypher`), the server executes the tool immediately and returns the result back to the LLM **without waiting for human or external system intervention**. This allows the LLM to complete its reasoning, data gathering (Step 3), synthesis (Step 4), and output generation (Step 5\) seamlessly.  
* **Consequence of `require_approval: always`:** If set to `always`, the LLM would pause after generating the tool call, awaiting an external approval (a "Tool Approval Request"). This breaks the fundamental premise of the "Single-Call" loop, requiring multiple API invocations and dramatically increasing end-to-end latency (especially preventing the Quick Exit Path from achieving \<0.5s response times).

#### **Server-Side Tool Execution (Groq Integration)**

The LLM (Groq `gpt-oss-120b`) does **NOT** execute the tool code itself; it only generates a request to use a tool. The execution is handled by the broader Agentic Framework and MCP infrastructure.

1. **Orchestrator Invokes Agent:** The `orchestrator_zero_shot` script invokes the main **Agent Runtime**, providing the initial prompt and tool definitions.  
2. **Agent Runtime Manages Loop:** The Agent Runtime sends the context to the LLM.  
3. **LLM Tool Call Request:** The LLM responds with a request to call a tool (e.g., `read_neo4j_cypher`).  
4. **Client/Router/Script Execution:** The Agent Runtime, via the `mcp_client`, sends the request to the external **MCP Router Service**. The router dispatches it to the correct backend script (e.g., `neo4j_handler`).  
5. **Result Processing:** The script result is returned through the Router and Client to the Agent Runtime, which appends it to the context and continues the loop with the LLM.

#### **Tool Chaining Logic**

In this architecture, tools do **NOT** call other tools directly. The **LLM** is the central orchestrator of the sequence, directed by the 5-Step Control Loop and the dynamically loaded instructions.

* **Sequence Example:**  
  * **LLM (Internal Logic):** "I need data for Mode B2."  
  * **External Call:** `retrieve_instructions` (Step 2).  
  * **LLM (Internal Logic):** "Now that I have the instructions, I need to fetch the data."  
  * **External Call:** `read_neo4j_cypher` (Step 3).  
  * **LLM (Internal Logic):** "I have the final synthesis."

## **2\. Hierarchical Memory Architecture**

The memory system uses Neo4j to enforce strict access control based on the `scope` property of the `:Memory` node.

### **Memory Tier Design and Access Control**

| Memory Scope | Purpose | Noor (Staff Agent) Access | Maestro (Executive Agent) Access | Query Timing |
| :---- | :---- | :---- | :---- | :---- |
| **`personal`** | User-specific preferences, corrections, and conversational context. | **Read-Only (R/O)** | R/W | Step 0 (REMEMBER). Writes handled by Pipeline. |
| **`departmental`** | Team-specific knowledge, project status, curated group findings. | **Read-Only (R/O)** | Read/Write (Curation) | Step 0 (REMEMBER) |
| **`global`** | Institution-wide policies, high-level non-confidential strategy. | **Read-Only (R/O)** | Read/Write (Curation) | Step 0 (REMEMBER) |
| **`csuite`** | Highly confidential, executive-level insights and predictions. | **NO Access** | Exclusive R/W | Forbidden for Noor |

### **Vector Indexing Strategy (Semantic Search)**

Memory retrieval relies on the `memory_semantic_index` defined on the **`:Memory`** node label.

**Indexing Detail:**

* **Vector Dimensions:** 1536 (to align with standard, high-quality embedding models).  
* **Similarity Function:** `cosine` (standard for retrieval tasks).  
* **Retrieval Mechanism:** `db.index.vector.queryNodes` call (enforced by `recall_memory` tool).

### **Memory Eviction/Cleanup Policies**

Since the sources do not mandate specific policies, a hybrid approach combining confidence and usage is the recommended best practice for cognitive systems:

1. **Low Confidence Eviction:** Memories stored with a `confidence` score below a configurable threshold (e.g., 0.5) are flagged for periodic removal.  
2. **Least Recently Used (LRU):** Memories that have not been accessed or updated within the longest time window are prioritized for archiving or deletion.  
3. **TTL (Time-to-Live):** Departmental and Global memories may have organizational TTLs (e.g., 3 years) enforced by batch processes.

## **3\. Integration with Control Loop**

### **Querying Memory During STEP 0 (REMEMBER)**

Retrieval must happen early because the context influences classification (Step 1\) and bundle loading (Step 2).

* **Process:** The LLM evaluates the need for memory and calls `recall_memory()` if required by the active protocol.  
* **Mechanism:** `recall_memory` executes the semantic Cypher query against the allowed scopes. If `departmental` search fails, it automatically falls back to `global` memory within the same tool execution.  
* **Output Flow:** The structured `recalled_context` is returned to the LLM and integrated into the conversation history for the next step.

### **How Step 2 (RECOLLECT) Uses Memory Context**

The context retrieved in Step 0 helps the LLM choose the *correct* strategic pathway defined by the bundles. While the `interaction_mode` (Step 1\) dictates the baseline strategy, the presence of memory context refines the LLM's subsequent reasoning within the loaded bundles (e.g., memory suggests the user is focused on risk, leading the LLM to prioritize the `strategy_risk_analysis` tool calls within Step 3).

### **Saving New Memories (Automated Pipeline)**

* **Intra-day:** Conversations are embedded locally in the user's browser to provide immediate context for the active session.  
* **Nightly:** A scheduled ETL job queries Supabase chat logs, generates embeddings, and merges new `:Memory` nodes into the Neo4j graph (Personal Scope).  
* **No Explicit Tool:** The LLM does **not** call a tool to save memory.

### **Memory Validation Logic in Step 4 (RECONCILE)**

The LLM (using the Gap Analysis instructions) must perform memory validation:

1. **Consistency Check:** If `recalled_context` contradicts the live data retrieved in Step 3, Step 4 logic must identify this as a potential **Temporal Gap** or **Data Conflict**.  
2. **Source Citation:** The final output must explicitly cite any memories used in the synthesis. This prevents **memory hallucinations** by forcing the LLM to ground the context.

## **4\. Code Implementation**

### **Neo4j Cypher Queries for Memory Semantic Search**

// 1\. Semantic Search for Memory (Executed by recall\_memory MCP tool)

// Ensures retrieval is limited to permitted scopes (e.g., 'personal')

CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)

YIELD node AS m, score

WHERE m.scope \= $scope

RETURN m.content, m.key, m.confidence, score

ORDER BY score DESC LIMIT $limit

### **Python Code for the MCP Service Class (Memory Handlers)**

**File:** `backend/app/services/mcp_router.py`

from neo4j import GraphDatabase, AccessMode

from app.config import settings

\# Global driver and embedding generator initialized here

def recall\_memory(scope: str, query\_summary: str, limit: int \= 5\) \-\> str:

if scope \\== 'csuite':

    raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.")

query\\\_embedding \\= generate\\\_embedding(query\\\_summary)

\\\# \\\[Cypher from above executed here\\\]

\\\# Includes internal fallback from departmental \\-\\\> global logic

return f"Recalled Context from {scope}: {recalled\\\_list\\\_json}"

def save\_memory(scope: str, key: str, content: str, confidence: float):

\\\# Enforcing Noor Write Constraint (Non-negotiable)

if scope \\\!= 'personal':

    raise PermissionError(f"Noor agent can only write to the 'personal' memory scope.")

embedding \\= generate\\\_embedding(content)

cypher \\= """

MERGE (m:Memory {key: $key, scope: $scope})

ON CREATE SET m.content \\= $content, m.embedding \\= $embedding, m.confidence \\= $confidence, m.created\\\_at \\= datetime()

ON MATCH SET m.content \\= $content, m.embedding \\= $embedding, m.confidence \\= $confidence, m.updated\\\_at \\= datetime()

"""

with driver.session(mode=AccessMode.WRITE) as session:

    session.run(cypher, parameters={

        "key": key, "scope": scope, "content": content,

        "embedding": embedding, "confidence": confidence

    })

return "Personal memory saved successfully."

### **FastAPI Endpoints for Memory CRUD Operations**

**Crucially, the memory CRUD operations are NOT exposed as public REST endpoints.** They are implemented as internal functions within `mcp_router.py` and accessed only via the **LLM Tool Call Request/Response loop** initiated by the `orchestrator_zero_shot`.

## **5\. Production Patterns**

### **How to Prevent Memory Hallucinations**

1. **Confidence Threshold:** The `recall_memory` tool should return only memories where the semantic similarity `score` is above a high production threshold (e.g., 0.82). Low-scoring memories are discarded before being presented to the LLM.  
2. **Citing Requirements:** The `module_memory_management_noor` instruction mandates that the LLM must **cite the memory source (`key`, `scope`)** in Step 4 synthesis if it is used, grounding the assertion.

### **Consistency Checks Between Memory Tiers**

Consistency checks are handled through **automatic fallback** during Step 0:

* Noor attempts `departmental`. If the query yields a match, search stops.  
* If `departmental` search fails (empty result), the MCP automatically attempts `global` scope retrieval.

This implicit search order provides a layered consistency check, prioritizing specific (Dept) over general (Global) context.

### **Audit Logging for Memory Access/Modifications**

Audit logging is essential for compliance and integrity. The standard Structured Logger must capture:

* **Read Access Log:** Log `event_type='memory_read'`, `scope_accessed`, `result_count`, and `user_id` upon successful `recall_memory` execution.

### **Testing Memory Scenarios**

| Test Case | Description | Expected Result |
| :---- | :---- | :---- |
| **T01 (Access Denial)** | Noor attempts `recall_memory('csuite', ...)` | `PermissionError` raised by MCP; execution halted. |
| **T03 (Fallback Logic)** | Query fails semantic match in 'departmental'. | MCP successfully returns context retrieved from 'global' scope. |
| **T04 (Validation)** | Memory snippet contradicts live Neo4j data (Temporal Gap). | LLM Step 4 output includes `gap_diagnosis='Temporal Gap'` and cites the conflicting memory key. |

Alternative Version of the 4-6 mcp tools

The Model Context Protocol (MCP) tool system and the Hierarchical Memory Architecture are the foundational elements enabling the **Noor Cognitive Digital Twin v3.2** to operate under the **Agentic MCP Architecture**. These tools act as the secure gateway between the LLM's reasoning and the data layers, enforcing access control and data integrity constraints.

## **1\. MCP Tool Specifications (4 Core Synchronous Tools)**

The Noor Staff Agent requires its LLM (Groq `gpt-oss-120b`) to execute all actions, including data retrieval and persistence, within a single API call. This mandates three primary synchronous MCP tools tied directly to the fixed Cognitive Control Loop (Step 0, Step 2, Step 3). Each tool call adds approximately **\~450 tokens** to the INPUT token count.

### **A. `recall_memory` (Step 0: REMEMBER)**

| Point | Specification |
| :---- | :---- |
| **Purpose** | Contextual retrieval of historical data and preferences based on semantic search before intent classification. |
| **Inputs** | `scope` (personal, departmental, global), `query_summary`, `limit`. |
| **Outputs** | List of memory snippets (`key`, `content`, `confidence`, `score`). |
| **Validation Rules** | **Noor Scope Read Constraint:** Must reject the `csuite` scope. Retrieval **MUST** use **semantic similarity search** (vector search). |
| **Error Handling** | `PermissionError` if `csuite` access is attempted. **Fallback Logic:** If retrieval from `departmental` scope yields no results, the MCP server automatically attempts search in the `global` scope. |
| **Integration** | Queries the **`:Memory`** node label in Neo4j using the vector index. |

### **B. `retrieve_instructions` (Step 2: RECOLLECT)**

| Point | Specification |
| :---- | :---- |
| **Purpose** | Dynamic loading of **Task-Specific Instruction Bundles** from PostgreSQL to optimize context loading and token efficiency. |
| **Inputs** | `mode` (The interaction mode A-H determined in Step 1). |
| **Outputs** | Structured content of active bundles (e.g., XML instruction blocks). |
| **Validation Rules** | Must retrieve only bundles marked with `status = 'active'`. Bundle tag requested by the prompt must match the PostgreSQL DB tag exactly. |
| **Error Handling** | `NotFoundError` if the required bundle tag is missing. Upon error, the LLM uses embedded fallback instructions. |
| **Integration** | Queries the PostgreSQL `instruction_bundles` table and `instruction_metadata` table. |

### **C. `read_neo4j_cypher` (Step 3: RECALL)**

| Point | Specification |
| :---- | :---- |
| **Purpose** | Primary tool for executing Cypher queries against the Neo4j Digital Twin. Critical for execution and validating architectural constraints. |
| **Inputs** | `cypher_query`, `parameters` (LLM-generated Cypher and necessary input values). |
| **Outputs** | List of entity data, strictly constrained to `id` and `name` properties. |
| **Validation Rules (Constraint Enforcement)** | **Pagination:** Queries **MUST NOT** emit `SKIP` or `OFFSET`; enforces **Keyset Pagination**. **Level Integrity:** Must adhere to the **Same-Level Rule** (L3 $\\leftrightarrow$ L3). **Efficiency:** Must return only `id` and `name`; explicitly **rejects** retrieval of `embedding` properties. **Aggregation First:** Must enforce the use of `count(n)` or `collect(n)` for sampling. |
| **Error Handling** | `ValueError` for constraint violation (e.g., illegal `SKIP` keyword). Triggers the LLM's **BACKTRACKING** protocol. |
| **Integration** | Executes Cypher directly against the Neo4j Digital Twin nodes (e.g., `sec_objectives`, `ent_capabilities`). |

### **Why `require_approval: never` Matters**

The Noor architecture relies on the **Agentic MCP Architecture**. This design requires the LLM to complete its entire reasoning loop (Steps 1 through 5\) in one billable API inference cycle.

* If the tool protocol required approval (**`always`**), the LLM inference would pause after suggesting a tool call, requiring a latency-inducing round-trip for external approval, breaking the autonomous loop.  
* The system uses implicit server-side execution where the MCP executes the tool immediately upon the LLM's request and returns the result. This is essential for achieving the **Fast-Path Protocol** latency target of **$\<0.5\\text{s}$** for conversational queries.

## **2\. Hierarchical Memory Architecture**

The memory system is built on **Neo4j** and provides the RAG context for Step 0 (REMEMBER).

### **Memory Tier Design and Access Control**

The system utilizes the **`:Memory`** node label, segmented by the required `scope` property.

| Memory Tier | Purpose | Noor (Staff Agent) Access | Maestro (Executive Agent) Access | Source(s) |
| :---- | :---- | :---- | :---- | :---- |
| **Personal** | User-specific corrections and context. | **Read-Only (R/O)** | R/W |  |
| **Departmental** | Team-validated knowledge, functional gaps. | **Read-Only (R/O)** | Read/Write (Curates) |  |
| **Global** | Institutional knowledge, strategic plans. | **Read-Only (R/O)** | Read/Write (Curates) |  |
| **C-Suite** | Confidential, executive insights. | **NO Access** | Read/Write (Exclusive) |  |

### **Vector Indexing Strategy**

Memory retrieval must use **semantic similarity search**.

* **Index Creation:** A vector index must be created on the \`emb...(truncated 47170 characters)...,  
  "score": 0.93  
  }  
  \]  
  """

---

## **Step 1: REQUIREMENTS (Intent Classification and Gatekeeper)**

This step analyzes the query and determines the execution path based on the **Interaction Mode Taxonomy**.

### **How the system classifies this query**

The LLM analyzes the `user_query` and the `recalled_context` using the constraints provided by the **`cognitive_cont`** instruction bundle.

1. **Key Term Matching:** The query contains the term **"gap"**.  
2. **Classification:** The LLM classifies the query as **Mode B2: Gap Diagnosis**, defined as complex analytical reasoning focused on identifying missing components, links, or strategic dependencies.

### **Which mode would handle "What's our strategy gap?"**

The query falls under **Mode B2: Gap Diagnosis**.

### **Is this a Quick Exit query?**

**NO**.

* The **Quick Exit Path** is reserved for conversational queries, specifically **Modes D (Acquaintance)** and **F (Social)**, to reduce latency to $\<0.5\\text{s}$.  
* Since Mode B2 requires multi-hop graph traversal and analytical reasoning, the Gatekeeper Logic instructs the LLM to proceed directly to Step 2 (RECOLLECT).

### **Code implementation (Gatekeeper Logic)**

\# STEP 1: REQUIREMENTS (within orchestrator\_zero\_shot)

\# LLM call for classification (using core instruction bundle)  
classification\_result \= invoke\_llm\_for\_classification(initial\_prompt, user\_query)  
mode \= classification\_result.mode \# Result: 'B2'

\# Gatekeeper Decision  
if mode in \['D', 'F'\]:  
\# This path is NOT taken for Mode B2  
return handle\_quick\_exit(classification\_result.chat\_response)  
else:  
\# Proceed to Step 2: RECOLLECT  
pass

---

## **Step 2: RECOLLECT (Strategy Determination and Dynamic Loading)**

Since the Quick Exit was not triggered, the system dynamically loads the specific instruction bundles required for the Mode B2 strategy.

### **Which instruction bundles are loaded for this mode?**

Based on the Mode B2 classification, the system loads the following mandatory **Task-Specific Instruction Bundles**:

| Module Name | Tier | Purpose |
| :---- | :---- | :---- |
| **`knowledge_context`** | Foundation | SHARED: Provides the Neo4j schema and domain worldview map (Used for Step 3). |
| **`tool_rules_core`** | Foundation | SHARED: Defines constraints for MCP tools (e.g., Keyset Pagination rules, No Embedding Retrieval). |
| **`strategy_gap_diagnosis`** | Strategy | SPECIFIC: Contains the mandatory protocol for Gap Classification and the "Absence is signal, not silence" framework (Used for Step 4). |
| **`module_memory_management_noor`** | Memory | Defines memory access rules (Personal R/W, Dept/Global R/O) and retrieval strategies (Used in Step 0 and 5). |

### **Show the exact structure of one bundle**

The bundles are stored as full XML instruction blocks in the PostgreSQL `instruction_bundles` table.

**Example Structure: `strategy_gap_diagnosis` Bundle**

\<\!-- Bundle Tag: strategy\_gap\_diagnosis \--\>  
\<INSTRUCTION\_BUNDLE tag="strategy\_gap\_diagnosis" version="1.0.0"\>  
\<PURPOSE\>Protocol for diagnosing gaps and structuring analytical synthesis (Step 4).\</PURPOSE\>

\\\<SECTION title="Synthesis Integrity Protocol"\\\>  

    1\\. Synthesize results from multiple tool calls into cohesive business insights.  

    2\\. Apply Business Language Translation from the glossary (DO NOT use "L3," "Node," or "Cypher" in the final narrative).  

\\\</SECTION\\\>

\\\<SECTION title="Gap Analysis Framework (Absence is Signal, Not Silence)"\\\>  

    IF (Raw data from Step 3 indicates missing relationships or entities) THEN  

        Execute MANDATORY Gap Classification:  

        \\\<GAP\\\_RULE type="Level Mismatch" severity="🔴🔴"\\\>L2 Project links to L3 Capability\\\</GAP\\\_RULE\\\>  

        \\\<GAP\\\_RULE type="Temporal Gap" severity="🟡🟡"\\\>2025 data exists, 2026 data missing\\\</GAP\\\_RULE\\\>  

        \\\<GAP\\\_RULE type="Direct Relationship Missing" severity="🔴🔴"\\\>Policy Tool ↛ Capability\\\</GAP\\\_RULE\\\>  

\\\</SECTION\\\>  

\</INSTRUCTION\_BUNDLE\>

### **How are bundles injected into the prompt?**

The caching strategy relies on a static **System Prompt**. This initial prompt contains the core cognitive loop instructions and is cacheable by the LLM provider. The dynamic bundles retrieved by the agent are loaded into the active context, not the cacheable prefix.

1. **MCP Tool Call:** The LLM calls the `retrieve_instructions` MCP tool with the required tags (`B2` mode tags).  
2. **Context Integration:** The LLM receives the bundle content via the `retrieve_instructions` tool and integrates it into its active context window.

**Code implementation (Context Loading)**

The system is now ready for the **SINGLE LLM INVOCATION**, where the LLM uses this complete prompt and the available MCP tool definitions to internally execute Steps 3, 4, and 5\.

This detailed breakdown focuses on **Step 3: RECALL** for the complex analytical query, "What's our strategy gap in Q4 vs Q1?", showing how the LLM, guided by the dynamically loaded strategy bundles, interacts with the Neo4j Digital Twin via the `read_neo4j_cypher` MCP tool.

The question classifies as **Mode B2 (Gap Diagnosis)**.

---

## **1\. Cypher Query Execution (Step 3: RECALL)**

In Step 3, the LLM converts the intent (diagnosing a strategic gap across two quarters) into highly constrained Cypher queries, leveraging the schema provided in the `knowledge_context` bundle. The execution is handled by the `read_neo4j_cypher` MCP tool.

The query necessitates comparing data across two time periods (Q4 and Q1), requiring mandatory **Temporal Filtering**.

### **Query 1: Retrieval of Q4 Strategy Chain Data (Basis for Comparison)**

This query attempts to retrieve data along a predefined business chain for the target quarter (Q4 of the relevant year, assumed to be 2025).

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q4', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** All entities (Objectives, Tools, Capabilities) linked by the business chain for Q4. **Why:** This establishes the current state baseline for the Gap Diagnosis (Step 4). **Constraints Applied:** Mandatory Temporal Filtering (`year`, `quarter`) and Level Integrity (`level: $Level`). |

### **Query 2: Retrieval of Q1 Strategy Chain Data (Historical Comparison)**

This query performs the same graph traversal for the earlier quarter (Q1).

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q1', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** Historical entities linked by the same chain for Q1. **Why:** Compares the structure of the Digital Twin across two points in time to identify changes, missing links, or degradation (a temporal gap). |

### **Query 3: Aggregation Query (Metric Comparison)**

A simpler query for aggregating performance metrics related to the strategy objectives for both periods.

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (p:sec\_performance {quarter: 'Q4', year: $Year}) **\-\[:IMPACTS\]$\\rightarrow$** (o:sec\_objectives {year: $Year}) **WITH** o, COUNT(p) AS q4\_count **MATCH** (p2:sec\_performance {quarter: 'Q1', year: $Year}) **\-\[:IMPACTS\]$\\rightarrow$** (o) **RETURN** o.name, q4\_count, COUNT(p2) AS q1\_count | **Retrieves:** The count of performance metrics impacting strategic objectives for Q4 and Q1. **Why:** Provides raw KPI data necessary for the Gap Diagnosis reasoning in Step 4\. **Constraint Applied:** Aggregation First Rule. |

## **2\. Level Integrity Enforcement**

Level integrity is a non-negotiable architectural requirement for maintaining the structure of the Digital Twin.

### **What is the L1/L2/L3 Hierarchy?**

Nodes in the knowledge graph are characterized by a **`level`** property: **L1, L2, or L3**. This hierarchy defines the granularity of the data (e.g., L1 might be a high-level goal, L3 might be a project output or detailed capability).

### **Why is "Level Match" required?**

The architecture enforces the **Same-Level Rule**. This rule dictates that traversal paths must only connect entities that reside at the same hierarchical level (e.g., L3 nodes connect only to L3 nodes). This prevents invalid cross-hierarchy joins, such as linking a high-level strategic goal (L1) directly to a granular project component (L3) unless explicitly modeled by an exception.

### **What goes wrong if levels don't match?**

If the LLM generates a Cypher query violating the Same-Level Rule (e.g., `MATCH (l2:sec_objectives {level: 'L2'})-[]-(l3:ent_capabilities {level: 'L3'})`), the following occurs:

* **Trap Prevention:** The **`read_neo4j_cypher` MCP tool** detects the violation because the logic contained in `tool_rules_core` enforces level constraints.  
* **Error Handling:** The MCP tool raises a `ValueError` (or similar constraint violation error).  
* **Recovery:** The LLM receives the error and must immediately execute the **BACKTRACKING** protocol (Step 3 logic). It must regenerate the query, ensuring the levels match, or ask the user for clarification (Mode H).

## **3\. Business Chain Analysis**

Business chain analysis ensures the LLM retrieves data along organizationally meaningful paths required for complex decision-making.

### **What are the 7 predefined business chains?**

The system utilizes **7 predefined business chains** (traversal paths). These paths guide multi-hop graph retrieval for complex analyses.

One example provided is **2A\_Strategy\_to\_Tactics\_Tools**: $\\text{sec\_objectives} \\rightarrow \\text{sec\_policy\_tools} \\rightarrow \\text{ent\_capabilities} \\rightarrow \\text{ent\_projects}$.

### **Which chain applies to "strategy gap" questions?**

For a **Mode B2 (Gap Diagnosis)** query focusing on "strategy gap," the most relevant chain is likely **2A\_Strategy\_to\_Tactics\_Tools**. This chain links the high-level strategic inputs (`sec_objectives`) down through policy mechanisms (`sec_policy_tools`) to the organizational implementation (`ent_capabilities`).

### **How does the system traverse this chain?**

The LLM, utilizing the `strategy_gap_diagnosis` bundle and the schema context, generates a single, multi-hop Cypher query corresponding to the predefined chain.

The traversal is executed in Step 3: RECALL via the `read_neo4j_cypher` MCP tool, ensuring the following:

1. **Path Matching:** The `MATCH` clause follows the required node sequence and relationship types (e.g., `sec_objectives` $\\rightarrow$ `sec_policy_tools`).  
2. **Constraint Application:** Temporal (`year`) and Level (`level`) constraints are applied to **every node** in the chain (as seen in the Cypher Query 1 and 2 examples).  
3. **Gap Detection:** If the full chain traversal fails for Q4 (e.g., Policy Tool nodes exist, but the relationship to Capabilities is missing), the Step 3 execution returns an incomplete or empty result set. This empty result is then flagged in Step 4: RECONCILE, where the **Gap Analysis Framework** applies the rule **"Absence is signal, not silence"** to diagnose a **"Direct Relationship Missing"** gap.

This detailed breakdown focuses on **Step 3: RECALL** for the complex analytical query, "What's our strategy gap in Q4 vs Q1?", showing how the LLM, guided by the dynamically loaded strategy bundles, interacts with the Neo4j Digital Twin via the `read_neo4j_cypher` MCP tool.

The question classifies as **Mode B2 (Gap Diagnosis)**.

---

## **1\. Cypher Query Execution (Step 3: RECALL)**

In Step 3, the LLM converts the intent (diagnosing a strategic gap across two quarters) into highly constrained Cypher queries, leveraging the schema provided in the `knowledge_context` bundle. The execution is handled by the `read_neo4j_cypher` MCP tool.

The query necessitates comparing data across two time periods (Q4 and Q1), requiring mandatory **Temporal Filtering**.

### **Query 1: Retrieval of Q4 Strategy Chain Data (Basis for Comparison)**

This query attempts to retrieve data along a predefined business chain for the target quarter (Q4 of the relevant year, assumed to be 2025).

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q4', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** All entities (Objectives, Tools, Capabilities) linked by the business chain for Q4. **Why:** This establishes the current state baseline for the Gap Diagnosis (Step 4). **Constraints Applied:** Mandatory Temporal Filtering (`year`, `quarter`) and Level Integrity (`level: $Level`). |

### **Query 2: Retrieval of Q1 Strategy Chain Data (Historical Comparison)**

This query performs the same graph traversal for the earlier quarter (Q1).

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q1', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** Historical entities linked by the same chain for Q1. **Why:** Compares the structure of the Digital Twin across two points in time to identify changes, missing links, or degradation (a temporal gap). |

### **Query 3: Aggregation Query (Metric Comparison)**

A simpler query for aggregating performance metrics related to the strategy objectives for both periods.

| Cypher Query | Purpose & Retrieval |
| :---- | :---- |
| **MATCH** (p:sec\_performance {quarter: 'Q4', year: $Year}) **\-\[:IMPACTS\]$\\rightarrow$** (o:sec\_objectives {year: $Year}) **WITH** o, COUNT(p) AS q4\_count **MATCH** (p2:sec\_performance {quarter: 'Q1', year: $Year}) **\-\[:IMPACTS\]$\\rightarrow$** (o) **RETURN** o.name, q4\_count, COUNT(p2) AS q1\_count | **Retrieves:** The count of performance metrics impacting strategic objectives for Q4 and Q1. **Why:** Provides raw KPI data necessary for the Gap Diagnosis reasoning in Step 4\. **Constraint Applied:** Aggregation First Rule. |

## **2\. Level Integrity Enforcement**

Level integrity is a non-negotiable architectural requirement for maintaining the structure of the Digital Twin.

### **What is the L1/L2/L3 Hierarchy?**

Nodes in the knowledge graph are characterized by a **`level`** property: **L1, L2, or L3**. This hierarchy defines the granularity of the data (e.g., L1 might be a high-level goal, L3 might be a project output or detailed capability).

### **Why is "Level Match" required?**

The architecture enforces the **Same-Level Rule**. This rule dictates that traversal paths must only connect entities that reside at the same hierarchical level (e.g., L3 nodes connect only to L3 nodes). This prevents invalid cross-hierarchy joins, such as linking a high-level strategic goal (L1) directly to a granular project component (L3) unless explicitly modeled by an exception.

### **What goes wrong if levels don't match?**

If the LLM generates a Cypher query violating the Same-Level Rule (e.g., `MATCH (l2:sec_objectives {level: 'L2'})-[]-(l3:ent_capabilities {level: 'L3'})`), the following occurs:

* **Trap Prevention:** The **`read_neo4j_cypher` MCP tool** detects the violation because the logic contained in `tool_rules_core` enforces level constraints.  
* **Error Handling:** The MCP tool raises a `ValueError` (or similar constraint violation error).  
* **Recovery:** The LLM receives the error and must immediately execute the **BACKTRACKING** protocol (Step 3 logic). It must regenerate the query, ensuring the levels match, or ask the user for clarification (Mode H).

## **3\. Business Chain Analysis**

Business chain analysis ensures the LLM retrieves data along organizationally meaningful paths required for complex decision-making.

### **What are the 7 predefined business chains?**

The system utilizes **7 predefined business chains** (traversal paths). These paths guide multi-hop graph retrieval for complex analyses.

One example provided is **2A\_Strategy\_to\_Tactics\_Tools**: $\\text{sec\_objectives} \\rightarrow \\text{sec\_policy\_tools} \\rightarrow \\text{ent\_capabilities} \\rightarrow \\text{ent\_projects}$.

### **Which chain applies to "strategy gap" questions?**

For a **Mode B2 (Gap Diagnosis)** query focusing on "strategy gap," the most relevant chain is likely **2A\_Strategy\_to\_Tactics\_Tools**. This chain links the high-level strategic inputs (`sec_objectives`) down through policy mechanisms (`sec_policy_tools`) to the organizational implementation (`ent_capabilities`).

### **How does the system traverse this chain?**

The LLM, utilizing the `strategy_gap_diagnosis` bundle and the schema context, generates a single, multi-hop Cypher query corresponding to the predefined chain.

The traversal is executed in Step 3: RECALL via the `read_neo4j_cypher` MCP tool, ensuring the following:

1. **Path Matching:** The `MATCH` clause follows the required node sequence and relationship types (e.g., `sec_objectives` $\\rightarrow$ `sec_policy_tools`).  
2. **Constraint Application:** Temporal (`year`) and Level (`level`) constraints are applied to **every node** in the chain (as seen in the Cypher Query 1 and 2 examples).  
3. **Gap Detection:** If the full chain traversal fails for Q4 (e.g., Policy Tool nodes exist, but the relationship to Capabilities is missing), the Step 3 execution returns an incomplete or empty result set. This empty result is then flagged in Step 4: RECONCILE, where the **Gap Analysis Framework** applies the rule **"Absence is signal, not silence"** to diagnose a **"Direct Relationship Missing"** gap.

The final two steps of the **Agentic MCP Architecture** are dedicated to transforming the raw data retrieved in Step 3 (RECALL) into actionable intelligence and formatting the final output according to strict architectural constraints.

The query is: **"What's our strategy gap in Q4 vs Q1?"** (Mode B2: Gap Diagnosis).

---

## **Step 4: RECONCILE (Synthesis, Gap Diagnosis, and Insight)**

This step is performed internally by the LLM, strictly adhering to the **`strategy_gap_diagnosis`** bundle. This phase is **CRITICAL AND SEPARATE** from query execution (Step 3: RECALL).

### **Raw Query Results Input (Simulated from Step 3\)**

The LLM receives the raw, validated data from the `read_neo4j_cypher` MCP tool:

1. **Q1 Baseline Data:** A list of 8 linked capabilities and 20 operational metrics impacting the strategic objectives for Q1.  
2. **Q4 Current Data:** A list of 5 linked capabilities. **Crucially, the query attempting to trace the required path from `sec_policy_tools` to `ent_capabilities` for a specific crucial objective returns an empty result set.**  
3. **Metrics:** Q4 metric count: 12\. Q1 metric count: 20\.

### **How "Absence is Signal, Not Silence" Applies**

The core principle of the Gap Analysis Framework is applied here: the empty result set for the crucial relationship in Q4 is not treated as a system error or a data absence, but as a diagnosable institutional gap.

**Reasoning Process Logic:**

1. **Synthesize Findings:** The LLM integrates the Q4 entity set, Q1 entity set, and the metric comparison (12 vs 20).  
2. **Identify Deviation:** Q4 metrics are significantly lower, and the required implementation chain (Policy $\\rightarrow$ Capability) is structurally broken in the current graph state for a key objective.  
3. **Gap Analysis Execution:** Using the **`strategy_gap_diagnosis`** instructions, the LLM diagnoses the missing relationship path. It identifies this failure as a **Structural Gap**.  
4. **Gap Classification:** The failure to traverse the path is classified using the institutional framework:  
   * **Classification:** **Direct Relationship Missing** (Policy Tool $\\rightarrow$ Capability link absent).  
   * **Severity:** **Critical (🔴🔴)**, as it breaks the operational tie between strategy and execution.  
5. **Insight Generation:** The synthesis connects the structural gap to the performance drop: "The decrease in operational metrics (from 20 to 12\) is symptomatic of the missing link between the newly introduced Policy Tool and the underlying organizational Capabilities."  
6. **Confidence Scoring:** The Probabilistic Confidence Score is calculated using the established formula ($\\text{Base Score} \\times \\text{Data Quality Multiplier}$, etc.). Assuming all data retrieved was high quality but the gap is major, the confidence might be high despite the negative finding (e.g., 0.91).

### **Validation Checks Performed**

1. **Source Citation Check:** The LLM internally verifies that all synthesized insights reference the underlying graph data (Query 1 and 2 results) to prevent **hallucination**.  
2. **Artifact Constraint Check:** The LLM confirms that the visualization specification prepared (e.g., a time-series chart of Q1 vs Q4 metrics and a table of missing links) **does not** include the explicitly forbidden `network_graph` type.  
3. **Business Language Check:** The LLM applies the glossary (from `module_business_language`) to ensure the narrative uses terms like "Function" instead of "Capability" or "Project Output" instead of "EntityProject (L3)".

---

## **Step 5: RETURN (Final Output and Memory Save)**

The LLM formats the results into the required JSON schema, performs the conditional memory save, and concludes the single API call.

### **Required JSON Schema for Response**

The final output **MUST** be a valid JSON string adhering to the required schema, containing the synthesized analysis and artifact specifications.

{  
"mode": "B2",  
"confidence\_score": 0.91,  
"gap\_diagnosis": {  
"type": "Direct Relationship Missing",  
"severity": "🔴🔴",  
"details": "The mandatory link between sec\_policy\_tools (Policy X) and ent\_capabilities (Function Y) is absent for Q4, preventing chain traversal."  
},  
"answer": "Based on my analysis, the strategic health has degraded significantly between Q1 and Q4. The primary issue is a structural breakdown: the mandated policy tool is currently disconnected from the operational function it is intended to support. This is categorized as a Critical (🔴🔴) relationship gap.",  
"artifact\_specification": \[  
{  
"type": "table",  
"config": {  
"title": "Strategy Gap Summary: Q4 vs Q1"  
},  
"data": \[  
{"Metric Type": "Operational Visibility Count", "Q1 Value": 20, "Q4 Value": 12, "Status": "Degraded"},  
{"Metric Type": "Structural Integrity", "Q1 Value": "Complete", "Q4 Value": "Broken Link", "Status": "Critical Gap"}  
\]  
},  
{  
"type": "column",  
"config": {  
"title": "Performance Metric Count Trend"  
}  
// ... Chart data structure here  
}  
\],  
"trigger\_memory\_save": false,  
"sources\_cited": \["Q4\_Strategy\_Graph\_Snapshot\_2025", "Q1\_Performance\_Metrics\_2025"\]  
}

### **Response Normalization**

The Response Formatting layer handles the final polishing.

1. **Stripping Comments and Fences:** External JSON fences (e.g., \`\`\`json:disable-run  
2. **Answer Field Extraction:** The final JSON object is processed to extract the `answer` field and `artifact_specification` list for Markdown assembly.  
3. **Normalization Check:** The normalization layer verifies that the final output adheres to the constraints (e.g., ensuring no **JSON Parse Error** occurred and confirming the Business Language Translation was successful by checking for forbidden technical terms).

### **Persistence (Step 5 Execution)**

* **Action:** The LLM generates the final JSON. Persistence is handled by the background pipeline. No explicit tool is called.

This data flow diagram outlines the execution path for the analytical query "What's our strategy gap?" through the Noor Cognitive Digital Twin v3.2's **Agentic MCP Architecture**.

The entire process (Steps 1-5) executes within **one Agentic Session**.

---

### **Input: User asks "What's our strategy gap?" (Mode B2)**

### **1\. Step 0: REMEMBER (Memory Retrieval)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| `User Query` ("What's our strategy gap?"), Session ID. | **Decision Logic:** The query path (Gap Diagnosis) mandates memory retrieval. The system calls the `recall_memory` MCP tool. **Retrieval:** Executes **semantic similarity search** (vector search) in Neo4j, focusing on the **`departmental`** and **`global`** scopes (R/O for Noor). | `recalled_context` (e.g., "Q3 risk analysis showed Level Mismatch gap"). |
| **Example Cypher:** `CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding) YIELD node AS m, score WHERE m.scope = $scope RETURN m.content, score`. |  |  |

### **2\. Step 1: REQUIREMENTS (Mode Classification)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| `User Query`, `recalled_context` (if any), `cognitive_cont` bundle. | **Classification:** LLM analyzes intent and resolved entities. Query is classified as **Mode B2: Gap Diagnosis**. **Gatekeeper Decision:** This is **NOT** a conversational query (D or F). **Quick Exit Path is NOT triggered**. | `interaction_mode` (B2). |

### **3\. Step 2: RECOLLECT (Bundle Loading)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| `interaction_mode` (B2). | **Strategy Retrieval:** LLM calls the `retrieve_instructions` MCP tool. The MCP queries PostgreSQL (`instruction_bundles` table) for all bundles tagged for Mode B2. **Context Loading:** Bundles are retrieved via tool and added to the context. | `bundles_content` (XML instructions, including `strategy_gap_diagnosis`, `knowledge_context`, and `tool_rules_core`). |

### **4\. Step 3: RECALL (Graph Queries)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| **Full Prompt** (Active Context \+ Tools), `read_neo4j_cypher` tool schema. | **Query Generation:** LLM generates Cypher queries matching the predefined **Business Chain** (e.g., 2A\_Strategy\_to\_Tactics\_Tools). **Execution & Validation:** Calls `read_neo4j_cypher` MCP tool. MCP enforces **Level Integrity** and **Keyset Pagination** constraints. Result returned to LLM. **Backtracking:** LLM validates result count. | `raw_query_results` (e.g., List of capabilities linked by strategic chain for Q4 and Q1, metrics data). |

### **5\. Step 4: RECONCILE (Data Synthesis)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| `raw_query_results` (from Step 3), `recalled_context`, `strategy_gap_diagnosis` bundle. | **Synthesis:** LLM merges Q4 and Q1 data. **Gap Analysis:** Applies "**Absence is signal, not silence**". If Q4 data is missing a link found in Q1, it diagnoses a **Temporal Gap** or **Direct Relationship Missing**. **Confidence & Language:** Calculates **Probabilistic Confidence Score**. Applies **Business Language Translation** (avoiding technical terms like "L3"). | **Synthesized JSON Object** (including `gap_diagnosis`, `confidence_score`, and `artifact_specification`). |

### **6\. Step 5: RETURN (Response Formatting)**

| Data Enters | Processing Happens | Data Exits |
| :---- | :---- | :---- |
| Synthesized JSON Object. | **Persistence:** Automated via Pipeline (No tool call). **Normalization:** Orchestrator extracts `answer` and `artifact_specification`. Ensures `network_graph` is **NOT** used. Formats output into Markdown. **Logging:** Records `tokens_input`, `confidence_score`, and `bundles_loaded`. | **Final Markdown Response** (Streamed to Frontend). |

The Noor v3.2 architecture was specifically redesigned to achieve the target performance and cost metrics by migrating from the monolithic prompt architecture (v1.0) to the **Agentic MCP Architecture** with dynamic retrieval.

The query "What's our strategy gap?" is classified as **Mode B2: Gap Diagnosis**. Since this is a **Complex Analysis** query, it requires the full execution of the Cognitive Control Loop (Step 0 through Step 5\) and cannot utilize the fast $0.5\\text{s}$ Quick Exit Path reserved for conversational queries (Modes D, F).

The target latency of $\<500\\text{ms}$ specifically refers to the **Quick Exit Path** (Mode F/D). For a complex **Mode B2** query requiring multiple database calls, the total execution time will necessarily exceed $0.5\\text{s}$, but must still be optimized to meet production standards.

---

## **1\. Latency Breakdown for "Strategy Gap" (Mode B2)**

The execution of a Mode B2 query involves the LLM making multiple synchronous tool calls within its **Agentic Session**. The critical path involves memory retrieval, bundle preparation, and the LLM's primary synthesis step (which includes the graph queries).

| Step | Operation | Source(s) | Estimated Latency |
| :---- | :---- | :---- | :---- |
| **0** | **REMEMBER (Memory Retrieval)** | `recall_memory` MCP tool executes semantic search in Neo4j. Retrieval must be targeted. | $\\approx 200\\text{ms}$ |
| **1** | **REQUIREMENTS (Classification)** | LLM processes input prompt (Core Bundle \+ Memory) and classifies intent (Mode B2). | $\\approx 100\\text{ms}$ |
| **2** | **RECOLLECT (Bundle Loading)** | LLM calls `retrieve_instructions` MCP tool to fetch necessary bundles (e.g., `strategy_gap_diagnosis`). This involves a PostgreSQL lookup. | $\\approx 50\\text{ms}$ |
| **3 & 4 (LLM Loop)** | **RECALL, RECONCILE, Synthesis** | LLM executes **2-3 `read_neo4j_cypher` calls** for Q4/Q1 comparison (Step 3). **Total LLM processing time is dominated by this phase.** Synthesis (Step 4\) happens immediately after data returns. | $\\approx 1,500\\text{ms}$ |
| **5** | **RETURN (Formatting & Logging)** | Final JSON formatting, confidence score check, and logging metadata (`tokens_input`, `bundles_loaded`). | $\\approx 50\\text{ms}$ |
| **Total Estimated Latency** | **(Full Analytical Query)** |  | $\\approx 1,900\\text{ms}$ |

*Note: The target latency of **$\<500\\text{ms}$** applies to the Quick Exit Path (Mode F/D). A complex analysis like Mode B2 is expected to take longer, though the system target for Agentic analytical queries is $\<3\\text{s}$ (P50). The $\\approx 1,900\\text{ms}$ estimate keeps the system within acceptable performance limits for complex analysis.*

### **Critical Path**

The **critical path** is dominated by the **LLM processing time** (Steps 3 and 4), specifically the latency of **Cypher execution** and the LLM's internal **Synthesis/Gap Diagnosis** required for Step 4: RECONCILE. This is because complex analysis requires multi-hop graph traversal.

---

## **2\. Cost Breakdown for "Strategy Gap" (Mode B2)**

The financial goal for v3.2 is to reduce the total monthly operational cost from the v1.0 monolithic cost of **$5,437** to approximately **$\\sim$2,147$** (projected at 1,000 queries/day). The target cost of **$\\sim$1,500/\\text{month}$** requires a slightly lower query volume or higher cache hit rate.

The cost calculation must adhere to the **Corrected Token Accounting Methodology**.

### **Assumptions**

1. **Agent:** Noor (Staff Agent), handling 95% of traffic.  
2. **Model:** Groq `gpt-oss-120b` (Token Optimized).  
3. **Query Volume:** 500 users \* 20 working days/month \* 3 queries/day \= 30,000 queries/month.  
4. **Mode B2 Input Size (Average):** The average complex query size for Noor is estimated at **$7,150 – 9,700$ tokens**. We will use the conservative average of **$8,425$ tokens**.  
5. **LLM Cost Rate:** Noor's estimated cost is **$\\sim$0.019$ per query**.

### **Cost Components per "Strategy Gap" Query (Mode B2)**

| Component | Token Count/Cost Driver | Calculation/Cost | Source(s) |
| :---- | :---- | :---- | :---- |
| **Core Prompt Content** | `cognitive_cont` (Initial System Prompt, Static) | $\\approx 2,500$ tokens |  |
| **Dynamic Tool Output (Bundles)** | `knowledge_context`, `tool_rules_core`, `strategy_gap_diagnosis`, `module_memory_management_noor` (Tool outputs from Step 2\) | $\\approx 3,500$ (Context) $+ 700$ (Rules) $+ 1,200$ (Gap) $+ 800$ (Memory) $= 6,200$ tokens |  |
| **MCP Tool Overhead** | **3 Calls** (1x `retrieve_instructions`, 2x `read_neo4j_cypher`) | $3 \\times \\sim 450$ tokens/call $= \\mathbf{1,350}$ tokens |  |
| **Memory Recall Overhead** | Step 0 (`recall_memory` execution cost) | Included in the MCP Tool Overhead and input prompt size. |  |
| **Total Input Tokens** | Sum of above (excluding history/query content) | $2,500 \\text{ (Core)} \+ 6,200 \\text{ (Dynamic)} \+ 1,350 \\text{ (Tools)} \\approx \\mathbf{10,050}$ tokens |  |
| **LLM API Cost per Query** | Estimated Cost/Query for Noor | $\\mathbf{\\sim$0.019}$ (This rate includes the input and output tokens for the Groq model) |  |
| **Neo4j/DB Query Cost** | Graph traversal, indexing, search, RLS checks (Infra cost) | **$0$** (This is absorbed by the monthly Neo4j Cloud Infrastructure cost, not transactionally billed per query in this model.) |  |
| **Memory Retrieval Cost** | Semantic Search (Step 0\) | **$0$** (Absorbed by LLM API cost, Neo4j infra cost, and the $\\approx 450$ MCP overhead) |  |

### **Cost Calculation for 500 Users/Month**

The target cost of **$\\sim$1,500$ per month** is achieved by strictly managing traffic allocation (95% Noor, 5% Maestro) and minimizing Noor's token count through dynamic bundles.

1. **Total Queries/Month:** 30,000 queries/month.  
2. **Noor Traffic Share (95%):** $30,000 \\times 0.95 \= 28,500$ queries.  
3. **Maestro Traffic Share (5%):** $30,000 \\times 0.05 \= 1,500$ queries.

| Agent | Queries/Month | Estimated Cost/Query | Monthly LLM API Cost | Source(s) |
| :---- | :---- | :---- | :---- | :---- |
| **NOOR** | 28,500 | $\\sim$0.019$ | $\\approx $541.50$ |  |
| **MAESTRO** | 1,500 | $\\sim$0.90$ | $\\approx $1,350.00$ |  |
| **Total LLM Cost** | **30,000** |  | $\\approx $1,891.50$ |  |

The cost model provided for **$1,000$ queries/day ($\\approx 30,000$ queries/month)** results in a total monthly LLM cost of **$\\sim$1,891.50$**.

To reach the target of **$\\sim$1,500$ / month**, the system would need to achieve higher-than-projected token savings (e.g., maximizing the $48%$ savings target, or significantly reducing the average query complexity) and maintain infrastructure costs near the estimated **$$0$ LLM cost** (since database costs are primarily fixed infrastructure fees, estimated at $$7.5\\text{K}/\\text{month}$ for Phase 1 (Pilot) including LLM, meaning infrastructure is $\\approx $5\\text{K}$).

The v3.2 architecture moves the system cost from **$\\sim$5,437$ (v1.0)** to **$\\sim$1,891.50$ (v3.2)** based on the 30,000 query volume, representing a significant saving exceeding 60%.

The following is a complete deployment and operations guide for the **Noor Cognitive Digital Twin v3.2**, built on the **Advanced Tree of Thought: Agentic MCP Architecture**. This guide details the infrastructure, configuration, testing, monitoring, and operational procedures necessary to achieve the target performance (e.g., $\<500\\text{ms}$ for Quick Exit Path) and cost savings.

## **1\. Infrastructure Setup**

The architecture requires the independent deployment of two agents (Noor and Maestro) and utilizes a dual-database structure. The recommended backend framework is FastAPI using Python 3.10+.

### **Docker/Kubernetes Requirements**

The system must be deployed using containerization to support **Horizontal Scaling** of the stateless orchestrator.

| Component | Technology/Requirement | Notes | Source(s) |
| :---- | :---- | :---- | :---- |
| **Backend Framework** | Python 3.10+, FastAPI 0.104.1, Uvicorn 0.24.0 | Deploy **Noor Agent** (Groq) and **Maestro Agent** (OpenAI) as independent deployments. Both use the **Agentic Loop** pattern. |  |
| **Containerization** | Docker containers / Cloud platform (configurable) | The backend orchestrator (MCP layer included) is stateless and designed to scale horizontally behind a load balancer. |  |
| **API Gateway** | Required for **Role-Based Routing**. | Routes Staff/Analyst roles to **Noor** and C-level/Vice Minister roles to **Maestro**. Enforces **NO handoff or escalation logic** between agents. |  |

### **Neo4j Deployment (Graph Database)**

The Neo4j database stores the Knowledge Graph and the Hierarchical Memory.

| Deployment Option | Phase Target | Configuration Requirements | Source(s) |
| :---- | :---- | :---- | :---- |
| **Self-Hosted (Development/Local)** | Phase 1 (Pilot/Local) | Deploy via Docker (`docker-compose.yml`). Requires Neo4j 5.x. |  |
| **Managed (Production)** | Phase 1 (Pilot) $\\rightarrow$ Phase 3 (Growth) | Neo4j AuraDB (managed service) is recommended. Phase 1 uses a **Single Neo4j Enterprise instance**; Phase 2 uses a **Neo4j causal cluster** (3 nodes); Phase 3 uses **Neo4j fabric** (federated graph). |  |
| **Prerequisites** | All Phases | Requires Neo4j 5.x with **APOC procedures** and the ability to define the **4 Memory Tiers**. |  |

### **PostgreSQL Setup for Instruction Bundles**

PostgreSQL (Supabase is the primary database service) is mandatory for the relational storage of messages, user data, and the instruction modules.

| Component | Requirement | Notes | Source(s) |
| :---- | :---- | :---- | :---- |
| **Database** | PostgreSQL 14+ | Used for `instruction_bundles`, supporting dynamic loading for Step 2\. |  |
| **Transactionality** | Must use **PostgreSQL transactions** | Required for bundle updates to ensure **atomic semantic versioning rollout** during operations. |  |
| **Vector Storage** | Requires **`pgvector` extension** | Used if PostgreSQL is chosen for vector storage, though Neo4j is primarily used for the Hierarchical Memory vector index. |  |

### **Groq API Integration**

Noor uses Groq (`gpt-oss-120b`) for its token-optimized LLM.

* **Integration:** Connection is via an API key exposed through environment variables.  
* **Purpose:** Groq executes the Single-Call MCP loop and performs tool calls during inference.

## **2\. Configuration Management**

Configuration must separate secrets, external service credentials, and deployment flags.

### **Environment Variables Needed**

Configuration should utilize Pydantic settings from a `.env` file.

| Variable Name | Purpose | Example Value | Source(s) |
| :---- | :---- | :---- | :---- |
| `NEO4J_URI` | Neo4j connection string (Bolt protocol) | `bolt://neo4j:7687` |  |
| `NEO4J_PASSWORD` | Secure password for Neo4j instance. | `your_secure_password` |  |
| `OPENAI_API_KEY` | API Key for embeddings and Maestro Agent (o1-pro). | `sk-your-api-key-here` |  |
| `LLM_PROVIDER_GROQ` | Groq API Key for Noor Agent. |  |  |
| `EMBEDDING_MODEL` | Model used for vector generation. | `text-embedding-3-small` |  |
| `DEBUG` | FastAPI debug mode setting. | `False` |  |

### **Configuration File Structure**

The standard structure utilizes Python's `pydantic_settings`:

**File:** `backend/app/config.py`

from pydantic\_settings import BaseSettings

class Settings(BaseSettings):  
NEO4J\_URI: str \= "bolt://localhost:7687"  
\# ... other mandatory Neo4j, LLM, and App configurations

\\\# Feature Flags  

ENABLE\\\_CANARY: bool \\= False

class Config:  

    env\\\_file \\= ".env"

settings \= Settings()

### **Secrets Management**

Sensitive credentials (like `NEO4J_PASSWORD` and `OPENAI_API_KEY`) should be managed securely, exposed only via environment variables. In production, this requires integration with cloud KMS/Secrets Managers, bypassing local `.env` files.

### **Feature Flags for A/B Testing**

The system supports controlled bundle rollout using feature flags integrated with the PostgreSQL schema.

* **Mechanism:** The `instruction_bundles` table includes fields for `status` (`active`, `draft`, `deprecated`) and `experiment_group`.  
* **A/B Testing:** Canary testing is initiated by inserting a new bundle version with `status = draft` and routing 1% of users via the `experiment_group` flag.

## **3\. Database Initialization**

Database initialization ensures the schemas enforce the non-negotiable architectural constraints (e.g., Composite Keys, Hierarchical Memory).

### **Neo4j Schema Creation Scripts**

The schema enforces **Universal Design Principles** and the Hierarchical Memory structure.

// 1\. Digital Twin Constraint (Composite Key Enforcement)  
CREATE CONSTRAINT FOR (n:sec\_objectives) REQUIRE (n.id, n.year) IS NODE KEY;

// 2\. Hierarchical Memory Node Constraint (4 Tiers)  
CREATE CONSTRAINT FOR (m:Memory) REQUIRE (m.scope, m.key) IS UNIQUE;

// 3\. Vector Index Creation (Mandatory for Step 0: REMEMBER)  
CALL db.index.vector.createNodeIndex(  
'memory\_semantic\_index',  
'Memory',  
'embedding',  
1536,  
'cosine'  
);

### **PostgreSQL Migrations**

Migrations define the tables needed for instruction versioning and tracking.

CREATE TABLE instruction\_bundles (  
tag TEXT PRIMARY KEY,  
content TEXT NOT NULL,  
version TEXT NOT NULL,          \-- Semantic Versioning (MAJOR.MINOR.PATCH)  
status TEXT NOT NULL,           \-- 'active', 'deprecated', 'draft'  
experiment\_group TEXT  
);

CREATE TABLE usage\_tracking (  
session\_id TEXT,  
bundle\_tag TEXT,  
timestamp TIMESTAMPTZ,  
\-- Tracks Observability metrics like bundles loaded  
...  
);

### **Initial Data Loading**

1. **Digital Twin Data:** Load the core knowledge graph entities and relationships, ensuring all nodes include mandatory `id`, `year`, and `level` properties. Data can be imported using tools like Neo4j Data Importer or Cypher's `LOAD CSV` command.  
2. **Instruction Bundles:** Load the initial 10 atomic instruction modules (e.g., `knowledge_context`, `strategy_gap_diagnosis`) into PostgreSQL with `status = 'active'`.

### **Vector Index Population**

The `Neo4jService` must initialize the vector index on startup. Embeddings for the Digital Twin nodes and initial memory context must be generated using the `OpenAI text-embedding-3-small` model and persisted to the graph.

## **4\. Testing Strategy**

The strategy focuses on validating the V3.2 constraints (Hierarchical Memory, Single-Call execution, Token Economics).

### **Unit Tests for Each Component**

Unit tests verify the isolated logic of the MCP tools and utility functions.

* **`mcp_client.py` (`read_neo4j_cypher`):** Test must assert that executing Cypher containing `SKIP 10` or `OFFSET 5` raises a `ValueError` (Keyset Pagination trap prevention).

### **Integration Tests for Control Loop**

Tests validate the integrity of the fixed 5-step sequence (Step 0 $\\rightarrow$ Step 5).

* **Quick Exit Validation:** Test a Mode F query ("Hi") and assert that the LLM generates a Zero-Tool Response in $\<0.5\\text{s}$ without calling `read_neo4j_cypher`.  
* **Backtracking Validation:** Simulate `read_neo4j_cypher` returning a constraint violation (`ValueError`) and assert that the LLM initiates the **Backtracking** procedure instead of crashing or hallucinating (Trap 6).

### **End-to-End Test Scenarios**

Verify the full path integrity, including:

1. **Mode B2 Gap Diagnosis:** Verify the final JSON output contains a `gap_diagnosis` field and a calculated `confidence_score`.  
2. **Role-Based Routing:** Test C-suite user request; assert traffic is routed to **Maestro** (Port 8003\) via the API Gateway.

### **Load Testing (500 Users Scenario)**

Load testing validates horizontal scalability and token economics.

* **Target Load:** 950 concurrent Noor users and 50 Maestro users (scaling for 10,000 staff Phase 3 is 10,000 users).  
* **Metric Validation:** Verify that the average `tokens_input` for Noor queries remains within the $40-48%$ cost savings target compared to the v1.0 monolithic baseline.

### **Trap Pattern Testing (All 6 Traps)**

Tests must confirm proactive measures against prohibited behaviors:

* Test input ambiguity and assert Mode H (Clarification) is triggered (Trap 3).  
* Test Cypher generation attempts to retrieve non-existent relationships (Absence is Signal, Not Silence) and verify Step 4 diagnoses a Structural Gap (Trap 1/2).

## **5\. Monitoring & Observability**

Observability is based on **Structured Logging** to validate V3.2 claims and is essential for Operations.

### **Key Metrics to Track**

| Metric Category | Metrics | Source(s) |
| :---- | :---- | :---- |
| **Token Economics (Cost)** | `tokens_input` (Total input tokens), `tokens_output`, **Token Counting Validation**. |  |
| **Performance (Latency)** | Latency for Quick Exit Path, P95 Latency for Complex Analysis, **MCP Tool Overhead** duration. |  |
| **Quality** | **Probabilistic Confidence Score** (generated in Step 4), Output Validation Checklist status. |  |
| **Memory System** | **Recall Hit Rate per Tier**, Memory Save Frequency (validates Step 0 effectiveness). |  |

### **Logging Strategy**

Logging must be structured (JSON format).

* **Required Fields:** `agent_id` (Noor/Maestro), `bundles_loaded` (Validates Step 2), `tokens_input`, `confidence_score`.  
* **Neo4j Monitoring:** Utilize Neo4j Aura's built-in monitoring, advanced metrics, and Query Log Analyzer to troubleshoot query performance.

### **Tracing**

Tracing is critical for the Agentic MCP Architecture. Tracing must capture the sequence of calls initiated by the LLM:

* **Trace Span:** Start at the FastAPI route and end at the final response.  
* **MCP Tool Spans:** Isolate spans for each external call: `retrieve_instructions` (PostgreSQL), `read_neo4j_cypher` (Neo4j), and `recall_memory` (Neo4j Vector Index). Tracing validates the synchronous execution during the single LLM inference.

### **Alerting Thresholds**

* **Critical Alert:** Average **Noor Input Tokens** exceeds $\\approx 10,000$ (indicates token savings failure).  
* **Latency Alert:** P99 latency for Quick Exit Path exceeds $1.0\\text{s}$.  
* **Quality Alert:** Average **Confidence Score** drops below $0.75$.

## **6\. Operations Runbooks**

### **How to Debug a Failed Query**

1. **Check API Gateway Logs:** Verify correct **Role-Based Routing** (Noor vs Maestro).  
2. **Analyze Structured Logs:** Examine the specific query log entry (`session_id`). Check the `intent_mode` (Step 1\) and `bundles_loaded` (Step 2\) to see if the correct strategy was initialized.  
3. **Trace MCP Failures:** Look for `ValueError` (Constraint Violation) from `read_neo4j_cypher` (Step 3\) or `PermissionError` from `recall_memory` (Step 0). If a `ValueError` is present, the LLM failed to generate compliant Cypher.  
4. **Review Neo4j Query Log Analyzer:** Identify slow or inefficient queries generated by the LLM that hit database scan warnings.

### **How to Handle Memory Corruption**

Memory corruption in the Hierarchical Memory (Neo4j) requires controlled intervention:

1. **Audit:** Use memory metrics to identify which tier (`personal`, `departmental`, `global`) has high save frequency/low confidence.  
2. **Maestro Curation:** If `departmental` or `global` memory is corrupted, Maestro (the Curation Agent, which has R/W access to these tiers) must be used in batch mode to clean up or overwrite low-confidence memories ($\\text{Confidence Score} \< 0.85$).  
3. **Backup/Restore:** Utilize Neo4j Aura's backup, export, and restore capabilities for disaster recovery.

### **How to Roll Back Instruction Bundles**

Instruction bundles use **Semantic Versioning** (MAJOR.MINOR.PATCH) and a **Blue-Green Deployment Strategy**.

1. **Identify Failure:** Observe a performance drop or quality metric failure after a new bundle version (e.g., v1.1.0) was deployed.  
2. **Instant Rollback:** Immediately update the `status` field of the faulty bundle version from `active` to `deprecated` in the PostgreSQL `instruction_bundles` table.  
3. **Cache Invalidation:** Ensure the MCP layer's instruction cache is instantly invalidated, forcing the system to load the previous stable version (e.g., v1.0.0) where `status = 'active'`.

### **How to Scale to 1000 Users (Phase 2 Target: 2,000 Users)**

Scaling is horizontal and requires database upgrades.

1. **Backend Scaling:** Increase the number of stateless Noor and Maestro containers behind the load balancer.  
2. **Database Scaling:** Upgrade Neo4j from the Phase 1 Single Enterprise instance to a **Neo4j causal cluster (3 nodes)** (Phase 2 target). PostgreSQL may require sharding.

## **7\. Deployment Checklist**

### **Pre-Deployment Validation**

* \[ \] Verify PostgreSQL schema includes `instruction_bundles` with `status` and `version` fields.  
* \[ \] Verify Neo4j schema includes the **`:Memory`** node and the **`memory_semantic_index`** vector index.  
* \[ \] Verify all 10 atomic instruction bundles are loaded into PostgreSQL with `status = 'active'`.  
* \[ \] Run Unit and Integration tests to validate MCP constraints (e.g., Keyset Pagination is enforced).

### **Canary Deployment Steps**

1. \[ \] Insert new bundle version (e.g., v1.1.0) into PostgreSQL with `status = 'draft'`.  
2. \[ \] Route 1% of target user traffic using the `experiment_group` field lookup logic.  
3. \[ \] Monitor `avg_confidence` and latency for the canary group for 24 hours.

### **Health Checks**

* \[ \] **Liveness Probe:** Verify FastAPI/Uvicorn process is running.  
* \[ \] **Readiness Probe:** Verify the service can successfully connect to the Groq API, the PostgreSQL instruction store, and the Neo4j Graph Database (initial connectivity check).

### **Rollback Procedures**

* \[ \] If canary testing fails, immediately change the `status` of the new instruction bundles from `draft` to `deprecated`.  
* \[ \] If the entire Noor agent deployment fails, route all traffic back to the previous stable version deployment (Blue-Green method).

### **Post-Deployment Verification**

* \[ \] Confirm API Gateway is correctly enforcing **Role-Based Routing** (Staff $\\rightarrow$ Noor; C-suite $\\rightarrow$ Maestro).  
* \[ \] Verify structured logging is successfully capturing `tokens_input` and `bundles_loaded` in production environment.  
* \[ \] Test a Mode F query ("Hello") and assert that the response is instant, confirming the **Quick Exit Path** is functional.

\`\`\`   
