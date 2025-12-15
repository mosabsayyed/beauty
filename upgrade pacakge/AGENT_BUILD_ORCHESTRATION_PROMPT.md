# 🤖 AGENT BUILD ORCHESTRATION PROMPT

**For:** Coding Agent / Multi-Agent System  
**Task:** Autonomous build of Noor Cognitive Digital Twin v2.1 from specification to production  
**Scope:** 4 phases, 100% uninterrupted execution  
**Status Tracking:** Self-managing with drift detection

---

## YOUR MISSION

Build the complete **Noor Cognitive Digital Twin v3** system from the technical specification (final_Notebook_Output/[END_STATE_TECHNICAL_DESIGN] Implementation Roadmap_ Noor Cognitive Digital Twin v3.0.md) without human intervention, maintaining focus, organizing work, detecting drift, and verifying completion at each milestone. Note you will find mixed version references, but the version we are building is 3.0

---

## 🎯 CORE DIRECTIVES

### **1. SELF-ORGANIZATION FRAMEWORK**

**You MUST organize work into atomic tasks with explicit checkpoints:**

```
PHASE → MILESTONE → EPIC → TASK → SUBTASK → TEST
└─ Each level has explicit success criteria
└─ Each level reports status before proceeding
└─ No task longer than 4 hours of work
```

**You MUST maintain a persistent progress log:**

```
/progress_log.json
{
  "phase": 1,
  "phase_status": "in-progress",
  "current_milestone": "database-foundation",
  "completed_tasks": ["postgres-schema-created", "neo4j-constraints-applied"],
  "current_task": "vector-index-setup",
  "drift_checks": [
    {"timestamp": "2025-12-05T10:30:00Z", "drift_detected": false, "status": "on_track"}
  ]
}
```

**Update this log EVERY 30 minutes** or after each task completion.

---

### **2. DRIFT DETECTION MECHANISM**

**DRIFT = Deviation from the specification or task checklist**

**You MUST detect drift by checking:**

1. **Scope Drift:** Are you working on something NOT in the current task?
   - ❌ DRIFT: Started Phase 3 before Phase 2 is complete
   - ✅ OK: Researching Phase 3 requirements while finishing Phase 2 prep

2. **Specification Drift:** Are you ignoring documented constraints?
   - ❌ DRIFT: Using SKIP/OFFSET in Cypher (violates keyset pagination)
   - ✅ OK: Following keyset pagination pattern from Section 3.5

3. **Quality Drift:** Are you skipping tests or validation?
   - ❌ DRIFT: Moved to next phase without running Phase 1 tests
   - ✅ OK: All Phase 1 tests passed, proceeding to Phase 2

4. **Communication Drift:** Are you making decisions without reporting?
   - ❌ DRIFT: Modified database schema without explaining why
   - ✅ OK: "Schema modified because X. Reason: Y. Impact: Z. Approval needed?"

**DRIFT RECOVERY PROTOCOL:**

When you detect drift:

1. **STOP** - Immediately halt current task
2. **REPORT** - Log what drift was detected with timestamp
3. **REORIENT** - Return to last known good state (previous checkpoint)
4. **VERIFY** - Confirm you're back on specification
5. **RESUME** - Continue from checkpoint

Example:
```
[DRIFT DETECTED] 2025-12-05 14:22:00
Issue: Started implementing MCP tool before PostgreSQL schema verified
Root cause: Assumed schema was complete, didn't run verification
Recovery: Reverted to Phase 1 checkpoint, running schema tests now
Resume time: 14:35:00
```

---

### **3. MULTI-AGENT COORDINATION**

**You may spawn specialized sub-agents for parallel work:**

**Database Agent (Phase 1)**
- Task: Setup PostgreSQL + Neo4j
- Scope: Sections 1.0-1.2 of technical spec
- Success: All 3 tables created, all indexes applied, all constraints verified
- Approval required: Yes (you must verify completion)

**MCP Agent (Phase 2)**
- Task: Implement MCP tools + constraints
- Scope: Sections 2.0-2.2 of technical spec
- Success: All 4 tools pass unit tests
- Approval required: Yes (you must verify completion)

**Orchestrator Agent (Phase 3)**
- Task: Implement orchestrator + bundles + normalization
- Scope: Sections 3.0-3.6 of technical spec
- Success: All 4 components working in integration test
- Approval required: Yes (you must verify completion)

**Operations Agent (Phase 4)**
- Task: Setup deployment + observability + testing
- Scope: Sections 4.0-4.4 of technical spec
- Success: All infrastructure in place, E2E test passing
- Approval required: Yes (you must verify completion)

**COORDINATION RULES:**

