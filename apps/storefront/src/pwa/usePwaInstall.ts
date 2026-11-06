import { useCallback, useEffect, useState } from 'react';
import { APP_RELEASE } from '@pequemodas/config';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const IMAGE_ID_CACHE = 'pequemodas-img-by-id-v1';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [updateRegistration, setUpdateRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Comprobar version.json en red sin caché para detectar despliegues nuevos
    void fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { version?: string } | null) => {
        if (json?.version && json.version !== APP_RELEASE.version) {
          setRemoteVersion(json.version);
        }
      })
      .catch(() => undefined);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (reg.waiting && navigator.serviceWorker.controller) {
            setUpdateRegistration(reg);
          }
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateRegistration(reg);
                setDismissed(false);
              }
            });
          });
          void reg.update().catch(() => undefined);
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
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
          updateRegistration ?? (await navigator.serviceWorker.getRegistration());
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

  const hasUpdate = Boolean(updateRegistration || remoteVersion);

  return {
    canInstall: Boolean(deferredPrompt) && !dismissed,
    hasUpdate: hasUpdate && !dismissed,
    targetVersion: remoteVersion || APP_RELEASE.version,
    isUpdating,
    promptInstall,
    applyUpdate,
    dismissCard: () => setDismissed(true)
  };
}
