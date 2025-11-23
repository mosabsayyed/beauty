#!/usr/bin/env python3
"""
MCP-mimic query tester

This script connects to Neo4j using the same read semantics as the MCP `read_neo4j_cypher` tool
and executes a set of canonical queries (native vector, stored-embedding cosine, optional GDS).

It writes a JSON results file and a markdown summary used to ground the LLM prompt extension.

Usage (recommended):
  set -a && source .env && set +a && python3 backend/tools/mcp_query_tester.py

The script expects the following env vars to be set (same as other tools in this repo):
  NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE

The script will attempt non-destructive read-only queries only.
"""
from __future__ import annotations

import json
import os
import sys
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from neo4j import GraphDatabase


def env(name: str) -> Optional[str]:
    return os.environ.get(name)


def fatal(msg: str):
    print(f"FATAL: {msg}")
    sys.exit(2)


def get_driver():
    uri = env("NEO4J_URI")
    # support both NEO4J_USER and NEO4J_USERNAME env var names
    user = env("NEO4J_USER") or env("NEO4J_USERNAME")
    password = env("NEO4J_PASSWORD")
    if not uri or not user or not password:
        fatal("NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD must be set in environment")
    return GraphDatabase.driver(uri, auth=(user, password))


def run_read(tx, query: str, params: Dict[str, Any] | None = None):
    return list(tx.run(query, params or {}))


def find_label_with_embeddings(tx) -> Optional[str]:
    q = """
    MATCH (n) WHERE n.embedding IS NOT NULL
    RETURN labels(n)[0] AS label, count(*) AS cnt
    ORDER BY cnt DESC
    LIMIT 1
    """
    res = run_read(tx, q)
    if not res:
        return None
    return res[0]["label"]


def get_sample_node_with_embedding(tx, label: str):
    q = f"MATCH (n:`{label}`) WHERE n.embedding IS NOT NULL RETURN n LIMIT 1"
    res = run_read(tx, q)
    if not res:
        return None
    record = res[0]["n"]
    # convert to dict
    return dict(record)


def find_vector_index_for_label(tx, label: str) -> Optional[str]:
    # Try SHOW INDEXES and look for an index that mentions 'embedding' and the label
    q = "SHOW INDEXES"
    rows = run_read(tx, q)
    for r in rows:
        data = dict(r)
        name = data.get("name")
        # different Neo4j versions may expose label/type lists under different keys
        labels = data.get("labelsOrTypes") or data.get("labels") or None
        props = data.get("properties") or []
        # normalize labels
        labels_list = []
        if labels:
            if isinstance(labels, list):
                labels_list = labels
            else:
                labels_list = [labels]
        # check
        if isinstance(props, list) and "embedding" in props:
            # either index name contains 'vector' or the index maps to our label
            try:
                name_l = name.lower() if name else ""
            except Exception:
                name_l = ""
            if name and ("vector" in name_l or label in labels_list):
                return name
    return None


def list_indexes(tx) -> List[Dict[str, Any]]:
    q = "SHOW INDEXES"
    rows = run_read(tx, q)
    out = []
    for r in rows:
        try:
            out.append(dict(r))
        except Exception:
            out.append({"raw": str(r)})
    return out


def list_gds_procedures(tx) -> List[str]:
    q = "SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'gds.' RETURN name"
    rows = run_read(tx, q)
    return [r["name"] for r in rows]


def normalize_index_name(label: str) -> str:
    # heuristic used in generator: vector_index_<normalized_label>
    nl = "".join([c for c in label.lower() if c.isalnum()])
    return f"vector_index_{nl}"


def run_native_vector_query(tx, index_name: str, query_vector: List[float], k: int = 3, min_score: Optional[float] = None):
    q = """
    CALL db.index.vector.queryNodes($indexName, $k, $queryVector) YIELD node, score
    WHERE node.embedding IS NOT NULL
      AND ($minScore IS NULL OR score >= $minScore)
    RETURN
        coalesce(node.id, elementId(node)) AS id,
      node.year AS year,
      node.level AS level,
      node.name AS name,
    node.embedding_generated_at AS embedding_generated_at,
    (coalesce(node.id, elementId(node)) + '|' + toString(node.year)) AS composite_key,
            score
    ORDER BY score DESC
    LIMIT $k
    """
    params = {"indexName": index_name, "queryVector": query_vector, "k": k, "minScore": min_score}
    return run_read(tx, q, params)


