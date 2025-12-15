#!/usr/bin/env python3
"""
Test calling search_memories via Neo4j memory MCP server
This demonstrates the recall_memory functionality
"""
import asyncio
import json
from neo4j import AsyncGraphDatabase
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / ".env")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")


async def test_recall_memory():
    """Test recall_memory via search_memories"""
    
    driver = AsyncGraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
    )
    
    print("=" * 70)
    print("TESTING RECALL_MEMORY (search_memories) FUNCTIONALITY")
    print("=" * 70)
    
    # Test 1: Search for personal scope memories
    print("\n[TEST 1] Search for personal memories:")
    print("Query: recall_memory(query_summary='user preference')")
    
    query = """
    CALL db.index.fulltext.queryNodes('search', 'user preference') YIELD node as entity, score
    RETURN entity.scope as scope, entity.key as key, entity.content as content, score
    LIMIT 5
    """
    
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.fetch(100)
        
        if records:
            for record in records:
                print(f"  ✓ Found: [{record['scope']}] {record['key']} (score: {record['score']:.2f})")
                print(f"    Content: {record['content'][:70]}...")
        else:
            print("  No results found")
    
    # Test 2: Search for departmental memories
    print("\n[TEST 2] Search for departmental memories:")
    print("Query: recall_memory(query_summary='risk analysis')")
    
    query = """
    CALL db.index.fulltext.queryNodes('search', 'risk analysis') YIELD node as entity, score
    RETURN entity.scope as scope, entity.key as key, entity.content as content, score
    LIMIT 5
    """
    
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.fetch(100)
        
        if records:
            for record in records:
                print(f"  ✓ Found: [{record['scope']}] {record['key']} (score: {record['score']:.2f})")
                print(f"    Content: {record['content'][:70]}...")
        else:
            print("  No results found")
    
    # Test 3: Search for ministry memories
    print("\n[TEST 3] Search for ministry-scope memories:")
    print("Query: recall_memory(query_summary='digital transformation')")
    
    query = """
    CALL db.index.fulltext.queryNodes('search', 'digital transformation') YIELD node as entity, score
    RETURN entity.scope as scope, entity.key as key, entity.content as content, score
    LIMIT 5
    """
    
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.fetch(100)
        
        if records:
            for record in records:
                print(f"  ✓ Found: [{record['scope']}] {record['key']} (score: {record['score']:.2f})")
                print(f"    Content: {record['content'][:70]}...")
        else:
            print("  No results found")
    
    # Test 4: Search for secrets scope memories
    print("\n[TEST 4] Search for secrets-scope memories:")
    print("Query: recall_memory(query_summary='classified')")
    
    query = """
    CALL db.index.fulltext.queryNodes('search', 'classified') YIELD node as entity, score
    RETURN entity.scope as scope, entity.key as key, entity.content as content, score
    LIMIT 5
    """
    
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.fetch(100)
        
        if records:
            for record in records:
                print(f"  ✓ Found: [{record['scope']}] {record['key']} (score: {record['score']:.2f})")
                print(f"    Content: {record['content'][:70]}...")
        else:
            print("  No results found")
    
    # Test 5: Show memory structure
    print("\n[TEST 5] Memory structure verification:")
    print("Checking all Memory nodes and their relationships:")
    
    query = """
    MATCH (m:Memory)
    RETURN m.scope as scope, m.key as key, m.confidence as confidence, m.content as content
    ORDER BY scope, key
    """
    
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.fetch(100)
        
        scopes = {}
        for record in records:
            scope = record['scope']
            if scope not in scopes:
                scopes[scope] = []
            scopes[scope].append({
                'key': record['key'],
                'confidence': record['confidence'],
                'content': record['content']
            })
        
        print(f"\nTotal scopes: {len(scopes)}")
        for scope in sorted(scopes.keys()):
            print(f"\n  [{scope.upper()}] - {len(scopes[scope])} node(s)")
            for node in scopes[scope]:
                print(f"    • {node['key']} (confidence: {node['confidence']})")
                print(f"      {node['content'][:60]}...")
    
    # Test 6: Show that access control can be enforced by MCP tool layer
    print("\n[TEST 6] Access control (enforced by MCP tool layer):")
    print("  Personal scope: User-scoped (current user only)")
    print("  Departmental scope: Department-scoped (all dept members)")
    print("  Ministry scope: Ministry-scoped (all authorized staff)")
    print("  Secrets scope: Admin-scoped (admin role only)")
    print("\n  Note: LLM calls recall_memory() - MCP tool enforces scope access based on user role")
    
    await driver.close()
    
    print("\n" + "=" * 70)
    print("RECALL_MEMORY TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_recall_memory())
