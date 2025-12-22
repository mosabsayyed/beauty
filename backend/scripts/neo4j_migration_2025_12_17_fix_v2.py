from app.db.neo4j_client import neo4j_client


def run(query: str, params: dict | None = None) -> None:
    neo4j_client.execute_query(query, params or {})


def migrate() -> None:
    if not neo4j_client.connect():
        raise RuntimeError("Neo4j unavailable")
    try:
        # 1) Backfill SectorObjective.quarter from SectorPerformance first
        run(
            """
            MATCH (o:SectorObjective)
            OPTIONAL MATCH (o)-[:MEASURED_BY|:CASCADED_VIA]->(p:SectorPerformance)
            WHERE p.year = o.year AND p.quarter IS NOT NULL
            WITH o, collect(p.quarter) AS qs
            WITH o, [q IN qs WHERE q IS NOT NULL] AS qs2
            WITH o, CASE WHEN size(qs2)>0 THEN qs2[0] ELSE NULL END AS perf_q
            SET o.quarter = coalesce(o.quarter, perf_q)
            """
        )

        # 1b) Fallback: backfill from SectorPolicyTool if still missing
        run(
            """
            MATCH (o:SectorObjective)
            WHERE o.quarter IS NULL
            OPTIONAL MATCH (o)-[:REALIZED_VIA]->(t:SectorPolicyTool)
            WHERE t.year = o.year AND t.quarter IS NOT NULL
            WITH o, collect(t.quarter) AS qs
            WITH o, [q IN qs WHERE q IS NOT NULL] AS qs2
            WITH o, CASE WHEN size(qs2)>0 THEN qs2[0] ELSE NULL END AS tool_q
            SET o.quarter = coalesce(o.quarter, tool_q)
            """
        )

        # 2) SectorCitizen: name by level (L1=type, L2=region, L3=district), then drop columns
        run(
            """
            MATCH (c:SectorCitizen)
            SET c.name = CASE
              WHEN c.level = 'L3' AND c.district IS NOT NULL THEN c.district
              WHEN c.level = 'L2' AND c.region IS NOT NULL THEN c.region
              WHEN c.level = 'L1' AND c.type IS NOT NULL THEN c.type
              ELSE coalesce(c.name, c.type, c.region, c.district, 'Citizen')
            END
            """
        )
        run("MATCH (c:SectorCitizen) REMOVE c.type, c.region, c.district")

        # 3) SectorDataTransaction: name from domain / department / transaction_type, then drop
        run(
            """
            MATCH (t:SectorDataTransaction)
            SET t.name = coalesce(t.domain, t.department, t.transaction_type, t.name)
            """
        )
        run("MATCH (t:SectorDataTransaction) REMOVE t.domain, t.department, t.transaction_type")

        # 4) Normalize status: risk_status -> status; operational_status -> status
        run("MATCH (r:EntityRisk) SET r.status = coalesce(r.status, r.risk_status)")
        run("MATCH (s:EntityITSystem) SET s.status = coalesce(s.status, s.operational_status)")
    finally:
        neo4j_client.disconnect()


if __name__ == "__main__":
    migrate()
