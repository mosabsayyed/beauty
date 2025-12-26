import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_AURA_URI || '',
  neo4j.auth.basic(process.env.NEO4J_AURA_USERNAME || 'neo4j', process.env.NEO4J_AURA_PASSWORD || '')
);

async function inspect() {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (root:SectorObjective)
      RETURN 
        elementId(root) as id,
        root.year as year,
        root.Year as Year,
        labels(root) as labels,
        properties(root).name as name
      LIMIT 30
    `);
    console.log("SectorObjective Sample:");
    result.records.forEach(r => console.log(r.toObject()));
  } finally {
    await session.close();
    await driver.close();
  }
}

inspect();
