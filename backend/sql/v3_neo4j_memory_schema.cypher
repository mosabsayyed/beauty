// =====================================================
// NOOR COGNITIVE DIGITAL TWIN v3.0 - NEO4J MEMORY SCHEMA
// Adds Hierarchical Memory support (4 tiers: personal, departmental, global, csuite)
// Date: 2025-12-05
// Target: Neo4j Aura instance (remote)
// =====================================================
// =====================================================
// 1. DIGITAL TWIN NODE CONSTRAINTS (Universal Design Principles)
// All core nodes require (id, year) composite key
// =====================================================
// Sector nodes (sec_*)
CREATE CONSTRAINT sec_objectives_key IF NOT EXISTS
FOR (n:sec_objectives)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_policy_tools_key IF NOT EXISTS
FOR (n:sec_policy_tools)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_performance_key IF NOT EXISTS
FOR (n:sec_performance)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_citizens_key IF NOT EXISTS
FOR (n:sec_citizens)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_businesses_key IF NOT EXISTS
FOR (n:sec_businesses)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_gov_entities_key IF NOT EXISTS
FOR (n:sec_gov_entities)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_data_transactions_key IF NOT EXISTS
FOR (n:sec_data_transactions)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT sec_admin_records_key IF NOT EXISTS
FOR (n:sec_admin_records)
REQUIRE (n.id, n.year) IS NODE KEY;

// Entity nodes (ent_*)
CREATE CONSTRAINT ent_capabilities_key IF NOT EXISTS
FOR (n:ent_capabilities)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_risks_key IF NOT EXISTS
FOR (n:ent_risks)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_projects_key IF NOT EXISTS
FOR (n:ent_projects)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_it_systems_key IF NOT EXISTS
FOR (n:ent_it_systems)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_org_units_key IF NOT EXISTS
FOR (n:ent_org_units)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_processes_key IF NOT EXISTS
FOR (n:ent_processes)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_change_adoption_key IF NOT EXISTS
FOR (n:ent_change_adoption)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_culture_health_key IF NOT EXISTS
FOR (n:ent_culture_health)
REQUIRE (n.id, n.year) IS NODE KEY;
CREATE CONSTRAINT ent_vendors_key IF NOT EXISTS
FOR (n:ent_vendors)
REQUIRE (n.id, n.year) IS NODE KEY;

// =====================================================
// 2. HIERARCHICAL MEMORY NODE SPECIFICATION
// Used for Step 0: REMEMBER and Step 5: RETURN
// =====================================================

// Memory node constraint - (scope, key) must be unique
CREATE CONSTRAINT memory_scope_key IF NOT EXISTS
FOR (m:Memory)
REQUIRE (m.scope, m.key) IS UNIQUE;

// Index on memory scope for fast tier-based filtering
CREATE INDEX memory_scope_idx IF NOT EXISTS
FOR (m:Memory)
ON (m.scope);

// Index on memory confidence for retrieval quality filtering
CREATE INDEX memory_confidence_idx IF NOT EXISTS
FOR (m:Memory)
ON (m.confidence);

// Index on memory created_at for temporal queries
CREATE INDEX memory_created_idx IF NOT EXISTS
FOR (m:Memory)
ON (m.created_at);

// =====================================================
// 3. VECTOR INDEX FOR SEMANTIC SEARCH
// Required for Step 0: REMEMBER (recall_memory tool)
// =====================================================

// Note: Vector index creation in Neo4j Aura requires Enterprise edition
// The index will enable semantic similarity search via:
// CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding)

// Create vector index on Memory.embedding (1536 dimensions for OpenAI text-embedding-3-small)
// Run this separately if your Neo4j version supports it:
// CALL db.index.vector.createNodeIndex(
//   'memory_semantic_index',
//   'Memory',
//   'embedding',
//   1536,
//   'cosine'
// );

// =====================================================
// 4. SAMPLE MEMORY NODES FOR TESTING
// Remove these in production
// =====================================================

// Create test memory nodes
MERGE (m1:Memory {scope: 'personal', key: 'user_preference_level'})
SET
  m1.content = 'User prefers L3 level analysis',
  m1.confidence = 0.95,
  m1.created_at = datetime(),
  m1.updated_at = datetime();

MERGE (m2:Memory {scope: 'departmental', key: 'q3_risk_analysis'})
SET
  m2.content =
    'Q3 2025 risk analysis indicated Level Mismatch gap between Project Output (L2) and Capability (L3)',
  m2.confidence = 0.88,
  m2.created_at = datetime(),
  m2.updated_at = datetime();

MERGE (m3:Memory {scope: 'global', key: 'institutional_context'})
SET
  m3.content =
    'Organization is in Phase 2 of digital transformation with focus on cloud migration',
  m3.confidence = 0.92,
  m3.created_at = datetime(),
  m3.updated_at = datetime();

// =====================================================
// 5. VERIFICATION QUERIES
// =====================================================

// Verify Memory constraint:
// SHOW CONSTRAINTS WHERE name CONTAINS 'memory';

// Verify Memory indexes:
// SHOW INDEXES WHERE name CONTAINS 'memory';

// Count Memory nodes by scope:
// MATCH (m:Memory) RETURN m.scope, count(m) ORDER BY m.scope;

// Test scope filtering:
// MATCH (m:Memory) WHERE m.scope IN ['personal', 'departmental'] RETURN m.key, m.scope, m.confidence;

// =====================================================
// NOTES
// =====================================================
//
// Memory Tier Access Control (enforced by MCP tools, not Neo4j):
// - personal:     Noor R/W, Maestro R/W
// - departmental: Noor R/O, Maestro R/W (Curates)
// - global:       Noor R/O, Maestro R/W (Curates)
// - csuite:       Noor NO ACCESS, Maestro R/W (Exclusive)
//
// Vector index requires Neo4j 5.11+ for native vector search
// Alternative: Use OpenAI embeddings stored in 'embedding' property
// and compute similarity in application layer