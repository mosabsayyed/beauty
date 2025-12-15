import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
# Don't print full key
print(f"Key available: {bool(key)}")

try:
    client = create_client(url, key)
    print("Client created successfully")
except Exception as e:
    print(f"Error creating client: {e}")
    import traceback
    traceback.print_exc()
