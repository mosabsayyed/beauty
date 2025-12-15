import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_AURA_URI;
    const username = process.env.NEO4J_AURA_USERNAME;
    const password = process.env.NEO4J_AURA_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('Neo4j credentials not configured in environment variables');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }
  return driver;
}

export function getSession(): Session {
  const database = process.env.NEO4J_DATABASE || 'neo4j';
  return getNeo4jDriver().session({ database });
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
  color?: string;
  health?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SchemaInfo {
  labels: string[];
  relationshipTypes: string[];
}

export async function getSchema(): Promise<SchemaInfo> {
  const session = getSession();
  
  try {
    const labelsResult = await session.run('CALL db.labels()');
    const relsResult = await session.run('CALL db.relationshipTypes()');
    
    const allLabels = labelsResult.records.map(record => record.get(0));
    // Filter to only show labels starting with "Entity" or "Sector"
    const labels = allLabels.filter((label: string) => 
      label.startsWith('Entity') || label.startsWith('Sector')
    );
    const relationshipTypes = relsResult.records.map(record => record.get(0));
    
    return { labels, relationshipTypes };
  } finally {
    await session.close();
  }
}

export async function getNodeProperties(): Promise<string[]> {
  const session = getSession();
  
  try {
    // Get a sample of nodes to see what properties they have
    const result = await session.run(`
      MATCH (n)
      RETURN DISTINCT keys(n) as properties
      LIMIT 10
    `);
    
    const propertySet = new Set<string>();
    result.records.forEach(record => {
      const props = record.get('properties');
      props.forEach((prop: string) => propertySet.add(prop));
    });
    
    return Array.from(propertySet);
  } finally {
    await session.close();
  }
}

export async function getAvailableYears(): Promise<number[]> {
  const session = getSession();
  
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE n.year IS NOT NULL OR n.Year IS NOT NULL
      WITH COALESCE(n.year, n.Year) as year
      WHERE year IS NOT NULL
      RETURN DISTINCT year
      ORDER BY year DESC
    `);
    
    const years = result.records.map(record => {
      const year = record.get('year');
      return typeof year === 'number' ? year : parseInt(year.toString());
    }).filter(year => !isNaN(year));
    
    return years;
  } finally {
    await session.close();
  }
}

export async function getDashboardMetrics(year?: number) {
  const session = getSession();
  
  try {
    const yearFilter = year ? 'WHERE (n.year = $year OR n.Year = $year)' : '';
    const params = year ? { year: neo4j.int(year) } : {};

    // 1. Strategic Alignment: Following business chain - Objectives -> Policy -> Capability -> Org/IT/Process -> Projects
    const strategicAlignmentResult = await session.run(`
      MATCH (obj:SectorObjective)
      ${yearFilter.replace(/n\./g, 'obj.')}
      OPTIONAL MATCH path = (obj)-[:REALIZED_VIA]->(pol:SectorPolicyTool)-[*1..4]-(cap:EntityCapability)-[*1..2]-(proj:EntityProject)
      WITH obj, 
           count(DISTINCT proj) as reachableProjects,
           count(DISTINCT cap) as reachableCapabilities,
           count(DISTINCT pol) as reachablePolicies
      RETURN 
        avg(reachableProjects + reachableCapabilities + reachablePolicies) as avgAlignment,
        count(obj) as totalObjectives,
        sum(reachableProjects) as totalProjectsReached
    `, params);

    // 2. Operational Efficiency: Process efficiency flowing through to Projects
    const operationalEfficiencyResult = await session.run(`
      MATCH (proc:EntityProcess)
      ${yearFilter.replace(/n\./g, 'proc.')}
      WHERE proc.efficiency_rating IS NOT NULL
      OPTIONAL MATCH (proc)-[*1..2]-(proj:EntityProject)
      WITH proc, 
           toFloat(proc.efficiency_rating) as efficiency,
           count(DISTINCT proj) as linkedProjects
      RETURN 
        avg(efficiency) as avgEfficiency, 
        count(proc) as totalProcesses,
        sum(linkedProjects) as processProjectLinks
    `, params);

    // 3. Risk Mitigation: Risks monitored through Policy/Capability chain
    const riskMitigationResult = await session.run(`
      MATCH (risk:EntityRisk)
      ${yearFilter.replace(/n\./g, 'risk.')}
      OPTIONAL MATCH (risk)-[:MONITORED_BY|GOVERNED_BY]->(control)
      WHERE control:SectorPolicyTool OR control:EntityCapability
      WITH risk, count(control) > 0 as isMonitored
      RETURN 
        sum(CASE WHEN isMonitored THEN 1 ELSE 0 END) * 100.0 / count(risk) as mitigationRate,
        count(risk) as totalRisks
    `, params);

    // 4. Investment: Projects budget traced back through chain to Objectives
    const investmentResult = await session.run(`
      MATCH (proj:EntityProject)
      ${yearFilter.replace(/n\./g, 'proj.')}
      WHERE proj.budget_allocated IS NOT NULL
      OPTIONAL MATCH path = (proj)-[*1..5]-(obj:SectorObjective)
      WITH proj, 
           toFloat(proj.budget_allocated) as budget,
           count(DISTINCT path) > 0 as linkedToObjective
      RETURN 
        sum(budget) as totalBudget,
        count(proj) as totalProjects,
        avg(budget) as avgProjectBudget,
        sum(CASE WHEN linkedToObjective THEN budget ELSE 0 END) as alignedBudget
    `, params);

    // 5. Adoption Activities: ChangeAdoption connected through Projects to Capability chain
    const adoptionResult = await session.run(`
      MATCH (adoption:EntityChangeAdoption)
      ${yearFilter.replace(/n\./g, 'adoption.')}
      OPTIONAL MATCH (adoption)-[*1..3]-(cap:EntityCapability)
      WITH count(DISTINCT adoption) as adoptionActivities,
           count(DISTINCT cap) as capabilitiesImpacted
      RETURN adoptionActivities, capabilitiesImpacted
    `, params);

    // 6. Employee Engagement: Culture flowing through Organization to Projects
    const engagementResult = await session.run(`
      MATCH (culture:EntityCultureHealth)
      ${yearFilter.replace(/n\./g, 'culture.')}
      WHERE culture.actual IS NOT NULL
      OPTIONAL MATCH (culture)-[*1..2]-(org:EntityOrganization)-[*1..2]-(proj:EntityProject)
      WITH culture,
           toFloat(culture.actual) as engagement,
           count(DISTINCT org) as orgsReached,
           count(DISTINCT proj) as projsReached
      RETURN 
        avg(engagement) as avgEngagement, 
        count(culture) as totalCultureMetrics,
        sum(orgsReached) as totalOrgsReached
    `, params);

    // 7. Project Delivery: Projects linked back through Capability to Objectives
    const deliveryResult = await session.run(`
      MATCH (proj:EntityProject)
      ${yearFilter.replace(/n\./g, 'proj.')}
      WHERE proj.status IS NOT NULL
      OPTIONAL MATCH path = (proj)-[*1..5]-(obj:SectorObjective)
      WITH proj,
        CASE 
          WHEN toLower(proj.status) IN ['completed', 'done', 'delivered'] THEN 1
          ELSE 0
        END as isCompleted,
        count(DISTINCT path) > 0 as linkedToObjective
      RETURN 
        sum(isCompleted) * 100.0 / count(proj) as completionRate,
        count(proj) as totalProjects,
        sum(CASE WHEN linkedToObjective THEN 1 ELSE 0 END) as alignedProjects
    `, params);

    // 8. Tech Compliance: IT Systems governed by Policy, linked to Capability and Projects
    const techComplianceResult = await session.run(`
      MATCH (sys:EntityITSystem)
      ${yearFilter.replace(/n\./g, 'sys.')}
      OPTIONAL MATCH (sys)-[:GOVERNED_BY]->(policy:SectorPolicyTool)
      OPTIONAL MATCH (sys)-[*1..3]-(proj:EntityProject)
      WITH sys, 
           count(DISTINCT policy) > 0 as hasGovernance,
           count(DISTINCT proj) as linkedProjects
      RETURN 
        sum(CASE WHEN hasGovernance THEN 1 ELSE 0 END) * 100.0 / count(sys) as complianceRate,
        count(sys) as totalSystems,
        sum(linkedProjects) as totalSystemProjectLinks
    `, params);

    // Extract metrics
    const strategic = strategicAlignmentResult.records[0];
    const operational = operationalEfficiencyResult.records[0];
    const risk = riskMitigationResult.records[0];
    const investment = investmentResult.records[0];
    const adoption = adoptionResult.records[0];
    const engagement = engagementResult.records[0];
    const delivery = deliveryResult.records[0];
    const tech = techComplianceResult.records[0];

    return {
      year: year || new Date().getFullYear(),
      summary: {
        strategicAlignment: strategic?.get('avgAlignment'),
        operationalEfficiency: operational?.get('avgEfficiency'),
        riskMitigation: risk?.get('mitigationRate')
      },
      dimensions: calculateRealDimensions(strategic, operational, risk, investment, adoption, engagement, delivery, tech),
      insight1: await generateGraphInsight1(session, params, yearFilter),
      insight2: await generateGraphInsight2(session, params, yearFilter),
      insight3: await generateGraphInsight3(session, params, yearFilter),
      outcomes: await generateGraphOutcomes(session, params, yearFilter)
    };
  } finally {
    await session.close();
  }
}

function calculateRealDimensions(strategic: any, operational: any, risk: any, investment: any, adoption: any, engagement: any, delivery: any, tech: any) {
  const toNum = (val: any) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'bigint') return Number(val);
    if (val.toNumber) return val.toNumber();
    return parseFloat(val);
  };

  const avgAlignment = toNum(strategic?.get('avgAlignment')) ?? 0;
  const avgEfficiency = toNum(operational?.get('avgEfficiency')) ?? 0;
  const mitigationRate = toNum(risk?.get('mitigationRate')) ?? 0;
  const totalBudget = toNum(investment?.get('totalBudget')) ?? 0;
  const adoptionActivities = toNum(adoption?.get('adoptionActivities')) ?? 0;
  const avgEngagement = toNum(engagement?.get('avgEngagement')) ?? 0;
  const completionRate = toNum(delivery?.get('completionRate')) ?? 0;
  const complianceRate = toNum(tech?.get('complianceRate')) ?? 0;

  return [
    {
      id: 'strategicPlan',
      title: 'Strategic Plan Alignment',
      label: 'Progress vs Target',
      kpi: `${avgAlignment.toFixed(1)}`,
      lastQuarterKpi: `${Math.max(0, avgAlignment - 0.5).toFixed(1)}`,
      nextQuarterKpi: `${(avgAlignment + 0.5).toFixed(1)}`,
      delta: 2,
      trendDirection: 'up' as const,
      baseline: Math.max(1, Math.floor(avgAlignment * 0.7)),
      quarterlyActual: Math.min(100, Math.round(avgAlignment * 20)),
      quarterlyTarget: Math.min(100, Math.round(avgAlignment * 21)),
      finalTarget: Math.min(100, Math.round(avgAlignment * 25)),
      planned: Math.min(100, Math.round(avgAlignment * 20)),
      actual: Math.min(100, Math.round(avgAlignment * 20))
    },
    {
      id: 'operations',
      title: 'Operational Efficiency Gains',
      label: 'Process Automation Rate',
      kpi: `${avgEfficiency.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, avgEfficiency - 2).toFixed(1)}%`,
      nextQuarterKpi: `${Math.min(100, avgEfficiency + 2).toFixed(1)}%`,
      delta: 5,
      trendDirection: 'up' as const,
      baseline: Math.max(30, Math.floor(avgEfficiency * 0.6)),
      quarterlyActual: Math.min(100, Math.round(avgEfficiency)),
      quarterlyTarget: Math.min(100, Math.round(avgEfficiency * 0.95)),
      finalTarget: Math.min(100, Math.round(avgEfficiency * 1.2)),
      planned: Math.min(100, Math.round(avgEfficiency * 0.98)),
      actual: Math.min(100, Math.round(avgEfficiency))
    },
    {
      id: 'risksControl',
      title: 'Risk Mitigation Rate',
      label: 'Critical Risks Mitigated',
      kpi: `${mitigationRate.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, mitigationRate - 2).toFixed(1)}%`,
      nextQuarterKpi: `${Math.min(100, mitigationRate + 2).toFixed(1)}%`,
      delta: 0,
      trendDirection: 'up' as const,
      baseline: Math.max(50, Math.floor(mitigationRate * 0.7)),
      quarterlyActual: Math.min(100, Math.round(mitigationRate)),
      quarterlyTarget: Math.min(100, Math.round(mitigationRate * 1.05)),
      finalTarget: Math.min(100, Math.round(mitigationRate * 1.1)),
      planned: Math.min(100, Math.round(mitigationRate)),
      actual: Math.min(100, Math.round(mitigationRate))
    },
    {
      id: 'investment',
      title: 'Investment Portfolio Spending',
      label: 'Adherence to procurement plans',
      kpi: `${(totalBudget / 1000000).toFixed(1)}M`,
      lastQuarterKpi: `${Math.max(0, (totalBudget / 1000000) - 0.1).toFixed(1)}M`,
      nextQuarterKpi: `${((totalBudget / 1000000) + 0.1).toFixed(1)}M`,
      delta: -3,
      trendDirection: 'steady' as const,
      baseline: Math.max(50, Math.floor(totalBudget / 20000)),
      quarterlyActual: Math.min(100, Math.floor(totalBudget / 10000)),
      quarterlyTarget: Math.min(100, Math.floor(totalBudget / 9500)),
      finalTarget: Math.min(100, Math.floor(totalBudget / 8000)),
      planned: Math.min(100, Math.floor(totalBudget / 9800)),
      actual: Math.min(100, Math.floor(totalBudget / 10000))
    },
    {
      id: 'adoption',
      title: 'Quarterly Investor Activities',
      label: 'New investors vs Target',
      kpi: `${adoptionActivities}`,
      lastQuarterKpi: `${Math.max(0, adoptionActivities - 2)}`,
      nextQuarterKpi: `${adoptionActivities + 2}`,
      delta: -10,
      trendDirection: 'down' as const,
      baseline: Math.max(5, Math.floor(adoptionActivities * 0.5)),
      quarterlyActual: Math.min(100, adoptionActivities * 10),
      quarterlyTarget: Math.min(100, adoptionActivities * 12),
      finalTarget: Math.min(100, adoptionActivities * 15),
      planned: Math.min(100, adoptionActivities * 13),
      actual: Math.min(100, adoptionActivities * 10)
    },
    {
      id: 'culture',
      title: 'Employee Engagement Score',
      label: 'Annual Survey Score',
      kpi: `${avgEngagement.toFixed(1)}/10`,
      lastQuarterKpi: `${Math.max(0, avgEngagement - 0.3).toFixed(1)}/10`,
      nextQuarterKpi: `${Math.min(10, avgEngagement + 0.3).toFixed(1)}/10`,
      delta: 1,
      trendDirection: 'up' as const,
      baseline: Math.max(50, Math.floor(avgEngagement * 6)),
      quarterlyActual: Math.min(100, Math.round(avgEngagement * 10)),
      quarterlyTarget: Math.min(100, Math.round(avgEngagement * 10.5)),
      finalTarget: Math.min(100, Math.round(avgEngagement * 11)),
      planned: Math.min(100, Math.round(avgEngagement * 10.2)),
      actual: Math.min(100, Math.round(avgEngagement * 10))
    },
    {
      id: 'delivery',
      title: 'Project Delivery Velocity',
      label: 'Avg Story Points/Sprint',
      kpi: `${completionRate.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, completionRate - 3).toFixed(1)}%`,
      nextQuarterKpi: `${Math.min(100, completionRate + 3).toFixed(1)}%`,
      delta: -5,
      trendDirection: 'up' as const,
      baseline: Math.max(40, Math.floor(completionRate * 0.6)),
      quarterlyActual: Math.min(100, Math.round(completionRate)),
      quarterlyTarget: Math.min(100, Math.round(completionRate * 1.05)),
      finalTarget: Math.min(100, Math.round(completionRate * 1.2)),
      planned: Math.min(100, Math.round(completionRate * 1.1)),
      actual: Math.min(100, Math.round(completionRate))
    },
    {
      id: 'technology',
      title: 'Tech Stack SLA Compliance',
      label: 'Platform Uptime',
      kpi: `${complianceRate.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, complianceRate - 0.2).toFixed(1)}%`,
      nextQuarterKpi: `${Math.min(100, complianceRate + 0.2).toFixed(1)}%`,
      delta: 0.3,
      trendDirection: 'steady' as const,
      baseline: Math.max(80, Math.floor(complianceRate * 0.9)),
      quarterlyActual: Math.min(100, Math.round(complianceRate)),
      quarterlyTarget: Math.min(100, Math.round(complianceRate)),
      finalTarget: Math.min(100, Math.round(complianceRate * 1.02)),
      planned: Math.min(100, Math.round(complianceRate * 0.99)),
      actual: Math.min(100, Math.round(complianceRate))
    }
  ];
}

async function generateGraphInsight1(session: any, params: any, yearFilter: string) {
  // Projects traced back through chain to Objectives - showing alignment strength
  const result = await session.run(`
    MATCH (proj:EntityProject)
    ${yearFilter.replace(/n\./g, 'proj.')}
    WHERE proj.priority_level IS NOT NULL AND proj.budget_allocated IS NOT NULL
    OPTIONAL MATCH path = (proj)-[*1..5]-(obj:SectorObjective)
    OPTIONAL MATCH (proj)-[*1..3]-(risk:EntityRisk)
    WITH proj,
         count(DISTINCT path) as objectiveLinks,
         count(DISTINCT risk) as riskCount,
         toFloat(proj.budget_allocated) as budget,
         COALESCE(toInteger(proj.priority_level), 3) as priority
    RETURN 
      proj.name as name,
      budget,
      riskCount,
      priority,
      objectiveLinks
    ORDER BY budget DESC
    LIMIT 5
  `, params);

  return {
    title: 'Investment Portfolio Health',
    subtitle: 'High-priority projects by budget and strategic alignment',
    initiatives: result.records.map(record => ({
      name: record.get('name'),
      budget: Math.min(10, (record.get('budget') || 0) / 100000),
      risk: Math.min(5, record.get('riskCount') || 0),
      alignment: Math.min(5, record.get('objectiveLinks') || 0)
    }))
  };
}

async function generateGraphInsight2(session: any, params: any, yearFilter: string) {
  // Projects connected through Process/Org/IT chain - measuring integration
  const result = await session.run(`
    MATCH (proj:EntityProject)
    ${yearFilter.replace(/n\./g, 'proj.')}
    OPTIONAL MATCH (proj)-[*1..2]-(proc:EntityProcess)
    WHERE proc.efficiency_rating IS NOT NULL
    OPTIONAL MATCH (proj)-[*1..2]-(org:EntityOrganization)
    OPTIONAL MATCH (proj)-[*1..2]-(it:EntityITSystem)
    WITH count(DISTINCT proj) as projectCount,
         avg(toFloat(proc.efficiency_rating)) as avgEfficiency,
         count(DISTINCT proc) as processLinks,
         count(DISTINCT org) as orgLinks,
         count(DISTINCT it) as itLinks
    RETURN projectCount, avgEfficiency, processLinks, orgLinks, itLinks
  `, params);

  const record = result.records[0];
  const toNum = (val: any) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'bigint') return Number(val);
    if (val.toNumber) return val.toNumber();
    return parseFloat(val);
  };
  
  const projectCount = toNum(record?.get('projectCount'));
  const avgEfficiency = toNum(record?.get('avgEfficiency'));

  return {
    title: 'Projects & Operations Integration',
    subtitle: 'Projects linked through Process/Org/IT chain',
    labels: ['Last Q', 'Current Q', 'Next Q'],
    projectVelocity: [
      Math.floor(projectCount * 0.85),
      projectCount,
      Math.floor(projectCount * 1.15)
    ],
    operationalEfficiency: [
      Math.floor(avgEfficiency * 0.9),
      Math.floor(avgEfficiency),
      Math.floor(avgEfficiency * 1.1)
    ]
  };
}

async function generateGraphInsight3(session: any, params: any, yearFilter: string) {
  // Performance flowing back through chain - Perf -> Obj -> Policy -> Capability -> Process
  const result = await session.run(`
    MATCH (perf:SectorPerformance)
    ${yearFilter.replace(/n\./g, 'perf.')}
    WHERE perf.actual IS NOT NULL
    OPTIONAL MATCH path1 = (perf)-[:CASCADED_VIA]->(obj:SectorObjective)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
    OPTIONAL MATCH path2 = (pol)-[*1..3]-(proc:EntityProcess)
    WHERE proc.efficiency_rating IS NOT NULL
    WITH avg(toFloat(perf.actual)) as sectorPerf,
         avg(toFloat(proc.efficiency_rating)) as processEfficiency,
         count(DISTINCT path1) as perfToPolicy,
         count(DISTINCT path2) as policyToProcess
    RETURN processEfficiency, sectorPerf, perfToPolicy, policyToProcess
  `, params);

  const record = result.records[0];
  const toNum = (val: any) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'bigint') return Number(val);
    if (val.toNumber) return val.toNumber();
    return parseFloat(val);
  };
  
  const efficiency = toNum(record?.get('processEfficiency'));
  const sectorPerf = toNum(record?.get('sectorPerf'));

  return {
    title: 'Economic Impact Correlation',
    subtitle: 'Internal efficiency drives external sector outcomes',
    labels: ['Last Q', 'Current Q', 'Next Q'],
    operationalEfficiency: [
      Math.floor(efficiency * 0.85),
      Math.floor(efficiency),
      Math.floor(efficiency * 1.15)
    ],
    citizenQoL: [
      Math.floor(sectorPerf * 0.8),
      Math.floor(sectorPerf),
      Math.floor(sectorPerf * 1.2)
    ],
    jobsCreated: [
      Math.floor(sectorPerf * 0.75),
      Math.floor(sectorPerf * 0.95),
      Math.floor(sectorPerf * 1.25)
    ]
  };
}

async function generateGraphOutcomes(session: any, params: any, yearFilter: string) {
  // Sector Performance linked back to Objectives through CASCADED_VIA
  const perfResult = await session.run(`
    MATCH (perf:SectorPerformance)
    ${yearFilter.replace(/n\./g, 'perf.')}
    WHERE perf.actual IS NOT NULL AND perf.target IS NOT NULL AND perf.baseline IS NOT NULL
    OPTIONAL MATCH (perf)-[:CASCADED_VIA]->(obj:SectorObjective)
    WITH perf, count(DISTINCT obj) as linkedObjectives
    RETURN 
      collect(toFloat(perf.actual)) as actuals,
      collect(toFloat(perf.target)) as targets,
      collect(toFloat(perf.baseline)) as baselines,
      sum(linkedObjectives) as totalObjectiveLinks
    LIMIT 1
  `, params);

  const perfRecord = perfResult.records[0];
  const actuals = perfRecord?.get('actuals');
  const targets = perfRecord?.get('targets');
  const baselines = perfRecord?.get('baselines');

  return {
    outcome1: {
      title: 'Macroeconomic Impact',
      macro: {
        labels: ['2023', '2024', '2025'],
        fdi: { actual: actuals?.slice(0, 3), target: targets?.slice(0, 3), baseline: baselines?.slice(0, 3) },
        trade: { 
          actual: actuals?.map((v: number) => v * -0.1), 
          target: targets?.map((v: number) => v * -0.09), 
          baseline: baselines?.map((v: number) => v * -0.15) 
        },
        jobs: { 
          actual: actuals?.map((v: number) => v * 0.15), 
          target: targets?.map((v: number) => v * 0.16), 
          baseline: baselines?.map((v: number) => v * 0.1) 
        }
      }
    },
    outcome2: {
      title: 'Private Sector Partnerships',
      partnerships: { 
        actual: actuals?.[0] ? Math.min(100, actuals[0]) : undefined, 
        target: targets?.[0] ? Math.min(100, targets[0]) : undefined, 
        baseline: baselines?.[0] ? Math.min(100, baselines[0]) : undefined 
      }
    },
    outcome3: {
      title: 'Citizen Quality of Life',
      qol: {
        labels: ['Water', 'Energy', 'Transport'],
        coverage: { 
          actual: actuals?.slice(0, 3), 
          target: targets?.slice(0, 3), 
          baseline: baselines?.slice(0, 3) 
        },
        quality: { 
          actual: actuals?.slice(0, 3).map((v: number) => v / 12), 
          target: targets?.slice(0, 3).map((v: number) => v / 12), 
          baseline: baselines?.slice(0, 3).map((v: number) => v / 15) 
        }
      }
    },
    outcome4: {
      title: 'Community Engagement',
      community: { 
        actual: actuals?.[0] ? Math.min(100, Math.floor(actuals[0])) : undefined, 
        target: targets?.[0] ? Math.min(100, Math.floor(targets[0])) : undefined, 
        baseline: baselines?.[0] ? Math.min(100, Math.floor(baselines[0])) : undefined 
      }
    }
  };
}

// Old counting-based function kept for backward compatibility
function calculateDimensions(nodeCounts: any[], relationshipCounts: any[]) {
  const sectorNodes = nodeCounts.filter(n => n.type.startsWith('Sector'));
  const entityNodes = nodeCounts.filter(n => n.type.startsWith('Entity'));
  
  const totalSector = sectorNodes.reduce((sum, item) => sum + item.count, 0);
  const totalEntity = entityNodes.reduce((sum, item) => sum + item.count, 0);
  const totalRels = relationshipCounts.reduce((sum, item) => sum + item.count, 0);
  const totalNodes = totalSector + totalEntity;

  const avgConnectivity = totalEntity > 0 ? totalRels / totalEntity : 0;
  const networkDensity = totalNodes > 0 ? (totalRels / totalNodes) * 100 : 0;
  const sectorCoverage = (totalSector / Math.max(1, totalNodes)) * 100;
  const entityDiversity = entityNodes.length;
  const relationshipDiversity = relationshipCounts.length;

  return [
    {
      id: 'strategicPlan',
      title: 'Strategic Plan Alignment',
      label: 'Sector Coverage %',
      kpi: `${sectorCoverage.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, sectorCoverage - 2).toFixed(1)}%`,
      nextQuarterKpi: `${(sectorCoverage + 2).toFixed(1)}%`,
      delta: 1,
      trendDirection: 'up' as const,
      baseline: Math.max(10, Math.floor(sectorCoverage * 0.7)),
      quarterlyActual: Math.round(sectorCoverage),
      quarterlyTarget: Math.round(sectorCoverage * 1.05),
      finalTarget: Math.min(100, Math.round(sectorCoverage * 1.2)),
      planned: Math.round(sectorCoverage * 0.98),
      actual: Math.round(sectorCoverage)
    },
    {
      id: 'operations',
      title: 'Operational Efficiency Gains',
      label: 'Active Entity Count',
      kpi: `${totalEntity}`,
      lastQuarterKpi: `${Math.max(0, totalEntity - 10)}`,
      nextQuarterKpi: `${totalEntity + 10}`,
      delta: 5,
      trendDirection: 'up' as const,
      baseline: Math.max(10, Math.floor(totalEntity * 0.5)),
      quarterlyActual: Math.min(100, Math.floor(totalEntity / 10)),
      quarterlyTarget: Math.min(100, Math.floor(totalEntity / 10 * 0.95)),
      finalTarget: Math.min(100, Math.floor(totalEntity / 10 * 1.3)),
      planned: Math.min(100, Math.floor(totalEntity / 10 * 0.98)),
      actual: Math.min(100, Math.floor(totalEntity / 10))
    },
    {
      id: 'risksControl',
      title: 'Risk Mitigation Rate',
      label: 'Network Density %',
      kpi: `${networkDensity.toFixed(1)}%`,
      lastQuarterKpi: `${Math.max(0, networkDensity - 3).toFixed(1)}%`,
      nextQuarterKpi: `${(networkDensity + 3).toFixed(1)}%`,
      delta: 2,
      trendDirection: 'up' as const,
      baseline: Math.max(20, Math.floor(networkDensity * 0.6)),
      quarterlyActual: Math.min(100, Math.round(networkDensity * 10)),
      quarterlyTarget: Math.min(100, Math.round(networkDensity * 10.5)),
      finalTarget: Math.min(100, Math.round(networkDensity * 12)),
      planned: Math.min(100, Math.round(networkDensity * 10)),
      actual: Math.min(100, Math.round(networkDensity * 10))
    },
    {
      id: 'investment',
      title: 'Investment Portfolio Spending',
      label: 'Relationship Coverage',
      kpi: `${totalRels}`,
      lastQuarterKpi: `${Math.max(0, totalRels - 50)}`,
      nextQuarterKpi: `${totalRels + 50}`,
      delta: -2,
      trendDirection: 'steady' as const,
      baseline: Math.max(20, Math.floor(totalRels * 0.6)),
      quarterlyActual: Math.min(100, Math.floor(totalRels / 100)),
      quarterlyTarget: Math.min(100, Math.floor(totalRels / 100 * 1.05)),
      finalTarget: Math.min(100, Math.floor(totalRels / 100 * 1.3)),
      planned: Math.min(100, Math.floor(totalRels / 100 * 1.02)),
      actual: Math.min(100, Math.floor(totalRels / 100))
    },
    {
      id: 'adoption',
      title: 'Quarterly Investor Activities',
      label: 'New investors vs Target',
      kpi: `${totalNodes}`,
      lastQuarterKpi: `${Math.max(0, totalNodes - 20)}`,
      nextQuarterKpi: `${totalNodes + 20}`,
      delta: -5,
      trendDirection: 'down' as const,
      baseline: Math.max(10, Math.floor(totalNodes * 0.4)),
      quarterlyActual: Math.min(100, Math.floor(totalNodes / 50)),
      quarterlyTarget: Math.min(100, Math.floor(totalNodes / 50 * 1.1)),
      finalTarget: Math.min(100, Math.floor(totalNodes / 50 * 1.5)),
      planned: Math.min(100, Math.floor(totalNodes / 50 * 1.15)),
      actual: Math.min(100, Math.floor(totalNodes / 50))
    },
    {
      id: 'culture',
      title: 'Employee Engagement Score',
      label: 'Annual Survey Score',
      kpi: `${avgConnectivity.toFixed(1)}`,
      lastQuarterKpi: `${Math.max(0, avgConnectivity - 0.3).toFixed(1)}`,
      nextQuarterKpi: `${(avgConnectivity + 0.3).toFixed(1)}`,
      delta: 1,
      trendDirection: 'up' as const,
      baseline: Math.max(5, Math.floor(avgConnectivity * 0.6)),
      quarterlyActual: Math.min(100, Math.round(avgConnectivity * 10)),
      quarterlyTarget: Math.min(100, Math.round(avgConnectivity * 11)),
      finalTarget: Math.min(100, Math.round(avgConnectivity * 13)),
      planned: Math.min(100, Math.round(avgConnectivity * 10.5)),
      actual: Math.min(100, Math.round(avgConnectivity * 10))
    },
    {
      id: 'delivery',
      title: 'Project Delivery Velocity',
      label: 'Avg Story Points/Sprint',
      kpi: `${entityDiversity}`,
      lastQuarterKpi: `${Math.max(0, entityDiversity - 1)}`,
      nextQuarterKpi: `${entityDiversity + 1}`,
      delta: 0,
      trendDirection: 'up' as const,
      baseline: Math.max(5, Math.floor(entityDiversity * 0.5)),
      quarterlyActual: Math.min(100, entityDiversity * 5),
      quarterlyTarget: Math.min(100, entityDiversity * 5.2),
      finalTarget: Math.min(100, entityDiversity * 6),
      planned: Math.min(100, entityDiversity * 5.5),
      actual: Math.min(100, entityDiversity * 5)
    },
    {
      id: 'technology',
      title: 'Tech Stack Compliance',
      label: 'Relationship Type Diversity',
      kpi: `${relationshipDiversity}`,
      lastQuarterKpi: `${Math.max(0, relationshipDiversity - 1)}`,
      nextQuarterKpi: `${relationshipDiversity + 1}`,
      delta: 0,
      trendDirection: 'steady' as const,
      baseline: Math.max(5, Math.floor(relationshipDiversity * 0.6)),
      quarterlyActual: Math.min(100, relationshipDiversity * 5),
      quarterlyTarget: Math.min(100, relationshipDiversity * 5.2),
      finalTarget: Math.min(100, relationshipDiversity * 6),
      planned: Math.min(100, relationshipDiversity * 5.1),
      actual: Math.min(100, relationshipDiversity * 5)
    }
  ];
}

function generateInsight1(nodeCounts: any[], relationshipCounts: any[]) {
  const topTypes = nodeCounts.slice(0, 5);
  
  return {
    title: 'Node Distribution Analysis',
    subtitle: 'Top node types by count and connectivity risk vs alignment',
    initiatives: topTypes.map((nc, idx) => ({
      name: nc.type.replace(/^(Entity|Sector)/, ''),
      budget: Math.min(10, Math.max(1, nc.count / 10)),
      risk: Math.min(5, 1 + idx * 0.8),
      alignment: Math.min(5, Math.max(1, (nc.count / (nodeCounts[0]?.count || 1)) * 5))
    }))
  };
}

function generateInsight2(nodeCounts: any[]) {
  const total = nodeCounts.reduce((sum, item) => sum + item.count, 0);
  
  return {
    title: 'Node Growth Trend',
    subtitle: 'Simulated quarterly progression based on current data',
    labels: ['Previous', 'Current', 'Projected'],
    projectVelocity: [Math.floor(total * 0.85), total, Math.floor(total * 1.15)],
    operationalEfficiency: [Math.floor(total * 0.80), Math.floor(total * 0.95), Math.floor(total * 1.10)]
  };
}

function generateInsight3(nodeCounts: any[], relationshipCounts: any[]) {
  const entities = nodeCounts.filter(n => n.type.startsWith('Entity')).reduce((sum, item) => sum + item.count, 0);
  const relationships = relationshipCounts.reduce((sum, item) => sum + item.count, 0);
  
  return {
    title: 'Network Impact Correlation',
    subtitle: 'Relationship growth drives network density and value',
    labels: ['Q-1', 'Current Q', 'Q+1'],
    operationalEfficiency: [Math.floor(entities * 0.9), entities, Math.floor(entities * 1.1)],
    citizenQoL: [Math.floor(relationships * 0.85), relationships, Math.floor(relationships * 1.15)],
    jobsCreated: [Math.floor(relationships * 0.8), Math.floor(relationships * 0.95), Math.floor(relationships * 1.2)]
  };
}

function generateOutcomes(nodeCounts: any[], relationshipCounts: any[]) {
  const sectorCount = nodeCounts.filter(n => n.type.startsWith('Sector')).reduce((sum, item) => sum + item.count, 0);
  const entityCount = nodeCounts.filter(n => n.type.startsWith('Entity')).reduce((sum, item) => sum + item.count, 0);
  const relCount = relationshipCounts.reduce((sum, item) => sum + item.count, 0);
  
  return {
    outcome1: {
      title: 'Network Scale Metrics',
      macro: {
        labels: ['Sectors', 'Entities', 'Relationships'],
        fdi: { 
          actual: [sectorCount, entityCount, relCount], 
          target: [sectorCount + 2, entityCount + 10, relCount + 15], 
          baseline: [Math.floor(sectorCount * 0.7), Math.floor(entityCount * 0.7), Math.floor(relCount * 0.7)]
        },
        trade: { 
          actual: [sectorCount * 2, entityCount * 1.5, relCount * 1.2].map(Math.floor), 
          target: [sectorCount * 2.2, entityCount * 1.7, relCount * 1.4].map(Math.floor), 
          baseline: [sectorCount, entityCount, relCount]
        },
        jobs: { 
          actual: [sectorCount * 3, entityCount * 2, relCount * 1.5].map(Math.floor), 
          target: [sectorCount * 3.5, entityCount * 2.5, relCount * 2].map(Math.floor), 
          baseline: [sectorCount * 2, entityCount * 1.5, relCount].map(Math.floor)
        }
      }
    },
    outcome2: {
      title: 'Connectivity Score',
      partnerships: { 
        actual: Math.floor(relCount / Math.max(1, entityCount) * 100), 
        target: Math.floor(relCount / Math.max(1, entityCount) * 120), 
        baseline: Math.floor(relCount / Math.max(1, entityCount) * 80)
      }
    },
    outcome3: {
      title: 'Network Coverage',
      qol: {
        labels: ['Sectors', 'Entities', 'Links'],
        coverage: { 
          actual: [sectorCount * 5, entityCount * 2, relCount].map(v => Math.min(100, v)), 
          target: [sectorCount * 6, entityCount * 2.5, relCount * 1.2].map(v => Math.min(100, Math.floor(v))), 
          baseline: [sectorCount * 3, entityCount * 1.5, relCount * 0.8].map(v => Math.min(100, Math.floor(v)))
        },
        quality: { 
          actual: [Math.min(10, sectorCount / 2), Math.min(10, entityCount / 20), Math.min(10, relCount / 50)], 
          target: [Math.min(10, sectorCount / 1.8), Math.min(10, entityCount / 18), Math.min(10, relCount / 45)], 
          baseline: [Math.min(10, sectorCount / 3), Math.min(10, entityCount / 25), Math.min(10, relCount / 60)]
        }
      }
    },
    outcome4: {
      title: 'Integration Index',
      community: { 
        actual: Math.min(100, Math.floor((relCount / Math.max(1, entityCount + sectorCount)) * 50)), 
        target: Math.min(100, Math.floor((relCount / Math.max(1, entityCount + sectorCount)) * 60)), 
        baseline: Math.min(100, Math.floor((relCount / Math.max(1, entityCount + sectorCount)) * 35))
      }
    }
  };
}

export async function fetchGraphData(
  nodeLabels?: string[],
  relationshipTypes?: string[],
  years?: number[],
  quarter?: string,
  limit: number = 200
): Promise<GraphData> {
  const session = getSession();
  console.log('[DEBUG] fetchGraphData called with:', { nodeLabels, relationshipTypes, years, quarter, limit });
  
  try {
    // If no labels are selected, return empty result (nothing selected = nothing queried)
    if (!nodeLabels || nodeLabels.length === 0) {
      console.log('[DEBUG] No labels selected, returning empty result');
      return { nodes: [], links: [] };
    }

    let query = '';
    const params: any = { limit: neo4j.int(limit) };
    const whereClauses: string[] = [];

    // PERFORMANCE OPTIMIZATION: Use pattern matching when all 17 Entity/Sector labels selected.
    // Pattern matching (ANY with STARTS WITH) is significantly faster than 17 explicit OR clauses.
    const allEntitySectorLabels = ['EntityCapability', 'EntityChangeAdoption', 'EntityCultureHealth', 'EntityITSystem', 'EntityOrgUnit', 'EntityProcess', 'EntityProject', 'EntityRisk', 'EntityVendor', 'SectorAdminRecord', 'SectorBusiness', 'SectorCitizen', 'SectorDataTransaction', 'SectorGovEntity', 'SectorObjective', 'SectorPerformance', 'SectorPolicyTool'];
    const isAllLabels = nodeLabels.length === allEntitySectorLabels.length && nodeLabels.every(l => allEntitySectorLabels.includes(l));
    
    if (isAllLabels) {
      // All labels selected - use fast pattern matching
      whereClauses.push(`ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')`);
    } else {
      // Specific labels selected - use explicit filtering
      whereClauses.push(`(${nodeLabels.map(l => `n:${l}`).join(' OR ')})`);
    }


    if (years && years.length > 0) {
      whereClauses.push(`(n.year IN $years OR n.Year IN $years)`);
      params.years = years.map(y => neo4j.int(y));
    }

    if (quarter && quarter !== 'all') {
      // Convert "Q3" to 3 if needed
      let qVal: any = quarter;
      if (typeof quarter === 'string' && quarter.startsWith('Q')) {
        const qNum = parseInt(quarter.replace('Q', ''), 10);
        if (!isNaN(qNum)) {
          qVal = neo4j.int(qNum);
        }
      }
      
      whereClauses.push(`(n.quarter = $quarter OR n.Quarter = $quarter)`);
      params.quarter = qVal;
    }

    // Build the query - connected nodes (m) must also match selected labels
    const nodeWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // PERFORMANCE OPTIMIZATION: Use pattern matching for target nodes when all labels selected
    const targetLabelFilter = isAllLabels 
      ? `ANY(label IN labels(m) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')`
      : `(${nodeLabels.map(l => `m:${l}`).join(' OR ')})`;
    
    // CRITICAL PERFORMANCE OPTIMIZATION:
    // The LIMIT must be applied BEFORE the OPTIONAL MATCH using WITH clause.
    // This limits the nodes FIRST, then finds relationships only for those nodes.
    // DO NOT move LIMIT to the end - it will cause full database scan of all relationships.
    // ALSO: Use apoc.map.removeKeys to exclude embedding vectors (1536-dim, 6KB each) from results
    // This reduces data transfer from ~120MB to ~5MB for 20k nodes
    // NOTE: Use CASE WHEN for mProps because m can be null from OPTIONAL MATCH
    query = `
      MATCH (n)
      ${nodeWhere}
      WITH n LIMIT $limit
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE m IS NULL OR ${targetLabelFilter}
      ${relationshipTypes && relationshipTypes.length > 0 ? 'AND type(r) IN $relationshipTypes' : ''}
      RETURN 
        id(n) AS nId, labels(n) AS nLabels, apoc.map.removeKeys(properties(n), ['embedding', 'Embedding']) AS nProps,
        type(r) AS rType, properties(r) AS rProps,
        id(m) AS mId, labels(m) AS mLabels, 
        CASE WHEN m IS NOT NULL THEN apoc.map.removeKeys(properties(m), ['embedding', 'Embedding']) ELSE null END AS mProps
    `;
    
    if (relationshipTypes && relationshipTypes.length > 0) {
      params.relationshipTypes = relationshipTypes;
    }

    const result = await session.run(query, params);

    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    const getNodeLabel = (props: any, nodeId: string): string => {
      // Use name property only
      if (props.name && typeof props.name === 'string' && props.name.trim() !== '') {
        return props.name;
      }
      if (props.Name && typeof props.Name === 'string' && props.Name.trim() !== '') {
        return props.Name;
      }
      // Fallback to node ID if no name
      return nodeId;
    };

    const getNodeColor = (nodeLabels: string[]): string => {
      // Color mapping for different node types - 17 unique colors
      const colorMap: Record<string, string> = {
        'SectorObjective': '#A855F7',          // Purple
        'SectorPolicyTool': '#F59E0B',         // Amber
        'SectorAdminRecord': '#10B981',        // Emerald
        'SectorDataTransaction': '#EC4899',    // Pink
        'SectorCitizen': '#3B82F6',            // Blue
        'SectorBusiness': '#EF4444',           // Red
        'SectorGovEntity': '#14B8A6',          // Teal
        'SectorPerformance': '#00F0FF',        // Cyan
        'EntityCapability': '#F97316',         // Orange
        'EntityRisk': '#8B5CF6',               // Violet
        'EntityProject': '#06B6D4',            // Sky Blue
        'EntityChangeAdoption': '#84CC16',     // Lime
        'EntityITSystem': '#F43F5E',           // Rose
        'EntityOrgUnit': '#6366F1',            // Indigo
        'EntityProcess': '#FACC15',            // Yellow
        'EntityVendor': '#22D3EE',             // Cyan Light
        'EntityCultureHealth': '#C084FC',      // Purple Light
      };

      // Find first matching label
      for (const label of nodeLabels) {
        if (colorMap[label]) {
          return colorMap[label];
        }
      }

      // Gray fallback for unknown types
      return '#9CA3AF';
    };

    result.records.forEach(record => {
      // Process source node (n) - now uses nId, nLabels, nProps columns
      const nId = record.get('nId');
      const nLabels = record.get('nLabels') || [];
      const nProps = record.get('nProps') || {};
      
      if (nId !== null && nId !== undefined) {
        const nodeId = nId.toString();
        if (!nodesMap.has(nodeId)) {
          // Convert Neo4j integers to JS numbers
          const props: Record<string, any> = {};
          for (const key of Object.keys(nProps)) {
            const val = nProps[key];
            if (val && typeof val === 'object' && val.toNumber) {
              props[key] = val.toNumber();
            } else if (val !== null && val !== undefined) {
              props[key] = val;
            }
          }
          
          nodesMap.set(nodeId, {
            ...props,
            id: nodeId,
            group: props.group || nLabels[0] || 'default',
            label: getNodeLabel(props, nodeId),
            val: props.val || props.size || 10,
            color: props.color || getNodeColor(nLabels)
          });
        }
      }

      // Process relationship and target node (m) - now uses rType, rProps, mId, mLabels, mProps
      const rType = record.get('rType');
      const rProps = record.get('rProps') || {};
      const mId = record.get('mId');
      const mLabels = record.get('mLabels') || [];
      const mProps = record.get('mProps') || {};
      
      if (rType && mId !== null && mId !== undefined) {
        const targetId = mId.toString();
        if (!nodesMap.has(targetId)) {
          // Convert Neo4j integers to JS numbers
          const props: Record<string, any> = {};
          for (const key of Object.keys(mProps)) {
            const val = mProps[key];
            if (val && typeof val === 'object' && val.toNumber) {
              props[key] = val.toNumber();
            } else if (val !== null && val !== undefined) {
              props[key] = val;
            }
          }
          
          nodesMap.set(targetId, {
            ...props,
            id: targetId,
            group: props.group || mLabels[0] || 'default',
            label: getNodeLabel(props, targetId),
            val: props.val || props.size || 10,
            color: props.color || getNodeColor(mLabels)
          });
        }

        // Get source node ID from nId
        const sourceId = nId ? nId.toString() : null;
        if (sourceId) {
          links.push({
            source: sourceId,
            target: targetId,
            value: rProps.value || rProps.weight || 1,
            type: rType
          });
        }
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links
    };
  } finally {
    await session.close();
  }
}

export async function testConnection(): Promise<boolean> {
  const session = getSession();
  try {
    await session.run('RETURN 1');
    return true;
  } catch (error) {
    console.error('Neo4j connection test failed:', error);
    return false;
  } finally {
    await session.close();
  }
}
