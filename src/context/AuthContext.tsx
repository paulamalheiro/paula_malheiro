import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb, isPocketBaseConfigured } from '../lib/pocketbase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

// Credenciais de teste / desenvolvimento local
export const LOCAL_DEV_CREDENTIALS = {
  email: 'admin@paulamalheiro.com.br',
  password: 'admin123',
};

const LOCAL_SESSION_KEY = 'paula_admin_local_session';

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  isConfigured: boolean;
  isLocalDev: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalDev, setIsLocalDev] = useState(false);

  useEffect(() => {
    // 1. Verificar se existe uma sessão local de teste salva no navegador
    const savedLocalSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (savedLocalSession) {
      try {
        const mockUser = JSON.parse(savedLocalSession) as AuthUser;
        setUser(mockUser);
        setIsLocalDev(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    // 2. Checar se já existe sessão salva no PocketBase
    if (isPocketBaseConfigured && pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record;
      setUser({
        id: rec.id,
        email: rec.email || '',
        name: rec.name || 'Administrador',
        role: rec.role || 'admin',
      });
      setSession({ token: pb.authStore.token });
      setIsLocalDev(false);
    }

    // Ouvinte para alterações de autenticação no PocketBase
    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setUser({
          id: model.id,
          email: model.email || '',
          name: model.name || 'Administrador',
          role: model.role || 'admin',
        });
        setSession({ token });
        setIsLocalDev(false);
      } else if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
        setUser(null);
        setSession(null);
      }
    });

    setLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Suporte às credenciais locais de teste/desenvolvimento
    if (
      cleanEmail === LOCAL_DEV_CREDENTIALS.email.toLowerCase() &&
      password === LOCAL_DEV_CREDENTIALS.password
    ) {
      const mockUser: AuthUser = {
        id: 'local-admin-paula',
        email: LOCAL_DEV_CREDENTIALS.email,
        name: 'Paula Malheiro (Admin Local)',
        role: 'admin',
      };

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      setIsLocalDev(true);
      return { error: null };
    }

    // 2. Autenticação via PocketBase
    if (isPocketBaseConfigured) {
      // Tentativa A: Coleção 'users' comum
      try {
        const authData = await pb.collection('users').authWithPassword(cleanEmail, password);
        if (authData?.record) {
          const authenticatedUser: AuthUser = {
            id: authData.record.id,
            email: authData.record.email || cleanEmail,
            name: authData.record.name || 'Administrador',
            role: 'admin',
          };
          setUser(authenticatedUser);
          setSession({ token: authData.token });
          setIsLocalDev(false);
          return { error: null };
        }
      } catch (errUsers: any) {
        // Se não foi encontrado em 'users', tenta autenticar como _superusers (v0.23+)
      }

      // Tentativa B: Superusuário PocketBase v0.23+ (_superusers)
      try {
        const superRes = await pb.collection('_superusers').authWithPassword(cleanEmail, password);
        if (superRes?.record) {
          const superUser: AuthUser = {
            id: superRes.record.id,
            email: superRes.record.email || cleanEmail,
            name: 'Superuser PocketBase',
            role: 'superuser',
          };
          setUser(superUser);
          setSession({ token: superRes.token });
          setIsLocalDev(false);
          return { error: null };
        }
      } catch (errSuper: any) {
        // Tenta endpoint legado de admins
        try {
          const adminRes: any = await pb.admins.authWithPassword(cleanEmail, password);
          const adminObj = adminRes?.record || adminRes?.admin;
          if (adminObj) {
            const adminUser: AuthUser = {
              id: adminObj.id,
              email: adminObj.email || cleanEmail,
              name: 'Admin PocketBase',
              role: 'superuser',
            };
            setUser(adminUser);
            setSession({ token: adminRes.token });
            setIsLocalDev(false);
            return { error: null };
          }
        } catch (errAdmin: any) {
          // Ambos falharam
        }
      }

      return {
        error: new Error('Credenciais inválidas. Verifique seu e-mail e senha no PocketBase.'),
      };
    }

    return {
      error: new Error(
        `PocketBase não configurado. Para teste local, use: ${LOCAL_DEV_CREDENTIALS.email} / ${LOCAL_DEV_CREDENTIALS.password}`
      ),
    };
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    if (isPocketBaseConfigured) {
      pb.authStore.clear();
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
        isConfigured: isPocketBaseConfigured,
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
