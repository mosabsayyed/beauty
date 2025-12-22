import 'dotenv/config';
import neo4j from 'neo4j-driver';

async function run() {
  console.log("Connecting to:", process.env.NEO4J_AURA_URI);
  const driver = neo4j.driver(
    process.env.NEO4J_AURA_URI!,
    neo4j.auth.basic(process.env.NEO4J_AURA_USERNAME!, process.env.NEO4J_AURA_PASSWORD!)
  );
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });
  console.log("Session created.");
  try {
    const res = await session.run("MATCH (n:SectorObjective) RETURN n.name as name, n.expected_outcomes as outcomes");
    console.log("Success! Records:", res.records.length);
    res.records.forEach(r => {
      console.log("OBJ:", r.get("name"), "->", r.get("outcomes"));
    });
  } catch (err) {
    console.error("FAILURE:", err);
  } finally {
    await session.close();
    await driver.close();
    process.exit(0);
  }
}
run();
