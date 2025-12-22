from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Tuple
from app.db.neo4j_client import neo4j_client
from app.config import settings

router = APIRouter()

CHAIN_QUERIES: Dict[str, str] = {
    "sector_ops": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (pol:SectorPolicyTool {year: $year})
  -[:REFERS_TO]-> (rec:SectorAdminRecord {year: $year})
RETURN path
    """,
    "strategy_to_tactics_priority": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:REALIZED_VIA]-> (pol:SectorPolicyTool {year: $year})
  -[:SETS_PRIORITIES]-> (cap:EntityCapability {year: $year})
  -[:OPERATES]-(org:EntityOrgUnit {year: $year})
  -[:GAPS_SCOPE]-(proj:EntityProject {year: $year})
RETURN path
    """,
    "strategy_to_tactics_targets": """
MATCH path = (obj:SectorObjective {id: $id, year: $year})
  -[:MEASURED_BY]-> (perf:SectorPerformance {year: $year})
  -[:SETS_TARGETS]-> (cap:EntityCapability {year: $year})
  -[:OPERATES]-(org:EntityOrgUnit {year: $year})
  -[:GAPS_SCOPE]-(proj:EntityProject {year: $year})
RETURN path
    """,
    "tactical_to_strategy": """
MATCH path = (proj:EntityProject {id: $id, year: $year})
  -[:GAPS_SCOPE]-(org:EntityOrgUnit {year: $year})
  -[:OPERATES]-(cap:EntityCapability {year: $year})
  -[:SETS_PRIORITIES|SETS_TARGETS]-(strat_link)
  -[:REALIZED_VIA|MEASURED_BY]-(obj:SectorObjective {year: $year})
RETURN path
    """,
    "risk_build_mode": """
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (tool:SectorPolicyTool {year: $year})
RETURN path
    """,
    "risk_operate_mode": """
MATCH path = (cap:EntityCapability {id: $id, year: $year})
  -[:MONITORED_BY]-> (risk:EntityRisk {year: $year})
  -[:INFORMS]-> (perf:SectorPerformance {year: $year})
RETURN path
    """,
    "internal_efficiency": """
MATCH path = (cult:EntityCultureHealth {id: $id, year: $year})
  -[:MONITORS_FOR]-> (org:EntityOrgUnit {year: $year})
  -[:APPLY]-> (proc:EntityProcess {year: $year})
  -[:AUTOMATION]-> (sys:EntityITSystem {year: $year})
  -[:DEPENDS_ON]-> (vend:EntityVendor {year: $year})
RETURN path
    """,
    "aggregate": """
MATCH path = (high:SectorObjective|SectorPerformance)
  -[:REALIZED_VIA|CASCADED_VIA|SETS_TARGETS|SETS_PRIORITIES*1..2]-> (cap:EntityCapability)
  -[:MONITORED_BY|ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS|GAPS_SCOPE*1..2]-> (low:EntityProject|EntityRisk|EntityOrgUnit|EntityProcess|EntityITSystem)
WHERE ($year = 0 OR cap.year = $year)
RETURN path
    """
}

CHAIN_DESCRIPTIONS: Dict[str, str] = {
  "sector_ops": "Operational feedback loop from Objective to Performance and back (policy → records → stakeholders → transactions → KPIs).",
  "strategy_to_tactics_priority": "Strategy drives policy, which prioritizes capabilities and exposes gaps leading to projects and adoption risks.",
  "strategy_to_tactics_targets": "Performance targets cascade into capabilities, exposing operational gaps and remediation projects.",
  "tactical_to_strategy": "Bottom-up impact: change adoption → projects → ops layer → capability → strategy layer → objective.",
  "risk_build_mode": "Design/build risks monitoring capabilities and informing policy tools.",
  "risk_operate_mode": "Operational risks affecting KPIs via capability → risk → performance.",
  "internal_efficiency": "Culture health to org/process/system/vendor efficiency chain.",
  "aggregate": "Full strategic-to-operational view bridged by EntityCapability."
}

CHAIN_START_LABELS: Dict[str, str] = {
  "sector_ops": "SectorObjective",
  "strategy_to_tactics_priority": "SectorObjective",
  "strategy_to_tactics_targets": "SectorObjective",
  "tactical_to_strategy": "EntityChangeAdoption",
  "risk_build_mode": "EntityCapability",
  "risk_operate_mode": "EntityCapability",
  "internal_efficiency": "EntityCultureHealth",
  "aggregate": "EntityCapability"
}

def _summarize_result(chain_key: str, count: int, id: str, year: int) -> str:
  desc = CHAIN_DESCRIPTIONS.get(chain_key, "")
  if count > 0:
    return f"Deterministic chain '{chain_key}' found {count} path(s) for id={id}, year={year}. {desc}"
  return f"No data for '{chain_key}' with id={id}, year={year}. Data-driven result (not an error). {desc}"

