# Guest Local-Only Behavior (Enforced)

This document implements and documents the project policy from `docs/MULTI-USER_SUPPORT.md` Step 3:

- Guest interactions MUST remain local-only and must NOT persist to the backend.
- Backend guest-persistence endpoints are disabled and will return HTTP 410 (Gone) with a message pointing to this doc.

Why
- To avoid accidental data persistence under temporary guest identities and to keep development scope minimal (no schema changes or guest-account persistence work).

Frontend responsibilities
- Use the helpers in `frontend/src/services/authService.ts` to start and manage a guest session:
  - `startGuestSession()` — create or reuse a local guest id stored under `josoor_guest_id` and initialize `josoor_guest_conversations`.
  - `isGuestMode()` — returns true if the app is currently a guest (no auth token, but has guest id).
  - `saveGuestConversations(convos)` / `getGuestConversations()` — manage guest conversations in localStorage.

- Guests must never call server endpoints that persist conversations/messages. The UI should store messages locally and only call server endpoints after the user registers/logs in.

Backend behavior
- Endpoints previously enabling guest persistence or transfer (e.g., `/api/v1/auth/guest`, `/api/v1/auth/transfer_guest`) are intentionally disabled and return HTTP 410 to make the doc policy explicit.

Manual verification
1. Clear localStorage and ensure no auth token present.
2. Open the app and call `startGuestSession()` (or open the UI path that triggers the guest flow).
3. Add messages — they should be saved via `josoor_guest_conversations` in localStorage and NOT show in backend `conversations` table.
4. Attempt to call `/api/v1/auth/guest` or `/api/v1/auth/transfer_guest` — they should return 410 with a message pointing to this doc.
5. Register or login using Supabase — `persistSession()` does not clear guest keys automatically. Instead, after login the app will prompt you to migrate local guest conversations to your account and only then will guest keys be cleared (via `clearGuestConversations()`) once migration completes.

Notes
- If, in a later iteration, we choose to support server-side guest persistence and transfer flows, we must update `docs/MULTI-USER_SUPPORT.md` and explicitly allow those endpoints.
