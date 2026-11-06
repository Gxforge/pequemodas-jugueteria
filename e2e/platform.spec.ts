import { expect, test } from '@playwright/test';

const STOREFRONT_URL = process.env.E2E_STOREFRONT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('PequeModas-Juguetería — E2E Tienda Pública y PWA', () => {
  test('renderiza inicio con estado vacío limpio, navegación y manifest PWA', async ({
    page,
    request
  }) => {
    await page.goto(STOREFRONT_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('PequeModas');

    // El catálogo inicial está vacío y muestra estado vacío amigable
    await expect(page.getByText(/preparando nuevas sorpresas/i)).toBeVisible();

    // Verifica navegación a Cómo hacer un pedido
    await page.goto(`${STOREFRONT_URL}/informacion-pedidos`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      '¿Cómo realizar tu pedido?'
    );

    // Verifica página de carrito vacío
    await page.goto(`${STOREFRONT_URL}/carrito`);
    await expect(page.getByText(/Tu carrito está vacío/i)).toBeVisible();

    // Verifica Guía Visual / Sistema de diseño
    await page.goto(`${STOREFRONT_URL}/guia-visual`);
    await expect(page.getByText(/Sistema de Diseño Oficial/i)).toBeVisible();

    // Verifica Manifest PWA e icono instalable
    const manifestRes = await request.get(`${STOREFRONT_URL}/manifest.webmanifest`);
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.short_name).toBe('PequeModas');
    expect(manifestJson.display).toBe('standalone');
  });
});

test.describe('PequeModas-Juguetería — E2E Panel Administrativo', () => {
  test('redirige rutas privadas a inicio de sesión seguro sin registro público', async ({
    page
  }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/acceso$/);
    await expect(page.getByText(/Panel Privado de Administración/i)).toBeVisible();
    await expect(page.getByText(/Sin registro público/i)).toBeVisible();
  });
});
