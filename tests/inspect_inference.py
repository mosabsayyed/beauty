
import os
import sys
import json

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.neo4j_client import neo4j_client

def inspect_data():
    if not neo4j_client.connect():
        print("Failed to connect.")
        return

    labels = ["EntityProject", "EntityITSystem", "EntityProcess", "EntityOrgUnit"]
    
    print("--- Property Inspection ---")
    for label in labels:
        print(f"\nScanning {label}...")
        # Get properties of a few nodes, excluding the huge embedding array for display clarity
        query = f"""
        MATCH (n:{label}) 
        WHERE n.year IS NOT NULL 
        RETURN keys(n) as keys, n.name as name, n.description as desc, n.domain as domain, n.owner as owner, 
               size(n.embedding) as embedding_dim 
        LIMIT 3
        """
        results = neo4j_client.execute_query(query)
        
        if not results:
            print(f"  No nodes found for {label}")
            continue
            
        for r in results:
            print(f"  Name: {r['name']}")
            print(f"  Keys: {r['keys']}")
            print(f"  Domain: {r['domain']}")
            print(f"  Owner: {r['owner']}")
            print(f"  Embedding Dim: {r['embedding_dim']}") 
            print("  ---")

    neo4j_client.close()

if __name__ == "__main__":
    inspect_data()
