import requests
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
auth_url = f"{url}/auth/v1/user"
anon_key = os.environ.get("SUPABASE_ANON_KEY")

print(f"Testing connection to {auth_url}...")
try:
    # Simulate a check with a dummy token (should return 401, not hang)
    headers = {"Authorization": "Bearer dummy_token", "apikey": anon_key}
    resp = requests.get(auth_url, headers=headers, timeout=5)
    print(f"Status: {resp.status_code}")
except Exception as e:
    print(f"Error/Hang detected: {e}")
