#!/usr/bin/env python3
"""
Create fulltext search index and verify memory structure
"""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from neo4j import AsyncGraphDatabase

load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / ".env")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")


async def setup_and_test():
    """Setup fulltext index and test recall_memory"""
    
    driver = AsyncGraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
    )
    
    print("=" * 70)
    print("MEMORY STRUCTURE VERIFICATION")
    print("=" * 70)
    
    # Step 1: Create fulltext index if not exists
    print("\n[STEP 1] Creating fulltext search index...")
    
    async with driver.session() as session:
        try:
            # Drop existing if needed
            try:
                await session.run("DROP INDEX search IF EXISTS")
                print("  • Dropped existing 'search' index")
            except:
                pass
            
            # Create new index on Memory nodes
            await session.run("""
            CREATE FULLTEXT INDEX search IF NOT EXISTS 
            FOR (m:Memory) ON EACH [m.key, m.content, m.scope]
            """)
            print("  ✓ Created fulltext index 'search' on Memory nodes")
        except Exception as e:
            print(f"  ⚠ Index creation note: {e}")
    
    # Step 2: Verify Memory structure
    print("\n[STEP 2] Verifying Memory node structure...")
    
    async with driver.session() as session:
        # Check Memory nodes
        result = await session.run("""
        MATCH (m:Memory)
        RETURN m.scope as scope, count(m) as count
        ORDER BY scope
        """)
        
        records = await result.fetch(100)
        print(f"\n  Memory nodes by scope:")
        total = 0
        for record in records:
            print(f"    • {record['scope']}: {record['count']}")
            total += record['count']
        print(f"\n  Total Memory nodes: {total}")
    
    # Step 3: Show all Memory node details
    print("\n[STEP 3] All Memory nodes with structure:")
    
    async with driver.session() as session:
        result = await session.run("""
        MATCH (m:Memory)
        RETURN m.scope as scope, m.key as key, m.confidence as confidence, 
               m.content as content, m.created_at as created_at
        ORDER BY scope, key
        """)
        
        records = await result.fetch(100)
        
        scopes = {}
        for record in records:
            scope = record['scope']
            if scope not in scopes:
                scopes[scope] = []
            scopes[scope].append({
                'key': record['key'],
                'confidence': record['confidence'],
                'content': record['content'],
                'created_at': record['created_at']
            })
        
        for scope in sorted(scopes.keys()):
            print(f"\n  [{scope.upper()}] - {len(scopes[scope])} node(s):")
            for node in scopes[scope]:
                print(f"    ├─ key: {node['key']}")
                print(f"    ├─ confidence: {node['confidence']}")
                print(f"    ├─ content: {node['content'][:80]}...")
                print(f"    └─ created_at: {node['created_at']}")
    
    # Step 4: Test search functionality
    print("\n[STEP 4] Testing recall_memory functionality (fulltext search):")
    
    test_queries = [
        ("user preference", "personal"),
        ("risk analysis", "departmental"),
        ("digital transformation", "ministry"),
        ("classified", "secrets"),
    ]
    
    async with driver.session() as session:
        for query, expected_scope in test_queries:
            print(f"\n  Query: recall_memory(query_summary='{query}')")
            
            try:
                result = await session.run("""
                CALL db.index.fulltext.queryNodes('search', $query) YIELD node as m, score
                RETURN m.scope as scope, m.key as key, m.content as content, score
                LIMIT 3
                """, query=query)
                
                records = await result.fetch(10)
                
                if records:
                    for record in records:
                        print(f"    ✓ [{record['scope']}] {record['key']} (relevance: {record['score']:.2f})")
                        print(f"      → {record['content'][:70]}...")
                else:
                    print(f"    (no results)")
            except Exception as e:
                print(f"    ✗ Error: {e}")
    
    # Step 5: Show access control model
    print("\n[STEP 5] Access Control Model (enforced by MCP tool layer):")
    print("""
    The recall_memory() call structure:
    
      recall_memory(query_summary="<user query>")
    
    Returned scope-filtered based on user role:
      • personal:      User's own conversation history (user-scoped)
      • departmental:  Department-wide facts and patterns (department-scoped)
      • ministry:      Ministry strategic information (ministry-scoped)
      • secrets:       Classification data (admin role only)
    
    Access enforced by: MCP tool layer (search_memories tool)
    NOT by the LLM prompt
    """)
    
    await driver.close()
    
    print("\n" + "=" * 70)
    print("MEMORY STRUCTURE VERIFICATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(setup_and_test())
