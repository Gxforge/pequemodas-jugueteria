import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { AnimatedBrandCloudsLogo } from '@pequemodas/ui';
import { useStorefront } from '../context/StorefrontContext';

const BOOT_SESSION_KEY = `pequemodas.boot.${APP_RELEASE.version}`;

function decodeImageAsset(src: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(resolve).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

async function preloadEssentialVisuals(customLogoUrl?: string | null): Promise<void> {
  const urls = [
    '/brand/logo-foreground.webp',
    '/brand/cloud-wide.webp',
    '/brand/cloud-side.webp'
  ];
  if (customLogoUrl) urls.push(customLogoUrl);
  await Promise.all(urls.map(decodeImageAsset));
}

export function AppBootSplash() {
  const { settings, isLoading } = useStorefront();
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(BOOT_SESSION_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [fading, setFading] = useState(false);
  const [stepLabel, setStepLabel] = useState('Preparando tu vitrina infantil...');
  const [progress, setProgress] = useState(22);

  const isLoadingRef = useRef(isLoading);
  const logoUrlRef = useRef(settings?.logo_url);
  isLoadingRef.current = isLoading;
  logoUrlRef.current = settings?.logo_url;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const waitForDataReady = () =>
      new Promise<void>((resolve) => {
        const start = Date.now();
        const check = () => {
          if (cancelled || !isLoadingRef.current || Date.now() - start > 2600) {
            resolve();
            return;
          }
          window.setTimeout(check, 80);
        };
        check();
      });

    const runBoot = async () => {
      const minPolish = new Promise((r) => window.setTimeout(r, 1150));
      const safetyCap = new Promise((r) => window.setTimeout(r, 3800));

      const tasks = (async () => {
        if ('serviceWorker' in navigator && import.meta.env.PROD) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              await reg.update().catch(() => undefined);
              if (reg.waiting) {
                setStepLabel('Aplicando actualización nueva...');
                setProgress(88);
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
                window.setTimeout(() => window.location.reload(), 220);
                return;
              }
            }
          } catch {
            // Seguir arranque normal
          }
        }

        if (cancelled) return;
        setStepLabel('Cargando logotipo y nubes animadas en alta nitidez...');
        setProgress(56);
        await preloadEssentialVisuals(logoUrlRef.current);

        if (cancelled) return;
        setStepLabel('Sincronizando secciones y catálogo rápido...');
        setProgress(84);
        await waitForDataReady();

        // Si llegó un logo personalizado de la tienda tras cargar ajustes, decodificarlo antes de abrir
        if (logoUrlRef.current) {
          await decodeImageAsset(logoUrlRef.current);
        }
      })();

      await Promise.race([Promise.all([minPolish, tasks]), safetyCap]);
      if (cancelled) return;

      setStepLabel('¡Todo listo!');
      setProgress(100);
      setFading(true);
      try {
        window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
      } catch {
        // Ignorar si sessionStorage está restringido
      }
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, 280);
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
          logoUrl={settings?.logo_url}
          commercialName={settings?.commercial_name || BRAND_IDENTITY.commercialName}
          className="w-64 sm:w-72 mx-auto"
        />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-brand-200 px-3 py-1 text-xs font-extrabold text-brand-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {APP_RELEASE.appLabel} · v{APP_RELEASE.version}
        </div>

        <div className="w-52 mx-auto h-2 rounded-full bg-brand-100/90 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-sky-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs font-semibold text-slate-600">{stepLabel}</p>
      </div>
    </div>
  );
}
