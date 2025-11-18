**Multi-User Support (Development Scope)**

Purpose
- Provide a concise, development-scoped plan to introduce multi-user support for conversations and messages.
- Keep scope strictly limited to multi-user access, ownership, and guest/local flows. Do NOT introduce new features, database schema changes, or production-only concerns.

Scope & Constraints
- Development-only: there is no production environment. We design for development/testing and iterative validation.
- Scope limited to: authentication, per-user ownership, access control, and frontend/backend wiring to ensure multiple users can access the system safely and independently.
- Explicit exclusions: pagination, caching, monitoring, new `artifacts` table, and other features not required to enable multi-user support.
- Data model constraint: artifacts and visualizations remain stored in `messages.extra_metadata`. No schema changes will be made.

Key Assumptions
- Frontend performs authentication via Supabase (the Supabase client is the source of truth for login/registration and tokens).
- The user table uses `password` (not `password_hash`) in this repo — we will not change that.
- Guest mode means: do not persist to DB; keep chat state in localStorage only.
- Multiple users will access concurrently; every API call that touches persisted conversations/messages must be authenticated and enforced server-side.

Principles
- Always validate identity server-side: the backend must verify the Supabase JWT (or use Supabase server client) and derive the user id from the token; do not trust client-provided `user_id` fields.
- Do not refactor where artifacts are stored. Keep existing `extra_metadata` usage.
- Minimal, safe changes only: add ownership checks and enforce RLS or equivalent server-side checks.

Concrete Development Steps
1) Authentication proof on every call
  - Require `Authorization: Bearer <supabase_token>` (Supabase access token) on all conversation/message endpoints.
  - Backend verifies the token (or uses Supabase server client) and derives `user_id` (token `sub`). Treat that as the authoritative caller identity.

2) Enforce ownership on backend or with Supabase RLS
  - If backend persists data: in each chat endpoint (list, get, create message, delete), verify that the resource's `user_id` matches the authenticated `user_id`. Return 403 if not.
  - If frontend writes directly to Supabase: use Row Level Security (RLS) policies to restrict access to `(select auth.uid()) = user_id` for SELECT/UPDATE/DELETE and `WITH CHECK ((select auth.uid()) = user_id)` for INSERT. Use `TO authenticated` to avoid expensive anon checks.

3) Guest mode
  - If a user is in guest mode, the frontend MUST NOT call backend endpoints that persist data. Keep all state in localStorage. Backend should treat unauthenticated requests as guest and reject writes if persistence is required.

4) List Conversations API contract (minimal clarifications)
  - GET `/api/v1/chat/conversations`
    - Auth: required (Authorization header). Server returns conversations owned by the authenticated user only.
    - If guest: return 401 or an empty list; client should keep local-only conversations in localStorage.

  - GET `/api/v1/chat/conversations/{conversation_id}`
    - Auth: required. Server verifies `conversation.user_id == auth.sub` before returning messages.

  - POST `/api/v1/chat/message`
    - Auth: required for persistence. Body may include `conversation_id`.
    - If `conversation_id` present: verify ownership and append message.
    - If `conversation_id` absent: server may create a new conversation with `user_id = auth.sub` (only for authenticated users). Guests must not trigger server-side creation.

  - DELETE `/api/v1/chat/conversations/{conversation_id}`
    - Auth: required. Verify ownership before delete/soft-delete.

Why token-based identity (preferred)
- Tokens are the authoritative proof of who is calling. Accepting `user_id` supplied by client without verifying the token permits impersonation.
- If you need explicit `user_id` in the body for debugging, the server MUST assert that `user_id == token_sub` before acting.

Supabase RLS Examples (apply only if DB is Supabase-managed)
- Restrict to authenticated users and require uid equality:

  CREATE POLICY "Users can access own conversations"
  ON public.conversations
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

Notes & Best Practices from Supabase (dev-focused)
- Use `TO authenticated` in policies to skip expensive checks for anon role.
- Always include `auth.uid() IS NOT NULL` checks to be explicit.
- If client issues queries to Supabase, prefer adding `.eq('user_id', userId)` filter client-side as well as RLS server-side (this reduces query scope during development/testing).

Implementation Options (pick one)
- Option A (recommended): Backend-verified token flow
  - Frontend keeps using Supabase for auth and sends the token to backend endpoints.
  - Backend verifies token and enforces ownership checks server-side. This is the safest approach when backend coordinates chat persistence.

- Option B: Direct-to-Supabase with RLS
  - Frontend writes/reads conversations directly to Supabase. Use RLS to enforce ownership. Backend can be out of data path for chat storage.

- Option C: Hybrid
  - Authenticated users persist via backend (Option A). Guests are local-only (localStorage). This is sometimes simplest for mixed-mode apps.

Minimal Code Work I can produce for you (dev)
- Small FastAPI middleware that validates Supabase token and attaches `user_id` to `request.state`.
- Minimal patches to chat endpoints to assert `conversation.user_id == request.state.user_id`.
- Or, if you prefer Supabase-managed DB, I can produce exact SQL policy snippets to paste into the Supabase SQL editor.

Next Steps (pick one)
- Ask me to implement Option A: I will create a small auth verification middleware and update `backend/app/api/routes/chat.py` to enforce ownership checks; then run backend chat tests and report results.
- Ask me to generate RLS SQL (Option B): I will create a `docs/supabase-rls.sql` file with the exact policies for `conversations` and `messages` you can paste into Supabase SQL editor.
- Or review & accept this document; I will then produce the small code diffs for your preferred option.

Contact / Notes
- This document intentionally avoids schema changes and feature expansions. If in a later iteration you want to normalize artifacts out of `messages.extra_metadata`, we can plan a safe migration then; it will be out of scope for this task.

File: `docs/MULTI-USER_SUPPORT.md`
