#!/usr/bin/env python3
"""
Fix Tier 1 prompt and extract real element content from bundles.

This script:
1. Creates cleaned-up Tier 1 text (no excessive markdown)
2. Updates both orchestrators with persona-specific names
3. Creates Tier 2 in instruction_bundles
4. Extracts real content from instruction_bundles into instruction_elements
"""

import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv(Path(__file__).parent.parent / ".env")

from supabase import create_client

# Use service role for admin operations
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(os.getenv("SUPABASE_URL"), service_key)


# ==============================================================================
# TIER 1: CLEANED UP (NO EXCESSIVE MARKDOWN)
# ==============================================================================
TIER_1_CLEAN_NOOR = """
TIER 1: LIGHTWEIGHT BOOTSTRAP (Always Loaded)

YOUR ROLE
You are Noor, the Cognitive Digital Twin of a KSA Government Agency. You operate with one core principle: determine the interaction mode, then route appropriately.

YOUR IDENTITY
- Expert in Graph Databases, Sectoral Economics, Organizational Transformation
- Result of fusing deep expertise with the agency's Institutional Memory
- READ ONLY interface—you interpret, never modify
- Always supportive, vested in agency success, grounded in factual data

STEP 1: MODE CLASSIFICATION

Read the user query. Classify into ONE mode:

Data Modes (A, B, C, D)
  A: Direct lookup/list
  B: Multi-hop analysis, gaps, inference
  C: Follow-up requiring data
  D: Planning, what-if, hypothetical (grounded in data)

Conversational Modes (E, F, G, H, I, J)
  E: Clarification without new data
  F: Exploratory brainstorming
  G: Questions about Noor
  H: Concept explanation
  I: Greetings, social
  J: Ambiguous, needs clarification

CONDITIONAL ROUTING

IF mode in (A, B, C, D):
- Load Tier 2 from database: retrieve_instructions(tier="data_mode_definitions", mode="A|B|C|D")
- Wait for response (contains Steps 2-5 guidance + element instructions)
- Execute as guided by returned instructions
- Make ONE call to retrieve_instructions(tier="elements", mode="A|B|C|D", elements=[...])

ELSE (mode in E, F, G, H, I, J):
- Execute directly using identity/mindset below
- Output using format below
- May optionally call recall_memory(scope="personal", query_summary="<user context>") for contextual enrichment
- NO data retrieval needed

MEMORY INTEGRATION (Available to All Modes - Query Optionally)

Semantic memory available via recall_memory(scope="personal|departmental|ministry", query_summary="...") when enrichment helps.
Memory scopes with hierarchical access control (Noor has no visibility of any secret tier):

1. Personal — User's conversation history and preferences (user-scoped)
2. Departmental — Department-level facts and patterns (department-scoped)
3. Ministry — Ministry-level strategic information (ministry-scoped)

Call pattern: recall_memory(scope="personal", query_summary="<specific context for recall>")
Cost: ~150-300 tokens per call (returns matched entities and relations only)
Storage: Neo4j as Entity/Relation/Observations graphs partitioned by scope
CRITICAL: You MUST specify the scope explicitly. Noor cannot access 'secrets' scope.

MINDSET (For All Modes)
- Always supportive and eager to help
- Vested in the agency's success through staff success
- Listen with intent, empathy, and genuine understanding
- Offer best advice based on factual data
- Bias for action: Do NOT ask for minor clarifications; make professional choices

TEMPORAL LOGIC (Vantage Point)
Today is <datetoday>. All records are timestamped with quarters and years.

Critical temporal rules:
- Projects with start dates in the future = Planned (0% completion regardless of stored value)
- Projects with start dates in the past = Active or Closed (based on progress_percentage)
- Identify delays: Compare expected progress (date-based) vs actual progress

OUTPUT FORMAT (All Modes)
{
  "memory_process": {
    "intent": "User intent",
    "thought_trace": "Your reasoning"
  },
  "answer": "Business-language narrative",
  "analysis": ["Insight 1", "Insight 2"],
  "data": {
    "query_results": [...],
    "summary_stats": {...}
  },
  "visualizations": [],
  "cypher_executed": "MATCH...",
  "confidence": 0.95
}

CRITICAL RULES
- NO streaming. Synchronous responses only.
- NO comments in JSON. Strict valid JSON.
- Trust tool results. Do NOT re-query to verify.
- Business language only. Never mention: Node, Cypher, L3, ID, Query, Embedding.
"""

TIER_1_CLEAN_MAESTRO = TIER_1_CLEAN_NOOR.replace("You are Noor", "You are Maestro").replace("Questions about Noor", "Questions about Maestro").replace("Noor has no visibility", "Maestro has access to secrets scope")


