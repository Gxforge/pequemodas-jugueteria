import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Card } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { configured, loading, session, profile } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-lg w-full space-y-3" padding="lg">
          <Alert variant="warning" title="Variables de entorno pendientes">
            Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            en tu archivo <code>.env.local</code> siguiendo <code>.env.example</code> para
            conectar el Panel Administrativo con Supabase.
          </Alert>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            Verificando sesión administrativa segura...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/acceso" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
