"""
Complete Persona-Based Tier 1 Migration Script

This script:
1. Adds persona column to instruction_elements table
2. Creates view and function for persona-based queries
3. Updates existing data with persona='both'
4. Provides verification queries

Prerequisites:
- SUPABASE_URL and SUPABASE_SERVICE_KEY must be set
"""

import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


def execute_sql(client: Client, sql: str, description: str):
    """Execute SQL and report status"""
    try:
        print(f"\n🔄 {description}...")
        result = client.rpc('exec_sql', {'query': sql}).execute()
        print(f"✅ {description} - SUCCESS")
        return result
    except Exception as e:
        print(f"❌ {description} - FAILED: {str(e)}")
        raise


def main():
    print("=" * 70)
    print("PERSONA-BASED TIER 1 MIGRATION")
    print("=" * 70)
    
    client = get_supabase_client()
    
    # Step 1: Add persona column
    sql_add_column = """
    ALTER TABLE instruction_elements 
    ADD COLUMN IF NOT EXISTS persona VARCHAR(20) DEFAULT 'both';
    """
    execute_sql(client, sql_add_column, "Adding persona column")
    
    # Step 2: Create index
    sql_index = """
    CREATE INDEX IF NOT EXISTS idx_instruction_elements_persona 
    ON instruction_elements(bundle, persona, status) 
    WHERE status = 'active';
    """
    execute_sql(client, sql_index, "Creating persona index")
    
    # Step 3: Update existing tier1 elements
    sql_update = """
    UPDATE instruction_elements 
    SET persona = 'both' 
    WHERE bundle = 'tier1' AND (persona IS NULL OR persona = '');
    """
    execute_sql(client, sql_update, "Updating existing Tier 1 elements to 'both'")
    
    # Step 4: Create view
    sql_view = """
    CREATE OR REPLACE VIEW v_tier1_assembly AS
    SELECT 
        id,
        bundle,
        element,
        content,
        description,
        avg_tokens,
        persona,
        version,
        created_at,
        updated_at
    FROM instruction_elements
    WHERE bundle = 'tier1' 
      AND status = 'active'
    ORDER BY element ASC;
    """
    execute_sql(client, sql_view, "Creating v_tier1_assembly view")
    
    # Step 5: Create function
    sql_function = """
    CREATE OR REPLACE FUNCTION get_tier1_for_persona(p_persona VARCHAR)
    RETURNS TABLE (
        element VARCHAR,
        content TEXT,
        avg_tokens INTEGER
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            ie.element,
            ie.content,
            ie.avg_tokens
        FROM instruction_elements ie
        WHERE ie.bundle = 'tier1' 
          AND ie.status = 'active'
          AND (ie.persona = p_persona OR ie.persona = 'both')
        ORDER BY ie.element ASC;
    END;
    $$ LANGUAGE plpgsql;
    """
    execute_sql(client, sql_function, "Creating get_tier1_for_persona function")
    
    # Step 6: Verify
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)
    
    # Count tier1 elements by persona
    response = client.table("instruction_elements")\
        .select("persona", count="exact")\
        .eq("bundle", "tier1")\
        .eq("status", "active")\
        .execute()
    
    print(f"\n📊 Tier 1 elements status:")
    print(f"   Total active Tier 1 elements: {response.count}")
    
    # Test function for both personas
    for persona in ["noor", "maestro"]:
        result = client.rpc("get_tier1_for_persona", {"p_persona": persona}).execute()
        element_count = len(result.data) if result.data else 0
        total_tokens = sum(elem.get("avg_tokens", 0) for elem in result.data) if result.data else 0
        print(f"\n   {persona.capitalize()}:")
        print(f"     - Elements: {element_count}")
        print(f"     - Total tokens: {total_tokens}")
    
    print("\n" + "=" * 70)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Test orchestrator with both personas")
    print("2. Verify Noor (staff) gets correct elements")
    print("3. Verify Maestro (exec) gets correct elements")
    print("4. Add persona-specific elements as needed")


if __name__ == "__main__":
    main()
