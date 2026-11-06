import React, { useState } from 'react';
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { Button, Card } from '@pequemodas/ui';

type ViewportPreset = 'mobile' | 'tablet' | 'desktop';

const STORE_ROUTES = [
  { path: '/', label: 'Portada Principal' },
  { path: '/catalogo', label: 'Catálogo Completo' },
  { path: '/categorias', label: 'Secciones Visuales' },
  { path: '/carrito', label: 'Carrito y Compra' },
  { path: '/tienda', label: 'Sobre la Tienda' }
];

function resolveStorefrontBaseUrl(): string {
  const configured = (import.meta.env.VITE_STOREFRONT_PUBLIC_URL as string | undefined)?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5173';
  }
  return 'https://pequemodas.vercel.app';
}

export function StorePreviewPage() {
  const [viewport, setViewport] = useState<ViewportPreset>('mobile');
  const [route, setRoute] = useState('/');
  const [refreshSeed, setRefreshSeed] = useState(0);

  const baseUrl = resolveStorefrontBaseUrl();
  const previewUrl = `${baseUrl}${route}${route.includes('?') ? '&' : '?'}preview=${refreshSeed}`;

  const frameDims =
    viewport === 'mobile'
      ? 'w-full max-w-[392px] h-[720px] rounded-[2.2rem] border-[8px] border-slate-800 shadow-2xl'
      : viewport === 'tablet'
        ? 'w-full max-w-[780px] h-[760px] rounded-[1.8rem] border-[6px] border-slate-800 shadow-xl'
        : 'w-full h-[760px] rounded-2xl border border-slate-200 shadow-card';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Vista Previa de tu Tienda
          </h1>
          <p className="text-sm text-slate-600">
            Mira exactamente cómo ven tus clientes la tienda desde un teléfono Android, tablet o computadora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => setRefreshSeed((n) => n + 1)}
          >
            Actualizar vista
          </Button>
          <a href={`${baseUrl}${route}`} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              Abrir tienda real
            </Button>
          </a>
        </div>
      </div>

      {/* Barra de controles */}
      <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STORE_ROUTES.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => setRoute(item.path)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                route === item.path
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              viewport === 'mobile' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Teléfono
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              viewport === 'tablet' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
            Tablet
          </button>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              viewport === 'desktop' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            PC
          </button>
        </div>
      </Card>

      {/* Simulador interactivo en vivo */}
      <div className="flex justify-center bg-gradient-to-b from-brand-50/40 via-slate-100/70 to-sky-50/40 rounded-3xl p-4 sm:p-6 border border-slate-200/80">
        <div className={`${frameDims} bg-white overflow-hidden transition-all duration-300`}>
          <iframe
            key={previewUrl}
            src={previewUrl}
            title="Vista previa interactiva de PequeModas-Juguetería"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
