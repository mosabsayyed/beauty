#!/usr/bin/env python3
"""neo4j_embedding_probe.py

Run capability checks against a Neo4j instance to determine:
- available procedures (GDS / APOC / Vector)
- whether nodes have an `embedding` property and its dimension
- recommend which Cypher template to use (GDS/APOC/manual)

Usage:
  NEO4J_URI=bolt://localhost:7687 NEO4J_USERNAME=neo4j NEO4J_PASSWORD=pass python backend/tools/neo4j_embedding_probe.py

Outputs JSON to stdout with a short report suitable for consumption by a prompt or human.
"""
import os
import sys
import json
from typing import Any, Dict, List

try:
    from neo4j import GraphDatabase, basic_auth
except Exception as e:
    print("Missing dependency: neo4j driver. Install with `pip install 'neo4j>=5.8.0,<6'`", file=sys.stderr)
    raise


def safe_env(name: str, default: str = None) -> str:
    val = os.environ.get(name, default)
    if val is None:
        raise RuntimeError(f"Environment variable {name} is required")
    return val


def run_probe() -> Dict[str, Any]:
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USERNAME", "neo4j")
    pwd = os.environ.get("NEO4J_PASSWORD", "password")
    database = os.environ.get("NEO4J_DATABASE", None)  # optional

    auth = basic_auth(user, pwd)
    driver = GraphDatabase.driver(uri, auth=auth)

    report: Dict[str, Any] = {
        "uri": uri,
        "database": database or "default",
        "procedures": [],
        "embedding": {"found": False, "sample_count": 0, "sample_dimension": None, "sample_preview": []},
        "recommendation": "manual",
        "notes": [],
    }

    def run_read(tx, cypher, params=None):
        result = tx.run(cypher, params or {})
        return [r.data() for r in result]

    with driver.session(default_access_mode="READ") as session:
        # 1) list procedures
        # 1) list procedures: prefer SHOW PROCEDURES (Neo4j 5+). Fall back to CALL dbms.procedures()
        proc_rows = []
        try:
            proc_rows = session.execute_read(lambda tx: run_read(tx, "SHOW PROCEDURES YIELD name, signature, description RETURN name, signature, description"))
            report["procedures"] = proc_rows
        except Exception as e_show:
            # fallback to older CALL dbms.procedures() if SHOW PROCEDURES is not available
            try:
                proc_rows = session.execute_read(lambda tx: run_read(tx, "CALL dbms.procedures() YIELD name, signature, description RETURN name, signature, description"))
                report["procedures"] = proc_rows
            except Exception as e_call:
                report["notes"].append(f"Failed to list procedures (SHOW then CALL): {e_show}; {e_call}")

        # 2) search for interesting procedures
        proc_names = [p.get("name") for p in report["procedures"] if p.get("name")]
        interesting = [n for n in proc_names if any(x in n.lower() for x in ("gds", "knn", "similar", "apoc", "vector"))]
        report["interesting_procedures"] = interesting

        # 3) check for embedding property existence and sample
        try:
            # Use property IS NOT NULL (supported in Neo4j 4/5). Avoid deprecated exists() form.
            sample_query = (
                "MATCH (n) WHERE n.embedding IS NOT NULL RETURN labels(n) AS labels, size(n.embedding) AS dim, n.embedding[0..10] AS embedding LIMIT 20"
            )
            samples = session.execute_read(lambda tx: run_read(tx, sample_query))
            if samples:
                report["embedding"]["found"] = True
                report["embedding"]["sample_count"] = len(samples)
                first = samples[0]
                dim = first.get("dim")
                emb = first.get("embedding")
                report["embedding"]["sample_dimension"] = dim
                if isinstance(emb, list):
                    report["embedding"]["sample_preview"] = emb[:10]
                else:
                    try:
                        report["embedding"]["sample_preview"] = list(emb)[:10]
                    except Exception:
                        report["embedding"]["sample_preview"] = str(emb)[:200]
            else:
                report["embedding"]["found"] = False
        except Exception as e:
            report["notes"].append(f"Failed embedding probe: {e}")

        # 4) pick recommendation
        # If gds similarity or knn exists -> recommend gds
        if any("gds." in (n or "") or n.startswith("gds") for n in interesting):
            report["recommendation"] = "gds"
        elif any("apoc.node.similarity" in (n or "") or "apoc" in (n or "") for n in interesting):
            report["recommendation"] = "apoc"
        elif report["embedding"]["found"]:
            report["recommendation"] = "manual"
        else:
            report["recommendation"] = "none"

    driver.close()
    return report


def main():
    try:
        report = run_probe()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(2)

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
