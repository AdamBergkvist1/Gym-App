import { test, expect } from '@playwright/test';
import { hämtaÖvning, seedaRått } from './hjalpare';

/**
 * VAKT A över övningssidan: *"skärmen visar rätt data"*. Uppgift 12.20.
 *
 * Vakt B — *"skärmen renderar och får plats"* — är en annan sak med en annan
 * livslängd och bor i `no-horizontal-overflow.spec.ts`. Beslut 1 i 11B.0e.
 *
 * VARFÖR E2E OCH INTE KOMPONENTTEST: layout kan bara mätas i en riktig
 * renderingsmotor. Att underhålla två testfordon för att vinna lite fart på halva
 * sviten lönar sig inte, och hade kostat en post i `package.json` — vilket 12.20:s
 * eget "Klart när" förbjuder. Beslut 2.
 *
 * ⚠️ **SEEDA FÖRST, NAVIGERA SEDAN.** Se filhuvudet i `hjalpare.ts`. Varje test här
 * följer den ordningen, och det är inte en försiktighetsåtgärd utan ett krav.
 *
 * SELEKTORER: `role` + tillgängligt namn (beslut 7). Inget test här påstår vad en
 * text *lyder* när det räcker att påstå att den *finns* — 12.22 skriver om flera av
 * appens meningar, och ett test som låser lydelsen hade gått sönder av en ren
 * textstädning.
 */

test('1. övningssidan renderar — rubriken är övningens namn', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await page.goto(`/ovning/${övning.id}`);

  // Den mest grundläggande vakten som finns: `ExercisePage` kan sluta rendera helt
  // utan att typecheck, lint eller bygget säger ett ord. Tre gånger på tre
  // sessioner har en webbläsare fått startas för hand för att bevisa just detta.
  await expect(page.getByRole('heading', { name: övning.name, level: 1 })).toBeVisible();
});

test('3a. importnotisen syns när övningen har importerade set', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  const skrevs = await seedaRått(page, övning.id);
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  await page.goto(`/ovning/${övning.id}`);

  // Påstår att notisen FINNS, aldrig vad den lyder. Rollen är hela poängen:
  // `getByText(/importerad/i)` hade låst lydelsen, vilket beslut 5 förbjuder.
  await expect(page.getByRole('note')).toBeVisible();
});

test('3b. importnotisen syns INTE när övningen saknar importerade set', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // Ingen sådd. Övningen är orörd, alltså finns inga importerade punkter.
  await page.goto(`/ovning/${övning.id}`);

  await expect(page.getByRole('heading', { name: övning.name, level: 1 })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
});
