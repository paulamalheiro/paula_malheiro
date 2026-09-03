import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Credenciais de teste / desenvolvimento local
export const LOCAL_DEV_CREDENTIALS = {
  email: 'admin@paulamalheiro.com.br',
  password: 'admin123',
};

const LOCAL_SESSION_KEY = 'paula_admin_local_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isLocalDev: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalDev, setIsLocalDev] = useState(false);

  useEffect(() => {
    // 1. Verificar se existe uma sessão local de teste salva no navegador
    const savedLocalSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (savedLocalSession) {
      try {
        const mockUser = JSON.parse(savedLocalSession) as User;
        setUser(mockUser);
        setIsLocalDev(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    // 2. Se o Supabase estiver configurado, checar sessão remota
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        console.error('[Auth] Erro ao recuperar sessão remota:', err);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Suporte às credenciais locais de teste/desenvolvimento
    if (
      cleanEmail === LOCAL_DEV_CREDENTIALS.email.toLowerCase() &&
      password === LOCAL_DEV_CREDENTIALS.password
    ) {
      const mockUser = {
        id: 'local-admin-paula',
        app_metadata: { provider: 'email' },
        user_metadata: { name: 'Paula Malheiro (Admin Local)' },
        aud: 'authenticated',
        email: LOCAL_DEV_CREDENTIALS.email,
        created_at: new Date().toISOString(),
      } as unknown as User;

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      setIsLocalDev(true);
      return { error: null };
    }

    // 2. Autenticação via Supabase oficial se estiver configurado
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { error };
        }

        setSession(data.session);
        setUser(data.user);
        setIsLocalDev(false);
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    }

    // Se não bateu com as credenciais de teste e nem há Supabase
    return {
      error: new Error(
        `Credenciais inválidas. Para teste local, use: ${LOCAL_DEV_CREDENTIALS.email} / ${LOCAL_DEV_CREDENTIALS.password}`
      ),
    };
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setIsLocalDev(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isLocalDev,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
