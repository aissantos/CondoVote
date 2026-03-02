import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'RESIDENT' | 'ADMIN' | 'SUPERADMIN';
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, allowedRole, requireCompleteProfile = true }: ProtectedRouteProps) {
  const { session, role, profile, loading, error, refreshProfile } = useAuth();
  const location = useLocation();

  // "Detox" de Cache PWA: Remove ativamente Service Workers das rotas administrativas
  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/super')) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          let unregisteredAny = false;
          for (const registration of registrations) {
            registration.unregister();
            unregisteredAny = true;
          }
          // Se encontrou algum SW engatado nas rotas Admin, recarrega limpo após matar
          if (unregisteredAny) {
            window.location.reload();
          }
        });
      }
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark text-center">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-xl max-w-sm w-full border border-red-100 dark:border-red-900/30 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Falha de Conexão</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
            {error.message || 'Não foi possível carregar o seu perfil. Verifique sua conexão com a internet.'}
          </p>
          <button
            onClick={() => refreshProfile()}
            className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirecionar para login correto dependendo da rota
    let redirectTo = '/';
    if (location.pathname.startsWith('/admin')) redirectTo = '/admin/login';
    if (location.pathname.startsWith('/super')) redirectTo = '/super/login';
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Usuário logado mas sem permissão
    let fallback = '/resident/home';
    if (role === 'ADMIN') fallback = '/admin';
    if (role === 'SUPERADMIN') fallback = '/super';
    return <Navigate to={fallback} replace />;
  }
  
  // Se for morador e não tiver profile completo
  if (role === 'RESIDENT' && requireCompleteProfile) {
    const isProfileIncomplete = !profile?.unit_number || !profile?.block_number;
    if (isProfileIncomplete) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return <>{children}</>;
}
