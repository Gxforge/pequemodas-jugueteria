import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pequemodas/config': resolve(__dirname, 'packages/config/src/index.ts'),
      '@pequemodas/schemas': resolve(__dirname, 'packages/schemas/src/index.ts'),
      '@pequemodas/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
      '@pequemodas/ui': resolve(__dirname, 'packages/ui/src/index.ts'),
      '@pequemodas/utils': resolve(__dirname, 'packages/utils/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./scripts/vitest-setup.ts'],
    include: [
      'packages/**/*.test.{ts,tsx}',
      'apps/**/*.test.{ts,tsx}',
      'scripts/**/*.test.{ts,tsx}'
    ]
  }
});
