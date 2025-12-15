# Noor Cognitive Digital Twin v3.0 - Implementation Bible

> **Purpose**: This document is the authoritative reference for implementing the Noor v3 system.
> **Last Updated**: 2025-12-05
> **Status**: ⚠️ PARTIAL IMPLEMENTATION - Critical Gaps Remain

---

## Table of Contents

1. [Core Architecture Principles](#1-core-architecture-principles)
2. [Memory System Architecture](#2-memory-system-architecture)
3. [MCP Tool Chain](#3-mcp-tool-chain)
4. [Prompt Structure](#4-prompt-structure)
5. [Atomic Instruction Bundles](#5-atomic-instruction-bundles)
6. [Data Flow](#6-data-flow)
7. [Frontend Contract](#7-frontend-contract)
8. [Implementation Checklist](#8-implementation-checklist)
9. [Deployment Guide](#9-deployment-guide)

---

## 1. Core Architecture Principles

### 1.1 Single-Call MCP Architecture

| Component | Role | Status |
|-----------|------|--------|
| **Orchestrator** (`orchestrator_zero_shot.py`) | "Dumb pipe" - builds prompt, calls API, normalizes response | ✅ Verified |
| **Groq LLM** (`openai/gpt-oss-120b`) | The brain - executes ALL 5 cognitive steps internally | ✅ Active |
| **MCP Router** (`mcp-router/`) | Gateway that Groq calls server-side | ✅ Active |
| **MCP Service** (`mcp_service.py`) | Actual tool implementations (3 tools only) | ✅ Updated |

### 1.2 Critical Rules

| Rule | Description | Status |
|------|-------------|--------|
| **Orchestrator = Dumb Pipe** | NO cognitive logic in Python. LLM does ALL thinking via the prompt. | ✅ Verified |
| **Noor NEVER Writes Memory** | ~~`save_memory`~~ REMOVED. Conversations become memories via nightly batch job. | ✅ Implemented |
| **Single LLM Call** | All 5 steps (Requirements→Recollect→Recall→Reconcile→Return) happen in ONE call. | ✅ Active |
| **Server-Side MCP** | `require_approval: "never"` - Groq executes tools automatically. | ✅ Configured |
| **Bundles Must Be Atomic** | Each bundle = one concept (one node type, one relationship, one cypher pattern). | ✅ 32 Bundles Created |

### 1.3 The 5-Step Cognitive Control Loop

All steps happen INSIDE the LLM via the prompt:

```
Step 0: REMEMBER    - recall_memory() for context retrieval (path-dependent)
Step 1: REQUIREMENTS - Classify intent into Mode A-H, resolve ambiguity
Step 2: RECOLLECT   - retrieve_instructions(mode) for atomic bundles
Step 3: RECALL      - read_neo4j_cypher() for graph data
Step 4: RECONCILE   - Synthesize, validate, gap analysis
Step 5: RETURN      - Format response in business language
```

---

## 2. Memory System Architecture

### 2.1 Memory Scopes

| Scope | Content | Noor Access |
|-------|---------|-------------|
| **Personal** | Conversation nodes per user, retrieved when Noor talks to them | READ-ONLY |
| **Departmental** | Lessons learnt, procedures | READ-ONLY |
| **Global/Agency** | Annual cycle (budgeting→executing→revision→planning), events, news | READ-ONLY |
| **C-Suite** | Executive memory | FORBIDDEN |

### 2.2 Memory Creation Flow

```
User Conversation
       ↓
   Stored as Delta (PostgreSQL or temp storage)
       ↓
   Nightly Batch Job
       ↓
   Embedding Generation (OpenAI text-embedding-3-small, 1536 dims)
       ↓
   Neo4j Memory Nodes (indexed by memory_semantic_index)
```

**CRITICAL**: Noor does NOT write to memory. The batch job handles all memory persistence.

### 2.3 Memory Retrieval Logic

```python
# Fallback chain
scopes_to_try = [requested_scope]
if requested_scope == 'departmental':
    scopes_to_try.append('global')  # Fallback: departmental -> global

# Vector search via Neo4j index
CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding)
YIELD node AS m, score
WHERE m.scope = $scope
RETURN m.content, m.key, m.confidence, score
```

---

## 3. MCP Tool Chain

### 3.1 MCP Router Configuration

**Location**: `/home/mosab/projects/chatmodule/mcp-router/`

```yaml
# router_config.yaml
backends:
  - name: neo4j-cypher
    type: http_mcp
    url: http://127.0.0.1:8080/mcp/
    auth_header_key: NEO4J_MCP_TOKEN

tools:
  - name: read_neo4j_cypher
    backend: neo4j-cypher
    type: mcp-forward
    policy:
      read_only: true
      max_rows: 100

  - name: get_neo4j_schema
    backend: neo4j-cypher
    type: mcp-forward
    policy:
      read_only: true
```

### 3.2 MCP Tools (Noor's Capabilities)

| Tool | Purpose | Noor Access | Step |
|------|---------|-------------|------|
| `recall_memory` | Semantic vector search for hierarchical memory | ✅ Read: personal, departmental, global | Step 0 |
| `retrieve_instructions` | Load atomic bundles from PostgreSQL | ✅ Full access | Step 2 |
| `read_neo4j_cypher` | Execute Cypher with constraints | ✅ Read-only | Step 3 |
| ~~`save_memory`~~ | ❌ **REMOVE** - Noor never writes | ❌ REMOVE | N/A |

### 3.3 Tool Constraints

#### read_neo4j_cypher Constraints:
1. **NO SKIP/OFFSET** - Must use Keyset Pagination: `WHERE n.id > $last_seen_id ORDER BY n.id LIMIT 30`
2. **Level Integrity** - All nodes in path must have same level (L3↔L3). No L2↔L3 mixing except via PARENT_OF.
3. **No Embedding Retrieval** - Cannot return embedding properties.
4. **Aggregation First** - Use `count(n)` for totals, `collect(n)[0..30]` for samples.
5. **Temporal Filtering** - Every query MUST filter by `year` and `level`.

#### recall_memory Constraints:
1. Scope must be: personal, departmental, or global (NOT csuite)
2. Automatic fallback: departmental → global if empty

---

## 4. Prompt Structure

### 4.1 Three-Section Architecture

```xml
<MUST_READ_ALWAYS>
  <!-- ~1500 tokens - ALWAYS included, cached by Groq -->
  <system_mission>        <!-- Who is Noor, vantage point, bias for action -->
  <cognitive_control_loop> <!-- 5-step loop definition -->
  <output_format>         <!-- visualization_schema, interface_contract, response_template -->
</MUST_READ_ALWAYS>

<MUST_READ_IN_A_PATH>
  <!-- Loaded via retrieve_instructions based on mode -->
  <!-- Each section should be a SEPARATE atomic bundle -->
  <interaction_modes>
  <data_integrity_rules>
  <graph_schema>
  <direct_relationships>
  <business_chains>
  <vector_strategy>
  <cypher_examples>
  <tool_rules>
  <file_handling>
</MUST_READ_IN_A_PATH>

<!-- Dynamic Suffix - changes every request -->
<datetoday>2025-12-05</datetoday>
ATTACHED FILES (if any)
CONVERSATION HISTORY (last 10 messages)
USER QUERY
```

### 4.2 Interaction Modes

| Mode | Name | Description | Quick Exit | Bundles Needed |
|------|------|-------------|------------|----------------|
| A | Simple Query | Direct fact lookup | No | tool_rules_core, knowledge_context |
| B1 | Complex Analysis | Multi-hop reasoning | No | knowledge_context, tool_rules_core, memory_management |
| B2 | Gap Diagnosis | Identify missing relationships | No | strategy_gap_diagnosis, knowledge_context, memory_management |
| C | Exploratory | Hypothetical scenarios | No | minimal |
| D | Acquaintance | Questions about Noor | Yes | quick_exit |
| E | Learning | Concept explanations | No | knowledge_context |
| F | Social | Greetings, small talk | Yes | quick_exit |
| G | Continuation/Report | Structured multi-section output | No | report_gen, knowledge_context, memory_management |
| H | Clarification | Ambiguous query | Yes | clarification |

---

## 5. Atomic Instruction Bundles

### 5.1 Implementation Status: ✅ 45 BUNDLES CREATED

**SQL File**: `/backend/sql/v3_atomic_bundles.sql` contains 45 INSERT statements.
**Status**: Created but NOT populated into database yet.

### 5.2 Atomic Bundle Categories

⚠️ **ACTUAL COUNT: 45 bundles in SQL file** (not 32 or 37 as previously claimed)

Bundle breakdown needs verification - count actual categories in the SQL file.

### 5.3 Mode → Bundle Mapping

Updated in `mcp_service.py` `lookup_tags_by_mode()`:

```python
mode_mapping = {
    'A': ['cognitive_loop_core', 'node_ent_projects', 'node_sec_objectives', 
          'constraint_efficiency', 'constraint_keyset_pagination'],
    'B1': [
        'cognitive_loop_core', 
        'node_ent_projects', 'node_ent_capabilities', 'node_ent_risks', 'node_sec_objectives',
        'node_ent_org_units', 'node_ent_it_systems', 'node_ent_processes',
        'rel_monitored_by', 'rel_operates', 'rel_close_gaps', 'rel_parent_of', 'rel_requires', 'rel_utilizes',
        'chain_sector_ops', 'chain_strategy_to_tactics_priority', 'chain_tactical_to_strategy',
        'cypher_optimized_retrieval', 'cypher_impact_analysis', 'cypher_keyset_pagination',
        'constraint_efficiency', 'constraint_keyset_pagination', 'constraint_level_integrity'
    ],
    'B2': [
        'cognitive_loop_core', 'mode_gap_diagnosis',
        'node_ent_projects', 'node_ent_capabilities', 'node_sec_objectives', 'node_sec_performance',
        'chain_strategy_to_tactics_priority', 'chain_strategy_to_tactics_targets',
        'cypher_impact_analysis', 'cypher_portfolio_health',
        'constraint_efficiency', 'constraint_level_integrity'
    ],
    'C': ['cognitive_loop_core'],
    'D': ['mode_quick_exit'],
    'E': ['cognitive_loop_core', 'mode_report_structure', 'node_ent_projects', 'node_sec_objectives'],
    'F': ['mode_quick_exit'],
    'G': [
        'cognitive_loop_core',
        'node_ent_projects', 'node_ent_capabilities', 'node_ent_risks', 'node_sec_objectives',
        'rel_monitored_by', 'rel_operates', 'rel_close_gaps',
        'chain_sector_ops', 'chain_tactical_to_strategy',
        'cypher_optimized_retrieval', 'cypher_keyset_pagination',
        'constraint_efficiency', 'constraint_keyset_pagination'
    ],
    'H': ['mode_clarification'],
}
```
        
        # Add relevant chains
        bundles.extend(get_chains_for_entities(detected_entities))
        
        # Add tool constraints
        bundles.append('constraint_keyset_pagination')
        bundles.append('constraint_level_integrity')
---

## 6. Data Flow

### 6.1 Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER QUERY                               │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (orchestrator_zero_shot.py)            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Build static prefix (cached)                             ││
│  │ 2. Build dynamic suffix (date, history, query)              ││
│  │ 3. Call Groq v1/responses with MCP tools                    ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GROQ LLM (gpt-oss-120b)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 1: REQUIREMENTS - Classify mode, resolve ambiguity     ││
│  │ Step 2: RECOLLECT - retrieve_instructions(mode) → bundles   ││
│  │ Step 3: RECALL - read_neo4j_cypher(), recall_memory()       ││
│  │ Step 4: RECONCILE - Synthesize, gap analysis                ││
│  │ Step 5: RETURN - Format response                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                     │
│         MCP Calls (server-side, require_approval: never)         │
│              ↓                    ↓                              │
│    ┌─────────────────┐  ┌─────────────────┐                     │
│    │  MCP Router     │  │  MCP Router     │                     │
│    │ recall_memory   │  │ read_neo4j_cypher│                    │
│    └────────┬────────┘  └────────┬────────┘                     │
│             ↓                    ↓                              │
│    ┌─────────────────┐  ┌─────────────────┐                     │
│    │ mcp_service.py  │  │ Neo4j MCP Server │                    │
│    │ → Neo4j Vector  │  │ → Cypher Exec    │                    │
│    └─────────────────┘  └─────────────────┘                     │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Response Processing)                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 4. _normalize_response() - Parse JSON, extract fields       ││
│  │ 5. Return to frontend                                       ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  - Render answer (Markdown)                                      │
│  - Render visualizations (Recharts)                              │
│  - Render artifacts (HTML, tables)                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Memory Batch Job Flow (Nightly)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSATION STORAGE                          │
│  PostgreSQL: conversation_messages table with user_id, content   │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NIGHTLY BATCH JOB                             │
│  1. Select conversations from last 24h                           │
│  2. Extract key insights/summaries per user                      │
│  3. Generate embeddings (OpenAI text-embedding-3-small)          │
│  4. Determine scope (personal for user-specific)                 │
│  5. MERGE into Neo4j Memory nodes                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEO4J MEMORY NODES                            │
│  (:Memory {                                                      │
│     key: "user_123_pref_format",                                 │
│     scope: "personal",                                           │
│     content: "User prefers tabular format...",                   │
│     embedding: [0.1, 0.2, ...],  // 1536 dims                    │
│     confidence: 0.85,                                            │
│     created_at: datetime()                                       │
│  })                                                              │
│                                                                  │
│  Index: memory_semantic_index (vector, 1536 dims, cosine)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Frontend Contract

### 7.1 Response Schema

```typescript
interface LLMResponse {
  answer: string;              // Markdown-formatted business language
  memory_process: {
    intent: string;
    thought_trace: string;
  };
  analysis: string[];
  data: {
    query_results: Array<{id: string, name: string, type?: string}>;
    summary_stats: {total_items: number};
  };
  visualizations: Visualization[];
  cypher_executed: string | null;
  confidence: number;          // 0.0 - 1.0
}
```

### 7.2 Visualization Types

| Type | Renderer | Config |
|------|----------|--------|
| `column` | Recharts BarChart | xAxis, yAxis, bars[] |
| `line` | Recharts LineChart | xAxis, yAxis, lines[] |
| `radar` | Recharts RadarChart | metrics[], dataKey |
| `bubble` | Recharts ScatterChart | xAxis, yAxis, sizeMetric |
| `bullet` | Custom BulletChart | target, actual, ranges |
| `combo` | Recharts ComposedChart | mixed bars/lines |
| `table` | React Table | columns[], data[] |
| `html` | Raw HTML | content (full HTML string) |

### 7.3 Artifact Rendering Rules

1. **NO network graphs** - Render as table with columns: Source, Relationship, Target
2. **HTML must be fully rendered** - No templating, all data injected
3. **Markdown in answer** - Frontend renders Markdown
4. **No technical terms** - No "Cypher", "L3", "Node", "embedding" in answer

---

## CRITICAL GAPS IDENTIFIED

### Gap 1: Orchestrator Architecture Mismatch
**Bible Says**: "Orchestrator = Dumb Pipe" that dynamically loads bundles via retrieve_instructions  
**Reality**: Orchestrator has 600+ line static prompt with ALL content hardcoded  
**Fix Needed**: Refactor `_build_static_prefix()` to only include MUST_READ_ALWAYS (~120 lines), remove MUST_READ_IN_A_PATH

### Gap 2: retrieve_instructions Not Used
**Bible Says**: LLM calls retrieve_instructions(mode) in Step 2: RECOLLECT  
**Reality**: retrieve_instructions function exists but orchestrator never enables it for LLM use  
**Fix Needed**: Strip prompt, expose retrieve_instructions as MCP tool, test bundle loading

### Gap 3: Database Not Populated
**Bible Says**: "45 bundles created"  
**Reality**: SQL file exists, never executed against database  
**Fix Needed**: Run v3_atomic_bundles.sql via Supabase Dashboard or psql

### Gap 4: Missing Bundles from END_STATE
**Bible Says**: References module_memory_management_noor, strategy_gap_diagnosis, module_business_language  
**Reality**: These specific bundles may not exist in current SQL  
**Fix Needed**: Review END_STATE Section 3.2 and add missing module bundles

---

## 8. Implementation Checklist (REVISED)

### 8.1 Immediate Actions

- [x] **Remove `save_memory` from MCP Service** - ✅ Removed (only comments remain)
- [x] **Remove `save_memory` from MCP_TOOL_DEFINITIONS** - ✅ Not in tool list
- [ ] **Update tool_rules in prompt** - ⚠️ MASSIVE prompt still has all rules hardcoded
- [x] **Create nightly batch job** - ✅ Scripts exist in `/backend/scripts/`

### 8.2 Bundle Atomization ⚠️ PARTIALLY COMPLETE

- [x] Created 45 bundles in SQL file
- [ ] **CRITICAL: Orchestrator still has 327+ line MUST_READ_IN_A_PATH section hardcoded**
- [ ] Orchestrator NOT calling retrieve_instructions - it's a static monolith
- [x] `retrieve_instructions` function exists in mcp_service.py
- [ ] instruction_metadata table population status unknown

### 8.3 Orchestrator Cleanup ✅ COMPLETE

### 8.3 Orchestrator Cleanup ❌ FALSE CLAIM

**REALITY CHECK**:
- ❌ Orchestrator is NOT a "dumb pipe" - it has a 1031-line static prompt
- ✅ No cognitive logic in Python (correct)
- ❌ Orchestrator does NOT dynamically load bundles via retrieve_instructions
### 8.4 Memory System ⏳ UNTESTED

- [ ] Verify `recall_memory` works (function exists, never tested)
- [x] Implement nightly batch job (scripts exist, never run)
- [ ] Test memory retrieval with embeddings (no data)
- [ ] Test fallback logic (no data)
- [x] Implement nightly batch job (scripts/nightly_memory_etl.py)
- [ ] Test memory retrieval with embeddings (needs data)
- [ ] Test fallback logic (departmental → global)

### 8.5 Testing ⏳ PENDING

- [ ] Test Mode A (Simple Query) end-to-end
- [ ] Test Mode B2 (Gap Diagnosis) with missing relationships
- [ ] Test Mode D/F (Quick Exit) for <500ms latency
- [ ] Test Mode H (Clarification) for ambiguous queries
- [ ] Test visualization rendering for all types

---

## 9. Deployment Guide

### 9.1 Database Population

Run the atomic bundles SQL to populate the instruction tables:

```bash
# Connect to PostgreSQL and execute
psql -h $SUPABASE_HOST -U postgres -d postgres -f /home/mosab/projects/chatmodule/backend/sql/v3_atomic_bundles.sql
```

### 9.2 Enable Nightly Memory ETL

```bash
# Install the systemd service and timer
sudo cp /home/mosab/projects/chatmodule/backend/scripts/nightly-memory-etl.service /etc/systemd/system/
sudo cp /home/mosab/projects/chatmodule/backend/scripts/nightly-memory-etl.timer /etc/systemd/system/

# Create log directory
sudo mkdir -p /var/log/noor
sudo chown mosab:mosab /var/log/noor

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable nightly-memory-etl.timer
sudo systemctl start nightly-memory-etl.timer

# Verify
systemctl list-timers | grep memory
```

### 9.3 Manual ETL Trigger (Testing)

```bash
cd /home/mosab/projects/chatmodule/backend
source .venv/bin/activate
python scripts/nightly_memory_etl.py
```

---

## Appendix A: File Locations

| Component | Path | Status |
|-----------|------|--------|
| Orchestrator | `/home/mosab/projects/chatmodule/backend/app/services/orchestrator_zero_shot.py` | ✅ Verified |
| MCP Service | `/home/mosab/projects/chatmodule/backend/app/services/mcp_service.py` | ✅ Updated |
| Atomic Bundles SQL | `/home/mosab/projects/chatmodule/backend/sql/v3_atomic_bundles.sql` | ✅ NEW |
| Legacy Bundles SQL | `/home/mosab/projects/chatmodule/backend/sql/v3_instruction_bundles_data.sql` | ⚠️ DEPRECATED |
| Nightly ETL Script | `/home/mosab/projects/chatmodule/backend/scripts/nightly_memory_etl.py` | ✅ NEW |
| ETL Service | `/home/mosab/projects/chatmodule/backend/scripts/nightly-memory-etl.service` | ✅ NEW |
| ETL Timer | `/home/mosab/projects/chatmodule/backend/scripts/nightly-memory-etl.timer` | ✅ NEW |
| MCP Router | `/home/mosab/projects/chatmodule/mcp-router/` | ✅ Active |
| Router Config | `/home/mosab/projects/chatmodule/backend/mcp-server/servers/mcp-router/router_config.yaml` | ✅ Active |
| Frontend Chat | `/home/mosab/projects/chatmodule/frontend/src/services/chatService.ts` | ✅ Active |
| Artifact Renderer | `/home/mosab/projects/chatmodule/frontend/src/components/ArtifactRenderer.tsx` | ✅ Active |

## Appendix B: Environment Variables

```bash
GROQ_API_KEY=xxx
MCP_ROUTER_URL=http://127.0.0.1:8201/mcp/
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
NEO4J_DATABASE=neo4j
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Appendix C: Neo4j Indexes

```cypher
-- Memory semantic search index
CREATE VECTOR INDEX memory_semantic_index IF NOT EXISTS
FOR (m:Memory)
ON m.embedding
OPTIONS {indexConfig: {
  `vector.dimensions`: 1536,
  `vector.similarity_function`: 'cosine'
}}

-- Node indexes for performance
CREATE INDEX entity_project_year_level IF NOT EXISTS
FOR (p:EntityProject)
ON (p.year, p.level)
```

---

*This document is the single source of truth for implementing Noor v3. All implementation decisions should reference this guide.*
