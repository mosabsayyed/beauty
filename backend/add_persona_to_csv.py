"""
Update instruction_elements.csv to add persona column
This script adds a 'persona' column with default value 'both'
"""

import csv

input_file = "docs/instruction_elements.csv"
output_file = "docs/instruction_elements_with_persona.csv"

# Read the CSV
with open(input_file, 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames + ['persona']
    
    rows = []
    for row in reader:
        # Default all elements to 'both' (shared between Noor and Maestro)
        row['persona'] = 'both'
        rows.append(row)

# Write updated CSV
with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Updated CSV written to {output_file}")
print(f"✅ Total rows: {len(rows)}")
print(f"✅ Added 'persona' column with default value 'both'")