- Each agent runs in parallel ONLY if upstream phase is complete
- Example: MCP Agent can start AFTER Database Agent reports "complete"
- You (Main Agent) coordinate handoffs, verify outputs, make decisions
- No agent moves to next task without Main Agent approval
- Sub-agents report status every 2 hours or after task completion

---

### **4. SPECIFICATION-LOCKED REQUIREMENTS**

**These are NON-NEGOTIABLE. You CANNOT deviate:**

#### **Phase 1: Data & Schema Foundation**

✅ **PostgreSQL Tables (EXACT from Section 1.2):**
- `instruction_bundles` with 15 fields (tag, content, version, status, etc.)
- `instruction_metadata` with trigger_modes array
- `usage_tracking` with session_id, user_id, tokens_input, confidence_score
- 3 indexes exactly as specified

✅ **Neo4j Constraints (EXACT from Section 1.1):**
- Composite key constraints on all 10 node types with (id, year)
- Memory node constraint on (scope, key)
- Vector index named 'memory_semantic_index' with 1536 dimensions, cosine similarity

❌ **DO NOT** deviate or "optimize" schema

#### **Phase 2: MCP Tools (EXACT from Section 2.2)**

✅ **Tool 1: `read_neo4j_cypher(cypher_query: str) -> list[dict]`**
- Location: Section 2.2.A under heading "#### **A. Tool: `read_neo4j_cypher`..."
- Extract: Complete function from "def read_neo4j_cypher(cypher_query: str)"
- MUST reject SKIP/OFFSET
- MUST enforce level integrity
- MUST return only id and name properties

✅ **Tool 2: `recall_memory(scope, query_summary, limit) -> str`**
- Location: Section 2.2.B under heading "#### **B. Tools: `recall_memory` and `save_memory`..."
- Extract: Complete function including 3-tier fallback logic
- MUST support fallback (Personal → Departmental → Global)
- MUST reject csuite scope for Noor agent
- MUST use vector index for semantic search

✅ **Tool 3: `save_memory(scope, key, content, confidence) -> str`**
- Location: Section 2.2.B, same section as recall_memory
- Extract: Complete function after recall_memory
- MUST only accept scope='personal'
- MUST reject departmental/global/csuite

✅ **Tool 4: `retrieve_instructions(mode: str) -> dict`**
- Location: Section 3.2, heading "#### **MCP Tool Specification (`retrieve_instructions`)**"
- Extract: Complete SQL query and Python implementation
- PURPOSE: Fetch task-specific bundles from PostgreSQL by interaction mode
- Implementation: Use provided code in AGENT_CONCERNS_RESOLUTION.md, Section 4
- MUST return concatenated bundle content for prompt prefix
- MUST fallback to 'cognitive_cont' bundle if mode not found

❌ **DO NOT** skip constraint enforcement
❌ **DO NOT** use line numbers - use section headers for extraction

#### **Phase 3: Orchestrator (EXACT from Section 3.0-3.6)**

✅ **Bundles (EXACT XML from Section 3.2):**
- `module_memory_management_noor` - Location: Section 3.2.A under heading "#### **A. `module_memory_management_noor`..."
- `strategy_gap_diagnosis` - Location: Section 3.2.B under heading "#### **B. `strategy_gap_diagnosis`..."
- `module_business_language` - Location: Section 3.2.C under heading "#### **C. `module_business_language`..."
- Extract: Complete XML blocks between <INSTRUCTION_BUNDLE> tags

✅ **Quick Exit Path (EXACT code from Section 3.3):**
- `invoke_llm_for_classification()` - copy lines 453-475
- Quick exit logic for Mode F/D - copy lines 477-495

✅ **Response Normalization (EXACT code from Section 3.4):**
- `apply_business_language_translation()` - copy lines 520-540
- `normalize_response()` - copy lines 542-590

✅ **Cypher Queries (EXACT from Section 3.5):**
- Gap Analysis query - copy lines 595-610
- Trend Analysis query - copy lines 612-625
- Executive Context query - copy lines 627-640

✅ **Orchestrator Main Loop (from Section 3.6):**
- Full async function with all 5 steps
- Copy lines 642-700

❌ **DO NOT** skip bundles or modify queries

#### **Phase 4: Production (from Section 4.0-4.4)**

✅ **Deployment Config:**
- Docker Compose with Noor + Maestro services
- Role-based routing in API Gateway
- Copy from deployment specifications

✅ **Observability:**
- Structured logging with required fields
- Token economics tracking (target: ≤7,500 tokens)
- Confidence score logging

✅ **Testing:**
- Unit tests for MCP tools
- Integration tests for full loop
- E2E tests for deployment
- Trap pattern tests (all 6 traps)

❌ **DO NOT** skip testing

---

## 📋 DETAILED TASK BREAKDOWN

