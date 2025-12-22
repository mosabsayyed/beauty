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

def _sort_tier1_elements(elements: List[Dict]) -> List[Dict]:
    """
    Reorder Tier 1 elements: context/rules/identity BEFORE instructions/format.
    
    CRITICAL: Front-load all foundational context, rules, and identity BEFORE procedural instructions.
    This ensures the LLM understands the "why" and "what you must know" before the "how".
    
    Step 0 order (Classification & Routing):
      1. remember (bootstrap context) → 0.0_step0_remember
      2. mindset_all_modes (identity anchor) → 0.6_step0_mindset_all_modes
      3. memory_access_rules (constraints) → 0.3_step0_memory_access_rules
      4. dedup_rule & forbidden (rules) → 0.4_*, 0.5_*
      5. mode_classification, conditional_routing (instructions) → 0.1_*, 0.2_*
    
    Step 5 order (Response Format):
      1. rules_of_thumb (foundational rules) → 5.5_step5_rules_of_thumb
      2. synthesis_mandate, business_translation (context) → 5.0_0_*, 5.1_*
      3. respond, return, workflow_steps (instructions) → 5.0_*, 5.0_1_*
      4. output_format, evidence_gating, visualization (format) → 5.2_*, 5.3_*, 5.4_*
    """
    def name(elem: Dict) -> str:
        return (elem.get("element") or "").lower()

    step0 = [e for e in elements if name(e).startswith("0.")]
    step5 = [e for e in elements if name(e).startswith("5.")]
    others = [e for e in elements if e not in step0 and e not in step5]

    def rank_step0(n: str) -> tuple:
        """Rank Step 0: remember → mindset → rules → instructions."""
        # 1. Bootstrap context (remember)
        if "remember" in n:
            return (1, n)
        # 2. Identity/Mindset
        if "mindset" in n:
            return (2, n)
        # 3. Rules (memory access, dedup, forbidden)
        if any(k in n for k in ["memory_access", "dedup", "forbidden"]):
            return (3, n)
        # 4. Instructions (mode_classification, routing, conditional)
        return (4, n)

    def rank_step5(n: str) -> tuple:
        """Rank Step 5: rules → synthesis/context → response → format."""
        # 1. Foundational rules
        if "rules_of_thumb" in n or ("thumb" in n and "rules" in n):
            return (1, n)
        # 2. Context/Synthesis (synthesis_mandate, business_translation)
        if any(k in n for k in ["synthesis", "business_translation"]):
            return (2, n)
        # 3. Response instructions (respond, return, workflow_steps)
        if any(k in n for k in ["respond", "return", "workflow"]):
            return (3, n)
        # 4. Format/Evidence (output_format, evidence_gating, visualization)
        if any(k in n for k in ["output_format", "evidence", "visualization"]):
            return (4, n)
        # Default: late in sequence
        return (5, n)

    step0_sorted = sorted(step0, key=lambda e: rank_step0(name(e)))
    step5_sorted = sorted(step5, key=lambda e: rank_step5(name(e)))

    return step0_sorted + step5_sorted + others


def assemble_tier1_prompt(persona: str = "noor") -> str:
    """
    Assemble Tier 1 prompt strictly from atomic database elements.
    
    Note: No additional preambles, separators, or injected text are added.
    Only DB field contents are concatenated in the determined order.
    
    Args:
        persona: Either "noor" or "maestro"
    
    Returns:
        Complete Tier 1 prompt string composed solely of DB element contents
    """
    elements = load_tier1_elements(persona=persona)

    # Front-load context & rules before instructions for better reasoning
    elements = _sort_tier1_elements(elements)

    # Safe join: ensure clear separation between atomic DB elements.
    # Adds only newline characters (no letters or extra text) to prevent accidental word merging.
    contents: List[str] = [elem.get("content", "") for elem in elements]
    content = "\n\n".join(contents)

    # Do not perform placeholder replacements; keep content exactly as stored in DB (besides spacing between elements)
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
    
    # Handle None values gracefully: treat None as 0
    total_tokens = sum(elem["avg_tokens"] if elem["avg_tokens"] is not None else 0 for elem in elements)
    
    return {
        "total_tokens": total_tokens,
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
