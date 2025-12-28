# 📜 JOSOOR Unified Agentic Contract (v1.1)

## 1. Overview
This contract governs all communication between the **Frontend Agent (UI/React)** and the **Backend Agent (Orchestrator/FastAPI)**. It ensures full architectural separation by defining a strict, versioned schema that is **Entity-Agnostic** and **Mode-Aware**.

---

## 2. The Transport Envelope
All API responses MUST wrap their payload in a standard envelope to ensure consistent parsing on the frontend.

```typescript
interface UnifiedResponse<T> {
  success: boolean;        // High-level execution status
  data: T;                // The actual payload (ChatResponse, DataResponse, etc.)
  meta: {
    latency_ms: number;   // Server-side execution time
    session_id: string;   // Traceable session ID
    version: string;      // Contract/API version (e.g., "1.1.0")
  };
  error?: {               // Only present if success is false
    code: string;         // Machine-readable code (e.g., "UNAUTHORIZED", "LLM_PARSE_FAIL")
    message: string;      // User-friendly message
    trace?: string;       // Debug trace (development only)
  };
}
```

---

## 3. Cognitive Response Schema (The Chat Contract)
The `data` block for chat/analytical queries must adhere to this structure. Notice the separation between **Narrative** (answer) and **Structured Proof** (data/artifacts).