### **PHASE 1: Data & Schema Foundation (Week 1)**

#### **Milestone 1.1: PostgreSQL Setup (Days 1-2)**

**EPIC 1.1.1: Database Creation**
- [ ] Create PostgreSQL database named `noor_twin`
- [ ] Verify connection works
- [ ] Test: `psql -d noor_twin -c "SELECT 1"`

**EPIC 1.1.2: Schema Creation**
- [ ] Execute init_postgres.sql (Section 1.2, use corrected schema from AGENT_CONCERNS_RESOLUTION.md)
- [ ] Verify 3 tables exist: `instruction_bundles`, `instruction_metadata`, `usage_tracking`
- [ ] Verify all 3 indexes exist

**EPIC 1.1.3: Constraints Verification**
- [ ] Run constraint tests (unique, foreign key, NOT NULL)
- [ ] Test versioning logic (UNIQUE on tag + version)
- [ ] Test Blue-Green deployment field (status = 'active' | 'deprecated' | 'draft')

**Test Criteria:**
```sql
-- All 3 tables must exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('instruction_bundles', 'instruction_metadata', 'usage_tracking');
-- Expected: 3

-- All 3 indexes must exist
SELECT COUNT(*) FROM pg_indexes 
WHERE indexname IN ('idx_bundle_status_tag', 'idx_metadata_trigger_modes', 'idx_usage_session_user');
-- Expected: 3

-- Test insert with versioning
INSERT INTO instruction_bundles (tag, content, version, status, category)
VALUES ('test', 'content', '1.0.0', 'active', 'core');
-- Expected: Success

-- Test duplicate version rejection
INSERT INTO instruction_bundles (tag, content, version, status, category)
VALUES ('test', 'content2', '1.0.0', 'active', 'core');
-- Expected: Error (UNIQUE constraint)
```

**Completion Criteria:** ✅ All tests pass, no errors

---

#### **Milestone 1.2: Neo4j Setup (Days 3-4)**

**EPIC 1.2.1: Constraints Creation**
- [ ] Execute neo4j_setup.cypher (Section 1.1, lines 50-75)
- [ ] Verify all 10 composite key constraints applied
- [ ] Verify Memory node constraint applied

**EPIC 1.2.2: Vector Index Creation**
- [ ] Create vector index 'memory_semantic_index'
- [ ] Configure: 1536 dimensions, cosine similarity
- [ ] Test index is queryable

**Test Criteria:**
```cypher
-- Verify constraints exist
SHOW CONSTRAINTS;
-- Expected: 11 constraints (10 node keys + 1 memory key)

-- Test constraint enforcement
CREATE (n:sec_objectives {id: 'test1', year: 2025})
-- Expected: Success (both required fields present)

CREATE (n:sec_objectives {id: 'test2'})
-- Expected: Constraint error (missing 'year')

-- Verify vector index
CALL db.indexes() 
YIELD name 
WHERE name = 'memory_semantic_index'
-- Expected: 1 row found
```

**Completion Criteria:** ✅ All constraints enforced, vector index operational

---

#### **Milestone 1.3: Integration Test (Day 5)**

**EPIC 1.3.1: Database Connectivity**
- [ ] Application can connect to PostgreSQL
- [ ] Application can connect to Neo4j
- [ ] Both connections use environment variables from .env

**EPIC 1.3.2: Schema Validation**
- [ ] Insert test data into all 3 PostgreSQL tables
- [ ] Insert test Memory nodes into Neo4j
- [ ] Verify data persists and retrieves correctly

**Test Criteria:**
```python
# Phase 1 Integration Test
def test_phase_1_complete():
    # PostgreSQL
    assert pg.execute("SELECT COUNT(*) FROM instruction_bundles") == 1
    assert pg.execute("SELECT COUNT(*) FROM instruction_metadata") == 0  # Not loaded yet
    assert pg.execute("SELECT COUNT(*) FROM usage_tracking") == 0
    
    # Neo4j
    result = neo4j.execute("MATCH (m:Memory) RETURN COUNT(m)")
    assert result == 1
    
    # Vector index
    result = neo4j.execute(
        "CALL db.index.vector.queryNodes('memory_semantic_index', 5, $embedding) YIELD node RETURN count(node)",
        {"embedding": [0.1] * 1536}
    )
    assert result >= 0  # Index is queryable
    
    return True
```

**Completion Criteria:** ✅ All integration tests pass

---

### **PHASE 2: MCP Tool Layer Development (Week 2)**

#### **Milestone 2.1: MCP Tool Implementation**

**EPIC 2.1.1: read_neo4j_cypher Tool**
- [ ] Implement function from Section 2.2.A (lines 185-220)
- [ ] Add SKIP/OFFSET rejection
- [ ] Add level integrity check
- [ ] Add property whitelist (id, name only)

