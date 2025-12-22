#!/usr/bin/env python3
import os
import psycopg2

# Get database connection string
DATABASE_URL = os.getenv('SUPABASE_CONN') or os.getenv('DATABASE_URL')

print(f"Connecting to Supabase database...")

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    print("Creating dashboard_decisions table...")
    # NOTE: Adapted from JOSOOR V1.3 Appendix C
    # Changed owner_id from UUID to INTEGER to match existing users table schema (SERIAL PRIMARY KEY)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_decisions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, approved, rejected
            priority TEXT DEFAULT 'medium', -- high, medium, low
            owner_id INTEGER REFERENCES users(id), 
            linked_project_name TEXT,
            due_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    print("Seeding dashboard_decisions...")
    cur.execute("""
        INSERT INTO dashboard_decisions (title, status, priority, linked_project_name, due_date)
        VALUES 
        ('Approve Cloud Vendor Contract', 'pending', 'high', 'Digital ID Program', NOW() + INTERVAL '2 days'),
        ('Authorize Q4 Budget Variance', 'pending', 'medium', 'Data Platform', NOW() + INTERVAL '5 days');
    """)

    conn.commit()
    print("✅ dashboard_decisions table created and seeded!")

except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    cur.close()
    conn.close()
