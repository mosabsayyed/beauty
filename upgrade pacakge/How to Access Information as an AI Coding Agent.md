# How To Navigate the Noor Cognitive Digital Twin Design Document (v3.2 Architecture)

This guide serves as the essential navigational framework for coding agents tasked with implementing the Noor Cognitive Digital Twin v3.2, which utilizes the **Advanced Tree of Thought: Agentic Model Context Protocol (MCP) Architecture**.

The goal of this architecture is to ensure targeted **cost efficiency (40-48% token savings)** and mandatory adherence to the **Fixed Cognitive Control Loop** (Step 0 through Step 5).

## Detailed Sitemap (Table of Contents)

### I. Architectural Foundations and Goals

| Section | Topic | Key Specifications & Constraints | Sources |
| :--- | :--- | :--- | :--- |
| **1.0 Architecture Overview** | Core Design Philosophy | **Agentic MCP Architecture**: The entire reasoning process (including all tool calls) must execute autonomously within **one Agentic Session** (or one billable LLM API inference cycle). |,,, |
| **1.1 Agent Architecture** | Two Independent Agents | **Noor Agent** (Staff Agent, Groq `gpt-oss-120b`) handles 95% of traffic. **Maestro Agent** (Executive Agent, OpenAI `o1-pro`) handles 5% of traffic. **NO handoff or escalation protocol** exists between agents. |,,, |
| **1.2 Routing & Access** | Mandatory Routing Logic | User requests must be routed based on the `user_role` at the **API Gateway** before reaching the agents (Staff/Analyst $\rightarrow$ Noor; C-suite $\rightarrow$ Maestro). |, |
| **1.3 Token Economics** | Cost Optimization Target | Achieve **40-48% token savings** compared to V1.0 monolithic models. MCP tool calls add approximately $\sim 450$ tokens overhead to the INPUT token count. |,, |

### II. The Fixed Cognitive Control Loop (The 6 Mandatory Steps)

The loop is sequential and non-negotiable.

| Step | Name | Primary Function | Critical Constraint / Key Logic |
| :--- | :--- | :--- | :--- |
| **STEP 0** | **REMEMBER** | Contextual retrieval using Hierarchical Memory **before** intent classification. | **Mandatory Access Point** using **semantic similarity search** (vector search) across Neo4j. Noor R/W access is limited to the **Personal** scope (R/O for Dept/Global). |
| **STEP 1** | **REQUIREMENTS**| Classifies query into 8 **Interaction Modes (A-H)**. | Contains the **Gatekeeper Logic**. If **Mode D (Acquaintance) or F (Social)** is detected, the **Quick Exit Path** is executed to bypass subsequent steps for latency $<0.5\text{s}$. |
| **STEP 2** | **RECOLLECT** | Dynamically loads **Task-Specific Instruction Bundles** from the PostgreSQL store. | LLM executes the `retrieve_instructions` MCP tool. This step dictates token consumption based on the Mode (Step 1). |
| **STEP 3** | **RECALL** | Core data fetching and query execution phase. | LLM executes `read_neo4j_cypher` MCP tool. **MUST** enforce the **Level Integrity (Same-Level Rule)** (e.g., L3 $\leftrightarrow$ L3). If constraint validation fails, the LLM is **MANDATED to BACKTRACK**. |
| **STEP 4** | **RECONCILE** | Transforms raw data into business intelligence/insight synthesis. **CRITICAL AND SEPARATE** from Step 3. | Applies **Gap Analysis Framework** ("Absence is signal, not silence") to diagnose structural or temporal flaws. Must apply **Business Language Translation** (e.g., replacing "L3" or "Cypher" with business terms). |
| **STEP 5** | **RETURN** | Final formatting, confidence scoring, and logging. | Final output **MUST** adhere to the required JSON schema. Persistence (memory save) is handled **asynchronously** by the Conversation Ingestion Pipeline (No explicit save tool call in V3.2 loop). |

### III. Critical Constraints & Implementation Guardrails

The MCP Layer acts as the enforcement gate for non-negotiable architectural mandates.

| Constraint/Trap Pattern | Enforcement Layer | Prevention Mechanism | Sources |
| :--- | :--- | :--- | :--- |
| **Brute Force Pagination** (Trap 2) | MCP (Step 3: RECALL) | `read_neo4j_cypher` must reject `SKIP` or `OFFSET` keywords; enforces **Keyset Pagination** only. |,,, |
| **Hierarchy Violation** (Trap 3) | MCP (Step 3: RECALL) | `read_neo4j_cypher` checks that all nodes in a traversal path connect only at matching hierarchy levels (**Same-Level Rule**). |, |
| **Technical Jargon Leakage** (Trap 5) | LLM (Step 4: RECONCILE) | **Business Language Translation** is enforced by instruction bundles (`module_business_language`), replacing technical terms like "Node," "Cypher," or "embedding". |,, |
| **Hallucinating Data** (Trap 1) | LLM (Step 4: RECONCILE) | Instruction mandates explicit statement of **knowledge limitation** if data retrieval returns empty. |, |
| **Forbidden Visualization** | LLM (Step 4: RECONCILE) | The visualization type `network_graph` is **EXPLICITLY NOT SUPPORTED** and must be rendered as a table (Source, Relationship, Target columns). |,, |

### IV. Implementation Roadmap Index (Deliverables)

The implementation follows a four-phase approach.

| Phase | Title | Core Deliverables/Focus Area | Essential Code Index & Concepts |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Data & Schema Foundation** | Neo4j Digital Twin Schema, **Composite Key Constraints** (`id`, `year`), and **Vector Index** (`memory_semantic_index` on `:Memory` nodes). PostgreSQL `instruction_bundles` table setup. | `backend/db/neo4j_setup.cypher`, `instruction_bundles`, **Keyset Pagination** methodology. |
| **Phase 2** | **MCP Tool Layer Development** | Implementation of **4 Mandatory Tools**: `recall_memory` (Step 0 retrieval), `retrieve_instructions` (Step 2 dynamic loading), `read_neo4j_cypher` (Step 3 execution), and optional utility tools (e.g., `read_file`). | `backend/app/services/mcp_client.py`, `read_neo4j_cypher` **Constraint Enforcement**. |
| **Phase 3** | **Orchestrator Rewrite (Agentic Loop)** | Implementing the full **Fixed Cognitive Control Loop** (Step 0-5). Coding the **Quick Exit Path** trigger for Modes D/F. Integration with Groq (`gpt-oss-120b`) and managing tool usage within one session. | `backend/app/services/chat_service.py`, **BACKTRACKING** logic (Trap 4 recovery). |
| **Phase 4** | **Productionization & Observability** | Implementing **Role-Based Routing** at the API Gateway. Setting up **Structured Logging** (JSON format) to track `tokens_input` and `bundles_loaded` for cost validation. Configuring CI/CD for **Blue-Green Deployment** and **Semantic Versioning** for bundles. | `api_gateway` configuration, Structured Log fields, Unit Test constraints. |