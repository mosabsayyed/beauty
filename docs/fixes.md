### Why it failed (specific, not theoretical)

1. **The agent “assumed schema” instead of loading it**, then wrote Cypher using guessed labels/properties (`Project`, `project_id`, date-range logic). That guarantees drift.

2. **Quarter intent got translated into a “start_date within quarter” filter**, which is logically wrong for “projects in Q3” and also brittle if `start_date` is null/inconsistent or fiscal calendars differ.

3. **Your own Tier1 rule blocks verification**: `5.4_rules_of_thumb` says “dont re-query to verify.” That prevents the single most important safety action: running a cheap presence/shape check when the first query returns 0 rows.

4. **No mandatory empty-result ladder exists**. The agent had no enforced sequence: “0 rows → run count → inspect distinct quarter encodings → sample records → only then conclude.”

---

## Patch package: exact instruction updates

Below are **copy/paste replacements** for existing elements, plus **new elements to add**. Keep your existing element names so your assembler continues to work.

---

### 1) Replace: `tier1 / 0.7_temporal_logic`

```text
TEMPORAL LOGIC (AUTHORITATIVE ORDER)

1) If the graph provides year + quarter fields for the target entity, those are the PRIMARY filters for quarter-based questions.
   - Example: "Q3 2025 projects" => WHERE p.year = 2025 AND p.quarter = 'Q3'

2) DO NOT convert "Qx" into a date range (Jul–Sep etc.) unless:
   (a) the requested entity does NOT have year/quarter populated, OR
   (b) the user explicitly asks for date-window logic.

3) If you must use dates, interpret "projects in Qx" as OVERLAP, not START-IN-QUARTER:
   start_date <= quarter_end AND end_date >= quarter_start

4) Quarter encoding must be confirmed from data when results are empty:
   run a DISTINCT quarter inspection query and adapt.
```

---

### 2) Replace: `tier1 / 5.4_rules_of_thumb`

```text
RULES OF THUMB

- Synchronous responses only; no streaming.
- JSON must be valid (no comments).
- Trust tool results when they are NON-EMPTY and coherent.

- EXCEPTION (MANDATORY RE-QUERY):
  If a data-mode request expects records (report/list/status) and the first retrieval returns 0 rows,
  you MUST run the Empty-Result Ladder (presence + distinct-values + sample) before concluding "no data".

- Never claim "no data" without including diagnostic counts proving it.
```

This single change removes the self-inflicted “don’t verify” trap that caused the failure.

---

### 3) Replace: `tier2 / 3.0_step3_recall`

```text
STEP 3: RECALL (Graph Retrieval)

- Translation: Convert concepts into precise Cypher using ONLY:
  (a) loaded node schemas,
  (b) loaded relationship definitions,
  (c) data_integrity_rules.

- HARD PROHIBITION:
  Never write or act on "Let's assume schema".
  Never invent labels or property names.

- Schema Loading Rule:
  Before writing a Cypher query for an entity label, you must have loaded its schema element.
  If schema is not loaded, call retrieve_instructions(elements=[<needed_schema_elements>]).

- Quarter-based Queries Rule:
  If the schema lists year and quarter properties, filter by those first.
  Do NOT default to start_date range.

- Execution:
  Execute router__read_neo4j_cypher with parameters ($year, $quarter, etc.), never inline user values.
```

---

### 4) Replace: `tier2 / 4.0_step4_reconcile`

```text
STEP 4: RECONCILE (Validation & Logic)

A) Coverage Check
- Confirm the retrieval matches the user intent (entity + time slice + level).

B) Empty-Result Ladder (MANDATORY when 0 rows returned)
Run these tool calls IN ORDER and store outputs:

1) Presence check:
   MATCH (p:EntityProject) RETURN count(p) AS total_projects

2) Shape check (encodings):
   MATCH (p:EntityProject)
   WITH collect(DISTINCT p.year) AS years, collect(DISTINCT p.quarter) AS quarters
   RETURN years[0..20] AS years, quarters[0..20] AS quarters

3) Requested year check:
   MATCH (p:EntityProject) WHERE p.year = $year
   RETURN count(p) AS year_count, collect(DISTINCT p.quarter)[0..20] AS quarters_for_year

4) Requested year+quarter check:
   MATCH (p:EntityProject) WHERE p.year = $year AND p.quarter = $quarter
   RETURN count(p) AS exact_count

5) Sample records for verification (only if total_projects > 0):
   MATCH (p:EntityProject) WHERE p.year = $year
   RETURN p.id AS id, p.name AS name, p.quarter AS quarter, p.status AS status,
          p.start_date AS start_date, p.end_date AS end_date,
          p.progress_percentage AS progress, p.budget AS budget
   ORDER BY p.quarter, p.name
   LIMIT 10

C) Conclusion Rules
- If total_projects > 0 but exact_count = 0:
  state "no records match the requested quarter encoding" and show the available quarter values.
- If total_projects = 0:
  state "projects are not loaded" (confirmed) and stop.
```

