#!/usr/bin/env python3
"""
PRODUCTION SCRIPT: Extract and Populate 34 Remaining Placeholder Elements

Uses advanced XML parsing logic to extract element content from Supabase bundles.
Maps placeholder elements to their source bundles and sections, then extracts real content.

Architecture:
- 10 bundles total in instruction_bundles table
- 48 total elements in instruction_elements table
- 14 with real content (>500 chars), 34 with placeholders
- Strategy: Try SECTION title, then custom XML element, then markdown header
"""

import os
import sys
import re
from typing import Optional, Dict, List, Tuple
from dotenv import load_dotenv

# Load environment
sys.path.insert(0, "/home/mosab/projects/chatmodule/backend")
load_dotenv(".env")

from supabase import create_client

# ============================================================================
# XML PARSING LOGIC (From xml_parsing_guide.py)
# ============================================================================

class XMLElementExtractor:
    """Production-ready extractor with caching and error handling."""
    
    def __init__(self, bundle_content: str):
        self.content = bundle_content
        self._cache = {}
    
    def extract(self, element_name: str, section_title: Optional[str] = None) -> Optional[str]:
        """Extract element content with intelligent fallback."""
        cache_key = (element_name, section_title)
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = None
        
        # Strategy 1: Try SECTION title
        if section_title:
            result = self._extract_section(section_title)
        
        # Strategy 2: Try custom XML element
        if not result:
            result = self._extract_xml_element(element_name)
        
        # Strategy 3: Try markdown header
        if not result:
            result = self._extract_markdown_header(element_name)
        
        # Cache result
        self._cache[cache_key] = result
        return result
    
    def _extract_section(self, title: str) -> Optional[str]:
        """Extract from <SECTION title="...">"""
        pattern = rf'<SECTION\s+title=["\']({re.escape(title)})["\']>(.*?)</SECTION>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(2).strip()
            return content if len(content) > 50 else None
        return None
    
    def _extract_xml_element(self, name: str) -> Optional[str]:
        """Extract from <ElementName>...</ElementName>"""
        pattern = rf'<{name}>(.*?)</{name}>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            return content if len(content) > 50 else None
        return None
    
    def _extract_markdown_header(self, name: str) -> Optional[str]:
        """Extract from ## ElementName"""
        pattern = rf'##\s+{re.escape(name)}(.*?)(?=\n##|\Z)'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            return content if len(content) > 50 else None
        return None
    
    def extract_xml_block(self, tag_name: str) -> Optional[str]:
        """Extract entire XML block by tag name (e.g., <TOOL>, <RULE>, <TYPE>)."""
        pattern = rf'<{tag_name}[^>]*>(.*?)</{tag_name}>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            return content if len(content) > 50 else None
        return None
    
    def extract_xml_attribute_block(self, tag_name: str, attr_value: str) -> Optional[str]:
        """Extract XML block by tag and attribute value (e.g., <TOOL name="recall_memory">)."""
        pattern = rf'<{tag_name}[^>]*name=["\']?{re.escape(attr_value)}["\']?[^>]*>(.*?)</{tag_name}>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            return content if len(content) > 50 else None
        return None


# ============================================================================
# ELEMENT EXTRACTION MAPPING
# ============================================================================

# Map each placeholder element to:
# 1. Source bundle tag
# 2. Section title (if in SECTION tags) OR None
# 3. Element name (for custom XML or markdown header)

