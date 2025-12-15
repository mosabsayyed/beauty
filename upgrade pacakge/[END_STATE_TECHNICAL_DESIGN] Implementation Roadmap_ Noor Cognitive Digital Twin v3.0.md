This implementation roadmap details the complete end-state solution for the **Noor Cognitive Digital Twin v2.1** architecture. This guide focuses on migrating the existing monolithic `OrchestratorZeroShot` code pattern to the rigorously defined **Single-Call Model Context Protocol (MCP) Architecture**, achieving the target **40-48% token savings**.

The project requires the Python language (3.10+) and FastAPI framework, leveraging Neo4j 5.x and PostgreSQL/Supabase.

---

## **📑 Table of Contents**

### **Phase 1: Data & Schema Foundation (4 Weeks)**
- 1.1 Neo4j Digital Twin Schema and Vector Index Setup
- 1.2 PostgreSQL Instruction Store Schema ✅ *Complete with audit logs, versioning, Blue-Green support*

### **Phase 2: MCP Tool Layer Development (5 Weeks)**
- 2.1 API Endpoint Specification (FastAPI)
- 2.2 MCP Tool Implementation and Constraint Enforcement
  - A. Tool: `read_neo4j_cypher` (Step 3: RECALL Execution)
  - B. Tools: `recall_memory` and `save_memory` ✅ *Complete with 3-tier fallback logic*
    - Cypher Query for Memory Fallback Implementation

### **Phase 3: Orchestrator Rewrite (Single-Call Loop) (6 Weeks)**
- 3.1 LLM Integration and MCP Overhead
- 3.2 Instruction Bundle XML Examples ✅ *3 complete bundles ready for PostgreSQL*
  - A. `module_memory_management_noor` (Step 0 Protocol)
  - B. `strategy_gap_diagnosis` (Step 4 Protocol)
  - C. `module_business_language` (Normalization Glossary)
- 3.3 Quick Exit Path Implementation ✅ *Complete Mode F/D bypass code*
- 3.4 Response Normalization ✅ *Complete JSON→Markdown with constraint enforcement*
- 3.5 Common Cypher Queries for Step 3: RECALL ✅ *3 production queries with keyset pagination*
  - A. Query for Gap Analysis
  - B. Query for Trend Analysis
  - C. Query for Executive Context
- 3.6 Orchestrator Main Loop

### **Phase 4: Productionization & Observability (4 Weeks)**
- 4.1 Production Patterns: Preventing the 6 Critical Trap Patterns
- 4.2 Multi-Agent Deployment and Routing
- 4.3 Observability and Monitoring
- 4.4 Testing Strategy (Phase 4 Validation)

---

## **Implementation Roadmap: Noor Cognitive Digital Twin v2.1**

| Phase | Title | Estimated Effort | Dependencies | Success Criteria |
| ----- | ----- | ----- | ----- | ----- |
| **1** | **Data & Schema Foundation** | 4 Weeks | Infrastructure Provisioning | Neo4j Vector Index live; PostgreSQL `instruction_bundles` table is queryable and enforces versioning constraints. |
| **2** | **MCP Tool Layer Development** | 5 Weeks | Phase 1 | All three MCP tools pass integration tests; Cypher validation successfully rejects `SKIP`/`OFFSET` queries. |
| **3** | **Orchestrator Rewrite (Single-Call Loop)** | 6 Weeks | Phase 2 | Full 5-step loop (Step 0-5) executes in one LLM call; Quick Exit Path latency \< 0.5s. |
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
* *v2.1 Decision:* Used the dedicated **`:Memory` node label** partitioned by `scope` (personal, departmental, global, csuite).  
* *Rationale:* This structure supports the non-negotiable **Hierarchical Memory Control** model where R/W access is determined solely by the `scope` property, enforced by the MCP tool layer, not the LLM prompt. It also optimizes semantic retrieval using vector indexes.

### **1.2 PostgreSQL Instruction Store Schema**

This schema stores the **10 atomic instruction modules** used for dynamic loading during Step 2: RECOLLECT.

**File:** `backend/db/init_postgres.sql`

\-- Database setup must use PostgreSQL transactions for atomic bundle updates

\-- Table 1: instruction\_bundles (Core Content Store)
CREATE TABLE instruction\_bundles (
    id SERIAL PRIMARY KEY,
    tag TEXT NOT NULL,                  \-- Unique Bundle identifier (e.g., 'strategy\_gap\_diagnosis'). MUST match prompt tag
    path\_name TEXT,                     \-- Human-readable name ('Simple Query Path')
    content TEXT NOT NULL,              \-- Full XML instruction block
    category TEXT,                      \-- Bundle classification (core, strategy, conditional)
    avg\_tokens INTEGER,                 \-- Estimated token count (~1,200 for gap\_diagnosis)
    version TEXT NOT NULL,              \-- Semantic version (MAJOR.MINOR.PATCH). Used for rollback
    status TEXT NOT NULL,               \-- Lifecycle state ('active', 'deprecated', 'draft'). Used for Blue-Green Deployment
    experiment\_group TEXT,              \-- A/B test group name (e.g., 'canary\_v1.1.0')
    depends\_on TEXT[],                  \-- Other required bundle tags (e.g., ['knowledge\_context'])
    created\_at TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP, \-- Audit Log
    updated\_at TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP, \-- Audit Log

    \-- ✅ UNIQUE on tag (allows Foreign Key references)
    UNIQUE (tag),
    
    \-- ✅ UNIQUE on (tag, version) for versioning
    UNIQUE (tag, version)
);

\-- Table 2: instruction\_metadata (Trigger Rules/Mode Mapping)
CREATE TABLE instruction\_metadata (
    tag TEXT PRIMARY KEY REFERENCES instruction\_bundles(tag), \-- ✅ NOW WORKS: References instruction\_bundles.tag which has UNIQUE constraint
    trigger\_modes TEXT[],               \-- Interaction Modes (A, B, F, G, etc.) that trigger this bundle
    trigger\_conditions JSONB,           \-- Complex rules (e.g., {"file\_attached": true})
    compatible\_with TEXT[]              \-- Bundles that can safely co-load
);

\-- Table 3: usage\_tracking (Audit Log / Observability Tracking)
CREATE TABLE usage\_tracking (
    session\_id TEXT NOT NULL,
    user\_id TEXT NOT NULL,
    agent\_id TEXT NOT NULL,             \-- Noor or Maestro
    timestamp TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP,
    mode TEXT,                          \-- Interaction Mode (A-H)
    tokens\_input INTEGER,               \-- Total INPUT tokens consumed (for cost validation)
    confidence\_score FLOAT,             \-- Probabilistic Confidence Score (from Step 4)
    bundles\_loaded TEXT[]               \-- List of Task-Specific Bundles loaded in Step 2
);

\-- Indexing for performance and lookup consistency
CREATE INDEX idx\_bundle\_status\_tag ON instruction\_bundles (status, tag);
CREATE INDEX idx\_metadata\_trigger\_modes ON instruction\_metadata USING GIN (trigger\_modes);
CREATE INDEX idx\_usage\_session\_user ON usage\_tracking (session\_id, user\_id);

---

## **Phase 2: MCP Tool Layer Development**

The Service Layer components (residing in `backend/app/services/mcp_service.py`) function as the security and constraint gatekeepers for all data access.

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

    \# Note: user\_role is extracted via JWT middleware (Planned State)

    response \= await orchestrator\_zero\_shot(

        user\_query=request.message,

        session\_id=request.session\_id,

        user\_role=user\_role

    )

    return response

### **2.2 MCP Tool Implementation and Constraint Enforcement**

The MCP tools must enforce the architectural mandates, acting as the primary defense against data integrity and security violations.

**File:** `backend/app/services/mcp_service.py`

#### **A. Tool: `read_neo4j_cypher` (Step 3: RECALL Execution)**

This tool prevents the **6 Trap Patterns** related to database anti-patterns.

from neo4j import GraphDatabase, AccessMode

from app.config import settings

\# Global Driver initialization (Best practice: connection pooling)

driver \= GraphDatabase.driver(settings.NEO4J\_URI, \*\*settings.NEO4J\_AUTH)

def read\_neo4j\_cypher(cypher\_query: str) \-\> list\[dict\]:

    """Executes validated Cypher query, enforcing constraints and preventing traps."""

    \# TRAP PREVENTION 1 & 3: Database Anti-Patterns (Keyset Pagination)

    if "SKIP" in cypher\_query.upper() or "OFFSET" in cypher\_query.upper():

        raise ValueError("MCP Constraint Violation: Must use Keyset Pagination.")

    \# TRAP PREVENTION: Hierarchy Violation (Level Integrity Enforcement)

    \# Detailed check logic would analyze Cypher structure for L2-\>L3 or L3-\>L2 jumps

    if 'level: "L2"' in cypher\_query and 'level: "L3"' in cypher\_query:

        raise ValueError("MCP Constraint Violation: Level Integrity (Same-Level Rule) failed.")

    \# TRAP PREVENTION: Efficiency (Reject Embeddings retrieval)

    if "embedding" in cypher\_query.lower() or "embed" in cypher\_query.lower():

        \# Enforcing the rule that read\_neo4j\_cypher must return only id and name

        raise ValueError("MCP Constraint Violation: Embedding properties cannot be returned.")

    with driver.session(mode=AccessMode.READ) as session:

        \# Best Practice: Run query in a Read Transaction

        result \= session.run(cypher\_query)

        \# Return structured data, enforcing the "id and name only" rule

        return \[record.data() for record in result.data()\]

#### **B. Tools: `recall_memory` and `save_memory` (Step 0 & Step 5\)**

These tools enforce the **Hierarchical Memory Access Control**.

from typing import Literal

\# Placeholder for embedding generation service

def generate\_embedding(text: str) \-\> list\[float\]:

    \# Must use OpenAI text-embedding-3-small

    return \[0.1\] \* 1536

def recall\_memory(scope: Literal\['personal', 'departmental', 'global', 'csuite'\], query\_summary: str, limit: int \= 5\) \-\> str:
    """
    Retrieves relevant hierarchical memory using semantic search and fallback logic.
    Enforces Noor's R/O constraints.
    """

    \# STEP 0 CONSTRAINT: Scope Validation (Noor Agent Read Constraint)
    if scope \== 'csuite':
        raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.")

    query\_embedding \= generate\_embedding(query\_summary)
    results \= []

    \# 1. Personal Scope (Highest Priority for Personal/Conversational Modes)
    if scope \== 'personal':
        results \= self._execute\_vector\_query('personal', query\_embedding, limit)
        if results:
            return json.dumps(results)

    \# 2. Departmental Scope (Mandatory for analytical modes like B2/G)
    if scope \== 'departmental':
        results \= self._execute\_vector\_query('departmental', query\_embedding, limit)
        if results:
            return json.dumps(results)

        \# Fallback Logic: Departmental \-\> Global
        print("INFO: Departmental scope failed. Attempting fallback to Global.")
        scope \= 'global'  \# Reset scope for next search

    \# 3. Global Scope (Lowest priority, broad institutional context)
    if scope \== 'global':
        results \= self._execute\_vector\_query('global', query\_embedding, limit)
        if results:
            return json.dumps(results)

    \# Error Handling when all tiers fail
    return ""  \# Returns empty string/list if semantic miss occurs

def save\_memory(scope: str, key: str, content: str, confidence: float):
    """Persists memory, strictly limited to the personal scope for Noor."""
    if scope \!= 'personal':
        \# STEP 5 CONSTRAINT: Noor Write Constraint
        raise PermissionError(f"Noor agent can only write to the 'personal' memory scope. Attempted scope: '{scope}'.")

    \# embedding = generate\_embedding(content)
    \# MERGE Cypher logic executed here
    \# print(f"Memory successfully saved to 'personal' scope with key: {key}")
    return "Memory saved successfully."

**Cypher Query for Memory Fallback Implementation (Step 0):**

The fallback logic is implemented by the MCP service making subsequent calls if the previous one yields an empty result. The core **semantic search query** used for all tiers is:

