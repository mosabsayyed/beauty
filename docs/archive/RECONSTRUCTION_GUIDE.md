# DependencyDesk.tsx Reconstruction - Correct Method

## Task
Apply code snippet replacements from 23 chronological diff files to the Point A baseline, preserving all unchanged code.

---

## Step 1: Load Point A Baseline

**File:** `/home/mosab/projects/chatmodule/josoor-sandbox/components/components/DependencyDesk.tsx`
**Size:** 355 lines
**Action:** Copy entire file to working buffer - this is your starting point

---

## Step 2: Process Each Diff File Sequentially

**Directory:** `/home/mosab/projects/chatmodule/josoor-sandbox/diffs/`

**Chronological order (by timestamp):**
1. `DependencyDesk_walkthrough.md.resolved.0.txt` (Dec 24 05:45)
2. `DependencyDesk_walkthrough.md.resolved.1.txt` (Dec 24 05:48)
3. `DependencyDesk_implementation_plan.md.resolved.0.txt` (Dec 24 06:27)
4. `DependencyDesk_implementation_plan.md.resolved.1.txt` (Dec 24 06:46)
5. `DependencyDesk_walkthrough.md.resolved.2.txt` (Dec 24 08:03)
6. `DependencyDesk_implementation_plan.md.resolved.2.txt` (Dec 24 08:22)
7. `DependencyDesk_implementation_plan.md.resolved.3.txt` (Dec 24 08:30)
8. `DependencyDesk_implementation_plan.md.resolved.4.txt` (Dec 24 08:41)
9. `DependencyDesk_implementation_plan.md.resolved.5.txt` (Dec 24 08:44)
10. `DependencyDesk_walkthrough.md.resolved.3.txt` (Dec 24 09:12)
11. `DependencyDesk_implementation_plan.md.resolved.8.txt` (Dec 24 14:57)
12. `DependencyDesk_task.md.resolved.12.txt` (Dec 24 14:58)
13. `DependencyDesk_implementation_plan.md.resolved.9.txt` (Dec 24 22:02)
14. `DependencyDesk_task.md.resolved.13.txt` (Dec 24 22:02)
15. `DependencyDesk_task.md.resolved.14.txt` (Dec 24 22:30)
16. `DependencyDesk_implementation_plan.md.resolved.10.txt` (Dec 24 22:51)
17. `DependencyDesk_implementation_plan.md.resolved.11.txt` (Dec 24 23:56)
18. `DependencyDesk_task.md.resolved.15.txt` (Dec 24 23:56)
19. `DependencyDesk_task.md.resolved.16.txt` (Dec 25 01:27)
20. `DependencyDesk_task.md.resolved.17.txt` (Dec 25 02:18)
21. `DependencyDesk_walkthrough.md.resolved.36.txt` (Dec 25 17:48)
22. `DependencyDesk_walkthrough.md.resolved.37.txt` (Dec 25 18:04)

---

## Step 3: For EACH Diff File

### A. Extract Code Snippets
Look for code blocks marked with:
```
\`\`\`tsx
... code snippet ...
\`\`\`
```

**Example from walkthrough.md.resolved.1:**
```tsx
// Outer Container
<div className="v2-dashboard-container" style={{ ..., height: '100%', overflow: 'hidden' }}>
```

### B. Identify Change Context
Read the surrounding text to understand:
- What line/section this replaces
- What the old code was
- Why the change was made

**Example:**
> Modified the layout structure to enable full vertical expansion
> Main Container: Set to `height: '100%'` and `overflow: 'hidden'` (was `minHeight: 0`, `paddingBottom: '2rem'`)

### C. Locate in Baseline
Search your working buffer for:
- Exact matching code pattern
- Variable names mentioned (e.g., `v2-dashboard-container`)
- Line numbers if provided

**In baseline around line 140:**
```tsx
<div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, paddingBottom: '2rem' }}>
```

### D. Apply Replacement
Replace ONLY the specific properties/lines mentioned:

**Old:**
```tsx
minHeight: 0, paddingBottom: '2rem'
```

**New:**
```tsx
height: '100%', overflow: 'hidden'
```

**Result:**
```tsx
<div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
```

