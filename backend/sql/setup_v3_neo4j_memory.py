#!/usr/bin/env python3
"""
NOOR COGNITIVE DIGITAL TWIN v3.0 - NEO4J MEMORY SCHEMA SETUP
Applies Memory node constraints and indexes to Neo4j Aura

Usage:
    python setup_v3_neo4j_memory.py
    
Requirements:
    - NEO4J_URI in .env (neo4j+s:// format)
    - NEO4J_USERNAME in .env (typically 'neo4j')
    - NEO4J_PASSWORD in .env
"""
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / ".env")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")


def get_driver():
    """Create Neo4j driver connection."""
    if not NEO4J_URI:
        raise ValueError("NEO4J_URI environment variable not set")
    if not NEO4J_PASSWORD:
        raise ValueError("NEO4J_PASSWORD environment variable not set")
    
    return GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
    )


def run_cypher(driver, cypher_statement: str, description: str = ""):
    """Execute a single Cypher statement."""
    with driver.session() as session:
        try:
            result = session.run(cypher_statement)
            summary = result.consume()
            print(f"  ✓ {description or cypher_statement[:60]}...")
            return True, summary
        except Exception as e:
            print(f"  ✗ {description or cypher_statement[:60]}... FAILED")
            print(f"    Error: {e}")
            return False, str(e)


def setup_digital_twin_constraints(driver):
    """Setup constraints for Digital Twin nodes (existing schema)."""
    print("\n[1/4] Setting up Digital Twin Node Constraints...")
    
    constraints = [
        # Sector nodes (sec_*)
        ("CREATE CONSTRAINT sec_objectives_key IF NOT EXISTS FOR (n:sec_objectives) REQUIRE (n.id, n.year) IS NODE KEY", "sec_objectives (id, year)"),
        ("CREATE CONSTRAINT sec_policy_tools_key IF NOT EXISTS FOR (n:sec_policy_tools) REQUIRE (n.id, n.year) IS NODE KEY", "sec_policy_tools (id, year)"),
        ("CREATE CONSTRAINT sec_performance_key IF NOT EXISTS FOR (n:sec_performance) REQUIRE (n.id, n.year) IS NODE KEY", "sec_performance (id, year)"),
        ("CREATE CONSTRAINT sec_citizens_key IF NOT EXISTS FOR (n:sec_citizens) REQUIRE (n.id, n.year) IS NODE KEY", "sec_citizens (id, year)"),
        ("CREATE CONSTRAINT sec_businesses_key IF NOT EXISTS FOR (n:sec_businesses) REQUIRE (n.id, n.year) IS NODE KEY", "sec_businesses (id, year)"),
        ("CREATE CONSTRAINT sec_gov_entities_key IF NOT EXISTS FOR (n:sec_gov_entities) REQUIRE (n.id, n.year) IS NODE KEY", "sec_gov_entities (id, year)"),
        ("CREATE CONSTRAINT sec_data_transactions_key IF NOT EXISTS FOR (n:sec_data_transactions) REQUIRE (n.id, n.year) IS NODE KEY", "sec_data_transactions (id, year)"),
        ("CREATE CONSTRAINT sec_admin_records_key IF NOT EXISTS FOR (n:sec_admin_records) REQUIRE (n.id, n.year) IS NODE KEY", "sec_admin_records (id, year)"),
        
        # Entity nodes (ent_*)
        ("CREATE CONSTRAINT ent_capabilities_key IF NOT EXISTS FOR (n:ent_capabilities) REQUIRE (n.id, n.year) IS NODE KEY", "ent_capabilities (id, year)"),
        ("CREATE CONSTRAINT ent_risks_key IF NOT EXISTS FOR (n:ent_risks) REQUIRE (n.id, n.year) IS NODE KEY", "ent_risks (id, year)"),
        ("CREATE CONSTRAINT ent_projects_key IF NOT EXISTS FOR (n:ent_projects) REQUIRE (n.id, n.year) IS NODE KEY", "ent_projects (id, year)"),
        ("CREATE CONSTRAINT ent_it_systems_key IF NOT EXISTS FOR (n:ent_it_systems) REQUIRE (n.id, n.year) IS NODE KEY", "ent_it_systems (id, year)"),
        ("CREATE CONSTRAINT ent_org_units_key IF NOT EXISTS FOR (n:ent_org_units) REQUIRE (n.id, n.year) IS NODE KEY", "ent_org_units (id, year)"),
        ("CREATE CONSTRAINT ent_processes_key IF NOT EXISTS FOR (n:ent_processes) REQUIRE (n.id, n.year) IS NODE KEY", "ent_processes (id, year)"),
        ("CREATE CONSTRAINT ent_change_adoption_key IF NOT EXISTS FOR (n:ent_change_adoption) REQUIRE (n.id, n.year) IS NODE KEY", "ent_change_adoption (id, year)"),
        ("CREATE CONSTRAINT ent_culture_health_key IF NOT EXISTS FOR (n:ent_culture_health) REQUIRE (n.id, n.year) IS NODE KEY", "ent_culture_health (id, year)"),
        ("CREATE CONSTRAINT ent_vendors_key IF NOT EXISTS FOR (n:ent_vendors) REQUIRE (n.id, n.year) IS NODE KEY", "ent_vendors (id, year)"),
    ]
    
    success_count = 0
    for cypher, description in constraints:
        success, _ = run_cypher(driver, cypher, description)
        if success:
            success_count += 1
    
    print(f"  Completed: {success_count}/{len(constraints)} constraints created")
    return success_count


