import fetch from 'node-fetch';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_AURA_URI || '',
  neo4j.auth.basic(process.env.NEO4J_AURA_USERNAME || 'neo4j', process.env.NEO4J_AURA_PASSWORD || '')
);

async function verify() {
  const session = driver.session();
  try {
    const dbResult = await session.run("MATCH (n:SectorObjective) RETURN count(n) as total");
    const dbTotal = dbResult.records[0].get('total').toNumber();
    console.log("DB Ground Truth (Total SectorObjectives):", dbTotal);

    const apiResponse = await fetch('http://localhost:3001/api/business-chain/sector_ops?year=All');
    const apiData: any = await apiResponse.json();
    const apiNodes = apiData.nodes || [];
    const apiObjectives = apiNodes.filter((n: any) => n.labels.includes('SectorObjective'));
    console.log("API Results (Total SectorObjectives):", apiObjectives.length);

    if (apiObjectives.length === dbTotal) {
      console.log("✅ SUCCESS: API matches DB total. Zero sampling achieved.");
    } else {
      console.log("❌ FAILURE: Data gap exists. Diff:", dbTotal - apiObjectives.length);
    }

    const gapResponse = await fetch('http://localhost:3001/api/business-chain/sector_ops?year=All&analyzeGaps=true');
    const gapData: any = await gapResponse.json();
    const missingNodes = gapData.nodes.filter((n: any) => n.labels.includes('MISSING'));
    const virtualLinks = gapData.links.filter((l: any) => l.properties?.virtual === true);
    console.log("Semantic Analysis Results:");
    console.log("- Injected Missing Nodes:", missingNodes.length);
    console.log("- Injected Virtual Links:", virtualLinks.length);

    if (missingNodes.length > 0) {
        console.log("✅ SUCCESS: Analyze Gaps injected virtual data.");
    } else {
        console.log("❌ FAILURE: Analyze Gaps produced no virtual data.");
    }

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

verify();
