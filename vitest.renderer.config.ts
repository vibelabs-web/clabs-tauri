import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'renderer',
    environment: 'jsdom',
    include: ['tests/components/**/*.test.tsx', 'tests/renderer/**/*.test.tsx', 'tests/pages/**/*.test.tsx', 'tests/integration/**/*.{test.tsx,spec.tsx}'],
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/renderer/**/*.tsx', 'src/renderer/**/*.ts'],
      exclude: ['src/renderer/**/*.test.tsx', 'src/renderer/main.tsx']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    }
  }
});
