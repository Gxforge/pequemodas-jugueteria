import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { Button } from '@pequemodas/ui';

interface RemoteAdminVersion {
  version?: string;
  summary?: string;
}

const POLL_MS = 15_000;
const MIN_GAP_MS = 6_000;

export function AdminLiveUpdateCard() {
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

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

    check(true);
    const timer = window.setInterval(() => check(false), POLL_MS);
    const onFocus = () => check(true);
    const onVis = () => {
      if (document.visibilityState === 'visible') check(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onFocus);
    };
  }, []);

  if (!remoteVersion || dismissedFor === remoteVersion) return null;

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={`Nueva actualización v${remoteVersion} disponible`}
      className="fixed bottom-20 lg:bottom-5 right-3 left-3 sm:left-auto sm:w-[390px] z-50 rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-brand-300 shadow-elevated p-4"
    >
      <button
        type="button"
        onClick={() => setDismissedFor(remoteVersion)}
        aria-label="Cerrar aviso de actualización"
        className="absolute top-3 right-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1.5 pr-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-700">
          <Sparkles className="h-3 w-3" />
          {BRAND_IDENTITY.commercialName} · v{remoteVersion}
        </span>
        <h3 className="font-heading text-sm font-extrabold text-slate-900">
          ¡Nueva actualización del panel disponible!
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {remoteSummary || APP_RELEASE.summary}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setDismissedFor(remoteVersion)}>
          Más tarde
        </Button>
        <Button
          size="sm"
          isLoading={reloading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={() => {
            setReloading(true);
            window.location.reload();
          }}
        >
          Actualizar a v{remoteVersion}
        </Button>
      </div>
    </aside>
  );
}
