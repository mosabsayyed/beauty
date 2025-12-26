#!/bin/bash
# Extract code change descriptions from brain artifacts for DependencyDesk and RiskDesk

BRAIN_PATH="/root/.gemini/antigravity/brain/4149ddbc-e9c2-46b7-bf8c-33e6e0c527a8"
OUTPUT_DIR="/home/mosab/projects/chatmodule/josoor-sandbox/diffs"

mkdir -p "$OUTPUT_DIR"

echo "EXTRACTING CODE CHANGES: DependencyDesk & RiskDesk"
echo "=================================================="
echo ""

# Files to process (before disaster at 18:18)
FILES=(
    "walkthrough.md.resolved.0"
    "walkthrough.md.resolved.1"
    "walkthrough.md.resolved.2"
    "walkthrough.md.resolved.3"
    "implementation_plan.md.resolved.0"
    "implementation_plan.md.resolved.1"
    "implementation_plan.md.resolved.2"
    "implementation_plan.md.resolved.3"
    "implementation_plan.md.resolved.4"
    "implementation_plan.md.resolved.5"
    "implementation_plan.md.resolved.8"
    "implementation_plan.md.resolved.9"
    "implementation_plan.md.resolved.10"
    "implementation_plan.md.resolved.11"
    "task.md.resolved.12"
    "task.md.resolved.13"
    "task.md.resolved.14"
    "task.md.resolved.15"
    "task.md.resolved.16"
    "task.md.resolved.17"
    "walkthrough.md.resolved.36"
    "walkthrough.md.resolved.37"
    "task.md.resolved.37"
)

for file in "${FILES[@]}"; do
    filepath="$BRAIN_PATH/$file"
    if [ -f "$filepath" ]; then
        timestamp=$(stat -c '%y' "$filepath" | cut -d' ' -f1-2 | cut -d. -f1)
        
        # Extract DependencyDesk changes
        if grep -q "DependencyDesk" "$filepath"; then
            echo "[$timestamp] $file - DependencyDesk changes found"
            
            # Extract the section about DependencyDesk with context
            awk '/DependencyDesk/{found=1; context=0} found{print; context++} context>50{found=0; context=0}' "$filepath" > "$OUTPUT_DIR/DependencyDesk_${file}.txt"
        fi
        
        # Extract RiskDesk changes
        if grep -q "RiskDesk" "$filepath"; then
            echo "[$timestamp] $file - RiskDesk changes found"
            
            # Extract the section about RiskDesk with context
            awk '/RiskDesk/{found=1; context=0} found{print; context++} context>50{found=0; context=0}' "$filepath" > "$OUTPUT_DIR/RiskDesk_${file}.txt"
        fi
    fi
done

echo ""
echo "Extraction complete. Files saved to: $OUTPUT_DIR"
echo ""
echo "Summary:"
ls -lh "$OUTPUT_DIR" | grep -E "DependencyDesk|RiskDesk" | wc -l
echo "files extracted"
