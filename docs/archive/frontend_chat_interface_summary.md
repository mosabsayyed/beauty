## Frontend — chat interface final working summary

Purpose: a compact, standalone summary of the final working chat UI files to carry into another conversation. This file documents which frontend files represent the working chat interface after duplicate removal, where to add an AR/EN visual toggle, and a short checklist for final verification.

NOTE: This document is intentionally conservative — it lists the files that were used during diagnostics and the likely places to inspect. Before applying changes, review the files in your working branch to confirm exact paths.

## Final working chat interface (CANONICAL)

 - Canonical and final chat UI: `frontend/src/att/App.tsx` — this is the single authoritative chat entry component used in the integration/demo and must remain the canonical implementation. Do NOT replace or swap this with other copies.

## Supporting files (preserve these as references)
 
 - `frontend/src/att/main.tsx` — application bootstrap and React root mounting for the chat app (or the appropriate top-level bootstrap under `frontend/src/att/`).
 - `frontend/src/att/index.css` / `frontend/src/att/index.html` — styles and HTML shell for the chat app (where present).
 - `frontend/src/` — may contain older or alternate SPA variants. The canonical chat implementation lives under `frontend/src/att/`. Inspect other `frontend/src/` folders only if you need to recover removed pieces.
 - `frontend/index.html` — SPA shell for production build (ensure it references the canonical chat bundle under `frontend/src/att/`).
- `public/` — images, icons, and static assets used by the chat UI (logo, cube animation assets).

## Files to delete/avoid (duplicates removed)
 - Any duplicated chat component files found in `frontend_backup_chatcanvas_*`, `stash/`, or `stash/rebuild/` should be removed or archived. Keep a single canonical Chat component under `frontend/src/att/`.

## AR/EN toggle — where to add it
- Add a visible language toggle control in the chat header area (suggested locations):
  - `frontend/src/att/App.tsx` — top-right of the header bar, close to user avatar or settings icon.
  - If using a shared `Header` component in `frontend/src/components/Header.*` or `frontend/src/att/components/Header.*`, add the toggle there.

Implementation guidance:
- UI: a two-state toggle (EN | AR) or a globe/language icon with a small dropdown. Visually indicate RTL when AR is active.
- State: store selection in React context or top-level state (e.g., `LanguageContext`) so all components can read current language.
- Persistence: persist selection in localStorage and restore on app load.
- Strings: prefer existing i18n keys; if not present, add a minimal i18n layer (JSON files `locales/en.json`, `locales/ar.json`) and a `t()` helper.
- RTL: add CSS direction handling when AR is active: `document.documentElement.dir = 'rtl'` and add `.rtl` utility class to components needing layout tweaks.

## Minimal props/data contract for the toggle
- LanguageContext value shape (example):
  - `{ lang: 'en' | 'ar', setLang: (l) => void }`

## Quick checklist to finalize the frontend
1. Confirm canonical chat UI files exist in one location (`frontend/src/att/` or `frontend/src/`) and remove duplicates from backups/stash.
2. Add `LanguageContext` and wire into `frontend/src/att/App.tsx` (or top-level component under `frontend/src/att/`).
3. Add a visible toggle UI in header and persist selection to localStorage.
4. Ensure chat messages and UI strings respect the current language via `t()` helper or simple conditionals.
5. Add RTL CSS toggles and verify key screens (composer, message list, settings) in AR mode.
6. Run the app locally (`npm run dev` or `pnpm dev`) and test switching languages.

## Where to look for chat-specific code
 - Search for symbols: `ChatCanvas`, `MessageList`, `Composer`, `ChatInput`, `sendMessage`, `socket`, `orchestrator` in `frontend/src/` (look under `frontend/src/att/`).

## Brief note about separation from MCP
- The frontend is intentionally decoupled from MCP concerns. The chat UI should call backend APIs (e.g., `/api/chat`), and the backend orchestrator will use MCP to query Neo4j. Keep the frontend doc separate from `docs/mcp_integration_summary.md`.

---

Created as a concise handoff document describing the working chat interface and where to add the AR/EN toggle. Review file paths in your current branch and adjust the locations above if any files were moved.
