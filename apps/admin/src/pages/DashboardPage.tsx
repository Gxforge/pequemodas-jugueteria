import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, MessageCircle, Plus } from 'lucide-react';
import { fetchDashboardStats, fetchDualProjectOverview } from '@pequemodas/shared';
import { Alert, Button, Card, Skeleton } from '@pequemodas/ui';
import { formatDateTimeEs, isValidWhatsAppPhone } from '@pequemodas/utils';
import {
  DashboardVisualChart,
  formatHumanAuditAction,
  MetricSvgChatOrders,
  MetricSvgMini,
  MetricSvgShowcase
} from '../components/DashboardIllustrations';
import { InfrastructureDualPoolSection } from '../components/InfrastructureDualPoolSection';
import { useAuth } from '../context/AuthContext';

function bytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

export function DashboardPage() {
  const { settings, profile } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats
  });

  const { data: dualOverview } = useQuery({
    queryKey: ['admin-dual-overview'],
    queryFn: fetchDualProjectOverview
  });

  const stats = data?.stats;
  const recent = data?.recentActivity ?? [];
  const whatsappReady = isValidWhatsAppPhone(settings?.whatsapp_phone);

  const db1UsedMb = dualOverview ? bytesToMb(dualOverview.p1.dbBytesUsed) : 0;
  const db2UsedMb = dualOverview?.p2 ? bytesToMb(dualOverview.p2.dbBytesUsed) : 0;

  const storage1UsedMb = dualOverview
    ? bytesToMb(dualOverview.p1.storageBytesUsed || stats?.storageBytesUsed || 0)
    : stats
      ? bytesToMb(stats.storageBytesUsed)
      : 0;
  const storage2UsedMb = dualOverview?.p2
    ? bytesToMb(dualOverview.p2.storageBytesUsed)
    : 0;

  const directOrdersTotal = dualOverview?.totalDirectOrdersCount ?? 0;
  const combinedOrders = (stats?.orderRequestsCount ?? 0) + directOrdersTotal;
  const unreadChats = dualOverview?.totalUnreadChatsCount ?? 0;
  const contactsCount = dualOverview?.totalContactsCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Hola {profile?.full_name || 'Katia'}, bienvenida a tu tienda
          </h1>
          <p className="text-sm text-slate-600">
            Resumen en vivo con doble servidor activo (2 GB para fotos + Round-Robin en chats y datos).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/vista-previa">
            <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
              Ver tienda
            </Button>
          </Link>
          <Link to="/productos/nuevo">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Subir producto</Button>
          </Link>
        </div>
      </div>

      {!whatsappReady && (
        <Alert variant="warning" title="Falta tu número de WhatsApp">
          Tus clientes ya pueden comprarte directo desde la aplicación, pero si deseas activar
          también el botón de WhatsApp agrégale tu número en{' '}
          <Link to="/configuracion" className="font-bold underline">
            Ajustes
          </Link>
          .
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          {error instanceof Error ? error.message : 'No se pudo cargar el resumen.'}
        </Alert>
      )}

      {isLoading || !stats ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-brand-50/80 via-white to-white border-brand-100 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                  Catálogo en Vitrina
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-extrabold text-slate-900">
                    {stats.publishedProducts}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    de {stats.totalProducts} artículos creados
                  </span>
                </div>
                <Link
                  to="/productos"
                  className="inline-block text-xs font-bold text-brand-600 hover:underline pt-1"
                >
                  Administrar artículos →
                </Link>
              </div>
              <MetricSvgShowcase />
            </Card>

            <Card className="bg-gradient-to-br from-sky-50/80 via-white to-white border-sky-100 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                  Pedidos y Conversaciones
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-extrabold text-slate-900">
                    {combinedOrders}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    solicitudes · {unreadChats} chats sin leer
                  </span>
                </div>
                <Link
                  to="/mensajes"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline pt-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Abrir chat de clientes →
                </Link>
              </div>
              <MetricSvgChatOrders />
            </Card>
          </div>

          <DashboardVisualChart
            rows={[
              {
                label: 'Productos publicados en tienda',
                value: stats.publishedProducts,
                colorHex: '#ec4899',
                bgClass: 'bg-brand-500'
              },
              {
                label: 'Secciones y categorías activas',
                value: stats.categoriesCount,
                colorHex: '#0284c7',
                bgClass: 'bg-sky-600'
              },
              {
                label: 'Compras directas en la App',
                value: directOrdersTotal,
                colorHex: '#10b981',
                bgClass: 'bg-emerald-500'
              },
              {
                label: 'Solicitudes enviadas a WhatsApp',
                value: stats.orderRequestsCount,
                colorHex: '#f59e0b',
                bgClass: 'bg-amber-500'
              }
            ]}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="flex items-center gap-3">
              <MetricSvgMini variant="sections" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Categorías</p>
                <p className="font-heading text-2xl font-extrabold text-slate-900">
                  {stats.categoriesCount}
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <MetricSvgMini variant="contacts" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Clientes en Chat</p>
                <p className="font-heading text-2xl font-extrabold text-emerald-700">
                  {contactsCount}
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <MetricSvgMini variant="drafts" />
              <div>
                <p className="text-xs font-semibold text-slate-500">En Borrador</p>
                <p className="font-heading text-2xl font-extrabold text-slate-700">
                  {stats.hiddenProducts}
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <MetricSvgMini variant="soldout" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Agotados</p>
                <p className="font-heading text-2xl font-extrabold text-rose-600">
                  {stats.outOfStockProducts}
                </p>
              </div>
            </Card>
          </div>
        </>
      )}

      <InfrastructureDualPoolSection
        storage1UsedMb={storage1UsedMb}
        storage2UsedMb={storage2UsedMb}
        db1UsedMb={db1UsedMb}
        db2UsedMb={db2UsedMb}
        contactsCount={contactsCount}
        dualOverview={dualOverview}
      />

      <Card className="space-y-3">
        <h2 className="font-heading text-base font-extrabold text-slate-900">
          Últimos Movimientos en tu Tienda
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            Todavía no hay movimientos recientes. Todo lo que actualices aparecerá aquí explicado de forma sencilla.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recent.slice(0, 6).map((log) => (
              <li
                key={log.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <span className="font-semibold text-slate-800">
                  {formatHumanAuditAction(
                    log.action,
                    log.metadata as Record<string, unknown> | null
                  )}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {formatDateTimeEs(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
