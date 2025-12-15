from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase_client

router = APIRouter()

import logging
import traceback

logger = logging.getLogger(__name__)

@router.get("/dashboard-data")
async def get_dashboard_data(quarter_filter: str = None):
    """
    Fetch rows from temp_quarterly_dashboard_data table.
    If quarter_filter is provided (e.g., "Q4 2025"), filter at database level.
    """
    try:
        # Build filters for Supabase query
        filters = {}
        if quarter_filter:
            filters["quarter"] = quarter_filter
        
        # Use table_select with filter to query only needed data
        data = await supabase_client.table_select("temp_quarterly_dashboard_data", filters=filters if filters else None)
        
        # Helper to get previous quarter string
        def get_prev_quarter(q_str):
            try:
                parts = q_str.split(' ')
                if len(parts) != 2: return None
                q, year = parts[0], int(parts[1])
                if q == 'Q1': return f'Q4 {year-1}'
                if q == 'Q2': return f'Q1 {year}'
                if q == 'Q3': return f'Q2 {year}'
                if q == 'Q4': return f'Q3 {year}'
            except:
                return None
            return None

        # Create a lookup map for (dimension_id, quarter) -> kpi_actual
        kpi_map = {(row['dimension_id'], row['quarter']): row['kpi_actual'] for row in data}

        # Enrich rows with previous_kpi
        for row in data:
            prev_q = get_prev_quarter(row['quarter'])
            if prev_q:
                row['previous_kpi'] = kpi_map.get((row['dimension_id'], prev_q), row['kpi_actual'])
            else:
                row['previous_kpi'] = row['kpi_actual']

        return data
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/outcomes-data")
async def get_outcomes_data(quarter_filter: str = None):
    """
    Fetch rows from temp_quarterly_outcomes_data table.
    If quarter_filter is provided, filter at database level.
    """
    try:
        filters = {"quarter": quarter_filter} if quarter_filter else None
        return await supabase_client.table_select("temp_quarterly_outcomes_data", filters=filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/investment-initiatives")
async def get_investment_initiatives(quarter_filter: str = None):
    """
    Fetch rows from temp_investment_initiatives table.
    If quarter_filter is provided, filter at database level.
    """
    try:
        filters = {"quarter": quarter_filter} if quarter_filter else None
        return await supabase_client.table_select("temp_investment_initiatives", filters=filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