**Unit Tests:**
```python
def test_read_neo4j_cypher():
    # Test 1: SKIP rejection
    try:
        read_neo4j_cypher("MATCH (n) SKIP 10 LIMIT 30")
        assert False, "Should reject SKIP"
    except ValueError as e:
        assert "keyset pagination" in str(e)
    
    # Test 2: Level mismatch rejection
    try:
        read_neo4j_cypher(
            "MATCH (n:sec_objectives {level: 'L2'}) "
            "-[:ADDRESSES]-> (m:ent_capabilities {level: 'L3'}) RETURN n.id"
        )
        assert False, "Should reject level mismatch"
    except ValueError as e:
        assert "level integrity" in str(e).lower()
    
    # Test 3: Valid query execution
    result = read_neo4j_cypher(
        "MATCH (n:sec_objectives {year: 2025, level: 'L1'}) "
        "RETURN n.id, n.name LIMIT 10"
    )
    assert isinstance(result, list)
    return True
```

**Completion Criteria:** ✅ All 3 unit tests pass

---

**EPIC 2.1.2: recall_memory Tool**
- [ ] Implement function from Section 2.2.B (lines 245-285)
- [ ] Add 3-tier fallback logic (Personal → Departmental → Global)
- [ ] Add csuite scope rejection
- [ ] Add vector search implementation

**Unit Tests:**
```python
def test_recall_memory():
    # Test 1: csuite rejection
    try:
        recall_memory('csuite', 'test query')
        assert False, "Should reject csuite"
    except PermissionError:
        pass  # Expected
    
    # Test 2: Personal scope
    result = recall_memory('personal', 'test query')
    assert isinstance(result, str)
    
    # Test 3: Fallback (Departmental → Global)
    # Insert only Global scope memory
    insert_test_memory('global', 'test', 'global memory content')
    result = recall_memory('departmental', 'test')
    assert 'global memory content' in result
    
    # Test 4: Empty result handling
    result = recall_memory('personal', 'nonexistent')
    assert result == "" or result == "[]"
    
    return True
```

**Completion Criteria:** ✅ All 4 unit tests pass, fallback logic verified

---

**EPIC 2.1.3: save_memory Tool**
- [ ] Implement function from Section 2.2.B (lines 287-295)
- [ ] Add personal-scope-only enforcement
- [ ] Add rejection of departmental/global/csuite

**Unit Tests:**
```python
def test_save_memory():
    # Test 1: Personal scope acceptance
    result = save_memory('personal', 'test_key', 'test_content', 0.95)
    assert result == "Memory saved successfully."
    
    # Test 2: Departmental rejection
    try:
        save_memory('departmental', 'key', 'content', 0.95)
        assert False, "Should reject departmental"
    except PermissionError:
        pass  # Expected
    
    # Test 3: Global rejection
    try:
        save_memory('global', 'key', 'content', 0.95)
        assert False, "Should reject global"
    except PermissionError:
        pass  # Expected
    
    # Test 4: csuite rejection
    try:
        save_memory('csuite', 'key', 'content', 0.95)
        assert False, "Should reject csuite"
    except PermissionError:
        pass  # Expected
    
    return True
```

**Completion Criteria:** ✅ All 4 unit tests pass, scope constraint enforced

---

#### **Milestone 2.2: MCP Service Integration**

**EPIC 2.2.1: FastAPI Endpoint**
- [ ] Create `/query` endpoint (Section 2.1, lines 150-175)
- [ ] Route to `orchestrator_zero_shot()` function
- [ ] Handle user_role from JWT middleware

**Integration Test:**
```python
def test_mcp_integration():
    # Test endpoint creation
    response = client.post("/query", json={
        "message": "test query",
        "session_id": "test_session"
    })
    assert response.status_code in [200, 202]  # May be async
    
    return True
```

**Completion Criteria:** ✅ Endpoint responsive, routes correctly

---

#### **Milestone 2.3: MCP Testing (Day 5-7)**

**All 3 tools pass full test suite:**
- ✅ Constraint enforcement tests
- ✅ Fallback logic tests
- ✅ Permission tests
- ✅ Integration tests

**Test Command:**
```bash
pytest backend/tests/test_mcp_service.py -v
# Expected: 12 tests passed
```

**Completion Criteria:** ✅ `pytest` shows all green

---

### **PHASE 3: Orchestrator Rewrite (Week 3)**

#### **Milestone 3.1: Bundle Loading**

**EPIC 3.1.1: Load 3 Bundles**
- [ ] Copy `module_memory_management_noor` XML (Section 3.2.A, lines 355-385)
- [ ] Copy `strategy_gap_diagnosis` XML (Section 3.2.B, lines 387-415)
- [ ] Copy `module_business_language` XML (Section 3.2.C, lines 417-445)
- [ ] Insert into PostgreSQL `instruction_bundles` table

