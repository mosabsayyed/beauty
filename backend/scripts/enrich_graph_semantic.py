
import os
import sys
import math
import logging

# Add backend directory so 'app' is a top-level module
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from app.db.neo4j_client import neo4j_client

# Constants
SIMILARITY_THRESHOLD = 0.85  # Default High Quality
# Custom thresholds for difficult operational links where semantics are looser
REL_THRESHOLDS = {
    "AUTOMATION": 0.70,
    "AUTOMATION": 0.70,
    "AUTOMATION": 0.70,
    "APPLY": 0.60, 
    "MONITORS_FOR": 0.55,
    "MONITORED_BY": 0.60,
    "ROLE_GAPS": 0.65,
    "ROLE_GAPS": 0.65,
    "KNOWLEDGE_GAPS": 0.65,
    "AUTOMATION_GAPS": 0.65,
    "CASCADED_VIA": 0.60,
    "CASCADED_VIA": 0.60,
    "SETS_TARGETS": 0.60,
    "REALIZED_VIA": 0.60,
    "SETS_PRIORITIES": 0.60,
    "GAPS_SCOPE": 0.65,
    "CLOSE_GAPS": 0.65,
    "GAPS_SCOPE": 0.65,
    "CLOSE_GAPS": 0.65,
    "ADOPTION_RISKS": 0.65,
    "REFERS_TO": 0.60,
    "APPLIED_ON": 0.60,
    "TRIGGERS_EVENT": 0.60,
    "MEASURED_BY": 0.60,
    "AGGREGATES_TO": 0.60
}

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

def create_relationship(source_id, source_label, target_id, target_label, rel_type, year):
    """Create a relationship between two nodes."""
    query = f"""
    MATCH (s:{source_label} {{id: $source_id, year: $year}})
    MATCH (t:{target_label} {{id: $target_id, year: $year}})
    MERGE (s)-[r:{rel_type}]->(t)
    RETURN count(r) as created
    """
    params = {
        "source_id": source_id, 
        "target_id": target_id,
        "year": year
    }
    try:
        neo4j_client.execute_write_query(query, params)
        logger.info(f"Created :{rel_type} between {source_label}({source_id}) -> {target_label}({target_id})")
        return True
    except Exception as e:
        logger.error(f"Failed to create relationship: {e}")
        return False

def enrich_relationships(source_label, target_label, relationship_type, threshold=SIMILARITY_THRESHOLD):
    """
    Find best semantic match and create relationship if score > threshold.
    """
    logger.info(f"--- Enriching {source_label} -> {target_label} via :{relationship_type} (Threshold: {threshold}) ---")
    
    # 1. Fetch Source Nodes
    sources = fetch_nodes_with_embeddings(source_label)
    if not sources:
        logger.warning(f"No source nodes found for {source_label}")
        return

    # Group sources by year to respect temporal integrity
    sources_by_year = {}
    for s in sources:
        y = s['year']
        if y not in sources_by_year:
            sources_by_year[y] = []
        sources_by_year[y].append(s)

    total_created = 0
    
    # 2. Process per year
    for year, year_sources in sources_by_year.items():
        logger.info(f"Processing Year {year} ({len(year_sources)} sources)...")
        
        # Fetch targets for this year
        targets = fetch_nodes_with_embeddings(target_label, year)
        if not targets:
            logger.warning(f"No target nodes found for {target_label} in {year}")
            continue

        for source in year_sources:
            best_match = None
            best_score = -1.0
            
            # Find best match
            for target in targets:
                # Don't link to self if labels are same (rare but possible in some ontologies)
                if source['id'] == target['id'] and source_label == target_label:
                    continue
                    
                score = cosine_similarity(source['embedding'], target['embedding'])
                
                if score > best_score:
                    best_score = score
                    best_match = target
            
            # Top match
            if best_match and best_score >= threshold:
                
                created = create_relationship(
                    source['id'], source_label, 
                    best_match['id'], target_label, 
                    relationship_type, year
                )
                if created:
                    total_created += 1
            else:
                # Log top few failures to diagnose score distribution
                if len(year_sources) < 5 or total_created == 0 and sources.index(source) < 5:
                     logger.info(f"debug: {source['name']} -> Top: {best_match['name'] if best_match else 'None'} ({best_score:.3f})")

    logger.info(f"Refined {total_created} links for {source_label} -> {target_label}")

