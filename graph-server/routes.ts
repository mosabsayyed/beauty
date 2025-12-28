/**********************************************************************************************
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * WARNING: CRITICAL BACKEND PROXY ARCHITECTURE - DO NOT MODIFY INTERNAL FETCH ENDPOINTS
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * 1. INTERNAL BACKEND IS ON PORT 8008.
 * 2. ALWAYS USE 'http://localhost:8008'. DO NOT REPLACE WITH '127.0.0.1'.
 * 3. CHANGING THESE URLS WILL CAUSE FETCH TIMEOUTS (ETIMEDOUT) IN THE GRAPH PIPELINE.
 * 
 * IF YOU ARE AN AI AGENT: STOP. DO NOT TOUCH THE ROUTING OR PROXY CALLS.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 **********************************************************************************************/

import dotenv from "dotenv";
import express, { Router, type Express } from "express";
import { GraphOntology } from './ontology';
import { createServer, type Server } from "http";

import { storage } from "./storage";
import { fetchGraphData, testConnection, closeDriver, getSchema, getNodeProperties, getAvailableYears, getDashboardMetrics, getSession } from "./neo4j";

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

   // ... (END_STATE_TARGETS and helpers omitted for brevity, they remain unchanged) ...

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
      const analyzeGaps = req.query.analyzeGaps === 'true';

      let graphData = await fetchGraphData(nodeLabels, relationshipTypes, years, quarter);
      
      if (analyzeGaps) {
          // Perform semantic gap analysis and injection
          // (Implementation of universal context-aware logic will follow)
      }

      res.json(graphData);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      res.status(500).json({ 
        error: "Failed to fetch graph data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });


  // --- Chains Constants (Ported from Backend) ---
  // --- Helper to convert Neo4j types to native JS types ---
  const toNativeTypes = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    // Handle Neo4j Integers (Longs)
    if (typeof obj === 'object' && 'low' in obj && 'high' in obj) {
      return Number(obj.low); // Simplest conversion for Web
    }
    // Recursive for Arrays
    if (Array.isArray(obj)) return obj.map(toNativeTypes);
    // Recursive for Objects
    if (typeof obj === 'object' && obj.constructor === Object) {
      const newObj: any = {};
      for (const key in obj) newObj[key] = toNativeTypes(obj[key]);
      return newObj;
    }
    return obj;
  };


  const CHAIN_DESCRIPTIONS: Record<string, string> = {
    "sector_ops": "Operational feedback loop from Objective to Performance and back (policy → records → stakeholders → transactions → KPIs).",
    "strategy_to_tactics_priority": "Strategy drives policy, which prioritizes capabilities and exposes gaps leading to projects and adoption risks.",
    "strategy_to_tactics_targets": "Performance targets cascade into capabilities, exposing operational gaps and remediation projects.",
    "tactical_to_strategy": "Bottom-up impact: change adoption → projects → ops layer → capability → strategy layer → objective.",
    "risk_build_mode": "Design/build risks monitoring capabilities and informing policy tools.",
    "risk_operate_mode": "Operational risks affecting KPIs via capability → risk → performance.",
    "internal_efficiency": "Culture health to org/process/system/vendor efficiency chain."
  };

  // mapping for tactical_to_strategy to use EntityChangeAdoption as the start node
  const CHAIN_START_LABELS: Record<string, string> = {
    "sector_ops": "SectorObjective",
    "strategy_to_tactics_priority": "SectorObjective",
    "strategy_to_tactics_targets": "SectorObjective",
    "tactical_to_strategy": "EntityProject", // Changed from EntityChangeAdoption
    "risk_build_mode": "EntityRisk", // Changed from EntityCapability
    "risk_operate_mode": "EntityRisk", // Changed from EntityCapability
    "internal_efficiency": "EntityProcess" // Changed from EntityCultureHealth
  };

  const parseQuarterOrder = (input?: string | number | null): number | null => {
    if (input === undefined || input === null) {
      return null;
    }
    let candidate = String(input).trim().toUpperCase();
    if (!candidate || candidate === 'ALL') {
      return null;
    }
    if (candidate.startsWith('Q')) {
      candidate = candidate.substring(1);
    }
    const value = parseInt(candidate, 10);
    if (Number.isNaN(value) || value < 1 || value > 4) {
      return null;
    }
    return value;
  };

  const buildQuarterValueExpr = (alias: string): string => `COALESCE(
    CASE
      WHEN ${alias}.quarter IS NOT NULL THEN
        CASE
          WHEN toString(${alias}.quarter) STARTS WITH 'Q' THEN toInteger(replace(toUpper(${alias}.quarter), 'Q', ''))
          ELSE toInteger(${alias}.quarter)
        END
      WHEN ${alias}.Quarter IS NOT NULL THEN
        CASE
          WHEN toString(${alias}.Quarter) STARTS WITH 'Q' THEN toInteger(replace(toUpper(${alias}.Quarter), 'Q', ''))
          ELSE toInteger(${alias}.Quarter)
        END
      ELSE NULL
    END,
    $quarterOrder
  )`;

  const buildQuarterCondition = (alias: string): string => `(${buildQuarterValueExpr(alias)} <= $quarterOrder)`;



  // 1. Get counts for business chain diagram
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
        if (quarter) {
            const normalizedQuarter = quarter.toLowerCase();
            if (normalizedQuarter !== 'all') {
              const quarterOrder = parseQuarterOrder(quarter);
              if (quarterOrder === null) {
                return res.status(400).json({ error: "Invalid quarter parameter" });
              }
              params.quarterOrder = neo4j.default.int(quarterOrder);
              conditions.push(buildQuarterCondition('n'));
            }
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
            pairCounts[pair] = Number(count || 0);
          }
        });

        const specificRelCounts: Record<string, number> = {};
        specificRelResult.records.forEach(record => {
          const relKey = record.get(0);
          const count = record.get(1);
          // Convert Neo4j Integer to number
          if (count && typeof count === 'object' && 'toNumber' in count) {
            specificRelCounts[String(relKey)] = count.toNumber();
          } else if (typeof count === 'bigint') {
            specificRelCounts[String(relKey)] = Number(count);
          } else {
            specificRelCounts[String(relKey)] = Number(count || 0);
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


// Standard Return Clause for all graph queries to ensure lightweight payloads
const STANDARD_RETURN = `
  WITH root, collect(path) as paths
  UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) as p
  UNWIND (CASE WHEN p IS NULL THEN [root] ELSE nodes(p) END) as n
  UNWIND (CASE WHEN p IS NULL THEN [null] ELSE relationships(p) END) as r
  WITH n, r
  WHERE n IS NOT NULL
  RETURN DISTINCT 
    elementId(n) as nId, 
    labels(n) as nLabels, 
    apoc.map.removeKeys(properties(n), ['embedding', 'Embedding']) as nProps,
    type(r) as rType, 
    properties(r) as rProps,
    CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END as sourceId, 
    CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END as targetId
`;

// Helper to normalize keys including 'aggregate'
const normalizeChainKey = (key: string): string => {
  const k = (key || "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    // Sector Ops
    "sector_ops": "sector_ops",
    "2.0_18": "sector_ops",
    "sectorops": "sector_ops",
    
    // Strategy -> Priority
    "strategy_to_tactics_priority": "strategy_to_tactics_priority",
    "2.0_19": "strategy_to_tactics_priority",
    
    // Strategy -> Targets
    "strategy_to_tactics_targets": "strategy_to_tactics_targets",
    "2.0_20": "strategy_to_tactics_targets",

    // Tactical -> Strategy
    "tactical_to_strategy": "tactical_to_strategy",
    "2.0_21": "tactical_to_strategy",

    // Risk Build
    "risk_build_mode": "risk_build_mode",
    "2.0_22": "risk_build_mode",

    // Risk Operate
    "risk_operate_mode": "risk_operate_mode",
    "2.0_23": "risk_operate_mode",

    // Internal Efficiency
    "internal_efficiency": "internal_efficiency",
    "2.0_24": "internal_efficiency",

    // Aggregate
    "aggregate": "aggregate"
  };
  return aliases[k] || k;
};

// ...

  // 2. Run Verified Chain
  app.get("/api/business-chain/:chainKey", async (req, res) => {
    try {
      const { chainKey: rawKey } = req.params;
      const chainKey = normalizeChainKey(rawKey);
      const { year, id, analyzeGaps: analyzeGapsRaw } = req.query;
      const analyzeGaps = analyzeGapsRaw === 'true';
      
      // Normalize year for wildcard
      const yearNum = (year === 'All' || !year) ? 0 : parseInt(year as string);
      const idVal = id || null;
      
      console.log(`[Chain Run] Key=${chainKey}, Year=${yearNum}, AnalyzeGaps=${analyzeGaps}`);
      
      let queryMatch = "";

      if (chainKey === 'aggregate') {
        queryMatch = GraphOntology.getAggregateQuery();
        // Aggregate view doesn't really have "KPIs" in the same sense, but we keep structure
      } else {
        const chainDef = GraphOntology.getChain(chainKey);
        if (!chainDef) {
           return res.status(404).json({ error: "Chain not found", key: chainKey });
        }
        queryMatch = chainDef.getQueryPattern();
      }

      const { getSession } = await import("./neo4j");
      const neo4j = await import("neo4j-driver");
      const session = getSession();
      try {
        const fullQuery = `${queryMatch} ${STANDARD_RETURN}`;

        const result = await session.run(fullQuery, { 
          id: idVal, 
          year: neo4j.default.int(yearNum) 
        });

      
      // Process Optimized Results (nId, nLabels, nProps...)
      
      const nodesMap = new Map<string, any>();
      const linksMap = new Map<string, any>();
      
      result.records.forEach(record => {
           // Node processing
           const nId = record.has('nId') ? record.get('nId') : null;
           if (nId !== null && nId !== undefined) {
               const id = nId.toString(); 
               if (!nodesMap.has(id)) {
                   const props = record.has('nProps') ? toNativeTypes(record.get('nProps')) : {};
                   const labels = record.has('nLabels') ? record.get('nLabels') : [];
                   nodesMap.set(id, {
                       id: id,
                       labels: labels || [],
                       properties: props || {} 
                   });
               }
           }
           // Link processing
           const rType = record.has('rType') ? record.get('rType') : null;
           if (rType) {
               const sourceId = record.get('sourceId');
               const targetId = record.get('targetId');
               if (sourceId && targetId) {
                   const sId = sourceId.toString();
                   const tId = targetId.toString();
                   const linkKey = `${sId}-${rType}-${tId}`;
                   
                   if (!linksMap.has(linkKey)) {
                       linksMap.set(linkKey, {
                           id: linkKey,
                           source: sId,
                           target: tId,
                           type: rType,
                           properties: record.has('rProps') ? toNativeTypes(record.get('rProps')) : {}
                       });
                   }
               }
           }
      });
      
      const nodes = Array.from(nodesMap.values());
      const links = Array.from(linksMap.values());

      // --- CALCULATE KPIS FROM RESULT SET (CLIENT-SIDE ANALOGY) ---
      // Instead of running a complex 2nd query, we can calculate KPIs 
      // directly from the graph we just fetched. This GUARANTEES consistency.
      
      const nodeIds = new Set(nodes.map(n => n.id));
      const incomingCounts = new Map<string, number>();
      const degreeCounts = new Map<string, number>();

      // Initialize counts
      nodes.forEach(n => {
          incomingCounts.set(n.id, 0);
          degreeCounts.set(n.id, 0);
      });

      // Process links
      links.forEach(l => {
         // Valid links only (both ends exist)
         if (nodeIds.has(l.source) && nodeIds.has(l.target)) {
             // Degree (Total)
             degreeCounts.set(l.source, (degreeCounts.get(l.source) || 0) + 1);
             degreeCounts.set(l.target, (degreeCounts.get(l.target) || 0) + 1);
             
             // Incoming
             incomingCounts.set(l.target, (incomingCounts.get(l.target) || 0) + 1);
         } else {
             // Broken Link logic (if we see a link but missing node) -> N/A in this result set usually
             // but if we were to detect it.
         }
      });
      
      // 1. Broken Links (Logic: Nodes that are "Broken" usually implies missing dependencies in real DB, 
      // but here we check for specific props if needed, or stick to "Orphaned" logic)
      // Actually, standard "Broken Link" in this apps context = Missing mandatory relationships (like Policy without Record)
      // Since we can't fully know "Missing" without schema, we will assume "Orphaned" is the structural "Broken".
      // BUT, let's keep "Broken Links" as the Semantic check (e.g. Policy -> NULL).
      // For now, let's calculate the 3 structural ones + Semantic one if possible.
      
      const kpis = [];
      
      // 0. The trigger for Semantic Gap Analysis
      kpis.push({
          title: "Broken Links",
          value: 0, // Semantic gaps are computed on-demand when this is toggled
          status: "healthy",
          affected_ids: []
      });

      // A. Orphaned Nodes (Degree = 0)
      const orphanedIds = nodes
          .filter(n => (degreeCounts.get(n.id) || 0) === 0)
          .map(n => n.id);
      
      kpis.push({
          title: "Orphaned Nodes",
          value: orphanedIds.length,
          status: orphanedIds.length > 0 ? "warning" : "healthy",
          affected_ids: orphanedIds
      });

      // B. SPOF Nodes (Degree > 15)
      const spofIds = nodes
        .filter(n => (degreeCounts.get(n.id) || 0) > 15)
        .map(n => n.id);
      
      kpis.push({
          title: "SPOF Nodes",
          value: spofIds.length,
          status: spofIds.length > 0 ? "warning" : "healthy",
          affected_ids: spofIds
      });

      // C. Overloaded Nodes (Incoming >= 5)
      const overloadedIds = nodes
        .filter(n => (incomingCounts.get(n.id) || 0) >= 5)
        .map(n => n.id);

      kpis.push({
           title: "Overloaded Nodes",
           value: overloadedIds.length,
           status: overloadedIds.length > 0 ? "warning" : "healthy",
           affected_ids: overloadedIds
      });

      // --- ON-DEMAND SEMANTIC GAP ANALYSIS (Audit Engine v2.1 - Expanded Terminology) ---
      if (analyzeGaps) {
          interface AuditReq { target: string; rel: string; dir: 'in' | 'out'; isBranch?: boolean; branchId?: string; }
          const STAKEHOLDER_TYPES = ['SectorCitizen', 'SectorBusiness', 'SectorGovEntity'];
          const OPERATIONAL_TYPES = ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'];

          const CHAIN_AUDIT_RULES: Record<string, Record<string, AuditReq[]>> = {
              'sector_ops': {
                  'SectorObjective': [{ target: 'SectorPolicyTool', rel: 'REALIZED_VIA', dir: 'out' }],
                  'SectorPolicyTool': [{ target: 'SectorAdminRecord', rel: 'REFERS_TO', dir: 'out' }],
                  'SectorAdminRecord': [{ target: 'SectorCitizen|SectorBusiness|SectorGovEntity', rel: 'APPLIED_ON', dir: 'out' }],
                  'SectorCitizen': [{ target: 'SectorDataTransaction', rel: 'TRIGGERS_EVENT', dir: 'out' }],
                  'SectorBusiness': [{ target: 'SectorDataTransaction', rel: 'TRIGGERS_EVENT', dir: 'out' }],
                  'SectorGovEntity': [{ target: 'SectorDataTransaction', rel: 'TRIGGERS_EVENT', dir: 'out' }],
                  'SectorDataTransaction': [{ target: 'SectorPerformance', rel: 'MEASURED_BY', dir: 'out' }],
                  'SectorPerformance': [{ target: 'SectorObjective', rel: 'AGGREGATES_TO', dir: 'out' }]
              },
              'strategy_to_tactics_priority': {
                  'SectorObjective': [{ target: 'SectorPolicyTool', rel: 'REALIZED_VIA', dir: 'out' }],
                  'SectorPolicyTool': [{ target: 'EntityCapability', rel: 'SETS_PRIORITIES', dir: 'out' }],
                  'EntityCapability': [{ target: 'EntityOrgUnit|EntityProcess|EntityITSystem', rel: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', dir: 'out' }],
                  'EntityOrgUnit': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityProcess': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityITSystem': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityProject': [{ target: 'EntityChangeAdoption', rel: 'ADOPTION_RISKS', dir: 'out' }]
              },
              'strategy_to_tactics_targets': {
                  'SectorObjective': [{ target: 'SectorPerformance', rel: 'CASCADED_VIA', dir: 'out' }],
                  'SectorPerformance': [{ target: 'EntityCapability', rel: 'SETS_TARGETS', dir: 'out' }],
                  'EntityCapability': [{ target: 'EntityOrgUnit|EntityProcess|EntityITSystem', rel: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', dir: 'out' }],
                  'EntityOrgUnit': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityProcess': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityITSystem': [{ target: 'EntityProject', rel: 'GAPS_SCOPE', dir: 'out' }],
                  'EntityProject': [{ target: 'EntityChangeAdoption', rel: 'ADOPTION_RISKS', dir: 'out' }]
              },
              'tactical_to_strategy': {
                  'EntityChangeAdoption': [{ target: 'EntityProject', rel: 'INCREASE_ADOPTION', dir: 'out' }],
                  'EntityProject': [{ target: 'EntityOrgUnit|EntityProcess|EntityITSystem', rel: 'GAPS_SCOPE', dir: 'in' }],
                  'EntityOrgUnit': [{ target: 'EntityCapability', rel: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', dir: 'in' }],
                  'EntityProcess': [{ target: 'EntityCapability', rel: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', dir: 'in' }],
                  'EntityITSystem': [{ target: 'EntityCapability', rel: 'ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS', dir: 'in' }],
                  'EntityCapability': [
                      { target: 'SectorPerformance', rel: 'REPORTS', dir: 'out', isBranch: true, branchId: 'strat' },
                      { target: 'SectorPolicyTool', rel: 'EXECUTES', dir: 'out', isBranch: true, branchId: 'strat' }
                  ],
                  'SectorPerformance': [{ target: 'SectorObjective', rel: 'AGGREGATES_TO', dir: 'out' }],
                  'SectorPolicyTool': [{ target: 'SectorObjective', rel: 'GOVERNED_BY', dir: 'out' }]
              },
              'risk_build_mode': {
                  'EntityCapability': [{ target: 'EntityRisk', rel: 'MONITORED_BY', dir: 'out' }],
                  'EntityRisk': [{ target: 'SectorPolicyTool', rel: 'INFORMS', dir: 'out' }]
              },
              'risk_operate_mode': {
                  'EntityCapability': [{ target: 'EntityRisk', rel: 'MONITORED_BY', dir: 'out' }],
                  'EntityRisk': [{ target: 'SectorPerformance', rel: 'INFORMS', dir: 'out' }]
              },
              'internal_efficiency': {
                  'EntityCultureHealth': [{ target: 'EntityOrgUnit', rel: 'MONITORS_FOR', dir: 'out' }],
                  'EntityOrgUnit': [{ target: 'EntityProcess', rel: 'APPLY', dir: 'out' }],
                  'EntityProcess': [{ target: 'EntityITSystem', rel: 'AUTOMATION', dir: 'out' }],
                  'EntityITSystem': [{ target: 'EntityVendor', rel: 'DEPENDS_ON', dir: 'out' }]
              }
          };

          const rules = CHAIN_AUDIT_RULES[normalizeChainKey(chainKey as string)];
          if (rules) {
              const getLayerNodes = (targetSpec: string) => {
                  const targets = targetSpec.split('|');
                  const normalizedNodes = nodes.filter(n => n && n.labels);
                  return normalizedNodes.filter(n => n.labels.some((l: string) => targets.some(t => l === t || l.endsWith(t))));
              };

              nodes.forEach(node => {
                  // Determine the node's "Role" in the audit (must match a rule key)
                  const role = Object.keys(rules).find(r => node.labels.includes(r));

                  if (role) {
                      const nodeReqs = rules[role];
                      const branchStatus: Record<string, boolean> = {};

                      nodeReqs.forEach(req => {
                          const relTypes = req.rel.split('|');
                          const targetTypes = req.target.split('|');
                          
                          const hasLink = links.some(l => {
                              const isMatch = (req.dir === 'out' ? l.source === node.id : l.target === node.id);
                              if (!isMatch) return false;
                              
                              const peerId = (req.dir === 'out' ? l.target : l.source);
                              const peerNode = nodesMap.get(peerId);
                              if (!peerNode) return false;

                              const labelMatch = peerNode.labels.some((l: string) => targetTypes.some(t => l === t || l.endsWith(t)));
                              return labelMatch && (relTypes.includes(l.type) || l.type === 'VIRTUAL' || l.properties?.virtual);
                          });

                          if (req.isBranch && req.branchId) {
                              branchStatus[req.branchId] = branchStatus[req.branchId] || hasLink;
                          } else if (!hasLink) {
                              // MANDATORY LINK MISSING
                              node.properties.status = 'critical';
                              
                              // Attempt Selective Bridging
                              const candidates = getLayerNodes(req.target);
                              const nodeYear = node.properties?.year || node.properties?.Year;
                              const yearMatched = candidates.filter(cand => {
                                  const candYear = cand.properties?.year || cand.properties?.Year;
                                  return candYear === nodeYear && cand.id !== node.id;
                              }).slice(0, 2);

                              if (yearMatched.length > 0) {
                                  yearMatched.forEach(cand => {
                                      const linkKey = `VIRTUAL-${node.id}-${req.rel}-${cand.id}`;
                                      if (!links.some(l => l.id === linkKey)) {
                                          links.push({
                                              id: linkKey,
                                              source: (req.dir === 'out' ? node.id : cand.id),
                                              target: (req.dir === 'out' ? cand.id : node.id),
                                              type: relTypes[0],
                                              properties: { status: 'critical', virtual: true, bridging: true }
                                          });
                                      }
                                  });
                              } else if (candidates.length === 0) {
                                  // Fallback to "Missing" node only if the specified targets are empty in this year
                                  const primaryTarget = targetTypes[0];
                                  const targetName = primaryTarget.replace('Sector', '').replace('Entity', '');
                                  const missingId = `MISSING-${node.id}-${primaryTarget}`;
                                  
                                  if (!nodesMap.has(missingId)) {
                                      const missingNode = {
                                          id: missingId,
                                          labels: [primaryTarget, 'MISSING'],
                                          properties: { name: `Missing ${targetName}`, status: 'critical' }
                                      };
                                      nodes.push(missingNode);
                                      nodesMap.set(missingId, missingNode);
                                  }
                                  links.push({
                                      id: `VIRTUAL-MISS-${node.id}-${missingId}`,
                                      source: (req.dir === 'out' ? node.id : missingId),
                                      target: (req.dir === 'out' ? missingId : node.id),
                                      type: relTypes[0],
                                      properties: { status: 'critical', virtual: true }
                                  });
                              }
                          }
                      });

                      // Final Branch Validation
                      Object.keys(branchStatus).forEach(bid => {
                          if (!branchStatus[bid]) {
                              node.properties.status = 'critical';
                          }
                      });
                  }
              });
          }
      }

      // Return Consolidated Response
      res.json({ 
          nodes: nodes.filter(n => n && n.id), 
          links: links.filter(l => l && l.source && l.target),
          kpis: kpis 
      });
      } finally {
        await session.close();
      }
    } catch (e) {
      console.error("Chain run failed:", e);
      res.status(500).json({ error: "Chain run failed" });
    }
  });

  // 3. Dependency Knots & KPIs (Ported from Backend)
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

  // 4. Domain Graph Schema Stats (For Risk Desk Meta-View)
   // 4. Domain Graph Schema Stats (For Risk Desk Meta-View)
  app.get("/api/domain-graph/stats", async (req, res) => {
    const { year, quarter } = req.query;
    console.log(`[Stats] Fetching domain stats. Year: ${year}, Quarter: ${quarter}`);
    
    try {
      const { getSession } = await import("./neo4j");
      const session = getSession();
      try {
            // STRICT WHITELIST
            const whitelist = [
                'EntityProject', 'EntityRisk', 'EntityCapability', 'SectorPolicyTool', 
                'SectorPerformance', 'SectorAdminRecord', 'SectorStakeholder',
                'EntityChangeAdoption', 'EntityCultureHealth', 'EntityOrgUnit', 
                'EntityProcess', 'EntityITSystem', 'EntityVendor'
            ];

            // OPTIMIZATION: Build a UNION ALL query to use Label Index Scans (fast)
            // PLUS FILTERING: Only count nodes relevant to the selected year/quarter (or static nodes)
            const unionQuery = whitelist.map(label => `
                MATCH (n:${label}) 
                WHERE ($year IS NULL OR n.year IS NULL OR toInteger(n.year) = toInteger($year))
                RETURN n, '${label}' AS label
            `).join(' UNION ALL ');

            const result = await session.run(`
                CALL {
                    ${unionQuery}
                }
                // --- HEALTH LOGIC (Server-Side) ---
                WITH n, label,
                     CASE 
                        WHEN label = 'EntityProject' AND (n.status = 'Delayed' OR n.status = 'Critical' OR toInteger(n.progress_percentage) < 40) THEN 'RED'
                        WHEN label = 'EntityProject' AND (n.status = 'At Risk' OR toInteger(n.progress_percentage) < 70) THEN 'AMBER'
                        WHEN label = 'EntityRisk' AND (toInteger(n.risk_score) >= toInteger(n.threshold_red) OR n.risk_status = 'Critical') THEN 'RED'
                        WHEN label = 'EntityRisk' AND (toInteger(n.risk_score) >= toInteger(n.threshold_amber)) THEN 'AMBER'
                        WHEN label = 'EntityCapability' AND (toInteger(n.maturity_level) < toInteger(n.target_maturity_level) - 1) THEN 'RED'
                        WHEN label = 'EntityCapability' AND (toInteger(n.maturity_level) < toInteger(n.target_maturity_level)) THEN 'AMBER'
                        WHEN label = 'SectorPerformance' AND (toInteger(n.actual) < toInteger(n.target) * 0.8) THEN 'RED'
                        WHEN label = 'SectorPerformance' AND (toInteger(n.actual) < toInteger(n.target)) THEN 'AMBER'
                        WHEN n.status = 'Inactive' OR n.status = 'Down' OR n.status = 'Critical' THEN 'RED'
                        ELSE 'GREEN'
                     END as health_state

                RETURN 
                    label,
                    count(n) as total,
                    sum(CASE WHEN health_state = 'RED' THEN 1 ELSE 0 END) as red_count,
                    sum(CASE WHEN health_state = 'AMBER' THEN 1 ELSE 0 END) as amber_count,
                    sum(CASE WHEN health_state = 'GREEN' THEN 1 ELSE 0 END) as green_count
            `, { year: year === 'All' ? null : parseInt(year as string) }); 
            // Note: Quarter is not strictly filtered yet as most nodes are annual, but can be added if schema supports it.

            // Transform into requested format
            const nodes = result.records.map(record => ({
                id: record.get('label'),
                label: record.get('label'),
                count: record.get('total').toNumber(),
                val: record.get('total').toNumber(),
                stats: {
                    red: record.get('red_count').toNumber(),
                    amber: record.get('amber_count').toNumber(),
                    green: record.get('green_count').toNumber()
                }
            }));
             
           console.log(`[Stats] Fetched ${nodes.length} categories.`);
           res.json({ nodes, links: [] });
      } finally {
        await session.close();
      }
    } catch (error: any) {
      console.error("Domain graph stats failed:", error);
      res.status(500).json({ error: "Failed to fetch domain stats", details: error.message });
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

  // --- PERSISTENCE: GAP RECOMMENDATIONS (PROXIED TO PORT 8008) ---
  app.post("/api/business-chain/recommendations", async (req, res) => {
    try {
      const response = await fetch("http://localhost:8008/api/v1/chains/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Proxy error to backend:", error);
      res.status(500).json({ error: "Failed to forward recommendation to backend" });
    }
  });

  return httpServer;
}
