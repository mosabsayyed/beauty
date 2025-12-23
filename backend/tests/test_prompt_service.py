import pytest
from app.services.prompt_service import StaticPromptService

def test_static_prompt_service_initialization():
    service = StaticPromptService()
    assert service is not None

def test_get_tier1_prompt_noor():
    service = StaticPromptService()
    prompt = service.get_tier1_prompt("noor")
    assert "TIER 1: LIGHTWEIGHT BOOTSTRAP" in prompt
    assert "Noor agent attempted forbidden scope" not in prompt # Should not have Python code, just instructions
    # Check for Noor specific constraints
    assert "You have READ-ONLY access to:" in prompt
    assert "FORBIDDEN from accessing: `secrets`, `csuite`" in prompt

def test_get_tier1_prompt_maestro():
    service = StaticPromptService()
    prompt = service.get_tier1_prompt("maestro")
    assert "TIER 1: LIGHTWEIGHT BOOTSTRAP" in prompt
    # Maestro should have broader access
    assert "READ/WRITE access to ALL scopes" in prompt

def test_get_tier1_prompt_invalid_persona():
    service = StaticPromptService()
    # Should default to Noor or handle gracefully
    prompt = service.get_tier1_prompt("invalid_persona")
    assert "TIER 1: LIGHTWEIGHT BOOTSTRAP" in prompt
    # Default is Noor
    assert "FORBIDDEN from accessing: `secrets`, `csuite`" in prompt

def test_get_tier2_bundle_mode_a():
    service = StaticPromptService()
    bundle = service.get_tier2_bundle("A")
    assert "STEP 1: REQUIREMENTS" in bundle
    assert "STEP 2: RECOLLECT" in bundle

def test_get_tier2_bundle_invalid_mode():
    service = StaticPromptService()
    with pytest.raises(ValueError):
        service.get_tier2_bundle("Z")

def test_get_tier3_element_project():
    service = StaticPromptService()
    element = service.get_tier3_element("EntityProject")
    assert "**EntityProject Node**" in element
    assert "progress_percentage" in element

def test_get_tier3_element_chart():
    service = StaticPromptService()
    element = service.get_tier3_element("chart_type_Column")
    assert "**Column Chart (type: \"column\")**" in element

def test_get_tier3_element_invalid():
    service = StaticPromptService()
    with pytest.raises(ValueError):
        service.get_tier3_element("NonExistentElement")