### E. Document Change
Log what was changed for verification:
```
[File 2] walkthrough.md.resolved.1 (Dec 24 05:48)
Line 140: Changed container style - minHeight: 0, paddingBottom: '2rem' → height: '100%', overflow: 'hidden'
```

---

## Step 4: Handle Different Change Types

### Type 1: Style Property Changes
**Pattern:** `property: oldValue` → `property: newValue`
**Action:** Find object, replace property value

### Type 2: Adding New Code
**Pattern:** Text says "Add X to Y"
**Action:** Find location Y, insert X (respect indentation)

**Example:**
> Added `flexShrink: 0` to KPI strip

Find KPI strip div, add property.

### Type 3: Metadata Updates (CHAIN_META)
**Pattern:** Text lists color additions
**Action:** Find CHAIN_META object, add to colors object

**Example:**
> Added `SectorDataTransaction`: Pink/Magenta (`#EC4899`)

Add to CHAIN_META['sector_ops'].colors

### Type 4: Import Changes
**Pattern:** Change import path
**Action:** Find import statement, replace path

### Type 5: Removing Code
**Pattern:** Text says "Removed unused X"
**Action:** Find X, delete line/import

---

## Step 5: Verification Checklist

After processing all 22 diff files:

- [ ] File is ~150-250 lines (SMALLER than baseline due to component extraction)
- [ ] Imports changed to reference new child components (NeoGraph, GapRecommendationPanel)
- [ ] Local useQuery/data fetching logic REMOVED (moved to child components)
- [ ] Unused components removed (DependencyKnots, etc.)
- [ ] Layout simplified to Flexbox (verbose manual height calculations removed)
- [ ] Parent component is now a composition wrapper, NOT a monolith

---

## Critical Rules

1. **PRESERVE BASELINE** - Start with full 355 lines, only modify what diffs explicitly change
2. **NO REWRITING** - If diff says "change X to Y", change ONLY X, keep everything else
3. **MATCH CONTEXT** - Use surrounding code to find exact location
4. **SEQUENTIAL ORDER** - Apply diffs in timestamp order (earlier changes may be referenced by later ones)
5. **SKIP AMBIGUOUS** - If you can't find matching code, document it and skip rather than guess
6. **CUMULATIVE** - Each change builds on the previous state

---

## Output Format

**File:** `/home/mosab/projects/chatmodule/josoor-sandbox/reconstructed/DependencyDesk.tsx`

**Log:** `/home/mosab/projects/chatmodule/josoor-sandbox/RECONSTRUCTION_LOG.md`

```markdown
# Reconstruction Log

## File: DependencyDesk.tsx

### Change 1: walkthrough.md.resolved.0 (Dec 24 05:45)
**Snippet found:** None (text description only)
**Description:** Removed padding for dependencies view
**Location:** Line 140
**Applied:** Changed paddingBottom: '2rem' → padding: 0 for activeView === 'dependencies'

### Change 2: walkthrough.md.resolved.1 (Dec 24 05:48)
**Snippet found:** Yes (container style)
**Location:** Line 140
**Old:** minHeight: 0, paddingBottom: '2rem'
**New:** height: '100%', overflow: 'hidden'
**Applied:** ✓

### Change 3: implementation_plan.md.resolved.0 (Dec 24 06:27)
**Snippet found:** No
**Description:** Add SectorDataTransaction to CHAIN_META
**Location:** Line 18 (CHAIN_META['sector_ops'].colors)
**Applied:** Added SectorDataTransaction: '#EC4899'

...
```

---

## Expected Result

**Final file characteristics:**
- ~150-250 lines (REDUCTION from 355 due to architectural refactoring)
- Component extraction: graph logic → `<NeoGraph />`, gaps → `<GapRecommendationPanel />`
- Dead code removed (DependencyKnots, unused imports)
- Layout simplified (Flexbox replaces manual calculations)
- Compiles without errors
- Ready for integration testing

**Key architectural shifts:**
1. **Delegation:** Graph rendering/data → NeoGraph component
2. **Encapsulation:** Gap analysis UI → GapRecommendationPanel
3. **Cleanup:** Removed inline useQuery hooks, manual layout logic
4. **Wrapper pattern:** Parent coordinates children, doesn't implement features
