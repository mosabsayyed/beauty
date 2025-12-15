#!/usr/bin/env python3
"""
Populate instruction_elements table with v3.3 atomic elements.

This script parses the v3.3 spec (cognitive_bootstrap_prompt_v3.3.md) and extracts
all 76 atomic elements, then inserts them into the instruction_elements table.

Usage:
    python scripts/populate_v3_3_elements.py [--dry-run]
"""

import os
import sys
import re
import argparse
from typing import List, Dict, Any

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()


def parse_element_content(spec_content: str) -> List[Dict[str, Any]]:
    """
    Parse the v3.3 spec and extract all <element> tags.
    
    Returns list of dicts with: element, bundle, content, description, avg_tokens
    """
    elements = []
    
    # Find all <element name="...">...</element> blocks
    element_pattern = r'<element name="([^"]+)">(.*?)</element>'
    matches = re.findall(element_pattern, spec_content, re.DOTALL)
    
    # Map element names to bundles based on section headers
    bundle_mappings = {
        # Node schemas
        'EntityProject': 'knowledge_context',
        'EntityCapability': 'knowledge_context',
        'EntityRisk': 'knowledge_context',
        'EntityOrgUnit': 'knowledge_context',
        'EntityITSystem': 'knowledge_context',
        'EntityProcess': 'knowledge_context',
        'EntityChangeAdoption': 'knowledge_context',
        'EntityCultureHealth': 'knowledge_context',
        'EntityVendor': 'knowledge_context',
        'SectorObjective': 'knowledge_context',
        'SectorPolicyTool': 'knowledge_context',
        'SectorPerformance': 'knowledge_context',
        'SectorAdminRecord': 'knowledge_context',
        'SectorDataTransaction': 'knowledge_context',
        'SectorBusiness': 'knowledge_context',
        'SectorGovEntity': 'knowledge_context',
        'SectorCitizen': 'knowledge_context',
        
        # Relationships
        'OPERATES': 'knowledge_context',
        'MONITORED_BY': 'knowledge_context',
        'CLOSE_GAPS': 'knowledge_context',
        'SETS_PRIORITIES': 'knowledge_context',
        'SETS_TARGETS': 'knowledge_context',
        'EXECUTES': 'knowledge_context',
        'REPORTS': 'knowledge_context',
        'PARENT_OF': 'knowledge_context',
        'REALIZED_VIA': 'knowledge_context',
        'CASCADED_VIA': 'knowledge_context',
        'ROLE_GAPS': 'knowledge_context',
        'KNOWLEDGE_GAPS': 'knowledge_context',
        'AUTOMATION_GAPS': 'knowledge_context',
        'ADOPTION_ENT_RISKS': 'knowledge_context',
        'INCREASE_ADOPTION': 'knowledge_context',
        'GOVERNED_BY': 'knowledge_context',
        'AGGREGATES_TO': 'knowledge_context',
        'REFERS_TO': 'knowledge_context',
        'APPLIED_ON': 'knowledge_context',
        'TRIGGERS_EVENT': 'knowledge_context',
        'MEASURED_BY': 'knowledge_context',
        'FEEDS_INTO': 'knowledge_context',
        'MONITORS_FOR': 'knowledge_context',
        
        # Business chains
        'business_chain_SectorOps': 'mode_specific_strategies',
        'business_chain_Strategy_to_Tactics_Priority': 'mode_specific_strategies',
        'business_chain_Strategy_to_Tactics_Targets': 'mode_specific_strategies',
        'business_chain_Tactical_to_Strategy': 'mode_specific_strategies',
        'business_chain_Risk_Build_Mode': 'mode_specific_strategies',
        'business_chain_Risk_Operate_Mode': 'mode_specific_strategies',
        'business_chain_Internal_Efficiency': 'mode_specific_strategies',
        
        # Query patterns
        'optimized_retrieval': 'cypher_query_patterns',
        'impact_analysis': 'cypher_query_patterns',
        'safe_portfolio_health_check': 'cypher_query_patterns',
        'basic_match_pattern': 'cypher_query_patterns',
        'aggregation_pattern': 'cypher_query_patterns',
        'pagination_pattern': 'cypher_query_patterns',
        'optional_match_pattern': 'cypher_query_patterns',
        'level_integrity_pattern': 'cypher_query_patterns',
        
        # Rules & Constraints
        'data_integrity_rules': 'tool_rules_core',
        'level_definitions': 'knowledge_context',
        'tool_rules_core': 'tool_rules_core',
        'vantage_point_logic': 'strategy_gap_diagnosis',
        'property_rules': 'tool_rules_core',
        'gap_diagnosis_rules': 'strategy_gap_diagnosis',
        
        # Visualization
        'chart_type_Column': 'visualization_config',
        'chart_type_Line': 'visualization_config',
        'chart_type_Pie': 'visualization_config',
        'chart_type_Radar': 'visualization_config',
        'chart_type_Scatter': 'visualization_config',
        'chart_type_Bubble': 'visualization_config',
        'chart_type_Combo': 'visualization_config',
        'chart_type_Table': 'visualization_config',
        'chart_type_HTML': 'visualization_config',
        'data_structure_rules': 'visualization_config',
        
        # Memory & Files
        'memory_access_rules': 'memory_rules',
        'recall_memory_rules': 'memory_rules',
        'file_handling': 'file_handling',
        
        # Vector Strategy
        'vector_concept_search': 'vector_strategy',
        'vector_inference_similarity': 'vector_strategy',
    }
    
    for name, content in matches:
        content = content.strip()
        bundle = bundle_mappings.get(name, 'miscellaneous')
        
        # Estimate tokens (roughly 1 token per 4 characters)
        avg_tokens = len(content) // 4
        
        # Extract first line as description
        lines = content.split('\n')
        description = lines[0][:200] if lines else f"Element: {name}"
        
        elements.append({
            'element': name,
            'bundle': bundle,
            'content': content,
            'description': description,
            'avg_tokens': avg_tokens,
            'dependencies': [],
            'use_cases': [],
            'status': 'active',
            'version': '3.3.0'
        })
    
    return elements


