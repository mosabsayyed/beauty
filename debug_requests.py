import os
import requests
import logging
import http.client as http_client

# Enable verbose logging
http_client.HTTPConnection.debuglevel = 1
logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True

from dotenv import load_dotenv
load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
rest_url = f"{url}/rest/v1/temp_quarterly_dashboard_data"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Accept-Encoding": "gzip, deflate"
}

print(f"Requesting {rest_url}...")
try:
    # Set verify=False temporary to check SSL
    resp = requests.get(rest_url, headers=headers, params={"select": "*", "limit": "1"}, timeout=10, verify=False)
    print(f"Status: {resp.status_code}")
    print(f"Data: {resp.text[:100]}")
except Exception as e:
    print(f"Error: {e}")
