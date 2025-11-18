// frontend/src/services/authService.ts
import { supabase } from '../lib/supabaseClient';

const LS_TOKEN = 'josoor_token';
const LS_USER = 'josoor_user';
const LS_AUTH = 'josoor_authenticated';

function emitAuthChange() {
  try {
    window.dispatchEvent(new Event('josoor_auth_change'));
  } catch {}
}

export function persistSession(session: any | null) {
  try {
    if (session && session.access_token) {
      localStorage.setItem(LS_TOKEN, session.access_token);
    }
    if (session && session.user) {
      localStorage.setItem(LS_USER, JSON.stringify(session.user));
    }
    if (session) {
      localStorage.setItem(LS_AUTH, 'true');
    }
  } catch {}

  // Attempt best-effort sync to backend app users table
  (async () => {
    try {
      if (session && session.user) {
        const token = session.access_token;
        await fetch('/api/v1/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(session.user),
        });
      }
    } catch (err) {
      // ignore sync errors - not critical for frontend auth
      console.debug('auth sync failed', err);
    }
  })();

  emitAuthChange();
}

// Login using Supabase Auth (email + password)
export async function login(email: string, password: string) {
  const resp = await supabase.auth.signInWithPassword({ email, password });
  if (resp.error) throw resp.error;
  const session = resp.data.session;
  if (!session) throw new Error('No session returned from Supabase');
  // Persist session and emit event so UI updates in same tab
  persistSession(session);
  return { access_token: session.access_token, user: session.user };
}

// Register using Supabase Auth (creates a user in auth.users)
export async function register(email: string, password: string, full_name?: string) {
  const resp = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
  if (resp.error) throw resp.error;
  // When using email confirm flow, session may be null until verified.
  if (resp.data?.session) persistSession(resp.data.session);
  return resp.data;
}

export async function signInWithProvider(provider: 'google' | 'apple') {
  // Redirect-based OAuth flow. Adjust `options.redirectTo` if needed.
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/chat' } });
  if (error) throw error;
  // OAuth will redirect; session handled on return.
  return true;
}

export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch {}
  try {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    localStorage.setItem(LS_AUTH, 'false');
  } catch {}
  emitAuthChange();
}

export function getToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}

export function getUser(): any | null {
  const v = localStorage.getItem(LS_USER);
  return v ? JSON.parse(v) : null;
}

// Fetch canonical profile from backend (maps auth.uid -> users table)
export async function fetchAppUser() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch('/api/v1/auth/users/me', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    return null;
  }
}
