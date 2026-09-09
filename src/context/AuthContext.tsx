import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb, isPocketBaseConfigured } from '../lib/pocketbase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

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

  useEffect(() => {
    // 1. Limpar resquícios de sessões de mock locais antigas
    if (typeof window !== 'undefined') {
      localStorage.removeItem('paula_admin_local_session');
    }

    // 2. Checar se já existe sessão válida persistida no PocketBase
    if (isPocketBaseConfigured && pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record;
      setUser({
        id: rec.id,
        email: rec.email || '',
        name: rec.name || 'Paula Malheiro',
        role: rec.role || 'admin',
      });
      setSession({ token: pb.authStore.token });
    }

    // 3. Ouvinte oficial do PocketBase authStore
    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setUser({
          id: model.id,
          email: model.email || '',
          name: model.name || 'Paula Malheiro',
          role: model.role || 'admin',
        });
        setSession({ token });
      } else {
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

    if (!isPocketBaseConfigured) {
      return {
        error: new Error(
          'Servidor PocketBase não configurado. Verifique a variável VITE_POCKETBASE_URL.'
        ),
      };
    }

    // 1. Tentativa via coleção 'users' (administradores do painel)
    try {
      const authData = await pb.collection('users').authWithPassword(cleanEmail, password);
      if (authData?.record) {
        const authenticatedUser: AuthUser = {
          id: authData.record.id,
          email: authData.record.email || cleanEmail,
          name: authData.record.name || 'Paula Malheiro',
          role: 'admin',
        };
        setUser(authenticatedUser);
        setSession({ token: authData.token });
        return { error: null };
      }
    } catch (errUsers: any) {
      // Continua para superuser caso falhe em users
    }

    // 2. Tentativa via coleção '_superusers' (PocketBase v0.23+)
    try {
      const superRes = await pb.collection('_superusers').authWithPassword(cleanEmail, password);
      if (superRes?.record) {
        const superUser: AuthUser = {
          id: superRes.record.id,
          email: superRes.record.email || cleanEmail,
          name: 'Superusuário PocketBase',
          role: 'superuser',
        };
        setUser(superUser);
        setSession({ token: superRes.token });
        return { error: null };
      }
    } catch (errSuper: any) {
      // Continua para endpoint legado pb.admins caso aplicável
    }

    // 3. Tentativa via pb.admins (PocketBase legado < v0.23)
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
        return { error: null };
      }
    } catch (errAdmin: any) {
      // Falha em todos os provedores PocketBase
    }

    return {
      error: new Error('E-mail ou senha incorretos. Verifique suas credenciais de acesso no PocketBase.'),
    };
  };

  const signOut = async () => {
    if (isPocketBaseConfigured) {
      pb.authStore.clear();
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isPocketBaseConfigured,
        isLocalDev: false, // Flags de desenvolvimento/teste desativadas em produção
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
