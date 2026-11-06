import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  fetchActiveStoreAndSettings,
  getSupabaseClient,
  isSupabaseConfigured,
  type ProfileRow,
  type StoreRow,
  type StoreSettingsRow
} from '@pequemodas/shared';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  store: StoreRow | null;
  settings: StoreSettingsRow | null;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStoreContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [settings, setSettings] = useState<StoreSettingsRow | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadAdminContext = useCallback(async (activeSession: Session | null) => {
    if (!configured || !activeSession?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseClient();
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeSession.user.id)
        .maybeSingle();

      if (profErr || !prof || !prof.is_active) {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setAuthError(
          'Esta cuenta no tiene permisos administrativos activos en PequeModas-Juguetería.'
        );
        setLoading(false);
        return;
      }

      setProfile(prof as ProfileRow);
      const storeCtx = await fetchActiveStoreAndSettings();
      setStore(storeCtx.store);
      setSettings(storeCtx.settings);
      setAuthError(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al verificar sesión.');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadAdminContext(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadAdminContext(nextSession);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [configured, loadAdminContext]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (error) {
      throw new Error(
        error.message.includes('Invalid login')
          ? 'Correo o contraseña incorrectos. Toca «Ver» para revisar la contraseña o abre primero tu enlace de invitación si aún no has creado tu cuenta.'
          : error.message
      );
    }
  };

  const sendPasswordRecovery = async (email: string) => {
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}/actualizar-clave`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (newPassword: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshStoreContext = async () => {
    if (!configured) return;
    const storeCtx = await fetchActiveStoreAndSettings();
    setStore(storeCtx.store);
    setSettings(storeCtx.settings);
  };

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        session,
        user: session?.user ?? null,
        profile,
        store,
        settings,
        authError,
        signIn,
        sendPasswordRecovery,
        updatePassword,
        signOut,
        refreshStoreContext
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return ctx;
}