```typescript
interface ChatResponse {
  // 1. Narrative Layer
  answer: string;             // Final synthesized answer in Business Language
  insights: string[];         // Bullet points/highlights extracted from data
  
  // 2. Cognitive Layer
  mode: 'DATA_MODE' | 'CONVERSATION_MODE';
  memory_process: {
    intent: string;           // LLM's interpretation of query
    thought_trace: string;    // Step-by-step reasoning (displayed in Sidebar)
  };
  confidence: number;         // 0.0 to 1.0 (Reasoning confidence)

  // 3. Evidence & Grounding Layer
  evidence: Array<{
    claim: string;            // The assertion made in the 'answer'
    source: string;           // Pointer to raw data node/row
    confidence: number;
  }>;
  cypher_executed?: string;    // The actual query sent to the graph (for audit)

  // 4. Artifact Layer (The Canvas)
  artifacts: Artifact[];       // Multi-modal outputs (Charts, Tables, HTML)
  
  // 5. Raw Data Layer (The Foundation)
  data: {
    query_results: any[];     // Row data (agnostic to entity type)
    summary_stats: object;    // Aggregated metrics (e.g., total_budget)
    diagnostics?: object;     // Recovery/Validation info (e.g., Empty Result Guard)
  };
}

## 4. The Graph Contract (V3.4 End State)
The backend MUST only return nodes and relationships that exist in the v3.4 schema.

### A. Core Node Types (17)
`SectorObjective`, `SectorPolicyTool`, `SectorPerformance`, `SectorGovEntity`, `SectorBusiness`, `SectorCitizen`, `SectorAdminRecord`, `SectorDataTransaction`, `EntityCapability`, `EntityRisk`, `EntityProject`, `EntityITSystem`, `EntityOrgUnit`, `EntityProcess`, `EntityVendor`, `EntityCultureHealth`, `EntityChangeAdoption`.

### B. Mandated Direct Relationships (37)
These relationships define the valid traversal paths for all business chains.

#### Sector Operations (12)
1.  **SectorObjective** --`REALIZED_VIA`--> **SectorPolicyTool**
2.  **SectorPolicyTool** --`GOVERNED_BY`--> **SectorObjective**
3.  **SectorObjective** --`CASCADED_VIA`--> **SectorPerformance**
4.  **SectorPolicyTool** --`REFERS_TO`--> **SectorAdminRecord**
5.  **SectorAdminRecord** --`APPLIED_ON`--> **SectorBusiness**
6.  **SectorAdminRecord** --`APPLIED_ON`--> **SectorGovEntity**
7.  **SectorAdminRecord** --`APPLIED_ON`--> **SectorCitizen**
8.  **SectorBusiness** --`TRIGGERS_EVENT`--> **SectorDataTransaction**
9.  **SectorGovEntity** --`TRIGGERS_EVENT`--> **SectorDataTransaction**
10. **SectorCitizen** --`TRIGGERS_EVENT`--> **SectorDataTransaction**
11. **SectorDataTransaction** --`MEASURED_BY`--> **SectorPerformance**
12. **SectorPerformance** --`AGGREGATES_TO`--> **SectorObjective**

#### Strategic Integrated Risk Management (3)
13. **EntityRisk** --`INFORMS`--> **SectorPerformance**
14. **EntityRisk** --`INFORMS`--> **SectorPolicyTool**
15. **EntityCapability** --`MONITORED_BY`--> **EntityRisk**

#### Sector and Entity Relations (4)
16. **SectorPolicyTool** --`SETS_PRIORITIES`--> **EntityCapability**
17. **SectorPerformance** --`SETS_TARGETS`--> **EntityCapability**
18. **EntityCapability** --`EXECUTES`--> **SectorPolicyTool**
19. **EntityCapability** --`REPORTS`--> **SectorPerformance**

#### Entity Internal Operations (10)
20. **EntityCapability** --`ROLE_GAPS`--> **EntityOrgUnit**
21. **EntityCapability** --`KNOWLEDGE_GAPS`--> **EntityProcess**
22. **EntityCapability** --`AUTOMATION_GAPS`--> **EntityITSystem**
23. **EntityOrgUnit** --`OPERATES`--> **EntityCapability**
24. **EntityProcess** --`OPERATES`--> **EntityCapability**
25. **EntityITSystem** --`OPERATES`--> **EntityCapability**
26. **EntityCultureHealth** --`MONITORS_FOR`--> **EntityOrgUnit**
27. **EntityOrgUnit** --`APPLY`--> **EntityProcess**
28. **EntityProcess** --`AUTOMATION`--> **EntityITSystem**
29. **EntityITSystem** --`DEPENDS_ON`--> **EntityVendor**

#### Transforming Entity Capabilities (6)
30. **EntityOrgUnit** --`GAPS_SCOPE`--> **EntityProject**
31. **EntityProcess** --`GAPS_SCOPE`--> **EntityProject**
32. **EntityITSystem** --`GAPS_SCOPE`--> **EntityProject**
33. **EntityProject** --`CLOSE_GAPS`--> **EntityOrgUnit**
34. **EntityProject** --`CLOSE_GAPS`--> **EntityProcess**
35. **EntityProject** --`CLOSE_GAPS`--> **EntityITSystem**

#### Project to Operation Transfer (2)
36. **EntityProject** --`ADOPTION_RISKS`--> **EntityChangeAdoption**
37. **EntityChangeAdoption** --`INCREASE_ADOPTION`--> **EntityProject**

#### Global/Implicit (2)
- **SectorObjective** <--`CONTRIBUTES_TO`--- **EntityProject**
- **Any Node** ---`PARENT_OF`--- **Any Node** (Hierarchical)

### C. Standardized Business Chains (7)
1. **SectorOps**: SectorObjective → SectorPolicyTool → SectorAdminRecord → Stakeholders → SectorDataTransaction → SectorPerformance → SectorObjective.
2. **Strategy_to_Tactics_Priority_Capabilities**: SectorObjective → SectorPolicyTool → EntityCapability → Gaps (OrgUnit/Process/ITSystem) → EntityProject → EntityChangeAdoption.
3. **Strategy_to_Tactics_Capabilities_Targets**: SectorObjective → SectorPerformance → EntityCapability → Gaps → EntityProject → EntityChangeAdoption.
4. **Tactical_to_Strategy**: EntityChangeAdoption → EntityProject → Ops Layers → EntityCapability → (SectorPerformance OR SectorPolicyTool) → SectorObjective.
5. **Risk_Build_Mode**: EntityCapability → EntityRisk → SectorPolicyTool.
6. **Risk_Operate_Mode**: EntityCapability → EntityRisk → SectorPerformance.
7. **Internal_Efficiency**: EntityCultureHealth → EntityOrgUnit → EntityProcess → EntityITSystem → EntityVendor.
```

---

### 4. The Artifact Contract (Universal Canvas)
Artifacts are the primary way the backend "renders" complex data to the frontend side-panel.

#### A. Adaptation Strategy
Artifacts produced by the LLM or Backend are normalized on the frontend.
- **Rules**: NO logic in categories. Must provide raw `series` and `xAxis` for charts.
- **Adaptation**: The Frontend `chatService.ts` implements `adaptArtifacts()`, which maps these structures to Recharts/Table components.

#### Exhaustive Artifact Registry (Tier 3 Standards)

Each artifact in the `artifacts[]` array must follow these strict structural rules:

| Type | Structure & Configuration | Use Case Example |
| :--- | :--- | :--- |
| **`column`** | `{"xAxis": "field", "yAxis": "value"}` | Budget by Department |
| **`line`** | `{"xAxis": "time", "yAxis": "value"}` | Performance Trends |
| **`pie`** | `{"valueField": "value", "labelField": "label"}` | Portfolio Status Breakdown |
| **`radar`** | `{"dimensions": ["D1", "D2", "D3"]}` | Maturity Assessment (360) |
| **`scatter`** | `{"xAxis": "vx", "yAxis": "vy"}` | Correlation (e.g., Risk vs Delay) |
| **`bubble`** | `{"xAxis": "x", "yAxis": "y", "sizeMetric": "z"}` | Portfolio Risk/Value/Budget (3-Axis) |
| **`combo`** | `{"xAxis": "p", "barField": "b", "lineField": "l"}` | Volume vs Percentage |
| **`table`** | `{"columns": ["A", "B", "C"]}` | Detailed Lists, Gap Diagnosis |
| **`html`** | `{"config": {}}`. Data: `"<div...>...</div>"` | Executive Reports, Recovery Roadmaps |
| **`twin_knowledge`** | `{"chapterId": "1", "episodeId": "1.1"}` | Multi-media Knowledge Base access |
| **`excel`** | `{"sheetName": "S1", "data": [[...]]}` | Complex financial/grid data |
| **`markdown`** | `{"config": {}}`. Data: `"# Title\n..."` | Formatted documentation |
| **`code`** | `{"language": "python"}`. Data: `"def..."` | Code snippets or formulas |
| **`media`** | `{"type": "video|audio", "url": "..."}` | Direct media playback |
| **`file`** | `{"filename": "doc.pdf", "url": "..."}` | Resource links and downloads |
| **`json`** | Data: `{...}` | Raw data inspection |

### 5. Formal JSON Schema (Structured Output)
For LLMs supporting `response_format: { type: "json_schema" }`, the orchestrator enforces this strict schema. This dramatically reduces tokens and prevents structural hallucinations.

```json
{
  "type": "object",
  "properties": {
    "mode": { "type": "string", "enum": ["DATA_MODE", "CONVERSATION_MODE"] },
    "answer": { "type": "string" },
    "insights": { "type": "array", "items": { "type": "string" } },
    "reasoning_steps": { "type": "array", "items": { "type": "string" } },
    "tool_calls": { "type": "array", "items": { "type": "object" } },
    "memory_process": {
      "type": "object",
      "properties": {
        "intent": { "type": "string" },
        "thought_trace": { "type": "string" }
      },
      "required": ["intent", "thought_trace"]
    },
    "analysis": { "type": "array", "items": { "type": "string" } },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "claim": { "type": "string" },
          "source": { "type": "string" },
          "confidence": { "type": "number" }
        },
        "required": ["claim", "source", "confidence"]
      }
    },
    "artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": [
            "column", "line", "pie", "radar", "scatter", "bubble", "combo", "table", "html",
            "twin_knowledge", "excel", "markdown", "code", "media", "file", "json"
          ] },
          "title": { "type": "string" },
          "config": { "type": "object" },
          "data": { "type": ["string", "object", "array"] }
        },
        "required": ["type", "title"]
      }
    },
    "data": {
      "type": "object",
      "properties": {
        "query_results": { "type": "array" },
        "summary_stats": { "type": "object" },
        "diagnostics": { "type": "object" }
      },
      "required": ["query_results"]
    },
    "confidence": { "type": "number" },
    "cypher_executed": { "type": "string" }
  },
  "required": ["mode", "answer", "artifacts", "memory_process", "data"]
}
```



---

## 6. Non-Negotiable Enforcement Rules

1.  **Entity Agnosticism**: The Backend MUST NOT hard-code entity names into generic response fields. All entity-specific data must live in `query_results` or `artifacts.content`. Data-probes should dynamically use the PascalCase labels defined in the **Data Architecture** (e.g., `SectorObjective`, `EntityProject`, `SectorPolicyTool`).
2.  **Global Temporal Vantage Point**: The Backend MUST inject the current system date into the prompt via the `<datetoday>` placeholder. This provides the "Vantage Point" necessary for the LLM to distinguish between past historical data and future "planning/hypothetical" scenarios (e.g., 2026+).
3.  **Mode-Gated Probes**: The Backend MUST NOT perform graph diagnostics (Neo4j checks) if the mode is `CONVERSATION_MODE`.
4.  **Voice Purity**: The Backend MUST NOT prepend system status messages (e.g., "I verified the data...") to the `answer` field. System status belongs in `meta` or `data.diagnostics`.
5.  **Routing Split**: All Frontend-to-System communication MUST follow the Vite proxy split:
    - `/api/v1/*` → Backend (8008)
    - `/api/neo4j/*`, `/api/dashboard/*`, `/api/control-tower/*` → Graph Server (3001)

---

## 6. Versioning
This contract is versioned at the Header. Any breaking change to the `Artifact` or `ChatMessageResponse` interfaces REQUIRES a version bump and coordination.
