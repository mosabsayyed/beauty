import os
import re
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

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

REQUEST_TIMEOUT_S = int(os.getenv("SUPABASE_HTTP_TIMEOUT_S", "30"))

# Read SQL file
sql_path = Path(__file__).resolve().parent / "TIER2_ATOMIC_ELEMENTS.sql"
with sql_path.open("r", encoding="utf-8") as f:
    sql_content = f.read()

# Delete existing tier2
print("Deleting existing tier2 elements...")
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier2"
response = requests.delete(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
if response.status_code in [200, 204]:
    print(f"Deleted existing tier2 elements\n")
else:
    print(f"Delete response: {response.status_code}")

# Parse inserts
insert_pattern = r"\('tier2',\s*'([^']+)',\s*'((?:[^']|'')*)',\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*'([^']+)'\)"
matches = re.findall(insert_pattern, sql_content, re.DOTALL)
print(f"Found {len(matches)} tier2 elements to insert\n")

for match in matches:
    element, content, description, avg_tokens, version, status = match
    content = content.replace("''", "'")
    
    data = {
        'bundle': 'tier2',
        'element': element,
        'content': content,
        'description': description,
        'avg_tokens': int(avg_tokens),
        'version': version,
        'status': status
    }
    
    url = f"{SUPABASE_URL}/rest/v1/instruction_elements"
    response = requests.post(url, headers=headers, json=data, timeout=REQUEST_TIMEOUT_S)
    if response.status_code in [200, 201]:
        print(f"✓ {element} ({avg_tokens} tokens)")
    else:
        print(f"✗ {element} - Error: {response.status_code}")

# Verify
print("\n--- VERIFICATION ---")
url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier2&select=element,avg_tokens,description&order=element.asc"
response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_S)
rows = response.json()
total = sum(row['avg_tokens'] for row in rows)
print(f"Total: {len(rows)} elements, {total} tokens\n")
for row in rows:
    print(f"  - {row['element']}: {row['avg_tokens']} tokens - {row['description']}")

print("\n✅ Tier 2 applied successfully!")
