#!/usr/bin/env python3
"""
Upload instruction_elements_updated.csv to Supabase database
This will UPDATE existing rows and INSERT new ones based on the element name
"""
import csv
import sys
import asyncio
sys.path.insert(0, 'backend')

from app.db.supabase_client import supabase_client

async def upload_csv():
    await supabase_client.connect()
    
    csv_path = 'docs/instruction_elements_updated.csv'
    
    print('=== Loading CSV ===')
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f'Found {len(rows)} rows in CSV')
    
    # Filter active rows
    active_rows = [r for r in rows if r.get('status') == 'active']
    print(f'Active rows: {len(active_rows)}')
    
    print('\n=== Uploading to database ===')
    
    updated = 0
    inserted = 0
    errors = 0
    
    for i, row in enumerate(active_rows, 1):
        element_name = row['element']
        
        try:
            # Check if element exists
            existing = await supabase_client.table_select(
                'instruction_elements',
                'id',
                filters={'element': element_name}
            )
            
            # Prepare data (handle empty array fields)
            data = {
                'bundle': row['bundle'],
                'element': row['element'],
                'content': row['content'],
                'description': row.get('description', '') or None,
                'avg_tokens': int(row['avg_tokens']) if row.get('avg_tokens') and row['avg_tokens'].strip() else None,
                'dependencies': row.get('dependencies').strip() if row.get('dependencies') and row.get('dependencies').strip() else None,
                'use_cases': row.get('use_cases').strip() if row.get('use_cases') and row.get('use_cases').strip() else None,
                'status': row['status'],
                'version': row.get('version', '3.4.0'),
            }
            
            if existing:
                # Update existing
                await supabase_client.table_update(
                    'instruction_elements',
                    data,
                    {'element': element_name}
                )
                updated += 1
                print(f'  [{i}/{len(active_rows)}] Updated: {element_name}')
            else:
                # Insert new
                await supabase_client.table_insert(
                    'instruction_elements',
                    data
                )
                inserted += 1
                print(f'  [{i}/{len(active_rows)}] Inserted: {element_name}')
        
        except Exception as e:
            errors += 1
            print(f'  [{i}/{len(active_rows)}] ERROR on {element_name}: {e}')
    
    print(f'\n=== Summary ===')
    print(f'Updated: {updated}')
    print(f'Inserted: {inserted}')
    print(f'Errors: {errors}')
    print(f'Total processed: {updated + inserted + errors}')
    
    await supabase_client.disconnect()
    print('\n✅ Upload complete!')

if __name__ == '__main__':
    asyncio.run(upload_csv())
