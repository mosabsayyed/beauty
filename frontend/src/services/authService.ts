// frontend/src/services/authService.ts
import { supabase } from '../lib/supabaseClient';

const LS_TOKEN = 'josoor_token';
const LS_USER = 'josoor_user';
const LS_AUTH = 'josoor_authenticated';
const LS_GUEST_ID = 'josoor_guest_id';
const LS_GUEST_CONVOS = 'josoor_guest_conversations';

function emitAuthChange() {
  try {
    window.dispatchEvent(new Event('josoor_auth_change'));
  } catch {}
}

export function persistSession(session: any | null, clearGuest: boolean = false) {
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
      if (session && clearGuest) {
        try {
          localStorage.removeItem(LS_GUEST_ID);
          localStorage.removeItem(LS_GUEST_CONVOS);
        } catch {}
      }
  } catch {}

  emitAuthChange();
}

export async function login(email: string, password: string) {
  const resp = await supabase.auth.signInWithPassword({ email, password });
  if (resp.error) throw resp.error;
  const session = resp.data.session;
  if (!session) throw new Error('No session returned from Supabase');
  persistSession(session);
  return { access_token: session.access_token, user: session.user };
}

export async function register(email: string, password: string, full_name?: string) {
  const resp = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
  if (resp.error) throw resp.error;
  if (resp.data?.session) persistSession(resp.data.session);
  return resp.data;
}

export async function signInWithProvider(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/chat' } });
  if (error) throw error;
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

export async function startGuestSession(): Promise<string> {
  try {
    let gid = localStorage.getItem(LS_GUEST_ID);
    if (gid) return gid;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      gid = crypto.randomUUID();
    } else {
      gid = 'guest-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    }
    // Clear any existing token to ensure we truly operate as a guest
    try { 
      // Sign out from supabase SDK in case it maintains a session
      try { await supabase.auth.signOut(); } catch {}
      localStorage.removeItem(LS_TOKEN); 
      localStorage.removeItem(LS_USER); 
    } catch {}
    localStorage.setItem(LS_GUEST_ID, gid);
    localStorage.setItem(LS_GUEST_CONVOS, JSON.stringify([]));
    localStorage.setItem(LS_AUTH, 'false');
    emitAuthChange();
    return gid;
  } catch {
    return '';
  }
}

export function isGuestMode(): boolean {
  try {
    const token = getToken();
    const gid = localStorage.getItem(LS_GUEST_ID);
    return !token && !!gid;
  } catch {
    return false;
  }
}

export function saveGuestConversations(convos: any[]) {
  try {
    localStorage.setItem(LS_GUEST_CONVOS, JSON.stringify(convos || []));
  } catch {}
}

export function clearGuestConversations() {
  try {
    localStorage.removeItem(LS_GUEST_ID);
    localStorage.removeItem(LS_GUEST_CONVOS);
    // Also remove backups set during login flow or migrations
    try { localStorage.removeItem(LS_GUEST_CONVOS + '_backup'); localStorage.removeItem(LS_GUEST_ID + '_backup'); } catch (e) {}
  } catch {}
  emitAuthChange();
}

export function getGuestConversations(): any[] {
  try {
    const v = localStorage.getItem(LS_GUEST_CONVOS);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

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
