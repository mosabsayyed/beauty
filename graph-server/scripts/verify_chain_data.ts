
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

// Load env from parent directory
// Load env from absolute path
dotenv.config({ path: '/home/mosab/projects/chatmodule/.env' });

const uri = process.env.NEO4J_AURA_URI || process.env.NEO4J_URI || '';
const user = process.env.NEO4J_AURA_USERNAME || process.env.NEO4J_USERNAME || '';
const pass = process.env.NEO4J_AURA_PASSWORD || process.env.NEO4J_PASSWORD || '';

if (!uri || !user || !pass) {
    console.error("Missing Neo4j credentials. Found:", { uri: !!uri, user: !!user, pass: !!pass });
    process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));

const CHAIN_QUERIES: Record<string, string> = {
    "sector_ops": `
      MATCH (obj:SectorObjective)
      WHERE ($year = 0 OR obj.year = $year OR obj.Year = $year)
      OPTIONAL MATCH path1 = (obj)-[:REALIZED_VIA]->(pol:SectorPolicyTool)-[:REFERS_TO]->(rec:SectorAdminRecord)
      OPTIONAL MATCH path2 = (obj)<-[:IMPACTS]-(perf:SectorPerformance)
      RETURN count(DISTINCT obj) as roots, count(path1) + count(path2) as paths
    `,
    "strategy_to_tactics_priority": `
      MATCH (obj:SectorObjective)
      WHERE ($year = 0 OR obj.year = $year OR obj.Year = $year)
      OPTIONAL MATCH path = (obj)-[:REALIZED_VIA]->(pol:SectorPolicyTool)-[:SETS_PRIORITIES|EXECUTES]->(cap:EntityCapability)
      RETURN count(DISTINCT obj) as roots, count(path) as paths
    `,
    "strategy_to_tactics_targets": `
      MATCH (obj:SectorObjective)
      WHERE ($year = 0 OR obj.year = $year OR obj.Year = $year)
      OPTIONAL MATCH path = (obj)<-[:AGGREGATES_TO|CASCADED_VIA]-(perf:SectorPerformance)<-[:MEASURED_BY]-(txn:SectorDataTransaction)
      RETURN count(DISTINCT obj) as roots, count(path) as paths
    `,
    "tactical_to_strategy": `
      MATCH (proj:EntityProject)
      WHERE ($year = 0 OR proj.year = $year OR proj.Year = $year)
      OPTIONAL MATCH path = (proj)-[:DELIVERED_BY|GOVERNED_BY|REALIZED_VIA|INCREASE_ADOPTION|GAPS_SCOPE|CLOSE_GAPS|OPERATES|MONITORED_BY|KNOWLEDGE_GAPS|ROLE_GAPS|SETS_PRIORITIES|EXECUTES*1..5]-(obj:SectorObjective)
      RETURN count(DISTINCT proj) as roots, count(path) as paths
    `,
    "risk_build_mode": `
      MATCH (risk:EntityRisk)
      WHERE ($year = 0 OR risk.year = $year OR risk.Year = $year)
      OPTIONAL MATCH path = (risk)-[:MONITORED_BY]->(cap:EntityCapability)-[:SETS_PRIORITIES|EXECUTES]->(pol:SectorPolicyTool)
      RETURN count(DISTINCT risk) as roots, count(path) as paths
    `,
    "risk_operate_mode": `
      MATCH (risk:EntityRisk)
      WHERE ($year = 0 OR risk.year = $year OR risk.Year = $year)
      OPTIONAL MATCH path = (risk)-[:MONITORED_BY]->(cap:EntityCapability)<-[:SETS_TARGETS]-(perf:SectorPerformance)
      RETURN count(DISTINCT risk) as roots, count(path) as paths
    `,
    "internal_efficiency": `
      MATCH (proc:EntityProcess)
      WHERE ($year = 0 OR proc.year = $year OR proc.Year = $year)
      OPTIONAL MATCH path = (proc)-[:AUTOMATION]->(it:EntityITSystem)-[:DEPENDS_ON]->(vendor:EntityVendor)
      RETURN count(DISTINCT proc) as roots, count(path) as paths
    `,
    "aggregate": `
       MATCH (obj:SectorObjective)
       WHERE ($year = 0 OR obj.year = $year OR obj.Year = $year)
       OPTIONAL MATCH path = (obj)-[*1..2]-(impact)
       WHERE (impact:EntityProject OR impact:EntityRisk OR impact:SectorPerformance)
       RETURN count(DISTINCT obj) as roots, count(path) as paths
    `
};

