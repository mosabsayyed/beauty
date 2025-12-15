#!/usr/bin/env python3
"""
Insert all 5 missing instruction bundles into Supabase instruction_bundles table.
Run this script when network connectivity is restored.

Usage:
    cd /home/mosab/projects/chatmodule/backend
    source .venv/bin/activate
    python bundles_pending_insertion/insert_all_bundles.py
"""

import os
from pathlib import Path
from supabase import create_client

# Supabase credentials
SUPABASE_URL = 'https://ygbiyauauwvgibgxbxmd.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYml5YXVhdXd2Z2liZ3hieG1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjA2NjU0NywiZXhwIjoyMDQxNjQyNTQ3fQ.WqXN6RuhycvIMdXS0AZwlNcb_DFJvV5UL-09_n3cAD8'

# Bundle definitions (tag, filename, version, category)
BUNDLES = [
    ('knowledge_context', '01_knowledge_context.xml', '1.0.0', 'foundation'),
    ('cypher_query_patterns', '02_cypher_query_patterns.xml', '1.0.0', 'foundation'),
    ('visualization_config', '03_visualization_config.xml', '1.0.0', 'foundation'),
    ('mode_specific_strategies', '04_mode_specific_strategies.xml', '1.0.0', 'logic'),
    ('temporal_vantage_logic', '05_temporal_vantage_logic.xml', '1.0.0', 'logic'),
]

def insert_bundles():
    """Read bundle XML files and insert into Supabase."""
    
    # Initialize Supabase client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Get current script directory
    script_dir = Path(__file__).parent
    
    # Process each bundle
    success_count = 0
    fail_count = 0
    
    for tag, filename, version, category in BUNDLES:
        filepath = script_dir / filename
        
        try:
            # Read bundle content
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Insert into Supabase
            result = supabase.table('instruction_bundles').insert({
                'tag': tag,
                'content': content,
                'version': version,
                'status': 'active',
                'category': category
            }).execute()
            
            print(f"✅ Bundle {success_count + 1}/5: {tag} inserted successfully")
            print(f"   File: {filename}")
            print(f"   Size: {len(content)} characters")
            print(f"   Category: {category}")
            print()
            
            success_count += 1
            
        except FileNotFoundError:
            print(f"❌ File not found: {filepath}")
            fail_count += 1
        except Exception as e:
            print(f"❌ Failed to insert {tag}: {e}")
            fail_count += 1
    
    # Summary
    print("=" * 60)
    print(f"SUMMARY: {success_count} succeeded, {fail_count} failed")
    print("=" * 60)
    
    if success_count == 5:
        print("\n🎉 All 5 bundles successfully inserted into Supabase!")
        print("\nNext steps:")
        print("1. Create Maestro router config (port 8202)")
        print("2. Create Embeddings router config (port 8203)")
        print("3. Create embeddings server")
        print("4. Modify sb.sh to start all 3 routers")
    else:
        print(f"\n⚠️ {fail_count} bundle(s) failed. Please review errors above.")

if __name__ == '__main__':
    insert_bundles()
