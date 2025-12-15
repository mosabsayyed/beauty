"""
Noor v3.3: Element Decomposition Script

Decomposes existing instruction bundles into atomic elements with:
- Element descriptions (what it does)
- Use cases (when LLM should request it)
- Dependencies (related elements)
- Token estimates

This creates the element-level instruction storage for v3.3 architecture.
"""

import os
import sys
sys.path.insert(0, '.')

from supabase import create_client
from app.config import settings

# Element decomposition mapping
# Format: (bundle, element, description, use_cases, dependencies)
ELEMENT_DEFINITIONS = [
    # VISUALIZATION_CONFIG BUNDLE (decomposed into 6 elements)
    (
        "visualization_config",
        "chart_types",
        "Supported chart types: column, line, radar, bubble, bullet, combo, table, html",
        ["user requests visualization", "user asks for chart", "data presentation needed"],
        [],
        200
    ),
    (
        "visualization_config",
        "color_rules",
        "Color palette and semantic color rules (success=green, warning=yellow, error=red)",
        ["chart visualization", "HTML generation", "user mentions colors"],
        ["chart_types"],
        150
    ),
    (
        "visualization_config",
        "layout_constraints",
        "Chart layout rules: axis labels, legends, responsive sizing",
        ["chart visualization", "complex multi-chart layouts"],
        ["chart_types"],
        180
    ),
    (
        "visualization_config",
        "table_formatting",
        "Table structure rules: headers, sorting, grouping, summary rows",
        ["user requests table", "list-based data", "comparison views"],
        [],
        120
    ),
    (
        "visualization_config",
        "html_rendering",
        "HTML generation rules: NO templating engines, inject data directly, full rendering required",
        ["user asks for formatted output", "rich text needed", "HTML visualization"],
        [],
        200
    ),
    (
        "visualization_config",
        "data_structure_rules",
        "Output format rules: flat lists, no nested custom keys, type discrimination",
        ["any data query", "multiple node types in results"],
        [],
        100
    ),
    
    # KNOWLEDGE_CONTEXT BUNDLE (decomposed into 15 elements)
    (
        "knowledge_context",
        "EntityProject",
        "EntityProject node schema: id, name, year, level, budget, progress_percentage, status, start_date",
        ["user asks about projects", "project queries", "portfolio analysis"],
        ["level_definitions", "data_integrity_rules"],
        150
    ),
    (
        "knowledge_context",
        "EntityCapability",
        "EntityCapability node schema: id, name, year, level, maturity_level, description",
        ["user asks about capabilities", "gap analysis", "maturity assessment"],
        ["level_definitions", "data_integrity_rules"],
        130
    ),
    (
        "knowledge_context",
        "EntityRisk",
        "EntityRisk node schema: id, name, year, level, risk_score, risk_category, risk_status",
        ["user asks about risks", "risk assessment", "gap diagnosis involving risks"],
        ["level_definitions", "data_integrity_rules"],
        140
    ),
    (
        "knowledge_context",
        "EntityOrgUnit",
        "EntityOrgUnit node schema: id, name, year, level (Department/Sub-Dept/Team)",
        ["user asks about departments", "org structure queries", "team analysis"],
        ["level_definitions", "data_integrity_rules"],
        100
    ),
    (
        "knowledge_context",
        "EntityITSystem",
        "EntityITSystem node schema: id, name, year, level (Platform/Module/Feature)",
        ["user asks about IT systems", "technology queries", "automation analysis"],
        ["level_definitions", "data_integrity_rules"],
        110
    ),
    (
        "knowledge_context",
        "EntityProcess",
        "EntityProcess node schema: id, name, year, level, efficiency_score",
        ["user asks about processes", "efficiency queries", "workflow analysis"],
        ["level_definitions", "data_integrity_rules"],
        100
    ),
    (
        "knowledge_context",
        "SectorObjective",
        "SectorObjective node schema: id, name, year, level, budget_allocated, priority_level, status",
        ["user asks about objectives", "strategic goals", "KPI queries"],
        ["level_definitions", "data_integrity_rules"],
        140
    ),
    (
        "knowledge_context",
        "level_definitions",
        "Level hierarchy (L1/L2/L3) definitions for all node types: Portfolio→Program→Project, Domain→Function→Competency, etc.",
        ["any multi-level query", "hierarchy navigation", "rollup analysis"],
        [],
        250
    ),
    (
        "knowledge_context",
        "direct_relationships",
        "Direct same-level relationships: CLOSES_GAPS, OPERATES, MONITORED_BY, CONTRIBUTES_TO, etc.",
        ["user asks about connections", "relationship queries", "impact analysis"],
        [],
        400
    ),
    (
        "knowledge_context",
        "business_chains",
        "7 business chains (indirect paths): SectorOps, Strategy_to_Tactics, Tactical_to_Strategy, Risk modes",
        ["complex multi-hop queries", "indirect relationship discovery", "chain analysis"],
        ["direct_relationships"],
        450
    ),
    (
        "knowledge_context",
        "data_integrity_rules",
        "Universal properties (id, name, year, level), composite keys (id+year), level alignment, temporal filtering",
        ["any Neo4j query", "ALWAYS required for Cypher generation"],
        [],
        300
    ),
    (
        "knowledge_context",
        "property_rules",
        "Property constraints: risk_score (1-10), progress_percentage (0-100), budget (numeric), level (L1/L2/L3)",
        ["queries with filters", "aggregations", "comparisons"],
        ["data_integrity_rules"],
        100
    ),
    (
        "knowledge_context",
        "traversal_paths",
        "Common traversal patterns: Project→Capability, Project→Risk, Capability→Objective",
        ["multi-hop queries", "path finding", "relationship traversal"],
        ["direct_relationships"],
        180
    ),
    (
        "knowledge_context",
        "vector_strategy",
        "Vector search templates: Template A (Concept Search), Template B (Similarity/Inference)",
        ["semantic search needed", "user asks 'similar to'", "inference queries"],
        [],
        300
    ),
    (
        "knowledge_context",
        "risk_dependency_rules",
        "Risks tied to Capabilities via MONITORED_BY, Project→Risk traversal pattern",
        ["risk queries", "risk-project connections", "risk analysis"],
        ["direct_relationships", "EntityRisk", "EntityCapability"],
        120
    ),
    
    # CYPHER_QUERY_PATTERNS BUNDLE (decomposed into 8 elements)
    (
        "cypher_query_patterns",
        "basic_match_pattern",
        "Basic MATCH patterns: single node, node with properties, multiple nodes",
        ["simple queries", "single entity lookup", "basic filtering"],
        ["data_integrity_rules"],
        150
    ),
    (
        "cypher_query_patterns",
        "relationship_pattern",
        "Relationship MATCH patterns: direction, type, properties, multi-hop",
        ["relationship queries", "connected entities", "path finding"],
        ["direct_relationships"],
        200
    ),
    (
        "cypher_query_patterns",
        "temporal_filter_pattern",
        "Temporal filtering: year filter, start_date exclusion, vantage point logic",
        ["ANY query (always required)", "time-based filtering", "active vs planned"],
        ["data_integrity_rules"],
        180
    ),
    (
        "cypher_query_patterns",
        "aggregation_pattern",
        "Aggregations: COUNT, SUM, AVG, MIN, MAX with GROUP BY",
        ["user asks 'how many'", "totals", "averages", "statistics"],
        [],
        150
    ),
    (
        "cypher_query_patterns",
        "pagination_pattern",
        "Keyset pagination (SKIP/OFFSET prohibited): ORDER BY + LIMIT, cursor-based",
        ["large result sets", "listing queries", "data sampling"],
        [],
        120
    ),
    (
        "cypher_query_patterns",
        "optional_match_pattern",
        "OPTIONAL MATCH for enrichment: optional relationships, null handling",
        ["data enrichment", "incomplete relationships", "early-stage projects"],
        ["relationship_pattern"],
        130
    ),
    (
        "cypher_query_patterns",
        "alternative_relationship_syntax",
        "Alternative relationships: :REL1|REL2|REL3 (single colon, pipe-separated)",
        ["multiple relationship types", "flexible traversal"],
        ["relationship_pattern"],
        80
    ),
    (
        "cypher_query_patterns",
        "level_integrity_pattern",
        "Level filtering: WHERE n.level='L3' AND m.level='L3' (same level required)",
        ["functional relationships", "cross-node queries", "ALWAYS for Entity-Entity connections"],
        ["data_integrity_rules", "level_definitions"],
        140
    ),
    
    # TOOL_RULES_CORE BUNDLE (decomposed into 3 elements)
    (
        "tool_rules_core",
        "recall_memory_rules",
        "recall_memory tool: personal/project memory, limit=5 default, semantic search, read-only",
        ["user references past conversation", "context needed", "memory-dependent query"],
        [],
        120
    ),
    (
        "tool_rules_core",
        "retrieve_elements_rules",
        "retrieve_elements tool: load specific instruction elements by name, dynamic composition",
        ["need additional instructions", "schema lookup", "pattern reference"],
        [],
        100
    ),
    (
        "tool_rules_core",
        "read_neo4j_cypher_rules",
        "read_neo4j_cypher tool: execute Cypher, 30-item limit, pagination required, no SKIP/OFFSET",
        ["data query needed", "Neo4j access", "graph traversal"],
        [],
        180
    ),
    
    # MODE_SPECIFIC_STRATEGIES BUNDLE (decomposed into 8 elements)
    (
        "mode_specific_strategies",
        "mode_A_simple_query",
        "Mode A: Simple fact lookup, direct queries, single-hop patterns",
        ["user asks specific fact", "list request", "simple lookup"],
        ["basic_match_pattern", "temporal_filter_pattern"],
        80
    ),
    (
        "mode_specific_strategies",
        "mode_B_complex_analysis",
        "Mode B: Multi-hop reasoning, impact analysis, gap diagnosis, strategic queries",
        ["complex question", "analysis needed", "'impact of'", "'gaps in'"],
        ["business_chains", "strategy_gap_diagnosis", "aggregation_pattern"],
        120
    ),
    (
        "mode_specific_strategies",
        "mode_C_exploratory",
        "Mode C: Brainstorming, hypothetical scenarios, no data needed",
        ["'what if'", "hypothetical", "brainstorm", "explore ideas"],
        [],
        60
    ),
    (
        "mode_specific_strategies",
        "mode_D_acquaintance",
        "Mode D: Questions about Noor's role, capabilities, functions (Quick Exit Path)",
        ["'who are you'", "'what can you do'", "meta questions"],
        [],
        50
    ),
    (
        "mode_specific_strategies",
        "mode_F_social",
        "Mode F: Greetings, emotional support, thanks (Quick Exit Path)",
        ["'hello'", "'thank you'", "'goodbye'", "emotional expressions"],
        [],
        40
    ),
    (
        "mode_specific_strategies",
        "mode_G_continuation",
        "Mode G: Follow-up requiring new data, continuation of previous context",
        ["'show me more'", "'what about'", "follow-up with new query"],
        [],
        70
    ),
    (
        "mode_specific_strategies",
        "mode_H_underspecified",
        "Mode H: Ambiguous parameters, clarification needed",
        ["vague query", "missing context", "unclear intent"],
        [],
        60
    ),
    (
        "mode_specific_strategies",
        "quick_exit_path",
        "Quick Exit Path: Fast-path for Mode D/F, skip data retrieval, immediate response",
        ["greetings", "meta questions", "no data needed"],
        [],
        50
    ),
    
    # TEMPORAL_VANTAGE_LOGIC BUNDLE (single element - already atomic)
    (
        "temporal_vantage_logic",
        "vantage_point_logic",
        "Temporal vantage point: future start_date = planned (0% progress), past start_date = active/closed, datetoday comparison",
        ["project status queries", "'is delayed'", "active vs planned", "progress assessment"],
        ["temporal_filter_pattern"],
        300
    ),
    
    # STRATEGY_GAP_DIAGNOSIS BUNDLE (decomposed into 5 elements)
    (
        "strategy_gap_diagnosis",
        "gap_types",
        "4 gap types: RelationshipGap (missing edge), AttributeGap (low value), AbsenceGap (missing node), AlignmentGap (mismatch)",
        ["gap analysis", "'what's missing'", "diagnosis", "problem identification"],
        [],
        200
    ),
    (
        "strategy_gap_diagnosis",
        "absence_is_signal",
        "AbsenceIsSignal: Missing relationships indicate gaps (e.g., Project without CLOSES_GAPS)",
        ["gap diagnosis", "missing connections", "incomplete data"],
        ["gap_types", "direct_relationships"],
        120
    ),
    (
        "strategy_gap_diagnosis",
        "gap_detection_cypher",
        "Cypher patterns for gap detection: NOT EXISTS, OPTIONAL MATCH with NULL checks, count comparisons",
        ["gap queries", "missing data detection", "validation"],
        ["optional_match_pattern"],
        150
    ),
    (
        "strategy_gap_diagnosis",
        "gap_prioritization",
        "Gap severity rules: High-priority gaps (strategic objectives, high-budget projects), impact scoring",
        ["gap analysis with priority", "risk assessment", "decision support"],
        ["gap_types"],
        100
    ),
    (
        "strategy_gap_diagnosis",
        "gap_recommendation_framework",
        "Gap recommendations: actionable suggestions, business language, user-centric framing",
        ["gap analysis output", "recommendations needed", "action items"],
        ["gap_types"],
        80
    ),
    
    # MODULE_BUSINESS_LANGUAGE BUNDLE (single element - already atomic)
    (
        "module_business_language",
        "business_language_rules",
        "Translation rules: Never use 'Node', 'Cypher', 'L3', 'ID', 'Query' in public answers. Use Entity, Query, Output Level, Identifier",
        ["ALWAYS (for all user-facing text)", "answer generation", "response formatting"],
        [],
        150
    ),
    
    # MODULE_MEMORY_MANAGEMENT_NOOR BUNDLE (single element - already atomic)
    (
        "module_memory_management_noor",
        "memory_access_rules",
        "Memory access: READ-ONLY, personal/departmental/global accessible, C-suite restricted, nightly batch job creates memories",
        ["memory queries", "recall_memory usage", "conversation history"],
        ["recall_memory_rules"],
        180
    ),
]

