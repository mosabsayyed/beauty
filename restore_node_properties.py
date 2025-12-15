#!/usr/bin/env python3
"""
Neo4j Property Recovery Script
Restores clean node properties from backup file to fix PDF contamination.
"""

import json
from neo4j import GraphDatabase

# Neo4j connection
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "password")  # UPDATE WITH YOUR CREDENTIALS

def load_clean_data(filepath):
    """Load clean node properties from backup JSON."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    # Build a map: node_id -> {name, description, status}
    clean_props = {}
    
    for row in data:
        # Source node
        if row['source_id']:
            clean_props[row['source_id']] = {
                'name': row['source_name'],
                'description': row['source_description'],
                'status': row['source_status']
            }
        
        # Target node
        if row['target_id']:
            clean_props[row['target_id']] = {
                'name': row['target_name'],
                'description': row['target_description'],
                'status': row['target_status']
            }
    
    return clean_props

def restore_properties(driver, clean_props):
    """Restore clean properties to Neo4j nodes."""
    
    with driver.session() as session:
        # First, count how many nodes we'll update
        count_query = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND elementId(n) IN $node_ids
        RETURN count(n) as total
        """
        
        result = session.run(count_query, node_ids=list(clean_props.keys()))
        total = result.single()['total']
        print(f"Will restore properties for {total} nodes...")
        
        # Batch update properties
        update_query = """
        UNWIND $updates as update
        MATCH (n)
        WHERE elementId(n) = update.id
        SET n.name = update.name,
            n.description = update.description,
            n.status = update.status
        RETURN count(n) as updated
        """
        
        # Prepare batch updates
        updates = [
            {'id': node_id, **props}
            for node_id, props in clean_props.items()
        ]
        
        # Run in batches of 1000
        batch_size = 1000
        total_updated = 0
        
        for i in range(0, len(updates), batch_size):
            batch = updates[i:i + batch_size]
            result = session.run(update_query, updates=batch)
            updated = result.single()['updated']
            total_updated += updated
            print(f"Updated {total_updated}/{len(updates)} nodes...")
        
        print(f"✅ Successfully restored properties for {total_updated} nodes!")

def verify_cleanup(driver):
    """Check for any remaining PDF contamination."""
    
    with driver.session() as session:
        verify_query = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND (
            toLower(n.name) CONTAINS 'vision' OR
            toLower(n.name) CONTAINS 'document' OR
            toLower(n.name) CONTAINS 'strategy' OR
            toLower(n.description) CONTAINS 'pdf'
        )
        RETURN count(n) as suspicious
        """
        
        result = session.run(verify_query)
        suspicious = result.single()['suspicious']
        
        if suspicious > 0:
            print(f"⚠️  Warning: Found {suspicious} nodes with potentially suspicious content")
            print("Run manual inspection to verify")
        else:
            print("✅ No suspicious content detected!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python restore_node_properties.py <path_to_clean_json>")
        print("Example: python restore_node_properties.py backend/app/api/routes/neo4j_query_table_data_2025-12-11.json")
        sys.exit(1)
    
    clean_file = sys.argv[1]
    
    print(f"Loading clean properties from {clean_file}...")
    clean_props = load_clean_data(clean_file)
    print(f"Loaded {len(clean_props)} unique node properties")
    
    print(f"\nConnecting to Neo4j at {URI}...")
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        print("✅ Connected to Neo4j")
        
        print("\nRestoring properties...")
        restore_properties(driver, clean_props)
        
        print("\nVerifying cleanup...")
        verify_cleanup(driver)
    
    print("\n🎉 Recovery complete!")
