import { getSession } from './graph-server/neo4j';
async function run() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (perf:SectorPerformance)-[:AGGREGATES_TO]->(obj:SectorObjective)
            WHERE obj.name = 'Drive Job Creation' AND (perf.year = 2026 OR perf.year = "2026")
            RETURN perf.quarter as q, count(perf) as c, sum(perf.actual) as a, sum(perf.target) as t
        `);
        console.log(JSON.stringify(result.records.map(r => r.toObject()), null, 2));
    } finally {
        await session.close();
    }
}
run();
