import os
from pathlib import Path

import requests
from dotenv import load_dotenv

BACKEND_DOTENV_PATH = Path(__file__).resolve().parent / ".env"
ROOT_DOTENV_PATH = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(BACKEND_DOTENV_PATH)
load_dotenv(ROOT_DOTENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing SUPABASE_URL and/or a service key. Expected env vars: "
        "SUPABASE_URL plus one of SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY. "
        "Checked backend/.env then repo-root .env."
    )

REQUEST_TIMEOUT_S = int(os.getenv("SUPABASE_HTTP_TIMEOUT_S", "30"))

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _delete_existing(bundle: str, element: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.{bundle}&element=eq.{requests.utils.quote(element, safe='')}"
    resp = requests.delete(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
    if resp.status_code not in (200, 204):
        raise RuntimeError(f"Failed deleting existing element {bundle}/{element}: {resp.status_code} {resp.text}")


def _insert(row: dict) -> None:
    url = f"{SUPABASE_URL}/rest/v1/instruction_elements"
    resp = requests.post(url, headers=headers, json=row, timeout=REQUEST_TIMEOUT_S)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Failed inserting element {row.get('bundle')}/{row.get('element')}: {resp.status_code} {resp.text}")


def main() -> None:
    bundle = "tier3"

    elements = [
        {
            "bundle": bundle,
            "element": "3.0_4_canonical_templates",
            "content": "CANONICAL QUERY TEMPLATES (READ-ONLY, SAFE)\n\nThese templates avoid schema guessing by returning maps (n{.*}) and using dynamic filter keys.\n\nA) LIST NODES BY FILTERS (single-label)\nPARAMS:\n  $filters (map), $skip (int), $limit (int)\n\nQUERY PATTERN (use one of the 17 labels explicitly; do NOT parameterize labels in Cypher):\nMATCH (n:<LABEL>)\nWHERE ($filters IS NULL OR all(k IN keys($filters) WHERE n[k] = $filters[k]))\nRETURN n{.*} AS node\nORDER BY coalesce(n.id, '') ASC\nSKIP $skip\nLIMIT $limit\n\nB) COUNT BY FILTERS\nMATCH (n:<LABEL>)\nWHERE ($filters IS NULL OR all(k IN keys($filters) WHERE n[k] = $filters[k]))\nRETURN count(n) AS count\n\nC) DISTINCT VALUES FOR A KEY (encoding probe)\nPARAMS: $key (string)\nMATCH (n:<LABEL>)\nWITH [v IN collect(DISTINCT n[$key]) WHERE v IS NOT NULL][0..20] AS vals\nRETURN $key AS key, vals AS values\n\nD) RELATIONSHIP EXPANSION (bounded)\nPARAMS: $id (string), $limit (int)\nMATCH (a:<LABEL> {id:$id})-[r]-(b)\nRETURN\n  type(r) AS rel_type,\n  properties(r) AS rel_props,\n  labels(b) AS b_labels,\n  b{.*} AS b_node\nLIMIT $limit\n\nSUPPORTED LABELS (17):\nEntityProject\nEntityCapability\nEntityRisk\nEntityProcess\nEntityOrgUnit\nEntityITSystem\nEntityVendor\nEntityCultureHealth\nEntityChangeAdoption\nSectorObjective\nSectorPerformance\nSectorPolicyTool\nSectorAdminRecord\nSectorDataTransaction\nSectorCitizen\nSectorBusiness\nSectorGovEntity",
            "description": "Canonical safe query templates (read-only) to avoid schema guessing",
            "avg_tokens": 520,
            "version": "3.4.0",
            "status": "active",
        },
        {
            "bundle": bundle,
            "element": "3.0_5_entityproject_quarter_report_template",
            "content": "ENTITYPROJECT QUARTER REPORT TEMPLATE (READ)\n\nPrimary filter (preferred):\nMATCH (p:EntityProject)\nWHERE p.year = $year AND p.quarter = $quarter\nRETURN\n  p.id AS id,\n  p.name AS name,\n  p.level AS level,\n  p.status AS status,\n  p.progress_percentage AS progress_percentage,\n  p.budget AS budget,\n  p.start_date AS start_date,\n  p.end_date AS end_date\nORDER BY p.level, p.name\nLIMIT $limit\n\nSummary stats:\nMATCH (p:EntityProject)\nWHERE p.year = $year AND p.quarter = $quarter\nRETURN\n  count(p) AS count_projects,\n  avg(p.progress_percentage) AS avg_progress,\n  sum(p.budget) AS total_budget",
            "description": "EntityProject quarter report template (year/quarter first)",
            "avg_tokens": 240,
            "version": "3.4.0",
            "status": "active",
        },
        {
            "bundle": bundle,
            "element": "4.0_1_entityproject_quarter_encoding_probe",
            "content": "ENTITYPROJECT QUARTER ENCODING PROBE\n\nMATCH (p:EntityProject) WHERE p.year = $year\nRETURN collect(DISTINCT p.quarter)[0..50] AS quarter_values",
            "description": "Probe quarter encodings for EntityProject by year",
            "avg_tokens": 70,
            "version": "3.4.0",
            "status": "active",
        },
    ]

    print("Adding Tier 3 quarter elements...")

    for row in elements:
        _delete_existing(row["bundle"], row["element"])
        _insert(row)
        print(f"✓ {row['element']}")

    print("\n✅ Tier 3 quarter elements added.")


if __name__ == "__main__":
    main()
