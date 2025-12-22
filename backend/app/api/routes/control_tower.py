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

SHORT_NAME_MAP: Dict[str, str] = {
    'Contribute to National GDP': 'GDP',
    'Drive Job Creation': 'Jobs',
    'Elevate Stakeholder Experience': 'UX',
    'Enhance Economic Security': 'Security',
    'Enhance Regulatory Efficiency': 'Regulations'
}


# ============================================================================
# HELPER FUNCTIONS - Copied exactly from graph-server/routes.ts
# ============================================================================

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

@router.get("/lens-b")
async def get_lens_b(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Lens B: Strategic Impact (Outcomes)
    
    Returns 5 axes: GDP, Jobs, UX, Security, Regulations
    - value: Actual progress (synthetic, trails plan by 10%)
    - plan: Planned progress (linear growth model)
    
    Data Source: Synthetic (Neo4j has no real data)
    """
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        target_quarter = f"{simple_quarter} {simple_year}" if simple_quarter and simple_year else None
        
        # Default to Q4 2025 if not specified
        if not simple_year:
            simple_year = 2025
        if not q_numeric:
            q_numeric = 4
        
        # Generate axes with synthetic values
        axes = []
        for full_name, short_label in SHORT_NAME_MAP.items():
            plan_percent = get_planned_outcome_target(short_label, simple_year, q_numeric)
            # Actual trails behind plan by ~10% to show divergence
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
# Data Sources:
#   - Investments: Supabase temp_quarterly_dashboard_data (dimension_title contains 'Investment')
#   - GDP: Synthetic (linear 0-100% from Q1 2026 to Q4 2030)
# ============================================================================

@router.get("/trend")
async def get_trend(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Trend Chart: Investments vs GDP over time
    
    Returns array of periods from Q3 2025 to selected quarter.
    Each period has: name (e.g., "Q3 2025"), Investments, GDP
    
    Data Sources:
    - Investments: Supabase (Investment Portfolio ROI from dashboard data)
    - GDP: Synthetic (linear growth model)
    """
    try:
        from app.db.supabase_client import supabase_client
        
        # Parse target period
        simple_quarter, simple_year, target_q = parse_quarter_and_year(quarter, year)
        target_q = target_q or 4
        target_y = simple_year or 2025
        
        # 1. Generate Quarter Range starting from Q3 2025
        range_periods = []
        for y in range(2025, target_y + 1):
            for q in range(1, 5):
                if y == 2025 and q < 3:
                    continue
                if y == target_y and q > target_q:
                    break
                range_periods.append({"q": q, "y": y, "label": f"Q{q} {y}"})
        
        # 2. Fetch Lens A (Investments) data from Supabase
        lens_a_data = await supabase_client.table_select("temp_quarterly_dashboard_data")
        
        # 3. Calculate for each quarter in the range
        trend = []
        for period in range_periods:
            # Investments: Find from dimension_title containing "Investment"
            investment_rows = [
                row for row in lens_a_data
                if row.get('quarter') == period['label'] and (
                    'investment' in (row.get('dimension_title') or '').lower() or
                    'investment' in (row.get('kpi_description') or '').lower() or
                    row.get('dimension_id') == 'investment'
                )
            ]
            
            # Calculate investment value from Supabase data
            if investment_rows:
                total_actual = sum(float(row.get('kpi_actual') or 0) for row in investment_rows)
                total_target = sum(float(row.get('kpi_final_target') or 1) for row in investment_rows)
                investment_value = round((total_actual / total_target) * 100) if total_target > 0 else 0
            else:
                # Fallback for missing data
                investment_value = round(get_synthetic_actual('GDP', period['y'], period['q']) + 5)
            
            # GDP: Always synthetic (Lens B has no real data)
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
# LOWER DECK APIs - Operations, Decisions, Risks
# ============================================================================

@router.get("/decisions")
async def get_decisions(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Decisions Panel: High-priority executive decisions from Neo4j Memory nodes.
    Filters by scope='secrets' and the selected year/quarter.
    """
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        
        query = """
        MATCH (m:Memory)
        WHERE m.scope = 'secrets'
        """
        params = {}
        
        if simple_year:
            query += " AND m.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND m.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN m.id as id, 
               m.content as title, 
               'pending' as status, 
               CASE 
                 WHEN 'high-priority' IN m.tags THEN 'high'
                 WHEN 'medium-priority' IN m.tags THEN 'medium'
                 ELSE 'low'
               END as priority,
               m.timestamp as due_date,
               m.content as linked_project_name
        ORDER BY 
          CASE 
            WHEN 'high-priority' IN m.tags THEN 1
            WHEN 'medium-priority' IN m.tags THEN 2
            ELSE 3
          END,
          m.timestamp ASC
        LIMIT 10
        """
        
        results = neo4j_client.execute_query(query, params)
        
        # Fallback if no decisions found
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
        logger.error(f"Decisions API failed: {e}")
        raise HTTPException(status_code=500, detail="Decisions API failed")


@router.get("/data-hygiene")
async def get_data_hygiene(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Data Hygiene (Missing Inputs) Panel: Late projects from Neo4j.
    Filters by status='late' and the selected year/quarter.
    """
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        
        query = """
        MATCH (p:EntityProject)
        WHERE (p.status = 'late' OR p.progress_percentage IS NULL OR p.progress_percentage < 50)
        """
        params = {}
        
        if simple_year:
            query += " AND p.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND p.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN p.id as id,
               p.name as task_name,
               p.status as status,
               p.completion_percentage as progress,
               p.start_date as due_date,
               p.owner as department
        LIMIT 10
        """
        
        results = neo4j_client.execute_query(query, params)
        return results
        
    except Exception as e:
        logger.error(f"Data Hygiene API failed: {e}")
        raise HTTPException(status_code=500, detail="Data Hygiene API failed")


@router.get("/risks")
async def get_risks(
    quarter: Optional[str] = Query(None),
    year: Optional[str] = Query(None)
):
    """
    Risk Signals Panel: Monitoring high-impact risks from Neo4j.
    """
    try:
        simple_quarter, simple_year, q_numeric = parse_quarter_and_year(quarter, year)
        
        query = """
        MATCH (r:EntityRisk)
        WHERE r.risk_score > 20
        """
        params = {}
        
        if simple_year:
            query += " AND r.year = $year"
            params["year"] = int(simple_year)
        if q_numeric:
            query += " AND r.quarter = $quarter"
            params["quarter"] = q_numeric
            
        query += """
        RETURN r.id as id,
               r.name as signal,
               CASE 
                 WHEN r.risk_score > 30 THEN 'High'
                 WHEN r.risk_score > 15 THEN 'Medium'
                 ELSE 'Low'
               END as severity,
               COALESCE(r.status, 'active') as status,
               r.risk_owner as owner
        LIMIT 10
        """
        
        results = neo4j_client.execute_query(query, params)
        return results
        
    except Exception as e:
        logger.error(f"Risks API failed: {e}")
        raise HTTPException(status_code=500, detail="Risks API failed")


@router.get("/dependency-knots")
async def get_dependency_knots():
    """
    Dependency Knots (W7): Systems or Vendors shared by >= 3 projects.
    Replaces legacy Milestone logic with Project-System/Vendor dependencies.
    """
    try:
        # Appendix A Q2 from V1.3 spec, enhanced for V2 labels
        query = """
        MATCH (s)
        WHERE (s:EntityITSystem OR s:EntityVendor)
        MATCH (s)-[:DEPENDS_ON]-(p:EntityProject)
        WITH s, count(p) as dependents
        WHERE dependents >= 3
        RETURN s.name as knot_name, 
               dependents as impact_count, 
               COALESCE(s.operational_status, s.status, 'Active') as status, 
               labels(s)[0] as knot_type,
               (dependents * 1.5) as rank_score
        ORDER BY dependents DESC
        LIMIT 10
        """
        results = neo4j_client.execute_query(query)
        return results
        
    except Exception as e:
        logger.error(f"Dependency Knots API failed: {e}")
        raise HTTPException(status_code=500, detail="Dependency Knots API failed")


@router.get("/dependency-kpis")
async def get_dependency_kpis():
    """
    High-level metrics for Dependency Desk top strip.
    """
    try:
        # For now, return deterministic V1.3 baseline metrics
        return [
            {"title": "Chain Health", "value": "94%", "status": "healthy", "trend": "steady"},
            {"title": "Critical Dependencies", "value": "12", "status": "warning", "trend": "down"},
            {"title": "Bottlenecks", "value": "2", "status": "healthy", "trend": "down"}
        ]
    except Exception as e:
        logger.error(f"Dependency KPIs failed: {e}")
        raise HTTPException(status_code=500, detail="Dependency KPIs failed")
