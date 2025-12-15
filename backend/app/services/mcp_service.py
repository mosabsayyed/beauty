"""
MCP Service Layer - Noor Cognitive Digital Twin v3.0

This service implements the 3 MCP tools for the Single-Call Architecture:
1. recall_memory       (Step 0: REMEMBER) - Semantic vector search for hierarchical memory
2. retrieve_instructions (Step 2: RECOLLECT) - Dynamic bundle loading from PostgreSQL
3. read_neo4j_cypher   (Step 3: RECALL) - Constrained Cypher execution

CRITICAL: Noor NEVER writes to memory. Conversations become memories via nightly batch job.

CONSTRAINT ENFORCEMENT:
- Noor Agent: READ-ONLY for Personal/Departmental/Ministry; secrets/admin scopes are forbidden
- SKIP/OFFSET prohibited (Keyset Pagination mandatory)
- Level Integrity enforced (no L2<->L3 mixing)
- Embedding properties cannot be retrieved via read_neo4j_cypher

Reference: [END_STATE_TECHNICAL_DESIGN] Implementation Roadmap v3.0
Reference: docs/NOOR_V3_IMPLEMENTATION_BIBLE.md
"""

import json
import re
import logging
from typing import Literal, List, Dict, Any, Optional
try:
    from neo4j import GraphDatabase, AccessMode
except ImportError:
    from neo4j import GraphDatabase
    class AccessMode:
        READ = None

from app.config import settings
from app.db.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)


# =============================================================================
# EMBEDDING GENERATION (Placeholder - uses configured embedding model)
# =============================================================================

async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding vector for semantic search.
    Uses OpenAI text-embedding-3-small (1536 dimensions).
    
    In production, this connects to the embedding service.
    """
    try:
        # Import here to avoid circular dependencies
        from app.services.embedding_service import EmbeddingService
        embedding_service = EmbeddingService()
        embedding = await embedding_service.generate_embedding_async(text)
        if embedding is None:
            raise ValueError("Embedding generation returned None")
        return embedding
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        # Return zero vector on failure (will result in low similarity scores)
        return [0.0] * 1536


# =============================================================================
# TOOL 1: recall_memory (Step 0: REMEMBER)
# =============================================================================

async def recall_memory(
    scope: Literal['personal', 'departmental', 'ministry'],
    query_summary: str,
    limit: int = 5,
    user_id: Optional[str] = None,
) -> str:
    """
    Retrieves relevant hierarchical memory using semantic search.
    Enforces Noor's R/O constraints.
    
    STEP 0 CONSTRAINTS:
    - Noor is FORBIDDEN from accessing 'secrets' or 'csuite' scopes
    - Must use semantic vector search via Neo4j memory_semantic_index
    - NO FALLBACK: Exact scope must be honored (no downgrade to other scopes)
    
    Args:
        scope: Memory tier to search ('personal', 'departmental', 'ministry')
        query_summary: Text to convert to embedding for semantic search
        limit: Maximum results to return (default 5)
        
    Returns:
        JSON string of memory snippets with key, content, confidence, score
        
    Raises:
        PermissionError: If a forbidden scope is attempted
    """
    # STEP 0 CONSTRAINT: Scope Validation (Noor Agent Read Constraint)
    forbidden_scopes = {'secrets', 'csuite'}
    if scope in forbidden_scopes:
        logger.warning("Noor attempted forbidden scope '%s' - BLOCKED", scope)
        raise PermissionError("Noor agent is forbidden from accessing secret/admin memory tiers.")

    allowed_scopes = {'personal', 'departmental', 'ministry'}
    if scope not in allowed_scopes:
        raise ValueError(f"Invalid scope '{scope}'. Allowed: {sorted(allowed_scopes)}")
    
    if scope == 'personal' and not user_id:
        raise ValueError("user_id is required for personal scope recall to enforce per-user isolation")

    query_embedding = await generate_embedding(query_summary)
    
    # Strict scope enforcement (no fallback)
    results = await _execute_vector_query(scope, query_embedding, limit, user_id=user_id)
    if results:
        logger.info(f"recall_memory: Found {len(results)} results in '{scope}' scope")
        return json.dumps(results)
    
    # No results in requested scope - return empty
    logger.warning(f"recall_memory: No results in scope '{scope}'")
    return "[]"


async def _execute_vector_query(
    scope: str,
    query_embedding: List[float],
    limit: int,
    user_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Execute semantic vector search against Neo4j memory index.
    
    Uses the mandatory vector index 'memory_semantic_index'.
    """
    try:
        if not neo4j_client.is_connected():
            if not neo4j_client.connect():
                logger.error("Neo4j not available for memory retrieval")
                return []
        
        # Cypher for Semantic Retrieval (Mandatory for Step 0)
        cypher = """
        CALL db.index.vector.queryNodes('memory_semantic_index', $limit, $query_embedding)
        YIELD node AS m, score
        WHERE m.scope = $scope AND ($user_id IS NULL OR m.user_id = $user_id)
        RETURN m.id AS id, m.user_id AS user_id, m.content AS content, m.key AS key, m.confidence AS confidence, score
        ORDER BY score DESC
        LIMIT $limit
        """
        
        with neo4j_client.driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(
                cypher,
                parameters={
                    "scope": scope,
                    "query_embedding": query_embedding,
                    "limit": limit,
                    "user_id": user_id,
                }
            )
            return [dict(record) for record in result]
            
    except Exception as e:
        logger.error(f"Vector query failed for scope '{scope}': {e}")
        return []


