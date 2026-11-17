import { type Page } from '@playwright/test';

const EMPTY_FEED = JSON.stringify({
  ok: true,
  project: 'pequemodas',
  visitorHash: 'h-test',
  ads: [],
  floating: null,
  inline: null
});

// Los anuncios externos se simulan en E2E: no dependen de la red ni tapan la UI.
export async function mockAdsNetwork(page: Page) {
  await page.route(/studiolexair\.ddns\.net\/ads\.js/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: 'window.__lexairAdsLoaded = true;'
    });
  });
  await page.route(
    /ywrspyrplgwxkwdboaiz\.supabase\.co\/functions\/v1\/ads-feed/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: EMPTY_FEED
      });
    }
  );
}
