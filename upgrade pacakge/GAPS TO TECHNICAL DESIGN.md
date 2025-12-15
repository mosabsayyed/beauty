# **GAPS TO TECHNICAL DESIGN**

This response synthesizes the architectural constraints and conceptual code fragments provided in the sources into the requested implementation details. Note that executable code relies on defined constants (like `driver` or `settings`) which are assumed to be initialized in `app.config` or `app.services.neo4j_service`.

---

## **1\. Instruction Bundle XML Examples**

The core of the system relies on 10 atomic instruction modules stored in PostgreSQL as full XML instruction blocks. These modules must be concatenated and placed at the **START** of the prompt for maximum caching efficiency.

### **A. `module_memory_management_noor` (Step 0: REMEMBER Protocol)**

This module contains the non-negotiable rules for hierarchical memory access and read/write permissions for the Noor Staff Agent.

\<\!-- Bundle Tag: module\_memory\_management\_noor \--\>  
\<INSTRUCTION\_BUNDLE tag="module\_memory\_management\_noor" version="1.0.0"\>  
    \<PURPOSE\>Defines the mandatory Step 0 access protocol and Hierarchical Memory R/W constraints.\</PURPOSE\>

    \<RULES type="MemoryAccessControl"\>  
        \<\!-- R/W for Personal, R/O for Shared Context \--\>  
        \<RULE name="NoorWriteConstraint"\>  
            The agent MUST execute the save\_memory tool ONLY with scope='personal'. Writing to 'departmental', 'global', or 'csuite' is forbidden and will result in a PermissionError from the MCP tool.  
        \</RULE\>  
        \<RULE name="NoorReadConstraint"\>  
            The agent MUST NOT attempt to access the 'csuite' memory tier. Read access to 'departmental' and 'global' is permitted via recall\_memory.  
        \</RULE\>  
        \<RULE name="RetrievalMethod"\>  
            Retrieval MUST be performed using semantic similarity search via the recall\_memory tool, optimized for high-precision vector search against the Neo4j :Memory index.  
        \</RULE\>  
    \</RULES\>

    \<LOGIC type="PathDependentTriggers"\>  
        \<\!-- Defines when Step 0 is mandatory or optional \--\>  
        \<TRIGGER mode="G"\>  
            Mode G (Continuation) requires MANDATORY memory recall to retrieve conversation history and preferences.  
        \</TRIGGER\>  
        \<TRIGGER mode="B1, B2"\>  
            Analytical Modes (B1, B2) require MANDATORY Hierarchical memory recall to retrieve relevant institutional context (Dept/Global R/O) and prior gap diagnoses.  
        \</TRIGGER\>  
        \<TRIGGER mode="A"\>  
            Mode A (Simple Query) requires OPTIONAL recall for personal preferences or entity name corrections.  
        \</TRIGGER\>  
    \</LOGIC\>  
\</INSTRUCTION\_BUNDLE\>

### **B. `strategy_gap_diagnosis` (Step 4: RECONCILE Protocol)**

This module mandates the four classifications for **Gap Analysis** and enforces the separation of synthesis from execution.

\<\!-- Bundle Tag: strategy\_gap\_diagnosis \--\>  
\<INSTRUCTION\_BUNDLE tag="strategy\_gap\_diagnosis" version="1.0.0"\>  
    \<PURPOSE\>Mandatory synthesis protocol for Mode B2 queries (Gap Diagnosis).\</PURPOSE\>

    \<PROTOCOL name="ReconcileStepSeparation"\>  
        The synthesis phase (Step 4: RECONCILE) MUST be executed entirely separate from data retrieval (Step 3: RECALL). You must use the raw\_query\_results from Step 3 as input, applying the gap framework below.  
    \</PROTOCOL\>

    \<PRINCIPLE name="AbsenceIsSignal"\>  
        The failure of a Cypher traversal (Step 3\) to yield expected relationships or nodes MUST be interpreted as a diagnosable institutional gap, NOT a simple query failure. Diagnose the gap type and severity.  
    \</PRINCIPLE\>

    \<GAP\_CLASSIFICATION\>  
        \<TYPE tag="DirectRelationshipMissing" severity="🔴🔴"\>Relationship failure between adjacent entities in a mandated Business Chain (e.g., Policy Tool \-\> Capability).\</TYPE\>  
        \<TYPE tag="IndirectChainBroken" severity="🟠🟠"\>A multi-hop path (Business Chain) fails due to an intermediate missing entity or relationship.\</TYPE\>  
        \<TYPE tag="TemporalGap" severity="🟡🟡"\>Data exists for year X but is missing for year Y, preventing required trend or year-over-year comparison.\</TYPE\>  
        \<TYPE tag="LevelMismatch" severity="🔴🔴"\>An illegal cross-hierarchy link violation detected (e.g., L2 Project \-\> L3 Capability linkage attempted).\</TYPE\>  
    \</GAP\_CLASSIFICATION\>

    \<CONSTRAINT name="VisualizationConstraint"\>  
        The output artifact\_specification MUST NOT contain the type "network\_graph". Any graph visualization MUST be transformed into a plain table with columns: Source, Relationship, Target.  
    \</CONSTRAINT\>  
