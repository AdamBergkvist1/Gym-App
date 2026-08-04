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
 * TRE bredder, och SE är INTE målet — den är det smalaste testfallet. Layouten är
 * responsiv: innehållet ligger i max-w-lg centrerat, så det fyller bredden på en
 * telefon och centreras på en surfplatta. Får något plats på 375 px får det plats
 * överallt.
 *
 *   375 px  iPhone SE — smalast vi lovat stödja. Breddbudgeten i 11A.8/11A.12
 *           är räknad mot just den.
 *   390 px  iPhone 13 — vanlig modern bredd.
 *   393 px  iPhone 15 — Adams faktiska telefon. Testmatrisen ska innehålla den
 *           enhet appen används på, inte bara ytterlägena.
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
    {
      // Adams faktiska telefon. Tillagd 2026-08-04 — testmatrisen ska innehålla
      // den enhet appen faktiskt används på, inte bara ytterlägena.
      name: 'iphone-15',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 393, height: 852 },
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
