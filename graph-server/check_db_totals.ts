import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
);

async function run() {
  const session = driver.session();
  try {
    const counts = await session.run(`
      MATCH (n:SectorObjective)
      RETURN 
        count(n) as total, 
        sum(case when n.year = 2029 or n.Year = 2029 then 1 else 0 end) as y2029,
        sum(case when n.year = 2025 or n.Year = 2025 then 1 else 0 end) as y2025,
        sum(case when n.year is null and n.Year is null then 1 else 0 end) as noYear
    `);
    console.log("SectorObjective Counts:", counts.records[0].toObject());
    
    const allNodes = await session.run("MATCH (n) RETURN count(n) as total");
    console.log("All Nodes Total:", allNodes.records[0].get('total').toNumber());

    const allRels = await session.run("MATCH ()-[r]->() RETURN count(r) as total");
    console.log("All Relationships Total:", allRels.records[0].get('total').toNumber());

  } finally {
    await session.close();
    await driver.close();
  }
}

run();
