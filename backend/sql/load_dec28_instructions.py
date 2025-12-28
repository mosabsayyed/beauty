import csv
import os

def migrate_csv_to_sql(csv_path, output_sql_path):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    sql_statements = [
        "-- JOSOOR MASTER INSTRUCTION LOAD - DEC 28 GROUND TRUTH",
        "DELETE FROM instruction_elements;",
        ""
    ]

    for row in rows:
        # Escape single quotes in all text fields
        bundle = row['bundle'].replace("'", "''")
        element = row['element'].replace("'", "''")
        content = row['content'].replace("'", "''")
        description = row['description'].replace("'", "''")
        version = row['version'].replace("'", "''")
        status = row['status'].replace("'", "''")
        
        # Handle dependencies (if exists)
        deps = row.get('dependencies', '')
        if deps:
            deps = deps.replace("'", "''")
        
        # Handle avg_tokens (convert to int or fallback to 0)
        try:
            tokens = int(row['avg_tokens'])
        except (ValueError, TypeError):
            tokens = 0

        sql = f"INSERT INTO instruction_elements (bundle, element, content, description, avg_tokens, version, status) VALUES ('{bundle}', '{element}', '{content}', '{description}', {tokens}, '{version}', '{status}');"
        sql_statements.append(sql)

    with open(output_sql_path, mode='w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))

    print(f"Successfully converted {len(rows)} rows to {output_sql_path}")

if __name__ == "__main__":
    csv_file = "/home/mosab/projects/chatmodule/backend/sql/instruction_elements_dec28.csv"
    output_file = "/home/mosab/projects/chatmodule/backend/sql/v3.5_LOAD_MASTER_DEC28.sql"
    migrate_csv_to_sql(csv_file, output_file)