**SQL:**
```sql
INSERT INTO instruction_bundles (tag, content, version, status, category)
VALUES 
  ('module_memory_management_noor', '<INSTRUCTION_BUNDLE>...</INSTRUCTION_BUNDLE>', '1.0.0', 'active', 'core'),
  ('strategy_gap_diagnosis', '<INSTRUCTION_BUNDLE>...</INSTRUCTION_BUNDLE>', '1.0.0', 'active', 'strategy'),
  ('module_business_language', '<INSTRUCTION_BUNDLE>...</INSTRUCTION_BUNDLE>', '1.0.0', 'active', 'normalization');
```

**Test Criteria:**
```sql
SELECT COUNT(*) FROM instruction_bundles WHERE status = 'active';
-- Expected: 3
```

**Completion Criteria:** ✅ 3 bundles in PostgreSQL, queryable

---

#### **Milestone 3.2: Quick Exit Path**

**EPIC 3.2.1: Mode Classification**
- [ ] Implement `invoke_llm_for_classification()` (Section 3.3, lines 453-475)
- [ ] Test Mode F detection ("Hello, Noor")
- [ ] Verify <0.5s latency

**Test:**
```python
def test_quick_exit_mode_f():
    start = time.time()
    result = invoke_llm_for_classification("Hello, Noor")
    elapsed = time.time() - start
    
    assert result['mode'] == 'F'
    assert result['quick_exit_triggered'] == True
    assert elapsed < 0.5  # Must be fast
    
    return True
```

**Completion Criteria:** ✅ Mode F detected, <0.5s latency confirmed

---

**EPIC 3.2.2: Orchestrator Quick Exit**
- [ ] Implement quick exit logic (Section 3.3, lines 477-495)
- [ ] Skip Steps 2-3 for Modes D/F
- [ ] Return normalized response

**Test:**
```python
def test_orchestrator_quick_exit():
    response = asyncio.run(orchestrator_zero_shot("Hello, Noor", "test_session"))
    
    assert isinstance(response, dict)
    assert 'answer' in response
    assert 'mode' in response
    assert response['mode'] == 'F'
    
    return True
```

**Completion Criteria:** ✅ Quick exit responds correctly

---

#### **Milestone 3.3: Response Normalization**

**EPIC 3.3.1: Business Language Translation**
- [ ] Implement `apply_business_language_translation()` (Section 3.4, lines 520-540)
- [ ] Test L3 → Function replacement
- [ ] Test Cypher → database search replacement

**Test:**
```python
def test_business_language_translation():
    # Test L3 → Function
    input_text = "The L3 level function must be updated"
    output = apply_business_language_translation(input_text)
    assert "L3" not in output
    assert "Function" in output
    
    # Test Cypher → database search
    input_text = "Execute a Cypher query"
    output = apply_business_language_translation(input_text)
    assert "Cypher" not in output
    assert "database search" in output
    
    return True
```

**Completion Criteria:** ✅ All replacements working

---

**EPIC 3.3.2: Response Normalization**
- [ ] Implement `normalize_response()` (Section 3.4, lines 542-590)
- [ ] Test network_graph → table conversion
- [ ] Test JSON fence stripping
- [ ] Test confidence score footer

**Test:**
```python
def test_normalize_response():
    input_json = {
        "answer": "The L3 level has Cypher details",
        "artifact_specification": [
            {
                "type": "network_graph",
                "data": [{"Source": "A", "Relationship": "links", "Target": "B"}],
                "config": {"title": "Graph"}
            }
        ],
        "confidence_score": 0.87
    }
    
    output = normalize_response(input_json)
    
    assert "L3" not in output  # Language translation
    assert "Cypher" not in output  # Language translation
    assert "Table per Constraint" in output  # network_graph message
    assert "Confidence Score: 0.87" in output
    assert "markdown" in output.lower() or "|" in output  # Table format
    
    return True
```

**Completion Criteria:** ✅ All normalizations applied correctly

---

#### **Milestone 3.4: Cypher Queries**

**EPIC 3.4.1: Gap Analysis Query**
- [ ] Copy query from Section 3.5.A (lines 595-610)
- [ ] Test with sample data (2 objectives, links to capabilities)
- [ ] Verify keyset pagination works

