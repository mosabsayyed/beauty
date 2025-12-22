from app.db.neo4j_client import neo4j_client
import json

def inspect_schema():
    if not neo4j_client.connect():
        print("Failed to connect to Neo4j")
        return
    
    try:
        rel_types = neo4j_client.execute_query('CALL db.relationshipTypes()')
        labels = neo4j_client.execute_query('CALL db.labels()')
        
        print("=== Relationship Types ===")
        print(json.dumps(rel_types, indent=2))
        
        print("\n=== Node Labels ===")
        print(json.dumps(labels, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        neo4j_client.disconnect()

if __name__ == "__main__":
    inspect_schema()
