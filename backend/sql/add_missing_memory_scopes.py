#!/usr/bin/env python3
"""
Add missing memory scopes (ministry, secrets) to Neo4j
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from neo4j import GraphDatabase

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


def add_memory_scopes():
    """Add missing memory nodes for ministry and secrets scopes."""
    driver = get_driver()
    
    print("Adding missing memory scopes (ministry, secrets)...\n")
    
    memories = [
        {
            "scope": "ministry",
            "key": "digital_transformation_strategy",
            "content": "Ministry is in Phase 2 of digital transformation with focus on cloud migration and AI integration",
            "confidence": 0.92
        },
        {
            "scope": "secrets",
            "key": "classified_budget_allocation",
            "content": "Admin-scoped classification: Restricted budget data for sensitive projects",
            "confidence": 0.99
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
    
    # Verify all 4 scopes
    print("\n[VERIFICATION] Memory scopes:")
    with driver.session() as session:
        result = session.run("MATCH (m:Memory) RETURN m.scope as scope, count(m) as count ORDER BY scope")
        for record in result:
            print(f"  {record['scope']}: {record['count']}")
    
    driver.close()
    print(f"\nCompleted: {success_count}/2 missing scopes added")


if __name__ == "__main__":
    add_memory_scopes()