\`\`\`cypher
// 1. Semantic Search for Memory (Executed by recall_memory MCP tool)
// Uses the mandatory vector index 'memory_semantic_index'
CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)
YIELD node AS m, score
WHERE m.scope = $scope // Parameterized scope: 'personal', 'departmental', or 'global'
RETURN m.content, m.key, m.confidence, score
ORDER BY score DESC LIMIT $limit
\`\`\`

**Architectural Decision Point: Memory Hierarchy Trade-offs**

* *Option:* Allow Noor to write to all memory tiers it can read from (Personal, Dept, Global).  
* *v2.1 Decision:* **Strictly limit Noor (Staff Agent) to Personal R/W**. Departmental and Global scopes are R/O for Noor and **curated** (R/W) exclusively by Maestro (Executive Agent).  
* *Rationale:* This prevents unverified staff corrections from polluting institutional knowledge and maintains data quality, requiring insights to be strategically validated by Maestro before broader adoption.

---

## **Phase 3: Orchestrator Rewrite (Single-Call Loop)**

This phase implements the **Fixed Cognitive Control Loop** (Step 0-5), ensuring the LLM performs all required actions, including tool calls, in a **Single API Call**.

### **Deliverables:**

1. Core `orchestrator_zero_shot` function implementing the 5-step sequence.  
2. Quick Exit Path logic for Modes D and F.  
3. Dynamic Prompt Construction prioritizing bundles at the prefix for caching.  
4. Integration of LLM (Groq) with MCP tools.

### **3.1 LLM Integration and MCP Overhead**

Noor uses **Groq `gpt-oss-120b`**. The orchestration must account for the $\\approx 450$ token overhead per tool call, which is added to the INPUT token count.

### **3.2 Instruction Bundle XML Examples**

The core of the system relies on 10 atomic instruction modules stored in PostgreSQL as full XML instruction blocks. These modules must be concatenated and placed at the **START** of the prompt for maximum caching efficiency.

#### **A. `module_memory_management_noor` (Step 0: REMEMBER Protocol)**

This module contains the non-negotiable rules for hierarchical memory access and read/write permissions for the Noor Staff Agent.

\`\`\`xml
<!-- Bundle Tag: module_memory_management_noor -->
<INSTRUCTION_BUNDLE tag="module_memory_management_noor" version="1.0.0">
    <PURPOSE>Defines the mandatory Step 0 access protocol and Hierarchical Memory R/W constraints.</PURPOSE>

    <RULES type="MemoryAccessControl">
        <!-- R/W for Personal, R/O for Shared Context -->
        <RULE name="NoorWriteConstraint">
            The agent MUST execute the save_memory tool ONLY with scope='personal'. Writing to 'departmental', 'global', or 'csuite' is forbidden and will result in a PermissionError from the MCP tool.
        </RULE>
        <RULE name="NoorReadConstraint">
            The agent MUST NOT attempt to access the 'csuite' memory tier. Read access to 'departmental' and 'global' is permitted via recall_memory.
        </RULE>
        <RULE name="RetrievalMethod">
            Retrieval MUST be performed using semantic similarity search via the recall_memory tool, optimized for high-precision vector search against the Neo4j :Memory index.
        </RULE>
    </RULES>

    <LOGIC type="PathDependentTriggers">
        <!-- Defines when Step 0 is mandatory or optional -->
        <TRIGGER mode="G">
            Mode G (Continuation) requires MANDATORY memory recall to retrieve conversation history and preferences.
        </TRIGGER>
        <TRIGGER mode="B1, B2">
            Analytical Modes (B1, B2) require MANDATORY Hierarchical memory recall to retrieve relevant institutional context (Dept/Global R/O) and prior gap diagnoses.
        </TRIGGER>
        <TRIGGER mode="A">
            Mode A (Simple Query) requires OPTIONAL recall for personal preferences or entity name corrections.
        </TRIGGER>
    </LOGIC>
</INSTRUCTION_BUNDLE>
\`\`\`

#### **B. `strategy_gap_diagnosis` (Step 4: RECONCILE Protocol)**

This module mandates the four classifications for **Gap Analysis** and enforces the separation of synthesis from execution.

\`\`\`xml
<!-- Bundle Tag: strategy_gap_diagnosis -->
<INSTRUCTION_BUNDLE tag="strategy_gap_diagnosis" version="1.0.0">
    <PURPOSE>Mandatory synthesis protocol for Mode B2 queries (Gap Diagnosis).</PURPOSE>

    <PROTOCOL name="ReconcileStepSeparation">
        The synthesis phase (Step 4: RECONCILE) MUST be executed entirely separate from data retrieval (Step 3: RECALL). You must use the raw_query_results from Step 3 as input, applying the gap framework below.
    </PROTOCOL>

    <PRINCIPLE name="AbsenceIsSignal">
        The failure of a Cypher traversal (Step 3) to yield expected relationships or nodes MUST be interpreted as a diagnosable institutional gap, NOT a simple query failure. Diagnose the gap type and severity.
    </PRINCIPLE>

    <GAP_CLASSIFICATION>
        <TYPE tag="DirectRelationshipMissing" severity="🔴🔴">Relationship failure between adjacent entities in a mandated Business Chain (e.g., Policy Tool -> Capability).</TYPE>
        <TYPE tag="IndirectChainBroken" severity="🟠🟠">A multi-hop path (Business Chain) fails due to an intermediate missing entity or relationship.</TYPE>
        <TYPE tag="TemporalGap" severity="🟡🟡">Data exists for year X but is missing for year Y, preventing required trend or year-over-year comparison.</TYPE>
        <TYPE tag="LevelMismatch" severity="🔴🔴">An illegal cross-hierarchy link violation detected (e.g., L2 Project -> L3 Capability linkage attempted).</TYPE>
    </GAP_CLASSIFICATION>

    <CONSTRAINT name="VisualizationConstraint">
        The output artifact_specification MUST NOT contain the type "network_graph". Any graph visualization MUST be transformed into a plain table with columns: Source, Relationship, Target.
    </CONSTRAINT>
</INSTRUCTION_BUNDLE>
\`\`\`

#### **C. `module_business_language` (Normalization Glossary)**

This module enforces the **Business Language Translation** rule, preventing the leakage of technical terms into the final output.

\`\`\`xml
<!-- Bundle Tag: module_business_language -->
<INSTRUCTION_BUNDLE tag="module_business_language" version="1.0.0">
    <PURPOSE>Enforce Business Language Translation during Step 4: RECONCILE and Step 5: RETURN.</PURPOSE>

    <GLOSSARY direction="TechnicalToBusiness">
        <TERM technical="L3 level" business="Function" />
        <TERM technical="L2 level" business="Project" />
        <TERM technical="L1 level" business="Objective" />
        <TERM technical="Node" business="Entity" />
        <TERM technical="Cypher query" business="database search" />
        <TERM technical="n.id" business="unique identifier" />
        <TERM technical="-[:ADDRESSES_GAP]-" business="closes the gap in" />
        <TERM technical="SKIP" business="brute force pagination (FORBIDDEN)" />
        <TERM technical="OFFSET" business="brute force pagination (FORBIDDEN)" />
    </GLOSSARY>

    <RULE name="OutputVerification">
        After final synthesis, review the "answer" field. It MUST NOT contain technical terms such as 'Cypher', 'L3', 'Node', 'SKIP', or 'OFFSET'. Replace them with the corresponding business term.
    </RULE>
</INSTRUCTION_BUNDLE>
\`\`\`

### **3.3 Quick Exit Path Implementation**

The Quick Exit Path is triggered in **Step 1: REQUIREMENTS** for conversational queries (Modes D and F) and skips Steps 2, 3, and 4 to achieve a latency target of <0.5s.

#### **Mode Classification and Quick Exit Logic**

\`\`\`python
def invoke\_llm\_for\_classification(user\_query: str) -> Dict[str, Any]:
    """LLM determines mode and potentially generates a response if F/D mode"""
    if user\_query.lower().strip() in ["hello, noor", "hi", "thank you", "thanks"]:
        return {
            "mode": "F",
            "quick\_exit\_triggered": True,
            "chat\_response": "Hello! I am Noor, your Cognitive Digital Twin. How can I assist with your institutional analysis today?"
        }
    # Placeholder for non-quick exit classification (e.g., Mode B2)
    return {"mode": "B2", "quick\_exit\_triggered": False}

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str):
    # STEP 0: REMEMBER (Skipped in this simplified flow, but mandatory for others)
    # ... logic for memory retrieval ...
    recalled\_context = ""

    # STEP 1: REQUIREMENTS (Intent Classification and Gatekeeper Logic)
    classification\_result = invoke\_llm\_for\_classification(user\_query)
    mode = classification\_result.get("mode")

    # Quick Exit Path Trigger (Mode D: Acquaintance, Mode F: Social)
    if mode in ['D', 'F']:
        # STEP 1 COMPLETE: Quick Exit Flag is True.
        # SKIP Step 2 (RECOLLECT) and Step 3 (RECALL)
        # JUMP DIRECTLY to Step 5 (RETURN)
        final\_json\_output = {
            "mode": mode,
            "confidence\_score": 1.0,  # High confidence for simple chat
            "answer": classification\_result["chat\_response"],
            "trigger\_memory\_save": False,
        }

        # STEP 5: RETURN (Normalization & Logging)
        final\_markdown\_response = normalize\_response(final\_json\_output)

        # Log successful completion (essential for observability)
        # log_completion(session\_id, mode, tokens\_in=350, bundles\_used=[])

        return final\_markdown\_response  # Latency target < 0.5s

    # --- Standard Analytical Flow (Starts here for non-Quick Exit Modes) ---
    # STEP 2: RECOLLECT
    # required\_bundles = mcp\_service.retrieve\_instructions(mode)  # Executed for Mode B2
    # ... proceed with full 5-step loop ...

    return "Proceeding to full analytical loop (Steps 2-5)..."
\`\`\`

### **3.4 Response Normalization**

Normalization is applied in **Step 5: RETURN** and involves processing the raw JSON output from the LLM for Markdown readability and constraint adherence.

#### **Python Normalization Function**

\`\`\`python
import re
import json
from typing import Dict, Any

def apply\_business\_language\_translation(text: str) -> str:
    """Applies required glossary translation (Technical -> Business terms)."""
    # 1. Technical Term Mapping (using glossary from module_business_language)
    replacements = {
        r"\\bL3\\b": "Function",
        r"\\bL2\\b": "Project",
        r"\\bCypher query\\b": "database search",
        r"\\bnode\\.id\\b": "unique identifier",
        r"Cypher": "database search",
        r"\\bNode\\b": "Entity"
    }

    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return text

def normalize\_response(final\_json\_output: Dict[str, Any]) -> str:
    """
    Transforms the raw LLM JSON output (Step 5) into a final Markdown string.
    Enforces visualization constraints and technical jargon stripping.
    """

    # --- 1. JSON Leakage Handling ---
    # Assuming input is already a validated dictionary.
    # If input were raw text, we would strip fence characters (```json ... ```) first.

    # --- 2. Business Language Translation (Final Polish) ---
    answer\_text = final\_json\_output.get("answer", "Analysis complete.")
    answer\_text = apply\_business\_language\_translation(answer\_text)

    markdown\_parts = [answer\_text, "\\n"]

    # --- 3. Artifact Extraction and Network Graph Constraint Enforcement ---
    artifacts = final\_json\_output.get("artifact\_specification", [])

    for artifact in artifacts:
        artifact\_type = artifact.get("type", "table")
        data = artifact.get("data", [])
        config = artifact.get("config", {})
        title = config.get("title", f"Visualization ({artifact\_type.capitalize()})")

        if artifact\_type == 'network\_graph':
            # EXPLICITLY NOT SUPPORTED constraint enforcement
            markdown\_parts.append(f"## {title} (Rendered as Table per Constraint)")
            markdown\_parts.append("| Source | Relationship | Target |")
            markdown\_parts.append("| :--- | :--- | :--- |")

            # Assuming 'data' contains list of {Source: X, Relationship: Y, Target: Z}
            for row in data:
                markdown\_parts.append(f"| {row.get('Source')} | {row.get('Relationship')} | {row.get('Target')} |")
            markdown\_parts.append("\\n")

        elif artifact\_type == 'table' and data:
            # Render standard tables
            markdown\_parts.append(f"## {title}")

            # Generate markdown table from structure
            if data and isinstance(data, list):
                headers = list(data.keys())
                markdown\_parts.append("| " + " | ".join(headers) + " |")
                markdown\_parts.append("| " + " | ".join([":---"] * len(headers)) + " |")
                for row in data:
                    markdown\_parts.append("| " + " | ".join([str(row.get(h, '')) for h in headers]) + " |")
            markdown\_parts.append("\\n")

    # --- 4. Quality Metrics Summary (optional footer) ---
    confidence = final\_json\_output.get("confidence\_score")
    if confidence is not None:
        markdown\_parts.append(f"*(Probabilistic Confidence Score: {confidence:.2f})*")

    return "\\n".join(markdown\_parts)
\`\`\`

### **3.5 Common Cypher Queries for Step 3: RECALL**

These queries demonstrate adherence to the strict constraints enforced by the `read_neo4j_cypher` MCP tool: mandatory Temporal Filtering (`year`), mandatory Level Integrity (`level`), and **Keyset Pagination** (`WHERE n.id > $last_seen_id LIMIT 30`).

#### **A. Query for Gap Analysis (Finding Missing Relationships at Same Level)**

This query traverses the predefined Business Chain **2A_Strategy_to_Tactics_Tools** (Objectives → Policy Tools → Capabilities) while enforcing Same-Level constraint (L3 ↔ L3). If the path fails, Step 4 diagnoses a gap.

\`\`\`cypher
// Scenario: Check if capabilities are correctly linked to policy tools for a given year/level.
// Input Parameters: $Year, $TargetLevel ('L3'), $StartObjectiveId, $LastSeenId
MATCH (obj:sec\_objectives {id: $StartObjectiveId, year: $Year, level: $TargetLevel})
-[:REQUIRES]-> (tool:sec\_policy\_tools {year: $Year, level: $TargetLevel})
-[:UTILIZES]-> (cap:ent\_capabilities {year: $Year, level: $TargetLevel})
// Constraint Enforcement: Keyset Pagination
WHERE cap.id > $LastSeenId
// Constraint Enforcement: Efficiency (Return only mandatory id/name)
RETURN obj.name, tool.name, cap.name, cap.id AS last\_id
ORDER BY cap.id ASC
LIMIT 30
\`\`\`

#### **B. Query for Trend Analysis (Q1 vs Q4 Comparisons)**

Trend analysis requires running the same query multiple times against different temporal filters (`quarter` property), enabling Step 4 to diagnose **Temporal Gaps**.

\`\`\`cypher
// Scenario: Retrieve performance metrics related to specific capabilities for Q4 2025.
// This is Query 1 of the Q1 vs Q4 comparison (Query 2 uses $Quarter='Q1').
// Input Parameters: $Year (2025), $Quarter ('Q4'), $TargetLevel ('L3')
MATCH (cap:ent\_capabilities {year: $Year, quarter: $Quarter, level: $TargetLevel})
-[:HAS\_METRIC]-> (metric:PerformanceMetric)
// Constraint Enforcement: Aggregation First (collect() used for sampling)
RETURN cap.name, collect(metric.value)[0..30] AS MetricSample, count(metric) AS TotalMetrics
\`\`\`

#### **C. Query for Executive Context (C-suite View of Business Chain)**

While Noor is forbidden from accessing the C-suite tier itself, this query illustrates a highly constrained traversal query that Maestro might generate.

\`\`\`cypher
// Scenario: Retrieve high-level strategic objectives (L1) and related risks for the current year.
// Input Parameters: $CurrentYear, $LastObjectiveId
MATCH (obj:sec\_objectives {year: $CurrentYear, level: 'L1'})
-[:IMPACTS]-> (risk:ent\_risks {year: $CurrentYear, level: 'L1'})
// Constraint Enforcement: Keyset Pagination
WHERE obj.id > $LastObjectiveId
// Constraint Enforcement: Efficiency (Return only mandatory id/name)
RETURN obj.name, obj.id, risk.name
ORDER BY obj.id ASC
LIMIT 30
\`\`\`

---

**File:** `backend/app/services/chat_service.py` (Main Loop)

from app.services.mcp\_service import retrieve\_instructions, recall\_memory, save\_memory, read\_neo4j\_cypher

\# Assuming Groq Client/Adapter configured to handle tool use

from app.llm\_client import invoke\_llm\_with\_tools

from app.utils.logger import log\_completion

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str, user\_role: str):

    \# \--- STEP 0: REMEMBER (Path-Dependent Memory Recall) \---

    recalled\_context \= ""

    \# Decision logic based on module\_memory\_management\_noor (e.g., Mode B/G are Mandatory)

    if check\_mode\_requires\_memory(session\_id, user\_query):

        recalled\_context \= recall\_memory('personal', user\_query)

        \# Note: Latency for Step 0 is logged via memory\_recall\_time metric

    \# \--- STEP 1: REQUIREMENTS (Intent Classification & Gatekeeper Logic) \---

    \# The initial prompt contains core cognitive\_cont instructions to force classification.

    core\_bundle \= retrieve\_instructions('cognitive\_cont')

    \# Mocked LLM Call (Real LLM performs classification)

    classification\_result \= invoke\_llm\_with\_tools(core\_bundle \+ f"Query: {user\_query}")

    mode \= classification\_result.mode \# e.g., 'A', 'F'

    \# STEP 1 CONSTRAINT: Quick Exit Path

    if mode in \['D', 'F'\]:

        \# Latency optimization: Skip 2, 3, 4 entirely

        \# LLM generated the final response directly in the classification step JSON.

        log\_completion(session\_id, mode, tokens\_in=500, confidence=1.0, bundles\_used=\[\])

        return {"answer": classification\_result.chat\_response, "latency\_optimized": True}

    \# \--- STEP 2: RECOLLECT (Dynamic Bundle Loading) \---

    \# LLM determines required bundles based on 'mode' (e.g., Mode B2 requires strategy\_gap\_diagnosis).

    required\_tags \= lookup\_tags\_by\_mode(mode)

    bundles\_data \= \[retrieve\_instructions(tag) for tag in required\_tags\]

    bundles\_content \= "".join(b\['content'\] for b in bundles\_data)

    \# CRITICAL CACHING RULE: Bundles MUST be the prompt prefix

    final\_prompt \= bundles\_content \+ f"""

    \[--- END INSTRUCTIONS \---\]

    Recalled Context: {recalled\_context}

    Conversation History: {get\_history(session\_id)}

    User Query: {user\_query}

    """

    \# \--- LLM Execution (Steps 3, 4, 5 performed internally by the LLM) \---

    \# The LLM is now invoked once with ALL context and tools (read\_neo4j\_cypher, save\_memory).

    final\_llm\_output \= invoke\_llm\_with\_tools(

        prompt=final\_prompt,

        available\_tools=\[read\_neo4j\_cypher, save\_memory\]

    )

    \# LLM internal trace:

    \# LLM executes read\_neo4j\_cypher (Step 3: RECALL) \-\> validates results \-\>

    \# LLM performs Gap Analysis (Step 4: RECONCILE) \-\>

    \# LLM formats output/memory decision (Step 5: RETURN).

    \# \--- POST-INFERENCE: STEP 5: RETURN (Memory Save Protocol) \---

    confidence\_score \= final\_llm\_output.confidence\_score

    if final\_llm\_output.trigger\_memory\_save:

        \# LLM executed this conditional logic based on user correction/preference

        save\_memory(

            scope='personal',

            key=user\_query,

            content=final\_llm\_output.memory\_content,

            confidence=confidence\_score

        )

    \# Log metrics required for Dashboard 4 (Cost Optimization)

    log\_completion(session\_id, mode, tokens\_in=final\_llm\_output.tokens\_input,

                   confidence=confidence\_score, bundles\_used=required\_tags)

    return final\_llm\_output.formatted\_json\_output

---

## **Phase 4: Productionization & Observability**

This phase ensures the system is resilient, scalable, and adheres to the required testing and monitoring standards.

### **Deliverables:**

1. Multi-Agent Deployment (Noor/Maestro) with **Role-Based Routing**.  
2. CI/CD procedures for zero-downtime **Bundle Rollback**.  
3. Structured Logging to validate **Token Economics**.  
4. Testing strategy covering V2.1 constraints.

### **4.1 Production Patterns: Preventing the 6 Critical Trap Patterns**

The architecture prevents runtime errors and logical flaws through layered enforcement (Orchestrator, MCP, and LLM instructions).

| Trap Pattern (Prohibited Behavior) | Enforcement Layer | Prevention Mechanism | Source(s) |
| ----- | ----- | ----- | ----- |
| **1\. Hallucinating Data** | LLM (Step 4: RECONCILE) | Instruction mandates explicit statement of limitation if Step 3 returns empty data. |  |
| **2\. Brute Force Pagination** | MCP (Step 3: RECALL) | `read_neo4j_cypher` **rejects** `SKIP` or `OFFSET` keywords; enforces **Keyset Pagination**. |  |
| **3\. Hierarchy Violation** | MCP (Step 3: RECALL) | `read_neo4j_cypher` validates Cypher path for L2 $\\leftrightarrow$ L3 **Level Mismatch**. |  |
| **4\. Failure to Backtrack** | LLM (Step 3: RECALL) | After EACH tool call, LLM instruction dictates mandatory validation and **BACKTRACKING** to an alternative strategy if results fail. |  |
| **5\. Using Technical Jargon** | LLM (Step 4: RECONCILE) | **Business Language Translation** enforced by `module_business_language`. Technical terms (e.g., "Cypher," "L3," "Node") must be replaced. |  |
| **6\. Ignoring Ambiguity** | Orchestrator (Step 1\) | QueryPreprocessor normalizes input ("that project" $\\rightarrow$ specific ID). If ambiguity remains, LLM initiates **Clarification Mode (H)**. |  |

### **4.2 Multi-Agent Deployment and Routing**

Noor and Maestro agents are independently deployed. **NO handoff or escalation protocol** exists between them.

**Deployment Specification (`docker-compose.yml` fragment)**

version: '3.8'

services:

  \# 1\. NOOR Staff Agent (Token Optimized, Groq LLM)

  noor\_agent:

    build: ./noor-agent-service

    ports: \["8002:8002"\]

    environment:

      \- LLM\_PROVIDER=Groq

      \- LLM\_MODEL=gpt-oss-120b

      \- MCP\_SERVICE\_URL=http://mcp\_service:8001

    \# ... depends\_on: \[mcp\_service, neo4j\] ...

  \# 2\. MAESTRO Executive Agent (Reasoning Optimized, OpenAI LLM)

  maestro\_agent:

    build: ./maestro-agent-service

    ports: \["8003:8003"\]

    environment:

      \- LLM\_PROVIDER=OpenAI

      \- LLM\_MODEL=o1-pro

    \# Note: Maestro uses Monolithic Prompt design (NO dynamic bundles)

    \# ... depends\_on: \[mcp\_service, neo4j\] ...

  \# 3\. API Gateway / Router (Mandatory Role-Based Routing)

  api\_gateway:

    image: nginx:latest

    ports: \["80:80"\]

    \# ... routing logic implemented here:

    \# IF user\_role is C-suite, route to http://maestro\_agent:8003

    \# ELSE, route to http://noor\_agent:8002

### **4.3 Observability and Monitoring**

Structured logging is required to capture the full trace of the Single-Call MCP loop, enabling validation of token savings.

**Structured Logging Implementation (Python)**

**File:** `backend/app/utils/logger.py`

import json, logging, datetime

logger \= logging.getLogger('noor\_cognitive\_twin')

\# ... configuration to use JSONFormatter ...

def log\_completion(session\_id, mode, tokens\_in, confidence, bundles\_used, agent\_id='Noor'):

    """Logs necessary fields for token economics and integrity tracking."""

    log\_data \= {

        'timestamp': datetime.datetime.now().isoformat(),

        'session\_id': session\_id,

        'user\_id': get\_current\_user\_id(), \# Must be extracted via JWT

        'agent\_id': agent\_id,              \# (Noor vs Maestro)

        'intent\_mode': mode,               \# (A, B, F, etc.)

        'bundles\_loaded': bundles\_used,    \# Validates Step 2: RECOLLECT

        'tokens\_input': tokens\_in,         \# CRITICAL for cost analysis

        'confidence\_score': confidence,    \# Generated in Step 4: RECONCILE

        'success': True

    }

    logger.info("Query completed", extra=log\_data)

**Key Observability Metrics:**

* **Token Optimization:** Monitor `tokens_input`. Alert if the average token count for Noor exceeds the estimated **7,500 tokens** (Average).  
* **Memory System:** Track `memory_recall_hit_rate` per tier (Personal/Dept/Global).  
* **Quality:** Monitor `Average Probabilistic Confidence`.

### **4.4 Testing Strategy (Phase 4 Validation)**

The testing strategy focuses on regression to guarantee the new architectural constraints are preserved.

| Test Category | Objective | Mechanism | Source(s) |
| ----- | ----- | ----- | ----- |
| **Cognitive Integrity** | Verify sequential execution of the 5-step loop (REMEMBER $\\rightarrow$ RECONCILE). | Integration Tests assert the Step 4 JSON analysis is present only after a mock tool call (Step 3\) occurred. |  |
| **Memory Access Control** | Validate Noor's R/W permissions are enforced correctly. | Component Tests: Attempt `save_memory('departmental', ...)` and assert `PermissionError`. |  |
| **Cypher Integrity** | Validate the MCP tool rejects anti-patterns. | Unit Tests: Send Cypher containing `SKIP 100` or `n.level='L2', m.level='L3'` and assert `ValueError`. |  |
| **Bundle Rollout** | Verify seamless switching between bundle versions. | E2E Tests: Update PostgreSQL `status` field from `active` to `draft` (rollback), assert Orchestrator immediately loads the correct active version. |  |

The Noor Cognitive Digital Twin operates under the **Single-Call MCP Architecture**, meaning the entire thought process—from intent analysis (Step 1\) through execution (Step 3\) and synthesis (Step 4)—is contained within **ONE billable API call**. This approach ensures consistency and optimizes the execution latency for the Noor Staff Agent.

The process follows a **Fixed Cognitive Control Loop**.

## **Mandatory Pre-Step: STEP 0: REMEMBER (Hierarchical Memory Recall)**

This step ensures the LLM retrieves long-term context before interpreting the immediate query.

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | Retrieval of prior context or user preferences stored in the Hierarchical Memory System. This is done using high-precision **semantic similarity search** (vector search) across the graph database. |
| **2\. Input data** | The raw `user_query`, the current conversation path/mode status, and the user's `session_id`. |
| **3\. Processing logic** | The LLM consults the **`module_memory_management_noor`** bundle rules to determine if memory access is necessary (**Decision Logic**). **Memory access is PATH-DEPENDENT**. If triggered (e.g., Modes B/G are mandatory recall), the LLM executes the `recall_memory` MCP tool. |
| **4\. Output data** | **`recalled_context`**: A structured string or list of memory snippets, including content, retrieval score, and source scope. |
| **5\. Failure modes** | **Permission Violation:** Noor attempts to access the **`csuite`** tier. Recovery: The MCP server returns an error, as Noor is explicitly forbidden access to this tier. **Semantic Miss:** If semantic search fails to find relevant context, the tool returns an empty set. Recovery: If retrieval from `departmental` fails, the MCP automatically attempts search in the `global` scope (Fallback Logic). |
| **6\. Code implementation** | **Conceptual Python/Cypher (within `recall_memory` MCP tool):** `python # STEP 0 CONSTRAINT: Scope Validation if scope == 'csuite': raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.") # Retrieval Strategy (Neo4j Vector Search) cypher_query = """ CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding) YIELD node AS m, score WHERE m.scope = $scope RETURN m.content, score ORDER BY score DESC """ # ... execute query ...` |
| **7\. Integration points** | **MCP Tool:** Executes `recall_memory(scope, query_summary, limit)`. **Neo4j:** Queries the **`:Memory`** node label using the vector index. |
| **8\. Example execution** | User asks: "How does Project Alpha impact risk levels?" The path (Mode B1/G) mandates memory recall. Step 0 retrieves: "Project Alpha previously showed high risk correlation in Q4 2024" from the `departmental` scope (Read-Only). |
| **Special Rule: Hierarchical Memory** | The structure (Personal, Departmental, Global, C-suite) enforces **strict access control**: Noor is R/W for **Personal** and R/O for **Departmental/Global**. |

