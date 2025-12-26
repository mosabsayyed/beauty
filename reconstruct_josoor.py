#!/usr/bin/env python3
"""
Josoor Component Reconstruction Script
Extracts code changes from Antigravity brain artifacts and reconstructs components.

Usage: python3 reconstruct_josoor.py DependencyDesk RiskDesk
"""

import os
import re
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

# Configuration
BRAIN_PATH = "/root/.gemini/antigravity/brain/4149ddbc-e9c2-46b7-bf8c-33e6e0c527a8"
SANDBOX_PATH = "/home/mosab/projects/chatmodule/josoor-sandbox/components"
POINT_A_PATH = "/home/mosab/projects/chatmodule/josoor-sandbox/components/components"

# Target components (passed as arguments)
TARGET_COMPONENTS = sys.argv[1:] if len(sys.argv) > 1 else ["DependencyDesk", "RiskDesk"]

def get_file_timestamp(filepath: str) -> datetime:
    """Get modification timestamp of file"""
    stat = os.stat(filepath)
    return datetime.fromtimestamp(stat.st_mtime)

def get_artifact_files() -> List[Tuple[datetime, str]]:
    """Get all brain artifact files sorted by timestamp"""
    files = []
    patterns = ["implementation_plan.md.resolved*", "task.md.resolved*", "walkthrough.md.resolved*"]
    
    for pattern in patterns:
        pattern_path = f"{BRAIN_PATH}/{pattern}"
        for filepath in Path(BRAIN_PATH).glob(pattern.replace("*", "*")):
            if filepath.is_file() and not filepath.name.endswith(('.meta', '.metadata.json', '.png')):
                timestamp = get_file_timestamp(str(filepath))
                files.append((timestamp, str(filepath)))
    
    return sorted(files, key=lambda x: x[0])

def extract_code_blocks(filepath: str, component_name: str) -> List[Dict]:
    """Extract TSX code blocks for a specific component from artifact file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find component mentions
    if component_name not in content:
        return []
    
    code_blocks = []
    
    # Pattern 1: Full component code blocks
    pattern = r'```tsx\n(.*?)\n```'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        code = match.group(1)
        # Check if this code block contains the component
        if f'{component_name}' in code or f'export const {component_name}' in code:
            code_blocks.append({
                'type': 'full_component',
                'code': code,
                'context': content[max(0, match.start()-200):match.end()+200]
            })
    
    # Pattern 2: Inline code changes mentioned in text
    pattern = r'`{component_name}[^`]*`'
    mentions = re.finditer(pattern.replace('{component_name}', component_name), content)
    
    for mention in mentions:
        context = content[max(0, mention.start()-300):mention.end()+300]
        code_blocks.append({
            'type': 'mention',
            'code': mention.group(0),
            'context': context
        })
    
    return code_blocks

def extract_diff_description(filepath: str, component_name: str) -> str:
    """Extract human-readable description of changes"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Look for component file references
    pattern = rf'#{component_name}\.tsx.*?\n\n(.*?)(?=\n##|\n###|\n```|$)'
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    # Alternative: look for bullet points near component name
    lines = content.split('\n')
    descriptions = []
    in_relevant_section = False
    
    for i, line in enumerate(lines):
        if component_name in line:
            in_relevant_section = True
        elif in_relevant_section and (line.startswith('#') or line.startswith('##')):
            break
        elif in_relevant_section and (line.startswith('-') or line.startswith('*')):
            descriptions.append(line.strip())
    
    return '\n'.join(descriptions) if descriptions else ""

