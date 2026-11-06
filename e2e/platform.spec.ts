import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — PWA, Open Graph, Capas Animadas y Offline-First', () => {
  test('verifica inicio, capas de logo+nubes, vista previa Open Graph WhatsApp y manifest PWA', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');

    // Verifica que el logo sin fondo y sus 3 capas de nubes separadas están presentes
    await expect(page.locator('.pm-logo-front').first()).toBeVisible();
    await expect(page.locator('.pm-cloud-center').first()).toBeVisible();
    await expect(page.locator('.pm-cloud-left').first()).toBeVisible();
    await expect(page.locator('.pm-cloud-right').first()).toBeVisible();

    // Verifica versión de la Aplicación Web y archivo version.json sin caché
    await expect(page.getByText(/Aplicación Web \(PWA\) v2\.5\.0/i)).toBeVisible();
    const verRes = await request.get(`${STOREFRONT_URL}/version.json`);
    expect(verRes.status()).toBe(200);
    const verJson = await verRes.json();
    expect(verJson.version).toBe('2.5.0');

    // Verifica metadatos Open Graph para vista previa en WhatsApp
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toContain('/og-share.jpg');
    const ogBannerRes = await request.get(`${STOREFRONT_URL}/og-share.jpg`);
    expect(ogBannerRes.status()).toBe(200);
    expect(ogBannerRes.headers()['content-type']).toContain('image/jpeg');

    // Verifica Manifest PWA instalable con iconos any, maskable y shortcuts
    const manifestRes = await request.get(`${STOREFRONT_URL}/manifest.webmanifest`);
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.short_name).toBe('PequeModas');
    expect(manifestJson.display).toBe('standalone');
    expect(manifestJson.shortcuts.length).toBeGreaterThanOrEqual(2);

    const iconRes = await request.get(`${STOREFRONT_URL}/icons/maskable-512.png`);
    expect(iconRes.status()).toBe(200);

    const swRes = await request.get(`${STOREFRONT_URL}/sw.js`);
    expect(swRes.status()).toBe(200);
  });

  test('soporta caída de red (Modo Offline-First) sin romper catálogo ni carrito', async ({
    page,
    context
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    // Permite completar el pre-calentamiento en segundo plano (250ms) antes del corte de señal
    await page.waitForTimeout(450);

    // Simular corte total de datos móviles
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    await expect(page.getByText(/Modo sin conexión:/i)).toBeVisible();

    // Navegación interna SPA sigue operativa sin conexión
    await page.getByRole('link', { name: /Carrito/i }).first().click();
    await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible();

    // Reconexión automática limpia el aviso offline
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText(/Modo sin conexión:/i)).toBeHidden();
  });

  test('cumple diseño responsive sin desbordamiento horizontal en 4 pantallas reales', async ({
    page
  }) => {
    const viewports = [
      { label: 'Android Gama Entrada (360x800)', width: 360, height: 800 },
      { label: 'Android Estándar (412x915)', width: 412, height: 915 },
      { label: 'Tablet (768x1024)', width: 768, height: 1024 },
      { label: 'Escritorio (1440x900)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ['/', '/catalogo', '/carrito', '/informacion-pedidos']) {
        await page.goto(`${STOREFRONT_URL}${route}`);
        await expect(page.locator('main')).toBeVisible();
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(hasOverflow, `Overflow horizontal en ${vp.label} ruta ${route}`).toBe(
          false
        );
      }
    }
  });
});

test.describe('PequeModas-Juguetería — E2E Panel Administrativo', () => {
  test('redirige rutas privadas a inicio de sesión con logo animado y sin registro público', async ({
    page
  }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/acceso$/);
    await expect(page.locator('.pm-logo-front')).toBeVisible();
    await expect(page.getByText(/Panel Privado de Administración/i)).toBeVisible();
    await expect(page.getByText(/Sin registro público/i)).toBeVisible();
  });
});
