import os
from pathlib import Path
import re

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

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

REQUEST_TIMEOUT_S = int(os.getenv("SUPABASE_HTTP_TIMEOUT_S", "30"))

print("TIER 3 FIXES")
print("="*80)


def _strip_cypher_sections(content: str) -> str:
    if not content:
        return content

    cleaned = content

    # Remove fenced cypher blocks
    cleaned = re.sub(r"```\s*cypher\s*.*?```", "", cleaned, flags=re.DOTALL | re.IGNORECASE)

    # Truncate at the first occurrence of common cypher/query markers
    markers = [
        "Query Pattern:",
        "Cypher Pattern:",
        "Example Query Pattern:",
        "CYPHER QUERY PATTERNS",
    ]
    lowered = cleaned.lower()
    cut_at = None
    for marker in markers:
        idx = lowered.find(marker.lower())
        if idx != -1:
            cut_at = idx if cut_at is None else min(cut_at, idx)
    if cut_at is not None:
        cleaned = cleaned[:cut_at]

    # Normalize whitespace
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return cleaned


def _is_relationship_element_name(element: str) -> bool:
    return bool(element) and element.isupper() and not element.startswith("Entity") and not element.startswith("Sector")


def _strip_leading_content_tag(content: str) -> tuple[str, str | None]:
    """Remove leading `X.Y_3` style tag from the very beginning of content.

    Returns (cleaned_content, tag_without_trailing_space_or_None)
    """
    if not content:
        return content, None

    m = re.match(r"^\s*(\d+(?:\.\d+)?_\d+)\s+", content)
    if not m:
        return content, None
    tag = m.group(1)
    cleaned = re.sub(r"^\s*\d+(?:\.\d+)?_\d+\s+", "", content, count=1)
    return cleaned, tag


def _strip_numeric_element_prefix(element: str) -> str:
    return re.sub(r"^\d+(?:\.\d+)?_", "", element or "")

# 1. Rename bundle from tier3_elements to tier3
print("\n1. Renaming bundle: tier3_elements → tier3...")
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3_elements"
response = requests.patch(url, headers=headers, json={'bundle': 'tier3'}, timeout=REQUEST_TIMEOUT_S)
if response.status_code in [200, 204]:
    print("   ✓ Bundle renamed")
else:
    print(f"   ✗ Error: {response.status_code}")

