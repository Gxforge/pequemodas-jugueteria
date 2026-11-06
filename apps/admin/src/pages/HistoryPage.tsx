import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Boxes, FolderTree, History, Package, Search, Settings } from 'lucide-react';
import { fetchAuditHistory } from '@pequemodas/shared';
import { Button, Card, EmptyState, Skeleton } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';
import { formatHumanAuditAction } from '../components/DashboardIllustrations';

type HistoryFilter = 'all' | 'product' | 'category' | 'inventory' | 'other';

const FILTERS: Array<{ id: HistoryFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'product', label: 'Productos' },
  { id: 'category', label: 'Categorías' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'other', label: 'Tienda y Equipo' }
];

function pickIcon(action: string) {
  if (action.startsWith('product.')) return Package;
  if (action.startsWith('category.')) return FolderTree;
  if (action.startsWith('inventory.')) return Boxes;
  return Settings;
}

export function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-history'],
    queryFn: () => fetchAuditHistory(60)
  });

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filter === 'product' && !log.action.startsWith('product.')) return false;
      if (filter === 'category' && !log.action.startsWith('category.')) return false;
      if (filter === 'inventory' && !log.action.startsWith('inventory.')) return false;
      if (
        filter === 'other' &&
        (log.action.startsWith('product.') ||
          log.action.startsWith('category.') ||
          log.action.startsWith('inventory.'))
      ) {
        return false;
      }

      if (search.trim()) {
        const text = formatHumanAuditAction(log.action, log.metadata).toLowerCase();
        return text.includes(search.trim().toLowerCase());
      }
      return true;
    });
  }, [logs, filter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Historial de tu Tienda
          </h1>
          <p className="text-sm text-slate-600">
            Registro claro de cambios en productos, secciones, existencias y equipo.
          </p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Volver al resumen
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold border transition-colors ${
                filter === f.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-brand-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar movimiento..."
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs sm:text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && logs.length === 0 ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="Sin movimientos en esta vista"
          description="Aquí aparecerán ordenados por fecha los cambios que realices en productos, secciones o inventario."
        />
      ) : (
        <Card padding="sm" className="divide-y divide-slate-100">
          {filtered.map((log) => {
            const Icon = pickIcon(log.action);
            return (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 px-2 py-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-slate-800 truncate">
                    {formatHumanAuditAction(log.action, log.metadata)}
                  </span>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                  {formatDateTimeEs(log.created_at)}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