def build_reconstruction_log(component_name: str) -> List[Dict]:
    """Build chronological log of all changes to a component"""
    print(f"\n{'='*80}")
    print(f"RECONSTRUCTING: {component_name}.tsx")
    print(f"{'='*80}\n")
    
    artifact_files = get_artifact_files()
    changes = []
    
    print(f"Scanning {len(artifact_files)} brain artifact files...\n")
    
    for timestamp, filepath in artifact_files:
        filename = os.path.basename(filepath)
        
        # Extract code blocks
        code_blocks = extract_code_blocks(filepath, component_name)
        diff_desc = extract_diff_description(filepath, component_name)
        
        if code_blocks or diff_desc:
            change_entry = {
                'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'file': filename,
                'filepath': filepath,
                'code_blocks': code_blocks,
                'description': diff_desc
            }
            changes.append(change_entry)
            
            print(f"[{timestamp.strftime('%Y-%m-%d %H:%M')}] {filename}")
            if code_blocks:
                print(f"  └─ Found {len(code_blocks)} code block(s)")
            if diff_desc:
                print(f"  └─ Description: {diff_desc[:80]}...")
    
    print(f"\nTotal changes found: {len(changes)}")
    return changes

def write_reconstruction_report(component_name: str, changes: List[Dict], output_path: str):
    """Write detailed reconstruction report"""
    report = f"""# {component_name}.tsx Reconstruction Report

## Summary
- Total versions tracked: {len(changes)}
- Timeline: {changes[0]['timestamp'] if changes else 'N/A'} → {changes[-1]['timestamp'] if changes else 'N/A'}

## Chronological Changes

"""
    
    for i, change in enumerate(changes, 1):
        report += f"\n### Version {i}: {change['file']}\n"
        report += f"**Timestamp:** {change['timestamp']}\n\n"
        
        if change['description']:
            report += f"**Changes:**\n{change['description']}\n\n"
        
        for j, block in enumerate(change['code_blocks'], 1):
            report += f"**Code Block {j} ({block['type']}):**\n"
            report += f"```tsx\n{block['code'][:500]}...\n```\n\n"
    
    report += "\n## Reconstruction Instructions\n\n"
    report += "1. Start with Point A baseline from sandbox\n"
    report += "2. Apply each version's changes sequentially\n"
    report += "3. Verify build after final application\n"
    
    with open(output_path, 'w') as f:
        f.write(report)
    
    print(f"\n✓ Report saved to: {output_path}")

def extract_latest_full_code(changes: List[Dict]) -> str:
    """Extract the most recent full component code"""
    for change in reversed(changes):
        for block in change['code_blocks']:
            if block['type'] == 'full_component' and len(block['code']) > 100:
                return block['code']
    return None

def save_reconstructed_component(component_name: str, code: str, output_path: str):
    """Save reconstructed component to file"""
    filepath = f"{output_path}/{component_name}.tsx"
    with open(filepath, 'w') as f:
        f.write(code)
    print(f"\n✓ Reconstructed component saved to: {filepath}")

def main():
    print(f"\nJOSOOR COMPONENT RECONSTRUCTION")
    print(f"{'='*80}")
    print(f"Brain artifacts: {BRAIN_PATH}")
    print(f"Point A baseline: {POINT_A_PATH}")
    print(f"Output: {SANDBOX_PATH}")
    print(f"Target components: {', '.join(TARGET_COMPONENTS)}")
    
    # Create output directory
    os.makedirs(f"{SANDBOX_PATH}/reconstructed", exist_ok=True)
    os.makedirs(f"{SANDBOX_PATH}/reports", exist_ok=True)
    
    for component in TARGET_COMPONENTS:
        # Build reconstruction log
        changes = build_reconstruction_log(component)
        
        # Write report
        report_path = f"{SANDBOX_PATH}/reports/{component}_reconstruction.md"
        write_reconstruction_report(component, changes, report_path)
        
        # Try to extract latest full code
        latest_code = extract_latest_full_code(changes)
        if latest_code:
            save_reconstructed_component(
                component, 
                latest_code, 
                f"{SANDBOX_PATH}/reconstructed"
            )
        else:
            print(f"\n⚠ No full component code found for {component}.tsx")
            print("  Manual reconstruction required using report.")
    
    print(f"\n{'='*80}")
    print("RECONSTRUCTION COMPLETE")
    print(f"{'='*80}\n")
    print(f"Next steps:")
    print(f"1. Review reports in: {SANDBOX_PATH}/reports/")
    print(f"2. Compare reconstructed files with Point A baseline")
    print(f"3. Apply manual diffs if needed")
    print(f"4. Run: npm run build")

if __name__ == "__main__":
    main()
