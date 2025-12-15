
import os
import sys
import logging

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.neo4j_client import neo4j_client

def debug_chain_1():
    if not neo4j_client.connect():
        print("Failed to connect.")
        return

    # Get a valid candidate - Relax constraints to find ANY
    q = "MATCH (n:SectorObjective) WHERE n.id IS NOT NULL AND n.year IS NOT NULL RETURN n.id, n.year LIMIT 1"
    res = neo4j_client.execute_query(q)
    if not res:
        print("No SectorObjective found.")
        return
    
    oid = res[0]['n.id']
    oyear = res[0]['n.year']
    print(f"DEBUG: Tracing Chain 1 for ID '{oid}' (Type: {type(oid)}) Year '{oyear}' (Type: {type(oyear)})")
    
    # We pass params to handle types correctly
    params = {"id": oid, "year": oyear}

    # Step 1: Objective
    q1 = "MATCH (n:SectorObjective {id: $id, year: $year}) RETURN n.name"
    res = neo4j_client.execute_query(q1, params)
    print(f"1. Objective Found: {len(res)} -> {res[0]['n.name'] if res else 'None'}")
    if not res: return

    # Step 2: Policy
    q2 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool:SectorPolicyTool {year: $year})
    RETURN tool.name
    """
    res = neo4j_client.execute_query(q2, params)
    print(f"2. Policy Found: {len(res)} -> {[r['tool.name'] for r in res]}")
    if not res: return
    
    # Step 3: Record
    q3 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool)
    MATCH (tool)-[:REFERS_TO]->(record:SectorAdminRecord {year: $year})
    RETURN record.name
    """
    res = neo4j_client.execute_query(q3, params)
    print(f"3. Record Found: {len(res)} -> {[r['record.name'] for r in res]}")
    if not res: return

    # Step 4: Stakeholder
    q4 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool)-[:REFERS_TO]->(record)
    MATCH (record)-[:APPLIED_ON]->(stakeholder)
    WHERE stakeholder.year = $year
    RETURN labels(stakeholder), stakeholder.name
    """
    res = neo4j_client.execute_query(q4, params)
    print(f"4. Stakeholder Found: {len(res)} -> {[r['labels(stakeholder)'] for r in res]}")
    if not res: return

    # Step 5: Transaction
    q5 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool)-[:REFERS_TO]->(record)-[:APPLIED_ON]->(stakeholder)
    MATCH (stakeholder)-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction {year: $year})
    RETURN txn.name
    """
    res = neo4j_client.execute_query(q5, params)
    print(f"5. Transaction Found: {len(res)} -> {[r['txn.name'] for r in res]}")
    if not res: return

    # Step 6: Performance
    q6 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool)-[:REFERS_TO]->(record)-[:APPLIED_ON]->(stakeholder)-[:TRIGGERS_EVENT]->(txn)
    MATCH (txn)-[:MEASURED_BY]->(perf:SectorPerformance {year: $year})
    RETURN perf.name
    """
    res = neo4j_client.execute_query(q6, params)
    print(f"6. Performance Found: {len(res)} -> {[r['perf.name'] for r in res]}")
    if not res: return

    # Step 7: Loop Back
    q7 = """
    MATCH (obj:SectorObjective {id: $id, year: $year})
    MATCH (obj)-[:REALIZED_VIA]->(tool)-[:REFERS_TO]->(record)-[:APPLIED_ON]->(stakeholder)-[:TRIGGERS_EVENT]->(txn)-[:MEASURED_BY]->(perf)
    MATCH (perf)-[:AGGREGATES_TO]->(obj)
    RETURN obj.name
    """
    res = neo4j_client.execute_query(q7, params)
    print(f"7. Loop Closed: {len(res)}")

if __name__ == "__main__":
    debug_chain_1()
