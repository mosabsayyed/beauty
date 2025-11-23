import { createClient } from '@supabase/supabase-js';

// Use build-time injected REACT_APP_* variables first (CRA/craco). Fall back to window.__env__ at runtime.
export const supabase = (() => {
  // Use direct process.env.* references so CRA/craco's DefinePlugin replaces them at build time.
  // These will be compiled to string literals by the bundler.
  // @ts-ignore
  const BUILD_REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  // @ts-ignore
  const BUILD_REACT_APP_SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

  const winEnv = (typeof window !== 'undefined' && (window as any).__env__) ? (window as any).__env__ : {};

  const SUPABASE_URL = BUILD_REACT_APP_SUPABASE_URL || winEnv.REACT_APP_SUPABASE_URL || winEnv.SUPABASE_URL || '';
  const SUPABASE_ANON = BUILD_REACT_APP_SUPABASE_ANON || winEnv.REACT_APP_SUPABASE_ANON_KEY || winEnv.SUPABASE_ANON_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    // eslint-disable-next-line no-console
    console.error('Supabase not configured for frontend. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    const stub = {
      auth: {
        signInWithPassword: async () => ({ error: new Error('Supabase not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY') }),
        signUp: async () => ({ error: new Error('Supabase not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY') }),
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY') }),
        signOut: async () => ({ error: new Error('Supabase not configured: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY') }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
      },
      from: () => ({ select: async () => ({ data: null }) }),
    } as any;
    return stub;
  }

  return createClient(String(SUPABASE_URL), String(SUPABASE_ANON));
})();
