import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { AnimatedBrandCloudsLogo, Button } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface RemoteAdminVersion {
  version?: string;
  summary?: string;
}

const POLL_MS = 15_000;
const MIN_GAP_MS = 6_000;

export function AdminLiveUpdateCard() {
  const { settings } = useAuth();
  const [deferredInstall, setDeferredInstall] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstall(e as BeforeInstallPromptEvent);
    };

    const check = (force = false) => {
      if (cancelled || navigator.onLine === false) return;
      if (!force && document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (!force && now - lastCheckRef.current < MIN_GAP_MS) return;
      lastCheckRef.current = now;

      void fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
        .then((r) => (r.ok ? (r.json() as Promise<RemoteAdminVersion>) : null))
        .then((json) => {
          if (cancelled || !json?.version) return;
          if (json.version !== APP_RELEASE.version) {
            setRemoteVersion(json.version);
            if (json.summary) setRemoteSummary(json.summary);
          }
        })
        .catch(() => undefined);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    check(true);
    const timer = window.setInterval(() => check(false), POLL_MS);
    const onFocus = () => check(true);
    const onVis = () => {
      if (document.visibilityState === 'visible') check(true);
    };
    const onPointer = () => check(false);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onFocus);
    window.addEventListener('pointerdown', onPointer, { passive: true });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onFocus);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const hasUpdate = Boolean(remoteVersion && dismissedFor !== remoteVersion);
  const canInstall = Boolean(deferredInstall) && !installDismissed;

  if (!hasUpdate && !canInstall) return null;

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const targetVer = remoteVersion || APP_RELEASE.version;

  const handleApplyUpdate = async () => {
    setReloading(true);
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((k) => !k.includes('media'))
            .map((oldKey) => window.caches.delete(oldKey))
        );
      }
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }
    } finally {
      window.location.reload();
    }
  };

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={
        hasUpdate
          ? `Nueva actualización v${targetVer} disponible`
          : `Instalar panel de ${storeName}`
      }
      className="fixed bottom-20 lg:bottom-5 right-3 left-3 sm:left-auto sm:w-[400px] z-50 rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-brand-300 shadow-elevated p-4"
    >
      <button
        type="button"
        onClick={() =>
          hasUpdate ? setDismissedFor(targetVer) : setInstallDismissed(true)
        }
        aria-label="Cerrar aviso"
        className="absolute top-3 right-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className="w-24 shrink-0 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-sky-50 border border-brand-100 p-1.5">
          <AnimatedBrandCloudsLogo
            logoUrl={settings?.logo_url}
            commercialName={storeName}
            className="w-full"
          />
        </div>
        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-700">
            <Sparkles className="h-3 w-3" />
            Panel PWA · v{targetVer}
          </span>
          <h3 className="font-heading text-sm font-extrabold text-slate-900 leading-snug">
            {hasUpdate
              ? '¡Nueva actualización del panel lista!'
              : 'Instala tu Panel en el teléfono o PC'}
          </h3>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
        {hasUpdate
          ? remoteSummary || APP_RELEASE.summary
          : 'Abre tu panel administrativo directo desde tu pantalla de inicio con carga instantánea y caché inteligente.'}
      </p>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            hasUpdate ? setDismissedFor(targetVer) : setInstallDismissed(true)
          }
        >
          Más tarde
        </Button>
        {hasUpdate ? (
          <Button
            size="sm"
            isLoading={reloading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void handleApplyUpdate()}
          >
            Actualizar a v{targetVer}
          </Button>
        ) : (
          <Button
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={async () => {
              if (!deferredInstall) return;
              await deferredInstall.prompt();
              await deferredInstall.userChoice;
              setDeferredInstall(null);
            }}
          >
            Instalar Panel
          </Button>
        )}
      </div>
    </aside>
  );
}
