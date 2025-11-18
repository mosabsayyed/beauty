neo4j_embedding_probe.py — README

Purpose
-------
This small utility probes a Neo4j instance to determine:
- which procedures are installed (GDS/APOC/Vector)
- whether nodes have an `embedding` property and what its dimension is
- a recommendation of which Cypher method to use (GDS/APOC/manual)

It is intended to be run locally (developer machine) against your Neo4j dev instance. The output is JSON and suitable for pasting into the orchestrator prompt or used by further automation.

Quick start
-----------
1. Install the neo4j driver in your backend virtualenv or globally:

```bash
# from project root
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# if you prefer to install driver manually
pip install 'neo4j>=5.8.0,<6'
```

2. Run the probe (set env vars or rely on defaults):

```bash
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=password \
python backend/tools/neo4j_embedding_probe.py
```

3. Inspect the JSON output. It includes:
- `interesting_procedures`: list of procedure names that look like GDS/APOC/Vector
- `embedding`: whether embedding properties were found, sample dimension and preview
- `recommendation`: one of `gds`, `apoc`, `manual`, or `none`

Security & notes
----------------
- The script performs read-only operations. It does not write or project graphs.
- It expects a running Neo4j instance accessible from where you run the script.
- If your Neo4j instance requires additional TLS/cert config or uses `neo4j+s://` URLs, set `NEO4J_URI` accordingly and ensure the driver has access to CA certs.

Next steps
----------
- After running this script, paste the JSON output here and I will generate exact Cypher templates and a small prompt patch matching your DB's available procedures and embedding shape.
