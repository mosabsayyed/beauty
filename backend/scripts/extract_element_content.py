#!/usr/bin/env python3
"""
Extract remaining instruction_elements content from instruction_bundles.
Uses improved pattern matching to capture more content.
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from supabase import create_client

service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(os.getenv("SUPABASE_URL"), service_key)


# Manual mappings for elements that need special extraction logic
ELEMENT_MAPPINGS = {
    # From knowledge_context bundle
    "level_definitions": {
        "pattern": r"(?:###?\s+)?Level Definitions?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "direct_relationships": {
        "pattern": r"(?:###?\s+)?(?:Direct|Same-Level) Relationships?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "business_chains": {
        "pattern": r"(?:###?\s+)?Business Chains?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "data_integrity_rules": {
        "pattern": r"(?:###?\s+)?Data Integrity Rules?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "property_rules": {
        "pattern": r"(?:###?\s+)?Property (?:Rules|Constraints)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "traversal_paths": {
        "pattern": r"(?:###?\s+)?Traversal Paths?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    "risk_dependency_rules": {
        "pattern": r"(?:###?\s+)?Risk Dependency Rules?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "knowledge_context"
    },
    
    # From cypher_query_patterns bundle
    "basic_match_pattern": {
        "pattern": r"(?:###?\s+)?Basic Match Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "relationship_pattern": {
        "pattern": r"(?:###?\s+)?Relationship Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "temporal_filter_pattern": {
        "pattern": r"(?:###?\s+)?Temporal Filter[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "aggregation_pattern": {
        "pattern": r"(?:###?\s+)?Aggregation Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "pagination_pattern": {
        "pattern": r"(?:###?\s+)?Pagination Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "optional_match_pattern": {
        "pattern": r"(?:###?\s+)?Optional Match Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "alternative_relationship_syntax": {
        "pattern": r"(?:###?\s+)?Alternative Relationship Syntax[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    "level_integrity_pattern": {
        "pattern": r"(?:###?\s+)?Level Integrity Pattern[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "cypher_query_patterns"
    },
    
    # From tool_rules_core bundle
    "recall_memory_rules": {
        "pattern": r"(?:###?\s+)?recall_memory Tool[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "tool_rules_core"
    },
    "read_neo4j_cypher_rules": {
        "pattern": r"(?:###?\s+)?read_neo4j_cypher Tool[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "tool_rules_core"
    },
    "retrieve_elements_rules": {
        "pattern": r"(?:###?\s+)?retrieve_elements Tool[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "tool_rules_core"
    },
    
    # From mode_specific_strategies bundle
    "mode_A_simple_query": {
        "pattern": r"(?:###?\s+)?Mode A[:\s]+Simple Query[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_B_complex_analysis": {
        "pattern": r"(?:###?\s+)?Mode B[:\s]+Complex Analysis[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_C_exploratory": {
        "pattern": r"(?:###?\s+)?Mode C[:\s]+Exploratory[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_D_acquaintance": {
        "pattern": r"(?:###?\s+)?Mode D[:\s]+(?:Acquaintance|Questions about Noor)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_F_social": {
        "pattern": r"(?:###?\s+)?Mode F[:\s]+Social[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_G_continuation": {
        "pattern": r"(?:###?\s+)?Mode G[:\s]+Continuation[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "mode_H_underspecified": {
        "pattern": r"(?:###?\s+)?Mode H[:\s]+Underspecified[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    "quick_exit_path": {
        "pattern": r"(?:###?\s+)?Quick Exit Path[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "mode_specific_strategies"
    },
    
    # From strategy_gap_diagnosis bundle
    "gap_types": {
        "pattern": r"(?:###?\s+)?Gap Types?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "strategy_gap_diagnosis"
    },
    "gap_detection_cypher": {
        "pattern": r"(?:###?\s+)?Gap Detection (?:Cypher|Patterns?)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "strategy_gap_diagnosis"
    },
    "gap_prioritization": {
        "pattern": r"(?:###?\s+)?Gap Prioritization[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "strategy_gap_diagnosis"
    },
    "gap_recommendation_framework": {
        "pattern": r"(?:###?\s+)?(?:Gap )?Recommendation Framework[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "strategy_gap_diagnosis"
    },
    "absence_is_signal": {
        "pattern": r"(?:###?\s+)?Absence[_ ]is[_ ]Signal[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "strategy_gap_diagnosis"
    },
    
    # From temporal_vantage_logic bundle
    "vantage_point_logic": {
        "pattern": r"(?:###?\s+)?Vantage Point Logic[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "temporal_vantage_logic"
    },
    
    # From module_business_language bundle
    "business_language_rules": {
        "pattern": r"(?:###?\s+)?Business Language (?:Rules|Translation)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "module_business_language"
    },
    
    # From module_memory_management_noor bundle
    "memory_access_rules": {
        "pattern": r"(?:###?\s+)?Memory Access Rules[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "module_memory_management_noor"
    },
    
    # From vector_search_strategy bundle
    "vector_strategy": {
        "pattern": r"(?:###?\s+)?Vector (?:Search )?Strategy[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "vector_search_strategy"
    },
    
    # From visualization_config bundle
    "chart_types": {
        "pattern": r"(?:###?\s+)?(?:Supported )?Chart Types?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
    "color_rules": {
        "pattern": r"(?:###?\s+)?Color (?:Rules|Palette)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
    "layout_constraints": {
        "pattern": r"(?:###?\s+)?Layout Constraints?[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
    "table_formatting": {
        "pattern": r"(?:###?\s+)?Table Formatting[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
    "html_rendering": {
        "pattern": r"(?:###?\s+)?HTML (?:Rendering|Generation)[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
    "data_structure_rules": {
        "pattern": r"(?:###?\s+)?Data Structure Rules[:\s]+(.*?)(?=\n###?|$)",
        "bundle": "visualization_config"
    },
}


def extract_with_pattern(content, pattern):
    """Extract content using regex pattern."""
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if match:
        extracted = match.group(1).strip()
        # Clean up: remove excessive newlines but keep structure
        extracted = re.sub(r'\n{3,}', '\n\n', extracted)
        return extracted if len(extracted) > 50 else None
    return None


def main():
    print("=" * 80)
    print("ELEMENT CONTENT EXTRACTOR (ADVANCED)")
    print("=" * 80)
    
    # Get all bundles
    bundles_response = supabase.table("instruction_bundles").select("tag, content").execute()
    bundles = {b["tag"]: b["content"] for b in bundles_response.data}
    
    print(f"\nAvailable bundles: {list(bundles.keys())}")
    
    # Get all elements with placeholders
    elements_response = supabase.table("instruction_elements").select("id, bundle, element, content").execute()
    
    updated_count = 0
    skipped_count = 0
    
    for elem in elements_response.data:
        elem_id = elem["id"]
        bundle_tag = elem["bundle"]
        element_name = elem["element"]
        current_content = elem["content"]
        
        # Check if placeholder
        if "[Content from" in current_content or "[PLACEHOLDER]" in current_content or "to be refined" in current_content:
            # Try manual mapping first
            if element_name in ELEMENT_MAPPINGS:
                mapping = ELEMENT_MAPPINGS[element_name]
                source_bundle = mapping["bundle"]
                
                if source_bundle in bundles:
                    extracted = extract_with_pattern(bundles[source_bundle], mapping["pattern"])
                    
                    if extracted:
                        supabase.table("instruction_elements").update({
                            "content": extracted
                        }).eq("id", elem_id).execute()
                        print(f"✓ {element_name}: {len(extracted)} chars from {source_bundle}")
                        updated_count += 1
                    else:
                        print(f"✗ {element_name}: Pattern matched but content too short")
                        skipped_count += 1
                else:
                    print(f"✗ {element_name}: Bundle {source_bundle} not found")
                    skipped_count += 1
            else:
                print(f"⚠ {element_name}: No manual mapping defined")
                skipped_count += 1
    
    print("\n" + "=" * 80)
    print(f"✓ Updated: {updated_count}")
    print(f"✗ Skipped: {skipped_count}")
    print("=" * 80)


if __name__ == "__main__":
    main()
