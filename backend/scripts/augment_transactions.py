
import os
import sys
import logging

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.neo4j_client import neo4j_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def augment_transactions():
    logger.info("Starting Transaction Augmentation...")
    
    if not neo4j_client.connect():
        logger.error("Could not connect to Neo4j")
        return

    # Fetch source transactions (Year 2028)
    # We fetch ALL properties to clone them perfectly
    fetch_query = """
    MATCH (n:SectorDataTransaction {year: 2028})
    RETURN n
    """
    results = neo4j_client.execute_query(fetch_query)
    
    if not results:
        logger.warning("No transactions found for 2028 to clone.")
        return

    target_years = [2025, 2026, 2027]
    
    for r in results:
        node = r['n']
        # Node properties dictionary
        props = dict(node)
        
        # Clone for each target year
        for year in target_years:
            new_props = props.copy()
            new_props['year'] = year
            new_props['id'] = props['id'] # Keep ID same or prefix? 
            # Usually ID is unique per node? Or unique per year-slice?
            # Given verification query uses params = {"id": node_id, "year": node_year}, 
            # it implies ID + Year combo identifies the node in the chain context.
            # So keeping ID matches the pattern of "Same Entity, Different Year".
            
            # Create/Merge query
            # We use MERGE to be idempotent
            merge_query = f"""
            MERGE (n:SectorDataTransaction {{id: $id, year: $year}})
            SET n += $props
            RETURN n.id
            """
            
            # Note: passing all props via $props might overwrite id/year, so we ensure they are consistent.
            
            try:
                neo4j_client.execute_write_query(merge_query, {"id": new_props['id'], "year": year, "props": new_props})
                logger.info(f"Cloned Transaction {new_props['id']} for Year {year}")
            except Exception as e:
                logger.error(f"Failed to clone {new_props['id']} for {year}: {e}")

    logger.info("Transaction Augmentation Complete.")

if __name__ == "__main__":
    augment_transactions()
