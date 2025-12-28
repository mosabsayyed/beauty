
const neo4jData = require('neo4j-driver');
const driver = neo4jData.driver('bolt://localhost:7687', neo4jData.auth.basic('neo4j', 'kHRlxPU_u-sRldkXtqM9YRCmue1Yu841zKYvwYI0H6s'));

async function run() {
  const session = driver.session();
  try {
    const yearNum = 0;
    const result = await session.run(`
      CALL {
        MATCH (k)
        WHERE k:EntityITSystem OR k:EntityVendor OR k:EntityCapability OR k:EntityOrgUnit OR k:EntityProcess
        OPTIONAL MATCH (k)<-[:DEPENDS_ON|OPERATES|CLOSE_GAPS|GOVERNED_BY]-(dep)
        WITH k, count(DISTINCT dep) as deps
        WHERE deps >= 1
        RETURN count(DISTINCT k) as overloadedNodes
      }
      RETURN overloadedNodes
    `, { year: neo4jData.int(yearNum) });
    
    console.log("Result:", result.records[0].get('overloadedNodes').toNumber());
  } catch (e) {
    console.error(e);
  } finally {
    await session.close();
    await driver.close();
  }
}

run();