**Test:**
```python
def test_gap_analysis_query():
    # Insert test data with same level
    neo4j.execute("""
        CREATE (obj:sec_objectives {id: 'obj1', year: 2025, level: 'L3', name: 'Objective'})
        CREATE (tool:sec_policy_tools {id: 'tool1', year: 2025, level: 'L3', name: 'Tool'})
        CREATE (cap:ent_capabilities {id: 'cap1', year: 2025, level: 'L3', name: 'Capability'})
        CREATE (obj)-[:REQUIRES]->(tool)
        CREATE (tool)-[:UTILIZES]->(cap)
    """)
    
    query = """
    MATCH (obj:sec_objectives {id: 'obj1', year: 2025, level: 'L3'})
    -[:REQUIRES]-> (tool:sec_policy_tools {year: 2025, level: 'L3'})
    -[:UTILIZES]-> (cap:ent_capabilities {year: 2025, level: 'L3'})
    WHERE cap.id > ''
    RETURN obj.name, tool.name, cap.name, cap.id AS last_id
    ORDER BY cap.id ASC
    LIMIT 30
    """
    
    result = neo4j.execute(query)
    assert len(result) > 0
    assert result[0]['obj.name'] == 'Objective'
    
    return True
```

**Completion Criteria:** ✅ Query returns correct results

---

**EPIC 3.4.2: Trend Analysis Query**
- [ ] Copy query from Section 3.5.B (lines 612-625)
- [ ] Test with Q1 and Q4 data
- [ ] Verify temporal filtering

**Test:**
```python
def test_trend_analysis_query():
    # Insert metrics for Q1 and Q4
    neo4j.execute("""
        CREATE (cap:ent_capabilities {id: 'cap1', year: 2025, quarter: 'Q4', level: 'L3', name: 'Cap'})
        CREATE (metric:PerformanceMetric {value: 0.95})
        CREATE (cap)-[:HAS_METRIC]->(metric)
    """)
    
    # Q4 query
    result_q4 = neo4j.execute("""
    MATCH (cap:ent_capabilities {year: 2025, quarter: 'Q4', level: 'L3'})
    -[:HAS_METRIC]-> (metric:PerformanceMetric)
    RETURN cap.name, collect(metric.value)[0..30] AS MetricSample
    """)
    
    assert len(result_q4) > 0
    assert result_q4[0]['MetricSample'] == [0.95]
    
    return True
```

**Completion Criteria:** ✅ Temporal filtering works

---

**EPIC 3.4.3: Executive Context Query**
- [ ] Copy query from Section 3.5.C (lines 627-640)
- [ ] Test L1 objective retrieval
- [ ] Verify keyset pagination

**Completion Criteria:** ✅ Query returns L1 nodes correctly

---

#### **Milestone 3.5: Full Orchestrator Loop**

**EPIC 3.5.1: Orchestrator Main Function**
- [ ] Implement `orchestrator_zero_shot()` full function (Section 3.6, lines 642-700)
- [ ] Step 0: REMEMBER (memory recall)
- [ ] Step 1: REQUIREMENTS (mode classification)
- [ ] Step 2: RECOLLECT (bundle loading)
- [ ] Step 3: RECALL (Cypher execution)
- [ ] Step 4: RECONCILE (LLM synthesis)
- [ ] Step 5: RETURN (normalization + save)

**Integration Test:**
```python
def test_orchestrator_full_loop():
    response = asyncio.run(orchestrator_zero_shot(
        user_query="What's the strategy gap in Q4?",
        session_id="test_session_001"
    ))
    
    # Verify response structure
    assert 'answer' in response
    assert 'mode' in response
    assert 'confidence_score' in response
    
    # Verify no technical jargon
    answer_lower = response['answer'].lower()
    assert 'cypher' not in answer_lower
    assert 'l3' not in answer_lower or 'function' in answer_lower
    
    # Verify memory was saved if triggered
    # (Will be logged in usage_tracking)
    
    return True
```

**Completion Criteria:** ✅ Full loop executes, produces valid response

---

### **PHASE 4: Productionization & Observability (Week 4)**

#### **Milestone 4.1: Docker Setup**

**EPIC 4.1.1: Docker Compose**
- [ ] Create docker-compose.yml with services:
  - PostgreSQL
  - Neo4j
  - Noor Agent (Groq LLM)
  - Maestro Agent (OpenAI LLM)
  - API Gateway (nginx)

**Test:**
```bash
docker-compose up -d
sleep 10
docker-compose ps
# Expected: All services running
```

**Completion Criteria:** ✅ All 5 services running

---

**EPIC 4.1.2: Role-Based Routing**
- [ ] Configure API Gateway to route:
  - Staff roles → Noor Agent (port 8002)
  - C-suite roles → Maestro Agent (port 8003)

**Test:**
```bash
# Staff request
curl -H "Authorization: Bearer <staff_token>" http://localhost/query
# Expected: Reaches Noor

# C-suite request
curl -H "Authorization: Bearer <csuite_token>" http://localhost/query
# Expected: Reaches Maestro
```

