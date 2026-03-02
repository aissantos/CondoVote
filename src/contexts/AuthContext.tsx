import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ProfileData {
  full_name?: string;
  unit_number?: string;
  block_number?: string;
  condo_id?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: 'RESIDENT' | 'ADMIN' | 'SUPERADMIN' | null;
  profile: ProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'RESIDENT' | 'ADMIN' | 'SUPERADMIN' | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 1. Inicializa Estado Consumindo Payload JWT
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
         const appMetadata = session.user.app_metadata || {};
         const jwtRole = appMetadata.role;
         
         if (jwtRole) {
            setRole(jwtRole);
            setProfile({ 
              condo_id: appMetadata.condo_id,
              full_name: appMetadata.full_name,
              unit_number: appMetadata.unit_number,
              block_number: appMetadata.block_number
            }); 
            setLoading(false);
            // Delegação síncrona/waterfall foi removida em prol das JWT Custom Claims
         } else {
            fetchRole(session.user.id);
         }
      } else {
        setLoading(false);
      }
    });

    // 2. Realtime Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
         const appMetadata = session.user.app_metadata || {};
         const jwtRole = appMetadata.role;
         if (jwtRole) {
            setRole(jwtRole);
            setProfile({ 
              condo_id: appMetadata.condo_id,
              full_name: appMetadata.full_name,
              unit_number: appMetadata.unit_number,
              block_number: appMetadata.block_number
            }); 
            setLoading(false);
         } else {
            fetchRole(session.user.id);
         }
      } else {
        setRole(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string, isSilentRefresh = false) => {
    try {
      if (!isSilentRefresh) setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) throw fetchError;
        
      if (data) {
        setRole(data.role as 'RESIDENT' | 'ADMIN' | 'SUPERADMIN');
        setProfile({
          full_name: data.full_name,
          unit_number: data.unit_number,
          block_number: data.block_number,
          condo_id: data.condo_id
        });
      }
    } catch (e: any) {
      console.error('Erro ao buscar role:', e);
      if (!isSilentRefresh) {
         setError(e instanceof Error ? e : new Error(e?.message || 'Falha na conexão ao carregar perfil'));
      }
    } finally {
      if (!isSilentRefresh) setLoading(false);
    }
  };

  const signOut = async () => {
    setProfile(null);
    setRole(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchRole(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, profile, loading, refreshProfile, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
