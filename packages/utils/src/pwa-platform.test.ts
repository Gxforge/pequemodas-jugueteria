import { describe, expect, it } from 'vitest';
import { resolveIosInstallGuide, type PwaBrowserEnv } from './pwa-platform';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Mobile Safari/537.36';

function env(overrides: Partial<PwaBrowserEnv> = {}): PwaBrowserEnv {
  return {
    userAgent: IPHONE_SAFARI,
    displayModeStandalone: false,
    ...overrides
  };
}

describe('Guía de instalación PWA en iPhone / iPad', () => {
  it('detecta Safari en iPhone y ofrece los pasos manuales de Compartir', () => {
    const guide = resolveIosInstallGuide(env());
    expect(guide.isIos).toBe(true);
    expect(guide.canShow).toBe(true);
    expect(guide.browser).toBe('safari');
    expect(guide.deviceLabel).toBe('iPhone');
    expect(guide.steps.join(' ')).toContain('Añadir a pantalla de inicio');
    expect(guide.steps.join(' ')).toContain('Compartir');
  });

  it('detecta iPad en modo escritorio de iPadOS por sus puntos táctiles', () => {
    const guide = resolveIosInstallGuide(
      env({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5
      })
    );
    expect(guide.isIos).toBe(true);
    expect(guide.canShow).toBe(true);
    expect(guide.deviceLabel).toBe('iPad');
  });

  it('detecta iPad con su agente de usuario clásico', () => {
    const guide = resolveIosInstallGuide(env({ userAgent: IPAD_SAFARI }));
    expect(guide.isIos).toBe(true);
    expect(guide.deviceLabel).toBe('iPad');
  });

  it('no muestra la guía si ya se abrió desde la pantalla de inicio', () => {
    expect(resolveIosInstallGuide(env({ standalone: true })).canShow).toBe(false);
    expect(
      resolveIosInstallGuide(env({ displayModeStandalone: true })).canShow
    ).toBe(false);
  });

  it('no muestra la guía en Android Chrome, donde sí existe beforeinstallprompt', () => {
    const guide = resolveIosInstallGuide(env({ userAgent: ANDROID_CHROME }));
    expect(guide.isIos).toBe(false);
    expect(guide.canShow).toBe(false);
    expect(guide.steps).toHaveLength(0);
  });

  it('pide abrir en Safari cuando el enlace llega desde una app de mensajería', () => {
    const guide = resolveIosInstallGuide(
      env({ userAgent: `${IPHONE_SAFARI} WhatsApp/2.25` })
    );
    expect(guide.browser).toBe('in-app');
    expect(guide.steps[0]).toContain('Abrir en Safari');
  });

  it('orienta a quien abre con Chrome en iOS hacia Safari', () => {
    const guide = resolveIosInstallGuide(
      env({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1'
      })
    );
    expect(guide.browser).toBe('chrome');
    expect(guide.canShow).toBe(true);
    expect(guide.steps.join(' ')).toContain('Safari');
  });
});
