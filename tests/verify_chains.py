
import os
import sys

# Add backend directory to python path so 'app' is a top-level module
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.neo4j_client import neo4j_client

# Define the queries from our artifact
QUERIES = {
    "1_SectorOps": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (tool:SectorPolicyTool {year: $year})
  -[:REFERS_TO]-> (record:SectorAdminRecord {year: $year})
  -[:APPLIED_ON]-> (stakeholder)
  -[:TRIGGERS_EVENT]-> (txn:SectorDataTransaction {year: $year})
  -[:MEASURED_BY]-> (perf:SectorPerformance {year: $year})
  -[:AGGREGATES_TO]-> (obj)
WHERE (stakeholder:SectorBusiness OR stakeholder:SectorGovEntity OR stakeholder:SectorCitizen)
  AND stakeholder.year = $year
RETURN path
    """,
    "2_StrategyToTactics_Priority": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (tool:SectorPolicyTool {year: $year})
  -[:SETS_PRIORITIES]-> (cap:EntityCapability {year: $year})
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
  -[:GAPS_SCOPE]-> (proj:EntityProject {year: $year})
  -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption {year: $year})
WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
  AND gap_layer.year = $year
RETURN path
    """,
    "3_StrategyToTactics_Targets": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:CASCADED_VIA]-> (perf:SectorPerformance {year: $year})
  -[:SETS_TARGETS]-> (cap:EntityCapability {year: $year})
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
  -[:GAPS_SCOPE]-> (proj:EntityProject {year: $year})
  -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption {year: $year})
WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
  AND gap_layer.year = $year
RETURN path
    """,
    "4_TacticalToStrategy": """
MATCH path = (adopt:EntityChangeAdoption {id: $id, year: $year})
  -[:INCREASE_ADOPTION]-> (proj:EntityProject {year: $year})
  -[:CLOSE_GAPS]-> (ops_layer)
  -[:OPERATES]-> (cap:EntityCapability {year: $year})
  -[:REPORTS|EXECUTES]-> (strategic_layer)
  -[:AGGREGATES_TO|GOVERNED_BY]-> (obj:SectorObjective {year: $year})
WHERE (ops_layer:EntityOrgUnit OR ops_layer:EntityProcess OR ops_layer:EntityITSystem)
  AND ops_layer.year = $year
  AND (
    (strategic_layer:SectorPerformance AND (cap)-[:REPORTS]->(strategic_layer) AND (strategic_layer)-[:AGGREGATES_TO]->(obj))
    OR
    (strategic_layer:SectorPolicyTool AND (cap)-[:EXECUTES]->(strategic_layer) AND (strategic_layer)-[:GOVERNED_BY]->(obj))
  )
RETURN path
    """,
    "5_RiskBuildMode": """
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (tool:SectorPolicyTool {year: $year})
RETURN path
    """,
    "6_RiskOperateMode": """
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (perf:SectorPerformance {year: $year})
RETURN path
    """,
    "7_InternalEfficiency": """
MATCH path = (cult:EntityCultureHealth {id: $id, year: $year})
  -[:MONITORS_FOR]-> (org:EntityOrgUnit {year: $year})
  -[:APPLY]-> (proc:EntityProcess {year: $year})
  -[:AUTOMATION]-> (sys:EntityITSystem {year: $year})
  -[:DEPENDS_ON]-> (vend:EntityVendor {year: $year})
RETURN path
    """
}

def get_random_nodes(label, limit=5):
    query = f"MATCH (n:{label}) WHERE n.id IS NOT NULL AND n.year IS NOT NULL RETURN n.id as id, n.year as year LIMIT {limit}"
    result = neo4j_client.execute_query(query)
    return [(r['id'], r['year']) for r in result] if result else []

def check_relationship_counts():
    print("\n--- Relationship Existence Check ---")
    rels = [
        "REALIZED_VIA", "REFERS_TO", "APPLIED_ON", "TRIGGERS_EVENT", "MEASURED_BY", "AGGREGATES_TO",
        "SETS_PRIORITIES", "ROLE_GAPS", "KNOWLEDGE_GAPS", "AUTOMATION_GAPS", "GAPS_SCOPE", "ADOPTION_RISKS",
        "CASCADED_VIA", "SETS_TARGETS", "INCREASE_ADOPTION", "CLOSE_GAPS", "OPERATES", "REPORTS", "EXECUTES", "GOVERNED_BY",
        "MONITORED_BY", "INFORMS", "MONITORS_FOR", "APPLY", "AUTOMATION", "DEPENDS_ON"
    ]
    
    for rel in rels:
        try:
            # Check if relationship exists at all
            query = f"MATCH ()-[r:{rel}]->() RETURN count(r) as count"
            res = neo4j_client.execute_query(query)
            count = res[0]['count'] if res else 0
            if count == 0:
                print(f"⚠️  Rel type :{rel} NOT FOUND in DB (Count: 0)")
            else:
                # print(f"✅ Rel type :{rel} exists (Count: {count})")
                pass
        except Exception as e:
            print(f"❌ Error checking :{rel} - {e}")

def verify_queries():
    print("Testing Neo4j Connection...")
    if not neo4j_client.connect():
        print("Could not connect to Neo4j. Skipping live verification.")
        return

    print("Success. Running LIVE queries...")
    
    # 0. Check if the building blocks (relationships) exist first
    check_relationship_counts()

    # Map Chain Names to Start Labels
    chain_start_labels = {
        "1_SectorOps": "SectorObjective",
        "2_StrategyToTactics_Priority": "SectorObjective",
        "3_StrategyToTactics_Targets": "SectorObjective",
        "4_TacticalToStrategy": "EntityChangeAdoption",
        "5_RiskBuildMode": "EntityCapability",
        "6_RiskOperateMode": "EntityCapability",
        "7_InternalEfficiency": "EntityCultureHealth"
    }
    
    for name, query in QUERIES.items():
        print(f"\n--- Verifying {name} ---")
        start_label = chain_start_labels.get(name)
        if not start_label:
            print(f"Skipping {name}, no start label defined.")
            continue
            
        # 1. Fetch candidates
        candidates = get_random_nodes(start_label, limit=5)
        
        if not candidates:
            print(f"⚠️ No nodes found for label {start_label}. Cannot test chain.")
            continue
            
        print(f"Testing up to {len(candidates)} candidates for {start_label}...")
        
        success = False
        for node_id, node_year in candidates:
            # 2. Execute Query
            params = {"id": node_id, "year": node_year}
            try:
                results = neo4j_client.execute_query(query, params)
                count = len(results)
                if count > 0:
                    print(f"✅ PASSED with ID: {node_id} (Year: {node_year}). Found {count} paths.")
                    success = True
                    break # Stop after one success
            except Exception as e:
                print(f"❌ ERROR with ID {node_id}: {e}")
        
        if not success:
             print(f"⚠️  NO DATA found for any of the {len(candidates)} tested nodes.")

    # neo4j_client.close() # Removed as the client doesn't have a close method apparently, or let's double check

if __name__ == "__main__":
    verify_queries()
