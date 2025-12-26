import urllib.request
import os
import ssl
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
rest_url = f"{url}/rest/v1/temp_quarterly_dashboard_data?select=*&limit=1"

print(f"Requesting {rest_url}...")
req = urllib.request.Request(rest_url)
req.add_header("apikey", key)
req.add_header("Authorization", f"Bearer {key}")

try:
    # Use unverified context to match verify=False
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context, timeout=10) as response:
        print(f"Status: {response.status}")
        print(f"Data: {response.read()[:100]}")
except Exception as e:
    print(f"Error: {e}")
