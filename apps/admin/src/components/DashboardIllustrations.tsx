import React from 'react';

export function formatHumanAuditAction(
  action: string,
  metadata?: Record<string, unknown> | null
): string {
  const name = typeof metadata?.name === 'string' && metadata.name.trim()
    ? ` «${metadata.name.trim()}»`
    : '';

  const dictionary: Record<string, string> = {
    'settings.update': 'Se actualizaron los datos generales de la tienda',
    'settings.logo_upload': 'Se actualizó el logotipo oficial de la tienda',
    'category.create': `Se creó una nueva sección${name}`,
    'category.update': `Se actualizaron los detalles de la sección${name}`,
    'category.delete': 'Se eliminó una sección del catálogo',
    'product.create': `Se publicó o guardó un nuevo artículo${name}`,
    'product.update': `Se editaron los datos de un artículo${name}`,
    'product.delete': 'Se retiró un artículo del catálogo',
    'product.image_upload': 'Se subieron nuevas fotografías de producto',
    'product.image_delete': 'Se eliminó una fotografía de producto',
    'inventory.update': 'Se ajustó la cantidad disponible en inventario',
    'order.status_change': 'Se actualizó el estado de un pedido',
    'team.invite': 'Se creó un enlace de invitación para el equipo',
    'team.accept_invite': 'Un miembro del equipo activó su cuenta',
    'team.toggle_active': 'Se cambió el acceso de un miembro del equipo'
  };

  if (dictionary[action]) return dictionary[action]!;
  if (action.startsWith('category.')) return `Cambio en secciones${name}`;
  if (action.startsWith('product.')) return `Cambio en artículos del catálogo${name}`;
  if (action.startsWith('settings.')) return 'Ajuste general en la configuración';
  if (action.startsWith('inventory.')) return 'Actualización de existencias';
  return 'Movimiento registrado en la tienda';
}

export function MetricSvgShowcase() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
      <rect x="4" y="6" width="40" height="36" rx="12" fill="#fce7f3" />
      <path d="M15 20h18l-2 15H17l-2-15z" fill="#ec4899" />
      <path
        d="M19 20v-3a5 5 0 0110 0v3"
        fill="none"
        stroke="#be185d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="35" cy="14" r="5" fill="#38bdf8" />
    </svg>
  );
}

export function MetricSvgChatOrders() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
      <rect x="4" y="6" width="40" height="36" rx="12" fill="#e0f2fe" />
      <path
        d="M13 16h22a3 3 0 013 3v10a3 3 0 01-3 3H21l-7 5v-5h-1a3 3 0 01-3-3V19a3 3 0 013-3z"
        fill="#0284c7"
      />
      <circle cx="20" cy="24" r="2" fill="#ffffff" />
      <circle cx="25" cy="24" r="2" fill="#ffffff" />
      <circle cx="30" cy="24" r="2" fill="#ffffff" />
    </svg>
  );
}

export function MetricSvgMini({
  variant
}: {
  variant: 'sections' | 'drafts' | 'soldout' | 'contacts';
}) {
  if (variant === 'sections') {
    return (
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#e0f2fe" />
        <rect x="9" y="9" width="9" height="9" rx="3" fill="#0284c7" />
        <rect x="22" y="9" width="9" height="9" rx="3" fill="#ec4899" />
        <rect x="9" y="22" width="9" height="9" rx="3" fill="#f59e0b" />
        <rect x="22" y="22" width="9" height="9" rx="3" fill="#10b981" />
      </svg>
    );
  }
  if (variant === 'drafts') {
    return (
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#f1f5f9" />
        <path d="M12 27l3-9 10-8 4 4-8 10-9 3z" fill="#64748b" />
      </svg>
    );
  }
  if (variant === 'soldout') {
    return (
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#ffe4e6" />
        <path d="M20 10l10 18H10l10-18z" fill="#e11d48" />
        <rect x="19" y="17" width="2" height="5" rx="1" fill="#ffffff" />
        <circle cx="20" cy="25" r="1.3" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#dcfce7" />
      <circle cx="20" cy="15" r="5" fill="#059669" />
      <path d="M11 29c1.5-5 16.5-5 18 0" fill="#059669" />
    </svg>
  );
}

export interface ChartBarRow {
  label: string;
  value: number;
  colorHex: string;
  bgClass: string;
}

export function DashboardVisualChart({ rows }: { rows: ChartBarRow[] }) {
  const maxVal = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-extrabold text-slate-900">
            Panorama Visual de tu Tienda
          </h2>
          <p className="text-xs text-slate-500">
            Proporción actual entre artículos publicados, secciones, pedidos y atención.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-extrabold">
          {total} registros activos
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const pct = Math.max(row.value > 0 ? 8 : 2, Math.round((row.value / maxVal) * 100));
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{row.label}</span>
                <span className="text-slate-900">{row.value}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <rect
                    x="0"
                    y="0"
                    width={`${pct}%`}
                    height="100%"
                    rx="6"
                    fill={row.colorHex}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
