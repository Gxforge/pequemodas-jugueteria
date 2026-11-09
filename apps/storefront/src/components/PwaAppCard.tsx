import React from 'react';
import { Download, RefreshCw, Share2, Sparkles, X } from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import {
  AnimatedBrandCloudsLogo,
  Button,
  IosInstallSteps,
  useIosInstallGuide
} from '@pequemodas/ui';
import { useStorefront } from '../context/StorefrontContext';
import { usePwaInstall } from '../pwa/usePwaInstall';

export function PwaAppCard() {
  const { settings } = useStorefront();
  const {
    canInstall,
    hasUpdate,
    targetVersion,
    updateSummary,
    isUpdating,
    promptInstall,
    applyUpdate,
    dismissCard
  } = usePwaInstall();
  const {
    guide: iosGuide,
    dismissed: iosDismissed,
    dismiss: dismissIos
  } = useIosInstallGuide('storefront-v3.1.3');

  // Safari en iPhone nunca dispara beforeinstallprompt: se guía el paso manual.
  const showIosGuide =
    !hasUpdate && !canInstall && !iosDismissed && Boolean(iosGuide.canShow);
  if (!hasUpdate && !canInstall && !showIosGuide) return null;

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const handleDismiss = () => {
    if (showIosGuide) dismissIos();
    else dismissCard();
  };

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={
        hasUpdate
          ? `Actualización disponible de ${storeName}`
          : showIosGuide
            ? `Cómo añadir ${storeName} a tu ${iosGuide.deviceLabel}`
            : `Instalar aplicación web ${storeName}`
      }
      className="fixed bottom-20 md:bottom-5 right-3 left-3 sm:left-auto sm:w-[405px] z-50 rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-brand-300 shadow-elevated p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar aviso de aplicación"
        className="absolute top-3 right-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3.5 pr-6">
        <div className="w-28 shrink-0 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-sky-50 border border-brand-100 p-1.5">
          <AnimatedBrandCloudsLogo
            logoUrl={settings?.logo_url}
            commercialName={storeName}
            className="w-full"
          />
        </div>

        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-700">
            {showIosGuide ? (
              <Share2 className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {showIosGuide
              ? `${iosGuide.deviceLabel} / iPad`
              : `${APP_RELEASE.appLabel} · v${targetVersion}`}
          </span>
          <h3 className="font-heading text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
            {hasUpdate
              ? '¡Nueva versión de la tienda lista!'
              : showIosGuide
                ? `Añade ${storeName} a tu ${iosGuide.deviceLabel}`
                : `Instala ${storeName} en tu equipo`}
          </h3>
        </div>
      </div>

      {showIosGuide ? (
        <IosInstallSteps guide={iosGuide} appName={storeName} />
      ) : (
        <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
          {hasUpdate
            ? `Actualiza la tienda a la versión v${targetVersion} sin perder tu carrito ni tus fotos guardadas: ${updateSummary}`
            : `Esta página funciona como Aplicación Web instalable (v${APP_RELEASE.version}): abre al instante, guarda en caché las fotos por ID para no gastar datos dos veces y carga el texto rápido incluso con señal débil.`}
        </p>
      )}

      <div className="mt-3.5 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          Más tarde
        </Button>
        {hasUpdate ? (
          <Button
            size="sm"
            isLoading={isUpdating}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void applyUpdate()}
          >
            {isUpdating ? 'Actualizando...' : `Actualizar a v${targetVersion}`}
          </Button>
        ) : showIosGuide ? (
          <Button size="sm" onClick={dismissIos}>
            Entendido
          </Button>
        ) : (
          <Button
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => void promptInstall()}
          >
            Instalar Aplicación
          </Button>
        )}
      </div>
    </aside>
  );
}