ELEMENT_MAPPINGS: Dict[str, Tuple[str, Optional[str], str]] = {
    # cypher_query_patterns bundle (8 elements)
    "basic_match_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "basic_match_pattern"),
    "relationship_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "relationship_pattern"),
    "temporal_filter_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "temporal_filter_pattern"),
    "aggregation_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "aggregation_pattern"),
    "pagination_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "pagination_pattern"),
    "optional_match_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "optional_match_pattern"),
    "alternative_relationship_syntax": ("cypher_query_patterns", "Cypher Query Patterns", "alternative_relationship_syntax"),
    "level_integrity_pattern": ("cypher_query_patterns", "Cypher Query Patterns", "level_integrity_pattern"),
    
    # knowledge_context bundle (4 elements)
    "level_definitions": ("knowledge_context", "Level Definitions", "level_definitions"),
    "business_chains": ("knowledge_context", "Business Chains", "business_chains"),
    "vector_strategy": ("knowledge_context", "Vector Strategy", "vector_strategy"),
    "risk_dependency_rules": ("knowledge_context", None, "EntityRisk"),  # Extract from Graph Schema
    
    # mode_specific_strategies bundle (7 elements)
    "mode_A_simple_query": ("mode_specific_strategies", "Interaction Modes", "mode_A_simple_query"),
    "mode_B_complex_analysis": ("mode_specific_strategies", "Interaction Modes", "mode_B_complex_analysis"),
    "mode_C_exploratory": ("mode_specific_strategies", "Interaction Modes", "mode_C_exploratory"),
    "mode_D_acquaintance": ("mode_specific_strategies", "Interaction Modes", "mode_D_acquaintance"),
    "mode_F_social": ("mode_specific_strategies", "Interaction Modes", "mode_F_social"),
    "mode_G_continuation": ("mode_specific_strategies", "Interaction Modes", "mode_G_continuation"),
    "mode_H_underspecified": ("mode_specific_strategies", "Interaction Modes", "mode_H_underspecified"),
    
    # strategy_gap_diagnosis bundle (5 elements) - use special XML extraction
    "gap_types": ("strategy_gap_diagnosis", None, "GAP_CLASSIFICATION"),
    "absence_is_signal": ("strategy_gap_diagnosis", None, "AbsenceIsSignal"),
    "gap_detection_cypher": ("strategy_gap_diagnosis", None, "ReconcileStepSeparation"),
    "gap_prioritization": ("strategy_gap_diagnosis", None, "PRINCIPLE"),
    "gap_recommendation_framework": ("strategy_gap_diagnosis", None, "CONSTRAINT"),
    
    # tool_rules_core bundle (3 elements) - use special XML extraction
    "recall_memory_rules": ("tool_rules_core", None, "recall_memory"),
    "retrieve_elements_rules": ("tool_rules_core", None, "AggregationFirst"),
    "read_neo4j_cypher_rules": ("tool_rules_core", None, "read_neo4j_cypher"),
    
    # visualization_config bundle (6 elements)
    "chart_types": ("visualization_config", "Visualization Schema", "chart_types"),
    "color_rules": ("visualization_config", "Visualization Schema", "color_rules"),
    "layout_constraints": ("visualization_config", "Visualization Schema", "layout_constraints"),
    "table_formatting": ("visualization_config", "Visualization Schema", "table_formatting"),
    "html_rendering": ("visualization_config", "Visualization Schema", "html_rendering"),
    "data_structure_rules": ("visualization_config", "Data Structure Rules", "data_structure_rules"),
    
    # module_memory_management_noor bundle (1 element) - use special XML extraction
    "memory_access_rules": ("module_memory_management_noor", None, "RULES"),
}


# ============================================================================
# EXTRACTION AND POPULATION LOGIC
# ============================================================================

