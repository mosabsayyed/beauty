Sequential TODOs (document-driven, append)

The following TODOs are authoritative and numbered sequentially. Each item begins with the prefix
`MULTI-USER_SUPPORT.md_` followed by a short task name. At the end of each TODO entry the next
TODO item to perform is specified with `Next:` so the work proceeds without branching options.

1. MULTI-USER_SUPPORT.md_add_auth_dependency
  - Goal: Add a backend FastAPI dependency that validates incoming `Authorization: Bearer <token>` tokens
    (Supabase access token or internal JWT) and resolves the corresponding app `users.id` as
    `current_user.id` (or `user_id`). Make the dependency return a `User`-like object or `user_id` int.
  - Acceptance: Protected endpoints can `Depends(get_current_user)` and receive `current_user.id`.
  - Notes: Reuse `auth_utils` where possible; keep changes minimal and test manually with an example token.
  - Next: MULTI-USER_SUPPORT.md_replace_demo_user

2. MULTI-USER_SUPPORT.md_replace_demo_user
  - Goal: Replace hard-coded `user_id = 1` usages in `backend/app/api/routes/chat.py` with the
    authenticated user provided by the dependency from TODO #1. Add ownership checks on read/write/delete
    operations so the backend enforces `conversation.user_id == current_user.id`.
  - Acceptance: Endpoints return 401/403 for missing/invalid tokens or access to another user's resource.
  - Next: MULTI-USER_SUPPORT.md_add_guest_endpoint

3. MULTI-USER_SUPPORT.md_add_guest_endpoint
  - Goal: Add `POST /api/v1/auth/guest` to create a transient app user row for guest sessions (e.g.
    `guest+{uuid}@guest.local`) and return a signed token and `user.id`. Use existing `users` table fields
    (set `role='guest'`) — no schema changes.
  - Acceptance: Client can obtain `guest_token` and `guest_user_id` and use them as `Authorization: Bearer`.
  - Next: MULTI-USER_SUPPORT.md_add_transfer_endpoint

4. MULTI-USER_SUPPORT.md_add_transfer_endpoint
  - Goal: Add `POST /api/v1/auth/transfer_guest` which allows a newly registered/authenticated user to
    claim a guest account's conversations. Require both the registered user's auth and the guest id/token
    (or a short transfer token issued at guest creation) to prevent hijack. The endpoint will `UPDATE
    conversations SET user_id = new_user_id WHERE user_id = guest_user_id` and optionally mark the guest user
    inactive (`role='guest_inactive'` or `is_active=false`) using existing columns.
  - Acceptance: After transfer, the registered user's `GET /api/v1/chat/conversations` returns transferred
    conversations; guest tokens are invalidated or marked inert.
  - Next: MULTI-USER_SUPPORT.md_frontend_guest_hooks

5. MULTI-USER_SUPPORT.md_frontend_guest_hooks
  - Goal: Add frontend wiring: when an unauthenticated visitor opens chat, the app requests `POST /api/v1/auth/guest`
    (once per browser) and stores `josoor_guest_token` and `josoor_guest_user` in `localStorage`. Use these
    for backend calls that persist conversations while in guest mode. Show a leave/register prompt explaining
    that history is tied to the guest account and can be transferred on registration.
  - Acceptance: Guest users can persist conversations; on registration the UI triggers transfer endpoint.
  - Next: MULTI-USER_SUPPORT.md_update_api_contract

6. MULTI-USER_SUPPORT.md_update_api_contract
  - Goal: Update `API_CONTRACT.md` (or add a minimal section in `docs/MULTI-USER_SUPPORT.md`) describing the
    exact request/response examples for `/auth/guest`, `/auth/transfer_guest`, and the chat endpoints and
    clearly state authentication/ownership requirements and expected status codes.
  - Acceptance: Developer can follow the contract to implement client and server wiring without ambiguity.
  - Next: MULTI-USER_SUPPORT.md_tests_and_smoke

7. MULTI-USER_SUPPORT.md_tests_and_smoke
  - Goal: Run `pytest` for backend chat/auth tests, add tests for guest creation and transfer, and perform
    manual smoke tests: create guest convos -> register -> transfer -> verify access controls.
  - Acceptance: All new/updated tests pass locally; manual smoke steps succeed.
  - Next: MULTI-USER_SUPPORT.md_commit_and_report

8. MULTI-USER_SUPPORT.md_commit_and_report
  - Goal: Commit changes on a feature branch `feature/multiuser-guest`, run final validation, and create
    `WIREUP.md` summarizing what was changed, tests run, and manual smoke results.
  - Acceptance: PR-ready branch with small, focused commits and clear WIREUP checklist.

Notes
- These TODOs are authoritative and sequential. Do them in order. After finishing each TODO, update the
  project's tracked TODO list to mark the item completed and move the `Next` pointer forward.
- The Guest flow is a sub-area of the Multi-user core but is explicitly included to meet the UX requirement
  that guests can persist and transfer conversation history to encourage registration.
