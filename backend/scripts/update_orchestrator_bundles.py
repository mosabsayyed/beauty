#!/usr/bin/env python3
"""
Extract Tier 1 from cognitive_bootstrap_prompt_v3.3.md and update orchestrators

This script:
1. Reads cognitive_bootstrap_prompt_v3.3.md
2. Extracts only TIER 1 content (lines before "## TIER 2")
3. Creates properly formatted COGNITIVE_CONT_BUNDLE string for Python
4. Updates orchestrator_noor.py and orchestrator_maestro.py
"""

import re
from pathlib import Path

# Paths
REPO_ROOT = Path("/home/mosab/projects/chatmodule")
BOOTSTRAP_PROMPT = REPO_ROOT / "backend/app/services/cognitive_bootstrap_prompt_v3.3.md"
ORCHESTRATOR_NOOR = REPO_ROOT / "backend/app/services/orchestrator_noor.py"
ORCHESTRATOR_MAESTRO = REPO_ROOT / "backend/app/services/orchestrator_maestro.py"

def extract_tier1(markdown_content: str) -> str:
    """
    Extract TIER 1 from markdown (everything before ## TIER 2)
    Returns the content as plain text (markdown formatting preserved)
    """
    # Find the line containing "## TIER 2"
    lines = markdown_content.split('\n')
    tier1_end = 0
    
    for i, line in enumerate(lines):
        if line.strip().startswith("## TIER 2:"):
            tier1_end = i
            break
    
    # Get lines from start until TIER 2
    tier1_lines = lines[:tier1_end]
    
    # Remove the first two lines (title and TIER 1 marker) to get just the content
    # Line 0: # Cognitive Bootstrap...
    # Line 1: blank
    # Line 2: ## TIER 1:...
    # Line 3: blank
    # Content starts at line 4
    
    # Actually, keep from line 0 but skip the markdown markers for Python
    # We want: "Your Role", "Your Identity", etc.
    
    # Find where "### Your Role" starts
    content_start = 0
    for i, line in enumerate(tier1_lines):
        if line.startswith("### Your Role"):
            content_start = i
            break
    
    # Get content and clean it
    tier1_content = '\n'.join(tier1_lines[content_start:]).rstrip()
    
    return tier1_content

def create_python_bundle(tier1_content: str) -> str:
    """
    Convert tier1 content to Python triple-quoted string format
    Escapes any triple quotes and formats properly
    """
    # Escape any existing triple quotes in the content
    escaped_content = tier1_content.replace('"""', r'\"\"\"')
    
    # Create the Python bundle variable assignment
    python_bundle = f'''COGNITIVE_CONT_BUNDLE = """
{escaped_content}
"""'''
    
    return python_bundle

def update_orchestrator_noor(new_bundle: str) -> None:
    """Update orchestrator_noor.py with new COGNITIVE_CONT_BUNDLE"""
    
    # Read current file
    with open(ORCHESTRATOR_NOOR, 'r') as f:
        content = f.read()
    
    # Find and replace the COGNITIVE_CONT_BUNDLE assignment
    # Pattern: from "COGNITIVE_CONT_BUNDLE = \"\"\"" to the closing """
    pattern = r'COGNITIVE_CONT_BUNDLE = """.*?"""'
    
    # Find the match
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("❌ Could not find COGNITIVE_CONT_BUNDLE in orchestrator_noor.py")
        return False
    
    # Replace
    updated_content = content[:match.start()] + new_bundle + content[match.end():]
    
    # Write back
    with open(ORCHESTRATOR_NOOR, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Updated orchestrator_noor.py (replaced {len(match.group())} chars)")
    return True

def update_orchestrator_maestro(new_bundle_noor: str, add_maestro_guidance: bool = True) -> None:
    """Update orchestrator_maestro.py with Tier 1 + secrets scope guidance"""
    
    # Read current file
    with open(ORCHESTRATOR_MAESTRO, 'r') as f:
        content = f.read()
    
    # Start with the Noor bundle
    maestro_bundle = new_bundle_noor
    
    # If we want to add maestro-specific guidance about secrets scope
    if add_maestro_guidance:
        # Insert before the closing """ 
        maestro_addition = '''

### Secrets Scope (Maestro Only)

You have access to a **secrets** scope in memory for sensitive, executive-level information:
- **Secrets** — Confidential strategic decisions, security assessments, executive briefings
- Use `recall_memory(scope="secrets", query_summary="...")` only for executive contexts
- Example: "The Minister asked about sensitive budget allocations → use secrets scope"
- Noor does NOT have access to this scope and will reject any attempt to use it

**Call pattern:** `recall_memory(scope="secrets", query_summary="<executive context>")`
'''
        # Insert before closing """
        maestro_bundle = maestro_bundle.replace('"""', maestro_addition + '\n"""', 1)  # Replace only first occurrence of closing """
    
    # Find and replace in orchestrator_maestro.py
    pattern = r'COGNITIVE_CONT_BUNDLE = """.*?"""'
    
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("❌ Could not find COGNITIVE_CONT_BUNDLE in orchestrator_maestro.py")
        return False
    
    # Replace
    updated_content = content[:match.start()] + maestro_bundle + content[match.end():]
    
    # Write back
    with open(ORCHESTRATOR_MAESTRO, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Updated orchestrator_maestro.py (replaced {len(match.group())} chars)")
    return True

def main():
    print("[TIER 1 EXTRACTION & ORCHESTRATOR UPDATE]\n")
    
    # Step 1: Read bootstrap prompt
    if not BOOTSTRAP_PROMPT.exists():
        print(f"❌ {BOOTSTRAP_PROMPT} not found")
        return False
    
    with open(BOOTSTRAP_PROMPT, 'r') as f:
        markdown_content = f.read()
    print(f"✅ Read {BOOTSTRAP_PROMPT}")
    
    # Step 2: Extract Tier 1
    tier1_content = extract_tier1(markdown_content)
    print(f"✅ Extracted Tier 1 ({len(tier1_content)} chars)")
    
    # Step 3: Create Python bundle
    python_bundle = create_python_bundle(tier1_content)
    print(f"✅ Created Python bundle ({len(python_bundle)} chars)")
    
    # Step 4: Update orchestrator_noor.py
    update_orchestrator_noor(python_bundle)
    
    # Step 5: Update orchestrator_maestro.py (with secrets guidance)
    update_orchestrator_maestro(python_bundle, add_maestro_guidance=True)
    
    print("\n[COMPLETE]")
    print("✅ Both orchestrators updated with latest Tier 1 from bootstrap prompt")
    print("✅ Maestro includes additional secrets scope guidance")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