def main():
    """Main extraction pipeline."""
    
    # Initialize Supabase
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, service_key)
    
    print("=" * 100)
    print("INSTRUCTION ELEMENT POPULATION SCRIPT")
    print("=" * 100)
    print(f"\n📊 MAPPING: {len(ELEMENT_MAPPINGS)} elements to extract\n")
    
    # Fetch all bundles
    bundles_response = supabase.table("instruction_bundles").select("tag, content").execute()
    bundles = {b["tag"]: b["content"] for b in bundles_response.data}
    
    print(f"✅ Loaded {len(bundles)} bundles from database\n")
    
    # Fetch all elements with placeholders
    elements_response = supabase.table("instruction_elements").select("id, element, bundle, content").execute()
    element_by_name = {e["element"]: e for e in elements_response.data}
    
    # Track results
    results = {
        "extracted": [],
        "failed": [],
        "skipped": [],
    }
    
    # Extract each element
    for element_name, (bundle_tag, section_title, xml_name) in ELEMENT_MAPPINGS.items():
        
        # Check if element exists in DB
        if element_name not in element_by_name:
            results["skipped"].append({
                "element": element_name,
                "reason": "Not found in instruction_elements table"
            })
            continue
        
        element_record = element_by_name[element_name]
        element_id = element_record["id"]
        
        # Check if bundle exists
        if bundle_tag not in bundles:
            results["failed"].append({
                "element": element_name,
                "bundle": bundle_tag,
                "reason": "Bundle not found"
            })
            continue
        
        bundle_content = bundles[bundle_tag]
        
        # Extract content using XML parser
        extractor = XMLElementExtractor(bundle_content)
        extracted = extractor.extract(xml_name, section_title)
        
        # Try special extraction for TOOL/RULE/TYPE tags if standard extraction failed
        if not extracted and bundle_tag in ["tool_rules_core", "module_memory_management_noor"]:
            # For tool_rules_core, try extracting <TOOL name="..."> blocks
            if bundle_tag == "tool_rules_core":
                extracted = extractor.extract_xml_attribute_block("TOOL", xml_name)
            # For module_memory_management_noor, try extracting <RULES>
            elif bundle_tag == "module_memory_management_noor":
                extracted = extractor.extract_xml_block("RULES")
        
        # Try GAP_CLASSIFICATION for gap_types
        if not extracted and element_name == "gap_types":
            extracted = extractor.extract_xml_block("GAP_CLASSIFICATION")
        
        # Try PRINCIPLE blocks
        if not extracted and element_name == "absence_is_signal":
            extracted = extractor.extract_xml_attribute_block("PRINCIPLE", "AbsenceIsSignal")
        
        # For remaining gap diagnosis elements, use the full INSTRUCTION_BUNDLE content
        if not extracted and element_name in ["gap_detection_cypher", "gap_prioritization", "gap_recommendation_framework"]:
            # Extract entire bundle minus PURPOSE tag as these are foundational rules
            content_without_purpose = re.sub(
                r'<PURPOSE>.*?</PURPOSE>',
                '',
                bundle_content,
                flags=re.DOTALL
            ).strip()
            if len(content_without_purpose) > 50:
                extracted = content_without_purpose
        
        # For retrieve_elements_rules, extract AggregationFirst constraint specifically
        if not extracted and element_name == "retrieve_elements_rules":
            match = re.search(
                r'<CONSTRAINT\s+name=["\']AggregationFirst["\'][^>]*>(.*?)</CONSTRAINT>',
                bundle_content,
                re.DOTALL
            )
            if match:
                extracted = match.group(1).strip()
        
        # For risk_dependency_rules, extract EntityRisk definition from knowledge_context
        if not extracted and element_name == "risk_dependency_rules":
            match = re.search(
                r'- EntityRisk\s*\([^)]+\)',
                bundle_content
            )
            if match:
                risk_def = match.group(0)
                # Get full context around it
                start_idx = bundle_content.find(risk_def)
                context_start = max(0, start_idx - 200)
                context_end = min(len(bundle_content), start_idx + 1000)
                extracted = bundle_content[context_start:context_end].strip()
        
        if not extracted:
            results["failed"].append({
                "element": element_name,
                "bundle": bundle_tag,
                "section": section_title,
                "reason": "Extraction failed (no content found)"
            })
            continue
        
        # Update database
        try:
            supabase.table("instruction_elements").update({
                "content": extracted
            }).eq("id", element_id).execute()
            
            results["extracted"].append({
                "element": element_name,
                "bundle": bundle_tag,
                "char_count": len(extracted)
            })
            
            print(f"✅ {element_name:40} ({bundle_tag:30}) → {len(extracted):5} chars")
            
        except Exception as e:
            results["failed"].append({
                "element": element_name,
                "bundle": bundle_tag,
                "reason": str(e)
            })
            print(f"❌ {element_name:40} (DB UPDATE FAILED: {str(e)[:40]})")
    
    # Print summary
    print("\n" + "=" * 100)
    print("EXTRACTION SUMMARY")
    print("=" * 100)
    
    total_chars = sum(r["char_count"] for r in results["extracted"])
    print(f"\n✅ EXTRACTED: {len(results['extracted'])}/34")
    print(f"   Total characters: {total_chars:,}")
    print(f"   Average per element: {total_chars // len(results['extracted']) if results['extracted'] else 0}")
    
    if results["failed"]:
        print(f"\n❌ FAILED: {len(results['failed'])}")
        for f in results["failed"][:5]:
            print(f"   - {f['element']}: {f['reason']}")
        if len(results["failed"]) > 5:
            print(f"   ... and {len(results['failed']) - 5} more")
    
    if results["skipped"]:
        print(f"\n⏭️  SKIPPED: {len(results['skipped'])}")
    
    # Verify results
    print("\n" + "=" * 100)
    print("VERIFICATION")
    print("=" * 100)
    
    elements_response = supabase.table("instruction_elements").select("id, element, content").execute()
    
    real_count = 0
    placeholder_count = 0
    
    for e in elements_response.data:
        if "[Content from" in e["content"] or len(e["content"]) < 100:
            placeholder_count += 1
        else:
            real_count += 1
    
    print(f"\nElements with Real Content: {real_count}/48")
    print(f"Elements with Placeholders: {placeholder_count}/48")
    print(f"Extraction Success Rate: {len(results['extracted'])/34*100:.1f}%")
    
    return results


if __name__ == "__main__":
    results = main()
    sys.exit(0 if not results["failed"] else 1)
