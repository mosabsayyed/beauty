import pytest
from app.services.prompt_service import StaticPromptService

def test_static_prompt_service_initialization():
    service = StaticPromptService()
    assert service is not None

def test_get_tier1_prompt_universal():
    """
    In v3.4, Tier 1 is a universal bootstrap.
    We test that it contains the core identity and classification logic.
    """
    service = StaticPromptService()
    # Test with any persona, should return the same universal prompt
    prompt = service.get_tier1_prompt("noor")
    
    # Assertions based on COGNITIVE_ARCHITECTURE_SPECIFICATION.md content
    assert "TIER 1: LIGHTWEIGHT BOOTSTRAP (ALWAYS LOADED)" in prompt
    assert "You are a Cognitive Digital Twin" in prompt
    assert "5-Step Cognitive Control Loop" in prompt
    assert "INTERACTION MODE CLASSIFICATION" in prompt
    assert "**A (Simple Query):**" in prompt
    assert "**J (Underspecified):**" in prompt

def test_get_tier2_bundle_mode_a():
    service = StaticPromptService()
    bundle = service.get_tier2_bundle("A")
    
    # Assertions based on the XML structure in the spec
    assert '<element name="step1_requirements">' in bundle
    assert "STEP 1: REQUIREMENTS (Pre-Analysis)" in bundle
    assert "Memory Call: Mandatory hierarchical memory recall" in bundle
    assert "Gap Types (4 TYPES ONLY):" in bundle
    
    # Check for Step 2 content
    assert '<element name="step2_recollect">' in bundle
    assert "STEP 2: RECOLLECT (Atomic Element Retrieval)" in bundle

def test_get_tier2_bundle_fallback():
    """
    Test that other modes fallback to a valid bundle (currently Mode A structure)
    or don't crash.
    """
    service = StaticPromptService()
    bundle = service.get_tier2_bundle("B")
    assert "STEP 1: REQUIREMENTS" in bundle

def test_get_tier3_element_project():
    service = StaticPromptService()
    element = service.get_tier3_element("EntityProject")
    
    # Assertions based on the specific EntityProject schema in the spec
    assert '<element name="EntityProject">' in element
    assert "**EntityProject Node**" in element
    assert "progress_percentage (number): 0-100" in element
    assert "[:CLOSE_GAPS]->(EntityOrgUnit|EntityProcess|EntityITSystem)" in element

def test_get_tier3_element_chart():
    service = StaticPromptService()
    element = service.get_tier3_element("chart_type_Column")
    
    assert '<element name="chart_type_Column">' in element
    assert "**Column Chart (type: \"column\")**" in element
    assert '"config": { "xAxis": "category_field", "yAxis": "value_field" }' in element

def test_get_tier3_element_invalid():
    service = StaticPromptService()
    with pytest.raises(ValueError):
        service.get_tier3_element("NonExistentElement")