def setup_memory_constraints(driver):
    """Setup Memory node constraint and indexes."""
    print("\n[2/4] Setting up Memory Node Constraints...")
    
    statements = [
        # Memory node unique constraint
        ("CREATE CONSTRAINT memory_scope_key IF NOT EXISTS FOR (m:Memory) REQUIRE (m.scope, m.key) IS UNIQUE", "Memory (scope, key) unique constraint"),
        
        # Indexes for fast lookups
        ("CREATE INDEX memory_scope_idx IF NOT EXISTS FOR (m:Memory) ON (m.scope)", "Memory scope index"),
        ("CREATE INDEX memory_confidence_idx IF NOT EXISTS FOR (m:Memory) ON (m.confidence)", "Memory confidence index"),
        ("CREATE INDEX memory_created_idx IF NOT EXISTS FOR (m:Memory) ON (m.created_at)", "Memory created_at index"),
    ]
    
    success_count = 0
    for cypher, description in statements:
        success, _ = run_cypher(driver, cypher, description)
        if success:
            success_count += 1
    
    print(f"  Completed: {success_count}/{len(statements)} Memory constraints/indexes")
    return success_count


def setup_vector_index(driver):
    """Attempt to create vector index for semantic search."""
    print("\n[3/4] Setting up Vector Index for Semantic Search...")
    
    # Vector index creation - Neo4j 5.11+ required
    vector_index_cypher = """
    CALL db.index.vector.createNodeIndex(
        'memory_semantic_index',
        'Memory',
        'embedding',
        1536,
        'cosine'
    )
    """
    
    # First check if the index already exists
    check_cypher = """
    SHOW INDEXES WHERE name = 'memory_semantic_index'
    """
    
    with driver.session() as session:
        try:
            result = session.run(check_cypher)
            existing = list(result)
            if existing:
                print("  ✓ memory_semantic_index already exists")
                return True
        except Exception:
            pass
    
    # Try to create the index
    success, result = run_cypher(driver, vector_index_cypher, "memory_semantic_index (1536 dims, cosine)")
    
    if not success:
        print("  ⚠ Vector index creation failed - may require Neo4j 5.11+ or Enterprise")
        print("    Fallback: Use application-layer similarity search with embeddings stored in 'embedding' property")
    
    return success


