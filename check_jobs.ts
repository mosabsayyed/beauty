import { getSession } from './graph-server/neo4j';
async function run() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (perf:SectorPerformance)-[:AGGREGATES_TO]->(obj:SectorObjective)
            WHERE obj.name = 'Drive Job Creation'
            RETURN perf.year as year, perf.quarter as quarter, count(perf) as count
            ORDER BY year, quarter
        `);
        console.log(JSON.stringify(result.records.map(r => r.toObject()), null, 2));
    } finally {
        await session.close();
    }
}
run();
