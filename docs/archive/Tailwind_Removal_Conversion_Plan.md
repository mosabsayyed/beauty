Tailwind Removal & Inline-Style Migration Plan

Goal
Convert remaining Tailwind-dependent UI to inline/CSS styles while preserving all runtime behavior, APIs, and responsiveness.

Scope
- Files targeted: CanvasPanel.tsx, MessageBubble.tsx, ArtifactRenderer.tsx, index.css, globals.css, ChatAppPage.css
- Keep API integrations, event handlers, and component contracts unchanged.

High-level steps
1. Audit
- Grep for `className=` and `@tailwind/@apply` to list Tailwind usages.
- Create a mapping of commonly used utilities → design tokens (colors, spacing, radii, shadows).

2. Create style helpers
- Add `frontend/src/styles/styleHelpers.ts` exporting reusable JS style objects: container, header, card, textSmall, buttonPrimary, input, scrollArea.
- Keep names descriptive so components import them.

3. Per-file conversion (repeatable recipe)
- Replace `className` strings with `style={...}` using either inline objects or imported helpers.
- For conditional classes, compute merged style objects (base + conditional overrides). Don’t change props or event handlers.
- Ensure scroll regions use `minHeight: 0` and `overflowY: 'auto'` to avoid layout collapse.
- For responsive behaviors, prefer moving media queries into CSS (see step 4) or use JS-based breakpoints only if necessary.

4. Global CSS cleanup
- Move only essential CSS variables and media queries into a small CSS (e.g., `src/styles/globals.css`) without `@tailwind` directives.
- Convert `@apply` rules into explicit property rules or corresponding JS helper objects.
- Keep theme tokens as CSS variables to reuse in inline styles (use getComputedStyle if needed).

5. Test & iterate
- Commit per-file; run dev server and visually inspect `/chat`.
- Test key flows: load conversations, send messages, load artifacts, open canvas.
- Lint and run tests: `npm --prefix frontend run lint` and `npm --prefix frontend test`.

6. QA checklist before final removal
- No `className` referencing Tailwind utilities in `frontend/src` (grep to confirm).
- No `@tailwind` or `@apply` in CSS.
- Visual parity: spacing, colors, shadows, focus outlines, and media breakpoints match.
- Accessibility: keyboard focus and aria labels preserved.

7. Rollback & safety
- Work in a feature branch and commit small, testable steps. If anything breaks, revert the last commit.
- Keep the backend/API surfaces untouched.

Notes
- Recharts and other rendering libraries do not rely on Tailwind; they remain safe.
- Prefer JS style helpers to keep duplication low and enable consistent tokens.

If you confirm, I will add `frontend/src/styles/styleHelpers.ts` and convert the three components one-by-one with per-file commits.