def extract_element_content_from_bundle(bundle_content, element_name):
    """
    Extract specific element content from a bundle.
    
    Looks for patterns like:
    - <element_name>...</element_name>
    - ## element_name ... (until next ##)
    - ### element_name ... (until next ###)
    """
    # Try XML-style tags
    pattern1 = rf'<{element_name}>(.*?)</{element_name}>'
    match = re.search(pattern1, bundle_content, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Try markdown headers (## or ###)
    pattern2 = rf'###+\s*{element_name}(.*?)(?=\n###+|\Z)'
    match = re.search(pattern2, bundle_content, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Try as section title with content until next major section
    pattern3 = rf'{element_name}[:\s]+(.*?)(?=\n[A-Z]{{2,}}|\Z)'
    match = re.search(pattern3, bundle_content, re.DOTALL | re.IGNORECASE)
    if match:
        content = match.group(1).strip()
        if len(content) > 50:  # Only return if substantial
            return content
    
    return None


def main():
    print("=" * 80)
    print("TIER 1 & ELEMENTS FIXER")
    print("=" * 80)
    
    # Step 1: Update orchestrator_noor.py
    print("\n[1/5] Updating orchestrator_noor.py with cleaned Tier 1...")
    noor_path = Path(__file__).parent.parent / "app" / "services" / "orchestrator_noor.py"
    with open(noor_path, 'r') as f:
        noor_content = f.read()
    
    # Find and replace COGNITIVE_CONT_BUNDLE
    pattern = r'COGNITIVE_CONT_BUNDLE = """.*?"""'
    replacement = f'COGNITIVE_CONT_BUNDLE = """\n{TIER_1_CLEAN_NOOR}\n"""'
    noor_content = re.sub(pattern, replacement, noor_content, flags=re.DOTALL)
    
    with open(noor_path, 'w') as f:
        f.write(noor_content)
    print(f"  ✓ Updated {noor_path}")
    
    # Step 2: Update orchestrator_maestro.py
    print("\n[2/5] Updating orchestrator_maestro.py with cleaned Tier 1...")
    maestro_path = Path(__file__).parent.parent / "app" / "services" / "orchestrator_maestro.py"
    with open(maestro_path, 'r') as f:
        maestro_content = f.read()
    
    maestro_content = re.sub(pattern, f'COGNITIVE_CONT_BUNDLE = """\n{TIER_1_CLEAN_MAESTRO}\n"""', maestro_content, flags=re.DOTALL)
    
    with open(maestro_path, 'w') as f:
        f.write(maestro_content)
    print(f"  ✓ Updated {maestro_path}")
    
    # Step 3: Read Tier 2 from MD file and insert into instruction_bundles
    print("\n[3/5] Creating Tier 2 data_mode_definitions in instruction_bundles...")
    md_path = Path(__file__).parent.parent / "app" / "services" / "cognitive_bootstrap_prompt_v3.3.md"
    with open(md_path, 'r') as f:
        md_content = f.read()
    
    # Extract Tier 2 section
    tier2_match = re.search(r'## TIER 2: DATA MODE DEFINITIONS.*?(?=## TIER 3:|$)', md_content, re.DOTALL)
    if tier2_match:
        tier2_content = tier2_match.group(0).strip()
        
        # Check if already exists
        check = supabase.table("instruction_bundles").select("id").eq("tag", "data_mode_definitions").execute()
        
        if check.data:
            print("  ⚠ data_mode_definitions already exists, updating...")
            supabase.table("instruction_bundles").update({
                "content": tier2_content
            }).eq("tag", "data_mode_definitions").execute()
        else:
            print("  ✓ Inserting data_mode_definitions...")
            supabase.table("instruction_bundles").insert({
                "tag": "data_mode_definitions",
                "path_name": "tier2_data_mode_definitions",
                "content": tier2_content,
                "category": "core",
                "status": "active",
                "version": "3.3.0"
            }).execute()
        
        # Update instruction_metadata to route modes A/B/C/D to this bundle
        metadata_check = supabase.table("instruction_metadata").select("tag").eq("tag", "data_mode_definitions").execute()
        if not metadata_check.data:
            supabase.table("instruction_metadata").insert({
                "tag": "data_mode_definitions",
                "trigger_modes": ["A", "B", "C", "D"],
                "compatible_with": []
            }).execute()
            print("  ✓ Created instruction_metadata entry for data_mode_definitions")
    
    # Step 4: Extract real content from bundles into elements
    print("\n[4/5] Extracting real content from bundles into instruction_elements...")
    
    # Get all bundles
    bundles_response = supabase.table("instruction_bundles").select("tag, content").execute()
    bundles = {b["tag"]: b["content"] for b in bundles_response.data}
    
    # Get all elements
    elements_response = supabase.table("instruction_elements").select("id, bundle, element, content").execute()
    elements = elements_response.data
    
    updated_count = 0
    for elem in elements:
        elem_id = elem["id"]
        bundle_tag = elem["bundle"]
        element_name = elem["element"]
        current_content = elem["content"]
        
        # Check if placeholder
        if "[Content from" in current_content or "[PLACEHOLDER]" in current_content or "to be refined" in current_content:
            # Try to extract from bundle
            if bundle_tag in bundles:
                extracted = extract_element_content_from_bundle(bundles[bundle_tag], element_name)
                if extracted and len(extracted) > 50:
                    supabase.table("instruction_elements").update({
                        "content": extracted
                    }).eq("id", elem_id).execute()
                    print(f"  ✓ Updated {element_name} from {bundle_tag} ({len(extracted)} chars)")
                    updated_count += 1
                else:
                    print(f"  ⚠ Could not extract {element_name} from {bundle_tag}")
    
    print(f"\n  Total elements updated: {updated_count}")
    
    # Step 5: Summary
    print("\n[5/5] Summary")
    print("=" * 80)
    print(f"✓ Tier 1 updated in orchestrator_noor.py (Noor persona)")
    print(f"✓ Tier 1 updated in orchestrator_maestro.py (Maestro persona)")
    print(f"✓ Tier 2 data_mode_definitions created/updated in instruction_bundles")
    print(f"✓ {updated_count} instruction_elements updated with real content")
    print("\nNext steps:")
    print("1. Verify orchestrators: grep 'You are' backend/app/services/orchestrator_*.py")
    print("2. Test Tier 2 retrieval: check data_mode_definitions in Supabase")
    print("3. Verify elements no longer have placeholders")


if __name__ == "__main__":
    main()