def run_cosine_single_project_to_orgs(tx, project_id: str, project_year: Any, project_level: Any, k: int = 5):
    q = """
    MATCH (p:EntityProject {id:$projectId, year:$projectYear, level:$projectLevel})
    WHERE p.embedding IS NOT NULL
    MATCH (o:EntityOrgUnit)
    WHERE o.embedding IS NOT NULL AND size(o.embedding) = size(p.embedding)
    WITH o, p, p.embedding AS vp, o.embedding AS vo
    WITH o, p,
         reduce(dot = 0.0, i IN range(0, size(vp)-1) | dot + vp[i] * vo[i]) AS dot,
         reduce(np = 0.0, i IN range(0, size(vp)-1) | np + vp[i] * vp[i]) AS np,
         reduce(no = 0.0, i IN range(0, size(vo)-1) | no + vo[i] * vo[i]) AS no
    WITH o, p, CASE WHEN np = 0 OR no = 0 THEN 0 ELSE dot / sqrt(np * no) END AS cosine
            RETURN
                            coalesce(o.id, elementId(o)) AS id,
      o.year AS year,
      o.level AS level,
      o.name AS name,
                (coalesce(o.id, elementId(o)) + '|' + toString(o.year)) AS composite_key,
            cosine AS score
        ORDER BY cosine DESC
    LIMIT $k
    """
    params = {"projectId": project_id, "projectYear": project_year, "projectLevel": project_level, "k": k}
    return run_read(tx, q, params)


def check_gds(tx) -> bool:
    try:
        # Do not CALL gds.* procedures directly; some installations expose procedures but not the version call.
        # Use SHOW PROCEDURES to safely detect any gds.* procedure presence.
        rows = run_read(tx, "SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'gds.' RETURN name LIMIT 1")
        return bool(rows)
    except Exception:
        return False


def summarize_record(r):
    try:
        d = dict(r)
        # convert neo4j types to jsonables
        for k, v in list(d.items()):
            try:
                json.dumps(v)
            except Exception:
                d[k] = str(v)
        return d
    except Exception:
        return str(r)


