#!/usr/bin/env python3
"""
Relabel PDF-generated nodes from Entity/Sector to KSAStrategy labels.
This keeps the data but separates it from transformation graph.
"""

from neo4j import GraphDatabase

URI = "neo4j+s://097a9e5c.databases.neo4j.io"
AUTH = ("neo4j", "kHRlxPU_u-sRldkXtqM9YRCmue1Yu841zKYvwYI0H6s")

def relabel_pdf_nodes(driver, dry_run=True):
    """Relabel PDF nodes from Entity/Sector to KSAStrategy."""
    
    with driver.session() as session:
        # Find nodes that are PDF-generated (missing Supabase id/year)
        find_query = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND (n.id IS NULL OR n.year IS NULL)
        RETURN elementId(n) as nodeId, labels(n) as currentLabels, n.name as name
        LIMIT 5
        """
        
        result = session.run(find_query)
        nodes = list(result)
        
        if not nodes:
            print("No PDF nodes found!")
            return
        
        print(f"Found {len(nodes)} PDF nodes to relabel:\n")
        for node in nodes:
            print(f"  - {node['name']} ({node['currentLabels'][0]})")
        
        if dry_run:
            print("\n[DRY RUN] Would relabel these to 'KSAStrategy'")
            print("Run with dry_run=False to actually relabel")
            return
        
        # Actually relabel
        relabel_query = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        AND (n.id IS NULL OR n.year IS NULL)
        WITH n, labels(n) as oldLabels
        REMOVE n:EntityCapability:EntityChangeAdoption:EntityCultureHealth:EntityITSystem:EntityOrgUnit:EntityProcess:EntityProject:EntityRisk:EntityVendor:SectorAdminRecord:SectorBusiness:SectorCitizen:SectorDataTransaction:SectorGovEntity:SectorObjective:SectorPerformance:SectorPolicyTool
        SET n:KSAStrategy
        RETURN count(n) as relabeled, collect(oldLabels[0])[0..5] as sampleOldLabels
        """
        
        result = session.run(relabel_query)
        stats = result.single()
        
        print(f"\n✅ Relabeled {stats['relabeled']} nodes from {stats['sampleOldLabels']} to 'KSAStrategy'")

def verify_separation(driver):
    """Verify PDF nodes are now separate from transformation data."""
    
    with driver.session() as session:
        # Count Entity/Sector nodes (should be Supabase only now)
        entity_count = """
        MATCH (n)
        WHERE ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
        RETURN count(n) as count
        """
        
        result = session.run(entity_count)
        entity_total = result.single()['count']
        
        # Count KSAStrategy nodes (should be PDF nodes)
        doc_count = """
        MATCH (n:KSAStrategy)
        RETURN count(n) as count
        """
        
        result = session.run(doc_count)
        doc_total = result.single()['count']
        
        print(f"\nVerification:")
        print(f"  Entity/Sector nodes (transformation data): {entity_total}")
        print(f"  KSAStrategy nodes (PDF data): {doc_total}")

if __name__ == "__main__":
    import sys
    
    dry_run = True if len(sys.argv) < 2 or sys.argv[1] != '--execute' else False
    
    print("Connecting to Neo4j...")
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        print("✅ Connected\n")
        
        relabel_pdf_nodes(driver, dry_run=dry_run)
        
        if not dry_run:
            verify_separation(driver)
    
    if dry_run:
        print("\n" + "="*60)
        print("To actually relabel, run:")
        print("  python relabel_pdf_nodes.py --execute")
        print("="*60)
