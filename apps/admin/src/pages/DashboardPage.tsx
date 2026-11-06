import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FolderTree,
  HardDrive,
  MessageSquare,
  Package,
  Plus
} from 'lucide-react';
import { fetchDashboardStats } from '@pequemodas/shared';
import { Alert, Badge, Button, Card, Skeleton } from '@pequemodas/ui';
import { formatDateTimeEs, isValidWhatsAppPhone } from '@pequemodas/utils';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { settings } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats
  });

  const stats = data?.stats;
  const recent = data?.recentActivity ?? [];
  const freeQuotaMb = 1024;
  const usedMb = stats ? Math.round((stats.storageBytesUsed / (1024 * 1024)) * 100) / 100 : 0;
  const whatsappReady = isValidWhatsAppPhone(settings?.whatsapp_phone);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Hola, bienvenida al Panel de tu Tienda
          </h1>
          <p className="text-sm text-slate-600">
            Administra productos, fotografías, precios en CUP y disponibilidad desde tu teléfono.
          </p>
        </div>
        <Link to="/productos/nuevo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nuevo producto</Button>
        </Link>
      </div>

      {!whatsappReady && (
        <Alert variant="warning" title="Número de WhatsApp pendiente de configurar">
          Para recibir pedidos de tus clientes por WhatsApp, configura tu número telefónico en{' '}
          <Link to="/configuracion" className="font-bold underline">
            Ajustes de la Tienda
          </Link>
          .
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          {error instanceof Error ? error.message : 'Error al cargar métricas.'}
        </Alert>
      )}

      {isLoading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Productos</span>
              <Package className="h-4 w-4 text-brand-600" />
            </div>
            <p className="font-heading text-3xl font-extrabold text-slate-900">
              {stats.totalProducts}
            </p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Publicados</span>
              <Eye className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="font-heading text-3xl font-extrabold text-emerald-700">
              {stats.publishedProducts}
            </p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Ocultos / Borrador</span>
              <EyeOff className="h-4 w-4 text-slate-500" />
            </div>
            <p className="font-heading text-3xl font-extrabold text-slate-700">
              {stats.hiddenProducts}
            </p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Agotados</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="font-heading text-3xl font-extrabold text-rose-600">
              {stats.outOfStockProducts}
            </p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Categorías</span>
              <FolderTree className="h-4 w-4 text-sky-600" />
            </div>
            <p className="font-heading text-3xl font-extrabold text-sky-700">
              {stats.categoriesCount}
            </p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Solicitudes WhatsApp</span>
              <MessageSquare className="h-4 w-4 text-whatsapp-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-3xl font-extrabold text-slate-900">
                {stats.orderRequestsCount}
              </p>
              <span className="text-xs text-slate-500">
                ({stats.confirmedOrdersCount} confirmados)
              </span>
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-sky-600" />
              Uso de Almacenamiento (Supabase Storage)
            </h2>
            <Badge tone="sky">{usedMb} MB / 1024 MB</Badge>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (usedMb / freeQuotaMb) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Todas las fotografías se comprimen automáticamente a formato WebP y generan
            miniatura ligera antes de subirse para cuidar la cuota gratuita.
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-heading text-base font-bold text-slate-900">
            Actividad Reciente
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">
              Aún no hay movimientos registrados. Crea tu primera categoría o producto para
              comenzar.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recent.slice(0, 5).map((log) => (
                <li key={log.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{log.action}</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatDateTimeEs(log.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
