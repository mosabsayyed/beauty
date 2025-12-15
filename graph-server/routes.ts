import dotenv from "dotenv";
import express, { Router, type Express } from "express";
import { createServer, type Server } from "http";

import { storage } from "./storage";
import { fetchGraphData, testConnection, closeDriver, getSchema, getNodeProperties, getAvailableYears, getDashboardMetrics } from "./neo4j";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get Neo4j Schema (available labels and relationship types)
  app.get("/api/neo4j/schema", async (req, res) => {
    try {
      const schema = await getSchema();
      res.json(schema);
    } catch (error) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ 
        error: "Failed to fetch schema",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get available node properties
  app.get("/api/neo4j/properties", async (req, res) => {
    try {
      const properties = await getNodeProperties();
      res.json({ properties });
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ 
        error: "Failed to fetch properties",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get available years
  app.get("/api/neo4j/years", async (req, res) => {
    try {
      const years = await getAvailableYears();
      res.json({ years });
    } catch (error) {
      console.error("Error fetching years:", error);
      res.status(500).json({ 
        error: "Failed to fetch years",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get dashboard metrics (Proxy to Backend)
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const year = req.query.year ? String(req.query.year) : null;
      const quarter = req.query.quarter ? String(req.query.quarter) : null;
      
      console.log(`[DEBUG] Request: year=${year}, quarter=${quarter}`);

      // Fetch all three data sources in parallel
      const [dimensionsRes, outcomesRes, initiativesRes] = await Promise.all([
        fetch('http://localhost:8008/api/v1/dashboard/dashboard-data'),
        fetch('http://localhost:8008/api/v1/dashboard/outcomes-data'),
        fetch('http://localhost:8008/api/v1/dashboard/investment-initiatives')
      ]);
      
      if (!dimensionsRes.ok || !outcomesRes.ok || !initiativesRes.ok) {
        throw new Error('Failed to fetch dashboard data from backend');
      }
      
      const dimensionsData = await dimensionsRes.json();
      console.log(`[DEBUG] Fetched ${dimensionsData.length} dimension rows from backend`);
      
      const outcomesData = await outcomesRes.json();
      const initiativesData = await initiativesRes.json();
      
      // Process dimensions (existing logic)
      // If quarter is provided, use it. Otherwise if year is provided, allow all quarters (latest will be picked)
      const quarterFilter = (year && quarter && quarter !== 'all') ? `${quarter} ${year}` : null;
      console.log(`[DEBUG] quarterFilter=${quarterFilter}`);
      
      const dimensionMap = new Map();
      dimensionsData.forEach((row: any) => {
        // If quarter filter is set, only include that specific quarter
        // Otherwise, if year filter is set, include all quarters of that year
        if (quarterFilter && row.quarter !== quarterFilter) return;
        if (!quarterFilter && year && !row.quarter.includes(year)) return;
        
        const key = row.dimension_title;
        const existing = dimensionMap.get(key);
        
        const isNewer = (a: string, b: string) => {
           const [qa, ya] = a.split(' ');
           const [qb, yb] = b.split(' ');
           if (ya !== yb) return ya > yb;
           return qa > qb;
        };

        if (!existing || isNewer(row.quarter, existing.quarter)) {
          dimensionMap.set(key, row);
        }
      });
      console.log(`[DEBUG] dimensionMap size=${dimensionMap.size}`);
      
      const dimensions = Array.from(dimensionMap.values()).map((row: any) => {
        const finalTarget = Number(row.kpi_final_target) || 100;
        // Normalize values to 0-100 scale using final target as 100%
        const normalizedActual = (Number(row.kpi_actual) / finalTarget) * 100;
        const normalizedPlanned = (Number(row.kpi_planned) / finalTarget) * 100;
        
        // Use backend-provided previous_kpi
        const lastKpi = row.previous_kpi || row.kpi_actual;

        // Debug logging for verification
        if (row.dimension_id === 'dim1') {
             console.log(`[DEBUG] ${row.quarter} - ${row.dimension_title}: KPI=${row.kpi_actual}, PrevKPI=${lastKpi}, BackendPrev=${row.previous_kpi}`);
        }

        // DB health_score is the percentage delta (e.g. 1.95%)
        // UI expects healthScore to be 0-100 (Progress)
        // We use normalizedActual as the Health Score
        const healthScore = normalizedActual;
        
        // We use DB health_score as the delta value (percentage variance)
        const delta = Number(row.health_score);

        return {
          id: row.dimension_id,
          title: row.dimension_title,
          label: row.kpi_description || row.dimension_title,
          kpi: `${row.kpi_actual}`,
          lastQuarterKpi: `${lastKpi}`,
          nextQuarterKpi: `${row.kpi_next_target}`,
          delta: delta,
          trendDirection: row.trend?.toLowerCase() === 'growth' || row.trend?.toLowerCase() === 'up' ? 'up' as const : 
                         row.trend?.toLowerCase() === 'decline' || row.trend?.toLowerCase() === 'down' ? 'down' as const : 
                         'steady' as const,
          baseline: Number(row.kpi_base_value),
          quarterlyTarget: Number(row.kpi_planned),
          quarterlyActual: Number(row.kpi_actual),
          finalTarget: Number(row.kpi_final_target),
          planned: normalizedPlanned, // Normalized for spider chart
          actual: normalizedActual,   // Normalized for spider chart
          healthState: row.health_state,
          healthScore: healthScore,
          trend: row.trend
        };
      });
      
      // Process outcomes - get latest quarter for the selected year (default to Q4)
      const sortedOutcomes = outcomesData
        .filter((row: any) => {
          if (quarterFilter) return row.quarter === quarterFilter;
          if (year) return row.quarter.includes(year);
          return true;
        })
        .sort((a: any, b: any) => {
          const [qa, ya] = a.quarter.split(' ');
          const [qb, yb] = b.quarter.split(' ');
          if (ya !== yb) return yb.localeCompare(ya);
          return qb.localeCompare(qa);
        });
      
      // Get last 3 years of outcome data for time-series charts
      const last3Outcomes = sortedOutcomes.slice(0, 3).reverse(); // Reverse to get chronological order
      const latestOutcome = sortedOutcomes[0]; // Get the most recent outcome for single-value metrics
      
      const outcomes = last3Outcomes.length > 0 ? {
        outcome1: {
          title: 'Macroeconomic Impact',
          macro: {
            labels: last3Outcomes.map((o: any) => o.quarter.split(' ')[1]), // Extract years like '2023', '2024', '2025'
            fdi: {
              actual: last3Outcomes.map((o: any) => Number(o.fdi_actual)),
              target: last3Outcomes.map((o: any) => Number(o.fdi_target)),
              baseline: last3Outcomes.map((o: any) => Number(o.fdi_baseline))
            },
            trade: {
              actual: last3Outcomes.map((o: any) => Number(o.trade_balance_actual)),
              target: last3Outcomes.map((o: any) => Number(o.trade_balance_target)),
              baseline: last3Outcomes.map((o: any) => Number(o.trade_balance_baseline))
            },
            jobs: {
              actual: last3Outcomes.map((o: any) => Number(o.jobs_created_actual)),
              target: last3Outcomes.map((o: any) => Number(o.jobs_created_target)),
              baseline: last3Outcomes.map((o: any) => Number(o.jobs_created_baseline))
            }
          }
        },
        outcome2: {
          title: 'Private Sector Partnerships',
          partnerships: {
            actual: Number(latestOutcome.partnerships_actual),
            target: Number(latestOutcome.partnerships_target),
            baseline: Number(latestOutcome.partnerships_baseline)
          }
        },
        outcome3: {
          title: 'Citizen Quality of Life',
          qol: {
            labels: ['Water', 'Energy', 'Transport'],
            coverage: {
              actual: [
                Number(latestOutcome.water_coverage_actual),
                Number(latestOutcome.energy_coverage_actual),
                Number(latestOutcome.transport_coverage_actual)
              ],
              target: [
                Number(latestOutcome.water_coverage_target),
                Number(latestOutcome.energy_coverage_target),
                Number(latestOutcome.transport_coverage_target)
              ],
              baseline: [
                Number(latestOutcome.water_coverage_baseline),
                Number(latestOutcome.energy_coverage_baseline),
                Number(latestOutcome.transport_coverage_baseline)
              ]
            },
            quality: {
              actual: [
                Number(latestOutcome.water_quality_actual),
                Number(latestOutcome.energy_quality_actual),
                Number(latestOutcome.transport_quality_actual)
              ],
              target: [
                Number(latestOutcome.water_quality_target),
                Number(latestOutcome.energy_quality_target),
                Number(latestOutcome.transport_quality_target)
              ],
              baseline: [
                Number(latestOutcome.water_quality_baseline),
                Number(latestOutcome.energy_quality_baseline),
                Number(latestOutcome.transport_quality_baseline)
              ]
            }
          }
        },
        outcome4: {
          title: 'Community Engagement',
          community: {
            actual: Number(latestOutcome.community_engagement_actual),
            target: Number(latestOutcome.community_engagement_target),
            baseline: Number(latestOutcome.community_engagement_baseline)
          }
        }
      } : {};
      
      // Process insights
      // insight1: Investment Portfolio from initiatives table
      const latestInitiatives = initiativesData
        .filter((row: any) => {
          if (quarterFilter) return row.quarter === quarterFilter;
          if (year) return row.quarter.includes(year);
          return true;
        })
        .map((row: any) => ({
          name: row.initiative_name,
          budget: Number(row.budget),
          risk: Number(row.risk_score),
          alignment: Number(row.alignment_score)
        }));
      
      // insight2 & insight3: Calculate from dimensions data (last 3 quarters)
      const getQuarterlyValues = (dimensionTitle: string, field: string) => {
        return dimensionsData
          .filter((row: any) => row.dimension_title === dimensionTitle && (!year || row.quarter.includes(year)))
          .sort((a: any, b: any) => {
            const [qa, ya] = a.quarter.split(' ');
            const [qb, yb] = b.quarter.split(' ');
            if (ya !== yb) return ya.localeCompare(yb);
            return qa.localeCompare(qb);
          })
          .slice(-3)
          .map((row: any) => Number(row[field]));
      };
      
      const projectVelocity = getQuarterlyValues('Project Delivery Velocity', 'kpi_actual');
      const operationalEfficiency = getQuarterlyValues('Operational Efficiency', 'kpi_actual');
      
      res.json({
        dimensions,
        insight1: {
          title: 'Investment Portfolio Health',
          subtitle: 'Are we prioritizing our big needle movers? Portfolio distribution against strategic alignment and risk.',
          initiatives: latestInitiatives
        },
        insight2: {
          title: 'Projects & Operations Integration',
          subtitle: 'How integrated are projects and operations quarter over quarter?',
          labels: ['Last Q', 'Current Q', 'Next Q'],
          projectVelocity: projectVelocity,
          operationalEfficiency: operationalEfficiency
        },
        insight3: {
          title: 'Economic Impact Correlation',
          subtitle: 'The better we do, the better the economy: connecting internal efficiencies with external outcomes.',
          labels: ['Last Q', 'Current Q', 'Next Q'],
          operationalEfficiency: operationalEfficiency,
          citizenQoL: latestOutcome ? [
            Number(latestOutcome.water_quality_actual),
            Number(latestOutcome.energy_quality_actual),
            Number(latestOutcome.transport_quality_actual)
          ] : [],
          jobsCreated: latestOutcome ? [Number(latestOutcome.jobs_created_actual)] : []
        },
        outcomes
      });
      
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard metrics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Neo4j Graph Data API with optional filters
  app.get("/api/graph", async (req, res) => {
    try {
      const nodeLabels = req.query.labels 
        ? (req.query.labels as string).split(',').filter(Boolean)
        : undefined;
      const relationshipTypes = req.query.relationships 
        ? (req.query.relationships as string).split(',').filter(Boolean)
        : undefined;
      const years = req.query.years 
        ? (req.query.years as string).split(',').map(y => parseInt(y)).filter(y => !isNaN(y))
        : undefined;
      const quarter = req.query.quarter ? String(req.query.quarter) : undefined;
      const limit = req.query.limit 
        ? parseInt(req.query.limit as string)
        : 200;

      const graphData = await fetchGraphData(nodeLabels, relationshipTypes, years, quarter, limit);
      res.json(graphData);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      res.status(500).json({ 
        error: "Failed to fetch graph data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get counts for business chain diagram
  app.get("/api/business-chain/counts", async (req, res) => {
    try {
      const { getSession } = await import("./neo4j");
      const neo4j = await import("neo4j-driver");
      const session = getSession();
      
      try {
        const year = req.query.year ? parseInt(req.query.year as string) : null;
        const quarter = req.query.quarter ? String(req.query.quarter) : null;
        
        const conditions = [];
        const params: any = {};

        console.log('[Business Chains API] Request params:', { year, quarter });

        if (year) {
            conditions.push('(n.year = $year OR n.Year = $year)');
            params.year = neo4j.default.int(year);
        }
        if (quarter && quarter !== 'all') {
            // Convert "Q3" to 3 if needed
            let qVal: any = quarter;
            if (typeof quarter === 'string' && quarter.startsWith('Q')) {
              const qNum = parseInt(quarter.replace('Q', ''), 10);
              if (!isNaN(qNum)) {
                qVal = neo4j.default.int(qNum);
              }
            }
            conditions.push('(n.quarter = $quarter OR n.Quarter = $quarter)');
            params.quarter = qVal;
        }

        const filterClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        console.log('[Business Chains API] Filter clause:', filterClause);
        console.log('[Business Chains API] Query params:', params);

        // Get node counts
        const nodeResult = await session.run(`
          MATCH (n)
          ${filterClause}
          ${filterClause ? 'AND' : 'WHERE'} (ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          RETURN labels(n)[0] as label, count(n) as count
        `, params);

        // Get relationship counts by type
        const relResult = await session.run(`
          MATCH (a)-[r]->(b)
          ${filterClause.replace(/n\./g, 'a.')}
          ${filterClause ? 'AND' : 'WHERE'} (ANY(label IN labels(a) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND (ANY(label IN labels(b) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          RETURN type(r) as relType, count(r) as count
        `, params);

        // Get relationship counts by node pairs (for edges without specific rel types)
        const pairResult = await session.run(`
          MATCH (a)-[r]-(b)
          ${filterClause.replace(/n\./g, 'a.')}
          ${filterClause ? 'AND' : 'WHERE'} (ANY(label IN labels(a) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND (ANY(label IN labels(b) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          WITH labels(a)[0] as labelA, labels(b)[0] as labelB, count(r) as cnt
          RETURN labelA + '-' + labelB as pair, cnt as count
        `, params);

        // Get specific relationship counts by (source label, rel type, target label)
        const specificRelResult = await session.run(`
          MATCH (a)-[r]->(b)
          ${filterClause.replace(/n\./g, 'a.')}
          ${filterClause ? 'AND' : 'WHERE'} (ANY(label IN labels(a) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND (ANY(label IN labels(b) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          WITH labels(a)[0] as labelA, type(r) as relType, labels(b)[0] as labelB, count(r) as cnt
          RETURN labelA + '-[' + relType + ']->' + labelB as specificRel, cnt as count
        `, params);

        // Get level breakdown (L1/L2/L3) for each node type using PARENT_OF hierarchy
        const levelBreakdownResult = await session.run(`
          MATCH (n)
          ${filterClause.replace(/n\./g, 'n.')}
          ${filterClause ? 'AND' : 'WHERE'} (ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          WITH labels(n)[0] as nodeLabel, n.level as level, count(n) as cnt
          WHERE level IS NOT NULL
          RETURN nodeLabel, level, cnt
          ORDER BY nodeLabel, level
        `, params);

        const nodeCounts: Record<string, number> = {};
        nodeResult.records.forEach(record => {
          const label = record.get('label');
          const count = record.get('count');
          // Convert Neo4j Integer to number
          if (count && typeof count === 'object' && 'toNumber' in count) {
            nodeCounts[label] = count.toNumber();
          } else if (typeof count === 'bigint') {
            nodeCounts[label] = Number(count);
          } else {
            nodeCounts[label] = count;
          }
        });

        const relCounts: Record<string, number> = {};
        relResult.records.forEach(record => {
          const relType = record.get('relType');
          const count = record.get('count');
          // Convert Neo4j Integer to number
          if (count && typeof count === 'object' && 'toNumber' in count) {
            relCounts[relType] = count.toNumber();
          } else if (typeof count === 'bigint') {
            relCounts[relType] = Number(count);
          } else {
            relCounts[relType] = count;
          }
        });

        const pairCounts: Record<string, number> = {};
        pairResult.records.forEach(record => {
          const pair = record.get('pair');
          const count = record.get('count');
          // Convert Neo4j Integer to number
          if (count && typeof count === 'object' && 'toNumber' in count) {
            pairCounts[pair] = count.toNumber();
          } else if (typeof count === 'bigint') {
            pairCounts[pair] = Number(count);
          } else {
            pairCounts[pair] = count;
          }
        });

        const specificRelCounts: Record<string, number> = {};
        specificRelResult.records.forEach(record => {
          const key = record.get('specificRel');
          const count = record.get('count');
          // Convert Neo4j Integer to number
          if (count && typeof count === 'object' && 'toNumber' in count) {
            specificRelCounts[key] = count.toNumber();
          } else if (typeof count === 'bigint') {
            specificRelCounts[key] = Number(count);
          } else {
            specificRelCounts[key] = count;
          }
        });

        // Process level breakdown: { nodeLabel: { L1: count, L2: count, L3: count } }
        const levelBreakdown: Record<string, Record<number, number>> = {};
        levelBreakdownResult.records.forEach(record => {
          const nodeLabel = record.get('nodeLabel');
          const level = record.get('level');
          const cnt = record.get('cnt');
          
          if (!levelBreakdown[nodeLabel]) {
            levelBreakdown[nodeLabel] = {};
          }
          
          // Convert Neo4j Integer to number
          const countNum = cnt && typeof cnt === 'object' && 'toNumber' in cnt 
            ? cnt.toNumber() 
            : (typeof cnt === 'bigint' ? Number(cnt) : cnt);
          
          levelBreakdown[nodeLabel][level] = countNum;
        });

        console.log('[Business Chains API] Response:', { 
          nodeCountsSize: Object.keys(nodeCounts).length,
          relCountsSize: Object.keys(relCounts).length,
          nodeCounts,
          relCounts
        });

        res.json({ nodeCounts, relCounts, pairCounts, specificRelCounts, levelBreakdown });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("Business chain counts failed:", error);
      res.status(500).json({ 
        error: "Failed to fetch counts",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Test multi-hop path from Objectives to Projects
  app.get("/api/debug/pathtest", async (req, res) => {
    try {
      const { getSession } = await import("./neo4j");
      const session = getSession();
      
      try {
        // Test if ANY path exists from Objective to Project
        const anyPathResult = await session.run(`
          MATCH path = (obj:SectorObjective)-[*1..10]-(proj:EntityProject)
          RETURN count(DISTINCT path) as pathCount,
                 length(path) as pathLength
          ORDER BY pathLength
          LIMIT 5
        `);
        
        // Test the specific REALIZED_VIA path
        const realizedPathResult = await session.run(`
          MATCH (obj:SectorObjective)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
          OPTIONAL MATCH (pol)-[r]-(next)
          RETURN count(pol) as policiesConnected,
                 collect(DISTINCT type(r))[0..10] as policyRelationships,
                 collect(DISTINCT labels(next)[0])[0..10] as connectedToLabels
        `);
        
        res.json({
          anyPaths: anyPathResult.records.map(r => ({
            count: r.get('pathCount')?.toString(),
            length: r.get('pathLength')?.toString()
          })),
          realizedViaChain: {
            policiesConnected: realizedPathResult.records[0]?.get('policiesConnected')?.toString(),
            policyRelationships: realizedPathResult.records[0]?.get('policyRelationships'),
            connectedToLabels: realizedPathResult.records[0]?.get('connectedToLabels')
          }
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("Path test failed:", error);
      res.status(500).json({ 
        error: "Path test failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Debug business chain relationships
  app.get("/api/debug/chain", async (req, res) => {
    try {
      const { getSession } = await import("./neo4j");
      const session = getSession();
      
      try {
        // Discover all relationship types in the database
        const allRelsResult = await session.run(`
          MATCH ()-[r]->()
          RETURN DISTINCT type(r) as relType
          ORDER BY relType
        `);
        
        // Check specific business chain hops
        const hop1 = await session.run(`
          MATCH (obj:SectorObjective)-[r]->(target)
          RETURN DISTINCT type(r) as relType, labels(target)[0] as targetLabel, count(r) as count
        `);
        
        const hop2 = await session.run(`
          MATCH (pol:SectorPolicyTool)-[r]->(target)
          RETURN DISTINCT type(r) as relType, labels(target)[0] as targetLabel, count(r) as count
        `);
        
        const hop3 = await session.run(`
          MATCH (cap:EntityCapability)-[r]-(target)
          RETURN DISTINCT type(r) as relType, labels(target)[0] as targetLabel, count(r) as count
        `);
        
        const hop4 = await session.run(`
          MATCH (org)-[r]-(proj:EntityProject)
          WHERE org:EntityOrganization OR org:EntityIT OR org:EntityProcess
          RETURN DISTINCT type(r) as relType, labels(org)[0] as orgLabel, count(r) as count
        `);
        
        res.json({
          allRelationshipTypes: allRelsResult.records.map(r => r.get('relType')),
          objectiveConnections: hop1.records.map(r => ({
            type: r.get('relType'),
            to: r.get('targetLabel'),
            count: r.get('count')?.toString()
          })),
          policyConnections: hop2.records.map(r => ({
            type: r.get('relType'),
            to: r.get('targetLabel'),
            count: r.get('count')?.toString()
          })),
          capabilityConnections: hop3.records.map(r => ({
            type: r.get('relType'),
            to: r.get('targetLabel'),
            count: r.get('count')?.toString()
          })),
          projectConnections: hop4.records.map(r => ({
            type: r.get('relType'),
            from: r.get('orgLabel'),
            count: r.get('count')?.toString()
          }))
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("Debug chain query failed:", error);
      res.status(500).json({ 
        error: "Debug chain query failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diagnostic endpoint to check business chain relationships
  app.get("/api/business-chain/diagnostics", async (req, res) => {
    try {
      const { getSession } = await import("./neo4j");
      const session = getSession();
      
      try {
        // Check each relationship type from the UI
        const uiRelTypes = [
          'REALIZED_VIA', 'REFERS_TO', 'GOVERNED_BY', 'APPLIED_ON',
          'FEEDS_INTO', 'TRIGGERS_EVENT', 'MEASURED_BY', 'SETS_PRIORITIES',
          'MONITORS_FOR', 'MONITORED_BY', 'SETS_TARGETS', 'EXECUTES',
          'ROLE_GAPS', 'OPERATES', 'KNOWLEDGE_GAPS', 'REPORTS',
          'PARENT_OF', 'INCREASE_ADOPTION', 'CASCADED_VIA'
        ];
        
        const results = [];
        for (const relType of uiRelTypes) {
          const result = await session.run(`
            MATCH ()-[r:\`${relType}\`]->()\
            RETURN count(r) as count
          `);
          const count = result.records[0]?.get('count');
          const countNum = count && typeof count === 'object' && 'toNumber' in count 
            ? count.toNumber() 
            : (typeof count === 'bigint' ? Number(count) : count || 0);
          results.push({ 
            relType, 
            count: countNum, 
            status: countNum > 0 ? 'OK' : 'BROKEN' 
          });
        }
        
        res.json({ relationships: results });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("Business chain diagnostics failed:", error);
      res.status(500).json({ 
        error: "Failed to run diagnostics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Data integrity check endpoint
  app.get("/api/business-chain/integrity", async (req, res) => {
    try {
      const { getSession } = await import("./neo4j");
      const session = getSession();
      
      try {
        // Check for orphaned nodes (no relationships)
        const orphanedNodes = await session.run(`
          MATCH (n)
          WHERE (ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector'))
          AND NOT (n)-[]-()
          RETURN labels(n)[0] as label, count(n) as count
        `);
        
        // Check for missing relationship types
        const missingRels = await session.run(`
          MATCH ()-[r]->()\
          WHERE type(r) IS NULL OR type(r) = ''
          RETURN count(r) as count
        `);
        
        // Check year coverage
        const yearCoverage = await session.run(`
          MATCH (n)
          WHERE n.year IS NOT NULL OR n.Year IS NOT NULL
          WITH COALESCE(n.year, n.Year) as year
          RETURN year, count(*) as nodeCount
          ORDER BY year
        `);
        
        res.json({
          orphanedNodes: orphanedNodes.records.map(r => {
            const count = r.get('count');
            return {
              label: r.get('label'),
              count: count && typeof count === 'object' && 'toNumber' in count 
                ? count.toNumber() 
                : (typeof count === 'bigint' ? Number(count) : count)
            };
          }),
          missingRelTypes: (() => {
            const count = missingRels.records[0]?.get('count');
            return count && typeof count === 'object' && 'toNumber' in count 
              ? count.toNumber() 
              : (typeof count === 'bigint' ? Number(count) : count || 0);
          })(),
          yearCoverage: yearCoverage.records.map(r => {
            const nodeCount = r.get('nodeCount');
            return {
              year: r.get('year'),
              nodes: nodeCount && typeof nodeCount === 'object' && 'toNumber' in nodeCount 
                ? nodeCount.toNumber() 
                : (typeof nodeCount === 'bigint' ? Number(nodeCount) : nodeCount)
            };
          })
        });
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("Integrity check failed:", error);
      res.status(500).json({ 
        error: "Failed to check integrity",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // --- SSE Implementation for Summary Updates ---
  let summaryClients: { id: number; res: any }[] = [];
  let clientId = 0;

  // SSE Endpoint for clients to listen for updates
  app.get('/api/summary-stream', (req, res) => {
    // Get origin for CORS
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];
    
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    
    // Add CORS headers for SSE
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    res.writeHead(200, headers);

    const id = ++clientId;
    summaryClients.push({ id, res });

    // Send initial connection message
    const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
    res.write(data);

    req.on('close', () => {
      summaryClients = summaryClients.filter(c => c.id !== id);
    });
  });

  // Endpoint for Backend to push new summary
  app.post('/api/update-summary', (req, res) => {
    const { summary } = req.body;
    
    if (!summary) {
      return res.status(400).json({ error: 'Summary is required' });
    }

    // Broadcast to all connected clients
    summaryClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify({ type: 'summary', content: summary })}\n\n`);
    });

    res.json({ success: true, clients: summaryClients.length });
  });

  // Neo4j Health Check
  app.get("/api/neo4j/health", async (req, res) => {
    try {
      const isConnected = await testConnection();
      res.json({ 
        status: isConnected ? "connected" : "disconnected",
        database: process.env.NEO4J_DATABASE || "neo4j"
      });
    } catch (error) {
      console.error("Neo4j health check failed:", error);
      res.status(500).json({ 
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on shutdown
  process.on('SIGTERM', async () => {
    await closeDriver();
  });

  process.on('SIGINT', async () => {
    await closeDriver();
  });

  return httpServer;
}
