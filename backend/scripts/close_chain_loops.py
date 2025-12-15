
import os
import sys
import logging

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.neo4j_client import neo4j_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def close_sector_ops_loop():
    logger.info("Closing SectorOps (Chain 1) Loops... (Pairwise Version)")
    
    if not neo4j_client.connect():
        logger.error("Could not connect to Neo4j")
        return

    years = ["2025", "2026", "2027", "2028", "2029"]
    
    for year in years:
        logger.info(f"Processing Year {year}...")
        
        # 1. Fetch Pairs
        fetch_query = """
        MATCH path = (obj:SectorObjective {year: $year})
          -[:REALIZED_VIA]-> (tool:SectorPolicyTool {year: $year})
          -[:REFERS_TO]-> (record:SectorAdminRecord {year: $year})
          -[:APPLIED_ON]-> (stakeholder)
          -[:TRIGGERS_EVENT]-> (txn:SectorDataTransaction {year: $year})
          -[:MEASURED_BY]-> (perf:SectorPerformance {year: $year})
        WHERE (stakeholder:SectorBusiness OR stakeholder:SectorGovEntity OR stakeholder:SectorCitizen)
          AND stakeholder.year = $year
        
        RETURN DISTINCT obj.id as oid, perf.id as pid
        """
        
        try:
             res = neo4j_client.execute_query(fetch_query, {"year": int(year)})
             if not res:
                 logger.info(f"Year {year}: No paths found.")
                 continue
                 
             logger.info(f"Year {year}: Found {len(res)} pairs to link.")
             
             # 2. Link Pairs
             count = 0
             for r in res:
                 oid = r['oid']
                 pid = r['pid']
                 
                 link_query = """
                 MATCH (obj:SectorObjective {id: $oid, year: $year})
                 MATCH (perf:SectorPerformance {id: $pid, year: $year})
                 MERGE (perf)-[:AGGREGATES_TO]->(obj)
                 """
                 
                 # Note: "year" is in params. "oid", "pid" passed in per-call.
                 neo4j_client.execute_write_query(link_query, {"year": int(year), "oid": oid, "pid": pid})
                 count += 1
                 
             logger.info(f"Year {year}: Linked {count} pairs.")

        except Exception as e:
            logger.error(f"Error for {year}: {e}")

    logger.info("Loop closure complete.")

if __name__ == "__main__":
    close_sector_ops_loop()
