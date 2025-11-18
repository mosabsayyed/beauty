import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as authService from '../services/authService';

interface AuthContextShape {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromLocal = () => {
    const localUser = authService.getUser();
    const localToken = authService.getToken();
    setUser(localUser);
    setToken(localToken);
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Try to get session from Supabase SDK first
        const sdkSession = await supabase.auth.getSession();
        if (sdkSession?.data?.session) {
          const s = sdkSession.data.session;
          authService.persistSession?.(s);
          if (mounted) {
            setUser(s.user || null);
            setToken(s.access_token || null);
          }
        } else {
          // Fallback to localStorage values
          syncFromLocal();
        }

        // Try to fetch canonical app profile from backend
        try {
          const appUser = await authService.fetchAppUser();
          if (appUser && mounted) {
            setUser(appUser);
          }
        } catch {}
      } catch (err) {
        syncFromLocal();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Update on SDK auth changes (OAuth redirect, signOut, etc)
      if (session?.access_token) {
        authService.persistSession?.(session);
        setUser(session.user || null);
        setToken(session.access_token || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
      }
    });

    const onAuthChange = () => {
      // Also listen to our custom event
      syncFromLocal();
    };

    window.addEventListener('josoor_auth_change', onAuthChange as EventListener);

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
      window.removeEventListener('josoor_auth_change', onAuthChange as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const resp = await authService.login(email, password);
      setUser(resp.user || null);
      setToken(resp.access_token || null);
      // fetch canonical user
      const appUser = await authService.fetchAppUser();
      if (appUser) setUser(appUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const appUser = await authService.fetchAppUser();
    if (appUser) setUser(appUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
