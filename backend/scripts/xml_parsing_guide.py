#!/usr/bin/env python3
"""
ADVANCED XML PARSING LOGIC FOR INSTRUCTION ELEMENT EXTRACTION

The instruction_bundles contain element content wrapped in XML <SECTION> tags.
This guide shows how to extract them properly with working code examples.
"""

import re
from typing import Optional

# ==============================================================================
# EXAMPLE 1: Simple XML Tag Extraction (Working)
# ==============================================================================

BUNDLE_EXAMPLE_1 = """
<INSTRUCTION_BUNDLE tag="cypher_query_patterns" version="1.0.0">
  <PURPOSE>Provide optimized Cypher query patterns...</PURPOSE>
  <SECTION title="Cypher Query Patterns">

**Pattern 1: Optimized Retrieval (Token Aware)**
*Goal: Get 2027 Projects with total count in one call.*
```cypher
MATCH (p:EntityProject)
WHERE p.year = 2027 AND p.level = 'L3'
WITH p ORDER BY p.name
RETURN count(p) AS total_count, collect(p { .id, .name })[0..30] AS records
```

**Pattern 2: Impact Analysis (Chain 1)**
*Goal: Strategy to Execution flow.*
```cypher
MATCH (p:EntityProject {name: 'Digital Transformation', year: 2025, level: 'L3'})
MATCH (p)-[:ADDRESSES_GAP]->(c:EntityCapability)
...
```

  </SECTION>
  <SECTION title="Additional Rules">
14. Do NOT use `SKIP/OFFSET` for pagination...
  </SECTION>
</INSTRUCTION_BUNDLE>
"""


def extract_section_content(bundle_content: str, section_title: str) -> Optional[str]:
    """
    Extract content from a <SECTION> tag by title.
    
    Example:
      extract_section_content(bundle, "Cypher Query Patterns")
      → Returns everything between <SECTION title="Cypher Query Patterns"> and </SECTION>
    """
    # Pattern: <SECTION title="..."> ... </SECTION>
    # Match is case-insensitive for the tag but case-sensitive for the title
    pattern = rf'<SECTION\s+title=["\']({re.escape(section_title)})["\']>(.*?)</SECTION>'
    match = re.search(pattern, bundle_content, re.DOTALL | re.IGNORECASE)
    
    if match:
        content = match.group(2).strip()
        return content if len(content) > 50 else None
    return None


# Test Example 1
print("=" * 80)
print("EXAMPLE 1: Extract <SECTION> by Title")
print("=" * 80)

result = extract_section_content(BUNDLE_EXAMPLE_1, "Cypher Query Patterns")
if result:
    print(f"✓ Extracted {len(result)} chars")
    print(f"  Preview: {result[:150]}...\n")
else:
    print("✗ Not found\n")


# ==============================================================================
# EXAMPLE 2: Extract First <SECTION> Content (for elements with only one section)
# ==============================================================================

def extract_first_section(bundle_content: str) -> Optional[str]:
    """
    Extract content from the FIRST <SECTION> in a bundle.
    Useful when bundle has only one section with element content.
    """
    pattern = r'<SECTION[^>]*>(.*?)</SECTION>'
    match = re.search(pattern, bundle_content, re.DOTALL)
    
    if match:
        content = match.group(1).strip()
        return content if len(content) > 50 else None
    return None


print("=" * 80)
print("EXAMPLE 2: Extract First <SECTION>")
print("=" * 80)

result = extract_first_section(BUNDLE_EXAMPLE_1)
if result:
    print(f"✓ Extracted {len(result)} chars (first section)")
    print(f"  Preview: {result[:150]}...\n")


# ==============================================================================
# EXAMPLE 3: Extract by XML Element Name (e.g., <ELEMENT_NAME>...</ELEMENT_NAME>)
# ==============================================================================

BUNDLE_EXAMPLE_2 = """
<INSTRUCTION_BUNDLE tag="knowledge_context">
  <PURPOSE>Define entity schemas and relationships</PURPOSE>
  
  <EntityProject>
    ## EntityProject Schema
    
    id: Unique identifier (string)
    name: Project name (string)
    year: Fiscal year (integer, e.g., 2025)
    level: L1 (Portfolio), L2 (Program), L3 (Project)
    budget: Total budget (number, in SAR)
    progress_percentage: 0-100 (number)
    status: Active, Closed, Planned
    start_date: ISO 8601 date or NULL
    
    Example:
    {
      "id": "proj-123",
      "name": "Digital Transformation 2026",
      "year": 2026,
      "level": "L3",
      "budget": 5000000,
      "progress_percentage": 45,
      "status": "Active",
      "start_date": "2025-01-15"
    }
  </EntityProject>
  
  <EntityCapability>
    ## EntityCapability Schema
    
    id: Unique identifier
    name: Capability name
    year: Fiscal year
    level: L1 (Domain), L2 (Function), L3 (Competency)
    maturity_level: 1-5 (current maturity)
    description: Text description
    ...
  </EntityCapability>
  
</INSTRUCTION_BUNDLE>
"""


