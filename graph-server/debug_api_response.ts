import fetch from 'node-fetch';

async function debug() {
  const url = 'http://localhost:3001/api/business-chain/sector_ops?year=All';
  console.log("Fetching from:", url);
  const response = await fetch(url);
  console.log("Status:", response.status);
  const data: any = await response.json();
  if (data.error) {
    console.log("API Error:", data.error, data.message);
  } else {
    console.log("Node Count:", data.nodes?.length);
    console.log("Link Count:", data.links?.length);
    console.log("KPIs:", data.kpis?.map((k:any) => k.title));
    if (data.nodes?.length > 0) {
        console.log("Sample Node Labels:", data.nodes[0].labels);
    }
  }
}

debug();