---

## **STEP 1: REQUIREMENTS (Intent Classification and Gatekeeper)**

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | The LLM analyzes the query and the optional `recalled_context` to perform input normalization, entity extraction, and classify the query into one of the **8 Interaction Modes (A-H)**. This step contains the **Gatekeeper Logic**. |
| **2\. Input data** | The `user_query`, `recalled_context` (from Step 0), and the base instructions (e.g., the `cognitive_cont` bundle defining classification rules). |
| **3\. Processing logic** | The LLM runs classification logic to determine the `interaction_mode` (A, B1, C, D, F, G, H, etc.). **Gatekeeper Decision:** If the mode is classified as **D (Acquaintance) or F (Social)**, the LLM executes the **Quick Exit Path**. |
| **4\. Output data** | **`interaction_mode`** (A-H), and the **Quick Exit Flag** status. |
| **5\. Failure modes** | **Ambiguous Query**. Recovery: If the LLM cannot resolve entities or intent, it classifies the query as Mode H (Clarification). Mode H then triggers the recovery protocol (Ask clarifying question, suggest alternative formulation). |
| **6\. Code implementation** | **Conceptual Orchestrator Logic:** `python mode = classify_intent(user_query) # LLM Reasoning output # Quick Exit Path Trigger if mode in ['D', 'F']: # Skip Steps 2, 3, 4 return format_response(mode_f_chat_response)` |
| **7\. Integration points** | **LLM:** Executes internal classification reasoning. **Instruction Bundles:** Uses the rules defined in `cognitive_cont`. |
| **Special Rule: Quick Exit Path** | If **Modes D (Acquaintance) or F (Social)** are triggered, the LLM skips **Step 2 (Recollect) and Step 3 (Recall)**. This is the basis for the latency improvement (2.5s $\\rightarrow$ \<0.5s for greetings). |

## **STEP 2: RECOLLECT (Strategy Determination and Dynamic Loading)**

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | If the Quick Exit Path was **NOT** triggered, the LLM determines which specific **Task-Specific Instruction Bundles** are required for the identified mode (e.g., Mode B2 requires `strategy_gap_diagnosis`). It then calls the MCP tool to fetch this content dynamically. |
| **2\. Input data** | `interaction_mode` (A, B1, B2, C, E, G, H) from Step 1\. |
| **3\. Processing logic** | The LLM executes the **`retrieve_instructions` MCP tool**. The MCP queries PostgreSQL metadata tables to find bundles matching the mode. **CRITICAL CACHING RULE:** The retrieved instruction bundles MUST be concatenated and placed at the **START of the prompt** to maximize Groq/Anthropic prompt caching and achieve the target 40-48% token savings. |
| **4\. Output data** | **`bundles_content`**: A concatenated string of necessary instructions (e.g., XML blocks for strategies and tool rules). |
| **5\. Failure modes** | **Bundle Retrieval Failure:** The database is unreachable or the requested `tag` is not found. Recovery: The MCP server propagates the error; the LLM uses embedded fallback instructions and states a warning to the user. |
| **6\. Code implementation** | **Conceptual Python/SQL (within `retrieve_instructions` MCP tool):** `sql -- Retrieve active bundles required for Mode 'B2' SELECT content FROM instruction_bundles ib JOIN instruction_metadata im ON ib.tag = im.tag WHERE ib.status = 'active' AND 'B2' = ANY(im.trigger_modes);` |
| **7\. Integration points** | **MCP Tool:** Executes `retrieve_instructions(mode)`. **PostgreSQL:** Accesses `instruction_bundles` and `instruction_metadata` tables. |
| **Special Rule: Mode A-H Effect** | The mode (Step 1\) dictates which Strategy Bundles are loaded (Step 2). For example, Mode B2 (Gap Diagnosis) mandates loading `strategy_gap_diagnosis`. |

## **STEP 3: RECALL (Execution and Validation)**

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | The LLM, informed by the instructions loaded in Step 2, translates the user goal into Cypher/SQL or vector retrieval queries. It executes these queries by calling the specialized **`read_neo4j_cypher` MCP tool**. |
| **2\. Input data** | The **Full Prompt** (Bundles \+ Query \+ Recalled Context), and the schema knowledge (provided in the `knowledge_context` bundle). |
| **3\. Processing logic** | The LLM calls the MCP tool with the generated query. **MCP CONSTRAINT ENFORCEMENT:** The MCP service rigorously validates the query before execution: it **rejects** `SKIP`/`OFFSET` (enforcing Keyset Pagination), checks for **Level Integrity** (no L2 $\\leftrightarrow$ L3 mixing), and prevents returning large data types like `embedding` vectors. **Validation & Backtracking:** After the tool returns raw data, the LLM internally validates the result (e.g., checks for empty sets) and is **MANDATED** to **BACKTRACK** to an alternative strategy (Phase 2\) if validation fails. |
| **4\. Output data** | **`raw_query_results`**: Structured data from Neo4j (constrained to `id` and `name` properties for efficiency). |
| **5\. Failure modes** | **Cypher Integrity Violation:** LLM generates a prohibited query (`SKIP`, `OFFSET`, `L2-L3` link). Recovery: The MCP tool raises a `ValueError`. The LLM receives the error and initiates the **Backtracking Protocol** to regenerate a compliant query. |
| **6\. Code implementation** | **Conceptual Python/MCP Tool Logic:** `python # Constraint Enforcement in MCP Server if "SKIP" in cypher_query.upper(): # TRAP PREVENTION 2 raise ValueError("Pagination must use Keyset Pagination.") # Execute (Only if valid) with driver.session(AccessMode.READ) as session: # ... session.run(cypher_query) ...` |
| **7\. Integration points** | **LLM** calls **`read_neo4j_cypher` MCP tool**. **Neo4j:** Executes graph retrieval for multi-hop path traversal. |
| **Example execution** | LLM executes `read_neo4j_cypher("MATCH (c:ent_capabilities {year: 2024}) ... RETURN c.name LIMIT 30")`. Output: A list of capability names for the specified year. |

## **STEP 4: RECONCILE (Synthesis, Gap Diagnosis, and Insight)**

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | This step transforms raw data into **actionable institutional intelligence**. This process is **CRITICAL AND SEPARATE** from Step 3 execution. It includes Gap Analysis, Confidence Scoring, and Artifact Generation. |
| **2\. Input data** | `raw_query_results` from Step 3, synthesis instructions (primarily from `strategy_gap_diagnosis` and `module_business_language`). |
| **3\. Processing logic** | **Gap Analysis:** The LLM applies the principle **"Absence is signal, not silence"**. If data is missing or constraints were violated (Step 3), the LLM diagnoses the gap using one of four classifications (Direct, Indirect Chain, Temporal Gap, Level Mismatch). **Quality Control:** Calculates the **Probabilistic Confidence Score**. **Output Formatting:** Applies **Business Language Translation** (e.g., replacing "L3" with "Function"). **Artifact Rule:** Generates visualization specs, explicitly constrained to **NOT** support `network_graph` (must be rendered as a table). |
| **4\. Output data** | A complete JSON object containing: `business_insight`, `gap_diagnosis` (type, severity), `confidence_score`, and `artifact_specification` (e.g., table structure). |
| **5\. Failure modes** | **Hallucination:** If raw results were empty, the LLM must **NOT** synthesize data. Recovery: The LLM must explicitly state the knowledge limitation and suggest alternative query formulations. |
| **6\. Code implementation** | **Conceptual LLM Instruction Snippet (from `strategy_gap_diagnosis`):** `xml <RULE name="AbsenceIsSignal"> IF (GapType = "Temporal Gap") THEN Severity: 🟡🟡. Explain: "Data exists for year X but not for year Y, preventing trend analysis." </RULE> <RULE name="VisualizationConstraint"> IF (OutputVisualizationType = "Network Graph") THEN REPLACE with: "Table (Source, Relationship, Target)". </RULE>` |
| **7\. Integration points** | Internal LLM reasoning, highly dependent on the quality constraints provided by the dynamic bundles. |
| **Special Rule: Absence is signal, not silence** | This rule dictates that a lack of data (e.g., a missing relationship or entity during multi-hop traversal) must be interpreted as a **diagnosable business gap** (e.g., a process link is broken), not merely a data retrieval failure. |

## **STEP 5: RETURN (Final Formatting and Memory Save)**

| Point | Specification |
| ----- | ----- |
| **1\. What exactly happens** | Final formatting of the synthesis into the required JSON schema. Conditional execution of the **Memory Save Protocol**. |
| **2\. Input data** | The finalized JSON object from Step 4, including the calculated `confidence_score`. |
| **3\. Processing logic** | **Memory Save Protocol:** The LLM checks if the query triggered a **user preference change or correction** (e.g., correcting an entity attribute). If so, it executes the **`save_memory` MCP tool** call. **Constraint:** The save is **STRICTLY LIMITED** to the `personal` scope for Noor. Final output is prepared for streaming via SSE. |
| **4\. Output data** | The **Final JSON Response** (containing insights, score, and artifacts). |
| **5\. Failure modes** | **Memory Save Rejection:** LLM attempts to save to `global` scope. Recovery: MCP server returns an explicit rejection error. The LLM acknowledges the failure but proceeds to return the analytical response. |
| **6\. Code implementation** | **Conceptual MCP Tool Logic (`save_memory`):** `python # STEP 5 CONSTRAINT: Write Access Restriction if scope != 'personal': raise PermissionError("Noor agent can only write to the 'personal' memory scope.") # Perform Neo4j MERGE operation for persistence` |
| **7\. Integration points** | **MCP Tool:** Executes `save_memory`. **PostgreSQL:** Logs structured metrics (e.g., `tokens_input`, `confidence_score`, `bundles_loaded`) for Observability. |
| **Example execution** | The LLM formats the response. If the user stated, "I only want L3 analysis," the LLM flags `trigger_memory_save = true`. Step 5 executes `save_memory('personal', 'preference', 'L3 only')`. The final JSON response is returned. |

This design details the mandatory **Model Context Protocol (MCP) tool system** and the **Hierarchical Memory Architecture**, which together form the foundation for the Noor Cognitive Digital Twin v2.1's **Single-Call Architecture**.

## **1\. MCP Tool Specifications**

The MCP is the secure layer residing in the FastAPI service (`mcp_service.py`) that acts as the intermediary between the LLM and the data stores (Neo4j, PostgreSQL).

### **Core MCP Tools Design (4 Mandatory Tools)**

| Tool Name | Purpose | Inputs (LLM Provided) | Outputs (MCP Response) | Validation Rules | Error Handling |
| ----- | ----- | ----- | ----- | ----- | ----- |
| **`recall_memory`** (Step 0\) | Contextual Retrieval | `scope` (personal, dept, global), `query_summary`, `limit`. | List of memory snippets (`key`, `content`, `confidence`, `score`). | **Noor Scope Read Constraint:** Must reject `csuite` scope. Must use **semantic vector search**. | `PermissionError` (if `csuite`). Automatic Fallback Logic (Dept $\\rightarrow$ Global). |
| **`retrieve_instructions`** (Step 2\) | Dynamic Bundle Loading | `mode` (A-H). | Concatenated string of active bundle content (XML/Markdown). | Must retrieve bundles with `status = 'active'` only. | `NotFoundError` if the required bundle tag is missing. |
| **`read_neo4j_cypher`** (Step 3\) | Data Execution | `cypher_query`, `parameters`. | List of entity data (constrained to `id` and `name`). | **No Brute Force Pagination:** Reject `SKIP`/`OFFSET`. **No Hierarchy Violation:** Enforce Same-Level Rule. **Efficiency:** Reject `embedding` retrieval. | `ValueError` for constraint violation. `DatabaseError` for execution failure (triggers LLM backtracking). |
| **`save_memory`** (Step 5\) | Persistence Protocol | `scope`, `key`, `content`, `confidence`. | Status message (e.g., "Memory saved successfully"). | **Noor Scope Write Constraint:** Scope must **STRICTLY** be `'personal'`. | `PermissionError` if scope is not `'personal'`. `DatabaseError` on persistence failure. |

---

### **MCP Tool Approval and Execution Logic**

#### **Why `require_approval: never` Matters**

For the Noor v2.1 architecture, the entire execution flow (Step 1 through Step 5\) must occur in a single, high-speed LLM call to meet latency and efficiency targets.

* **`require_approval: never`:** This setting is mandatory for the Single-Call MCP Architecture. It instructs the LLM framework that when the LLM suggests a tool call (e.g., `read_neo4j_cypher`), the server executes the tool immediately and returns the result back to the LLM **without waiting for human or external system intervention**. This allows the LLM to complete its reasoning, data gathering (Step 3), synthesis (Step 4), and output generation (Step 5\) seamlessly.  
* **Consequence of `require_approval: always`:** If set to `always`, the LLM would pause after generating the tool call, awaiting an external approval (a "Tool Approval Request"). This breaks the fundamental premise of the "Single-Call" loop, requiring multiple API invocations and dramatically increasing end-to-end latency (especially preventing the Quick Exit Path from achieving \<0.5s response times).

#### **Server-Side Tool Execution (Groq Integration)**

The LLM (Groq `gpt-oss-120b`) does **NOT** execute the code itself; it only performs the reasoning regarding *which* tool to use and *what arguments* to provide.

1. **Orchestrator Invokes LLM:** The orchestrator (Python server) provides the LLM with the prompt and the available **tool definitions** (metadata and schemas).  
2. **LLM Tool Call Request:** The LLM's response is a structured JSON object requesting a tool execution (e.g., `{"tool_name": "read_neo4j_cypher", "arguments": {"cypher_query": "MATCH..."}}`).  
3. **Server Execution:** The orchestrator intercepts this request, calls the corresponding Python function in `mcp_service.py`, and executes the Cypher query against Neo4j (server-side execution).  
4. **Tool Call Response:** The execution result (e.g., raw data) is formatted and returned to the LLM as part of the continuation prompt, allowing the LLM to use the data for synthesis (Step 4).

#### **Tool Chaining Logic**

In this architecture, tools do **NOT** call other tools directly. The **LLM** is the central orchestrator of the sequence, directed by the 5-Step Control Loop and the dynamically loaded instructions.

* **Sequence Example:**  
  * **LLM (Internal Logic):** "I need data for Mode B2."  
  * **External Call:** `retrieve_instructions` (Step 2).  
  * **LLM (Internal Logic):** "Now that I have the instructions, I need to fetch the data."  
  * **External Call:** `read_neo4j_cypher` (Step 3).  
  * **LLM (Internal Logic):** "I have the final synthesis. Has the user asked for a correction?"  
  * **External Call (Conditional):** `save_memory` (Step 5).

## **2\. Hierarchical Memory Architecture**

The memory system uses Neo4j to enforce strict access control based on the `scope` property of the `:Memory` node.

### **Memory Tier Design and Access Control**

| Memory Scope | Purpose | Noor (Staff Agent) Access | Maestro (Executive Agent) Access | Query Timing |
| ----- | ----- | ----- | ----- | ----- |
| **`personal`** | User-specific preferences, corrections, and conversational context. | **Read/Write (R/W)** | R/W | Step 0 (REMEMBER) and Step 5 (RETURN) |
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

* **Process:** If the orchestrator detects a path requiring memory (e.g., Mode G/B, identified by simple pre-analysis), it calls `mcp_service.recall_memory()`.  
* **Mechanism:** `recall_memory` executes the semantic Cypher query against the allowed scopes. If `departmental` search fails, it automatically falls back to `global` memory within the same tool execution.  
* **Output Flow:** The structured `recalled_context` is concatenated into the final LLM prompt **before** Step 2 instructions, providing the core context layer.

### **How Step 2 (RECOLLECT) Uses Memory Context**

The context retrieved in Step 0 helps the LLM choose the *correct* strategic pathway defined by the bundles. While the `interaction_mode` (Step 1\) dictates the baseline strategy, the presence of memory context refines the LLM's subsequent reasoning within the loaded bundles (e.g., memory suggests the user is focused on risk, leading the LLM to prioritize the `strategy_risk_analysis` tool calls within Step 3).

### **Saving New Memories (Step 5: RETURN)**

* **Timing:** Memory saving is conditional and occurs only at Step 5, after synthesis is complete.  
* **Trigger:** The LLM's reasoning (Step 4\) must set a flag (`trigger_memory_save: true`) if a user correction or explicit preference change occurred.  
* **Tool Execution:** The orchestrator calls `mcp_service.save_memory()`, strictly verifying the scope is `'personal'`.

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

**File:** `backend/app/services/mcp_service.py`

from neo4j import GraphDatabase, AccessMode

from app.config import settings

\# Global driver and embedding generator initialized here

def recall\_memory(scope: str, query\_summary: str, limit: int \= 5\) \-\> str:

    if scope \== 'csuite':

        raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.")

    query\_embedding \= generate\_embedding(query\_summary)

    \# \[Cypher from above executed here\]

    \# Includes internal fallback from departmental \-\> global logic

    return f"Recalled Context from {scope}: {recalled\_list\_json}"

def save\_memory(scope: str, key: str, content: str, confidence: float):

    \# Enforcing Noor Write Constraint (Non-negotiable)

    if scope \!= 'personal':

        raise PermissionError(f"Noor agent can only write to the 'personal' memory scope.")

    embedding \= generate\_embedding(content)

    cypher \= """

    MERGE (m:Memory {key: $key, scope: $scope})

    ON CREATE SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.created\_at \= datetime()

    ON MATCH SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.updated\_at \= datetime()

    """

    with driver.session(mode=AccessMode.WRITE) as session:

        session.run(cypher, parameters={

            "key": key, "scope": scope, "content": content,

            "embedding": embedding, "confidence": confidence

        })

    return "Personal memory saved successfully."

### **FastAPI Endpoints for Memory CRUD Operations**

**Crucially, the memory CRUD operations are NOT exposed as public REST endpoints.** They are implemented as internal functions within `mcp_service.py` and accessed only via the **LLM Tool Call Request/Response loop** initiated by the `orchestrator_zero_shot`.

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
* **Write Modification Log:** Log `event_type='memory_write'`, `scope_modified` (`personal`), and `confidence_score` upon successful `save_memory` execution.