\</INSTRUCTION\_BUNDLE\>

### **C. `module_business_language` (Normalization Glossary)**

This module enforces the **Business Language Translation** rule, preventing the leakage of technical terms into the final output.

\<\!-- Bundle Tag: module\_business\_language \--\>  
\<INSTRUCTION\_BUNDLE tag="module\_business\_language" version="1.0.0"\>  
    \<PURPOSE\>Enforce Business Language Translation during Step 4: RECONCILE and Step 5: RETURN.\</PURPOSE\>

    \<GLOSSARY direction="TechnicalToBusiness"\>  
        \<TERM technical="L3 level" business="Function" /\>  
        \<TERM technical="L2 level" business="Project" /\>  
        \<TERM technical="L1 level" business="Objective" /\>  
        \<TERM technical="Node" business="Entity" /\>  
        \<TERM technical="Cypher query" business="database search" /\>  
        \<TERM technical="n.id" business="unique identifier" /\>  
        \<TERM technical="-\[:ADDRESSES\_GAP\]-" business="closes the gap in" /\>  
        \<TERM technical="SKIP" business="brute force pagination (FORBIDDEN)" /\>  
        \<TERM technical="OFFSET" business="brute force pagination (FORBIDDEN)" /\>  
    \</GLOSSARY\>

    \<RULE name="OutputVerification"\>  
        After final synthesis, review the "answer" field. It MUST NOT contain technical terms such as 'Cypher', 'L3', 'Node', 'SKIP', or 'OFFSET'. Replace them with the corresponding business term.  
    \</RULE\>  
\</INSTRUCTION\_BUNDLE\>

---

## **2\. Quick Exit Path Code**

The Quick Exit Path is triggered in **Step 1: REQUIREMENTS** for conversational queries (Modes D and F) and skips Steps 2, 3, and 4 to achieve a latency target of $\<0.5\\text{s}$.

The implementation occurs within the core **`orchestrator_zero_shot`** function.

### **Python Orchestrator Logic (`backend/app/services/chat_service.py`)**

from typing import Literal, Dict, Any  
import json  
\# Assuming necessary imports for LLM client (Groq) and MCP service  
from app.llm\_client import invoke\_llm\_for\_classification \# Placeholder for Groq API call  
from app.utils.normalization import normalize\_response \# Function detailed in Q3

\# \--- Mode Classification Helper (Simulated LLM Call Output) \---  
\# In a real Single-Call MCP, the LLM classification happens internally,  
\# but the orchestrator handles the external fast-path decision.

def invoke\_llm\_for\_classification(user\_query: str) \-\> Dict\[str, Any\]:  
    \# LLM determines mode and potentially generates a response if F/D mode  
    if user\_query.lower().strip() in \["hello, noor", "hi", "thank you", "thanks"\]:  
        return {  
            "mode": "F",  
            "quick\_exit\_triggered": True,  
            "chat\_response": "Hello\! I am Noor, your Cognitive Digital Twin. How can I assist with your institutional analysis today?"  
        }  
    \# Placeholder for non-quick exit classification (e.g., Mode B2)  
    return {"mode": "B2", "quick\_exit\_triggered": False}

