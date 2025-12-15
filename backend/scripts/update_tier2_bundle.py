#!/usr/bin/env python3
"""
Update data_mode_definitions bundle with complete Tier 2 content from v3.3 spec.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

# Read the spec file
spec_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'app', 'services', 'cognitive_bootstrap_prompt_v3.3.md'
)

with open(spec_path, 'r') as f:
    content = f.read()

# Extract Tier 2 section
lines = content.split('\n')
tier2_start = None
tier2_end = None

for i, line in enumerate(lines):
    if 'TIER 2: DATA MODE DEFINITIONS' in line:
        tier2_start = i
    if tier2_start and 'TIER 3: INSTRUCTION ELEMENTS' in line:
        tier2_end = i
        break

if tier2_start is None or tier2_end is None:
    print(f"Failed to find Tier 2 section. start={tier2_start}, end={tier2_end}")
    sys.exit(1)

tier2_content = '\n'.join(lines[tier2_start:tier2_end])
print(f"Extracted Tier 2 content: {len(tier2_content)} chars, {len(tier2_content.split())} words")

# Estimate tokens
avg_tokens = len(tier2_content) // 4
print(f"Estimated tokens: ~{avg_tokens}")

# Update the bundle
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

response = supabase.table('instruction_bundles').update({
    'content': tier2_content,
    'avg_tokens': avg_tokens,
    'version': '3.3.0'
}).eq('tag', 'data_mode_definitions').execute()

if response.data:
    print("✓ Successfully updated data_mode_definitions bundle")
else:
    print("✗ Failed to update bundle")
