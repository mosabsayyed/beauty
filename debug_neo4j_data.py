import os
import sys

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.db.neo4j_client import neo4j_client

def debug_data():
    if not neo4j_client.connect():
        print("Failed to connect to Neo4j")
        return

    print("Connected to Neo4j")
    
    # 1. Check Year Properties
    print("\n--- Checking Year Properties ---")
    query_year = """
    MATCH (n) 
    WHERE n.year IS NOT NULL OR n.Year IS NOT NULL 
    RETURN count(n) as nodesWithYear, 
           min(COALESCE(n.year, n.Year)) as minYear, 
           max(COALESCE(n.year, n.Year)) as maxYear
    """
    res_year = neo4j_client.execute_query(query_year)
    print(f"Nodes with Year: {res_year}")

    # 2. Check Node Counts by Label
    print("\n--- Node Counts by Label ---")
    query_labels = """
    MATCH (n)
    RETURN labels(n)[0] as label, count(n) as count
    ORDER BY count DESC
    LIMIT 20
    """
    res_labels = neo4j_client.execute_query(query_labels)
    for r in res_labels:
        print(f"{r['label']}: {r['count']}")

    # 3. Sample Node Properties
    print("\n--- Sample Node Properties (SectorObjective) ---")
    query_sample = """
    MATCH (n:SectorObjective)
    RETURN properties(n) as props
    LIMIT 1
    """
    res_sample = neo4j_client.execute_query(query_sample)
    if res_sample:
        print(f"Sample SectorObjective: {res_sample[0]['props']}")
    else:
        print("No SectorObjective found.")

    neo4j_client.close()

if __name__ == "__main__":
    debug_data()
