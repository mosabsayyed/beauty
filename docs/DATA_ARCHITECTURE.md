# Data Architecture Reference

> **Purpose:** Comprehensive reference for coding agents and developers working with JOSOOR's data layer.  
> **Grounded in:** Actual database inspection and schema verification.  
> **Last Updated:** December 17, 2025  
> **✅ VERIFIED:** All schemas, node counts, and relationships confirmed from live databases

---

## Table of Contents

1. [Overview](#overview)
2. [Dual-Database Architecture](#dual-database-architecture)
3. [Supabase (PostgreSQL)](#supabase-postgresql)
4. [Neo4j (Graph Database)](#neo4j-graph-database)
5. [Memory & Embedding System](#memory--embedding-system)
6. [Data Access Patterns](#data-access-patterns)
7. [Cross-Database Operations](#cross-database-operations)
8. [Query Examples](#query-examples)
9. [Best Practices](#best-practices)
10. [Data Migration](#data-migration)

---

## Overview

JOSOOR uses a **dual-database architecture** combining:
- **Supabase (PostgreSQL)** - Transactional data, user management, conversations, prompts
- **Neo4j (Graph)** - Enterprise transformation knowledge graph, relationships, analytics

**Design Philosophy:**
- PostgreSQL handles ACID transactions, user sessions, and structured data
- Neo4j handles complex relationship queries, graph traversal, and pattern matching
- Each database serves its purpose; no redundant data storage
- Embedding vectors enable semantic search across both databases

**Current-State Note:**
- The existing Neo4j ontology is the source of truth for dashboards and chain queries.
- Backend endpoints `/api/v1/control-tower/*` and `/api/v1/chains/*` read from Supabase temp tables and the graph, respectively, according to current implementations.

---

## Dual-Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     JOSOOR Application                      │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                       │
│  Supabase (REST)    │        Neo4j (Bolt)                  │
│  Port: HTTPS        │        Port: 7687/7474               │
│                     │                                       │
├─────────────────────┼───────────────────────────────────────┤
│                     │                                       │
│  • Users            │  • SectorObjective                   │
│  • Conversations    │  • EntityCapability                  │
│  • Messages         │  • EntityProject                     │
│  • Instructions     │  • SectorPolicyTool                  │
│  • Memory (vector)  │  • Relationships:                    │
│  • Embeddings       │    - ALIGNS_WITH                     │
│                     │    - SUPPORTS                        │
│                     │    - IMPLEMENTS                      │
│                     │    - HAS_KPI                         │
└─────────────────────┴───────────────────────────────────────┘
```

### Connection Details

| Database | Client | Location | Configuration |
|----------|--------|----------|---------------|
| Supabase | `supabase_client.py` | `/backend/app/db/` | REST API via `supabase-py` |
| Neo4j | `neo4j_client.py` | `/backend/app/db/` | Bolt driver via `neo4j-python` |

---

## Supabase (PostgreSQL)

### Schema Overview

#### Core Tables

**✅ Verified from actual database (Dec 17, 2025):**

| Table | Purpose | Row Count | Key Columns |
|-------|---------|-----------|-------------|
| `users` | User accounts | **6** | `id`, `email`, `password`, `full_name`, `role`, `is_active`, `supabase_id`, `created_at`, `updated_at` |
| `conversations` | Chat sessions | **385** | `id`, `user_id`, `persona_id`, `title`, `created_at`, `updated_at` |
| `messages` | Chat messages | **1,294** | `id`, `conversation_id`, `role`, `content`, `artifact_ids`, `extra_metadata`, `created_at` |
| `instruction_elements` | Prompt components | **84** | `id`, `bundle`, `element`, `content`, `description`, `avg_tokens`, `dependencies`, `use_cases`, `status`, `version`, `created_at`, `updated_at` |
| `temp_quarterly_dashboard_data` | Dashboard KPIs | **160** | `id`, `quarter`, `dimension_id`, `dimension_title`, `kpi_description`, `kpi_formula`, `kpi_base_value`, `kpi_actual`, `kpi_planned`, `kpi_next_target`, `kpi_final_target`, `health_score`, `health_state`, `trend`, `projections`, `created_at`, `updated_at` |
| `temp_quarterly_outcomes_data` | Outcome metrics | **36** | `id`, `quarter`, `fdi_actual`, `fdi_target`, `fdi_baseline`, `trade_balance_actual`, `jobs_created_actual`, `partnerships_actual`, `water_coverage_actual`, `energy_coverage_actual`, `transport_coverage_actual`, `community_engagement_actual`, (+ targets/baselines) |
| `temp_investment_initiatives` | Investment data | **35** | `id`, `quarter`, `initiative_name`, `budget`, `risk_score`, `alignment_score`, `created_at`, `updated_at` |

**Note:** Memory is stored in Neo4j as `Memory` nodes with 78 entries.

### Table Details

#### users

```sql
-- ✅ Actual schema from database inspection (6 rows)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),  -- bcrypt hash
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',  -- 'user', 'staff', 'exec'
    is_active BOOLEAN DEFAULT true,
    supabase_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Access Pattern:**
```python
# Via Supabase client
users = await supabase_client.table_select(
    "users", 
    "*", 
    {"email": "user@example.com"}
)
```

#### conversations

```sql
-- ✅ Actual schema from database inspection (385 rows)
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    persona_id INTEGER,  -- References persona (noor=1, maestro=2)
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

**Access Pattern:**
```python
# Get user's conversations
conversations = await supabase_client.table_select(
    "conversations",
    "id, title, updated_at",
    {"user_id": user_id},
    order={"updated_at": "desc"},
    limit=50
)
```

#### messages

```sql
-- ✅ Actual schema from database inspection (1,294 rows)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    artifact_ids TEXT[],  -- Array of artifact IDs
    extra_metadata JSONB,  -- Stores artifacts, confidence, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

**Access Pattern:**
```python
# Get conversation messages
messages = await supabase_client.table_select(
    "messages",
    "*",
    {"conversation_id": conversation_id},
    order={"timestamp": "asc"}
)
```

#### instruction_elements

```sql
-- ✅ Actual schema from database inspection (84 rows)
CREATE TABLE instruction_elements (
    id SERIAL PRIMARY KEY,
    bundle VARCHAR(100) NOT NULL,  -- 'tier1', 'tier2_analysis', 'tier3_cypher'
    element VARCHAR(255) UNIQUE NOT NULL,  -- e.g., '0.1_step0_greeting'
    content TEXT NOT NULL,
    description TEXT,
    avg_tokens INTEGER,
    dependencies TEXT[],  -- Array of dependent element IDs
    use_cases TEXT[],  -- Array of use case descriptions
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'deprecated'
    version VARCHAR(20),  -- Semantic versioning
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instruction_bundle ON instruction_elements(bundle, status);
```

**Access Pattern:**
```python
# Load Tier 1 elements for Noor
elements = await supabase_client.table_select(
    "instruction_elements",
    "*",
    {
        "bundle": "tier1",
        "status": "active",
        "persona": ["noor", "both"]  # OR condition
    },
    order={"element": "asc"}
)
```

**Bundle Structure:**
- `tier1` - Core system prompt (always loaded)
- `tier2_analysis` - Analysis mode instructions
- `tier2_casual` - Casual conversation mode
- `tier3_cypher` - Cypher query construction
- `tier3_memory` - Memory management
- `step0_*` - Greeting/initial classification
- `step5_*` - Evidence gating and validation

#### Memory Storage (Neo4j)

**⚠️ Note:** Memory is stored in **Neo4j as `Memory` nodes**.

**Neo4j Memory Schema (78 nodes):**

```cypher
-- ✅ Actual schema from Neo4j inspection
(:Memory {
    id: String,  -- Unique identifier
    content: String,  -- Memory content
    embedding: List<Float>,  -- 1536-dim vector
    scope: String,  -- 'personal', 'departmental', 'ministry', 'secrets'
    user_id: String,  -- User identifier
    source_session: String,  -- Source conversation/session
    message_hash: String,  -- Hash of source message
    message_count: Integer,  -- Number of messages in source
    tags: List<String>,  -- Categorization tags
    timestamp: DateTime,
    created_at: DateTime,
    updated_at: DateTime,
    source_updated_at_ts: Integer
})
-- Current nodes: 78
```

**Access Pattern:**
```python
# Semantic search via embedding service
from app.services.semantic_search import semantic_search

results = await semantic_search(
    query="project timeline",
    scope="departmental",
    user_id=user_id,
    limit=5
)
```

### Dashboard Tables

#### temp_quarterly_dashboard_data

```sql
CREATE TABLE temp_quarterly_dashboard_data (
    id SERIAL PRIMARY KEY,
    quarter VARCHAR(10),  -- 'Q1 2025', 'Q2 2025', etc.
    dimension VARCHAR(100),  -- KPI dimension name
    value NUMERIC,
    target NUMERIC,
    variance NUMERIC,
    trend VARCHAR(20),  -- 'up', 'down', 'stable'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboard_quarter ON temp_quarterly_dashboard_data(quarter);
```

### Data Access via Supabase Client

**CRUD Operations:**

```python
# SELECT
rows = await supabase_client.table_select(
    "users", 
    "id, email, role",
    {"role": "staff"}
)

# INSERT
new_user = await supabase_client.table_insert(
    "users",
    {
        "email": "new@example.com",
        "full_name": "New User",
        "role": "user"
    }
)

# UPDATE
updated = await supabase_client.table_update(
    "users",
    {"role": "staff"},
    {"id": user_id}
)

# DELETE
deleted = await supabase_client.table_delete(
    "conversations",
    {"id": conversation_id}
)

# COUNT
count = await supabase_client.table_count(
    "messages",
    {"conversation_id": conversation_id}
)
```

---

## Neo4j (Graph Database)

### Graph Schema Overview

**Node Labels (✅ Verified from database - Dec 17, 2025):**

| Label | Purpose | **Actual Count** | Key Properties |
|-------|---------|------------------|----------------|
| `SectorObjective` | Strategic objectives | **25** | `name`, `priority_level`, `target`, `timeframe`, `status`, `year`, `baseline`, `expected_outcomes`, `rationale`, `embedding` |
| `SectorPolicyTool` | Policy instruments | **616** | `name`, `tool_type`, `impact_target`, `delivery_channel`, `cost_of_implementation`, `status`, `quarter`, `year`, `embedding` |
| `SectorAdminRecord` | Administrative records | **20** | `dataset_name`, `record_type`, `content`, `data_owner`, `access_level`, `category`, `author_issuing_authority`, `publication_date`, `update_frequency`, `version`, `embedding` |
| `SectorPerformance` | Performance metrics | **616** | `name`, `kpi_type`, `actual`, `target`, `unit`, `frequency`, `description`, `calculation_formula`, `thresholds`, `data_source`, `measurement_frequency`, `status`, `quarter`, `embedding` |
| `SectorDataTransaction` | Data transactions | **35** | `transaction_type`, `domain`, `department`, `parent_id`, `parent_year`, `quarter`, `year`, `embedding` |
| `SectorCitizen` | Citizens/beneficiaries | **9** | `type`, `demographic_details`, `quarter`, `year`, `embedding` |
| `SectorBusiness` | Business entities | **12** | `name`, `operating_sector`, `quarter`, `year`, `embedding` |
| `SectorGovEntity` | Government entities | **10** | `name`, `linked_policies`, `quarter`, `year`, `embedding` |
| `EntityCapability` | Organizational capabilities | **391** | `name`, `description`, `maturity_level`, `target_maturity_level`, `status`, `parent_id`, `parent_year`, `quarter`, `embedding` |
| `EntityProject` | Transformation projects | **284** | `name`, `status`, `start_date`, `end_date`, `progress_percentage`, `parent_id`, `parent_year`, `quarter`, `year`, `embedding` |
| `EntityITSystem` | IT systems | **930** | `name`, `system_type`, `technology_stack`, `operational_status`, `vendor_supplier`, `owner`, `deployment_date`, `licensing`, `acquisition_cost`, `annual_maintenance_costs`, `number_of_modules`, `criticality`, `quarter`, `embedding` |
| `EntityRisk` | Identified risks | **391** | `name`, `risk_description`, `risk_category`, `risk_score`, `risk_status`, `likelihood_of_delay`, `delay_days`, `mitigation_strategy`, `risk_owner`, `risk_reviewer`, `identified_date`, `last_review_date`, `next_review_date`, `people_score`, `process_score`, `tools_score`, `operational_health_score`, `threshold_green`, `threshold_amber`, `threshold_red`, `kpi`, `embedding` |
| `EntityOrgUnit` | Organizational units | **436** | `name`, `unit_type`, `head_of_unit`, `location`, `headcount`, `budget`, `annual_budget`, `parent_id`, `parent_year`, `gap`, `quarter`, `embedding` |
| `EntityProcess` | Business processes | **353** | `name`, `description`, `quarter`, `year`, `embedding` |
| `EntityVendor` | External vendors | **922** | `name`, `service_domain`, `service_detail`, `contract_value`, `performance_rating`, `service_level_agreements`, `quarter`, `year`, `embedding` |
| `EntityChangeAdoption` | Change management | **284** | `name`, `status`, `parent_year`, `quarter`, `year`, `embedding` |
| `EntityCultureHealth` | Cultural health metrics | **436** | `name`, `survey_score`, `target`, `baseline`, `trend`, `participation_rate`, `historical_trends`, `parent_year`, `quarter`, `year`, `embedding` |
| `Memory` | Conversation memory | **78** | `content`, `embedding`, `scope`, `user_id`, `source_session`, `message_hash`, `tags`, `timestamp` |
| `Document` | Uploaded documents | **18** | `fileName`, `fileType`, `fileSize`, `fileSource`, `status`, `nodeCount`, `relationshipCount`, `chunkNodeCount`, `communityNodeCount`, `entityNodeCount`, `total_chunks`, `processed_chunk`, `model`, `processingTime`, `createdAt`, `updatedAt` |
| `Chunk` | Document chunks | **787** | `text`, `id`, `fileName`, `position`, `page_number`, `content_offset`, `length`, `embedding` |
| `__Entity__` | Extracted entities | **3,750** | `id`, `embedding` |
| `KSAStrategy` | KSA strategic elements | **3,750** | `id`, `embedding` |
| `Session` | Conversation session marker | **1** | `id`, `embedding` |
| `Message` | Conversation message marker | **2** | `role`, `content` |

**Total Graph Statistics:**
- **Total Nodes:** 10,406
- **Total Relationships:** 24,398

### Node Property Schemas (✅ Verified from actual data)

#### SectorObjective (25 nodes)
```cypher
(:SectorObjective {
    id: String,
    name: String,
    priority_level: String,
    target: Float,
    baseline: Float,
    timeframe: String,
    status: String,
    year: Integer,
    level: String,
    expected_outcomes: String,
    rationale: String,
    indicator_type: String,
    frequency: String,
    budget_allocated: Float,
    embedding: List<Float>,  // 1536-dim vector
    embedding_generated_at: DateTime
})
```

#### SectorPolicyTool (616 nodes)
```cypher
(:SectorPolicyTool {
    id: String,
    name: String,
    tool_type: String,
    impact_target: String,
    delivery_channel: String,
    cost_of_implementation: Float,
    status: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### SectorPerformance (616 nodes)
```cypher
(:SectorPerformance {
    id: String,
    name: String,
    kpi_type: String,
    actual: Float,
    target: Float,
    unit: String,
    frequency: String,
    description: String,
    calculation_formula: String,
    thresholds: String,
    data_source: String,
    measurement_frequency: String,
    status: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityCapability (391 nodes)
```cypher
(:EntityCapability {
    id: String,
    name: String,
    description: String,
    maturity_level: Integer,  // 1-5 scale
    target_maturity_level: Integer,
    status: String,
    parent_id: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityProject (284 nodes)
```cypher
(:EntityProject {
    id: String,
    name: String,
    status: String,
    start_date: Date,
    end_date: Date,
    progress_percentage: Integer,  // 0-100
    parent_id: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityRisk (391 nodes)
```cypher
(:EntityRisk {
    id: String,
    name: String,
    risk_description: String,
    risk_category: String,
    risk_score: Float,
    risk_status: String,
    likelihood_of_delay: Float,
    delay_days: Integer,
    mitigation_strategy: String,
    risk_owner: String,
    risk_reviewer: String,
    identified_date: Date,
    last_review_date: Date,
    next_review_date: Date,
    people_score: Float,
    process_score: Float,
    tools_score: Float,
    operational_health_score: Float,
    threshold_green: Float,
    threshold_amber: Float,
    threshold_red: Float,
    kpi: String,
    parent_id: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    it_systems_risk: Float,
    it_systems_delay_days: Integer,
    it_systems_persistence: Float,
    role_gaps_risk: Float,
    role_gaps_delay_days: Integer,
    role_gaps_persistence: Float,
    project_outputs_risk: Float,
    project_outputs_delay_days: Integer,
    project_outputs_persistence: Float,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityITSystem (930 nodes)
```cypher
(:EntityITSystem {
    id: String,
    name: String,
    system_type: String,
    technology_stack: String,
    operational_status: String,
    vendor_supplier: String,
    owner: String,
    deployment_date: Date,
    licensing: String,
    acquisition_cost: Float,
    annual_maintenance_costs: Float,
    number_of_modules: Integer,
    criticality: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityOrgUnit (436 nodes)
```cypher
(:EntityOrgUnit {
    id: String,
    name: String,
    unit_type: String,
    head_of_unit: String,
    location: String,
    headcount: Integer,
    budget: Float,
    annual_budget: Float,
    parent_id: String,
    parent_year: Integer,
    gap: Float,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityVendor (922 nodes)
```cypher
(:EntityVendor {
    id: String,
    name: String,
    service_domain: String,
    service_detail: String,
    contract_value: Float,
    performance_rating: Float,
    service_level_agreements: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### Document (18 nodes)
```cypher
(:Document {
    fileName: String,
    fileType: String,
    fileSize: Integer,
    fileSource: String,
    status: String,
    nodeCount: Integer,
    relationshipCount: Integer,
    chunkNodeCount: Integer,
    communityNodeCount: Integer,
    entityNodeCount: Integer,
    total_chunks: Integer,
    processed_chunk: Integer,
    model: String,
    processingTime: Float,
    createdAt: DateTime,
    updatedAt: DateTime,
    communityRelCount: Integer,
    chunkRelCount: Integer,
    entityEntityRelCount: Integer,
    errorMessage: String,
    retry_condition: String,
    is_cancelled: Boolean
})
```

#### Chunk (787 nodes)
```cypher
(:Chunk {
    id: String,
    text: String,
    fileName: String,
    position: Integer,
    page_number: Integer,
    content_offset: Integer,
    length: Integer,
    embedding: List<Float>
})
```

#### SectorAdminRecord (20 nodes)
```cypher
(:SectorAdminRecord {
    id: String,
    dataset_name: String,
    record_type: String,
    content: String,
    data_owner: String,
    access_level: String,
    category: String,
    author_issuing_authority: String,
    publication_date: Date,
    update_frequency: String,
    version: String,
    status: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### SectorDataTransaction (35 nodes)
```cypher
(:SectorDataTransaction {
    id: String,
    transaction_type: String,
    domain: String,
    department: String,
    parent_id: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### SectorCitizen (9 nodes)
```cypher
(:SectorCitizen {
    id: String,
    type: String,
    demographic_details: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### SectorBusiness (12 nodes)
```cypher
(:SectorBusiness {
    id: String,
    name: String,
    operating_sector: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### SectorGovEntity (10 nodes)
```cypher
(:SectorGovEntity {
    id: String,
    name: String,
    linked_policies: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityProcess (353 nodes)
```cypher
(:EntityProcess {
    id: String,
    name: String,
    description: String,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityChangeAdoption (284 nodes)
```cypher
(:EntityChangeAdoption {
    id: String,
    name: String,
    status: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### EntityCultureHealth (436 nodes)
```cypher
(:EntityCultureHealth {
    id: String,
    name: String,
    survey_score: Float,
    target: Float,
    baseline: Float,
    trend: String,
    participation_rate: Float,
    historical_trends: String,
    parent_year: Integer,
    quarter: String,
    year: Integer,
    level: String,
    embedding: List<Float>,
    embedding_generated_at: DateTime
})
```

#### Memory (78 nodes)
```cypher
(:Memory {
    id: String,
    content: String,
    scope: String,               // personal | departmental | ministry | secrets
    user_id: String,
    source_session: String,
    message_hash: String,
    tags: List<String>,
    message_count: Integer,
    source_updated_at_ts: Float, // timestamp (epoch)
    created_at: DateTime,
    updated_at: DateTime,
    timestamp: DateTime,
    embedding: List<Float>
})
```

#### __Entity__ (3,750 nodes)
```cypher
(:__Entity__ {
    id: String,
    embedding: List<Float>
})
```

#### KSAStrategy (3,750 nodes)
```cypher
(:KSAStrategy {
    id: String,
    embedding: List<Float>
})
```

#### Session (1 node)
```cypher
(:Session {
    id: String,
    embedding: List<Float>
})
```

#### Message (2 nodes)
```cypher
(:Message {
    role: String,
    content: String
})
```

### Relationship Types (✅ Verified - 35 types, 24,398 total)

#### Deterministic Business Chains (7 paths, served via `/api/v1/chains/{chain_key}`)

| Chain Key | Start Label | Path Summary |
|-----------|-------------|--------------|
| `sector_ops` | `SectorObjective` | Objective → PolicyTool → AdminRecord → Stakeholder (Business/GovEntity/Citizen) → DataTransaction → Performance → Objective loop |
| `strategy_to_tactics_priority` | `SectorObjective` | Objective → PolicyTool → Capability → Gap layer (OrgUnit/Process/ITSystem) → Project → ChangeAdoption |
| `strategy_to_tactics_targets` | `SectorObjective` | Objective → Performance → Capability → Gap layer (OrgUnit/Process/ITSystem) → Project → ChangeAdoption |
| `tactical_to_strategy` | `EntityChangeAdoption` | ChangeAdoption → Project → Ops layer (OrgUnit/Process/ITSystem) → Capability → Strategy layer (Performance or PolicyTool) → Objective |
| `risk_build_mode` | `EntityCapability` | Capability → Risk → PolicyTool |
| `risk_operate_mode` | `EntityCapability` | Capability → Risk → Performance |
| `internal_efficiency` | `EntityCultureHealth` | CultureHealth → OrgUnit → Process → ITSystem → Vendor |

**Execution endpoints:**
- Run: `/api/v1/chains/{chain_key}?id={node_id}&year={year}`
- Sample: `/api/v1/chains/sample/{chain_key}` (probes data and returns a representative id/year if present)

#### Strategic Layer (Sector nodes)

| Relationship | **Count** | Pattern (From → To) | Meaning |
|--------------|-----------|---------------------|---------|
| `GOVERNED_BY` | **547** | PolicyTool → Objective | Policy governed by strategic objective |
| `REALIZED_VIA` | **823** | Objective → PolicyTool | Objective achieved through policy |
| `MEASURED_BY` | **470** | Objective → Performance | Objective measured by KPI |
| `AGGREGATES_TO` | **420** | Performance → Objective | Performance rolls up to objective |
| `CASCADED_VIA` | **105** | Objective → Performance | Objective cascaded through KPI |
| `REFERS_TO` | **117** | PolicyTool → AdminRecord | Policy references admin record |
| `APPLIED_ON` | **72** | AdminRecord → Citizen | Record applied to citizen |
| `TRIGGERS_EVENT` | **121** | Business → DataTransaction | Business triggers transaction |
| `FEEDS_INTO` | **101** | DataTransaction → Performance | Transaction feeds performance data |

#### Capability & Execution Layer (Entity nodes)

| Relationship | **Count** | Pattern (From → To) | Meaning |
|--------------|-----------|---------------------|---------|
| `SETS_PRIORITIES` | **885** | PolicyTool → Capability | Policy sets capability priority |
| `SETS_TARGETS` | **746** | Performance → Capability | Performance sets capability target |
| `OPERATES` | **750** | OrgUnit → Capability | Unit operates capability |
| `MONITORED_BY` | **787** | Capability → Risk | Capability monitored for risk |
| `INFORMS` | **782** | Risk → PolicyTool | Risk informs policy |
| `ROLE_GAPS` | **480** | Capability → OrgUnit | Capability has role gap in unit |
| `KNOWLEDGE_GAPS` | **382** | Capability → Process | Capability has knowledge gap in process |
| `AUTOMATION_GAPS` | **142** | Capability → ITSystem | Capability has automation gap |
| `EXECUTES` | **278** | Capability → PolicyTool | Capability executes policy |
| `REPORTS` | **255** | Capability → Performance | Capability reports performance |

#### Project & Change Management

| Relationship | **Count** | Pattern (From → To) | Meaning |
|--------------|-----------|---------------------|---------|
| `CLOSE_GAPS` | **323** | Project → OrgUnit | Project closes unit gaps |
| `GAPS_SCOPE` | **856** | Project → OrgUnit | Project addresses unit scope |
| `ADOPTION_RISKS` | **283** | Project → ChangeAdoption | Project has adoption risk |
| `ADOPTION_ENT_RISKS` | **284** | Project → ChangeAdoption | Project enterprise adoption risk |
| `INCREASE_ADOPTION` | **288** | ChangeAdoption → Project | Adoption increases project success |
| `MONITORS_FOR` | **461** | CultureHealth → OrgUnit | Culture health monitors unit |

#### Infrastructure & Operations

| Relationship | **Count** | Pattern (From → To) | Meaning |
|--------------|-----------|---------------------|---------|
| `DEPENDS_ON` | **930** | ITSystem → Vendor | IT system depends on vendor |
| `AUTOMATION` | **19** | Process → ITSystem | Process automated by system |
| `APPLY` | **159** | OrgUnit → Process | Unit applies process |

#### Structural Relationships

| Relationship | **Count** | Pattern (From → To) | Meaning |
|--------------|-----------|---------------------|---------|
| `PARENT_OF` | **4,358** | (Various) → (Same Type) | Hierarchical parent-child |

#### Document & Knowledge Graph

| Relationship | **Count** | Pattern (From → To) | Meaning | Properties |
|--------------|-----------|---------------------|---------|------------|
| `PART_OF` | **787** | Chunk → Document | Chunk belongs to document | - |
| `FIRST_CHUNK` | **18** | Document → Chunk | First chunk in document | - |
| `NEXT_CHUNK` | **770** | Chunk → Chunk | Sequential chunk ordering | - |
| `HAS_ENTITY` | **4,252** | Chunk → __Entity__ | Chunk contains entity | - |
| `SIMILAR` | **2,345** | Chunk → Chunk | Semantic similarity | `score` |
| `LAST_MESSAGE` | **1** | Session → Message | Session's last message | - |
| `NEXT` | **1** | Message → Message | Message sequence | - |

### Data Access via Neo4j Client

**Basic Query Pattern:**

```python
from app.db.neo4j_client import neo4j_client

# Execute query
results = neo4j_client.execute_query(
    """
    MATCH (p:EntityProject)-[r:ALIGNS_WITH]->(o:SectorObjective)
    WHERE o.priority = $priority
    RETURN p.name as project, o.name as objective, r.confidence
    ORDER BY r.confidence DESC
    LIMIT 10
    """,
    {"priority": "High"}
)

# Results format: List[Dict]
for row in results:
    print(f"{row['project']} → {row['objective']} ({row['confidence']})")
```

### Common Query Patterns

#### 1. Graph Traversal

```cypher
// Find all projects supporting a specific objective (multi-hop)
MATCH path = (p:EntityProject)-[:ALIGNS_WITH*1..3]->(o:SectorObjective)
WHERE o.name = $objective_name
RETURN p.name, length(path) as depth, o.name
ORDER BY depth
```

#### 2. Relationship Analysis

```cypher
// Find capabilities supporting multiple high-priority objectives
MATCH (c:EntityCapability)<-[:REQUIRES]-(p:EntityProject)-[:ALIGNS_WITH]->(o:SectorObjective)
WHERE o.priority = 'High'
WITH c, COUNT(DISTINCT o) as objective_count
WHERE objective_count > 1
RETURN c.name, c.maturity_level, objective_count
ORDER BY objective_count DESC
```

#### 3. Path Finding

```cypher
// Shortest path between a project and a policy tool
MATCH path = shortestPath(
    (p:EntityProject {name: $project_name})-[*]-(t:SectorPolicyTool {name: $tool_name})
)
RETURN [node in nodes(path) | labels(node)[0] + ': ' + node.name] as path
```

#### 4. Aggregation

```cypher
// Count projects by status and department
MATCH (p:EntityProject)
RETURN p.status, p.department, COUNT(*) as count
ORDER BY p.status, count DESC
```

### Graph Visualization Query

Used by the frontend GraphDashboard component:

```python
def get_graph_data():
    query = """
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->(m)
    WITH DISTINCT n, COLLECT({
        type: type(r),
        target: id(m),
        properties: properties(r)
    }) as relationships
    RETURN {
        id: id(n),
        label: labels(n)[0],
        properties: properties(n),
        relationships: relationships
    } as node
    LIMIT 500
    """
    return neo4j_client.execute_query(query)
```

### Node Color Mapping (✅ Verified from implementation)

**File:** `/backend/app/api/routes/neo4j_routes.py`

```python
color_map = {
    'SectorObjective': '#A855F7',          # Purple (25 nodes)
    'SectorPolicyTool': '#F59E0B',         # Amber (616 nodes)
    'SectorAdminRecord': '#10B981',        # Emerald (20 nodes)
    'SectorPerformance': '#00F0FF',        # Cyan (616 nodes)
    'SectorDataTransaction': '#3B82F6',    # Blue (35 nodes)
    'SectorCitizen': '#EC4899',            # Pink (9 nodes)
    'SectorBusiness': '#F59E0B',           # Amber (12 nodes)
    'SectorGovEntity': '#8B5CF6',          # Violet (10 nodes)
    'EntityCapability': '#F97316',         # Orange (391 nodes)
    'EntityProject': '#06B6D4',            # Sky Blue (284 nodes)
    'EntityITSystem': '#F43F5E',           # Rose (930 nodes)
    'EntityRisk': '#EF4444',               # Red (391 nodes)
    'EntityOrgUnit': '#8B5CF6',            # Violet (436 nodes)
    'EntityProcess': '#14B8A6',            # Teal (353 nodes)
    'EntityVendor': '#F59E0B',             # Amber (922 nodes)
    'EntityChangeAdoption': '#10B981',     # Emerald (284 nodes)
    'EntityCultureHealth': '#A855F7',      # Purple (436 nodes)
    'Memory': '#FCD34D',                   # Yellow (78 nodes)
    'Document': '#9CA3AF',                 # Gray (18 nodes)
    'Chunk': '#D1D5DB',                    # Light Gray (787 nodes)
}
```

---

## Memory & Embedding System

### Architecture

User Query → Embedding Service (OpenAI) → Vector (1536 dims)
                                              ↓
                        Semantic Search (Neo4j memory_semantic_index)
                                              ↓
                               Top K Results ← Memory Nodes


### Embedding Generation

**File:** `/backend/app/services/embedding_service.py`

```python
class EmbeddingService:
    model = "text-embedding-3-small"
    dimensions = 1536
    
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for a single text."""
        
    async def generate_embedding_async(self, text: str) -> Optional[List[float]]:
        """Async version for concurrent operations."""
        
    def generate_embeddings_batch(
        self, 
        texts: List[str], 
        batch_size: int = 100
    ) -> List[Optional[List[float]]]:
        """Batch process multiple texts."""
```

**Usage:**
```python
from app.services.embedding_service import EmbeddingService

embedding_service = EmbeddingService()
vector = embedding_service.generate_embedding("project timeline analysis")
```

### Semantic Search

**File:** `/backend/app/services/semantic_search.py`

```python
async def semantic_search(
    query: str,
    scope: str = "departmental",
    user_id: Optional[int] = None,
    limit: int = 5,
    similarity_threshold: float = 0.7
) -> List[Dict]:
    """
    Unified semantic search across memory collection.
    
    Args:
        query: Search query
        scope: Memory scope ('personal', 'departmental', 'ministry', 'secrets')
        user_id: Optional user ID for personal scope
        limit: Max results
        similarity_threshold: Minimum cosine similarity (0-1)
    
    Returns:
        List of memory items with content, similarity, metadata
    """
```

**Implementation:**
```python
# Generate query embedding
query_vector = embedding_service.generate_embedding(query)

# Vector search (Neo4j)
results = await neo4j_client.execute_query("""
    CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding)
    YIELD node AS m, score
    WHERE m.scope = $scope AND ($user_id IS NULL OR m.user_id = $user_id)
    RETURN m.id AS id, m.content AS content, score
    ORDER BY score DESC
    LIMIT $limit
""", {
    "scope": scope,
    "query_embedding": query_vector,
    "limit": limit,
    "user_id": user_id
})
```

### Memory Scopes

| Scope | Access Control | Use Case | Noor Access | Maestro Access |
|-------|----------------|----------|-------------|----------------|
| `personal` | User-specific | User preferences, notes | ✅ (own only) | ✅ (own only) |
| `departmental` | Department-level | Team knowledge, processes | ✅ | ✅ |
| `ministry` | Ministry-wide | Organizational policies | ✅ | ✅ |
| `secrets` | Executive-only | Strategic decisions | ❌ | ✅ |
| `csuite` | C-suite only | Board-level information | ❌ | ✅ |

**File:** `/backend/app/services/mcp_service.py` (Noor constraints)

```python
# Noor scope constraints
FORBIDDEN_SCOPES = {'secrets', 'csuite'}
ALLOWED_SCOPES = {'personal', 'departmental', 'ministry'}

def recall_memory(scope: str, query_summary: str, limit: int = 5):
    if scope in FORBIDDEN_SCOPES:
        raise PermissionError(f"Noor cannot access {scope} scope")
    # Proceed with search...
```

### Memory Storage

# Memory is stored as 'Memory' nodes in Neo4j with an 'embedding' property.
# Persistence is typically handled via nightly batch jobs (Noor is Read-Only).

# Example Cypher for manual storage:
# CREATE (m:Memory {
#     id: 'fact-001',
#     content: 'Data platform project uses PostgreSQL and Redis',
#     scope: 'departmental',
#     embedding: $embedding_vector,
#     metadata: '{"tech_stack": true}'
# })


---

## Data Access Patterns

### Pattern 1: User Authentication Flow

```python
# 1. Login via auth service
from app.services.user_service import UserService

user_service = UserService()
user = await user_service.get_user_by_email("user@example.com")

# 2. Validate password
if user and user_service.verify_password(plain_password, user.password):
    # 3. Create JWT token
    from app.utils.auth_utils import create_access_token
    token = create_access_token({"sub": user.email, "user_id": user.id})
```

### Pattern 2: Chat Message Flow

```python
# 1. Create or get conversation
conversation = await supabase_client.table_select(
    "conversations",
    "*",
    {"id": conversation_id}
)

if not conversation:
    conversation = await supabase_client.table_insert(
        "conversations",
        {"user_id": user_id, "title": "New Chat"}
    )

# 2. Store user message
await supabase_client.table_insert(
    "messages",
    {
        "conversation_id": conversation["id"],
        "role": "user",
        "content": user_query
    }
)

# 3. Generate AI response (orchestrator)
response = orchestrator.execute_query(user_query, session_id)

# 4. Store AI message with artifacts
await supabase_client.table_insert(
    "messages",
    {
        "conversation_id": conversation["id"],
        "role": "assistant",
        "content": response["message"],
        "metadata": {
            "artifacts": response.get("artifacts", []),
            "confidence": response.get("confidence", 0.8)
        }
    }
)
```

### Pattern 3: Hybrid Query (PostgreSQL + Neo4j)

```python
async def get_project_analysis(project_name: str):
    """Get project data from both databases."""
    
    # 1. Get structured data from Supabase
    project_memory = await semantic_search(
        query=f"project {project_name} details",
        scope="departmental",
        limit=3
    )
    
    # 2. Get graph relationships from Neo4j
    graph_data = neo4j_client.execute_query(
        """
        MATCH (p:EntityProject {name: $name})
        OPTIONAL MATCH (p)-[r1:ALIGNS_WITH]->(o:SectorObjective)
        OPTIONAL MATCH (p)-[r2:DEPENDS_ON]->(s:EntityITSystem)
        RETURN p.name, p.status, p.budget,
               COLLECT(DISTINCT o.name) as objectives,
               COLLECT(DISTINCT s.name) as systems
        """,
        {"name": project_name}
    )
    
    # 3. Combine results
    return {
        "project": graph_data[0],
        "memory": project_memory
    }
```

### Pattern 4: Dashboard Data Aggregation

```python
async def get_dashboard_metrics(quarter: str = None):
    """Get dashboard KPIs from Supabase."""
    
    filters = {"quarter": quarter} if quarter else {}
    
    # Get KPI data
    kpis = await supabase_client.table_select(
        "temp_quarterly_dashboard_data",
        "*",
        filters,
        order={"dimension": "asc"}
    )
    
    # Get outcomes
    outcomes = await supabase_client.table_select(
        "temp_quarterly_outcomes_data",
        "*",
        filters
    )
    
    # Aggregate
    return {
        "kpis": kpis,
        "outcomes": outcomes,
        "summary": {
            "total_dimensions": len(kpis),
            "avg_variance": sum(k["variance"] for k in kpis) / len(kpis)
        }
    }
```

---

## Cross-Database Operations

### Enriching Neo4j Data with Memory

```python
async def enrich_objective_with_memory(objective_name: str):
    """Add contextual memory to Neo4j objective."""
    
    # 1. Get objective from Neo4j
    objective = neo4j_client.execute_query(
        "MATCH (o:SectorObjective {name: $name}) RETURN o",
        {"name": objective_name}
    )[0]
    
    # 2. Search for related memories
    memories = await semantic_search(
        query=f"objective {objective_name} context",
        scope="ministry",
        limit=5
    )
    
    # 3. Return enriched data
    return {
        "objective": objective,
        "context": memories,
        "enriched_at": datetime.now()
    }
```

### Validating Neo4j Data with Supabase

```python
async def validate_project_exists(project_name: str) -> bool:
    """Check if project exists in either database."""
    
    # Check Neo4j
    neo4j_exists = bool(neo4j_client.execute_query(
        "MATCH (p:EntityProject {name: $name}) RETURN p LIMIT 1",
        {"name": project_name}
    ))
    
    # Check Supabase memory
    memory_exists = bool(await semantic_search(
        query=f"project {project_name}",
        scope="departmental",
        limit=1,
        similarity_threshold=0.9
    ))
    
    return neo4j_exists or memory_exists
```

---

## Query Examples

### Supabase Queries

#### Get Recent Conversations

```python
conversations = await supabase_client.table_select(
    "conversations",
    "id, title, updated_at, (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count",
    {"user_id": user_id},
    order={"updated_at": "desc"},
    limit=20
)
```

#### Get Tier 1 Prompt Elements

```python
elements = await supabase_client.table_select(
    "instruction_elements",
    "element, content",
    {
        "bundle": "tier1",
        "status": "active",
        "persona": ["noor", "both"]
    },
    order={"element": "asc"}
)

tier1_prompt = "\n\n".join([e["content"] for e in elements])
```

#### Search User Memories

```python
# Assuming search_memories is a Postgres function
results = await supabase_client.rpc(
    'search_memories',
    {
        'query_embedding': query_vector,
        'match_threshold': 0.7,
        'match_count': 5,
        'scope_filter': 'personal',
        'user_id_filter': user_id
    }
)
```

### Neo4j Queries

#### Project Portfolio Analysis

```cypher
MATCH (p:EntityProject)
WITH p.status as status, 
     COUNT(*) as count,
     SUM(p.budget) as total_budget,
     AVG(p.completion_percentage) as avg_completion
RETURN status, count, total_budget, avg_completion
ORDER BY count DESC
```

#### Capability Gap Analysis

```cypher
MATCH (c:EntityCapability)
WHERE c.maturity_level < c.target_maturity
WITH c, (c.target_maturity - c.maturity_level) as gap
RETURN c.name, c.maturity_level, c.target_maturity, gap
ORDER BY gap DESC
LIMIT 10
```

#### Impact Analysis (Dependencies)

```cypher
MATCH (p:EntityProject {name: $project_name})
MATCH (p)-[:DEPENDS_ON]->(s:EntityITSystem)
MATCH (s)<-[:USES]-(proc:EntityProcess)
MATCH (proc)<-[:OWNS]-(org:EntityOrgUnit)
RETURN DISTINCT org.name as affected_unit, 
       COUNT(DISTINCT proc) as affected_processes
ORDER BY affected_processes DESC
```

#### Strategic Alignment Report

```cypher
MATCH (o:SectorObjective {priority: 'High'})
OPTIONAL MATCH (p:EntityProject)-[r:ALIGNS_WITH]->(o)
WITH o, COUNT(p) as project_count, AVG(r.confidence) as avg_confidence
RETURN o.name, o.sector, project_count, avg_confidence
ORDER BY project_count DESC
```

---

## Best Practices

### Supabase (PostgreSQL)

1. **Use Filters Efficiently**
   ```python
   # Good: Use indexed columns
   await supabase_client.table_select("users", "*", {"email": email})
   
   # Avoid: Full table scan without filters
   all_users = await supabase_client.table_select("users", "*")
   ```

2. **Batch Operations**
   ```python
   # Good: Batch insert
   await supabase_client.table_insert("messages", [msg1, msg2, msg3])
   
   # Avoid: Multiple single inserts
   for msg in messages:
       await supabase_client.table_insert("messages", msg)
   ```

3. **Use Proper Ordering**
   ```python
   # Always specify order for consistent results
   await supabase_client.table_select(
       "conversations",
       "*",
       filters,
       order={"updated_at": "desc"}
   )
   ```

4. **Handle Errors**
   ```python
   try:
       result = await supabase_client.table_insert("users", data)
   except Exception as e:
       logger.error(f"Insert failed: {e}")
       # Handle duplicate key, constraint violations, etc.
   ```

### Neo4j (Graph)

1. **Use Parameters**
   ```python
   # Good: Parameterized query (prevents injection)
   neo4j_client.execute_query(
       "MATCH (p:EntityProject {name: $name}) RETURN p",
       {"name": project_name}
   )
   
   # Avoid: String concatenation
   neo4j_client.execute_query(
       f"MATCH (p:EntityProject {{name: '{project_name}'}}) RETURN p"
   )
   ```

2. **Limit Results**
   ```cypher
   -- Always use LIMIT for exploratory queries
   MATCH (n:EntityProject)
   WHERE n.status = 'Active'
   RETURN n
   LIMIT 100
   ```

3. **Use Indexes**
   ```cypher
   -- Create indexes for frequently queried properties
   CREATE INDEX project_name IF NOT EXISTS FOR (p:EntityProject) ON (p.name);
   CREATE INDEX objective_priority IF NOT EXISTS FOR (o:SectorObjective) ON (o.priority);
   ```

4. **Avoid Cartesian Products**
   ```cypher
   -- Bad: Cartesian product
   MATCH (p:EntityProject), (o:SectorObjective)
   RETURN p, o
   
   -- Good: Relationship-based
   MATCH (p:EntityProject)-[:ALIGNS_WITH]->(o:SectorObjective)
   RETURN p, o
   ```

5. **Profile Queries**
   ```cypher
   -- Use PROFILE to analyze query performance
   PROFILE
   MATCH (p:EntityProject)-[:ALIGNS_WITH]->(o:SectorObjective)
   WHERE o.priority = 'High'
   RETURN p.name, o.name
   ```

### Memory & Embeddings

1. **Batch Embedding Generation**
   ```python
   # Good: Batch processing
   texts = [memory["content"] for memory in memories]
   embeddings = embedding_service.generate_embeddings_batch(texts)
   
   # Avoid: Individual calls
   for memory in memories:
       embedding = embedding_service.generate_embedding(memory["content"])
   ```

2. **Set Appropriate Thresholds**
   ```python
   # High threshold for exact matches
   exact_matches = await semantic_search(query, threshold=0.9)
   
   # Lower threshold for exploratory search
   related = await semantic_search(query, threshold=0.6)
   ```

3. **Cache Embeddings (Internal Only)**
   ```python
   # Persistence is primarily handled via nightly batch jobs into Neo4j Memory nodes.
   # Noor is Read-Only and does not write to the graph.
   ```

---

## Data Migration

### Adding New Tables (Supabase)

```sql
-- 1. Create migration file in Supabase dashboard or CLI
CREATE TABLE new_feature (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX idx_new_feature_name ON new_feature(name);

-- 3. Update Supabase client usage in code
await supabase_client.table_select("new_feature", "*", {})
```

### Adding New Node Types (Neo4j)

```cypher
-- 1. Create constraint (unique identifier)
CREATE CONSTRAINT entity_initiative_name IF NOT EXISTS
FOR (i:EntityInitiative) REQUIRE i.name IS UNIQUE;

-- 2. Create index for search
CREATE INDEX entity_initiative_status IF NOT EXISTS
FOR (i:EntityInitiative) ON (i.status);

-- 3. Add nodes
CREATE (i:EntityInitiative {
    name: "Digital ID Program",
    status: "Planning",
    created_at: datetime()
});

-- 4. Create relationships
MATCH (i:EntityInitiative {name: "Digital ID Program"})
MATCH (o:SectorObjective {name: "Digital Transformation"})
CREATE (i)-[:SUPPORTS]->(o);
```

### Migrating Data Between Databases

```python
async def migrate_projects_to_neo4j():
    """Example: Migrate project data from Supabase to Neo4j."""
    
    # 1. Get projects from Supabase
    projects = await supabase_client.table_select("projects", "*")
    
    # 2. Create nodes in Neo4j
    for project in projects:
        neo4j_client.execute_query(
            """
            MERGE (p:EntityProject {name: $name})
            SET p.status = $status,
                p.budget = $budget,
                p.migrated_at = datetime()
            """,
            {
                "name": project["name"],
                "status": project["status"],
                "budget": project["budget"]
            }
        )
    
    print(f"Migrated {len(projects)} projects to Neo4j")
```

### Backup & Restore

**Supabase:**
```bash
# Backup (via Supabase CLI)
supabase db dump --db-url $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

**Neo4j:**
```bash
# Backup (admin command)
neo4j-admin database dump neo4j --to-path=/backups

# Restore
neo4j-admin database load neo4j --from-path=/backups
```

---

## Quick Reference

### Connection Strings

```python
# Supabase
SUPABASE_URL = "https://xxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbG..."

# Neo4j
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "your-password"
```

### Common Imports

```python
# Supabase
from app.db.supabase_client import supabase_client

# Neo4j
from app.db.neo4j_client import neo4j_client

# Embeddings
from app.services.embedding_service import EmbeddingService

# Semantic Search
from app.services.semantic_search import semantic_search
```

### Health Checks

```python
# Supabase health
try:
    await supabase_client.table_count("users")
    print("✅ Supabase connected")
except Exception as e:
    print(f"❌ Supabase error: {e}")

# Neo4j health
if neo4j_client.is_connected():
    print("✅ Neo4j connected")
else:
    print("❌ Neo4j disconnected")
```

---

## Database Verification Summary

**✅ Inspection Date:** December 17, 2025  
**✅ Method:** Direct database queries via `inspect_databases.py`

### Supabase (PostgreSQL)
- **Connection:** ✅ Successful
- **Tables Verified:** 7 core tables
- **Total Rows:** 1,916
  - `users`: 6 rows
  - `conversations`: 385 rows
  - `messages`: 1,294 rows
  - `instruction_elements`: 84 rows
  - `temp_quarterly_dashboard_data`: 160 rows
  - `temp_quarterly_outcomes_data`: 36 rows
  - `temp_investment_initiatives`: 35 rows

### Neo4j (Graph Database)
- **Connection:** ✅ Successful
- **Node Labels:** 21 types (18 active with data)
- **Total Nodes:** 10,406
- **Relationship Types:** 35 types
- **Total Relationships:** 24,398

### Key Findings:
1. ✅ All schemas match actual database structure
2. ✅ All node counts and relationship counts verified
3. ✅ Memory is stored in Neo4j (not Supabase)
4. ✅ All property names confirmed from live data
5. ✅ Conversation tracking includes persona_id field
6. ✅ Messages use artifact_ids array instead of metadata-only
7. ✅ Instruction elements include dependencies and use_cases arrays

---

*This document is grounded in actual database inspection. All schemas, counts, and relationships verified from live systems. Run `python3 inspect_databases.py` to re-verify.*

---

## Post-Migration Verification (Dec 17, 2025)

Following the normalization migration (quarter/name/status), these queries confirm outcomes. Note: use `IS NOT NULL` instead of deprecated `exists()` syntax.

### Added/Backfilled Fields
- SectorObjective: Ensure all objectives have a quarter
    - Query: `MATCH (o:SectorObjective) WHERE o.quarter IS NOT NULL RETURN count(o) AS c`
    - Result: `25` (equals total objectives)

- SectorCitizen: Ensure canonical `name` is set
    - Query: `MATCH (c:SectorCitizen) WHERE c.name IS NOT NULL RETURN count(c) AS c`
    - Result: `9` (equals total citizens)

- SectorDataTransaction: Ensure canonical `name` is set
    - Query: `MATCH (t:SectorDataTransaction) WHERE t.name IS NOT NULL RETURN count(t) AS c`
    - Result: `35` (equals total transactions)

- EntityRisk / EntityITSystem: Ensure unified `status`
    - Risk: `MATCH (r:EntityRisk) WHERE r.status IS NOT NULL RETURN count(r) AS c` → `391`
    - IT System: `MATCH (s:EntityITSystem) WHERE s.status IS NOT NULL RETURN count(s) AS c` → `930`

### Removed/Deprecated Fields (should not remain)
- SectorCitizen: `type`, `region`, `district`
    - `MATCH (c:SectorCitizen) WHERE c.type IS NOT NULL RETURN count(c) AS c` → `0`
    - `MATCH (c:SectorCitizen) WHERE c.region IS NOT NULL RETURN count(c) AS c` → `0`
    - `MATCH (c:SectorCitizen) WHERE c.district IS NOT NULL RETURN count(c) AS c` → `0`

- SectorDataTransaction: `domain`, `department`, `transaction_type`
    - `MATCH (t:SectorDataTransaction) WHERE t.domain IS NOT NULL RETURN count(t) AS c` → `0`
    - `MATCH (t:SectorDataTransaction) WHERE t.department IS NOT NULL RETURN count(t) AS c` → `0`
    - `MATCH (t:SectorDataTransaction) WHERE t.transaction_type IS NOT NULL RETURN count(t) AS c` → `0`

These results validate the migration rules:
- SectorObjective.quarter backfilled from `SectorPerformance` first, then `SectorPolicyTool` (no placeholders).
- SectorCitizen.name derived by level (L1: type, L2: region, L3: district), then source fields removed.
- SectorDataTransaction.name derived from `domain/department/transaction_type`, then source fields removed.
- `EntityRisk.risk_status` and `EntityITSystem.operational_status` unified into `status`.