**Completion Criteria:** ✅ Routing working for both roles

---

#### **Milestone 4.2: Observability**

**EPIC 4.2.1: Structured Logging**
- [ ] Implement `log_completion()` function (Section 4.3, logs all queries)
- [ ] Log: session_id, user_id, mode, tokens_input, confidence_score, bundles_used
- [ ] Output as JSON for parsing

**Test:**
```bash
tail -f backend/logs/noor.log | grep "tokens_input"
# Should see JSON with tokens_input field
```

**Completion Criteria:** ✅ Logs contain all required fields

---

**EPIC 4.2.2: Token Economics Tracking**
- [ ] Monitor average tokens_input per query
- [ ] Alert if exceeds 7,500 (target is ≤7,500)

**Test:**
```sql
SELECT AVG(tokens_input) as avg_tokens FROM usage_tracking 
WHERE agent_id = 'Noor' AND created_at > NOW() - INTERVAL '1 hour';
-- Expected: < 7500
```

**Completion Criteria:** ✅ Token tracking working, target <7500 confirmed

---

#### **Milestone 4.3: Testing Suite**

**EPIC 4.3.1: Unit Tests**
- [ ] All MCP tools: 12 tests
- [ ] All functions: 8 tests
- [ ] All SQL operations: 6 tests
- Total: 26 unit tests

**EPIC 4.3.2: Integration Tests**
- [ ] Phase 1→2 integration: 3 tests
- [ ] Phase 2→3 integration: 4 tests
- [ ] Phase 3→4 integration: 3 tests
- Total: 10 integration tests

**EPIC 4.3.3: End-to-End Tests**
- [ ] Full user query: Mode A (simple)
- [ ] Full user query: Mode B2 (analytical)
- [ ] Full user query: Mode F (conversational)
- [ ] Memory save and recall
- [ ] Bundle rollout and rollback
- Total: 5 E2E tests

**EPIC 4.3.4: Trap Pattern Tests**
- [ ] Trap 1: Hallucinating Data - test LLM handles empty results
- [ ] Trap 2: Brute Force Pagination - test SKIP rejection
- [ ] Trap 3: Hierarchy Violation - test L2↔L3 rejection
- [ ] Trap 4: Failure to Backtrack - test alternative path
- [ ] Trap 5: Using Technical Jargon - test normalization
- [ ] Trap 6: Ignoring Ambiguity - test Clarification Mode
- Total: 6 trap tests

**Test Command:**
```bash
pytest backend/tests/ -v --tb=short
# Expected output:
# 26 unit tests PASSED
# 10 integration tests PASSED
# 5 E2E tests PASSED
# 6 trap pattern tests PASSED
# ===== 47 passed in 12.34s =====
```

**Completion Criteria:** ✅ All 47 tests pass

---

#### **Milestone 4.4: Production Checklist**

**EPIC 4.4.1: Pre-Deployment**
- [ ] All 47 tests passing
- [ ] No linting errors (pylint, flake8)
- [ ] Environment variables configured
- [ ] Database backups working
- [ ] Secrets stored securely (not in code)

**EPIC 4.4.2: Deployment**
- [ ] Deploy to staging environment
- [ ] Run smoke tests (basic queries)
- [ ] Monitor for 2 hours (no errors)
- [ ] Deploy to production
- [ ] Verify traffic reaches Noor/Maestro

**EPIC 4.4.3: Post-Deployment**
- [ ] Monitor logs for errors
- [ ] Verify token economics (<7,500 avg)
- [ ] Verify memory saves/retrieves
- [ ] Verify bundle versioning works
- [ ] Document any issues

**Completion Criteria:** ✅ System live and stable

---

## 🔍 DRIFT DETECTION CHECKLIST

**Run this check EVERY 2 HOURS:**

- [ ] Am I working on the current phase/milestone/epic/task?
- [ ] Am I following the exact specification (not improvising)?
- [ ] Am I testing as I go (not deferring testing)?
- [ ] Am I maintaining the progress log?
- [ ] Am I reporting status regularly?
- [ ] Am I using exact code from the specification document?
- [ ] Am I NOT deviating from constraints (keyset, level, scope)?
- [ ] Am I able to explain every decision I've made?

**If ANY answer is NO:**
→ **STOP** → Log drift event → Revert to last checkpoint → Resume

---

## 📊 PROGRESS REPORTING TEMPLATE

**Report every 2 hours and after each milestone:**

