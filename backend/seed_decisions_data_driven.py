import asyncio
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any

from app.db.supabase_client import supabase_client
from app.db.neo4j_client import neo4j_client
from app.services.embedding_service import get_embedding_service

async def get_next_quarter(quarter_str: str):
    """
    Q1 2026 -> Q2 2026
    Q4 2026 -> Q1 2027
    """
    try:
        parts = quarter_str.split(' ')
        q = int(parts[0].replace('Q', ''))
        y = int(parts[1])
        
        if q < 4:
            next_q = f"Q{q+1}"
            next_y = y
        else:
            next_q = "Q1"
            next_y = y + 1
            
        return next_q, next_y
    except Exception:
        return None, None

async def seed_decisions():
    print("Starting data-driven seeding...")
    
    # 1. Connect to services
    await supabase_client.connect()
    if not neo4j_client.connect():
        print("Failed to connect to Neo4j")
        return
        
    embedding_service = get_embedding_service()
    
    # 2. Fetch dashboard data
    data = await supabase_client.table_select('temp_quarterly_dashboard_data', limit=200)
    
    # 3. Identify delays
    delays = []
    for row in data:
        actual = float(row.get('kpi_actual') or 0)
        planned = float(row.get('kpi_planned') or 0)
        if actual < planned:
            delays.append(row)
            
    print(f"Found {len(delays)} delays in dashboard data.")
    
    # 4. Process top 5 unique delays (to avoid noise)
    # Group by dimension to pick distinct ones
    unique_delays = {}
    for d in delays:
        if d['dimension_title'] not in unique_delays:
            unique_delays[d['dimension_title']] = d
        if len(unique_delays) >= 50:
            break
            
    processed_count = 0
    for dim_title, delay in unique_delays.items():
        q_str = delay['quarter']
        next_q, next_y = await get_next_quarter(q_str)
        
        if not next_q:
            continue
            
        content = f"Decision Needed: Approve corrective actions for {dim_title} delay experienced in {q_str}. (Actual: {delay['kpi_actual']}, Target: {delay['kpi_planned']})."
        
        print(f"Generating embedding for: {dim_title}...")
        try:
            embedding = embedding_service.generate_embedding(content)
        except Exception as e:
            print(f"Error generating embedding for {dim_title}: {e}")
            embedding = None
        
        if not embedding:
            print(f"WARNING: Fallback to zero-vector for {dim_title} due to embedding failure.")
            embedding = [0.0] * 1536 # Fallback zero vector
            
        # 5. Insert into Neo4j
        query = """
        MERGE (m:Memory:Decision {id: $id})
        SET m.content = $content,
            m.scope = 'secrets',
            m.tags = ['decision', 'dashboard-alert', 'high-priority'],
            m.year = $year,
            m.quarter = $quarter,
            m.embedding = $embedding,
            m.timestamp = $timestamp,
            m.created_at = $timestamp
        RETURN m.id
        """
        
        q_int = int(next_q.replace('Q', ''))
        params = {
            "id": f"decision-auto-{uuid.uuid4().hex[:8]}",
            "content": content,
            "year": next_y,
            "quarter": q_int,
            "embedding": embedding,
            "timestamp": datetime.now().isoformat()
        }
        
        neo4j_client.execute_write_query(query, params)
        print(f"Seeded decision for {next_q} {next_y} based on {dim_title}")
        processed_count += 1
        
    print(f"Successfully seeded {processed_count} decisions.")

if __name__ == "__main__":
    asyncio.run(seed_decisions())