---

## New instruction elements to add (minimal, targeted)

### Add: `tier3 / 3.0_5_entityproject_quarter_report_template`

```text
ENTITYPROJECT QUARTER REPORT TEMPLATE (READ)

Primary filter (preferred):
MATCH (p:EntityProject)
WHERE p.year = $year AND p.quarter = $quarter
RETURN
  p.id AS id,
  p.name AS name,
  p.level AS level,
  p.status AS status,
  p.progress_percentage AS progress_percentage,
  p.budget AS budget,
  p.start_date AS start_date,
  p.end_date AS end_date
ORDER BY p.level, p.name
LIMIT $limit

Summary stats:
MATCH (p:EntityProject)
WHERE p.year = $year AND p.quarter = $quarter
RETURN
  count(p) AS count_projects,
  avg(p.progress_percentage) AS avg_progress,
  sum(p.budget) AS total_budget
```

### Add: `tier3 / 4.0_1_entityproject_quarter_encoding_probe`

```text
ENTITYPROJECT QUARTER ENCODING PROBE

MATCH (p:EntityProject) WHERE p.year = $year
RETURN collect(DISTINCT p.quarter)[0..50] AS quarter_values
```

These two eliminate “guessing Q3 encoding” and stop the model from inventing date windows.

---

## Backend enforcement hook (removes reliance on the model’s discipline)

Implement this as a **post-tool guard** in your orchestration flow (the stage where you already do “auto-recovery if needed”):

**Trigger condition**

* mode in (A,B,C,D)
* user intent implies list/report (contains “report”, “list”, “show”, “generate”, or UI action flag)
* first retrieval returned 0 rows

**Forced diagnostics (server-side, deterministic)**

1. run `MATCH (p:EntityProject) RETURN count(p)`
2. if count > 0, run encoding probe + year/quarter count
3. inject diagnostics into the model context OR directly craft the response scaffold:

   * “Total projects exist: N”
   * “Available quarters for year 2025: [...]”
   * “No matches for requested quarter encoding: Q3”

This guarantees you never output “no data” when data exists.

---

## The one change that matters most

Delete/replace the line: **“Trust tool results; dont re-query to verify.”**
Keep “don’t re-query” only for **non-empty** results. For **empty** results, verification is mandatory.


Second phase
Transform the agent into a reliable transformation analyst across the graph.
## 1) Contract alignment fixes

### A. Replace `tier1 / 0.2_conditional_routing` content

```text
CONDITIONAL ROUTING
IF mode in (A, B, C, D):
  - Call retrieve_instructions(mode="tier2", tier="data_mode_definitions")
  - Follow Steps 1-4 in Tier 2
  - Then proceed to Step 5

ELSE (mode in E, F, G, H, I, J):
  - Execute directly using identity/mindset
  - Follow E-J protocols
  - Then proceed to Step 5
```

### B. Replace `tier2 / 3.0_step3_recall` content (fix tool name + “no schema guessing”)

```text
STEP 3: RECALL (Graph Retrieval)

- Translation: Convert concepts into precise Cypher using ONLY loaded schema elements:
  node_schema, level_definitions, relationship_definitions, and data_integrity_rules.

- HARD PROHIBITIONS:
  * Never invent labels or property names.
  * Never write “let’s assume schema”.
  * If required schema is not loaded, call retrieve_instructions(mode="tier3", elements=[...]) and only then write Cypher.

- Cypher Rules:
  * Alternative relationships must be written as :REL1|REL2|REL3 (NOT :REL1|:REL2|:REL3)
  * Level integrity: apply level filters only when the question requires a single level; otherwise do NOT force same level across all nodes.

- Execution (AUTHORITATIVE TOOL CONTRACT):
  Call read_neo4j_cypher(query=<cypher_string>, params=<dict_or_null>)
```

