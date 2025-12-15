import asyncio
import os
import json
import psycopg2
from supabase import create_client, Client

# --- Configuration ---
# We use the direct connection string for schema ops to avoid PostgREST caching issues
DATABASE_URL = os.getenv("DATABASE_URL") 
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL env var required for schema migration.")
    exit(1)

# --- 1. Atomic Elements (The Content) ---
TIER_1_ELEMENTS = [
    {
        "tag": "identity_noor",
        "content": """## IDENTITY
You are Noor, the Cognitive Digital Twin of a KSA Government Agency.
Expertise: Graph Databases, Sectoral Economics, Organizational Transformation.
Objective: Classify user intent and route execution through the defined cognitive loop.
Core Principle: Grounded in factual data, eager to help, and vested in the success of the agency. Professional, concise, and focused on delivering actionable insights."""
    },
    {
        "tag": "loop_step_0_remember",
        "content": """### STEP 0: REMEMBER (Hierarchical Memory)
**Trigger:** Execute immediately upon receiving a query.
**Action:** Call `recall_memory(scope, query_summary)`.
**Access Rules (Crucial):**
- **Personal Scope:** User-specific context. (Read/Write allowed).
- **Departmental Scope:** Team knowledge. (Read-Only).
- **Global Scope:** Agency-wide strategy. (Read-Only).
- **Secrets/C-Suite:** **FORBIDDEN**. Do not attempt access.
**Fallback Logic:** If Departmental search yields no results, automatically search Global."""
    },
    {
        "tag": "loop_step_1_classify",
        "content": """### STEP 1: CLASSIFY (Intent & Routing)
**Action:** Analyze {User Query} + {Step 0 Context}. Classify into ONE mode.
**Decision:**
- **IF Data Mode (A, B, C, D):** Proceed to **STEP 2** (Load Instructions via `retrieve_instructions`). Continue to **STEP 3** (Execute Data Retrieval via `read_neo4j_cypher`). Continue to **STEP 4** (Synthesize & Diagnose).
- **IF Conversational Modes (E, F, G, H, I, J):** Execute **Quick Exit**. Respond immediately using internal knowledge. Skip Steps 2, 3, 4."""
    },
    {
        "tag": "loop_step_2_recollect",
        "content": """### STEP 2: RECOLLECT (Strategy Loading)
**Action:** Call `retrieve_instructions(mode)` to load Tier 2/3 rules.
**Purpose:** Fetch the specific schema, business chains, and constraints for the active Mode."""
    },
    {
        "tag": "loop_step_3_recall",
        "content": """### STEP 3: RECALL (Graph Execution)
**Action:** Translate intent into Cypher and call `read_neo4j_cypher`.
**Constraints:**
- **Keyset Pagination:** Use `WHERE id > $last_id LIMIT 30`. NO `SKIP`/`OFFSET`.
- **Level Integrity:** Traversal must occur at the SAME level (L3->L3).
- **Efficiency:** Return `id`, `name` only. No Embeddings."""
    },
    {
        "tag": "loop_step_4_reconcile",
        "content": """### STEP 4: RECONCILE (Synthesis & Diagnosis)
**Action:** Synthesize findings.
**Gap Diagnosis:** If data is missing, apply "Absence is Signal":
- **Direct Missing:** Link expected but not found.
- **Temporal Gap:** Data exists for one period but not the target period.
- **Chain Break:** Traversal failed mid-path."""
    },
    {
        "tag": "loop_step_5_return",
        "content": """### STEP 5: RETURN (Final Output)
**Action:** Format result from Step 4 (or Quick Exit) into the mandatory JSON Schema.
**Persistence:** Do NOT call a save tool. Persistence is handled asynchronously by the platform.
**Visualizations:** Use only Closed Set types (column, line, pie, radar, scatter, bubble, combo, table, html)."""
    },
    {
        "tag": "interaction_modes_v4",
        "content": """## INTERACTION MODES
[Data]
A: Simple Query
B: Complex Analysis
C: Continuation
D: Planning

[Conversational]
E: Clarification
F: Exploratory
G: Identity
H: Education
I: Social
J: Unknown"""
    },
    {
        "tag": "response_schema_v4",
        "content": """## RESPONSE SCHEMA
{
  "mode": "Char",
  "memory_process": { "intent": "String", "thought_trace": "String" },
  "answer": "String (Markdown)",
  "analysis": ["String"],
  "data": { "query_results": [], "summary_stats": {} },
  "visualizations": [],
  "confidence": Float
}"""
    }
]

