#!/usr/bin/env python3
"""Runtime test: compute OpenAI embedding (same model as generator) and query Neo4j vector index

Usage:
  source backend/.venv/bin/activate
  set -a && source .env && set +a && python3 backend/tools/llm_runtime_vector_search.py "inspection" --k 10

This script intentionally kept minimal. It uses the same model name as
`02_generate_embeddings.py` (text-embedding-3-small) and queries the native
vector index named `vector_index_project`. Adjust `INDEX_NAME` if yours
differs.
"""
import os
import sys
import json
import argparse
from typing import List
from dotenv import load_dotenv
import openai
from neo4j import GraphDatabase


# ---- LOCAL TEST CONFIG (do NOT commit secrets) ----
# For security, avoid committing secrets into repository files. This script prefers
# environment variables (from .env or CI). If you need quick local overrides,
# set them in your local `.env` file or export them in your shell—do NOT commit.
HARDCODE_NEO4J_URI = None
HARDCODE_NEO4J_USER = None
HARDCODE_NEO4J_PASSWORD = None
HARDCODE_OPENAI_API_KEY = None
HARDCODE_INDEX_NAME = None

# INDEX_NAME: fall back to environment or default
INDEX_NAME = HARDCODE_INDEX_NAME or os.getenv('VECTOR_INDEX_PROJECT_NAME', 'vector_index_project')


def generate_embedding(text: str, model: str) -> List[float]:
    resp = openai.embeddings.create(model=model, input=[text])
    return resp.data[0].embedding


def query_vector_index(uri: str, user: str, password: str, index_name: str, query_vector: List[float], k: int):
    driver = GraphDatabase.driver(uri, auth=(user, password))
    # Return a compact projection directly from the DB: id (prefer uuid), year, level, name,
    # embedding_generated_at, composite_key and score. Never return embedding arrays.
    query = (
        "CALL db.index.vector.queryNodes($indexName, $k, $queryVector)"
        " YIELD node, score"
        " WHERE node.embedding IS NOT NULL"
    " RETURN coalesce(node.id, elementId(node)) AS id,"
        " node.year AS year,"
        " node.level AS level,"
        " node.name AS name,"
        " node.embedding_generated_at AS embedding_generated_at,"
    " (coalesce(node.id, elementId(node)) + '|' + toString(node.year)) AS composite_key,"
        " score"
        " ORDER BY score DESC"
        " LIMIT $k"
    )
    params = {"indexName": index_name, "k": k, "queryVector": query_vector}
    with driver.session() as session:
        res = session.run(query, **params)
        rows = [record.data() for record in res]
    driver.close()
    return rows


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description='Compute embedding and query Neo4j vector index')
    parser.add_argument('text', help='Text query to embed (e.g. "inspection")')
    parser.add_argument('--k', type=int, default=3, help='number of neighbors to return (default: 3)')
    parser.add_argument('--min-score', type=float, default=0.0, help='minimum similarity score to keep (default: 0.0)')
    parser.add_argument('--json', action='store_true', help='output compact JSON summary instead of human text')
    args = parser.parse_args()

    # Prefer hardcoded test values if provided, otherwise fall back to environment
    NEO4J_URI = HARDCODE_NEO4J_URI or os.getenv('NEO4J_URI')
    NEO4J_USER = HARDCODE_NEO4J_USER or os.getenv('NEO4J_USERNAME') or os.getenv('NEO4J_USER')
    NEO4J_PASSWORD = HARDCODE_NEO4J_PASSWORD or os.getenv('NEO4J_PASSWORD')
    OPENAI_API_KEY = HARDCODE_OPENAI_API_KEY or os.getenv('OPENAI_API_KEY')

    missing = [name for name, val in (
        ('NEO4J_URI', NEO4J_URI), ('NEO4J_USERNAME', NEO4J_USER), ('NEO4J_PASSWORD', NEO4J_PASSWORD), ('OPENAI_API_KEY', OPENAI_API_KEY)
    ) if not val]
    if missing:
        print('Missing env vars:', missing, file=sys.stderr)
        sys.exit(1)

    openai.api_key = OPENAI_API_KEY

    model = 'text-embedding-3-small'  # matches generator

    print(f"Generating embedding for: {args.text} (model={model})")
    emb = generate_embedding(args.text, model)
    print(f"Embedding length: {len(emb)}")

    print(f"Querying Neo4j index '{INDEX_NAME}' for top {args.k} neighbors...")
    try:
        rows = query_vector_index(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, INDEX_NAME, emb, args.k)
    except Exception as e:
        print('Error querying Neo4j:', e, file=sys.stderr)
        sys.exit(2)
    # Post-filter by min-score and produce a compact summary (no raw embeddings)
    summaries = []
    for i, row in enumerate(rows, 1):
        # rows are projection dicts: { 'id': ..., 'name': ..., 'embedding_generated_at': ..., 'score': ... }
        score = row.get('score')
        if score is None:
            continue
        if score < args.min_score:
            continue
        summary = {
            'rank': i,
            'id': row.get('id'),
            'name': row.get('name'),
            'score': score,
        }
        if row.get('embedding_generated_at') is not None:
            summary['embedding_generated_at'] = row.get('embedding_generated_at')
        summaries.append(summary)

    # Trim to requested count (after filtering we may have fewer)
    summaries = summaries[: args.k]

    if args.json:
        print(json.dumps(summaries, indent=2, default=str))
    else:
        if not summaries:
            print('No results above min-score threshold.')
        else:
            print('Results:')
            for s in summaries:
                print(f"{s['rank']}. score={s['score']}  id={s.get('id')}  name={s.get('name')}" )


if __name__ == '__main__':
    main()