### C. Replace `tier2 / 3.0_tool_execution_rules` content (fix tool name + require params)

```text
TOOL EXECUTION RULES (read_neo4j_cypher)

1) Always parameterize user values.
   - NEVER inline user values inside Cypher.
   - Use params dict for year/quarter/status/ids/etc.

2) Bounded retrieval:
   - Default LIMIT 50 unless the user explicitly requests more.
   - Use SKIP/LIMIT for pagination when needed.

3) Return maps when schema uncertainty exists:
   - Prefer RETURN n{.*} AS node over enumerating properties unless schema is loaded and stable.

4) Always echo exact query + params in output:
   - Populate cypher_executed with the exact Cypher executed.
   - Populate cypher_params with the params dict used.
```

### D. Replace `tier2 / 2.0_step2_recollect` content (fix retrieve_instructions contract)

```text
STEP 2: RECOLLECT (Semantic Anchoring)

- Anchor: Identify the required node labels + relationships + business_chain(s).
- Load required instruction elements BEFORE writing Cypher:
  * retrieve_instructions(mode="tier3", elements=[<node schemas>, <relationship schemas>, <canonical templates>])
- Use recall_memory(scope=<allowed>, query_summary=<short>, limit=5) only to refine intent/context, never to assume data existence.
```

---

## 2) Evidence gating fixes (prompt-level + output-level)

### A. Replace `tier1 / 5.2_output_format` content (add mode + params + diagnostics + evidence)

```json
{
  "mode": "A|B|C|D|E|F|G|H|I|J",
  "memory_process": { "intent": "..." },
  "answer": "Business-language narrative grounded in retrieved evidence only",
  "analysis": ["Insight 1", "Insight 2"],
  "evidence": [
    {
      "claim": "short factual claim",
      "support": {
        "type": "query_results|summary_stats|diagnostics",
        "path": "data.query_results[0].id | data.summary_stats.count | data.diagnostics.total_nodes"
      }
    }
  ],
  "data": {
    "query_plan": {
      "primary_label": "EntityProject",
      "filters": {},
      "limit": 50,
      "skip": 0
    },
    "query_results": [],
    "summary_stats": {},
    "diagnostics": {}
  },
  "visualizations": [],
  "cypher_executed": "MATCH ...",
  "cypher_params": {},
  "confidence": 0.95
}
```

### B. Add new element `tier1 / 5.3_evidence_gating` (insert as a new active row)

```text
EVIDENCE GATING (MANDATORY)

1) Any factual statement in "answer" must be supported by either:
   - data.query_results (record IDs / fields), OR
   - data.summary_stats (counts/aggregates), OR
   - data.diagnostics (presence/encoding proof).

2) If data.query_results is empty, you MUST NOT claim “no data” unless:
   - diagnostics prove total_nodes = 0, OR
   - diagnostics prove total_nodes > 0 but exact_match_count = 0 and you show available encodings.

3) Always populate:
   - cypher_executed (exact query)
   - cypher_params (exact params)
   - data.query_plan (label + filters + limit/skip)
```

### C. Replace `tier2 / 4.0_step4_reconcile` content (enforce empty-result ladder)

```text
STEP 4: RECONCILE (Validation & Logic)

A) Validate retrieval matches the question:
- correct label(s)
- correct filter intent (year/quarter/status/etc.)
- correct granularity (L1/L2/L3 only if requested)

B) If query_results is empty AND this is a data mode (A–D):
- Run the Empty-Result Ladder and populate data.diagnostics.

EMPTY-RESULT LADDER (AUTHORITATIVE)
1) Presence:
   MATCH (n:<PRIMARY_LABEL>) RETURN count(n) AS total_nodes

2) Filter-key availability (for each key in cypher_params):
   MATCH (n:<PRIMARY_LABEL>)
   RETURN $key AS key, collect(DISTINCT n[$key])[0..20] AS values

3) Exact-match count:
   MATCH (n:<PRIMARY_LABEL>)
   WHERE all(k IN keys($filters) WHERE n[k] = $filters[k])
   RETURN count(n) AS exact_match_count

4) Sample (only if total_nodes > 0):
   MATCH (n:<PRIMARY_LABEL>) RETURN n{.*} AS node LIMIT 10

C) Conclusion rules:
- total_nodes = 0 → “dataset not loaded” (verified)
- total_nodes > 0 and exact_match_count = 0 → “no match for requested filters” + show available values
- Never output “no data” without diagnostics.
```

