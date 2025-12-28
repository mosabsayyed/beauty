# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  CONTROL TOWER APIs - SINGLE SOURCE OF TRUTH                               ║
# ║                                                                            ║
# ║  ALL Control Tower data for Josoor V2 comes ONLY from this file.           ║
# ║  DO NOT create duplicate endpoints in graph-server or elsewhere.           ║
# ║                                                                            ║
# ║  Data Sources:                                                             ║
# ║  - Lens A (Health): Supabase temp_quarterly_dashboard_data                 ║
# ║  - Lens B (Outcomes): Synthetic (based on growth model)                    ║
# ║  - Trend (Investments): Supabase temp_quarterly_dashboard_data             ║
# ║  - Trend (GDP): Synthetic (linear 0-100% from Q1 2026 to Q4 2030)          ║
# ╚════════════════════════════════════════════════════════════════════════════╝

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from app.db.neo4j_client import neo4j_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# CONSTANTS - End-State Targets (2030 Goals)
# ============================================================================
END_STATE_TARGETS: Dict[str, float] = {
    'GDP': 4_000_000_000,      # SAR 4 Billion
    'Jobs': 500_000,           # 500,000 jobs
    'Security': 2_000_000_000, # SAR 2 Billion
    'UX': 90,                  # 90% satisfaction
    'Regulations': 90          # 90% efficiency
}

# ============================================================================
# HELPER FUNCTIONS - Copied exactly from graph-server/routes.ts
# ============================================================================

def normalize_chain_key(key: str) -> str:
    k = (key or "").strip().lower()
    aliases = {
        "2.0_18": "sector_ops", "sectorops": "sector_ops",
        "2.0_19": "strategy_to_tactics_priority",
        "2.0_20": "strategy_to_tactics_targets",
        "2.0_21": "tactical_to_strategy",
        "2.0_22": "risk_build_mode",
        "2.0_23": "risk_operate_mode",
        "2.0_24": "internal_efficiency",
    }
    return aliases.get(k, k)


def get_planned_outcome_target(label: str, year: int, q: int) -> float:
    """
    Linear Planned Growth: 0% (Q1 2026) → 100% (Q4 2030)
    Total: 20 quarters (5 years * 4 quarters)
    
    Survey metrics (UX, Regulations): 60% base, increase to 90% cap
    Numeric metrics (GDP, Jobs, Security): linear 0% → 100%
    """
    if year < 2026:
        return 0
    if year > 2030:
        return 100
    
    total_quarters = 20  # Q1 2026 → Q4 2030
    quarter_index = (year - 2026) * 4 + q  # 1-indexed (Q1 2026 = 1, Q4 2030 = 20)
    
    is_survey = label in ('UX', 'Regulations')
    if is_survey:
        # Survey metrics: 60% base, increase to 90% cap
        base = 60
        cap = 90
        progress = quarter_index / total_quarters
        return min(base + (progress * (cap - base)), cap)
    else:
        # Numeric: linear 0% → 100%
        return min((quarter_index / total_quarters) * 100, 100)


def get_synthetic_actual(label: str, year: int, q: int) -> float:
    """
    Synthetic Actual fallback (linear growth if no real data)
    Same logic as get_planned_outcome_target but kept separate for clarity.
    """
    if year < 2026:
        return 0
    if year > 2030:
        return 100
    
    total_quarters = 20
    quarter_index = (year - 2026) * 4 + q
    
    is_survey = label in ('UX', 'Regulations')
    if is_survey:
        base = 60
        cap = 90
        progress = quarter_index / total_quarters
        return min(base + (progress * (cap - base)), cap)
    else:
        return min((quarter_index / total_quarters) * 100, 100)