async def orchestrator\_zero\_shot(user\_query: str, session\_id: str):  
    \# STEP 0: REMEMBER (Skipped in this simplified flow, but mandatory for others)  
    \# ... logic for memory retrieval ...  
    recalled\_context \= ""

    \# STEP 1: REQUIREMENTS (Intent Classification and Gatekeeper Logic)  
    classification\_result \= invoke\_llm\_for\_classification(user\_query)  
    mode \= classification\_result.get("mode")

    \# Quick Exit Path Trigger (Mode D: Acquaintance, Mode F: Social)  
    if mode in \['D', 'F'\]:  
        \# STEP 1 COMPLETE: Quick Exit Flag is True.

        \# SKIP Step 2 (RECOLLECT) and Step 3 (RECALL)

        \# JUMP DIRECTLY to Step 5 (RETURN)  
        final\_json\_output \= {  
            "mode": mode,  
            "confidence\_score": 1.0, \# High confidence for simple chat  
            "answer": classification\_result\["chat\_response"\],  
            "trigger\_memory\_save": False,  
        }

        \# STEP 5: RETURN (Normalization & Logging)  
        final\_markdown\_response \= normalize\_response(final\_json\_output)

        \# Log successful completion (essential for observability)  
        \# log\_completion(session\_id, mode, tokens\_in=350, bundles\_used=\[\])

        return final\_markdown\_response \# Latency target \< 0.5s

    \# \--- Standard Analytical Flow (Starts here for non-Quick Exit Modes) \---  
    \# STEP 2: RECOLLECT  
    \# required\_bundles \= mcp\_service.retrieve\_instructions(mode) \# Executed for Mode B2  
    \# ... proceed with full 5-step loop ...

    return "Proceeding to full analytical loop (Steps 2-5)..."

\# Example execution with Mode F query:  
\# response \= await orchestrator\_zero\_shot(user\_query="Hello, Noor", session\_id="abc123")

---

## **3\. Response Normalization Code**

Normalization is applied in Layer 4 / **Step 5: RETURN** and primarily involves processing the raw JSON output from the LLM for Markdown readability and constraint adherence.

### **Python Normalization Function (`backend/app/utils/normalization.py`)**

This function enforces the required **Business Language Translation** regex and the anti-pattern rule forcing `network_graph` output to tables.

import re  
import json  
from typing import Dict, Any

def apply\_business\_language\_translation(text: str) \-\> str:  
    """Applies required glossary translation (Technical \-\> Business terms)."""  
    \#

    \# 1\. Technical Term Mapping (using glossary from module\_business\_language)  
    replacements \= {  
        r"\\bL3\\b": "Function",  
        r"\\bL2\\b": "Project",  
        r"\\bCypher query\\b": "database search",  
        r"\\bnode\\.id\\b": "unique identifier",  
        r"Cypher": "database search",  
        r"\\bNode\\b": "Entity"  
    }

    for pattern, replacement in replacements.items():  
        text \= re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return text

def normalize\_response(final\_json\_output: Dict\[str, Any\]) \-\> str:  
    """  
    Transforms the raw LLM JSON output (Step 5\) into a final Markdown string.  
    Enforces visualization constraints and technical jargon stripping.  
    """

    \# \--- 1\. JSON Leakage Handling \---  
    \# Assuming input is already a validated dictionary.  
    \# If input were raw text, we would strip fence characters (\`\`\`json ... \`\`\`) first.  
    \# We will assume the LLM output validation (Layer 4\) already ensures a clean dict.

    \# \--- 2\. Business Language Translation (Final Polish) \---  
    answer\_text \= final\_json\_output.get("answer", "Analysis complete.")  
    answer\_text \= apply\_business\_language\_translation(answer\_text)

    markdown\_parts \= \[answer\_text, "\\n"\]

    \# \--- 3\. Artifact Extraction and Network Graph Constraint Enforcement \---  
    artifacts \= final\_json\_output.get("artifact\_specification", \[\])

    for artifact in artifacts:  
        artifact\_type \= artifact.get("type", "table")  
        data \= artifact.get("data", \[\])  
        config \= artifact.get("config", {})  
        title \= config.get("title", f"Visualization ({artifact\_type.capitalize()})")

        if artifact\_type \== 'network\_graph':  
            \# EXPLICITLY NOT SUPPORTED constraint enforcement  
            markdown\_parts.append(f"\#\# {title} (Rendered as Table per Constraint)")  
            markdown\_parts.append("| Source | Relationship | Target |")  
            markdown\_parts.append("| :--- | :--- | :--- |")

            \# Assuming 'data' contains list of {Source: X, Relationship: Y, Target: Z}  
            for row in data:  
                markdown\_parts.append(f"| {row.get('Source')} | {row.get('Relationship')} | {row.get('Target')} |")  
            markdown\_parts.append("\\n")

        elif artifact\_type \== 'table' and data:  
            \# Render standard tables  
            markdown\_parts.append(f"\#\# {title}")

            \# Generate markdown table from structure  
            if data and isinstance(data, list):  
                headers \= list(data.keys())  
                markdown\_parts.append("| " \+ " | ".join(headers) \+ " |")  
                markdown\_parts.append("| " \+ " | ".join(\[":---"\] \* len(headers)) \+ " |")  
                for row in data:  
                    markdown\_parts.append("| " \+ " | ".join(\[str(row.get(h, '')) for h in headers\]) \+ " |")  
            markdown\_parts.append("\\n")

        \# Note: Chart specifications (column, line, radar) are usually passed  
        \# as JSON configuration to the frontend (e.g., Highcharts configuration)  
        \# but would be omitted or summarized here for a pure Markdown response.

    \# \--- 4\. Quality Metrics Summary (optional footer) \---  
    confidence \= final\_json\_output.get("confidence\_score")  
    if confidence is not None:  
        markdown\_parts.append(f"\*(Probabilistic Confidence Score: {confidence:.2f})\*") \#

    return "\\n".join(markdown\_parts)