def main():
    driver = get_driver()
    out = {"meta": {"ts": datetime.now(timezone.utc).isoformat()}, "tests": []}

    with driver.session() as session:
        try:
            label = session.execute_read(find_label_with_embeddings)
            out["meta"]["label_with_embeddings"] = label
            if not label:
                print("No nodes with embeddings found in DB. Aborting tests.")
                fatal("No embeddings in DB")

            print(f"Using sample label: {label}")
            sample = session.execute_read(get_sample_node_with_embedding, label)
            if not sample:
                fatal(f"No sample node found for label {label}")

            # canonical index hunt: prefer known working index names from prior runs
            preferred = ["vector_index_entityproject", normalize_index_name(label)]
            available_indexes = session.execute_read(list_indexes)
            out["meta"]["available_index_count"] = len(available_indexes)
            out["meta"]["available_indexes_sample"] = [list(i.keys()) for i in available_indexes[:5]]

            idx = None
            for p in preferred:
                for i in available_indexes:
                    name = i.get("name") or i.get("indexName")
                    if name and p.lower() in str(name).lower():
                        idx = name
                        break
                if idx:
                    break

            if not idx:
                # fallback to scanning indexes looking for a property 'embedding'
                for i in available_indexes:
                    props = i.get("properties") or []
                    if isinstance(props, list) and "embedding" in props:
                        idx = i.get("name") or i.get("indexName")
                        break

            if not idx:
                heur = normalize_index_name(label)
                print(f"No explicit vector index found. Will try heuristic name: {heur}")
                idx = heur

            out["meta"]["index_name_tried"] = idx

            # Test 1: native vector query using sample node.embedding — choose a project that previously returned matches
            test1 = {"name": "native_vector_query", "status": "not-run"}
            try:
                # choose a candidate project id/year known to have neighbors (from earlier run we saw entityproject matches)
                proj_row = session.execute_read(lambda tx: run_read(tx, "MATCH (p:EntityProject) WHERE p.embedding IS NOT NULL RETURN p.id AS id, p.year AS year, p.level AS level LIMIT 1"))
                if proj_row:
                    proj = dict(proj_row[0])
                    # fetch its embedding
                    pnode = session.execute_read(lambda tx: run_read(tx, "MATCH (p:EntityProject {id:$id, year:$year}) RETURN p LIMIT 1", {"id": proj.get("id"), "year": proj.get("year")}))
                    if pnode:
                        pnod = dict(pnode[0]["p"])
                        qvec = pnod.get("embedding")
                    else:
                        qvec = sample.get("embedding")
                else:
                    qvec = sample.get("embedding")

                if not isinstance(qvec, list):
                    raise ValueError("Sample node embedding is not a list")

                rows = session.execute_read(run_native_vector_query, idx, qvec, 5, None)
                test1["status"] = "ok"
                test1["rows"] = [summarize_record(r) for r in rows]
            except Exception as e:
                test1["status"] = "error"
                test1["error"] = str(e)
                test1["trace"] = traceback.format_exc()

            out["tests"].append(test1)

            # Test 2: cosine compare: for a sample project, find top orgunits
            test2 = {"name": "cosine_project_to_orgs", "status": "not-run"}
            try:
                # find a sample project node with id/year/level
                proj = session.execute_read(lambda tx: run_read(tx, "MATCH (p:EntityProject) WHERE p.embedding IS NOT NULL RETURN p.id AS id, p.year AS year, p.level AS level LIMIT 1"))
                if proj:
                    p0 = dict(proj[0])
                    pid = p0.get("id")
                    pyear = p0.get("year")
                    plevel = p0.get("level")
                    rows = session.execute_read(run_cosine_single_project_to_orgs, pid, pyear, plevel, 5)
                    test2["status"] = "ok"
                    test2["project"] = p0
                    test2["rows"] = [summarize_record(r) for r in rows]
                else:
                    test2["status"] = "skipped"
                    test2["reason"] = "No EntityProject nodes with embedding found"
            except Exception as e:
                test2["status"] = "error"
                test2["error"] = str(e)
                test2["trace"] = traceback.format_exc()

            out["tests"].append(test2)

            # Test 3: GDS check (non-destructive)
            test3 = {"name": "gds_available", "status": "not-run"}
            try:
                has_gds = session.execute_read(check_gds)
                test3["status"] = "ok" if has_gds else "absent"
            except Exception as e:
                test3["status"] = "error"
                test3["error"] = str(e)
                test3["trace"] = traceback.format_exc()

            out["tests"].append(test3)

        finally:
            driver.close()

    # Write JSON results
    res_path = os.path.join(os.getcwd(), "backend", "tools", "mcp_query_test_results.json")
    with open(res_path, "w") as f:
        json.dump(out, f, indent=2, default=str)

    # Also write a markdown summary into docs/
    docs_dir = os.path.join(os.getcwd(), "docs")
    os.makedirs(docs_dir, exist_ok=True)
    md_path = os.path.join(docs_dir, "mcp_query_test_results.md")
    with open(md_path, "w") as f:
        f.write("# MCP Query Test Results\n\n")
        f.write(f"Generated: {datetime.now(timezone.utc).isoformat()}\n\n")
        f.write("## Meta\n\n")
        for k, v in out["meta"].items():
            f.write(f"- **{k}**: {v}\n")
        f.write("\n## Tests\n\n")
        for t in out["tests"]:
            f.write(f"### {t['name']} — {t['status']}\n\n")
            if t.get("error"):
                f.write(f"- Error: `{t['error']}`\n\n")
            if t.get("reason"):
                f.write(f"- Reason: {t['reason']}\n\n")
            if t.get("project"):
                f.write(f"- Project sampled: {t['project']}\n\n")
            if t.get("rows"):
                f.write("- Rows:\n\n")
                for r in t["rows"]:
                    f.write(f"  - {json.dumps(r, default=str)}\n")
                f.write("\n")

    print(f"Results written: {res_path} and {md_path}")


if __name__ == "__main__":
    main()
