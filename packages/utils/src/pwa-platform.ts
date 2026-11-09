export interface PwaBrowserEnv {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}

export type IosBrowser =
  | 'safari'
  | 'chrome'
  | 'firefox'
  | 'edge'
  | 'opera'
  | 'in-app'
  | 'other';

export interface IosInstallGuide {
  isIos: boolean;
  isStandalone: boolean;
  canShow: boolean;
  browser: IosBrowser;
  deviceLabel: string;
  steps: string[];
}

const IN_APP_PATTERN = /FBAN|FBAV|Instagram|WhatsApp|Twitter|LinkedInApp|Line\/|Snapchat/i;

/** Lee el navegador sin depender de SSR ni de APIs que falten en entornos de prueba. */
export function readPwaBrowserEnv(): PwaBrowserEnv {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', displayModeStandalone: false };
  }
  const nav = navigator as Navigator & { standalone?: boolean; platform?: string };
  let displayModeStandalone = false;
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    }
  } catch {
    displayModeStandalone = false;
  }
  return {
    userAgent: nav.userAgent || '',
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: nav.standalone === true,
    displayModeStandalone
  };
}

function detectIos(env: PwaBrowserEnv): boolean {
  const ua = env.userAgent || '';
  const iPadDesktopMode =
    (env.platform === 'MacIntel' || /Macintosh/.test(ua)) &&
    (env.maxTouchPoints ?? 0) > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadDesktopMode;
}

function detectBrowser(ua: string): IosBrowser {
  if (IN_APP_PATTERN.test(ua)) return 'in-app';
  if (/CriOS/.test(ua)) return 'chrome';
  if (/FxiOS/.test(ua)) return 'firefox';
  if (/EdgiOS/.test(ua)) return 'edge';
  if (/OPiOS/.test(ua)) return 'opera';
  if (/Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua)) return 'safari';
  return 'other';
}

/**
 * En iPhone/iPad no existe el evento `beforeinstallprompt`: la instalación
 * siempre es manual desde el menú Compartir. Esta guía sustituye ese botón.
 */
export function resolveIosInstallGuide(env: PwaBrowserEnv): IosInstallGuide {
  const ua = env.userAgent || '';
  const isIos = detectIos(env);
  const isStandalone = Boolean(env.standalone || env.displayModeStandalone);
  const browser = detectBrowser(ua);
  const deviceLabel = /iPad|Macintosh|MacIntel/.test(ua) || env.platform === 'MacIntel'
    ? 'iPad'
    : 'iPhone';
  const base: IosInstallGuide = {
    isIos,
    isStandalone,
    canShow: isIos && !isStandalone,
    browser,
    deviceLabel,
    steps: []
  };

  if (!isIos || isStandalone) return base;

  if (browser === 'in-app') {
    base.steps = [
      'Toca el botón de compartir o los tres puntos y elige «Abrir en Safari».',
      'Ya en Safari, toca «Compartir» (cuadrado con flecha hacia arriba).',
      'Elige «Añadir a pantalla de inicio» y confirma con «Añadir».'
    ];
    return base;
  }

  if (browser === 'chrome' || browser === 'edge' || browser === 'opera' || browser === 'firefox') {
    base.steps = [
      'Instala desde Safari para que quede como aplicación: abre el enlace en Safari.',
      'Toca «Compartir» (cuadrado con flecha hacia arriba) o los tres puntos y luego «Compartir».',
      'Elige «Añadir a pantalla de inicio» y confirma con «Añadir».'
    ];
    return base;
  }

  base.steps = [
    'Abre esta página en Safari, no desde WhatsApp, Facebook ni Instagram.',
    'Toca «Compartir»: el cuadrado con la flecha hacia arriba. En iPhone con barra compacta, primero toca los tres puntos.',
    'Desliza la lista y elige «Añadir a pantalla de inicio».',
    'Deja activado «Abrir como App Web» (iOS 26 o posterior) y confirma con «Añadir».'
  ];
  return base;
}