def _find_sample_id(chain_key: str, limit: int = 10) -> Tuple[str, int] | None:
  label = CHAIN_START_LABELS.get(chain_key)
  if not label:
    return None
  # Get candidate ids/years
  candidates = neo4j_client.execute_query(
    f"MATCH (n:{label}) WHERE n.id IS NOT NULL AND n.year IS NOT NULL RETURN n.id as id, n.year as year LIMIT $limit",
    {"limit": limit},
  ) or []
  if not candidates:
    return None
  # Probe each candidate until we find a path
  query = CHAIN_QUERIES.get(chain_key)
  if not query:
    return None
  for c in candidates:
    cid, cyear = c.get("id"), c.get("year")
    try:
      res = neo4j_client.execute_query(query, {"id": cid, "year": cyear}) or []
      if res:
        return (cid, cyear)
    except Exception:
      continue
  return None


def normalize_chain_key(chain_key: str) -> str:
    key = (chain_key or "").strip().lower()
    aliases = {
        "sectorops": "sector_ops",
        "sector_ops": "sector_ops",
        "sector-ops": "sector_ops",
        "2.0_18": "sector_ops",
        "strategy-priority": "strategy_to_tactics_priority",
        "strategy_to_tactics_priority": "strategy_to_tactics_priority",
        "2.0_19": "strategy_to_tactics_priority",
        "strategy-targets": "strategy_to_tactics_targets",
        "strategy_to_tactics_targets": "strategy_to_tactics_targets",
        "2.0_20": "strategy_to_tactics_targets",
        "tactical": "tactical_to_strategy",
        "tactical_to_strategy": "tactical_to_strategy",
        "2.0_21": "tactical_to_strategy",
        "risk-build": "risk_build_mode",
        "risk_build": "risk_build_mode",
        "risk-build-mode": "risk_build_mode",
        "2.0_22": "risk_build_mode",
        "risk_operate": "risk_operate_mode",
        "risk-operate": "risk_operate_mode",
        "risk-operate-mode": "risk_operate_mode",
        "2.0_23": "risk_operate_mode",
        "internal": "internal_efficiency",
        "internal_efficiency": "internal_efficiency",
        "2.0_24": "internal_efficiency",
        "aggregate": "aggregate"
    }
    return aliases.get(key, key)


@router.get("/sample/{chain_key}")
async def sample_chain(
    chain_key: str,
    probe_limit: int = Query(10, ge=1, le=50),
) -> Dict[str, Any]:
    normalized = normalize_chain_key(chain_key)
    if normalized not in CHAIN_QUERIES:
        raise HTTPException(status_code=404, detail="Unknown chain key")

    if not neo4j_client.connect():
        raise HTTPException(status_code=503, detail="Neo4j unavailable")

    sample = _find_sample_id(normalized, limit=probe_limit)
    if not sample:
        return {"chain_key": normalized, "has_sample": False}

    sid, syear = sample
    results = neo4j_client.execute_query(CHAIN_QUERIES[normalized], {"id": sid, "year": syear}) or []
    count = len(results)
    return {
        "chain_key": normalized,
        "has_sample": True,
        "id": sid,
        "year": syear,
        "count": count,
        "summary": _summarize_result(normalized, count, sid, syear),
    }


def _format_path_results(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format Neo4j path results into a graph structure expected by frontend.
    Merges multiple paths into a single graph object.
    """
    if not records:
        return []

    nodes_map = {}
    rels_map = {}

    for record in records:
        path = record.get('path')
        if not path:
            continue
        
        # Iterate through path nodes
        for node in path.nodes:
            nid = node.element_id if hasattr(node, 'element_id') else str(node.id)
            if nid not in nodes_map:
                nodes_map[nid] = {
                    "id": nid,
                    "elementId": nid,
                    "labels": list(node.labels),
                    "properties": dict(node)
                }

        # Iterate through path relationships
        for rel in path.relationships:
            rid = rel.element_id if hasattr(rel, 'element_id') else str(rel.id)
            if rid not in rels_map:
                start_id = rel.start_node.element_id if hasattr(rel.start_node, 'element_id') else str(rel.start_node.id)
                end_id = rel.end_node.element_id if hasattr(rel.end_node, 'element_id') else str(rel.end_node.id)
                
                rels_map[rid] = {
                    "id": rid,
                    "elementId": rid,
                    "type": rel.type,
                    "start": start_id,
                    "end": end_id,
                    "properties": dict(rel)
                }

    # The frontend expects results[0] to be the graph object
    return [{
        "nodes": list(nodes_map.values()),
        "relationships": list(rels_map.values())
    }]

@router.get("/{chain_key}")
async def run_chain(
    chain_key: str,
    id: str = Query(..., description="Starting node id"),
    year: int = Query(settings.CURRENT_YEAR, description="Fiscal year"),
) -> Dict[str, Any]:
    normalized = normalize_chain_key(chain_key)
    if normalized not in CHAIN_QUERIES:
        raise HTTPException(status_code=404, detail="Unknown chain key")

    if not neo4j_client.connect():
        raise HTTPException(status_code=503, detail="Neo4j unavailable")

    query = CHAIN_QUERIES[normalized]

    try:
        raw_results = neo4j_client.execute_query(query, {"id": id, "year": year}) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to execute chain: {exc}")

    formatted_results = _format_path_results(raw_results)
    count = len(raw_results)
    description = CHAIN_DESCRIPTIONS.get(normalized, "")
    summary = _summarize_result(normalized, count, id, year)

    return {
        "chain_key": normalized,
        "id": id,
        "year": year,
        "count": count,
        "results": formatted_results,
        "clarification_needed": count == 0,
        "description": description,
        "summary": summary,
    }