### D. Replace `tier2 / 5.4_rules_of_thumb` line that blocks verification

Replace the line:

```text
- Trust tool results; dont re-query to verify.
```

With:

```text
- Trust NON-EMPTY tool results.
- EMPTY results REQUIRE verification via the Empty-Result Ladder before concluding “no data”.
```

---

## 3) Canonical templates (17 labels) — exact Tier3 element to add

Add new element `tier3 / 3.0_4_canonical_templates`:

```text
CANONICAL QUERY TEMPLATES (READ-ONLY, SAFE)

These templates avoid schema guessing by returning maps (n{.*}) and using dynamic filter keys.

A) LIST NODES BY FILTERS (single-label)
PARAMS:
  $label (string), $filters (map), $skip (int), $limit (int)

QUERY PATTERN (use one of the 17 labels explicitly; do NOT parameterize labels in Cypher):
MATCH (n:<LABEL>)
WHERE ($filters IS NULL OR all(k IN keys($filters) WHERE n[k] = $filters[k]))
RETURN n{.*} AS node
ORDER BY coalesce(n.id, "") ASC
SKIP $skip
LIMIT $limit

B) COUNT BY FILTERS
MATCH (n:<LABEL>)
WHERE ($filters IS NULL OR all(k IN keys($filters) WHERE n[k] = $filters[k]))
RETURN count(n) AS count

C) DISTINCT VALUES FOR A KEY (encoding probe)
PARAMS: $key (string)
MATCH (n:<LABEL>)
WITH [v IN collect(DISTINCT n[$key]) WHERE v IS NOT NULL][0..20] AS vals
RETURN $key AS key, vals AS values

D) RELATIONSHIP EXPANSION (bounded)
PARAMS: $id (string), $limit (int)
MATCH (a:<LABEL> {id:$id})-[r]-(b)
RETURN
  type(r) AS rel_type,
  properties(r) AS rel_props,
  labels(b) AS b_labels,
  b{.*} AS b_node
LIMIT $limit

SUPPORTED LABELS (17):
EntityProject
EntityCapability
EntityRisk
EntityProcess
EntityOrgUnit
EntityITSystem
EntityVendor
EntityCultureHealth
EntityChangeAdoption
SectorObjective
SectorPerformance
SectorPolicyTool
SectorAdminRecord
SectorDataTransaction
SectorCitizen
SectorBusiness
SectorGovEntity
```

Then update your retrieval logic in Tier2 Step 3 to explicitly load this element when entering A–D:

* `retrieve_instructions(mode="tier3", elements=["3.0_4_canonical_templates", "<node schema element(s)>", "<relationship schemas if needed>"])`

---

## 4) Backend empty-result guard (deterministic, zero extra LLM calls)

### A. Update the response model (Pydantic) to carry params + mode + diagnostics

Wherever `ChatResponse` is defined (your architecture shows it in the API layer), add:

* `mode: Optional[str]`
* `cypher_params: Optional[Dict]`
* ensure `data.diagnostics` exists

Example patch (exact fields):

```python
class ChatResponse(BaseModel):
    mode: Optional[str] = None
    memory_process: Optional[Dict] = None
    answer: str
    analysis: List[Any] = []
    data: Dict = {}
    visualizations: List[Any] = []
    cypher_executed: Optional[str] = None
    cypher_params: Optional[Dict] = None
    confidence: float
```

### B. Add `EmptyResultGuard` in `/backend/app/services/orchestrator_universal.py`

This runs AFTER LLM JSON parse, BEFORE returning to frontend.

