

---

## **Implementation Plan: Noor Cognitive Digital Twin v3.0**

The implementation is divided into four sequential phases, targeting the mandatory dual-database (Neo4j/PostgreSQL) and dual-agent (Noor/Maestro) system.

| Phase | Title | Estimated Effort | Critical Dependency | Success Criteria |
| ----- | ----- | ----- | ----- | ----- |
| **1** | **Data & Schema Foundation** | 4 Weeks | Infrastructure Provisioning | Neo4j Vector Index live; PostgreSQL instruction\_bundles table queryable. |
| **2** | **MCP Tool Layer Development** | 5 Weeks | Phase 1 Completion | All four mandatory MCP tools pass constraint validation tests. |
| **3** | **Orchestrator Rewrite (Single-Call Loop)** | 6 Weeks | Phase 2 Completion | Full 5-step loop executes in **one LLM call**. Quick Exit Path latency $\\le$ 0.5s. |
| **4** | **Productionization & Observability** | 4 Weeks | Phase 3 Completion | Structured logs validate average Noor Input Tokens $\\le$ 7,500; Role-Based Routing confirmed functional. |

---

### **Phase 1: Data & Schema Foundation (4 Weeks)**

This foundational phase establishes the persistent stores for the Knowledge Graph, Hierarchical Memory, and dynamic instructions.

#### **1\. Components to Build First**

1. **Neo4j Constraints & Vector Index:** Implement the Composite Key constraints on Digital Twin nodes and create the mandatory Vector Index for semantic search (Step 0 prerequisite).  
2. **PostgreSQL Instruction Store:** Create the tables required for dynamic bundle loading (`instruction_bundles`, `instruction_metadata`).  
3. **Configuration:** Define all necessary environment variables.

#### **2\. Dependencies**

* Requires provisioning the core infrastructure services: Neo4j 5.x and a PostgreSQL instance (e.g., Supabase).

#### **3\. Integration Checkpoints**

* **Neo4j Setup:** Verify that constraints are applied, and the `memory_semantic_index` is created (assuming 1536 dimensions, 'cosine' similarity).  
* **PostgreSQL Setup:** Verify connection is stable and the instruction tables enforce versioning fields (`version`, `status`).

#### **4\. Testing Strategy at Milestone**

* **Unit Tests:** Verify Neo4j constraints prevent node creation without mandatory `id`, `year`, and `level` properties.  
* **Integration Tests:** Verify connectivity to both Neo4j and PostgreSQL instances using placeholder configuration data.

#### **5\. Files to Create & Directory Structure**

| Directory/File | Description |
| ----- | ----- |
| `project-root/` | Top-level directory |
| `├── .env` | **Mandatory Configuration File**. |
| `├── docker-compose.yml` | Container definitions for `neo4j`, `backend`, `frontend`. |
| `└── backend/` | Python/FastAPI code |
| `├── app/` | Application modules |
| `├── config.py` | `Settings` class for database/API credentials. |
| `└── models/` | Pydantic models (e.g., for schema validation). |
| `└── db/` | Database setup scripts |
| `├── neo4j_setup.cypher` | Constraint/Index creation scripts (Phase 1 Deliverable). |
| `└── init_postgres.sql` | Table creation scripts (`instruction_bundles`, `instruction_metadata`). |

#### **6\. Configuration Needed (.env)**

NEO4J\_URI=bolt://localhost:7687  
NEO4J\_USERNAME=neo4j  
NEO4J\_PASSWORD=your\_secure\_password  
OPENAI\_API\_KEY=sk-your-api-key-here  
EMBEDDING\_MODEL=text-embedding-3-small \# Used for 1536 dimension vector index

---

### **Phase 2: MCP Tool Layer Development (5 Weeks)**

This phase develops the Model Context Protocol (MCP) server, which acts as the secure gatekeeper enforcing all architectural constraints.

#### **1\. Components to Build First**

The primary component is the **MCP Service Layer** (`backend/app/services/mcp_service.py`), implementing the four mandatory tools:

1. ***`recall_memory(scope, query_summary, limit)` (Step 0 Tool):*** Enforces **Noor Read Constraint** (must reject `csuite` scope) and implements **Semantic Similarity Search** with **Fallback Logic** (Departmental $\\rightarrow$ Global).  
2. ***`retrieve_instructions(mode)` (Step 2 Tool):*** Queries PostgreSQL for bundles with `status = 'active'` corresponding to the `interaction_mode`.  
3. ***`read_neo4j_cypher(cypher_query, parameters)` (Step 3 Tool):*** Enforces **Keyset Pagination ONLY** (rejects `SKIP/OFFSET`), **Same-Level Enforcement** (rejects L2 $\\leftrightarrow$ L3 violation), and limits output to `id` and `name` properties.  
4. ***`save_memory(scope, key, content, confidence)` (Step 5 Tool):*** Enforces the **Noor Write Constraint**, accepting only `scope='personal'`.

