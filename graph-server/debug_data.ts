
import { getSession } from './neo4j';
import { Integer } from 'neo4j-driver';

async function debug() {
    const session = getSession();
    try {
        console.log("Querying Neo4j for SectorPerformance data...");
        const result = await session.run(`
            MATCH (perf:SectorPerformance)
            WHERE (perf.year = 2025 OR perf.year = '2025') AND perf.level IN ['L1', 'L2']
            OPTIONAL MATCH (perf)-[r:AGGREGATES_TO]->(obj:SectorObjective)
            RETURN distinct perf.name as name, perf.actual as actual, perf.target as target, perf.quarter as q, perf.level as l, obj.name as obj_name
            LIMIT 20
        `);
        
        console.log("Records found for 2025:", result.records.length);
        const data = result.records.map(r => {
             return {
                 name: r.get('name'),
                 actual: r.get('actual'),
                 target: r.get('target'),
                 q: r.get('q') && r.get('q').toInt ? r.get('q').toInt() : r.get('q'),
                 l: r.get('l'),
                 obj: r.get('obj_name')
             };
        });
        console.log("Data sample:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await session.close();
        process.exit(0);
    }
}

debug();