---

## **4\. Memory Fallback Logic**

The Hierarchical Memory is accessed in **Step 0: REMEMBER** via the `recall_memory` MCP tool. The server-side MCP implementation handles the required scope constraints and the **automatic fallback logic** (Departmental $\\rightarrow$ Global).

### **Python `recall_memory` MCP Tool (`backend/app/services/mcp_service.py`)**

This conceptual Python implementation uses Neo4j driver calls to execute semantic search and manage the fallback sequence.

from neo4j import GraphDatabase, AccessMode  
from typing import Literal, Dict, List  
from app.config import settings \# NEO4J\_URI, EMBEDDING\_MODEL, etc.  
\# Placeholder utility function (requires OpenAI/embedding service)  
from app.utils.embedding\_generator import generate\_embedding  
\# Placeholder for Neo4j driver initialization (assumed initialized elsewhere)  
\# driver \= GraphDatabase.driver(settings.NEO4J\_URI, auth=...)

class MCPMemoryService:  
    \# \--- STEP 0: REMEMBER Tool \---

    def \_execute\_vector\_query(self, scope: str, query\_embedding: List\[float\], limit: int) \-\> List\[Dict\[str, Any\]\]:  
        """Helper to execute the semantic search Cypher query."""  
        \# Query template from Source  
        cypher\_query \= """  
        CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
        YIELD node AS m, score  
        WHERE m.scope \= $scope  
        RETURN m.content, m.key, m.confidence, score  
        ORDER BY score DESC LIMIT $limit  
        """  
        \# \--- Execution (Conceptual) \---  
        \# with driver.session(AccessMode.READ) as session:  
        \#     result \= session.run(cypher\_query, {  
        \#         "query\_embedding": query\_embedding,  
        \#         "limit": limit,  
        \#         "scope": scope  
        \#     })  
        \#     return \[record.data() for record in result\]  
        return \[\] \# Mock return for structural clarity

    def recall\_memory(self, scope: Literal\['personal', 'departmental', 'global', 'csuite'\], query\_summary: str, limit: int \= 5\) \-\> str:  
        """  
        Retrieves relevant hierarchical memory using semantic search and fallback logic.  
        Enforces Noor's R/O constraints.  
        """

        \# STEP 0 CONSTRAINT: Scope Validation (Noor Agent Read Constraint)  
        if scope \== 'csuite':  
            raise PermissionError("Noor agent is forbidden from accessing the C-suite memory tier.")

        query\_embedding \= generate\_embedding(query\_summary)  
        results \= \[\]

        \# 1\. Personal Scope (Highest Priority for Personal/Conversational Modes)  
        if scope \== 'personal':  
            results \= self.\_execute\_vector\_query('personal', query\_embedding, limit)  
            if results:  
                return json.dumps(results)

        \# 2\. Departmental Scope (Mandatory for analytical modes like B2/G)  
        if scope \== 'departmental':  
            results \= self.\_execute\_vector\_query('departmental', query\_embedding, limit)  
            if results:  
                return json.dumps(results)

            \# Fallback Logic: Departmental \-\> Global  
            print("INFO: Departmental scope failed. Attempting fallback to Global.")  
            scope \= 'global' \# Reset scope for next search

        \# 3\. Global Scope (Lowest priority, broad institutional context)  
        if scope \== 'global':  
            results \= self.\_execute\_vector\_query('global', query\_embedding, limit)  
            if results:  
                return json.dumps(results)

        \# Error Handling when all tiers fail  
        return "" \# Returns empty string/list if semantic miss occurs

    \# \--- STEP 5: RETURN Tool \---

    def save\_memory(self, scope: str, key: str, content: str, confidence: float):  
        """Persists memory, strictly limited to the personal scope for Noor."""  
        if scope \!= 'personal':  
            \# STEP 5 CONSTRAINT: Noor Write Constraint  
            raise PermissionError(f"Noor agent can only write to the 'personal' memory scope. Attempted scope: '{scope}'.")

        \# embedding \= generate\_embedding(content)  
        \# MERGE Cypher logic executed here  
        \# print(f"Memory successfully saved to 'personal' scope with key: {key}")  
        return "Memory saved successfully."

