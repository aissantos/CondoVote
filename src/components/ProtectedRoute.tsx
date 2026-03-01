import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'RESIDENT' | 'ADMIN' | 'SUPERADMIN';
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, allowedRole, requireCompleteProfile = true }: ProtectedRouteProps) {
  const { session, role, profile, loading } = useAuth();
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

  if (!session) {
    // Redirecionar para login correto dependendo da rota
    let redirectTo = '/';
    if (location.pathname.startsWith('/admin')) redirectTo = '/admin/login';
    if (location.pathname.startsWith('/super')) redirectTo = '/super/login';
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Usuário logado mas sem permissão
    let fallback = '/check-in';
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