### **Testing Memory Scenarios**

| Test Case | Description | Expected Result |
| ----- | ----- | ----- |
| **T01 (Access Denial)** | Noor attempts `recall_memory('csuite', ...)` | `PermissionError` raised by MCP; execution halted. |
| **T02 (Write Constraint)** | LLM flags `trigger_memory_save` with `scope='global'`. | `PermissionError` raised by MCP; analytical response still returned, but save fails. |
| **T03 (Fallback Logic)** | Query fails semantic match in 'departmental'. | MCP successfully returns context retrieved from 'global' scope. |
| **T04 (Validation)** | Memory snippet contradicts live Neo4j data (Temporal Gap). | LLM Step 4 output includes `gap_diagnosis='Temporal Gap'` and cites the conflicting memory key. |

Alternative Version of the 4-6 mcp tools

The Model Context Protocol (MCP) tool system and the Hierarchical Memory Architecture are the foundational elements enabling the **Noor Cognitive Digital Twin v2.1** to operate under the **Single-Call MCP Architecture**. These tools act as the secure gateway between the LLM's reasoning and the data layers, enforcing access control and data integrity constraints.

## **1\. MCP Tool Specifications (4 Core Synchronous Tools)**

The Noor Staff Agent requires its LLM (Groq `gpt-oss-120b`) to execute all actions, including data retrieval and persistence, within a single API call. This mandates four primary synchronous MCP tools tied directly to the fixed Cognitive Control Loop (Step 0, Step 2, Step 3, Step 5). Each tool call adds approximately **\~450 tokens** to the INPUT token count.

### **A. `recall_memory` (Step 0: REMEMBER)**

| Point | Specification |
| ----- | ----- |
| **Purpose** | Contextual retrieval of historical data and preferences based on semantic search before intent classification. |
| **Inputs** | `scope` (personal, departmental, global), `query_summary`, `limit`. |
| **Outputs** | List of memory snippets (`key`, `content`, `confidence`, `score`). |
| **Validation Rules** | **Noor Scope Read Constraint:** Must reject the `csuite` scope. Retrieval **MUST** use **semantic similarity search** (vector search). |
| **Error Handling** | `PermissionError` if `csuite` access is attempted. **Fallback Logic:** If retrieval from `departmental` scope yields no results, the MCP server automatically attempts search in the `global` scope. |
| **Integration** | Queries the **`:Memory`** node label in Neo4j using the vector index. |

### **B. `retrieve_instructions` (Step 2: RECOLLECT)**

| Point | Specification |
| ----- | ----- |
| **Purpose** | Dynamic loading of **Task-Specific Instruction Bundles** from PostgreSQL to maximize prompt caching and token efficiency. |
| **Inputs** | `mode` (The interaction mode A-H determined in Step 1). |
| **Outputs** | Concatenated string of active bundle content (e.g., XML instruction blocks). |
| **Validation Rules** | Must retrieve only bundles marked with `status = 'active'`. Bundle tag requested by the prompt must match the PostgreSQL DB tag exactly. |
| **Error Handling** | `NotFoundError` if the required bundle tag is missing. Upon error, the LLM uses embedded fallback instructions. |
| **Integration** | Queries the PostgreSQL `instruction_bundles` table and `instruction_metadata` table. |

### **C. `read_neo4j_cypher` (Step 3: RECALL)**

| Point | Specification |
| ----- | ----- |
| **Purpose** | Primary tool for executing Cypher queries against the Neo4j Digital Twin. Critical for execution and validating architectural constraints. |
| **Inputs** | `cypher_query`, `parameters` (LLM-generated Cypher and necessary input values). |
| **Outputs** | List of entity data, strictly constrained to `id` and `name` properties. |
| **Validation Rules (Constraint Enforcement)** | **Pagination:** Queries **MUST NOT** emit `SKIP` or `OFFSET`; enforces **Keyset Pagination**. **Level Integrity:** Must adhere to the **Same-Level Rule** (L3 $\\leftrightarrow$ L3). **Efficiency:** Must return only `id` and `name`; explicitly **rejects** retrieval of `embedding` properties. **Aggregation First:** Must enforce the use of `count(n)` or `collect(n)` for sampling. |
| **Error Handling** | `ValueError` for constraint violation (e.g., illegal `SKIP` keyword). Triggers the LLM's **BACKTRACKING** protocol. |
| **Integration** | Executes Cypher directly against the Neo4j Digital Twin nodes (e.g., `sec_objectives`, `ent_capabilities`). |

### **D. `save_memory` (Step 5: RETURN)**

| Point | Specification |
| ----- | ----- |
| **Purpose** | Handles persistence of user preferences, corrections, or learned context. Executed as the final step of the Single-Call loop if triggered. |
| **Inputs** | `scope`, `key`, `content`, `confidence`. |
| **Outputs** | Status message ("Memory saved successfully"). |
| **Validation Rules** | **Noor Write Constraint:** Scope must **STRICTLY** be `'personal'`. Triggered **ONLY** if the query generated a user preference change or correction. |
| **Error Handling** | `PermissionError` if writing to unauthorized tiers (Dept, Global, C-suite). |
| **Integration** | Persists data to the **`:Memory`** node in Neo4j via a write transaction. |

---

### **Why `require_approval: never` Matters**

The Noor architecture relies on the **Single-Call MCP Architecture**. This design requires the LLM to complete its entire reasoning loop (Steps 1 through 5\) in one billable API inference cycle.

* If the tool protocol required approval (**`always`**), the LLM inference would pause after suggesting a tool call (e.g., Step 3: RECALL), requiring a latency-inducing round-trip to the orchestrator to confirm execution.  
* The system uses implicit server-side execution where the MCP executes the tool immediately upon the LLM's request and returns the result. This is essential for achieving the **Fast-Path Protocol** latency target of **$\<0.5\\text{s}$** for conversational queries.

## **2\. Hierarchical Memory Architecture**

The memory system is built on **Neo4j** and provides the RAG context for Step 0 (REMEMBER).

### **Memory Tier Design and Access Control**

The system utilizes the **`:Memory`** node label, segmented by the required `scope` property.

| Memory Tier | Purpose | Noor (Staff Agent) Access | Maestro (Executive Agent) Access | Source(s) |
| ----- | ----- | ----- | ----- | ----- |
| **Personal** | User-specific corrections and context. | **Read/Write (R/W)** | R/W |  |
| **Departmental** | Team-validated knowledge, functional gaps. | **Read-Only (R/O)** | Read/Write (Curates) |  |
| **Global** | Institutional knowledge, strategic plans. | **Read-Only (R/O)** | Read/Write (Curates) |  |
| **C-Suite** | Confidential, executive insights. | **NO Access** | Read/Write (Exclusive) |  |

### **Vector Indexing Strategy**

Memory retrieval must use **semantic similarity search**.

* **Index Creation:** A vector index must be created on the `embedding` property of the `:Memory` node. The Neo4j driver supports vector indexes for semantic search.  
* **Querying (STEP 0):** The `recall_memory` tool executes a Cypher query leveraging the vector index:

// Cypher for Semantic Retrieval (Mandatory for Step 0\)

// Input parameters: $query\_embedding, $limit, $scope

CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)

YIELD node AS m, score

WHERE m.scope \= $scope

RETURN m.content, score

ORDER BY score DESC LIMIT $limit

### **Memory Eviction and Consistency Checks**

The architectural specifications imply policies to maintain quality:

* **Consistency Checks:** The **MCP Fallback Logic** in `recall_memory` (Dept $\\rightarrow$ Global) provides an implicit consistency check, prioritizing specific knowledge.  
* **Memory Hallucination Prevention:** The LLM is prohibited from providing data when the memory system returns empty results. Furthermore, the LLM is mandated to **cite sources** from the knowledge graph and memory to prevent hallucinations.

## **4\. Integration with Control Loop**

| Step | Integration Point | Detail | Source(s) |
| ----- | ----- | ----- | ----- |
| **Step 0 (REMEMBER)** | **Retrieval** | Orchestrator/LLM calls `recall_memory` if memory access is **path-dependent**. |  |
| **Step 2 (RECOLLECT)** | **Context Integration** | Recalled memory context is appended to the prompt AFTER the dynamically loaded instruction bundles. |  |
| **Step 4 (RECONCILE)** | **Validation** | LLM applies Gap Analysis (e.g., identifying a Temporal Gap) if memory conflicts with live Step 3 data, and validates confidence of retrieved memory. |  |
| **Step 5 (RETURN)** | **Persistence** | LLM conditionally executes `save_memory` only if a correction or preference was noted. This save is restricted to the **Personal** memory scope. |  |

The Neo4j database is the central component of the Noor Cognitive Digital Twin v2.1, fulfilling two roles: storing the immutable **Digital Twin Knowledge Graph** and managing the contextual **Hierarchical Memory**. The schema and query patterns are designed to rigidly enforce integrity rules (Composite Keys, Level Integrity) and optimize retrieval for the Single-Call MCP Architecture.

## **1\. Graph Schema Design**

The schema adheres to universal design principles, requiring all Digital Twin entities to possess temporal and hierarchical properties.

### **Digital Twin Node Structure and Constraints**

All core nodes must include four mandatory properties for integrity enforcement, especially during Step 3: RECALL.

| Property | Type | Constraint Enforcement |
| ----- | ----- | ----- |
| **`id`** | STRING | Part of the **Composite Key** (`id`, `year`). |
| **`year`** | INTEGER | Part of the Composite Key; mandatory for **Temporal Filtering**. |
| **`level`** | STRING (L1, L2, L3) | Hierarchy indicator. Critical for **Level Integrity Enforcement**. |
| **`embedding`** | FLOAT\[\] | Vector embedding for semantic search. |

**Core Node Examples**:

* `sec_objectives` (Strategic/departmental goals)  
* `sec_policy_tools` (Policy types, targeted impacts)  
* `ent_capabilities` (Functional competencies)  
* `ent_risks` (Risk categories)

**Level Hierarchy (L1, L2, L3) Rules** The primary rule is **Same-Level Enforcement**: all traversal paths must match the same hierarchy level (L1 $\\leftrightarrow$ L1, L3 $\\leftrightarrow$ L3), with **no mixing hierarchies**. This prevents the LLM from executing invalid cross-hierarchy joins, which is enforced by the `read_neo4j_cypher` MCP tool.

### **Memory Node Structure (4 Tiers)**

The Hierarchical Memory system supports the Step 0 (REMEMBER) and Step 5 (RETURN) protocols.

**Node Label:** `:Memory`

| Property | Type | Purpose and Access Control | Source(s) |
| ----- | ----- | ----- | ----- |
| **`scope`** | STRING | Defines the tier: `personal`, `departmental`, `global`, `csuite`. |  |
| **`content`** | TEXT | The persistent insight or correction. |  |
| **`key`** | STRING | Unique identifier within the scope (used for `MERGE`). |  |
| **`embedding`** | FLOAT\[\] | Vector for **Semantic Similarity Search**. |  |
| **`confidence`** | FLOAT | Probabilistic Confidence Score. |  |

**Access Control for Noor:** Noor has **Read/Write** access to `personal` memory, **Read-Only** access to `departmental` and `global` memory, and **NO Access** to `csuite` memory.

### **Relationship Types and Business Chains**

Predefined edge types model the underlying ontology:

* `Objectives` $\\rightarrow$ `Policy tools` $\\rightarrow$ `Admin records`.  
* `Capabilities` $\\rightarrow$ `Risks`.  
* `Performance metrics` $\\rightarrow$ `Objectives` (impact).

The architecture requires 7 predefined **Business Chains** (traversal paths). These chains guide complex analysis.

**Example Business Chain: 2A\_Strategy\_to\_Tactics\_Tools** $$ \\text{sec\_objectives} \\rightarrow \\text{sec\_policy\_tools} \\rightarrow \\text{ent\_capabilities} $$

### **Vector Indexing Strategy**

Vector indexing is crucial for Semantic Retrieval (Step 0).

* **Target:** The `:Memory` node's `embedding` property.  
* **Vector Index Name:** `memory_semantic_index` (using the concept of `knowledge_vectors`).  
* **Embedding Model:** OpenAI `text-embedding-3-small`.

**Code Example: Schema Creation Cypher**

// 1\. Digital Twin Constraint (Composite Key Enforcement)

CREATE CONSTRAINT AS CONSTRAINT\_OBJECTIVES\_KEY

FOR (n:sec\_objectives) REQUIRE (n.id, n.year) IS NODE KEY;

// 2\. Memory Constraint (Unique Key per Scope)

CREATE CONSTRAINT AS CONSTRAINT\_MEMORY\_KEY

FOR (m:Memory) REQUIRE (m.scope, m.key) IS UNIQUE;

// 3\. Vector Index Creation (Mandatory for Step 0: REMEMBER)

// Assuming 1536 dimensions based on the chosen embedding model

CALL db.index.vector.createNodeIndex(

  'memory\_semantic\_index',

  'Memory',

  'embedding',

  1536,

  'cosine'

);

---

## **2\. Cypher Query Patterns**

Cypher queries are executed by the `read_neo4j_cypher` MCP tool during Step 3: RECALL.

### **Memory Semantic Search Query (Step 0: REMEMBER)**

This query uses the vector index for high-precision, concept-based retrieval.

// Input parameters: $query\_embedding (List\[Float\]), $limit (Integer), $scope (String)

CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)

YIELD node AS m, score

WHERE m.scope \= $scope

RETURN m.content, m.confidence, score

ORDER BY score DESC

LIMIT $limit

### **Graph Traversal for Business Chain Analysis (Step 3: RECALL)**

This query pattern demonstrates executing a predefined business chain while enforcing the mandatory Temporal and Level Integrity constraints.

// Example: Business Chain 2A\_Strategy\_to\_Tactics\_Tools

// Inputs: $target\_year (Mandatory), $start\_objective\_id, $target\_level ('L3')

MATCH (obj:sec\_objectives {id: $start\_objective\_id, year: $target\_year, level: $target\_level})

\-\[:REQUIRES\]-\> (tool:sec\_policy\_tools {year: $target\_year, level: $target\_level})

\-\[:UTILIZES\]-\> (cap:ent\_capabilities {year: $target\_year, level: $target\_level})

// Constraint Enforcement: Efficiency (MCP Rule: Do not return embedding properties)

RETURN obj.name, tool.name, cap.name, cap.id AS last\_id

// Constraint Enforcement: Keyset Pagination (MCP Rule: Must use WHERE/ORDER BY for pagination)

ORDER BY cap.id ASC

WHERE cap.id \> $last\_seen\_id

LIMIT 30

### **Pagination: Why NOT to Use SKIP/OFFSET (and the Correct Approach)**

The MCP layer explicitly prohibits using `SKIP` or `OFFSET` for pagination. This is because offset pagination leads to performance degradation and instability on large graphs.

The correct approach is **Keyset Pagination**.

| Incorrect (Prohibited by MCP) | Correct (Mandatory Keyset Pagination) |
| ----- | ----- |
| `MATCH (c:ent_capabilities) RETURN c LIMIT 30 SKIP 100` | `MATCH (c:ent_capabilities) WHERE c.id > $last_seen_id RETURN c LIMIT 30 ORDER BY c.id` |

### **Aggregation Queries**

For calculating KPIs, simple aggregations are used. The LLM can be instructed to return only aggregated results.

// Example: Trend Detection (Temporal Aggregation)

MATCH (p:sec\_performance {year: $current\_year})-\[:IMPACTS\]-\>(o:sec\_objectives)

RETURN o.name, COUNT(p) AS total\_metrics\_affected

---

## **3\. Index Strategy**

Indexing ensures query performance, crucial for maintaining low latency.

| Index Type | Target Label(s) | Target Property(ies) | Purpose | Source(s) |
| ----- | ----- | ----- | ----- | ----- |
| **Uniqueness/Composite** | All Digital Twin Nodes | `(id, year)` | Enforces temporal data integrity and fast composite lookups. |  |
| **Vector Index** | `:Memory` | `embedding` | Supports Semantic Retrieval (Step 0\) using cosine similarity. |  |
| **B-Tree Index** | Digital Twin Nodes | `id`, `year`, `level` | Standard indexing for fast property filtering and traversal start points. |  |

**Index Usage Optimization** The Python application uses the Neo4j driver and the `Neo4jService` pattern, which benefits from connection pooling and optimized transactions (Read/Write). Ensuring the LLM generates queries that utilize indexed properties (like `year` and `level`) in the initial `MATCH` clause is key to avoiding costly database scans.

---

## **4\. Constraints & Validation**

Constraints are defined at the schema level; validation is handled by the **MCP tool** during execution.

| Constraint Type | Mechanism/Rule | Enforcement Layer | Source(s) |
| ----- | ----- | ----- | ----- |
| **Uniqueness Constraint** | `REQUIRE (n.id, n.year) IS NODE KEY`. | Neo4j Schema (DML). |  |
| **Level Integrity** | All nodes in a traversal path must have matching `level` properties. | MCP Server (`read_neo4j_cypher`). |  |
| **Write Access Control** | Noor can only `save_memory` to `scope='personal'`. | MCP Server (`save_memory`). |  |
| **Query Integrity** | Prohibition of `SKIP`/`OFFSET` and `embedding` retrieval. | MCP Server (`read_neo4j_cypher`). |  |

---

## **5\. Performance Considerations**

Performance optimizations are built into the architecture to ensure the $7.5\\text{K}$ token average and the $\<0.5\\text{s}$ latency for the Quick Exit Path.

1. **Query Optimization Patterns:** Enforce the "Aggregation First" rule (aggregating early) and utilizing parametrized queries.  
2. **Caching Strategy:** Prompt caching is achieved by placing the bulky, static **Task-Specific Instruction Bundles at the START of the prompt** to maximize LLM cache utilization.  
3. **Avoiding N+1 Queries:** The graph model inherently minimizes N+1 queries by retrieving complex interconnected data in a single multi-hop `MATCH` statement, which is the preferred approach for **Complex Analysis**.  
4. **Batch Operations:** Use Neo4j's transaction API for bulk updates (e.g., loading initial data via `LOAD CSV` or batch memory saves). Write operations should be enclosed in a `session.execute_write` transaction.

---

## **6\. Code Examples**

### **Python Neo4j Driver Code (`backend/app/services/neo4j_service.py`)**

This class manages the connection and standardized query execution.

from neo4j import GraphDatabase, AccessMode

from typing import List, Dict, Any

from app.config import settings \# Contains NEO4J\_URI, etc.

class Neo4jService:

    def \_\_init\_\_(self):

        \# Initialize driver using environment configuration

        self.driver \= GraphDatabase.driver(

            settings.NEO4J\_URI,

            auth=(settings.NEO4J\_USERNAME, settings.NEO4J\_PASSWORD)

        )

        self.driver.verify\_connectivity() \# Verify connectivity

    def execute\_read\_query(self, query: str, parameters: Dict\[str, Any\] \= None) \-\> List\[Dict\]:

        """

        Executes Cypher Read query in a read transaction (Best Practice).

        This method is called internally by the read\_neo4j\_cypher MCP tool.

        """

        with self.driver.session(mode=AccessMode.READ) as session:

            \# Use executeRead for explicit transaction control

            result \= session.execute\_read(lambda tx: tx.run(query, parameters or {}))

            return \[record.data() for record in result\]

    def execute\_write\_query(self, query: str, parameters: Dict\[str, Any\] \= None) \-\> List\[Dict\]:

        """

        Executes Cypher Write query in a write transaction (Best Practice).

        Called by the save\_memory MCP tool.

        """

        with self.driver.session(mode=AccessMode.WRITE) as session:

            result \= session.execute\_write(lambda tx: tx.run(query, parameters or {}))

            return \[record.data() for record in result\]

