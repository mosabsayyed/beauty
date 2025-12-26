# JOSOOR Reconstruction Task (Brief)

**Mission:** Reconstruct DependencyDesk.tsx & RiskDesk.tsx by applying change descriptions to git baseline.

**Point A (Baseline):** `josoor-sandbox/components/components/` - DependencyDesk.tsx (355 lines), RiskDesk.tsx (47 lines) from git commit fd3d7f5

**Changes:** 23 chronological text descriptions in `josoor-sandbox/diffs/` (Dec 24 05:45 → Dec 25 18:04) describing layout changes, CHAIN_META updates, GapRecommendationsPanel integration, ESLint cleanup, etc.

**Process:** Read each diff file in timestamp order → Identify specific changes (e.g. "change height: '550px' to '100%'") → Apply to baseline → Track cumulatively

**Output:** Save to `josoor-sandbox/reconstructed/DependencyDesk.tsx` + create `RECONSTRUCTION_LOG.md` documenting each applied change

**Rules:** NO manual code writing, apply ONLY changes explicitly described, sequential order, document ambiguities

**Note:** Changes are text descriptions (plans), not code blocks - interpret and apply based on component structure
