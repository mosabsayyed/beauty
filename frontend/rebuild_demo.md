# Frontend Chat+Canvas rebuild — demo

This demo contains an isolated rebuild of the Chat interface and the CanvasManager under `frontend/src/rebuild` so you can test the migrated components without touching the main app.

Files added:

- `frontend/src/rebuild/Chat/Chat.tsx` — React+TypeScript Chat component with localStorage history, retry logic and event emission for structured payloads.
- `frontend/src/rebuild/Chat/Chat.module.css` — styles for the chat component.
- `frontend/src/rebuild/Canvas/CanvasManager.tsx` — Canvas manager with basic pan/zoom and a small renderer for shapes driven by structured chat payloads.
- `frontend/src/rebuild/Canvas/Canvas.module.css` — styles for the canvas.
- `frontend/src/rebuild/index.tsx` — demo app that mounts Chat and Canvas side-by-side for manual testing.

How to run locally (safe, does not modify main app):

1. Start the backend/dev stack as you normally do (e.g. `./run_dev_full.sh`). Ensure the backend API used by the rebuilt chat is reachable at `REACT_APP_REBUILD_API_URL` or defaults to `/api/v1/chat/message`.

2. Start the frontend dev server from the repo root (this will still start the main app):

```bash
npm --prefix frontend start
```

3. For quick testing, temporarily open the app and (only for manual testing) import the rebuild entry in your local `frontend/src/index.tsx` or open a route that mounts `frontend/src/rebuild/index.tsx` — the demo will mount into `#root` when present.

Notes:

- I created a backup of the current `Chat.tsx` and `CanvasManager.tsx` under `stash/frontend_backup_chatcanvas_20251106T0000/`.
- I will not modify the main `frontend/src/*` files or open a PR until you confirm the rebuild is acceptable and request the PR.

Next steps after you validate the rebuild:

- I will refine edge cases (structured-to-canvas mapping), add unit tests and prepare a PR from `frontend/chat-canvas-rebuild` containing the changes and the stash backup.
