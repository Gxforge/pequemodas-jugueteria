import React, { useCallback, useEffect, useState } from 'react';
import { Share2, Sparkles, X } from 'lucide-react';
import {
  readPwaBrowserEnv,
  resolveIosInstallGuide,
  type IosInstallGuide as PlatformGuide
} from '@pequemodas/utils';

const STORAGE_PREFIX = 'pequemodas-ios-guide';

export interface IosInstallGuideState {
  guide: PlatformGuide;
  dismissed: boolean;
  dismiss: () => void;
}

/** Detecta iPhone/iPad y recuerda si la usuaria ya cerró la guía. */
export function useIosInstallGuide(storageKey: string): IosInstallGuideState {
  const key = `${STORAGE_PREFIX}:${storageKey}`;
  const [guide, setGuide] = useState<PlatformGuide>(() =>
    resolveIosInstallGuide(readPwaBrowserEnv())
  );
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const refresh = () => setGuide(resolveIosInstallGuide(readPwaBrowserEnv()));
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Memoria privada de Safari: basta con ocultarla en esta sesión.
    }
  }, [key]);

  return { guide, dismissed, dismiss };
}

export function IosInstallSteps({
  guide,
  appName
}: {
  guide: PlatformGuide;
  appName: string;
}) {
  return (
    <div className="mt-2.5 rounded-2xl border border-sky-100 bg-sky-50/85 p-3">
      <p className="text-xs font-bold text-slate-700">
        En {guide.deviceLabel} se añade a mano desde Safari:
      </p>
      <ol className="mt-2 space-y-1.5 pl-5 text-xs leading-relaxed text-slate-700 list-decimal marker:font-extrabold marker:text-brand-600">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        No busques {appName} en el App Store: este acceso se crea desde Safari y
        después se abre como aplicación, sin barras del navegador.
      </p>
    </div>
  );
}

/** Tarjeta autónoma para pantallas sin el aviso PWA (por ejemplo, /acceso). */
export function IosInstallGuideCard({
  appName,
  storageKey,
  inline = false
}: {
  appName: string;
  storageKey: string;
  inline?: boolean;
}) {
  const { guide, dismissed, dismiss } = useIosInstallGuide(storageKey);
  if (!guide.canShow || dismissed) return null;

  return (
    <aside
      role="dialog"
      aria-label={`Cómo añadir ${appName} a tu ${guide.deviceLabel}`}
      className={
        inline
          ? 'relative rounded-3xl border-2 border-sky-200 bg-white/95 p-4 text-left shadow-soft'
          : 'fixed bottom-20 md:bottom-5 z-50 right-3 left-3 sm:left-auto sm:w-[405px] rounded-3xl border-2 border-brand-300 bg-white/95 p-4 shadow-elevated backdrop-blur-xl'
      }
    >
      <button
        type="button"
        aria-label="Cerrar guía de instalación"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 pr-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-700">
          <Share2 className="h-3 w-3" /> {guide.deviceLabel} / iPad
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600">
          <Sparkles className="h-3 w-3" /> App Web
        </span>
      </div>
      <h3 className="mt-2 font-heading text-sm font-extrabold leading-snug text-slate-900">
        Añade {appName} a tu {guide.deviceLabel}
      </h3>
      <IosInstallSteps guide={guide} appName={appName} />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-brand-700"
        >
          Entendido
        </button>
      </div>
    </aside>
  );
}