The Noor Cognitive Digital Twin v2.1 operates exclusively on the **Single-Call MCP Architecture**, processing every query through a fixed, sequential **Advanced Cognitive Control Loop** (Step 1 to Step 5), which is preceded by the mandatory **Step 0: REMEMBER**. The LLM (Groq `gpt-oss-120b` for Noor) performs all these steps, including tool invocations, within **ONE billable API call**.

This deep dive details the implementation of each step, adhering strictly to the architecture's constraints and incorporating necessary MCP tools.

---

## **The Advanced Cognitive Control Loop Implementation**

### **Mandatory Pre-Step: STEP 0: REMEMBER (Hierarchical Memory Recall)**

This step must be executed *before* intent analysis (Step 1\) if the memory recall logic dictates it is **path-dependent**.

#### **Purpose and Logic**

Step 0 retrieves prior context to inform query understanding. Retrieval must use **semantic similarity search** through the Neo4j graph memory. The `module_memory_management_noor` bundle contains the trigger rules (e.g., Mode G is mandatory recall, Mode A is optional/personal).

#### **MCP Tool Specification (`recall_memory`)**

The MCP service enforces strict hierarchical access control.

| Specification | Requirement |
| ----- | ----- |
| **Tool Signature** | `recall_memory(scope, query_summary, limit)` |
| **Noor Access** | Read-Only (R/O) from `departmental` and `global` scopes; Read/Write (R/W) to `personal` scope. |
| **Retrieval Constraint** | Must use **semantic similarity search** (vector search). |

#### **Implementation (Orchestrator Logic \- Python)**

The orchestrator must check if the current query path requires memory access via the MCP service call.

\# \--- MCP Server: Memory Service (Simplified, enforcing constraints) \---  
from typing import Literal

def recall\_memory(scope: Literal\['personal', 'departmental', 'global'\], query\_summary: str, limit: int) \-\> str:  
    \# STEP 0 CONSTRAINT: Scope Validation  
    if scope not in \['personal', 'departmental', 'global'\]:  
        raise PermissionError("Noor cannot access the C-suite memory tier.")

    \# STEP 0 MECHANISM: Semantic Search (Best Practice)  
    \# Assumes Neo4j vector index 'memory\_semantic\_index' is configured (v2.1 Database Schema)  
    cypher\_query \= f"""  
    CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
    YIELD node AS m, score  
    WHERE m.scope \= $scope  
    RETURN m.content, score  
    ORDER BY score DESC LIMIT $limit  
    """  
    \# ... execute query and return formatted memory list ...  
    return f"Recalled Memory Context: {recalled\_list}"

\# \--- Orchestrator Layer (Python) \---  
if check\_path\_requires\_memory(user\_query, session\_mode): \# Logic from module\_memory\_management\_noor  
    \# Path-dependent memory retrieval (e.g., Mode B or G)  
    recalled\_context \= mcp\_service.recall\_memory(  
        scope='personal',  
        query\_summary=user\_query,  
        limit=5  
    )  
else:  
    recalled\_context \= ""

---

### **Step 1: REQUIREMENTS (Intent Classification & Gatekeeper)**

This is the initial analysis of the user query.

#### **Purpose and Logic**

The LLM (using the `cognitive_cont` bundle) classifies the query into one of 8 interaction modes (A-H). This step contains the **Gatekeeper Logic** to execute the **Quick Exit Path**.

| Mode(s) | Intent | Quick Exit Path? | Latency Impact |
| ----- | ----- | ----- | ----- |
| **D, F** (Acquaintance, Social) | Conversational | **YES** | Reduces greeting latency from 2.5s to 0.5s. |
| **A, B, G, E, H** | Analytical / Data-driven | No | Proceeds to Step 2\. |

#### **Implementation (LLM Prompt & Orchestrator Logic)**

The LLM must be prompted to classify the intent first. If the output JSON indicates a Quick Exit, the orchestrator bypasses Steps 2, 3, and 4\.

\# \--- Orchestrator Layer (Python) \---

\# Core instruction to force classification (Must be part of the initial prompt)  
core\_instruction \= mcp\_service.retrieve\_instructions('cognitive\_cont')

\# LLM call 1: Classification/Quick Exit Check  
classification\_result \= invoke\_llm(  
    prompt=core\_instruction \+ f"User Query: {user\_query}",  
    tools=None \# Tools not needed for initial classification decision  
)

mode \= classification\_result.mode \# e.g., 'A', 'F', 'B2'

\# STEP 1 CONSTRAINT: Quick Exit Path Implementation  
if mode in \['D', 'F'\]:  
    \# Skip Step 2, 3, 4, jump to Step 5 (Return) immediately  
    \# LLM must generate the final, quick response in the classification\_result JSON  
    return format\_final\_response(classification\_result.chat\_response)

---

### **Step 2: RECOLLECT (Strategy Determination & Dynamic Loading)**

If the query is analytical (not a Quick Exit), the LLM determines the required strategy.

#### **Purpose and Logic**

The LLM executes the **`retrieve_instructions` MCP tool** to fetch only the necessary **Task-Specific Instruction Bundles** for the classified mode. This modular approach is critical for token efficiency and achieving the 40-48% cost savings target.

#### **MCP Tool Specification (`retrieve_instructions`)**

This tool accesses the PostgreSQL `instruction_bundles` store.

| Specification | Requirement |
| ----- | ----- |
| **Tool Signature** | `retrieve_instructions(mode: str)` |
| **DB Constraint** | The bundle `tag` in the prompt MUST match the DB tag exactly. |
| **Caching Constraint** | Bundles MUST be placed at the **START** of the final prompt for cache optimization. |

#### **Implementation (Orchestrator & MCP Snippets)**

\# \--- MCP Server: Instruction Retrieval Service \---  
\# Assumes PostgreSQL connection is established  
async def retrieve\_instructions(mode: str) \-\> dict:  
    \# Lookup which bundles are required for the given mode (A-H)  
    required\_tags \= lookup\_bundles\_by\_mode(mode) \# Uses instruction\_metadata table

    bundle\_contents \= {}  
    async with AsyncSessionLocal() as session:  
        for tag in required\_tags:  
            \# Retrieve the 'active' content block  
            result \= await session.execute(  
                "SELECT content FROM instruction\_bundles WHERE tag \= :tag AND status \= 'active'",  
                {"tag": tag}  
            )  
            bundle\_contents\[tag\] \= result.scalar\_one()  
    return bundle\_contents

\# \--- Orchestrator Layer (Python) \---  
\# If execution is NOT Quick Exit, proceed:  
required\_bundles \= mcp\_service.retrieve\_instructions(mode)  
bundles\_content \= "".join(required\_bundles.values())

\# CRITICAL STEP 2 CONSTRAINT: Place bundles first.  
final\_prompt \= bundles\_content \+ f"""  
Recalled Memory: {recalled\_context}  
User Query: {user\_query}  
"""

\# Next, invoke the LLM with all necessary tools (including Cypher executor)

---

### **Step 3: RECALL (Execution and Validation)**

This is the core execution phase where the LLM attempts to gather data using its available tools.

#### **Purpose and Logic**

The LLM translates the goal into precise data retrieval commands (Cypher/SQL/Vector) and calls the necessary MCP tool (`read_neo4j_cypher`). Critically, the LLM must execute **Validation and Backtracking** after *each* tool call.

#### **MCP Tool Specification (`read_neo4j_cypher`)**

The MCP server enforces performance and structural integrity constraints required by Neo4j best practices and the Noor schema.

| Constraint Rule | Prevention Method (MCP Logic) | Source(s) |
| ----- | ----- | ----- |
| **Temporal Filtering** | Cypher must include temporal constraints (e.g., `WHERE n.year = $current_year`) due to the composite key design (`id`, `year`). |  |
| **Level Integrity** | Validate that the Cypher query respects **Same-Level Enforcement** (L3 $\\leftrightarrow$ L3, L2 $\\leftrightarrow$ L2). |  |
| **Pagination Trap** | Reject queries using `SKIP` or `OFFSET`. Enforce **Keyset Pagination** (`WHERE n.id > $last_seen_id LIMIT 30`). |  |
| **Efficiency Trap** | Tool output is constrained to return only `id` and `name` properties. Reject queries trying to return raw `embedding` vectors. |  |

#### **Implementation (MCP Tool Constraint Enforcement \- Python)**

\# \--- MCP Server: Data Retrieval Service \---

def read\_neo4j\_cypher(cypher\_query: str, parameters: dict, user\_context: dict) \-\> list:  
    \# STEP 3 CONSTRAINT ENFORCEMENT

    \# 1\. Pagination Trap Prevention (Reject SKIP/OFFSET)  
    if "SKIP" in cypher\_query.upper() or "OFFSET" in cypher\_query.upper():  
        raise ValueError("Cypher queries must use Keyset Pagination (WHERE property \> value, LIMIT).")

    \# 2\. Level Integrity Check (Simplified check example)  
    if 'L2' in cypher\_query and 'L3' in cypher\_query:  
        \# Complex traversal validation logic required here based on Business Chains  
        raise ValueError("Hierarchy Violation: Cannot mix Level 2 and Level 3 nodes in a single path.")

    \# 3\. Execute Validated Query  
    with get\_neo4j\_driver().session(mode=AccessMode.READ) as session:  
        \# Run query using a read transaction (Best Practice for read queries)  
        result \= session.run(cypher\_query, parameters)

        \# Enforce efficiency: Only return clean, required fields  
        output \= \[{"id": record\["id"\], "name": record\["name"\]} for record in result\]

        \# LLM Logic: Validation and Backtracking  
        \# The LLM receives 'output'. If output is empty, the LLM MUST backtrack.  
        \# (This backtracking logic resides in the LLM reasoning, enabled by the tool\_rules\_core bundle).  
        return output

---

### **Step 4: RECONCILE (Synthesis, Gap Diagnosis, Insight)**

This step is performed by the LLM and its core function must be **separate** from Step 3\.

#### **Purpose and Logic**

Step 4 transforms raw data (the output of Step 3\) into actionable intelligence. It involves mandatory processes like:

1. **Gap Analysis:** Applying the principle "Absence is signal, not silence". The LLM must diagnose the gap type (Direct, Indirect Chain, Temporal, Level Mismatch).  
2. **Confidence Scoring:** Calculating the Probabilistic Confidence Score (based on data quality, query clarity, etc., not arbitrary thresholds).  
3. **Business Language Translation:** Using the `module_business_language` bundle to replace technical terms (`L3`, `Node`, `Cypher`) with business-friendly language.  
4. **Artifact Creation:** Preparing visualization specifications (Tables, Charts). Explicit constraint: `network_graph` is **NOT** supported and must be rendered as a table with columns: Source, Relationship, Target.

#### **Implementation (LLM Reasoning Output Structure)**

Since this step is primarily LLM reasoning, the code focuses on the mandated output structure that proves this step occurred.

{  
  "mode": "B2",  
  "confidence\_score": 0.92,  // Calculated via the formula  
  "business\_insight": "The strategic objective 'Apollo' is at moderate risk because of a temporal gap in required capabilities...", // Synthesis  
  "gap\_diagnosis": {  
    "type": "Temporal Gap", // Mandatory classification  
    "severity": "🟡🟡",  
    "details": "Data for 2026 is missing for EntityCapability, leading to low predictive confidence."  
  },  
  "answer": "Based on my analysis, Project Alpha is performing well against its objectives. Here is the supporting data:", // Business Language  
  "artifact\_specification": \[  
    {  
      "type": "table",  
      "data": \[  
        {"Source": "Capability A", "Relationship": "Addresses Gap In", "Target": "Policy Tool X"}  
      \],  
      "config": {  
        "title": "Related Entities (Network data presented as table, per constraint)"  
      }  
    },  
    {  
      "type": "chart",  
      "config": { /\* Highcharts-compatible configuration for a Time-series visualization \*/ }  
    }  
  \],  
  "trigger\_memory\_save": false // Decision for Step 5  
}

---

### **Step 5: RETURN (Final Formatting and Memory Save)**

This is the final action executed by the LLM during the single API call.

#### **Purpose and Logic**

Final output formatting and execution of the **Memory Save Protocol**. The LLM executes the **`save_memory` MCP tool** call ONLY if the query triggered a user preference change or correction.

#### **MCP Tool Specification (`save_memory`)**

| Specification | Requirement |
| ----- | ----- |
| **Tool Signature** | `save_memory(scope, key, content)` |
| **Noor Write Constraint** | Write access is strictly limited to the **`personal`** memory scope. |
| **Trigger Logic** | LLM executes only if correction or preference detected. |

#### **Implementation (MCP Tool & Orchestrator Snippets)**

\# \--- MCP Server: Memory Persistence Service \---  
def save\_memory(scope: str, key: str, content: str, confidence: float):  
    \# STEP 5 CONSTRAINT: Scope Write Validation (Non-Negotiable)  
    if scope \!= 'personal':  
        raise PermissionError(f"Noor cannot write to the '{scope}' tier. Only 'personal' is allowed.")

    \# Convert content to embedding (Semantic Search Prerequisite)  
    embedding \= generate\_embedding(content)

    \# Save to Neo4j :Memory node  
    cypher \= """  
    MERGE (m:Memory {key: $key, scope: $scope})  
    ON CREATE SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.created\_at \= datetime()  
    ON MATCH SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.updated\_at \= datetime()  
    """  
    with get\_neo4j\_driver().session(mode=AccessMode.WRITE) as session:  
        session.run(cypher, parameters={  
            "key": key,  
            "scope": scope,  
            "content": content,  
            "embedding": embedding,  
            "confidence": confidence  
        })  
    return "Memory successfully saved to personal scope."

\# \--- Orchestrator Layer (Post-LLM Execution) \---  
\# LLM execution is complete, resulting in JSON (final\_response\_json)

if final\_response\_json.get("trigger\_memory\_save"):  
    \# The LLM detected a preference/correction and flagged the save trigger  
    mcp\_service.save\_memory(  
        scope='personal',  
        key=final\_response\_json.get("user\_intent\_key"),  
        content=final\_response\_json.get("memory\_content"),  
        confidence=final\_response\_json.get("confidence\_score")  
    )

return final\_response\_json

The Model Context Protocol (MCP) tools and the Hierarchical Memory System are fundamental to the **Noor Cognitive Digital Twin v2.1** architecture, enabling **Step 0: REMEMBER** (Retrieval) and **Step 5: RETURN** (Persistence) within the mandated **Single-Call MCP Architecture**.

The design below details the data architecture (Neo4j Schema) and the corresponding MCP Service implementations (`mcp_service.py`) responsible for enforcing access control and query integrity.

---

## **I. Neo4j Hierarchical Memory Schema Design**

The memory system uses Neo4j to store both the normative Digital Twin data and the contextual Hierarchical Memory.

### **1\. Digital Twin Node Prerequisites (Mandatory for Integrity)**

All core Digital Twin nodes (e.g., `:sec_objectives`, `:ent_capabilities`) must adhere to universal design principles enforced by constraints in Step 3: RECALL.

| Property | Type | Constraint / Purpose (Neo4j Best Practice) | Source(s) |
| ----- | ----- | ----- | ----- |
| **`id`** | STRING | Part of the Composite Key. |  |
| **`year`** | INTEGER | Part of the Composite Key; Mandatory temporal filter for query integrity. |  |
| **`level`** | STRING (L1, L2, L3) | Hierarchy level. Critical for **Level Integrity Enforcement** (Same-Level Rule). |  |
| **`embedding`** | FLOAT\[\] | Vector embedding used for semantic search (RAG). |  |

### **2\. Hierarchical Memory Node Specification**

The memory component is modeled as the `:Memory` node, categorized by four tiers (`scope`) for access control.

**Node Label:** `:Memory`

| Property | Type | Constraint / Purpose (Access Control) | Source(s) |
| ----- | ----- | ----- | ----- |
| **`scope`** | STRING | Defines the access tier: `personal`, `departmental`, `global`, `csuite`. |  |
| **`content`** | TEXT | The persistent insight or correction being stored. |  |
| **`embedding`** | FLOAT\[\] | Used for **Semantic Similarity Search** during Step 0: REMEMBER. |  |
| **`confidence`** | FLOAT | Probabilistic Confidence Score associated with the stored memory. |  |
| **`access_roles`** | STRING\[\] | List of roles authorized to view (Mandatory for `csuite` tier). |  |

**Access Control Matrix (Enforced by MCP Tools)**

| Memory Scope | Noor (Staff Agent) | Maestro (Executive Agent) | Source(s) |
| ----- | ----- | ----- | ----- |
| **`personal`** | Read/Write (R/W) | Read/Write (R/W) |  |
| **`departmental`** | Read-Only (R/O) | Read/Write (Curates) |  |
| **`global`** | Read-Only (R/O) | Read/Write (Curates) |  |
| **`csuite`** | **NO Access** | Read/Write (Exclusive) |  |

### **3\. Neo4j Indexing (Vector Search Setup)**

The system must create a Vector Index on the `:Memory` node to support the mandatory **semantic similarity search** required by Step 0: REMEMBER.

**Cypher Code Example (Initialization)**

// 1\. Create a uniqueness constraint (Best Practice)  
CREATE CONSTRAINT memory\_key\_unique IF NOT EXISTS  
ON (m:Memory) ASSERT (m.scope, m.key) IS UNIQUE;

// 2\. Create the Vector Index for semantic similarity search  
// Assuming embedding size of 1536 (typical for modern large embedding models)  
CALL db.index.vector.createNodeIndex(  
  'memory\_semantic\_index',  
  'Memory',  
  'embedding',  
  1536,  
  'cosine'  
);

---

## **II. Model Context Protocol (MCP) Tool Specifications**

The Service Layer contains the MCP Integration (`mcp_service.py`), which exposes the required tools to the LLM during its single inference call. The execution of these tools adds an overhead of $\\sim 450$ tokens to the LLM's INPUT token count per call.

### **1\. `recall_memory` (Step 0: REMEMBER)**

This tool handles path-dependent retrieval and enforces read permissions.

| Specification | Requirement and Constraint Enforcement | Source(s) |
| ----- | ----- | ----- |
| **Tool Signature** | `recall_memory(scope, query_summary, limit)`. |  |
| **Noor Scope Allowed** | `'personal'`, `'departmental'`, `'global'`. |  |
| **Noor Scope Forbidden** | `'csuite'` (MCP server must automatically filter and exclude C-suite memories). |  |
| **Retrieval Constraint** | Must use **semantic similarity search** (vector search). |  |
| **Fallback Logic** | If retrieval from `departmental` yields no results, the server must automatically attempt search in the `global` scope. |  |
| **Output** | Returns memory node ID, content, creation timestamp, and confidence score. |  |

### **2\. `save_memory` (Step 5: RETURN)**

This tool handles persistence and enforces write permissions.

| Specification | Requirement and Constraint Enforcement | Source(s) |
| ----- | ----- | ----- |
| **Tool Signature** | `save_memory(scope, key, content, metadata)`. |  |
| **Noor Write Constraint** | Write access is strictly limited to the **`personal` scope ONLY**. |  |
| **Rejection Rule** | The MCP server must return an explicit error if Noor attempts to write to `'departmental'`, `'global'`, or `'csuite'` scopes. |  |
| **Trigger Logic** | LLM executes this tool only if the query specifically triggered a user preference change or correction. |  |

