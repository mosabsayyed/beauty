import dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';

dotenv.config({ path: '../.env' });

const dbHost = process.env.NEO4J_URI || 'bolt://localhost:7687';
const dbUser = process.env.NEO4J_USER || 'neo4j';
const dbPassword = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(dbHost, neo4j.auth.basic(dbUser, dbPassword));

async function run() {
    const session = driver.session();
    const output: any = { raw: [], agg: [] };

    try {
        console.log("=== DEBUGGING LENS B QUERY ===");
        
        // 1. RAW DATA CHECK
        const query = `
          MATCH (perf:SectorPerformance)-[:AGGREGATES_TO]->(obj:SectorObjective)
          WHERE perf.level IN ['L1', 'L2'] AND obj.level = 'L1' 
          RETURN 
             obj.name as Axis,
             perf.year as year,
             perf.quarter as quarter,
             perf.actual as actual,
             perf.target as target,
             perf.level as level
          LIMIT 20
        `;
        
        console.log("Running raw data check...");
        const result = await session.run(query);
        console.log(`Found ${result.records.length} raw records.`);
        
        result.records.forEach(r => {
            output.raw.push({
                Axis: r.get('Axis'),
                year: r.get('year'), // Check if this is Int or String
                quarter: r.get('quarter'),
                actual: r.get('actual'),
                target: r.get('target')
            });
        });

        // 2. AGGREGATION CHECK
        // Simulating "All" query parameters logic
        const simpleYear = 2030;
        const qNumeric = "4"; 

        console.log(`Running aggregation query with yInt=${simpleYear}, qInt=${qNumeric}...`);
        
        const aggQuery = `
              MATCH (perf:SectorPerformance)-[:AGGREGATES_TO]->(obj:SectorObjective)
              WHERE perf.level IN ['L1', 'L2'] AND obj.level = 'L1' 

              WITH obj.name as objective_name,
                   toInteger(perf.year) as y_val,
                   toInteger(replace(toString(perf.quarter), 'Q', '')) as q_val,
                   toFloat(perf.actual) as val_a,
                   toFloat(perf.target) as val_t

              WITH objective_name, y_val, q_val, val_a, val_t,
                   (y_val < $yInt OR (y_val = $yInt AND q_val <= $qInt)) as is_included

              WITH objective_name,
                   sum(CASE WHEN is_included THEN val_a ELSE 0 END) as total_a,
                   sum(CASE WHEN is_included AND val_t > 0 THEN val_t ELSE 0 END) as total_t,
                   collect({y: y_val, q: q_val, inc: is_included}) as debug_rows

              RETURN objective_name, total_a, total_t, (total_a / NULLIF(total_t, 0)) * 100 as score, debug_rows
              LIMIT 5
        `;

        const aggResult = await session.run(aggQuery, {
            yInt: simpleYear,
            qInt: parseInt(qNumeric)
        });

        aggResult.records.forEach(r => {
            output.agg.push({
                Obj: r.get('objective_name'),
                TotalA: r.get('total_a'),
                TotalT: r.get('total_t'),
                Score: r.get('score'),
                DebugRows: r.get('debug_rows').slice(0, 3) // Sample debug data
            });
        });

        fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
        console.log("Written to debug_output.json");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

run();