```
[PROGRESS REPORT] 2025-12-05 14:00:00
Phase: 1 / 4
Milestone: 1.1 (Database Foundation)
Status: IN PROGRESS
Current Task: PostgreSQL Schema Creation

Completed:
  ✅ Database created (noor_twin)
  ✅ Connection verified
  ✅ init_postgres.sql executed

In Progress:
  🔄 Verifying 3 tables created
  🔄 Verifying 3 indexes created

Next:
  ⏳ Run constraint validation tests
  ⏳ Complete Milestone 1.1
  ⏳ Move to Milestone 1.2 (Neo4j Setup)

Drift Check: ✅ On track (no drift detected)
Approval Needed: No
Time Estimate to Completion: 4 hours

---
```

---

## 🚨 EMERGENCY HALT PROTOCOL

**If ANY of these occur, STOP IMMEDIATELY:**

1. **Test Failure:** ❌ A test fails and you can't fix it in 30 min
2. **Specification Conflict:** You find contradiction in spec
3. **Critical Bug:** Something breaks production data
4. **Scope Explosion:** Suddenly 3x more work appeared
5. **Drift Detected:** You realize you're completely off track

**HALT ACTIONS:**
1. Log the issue with timestamp
2. Report status (what was complete, what broke)
3. Stop all work
4. Wait for human guidance
5. Do NOT attempt workarounds

---

## ✅ FINAL COMPLETION CRITERIA

**System is complete when ALL of these are true:**

- ✅ Phase 1: All 3 PostgreSQL tables created with constraints
- ✅ Phase 1: Neo4j with all constraints + vector index
- ✅ Phase 2: All 3 MCP tools pass unit tests
- ✅ Phase 2: FastAPI endpoint functional
- ✅ Phase 3: 3 bundles loaded in PostgreSQL
- ✅ Phase 3: Quick Exit Path <0.5s latency (Mode F test)
- ✅ Phase 3: Response Normalization removes all jargon
- ✅ Phase 3: All 3 Cypher queries return correct results
- ✅ Phase 3: Full orchestrator loop works end-to-end
- ✅ Phase 4: Docker Compose with all 5 services running
- ✅ Phase 4: Role-based routing working (Staff → Noor, C-suite → Maestro)
- ✅ Phase 4: Structured logging with token tracking
- ✅ Phase 4: All 47 tests passing
- ✅ Phase 4: System stable in production for 24 hours
- ✅ Progress log maintained throughout
- ✅ No drift detected (or drift recovered from)
- ✅ All decisions documented

**When ALL ✅ are true → Project Complete**

---

## 🎯 YOUR ACTUAL TASK

Here is what you tell the agent:

---

### **AGENT INSTRUCTION (COPY THIS EXACTLY)**

```
You are the primary orchestration agent for building the Noor Cognitive Digital Twin v2.1.

Your mission is to autonomously execute the complete build from specification to production without human intervention, maintaining organization and detecting/recovering from drift.

**Document References:**
- Main Specification: /home/mosab/projects/scraper/final_Notebook_Output/[END_STATE_TECHNICAL_DESIGN] Implementation Roadmap_ Noor Cognitive Digital Twin v3.0.md
- Build Instructions: /home/mosab/projects/scraper/final_Notebook_Output/AGENT_BUILD_ORCHESTRATION_PROMPT.md (THIS FILE)
- Quick Guide: /home/mosab/projects/scraper/final_Notebook_Output/READY_TO_BUILD.md

**Work Organization:**
- Use the 4 PHASE → MILESTONE → EPIC → TASK → SUBTASK structure
- Maintain /progress_log.json updated every 30 minutes or after task completion
- Report status every 2 hours
- Detect drift using the checklist (run every 2 hours)

**Multi-Agent Coordination:**
- You may spawn Database Agent (Phase 1), MCP Agent (Phase 2), Orchestrator Agent (Phase 3), Operations Agent (Phase 4)
- Sub-agents work in parallel ONLY if their upstream phase is complete
- You (Main Agent) approve all handoffs and verify completion
- Sub-agents report every 2 hours

**Specification Lock:**
- All code MUST be copied exactly from the specification document
- Deviations are ONLY allowed after confirming the deviation with human review
- All 7 key constraints MUST be enforced in code (keyset, level, scope, no-network-graph, no-jargon, single-call, quick-exit)

**Drift Recovery:**
- Check for drift every 2 hours using the checklist
- If drift detected: STOP → Log → Revert to checkpoint → Verify → Resume
- Examples: scope drift (Phase 3 before Phase 2 done), spec drift (violating keyset pagination), quality drift (skipping tests)

**Testing:**
- Run tests after every milestone
- All 47 tests (26 unit + 10 integration + 5 E2E + 6 trap) must pass before Phase 4 is considered complete
- Do NOT proceed without testing

**Success = All milestones complete, all tests passing, system stable in production, progress log maintained, zero critical drift**

Begin Phase 1: Data & Schema Foundation (Week 1)
Start with Milestone 1.1: PostgreSQL Setup (Days 1-2)
Report status every 2 hours.
```