def parse_quarter_and_year(quarter: Optional[str], year: Optional[str]):
    """
    Robust Quarter Parsing: Handles "Q2", "Q2-2025", "Q2 2025"
    Returns (simple_quarter, simple_year, q_numeric)
    """
    simple_quarter = None
    if quarter and quarter != 'All':
        if ' ' in quarter:
            simple_quarter = quarter.split(' ')[0]
        elif '-' in quarter:
            simple_quarter = quarter.split('-')[0]
        else:
            simple_quarter = quarter
    
    simple_year = int(year) if year and year != 'All' else None
    q_numeric = int(simple_quarter.replace('Q', '')) if simple_quarter else None
    
    return simple_quarter, simple_year, q_numeric


# ============================================================================
# LENS B API - Strategic Outcomes (Synthetic data)
# Data Source: Synthetic values based on growth model
# ============================================================================

# ============================================================================
# LENS A API - Operational Health (Supabase data)
# ============================================================================

@router.get("/hud-lens-a")
async def get_hud_lens_a(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Lens A: Operational Health (Supabase)
    Logic ported from graph-server/routes.ts
    """
    try:
        from app.api.routes import dashboard
        
        # Construct target quarter (e.g. "Q4 2025")
        target_quarter = None
        if quarter and year and quarter != 'All' and year != 'All':
            target_quarter = f"{quarter} {year}"

        # Fetch from Supabase via internal function
        data = await dashboard.get_dashboard_data()
        
        # Dimension Map for Radar
        dimension_map = {
            'Strategic Plan Alignment': 'axis_1',
            'Operational Efficiency': 'axis_2',
            'Risk Mitigation Rate': 'axis_3',
            'Investment Portfolio ROI': 'axis_4',
            'Active Investor Rate': 'axis_5',
            'Employee Engagement Score': 'axis_6',
            'Project Delivery Velocity': 'axis_7',
            'Tech Stack SLA Compliance': 'axis_8'
        }

        short_name_map = {
            'Strategic Plan Alignment': 'Strategy',
            'Operational Efficiency': 'Ops',
            'Risk Mitigation Rate': 'Risk',
            'Investment Portfolio ROI': 'Investments',
            'Active Investor Rate': 'Investors',
            'Employee Engagement Score': 'Employees',
            'Project Delivery Velocity': 'Projects',
            'Tech Stack SLA Compliance': 'Tech'
        }

        # Filter and sort
        effective_quarter = "Unknown"
        if target_quarter:
            effective_quarter = target_quarter
            current_data = [row for row in data if row.get("quarter") == target_quarter]
        else:
            # Sort to find latest
            def parse_q_y(q_str):
                try:
                    q, y = q_str.split(' ')
                    return int(y) * 10 + int(q.replace('Q', ''))
                except: return 0
            
            sorted_data = sorted(data, key=lambda x: parse_q_y(x.get('quarter', '')), reverse=True)
            effective_quarter = sorted_data[0].get('quarter') if sorted_data else "Unknown"
            current_data = [row for row in data if row.get("quarter") == effective_quarter]

        axes = []
        total_score = 0
        count = 0

        for dim_name, axis_id in dimension_map.items():
            row = next((r for r in current_data if r.get("dimension_title") == dim_name), None)
            actual = float(row.get("kpi_actual") or 0) if row else 0
            target = float(row.get("kpi_final_target") or 1) if row else 1
            planned = float(row.get("kpi_planned") or 0) if row else 0
            
            # Achieving % Achieved
            val = round((actual / target) * 100) if target > 0 else 0
            plan_val = round((planned / target) * 100) if target > 0 else 0
            
            axes.append({
                "label": short_name_map.get(dim_name, dim_name),
                "value": val,
                "plan": plan_val,
                "axis_id": axis_id
            })
            total_score += val
            count += 1

        avg_score = total_score / count if count > 0 else 0

        return {
            "axes": axes,
            "burnout_flag": avg_score < 60,
            "quarter": effective_quarter
        }
    except Exception as e:
        logger.error(f"Lens A failed: {e}")
        raise HTTPException(status_code=500, detail="Lens A failed")

# ============================================================================
# LENS B API - Strategic Outcomes (Synthetic data)
# ============================================================================

@router.get("/hud-lens-b")
async def get_hud_lens_b(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Lens B: Strategic Impact (Outcomes)
    """
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        target_quarter = f"{simple_quarter} {simple_year}" if simple_quarter and simple_year else None
        
        if not simple_year: simple_year = 2025
        if not q_numeric: q_numeric = 4
        
        axes = []
        for full_name, short_label in SHORT_NAME_MAP.items():
            plan_percent = get_planned_outcome_target(short_label, simple_year, q_numeric)
            actual_percent = max(plan_percent - 10, 0)
            
            axes.append({
                "label": short_label,
                "value": round(min(actual_percent, 100)),
                "plan": round(plan_percent),
                "kpi_part": round(min(actual_percent, 100)),
                "proj_part": 0
            })
        
        return {"axes": axes, "quarter": target_quarter}
    except Exception as e:
        logger.error(f"Lens B failed: {e}")
        raise HTTPException(status_code=500, detail="Lens B failed")


# ============================================================================
# TREND API - Investments vs GDP
# ============================================================================

@router.get("/hud-trend")
async def get_hud_trend(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Trend Chart: Investments vs GDP over time
    """
    try:
        from app.db.supabase_client_async import supabase_client
        simple_quarter, simple_year, target_q = parse_quarter_and_year(quarter, year)
        target_q = target_q or 4
        target_y = simple_year or 2025
        
        range_periods = []
        for y in range(2025, target_y + 1):
            for q in range(1, 5):
                if y == 2025 and q < 3: continue
                if y == target_y and q > target_q: break
                range_periods.append({"q": q, "y": y, "label": f"Q{q} {y}"})
        
        lens_a_data = await supabase_client.table_select("temp_quarterly_dashboard_data")
        
        trend = []
        for period in range_periods:
            investment_rows = [
                row for row in lens_a_data
                if row.get('quarter') == period['label'] and (
                    'investment' in (row.get('dimension_title') or '').lower() or
                    'investment' in (row.get('kpi_description') or '').lower() or
                    row.get('dimension_id') == 'investment'
                )
            ]
            
            if investment_rows:
                total_actual = sum(float(row.get('kpi_actual') or 0) for row in investment_rows)
                total_target = sum(float(row.get('kpi_final_target') or 1) for row in investment_rows)
                investment_value = round((total_actual / total_target) * 100) if total_target > 0 else 0
            else:
                investment_value = round(get_synthetic_actual('GDP', period['y'], period['q']) + 5)
            
            gdp_percent = get_synthetic_actual('GDP', period['y'], period['q'])
            
            trend.append({
                "name": period['label'],
                "Investments": min(investment_value, 100),
                "GDP": round(gdp_percent)
            })
        
        return trend
    except Exception as e:
        logger.error(f"Trend Chart failed: {e}")
        raise HTTPException(status_code=500, detail="Trend Chart failed")

# ============================================================================
# HEALTH GRID API
# ============================================================================

@router.get("/health-grid")
async def get_health_grid(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Health Grid (Radar Dimensions Data)
    """
    try:
        from app.api.routes import dashboard
        target_quarter = f"{quarter} {year}" if quarter and year and quarter != 'All' and year != 'All' else None
        data = await dashboard.get_dashboard_data()
        
        if target_quarter:
            current_data = [row for row in data if row.get("quarter") == target_quarter]
        else:
            latest_q = data[0].get('quarter') if data else None
            current_data = [row for row in data if row.get("quarter") == latest_q]
            
        return current_data
    except Exception as e:
        logger.error(f"Health Grid failed: {e}")
        raise HTTPException(status_code=500, detail="Health Grid failed")

# ============================================================================
# LOWER DECK APIs - Decisions, Missing Inputs, Risk Signals
# ============================================================================

@router.get("/decisions")
async def get_decisions(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        query = "MATCH (m:Memory) WHERE m.scope = 'secrets'"
        params = {}
        if simple_year:
            query += " AND m.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND m.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN m.id as id, m.content as title, 'pending' as status, 
               CASE WHEN 'high-priority' IN m.tags THEN 'high' WHEN 'medium-priority' IN m.tags THEN 'medium' ELSE 'low' END as priority,
               m.timestamp as due_date, m.content as linked_project_name
        ORDER BY CASE WHEN 'high-priority' IN m.tags THEN 1 WHEN 'medium-priority' IN m.tags THEN 2 ELSE 3 END, m.timestamp ASC LIMIT 10
        """
        results = neo4j_client.execute_query(query, params)
        if not results:
            return [{
                "id": "mock-1",
                "title": f"No high-priority decisions pending for {quarter or ''} {year or ''}",
                "status": "pending",
                "priority": "low",
                "due_date": "2025-12-31",
                "linked_project_name": "General Operations"
            }]
        return results
    except Exception as e:
        logger.error(f"Decisions failed: {e}")
        raise HTTPException(status_code=500, detail="Decisions failed")


@router.get("/missing-inputs")
async def get_missing_inputs(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        query = "MATCH (p:EntityProject) WHERE (p.status = 'late' OR p.progress_percentage IS NULL OR p.progress_percentage < 50)"
        params = {}
        if simple_year:
            query += " AND p.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND p.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN p.name as entity_name, 'Project Update' as missing_type, 10 as days_overdue, coalesce(p.quarter, 'Unknown') as stale_quarter
        LIMIT 10
        """
        results = neo4j_client.execute_query(query, params)
        return results
    except Exception as e:
        logger.error(f"Missing Inputs failed: {e}")
        raise HTTPException(status_code=500, detail="Missing Inputs failed")


@router.get("/risk-signals")
async def get_risk_signals(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        query = "MATCH (r:EntityRisk) WHERE r.risk_score > 20"
        params = {}
        if simple_year:
            query += " AND r.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND r.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN r.name as signal_name, r.risk_score as severity, r.risk_category as category, 
               r.likelihood_of_delay as trend, CASE WHEN r.risk_score > 30 THEN 'High' WHEN r.risk_score > 15 THEN 'Medium' ELSE 'Low' END as severity_band
        LIMIT 10
        """
        results = neo4j_client.execute_query(query, params)
        return results
    except Exception as e:
        logger.error(f"Risk Signals failed: {e}")
        raise HTTPException(status_code=500, detail="Risk Signals failed")


@router.get("/dependency-knots")
async def get_dependency_knots(
    year: Optional[str] = Query(None),
    chainKey: Optional[str] = Query(None)
):
    """
    Dependency Knots: Systems or Vendors shared by >= 3 projects.
    """
    try:
        year_num = 0
        if year and year != 'All':
            try: year_num = int(year)
            except: pass
            
        # Filter knots by Chain Context if provided
        label_filter = "k:EntityITSystem OR k:EntityVendor OR k:EntityCapability OR k:EntityOrgUnit OR k:EntityProcess"
        
        if chainKey:
            k = normalize_chain_key(chainKey)
            if k == 'sector_ops':
                label_filter = "k:SectorAdminRecord OR k:SectorStakeholder OR k:SectorPerformance"
            elif 'strategy' in k:
                label_filter = "k:EntityCapability OR k:EntityProject OR k:EntityRisk"
            elif 'risk' in k:
                label_filter = "k:EntityRisk OR k:EntityRiskFactor OR k:EntityProject"
            elif 'tactical' in k:
                label_filter = "k:EntityChangeAdoption OR k:EntityITSystem OR k:EntityProcess"

        query = f"""
          MATCH (k)
          WHERE ({label_filter})
          OPTIONAL MATCH (k)<-[r]-(dep)
          WHERE ($year = 0 OR dep.year = $year OR dep.Year = $year)
          WITH k.name as name, labels(k)[0] as type, count(DISTINCT dep) as dependents
          WHERE dependents > 0
          RETURN name as knot_name, 
                 dependents as impact_count,
                 CASE WHEN dependents >= 5 THEN 'critical' ELSE 'active' END as status,
                 type as knot_type,
                 dependents * 1.5 as rank_score
          ORDER BY dependents DESC
        """
        results = neo4j_client.execute_query(query, {"year": year_num})
        return results
    except Exception as e:
        logger.error(f"Dependency Knots failed: {e}")
        raise HTTPException(status_code=500, detail="Dependency Knots failed")


@router.get("/dependency-kpis")
async def get_dependency_kpis(
    year: Optional[str] = Query(None),
    chainKey: Optional[str] = Query(None)
):
    try:
        year_num = 0
        if year and year != 'All':
            try: year_num = int(year)
            except: pass
            
        chain_filter = "(true)" 
        if chainKey:
            k = normalize_chain_key(chainKey)
            if k == 'sector_ops':
                 chain_filter = "(n:SectorObjective OR n:SectorPerformance OR n:SectorAdminRecord)"
            elif 'strategy' in k:
                 chain_filter = "(n:EntityProject OR n:EntityCapability OR n:SectorPolicyTool)"
            elif 'risk' in k:
                 chain_filter = "(n:EntityRisk OR n:EntityProject)"
            elif 'tactical' in k:
                 chain_filter = "(n:EntityChangeAdoption OR n:EntityProject)"
            elif 'internal' in k:
                 chain_filter = "(n:EntityProcess OR n:EntityITSystem)"

        query = f"""
            CALL {{
              MATCH (obj:SectorObjective)
              WHERE ($year = 0 OR obj.year = $year OR obj.Year = $year)
              OPTIONAL MATCH (obj)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
              OPTIONAL MATCH (pol)-[:REFERS_TO]->(rec:SectorAdminRecord)
              OPTIONAL MATCH (rec)-[:APPLIED_ON]->(stakeholder)
              OPTIONAL MATCH (stakeholder)-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction)
              OPTIONAL MATCH (txn)-[:MEASURED_BY]->(perf:SectorPerformance)
              WITH obj, pol, rec, stakeholder, txn, perf
              WHERE pol IS NULL OR rec IS NULL OR stakeholder IS NULL OR txn IS NULL OR perf IS NULL
              RETURN count(DISTINCT obj) as bCount, collect(DISTINCT elementId(obj)) as bIds
            }}

            CALL {{
              MATCH (k)
              WHERE (k:EntityITSystem OR k:EntityVendor OR k:EntityCapability OR k:EntityOrgUnit OR k:EntityProcess OR k:EntityProject OR k:EntityRisk)
              AND {chain_filter.replace('n:', 'k:')}
              
              MATCH (k)-[r]-(dep)
              WITH k, count(DISTINCT dep) as degree
              WHERE degree > 15
              RETURN count(DISTINCT k) as sCount, collect(DISTINCT elementId(k)) as sIds
            }}

            CALL {{
               MATCH (k)
               WHERE (k:EntityITSystem OR k:EntityVendor OR k:EntityCapability OR k:EntityOrgUnit OR k:EntityProcess OR k:EntityProject OR k:EntityRisk)
               AND {chain_filter.replace('n:', 'k:')}
               
               MATCH (k)<-[r]-(dep)
               WITH k, count(DISTINCT dep) as incoming
               WHERE incoming >= 5
               RETURN count(DISTINCT k) as oCount, collect(DISTINCT elementId(k)) as oIds
            }}

            RETURN 
                bCount, bIds,
                sCount, sIds,
                oCount, oIds
        """
        results = neo4j_client.execute_query(query, {"year": year_num})
        if not results:
            return []
            
        rec = results[0]
        
        def format_metric(title, count_key, ids_key, warning_threshold=1):
            val = rec.get(count_key) or 0
            ids = rec.get(ids_key) or []
            return {
                "title": title,
                "value": val,
                "status": "warning" if val >= warning_threshold else "healthy",
                "trend": "none",
                "affected_ids": ids
            }
            
        return [
            format_metric("Broken Links", "bCount", "bIds"),
            format_metric("SPOF Nodes", "sCount", "sIds"),
            format_metric("Overloaded Nodes", "oCount", "oIds", 5)
        ]
    except Exception as e:
        logger.error(f"Dependency KPIs failed: {e}")
        raise HTTPException(status_code=500, detail="Dependency KPIs failed")
