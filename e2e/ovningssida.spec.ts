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
  await expect(page.getByRole('note', { name: 'Om datans ursprung' })).toBeVisible();
});

test('3b. importnotisen syns INTE när övningen saknar importerade set', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // Ett VANLIGT set, inte ett importerat. Att seeda något alls är hela poängen —
  // se ankringen nedan.
  const skrevs = await seedaRått(page, övning.id, {
    id: 'vakt-3b-vanligt-set',
    source: 'manual',
    weightKg: 123.5,
    reps: 7,
  });
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  await page.goto(`/ovning/${övning.id}`);

  // ⚠️ ANKRINGEN, och den är inte dekoration. Sidan har TVÅ oberoende
  // `useLiveQuery`: rubriken kommer ur `db.exercises.get`, notisen ur
  // `getExerciseHistory` — vars startvärde är `[]`. En rubrik bevisar alltså
  // ingenting om historikfrågan, och en ANNAN version av det här testet gick grönt
  // just därför: hade `getExerciseHistory` hängt eller kastat hade sidan sett
  // likadan ut som "inga importerade set". `/code-review` hittade det 2026-08-13.
  //
  // Därför väntar vi in ett POSITIVT utfall ur samma fråga innan negationen mäts.
  // Syns setets vikt har historikfrågan bevisligen löst ut och levererat data, och
  // först då betyder frånvaron av notis något. Vikten matchas med både komma och
  // punkt så att testet inte låser sig vid lokalens decimaltecken.
  //
  // Ankaret pekar på SETRADEN (`listitem`), inte bara på texten: vikten renderas på
  // tre ställen — tyngsta set, bästa e1RM och raden i "Alla set" — och en naken
  // textmatchning träffar alla tre. Raden är den ärligaste av dem, eftersom den bara
  // kan finnas om `getExerciseHistory` faktiskt returnerade en punkt.
  await expect(page.getByRole('listitem').filter({ hasText: /123[,.]5/ })).toBeVisible();

  await expect(page.getByRole('note', { name: 'Om datans ursprung' })).toHaveCount(0);
});