#### **2\. Dependencies**

* Phase 1 (Database schemas and Neo4j vector index must be present).

#### **3\. Integration Checkpoints**

* **MCP Tools Pass Tests:** All four MCP tool implementations must successfully run unit and integration tests.  
* **Constraint Validation Success:** The `read_neo4j_cypher` tool must successfully raise a `ValueError` when given a Cypher query containing `SKIP 10`.

#### **4\. Testing Strategy at Milestone**

* **Unit Tests (`test_mcp_service.py`):**  
  * **Keyset Pagination Trap:** Assert `read_neo4j_cypher("MATCH (...) SKIP 10")` raises `ValueError`.  
  * **Write Constraint:** Assert `save_memory(scope='global', ...)` raises `PermissionError`.  
  * **Level Integrity Check:** Assert `read_neo4j_cypher` rejects Cypher attempting to link mismatched levels (e.g., L2 $\\leftrightarrow$ L3).  
  * **Read Constraint:** Assert `recall_memory(scope='csuite', ...)` raises `PermissionError`.

#### **5\. Files to Create**

* `backend/app/services/neo4j_service.py`: Contains driver setup and session management.  
* **`backend/app/services/mcp_service.py`**: Implementation of the 4 core MCP tools, enforcing constraints.  
* `backend/tests/test_mcp_service.py`: Unit and component tests for MCP constraints.

---

### **Phase 3: Orchestrator Rewrite (Single-Call Loop) (6 Weeks)**

This phase implements the core logic that orchestrates the Single-Call MCP execution, replacing the older monolithic prompt approach.

#### **1\. Components to Build First**

1. **Core Orchestrator Logic:** Implement the `orchestrator_zero_shot` function in `chat_service.py` to enforce the fixed **Advanced Cognitive Control Loop** (Step 0 $\\rightarrow$ Step 5\) sequentially within **one LLM call**.  
2. **Instruction Bundle Content:** Load the initial **10 atomic instruction modules** (e.g., `knowledge_context`, `strategy_gap_diagnosis`, `module_memory_management_noor`) into PostgreSQL.  
3. **Quick Exit Path:** Implement the logic in **Step 1: REQUIREMENTS** (Gatekeeper Logic) to skip Steps 2, 3, 4 for conversational modes (Modes D and F).  
4. **Prompt Assembly Logic:** Implement Step 2: RECOLLECT to concatenate bundles and place them at the **START of the prompt** to leverage caching.

#### **2\. Dependencies**

* Phase 2 (MCP tool functions must be imported and callable by the orchestrator).  
* LLM API client (Groq for Noor) must be integrated to support synchronous tool execution (Single-Call MCP).

#### **3\. Integration Checkpoints**

* **Single-Call Integrity:** Successful execution of an analytical query (e.g., Mode B1/B2) proving that the entire sequence (Step 0 $\\rightarrow$ Step 5\) completes without requiring multiple external API invocations to the LLM.  
* **Latency Target:** Conversational queries (Mode F/D) must execute via the **Quick Exit Path** and achieve latency of $\\le$ **0.5s**.  
* **RECONCILE Integrity:** Verify that Step 4 output consistently contains the **Gap Diagnosis** and **Probabilistic Confidence Score**, confirming its separation from Step 3\.

#### **4\. Testing Strategy at Milestone**

* **Cognitive Integrity Tests:** Assert that the five logical steps (0, 1, 2, 3, 4, 5\) are preserved in order.  
* **Mode F Test (Fast-Path):** Input "Hello, Noor." Assert Step 2 (`retrieve_instructions`) and Step 3 (`read_neo4j_cypher`) are skipped, and the response latency is low.  
* **Mode B2 Test (Absence is Signal):** Simulate a complex query where Step 3 returns partial data (e.g., a required relationship is missing in Q4). Assert Step 4 diagnosis specifies the correct institutional gap classification (e.g., **Direct Relationship Missing**).  
* **Output Validation Test:** Assert the final JSON output (Step 5\) adheres to the schema and explicitly **does not** contain the term `network_graph`.

#### **5\. Files to Create**

