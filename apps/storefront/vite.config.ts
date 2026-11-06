import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: resolve(__dirname, '../..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@pequemodas/config': resolve(__dirname, '../../packages/config/src/index.ts'),
      '@pequemodas/schemas': resolve(__dirname, '../../packages/schemas/src/index.ts'),
      '@pequemodas/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@pequemodas/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@pequemodas/utils': resolve(__dirname, '../../packages/utils/src/index.ts')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
});