# --- 2. The Recipe (Bundle) ---
TIER_1_BUNDLE = {
    "tag": "tier1_bootstrap",
    "content": json.dumps([
        "identity_noor",
        "loop_step_0_remember",
        "loop_step_1_classify",
        "loop_step_2_recollect",
        "loop_step_3_recall",
        "loop_step_4_reconcile",
        "loop_step_5_return",
        "interaction_modes_v4",
        "response_schema_v4"
    ]),
    "version": "4.0.0",
    "status": "active",
    "category": "bootstrap"
}

def apply_schema_migrations():
    """Creates tables and constraints using raw SQL via psycopg2."""
    print("🔧 Applying Schema Migrations...")
    
    commands = [
        """
        CREATE TABLE IF NOT EXISTS instruction_elements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tag TEXT NOT NULL,
            content TEXT NOT NULL,
            tier INTEGER DEFAULT 3,
            status TEXT DEFAULT 'active',
            version TEXT DEFAULT '1.0.0',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS instruction_bundles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tag TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            version TEXT DEFAULT '1.0.0',
            category TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        # Add Unique Constraints if they don't exist
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instruction_elements_tag_key') THEN
                ALTER TABLE instruction_elements ADD CONSTRAINT instruction_elements_tag_key UNIQUE (tag);
            END IF;
        END
        $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instruction_bundles_tag_key') THEN
                ALTER TABLE instruction_bundles ADD CONSTRAINT instruction_bundles_tag_key UNIQUE (tag);
            END IF;
        END
        $$;
        """
    ]

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for cmd in commands:
            cur.execute(cmd)
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Schema Migrations Applied Successfully.")
    except Exception as e:
        print(f"❌ Schema Migration Failed: {e}")
        exit(1)

def migrate_data():
    """Populates the data using psycopg2 to avoid Supabase client cache issues during initial setup."""
    print("🚀 Starting Data Migration...")
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # 1. Upsert Elements
        print("📦 Upserting Atomic Elements...")
        upsert_element_sql = """
            INSERT INTO instruction_elements (tag, content, tier, status, version, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (tag) 
            DO UPDATE SET 
                content = EXCLUDED.content,
                tier = EXCLUDED.tier,
                status = EXCLUDED.status,
                version = EXCLUDED.version,
                updated_at = NOW();
        """
        
        for elem in TIER_1_ELEMENTS:
            cur.execute(upsert_element_sql, (
                elem["tag"], 
                elem["content"], 
                1, 
                "active", 
                "4.0.0"
            ))
            print(f"   ✅ Saved Element: {elem['tag']}")

        # 2. Upsert Bundle
        print("📦 Upserting Tier 1 Bundle...")
        upsert_bundle_sql = """
            INSERT INTO instruction_bundles (tag, content, status, version, category, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (tag)
            DO UPDATE SET
                content = EXCLUDED.content,
                status = EXCLUDED.status,
                version = EXCLUDED.version,
                category = EXCLUDED.category,
                updated_at = NOW();
        """
        
        cur.execute(upsert_bundle_sql, (
            TIER_1_BUNDLE["tag"],
            TIER_1_BUNDLE["content"],
            TIER_1_BUNDLE["status"],
            TIER_1_BUNDLE["version"],
            TIER_1_BUNDLE["category"]
        ))
        print(f"   ✅ Saved Bundle: {TIER_1_BUNDLE['tag']}")

        conn.commit()
        print("🎉 Migration Complete.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Data Migration Failed: {e}")
        exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    apply_schema_migrations()
    migrate_data()
