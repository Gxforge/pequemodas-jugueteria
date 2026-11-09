import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_RELEASE } from '@pequemodas/config';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface RemoteVersionPayload {
  version?: string;
  summary?: string;
}

const IMAGE_ID_CACHE = 'pequemodas-img-by-id-v1';
const LIVE_POLL_INTERVAL_MS = 15_000;
const MIN_CHECK_GAP_MS = 6_000;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [updateRegistration, setUpdateRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const lastCheckAtRef = useRef<number>(0);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let disposed = false;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const checkRemoteVersion = (force = false) => {
      if (disposed) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      if (
        !force &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return;
      lastCheckAtRef.current = now;

      void fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
        .then((r) => (r.ok ? (r.json() as Promise<RemoteVersionPayload>) : null))
        .then((json) => {
          if (disposed || !json?.version) return;
          if (json.version !== APP_RELEASE.version) {
            setRemoteVersion(json.version);
            if (json.summary) setRemoteSummary(json.summary);
          }
        })
        .catch(() => undefined);

      if (swRegRef.current) {
        void swRegRef.current.update().catch(() => undefined);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Chequeo inmediato al arrancar + vigilancia continua en pestañas abiertas sin recargar
    checkRemoteVersion(true);

    const pollTimer = window.setInterval(() => {
      checkRemoteVersion(false);
    }, LIVE_POLL_INTERVAL_MS);

    const onFocus = () => checkRemoteVersion(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkRemoteVersion(true);
      }
    };
    const onOnline = () => checkRemoteVersion(true);
    const onInteraction = () => checkRemoteVersion(false);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('pointerdown', onInteraction, { passive: true });

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      // Un Service Worker que se instala por PRIMERA vez también dispara
      // `updatefound`. Solo es una actualización real si ya había un SW activo.
      const hadActiveWorker = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (disposed) return;
          swRegRef.current = reg;
          if (hadActiveWorker && reg.waiting && navigator.serviceWorker.controller) {
            setUpdateRegistration(reg);
          }
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing || !hadActiveWorker) return;
            installing.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateRegistration(reg);
                setDismissedVersion(null);
              }
            });
          });
          void reg.update().catch(() => undefined);
        })
        .catch(() => undefined);
    }

    return () => {
      disposed = true;
      window.clearInterval(pollTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pointerdown', onInteraction);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Limpia cachés de shell antiguos pero conserva intacta la caché de imágenes por ID
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((k) => k !== IMAGE_ID_CACHE)
            .map((oldCache) => window.caches.delete(oldCache))
        );
      }

      if ('serviceWorker' in navigator) {
        const reg =
          updateRegistration ??
          swRegRef.current ??
          (await navigator.serviceWorker.getRegistration());
        if (reg?.waiting) {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 650);
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => {
                window.clearTimeout(timer);
                resolve();
              },
              { once: true }
            );
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          });
        } else if (reg) {
          await reg.update().catch(() => undefined);
        }
      }
    } finally {
      window.location.reload();
    }
  }, [updateRegistration]);

  const targetVersion = remoteVersion || APP_RELEASE.version;
  const rawHasUpdate = Boolean(updateRegistration || remoteVersion);
  const hasUpdate = rawHasUpdate && dismissedVersion !== targetVersion;

  const dismissCard = useCallback(() => {
    if (rawHasUpdate) {
      setDismissedVersion(targetVersion);
    } else {
      setInstallDismissed(true);
    }
  }, [rawHasUpdate, targetVersion]);

  return {
    canInstall: Boolean(deferredPrompt) && !installDismissed,
    hasUpdate,
    targetVersion,
    updateSummary: remoteSummary || APP_RELEASE.summary,
    isUpdating,
    promptInstall,
    applyUpdate,
    dismissCard
  };
}
