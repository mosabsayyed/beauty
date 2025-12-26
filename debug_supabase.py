import asyncio
import os
import sys
from supabase import create_client

# Load env vars manually since we are running standalone
from dotenv import load_dotenv
load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Key: {key[:10]}...")

async def test():
    print("Creating client...")
    client = create_client(url, key)
    print("Client created.")
    
    print("Running query...")
    # Run in thread to mimic key behavior, or just run directly (it is sync)
    # response = client.table("users").select("count", count="exact", head=True).execute()
    # Try a simple select
    response = client.table("temp_quarterly_dashboard_data").select("*").limit(1).execute()
    print(f"Response: {response}")

if __name__ == "__main__":
    try:
        asyncio.run(test())
    except Exception as e:
        print(f"Error: {e}")