### **Cypher Query for Fallback Implementation**

The fallback logic is implemented by the client (MCP service) making subsequent calls if the previous one yields an empty result. The core **semantic search query** used for all tiers is:

// 1\. Semantic Search for Memory (Executed by recall\_memory MCP tool)  
// Uses the mandatory vector index 'memory\_semantic\_index'  
CALL db.index.vector.queryNodes('memory\_semantic\_index', $limit, $query\_embedding)  
YIELD node AS m, score  
WHERE m.scope \= $scope // Parameterized scope: 'personal', 'departmental', or 'global'  
RETURN m.content, m.key, m.confidence, score  
ORDER BY score DESC LIMIT $limit

---

## **5\. Common Cypher Queries**

These queries demonstrate adherence to the strict constraints enforced by the `read_neo4j_cypher` MCP tool in **Step 3: RECALL**: mandatory Temporal Filtering (`year`), mandatory Level Integrity (`level`), and **Keyset Pagination** (`WHERE n.id > $last_seen_id LIMIT 30`).

### **A. Query for Gap Analysis (Finding Missing Relationships at Same Level)**

This query traverses the predefined Business Chain **2A\_Strategy\_to\_Tactics\_Tools** (Objectives $\\rightarrow$ Policy Tools $\\rightarrow$ Capabilities) while enforcing Same-Level constraint (L3 $\\leftrightarrow$ L3). If the path fails, Step 4 diagnoses a gap.

// Scenario: Check if capabilities are correctly linked to policy tools for a given year/level.  
// Input Parameters: $Year, $TargetLevel ('L3'), $StartObjectiveId, $LastSeenId  
MATCH (obj:sec\_objectives {id: $StartObjectiveId, year: $Year, level: $TargetLevel})  
\-\[:REQUIRES\]-\> (tool:sec\_policy\_tools {year: $Year, level: $TargetLevel})  
\-\[:UTILIZES\]-\> (cap:ent\_capabilities {year: $Year, level: $TargetLevel})  
// Constraint Enforcement: Keyset Pagination  
WHERE cap.id \> $LastSeenId  
// Constraint Enforcement: Efficiency (Return only mandatory id/name)  
RETURN obj.name, tool.name, cap.name, cap.id AS last\_id  
ORDER BY cap.id ASC  
LIMIT 30

### **B. Query for Trend Analysis (Q1 vs Q4 Comparisons)**

Trend analysis requires running the same query multiple times against different temporal filters (`quarter` property), enabling Step 4 to diagnose **Temporal Gaps**.

// Scenario: Retrieve performance metrics related to specific capabilities for Q4 2025\.  
// This is Query 1 of the Q1 vs Q4 comparison (Query 2 uses $Quarter='Q1').  
// Input Parameters: $Year (2025), $Quarter ('Q4'), $TargetLevel ('L3')  
MATCH (cap:ent\_capabilities {year: $Year, quarter: $Quarter, level: $TargetLevel})  
\-\[:HAS\_METRIC\]-\> (metric:PerformanceMetric)  
// Constraint Enforcement: Aggregation First (collect() used for sampling)  
RETURN cap.name, collect(metric.value)\[0..30\] AS MetricSample, count(metric) AS TotalMetrics  
// Keyset Pagination is usually less relevant here unless capabilities list is huge.