def decompose_bundles():
    """Decompose bundles into atomic elements."""
    # Initialize Supabase client directly
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    try:
        # Fetch existing bundle content
        response = supabase.table('instruction_bundles').select('tag, content').eq('status', 'active').execute()
        bundles = {row['tag']: row['content'] for row in response.data}
        
        print("=" * 80)
        print("Noor v3.3: Bundle → Element Decomposition")
        print("=" * 80)
        print(f"\nFound {len(bundles)} active bundles")
        print(f"Decomposing into {len(ELEMENT_DEFINITIONS)} atomic elements\n")
        
        # Extract element content from bundles
        elements_to_insert = []
        
        for bundle, element, description, use_cases, dependencies, avg_tokens in ELEMENT_DEFINITIONS:
            if bundle not in bundles:
                print(f"⚠️  Bundle '{bundle}' not found - skipping element '{element}'")
                continue
            
            bundle_content = bundles[bundle]
            
            # Extract element content using XML-like tags
            element_tag = f"<{element}>"
            element_end_tag = f"</{element}>"
            
            # Try exact tag match first
            if element_tag in bundle_content:
                start_idx = bundle_content.find(element_tag)
                end_idx = bundle_content.find(element_end_tag, start_idx)
                if end_idx != -1:
                    element_content = bundle_content[start_idx:end_idx + len(element_end_tag)]
                else:
                    element_content = f"{element_tag}\n[Content extracted from {bundle} bundle]\n{element_end_tag}"
            else:
                # For elements without explicit tags, create wrapper
                element_content = f"{element_tag}\n[Content from {bundle} bundle - to be refined]\n{element_end_tag}"
            
            elements_to_insert.append((
                bundle,
                element,
                element_content,
                description,
                avg_tokens,
                dependencies,
                use_cases,
                'active',
                '1.0.0'
            ))
            
            print(f"✓ {bundle:30} → {element:35} ({avg_tokens:4} tokens)")
        
        # Insert elements using Supabase
        for element_data in elements_to_insert:
            bundle, element, content, description, avg_tokens, dependencies, use_cases, status, version = element_data
            
            supabase.table('instruction_elements').upsert({
                'bundle': bundle,
                'element': element,
                'content': content,
                'description': description,
                'avg_tokens': avg_tokens,
                'dependencies': dependencies,
                'use_cases': use_cases,
                'status': status,
                'version': version
            }, on_conflict='bundle,element,version').execute()
        
        print(f"\n✅ Successfully decomposed {len(elements_to_insert)} elements")
        print("=" * 80)
        
        # Summary statistics
        response = supabase.table('instruction_elements') \
            .select('bundle', count='exact') \
            .eq('status', 'active') \
            .execute()
        
        # Group by bundle manually
        bundle_stats = {}
        all_elements = supabase.table('instruction_elements').select('bundle, avg_tokens').eq('status', 'active').execute()
        
        for row in all_elements.data:
            bundle = row['bundle']
            tokens = row['avg_tokens'] or 0
            if bundle not in bundle_stats:
                bundle_stats[bundle] = {'count': 0, 'tokens': 0}
            bundle_stats[bundle]['count'] += 1
            bundle_stats[bundle]['tokens'] += tokens
        
        print("\nElement Distribution by Bundle:")
        print("-" * 80)
        total_elements = 0
        total_tokens = 0
        
        for bundle in sorted(bundle_stats.keys()):
            count = bundle_stats[bundle]['count']
            tokens = bundle_stats[bundle]['tokens']
            print(f"  {bundle:35} {count:3} elements  ~{tokens:5} tokens")
            total_elements += count
            total_tokens += tokens
        
        print("-" * 80)
        print(f"  {'TOTAL':35} {total_elements:3} elements  ~{total_tokens:5} tokens")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    decompose_bundles()