# 2. Delete aggregate elements
print("\n2. Removing aggregate elements...")
aggregates = ['business_chains', 'direct_relationships', 'graph_schema', 'visualization_schema']
for agg in aggregates:
    url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&element=eq.{agg}"
    response = requests.delete(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
    if response.status_code in [200, 204]:
        print(f"   ✓ Removed {agg}")
    else:
        print(f"   ✗ {agg}: {response.status_code}")


# 3. No-cypher cleanup (relationships + cypher blocks)
print("\n3. Applying no-cypher cleanup (delete relationships, remove cypher_examples, sanitize business chains)...")

# Fetch current Tier 3 element list (and content for sanitation)
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&select=element,content"
response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
rows = response.json() if response.status_code == 200 else []

# 3a) Delete uppercase relationship elements (redundant under direct-relationship whitelist)
relationship_elements = sorted({r["element"] for r in rows if _is_relationship_element_name(r.get("element", ""))})
for rel in relationship_elements:
    url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&element=eq.{rel}"
    resp = requests.delete(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
    if resp.status_code in [200, 204]:
        print(f"   ✓ Deleted relationship element {rel}")
    else:
        print(f"   ✗ Failed deleting {rel}: {resp.status_code}")

# 3b) Delete cypher_examples if present
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&element=eq.cypher_examples"
resp = requests.delete(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
if resp.status_code in [200, 204]:
    print("   ✓ Deleted cypher_examples (if it existed)")
else:
    print(f"   ✗ Failed deleting cypher_examples: {resp.status_code}")

# 3c) Strip cypher/query patterns from business chain elements
business_chain_rows = [r for r in rows if (r.get("element") or "").startswith("business_chain_")]
sanitized = 0
unchanged = 0
for r in business_chain_rows:
    element = r.get("element")
    old = r.get("content") or ""
    new = _strip_cypher_sections(old)
    if new == old:
        unchanged += 1
        continue

    url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&element=eq.{element}"
    resp = requests.patch(url, headers=headers, json={"content": new}, timeout=REQUEST_TIMEOUT_S)
    if resp.status_code in [200, 204]:
        sanitized += 1
        print(f"   ✓ Sanitized {element} (removed cypher)")
    else:
        print(f"   ✗ Failed sanitizing {element}: {resp.status_code}")

print(f"   → Business chains sanitized: {sanitized}, unchanged: {unchanged}")

# 4. Renumber Tier 3 elements using existing content prefix tags
print("\n4. Renumbering Tier 3 elements (move X.Y_3 from content → X.Y_ in element)...")

url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&select=id,element,content&order=element.asc"
response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
tier3_rows = response.json() if response.status_code == 200 else []

existing_elements = {r.get("element") for r in tier3_rows}
renamed = 0
content_stripped = 0
skipped_already_numbered = 0
skipped_no_tag = 0
collisions = 0

for r in tier3_rows:
    row_id = r.get("id")
    old_element = r.get("element") or ""
    old_content = r.get("content") or ""

    # If already numbered, only strip content tag if still present.
    already_numbered = bool(re.match(r"^\d+(?:\.\d+)?_", old_element))
    new_content, tag = _strip_leading_content_tag(old_content)

    desired_element = None
    if not already_numbered:
        if not tag:
            skipped_no_tag += 1
        else:
            # tag is like "5.10_3" or "3.2_3" → desired prefix "5.10_" or "3.2_"
            major_minor = tag.rsplit("_", 1)[0]
            base_name = _strip_numeric_element_prefix(old_element)
            desired_element = f"{major_minor}_{base_name}"

    # Handle collisions if we need to rename element
    if desired_element and desired_element != old_element:
        if desired_element in existing_elements:
            collisions += 1
            print(f"   ✗ Collision: {old_element} → {desired_element} (already exists)")
            desired_element = None
        else:
            existing_elements.add(desired_element)
            existing_elements.discard(old_element)

    # Patch if anything changed
    patch = {}
    if desired_element and desired_element != old_element:
        patch["element"] = desired_element
    if tag and new_content != old_content:
        patch["content"] = new_content

    if not patch:
        if already_numbered:
            skipped_already_numbered += 1
        continue

    url = f"{SUPABASE_URL}/rest/v1/instruction_elements?id=eq.{row_id}"
    resp = requests.patch(url, headers=headers, json=patch, timeout=REQUEST_TIMEOUT_S)
    if resp.status_code in [200, 204]:
        if "element" in patch:
            renamed += 1
        if "content" in patch:
            content_stripped += 1
    else:
        print(f"   ✗ Failed updating id={row_id} ({old_element}): {resp.status_code}")

print(f"   ✓ Renamed elements: {renamed}")
print(f"   ✓ Stripped content prefixes: {content_stripped}")
print(f"   → Skipped (already numbered): {skipped_already_numbered}")
print(f"   → Skipped (no content tag): {skipped_no_tag}")
if collisions:
    print(f"   ⚠ Collisions: {collisions}")

# Verify
print("\n" + "="*80)
print("VERIFICATION")
print("="*80)
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&select=element&order=element.asc"
response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
tier3_elements = [r['element'] for r in response.json()]

print(f"\nTotal Tier 3 elements: {len(tier3_elements)}")

# Check for removed aggregates
aggregates_remaining = [a for a in aggregates if a in tier3_elements]
if aggregates_remaining:
    print(f"\n✗ Aggregates still present: {aggregates_remaining}")
else:
    print("\n✓ No aggregates remaining")

# Check for cypher_examples
if 'cypher_examples' in tier3_elements:
    print("⚠ cypher_examples present (expected to be removed for no-cypher DB state)")
else:
    print("✓ cypher_examples absent")

# Count by type (supports numeric-prefixed elements like `3.2_EntityProject`)
def _base_name(e: str) -> str:
    return e.split('_', 1)[1] if re.match(r"^\d+(?:\.\d+)?_", e or "") and '_' in e else (e or "")

base_names = [_base_name(e) for e in tier3_elements]

node_schemas = [e for e in tier3_elements if _base_name(e).startswith('Entity') or _base_name(e).startswith('Sector')]
relationships = [e for e in tier3_elements if _is_relationship_element_name(_base_name(e))]
business_chains = [e for e in tier3_elements if _base_name(e).startswith('business_chain_')]
chart_types = [e for e in tier3_elements if _base_name(e).startswith('chart_type_')]
other = [e for e in tier3_elements if e not in node_schemas + relationships + business_chains + chart_types]

print(f"\nBreakdown:")
print(f"  Node schemas: {len(node_schemas)}")
print(f"  Relationships: {len(relationships)}")
print(f"  Business chains: {len(business_chains)}")
print(f"  Chart types: {len(chart_types)}")
print(f"  Other: {len(other)} - {other}")

print("\n✅ Tier 3 fixes complete!")
