from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.db.neo4j_client import neo4j_client, Neo4jClient
import logging
from pydantic import BaseModel
import math

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Models ---

class GraphNode(BaseModel):
    id: str
    group: str
    label: str
    val: float
    color: str
    health: Optional[float] = None

class GraphLink(BaseModel):
    source: str
    target: str
    value: float
    type: str

class GraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

# --- Helper Functions ---

def get_node_color(labels: List[str]) -> str:
    color_map = {
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
    
    for label in labels:
        if label in color_map:
            return color_map[label]
            
    return '#9CA3AF' # Gray fallback

def get_node_label(props: Dict[str, Any], node_id: str) -> str:
    for value in props.values():
        if isinstance(value, str) and value.strip():
            if not value.startswith('Entity') and not value.startswith('Sector'):
                return value
    return node_id

def to_num(val: Any) -> float:
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    # Handle Neo4j types if necessary (though driver usually converts)
    if hasattr(val, 'to_native'):
        return float(val.to_native())
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

# --- Dashboard Logic Ported from graph-server/routes.ts --

@router.get("/dashboard/metrics")
async def get_dashboard_metrics_endpoint(year: Optional[int] = None, quarter: Optional[str] = None):
    try:
        from app.api.routes import dashboard
        
        # Build quarter filter string (e.g., "Q4 2025")
        quarter_filter = None
        if year and quarter and quarter != 'all':
            if ' ' in quarter:  # Already formatted like "Q1 2025"
                quarter_filter = quarter
            else:
                quarter_filter = f"{quarter} {year}"
        
        # Fetch data with DB-level filtering (much faster)
        dimensions_data = await dashboard.get_dashboard_data(quarter_filter)
        outcomes_data = await dashboard.get_outcomes_data(quarter_filter)
        initiatives_data = await dashboard.get_investment_initiatives(quarter_filter)
        
        # Process Dimensions (no Python filtering needed - already filtered at DB)
        dimension_map = {}
        
        for row in dimensions_data:
            key = row['dimension_title']
            dimension_map[key] = row
                
        # Transform Dimensions
        dimensions = []
        for row in dimension_map.values():
            final_target = float(row.get('kpi_final_target') or 100)
            target = float(row.get('kpi_planned') or 100)
            actual = float(row.get('kpi_actual') or 0)
            
            normalized_actual = (actual / final_target * 100) if final_target else 0
            normalized_planned = (target / final_target * 100) if final_target else 0
            
            # Health score from DB is used as delta
            delta = float(row.get('health_score') or 0)
            
            # Previous KPI logic
            last_kpi = row.get('previous_kpi') or row.get('kpi_actual')
            
            trend = str(row.get('trend', '')).lower()
            trend_dir = 'up' if trend in ['growth', 'up'] else ('down' if trend in ['decline', 'down'] else 'steady')
            
            dim_id_map = {
                'Strategic Plan Alignment': 'strategicPlan',
                'Operational Efficiency Gains': 'operations',
                'Risk Mitigation Rate': 'risksControl',
                'Investment Portfolio Spending': 'investment',
                'Quarterly Investor Activities': 'adoption',
                'Employee Engagement Score': 'culture',
                'Project Delivery Velocity': 'delivery',
                'Tech Stack SLA Compliance': 'technology'
            }
            
            dim_id = dim_id_map.get(row['dimension_title'], 'dim-' + str(row['dimension_id']))

            dimensions.append({
                "id": dim_id,
                "title": row['dimension_title'],
                "label": row.get('kpi_description') or row['dimension_title'],
                "kpi": str(row.get('kpi_actual')),
                "lastQuarterKpi": str(last_kpi),
                "nextQuarterKpi": str(row.get('kpi_next_target')),
                "delta": delta,
                "trendDirection": trend_dir,
                "baseline": float(row.get('kpi_base_value') or 0),
                "quarterlyTarget": float(row.get('kpi_planned') or 0),
                "quarterlyActual": float(row.get('kpi_actual') or 0),
                "finalTarget": final_target,
                "planned": normalized_planned,
                "actual": normalized_actual,
                "healthState": row.get('health_state'),
                "healthScore": normalized_actual, # Visual score
                "trend": row.get('trend')
            })
            
        # Process Outcomes
        sorted_outcomes = [
            row for row in outcomes_data 
            if (quarter_filter and row['quarter'] == quarter_filter) or 
               (not quarter_filter and (not year_str or year_str in row['quarter']))
        ]
        
        # Sort outcomes descending by quarter to find latest
        def parse_quarter(q_str):
            try:
                parts = q_str.split(' ')
                q_num = int(parts[0].replace('Q', ''))
                y_num = int(parts[1])
                return y_num * 10 + q_num # Simple score for sorting
            except:
                return 0
                
        sorted_outcomes.sort(key=lambda x: parse_quarter(x['quarter']), reverse=True)
        
        # Need all for trends
        all_outcomes_for_year = [
            row for row in outcomes_data 
            if (not year_str or year_str in row['quarter'])
        ]
        all_outcomes_for_year.sort(key=lambda x: parse_quarter(x['quarter']), reverse=True)
        
        last3_outcomes = all_outcomes_for_year[:3][::-1] 
        latest_outcome = sorted_outcomes[0] if sorted_outcomes else (all_outcomes_for_year[0] if all_outcomes_for_year else {})
        
        def to_nums(rows, key):
            return [float(r.get(key) or 0) for r in rows]

        outcomes = {}
        if last3_outcomes:
            outcomes = {
                "outcome1": {
                    "title": "Macroeconomic Impact",
                    "macro": {
                        "labels": [r['quarter'].split(' ')[1] for r in last3_outcomes],
                        "fdi": {
                            "actual": to_nums(last3_outcomes, 'fdi_actual'),
                            "target": to_nums(last3_outcomes, 'fdi_target'),
                            "baseline": to_nums(last3_outcomes, 'fdi_baseline')
                        },
                        "trade": {
                            "actual": to_nums(last3_outcomes, 'trade_balance_actual'),
                            "target": to_nums(last3_outcomes, 'trade_balance_target'),
                            "baseline": to_nums(last3_outcomes, 'trade_balance_baseline')
                        },
                        "jobs": {
                            "actual": to_nums(last3_outcomes, 'jobs_created_actual'),
                            "target": to_nums(last3_outcomes, 'jobs_created_target'),
                            "baseline": to_nums(last3_outcomes, 'jobs_created_baseline')
                        }
                    }
                },
                "outcome2": {
                    "title": "Private Sector Partnerships",
                    "partnerships": {
                        "actual": float(latest_outcome.get('partnerships_actual') or 0),
                        "target": float(latest_outcome.get('partnerships_target') or 0),
                        "baseline": float(latest_outcome.get('partnerships_baseline') or 0)
                    }
                },
                "outcome3": {
                    "title": "Citizen Quality of Life",
                    "qol": {
                        "labels": ["Water", "Energy", "Transport"],
                        "coverage": {
                            "actual": [float(latest_outcome.get(k) or 0) for k in ['water_coverage_actual', 'energy_coverage_actual', 'transport_coverage_actual']],
                            "target": [float(latest_outcome.get(k) or 0) for k in ['water_coverage_target', 'energy_coverage_target', 'transport_coverage_target']],
                            "baseline": [float(latest_outcome.get(k) or 0) for k in ['water_coverage_baseline', 'energy_coverage_baseline', 'transport_coverage_baseline']]
                        },
                        "quality": {
                            "actual": [float(latest_outcome.get(k) or 0) for k in ['water_quality_actual', 'energy_quality_actual', 'transport_quality_actual']],
                            "target": [float(latest_outcome.get(k) or 0) for k in ['water_quality_target', 'energy_quality_target', 'transport_quality_target']],
                            "baseline": [float(latest_outcome.get(k) or 0) for k in ['water_quality_baseline', 'energy_quality_baseline', 'transport_quality_baseline']]
                        }
                    }
                },
                "outcome4": {
                    "title": "Community Engagement",
                    "community": {
                        "actual": float(latest_outcome.get('community_engagement_actual') or 0),
                        "target": float(latest_outcome.get('community_engagement_target') or 0),
                        "baseline": float(latest_outcome.get('community_engagement_baseline') or 0)
                    }
                }
            }
            
        # Process Insights
        latest_initiatives = [
            {
                "name": row['initiative_name'],
                "budget": float(row['budget']),
                "risk": float(row['risk_score']),
                "alignment": float(row['alignment_score'])
            }
            for row in initiatives_data
            if (quarter_filter and row['quarter'] == quarter_filter) or 
               (not quarter_filter and (not year_str or year_str in row['quarter']))
        ]
        
        # Helper for quarterly values for insights (Need historical data for trends)
        def get_quarterly_values(dim_title, field):
            relevant_rows = [
                d for d in dimensions_data 
                if d['dimension_title'] == dim_title and (not year_str or year_str in d['quarter'])
            ]
            relevant_rows.sort(key=lambda x: parse_quarter(x['quarter']))
            return [float(r.get(field) or 0) for r in relevant_rows[-3:]]

        project_velocity = get_quarterly_values('Project Delivery Velocity', 'kpi_actual')
        operational_efficiency = get_quarterly_values('Operational Efficiency Gains', 'kpi_actual')

        # Construct Final Response
        return {
            "year": year or 2025,
            "summary": {
                "strategicAlignment": next((d['actual'] for d in dimensions if d['id'] == 'strategicPlan'), 0),
                "operationalEfficiency": next((d['actual'] for d in dimensions if d['id'] == 'operations'), 0),
                "riskMitigation": next((d['actual'] for d in dimensions if d['id'] == 'risksControl'), 0)
            },
            "dimensions": dimensions,
            "insight1": {
                "title": "Investment Portfolio Health",
                "subtitle": "Portfolio distribution against strategic alignment and risk.",
                "initiatives": latest_initiatives
            },
            "insight2": {
                "title": "Projects & Operations Integration",
                "subtitle": "How integrated are projects and operations?",
                "labels": ["Last Q", "Current Q", "Next Q"],
                "projectVelocity": project_velocity,
                "operationalEfficiency": operational_efficiency
            },
            "insight3": {
                "title": "Economic Impact Correlation",
                "subtitle": "Connecting internal efficiencies with external outcomes.",
                "labels": ["Last Q", "Current Q", "Next Q"],
                "operationalEfficiency": operational_efficiency,
                "citizenQoL": outcomes.get('outcome3', {}).get('qol', {}).get('quality', {}).get('actual', []),
                "jobsCreated": outcomes.get('outcome1', {}).get('macro', {}).get('jobs', {}).get('actual', [])
            },
            "outcomes": outcomes
        }

    except Exception as e:
        logger.error(f"Dashboard metrics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph")
async def get_graph_data(
    labels: Optional[str] = Query(None),
    relationships: Optional[str] = Query(None),
    years: Optional[str] = Query(None),
    limit: int = 200
):
    try:
        params = {"limit": limit}
        node_labels = labels.split(',') if labels else []
        rel_types = relationships.split(',') if relationships else []
        year_list = [int(y) for y in years.split(',')] if years else []
        
        # Build query with label filter
        if node_labels:
            # User specified labels
            label_filter = " OR ".join([f"'{label}' IN labels(n)" for label in node_labels])
        else:
            # All Entity/Sector labels
            all_entity_sector_labels = [
                'SectorObjective', 'SectorPolicyTool', 'SectorAdminRecord', 'SectorDataTransaction',
                'SectorCitizen', 'SectorBusiness', 'SectorGovEntity', 'SectorPerformance',
                'EntityCapability', 'EntityRisk', 'EntityProject', 'EntityChangeAdoption',
                'EntityITSystem', 'EntityOrgUnit', 'EntityProcess', 'EntityVendor', 'EntityCultureHealth'
            ]
            label_filter = " OR ".join([f"'{label}' IN labels(n)" for label in all_entity_sector_labels])
        
        where_clauses = [f"({label_filter})"]
        
        # Add year filter if specified
        if year_list:
            where_clauses.append("(n.year IN $years OR n.Year IN $years)")
            params["years"] = year_list
            
        where_clause = "WHERE " + " AND ".join(where_clauses)
        
        rel_filter = ""
        if rel_types:
            rel_filter = "AND type(r) IN $relTypes"
            params["relTypes"] = rel_types
            
        query = f"""
          MATCH (n)
          {where_clause}
          WITH n LIMIT $limit
          OPTIONAL MATCH (n)-[r]->(m)
          WHERE m IS NULL OR (ANY(label IN labels(m) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          {rel_filter}
          RETURN n, r, m
        """
        
        records = neo4j_client.execute_query(query, params)
        
        nodes_map = {}
        links = []
        
        for record in records:
            # Process Source Node
            if 'n' in record and record['n']:
                n_obj = record['n']
                n_props = dict(n_obj)
                n_labels = list(n_obj.labels)
                n_id = n_obj.element_id if hasattr(n_obj, 'element_id') else str(n_obj.id)
                
                if n_id not in nodes_map:
                    nodes_map[n_id] = {
                        "id": n_id,
                        "group": n_props.get('group', n_labels[0] if n_labels else 'default'),
                        "label": get_node_label(n_props, n_id),
                        "val": n_props.get('val', n_props.get('size', 10)),
                        "color": n_props.get('color', get_node_color(n_labels)),
                        "health": n_props.get('health')
                    }
            
            # Process Target Node & Link
            if 'm' in record and record['m'] and 'r' in record and record['r']:
                m_obj = record['m']
                r_obj = record['r']
                m_id = m_obj.element_id if hasattr(m_obj, 'element_id') else str(m_obj.id)
                
                # Add target node if missing
                if m_id not in nodes_map:
                    m_props = dict(m_obj)
                    m_labels = list(m_obj.labels)
                    nodes_map[m_id] = {
                        "id": m_id,
                        "group": m_props.get('group', m_labels[0] if m_labels else 'default'),
                        "label": get_node_label(m_props, m_id),
                        "val": m_props.get('val', m_props.get('size', 10)),
                        "color": m_props.get('color', get_node_color(m_labels)),
                        "health": m_props.get('health')
                    }
                
                # Add Link
                r_props = dict(r_obj)
                source_id = r_obj.start_node.element_id if hasattr(r_obj.start_node, 'element_id') else str(r_obj.start_node.id)
                target_id = r_obj.end_node.element_id if hasattr(r_obj.end_node, 'element_id') else str(r_obj.end_node.id)
                
                links.append({
                    "source": source_id,
                    "target": target_id,
                    "value": r_props.get('value', r_props.get('weight', 1)),
                    "type": r_obj.type
                })

        return {
            "nodes": list(nodes_map.values()),
            "links": links
        }

    except Exception as e:
        logger.error(f"Graph fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/business-chain/counts")
async def get_chain_counts(year: Optional[int] = None):
    try:
        year_filter = 'WHERE (n.year = $year OR n.Year = $year)' if year else ''
        params = {'year': year} if year else {}
        
        # Node Counts
        node_query = f"""
          MATCH (n)
          {year_filter.replace('n.', 'n.')}
          { 'AND' if year_filter else 'WHERE' } (ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          RETURN labels(n)[0] as label, count(n) as count
        """
        node_res = neo4j_client.execute_query(node_query, params)
        node_counts = {r['label']: r['count'] for r in node_res}
        
        # Rel Counts
        rel_query = f"""
          MATCH (a)-[r]->(b)
          {year_filter.replace('n.', 'a.')}
          { 'AND' if year_filter else 'WHERE' } (ANY(label IN labels(a) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND (ANY(label IN labels(b) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          RETURN type(r) as relType, count(r) as count
        """
        rel_res = neo4j_client.execute_query(rel_query, params)
        rel_counts = {r['relType']: r['count'] for r in rel_res}
        
        # Pair Counts
        pair_query = f"""
          MATCH (a)-[r]-(b)
          {year_filter.replace('n.', 'a.')}
          { 'AND' if year_filter else 'WHERE' } (ANY(label IN labels(a) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND (ANY(label IN labels(b) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          WITH labels(a)[0] as labelA, labels(b)[0] as labelB, count(r) as cnt
          RETURN labelA + '-' + labelB as pair, cnt as count
        """
        pair_res = neo4j_client.execute_query(pair_query, params)
        pair_counts = {r['pair']: r['count'] for r in pair_res}
        
        return {
            "nodeCounts": node_counts,
            "relCounts": rel_counts,
            "pairCounts": pair_counts
        }
        
    except Exception as e:
        logger.error(f"Chain counts failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/neo4j/health")
async def health_check():
    return neo4j_client.health_check()

@router.get("/neo4j/schema")
async def get_schema():
    if not neo4j_client.is_connected():
        if not neo4j_client.connect():
            raise HTTPException(status_code=503, detail="Neo4j not connected")
            
    try:
        labels_query = "CALL db.labels()"
        rels_query = "CALL db.relationshipTypes()"
        
        labels_result = neo4j_client.execute_query(labels_query)
        rels_result = neo4j_client.execute_query(rels_query)
        
        all_labels = [record['label'] for record in labels_result]
        
        labels = [
            l['label'] for l in labels_result 
            if l['label'].startswith('Entity') or l['label'].startswith('Sector')
        ]
        
        relationship_types = [r['relationshipType'] for r in rels_result]
        
        return {
            "labels": labels,
            "relationshipTypes": relationship_types
        }
    except Exception as e:
        logger.error(f"Schema fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/neo4j/years")
async def get_years():
    query = """
      MATCH (n)
      WHERE n.year IS NOT NULL OR n.Year IS NOT NULL
      WITH COALESCE(n.year, n.Year) as year
      WHERE year IS NOT NULL
      RETURN DISTINCT year
      ORDER BY year DESC
    """
    try:
        result = neo4j_client.execute_query(query)
        years = []
        for r in result:
            y = r['year']
            if isinstance(y, int):
                years.append(y)
            elif isinstance(y, str) and y.isdigit():
                years.append(int(y))
                
        return {"years": years}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
