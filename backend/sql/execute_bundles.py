#!/usr/bin/env python3
"""Execute v3_atomic_bundles.sql against Supabase PostgreSQL"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

def main():
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_key:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return 1
    
    print(f"Connecting to Supabase: {supabase_url[:30]}...")
    client = create_client(supabase_url, service_key)
    
    # Read SQL file
    sql_file = Path(__file__).parent / 'v3_atomic_bundles.sql'
    print(f"Reading SQL file: {sql_file}")
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print(f"SQL file loaded: {len(sql_content)} characters")
    
    # Execute via Supabase RPC (we'll use the REST API for raw SQL)
    print("\n✅ SQL loaded successfully")
    print("📝 Note: Supabase Python client doesn't support raw SQL execution")
    print("   Use Supabase Dashboard > SQL Editor to run v3_atomic_bundles.sql")
    print(f"   Or use psql: psql $DATABASE_URL -f {sql_file}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
