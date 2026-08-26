/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', inte 'autoUpdate'. Med autoUpdate kan servicearbetaren byta
      // ut appen under fötterna mitt i ett pass. Med prompt sker bytet ALDRIG
      // utan att användaren tryckt på det — mitt-i-passet-problemet blir
      // strukturellt omöjligt i stället för något vi måste komma ihåg.
      registerType: 'prompt',
      // Ansvaret för ikonerna är uppdelat för att undvika dubbletter i
      // precache-manifestet: plugin-et lägger själv in manifestets ikoner, och
      // `includeAssets` tar apple-touch-icon som INTE står i manifestet.
      // Därför saknas png i globPatterns nedan. Med båda vägarna hamnade varje
      // ikon två gånger. Det gick bra så länge revisionerna var identiska —
      // men två poster för samma URL med olika revision får workbox att faila
      // vid install, och då startar appen inte offline alls.
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Gym',
        short_name: 'Gym',
        description: 'Träningsloggbok. Offline-first, ingen väntan.',
        lang: 'sv',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Papperets färg, samma som --color-bg i src/index.css. MÅSTE ändras i
        // samma commit som temat — annars blir startskärmen och statusraden en
        // annan färg än appen. Se DESIGN.md §0.5.
        background_color: '#f0ebe1',
        theme_color: '#f0ebe1',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // SPA: varje rutt serveras av samma app-skal, som är precachat. Därför
        // fungerar navigering offline utan att varje rutt cachas för sig.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // INGEN runtimeCaching. Supabase-anrop får aldrig cachas av
        // servicearbetaren: synken (fas 7) äger sin egen köhantering, och en
        // cachad databasrespons skulle visa gammal data som om den vore färsk.
        // Det är exakt den sortens tysta fel projektet är byggt för att undvika.
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      include: ['src/parser/**', 'src/sync/**'],
      reporter: ['text', 'html'],
    },
  },
});
