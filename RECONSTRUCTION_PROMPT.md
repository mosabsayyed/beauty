# JOSOOR Component Reconstruction Task

## Mission
Reconstruct `DependencyDesk.tsx` and `RiskDesk.tsx` by applying chronological change descriptions to git baseline files.

---

## Point A: Git Baseline (Dec 23 18:43)

**Location:** `/home/mosab/projects/chatmodule/josoor-sandbox/components/components/`

### DependencyDesk.tsx
- **File:** `josoor-sandbox/components/components/DependencyDesk.tsx`
- **Size:** 355 lines
- **Source:** Git commit `fd3d7f5` from `frontend/src/pages/josoor-v2/components/DependencyDesk.tsx`
- **State:** Full working component with CHAIN_META, KPI strip, graph panel, side panel

### RiskDesk.tsx
- **File:** `josoor-sandbox/components/components/RiskDesk.tsx`
- **Size:** 47 lines
- **Source:** Git commit `fd3d7f5` from `frontend/src/pages/josoor-v2/components/RiskDesk.tsx`
- **State:** Minimal component structure

---

## Point A → Point B: Change Descriptions (Dec 24 05:45 → Dec 25 18:04)

**Location:** `/home/mosab/projects/chatmodule/josoor-sandbox/diffs/`

### Timeline: 23 change description files

**Chronological order:**

1. `walkthrough.md.resolved.0` (Dec 24 05:45) - Layout changes for DependencyDesk
2. `walkthrough.md.resolved.1` (Dec 24 05:48) - Flex layout fixes
3. `implementation_plan.md.resolved.0` (Dec 24 06:27) - CHAIN_META updates
4. `implementation_plan.md.resolved.1` (Dec 24 06:46) - Broken links logic
5. `walkthrough.md.resolved.2` (Dec 24 08:03) - Tooltip fixes, legend updates
6. `implementation_plan.md.resolved.2` (Dec 24 08:22) - Virtual edge injection
7. `implementation_plan.md.resolved.3` (Dec 24 08:30) - Sequence detection logic
8. `implementation_plan.md.resolved.4` (Dec 24 08:41) - Chain expansion
9. `implementation_plan.md.resolved.5` (Dec 24 08:44) - Color refinements
10. `walkthrough.md.resolved.3` (Dec 24 09:12) - Further refinements
11. `implementation_plan.md.resolved.8` (Dec 24 14:57) - GapRecommendationsPanel integration
12. `task.md.resolved.12` (Dec 24 14:58) - Task checklist
13. `implementation_plan.md.resolved.9` (Dec 24 22:02) - Panel integration details
14. `task.md.resolved.13` (Dec 24 22:02) - Structural fidelity refactoring
15. `task.md.resolved.14` (Dec 24 22:30) - Continued refactoring
16. `implementation_plan.md.resolved.10` (Dec 24 22:51) - Panel refinements
17. `implementation_plan.md.resolved.11` (Dec 24 23:56) - More panel updates
18. `task.md.resolved.15` (Dec 24 23:56) - Task updates
19. `task.md.resolved.16` (Dec 25 01:27) - Business chain audit
20. `task.md.resolved.17` (Dec 25 02:18) - Audit refinement
21. `walkthrough.md.resolved.36` (Dec 25 17:48) - ESLint cleanup (removed unused vars)
22. `walkthrough.md.resolved.37` (Dec 25 18:04) - Final cleanup
23. `task.md.resolved.37` (Dec 25 18:00) - RiskDesk mentioned

---

## Reconstruction Instructions

### For each change file (in chronological order):

1. **Read the change description file** from `josoor-sandbox/diffs/`
2. **Identify the specific changes** described (e.g., "Change X from Y to Z", "Add state variable", "Update CHAIN_META")
3. **Apply the change** to the baseline file
4. **Track cumulative changes** (each change builds on previous)

### Change types you'll encounter:

- **Layout/Style changes:** CSS-in-JS style objects (height, flex, overflow)
- **State additions:** `useState` declarations
- **Logic updates:** Conditional rendering, data transformations
- **Color/metadata updates:** CHAIN_META object modifications
- **Component integration:** New panels (GapRecommendationsPanel)
- **Code cleanup:** Removing unused imports/variables

### Example reconstruction flow:

```
Point A baseline (DependencyDesk.tsx, 355 lines)
  ↓
+ Apply walkthrough.md.resolved.1 changes:
  - Main container: minHeight: 0 → height: '100%'
  - Add flexShrink: 0 to KPI strip
  ↓
+ Apply implementation_plan.md.resolved.0 changes:
  - Add SectorDataTransaction to CHAIN_META
  - Update sector_ops colors
  ↓
+ Apply walkthrough.md.resolved.2 changes:
  - Add GapRecommendationsPanel logic
  - Update broken links visualization
  ↓
... continue through all 23 files chronologically ...
  ↓
= Point B reconstruction (DependencyDesk.tsx, ~398 lines estimated)
```

---

## Output Requirements

### Save reconstructed files to:
- `/home/mosab/projects/chatmodule/josoor-sandbox/reconstructed/DependencyDesk.tsx`
- `/home/mosab/projects/chatmodule/josoor-sandbox/reconstructed/RiskDesk.tsx`

### Create reconstruction log:
- `/home/mosab/projects/chatmodule/josoor-sandbox/RECONSTRUCTION_LOG.md`

**Log format:**
```markdown
# Component Reconstruction Log

## DependencyDesk.tsx

### Change 1: walkthrough.md.resolved.1 (Dec 24 05:48)
**Description:** Layout changes for full vertical expansion
**Applied:**
- Line 140: Changed `minHeight: 0, paddingBottom: '2rem'` to `height: '100%', overflow: 'hidden'`
- Line 144: Added `flexShrink: 0` to KPI strip
- Line 185: Changed graph panel height from `550px` to `100%`

### Change 2: implementation_plan.md.resolved.0 (Dec 24 06:27)
...
```

---

## Critical Rules

1. **NO MANUAL CODE WRITING** - Only apply changes explicitly described in the diff files
2. **SEQUENTIAL APPLICATION** - Apply changes in chronological order (timestamps matter)
3. **EXACT MATCHING** - Match the descriptions precisely; if unclear, note it in the log
4. **CUMULATIVE CHANGES** - Each change builds on the previous state
5. **NO ASSUMPTIONS** - If a change description is ambiguous, document it and skip rather than guess

---

## Validation

After reconstruction:

1. Check line counts match expectations (~398 for DependencyDesk, unknown for RiskDesk)
2. Verify TypeScript compilation (no syntax errors)
3. Compare with Point A baseline to see cumulative diff
4. Document any ambiguous or skipped changes

---

## Notes

- **DependencyDesk** has 22 change files
- **RiskDesk** has only 1 mention (task.md.resolved.37) - minimal changes expected
- Change descriptions are **text-based plans**, not code blocks - you must interpret and apply them
- Some descriptions may be high-level ("integrate GapRecommendationsPanel") - apply reasonable interpretation based on component structure

---

**Start with:** `josoor-sandbox/components/components/DependencyDesk.tsx` (Point A baseline)  
**Apply:** Changes from `josoor-sandbox/diffs/` in chronological order  
**Output:** `josoor-sandbox/reconstructed/DependencyDesk.tsx` (Point B reconstruction)
