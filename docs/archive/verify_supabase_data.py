import asyncio
import os
import sys

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock env vars if needed or rely on dotenv loading in config
# The config module loads dotenv automatically

from app.db.supabase_client import supabase_client

async def main():
    print("Connecting to Supabase...")
    await supabase_client.connect()
    
    tables_to_check = [
        "temp_quarterly_outcomes_data",
        "temp_investment_initiatives", 
        "temp_quarterly_dashboard_data_rows" # The CSV data might be here?
    ]
    
    for table in tables_to_check:
        try:
            print(f"Checking table: {table}")
            # Try to get 1 row
            data = await supabase_client.table_select(table, limit=1)
            print(f"✅ Success! Found {len(data)} rows in {table}")
            if data:
                print(f"Sample data: {data[0]}")
        except Exception as e:
            print(f"❌ Failed to access {table}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