def main():
    logger.info("Starting Semantic Graph Enrichment...")
    
    if not neo4j_client.connect():
        logger.error("Could not connect to Neo4j")
        return

    # Define the pairings to enrich based on missing relationships identified
    # Schema: (Source, Target, Relationship)
    enrichment_pairs = [
        # Chain 2 & 3 Repair (DONE)
        # ("EntityProject", "EntityOrgUnit", "CLOSE_GAPS"),
        # ("EntityProject", "EntityOrgUnit", "GAPS_SCOPE"),
        
        # ("EntityProject", "EntityProcess", "CLOSE_GAPS"),
        # ("EntityProject", "EntityProcess", "GAPS_SCOPE"),
        
        # ("EntityProject", "EntityITSystem", "CLOSE_GAPS"),
        # ("EntityProject", "EntityITSystem", "GAPS_SCOPE"),
        
        # ("EntityProject", "EntityChangeAdoption", "ADOPTION_RISKS"),

        # Chain 2 & 3 Repair (Upstream - Capability to Ops Layer - DONE)
        # ("EntityCapability", "EntityOrgUnit", "ROLE_GAPS"),
        # ("EntityCapability", "EntityProcess", "KNOWLEDGE_GAPS"),
        # ("EntityCapability", "EntityITSystem", "AUTOMATION_GAPS"),
        
        # Chain 5 & 6 Repair (DONE)
        # ("EntityRisk", "SectorPolicyTool", "INFORMS"),
        # ("EntityRisk", "SectorPerformance", "INFORMS"),
        # ("EntityCapability", "EntityRisk", "MONITORED_BY"), 
        
        # Chain 7 Repair (DONE)
        # ("EntityITSystem", "EntityVendor", "DEPENDS_ON"),
        # ("EntityProcess", "EntityITSystem", "AUTOMATION"),
        # ("EntityCultureHealth", "EntityOrgUnit", "MONITORS_FOR"),
        # ("EntityOrgUnit", "EntityProcess", "APPLY"),

        # Chain 1, 2, 3 Repair (Strategy Layer)
        # Chain 1, 2, 3 Repair (Strategy Layer)
        # ("SectorObjective", "SectorPerformance", "CASCADED_VIA"),
        # ("SectorPerformance", "EntityCapability", "SETS_TARGETS"),
        # ("SectorObjective", "SectorPolicyTool", "REALIZED_VIA"),
        # ("SectorPolicyTool", "EntityCapability", "SETS_PRIORITIES"),

        # Fix GAPS_SCOPE (Direction: Ops Layer -> Project)
        # ("EntityOrgUnit", "EntityProject", "GAPS_SCOPE"),
        # ("EntityProcess", "EntityProject", "GAPS_SCOPE"),
        # ("EntityITSystem", "EntityProject", "GAPS_SCOPE"),

        # Fix CLOSE_GAPS (Direction: Project -> Ops Layer)
        # ("EntityProject", "EntityOrgUnit", "CLOSE_GAPS"),
        # ("EntityProject", "EntityProcess", "CLOSE_GAPS"),
        # ("EntityProject", "EntityITSystem", "CLOSE_GAPS"),
        
        # Change Adoption
        # ("EntityProject", "EntityChangeAdoption", "ADOPTION_RISKS"),

        # Chain 1 Repair (SectorOps)
        ("SectorPolicyTool", "SectorAdminRecord", "REFERS_TO"),
        ("SectorAdminRecord", "SectorBusiness", "APPLIED_ON"),
        ("SectorBusiness", "SectorDataTransaction", "TRIGGERS_EVENT"),
        ("SectorDataTransaction", "SectorPerformance", "MEASURED_BY"),
        ("SectorPerformance", "SectorObjective", "AGGREGATES_TO")

    ]

    for src, tgt, rel in enrichment_pairs:
        threshold = REL_THRESHOLDS.get(rel, SIMILARITY_THRESHOLD)
        enrich_relationships(src, tgt, rel, threshold)

    logger.info("Semantic Enrichment Complete.")
    # neo4j_client.disconnect() # Client doesn't expose disconnect/close consistently in all versions provided context

if __name__ == "__main__":
    main()
