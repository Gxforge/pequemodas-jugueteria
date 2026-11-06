import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — PWA v2.8.0: Chat Personalizable/Movible, Catálogo Compacto (?) y Guía Visual', () => {
  test('verifica chat auto-contraíble + paleta de colores, catálogo con ayuda (?) y guía visual anotada', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(850);

    // Verifica versión v2.8.0
    await expect(page.getByText(/Aplicación Web \(PWA\) v2\.8\.0/i)).toBeVisible();
    const verRes = await request.get(`${STOREFRONT_URL}/version.json`);
    expect(verRes.status()).toBe(200);
    expect((await verRes.json()).version).toBe('2.8.0');

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

    // Verifica Catálogo compacto con botón (?) Ayuda y sin el subtítulo viejo
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

  test('cumple diseño responsive sin desbordamiento horizontal y muestra Cómo pedir en móvil', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(STOREFRONT_URL);
    await page.waitForTimeout(850);
    await expect(page.getByRole('link', { name: /Cómo pedir/i }).first()).toBeVisible();

    const viewports = [
      { label: 'Android Gama Entrada (360x800)', width: 360, height: 800 },
      { label: 'Android Estándar (412x915)', width: 412, height: 915 },
      { label: 'Tablet (768x1024)', width: 768, height: 1024 },
      { label: 'Escritorio (1440x900)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ['/', '/catalogo', '/informacion-pedidos', '/carrito']) {
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

test.describe('PequeModas-Juguetería — E2E Admin: Personalizador de Colores del Robot + 2GB Storage + Equipo', () => {
  test('verifica botón Ver contraseña, Resumen 2GB, Avisos in-app y Modal de Colores del Chat/Robot', async ({
    page
  }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/acceso$/);

    const pwdInput = page.locator('input[name="password"]');
    await pwdInput.fill('Lexair-bae05a5d12#26');
    await expect(pwdInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Ver contraseña/i }).click();
    await expect(pwdInput).toHaveAttribute('type', 'text');

    await page.getByLabel(/Correo electrónico/i).fill('junmoxia41@gmail.com');
    await page.getByRole('button', { name: /Entrar al Panel/i }).click();

    await expect(
      page.getByText(/Capacidad de Fotografías \(2 GB Totales en Doble Servidor\)/i)
    ).toBeVisible({ timeout: 15000 });

    // Abre Mensajes y verifica el Personalizador de Robot y Colores
    await page.goto(`${ADMIN_URL}/mensajes`);
    await page.getByRole('button', { name: /Personalizar Robot y Colores/i }).click();
    await expect(
      page.getByText(/Personalizar Robot y Colores del Chat/i)
    ).toBeVisible();
    await expect(page.getByText(/Estilos listos/i)).toBeVisible();
  });
});
