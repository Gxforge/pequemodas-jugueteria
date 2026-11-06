import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { AnimatedBrandCloudsLogo } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

const ADMIN_BOOT_KEY = `pequemodas.admin.boot.${APP_RELEASE.version}`;

function decodeAsset(src: string): Promise<void> {
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

export function AdminBootSplash() {
  const { loading, settings } = useAuth();
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(ADMIN_BOOT_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [fading, setFading] = useState(false);
  const [stepLabel, setStepLabel] = useState('Iniciando panel de tu tienda...');
  const [progress, setProgress] = useState(25);

  const loadingRef = useRef(loading);
  const logoRef = useRef(settings?.logo_url);
  loadingRef.current = loading;
  logoRef.current = settings?.logo_url;

  useEffect(() => {
    // Registrar Service Worker de caché inteligente del Panel Admin (PWA instalable)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const waitAuthReady = () =>
      new Promise<void>((resolve) => {
        const start = Date.now();
        const check = () => {
          if (cancelled || !loadingRef.current || Date.now() - start > 2400) {
            resolve();
            return;
          }
          window.setTimeout(check, 70);
        };
        check();
      });

    const run = async () => {
      const minPolish = new Promise((r) => window.setTimeout(r, 950));
      const safetyCap = new Promise((r) => window.setTimeout(r, 3400));

      const tasks = (async () => {
        setStepLabel('Preparando logotipo y caché inteligente...');
        setProgress(58);
        const brandUrls = [
          '/brand/logo-foreground.webp',
          '/brand/cloud-wide.webp',
          '/brand/cloud-side.webp'
        ];
        if (logoRef.current) brandUrls.push(logoRef.current);
        await Promise.all(brandUrls.map(decodeAsset));

        if (cancelled) return;
        setStepLabel('Conectando secciones de productos, categorías y chat...');
        setProgress(86);
        await waitAuthReady();
        if (logoRef.current) {
          await decodeAsset(logoRef.current);
        }
      })();

      await Promise.race([Promise.all([minPolish, tasks]), safetyCap]);
      if (cancelled) return;

      setProgress(100);
      setStepLabel('¡Panel listo!');
      setFading(true);
      try {
        window.sessionStorage.setItem(ADMIN_BOOT_KEY, '1');
      } catch {
        // Ignorar si sessionStorage no está disponible
      }
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, 260);
    };

    void run();
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
          className="w-60 sm:w-68 mx-auto"
        />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-brand-200 px-3 py-1 text-xs font-extrabold text-brand-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Panel de Tienda · v{APP_RELEASE.version}
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
