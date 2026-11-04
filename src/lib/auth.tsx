'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, setSupabaseAccessToken } from '@/lib/supabase';

export const ADMIN_EMAIL = 'diazkurniawanc@gmail.com';

export type StaffRole = 'admin' | 'staff';

export interface StaffMember {
  email: string;
  name: string;
  role: StaffRole;
  active: boolean;
  added_by?: string | null;
  created_at?: string;
}

type AuthStatus =
  | 'loading' // checking stored session
  | 'signed_out' // show login screen
  | 'unauthorized' // signed in with Google but not on the staff list
  | 'ready'; // signed in and allowed

interface AuthContextValue {
  status: AuthStatus;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: StaffRole | null;
  isAdmin: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Single browser client. Session is kept in localStorage so the app also
// opens offline for someone who logged in before.
export const supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rb_auth_session',
  },
});

const ROLE_CACHE_KEY = 'rb_auth_role_cache';

function readCachedRole(email: string): StaffRole | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email: string; role: StaffRole };
    return parsed.email === email ? parsed.role : null;
  } catch {
    return null;
  }
}

function writeCachedRole(email: string, role: StaffRole | null) {
  try {
    if (role) localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ email, role }));
    else localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    // ignore
  }
}

/** Data that belongs to the business and must not stay on a device after logout. */
const PRIVATE_STORAGE_KEYS = [
  'rb_saved_invoices',
  'rb_inventory_items',
  'rb_business_profile',
  'rb_pending_sync_queue',
  'rb_last_backup_date',
  'rb_last_backup_count',
  ROLE_CACHE_KEY,
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [role, setRole] = useState<StaffRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveRole = useCallback(async (s: Session | null) => {
    setSupabaseAccessToken(s?.access_token ?? null);
    setSession(s);

    if (!s?.user?.email) {
      setRole(null);
      setStatus('signed_out');
      return;
    }

    const email = s.user.email.toLowerCase();
    const { data, error: rpcError } = await supabaseAuthClient.rpc('rb_current_role');

    if (rpcError) {
      // Offline or server unreachable: trust the last known role on this device.
      const cached = readCachedRole(email);
      if (cached) {
        setRole(cached);
        setStatus('ready');
      } else {
        setError('Tidak bisa memeriksa akses akun. Periksa koneksi internet lalu coba lagi.');
        setRole(null);
        setStatus('unauthorized');
      }
      return;
    }

    const nextRole = data === 'admin' || data === 'staff' ? (data as StaffRole) : null;
    writeCachedRole(email, nextRole);
    setRole(nextRole);
    setError(null);
    setStatus(nextRole ? 'ready' : 'unauthorized');
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabaseAuthClient.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) setError(sessionError.message);
      resolveRole(data.session);
    });

    const { data: sub } = supabaseAuthClient.auth.onAuthStateChange((event, s) => {
      if (event === 'TOKEN_REFRESHED') {
        // Same user, new token: keep requests authorised without re-checking role.
        setSupabaseAccessToken(s?.access_token ?? null);
        setSession(s);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer: calling Supabase inside this callback can deadlock the client.
        setTimeout(() => resolveRole(s), 0);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [resolveRole]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const { error: oauthError } = await supabaseAuthClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthError) setError(oauthError.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabaseAuthClient.auth.signOut().catch(() => undefined);
    try {
      PRIVATE_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setSupabaseAccessToken(null);
    setSession(null);
    setRole(null);
    setStatus('signed_out');
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const meta = (session?.user?.user_metadata ?? {}) as Record<string, string | undefined>;
    return {
      status,
      email: session?.user?.email?.toLowerCase() ?? null,
      name: meta.full_name || meta.name || null,
      avatarUrl: meta.avatar_url || meta.picture || null,
      role,
      isAdmin: role === 'admin',
      error,
      signInWithGoogle,
      signOut,
    };
  }, [session, status, role, error, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ---------- Staff management (admin only, enforced by RLS) ----------

export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabaseAuthClient
    .from('rb_staff')
    .select('*')
    .order('role', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffMember[];
}

export async function upsertStaff(member: Omit<StaffMember, 'created_at'>): Promise<void> {
  const { error } = await supabaseAuthClient
    .from('rb_staff')
    .upsert({ ...member, email: member.email.trim().toLowerCase() });
  if (error) throw new Error(error.message);
}

export async function removeStaff(email: string): Promise<void> {
  const { error } = await supabaseAuthClient.from('rb_staff').delete().eq('email', email);
  if (error) throw new Error(error.message);
}
