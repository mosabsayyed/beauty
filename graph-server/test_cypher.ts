import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_AURA_URI || '',
  neo4j.auth.basic(process.env.NEO4J_AURA_USERNAME || 'neo4j', process.env.NEO4J_AURA_PASSWORD || '')
);

const STANDARD_RETURN = `
  WITH root, collect(path) as paths
  UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) as p
  UNWIND (CASE WHEN p IS NULL THEN [root] ELSE nodes(p) END) as n
  UNWIND (CASE WHEN p IS NULL THEN [null] ELSE relationships(p) END) as r
  WITH n, r
  WHERE n IS NOT NULL
  RETURN DISTINCT 
    elementId(n) as nId, 
    labels(n) as nLabels, 
    type(r) as rType
`;

async function test() {
  const session = driver.session();
  try {
    const query = `
      MATCH (root:SectorObjective)
      WHERE root.year = 2029
      OPTIONAL MATCH p1 = (root)-[:NON_EXISTENT]->()
      UNWIND [p1] as path
      ${STANDARD_RETURN}
    `;
    const result = await session.run(query);
    console.log("Results for 2029 Objectives:", result.records.length);
    result.records.forEach(r => console.log(r.toObject()));
  } catch (err) {
    console.error("Cypher error:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

test();
