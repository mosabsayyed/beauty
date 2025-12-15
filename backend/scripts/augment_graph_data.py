
import os
import sys
import math
import logging
import uuid

# Add backend directory so 'app' is a top-level module
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

from app.db.neo4j_client import neo4j_client

# Constants
HIGH_QUALITY_THRESHOLD = 0.85

def cosine_similarity(v1, v2):
    """Compute cosine similarity between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))
    if magnitude1 == 0 or magnitude2 == 0: return 0.0
    return dot_product / (magnitude1 * magnitude2)

def fetch_nodes_with_embeddings(label, year=None):
    query = f"""
    MATCH (n:{label})
    WHERE n.embedding IS NOT NULL
    {'AND n.year = $year' if year else ''}
    RETURN n.id as id, n.name as name, n.year as year, n.quarter as quarter, n.level as level, n.embedding as embedding
    """
    params = {'year': year} if year else {}
    return neo4j_client.execute_query(query, params)

def generate_bridge_node(source_node, target_label):
    """
    Creates a new node of type `target_label` that is semanticially identical to `source_node`.
    Uses strict naming conventions to make it clear this is a Generated Bridge Node.
    """
    
    # Generate ID and Name
    new_id = f"gen_{source_node['id']}_{uuid.uuid4().hex[:6]}"
    
    # Naming Convention based on Target Type
    if target_label == "SectorPolicyTool":
        new_name = f"Policy Framework for {source_node['name']}"
    elif target_label == "SectorPerformance":
        new_name = f"KPI: Effectiveness of {source_node['name']}"
    elif target_label == "EntityVendor":
        new_name = f"Strategic Vendor for {source_node['name']}"
    elif target_label == "EntityITSystem":
        new_name = f"IT Module for {source_node['name']}"
    else:
        new_name = f"Generated {target_label} for {source_node['name']}"
        
    query = f"""
    CREATE (n:{target_label})
    SET n.id = $id,
        n.name = $name,
        n.description = $desc,
        n.year = $year,
        n.quarter = $quarter,
        n.level = $level,
        n.embedding = $embedding,
        n.generated = true
    RETURN n.id as id
    """
    
    params = {
        "id": new_id,
        "name": new_name,
        "desc": f"Automatically generated bridge node to support business chain for {source_node['name']}.",
        "year": source_node['year'],
        "quarter": source_node.get('quarter', 'Q1'), # Default if missing
        "level": source_node.get('level', 'Level 1'), # Default if missing
        "embedding": source_node['embedding'] # INHERIT EMBEDDING FOR 1.0 SIMILARITY
    }
    
    try:
        neo4j_client.execute_write_query(query, params)
        return True, new_name
    except Exception as e:
        logger.error(f"Failed to create bridge node: {e}")
        return False, None

def augment_category(source_label, target_label):
    logger.info(f"\n--- Augmenting Gaps: {source_label} -> {target_label} ---")
    
    sources = fetch_nodes_with_embeddings(source_label)
    if not sources:
        logger.warning(f"No source nodes found for {source_label}")
        return

    # Group by year
    sources_by_year = {}
    for s in sources:
        y = s['year']
        if y not in sources_by_year: sources_by_year[y] = []
        sources_by_year[y].append(s)

    created_count = 0
    
    for year, year_sources in sources_by_year.items():
        # Fetch existing targets for context
        targets = fetch_nodes_with_embeddings(target_label, year)
        
        for source in year_sources:
            # Check for existing high-quality match
            best_score = -1.0
            if targets:
                for target in targets:
                    score = cosine_similarity(source['embedding'], target['embedding'])
                    if score > best_score: best_score = score
            
            # If orphan (Score < Threshold), create bridge node
            if best_score < HIGH_QUALITY_THRESHOLD:
                success, new_name = generate_bridge_node(source, target_label)
                if success:
                    # logger.info(f"Created: '{new_name}' for orphan '{source['name']}' (Year {year})")
                    created_count += 1

    logger.info(f"Generated {created_count} bridge nodes for {target_label}")

def main():
    logger.info("Starting Semantic Graph Augmentation...")
    
    if not neo4j_client.connect():
        logger.error("Could not connect to Neo4j")
        return

    # Pairs identified as having large gaps
    augment_pairs = [
        ("EntityRisk", "SectorPolicyTool"),      # For Chain 5
        ("EntityRisk", "SectorPerformance"),     # For Chain 6
        ("EntityITSystem", "EntityVendor"),      # For Chain 7
        ("EntityProcess", "EntityITSystem")      # For Chain 7 (Automation)
    ]

    for src, tgt in augment_pairs:
        augment_category(src, tgt)

    logger.info("Augmentation Complete. Now run 'enrich_graph_semantic.py' to link them.")

if __name__ == "__main__":
    main()
