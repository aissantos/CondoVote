import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'RESIDENT' | 'ADMIN';
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, allowedRole, requireCompleteProfile = true }: ProtectedRouteProps) {
  const { session, role, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  if (!session) {
    // Redirecionar para login de admin ou login de morador
    const redirectTo = location.pathname.startsWith('/admin') ? '/admin/login' : '/';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Usuário logado mas sem permissão pra essa rota
    const fallback = role === 'ADMIN' ? '/admin' : '/check-in';
    return <Navigate to={fallback} replace />;
  }
  
  // Se for morador, e a rota exigir profile (todas menos o próprio /complete-profile)
  if (role === 'RESIDENT' && requireCompleteProfile) {
    const isProfileIncomplete = !profile?.unit_number || !profile?.block_number;
    if (isProfileIncomplete) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return <>{children}</>;
}
