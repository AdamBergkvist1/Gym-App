import { defineConfig, devices } from '@playwright/test';

/**
 * E2E mot riktiga mobilviewporter.
 *
 * Varför WebKit och inte Chromium: appen körs uteslutande i iOS Safari. WebKit är
 * samma motorfamilj och fångar layoutfel som Chromium tyst renderar rätt.
 *
 * Vad detta INTE ersätter: safe-area-insets, 100vh-buggen, scroll-snap-tröghet,
 * Wake Lock, haptik och PWA-standalone-beteende beter sig annorlunda på riktig
 * hårdvara. Enhetstestning krymper — den försvinner inte. Se HANDOFF.md.
 *
 * Två bredder med flit: 375 px är den smalaste skärm vi lovat stödja (iPhone SE),
 * och breddbudgeten i uppgift 11A.8/11A.12 är räknad mot just den. 390 px är den
 * vanligaste moderna. Går något sönder på bara den ena vill vi se vilken.
 */
export default defineConfig({
  testDir: './e2e',
  // Vitest äger src/**. Ingen överlappning, inga tester som körs av fel verktyg.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    // Spår och skärmbild bara när något gått fel — annars fylls disken av
    // artefakter från gröna körningar.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'iphone-se',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iphone-13',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