# =============================================================================
# TOOL 2: retrieve_instructions (Step 2: RECOLLECT) - v3.3 Three-Tier Support
# =============================================================================

async def retrieve_instructions(
    mode: str,
    tier: Optional[str] = None,
    elements: Optional[List[str]] = None
) -> str:
    """
    Dynamically loads instructions from PostgreSQL based on v3.3 three-tier architecture.
    
    THREE-TIER ARCHITECTURE (v3.3):
    - Tier 1: Bootstrap (always loaded via orchestrator, ~600 tokens)
    - Tier 2: Data Mode Definitions (loaded for modes A/B/C/D, ~4,500 tokens)
    - Tier 3: Atomic Elements (loaded on-demand, ~150-400 tokens each)
    
    USAGE PATTERNS:
    1. Legacy (v3.2): retrieve_instructions(mode="A")
       - Returns concatenated bundles for mode via instruction_metadata mapping
       
    2. Tier 2 (v3.3): retrieve_instructions(mode="A", tier="data_mode_definitions")
       - Returns data mode definitions bundle for modes A/B/C/D
       
    3. Tier 3 (v3.3): retrieve_instructions(mode="A", tier="elements", elements=["EntityProject", "optimized_retrieval"])
       - Returns only the requested atomic elements from instruction_elements table
    
    Args:
        mode: Interaction mode (A, B, C, D, E, F, G, H, I, J)
        tier: Optional tier selector ("data_mode_definitions" or "elements")
        elements: Optional list of element names to retrieve (only for tier="elements")
        
    Returns:
        Concatenated string of instruction content
        
    Raises:
        ValueError: If no instructions found or invalid parameters
    """
    try:
        from supabase import create_client
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        # =====================================================================
        # v3.3 TIER 3: Atomic Element Retrieval
        # =====================================================================
        if tier == "elements" and elements:
            logger.info(f"retrieve_instructions: Tier 3 - Fetching {len(elements)} elements for mode '{mode}'")

            def _base_element_name(name: str) -> str:
                """Return the legacy/base element name.

                Supports:
                - legacy: EntityProject
                - prior numbering: 3.2_EntityProject
                - caller-step Tier 3 naming: x.y_3_EntityProject (Step.SubStep + Tier)
                """
                if not name:
                    return ""
                # Strip Step.SubStep_Tier prefix first (e.g., 2.0_3_)
                name = re.sub(r"^\d+(?:\.\d+)*_\d+_", "", name, count=1)
                # Strip Step.SubStep prefix (e.g., 3.2_)
                name = re.sub(r"^\d+(?:\.\d+)*_", "", name, count=1)
                return name

            # Fetch active Tier 3 elements once, then resolve requested names by:
            # - exact element match (supports new numbered names)
            # - base-name match (supports legacy unprefixed names like `EntityProject`)
            tier3_response = supabase.table('instruction_elements') \
                .select('element, content, avg_tokens') \
                .eq('bundle', 'tier3') \
                .eq('status', 'active') \
                .execute()

            if not tier3_response.data:
                logger.warning("No Tier 3 elements found (bundle=tier3, status=active)")
                return ""

            requested = [e for e in elements if e]
            requested_set = set(requested)
            requested_base_set = { _base_element_name(e) for e in requested_set }

            resolved = []
            resolved_names = set()
            for elem in tier3_response.data:
                name = elem.get('element', '')
                base = _base_element_name(name)
                if name in requested_set or base in requested_base_set:
                    resolved.append(elem)
                    resolved_names.add(name)

            if not resolved:
                logger.warning(f"No elements found for: {elements}")
                return ""
            
            # Concatenate element content
            contents = []
            total_tokens = 0
            found_elements = set()
            found_bases = set()
            for elem in resolved:
                contents.append(f"<element name=\"{elem['element']}\">\n{elem['content']}\n</element>")
                total_tokens += elem.get('avg_tokens', 0)
                found_elements.add(elem['element'])
                found_bases.add(_base_element_name(elem['element']))
            
            # Log missing elements for debugging
            missing = set(
                e for e in requested_set
                if (e not in found_elements) and (_base_element_name(e) not in found_bases)
            )
            if missing:
                logger.warning(f"Elements not found: {missing}")
            
            logger.info(f"retrieve_instructions: Loaded {len(contents)} elements (~{total_tokens} tokens)")
            return "\n\n".join(contents)
        
        # =====================================================================
        # v3.3 TIER 2: Data Mode Definitions
        # =====================================================================
        if tier == "data_mode_definitions":
            logger.info(f"retrieve_instructions: Tier 2 - Loading data mode definitions for mode '{mode}'")
            
            # Data mode definitions are stored in instruction_bundles with tag 'data_mode_definitions'
            # or the original 'cognitive_cont' bundle which contains the 5-step loop
            bundle_response = supabase.table('instruction_bundles') \
                .select('content, avg_tokens') \
                .eq('tag', 'data_mode_definitions') \
                .eq('status', 'active') \
                .single() \
                .execute()
            
            if bundle_response.data:
                logger.info(f"retrieve_instructions: Loaded Tier 2 (~{bundle_response.data.get('avg_tokens', 0)} tokens)")
                return bundle_response.data['content']
            
            # Fallback to cognitive_cont if data_mode_definitions doesn't exist
            logger.info("Tier 2 bundle not found, falling back to cognitive_cont")
            return await _get_bundle_content('cognitive_cont')
        
        # =====================================================================
        # LEGACY v3.2: Mode-based Bundle Retrieval (instruction_metadata mapping)
        # =====================================================================
        logger.info(f"retrieve_instructions: Legacy mode - Loading bundles for mode '{mode}'")
        
        # Query instruction_metadata to find bundles for this mode
        metadata_response = supabase.table('instruction_metadata') \
            .select('tag') \
            .contains('trigger_modes', [mode]) \
            .execute()
        
        if not metadata_response.data:
            logger.warning(f"No instruction bundles mapped for mode '{mode}'")
            return await _get_bundle_content('cognitive_cont')
        
        # Get all required bundle tags
        bundle_tags = [row['tag'] for row in metadata_response.data]
        logger.info(f"retrieve_instructions: Mode '{mode}' requires bundles: {bundle_tags}")
        
        # Fetch active bundle content
        bundles_response = supabase.table('instruction_bundles') \
            .select('tag, content, avg_tokens') \
            .in_('tag', bundle_tags) \
            .eq('status', 'active') \
            .execute()
        
        if not bundles_response.data:
            raise ValueError(f"No active bundles found for tags: {bundle_tags}")
        
        # Concatenate bundle content
        contents = []
        total_tokens = 0
        for bundle in bundles_response.data:
            contents.append(bundle['content'])
            total_tokens += bundle.get('avg_tokens', 0)
        
        logger.info(f"retrieve_instructions: Loaded {len(contents)} bundles (~{total_tokens} tokens)")
        return "\n\n".join(contents)
        
    except Exception as e:
        logger.error(f"retrieve_instructions failed: {e}")
        raise ValueError(f"Failed to retrieve instructions for mode '{mode}': {e}")