```python
import re
from typing import Any, Dict, Optional, Tuple
from neo4j import GraphDatabase

LABEL_RE = re.compile(r"MATCH\s*\(\s*\w+\s*:\s*([A-Za-z_][A-Za-z0-9_]*)", re.IGNORECASE)

def _extract_primary_label(cypher: str) -> Optional[str]:
    m = LABEL_RE.search(cypher or "")
    return m.group(1) if m else None

class Neo4jReadClient:
    def __init__(self, uri: str, username: str, password: str, database: Optional[str] = None):
        self._driver = GraphDatabase.driver(uri, auth=(username, password))
        self._database = database

    def close(self):
        self._driver.close()

    def read(self, query: str, params: Optional[Dict] = None) -> list[dict]:
        params = params or {}
        with self._driver.session(database=self._database) as session:
            result = session.run(query, params)
            return [dict(r) for r in result]

def apply_empty_result_guard(resp: Dict[str, Any], neo: Neo4jReadClient) -> Dict[str, Any]:
    data = resp.get("data") or {}
    query_results = data.get("query_results")
    cypher = resp.get("cypher_executed")
    params = resp.get("cypher_params") or {}
    mode = resp.get("mode")

    # Trigger only when this looks like a data-mode retrieval attempt
    if not cypher or not isinstance(query_results, list) or len(query_results) != 0:
        return resp

    # If mode is missing, infer “data attempt” from having cypher_executed
    if mode is None:
        mode = "A"
        resp["mode"] = mode

    if mode not in {"A", "B", "C", "D"}:
        return resp

    label = _extract_primary_label(cypher)
    if not label:
        return resp

    diagnostics: Dict[str, Any] = {}

    # 1) Presence
    q_total = f"MATCH (n:{label}) RETURN count(n) AS total_nodes"
    total_rows = neo.read(q_total)
    total_nodes = int(total_rows[0]["total_nodes"]) if total_rows else 0
    diagnostics["primary_label"] = label
    diagnostics["total_nodes"] = total_nodes

    # 2) Distinct values for each param key (encoding probe)
    filters = (data.get("query_plan") or {}).get("filters") or {}
    if not filters and isinstance(params, dict):
        # treat cypher_params as filters if query_plan missing
        filters = params

    diagnostics["filters"] = filters

    distinct_map: Dict[str, Any] = {}
    for key in list(filters.keys())[:8]:  # bound
        q_dist = (
            f"MATCH (n:{label}) "
            f"WITH [v IN collect(DISTINCT n[$key]) WHERE v IS NOT NULL][0..20] AS vals "
            f"RETURN $key AS key, vals AS values"
        )
        rows = neo.read(q_dist, {"key": key})
        if rows:
            distinct_map[key] = rows[0].get("values", [])
    diagnostics["available_values"] = distinct_map

    # 3) Exact-match count using dynamic keys
    q_exact = (
        f"MATCH (n:{label}) "
        f"WHERE ($filters IS NULL OR all(k IN keys($filters) WHERE n[k] = $filters[k])) "
        f"RETURN count(n) AS exact_match_count"
    )
    exact_rows = neo.read(q_exact, {"filters": filters})
    exact_count = int(exact_rows[0]["exact_match_count"]) if exact_rows else 0
    diagnostics["exact_match_count"] = exact_count

    # 4) Sample records if dataset exists
    if total_nodes > 0:
        q_sample = f"MATCH (n:{label}) RETURN n{{.*}} AS node LIMIT 10"
        diagnostics["sample"] = neo.read(q_sample)

    data.setdefault("diagnostics", {}).update(diagnostics)
    resp["data"] = data

    # Deterministic override: prevent false “no data”
    if total_nodes > 0 and exact_count == 0:
        resp["answer"] = (
            "No records match the requested filters (verified). "
            "The dataset exists, but the filter encoding may differ. "
            "See diagnostics for available values."
        )
    elif total_nodes == 0:
        resp["answer"] = "No records exist for this entity label (verified). The dataset appears not loaded."

    return resp
```

### C. Wire it into the orchestrator (exact call site)

In your `execute_query(...)` after parsing/validating the LLM JSON:

```python
# after: resp = parsed_json

neo = Neo4jReadClient(
    uri=os.getenv("NEO4J_URI"),
    username=os.getenv("NEO4J_USERNAME"),
    password=os.getenv("NEO4J_PASSWORD"),
    database=os.getenv("NEO4J_DATABASE"),
)

try:
    resp = apply_empty_result_guard(resp, neo)
finally:
    neo.close()

return resp
```

---

## Resulting behavior change (what this guarantees)

* The model can still write a bad query; the backend will block the catastrophic failure mode: “0 rows → conclude no data.”
* Every “no data” response becomes **provably true** (total_nodes=0) or **accurately scoped** (dataset exists but filters don’t match, with available encodings shown).
* Canonical templates eliminate schema invention by default (`n{.*}` + dynamic filter keys).
* Contract alignment removes tool-call argument drift (`retrieve_instructions(mode=...)`, `read_neo4j_cypher(query, params)`, `cypher_params` echoed).
