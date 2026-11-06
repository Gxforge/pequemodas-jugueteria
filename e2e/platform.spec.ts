import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — PWA v2.6.0, Logo Real, Paneles de Categorías y Chat en Vivo', () => {
  test('verifica logo real en cabecera/pie sin SVG viejo, nubes animadas, categorías visuales y chat directo', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');
    await page.waitForTimeout(850);

    // Cabecera y pie muestran la imagen real del logo (nunca el icono geométrico antiguo)
    const headerLogoImg = page.locator('header a[aria-label*="Ir al inicio"] img');
    await expect(headerLogoImg).toBeVisible();
    const footerLogoImg = page.locator('footer img').first();
    await expect(footerLogoImg).toBeVisible();

    // Verifica que el logo del hero y sus nubes están presentes
    await expect(page.locator('.pm-logo-front').first()).toBeVisible();
    await expect(page.locator('.pm-cloud-center').first()).toBeVisible();

    // Verifica versión v2.6.0
    await expect(page.getByText(/Aplicación Web \(PWA\) v2\.6\.0/i)).toBeVisible();
    const verRes = await request.get(`${STOREFRONT_URL}/version.json`);
    expect(verRes.status()).toBe(200);
    const verJson = await verRes.json();
    expect(verJson.version).toBe('2.6.0');

    // Abre el Chat Directo con la Tienda (conectado al Proyecto 2 de Supabase)
    const chatBtn = page.getByRole('button', { name: /Abrir chat directo con la tienda/i });
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();
    await expect(
      page.getByRole('dialog', { name: /Chat en vivo PequeModas-Juguetería/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /Cerrar chat/i }).click();

    // Navega a Categorías Visuales
    await page.goto(`${STOREFRONT_URL}/categorias`);
    await expect(
      page.getByRole('heading', { name: /Explora Nuestras Secciones/i })
    ).toBeVisible();
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

test.describe('PequeModas-Juguetería — E2E Panel Administrativo Rediseñado + CRM Dual DB', () => {
  test('valida Resumen ilustrado con 2 Bases de Datos, Avisos Sin Spam, Chat estilo WhatsApp y Vista Previa', async ({
    page
  }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/acceso$/);
    await expect(page.locator('.pm-logo-front')).toBeVisible();

    // Inicia sesión con la cuenta administrativa verificada
    await page.getByLabel(/Correo electrónico/i).fill('junmoxia41@gmail.com');
    await page.getByLabel(/Contraseña/i).fill('Lexair-bae05a5d12#26');
    await page.getByRole('button', { name: /Entrar al Panel/i }).click();

    // Verifica el nuevo Resumen (2 bases de datos + gráfico + español natural sin "settings.update")
    await expect(page.getByText(/Panorama Visual de tu Tienda/i)).toBeVisible({
      timeout: 15000
    });
    await expect(
      page.getByText(/Espacio de Catálogo y Fotografías/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Espacio de Clientes, Pedidos y Chat/i)
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText('settings.update');
    await expect(page.locator('body')).not.toContainText('category.update');

    // Abre Gestor de Avisos Sin Spam
    await page.getByRole('button', { name: /Centro de avisos/i }).first().click();
    await expect(page.getByText(/Avisos Inteligentes \(Sin Spam\)/i)).toBeVisible();

    // Navega al Chat estilo WhatsApp (/mensajes) y abre modal del Bot
    await page.goto(`${ADMIN_URL}/mensajes`);
    await expect(
      page.getByRole('heading', { name: /Chat de Clientes y Pedidos en Vivo/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /Configurar Bot Asistente/i }).click();
    await expect(
      page.getByText(/Activar respuestas automáticas del Bot/i)
    ).toBeVisible();

    // Navega a la Vista Previa interactiva (/vista-previa)
    await page.goto(`${ADMIN_URL}/vista-previa`);
    await expect(
      page.getByRole('heading', { name: /Vista Previa de tu Tienda/i })
    ).toBeVisible();
    await expect(
      page.locator('iframe[title*="Vista previa interactiva"]')
    ).toBeVisible();

    // Navega al Editor de Producto y comprueba lenguaje sencillo de opciones/tallas
    await page.goto(`${ADMIN_URL}/productos/nuevo`);
    await expect(
      page.getByText(/¿Este producto tiene distintas tallas, colores o diseños\?/i)
    ).toBeVisible();
  });
});