async def _get_bundle_content(tag: str) -> str:
    """Get content for a specific bundle tag."""
    try:
        from supabase import create_client
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        response = supabase.table('instruction_bundles') \
            .select('content') \
            .eq('tag', tag) \
            .eq('status', 'active') \
            .single() \
            .execute()
        
        if response.data:
            return response.data['content']
        return ""
        
    except Exception as e:
        logger.error(f"Failed to get bundle '{tag}': {e}")
        return ""


# =============================================================================
# TOOL 3: read_neo4j_cypher (Step 3: RECALL)
# =============================================================================

def read_neo4j_cypher(cypher_query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes validated Cypher query, enforcing constraints and preventing traps.
    
    STEP 3 CONSTRAINTS (6 Trap Prevention Rules):
    1. NO SKIP/OFFSET - Must use Keyset Pagination
    2. NO LEVEL MIXING - L2<->L3 traversals are forbidden
    3. NO EMBEDDING RETRIEVAL - Cannot return embedding properties
    4. READ-ONLY - Only executes in read mode
    5. EFFICIENCY - Should return only id and name properties
    6. AGGREGATION FIRST - Use count() or collect() for sampling
    
    Args:
        cypher_query: The Cypher query to execute
        parameters: Optional query parameters
        
    Returns:
        List of result records as dictionaries
        
    Raises:
        ValueError: If query violates any constraint
    """
    # =======================================================================
    # TRAP PREVENTION 1 & 2: Database Anti-Patterns (Keyset Pagination)
    # =======================================================================
    query_upper = cypher_query.upper()
    
    if "SKIP" in query_upper or "OFFSET" in query_upper:
        logger.error(f"CONSTRAINT VIOLATION: SKIP/OFFSET detected in query")
        raise ValueError(
            "MCP Constraint Violation: SKIP and OFFSET are prohibited. "
            "Must use Keyset Pagination (WHERE n.id > $last_seen_id ORDER BY n.id LIMIT 30)."
        )
    
    # =======================================================================
    # TRAP PREVENTION 3: Hierarchy Violation (Level Integrity Enforcement)
    # =======================================================================
    # Check for L2-L3 mixing in the query
    has_l2 = re.search(r'level\s*[=:]\s*[\'"]?L2[\'"]?', cypher_query, re.IGNORECASE)
    has_l3 = re.search(r'level\s*[=:]\s*[\'"]?L3[\'"]?', cypher_query, re.IGNORECASE)
    
    if has_l2 and has_l3:
        # Check if they're in the same node filter or different nodes
        # This is a simplified check - a full parser would be more accurate
        logger.error(f"CONSTRAINT VIOLATION: Level mixing (L2 and L3) detected in query")
        raise ValueError(
            "MCP Constraint Violation: Level Integrity (Same-Level Rule) failed. "
            "Traversal paths must connect nodes at the SAME level. "
            "L2 and L3 nodes cannot be mixed in the same query path."
        )
    
    # =======================================================================
    # TRAP PREVENTION 4: Efficiency (Reject Embeddings retrieval)
    # =======================================================================
    # Check if query attempts to return embedding properties
    embedding_patterns = [
        r'\bembedding\b',
        r'\bembed\b',
        r'\.embedding\b',
        r'RETURN.*embedding',
    ]
    
    for pattern in embedding_patterns:
        if re.search(pattern, cypher_query, re.IGNORECASE):
            logger.error(f"CONSTRAINT VIOLATION: Embedding retrieval detected in query")
            raise ValueError(
                "MCP Constraint Violation: Embedding properties cannot be returned. "
                "Use the recall_memory tool for semantic search instead."
            )
    
    # =======================================================================
    # EXECUTE QUERY (Read-Only Transaction)
    # =======================================================================
    try:
        if not neo4j_client.is_connected():
            if not neo4j_client.connect():
                raise ConnectionError("Neo4j database is not available")
        
        with neo4j_client.driver.session(
            database=settings.NEO4J_DATABASE,
            default_access_mode=AccessMode.READ
        ) as session:
            result = session.run(cypher_query, parameters or {})
            # Return structured data - constraint enforcement means this should be id/name only
            records = [dict(record) for record in result]
            
            logger.info(f"read_neo4j_cypher: Executed query, returned {len(records)} records")
            return records
            
    except Exception as e:
        logger.error(f"Cypher execution failed: {e}")
        logger.error(f"Query: {cypher_query}")
        logger.error(f"Parameters: {parameters}")
        raise


# =============================================================================
# NOTE: save_memory REMOVED - Noor NEVER writes to memory
# Memory persistence happens via nightly batch job (see docs/NOOR_V3_IMPLEMENTATION_BIBLE.md)
# =============================================================================


# =============================================================================
# HELPER: Mode to Bundle Tag Mapping
# =============================================================================

def lookup_tags_by_mode(mode: str) -> List[str]:
    """
    Returns the bundle tags required for a given interaction mode.
    This is a synchronous fallback for when database lookup is not needed.
    
    V3 Atomic Bundle Mapping (Noor Cognitive Digital Twin):
    =========================================================
    Each mode loads a COMPOSITION of atomic bundles. Bundles are:
    - cognitive_loop_core: Master 4-step cognitive loop (mandatory for analytical modes)
    - node_*: Entity schemas (node_ent_projects, node_ent_capabilities, etc.)
    - rel_*: Relationship patterns (rel_monitored_by, rel_operates, etc.)
    - chain_*: Business traversal chains (chain_sector_ops, chain_strategy_to_tactics_*, etc.)
    - cypher_*: Cypher patterns (cypher_optimized_retrieval, cypher_keyset_pagination, etc.)
    - constraint_*: Query constraints (constraint_efficiency, constraint_keyset_pagination, etc.)
    - mode_*: Mode-specific behaviors (mode_quick_exit, mode_clarification, etc.)
    
    Mode -> Atomic Bundle Composition:
    - A (Simple Query): cognitive_loop_core + node basics + constraint_efficiency
    - B1 (Complex Analysis): cognitive_loop_core + full node/rel schema + chains + cypher patterns + constraints
    - B2 (Gap Diagnosis): cognitive_loop_core + mode_gap_diagnosis + chain_strategy_to_tactics_* + cypher_impact_analysis
    - C (Exploratory): cognitive_loop_core (minimal)
    - D (Acquaintance): mode_quick_exit only
    - E (Learning): cognitive_loop_core + mode_report_structure
    - F (Social): mode_quick_exit only
    - G (Continuation): cognitive_loop_core + full schema (continuation of analytical work)
    - H (Underspecified): mode_clarification only
    """
    mode_mapping = {
        'A': [
            'cognitive_loop_core', 'data_integrity_rules', 'tool_rules_comprehensive',
            'node_ent_projects', 'node_sec_objectives', 
            'constraint_efficiency', 'constraint_keyset_pagination', 'constraint_temporal_filtering'
        ],
        'B1': [
            'cognitive_loop_core', 'data_integrity_rules', 'tool_rules_comprehensive', 'vector_strategy_full',
            'node_ent_projects', 'node_ent_capabilities', 'node_ent_risks', 'node_sec_objectives',
            'node_ent_org_units', 'node_ent_it_systems', 'node_ent_processes',
            'rel_monitored_by', 'rel_operates', 'rel_close_gaps', 'rel_parent_of', 'rel_requires', 'rel_utilizes',
            'direct_relationships_full',
            'chain_sector_ops', 'chain_strategy_to_tactics_priority', 'chain_tactical_to_strategy',
            'cypher_optimized_retrieval', 'cypher_impact_analysis', 'cypher_keyset_pagination',
            'constraint_efficiency', 'constraint_keyset_pagination', 'constraint_level_integrity', 'constraint_temporal_filtering'
        ],
        'B2': [
            'cognitive_loop_core', 'mode_gap_diagnosis', 'data_integrity_rules', 'tool_rules_comprehensive',
            'node_ent_projects', 'node_ent_capabilities', 'node_ent_risks', 'node_sec_objectives', 'node_sec_performance',
            'rel_monitored_by', 'rel_operates', 'rel_close_gaps', 'rel_parent_of',
            'direct_relationships_full',
            'chain_strategy_to_tactics_priority', 'chain_strategy_to_tactics_targets',
            'chain_risk_build_mode', 'chain_risk_operate_mode',
            'cypher_impact_analysis', 'cypher_portfolio_health',
            'constraint_efficiency', 'constraint_level_integrity', 'constraint_keyset_pagination', 'constraint_temporal_filtering'
        ],
        'C': ['cognitive_loop_core'],
        'D': ['mode_quick_exit'],
        'E': ['cognitive_loop_core', 'node_ent_capabilities', 'node_ent_projects', 'node_sec_objectives'],
        'F': ['mode_quick_exit'],
        'G': [
            'cognitive_loop_core', 'mode_report_structure', 'data_integrity_rules', 'tool_rules_comprehensive',
            'node_ent_projects', 'node_ent_capabilities', 'node_ent_risks', 'node_sec_objectives',
            'rel_monitored_by', 'rel_operates', 'rel_close_gaps',
            'direct_relationships_full',
            'chain_sector_ops', 'chain_tactical_to_strategy',
            'cypher_optimized_retrieval', 'cypher_keyset_pagination',
            'constraint_efficiency', 'constraint_keyset_pagination', 'constraint_temporal_filtering'
        ],
        'H': ['mode_clarification'],
    }
    
    return mode_mapping.get(mode.upper(), ['cognitive_loop_core'])


# =============================================================================
# HELPER: Check if mode requires memory recall
# =============================================================================

def check_mode_requires_memory(mode: str) -> bool:
    """
    Determine if the interaction mode requires Step 0 memory recall.
    
    Based on module_memory_management_noor:
    - MANDATORY: G (Continuation), B1, B2 (Analytical)
    - OPTIONAL: A (Simple Query)
    - SKIP: C, D, E, F, H (Conversational/Quick Exit)
    """
    mandatory_modes = {'G', 'B1', 'B2'}
    optional_modes = {'A'}
    
    mode_upper = mode.upper()
    
    if mode_upper in mandatory_modes:
        return True
    elif mode_upper in optional_modes:
        # Optional - could implement preference-based check
        return False
    else:
        # Conversational modes skip memory
        return False


# =============================================================================
# MCP TOOL DEFINITIONS (For LLM Tool Use)
# =============================================================================

MCP_TOOL_DEFINITIONS = [
    {
        "name": "recall_memory",
        "description": "Retrieves relevant hierarchical memory using semantic search. Use this for Step 0: REMEMBER. Noor has READ-ONLY access to personal, departmental, and ministry scopes. Secrets/admin scopes are forbidden.",
        "parameters": {
            "type": "object",
            "properties": {
                "scope": {
                    "type": "string",
                    "enum": ["personal", "departmental", "ministry"],
                    "description": "Memory tier to search. Noor cannot access admin/secret tiers."
                },
                "query_summary": {
                    "type": "string",
                    "description": "Natural language description of what to remember, used for semantic search."
                },
                "limit": {
                    "type": "integer",
                    "default": 5,
                    "description": "Maximum number of memory snippets to retrieve."
                }
            },
            "required": ["scope", "query_summary"]
        }
    },
    {
        "name": "retrieve_instructions",
        "description": "Dynamically loads Task-Specific Instruction Bundles from PostgreSQL for the current interaction mode. Use this for Step 2: RECOLLECT.",
        "parameters": {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "enum": ["A", "B1", "B2", "C", "D", "E", "F", "G", "H"],
                    "description": "The interaction mode determined in Step 1: REQUIREMENTS."
                }
            },
            "required": ["mode"]
        }
    },
    {
        "name": "read_neo4j_cypher",
        "description": "Executes Cypher queries against the Neo4j Digital Twin. Use this for Step 3: RECALL. CONSTRAINTS: No SKIP/OFFSET (use keyset pagination), no level mixing (L2<->L3), no embedding retrieval.",
        "parameters": {
            "type": "object",
            "properties": {
                "cypher_query": {
                    "type": "string",
                    "description": "Valid Cypher query. Must use keyset pagination, same-level traversal, and not return embeddings."
                },
                "parameters": {
                    "type": "object",
                    "description": "Query parameters (year, level, last_seen_id, etc.)"
                }
            },
            "required": ["cypher_query"]
        }
    }
    # NOTE: save_memory REMOVED - Noor NEVER writes to memory
    # Memory persistence happens via nightly batch job
]


# =============================================================================
# LOGGING: Structured completion logging for observability
# =============================================================================

async def log_completion(
    session_id: str,
    mode: str,
    tokens_in: int,
    confidence: float,
    bundles_used: List[str],
    agent_id: str = 'Noor'
) -> None:
    """
    Logs necessary fields for token economics and integrity tracking.
    
    Key Observability Metrics:
    - Token Optimization: Alert if avg tokens > 7,500
    - Memory System: Track memory_recall_hit_rate per tier
    - Quality: Monitor Average Probabilistic Confidence
    """
    import datetime
    
    log_data = {
        'timestamp': datetime.datetime.now().isoformat(),
        'session_id': session_id,
        'agent_id': agent_id,
        'intent_mode': mode,
        'bundles_loaded': bundles_used,
        'tokens_input': tokens_in,
        'confidence_score': confidence,
        'success': True
    }
    
    logger.info(f"Query completed: {json.dumps(log_data)}")
    
    # Optional: Insert into usage_tracking table
    try:
        from supabase import create_client
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        supabase.table('usage_tracking').insert({
            'session_id': session_id,
            'user_id': 'system',  # Would be extracted via JWT in production
            'agent_id': agent_id,
            'mode': mode,
            'tokens_input': tokens_in,
            'confidence_score': confidence,
            'bundles_loaded': bundles_used
        }).execute()
        
    except Exception as e:
        logger.warning(f"Failed to log to usage_tracking: {e}")
