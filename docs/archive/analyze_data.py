import requests
import json

try:
    response = requests.get('http://localhost:8008/api/v1/dashboard/dashboard-data')
    data = response.json()
    
    print(f"Total rows: {len(data)}")
    
    has_interesting_projections = False
    for row in data:
        proj = row.get('projections', {})
        # Check if it has keys other than q1, q2, q3, q4
        keys = set(proj.keys())
        if not keys.issubset({'q1', 'q2', 'q3', 'q4'}):
            print(f"Row {row['id']} has unusual projection keys: {keys}")
            has_interesting_projections = True
        
        # Check for non-zero values
        # values might be strings or numbers
        for k, v in proj.items():
            val = float(v) if v is not None else 0
            if val != 0:
                 print(f"Row {row['id']} ({row['dimension_title']}) has non-zero projections: {proj}")
                 has_interesting_projections = True
                 break

    if not has_interesting_projections:
        print("All projections are zero/standard.")

except Exception as e:
    print(f"Error: {e}")
