/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'node',
    // Parsern och synklogiken är rena moduler och behöver ingen DOM. Tester som
    // gör det deklarerar själva `// @vitest-environment jsdom` överst i filen.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      include: ['src/parser/**', 'src/sync/**'],
      reporter: ['text', 'html'],
    },
  },
});
