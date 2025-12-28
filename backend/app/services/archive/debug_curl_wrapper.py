import subprocess
import json
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def run_curl(endpoint, params=None):
    full_url = f"{url}/rest/v1/{endpoint}"
    
    # Build query string
    query_parts = []
    if params:
        for k, v in params.items():
            query_parts.append(f"{k}={v}")
    
    if query_parts:
        full_url += "?" + "&".join(query_parts)
    
    cmd = [
        "curl", "-sS",
        "-H", f"apikey: {key}",
        "-H", f"Authorization: Bearer {key}",
        full_url
    ]
    
    print(f"Running: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Curl failed: {result.stderr}")
        
    return json.loads(result.stdout)

print("Testing curl wrapper...")
try:
    data = run_curl("temp_quarterly_dashboard_data", {"select": "*", "limit": "1"})
    print("Success!")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
