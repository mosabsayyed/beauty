## Vector query prompt snippet (modular; do NOT add to master prompt yet)

Purpose: provide a concise, zero-shot, plug-in snippet the LLM can use to call the MCP Neo4j read tool for vector searches. This snippet contains exactly two templates (no discovery, no options) and the deterministic index-name pattern observed in the embedding generator logs.

-- IMPORTANT RULES --
- Never run schema dumps (SHOW PROCEDURES / SHOW INDEXES) in zero-shot runtime. Those can be huge and crash the LLM.
- Never return embeddings arrays to the LLM. Responses must contain only metadata and scores.
- Use non-deprecated syntax: replace exists(x.y) with x.y IS NOT NULL. Prefer the application `id` property (`node.id`) first, then `elementId(node)` as a fallback. Do NOT reference `uuid` or use `id()`.
- Always include composite_key = id|year and level in every returned row.

INDEX-NAME PATTERN (must be provided to LLM)
- Deterministic convention used by the embedding generator and index creation scripts:
  vector_index_<normalized_label>
  where normalized_label = lowercase(label) with all non-alphanumeric characters removed.
  Example: `EntityProject` -> `vector_index_entityproject`.

TEMPLATE A — expression → native vector index (use when you have an embedding for a text expression)
- When to use: you have a runtime-computed embedding (1536 floats, model=text-embedding-3-small) and you know the label (so you can derive indexName using the INDEX-NAME PATTERN).
- Call this exact Cypher and params (no deviation):

Cypher:
```
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
LIMIT $k;
```

Params (exact JSON):
```
{
  "indexName": "vector_index_entityproject",
  "queryVector": [ /* 1536 floats */ ],
  "k": 3,
  "minScore": null
}
```

Expected MCP response shape (JSON array of objects — no embeddings):
```
[
  {"id":"1.8.1","year":2025,"level":"L3","name":"...","embedding_generated_at":"...","composite_key":"1.8.1|2025","score":0.91},
  ...
]
```

TEMPLATE B — stored node→node comparison (use when both nodes already have embeddings)
- When to use: you want to compare a specific node (e.g., a Project identified by id+year+level) to other nodes that already have embeddings (OrgUnit, Processes, etc.). This template uses stored embeddings and computes cosine similarity in pure Cypher; it MUST be used when the LLM's intent is to compare stored embeddings.

Cypher:
```
MATCH (p:EntityProject {id:$projectId, year:$projectYear, level:$projectLevel})
WHERE p.embedding IS NOT NULL
MATCH (o:$targetLabel)
WHERE o.embedding IS NOT NULL AND size(o.embedding) = size(p.embedding)
WITH o, p, p.embedding AS vp, o.embedding AS vo
WITH o,
     reduce(dot = 0.0, i IN range(0, size(vp)-1) | dot + vp[i] * vo[i]) AS dot,
     reduce(np = 0.0, i IN range(0, size(vp)-1) | np + vp[i] * vp[i]) AS np,
     reduce(no = 0.0, i IN range(0, size(vo)-1) | no + vo[i] * vo[i]) AS no
WITH o, CASE WHEN np = 0 OR no = 0 THEN 0 ELSE dot / sqrt(np * no) END AS cosine
RETURN
  coalesce(o.id, elementId(o)) AS id,
  o.year AS year,
  o.level AS level,
  o.name AS name,
  (coalesce(o.id, elementId(o)) + '|' + toString(o.year)) AS composite_key,
  cosine AS score
ORDER BY score DESC
LIMIT $k;
```

Params (exact JSON):
```
{
  "projectId": "1.8.1",
  "projectYear": 2025,
  "projectLevel": "L3",
  "targetLabel": "EntityOrgUnit",
  "k": 5
}
```

Expected MCP response shape: same as TEMPLATE A (array of objects with id, year, level, name, composite_key, score).

USAGE RULES (enforced in the prompt insertion later)
- The master prompt must instruct the LLM to pick exactly one template per action: if it has an embedding for a text expression and an indexName (derived via the INDEX-NAME PATTERN), it MUST call TEMPLATE A. If it needs to compare stored embeddings between nodes, it MUST call TEMPLATE B. No discovery, no fallbacks, no additional queries.
- Do not expose or return node.embedding arrays. Do not allow the LLM to request schema listing or procedure listing in zero‑shot runtime.

Note: This file is the modular snippet to be inserted into the master zero‑shot prompt later. Do NOT modify the master prompt yet — insert this module when you are ready to augment the master prompt with vector-query capability.
