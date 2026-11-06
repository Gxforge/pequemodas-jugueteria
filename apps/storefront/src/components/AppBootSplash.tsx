import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { AnimatedBrandCloudsLogo } from '@pequemodas/ui';

const BOOT_SESSION_KEY = `pequemodas.boot.${APP_RELEASE.version}`;

function preloadBrandAssets(): Promise<void> {
  const urls = [
    '/brand/logo-foreground.webp',
    '/brand/cloud-wide.webp',
    '/brand/cloud-side.webp'
  ];
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  ).then(() => undefined);
}

export function AppBootSplash() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(BOOT_SESSION_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [fading, setFading] = useState(false);
  const [stepLabel, setStepLabel] = useState(
    'Verificando versión de la aplicación web...'
  );
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const runBoot = async () => {
      const minDisplay = new Promise((r) => window.setTimeout(r, 420));
      const hardCap = new Promise((r) => window.setTimeout(r, 950));

      const tasks = (async () => {
        // 1. Verificar Service Worker / versión nueva disponible al arrancar
        if ('serviceWorker' in navigator && import.meta.env.PROD) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              await reg.update().catch(() => undefined);
              if (reg.waiting) {
                setStepLabel('Aplicando nueva versión disponible...');
                setProgress(85);
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
                window.setTimeout(() => window.location.reload(), 250);
                return;
              }
            }
          } catch {
            // Continuar arranque normal
          }
        }

        if (cancelled) return;
        setStepLabel('Precargando capas gráficas y caché inteligente...');
        setProgress(75);
        await preloadBrandAssets();
      })();

      await Promise.race([Promise.all([minDisplay, tasks]), hardCap]);
      if (cancelled) return;

      setProgress(100);
      setFading(true);
      try {
        window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
      } catch {
        // Ignorar si sessionStorage está restringido
      }
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, 260);
    };

    void runBoot();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-6 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-xs sm:max-w-sm text-center space-y-4">
        <AnimatedBrandCloudsLogo
          commercialName={BRAND_IDENTITY.commercialName}
          className="w-64 sm:w-72 mx-auto"
        />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-brand-200 px-3 py-1 text-xs font-extrabold text-brand-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {APP_RELEASE.appLabel} · v{APP_RELEASE.version}
        </div>

        <div className="w-48 mx-auto h-1.5 rounded-full bg-brand-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs font-semibold text-slate-500">{stepLabel}</p>
      </div>
    </div>
  );
}