def create_test_memories(driver):
    """Create sample Memory nodes for testing."""
    print("\n[4/4] Creating Sample Memory Nodes...")
    
    memories = [
        {
            "scope": "personal",
            "key": "user_preference_level",
            "content": "User prefers L3 level analysis",
            "confidence": 0.95
        },
        {
            "scope": "departmental",
            "key": "q3_risk_analysis",
            "content": "Q3 2025 risk analysis indicated Level Mismatch gap between Project Output (L2) and Capability (L3)",
            "confidence": 0.88
        },
        {
            "scope": "global",
            "key": "institutional_context",
            "content": "Organization is in Phase 2 of digital transformation with focus on cloud migration",
            "confidence": 0.92
        }
    ]
    
    merge_cypher = """
    MERGE (m:Memory {scope: $scope, key: $key})
    SET m.content = $content,
        m.confidence = $confidence,
        m.created_at = datetime(),
        m.updated_at = datetime()
    RETURN m.key as key
    """
    
    success_count = 0
    with driver.session() as session:
        for memory in memories:
            try:
                result = session.run(merge_cypher, memory)
                result.consume()
                print(f"  ✓ Created Memory: {memory['scope']}/{memory['key']}")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Failed to create Memory: {memory['scope']}/{memory['key']}")
                print(f"    Error: {e}")
    
    print(f"  Completed: {success_count}/{len(memories)} sample memories")
    return success_count


def verify_setup(driver):
    """Verify the schema setup."""
    print("\n[VERIFICATION] Checking Schema...")
    
    # Check constraints
    with driver.session() as session:
        try:
            result = session.run("SHOW CONSTRAINTS")
            constraints = list(result)
            print(f"  Total constraints: {len(constraints)}")
            
            memory_constraints = [c for c in constraints if 'memory' in c['name'].lower()]
            print(f"  Memory constraints: {len(memory_constraints)}")
        except Exception as e:
            print(f"  ✗ Failed to check constraints: {e}")
    
    # Check indexes
    with driver.session() as session:
        try:
            result = session.run("SHOW INDEXES")
            indexes = list(result)
            print(f"  Total indexes: {len(indexes)}")
            
            memory_indexes = [i for i in indexes if 'memory' in i['name'].lower()]
            print(f"  Memory indexes: {len(memory_indexes)}")
        except Exception as e:
            print(f"  ✗ Failed to check indexes: {e}")
    
    # Count memories by scope
    with driver.session() as session:
        try:
            result = session.run("MATCH (m:Memory) RETURN m.scope as scope, count(m) as count ORDER BY scope")
            counts = list(result)
            if counts:
                print("  Memory nodes by scope:")
                for record in counts:
                    print(f"    {record['scope']}: {record['count']}")
            else:
                print("  No Memory nodes found")
        except Exception as e:
            print(f"  ✗ Failed to count memories: {e}")


def main():
    """Main setup function."""
    print("=" * 60)
    print("NOOR COGNITIVE DIGITAL TWIN v3.0 - NEO4J MEMORY SCHEMA SETUP")
    print("=" * 60)
    
    print(f"\nTarget: {NEO4J_URI}")
    print(f"User: {NEO4J_USERNAME}")
    
    try:
        driver = get_driver()
        
        # Verify connection
        print("\nVerifying connection...")
        with driver.session() as session:
            result = session.run("RETURN 1 as connected")
            result.consume()
            print("  ✓ Connected to Neo4j Aura")
        
        # Run setup steps
        setup_digital_twin_constraints(driver)
        setup_memory_constraints(driver)
        setup_vector_index(driver)
        create_test_memories(driver)
        
        # Verify
        verify_setup(driver)
        
        print("\n" + "=" * 60)
        print("NEO4J MEMORY SCHEMA SETUP COMPLETE")
        print("=" * 60)
        
        driver.close()
        
    except Exception as e:
        print(f"\n✗ SETUP FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
