import { getSession } from './graph-server/neo4j';
async function run() {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (perf:SectorPerformance)-[:AGGREGATES_TO]->(obj:SectorObjective)
            RETURN obj.name as name, count(perf) as count, collect(DISTINCT perf.level) as levels
        `);
        console.log(JSON.stringify(result.records.map(r => r.toObject()), null, 2));
    } finally {
        await session.close();
    }
}
run();