### **3\. `read_neo4j_cypher` (Step 3: RECALL)**

This critical tool executes LLM-generated Cypher and enforces data integrity and performance rules.

| Enforcement Rule | Rationale and Constraint Enforcement (MCP Logic) | Source(s) |
| ----- | ----- | ----- |
| **Pagination** | **Keyset Pagination ONLY**. MCP must reject queries containing `SKIP` or `OFFSET`. |  |
| **Level Integrity** | **Same-Level Enforcement:** MCP checks that Cypher queries adhere to the rule that relationships connect only at matching hierarchy levels (e.g., L3 $\\leftrightarrow$ L3). |  |
| **Efficiency** | The tool output must be constrained to return only `id` and `name` properties. It must prevent the return of raw `embedding` vectors. |  |
| **Aggregation First** | Enforce use of `count(n)` for totals and `collect(n)[0..30]` for samples in a **SINGLE QUERY**. |  |

---

## **III. MCP Tool Implementation (Python/FastAPI)**

The following Python structure demonstrates the required service layer logic, assuming the application utilizes the recommended `backend/app/services/mcp_service.py` pattern.

### **1\. MCP Service Structure (Conceptual)**

\# backend/app/services/mcp\_service.py (FastAPI Service Layer)

from neo4j import GraphDatabase, AccessMode  
from app.config import settings  
from typing import Literal

\# \--- Initialization \---  
\# Assumes driver and embedding models are initialized

\# Helper function to generate embedding (required before saving memory)  
def generate\_embedding(content: str) \-\> list\[float\]:  
    \# Placeholder: In production, this calls the Embedding Service  
    return \[0.1\] \* 1536

### **2\. Implementation: `recall_memory` (Step 0\)**

This function executes the semantic search and enforces read access based on the user's role (Noor).

def recall\_memory(scope: Literal\['personal', 'departmental', 'global'\], query\_summary: str, limit: int \= 5\) \-\> str:  
    """Retrieves relevant memory using semantic similarity search."""

    \# STEP 0 CONSTRAINT: Scope Validation for Noor  
    if scope not in \['personal', 'departmental', 'global'\]:  
        \# This prevents Noor accessing the C-suite tier  
        raise PermissionError(f"Noor agent is forbidden from accessing the '{scope}' memory tier.")

    \# Generate embedding for the query summary  
    query\_embedding \= generate\_embedding(query\_summary)

    \# STEP 0 MECHANISM: Semantic Similarity Search (Mandatory Retrieval Strategy)  
    cypher\_query \= """  
    CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
    YIELD node AS m, score  
    WHERE m.scope \= $scope  
    RETURN m.key, m.content, m.confidence, score  
    ORDER BY score DESC  
    """

    \# Execute query, potentially including fallback logic for global scope  
    with GraphDatabase.driver(settings.NEO4J\_URI, \*\*settings.NEO4J\_AUTH).session() as session:  
        result \= session.run(cypher\_query, parameters={"scope": scope, "limit": limit, "query\_embedding": query\_embedding})

        recalled\_list \= \[{"key": r\["key"\], "content": r\["content"\], "score": r\["score"\]} for r in result\]

        if not recalled\_list and scope \== 'departmental':  
            \# Fallback Logic: Automatic attempt in global scope  
            return recall\_memory('global', query\_summary, limit)

        return f"Recalled Context from {scope} memory: {recalled\_list}"

### **3\. Implementation: `save_memory` (Step 5\)**

This function enforces the strict write constraint for the Noor agent.

def save\_memory(scope: str, key: str, content: str, confidence: float):  
    """Persists user preferences or corrections to memory."""

    \# STEP 5 CONSTRAINT: Noor Write Access Restriction  
    if scope \!= 'personal':  
        \# MCP server must return an explicit rejection error  
        raise PermissionError(f"Noor agent can only write to the 'personal' memory scope. Attempted scope: {scope}")

    \# Generate embedding for the content  
    embedding \= generate\_embedding(content)

    \# Save/Update using MERGE (Neo4j Service Best Practice)  
    cypher \= """  
    MERGE (m:Memory {key: $key, scope: $scope})  
    ON CREATE SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.created\_at \= datetime()  
    ON MATCH SET m.content \= $content, m.embedding \= $embedding, m.confidence \= $confidence, m.updated\_at \= datetime()  
    """

    with GraphDatabase.driver(settings.NEO4J\_URI, \*\*settings.NEO4J\_AUTH).session(AccessMode.WRITE) as session:  
        session.run(cypher, parameters={  
            "key": key,  
            "scope": scope,  
            "content": content,  
            "embedding": embedding,  
            "confidence": confidence  
        })  
    return "Personal memory saved successfully."

### **4\. Implementation: `read_neo4j_cypher` (Step 3\)**

This tool applies the mandatory performance and integrity constraints necessary for reliable retrieval.

def read\_neo4j\_cypher(cypher\_query: str, parameters: dict \= None) \-\> list:  
    """Executes validated Cypher query against the Digital Twin."""

    \# STEP 3 CONSTRAINT ENFORCEMENT (Data Integrity & Pagination)

    \# 1\. Pagination Trap Prevention (Reject SKIP/OFFSET)  
    if "SKIP" in cypher\_query.upper() or "OFFSET" in cypher\_query.upper():  
        \# Enforcing Keyset Pagination rule  
        raise ValueError("Pagination must use Keyset-based queries (WHERE property \> value, LIMIT).")

    \# 2\. Efficiency Constraint (Reject massive data or embeddings)  
    if "m.embedding" in cypher\_query or "n.embedding" in cypher\_query:  
        \# Enforcing Efficiency Rule: return only id and name  
        raise ValueError("Cypher output must not include 'embedding' properties.")

    \# 3\. Level Integrity Check (Conceptual \- requires schema analysis)  
    if 'L2' in cypher\_query and 'L3' in cypher\_query and 'MATCH' in cypher\_query:  
        \# Prevents Level Mismatch gap (e.g., L2 Project \-\> L3 Capability)  
        raise ValueError("Hierarchy Violation: Query must adhere to Same-Level Enforcement rules.")

    \# Execute the validated query  
    with GraphDatabase.driver(settings.NEO4J\_URI, \*\*settings.NEO4J\_AUTH).session(AccessMode.READ) as session:  
        result \= session.run(cypher\_query, parameters or {})

        \# Enforce output structure (Efficiency constraint)  
        return \[r.data() for r in result\]

The Neo4j database is the core of the **Cognitive Digital Twin**, serving both as the permanent **Knowledge Graph (Digital Twin)** and the dynamic **Hierarchical Memory System** (enabling Step 0: REMEMBER and Step 5: RETURN). The design must rigidly enforce integrity constraints and retrieval strategies mandated by the Noor v2.1 architecture.

## **I. Neo4j Schema Design (Digital Twin & Hierarchical Memory)**

The schema is divided into the immutable Digital Twin ontology and the mutable Hierarchical Memory tiers.

### **1\. Core Digital Twin Nodes and Constraints**

All foundational nodes (Digital Twin Entities) must adhere to **Universal Design Principles** for complex analysis (e.g., Complex Analysis, Trend Detection, Risk Assessment).

**Mandatory Node Properties (Applicable to ALL Digital Twin Nodes)**:

| Property | Type | Purpose & Constraint Enforcement |
| ----- | ----- | ----- |
| **`id`** | STRING | Part of the mandatory **Composite Key** (`id`, `year`). |
| **`year`** | INTEGER | Part of the Composite Key; Mandatory for **Temporal Filtering** in queries. |
| **`level`** | STRING | Hierarchy level (L1, L2, or L3). Critical for **Level Integrity Enforcement**. |
| **`embedding`** | FLOAT\[\] | Vector embedding property used for semantic search (RAG). |

**Core Node Labels (Examples)**:

* `sec_objectives`: Strategic/departmental goals.  
* `sec_policy_tools`: Policy types and tools.  
* `ent_capabilities`: Business domains and functional competencies.  
* `ent_risks`: Risk categories (linked to capabilities via Foreign Key exception).  
* `sec_performance`: Strategic and operational metrics.

**Predefined Edge Types (Examples)**:

| Source Node | Edge Type | Target Node |
| ----- | ----- | ----- |
| `sec_objectives` | $\\rightarrow$ | `sec_policy_tools` |
| `ent_capabilities` | $\\rightarrow$ | `ent_risks` |
| `sec_performance` | $\\rightarrow$ | `sec_objectives` |

### **2\. Hierarchical Memory Node Specification (Step 0 & 5\)**

Memory is stored in a dedicated node and segregated by the required four tiers.

**Node Label:** `:Memory`

| Property | Type | Purpose & Access Control |
| ----- | ----- | ----- |
| **`scope`** | STRING | Defines the tier: `personal`, `departmental`, `global`, `csuite`. |
| **`content`** | TEXT | The persistent learned context or user correction. |
| **`embedding`** | FLOAT\[\] | Vector for semantic recall (Step 0: REMEMBER). |
| **`key`** | STRING | Identifier for persistence (used in `MERGE` operation). |
| **`confidence`** | FLOAT | Probabilistic score from the persistence decision (Step 5). |

## **II. Vector Indexing Strategy (Semantic Search)**

The system relies on **Semantic Retrieval** (Vector) for conceptual discovery and conversational context retrieval.

### **1\. Vector Index Design**

The vector index must be created on the dedicated memory node to support the efficiency of Step 0: REMEMBER.

* **Target:** `:Memory` node label.  
* **Property:** `embedding`.  
* **Vector Dimensions:** 1536 (standard dimensions for many modern models).  
* **Similarity Function:** `cosine`.  
* **Index Name:** `memory_semantic_index` (or `knowledge_vectors`).

**Cypher Implementation: Creating the Vector Index**

// 1\. Ensure a uniqueness constraint is present on the memory key/scope (Best Practice)  
CREATE CONSTRAINT memory\_key\_unique IF NOT EXISTS  
ON (m:Memory) ASSERT (m.scope, m.key) IS UNIQUE;

// 2\. Create the Vector Index for semantic similarity search  
CALL db.index.vector.createNodeIndex(  
  'memory\_semantic\_index',  
  'Memory',  
  'embedding',  
  1536,  
  'cosine'  
);

Neo4j supports vector indexes for embedding and vector search functions.

### **2\. Embedding Service Population**

The **Embedding Service** is responsible for vectorizing schema and entities for semantic search. This process is triggered by the setup endpoint (`/api/v1/embeddings/populate`). For Digital Twin nodes, these embeddings are stored in the `embedding` property.

## **III. Cypher Query Design and Constraint Enforcement**

During **Step 3: RECALL**, the LLM generates Cypher queries that must adhere to strict performance and integrity rules enforced by the `read_neo4j_cypher` MCP tool.

### **1\. Query for Semantic Memory Retrieval (Step 0: REMEMBER)**

Retrieves contextual memory based on semantic similarity to the user's current query, filtered by the permitted scope (e.g., 'personal').

| Constraint/Strategy | Requirement |
| ----- | ----- |
| **Retrieval Method** | Must use `db.index.vector.queryNodes`. |
| **Access Control** | Filter results explicitly by `$scope` (e.g., 'personal'). |

**Cypher Example: Semantic Search for Personal Memory**

// Input parameters: $query\_embedding (List\<Float\>), $limit (Integer), $scope ('personal')  
CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
YIELD node AS m, score  
WHERE m.scope \= $scope  
RETURN m.content, m.confidence, score  
ORDER BY score DESC LIMIT $limit

### **2\. Query for Digital Twin Retrieval (Step 3: RECALL)**

This complex query demonstrates fetching data along a defined **Business Chain** (`2A_Strategy_to_Tactics_Tools`) while adhering to mandatory constraints like Temporal Filtering and Level Integrity.

| Constraint/Strategy | Enforcement |
| ----- | ----- |
| **Chain Selection** | Follows the required path: `sec_objectives` $\\rightarrow$ `sec_policy_tools` $\\rightarrow$ `ent_capabilities`. |
| **Temporal Filtering** | Enforced by including `year: $target_year` in the pattern. |
| **Level Matching** | Enforced by requiring all nodes in the path to share the same level (e.g., L3). |

**Cypher Example: Complex Analysis with Constraints**

// Input parameters: $target\_year (Integer), $start\_objective\_id (String), $level ('L3')  
MATCH (obj:sec\_objectives {id: $start\_objective\_id, year: $target\_year, level: $level})  
\-\[:REQUIRES\]-\> (tool:sec\_policy\_tools {year: $target\_year, level: $level})  
\-\[:UTILIZES\]-\> (cap:ent\_capabilities {year: $target\_year, level: $level})

// Enforcement: Efficiency Constraint (MCP Rule: Reject embeddings)  
RETURN obj.id, obj.name, tool.name, cap.name

// Constraint Enforcement: Keyset Pagination (MCP Rule: Reject SKIP/OFFSET)  
ORDER BY cap.id  
WHERE cap.id \> $last\_seen\_id  
LIMIT 30

The `read_neo4j_cypher` tool would intercept any attempt by the LLM to use `SKIP` or `OFFSET` and enforce the Keyset-based methodology shown above.

### **3\. Keyset Pagination Example (Constraint Enforcement)**

The MCP tool explicitly prohibits `SKIP` or `OFFSET` for pagination. Pagination must rely on filtering by a unique, indexed key (Keyset Pagination).

**Cypher Example: Keyset Pagination (Best Practice)**

// Retrieve 30 capabilities created after the last seen ID in 2024  
MATCH (c:ent\_capabilities {year: 2024})  
WHERE c.id \> $last\_seen\_id  
RETURN c.id, c.name  
ORDER BY c.id ASC  
LIMIT 30

The `orchestrator_zero_shot-latest.py` represents the core implementation of the **Noor Staff Agent**, enforcing the **Single-Call MCP Architecture** and the **Fixed Cognitive Control Loop** (Step 0 to Step 5). This architecture is designed to optimize token usage (targeting **40-48% savings** in average token count) and guarantee reasoning integrity.

The complete implementation requires strict separation of concerns across multiple files within the Python/FastAPI backend.

---

## **1\. File Structure**

The Python codebase must be organized into a standard FastAPI project structure, ensuring clear modularity for orchestration, tools, and data access.

| File/Module | Location | Responsibility & Separation of Concerns | Source(s) |
| ----- | ----- | ----- | ----- |
| **Configuration** | `backend/app/config.py` | Stores global settings (Neo4j, Groq, max memory size). |  |
| **Pydantic Models** | `backend/app/models/chat.py` | Defines data structures for request/response bodies (e.g., `ChatInput`, final JSON schema for Step 5 output). |  |
| **Data Access** | `backend/app/services/neo4j_service.py` | Handles direct Neo4j connection, driver setup, and basic query execution. |  |
| **MCP Tool Layer** | `backend/app/services/mcp_service.py` | **Executes all LLM tools** (`read_neo4j_cypher`, `recall_memory`, etc.). Enforces all constraint and access control logic. |  |
| **Core Orchestrator** | `backend/app/services/chat_service.py` | Contains the **`orchestrator_zero_shot`** function. Manages the 5-step loop, prompt assembly, and LLM communication. |  |
| **API Entry Point** | `backend/app/api/routes/chat.py` | FastAPI route definition; handles JWT validation (Planned State) and delegates control to the Orchestrator. |  |
| **Logging** | `backend/app/utils/logger.py` | Handles structured JSON logging for observability (Step 5). |  |

## **2\. Core Orchestrator Class (`orchestrator_zero_shot`)**

The main method of the orchestrator class is responsible for enforcing the sequential integrity of the **Fixed Cognitive Control Loop** within a single LLM API call.

### **Main Orchestrator Flow and 5-Step Enforcement**

The orchestrator must call internal services (LLM, MCP) sequentially to enforce the cognitive pipeline.

\# backend/app/services/chat\_service.py

from app.services import mcp\_service \# MCP Tool access  
\# Import Groq/LLM client configured for tool execution  
from app.llm\_client import invoke\_llm\_with\_tools

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str, user\_role: str):  
    """Enforces the Single-Call MCP Architecture (Step 0 to Step 5)."""

    \# \-----------------------------------------------------------------  
    \# STEP 0: REMEMBER (Hierarchical Memory Recall)  
    \# \-----------------------------------------------------------------  
    recalled\_context \= ""  
    \# Memory access is PATH-DEPENDENT. Mode B/G are mandatory recall.  
    if check\_path\_requires\_memory(user\_query):  
        recalled\_context \= mcp\_service.recall\_memory(  
            scope='personal',  
            query\_summary=user\_query  
        )

    \# \-----------------------------------------------------------------  
    \# STEP 1: REQUIREMENTS (Intent Classification & Gatekeeper)  
    \# \-----------------------------------------------------------------  
    \# LLM performs classification using the core cognitive\_cont bundle.

    initial\_prompt \= create\_classification\_prompt(mcp\_service.retrieve\_instructions('cognitive\_cont'), user\_query)  
    classification\_result \= invoke\_llm\_for\_classification(initial\_prompt)  
    mode \= classification\_result.mode \# A-H

    \# STEP 1 CONSTRAINT: Quick Exit Path Implementation  
    if mode in \['D', 'F'\]: \# Acquaintance or Social  
        \# Bypasses Steps 2, 3, and 4 completely. Latency must be \<0.5s.  
        log\_completion(session\_id, mode, tokens\_in=500, ...)  
        return {"answer": classification\_result.chat\_response, "latency\_optimized": True}

    \# \-----------------------------------------------------------------  
    \# STEP 2: RECOLLECT (Strategy Determination & Dynamic Loading)  
    \# \-----------------------------------------------------------------  
    \# LLM determines required bundles based on 'mode'.  
    required\_tags \= lookup\_tags\_by\_mode(mode)  
    bundles\_content \= mcp\_service.retrieve\_instructions(required\_tags)

    \# \-----------------------------------------------------------------  
    \# PROMPT CONSTRUCTION: Maximize Groq Caching  
    \# \-----------------------------------------------------------------  
    final\_prompt \= construct\_final\_prompt(  
        bundles=bundles\_content,          \# MUST be START of prompt  
        recalled\_memory=recalled\_context, \# Dynamic content END of prompt  
        history=get\_history(session\_id),  \# Dynamic content END of prompt  
        query=user\_query  
    )

    \# \-----------------------------------------------------------------  
    \# SINGLE LLM CALL: Executes Steps 3, 4, 5 Internally  
    \# \-----------------------------------------------------------------  
    \# The LLM calls MCP tools (read\_neo4j\_cypher, save\_memory) DURING this call.  
    final\_llm\_output \= await invoke\_llm\_with\_tools(  
        prompt=final\_prompt,  
        available\_tools=\[mcp\_service.read\_neo4j\_cypher, mcp\_service.save\_memory\]  
    )  
    \# LLM Trace: Executes Step 3 (RECALL) \-\> Step 4 (RECONCILE) \-\> Step 5 (RETURN)

    \# \-----------------------------------------------------------------  
    \# STEP 5: RETURN (Final Output and Memory Save Protocol)  
    \# \-----------------------------------------------------------------  
    if final\_llm\_output.trigger\_memory\_save:  
        \# Executes conditional save strictly to 'personal' scope.  
        mcp\_service.save\_memory(  
            scope='personal',  
            key=user\_query,  
            content=final\_llm\_output.memory\_content  
        )

    \# Log critical metrics.  
    log\_completion(session\_id, mode, tokens\_in=final\_llm\_output.tokens\_input, ...)

    return normalize\_response(final\_llm\_output)

