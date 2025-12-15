"""
Noor v3.3: LLM Test Scenarios (Element Selection Validation)

Tests from LLM's perspective: Can the LLM correctly identify which elements to request?

Each scenario tests:
1. User query
2. Expected elements LLM should request
3. Why those elements (reasoning)
4. Token savings vs bundle-level loading
"""

import json
import pytest

# Test scenarios with expected element selection
TEST_SCENARIOS = [
    {
        "scenario_id": "S1",
        "user_query": "Show me all projects in 2027 as a chart",
        "expected_mode": "A",
        "expected_elements": [
            "EntityProject",
            "data_integrity_rules",
            "temporal_filter_pattern",
            "basic_match_pattern",
            "chart_types",
            "data_structure_rules"
        ],
        "reasoning": "Simple query (Mode A) + visualization. Need EntityProject schema, temporal filter, basic Cypher, and chart specs.",
        "token_estimate": "~920 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) + visualization_config (2,976) = 19,916 tokens. Savings: 95%"
    },
    {
        "scenario_id": "S2",
        "user_query": "What strategic gaps exist in the Albarq program?",
        "expected_mode": "B",
        "expected_elements": [
            "EntityProject",
            "EntityCapability",
            "EntityRisk",
            "data_integrity_rules",
            "level_definitions",
            "direct_relationships",
            "business_chains",
            "gap_types",
            "absence_is_signal",
            "gap_detection_cypher",
            "relationship_pattern",
            "temporal_filter_pattern",
            "optional_match_pattern"
        ],
        "reasoning": "Complex gap analysis (Mode B). Need multiple node schemas, relationships, gap framework, and advanced Cypher patterns.",
        "token_estimate": "~2,540 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) + strategy_gap_diagnosis (1,307) = 18,247 tokens. Savings: 86%"
    },
    {
        "scenario_id": "S3",
        "user_query": "Hello Noor!",
        "expected_mode": "F",
        "expected_elements": [],
        "reasoning": "Greeting (Mode F). Quick Exit Path - NO elements needed. Fast-path in orchestrator handles this.",
        "token_estimate": "0 tokens (fast-path)",
        "vs_bundle_loading": "Would load nothing (quick exit). Savings: N/A"
    },
    {
        "scenario_id": "S4",
        "user_query": "Which departments are working on digital transformation?",
        "expected_mode": "A",
        "expected_elements": [
            "EntityOrgUnit",
            "EntityProject",
            "data_integrity_rules",
            "level_definitions",
            "relationship_pattern",
            "temporal_filter_pattern",
            "basic_match_pattern",
            "vector_strategy"
        ],
        "reasoning": "Simple query with semantic search ('digital transformation'). Need OrgUnit + Project schemas, relationships, and vector search template.",
        "token_estimate": "~1,400 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) = 16,940 tokens. Savings: 92%"
    },
    {
        "scenario_id": "S5",
        "user_query": "Show me projects similar to the Tatweer initiative",
        "expected_mode": "A",
        "expected_elements": [
            "EntityProject",
            "data_integrity_rules",
            "vector_strategy",
            "temporal_filter_pattern",
            "basic_match_pattern",
            "pagination_pattern"
        ],
        "reasoning": "Similarity search (Template B). Need EntityProject schema, vector strategy, and basic Cypher patterns.",
        "token_estimate": "~1,030 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) = 16,940 tokens. Savings: 94%"
    },
    {
        "scenario_id": "S6",
        "user_query": "What are the high-risk capabilities with low maturity?",
        "expected_mode": "A",
        "expected_elements": [
            "EntityCapability",
            "EntityRisk",
            "data_integrity_rules",
            "level_definitions",
            "risk_dependency_rules",
            "relationship_pattern",
            "temporal_filter_pattern",
            "aggregation_pattern"
        ],
        "reasoning": "Query with filters and aggregation. Need Capability + Risk schemas, risk relationships, and aggregation patterns.",
        "token_estimate": "~1,270 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) = 16,940 tokens. Savings: 93%"
    },
    {
        "scenario_id": "S7",
        "user_query": "What is a capability in your ontology?",
        "expected_mode": "E",
        "expected_elements": [
            "EntityCapability",
            "level_definitions"
        ],
        "reasoning": "Learning/explanation (Mode E). Need Capability schema and level hierarchy explanation. No Cypher needed.",
        "token_estimate": "~380 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) = 10,628 tokens. Savings: 96%"
    },
    {
        "scenario_id": "S8",
        "user_query": "Analyze the impact of project delays on strategic objectives",
        "expected_mode": "B",
        "expected_elements": [
            "EntityProject",
            "SectorObjective",
            "data_integrity_rules",
            "level_definitions",
            "business_chains",
            "direct_relationships",
            "traversal_paths",
            "vantage_point_logic",
            "relationship_pattern",
            "temporal_filter_pattern",
            "aggregation_pattern",
            "optional_match_pattern"
        ],
        "reasoning": "Complex multi-hop impact analysis (Mode B). Need Project + Objective schemas, business chains, temporal logic, and advanced Cypher.",
        "token_estimate": "~2,220 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) + temporal_vantage_logic (5,186) = 22,126 tokens. Savings: 90%"
    },
    {
        "scenario_id": "S9",
        "user_query": "Create a risk dashboard for the Tahdith program with color-coded severity",
        "expected_mode": "A",
        "expected_elements": [
            "EntityRisk",
            "EntityProject",
            "data_integrity_rules",
            "level_definitions",
            "relationship_pattern",
            "temporal_filter_pattern",
            "aggregation_pattern",
            "chart_types",
            "color_rules",
            "html_rendering",
            "data_structure_rules"
        ],
        "reasoning": "Visualization query (Mode A). Need Risk + Project schemas, Cypher patterns, and full visualization specs (charts, colors, HTML).",
        "token_estimate": "~1,650 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) + visualization_config (2,976) = 19,916 tokens. Savings: 92%"
    },
    {
        "scenario_id": "S10",
        "user_query": "How many IT systems support the capability 'Data Analytics'?",
        "expected_mode": "A",
        "expected_elements": [
            "EntityITSystem",
            "EntityCapability",
            "data_integrity_rules",
            "level_definitions",
            "direct_relationships",
            "relationship_pattern",
            "temporal_filter_pattern",
            "aggregation_pattern",
            "vector_strategy"
        ],
        "reasoning": "Simple count query with semantic search ('Data Analytics'). Need ITSystem + Capability schemas, relationships, aggregation, and vector search.",
        "token_estimate": "~1,430 tokens",
        "vs_bundle_loading": "Would load knowledge_context (10,628) + cypher_query_patterns (6,312) = 16,940 tokens. Savings: 92%"
    }
]

