#!/usr/bin/env python3
"""
Inspect actual Supabase and Neo4j schemas to ground DATA_ARCHITECTURE.md
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.db.supabase_client import supabase_client
from app.db.neo4j_client import neo4j_client

async def inspect_supabase():
    """Get actual Supabase tables and schemas."""
    print("\n" + "="*80)
    print("SUPABASE INSPECTION")
    print("="*80)
    
    await supabase_client.connect()
    
    # Get all tables by querying information_schema
    try:
        # Query to get all user tables
        tables_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        """
        
        # We need to use raw SQL for this - let's try a different approach
        # Let's just check the tables we know about from the code
        
        known_tables = [
            "users",
            "conversations", 
            "messages",
            "instruction_elements",
            "memory_collection",
            "temp_quarterly_dashboard_data",
            "temp_quarterly_outcomes_data",
            "temp_investment_initiatives"
        ]
        
        print("\n📊 Checking known tables...")
        for table in known_tables:
            try:
                count = await supabase_client.table_count(table)
                print(f"✅ {table}: {count} rows")
                
                # Get sample row to see schema
                sample = await supabase_client.table_select(table, "*", limit=1)
                if sample:
                    print(f"   Columns: {', '.join(sample[0].keys())}")
            except Exception as e:
                print(f"❌ {table}: {str(e)}")
        
        # Get detailed schema for key tables
        print("\n📋 Detailed Schemas:")
        
        for table in ["users", "conversations", "messages", "instruction_elements", "memory_collection"]:
            try:
                sample = await supabase_client.table_select(table, "*", limit=1)
                if sample and len(sample) > 0:
                    print(f"\n{table.upper()}:")
                    for key, value in sample[0].items():
                        type_str = type(value).__name__
                        print(f"  - {key}: {type_str}")
            except Exception as e:
                print(f"  Error: {e}")
                
    except Exception as e:
        print(f"Error inspecting Supabase: {e}")
    
    await supabase_client.disconnect()

def inspect_neo4j():
    """Get actual Neo4j schema."""
    print("\n" + "="*80)
    print("NEO4J INSPECTION")
    print("="*80)
    
    if not neo4j_client.connect():
        print("❌ Neo4j connection failed")
        return
    
    try:
        # Get all node labels
        print("\n🏷️  Node Labels:")
        labels_query = "CALL db.labels()"
        labels = neo4j_client.execute_query(labels_query)
        for label in labels:
            label_name = label['label']
            
            # Count nodes with this label
            count_query = f"MATCH (n:{label_name}) RETURN count(n) as count"
            count_result = neo4j_client.execute_query(count_query)
            count = count_result[0]['count'] if count_result else 0
            
            print(f"  {label_name}: {count} nodes")
            
            # Get sample properties
            if count > 0:
                sample_query = f"MATCH (n:{label_name}) RETURN properties(n) as props LIMIT 1"
                sample = neo4j_client.execute_query(sample_query)
                if sample:
                    props = sample[0]['props']
                    print(f"    Properties: {', '.join(props.keys())}")
        
        # Get all relationship types
        print("\n🔗 Relationship Types:")
        rel_query = "CALL db.relationshipTypes()"
        rels = neo4j_client.execute_query(rel_query)
        for rel in rels:
            rel_type = rel['relationshipType']
            
            # Count relationships
            count_query = f"MATCH ()-[r:{rel_type}]->() RETURN count(r) as count"
            count_result = neo4j_client.execute_query(count_query)
            count = count_result[0]['count'] if count_result else 0
            
            print(f"  {rel_type}: {count} relationships")
            
            # Get sample with source and target
            if count > 0:
                sample_query = f"""
                MATCH (a)-[r:{rel_type}]->(b) 
                RETURN labels(a)[0] as from_label, labels(b)[0] as to_label, 
                       keys(r) as rel_props
                LIMIT 1
                """
                sample = neo4j_client.execute_query(sample_query)
                if sample:
                    s = sample[0]
                    props_str = ', '.join(s['rel_props']) if s['rel_props'] else 'none'
                    print(f"    Pattern: ({s['from_label']})-[:{rel_type}]->({s['to_label']})")
                    print(f"    Properties: {props_str}")
        
        # Get database stats
        print("\n📈 Database Statistics:")
        stats_query = """
        MATCH (n)
        RETURN count(n) as total_nodes
        """
        stats = neo4j_client.execute_query(stats_query)
        print(f"  Total nodes: {stats[0]['total_nodes']}")
        
        stats_query = """
        MATCH ()-[r]->()
        RETURN count(r) as total_relationships
        """
        stats = neo4j_client.execute_query(stats_query)
        print(f"  Total relationships: {stats[0]['total_relationships']}")
        
    except Exception as e:
        print(f"Error inspecting Neo4j: {e}")
        import traceback
        traceback.print_exc()
    
    neo4j_client.disconnect()

async def main():
    """Run all inspections."""
    print("\n🔍 DATABASE INSPECTION REPORT")
    print("Generated:", "December 17, 2025")
    
    await inspect_supabase()
    inspect_neo4j()
    
    print("\n" + "="*80)
    print("INSPECTION COMPLETE")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