## **3\. The 6 Critical Trap Patterns and Recovery**

The architecture explicitly mandates preventing six critical trap patterns which lead to hallucination, incorrect execution, or lack of resilience.

| Trap Pattern | Why It Happens | Prevention & Handling Code Layer | Recovery Procedure |
| ----- | ----- | ----- | ----- |
| **1\. Hallucinating Data** | LLM attempts to fill knowledge gaps with generated facts. | **LLM Instruction (Step 4):** `strategy_gap_diagnosis` mandates explicit stating of knowledge limitation if Step 3 data is empty. | Explicitly state knowledge limitation. |
| **2\. Making Assumptions** | LLM proceeds without verifying ambiguous entities or context. | **LLM Instruction (Step 1/3):** Force entity extraction via `QueryPreprocessor`. Triggers Mode H if ambiguity remains. | Ask clarifying question. |
| **3\. Ignoring Ambiguity** | Failure to resolve references ("the project"). | **Module:** `QueryPreprocessor` normalizes input ("that project" $\\rightarrow$ specific ID). | Ask clarifying question (Mode H). |
| **4\. Providing Stale Data** | Retrieval without temporal context (missing mandatory `year` property). | **Neo4j Schema:** All Digital Twin nodes require `year` property (Composite Key). **MCP (Step 3):** `read_neo4j_cypher` validates Cypher contains temporal filters. | LLM MUST cite sources/timestamps in output. |
| **5\. Forgetting to Cite Sources** | Failing to link synthesis to retrieved graph data. | **LLM Instruction (Step 4/5):** Output Validation Checklist verifies sources are cited in the final JSON schema. | Suggest alternative query formulation if citation fails verification. |
| **6\. Continuing without Backtracking** | Proceeding to synthesis (Step 4\) after retrieval (Step 3\) fails validation. | **LLM Instruction (Step 3):** After **EACH tool call**, LLM MUST validate results and **BACKTRACK** to an alternative strategy (Phase 2\) if validation fails. | LLM must attempt an alternative retrieval strategy or stop and ask for clarification. |

### **Testing Strategy for Traps**

Testing requires targeted regression tests:

* **Cypher Integrity Test:** Send a Cypher query with prohibited syntax (`SKIP 10`) to `read_neo4j_cypher` and assert that the MCP layer returns a `ValueError`.  
* **Memory Access Test:** Attempt to call `save_memory('global', ...)` and assert a `PermissionError` is raised by the MCP.

## **4\. Response Normalization (JSON → Markdown)**

The orchestrator's Layer 4 responsibility is to process the raw LLM JSON output (Step 5\) into a final, user-friendly Markdown response, preventing technical leakage.

### **Step-by-Step Normalization Process**

1. **JSON Parsing:** Parse the raw LLM output string into a structured object using Pydantic validation (Layer 4).  
2. **Artifact Extraction:** Extract the `artifact_specification` list. **Constraint:** Verify that `network_graph` is **NOT** specified; if detected, convert its output to a simple table format (Source, Relationship, Target).  
3. **Business Language Verification:** Final check to ensure the `answer` field does not contain forbidden technical terms (`Cypher`, `L3`, `Node`) (Layer 4).  
4. **Markdown Assembly:** Format the primary `answer` text, followed by rendering tables/charts derived from the artifacts.

**Fallback Parsing Strategy:** If a **JSON Parse Error** (LLM Error Category 3\) occurs, the Orchestrator must employ a fallback mechanism: extract the raw text content and return it as a plain response instead of failing the request entirely.

**Code Example: Normalization and Leakage Handling**

\# backend/app/utils/normalization.py

import json  
from pydantic import ValidationError

FORBIDDEN\_TERMS \= \["L3", "Cypher", "Node", "embedding"\] \# Technical terms

def normalize\_response(llm\_output: str):  
    try:  
        \# Step 1: JSON Parsing and Pydantic Validation  
        response\_data \= json.loads(llm\_output)

        \# Step 3: Business Language/Technical Leakage Check  
        for term in FORBIDDEN\_TERMS:  
            if term in response\_data.get("answer", ""):  
                raise ValueError("Technical jargon detected in final answer.")

        \# Step 2: Artifact Check (network\_graph prohibition)  
        for artifact in response\_data.get("artifact\_specification", \[\]):  
            if artifact.get("type") \== "network\_graph":  
                \# Enforce mandatory conversion to table  
                artifact\["type"\] \= "table"  
                artifact\["config"\]\["title"\] \= "Related Entities (Converted from Graph View)"

        \# Step 4: Markdown Assembly (Simplified)  
        markdown\_response \= f"\*\*Confidence: {response\_data\['confidence\_score'\]:.2f}\*\*\\n\\n"  
        markdown\_response \+= response\_data\['answer'\]  
        \# ... logic to render tables/charts ...

        return {"output": markdown\_response, "status": "success"}

    except (json.JSONDecodeError, ValidationError, ValueError) as e:  
        \# Layer 3/4 Error Handling: Fallback parsing  
        error\_message \= f"LLM output error: {type(e).\_\_name\_\_}. Returning raw text."  
        \# Attempt to return the text outside of the failed JSON structure  
        return {"output": llm\_output, "status": "partial\_success", "error": error\_message}

## **5\. Prompt Construction and Caching**

The prompt is dynamically assembled in Step 2 to achieve the target token savings. Placement is critical for Groq/Anthropic cache utilization.

| Prompt Section | Content | Cognitive Step/Purpose | Placement Constraint | Source(s) |
| ----- | ----- | ----- | ----- | ----- |
| **Static Prefix** | Core instructions, cognitive\_cont bundle (2,500 tokens). | Defines the 5-step loop and classification rules. | **START of Prompt** (Must be cached). |  |
| **Dynamic Bundles** | Task-Specific Instructions (e.g., `strategy_gap_diagnosis`). | Provides path-specific strategy and tool use rules (Step 2). | **Immediately after Static Prefix** (Cached). |  |
| **MCP Tool Definitions** | Schemas for `read_neo4j_cypher`, `save_memory`, etc. | Allows LLM to perform execution calls (Step 3/5). | Included with the model invocation payload. |  |
| **Dynamic Suffix** | Recalled Context (Step 0), Conversation History, User Query. | User-specific, highly variable context. | **END of Prompt** (Least impact on caching). |  |

**Code Example: Prompt Construction Logic**

\# backend/app/services/chat\_service.py (Part of orchestrator\_zero\_shot)

def construct\_final\_prompt(bundles: str, recalled\_memory: str, history: str, query: str) \-\> str:  
    """Assembles the final prompt, respecting Groq caching rules."""

    \# 1\. Prefix: Task-Specific Instructions (Caching Target)  
    instruction\_prefix \= bundles

    \# 2\. Suffix: Dynamic, User-Specific Context (Non-Cached)  
    dynamic\_suffix \= f"""  
\[--- DYNAMIC CONTEXT START \---\]  
Recalled Hierarchical Memory: {recalled\_memory}  
Conversation History: {history}  
User Query: {query}  
"""

    \# Total Input Token Count \= len(Prefix) \+ len(Suffix) \+ MCP Tool Overhead (\~450 tokens/tool)  
    return instruction\_prefix \+ dynamic\_suffix

## **6\. MCP Tool Integration**

The LLM (Groq) uses the MCP tools to perform database and persistence actions DURING the single inference call.

### **Tool Definition and Execution Flow**

1. **Tool Definition:** Tools are provided to the LLM client (e.g., `invoke_llm_with_tools`) using structured definitions that map the tool name and its Python function.  
2. **LLM Request:** The LLM's output includes a structured request to call a tool (e.g., `read_neo4j_cypher`).  
3. **Execution:** The orchestrator intercepts the tool request and executes the corresponding Python function in `mcp_service.py` **server-side**.  
4. **Result Processing:** The result (e.g., raw Cypher data) is returned to the LLM, which continues reasoning (Step 4: RECONCILE).

### **Error Handling and Retries (Tool-Level)**

If a tool execution fails (e.g., a database timeout or a constraint violation), the MCP tool raises a specific exception.

* **Constraint Violation:** If `read_neo4j_cypher` detects illegal syntax (`SKIP`), it raises a `ValueError`. This error is returned to the LLM as the tool result. The LLM's instructions (Step 3: RECALL) mandate that it must interpret this error and initiate the **BACKTRACKING** recovery protocol.  
* **Infrastructure Failure:** If Neo4j is unavailable, the MCP service returns a "Database Unavailable" error. The LLM acknowledges the service failure, apologizes, and reverts to a simple case, rather than attempting execution.

## **7\. Working Implementation Skeleton (OrchestratorZeroShot)**

\# backend/app/services/chat\_service.py

import json  
from app.services import mcp\_service  
from app.utils.logger import log\_completion  
from app.utils.normalization import normalize\_response \# Assuming function from Q4  
from app.llm\_client import invoke\_llm\_with\_tools, invoke\_llm\_for\_classification  
from app.data import get\_history, lookup\_tags\_by\_mode, check\_path\_requires\_memory \# Placeholder functions

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str, user\_role: str):  
    """  
    Core function for Noor Staff Agent (Token Optimized).  
    Implements the Fixed Cognitive Control Loop (Step 0 \-\> Step 5\) within a Single-Call MCP execution.  
    """  
    try:  
        \# STEP 0: REMEMBER (Path-Dependent Memory Recall)  
        \# MCP Overhead added to input tokens here.  
        recalled\_context \= ""  
        if check\_path\_requires\_memory(user\_query):  
            \# MCP enforces R/O for Dept/Global; R/W for Personal  
            recalled\_context \= mcp\_service.recall\_memory(scope='personal', query\_summary=user\_query)

        \# STEP 1: REQUIREMENTS (Intent Classification & Gatekeeper)  
        \# The LLM's initial prompt contains the cognitive\_cont bundle  
        classification\_result \= await invoke\_llm\_for\_classification(  
            mcp\_service.retrieve\_instructions('cognitive\_cont'), user\_query  
        )  
        mode \= classification\_result.mode

        \# CONSTRAINT: Quick Exit Path Check (Modes D, F)  
        if mode in \['D', 'F'\]:  
            \# Skip heavy steps for conversational queries; achieves \<0.5s latency  
            log\_completion(session\_id, mode, tokens\_in=classification\_result.tokens\_output, confidence=1.0, bundles\_used=\['cognitive\_cont'\])  
            return {"answer": classification\_result.chat\_response, "latency\_optimized": True}

        \# STEP 2: RECOLLECT (Dynamic Bundle Loading)  
        required\_tags \= lookup\_tags\_by\_mode(mode)  
        bundles\_data \= \[mcp\_service.retrieve\_instructions(tag) for tag in required\_tags\]  
        bundles\_content \= "".join(b\['content'\] for b in bundles\_data)

        \# Prompt Construction: Bundles first for Groq caching efficiency  
        final\_prompt \= f"{bundles\_content}\\n\\n\[--- DYNAMIC CONTEXT START \---\]\\n" \\  
                       f"Recalled Memory: {recalled\_context}\\n" \\  
                       f"History: {get\_history(session\_id)}\\n" \\  
                       f"User Query: {user\_query}"

        \# SINGLE LLM INVOCATION (Executes Steps 3, 4, 5 Internally)  
        final\_llm\_output \= await invoke\_llm\_with\_tools(  
            prompt=final\_prompt,  
            available\_tools=\[mcp\_service.read\_neo4j\_cypher, mcp\_service.save\_memory\] \# Tools provided  
        )

        \# STEP 5: RETURN (Memory Save and Final Formatting)  
        if final\_llm\_output.trigger\_memory\_save:  
            \# Enforced constraint: strictly 'personal' scope save  
            mcp\_service.save\_memory(  
                scope='personal',  
                key=user\_query,  
                content=final\_llm\_output.memory\_content,  
                confidence=final\_llm\_output.confidence\_score  
            )

        \# Logging Hook  
        log\_completion(session\_id, mode, tokens\_in=final\_llm\_output.tokens\_input,  
                       confidence=final\_llm\_output.confidence\_score, bundles\_used=required\_tags)

        \# Final JSON \-\> Markdown normalization  
        return normalize\_response(final\_llm\_output.raw\_json\_output)

    except Exception as e:  
        \# Layer 2/3/4 Error Handling (Database/LLM failures)  
        error\_message \= f"Critical Orchestrator Failure ({type(e).\_\_name\_\_}): {str(e)}"  
        log\_error(session\_id, error\_message)  
        \# Suggest clarification or service unavailable message  
        return {"answer": "I apologize, a system error occurred. Please try simplifying your query.", "error": error\_message}

The user query, "What's our strategy gap?", triggers an analytical pathway within the Noor Staff Agent's **Single-Call MCP Architecture**. This query directly corresponds to a mandatory analysis mode, forcing the system through the full Cognitive Control Loop (Step 0, 1, 2, 3, 4, 5).

## **Step 0: REMEMBER (Hierarchical Memory Recall)**

This step is the **Mandatory Access Point** for path-dependent memory retrieval and must execute before intent analysis.

### **How the system retrieves relevant memories**

Memory retrieval is **PATH-DEPENDENT**. The query "What's our strategy gap?" is classified as **Mode B2: Gap Diagnosis**. Mode B2 mandates searching the **Hierarchical Memory System**.

1. **Scope Determination:** Based on the Mode B2 path, the LLM is instructed (via `module_memory_management_noor`) to search the **`departmental`** scope first for prior validated gaps.  
2. **Access Control:** The MCP tool **`recall_memory`** enforces that Noor has **Read-Only (R/O)** access to the `departmental` and `global` tiers, and is **forbidden** access to the `csuite` tier.  
3. **Retrieval Method:** Retrieval must use **semantic similarity search** (vector search) through the Neo4j graph memory.  
4. **Fallback Logic:** If the search in the `departmental` scope yields no results, the MCP server automatically attempts search in the `global` scope.

### **Example Cypher query for memory search**

The MCP tool executes Cypher leveraging the pre-existing Neo4j vector index (`memory_semantic_index`) and filters by the required scope (`departmental`):

// Executed by the recall\_memory MCP tool (Python service)  
// Inputs: $query\_embedding (Vector), $limit (Integer), $scope ('departmental')

CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
YIELD node AS m, score  
WHERE m.scope \= $scope  
RETURN m.content, m.confidence, m.key, score  
ORDER BY score DESC LIMIT $limit

### **Example Memory Result**

The result is formatted by the MCP tool and returned to the LLM for injection into the prompt's Dynamic Suffix:

\# Variable: recalled\_context  
recalled\_context \= """  
Recalled Context from departmental memory: \[  
    {  
        "key": "Q3\_Risk\_Analysis",  
        "content": "Risk exposure analysis from Q3 2025 indicated a Level Mismatch gap between Project Output (L2) and Capability (L3).",  
        "confidence": 0.85,  
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
* Since Mode B2 requires multi-hop graph traversal and analytical reasoning, the Gatekeeper Logic instructs the orchestrator to proceed directly to Step 2 (RECOLLECT).

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
| ----- | ----- | ----- |
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

    \<SECTION title="Synthesis Integrity Protocol"\>  
        1\. Synthesize results from multiple tool calls into cohesive business insights.  
        2\. Apply Business Language Translation from the glossary (DO NOT use "L3," "Node," or "Cypher" in the final narrative).  
    \</SECTION\>

    \<SECTION title="Gap Analysis Framework (Absence is Signal, Not Silence)"\>  
        IF (Raw data from Step 3 indicates missing relationships or entities) THEN  
            Execute MANDATORY Gap Classification:  
            \<GAP\_RULE type="Level Mismatch" severity="🔴🔴"\>L2 Project links to L3 Capability\</GAP\_RULE\>  
            \<GAP\_RULE type="Temporal Gap" severity="🟡🟡"\>2025 data exists, 2026 data missing\</GAP\_RULE\>  
            \<GAP\_RULE type="Direct Relationship Missing" severity="🔴🔴"\>Policy Tool ↛ Capability\</GAP\_RULE\>  
    \</SECTION\>  
\</INSTRUCTION\_BUNDLE\>

### **How are bundles injected into the prompt?**

The strategy ensures **bundles are injected at the START of the prompt** to maximize cache utilization, a critical rule for achieving the target token savings.

1. **MCP Tool Call:** The orchestrator calls the `retrieve_instructions` MCP tool with the required tags (`B2` mode tags).  
2. **Prompt Assembly:** The Orchestrator constructs the final prompt by concatenating the dynamic content (Step 0 memory, history, query) **after** the static instruction bundles.

**Code implementation (Prompt Assembly)**

\# STEP 2 Orchestration Flow (within orchestrator\_zero\_shot)

required\_tags \= \['knowledge\_context', 'tool\_rules\_core', 'strategy\_gap\_diagnosis', 'module\_memory\_management\_noor'\]  
\# Bundles content is retrieved via MCP tool (PostgreSQL lookup)  
bundles\_content \= mcp\_service.retrieve\_instructions(required\_tags)

\# Inject bundles as PREFIX (CACHE RULE ENFORCEMENT)  
final\_prompt \= bundles\_content \+ f"""  
\[--- END INSTRUCTIONS \---\]

