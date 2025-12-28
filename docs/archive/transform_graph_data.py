#!/usr/bin/env python3
"""
Transform Neo4j query table data into frontend graph format
Input: tabular format with source/target columns per row
Output: {nodes: [], links: []} format
"""
import json

# Color map from backend (neo4j_routes.py lines 33-58)
COLOR_MAP = {
    'SectorObjective': '#A855F7',          # Purple
    'SectorPolicyTool': '#F59E0B',         # Amber
    'SectorAdminRecord': '#10B981',        # Emerald
    'SectorDataTransaction': '#EC4899',    # Pink
    'SectorCitizen': '#3B82F6',            # Blue
    'SectorBusiness': '#EF4444',           # Red
    'SectorGovEntity': '#14B8A6',          # Teal
    'SectorPerformance': '#00F0FF',        # Cyan
    'EntityCapability': '#F97316',         # Orange
    'EntityRisk': '#8B5CF6',               # Violet
    'EntityProject': '#06B6D4',            # Sky Blue
    'EntityChangeAdoption': '#84CC16',     # Lime
    'EntityITSystem': '#F43F5E',           # Rose
    'EntityOrgUnit': '#6366F1',            # Indigo
    'EntityProcess': '#FACC15',            # Yellow
    'EntityVendor': '#22D3EE',             # Cyan Light
    'EntityCultureHealth': '#C084FC',      # Purple Light
}

def get_node_color(group):
    return COLOR_MAP.get(group, '#9CA3AF')  # Gray fallback

def get_node_label(name, description, group):
    """Get label from actual properties"""
    if name:
        return name
    elif description:
        return description
    else:
        return group  # Fallback to node type

# Read input
with open('/home/mosab/projects/chatmodule/backend/app/api/routes/neo4j_query_table_data_2025-12-11.json') as f:
    rows = json.load(f)

# Build nodes map and links list
nodes_map = {}
links = []

for row in rows:
    # Add source node with REAL properties
    source_id = row['source_id']
    if source_id not in nodes_map:
        nodes_map[source_id] = {
            'id': source_id,
            'group': row['source_group'],
            'label': get_node_label(row.get('source_name'), row.get('source_description'), row['source_group']),
            'val': 10,  # Default size (no size property in DB)
            'color': get_node_color(row['source_group']),
            'health': row.get('source_health')  # Real health for EntityRisk/EntityProject
        }
    
    # Add target node and link (if exists)
    if row.get('target_id'):
        target_id = row['target_id']
        if target_id not in nodes_map:
            nodes_map[target_id] = {
                'id': target_id,
                'group': row['target_group'],
                'label': get_node_label(row.get('target_name'), row.get('target_description'), row['target_group']),
                'val': 10,
                'color': get_node_color(row['target_group']),
                'health': row.get('target_health')
            }
        
        # Add link
        links.append({
            'source': source_id,
            'target': target_id,
            'value': 1,  # Default weight (no weight property in DB)
            'type': row['rel_type']
        })

# Output
output = {
    'nodes': list(nodes_map.values()),
    'links': links
}

# Write to frontend snapshot file
with open('/home/mosab/projects/chatmodule/frontend/src/components/graphv001/full_graph_snapshot.json', 'w') as f:
    json.dump(output, f)

print(f"✅ Transformed {len(output['nodes'])} nodes and {len(output['links'])} links")
print(f"📄 Written to: frontend/src/components/graphv001/full_graph_snapshot.json")
