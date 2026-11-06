import type { Config } from 'tailwindcss';
import { pequemodasTailwindPreset } from '../../packages/config/src/tailwind-preset';

export default {
  presets: [pequemodasTailwindPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;
