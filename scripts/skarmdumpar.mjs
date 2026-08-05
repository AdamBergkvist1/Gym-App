#!/usr/bin/env node
/**
 * `npm run shots` — skärmdumpar av varje skärm, headless.
 *
 * VARFÖR DEN FINNS
 * Den inbyggda webbläsarpanelen kan bara fotograferas när panelen faktiskt
 * visas på skärmen — en dold panel renderar inga bildrutor. Det gjorde att
 * Claude designade mot en textbrief i stället för mot appen, och att Adam fick
 * beskriva i ord vad som såg fel ut.
 *
 * Playwright har inte det problemet. Den ritar sidan i minnet oavsett vad som
 * visas, och klickar dessutom headless — vilket panelen inte gör.
 *
 * Bilderna hamnar i `skarmdumpar/` (gitignorerad). Kör före och efter en ändring
 * så finns ett före/efter att jämföra.
 *
 * ANVÄNDNING
 *   npm run shots         iPhone SE, 375 px — smalast, fel syns först här
 *   npm run shots -- --15 iPhone 15, 393 px — Adams telefon
 */

import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UT = join(ROOT, 'skarmdumpar');
// Förvalet är SE — det smalaste fallet, där fel syns först. --15 ger Adams
// faktiska telefon, som är den layout han själv ser.
const VIEWPORT = process.argv.includes('--15')
  ? { width: 393, height: 852 }
  : { width: 375, height: 667 };
const URL_BAS = 'http://localhost:5173';

/** Startar vite och väntar tills den svarar. Dödas alltid i finally. */
async function startaServer() {
  const p = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(URL_BAS);
      if (res.ok) return p;
    } catch {
      // servern är inte uppe än
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  p.kill();
  throw new Error('vite svarade inte inom 30 s');
}

/**
 * WebKit först — appen körs i iOS Safari och det är den motorn som räknas.
 * Chromium som reserv, eftersom WebKit ibland saknar systembibliotek på Linux
 * och en skärmdump från fel motor är oändligt mycket bättre än ingen.
 */
async function startaWebblasare() {
  try {
    return { b: await webkit.launch(), motor: 'webkit' };
  } catch {
    return { b: await chromium.launch(), motor: 'chromium (WebKit saknades)' };
  }
}

const vänta = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  rmSync(UT, { recursive: true, force: true });
  mkdirSync(UT, { recursive: true });

  const server = await startaServer();
  const { b, motor } = await startaWebblasare();

  try {
    const ctx = await b.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, hasTouch: true });
    const sida = await ctx.newPage();

    const foto = async (namn) => {
      await vänta(400);
      await sida.screenshot({ path: join(UT, `${namn}.png`), fullPage: true });
      console.log(`  ✓ ${namn}.png`);
    };

    const tryck = async (text) => {
      const knapp = sida.getByRole('button', { name: new RegExp(text, 'i') }).first();
      if (await knapp.count()) {
        await knapp.click();
        await vänta(500);
        return true;
      }
      return false;
    };

    console.log(`Skärmdumpar — ${VIEWPORT.width}x${VIEWPORT.height}, ${motor}\n`);

    await sida.goto(URL_BAS);
    await sida.waitForLoadState('networkidle');
    await foto('1-pass-tomt');

    await sida.goto(`${URL_BAS}/historik`);
    await sida.waitForLoadState('networkidle');
    await foto('2-historik');

    await sida.goto(`${URL_BAS}/installningar`);
    await sida.waitForLoadState('networkidle');
    await foto('3-installningar');

    // Bygg upp ett pass så att den skärm som faktiskt används syns, inte bara
    // tomma tillstånd. Det var precis den vyn som aldrig granskats.
    await sida.goto(URL_BAS);
    await sida.waitForLoadState('networkidle');
    await tryck('Starta (tomt )?pass');
    await foto('4-pass-startat');

    if (await tryck('Lägg till övning')) {
      await foto('5-ovningsvaljare');
      const val = sida.getByRole('button', { name: /press|drag|böj|lyft/i }).first();
      if (await val.count()) {
        await val.click();
        await vänta(700);
        await foto('6-pass-med-ovning');

        // Öppna justeringsarket — rullhjulen som Adam tyckte blev sådär.
        const värde = sida.locator('li button').first();
        if (await värde.count()) {
          await värde.click();
          await foto('7-justeringsark');
        }
      }
    }

    console.log(`\nKlart. Bilderna ligger i skarmdumpar/`);
  } finally {
    await b.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error('MISSLYCKADES:', err.message);
  process.exit(1);
});