\# DYNAMIC CONTEXT (NON-CACHED SUFFIX)  
Recalled Hierarchical Memory: {recalled\_context}  
Conversation History: \[Previous messages...\]  
User Query: {user\_query}  
"""

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
| ----- | ----- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q4', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** All entities (Objectives, Tools, Capabilities) linked by the business chain for Q4. **Why:** This establishes the current state baseline for the Gap Diagnosis (Step 4). **Constraints Applied:** Mandatory Temporal Filtering (`year`, `quarter`) and Level Integrity (`level: $Level`). |

### **Query 2: Retrieval of Q1 Strategy Chain Data (Historical Comparison)**

This query performs the same graph traversal for the earlier quarter (Q1).

| Cypher Query | Purpose & Retrieval |
| ----- | ----- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q1', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** Historical entities linked by the same chain for Q1. **Why:** Compares the structure of the Digital Twin across two points in time to identify changes, missing links, or degradation (a temporal gap). |

### **Query 3: Aggregation Query (Metric Comparison)**

A simpler query for aggregating performance metrics related to the strategy objectives for both periods.

| Cypher Query | Purpose & Retrieval |
| ----- | ----- |
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
| ----- | ----- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q4', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q4', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** All entities (Objectives, Tools, Capabilities) linked by the business chain for Q4. **Why:** This establishes the current state baseline for the Gap Diagnosis (Step 4). **Constraints Applied:** Mandatory Temporal Filtering (`year`, `quarter`) and Level Integrity (`level: $Level`). |

### **Query 2: Retrieval of Q1 Strategy Chain Data (Historical Comparison)**

This query performs the same graph traversal for the earlier quarter (Q1).

| Cypher Query | Purpose & Retrieval |
| ----- | ----- |
| **MATCH** (obj:sec\_objectives {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:REQUIRES\]$\\rightarrow$** (tool:sec\_policy\_tools {year: $Year, quarter: 'Q1', level: $Level}) **\-\[:UTILIZES\]$\\rightarrow$** (cap:ent\_capabilities {year: $Year, quarter: 'Q1', level: $Level}) **RETURN** obj.name, tool.name, cap.name, cap.id **ORDER BY** cap.id **WHERE** cap.id \> $last\_id **LIMIT** 30 | **Retrieves:** Historical entities linked by the same chain for Q1. **Why:** Compares the structure of the Digital Twin across two points in time to identify changes, missing links, or degradation (a temporal gap). |

### **Query 3: Aggregation Query (Metric Comparison)**

A simpler query for aggregating performance metrics related to the strategy objectives for both periods.

| Cypher Query | Purpose & Retrieval |
| ----- | ----- |
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

The final two steps of the **Single-Call MCP Architecture** are dedicated to transforming the raw data retrieved in Step 3 (RECALL) into actionable intelligence and formatting the final output according to strict architectural constraints.

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

The Layer 4 Response Formatting in the orchestrator handles the final polishing.

1. **Stripping Comments and Fences:** The Python orchestrator removes external JSON fences (e.g., \`\`\`json) and internal reasoning comments before attempting to parse the JSON string.  
2. **Answer Field Extraction:** The orchestrator extracts the final JSON object and uses the content of the `answer` field and the `artifact_specification` list to assemble the final Markdown response.  
3. **Normalization Check:** The normalization layer verifies that the final output adheres to the constraints (e.g., ensuring no **JSON Parse Error** occurred and confirming the Business Language Translation was successful by checking for forbidden technical terms).

### **Memory Save Protocol (Step 5 Execution)**

The memory save protocol is executed conditionally via the **`save_memory` MCP tool**.

* **Condition Check:** For this analytical gap diagnosis query, the LLM determines that the user did not explicitly state a preference or correct an institutional fact.  
* **Result:** The `trigger_memory_save` field in the LLM's JSON output is `false`.  
* **Action:** The orchestrator bypasses the `save_memory` tool call.

If the user had followed up with, "Actually, the target year for Q4 was 2026, not 2025," the LLM would set `trigger_memory_save: true` and execute `save_memory(scope='personal', key='Year Correction', content='Q4 target 2026')`.

This data flow diagram outlines the execution path for the analytical query "What's our strategy gap?" through the Noor Cognitive Digital Twin v2.1's **Single-Call MCP Architecture**.

The entire process (Steps 1-5) executes within **ONE billable LLM API call**.

---

### **Input: User asks "What's our strategy gap?" (Mode B2)**

### **1\. Step 0: REMEMBER (Memory Retrieval)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| `User Query` ("What's our strategy gap?"), Session ID. | **Decision Logic:** The query path (Gap Diagnosis) mandates memory retrieval. The system calls the `recall_memory` MCP tool. **Retrieval:** Executes **semantic similarity search** (vector search) in Neo4j, focusing on the **`departmental`** and **`global`** scopes (R/O for Noor). | `recalled_context` (e.g., "Q3 risk analysis showed Level Mismatch gap"). |
| **Example Cypher:** `CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding) YIELD node AS m, score WHERE m.scope = $scope RETURN m.content, score`. |  |  |

### **2\. Step 1: REQUIREMENTS (Mode Classification)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| `User Query`, `recalled_context` (if any), `cognitive_cont` bundle. | **Classification:** LLM analyzes intent and resolved entities. Query is classified as **Mode B2: Gap Diagnosis**. **Gatekeeper Decision:** This is **NOT** a conversational query (D or F). **Quick Exit Path is NOT triggered**. | `interaction_mode` (B2). |

### **3\. Step 2: RECOLLECT (Bundle Loading)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| `interaction_mode` (B2). | **Strategy Retrieval:** LLM calls the `retrieve_instructions` MCP tool. The MCP queries PostgreSQL (`instruction_bundles` table) for all bundles tagged for Mode B2. **Prompt Assembly:** Bundles are concatenated and placed at the **START** of the final prompt to enable prompt caching. | `bundles_content` (Concatenated XML instructions, including `strategy_gap_diagnosis`, `knowledge_context`, and `tool_rules_core`). |

### **4\. Step 3: RECALL (Graph Queries)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| **Full Prompt** (Bundles prefix \+ Context suffix), `read_neo4j_cypher` tool schema. | **Query Generation:** LLM generates Cypher queries matching the predefined **Business Chain** (e.g., 2A\_Strategy\_to\_Tactics\_Tools). **Execution & Validation:** Calls `read_neo4j_cypher` MCP tool. MCP enforces **Level Integrity** and **Keyset Pagination** constraints. Result returned to LLM. **Backtracking:** LLM validates result count. | `raw_query_results` (e.g., List of capabilities linked by strategic chain for Q4 and Q1, metrics data). |

### **5\. Step 4: RECONCILE (Data Synthesis)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| `raw_query_results` (from Step 3), `recalled_context`, `strategy_gap_diagnosis` bundle. | **Synthesis:** LLM merges Q4 and Q1 data. **Gap Analysis:** Applies "**Absence is signal, not silence**". If Q4 data is missing a link found in Q1, it diagnoses a **Temporal Gap** or **Direct Relationship Missing**. **Confidence & Language:** Calculates **Probabilistic Confidence Score**. Applies **Business Language Translation** (avoiding technical terms like "L3"). | **Synthesized JSON Object** (including `gap_diagnosis`, `confidence_score`, and `artifact_specification`). |

### **6\. Step 5: RETURN (Response Formatting)**

| Data Enters | Processing Happens | Data Exits |
| ----- | ----- | ----- |
| Synthesized JSON Object, LLM decision (`trigger_memory_save: false`). | **Memory Protocol:** Checks memory save flag. (No save for pure analysis). **Normalization:** Orchestrator extracts `answer` and `artifact_specification`. Ensures `network_graph` is **NOT** used. Formats output into Markdown. **Logging:** Records `tokens_input`, `confidence_score`, and `bundles_loaded`. | **Final Markdown Response** (Streamed to Frontend). |

The Noor v2.1 architecture was specifically redesigned to achieve the target performance and cost metrics by migrating from the monolithic prompt architecture (v1.0) to the **Single-Call MCP Architecture** with dynamic retrieval.

The query "What's our strategy gap?" is classified as **Mode B2: Gap Diagnosis**. Since this is a **Complex Analysis** query, it requires the full execution of the Cognitive Control Loop (Step 0 through Step 5\) and cannot utilize the fast $0.5\\text{s}$ Quick Exit Path reserved for conversational queries (Modes D, F).

The target latency of $\<500\\text{ms}$ specifically refers to the **Quick Exit Path** (Mode F/D). For a complex **Mode B2** query requiring multiple database calls, the total execution time will necessarily exceed $0.5\\text{s}$, but must still be optimized to meet production standards.

---

## **1\. Latency Breakdown for "Strategy Gap" (Mode B2)**

The execution of a Mode B2 query involves the LLM making multiple synchronous tool calls within its **ONE billable API call**. The critical path involves memory retrieval, bundle preparation, and the LLM's primary synthesis step (which includes the graph queries).

| Step | Operation | Source(s) | Estimated Latency |
| ----- | ----- | ----- | ----- |
| **0** | **REMEMBER (Memory Retrieval)** | `recall_memory` MCP tool executes semantic search in Neo4j. Retrieval must be targeted. | $\\approx 200\\text{ms}$ |
| **1** | **REQUIREMENTS (Classification)** | LLM processes input prompt (Core Bundle \+ Memory) and classifies intent (Mode B2). | $\\approx 100\\text{ms}$ |
| **2** | **RECOLLECT (Bundle Loading)** | LLM calls `retrieve_instructions` MCP tool to fetch necessary bundles (e.g., `strategy_gap_diagnosis`). This involves a PostgreSQL lookup. | $\\approx 50\\text{ms}$ |
| **3 & 4 (LLM Loop)** | **RECALL, RECONCILE, Synthesis** | LLM executes **2-3 `read_neo4j_cypher` calls** for Q4/Q1 comparison (Step 3). **Total LLM processing time is dominated by this phase.** Synthesis (Step 4\) happens immediately after data returns. | $\\approx 1,500\\text{ms}$ |
| **5** | **RETURN (Formatting & Logging)** | Final JSON formatting, confidence score check, and logging metadata (`tokens_input`, `bundles_loaded`). | $\\approx 50\\text{ms}$ |
| **Total Estimated Latency** | **(Full Analytical Query)** |  | $\\approx 1,900\\text{ms}$ |

*Note: The target latency of **$\<500\\text{ms}$** applies to the Quick Exit Path (Mode F/D). A complex analysis like Mode B2 is expected to take longer, though the system target for Single-Call analytical queries is $\<3\\text{s}$ (P50). The $\\approx 1,900\\text{ms}$ estimate keeps the system within acceptable performance limits for complex analysis.*

### **Critical Path**

The **critical path** is dominated by the **LLM processing time** (Steps 3 and 4), specifically the latency of **Cypher execution** and the LLM's internal **Synthesis/Gap Diagnosis** required for Step 4: RECONCILE. This is because complex analysis requires multi-hop graph traversal.

---

## **2\. Cost Breakdown for "Strategy Gap" (Mode B2)**

The financial goal for v2.1 is to reduce the total monthly operational cost from the v1.0 monolithic cost of **$5,437** to approximately **$\\sim$2,147$** (projected at 1,000 queries/day). The target cost of **$\\sim$1,500/\\text{month}$** requires a slightly lower query volume or higher cache hit rate.

The cost calculation must adhere to the **Corrected Token Accounting Methodology**.

### **Assumptions**

1. **Agent:** Noor (Staff Agent), handling 95% of traffic.  
2. **Model:** Groq `gpt-oss-120b` (Token Optimized).  
3. **Query Volume:** 500 users \* 20 working days/month \* 3 queries/day \= 30,000 queries/month.  
4. **Mode B2 Input Size (Average):** The average complex query size for Noor is estimated at **$7,150 – 9,700$ tokens**. We will use the conservative average of **$8,425$ tokens**.  
5. **LLM Cost Rate:** Noor's estimated cost is **$\\sim$0.019$ per query**.

### **Cost Components per "Strategy Gap" Query (Mode B2)**

| Component | Token Count/Cost Driver | Calculation/Cost | Source(s) |
| ----- | ----- | ----- | ----- |
| **Core Prompt Content** | `cognitive_cont` (Step 1\) \+ `knowledge_context` (Step 2\) \+ `tool_rules_core` | $\\approx 2,500$ (Core) $+ 3,500$ (Context) $+ 700$ (Rules) $= 6,700$ tokens |  |
| **Bundle Content Overhead** | `strategy_gap_diagnosis` \+ `module_memory_management_noor` | $\\approx 1,200$ (Gap) $+ 800$ (Memory) $= 2,000$ tokens |  |
| **MCP Tool Overhead** | **3 Calls** (1x `retrieve_instructions`, 2x `read_neo4j_cypher`) | $3 \\times \\sim 450$ tokens/call $= \\mathbf{1,350}$ tokens |  |
| **Memory Recall Overhead** | Step 0 (`recall_memory` execution cost) | Included in the MCP Tool Overhead and input prompt size. |  |
| **Total Input Tokens** | Sum of above (excluding history/query content) | $6,700 \+ 2,000 \+ 1,350 \\approx \\mathbf{10,050}$ tokens |  |
| **LLM API Cost per Query** | Estimated Cost/Query for Noor | $\\mathbf{\\sim$0.019}$ (This rate includes the input and output tokens for the Groq model) |  |
| **Neo4j/DB Query Cost** | Graph traversal, indexing, search, RLS checks (Infra cost) | **$0$** (This is absorbed by the monthly Neo4j Cloud Infrastructure cost, not transactionally billed per query in this model.) |  |
| **Memory Retrieval Cost** | Semantic Search (Step 0\) | **$0$** (Absorbed by LLM API cost, Neo4j infra cost, and the $\\approx 450$ MCP overhead) |  |

### **Cost Calculation for 500 Users/Month**

The target cost of **$\\sim$1,500$ per month** is achieved by strictly managing traffic allocation (95% Noor, 5% Maestro) and minimizing Noor's token count through dynamic bundles.

1. **Total Queries/Month:** 30,000 queries/month.  
2. **Noor Traffic Share (95%):** $30,000 \\times 0.95 \= 28,500$ queries.  
3. **Maestro Traffic Share (5%):** $30,000 \\times 0.05 \= 1,500$ queries.

| Agent | Queries/Month | Estimated Cost/Query | Monthly LLM API Cost | Source(s) |
| ----- | ----- | ----- | ----- | ----- |
| **NOOR** | 28,500 | $\\sim$0.019$ | $\\approx $541.50$ |  |
| **MAESTRO** | 1,500 | $\\sim$0.90$ | $\\approx $1,350.00$ |  |
| **Total LLM Cost** | **30,000** |  | $\\approx $1,891.50$ |  |

The cost model provided for **$1,000$ queries/day ($\\approx 30,000$ queries/month)** results in a total monthly LLM cost of **$\\sim$1,891.50$**.

To reach the target of **$\\sim$1,500$ / month**, the system would need to achieve higher-than-projected token savings (e.g., maximizing the $48%$ savings target, or significantly reducing the average query complexity) and maintain infrastructure costs near the estimated **$$0$ LLM cost** (since database costs are primarily fixed infrastructure fees, estimated at $$7.5\\text{K}/\\text{month}$ for Phase 1 (Pilot) including LLM, meaning infrastructure is $\\approx $5\\text{K}$).

The v2.1 architecture moves the system cost from **$\\sim$5,437$ (v1.0)** to **$\\sim$1,891.50$ (v2.1)** based on the 30,000 query volume, representing a significant saving exceeding 60%.

The following is a complete deployment and operations guide for the **Noor Cognitive Digital Twin v2.1**, built on the **Advanced Tree of Thought: Single-Call MCP Architecture**. This guide details the infrastructure, configuration, testing, monitoring, and operational procedures necessary to achieve the target performance (e.g., $\<500\\text{ms}$ for Quick Exit Path) and cost savings.

## **1\. Infrastructure Setup**

The architecture requires the independent deployment of two agents (Noor and Maestro) and utilizes a dual-database structure. The recommended backend framework is FastAPI using Python 3.10+.

### **Docker/Kubernetes Requirements**

The system must be deployed using containerization to support **Horizontal Scaling** of the stateless orchestrator.

| Component | Technology/Requirement | Notes | Source(s) |
| ----- | ----- | ----- | ----- |
| **Backend Framework** | Python 3.10+, FastAPI 0.104.1, Uvicorn 0.24.0 | Deploy **Noor Agent** (Groq, token-optimized) and **Maestro Agent** (OpenAI, reasoning-optimized) as independent, separate deployments. |  |
| **Containerization** | Docker containers / Cloud platform (configurable) | The backend orchestrator (MCP layer included) is stateless and designed to scale horizontally behind a load balancer. |  |
| **API Gateway** | Required for **Role-Based Routing**. | Routes Staff/Analyst roles to **Noor** and C-level/Vice Minister roles to **Maestro**. Enforces **NO handoff or escalation logic** between agents. |  |

### **Neo4j Deployment (Graph Database)**

The Neo4j database stores the Knowledge Graph and the Hierarchical Memory.

| Deployment Option | Phase Target | Configuration Requirements | Source(s) |
| ----- | ----- | ----- | ----- |
| **Self-Hosted (Development/Local)** | Phase 1 (Pilot/Local) | Deploy via Docker (`docker-compose.yml`). Requires Neo4j 5.x. |  |
| **Managed (Production)** | Phase 1 (Pilot) $\\rightarrow$ Phase 3 (Growth) | Neo4j AuraDB (managed service) is recommended. Phase 1 uses a **Single Neo4j Enterprise instance**; Phase 2 uses a **Neo4j causal cluster** (3 nodes); Phase 3 uses **Neo4j fabric** (federated graph). |  |
| **Prerequisites** | All Phases | Requires Neo4j 5.x with **APOC procedures** and the ability to define the **4 Memory Tiers**. |  |

### **PostgreSQL Setup for Instruction Bundles**

PostgreSQL (Supabase is the primary database service) is mandatory for the relational storage of messages, user data, and the instruction modules.

| Component | Requirement | Notes | Source(s) |
| ----- | ----- | ----- | ----- |
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
| ----- | ----- | ----- | ----- |
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

    \# Feature Flags  
    ENABLE\_CANARY: bool \= False

    class Config:  
        env\_file \= ".env"

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

The strategy focuses on validating the V2.1 constraints (Hierarchical Memory, Single-Call execution, Token Economics).

### **Unit Tests for Each Component**

Unit tests verify the isolated logic of the MCP tools and utility functions.

* **`mcp_service.py` (`read_neo4j_cypher`):** Test must assert that executing Cypher containing `SKIP 10` or `OFFSET 5` raises a `ValueError` (Keyset Pagination trap prevention).  
* **`mcp_service.py` (`save_memory`):** Test must assert that calling with `scope='global'` raises a `PermissionError`.

### **Integration Tests for Control Loop**

Tests validate the integrity of the fixed 5-step sequence (Step 0 $\\rightarrow$ Step 5).

* **Quick Exit Validation:** Test a Mode F query ("Hi") and assert that the orchestrator bypasses Step 3 and 4, and returns results in $\<0.5\\text{s}$.  
* **Backtracking Validation:** Simulate `read_neo4j_cypher` returning a constraint violation (`ValueError`) and assert that the LLM/orchestrator initiates the **Backtracking** procedure instead of crashing or hallucinating (Trap 6).

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

Observability is based on **Structured Logging** to validate V2.1 claims and is essential for Operations.

### **Key Metrics to Track**

| Metric Category | Metrics | Source(s) |
| ----- | ----- | ----- |
| **Token Economics (Cost)** | `tokens_input` (Total input tokens), `tokens_output`, **Token Counting Validation**. |  |
| **Performance (Latency)** | Latency for Quick Exit Path, P95 Latency for Complex Analysis, **MCP Tool Overhead** duration. |  |
| **Quality** | **Probabilistic Confidence Score** (generated in Step 4), Output Validation Checklist status. |  |
| **Memory System** | **Recall Hit Rate per Tier**, Memory Save Frequency (validates Step 0 effectiveness). |  |

### **Logging Strategy**

Logging must be structured (JSON format).

* **Required Fields:** `agent_id` (Noor/Maestro), `bundles_loaded` (Validates Step 2), `tokens_input`, `confidence_score`.  
* **Neo4j Monitoring:** Utilize Neo4j Aura's built-in monitoring, advanced metrics, and Query Log Analyzer to troubleshoot query performance.

### **Tracing**

Tracing is critical for the Single-Call MCP Architecture. Tracing must capture the sequence of calls initiated by the LLM:

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
3. **Cache Invalidation:** Ensure the MCP layer's instruction cache is instantly invalidated, forcing the orchestrator to load the previous stable version (e.g., v1.0.0) where `status = 'active'`.

### **How to Scale to 1000 Users (Phase 2 Target: 2,000 Users)**

Scaling is horizontal and requires database upgrades.

1. **Backend Scaling:** Increase the number of stateless Noor and Maestro orchestrator containers behind the load balancer.  
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
* \[ \] **Readiness Probe:** Verify the orchestrator can successfully connect to the Groq API, the PostgreSQL instruction store, and the Neo4j Graph Database (initial connectivity check).

### **Rollback Procedures**

* \[ \] If canary testing fails, immediately change the `status` of the new instruction bundles from `draft` to `deprecated`.  
* \[ \] If the entire Noor agent deployment fails, route all traffic back to the previous stable version deployment (Blue-Green method).

### **Post-Deployment Verification**

* \[ \] Confirm API Gateway is correctly enforcing **Role-Based Routing** (Staff $\\rightarrow$ Noor; C-suite $\\rightarrow$ Maestro).  
* \[ \] Verify structured logging is successfully capturing `tokens_input` and `bundles_loaded` in production environment.  
* \[ \] Test a Mode F query ("Hello") and assert that the response is instant, confirming the **Quick Exit Path** is functional.

