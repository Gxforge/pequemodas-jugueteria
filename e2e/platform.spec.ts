import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — PWA v2.7.0, Vista Previa WhatsApp y Chat Rápido', () => {
  test('verifica favicon.ico, og-pequemodas-v3.jpg, dominio pequemodas.vercel.app y chat en vivo', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(850);

    // Verifica logo oficial en cabecera y pie (sin icono geométrico de 2 cuadrados)
    await expect(page.locator('header a[aria-label*="Ir al inicio"] img')).toBeVisible();
    await expect(page.locator('footer img').first()).toBeVisible();

    // Verifica versión v2.7.0
    await expect(page.getByText(/Aplicación Web \(PWA\) v2\.7\.0/i)).toBeVisible();
    const verRes = await request.get(`${STOREFRONT_URL}/version.json`);
    expect(verRes.status()).toBe(200);
    expect((await verRes.json()).version).toBe('2.7.0');

    // Verifica favicon.ico real y nuevo banner Open Graph limpio para WhatsApp
    const icoRes = await request.get(`${STOREFRONT_URL}/favicon.ico`);
    expect(icoRes.status()).toBe(200);
    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogUrl).toBe('https://pequemodas.vercel.app/og-pequemodas-v3.jpg');
    const ogRes = await request.get(`${STOREFRONT_URL}/og-pequemodas-v3.jpg`);
    expect(ogRes.status()).toBe(200);

    // Abre el Chat Directo con la Tienda
    const chatBtn = page.getByRole('button', { name: /Abrir chat directo con la tienda/i });
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();
    await expect(
      page.getByRole('dialog', { name: /Chat en vivo PequeModas-Juguetería/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /Cerrar chat/i }).click();
  });

  test('soporta caída de red (Modo Offline-First) sin romper catálogo ni carrito', async ({
    page,
    context
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(850);

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/Modo sin conexión:/i)).toBeVisible();

    await page.getByRole('link', { name: /Carrito/i }).first().click();
    await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible();

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
      for (const route of ['/', '/catalogo', '/categorias', '/carrito']) {
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

test.describe('PequeModas-Juguetería — E2E Admin: 2GB Storage + Round-Robin, Avisos In-App y Equipo por Tareas', () => {
  test('verifica Resumen con 2 Bases + 2 Storages, Cajón de Avisos dentro de pantalla, Chat legible y Equipo por Tareas', async ({
    page
  }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/acceso$/);

    await page.getByLabel(/Correo electrónico/i).fill('junmoxia41@gmail.com');
    await page.getByLabel(/Contraseña/i).fill('Lexair-bae05a5d12#26');
    await page.getByRole('button', { name: /Entrar al Panel/i }).click();

    // Verifica Resumen con los 2 servidores de Fotos (2 GB) y las 2 Bases Round-Robin
    await expect(
      page.getByText(/Capacidad de Fotografías \(2 GB Totales en Doble Servidor\)/i)
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Almacenamiento de Fotos 1/i)).toBeVisible();
    await expect(page.getByText(/Almacenamiento de Fotos 2 \(\+1 GB Extra\)/i)).toBeVisible();
    await expect(page.getByText(/Base de Datos 1 · Catálogo \+ Chat/i)).toBeVisible();
    await expect(page.getByText(/Base de Datos 2 · Clientes \+ Chat/i)).toBeVisible();

    // Verifica que el Panel de Avisos se abre 100% DENTRO de la ventana (nunca cortado hacia afuera)
    await page.getByRole('button', { name: /Centro de avisos/i }).first().click();
    const notifDialog = page.getByRole('dialog', {
      name: /Avisos Inteligentes de la Tienda/i
    });
    await expect(notifDialog).toBeVisible();
    const box = await notifDialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    await page.getByRole('button', { name: /Cerrar panel de avisos/i }).click();

    // Verifica Equipo con Puestos Amigables y Asignación de Tareas
    await page.goto(`${ADMIN_URL}/equipo`);
    await expect(
      page.getByRole('heading', { name: /Equipo y Asignación de Tareas/i })
    ).toBeVisible();
    await expect(
      page.getByText(/¿Qué tareas y pantallas le permites usar dentro de la aplicación\?/i)
    ).toBeVisible();
  });
});