async function verify() {
    const session = driver.session();
    try {
        console.log("=== GROUND TRUTH VERIFICATION ===");
        
        // 1. Simple Counts (Ground Truth)
        const counts = await session.run(`
            MATCH (obj:SectorObjective) WITH count(obj) as cObj
            MATCH (proj:EntityProject) WITH cObj, count(proj) as cProj
            MATCH (risk:EntityRisk) WITH cObj, cProj, count(risk) as cRisk
            RETURN cObj, cProj, cRisk
        `);
        const r = counts.records[0];
        console.log(`[DB] Objectives: ${r.get('cObj')}, Projects: ${r.get('cProj')}, Risks: ${r.get('cRisk')}`);

        // 2. Chain Queries Verification
        for (const [key, query] of Object.entries(CHAIN_QUERIES)) {
            console.log(`\nChecking Chain: ${key}...`);
            const res = await session.run(query, { year: neo4j.int(0) });
            const rec = res.records[0];
            const roots = rec.get('roots').toNumber();
            const hasP1 = rec.keys.includes('p1');
            const hasPaths = rec.keys.includes('paths');
            const paths = hasP1 ? rec.get('p1').toNumber() : (hasPaths ? rec.get('paths').toNumber() : 0);
            
            console.log(`[Query] Roots: ${roots}, Paths: ${paths}`);
            
            if (roots === 0) {
                 console.error(`❌ CRITICAL: Chain ${key} returns 0 roots despite data existing!`);
            } else if (paths === 0) {
                 console.error(`❌ CRITICAL: Chain ${key} has roots but NO paths.`);
                 
                 if (key.includes('strategy')) {
                     console.log("   [Diag] Discovery for SectorObjective -> Policy -> ?");
                     const d1 = await session.run(`
                        MATCH (n:SectorObjective)-[:REALIZED_VIA]-(pol:SectorPolicyTool)-[r]-(next)
                        RETURN labels(pol)[0] as l1, type(r) as t, labels(next)[0] as l2, count(*) as c ORDER BY c DESC LIMIT 10
                     `);
                     d1.records.forEach(r => console.log(`      (Policy)-[:${r.get('t')}]-(${r.get('l2')}): ${r.get('c')}`));

                     console.log("   [Diag] Discovery for SectorObjective -> Performance -> ?");
                     const d2 = await session.run(`
                        MATCH (n:SectorObjective)-[:AGGREGATES_TO|CASCADED_VIA]-(perf:SectorPerformance)-[r]-(next)
                        RETURN labels(perf)[0] as l1, type(r) as t, labels(next)[0] as l2, count(*) as c ORDER BY c DESC LIMIT 10
                     `);
                     d2.records.forEach(r => console.log(`      (Perf)-[:${r.get('t')}]-(${r.get('l2')}): ${r.get('c')}`));

                 } else if (key.includes('risk')) {
                     console.log("   [Diag] Discovery for Risk -> Cap -> ?");
                     const d1 = await session.run(`
                        MATCH (n:EntityRisk)-[:MONITORED_BY]->(cap:EntityCapability)-[r]-(next)
                        RETURN labels(cap)[0] as l1, type(r) as t, labels(next)[0] as l2, count(*) as c ORDER BY c DESC LIMIT 10
                     `);
                     d1.records.forEach(r => console.log(`      (Cap)-[:${r.get('t')}]-(${r.get('l2')}): ${r.get('c')}`));

                     console.log("   [Diag] Discovery for Risk -> Perf -> ?");
                     const d2 = await session.run(`
                        MATCH (n:EntityRisk)-[:INFORMS]->(perf:SectorPerformance)-[r]-(next)
                        RETURN labels(perf)[0] as l1, type(r) as t, labels(next)[0] as l2, count(*) as c ORDER BY c DESC LIMIT 10
                     `);
                     d2.records.forEach(r => console.log(`      (Perf)-[:${r.get('t')}]-(${r.get('l2')}): ${r.get('c')}`));
                 } else if (key.includes('internal')) {
                     console.log("   [Diag] Discovery for EntityProcess -> ITSystem:");
                     const d = await session.run(`
                        MATCH (n:EntityProcess)-[r]-(it:EntityITSystem)
                        RETURN type(r) as t, count(*) as c ORDER BY c DESC LIMIT 10
                     `);
                     d.records.forEach(r => console.log(`      (Proc)-[:${r.get('t')}]-(IT): ${r.get('c')}`));
                 }

            } else {
                 console.log(`✅ Chain ${key} OK.`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await session.close();
        await driver.close();
    }
}

verify();
