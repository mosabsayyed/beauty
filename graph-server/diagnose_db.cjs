const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '/home/mosab/projects/chatmodule/backend/.env' });

async function diagnose() {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    console.log('Connecting to:', uri);
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        console.log('--- NODE COUNTS ---');
        const labels = ['EntityProject', 'SectorObjective', 'EntityRisk', 'SectorPerformance', 'EntityCapability'];
        for (const label of labels) {
            const res = await session.run(`MATCH (n:${label}) RETURN count(n) as c`);
            console.log(`${label}: ${res.records[0].get('c')}`);
        }

        console.log('--- RELATIONSHIP CHECK ---');
        const resRels = await session.run(`MATCH ()-[r]->() RETURN count(r) as c`);
        console.log('Total Relationships:', resRels.records[0].get('c'));
        
        console.log('--- SCHEMA CHECK ---');
        const resSchema = await session.run(`CALL db.relationshipTypes()`);
        console.log('Rel Types:', resSchema.records.map(r => r.get(0)));

    } catch (error) {
        console.error('Diagnosis Failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

diagnose();