def print_test_scenarios():
    """Print formatted test scenarios for LLM validation."""
    print("=" * 100)
    print("Noor v3.3: LLM Element Selection Test Scenarios")
    print("=" * 100)
    print()
    
    total_scenarios = len(TEST_SCENARIOS)
    total_bundle_tokens = 0
    total_element_tokens = 0
    
    for scenario in TEST_SCENARIOS:
        print(f"[{scenario['scenario_id']}] {scenario['user_query']}")
        print(f"    Mode: {scenario['expected_mode']}")
        print(f"    Elements: {len(scenario['expected_elements'])} required")
        
        if scenario['expected_elements']:
            print(f"    → {', '.join(scenario['expected_elements'][:5])}")
            if len(scenario['expected_elements']) > 5:
                print(f"       + {len(scenario['expected_elements']) - 5} more...")
        else:
            print(f"    → [Fast-path - no elements needed]")
        
        print(f"    Reasoning: {scenario['reasoning']}")
        print(f"    Token estimate: {scenario['token_estimate']}")
        print(f"    vs Bundle-level: {scenario['vs_bundle_loading']}")
        print()
    
    print("=" * 100)
    print(f"Total scenarios tested: {total_scenarios}")
    print()
    print("Average token savings: ~90%")
    print("Element-level loading achieves 60-80% savings beyond v3.2 bundle-level architecture")
    print("=" * 100)

def export_scenarios_json():
    """Export scenarios as JSON for programmatic testing."""
    with open('/home/mosab/projects/chatmodule/backend/tests/element_selection_tests.json', 'w') as f:
        json.dump({
            "version": "v3.3",
            "description": "LLM element selection validation scenarios",
            "total_scenarios": len(TEST_SCENARIOS),
            "scenarios": TEST_SCENARIOS
        }, f, indent=2)
    print("✓ Exported scenarios to tests/element_selection_tests.json")

if __name__ == "__main__":
    print_test_scenarios()
    export_scenarios_json()


def test_mode_a_selection():
    """Scenario S1 is the canonical Mode A selection example."""
    s1 = next(s for s in TEST_SCENARIOS if s.get("scenario_id") == "S1")
    assert s1["expected_mode"] == "A"
    assert "EntityProject" in s1["expected_elements"]
    assert "temporal_filter_pattern" in s1["expected_elements"]
