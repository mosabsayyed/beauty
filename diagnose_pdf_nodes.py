#!/usr/bin/env python3
"""
Diagnostic script to identify PDF-contaminated nodes vs legitimate Supabase nodes in Neo4j.
"""

from neo4j import GraphDatabase

URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "password")  # UPDATE WITH YOUR CREDENTIALS

def diagnose_nodes(driver):
    """Identify PDF vs Supabase nodes based on property patterns."""
    
    with driver.session() as session:
        # Query 1: Check for nodes WITHOUT Supabase ID property
        print("=" * 60)
        print("NODES WITHOUT SUPABASE 'id' PROPERTY (Likely PDF nodes)")
        print("=" * 60)
        
        query_no_id = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND n.id IS NULL
        RETURN labels(n)[0] as type, n.name as name, keys(n) as properties, count(*) as count
        ORDER BY count DESC
        LIMIT 20
        """
        
        result = session.run(query_no_id)
        for record in result:
            print(f"{record['type']}: {record['name']} | Properties: {record['properties']}")
        
        # Query 2: Count total nodes with vs without Supabase properties
        print("\n" + "=" * 60)
        print("STATISTICS")
        print("=" * 60)
        
        stats_query = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        WITH n,
             CASE WHEN n.id IS NOT NULL AND n.year IS NOT NULL THEN 'Supabase' ELSE 'PDF' END as source
        RETURN source, count(n) as count
        """
        
        result = session.run(stats_query)
        for record in result:
            print(f"{record['source']}: {record['count']} nodes")
        
        # Query 3: Sample of each type
        print("\n" + "=" * 60)
        print("SAMPLE SUPABASE NODES (should have id, year, etc.)")
        print("=" * 60)
        
        sample_supabase = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND n.id IS NOT NULL AND n.year IS NOT NULL
        RETURN labels(n)[0] as type, n.name as name, n.id as id, n.year as year
        LIMIT 5
        """
        
        result = session.run(sample_supabase)
        for record in result:
            print(f"{record['type']}: {record['name']} (id={record['id']}, year={record['year']})")
        
        print("\n" + "=" * 60)
        print("SAMPLE PDF NODES (missing id/year)")
        print("=" * 60)
        
        sample_pdf = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND (n.id IS NULL OR n.year IS NULL)
        RETURN labels(n)[0] as type, n.name as name, keys(n) as properties
        LIMIT 10
        """
        
        result = session.run(sample_pdf)
        for record in result:
            print(f"{record['type']}: {record['name']} | Properties: {record['properties']}")

if __name__ == "__main__":
    print("Connecting to Neo4j...")
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        print("✅ Connected\n")
        diagnose_nodes(driver)
    
    print("\n" + "=" * 60)
    print("RECOMMENDATION")
    print("=" * 60)
    print("If PDF nodes are confirmed, delete them with:")
    print("""
    MATCH (n)
    WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
    AND (n.id IS NULL OR n.year IS NULL)
    DETACH DELETE n
    """)