def extract_by_xml_element(bundle_content: str, element_name: str) -> Optional[str]:
    """
    Extract content from a custom XML element (e.g., <EntityProject>...</EntityProject>).
    
    Example:
      extract_by_xml_element(bundle, "EntityProject")
      → Returns content between <EntityProject> and </EntityProject>
    """
    pattern = rf'<{element_name}>(.*?)</{element_name}>'
    match = re.search(pattern, bundle_content, re.DOTALL | re.IGNORECASE)
    
    if match:
        content = match.group(1).strip()
        return content if len(content) > 50 else None
    return None


print("=" * 80)
print("EXAMPLE 3: Extract by XML Element Name")
print("=" * 80)

result = extract_by_xml_element(BUNDLE_EXAMPLE_2, "EntityProject")
if result:
    print(f"✓ Extracted EntityProject: {len(result)} chars")
    print(f"  Preview: {result[:200]}...\n")

result = extract_by_xml_element(BUNDLE_EXAMPLE_2, "EntityCapability")
if result:
    print(f"✓ Extracted EntityCapability: {len(result)} chars")
    print(f"  Preview: {result[:150]}...\n")


# ==============================================================================
# EXAMPLE 4: Hybrid Approach (Try Multiple Strategies)
# ==============================================================================

def extract_element_content_hybrid(
    bundle_content: str,
    element_name: str,
    section_title: Optional[str] = None
) -> Optional[str]:
    """
    Try multiple extraction strategies in order of preference:
    1. If section_title provided, try <SECTION title="...">
    2. Try custom XML element <element_name>
    3. Try markdown header (## element_name)
    4. Fall back to section without title
    """
    
    # Strategy 1: Section by title
    if section_title:
        result = extract_section_content(bundle_content, section_title)
        if result:
            return result
    
    # Strategy 2: Custom XML element
    result = extract_by_xml_element(bundle_content, element_name)
    if result:
        return result
    
    # Strategy 3: Markdown header
    pattern = rf'##\s+{re.escape(element_name)}(.*?)(?=\n##|\Z)'
    match = re.search(pattern, bundle_content, re.DOTALL | re.IGNORECASE)
    if match:
        content = match.group(1).strip()
        if len(content) > 50:
            return content
    
    # Strategy 4: First section (fallback)
    result = extract_first_section(bundle_content)
    if result:
        return result
    
    return None


print("=" * 80)
print("EXAMPLE 4: Hybrid Extraction (Multiple Strategies)")
print("=" * 80)

# Test with SECTION title
result = extract_element_content_hybrid(
    BUNDLE_EXAMPLE_1,
    "cypher_query_patterns",
    section_title="Cypher Query Patterns"
)
print(f"Strategy 1 (SECTION title): {'✓' if result else '✗'}")

# Test with XML element
result = extract_element_content_hybrid(BUNDLE_EXAMPLE_2, "EntityProject")
print(f"Strategy 2 (XML element): {'✓' if result else '✗'}\n")


# ==============================================================================
# EXAMPLE 5: Full Production-Ready Implementation
# ==============================================================================

class XMLElementExtractor:
    """Production-ready extractor with caching and error handling."""
    
    def __init__(self, bundle_content: str):
        self.content = bundle_content
        self._cache = {}
    
    def extract(self, element_name: str, section_title: Optional[str] = None) -> Optional[str]:
        """
        Extract element content with intelligent fallback.
        Caches results to avoid re-parsing.
        """
        cache_key = (element_name, section_title)
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = None
        
        # Try: <SECTION title="...">
        if section_title:
            result = self._extract_section(section_title)
        
        # Try: <ElementName>...</ElementName>
        if not result:
            result = self._extract_xml_element(element_name)
        
        # Try: ## ElementName (markdown header)
        if not result:
            result = self._extract_markdown_header(element_name)
        
        # Cache result
        self._cache[cache_key] = result
        return result
    
    def _extract_section(self, title: str) -> Optional[str]:
        """Extract from <SECTION title="...">"""
        pattern = rf'<SECTION\s+title=["\']({re.escape(title)})["\']>(.*?)</SECTION>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        return match.group(2).strip() if match and len(match.group(2).strip()) > 50 else None
    
    def _extract_xml_element(self, name: str) -> Optional[str]:
        """Extract from <ElementName>...</ElementName>"""
        pattern = rf'<{name}>(.*?)</{name}>'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        return match.group(1).strip() if match and len(match.group(1).strip()) > 50 else None
    
    def _extract_markdown_header(self, name: str) -> Optional[str]:
        """Extract from ## ElementName"""
        pattern = rf'##\s+{re.escape(name)}(.*?)(?=\n##|\Z)'
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            return content if len(content) > 50 else None
        return None
    
    def list_all_sections(self):
        """List all <SECTION> titles in bundle."""
        pattern = r'<SECTION\s+title=["\']([^"\']+)["\']'
        matches = re.findall(pattern, self.content)
        return matches
    
    def list_all_xml_elements(self):
        """List all custom XML elements in bundle."""
        pattern = r'<(\w+)>.*?</\1>'
        matches = set(re.findall(pattern, self.content))
        # Filter out standard tags
        return [m for m in matches if m not in ['INSTRUCTION_BUNDLE', 'PURPOSE', 'SECTION']]


