Artifacts specification extracted from code

Summary
This document explains how artifacts are produced and returned by the existing backend (no invented fields). Primary source: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:251)

1) CHART artifacts
- Where generated: visualizations in orchestrator are converted into CHART artifacts in the handler at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:251).
- How the backend populates content: the code uses viz.get("config", {}) which is a Highcharts-style configuration object (treated as an opaque dict).

Highcharts properties you can expect in artifact.content (commonly used)
- chart.type (bar, column, line, area, pie, scatter, etc.)
- title.text
- xAxis.categories (array of category labels)
- yAxis.title.text
- series: array of { name: string, data: number[] | object[] }
- tooltip, plotOptions (for display tuning)
- legend, credits, exporting (optional)

Chart types observed / supported by generator
- Default in code: "bar" when unspecified (see chart_type default in [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:76))
- Typical types produced: bar, column, line, pie, scatter (the orchestrator may request others in specs)

Complete example of a CHART artifact object (content uses Highcharts shape)
{
  "artifact_type": "CHART",
  "title": "Risk by Project",
  "content": {
    "chart": { "type": "bar" },
    "title": { "text": "Risk by Project" },
    "xAxis": { "categories": ["Alpha","Beta","Gamma"] },
    "yAxis": { "title": { "text": "Risk Score" }, "min": 0 },
    "series": [
      { "name": "Risk Score", "data": [0.9, 0.87, 0.65] }
    ],
    "tooltip": { "valueDecimals": 2 },
    "plotOptions": { "series": { "animation": false } }
  },
  "description": "Top projects by risk"
}

Notes:
- The backend supplies a high-level Highcharts config via viz.config. Frontend can pass this directly to Highcharts or canonicalize it (e.g., ensure categories and numeric series exist).
- If artifact.content lacks full Highcharts fields, the frontend should build missing pieces (xAxis categories, series mapping) from artifact.content where possible.

2) TABLE artifacts (common and used by canvas)
- Where generated: when orchestrator returns query_results the code converts results into a TABLE artifact (see [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:262)).
- content shape (exact fields produced): { columns: string[], rows: any[][], total_rows: number }

Example TABLE artifact
{
  "artifact_type": "TABLE",
  "title": "Query Results (2 rows)",
  "content": {
    "columns": ["project_id", "name", "risk_score"],
    "rows": [[1, "Alpha", 0.9], [2, "Beta", 0.87]],
    "total_rows": 2
  },
  "description": "Data table with 2 rows and 3 columns"
}

3) REPORT and DOCUMENT artifacts
- Current backend: chat handler explicitly converts visualizations and query_results to CHART and TABLE. REPORT and DOCUMENT types are allowed by the Artifact model but not heavily used in the shown code. When present, content is treated as an opaque object; the frontend must detect format and render accordingly.

Expected formats and examples
- REPORT: typically a structured summary. Format choices: markdown, structured JSON (sections), or HTML. Example using markdown payload:
{
  "artifact_type": "REPORT",
  "title": "Executive Summary",
  "content": { "format": "markdown", "body": "# Executive Summary\n\n- Key finding 1\n- Key finding 2" },
  "description": "Auto-generated executive summary"
}

- DOCUMENT: for larger documents (briefs, exports). Common content formats: html or structured JSON. Example (HTML):
{
  "artifact_type": "DOCUMENT",
  "title": "Project Brief",
  "content": { "format": "html", "body": "<h1>Project Brief</h1><p>Overview...</p>" },
  "description": "Detailed brief"
}

Notes about REPORT/DOCUMENT:
- The backend currently treats artifact.content as a dict. If the frontend requires a stricter format (e.g., always markdown), coordinate with backend to standardize.

4) visualization vs artifacts in ChatResponse
- ChatResponse model (see [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:135)) contains both:
  - visualization: Optional[dict]
  - artifacts: List[Artifact]
- In the current implementation the handler sets `visualization=None` and populates `artifacts` (a list) with CHART and TABLE entries. See return of ChatResponse at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:343).

Interpretation and recommended frontend behavior
- visualization appears to be a legacy/single-visualization field (not used by the code path that converts visualizations into artifacts).
- artifacts (plural) is authoritative in current code: it contains zero or more Artifact objects (CHART, TABLE, etc.).
- Recommendation: frontend should render the `artifacts` array (loop and handle each artifact by type). Only fall back to `visualization` if `artifacts` is empty and `visualization` contains displayable content.

5) Where artifacts appear and how to retrieve them
- Artifacts are returned inline in the POST response for the chat message: POST /api/v1/chat/message -> returns ChatResponse with artifacts (see handler annotation at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:171) and the return at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:343)).
- The handler also persists the artifacts to the message metadata when calling `conversation_manager.add_message(...)` (artifacts placed in the message metadata payload at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:319)).
- To fetch previously produced artifacts for a conversation, call GET /api/v1/chat/conversations/{conversation_id}/messages which returns messages and their metadata (the code renames extra_metadata to metadata for frontend compatibility at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:463)). There is no separate /api/v1/chat/artifacts endpoint.

6) Rendering guidance (front-end)
- Always check for `data.artifacts` (array). Do not look for a single `data.artifact` object — the backend returns an array.
- For CHART: if artifact.content is a full Highcharts config, pass it to your chart renderer (Highcharts) after validating categories and series. If content is partial, construct the Highcharts config from content keys.
- For TABLE: render a table using content.columns and content.rows. Use total_rows for pagination UI hints.
- For REPORT/DOCUMENT: read content.format and render markdown or html accordingly. Show a fallback viewer (preformatted JSON) if an unknown format is returned.
- Defensive UI: if artifact.content is missing expected fields, show a helpful placeholder and expose a "raw JSON" view for debugging.

7) Persistence and schema notes
- Message rows in DB include: content (message text), artifact_ids (optional), extra_metadata JSONB. The schema scaffolding references artifact storage fields (see [`backend/sql/create_tables.sql`](backend/sql/create_tables.sql:43) and model definitions at [`backend/app/db/models.py`](backend/app/db/models.py:80)). Currently visualizations are included in message metadata but chart artifacts are not saved to a dedicated artifacts table by default (they are included in message.extra_metadata). If you require artifact ids and long-term storage, request the backend to persist artifacts to a separate table and return artifact ids instead.

References
- Chat handler: [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:171)
- Artifact generation helper: `_generate_artifacts_from_specs` in [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:23)
- Where artifacts are stored in message metadata: conversation_manager.add_message call at [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:319)
- Messages retrieval: GET /api/v1/chat/conversations/{conversation_id}/messages (see [`backend/app/api/routes/chat.py`](backend/app/api/routes/chat.py:463))

If you want, I can also:
- Extract a real example ChatResponse from the logs (backend/logs/chat_debug_*.json) and save it as an example file.
- Propose a strict TypeScript shape for artifact.content for frontend use.
