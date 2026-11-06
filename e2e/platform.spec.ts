import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — PWA v3.0.0: Arranque Sincronizado, Navegación Instantánea y Admin PWA', () => {
  test('detecta nueva versión sin recargar, oculta avisos molestos de red lenta y navega sin pantallazos', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(1450);

    // Verifica versión v3.0.0 y que no exista el cartel de conexión móvil lenta
    await expect(page.getByText(/Aplicación Web \(PWA\) v3\.0\.0/i)).toBeVisible();
    await expect(page.getByText(/Conexión móvil lenta detectada/i)).toHaveCount(0);

    const verRes = await request.get(`${STOREFRONT_URL}/version.json`);
    expect(verRes.status()).toBe(200);
    expect((await verRes.json()).version).toBe('3.0.0');

    // Simula un nuevo despliegue en vivo SIN recargar la pestaña y verifica tarjeta flotante
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '3.0.9',
          summary: 'Mejoras instantáneas en vivo verificadas.'
        })
      });
    });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByText(/¡Nueva versión de la tienda lista!/i)).toBeVisible({
      timeout: 5000
    });
    await expect(page.getByRole('button', { name: /Actualizar a v3\.0\.9/i })).toBeVisible();
    await page.getByRole('button', { name: /Más tarde/i }).click();
    await page.unroute('**/version.json*');

    // Abre el Chat Directo y verifica personalizador de colores del cliente
    const chatBtn = page.getByRole('button', { name: /Abrir chat directo con la tienda/i });
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();
    await expect(
      page.getByRole('dialog', { name: /Chat en vivo PequeModas-Juguetería/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /Personalizar colores del chat/i }).click();
    await expect(page.getByText(/Personaliza los colores de tu chat/i)).toBeVisible();
    await page.getByRole('button', { name: /Cerrar chat/i }).click();

    // Verifica Catálogo compacto con botón (?) Ayuda
    await page.goto(`${STOREFRONT_URL}/catalogo`);
    const helpBtn = page.getByRole('button', { name: /Ayuda rápida sobre cómo usar el catálogo/i });
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    await expect(page.getByText(/¿Cómo encontrar y pedir rápido\?/i)).toBeVisible();

    // Verifica Guía Visual con imágenes anotadas en Cómo pedir
    await page.goto(`${STOREFRONT_URL}/informacion-pedidos`);
    await expect(page.getByRole('heading', { name: /¿Cómo hacer tu pedido\?/i })).toBeVisible();
    await expect(page.locator('img[src="/guia/paso-1.webp"]')).toBeVisible();
    await expect(page.locator('img[src="/guia/paso-4.webp"]')).toBeVisible();
  });

  test('soporta caída de red (Modo Offline-First) sin romper catálogo ni carrito renovado', async ({
    page,
    context
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(1450);

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/Modo sin conexión:/i)).toBeVisible();

    await page.getByRole('link', { name: /Carrito/i }).first().click();
    await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText(/Modo sin conexión:/i)).toBeHidden();
  });

  test('en móvil mantiene cabecera limpia y 5 botones abajo con Buscar (sin repetir Carrito)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(STOREFRONT_URL);
    await page.waitForTimeout(1450);

    await expect(page.locator('header input[type="search"]')).toBeHidden();
    await expect(page.locator('header').getByRole('link', { name: /Carrito/i })).toBeVisible();

    const bottomNav = page.getByRole('navigation', { name: /Navegación rápida móvil/i });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link')).toHaveCount(5);
    await expect(bottomNav.getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Catálogo' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Categorías' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Cómo pedir' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Buscar' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Carrito/i })).toHaveCount(0);

    await bottomNav.getByRole('link', { name: 'Buscar' }).click();
    await expect(page).toHaveURL(/\/buscar$/);
    await expect(page.locator('main input[type="search"]')).toBeVisible();

    const viewports = [
      { label: 'Android Gama Entrada (360x800)', width: 360, height: 800 },
      { label: 'Android Estándar (412x915)', width: 412, height: 915 },
      { label: 'Tablet (768x1024)', width: 768, height: 1024 },
      { label: 'Escritorio (1440x900)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ['/', '/catalogo', '/buscar', '/informacion-pedidos', '/carrito']) {
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

test.describe('PequeModas-Juguetería — E2E Admin PWA v3.0.0: Menú Fijo, BD-1..BD-4 sin tecnicismos e Historial', () => {
  test('mantiene menú lateral siempre visible al cambiar entre Productos/Categorías/Inventario y muestra BD-1..BD-4 + Historial', async ({
    page,
    request
  }) => {
    await page.setViewportSize({ width: 1366, height: 850 });

    const manifestRes = await request.get(`${ADMIN_URL}/manifest.webmanifest`);
    expect(manifestRes.status()).toBe(200);

    await page.goto(ADMIN_URL);
    await page.waitForTimeout(1250);
    await expect(page).toHaveURL(/\/acceso$/);

    const pwdInput = page.locator('input[name="password"]');
    await pwdInput.fill('Lexair-bae05a5d12#26');
    await expect(pwdInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Ver contraseña/i }).click();
    await expect(pwdInput).toHaveAttribute('type', 'text');

    await page.getByLabel(/Correo electrónico/i).fill('junmoxia41@gmail.com');
    await page.getByRole('button', { name: /Entrar al Panel/i }).click();

    // Verifica Resumen limpio sin jerga Round-Robin y con BD-1, BD-2, BD-3 y BD-4
    await expect(page.getByText('BD-1')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('BD-2')).toBeVisible();
    await expect(page.getByText('BD-3')).toBeVisible();
    await expect(page.getByText('BD-4')).toBeVisible();
    await expect(page.getByText(/Round-Robin/i)).toHaveCount(0);

    const sidebar = page.getByRole('navigation', { name: /Menú principal/i });
    await expect(sidebar).toBeVisible();

    // Al tocar BD-1 abre la sección de Base de Datos con el menú lateral siempre visible
    await page.getByRole('link', { name: /BD-1/i }).click();
    await expect(page).toHaveURL(/\/bases-de-datos\?unidad=bd-1/);
    await expect(sidebar).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Base de Datos y Espacio/i })
    ).toBeVisible();

    // Navega por Productos, Categorías, Inventario e Historial verificando que el sidebar jamás desaparece
    await sidebar.getByRole('link', { name: 'Productos' }).click();
    await expect(page).toHaveURL(/\/productos$/);
    await expect(sidebar).toBeVisible();

    await sidebar.getByRole('link', { name: 'Categorías' }).click();
    await expect(page).toHaveURL(/\/categorias$/);
    await expect(sidebar).toBeVisible();

    await sidebar.getByRole('link', { name: 'Inventario' }).click();
    await expect(page).toHaveURL(/\/inventario$/);
    await expect(sidebar).toBeVisible();

    await sidebar.getByRole('link', { name: 'Historial' }).click();
    await expect(page).toHaveURL(/\/historial$/);
    await expect(sidebar).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Historial de tu Tienda/i })
    ).toBeVisible();

    // Verifica Modal de Colores del Chat/Robot en Chat Clientes
    await sidebar.getByRole('link', { name: 'Chat Clientes' }).click();
    await page.getByRole('button', { name: /Personalizar Robot y Colores/i }).click();
    await expect(
      page.getByText(/Personalizar Robot y Colores del Chat/i)
    ).toBeVisible();
  });
});