### **C. Query for Executive Context (C-suite View of Business Chain)**

While Noor is forbidden from accessing the C-suite tier itself, this query illustrates a highly constrained traversal query that Maestro might generate, using Level Integrity and focusing on strategic nodes.

// Scenario: Retrieve high-level strategic objectives (L1) and related risks for the current year.  
// Input Parameters: $CurrentYear, $LastObjectiveId  
MATCH (obj:sec\_objectives {year: $CurrentYear, level: 'L1'})  
\-\[:IMPACTS\]-\> (risk:ent\_risks {year: $CurrentYear, level: 'L1'})  
// Constraint Enforcement: Keyset Pagination  
WHERE obj.id \> $LastObjectiveId  
// Constraint Enforcement: Efficiency (Return only mandatory id/name)  
RETURN obj.name, obj.id, risk.name  
ORDER BY obj.id ASC  
LIMIT 30

---

## **6\. Complete PostgreSQL Schema**

The PostgreSQL schema is critical for supporting dynamic bundle retrieval (Step 2: RECOLLECT) and features necessary for continuous deployment (Blue-Green Rollout).

### **SQL DDL for Instruction Store and Metadata**

\-- File: backend/db/init\_postgres.sql

\-- Database setup must use PostgreSQL transactions for atomic bundle updates

\-- Table 1: instruction\_bundles (Core Content Store)  
CREATE TABLE instruction\_bundles (  
    id SERIAL PRIMARY KEY,  
    tag TEXT NOT NULL,                  \-- Unique Bundle identifier (e.g., 'strategy\_gap\_diagnosis'). MUST match prompt tag  
    path\_name TEXT,                     \-- Human-readable name ('Simple Query Path')  
    content TEXT NOT NULL,              \-- Full XML instruction block  
    category TEXT,                      \-- Bundle classification (core, strategy, conditional)  
    avg\_tokens INTEGER,                 \-- Estimated token count (\~1,200 for gap\_diagnosis)  
    version TEXT NOT NULL,              \-- Semantic version (MAJOR.MINOR.PATCH). Used for rollback  
    status TEXT NOT NULL,               \-- Lifecycle state ('active', 'deprecated', 'draft'). Used for Blue-Green Deployment  
    experiment\_group TEXT,              \-- A/B test group name (e.g., 'canary\_v1.1.0')  
    depends\_on TEXT\[\],                  \-- Other required bundle tags (e.g., \['knowledge\_context'\])  
    created\_at TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP, \-- Audit Log  
    updated\_at TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP, \-- Audit Log

    \-- Constraint: Only one active bundle per tag  
    UNIQUE (tag, version)  
);

\-- Table 2: instruction\_metadata (Trigger Rules/Mode Mapping)  
CREATE TABLE instruction\_metadata (  
    tag TEXT REFERENCES instruction\_bundles(tag), \-- References instruction\_bundles.tag  
    trigger\_modes TEXT\[\],               \-- Interaction Modes (A, B, F, G, etc.) that trigger this bundle  
    trigger\_conditions JSONB,           \-- Complex rules (e.g., {"file\_attached": true})  
    compatible\_with TEXT\[\],             \-- Bundles that can safely co-load

    PRIMARY KEY (tag)  
);

\-- Table 3: usage\_tracking (Audit Log / Observability Tracking)  
CREATE TABLE usage\_tracking (  
    session\_id TEXT NOT NULL,  
    user\_id TEXT NOT NULL,  
    agent\_id TEXT NOT NULL,             \-- Noor or Maestro  
    timestamp TIMESTAMPTZ DEFAULT CURRENT\_TIMESTAMP,  
    mode TEXT,                          \-- Interaction Mode (A-H)  
    tokens\_input INTEGER,               \-- Total INPUT tokens consumed (for cost validation)  
    confidence\_score FLOAT,             \-- Probabilistic Confidence Score (from Step 4\)  
    bundles\_loaded TEXT\[\]               \-- List of Task-Specific Bundles loaded in Step 2  
);

\-- Indexing for performance and lookup consistency  
CREATE INDEX idx\_bundle\_status\_tag ON instruction\_bundles (status, tag);  
CREATE INDEX idx\_metadata\_trigger\_modes ON instruction\_metadata USING GIN (trigger\_modes);  
CREATE INDEX idx\_usage\_session\_user ON usage\_tracking (session\_id, user\_id);

