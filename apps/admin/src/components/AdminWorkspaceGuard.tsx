import React, { Component, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  fetchAuditHistory,
  fetchCategories,
  fetchDashboardStats,
  fetchDualProjectOverview,
  fetchProductsPaginated
} from '@pequemodas/shared';
import { Button, Card, Skeleton } from '@pequemodas/ui';

/**
 * Precarga silenciosa en segundo plano de todas las secciones principales del Admin
 * para que al tocar Productos, Categorías, Inventario, Historial o Base de Datos
 * la vista derecha aparezca de inmediato sin esperas.
 */
export function useAdminDataWarmup(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      void Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['admin-dashboard'],
          queryFn: fetchDashboardStats,
          staleTime: 45_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['admin-dual-overview'],
          queryFn: fetchDualProjectOverview,
          staleTime: 45_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['admin-categories'],
          queryFn: () => fetchCategories({ includeArchived: true }),
          staleTime: 45_000
        }),
        queryClient.prefetchQuery({
          queryKey: [
            'admin-products',
            { search: '', status: 'all', categoryId: '', sort: 'newest', page: 1 }
          ],
          queryFn: () =>
            fetchProductsPaginated({
              publicationStatus: 'all',
              sort: 'newest',
              page: 1,
              pageSize: 15
            }),
          staleTime: 45_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['admin-inventory-products'],
          queryFn: () =>
            fetchProductsPaginated({ publicationStatus: 'all', page: 1, pageSize: 100 }),
          staleTime: 45_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['admin-audit-history'],
          queryFn: () => fetchAuditHistory(60),
          staleTime: 45_000
        })
      ]);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [enabled, queryClient]);
}

/**
 * Indicador de carga limpio que aparece ÚNICAMENTE en el panel derecho,
 * manteniendo siempre fijo y visible el menú lateral izquierdo.
 */
export function AdminRightWorkspaceLoader() {
  return (
    <div className="space-y-4 py-2" role="status" aria-live="polite">
      <div className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-200 px-3.5 py-1.5 text-xs font-extrabold text-brand-700 shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
        <span>Cargando sección...</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class AdminPanelErrorBoundary extends Component<
  { children: React.ReactNode; resetKey: string },
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-lg mx-auto my-8 text-center space-y-3" padding="lg">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            Se actualizó esta sección recientemente
          </h2>
          <p className="text-sm text-slate-600">
            Recarga un instante para abrir la versión más reciente sin perder tu sesión.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => window.location.reload()}
            >
              Actualizar sección
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
