import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // pwa-ios.spec.ts se ejecuta con playwright.ios.config.ts sobre el build.
  testIgnore: '**/pwa-ios.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'android-chrome',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
