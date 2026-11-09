import {
  expect,
  test,
  type APIRequestContext,
  type Page
} from '@playwright/test';

const STOREFRONT_URL =
  process.env.E2E_STOREFRONT_URL || 'http://127.0.0.1:4173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://127.0.0.1:4174';
const PNG_MAGIC = '89504e470d0a1a0a';

async function mockExternalNetwork(page: Page) {
  await page.route('**/*', async (route) => {
    let url: URL;
    try {
      url = new URL(route.request().url());
    } catch {
      await route.continue();
      return;
    }
    if (url.hostname.includes('supabase.co')) {
      const wantsObject =
        url.pathname.includes('store_settings') ||
        url.pathname.includes('bot_config') ||
        url.pathname.startsWith('/auth/');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: wantsObject ? '{}' : '[]'
      });
      return;
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

async function expectAppleIcon(
  request: APIRequestContext,
  baseUrl: string,
  path: string
) {
  const response = await request.get(`${baseUrl}${path}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type'] || '').toMatch(/image\/png/i);
  const bytes = await response.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe(PNG_MAGIC);
  expect(bytes.readUInt32BE(16)).toBe(180);
  expect(bytes.readUInt32BE(20)).toBe(180);
}

test.describe('PWA v3.1.3 — instalación real en iPhone / iPad sin romper Android', () => {
  test('Tienda y Panel sirven meta etiquetas Apple, manifest e icono opaco de 180 px', async ({
    request
  }) => {
    for (const baseUrl of [STOREFRONT_URL, ADMIN_URL]) {
      const htmlRes = await request.get(`${baseUrl}/`);
      expect(htmlRes.status()).toBe(200);
      const html = await htmlRes.text();
      expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
      expect(html).toContain('name="apple-mobile-web-app-title"');
      expect(html).toContain('sizes="180x180"');
      expect(html).toContain('/icons/apple-touch-icon.png');
      expect(html).toContain('viewport-fit=cover');
      expect(html).not.toMatch(/user-scalable\s*=\s*no/i);

      const manifestRes = await request.get(`${baseUrl}/manifest.webmanifest`);
      expect(manifestRes.status()).toBe(200);
      expect(manifestRes.headers()['content-type'] || '').toMatch(
        /manifest\+json|application\/json/i
      );
      const manifest = await manifestRes.json();
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.scope).toBe('/');
      expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain(
        '180x180'
      );

      await expectAppleIcon(request, baseUrl, '/icons/apple-touch-icon.png');
      await expectAppleIcon(request, baseUrl, '/apple-touch-icon.png');

      const swRes = await request.get(`${baseUrl}/sw.js`);
      expect(swRes.status()).toBe(200);
      expect(swRes.headers()['content-type'] || '').toMatch(/javascript/i);
      expect((await swRes.text()).trim()).not.toMatch(/^<!doctype/i);

      const assetMatch = html.match(/src="\/(assets\/[^"']+\.js)"/);
      if (!assetMatch?.[1]) {
        throw new Error(`Falta bundle JS en ${baseUrl}`);
      }
      const assetRes = await request.get(`${baseUrl}/${assetMatch[1]}`);
      expect(assetRes.headers()['content-type'] || '').toMatch(/javascript/i);
      expect((await assetRes.text()).trim()).not.toMatch(/^<!doctype/i);
    }
  });

  test('Safari de iPhone muestra la guía manual y nunca un botón falso de instalación', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'ios-webkit', 'Requiere WebKit de iPhone');
    await mockExternalNetwork(page);
    await page.goto(`${STOREFRONT_URL}/`);

    const browserState = await page.evaluate(() => {
      const nav = navigator as Navigator & { standalone?: boolean };
      return {
        userAgent: nav.userAgent,
        standalone: nav.standalone === true,
        display: window.matchMedia('(display-mode: standalone)').matches
      };
    });
    expect(browserState.userAgent).toMatch(/iPhone|iPad/);
    expect(browserState.standalone || browserState.display).toBe(false);

    const guide = page.getByRole('dialog', {
      name: /Cómo añadir .* a tu iPhone/i
    });
    await expect(guide).toBeVisible();
    await expect(
      guide.getByText('Añadir a pantalla de inicio', { exact: false }).first()
    ).toBeVisible();
    await expect(guide.getByText('Compartir', { exact: false }).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Instalar Aplicación/i })
    ).toHaveCount(0);

    await guide.getByRole('button', { name: 'Entendido' }).click();
    await expect(guide).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole('dialog', { name: /Cómo añadir/i })
    ).toHaveCount(0);
  });

  test('El Panel Admin también guía la instalación en la pantalla de acceso', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'ios-webkit', 'Requiere WebKit de iPhone');
    await mockExternalNetwork(page);
    await page.goto(`${ADMIN_URL}/acceso`);

    const guide = page.getByRole('dialog', {
      name: /Cómo añadir tu Panel a tu iPhone/i
    });
    await expect(guide).toBeVisible();
    await expect(
      guide.getByText('Añadir a pantalla de inicio', { exact: false }).first()
    ).toBeVisible();
    await expect(guide.getByText(/Abre esta página en Safari/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Instalar Panel/i })).toHaveCount(0);
  });

  test('Android conserva su barra de 5 botones y no ve instrucciones de iPhone', async ({
    page
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'android-chromium',
      'Requiere el perfil Android Pixel 7'
    );
    await mockExternalNetwork(page);
    await page.goto(`${STOREFRONT_URL}/`);
    await expect(
      page.getByRole('dialog', { name: /Cómo añadir/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: /Navegación rápida móvil/i })
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: /Navegación rápida móvil/i })
        .getByRole('link')
    ).toHaveCount(5);
  });

  test('La página /instalar explica Android y iPhone sin datos comerciales inventados', async ({
    page
  }) => {
    await mockExternalNetwork(page);
    await page.goto(`${STOREFRONT_URL}/instalar`);
    await expect(
      page.getByRole('heading', { level: 1, name: /Cómo tener .* en tu teléfono/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Android \(Chrome\)/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /iPhone o iPad \(Safari\)/i })
    ).toBeVisible();
    await expect(
      page.getByText('Añadir a pantalla de inicio', { exact: false }).first()
    ).toBeVisible();
  });
});
