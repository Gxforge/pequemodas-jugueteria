import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/pwa-ios.spec.ts',
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'ios-webkit',
      use: { ...devices['iPhone 13'] }
    },
    {
      name: 'android-chromium',
      use: { ...devices['Pixel 7'] }
    }
  ],
  webServer: [
    {
      command:
        'pnpm --filter @pequemodas/storefront exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command:
        'pnpm --filter @pequemodas/admin exec vite preview --host 127.0.0.1 --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
