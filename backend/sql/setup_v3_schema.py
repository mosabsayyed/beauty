#!/usr/bin/env python3
"""
Noor Cognitive Digital Twin v3.0 - Database Setup Script
Applies the instruction_bundles schema to Supabase

Usage:
    python setup_v3_schema.py
"""
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value.strip('"').strip("'")


def get_supabase_client():
    """Create Supabase client with service role key"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    return create_client(url, key)


def execute_sql_via_rpc(client, sql: str) -> dict:
    """Execute SQL via Supabase RPC function"""
    try:
        # Try using the execute_sql RPC if it exists
        result = client.rpc('execute_sql', {'query_text': sql}).execute()
        return {'success': True, 'data': result.data}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def setup_instruction_bundles_schema(client):
    """Set up the instruction bundles tables using Supabase REST API"""
    
    logger.info("🚀 Setting up Noor v3.0 Instruction Bundles Schema...")
    
    # Since Supabase REST API doesn't support raw SQL for DDL,
    # we need to use the Supabase Dashboard SQL editor or pg_graphql
    # However, we can verify the tables exist and insert initial data
    
    # First, let's try to read from the tables to see if they exist
    tables_to_check = ['instruction_bundles', 'instruction_metadata', 'usage_tracking']
    existing_tables = []
    
    for table in tables_to_check:
        try:
            # Try to select from table (will fail if doesn't exist)
            result = client.table(table).select('*').limit(1).execute()
            existing_tables.append(table)
            logger.info(f"✅ Table '{table}' exists")
        except Exception as e:
            logger.warning(f"⚠️  Table '{table}' does not exist: {e}")
    
    if len(existing_tables) < 3:
        logger.error("""
❌ Some tables are missing. Please run the following SQL in Supabase Dashboard SQL Editor:

1. Go to: https://supabase.com/dashboard/project/ojlfhkrobyqmifqbgcyw/sql/new
2. Paste the contents of: backend/sql/v3_instruction_bundles_schema.sql
3. Click 'Run'
4. Re-run this script to verify and insert initial data
        """)
        return False
    
    logger.info("✅ All required tables exist!")
    return True


def insert_core_bundles(client):
    """Insert the core instruction bundles required for the system"""
    
    bundles = [
        {
            'tag': 'cognitive_cont',
            'path_name': 'Cognitive Control Core',
            'content': '''<INSTRUCTION_BUNDLE tag="cognitive_cont" version="1.0.0">
    <PURPOSE>Core cognitive control loop definitions and mode classification rules.</PURPOSE>
    <MODES>
        <MODE id="A" name="Simple Query" description="Direct fact lookup from graph" quick_exit="false"/>
        <MODE id="B1" name="Complex Analysis" description="Multi-hop reasoning with synthesis" quick_exit="false"/>
        <MODE id="B2" name="Gap Diagnosis" description="Identify missing relationships or capabilities" quick_exit="false"/>
        <MODE id="C" name="Exploratory" description="Hypothetical scenarios, no data required" quick_exit="false"/>
        <MODE id="D" name="Acquaintance" description="Questions about Noor capabilities" quick_exit="true"/>
        <MODE id="E" name="Learning" description="Concept explanations" quick_exit="false"/>
        <MODE id="F" name="Social" description="Greetings and small talk" quick_exit="true"/>
        <MODE id="G" name="Report Generation" description="Structured multi-section output" quick_exit="false"/>
        <MODE id="H" name="Clarification" description="Ambiguous query requires clarification" quick_exit="true"/>
    </MODES>
</INSTRUCTION_BUNDLE>''',
            'category': 'core',
            'avg_tokens': 800,
            'version': '1.0.0',
            'status': 'active'
        },
        {
            'tag': 'module_memory_management_noor',
            'path_name': 'Memory Management Module',
            'content': '''<INSTRUCTION_BUNDLE tag="module_memory_management_noor" version="1.0.0">
    <PURPOSE>Defines the mandatory Step 0 access protocol and Hierarchical Memory R/W constraints.</PURPOSE>
    <RULES type="MemoryAccessControl">
        <RULE name="NoorWriteConstraint">
            The agent MUST execute the save_memory tool ONLY with scope='personal'. Writing to 'departmental', 'global', or 'csuite' is forbidden.
        </RULE>
        <RULE name="NoorReadConstraint">
            The agent MUST NOT attempt to access the 'csuite' memory tier. Read access to 'departmental' and 'global' is permitted via recall_memory.
        </RULE>
        <RULE name="RetrievalMethod">
            Retrieval MUST be performed using semantic similarity search via the recall_memory tool.
        </RULE>
    </RULES>
    <LOGIC type="PathDependentTriggers">
        <TRIGGER mode="G">Mode G (Continuation) requires MANDATORY memory recall.</TRIGGER>
        <TRIGGER mode="B1, B2">Analytical Modes require MANDATORY Hierarchical memory recall.</TRIGGER>
        <TRIGGER mode="A">Mode A (Simple Query) requires OPTIONAL recall for personal preferences.</TRIGGER>
    </LOGIC>
</INSTRUCTION_BUNDLE>''',
            'category': 'core',
            'avg_tokens': 600,
            'version': '1.0.0',
            'status': 'active'
        },
        {
            'tag': 'strategy_gap_diagnosis',
            'path_name': 'Gap Diagnosis Strategy',
            'content': '''<INSTRUCTION_BUNDLE tag="strategy_gap_diagnosis" version="1.0.0">
    <PURPOSE>Mandatory synthesis protocol for Mode B2 queries (Gap Diagnosis).</PURPOSE>
    <PROTOCOL name="ReconcileStepSeparation">
        The synthesis phase (Step 4: RECONCILE) MUST be executed entirely separate from data retrieval (Step 3: RECALL).
    </PROTOCOL>
    <PRINCIPLE name="AbsenceIsSignal">
        The failure of a Cypher traversal to yield expected relationships MUST be interpreted as a diagnosable institutional gap, NOT a simple query failure.
    </PRINCIPLE>
    <GAP_CLASSIFICATION>
        <TYPE tag="DirectRelationshipMissing" severity="critical">Relationship failure between adjacent entities in a mandated Business Chain.</TYPE>
        <TYPE tag="IndirectChainBroken" severity="high">A multi-hop path fails due to an intermediate missing entity.</TYPE>
        <TYPE tag="TemporalGap" severity="medium">Data exists for year X but is missing for year Y.</TYPE>
        <TYPE tag="LevelMismatch" severity="critical">An illegal cross-hierarchy link violation detected.</TYPE>
    </GAP_CLASSIFICATION>
    <CONSTRAINT name="VisualizationConstraint">
        The output MUST NOT contain the type "network_graph". Render as table with columns: Source, Relationship, Target.
    </CONSTRAINT>
</INSTRUCTION_BUNDLE>''',
            'category': 'strategy',
            'avg_tokens': 700,
            'version': '1.0.0',
            'status': 'active'
        },
        {
            'tag': 'module_business_language',
            'path_name': 'Business Language Translation',
            'content': '''<INSTRUCTION_BUNDLE tag="module_business_language" version="1.0.0">
    <PURPOSE>Enforce Business Language Translation during Step 4: RECONCILE and Step 5: RETURN.</PURPOSE>
    <GLOSSARY direction="TechnicalToBusiness">
        <TERM technical="L3 level" business="Function"/>
        <TERM technical="L2 level" business="Project"/>
        <TERM technical="L1 level" business="Objective"/>
        <TERM technical="Node" business="Entity"/>
        <TERM technical="Cypher query" business="database search"/>
        <TERM technical="n.id" business="unique identifier"/>
        <TERM technical="-[:ADDRESSES_GAP]-" business="closes the gap in"/>
        <TERM technical="SKIP" business="brute force pagination (FORBIDDEN)"/>
        <TERM technical="OFFSET" business="brute force pagination (FORBIDDEN)"/>
    </GLOSSARY>
    <RULE name="OutputVerification">
        After final synthesis, review the "answer" field. It MUST NOT contain technical terms such as 'Cypher', 'L3', 'Node', 'SKIP', or 'OFFSET'. Replace them with the corresponding business term.
    </RULE>
</INSTRUCTION_BUNDLE>''',
            'category': 'core',
            'avg_tokens': 500,
            'version': '1.0.0',
            'status': 'active'
        },
        {
            'tag': 'tool_rules_core',
            'path_name': 'Tool Rules Core',
            'content': '''<INSTRUCTION_BUNDLE tag="tool_rules_core" version="1.0.0">
    <PURPOSE>Defines constraints for MCP tool execution during Step 3: RECALL.</PURPOSE>
    <TOOL name="read_neo4j_cypher">
        <CONSTRAINT name="KeysetPagination">
            MUST use keyset pagination: WHERE n.id > $last_seen_id ORDER BY n.id LIMIT 30.
            MUST NOT use SKIP or OFFSET.
        </CONSTRAINT>
        <CONSTRAINT name="LevelIntegrity">
            All nodes in a traversal path MUST have matching level properties.
            L3 to L3, L2 to L2. Never mix L2 with L3.
        </CONSTRAINT>
        <CONSTRAINT name="Efficiency">
            Return only id and name properties. MUST NOT return embedding vectors.
        </CONSTRAINT>
        <CONSTRAINT name="AggregationFirst">
            Use COUNT(n) for totals, COLLECT(n)[0..30] for samples in a single query.
        </CONSTRAINT>
    </TOOL>
    <TOOL name="recall_memory">
        <CONSTRAINT name="ScopeValidation">
            Noor MUST NOT access scope='csuite'. Allowed: personal, departmental, global.
        </CONSTRAINT>
        <CONSTRAINT name="FallbackLogic">
            If departmental scope returns empty, automatically try global scope.
        </CONSTRAINT>
    </TOOL>
    <TOOL name="save_memory">
        <CONSTRAINT name="WriteRestriction">
            Noor can ONLY write to scope='personal'. All other scopes are forbidden.
        </CONSTRAINT>
    </TOOL>
</INSTRUCTION_BUNDLE>''',
            'category': 'core',
            'avg_tokens': 600,
            'version': '1.0.0',
            'status': 'active'
        }
    ]
    
    metadata = [
        {
            'tag': 'cognitive_cont',
            'trigger_modes': ['A', 'B1', 'B2', 'C', 'D', 'E', 'F', 'G', 'H'],
            'compatible_with': ['knowledge_context', 'tool_rules_core']
        },
        {
            'tag': 'module_memory_management_noor',
            'trigger_modes': ['A', 'B1', 'B2', 'G'],
            'compatible_with': ['cognitive_cont', 'tool_rules_core']
        },
        {
            'tag': 'strategy_gap_diagnosis',
            'trigger_modes': ['B2'],
            'compatible_with': ['cognitive_cont', 'module_memory_management_noor', 'tool_rules_core']
        },
        {
            'tag': 'module_business_language',
            'trigger_modes': ['A', 'B1', 'B2', 'G'],
            'compatible_with': ['cognitive_cont']
        },
        {
            'tag': 'tool_rules_core',
            'trigger_modes': ['A', 'B1', 'B2', 'G'],
            'compatible_with': ['cognitive_cont', 'module_memory_management_noor']
        }
    ]
    
    logger.info("📦 Inserting core instruction bundles...")
    
    for bundle in bundles:
        try:
            # Check if bundle exists
            existing = client.table('instruction_bundles').select('tag').eq('tag', bundle['tag']).execute()
            if existing.data:
                logger.info(f"  ⏭️  Bundle '{bundle['tag']}' already exists, skipping")
                continue
            
            # Insert bundle
            result = client.table('instruction_bundles').insert(bundle).execute()
            logger.info(f"  ✅ Inserted bundle: {bundle['tag']}")
        except Exception as e:
            logger.error(f"  ❌ Failed to insert bundle '{bundle['tag']}': {e}")
    
    logger.info("📋 Inserting bundle metadata...")
    
    for meta in metadata:
        try:
            # Check if metadata exists
            existing = client.table('instruction_metadata').select('tag').eq('tag', meta['tag']).execute()
            if existing.data:
                logger.info(f"  ⏭️  Metadata '{meta['tag']}' already exists, skipping")
                continue
            
            # Insert metadata
            result = client.table('instruction_metadata').insert(meta).execute()
            logger.info(f"  ✅ Inserted metadata: {meta['tag']}")
        except Exception as e:
            logger.error(f"  ❌ Failed to insert metadata '{meta['tag']}': {e}")


def verify_setup(client):
    """Verify the setup is complete"""
    logger.info("\n🔍 Verifying setup...")
    
    # Check bundle count
    bundles = client.table('instruction_bundles').select('tag, status, version').execute()
    logger.info(f"📦 Bundles: {len(bundles.data)} found")
    for b in bundles.data:
        logger.info(f"   - {b['tag']} (v{b['version']}, {b['status']})")
    
    # Check metadata count
    metadata = client.table('instruction_metadata').select('tag, trigger_modes').execute()
    logger.info(f"📋 Metadata: {len(metadata.data)} found")
    
    # Verify FK relationship
    for m in metadata.data:
        bundle_exists = any(b['tag'] == m['tag'] for b in bundles.data)
        status = "✅" if bundle_exists else "❌"
        logger.info(f"   - {m['tag']} -> modes {m['trigger_modes']} {status}")
    
    return len(bundles.data) >= 5 and len(metadata.data) >= 5


def main():
    load_env()
    
    logger.info("=" * 60)
    logger.info("Noor Cognitive Digital Twin v3.0 - Database Setup")
    logger.info("=" * 60)
    
    try:
        client = get_supabase_client()
        logger.info("✅ Connected to Supabase")
        
        # Check if tables exist
        tables_exist = setup_instruction_bundles_schema(client)
        
        if tables_exist:
            # Insert core bundles
            insert_core_bundles(client)
            
            # Verify
            if verify_setup(client):
                logger.info("\n" + "=" * 60)
                logger.info("✅ Phase 1 PostgreSQL setup COMPLETE!")
                logger.info("=" * 60)
                return 0
            else:
                logger.error("❌ Verification failed - some data is missing")
                return 1
        else:
            logger.error("❌ Tables don't exist - run SQL migration first")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
