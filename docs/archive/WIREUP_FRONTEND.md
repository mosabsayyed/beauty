# Frontend Wiring Guide — `frontend`

Purpose: provide a single, deterministic path for a junior worker to wire the original `frontend` app to the already-running backend. Follow the steps exactly and perform the success checks after each step.

Prerequisites (assumed):
- You are at the repository root `/home/mosab/projects/chatmodule`.
- Backend is already running and reachable at `http://localhost:8008` (the frontend proxy expects port 8008).
- You have permission to edit files in the repo and to run the frontend dev server.

Summary of changes this guide makes (one path):
- Add `frontend/src/services/authService.ts` to centralize auth and localStorage keys.
- Update `frontend/src/services/chatService.ts` to attach `Authorization: Bearer <token>` automatically.
- Update `frontend/src/pages/LoginPage.tsx` to call the backend via `authService` on submit.
- Ensure `frontend/.env` points to the backend API base URL.
- Verification steps to confirm successful wiring.

---

1) Backend contract (exact request/response shapes)

- Login
  - Endpoint: `POST /api/v1/auth/login`
  - Request JSON: `{ "email": "<email>", "password": "<password>" }`
  - Success Response JSON: `{ "access_token": "<jwt>", "token_type":"bearer", "user": { "id": "...", "email": "..." } }`

- Register
  - Endpoint: `POST /api/v1/auth/register`
  - Request JSON: `{ "email": "...", "password": "...", "full_name": "..." }`
  - Response: created `user` object or success confirmation.

- Protected example
  - Endpoint: `GET /api/v1/auth/users/me`
  - Header: `Authorization: Bearer <access_token>`
  - Response: `user` JSON

Use these shapes exactly in the frontend code below.

---

2) File: `frontend/src/services/authService.ts` (create exactly)

Paste the following file exactly as shown:

```ts
// frontend/src/services/authService.ts
const API_BASE = process.env.REACT_APP_API_URL || '';

const LS_TOKEN = 'josoor_token';
const LS_USER = 'josoor_user';
const LS_AUTH = 'josoor_authenticated';

function getUrl(path: string) {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

export async function login(email: string, password: string) {
  const res = await fetch(getUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed: ${res.status} ${res.statusText} ${body}`);
  }
  const data = await res.json();
  if (!data || !data.access_token) throw new Error('Login response missing access_token');
  localStorage.setItem(LS_TOKEN, data.access_token);
  localStorage.setItem(LS_USER, JSON.stringify(data.user || {}));
  localStorage.setItem(LS_AUTH, 'true');
  return data;
}

export async function register(email: string, password: string, full_name?: string) {
  const res = await fetch(getUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Register failed: ${res.status} ${res.statusText} ${body}`);
  }
  const data = await res.json();
  return data;
}

export function logout() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
  localStorage.setItem(LS_AUTH, 'false');
}

export function getToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}

export function getUser(): any | null {
  const v = localStorage.getItem(LS_USER);
  return v ? JSON.parse(v) : null;
}
```

---

3) Edit: `frontend/src/services/chatService.ts` — attach Authorization header

Find the `fetchWithErrorHandling` function and replace the initial header construction and fetch call with this exact snippet (preserve the rest of the file):

```ts
  private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<Response> {
    let response: Response;
    const token = (() => {
      try { return localStorage.getItem('josoor_token'); } catch { return null; }
    })();

    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string,string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      response = await fetch(url, {
        headers,
        ...options,
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      throw new Error(`Network error when fetching ${url}: ${errMsg}`);
    }

    if (!response.ok) {
      // existing error handling continues unchanged
```

This ensures all `chatService` requests include the JWT when present.

---

4) Edit: `frontend/src/pages/LoginPage.tsx` — call authService on submit

- Add import at top (near other imports):

```ts
import { login as apiLogin, register as apiRegister } from '../services/authService';
```

- Replace existing `handleSubmit` with this exact implementation:

```ts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await apiRegister(email, password, name || undefined);
      }
      const res = await apiLogin(email, password);
      onLogin();
    } catch (err: any) {
      alert(`Authentication error: ${err?.message || String(err)}`);
    }
  };
```

This uses `authService` to store `josoor_token` and `josoor_user` in localStorage, and then calls the existing `onLogin()` callback.

---

5) Ensure `frontend/.env` points to backend API

Create or overwrite `frontend/.env` with:

```
PORT=3000
REACT_APP_API_URL=http://localhost:8008/api/v1
REACT_APP_REBUILD_API_URL=http://localhost:8008/api/v1
```

This makes the app call `http://localhost:8008/api/v1` as the API base.

---

6) Hot-reload workflow

- Start dev server: `cd frontend && npm start` (this project uses CRACO start).
- Save files and the dev server will hot-reload. Test via browser at `http://localhost:3000`.

---

7) Verification steps (do these in order)

- Verify backend is reachable (quick curl):
```
curl -sS http://localhost:8008/api/v1/health
```
- Register a test user (curl):
```
curl -sS -X POST http://localhost:8008/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test+junior@example.com","password":"Test1234!","full_name":"Junior Tester"}' | jq .
```
- Login via backend (curl) and capture token:
```
curl -sS -X POST http://localhost:8008/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test+junior@example.com","password":"Test1234!"}' | jq .
```
- UI login: open `http://localhost:3000`, use Login page, submit credentials, or use "Skip and Continue as Guest" if you need to bypass real login.
- Confirm localStorage keys in browser console:
```js
localStorage.getItem('josoor_token') // should be non-empty
localStorage.getItem('josoor_user')  // should contain user JSON
localStorage.getItem('josoor_authenticated') // should be "true"
```
- Confirm `Authorization` header is attached to XHR requests (Network tab) and protected endpoints return 200.

---

8) Acceptance criteria (all must be true)
- `josoor_token` exists and is non-empty.
- `josoor_user` contains the login email.
- `josoor_authenticated` === `"true"` in localStorage.
- Network requests from the UI include `Authorization: Bearer <token>` and protected endpoints (e.g., `/auth/users/me`, `/chat/conversations`) return HTTP 200.

---

9) Files to create/edit (summary)
- Create: `frontend/src/services/authService.ts`
- Edit: `frontend/src/services/chatService.ts` (fetchWithErrorHandling headers)
- Edit: `frontend/src/pages/LoginPage.tsx` (import + handleSubmit)
- Edit/ensure: `frontend/.env`

---

If you want, run the verification steps now and then update the todo list with results. The next step I will take if you confirm is to create a matching granular todo list inside the repo task tracker.

---

Document created by automation — paste these steps exactly when asked by a junior worker.
