
import os
import sys
import math
import logging

# Add backend directory so 'app' is a top-level module
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

from app.db.neo4j_client import neo4j_client

# Constants
DIAGNOSTIC_THRESHOLD = 0.85

def cosine_similarity(v1, v2):
    """Compute cosine similarity between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
        
    return dot_product / (magnitude1 * magnitude2)

def fetch_nodes_with_embeddings(label, year=None):
    """Fetch all nodes of a specific label with their embeddings."""
    query = f"""
    MATCH (n:{label})
    WHERE n.embedding IS NOT NULL
    {'AND n.year = $year' if year else ''}
    RETURN n.id as id, n.name as name, n.year as year, n.embedding as embedding
    """
    params = {'year': year} if year else {}
    return neo4j_client.execute_query(query, params)

def diagnose_gaps(source_label, target_label, rel_type):
    """
    Identify source nodes that fail to find a match > DIAGNOSTIC_THRESHOLD.
    Suggests what kind of node is missing.
    """
    logger.info(f"\n--- Diagnosing Gaps: {source_label} -> {target_label} ({rel_type}) ---")
    
    # 1. Fetch Source Nodes
    sources = fetch_nodes_with_embeddings(source_label)
    if not sources:
        logger.warning(f"No source nodes found for {source_label}")
        return

    # Group sources by year
    sources_by_year = {}
    for s in sources:
        y = s['year']
        if y not in sources_by_year:
            sources_by_year[y] = []
        sources_by_year[y].append(s)

    gaps_found = 0
    
    # 2. Process per year
    for year, year_sources in sources_by_year.items():
        # Fetch targets for this year
        targets = fetch_nodes_with_embeddings(target_label, year)
        if not targets:
            logger.warning(f"  [Year {year}] No {target_label} nodes found! All {len(year_sources)} {source_label}s are orphaned.")
            continue

        for source in year_sources:
            best_match = None
            best_score = -1.0
            
            # Find best match
            for target in targets:
                if source['id'] == target['id'] and source_label == target_label:
                    continue    
                score = cosine_similarity(source['embedding'], target['embedding'])
                if score > best_score:
                    best_score = score
                    best_match = target
            
            # If Best Match is WEAK, report it
            if best_score < DIAGNOSTIC_THRESHOLD:
                gaps_found += 1
                if gaps_found <= 10: # Limit output
                    logger.info(f"MISSING LINK for: '{source['name']}' (Year: {year})")
                    logger.info(f"   - Best available candidate: '{best_match['name'] if best_match else 'None'}' (Score: {best_score:.3f})")
                    logger.info(f"   - SUGGESTION: Create new {target_label} similar to '{source['name']}'")
                    logger.info("   - " + "-"*20)

    logger.info(f"Total Gaps Found: {gaps_found} out of {len(sources)} checked.")

def main():
    logger.info("Starting Semantic Gap Diagnosis...")
    
    if not neo4j_client.connect():
        logger.error("Could not connect to Neo4j")
        return

    # Focus on the chains that were failing or weak
    # Chain 5 & 6 (Risk -> Tool/Performance)
    # Chain 7 (ITSystem -> Vendor)
    
    diagnosis_targets = [
        ("EntityRisk", "SectorPolicyTool", "INFORMS"),
        ("EntityRisk", "SectorPerformance", "INFORMS"),
        ("EntityITSystem", "EntityVendor", "DEPENDS_ON"),
        ("EntityProcess", "EntityITSystem", "AUTOMATION")
    ]

    for src, tgt, rel in diagnosis_targets:
        diagnose_gaps(src, tgt, rel)

    # neo4j_client.close()

if __name__ == "__main__":
    main()