def upsert_elements(elements: List[Dict[str, Any]], dry_run: bool = False) -> Dict[str, int]:
    """
    Insert or update elements in the instruction_elements table.
    
    Returns dict with counts: inserted, updated, failed
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    supabase = create_client(supabase_url, supabase_key)
    
    counts = {'inserted': 0, 'updated': 0, 'failed': 0}
    
    for elem in elements:
        try:
            if dry_run:
                print(f"  [DRY RUN] Would upsert: {elem['element']} ({elem['bundle']})")
                counts['inserted'] += 1
                continue
            
            # Use upsert with on_conflict
            response = supabase.table('instruction_elements').upsert(
                {
                    'bundle': elem['bundle'],
                    'element': elem['element'],
                    'content': elem['content'],
                    'description': elem['description'],
                    'avg_tokens': elem['avg_tokens'],
                    'dependencies': elem['dependencies'],
                    'use_cases': elem['use_cases'],
                    'status': elem['status'],
                    'version': elem['version'],
                },
                on_conflict='bundle,element,version'
            ).execute()
            
            if response.data:
                counts['inserted'] += 1
                print(f"  ✓ {elem['element']} ({elem['bundle']}) - {elem['avg_tokens']} tokens")
            else:
                counts['failed'] += 1
                print(f"  ✗ {elem['element']} - No response data")
                
        except Exception as e:
            counts['failed'] += 1
            print(f"  ✗ {elem['element']} - Error: {e}")
    
    return counts


def main():
    parser = argparse.ArgumentParser(description='Populate instruction_elements from v3.3 spec')
    parser.add_argument('--dry-run', action='store_true', help='Parse only, do not insert')
    args = parser.parse_args()
    
    # Read the v3.3 spec file
    spec_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'app', 'services', 'cognitive_bootstrap_prompt_v3.3.md'
    )
    
    print(f"Reading v3.3 spec from: {spec_path}")
    
    if not os.path.exists(spec_path):
        print(f"ERROR: Spec file not found: {spec_path}")
        sys.exit(1)
    
    with open(spec_path, 'r') as f:
        spec_content = f.read()
    
    print(f"Spec file size: {len(spec_content)} characters")
    
    # Parse elements
    print("\nParsing elements from spec...")
    elements = parse_element_content(spec_content)
    print(f"Found {len(elements)} elements")
    
    # Group by bundle for summary
    bundle_counts = {}
    for elem in elements:
        bundle = elem['bundle']
        bundle_counts[bundle] = bundle_counts.get(bundle, 0) + 1
    
    print("\nElements by bundle:")
    for bundle, count in sorted(bundle_counts.items()):
        print(f"  {bundle}: {count}")
    
    # Insert/update elements
    print("\n" + ("=" * 60))
    if args.dry_run:
        print("DRY RUN MODE - No changes will be made")
    else:
        print("Upserting elements to instruction_elements table...")
    print("=" * 60)
    
    counts = upsert_elements(elements, dry_run=args.dry_run)
    
    print("\n" + ("=" * 60))
    print("Summary:")
    print(f"  Inserted/Updated: {counts['inserted']}")
    print(f"  Failed: {counts['failed']}")
    print(f"  Total: {len(elements)}")
    print("=" * 60)


if __name__ == '__main__':
    main()
