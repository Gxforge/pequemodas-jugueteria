import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Database, HelpCircle, Image as ImageIcon, X } from 'lucide-react';
import { fetchDashboardStats, fetchDualProjectOverview } from '@pequemodas/shared';
import { Badge, Button, Card, Skeleton } from '@pequemodas/ui';

function bytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

export function DatabasesPage() {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('unidad') || '';
  const [showHelp, setShowHelp] = useState(false);

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats
  });

  const { data: overview } = useQuery({
    queryKey: ['admin-dual-overview'],
    queryFn: fetchDualProjectOverview
  });

  const stats = dash?.stats;
  const db1UsedMb = overview ? bytesToMb(overview.p1.dbBytesUsed) : 0;
  const db2UsedMb = overview?.p2 ? bytesToMb(overview.p2.dbBytesUsed) : 0;
  const st1UsedMb = overview
    ? bytesToMb(overview.p1.storageBytesUsed || stats?.storageBytesUsed || 0)
    : stats
      ? bytesToMb(stats.storageBytesUsed)
      : 0;
  const st2UsedMb = overview?.p2 ? bytesToMb(overview.p2.storageBytesUsed) : 0;

  const cards = [
    {
      id: 'bd-1',
      code: 'BD-1',
      title: 'BD-1 · Catálogo, Secciones y Ajustes',
      description:
        'Guarda tus productos, precios en CUP, variantes de talla o color, secciones, inventario y los primeros clientes que te escriben.',
      usedMb: db1UsedMb,
      quotaMb: 500,
      colorHex: '#0284c7',
      icon: Database,
      summaryPill: `${stats?.totalProducts ?? 0} productos · ${stats?.categoriesCount ?? 0} secciones`,
      extraNote: `${overview?.p1.contactsCount ?? 0} conversaciones guardadas aquí`
    },
    {
      id: 'bd-2',
      code: 'BD-2',
      title: 'BD-2 · Conversaciones y Pedidos',
      description:
        'Memoria gemela para guardar mensajes del chat en vivo, pedidos directos enviados por tus clientes y avisos de atención.',
      usedMb: db2UsedMb,
      quotaMb: 500,
      colorHex: '#10b981',
      icon: Database,
      summaryPill: `${overview?.p2?.contactsCount ?? 0} conversaciones · ${overview?.p2?.directOrdersCount ?? 0} pedidos`,
      extraNote: 'Lista y activa para recibir nuevos clientes sin llenarse'
    },
    {
      id: 'bd-3',
      code: 'BD-3',
      title: 'BD-3 · Espacio de Fotografías 1',
      description:
        'Guarda las fotografías de tus artículos, las portadas de categorías y el logotipo oficial de tu tienda en formato ligero.',
      usedMb: st1UsedMb,
      quotaMb: 1024,
      colorHex: '#ec4899',
      icon: ImageIcon,
      summaryPill: `${Math.max(0, 1024 - st1UsedMb).toFixed(1)} MB libres`,
      extraNote: 'Espacio aproximado para más de 8 000 fotos optimizadas'
    },
    {
      id: 'bd-4',
      code: 'BD-4',
      title: 'BD-4 · Espacio de Fotografías 2',
      description:
        'Memoria adicional de fotografías que trabaja automáticamente junto a BD-3 para duplicar tu capacidad de imágenes.',
      usedMb: st2UsedMb,
      quotaMb: 1024,
      colorHex: '#8b5cf6',
      icon: ImageIcon,
      summaryPill: `${Math.max(0, 1024 - st2UsedMb).toFixed(1)} MB libres`,
      extraNote: 'Espacio adicional automático para miles de fotos nuevas'
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">
              Base de Datos y Espacio
            </h1>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-label="¿Cómo funcionan las bases de datos?"
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-extrabold text-brand-700 hover:bg-brand-100"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>¿Cómo funciona?</span>
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Consulta cuánto espacio libre tienes en cada unidad (BD-1, BD-2, BD-3 y BD-4).
          </p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Volver al resumen
          </Button>
        </Link>
      </div>

      {showHelp && (
        <Card className="bg-gradient-to-r from-sky-50 via-white to-brand-50 border-sky-200 flex items-start justify-between gap-3">
          <div className="space-y-1 text-xs sm:text-sm text-slate-700">
            <p className="font-heading font-extrabold text-slate-900">
              Todo se organiza solo sin que tengas que configurar nada
            </p>
            <p>
              Tu tienda cuenta con <strong>4 unidades de memoria (BD-1 a BD-4)</strong>: dos
              para textos, productos y mensajes (<strong>1 000 MB</strong> en total) y dos
              exclusivas para fotografías (<strong>2 048 MB</strong> en total). Cada vez que
              subes fotos o te escribe un cliente, el sistema reparte el espacio solo para
              que tu tienda vaya siempre rápida.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            aria-label="Cerrar explicación"
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}

      {isLoading && !dash ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            const freeMb = Math.max(0, c.quotaMb - c.usedMb);
            const pct = Math.min(100, Math.max(2, (c.usedMb / c.quotaMb) * 100));
            const highlighted = selectedId === c.id;

            return (
              <Card
                key={c.id}
                className={`space-y-3.5 transition-all ${
                  highlighted ? 'ring-2 ring-brand-500 border-brand-300' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.colorHex}18`, color: c.colorHex }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {c.code}
                      </span>
                      <h2 className="font-heading text-base font-extrabold text-slate-900">
                        {c.title}
                      </h2>
                    </div>
                  </div>
                  <Badge tone="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Activa
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {c.description}
                </p>

                <div className="space-y-1.5 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: c.colorHex }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>Ocupado: {c.usedMb.toFixed(2)} MB</span>
                    <span>
                      Disponible: {freeMb.toFixed(1)} MB de {c.quotaMb} MB
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-0.5">
                  <span className="font-bold text-slate-700">{c.summaryPill}</span>
                  <span>{c.extraNote}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