* **`backend/app/services/chat_service.py`**: **Core orchestrator logic** for the 5-step loop.  
* `backend/db/initial_bundles_load.sql`: Script to populate the 10 bundles.  
* `backend/app/utils/normalization.py`: Utility functions to enforce **Business Language Translation** (e.g., replacing "L3" with "Function").  
* `backend/app/models/chat.py`: Defines the `CognitiveControlLoop` data model and final JSON response schema.

---

### **Phase 4: Productionization & Observability (4 Weeks)**

This phase focuses on operational stability, cost validation, and ensuring the architecture supports independent scaling and continuous deployment.

#### **1\. Components to Build First**

1. **Multi-Agent Deployment Config:** Define separate Docker/Kubernetes configurations for the **Noor Staff Agent** (Groq, Token Optimized) and the **Maestro Executive Agent** (OpenAI, Reasoning Optimized).  
2. **API Gateway Router:** Configure role-based routing to ensure Staff roles are routed to Noor, and C-suite roles are routed exclusively to Maestro.  
3. **Structured Logging:** Implement JSON logging (`logger.py`) to capture mandatory metrics like `tokens_input` and `bundles_loaded` (Step 5: RETURN).  
4. **Bundle Rollout Mechanism:** Implement the Blue-Green Deployment logic using the `status` and `experiment_group` fields in the PostgreSQL instruction store for zero-downtime updates.

#### **2\. Dependencies**

* Phase 3 (Stable orchestrator logic).  
* External infrastructure (API Gateway, monitoring platforms).

#### **3\. Integration Checkpoints**

* **Token Economics Validation:** Structured logs must confirm the average Noor Input Tokens are $\\le$ **7,500** (validating the claimed 40-48% token savings).  
* **Role-Based Routing Lock:** Verify C-suite users cannot access the Noor API endpoint, and Noor is forbidden from accessing the `csuite` memory tier.  
* **Bundle Rollback:** Successfully execute a Blue-Green deployment and instant rollback by changing the bundle status in PostgreSQL.

#### **4\. Testing Strategy at Milestone**

* **E2E Role Test:** Send requests with Staff role credential and assert response comes from Noor; send requests with C-suite role credential and assert response comes from Maestro.  
* **Bundle Rollout Test:** Write an E2E test that updates the `status` of an active bundle to `deprecated` and asserts the orchestrator immediately loads the next active version (or the previous one if rolling back).  
* **Observability Validation:** Assert that log files contain the required metadata, including `agent_id`, `tokens_input`, and the **Probabilistic Confidence Score** from Step 4\.  
* **Memory Access Control Regression:** Attempt `save_memory` to the Departmental scope from the Noor agent in an integration test and confirm the `PermissionError` is returned (validating Hierarchical Memory R/W enforcement).

#### **5\. Files to Create**

* `backend/app/utils/logger.py`: Structured logging implementation.  
* `deployment/noor_agent.yaml`: Deployment manifest for Noor.  
* `deployment/maestro_agent.yaml`: Deployment manifest for Maestro.  
* `CI/CD/bundle_management.sh`: Script for automating Phase 4 bundle rollout and rollback procedures.

---

### **Dependencies and Build Sequence Summary**

The sequence ensures that **data constraints and security mechanisms are built before the application logic that depends on them**.

| Component | Phase Built | Dependencies | Which to Build First |
| ----- | ----- | ----- | ----- |
| **Neo4j/PostgreSQL Schema** | 1 | Infrastructure Provisioning | Must be built first to define constraints. |
| **read\_neo4j\_cypher MCP Tool** | 2 | Phase 1 Schema (Neo4j constraints) | Built first in Phase 2, as it enforces Step 3 constraints. |
| **retrieve\_instructions MCP Tool** | 2 | Phase 1 Schema (PostgreSQL tables) | Built alongside Cypher tool to enable dynamic loading. |
| **Initial Instruction Bundles (10 Atomic Modules)** | 3 (Load/Config) | Phase 1 Schema, MCP tools | Loaded only when Phase 3 orchestrator logic is ready to call them. |
| **orchestrator\_zero\_shot (5-Step Loop)** | 3 | Phase 2 MCP Tools | Core application logic depends on functional MCP constraint enforcement. |
| **Multi-Agent Deployment Config** | 4 | Phase 3 Orchestrator | Last step; requires stable Noor/Maestro artifacts to deploy independently. |

The critical dependency path mandates that the rigorous constraint enforcement rules (Keyset Pagination, Level Integrity) reside in the **MCP Layer (Phase 2\)**, decoupling them from the LLM's prompt logic and making them easily testable outside the main application flow. This layered security model is crucial for managing Zero Trust compliance.