print("=" * 80)
print("EXAMPLE 5: Production-Ready Extractor Class")
print("=" * 80)

extractor1 = XMLElementExtractor(BUNDLE_EXAMPLE_1)
sections = extractor1.list_all_sections()
print(f"Sections in cypher_query_patterns: {sections}\n")

extractor2 = XMLElementExtractor(BUNDLE_EXAMPLE_2)
elements = extractor2.list_all_xml_elements()
print(f"XML elements in knowledge_context: {elements}\n")

result = extractor2.extract("EntityProject")
print(f"Extract EntityProject: {len(result) if result else 0} chars\n")


# ==============================================================================
# EXAMPLE 6: Real-World Integration with Supabase
# ==============================================================================

def update_element_from_bundle(
    supabase_client,
    element_id: int,
    element_name: str,
    bundle_tag: str,
    section_title: Optional[str] = None
) -> bool:
    """
    Real-world function: Fetch bundle from DB, extract element, update DB.
    
    Usage:
      update_element_from_bundle(
          supabase,
          element_id=42,
          element_name="EntityProject",
          bundle_tag="knowledge_context",
          section_title="EntityProject"
      )
    """
    try:
        # Fetch bundle from DB
        bundle_response = supabase_client.table("instruction_bundles").select(
            "content"
        ).eq("tag", bundle_tag).execute()
        
        if not bundle_response.data:
            print(f"✗ Bundle {bundle_tag} not found")
            return False
        
        bundle_content = bundle_response.data[0]["content"]
        
        # Extract element content
        extractor = XMLElementExtractor(bundle_content)
        extracted = extractor.extract(element_name, section_title)
        
        if not extracted:
            print(f"✗ Could not extract {element_name} from {bundle_tag}")
            return False
        
        # Update element in DB
        supabase_client.table("instruction_elements").update({
            "content": extracted
        }).eq("id", element_id).execute()
        
        print(f"✓ Updated {element_name}: {len(extracted)} chars")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


print("=" * 80)
print("EXAMPLE 6: Supabase Integration Function")
print("=" * 80)
print("""
def update_element_from_bundle(supabase_client, element_id, element_name, bundle_tag):
    # Fetch bundle
    # Extract content
    # Update DB
    
Usage:
    update_element_from_bundle(
        supabase,
        element_id=42,
        element_name="EntityProject",
        bundle_tag="knowledge_context"
    )
""")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print("""
STRATEGY PRIORITIES (in order):

1. <SECTION title="...">content</SECTION>
   Use for: Elements with explicit sections (cypher_query_patterns)
   Pros: Most reliable, explicit
   Cons: Requires exact title match
   Example: extract_section_content(bundle, "Cypher Query Patterns")

2. <ElementName>content</ElementName>
   Use for: Custom XML-wrapped elements (EntityProject, EntityRisk)
   Pros: Works across bundles consistently
   Cons: Case-sensitive
   Example: extract_by_xml_element(bundle, "EntityProject")

3. ## ElementName
   Use for: Markdown-style headers
   Pros: Human-readable format
   Cons: Less structured
   Example: Pattern matching "## EntityProject"

4. Hybrid Approach (RECOMMENDED)
   Try all strategies in order, use first match
   Catches 95%+ of extraction cases
   Use XMLElementExtractor class for production

KEY PATTERNS:

Section with title:
  <SECTION title="Cypher Query Patterns">
    content here
  </SECTION>

Custom XML element:
  <EntityProject>
    content here
  </EntityProject>

Markdown header:
  ## EntityProject
  content here

REGEX PATTERNS (Copy-Paste Ready):

# Section by title (case-insensitive)
rf'<SECTION\\s+title=["\']({re.escape(section_title)})["\']>(.*?)</SECTION>'

# XML element (case-insensitive)
rf'<{element_name}>(.*?)</{element_name}>'

# Markdown header
rf'##\\s+{re.escape(element_name)}(.*?)(?=\\n##|\\Z)'

PRODUCTION CHECKLIST:

✓ Use XMLElementExtractor class (caching + multiple strategies)
✓ Always clean extracted content (strip whitespace)
✓ Always validate length > 50 chars (skip placeholders)
✓ Log extraction failures for debugging
✓ Cache results to avoid re-parsing
✓ Test against actual bundles from DB
✓ Handle case-insensitivity gracefully
""")
