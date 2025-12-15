"""
Tier 1 Assembler - Loads atomic elements from database and assembles them
into the Tier 1 prompt (Step 0 + Step 5)

Architecture:
- Tier 1 elements stored as atomic pieces in instruction_elements table
- Python loads and assembles them in correct order
- Result injected as static prefix in orchestrator
"""

import os
import re
from typing import Dict, List
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)

def load_tier1_elements(persona: str = "noor") -> List[Dict]:
    """
    Load Tier 1 elements from database for specific persona
    
    Args:
        persona: Either "noor" or "maestro"
    
    Returns:
        List of elements sorted by element name (which has numeric prefix for ordering)
    """
    client = get_supabase_client()

    # Preferred schema (normalized):
    # - bundle is exactly "tier1"
    # - element names have a numeric prefix for ordering (e.g., "0.1_mode_classification")
    # - Step 0 + Step 5 are represented as major prefixes 0.* and 5.*
    normalized = (
        client.table("instruction_elements")
        .select("bundle, element, content, avg_tokens")
        .eq("bundle", "tier1")
        .eq("status", "active")
        .order("element")
        .execute()
    )
    normalized_rows = normalized.data if normalized.data else []

    def _is_tier1_step0_or_step5(element_name: str) -> bool:
        if not element_name:
            return False
        if not re.match(r"^\d+(?:\.\d+)*_", element_name):
            return False
        return element_name.startswith("0.") or element_name.startswith("5.")

    normalized_rows = [
        row for row in normalized_rows
        if _is_tier1_step0_or_step5(row.get("element", ""))
    ]

    return normalized_rows

def assemble_tier1_prompt(persona: str = "noor") -> str:
    """
    Assemble Tier 1 prompt from atomic database elements
    
    Args:
        persona: Either "noor" or "maestro"
    
    Returns:
        Complete Tier 1 prompt string with persona replacements
    """
    elements = load_tier1_elements(persona=persona)
    content = "\n\n".join([elem["content"] for elem in elements])
    
    # Replace persona placeholder
    persona_name = persona.capitalize()
    content = content.replace("<persona>", persona_name)
    
    # Replace memory scopes based on persona
    if persona.lower() == "noor":
        memory_text = "personal, departmental, ministry. Secrets scope is not exposed to Noor."
    else:  # maestro
        memory_text = "personal, departmental, ministry, secrets. Use secrets only for executive contexts."
    
    content = content.replace("<memory_scopes>", memory_text)
    
    return content

def get_tier1_token_count(persona: str = "noor") -> Dict[str, int]:
    """
    Get token count statistics for Tier 1 elements for specific persona
    
    Args:
        persona: Either "noor" or "maestro"
    
    Returns:
        Dict with total_tokens and element_count
    """
    elements = load_tier1_elements(persona=persona)
    
    return {
        "total_tokens": sum(elem["avg_tokens"] for elem in elements),
        "element_count": len(elements)
    }

# Cache the assembled prompts per persona to avoid repeated DB calls
_cached_tier1_prompts = {}

def get_tier1_prompt(persona: str = "noor", use_cache: bool = True) -> str:
    """
    Get Tier 1 prompt (with per-persona caching)
    
    Args:
        persona: Either "noor" or "maestro"
        use_cache: If True, use cached version after first load
        
    Returns:
        Complete Tier 1 prompt string with persona-specific content
    """
    global _cached_tier1_prompts
    
    if not use_cache or persona not in _cached_tier1_prompts:
        _cached_tier1_prompts[persona] = assemble_tier1_prompt(persona)
    
    return _cached_tier1_prompts[persona]

def refresh_tier1_cache(persona: str = None):
    """
    Force refresh of Tier 1 prompt cache
    
    Args:
        persona: If specified, refresh only that persona. If None, refresh all.
    """
    global _cached_tier1_prompts
    
    if persona:
        _cached_tier1_prompts.pop(persona, None)
    else:
        _cached_tier1_prompts = {}
