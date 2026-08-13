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

/**
 * REGRESSIONSVAKT FÖR 12.18: halvkilon får inte avrundas bort.
 *
 * Adams beslut, med skäl: man lägger på 2,5 kg-skivor, så halvkilon är verkliga
 * vikter och inte mätbrus. Avrundas de blir två olika pass samma siffra.
 *
 * De två setet är valda så att **tyngsta set och bästa e1RM blir OLIKA set** — det
 * är hela poängen med att visa dem var för sig (`ExercisePage` docblock: *"90×3 är
 * tyngre på stången, men 80×8 är den starkare prestationen"*). Ett test där samma
 * set vinner båda hade inte kunnat upptäcka att korten byter plats.
 *
 * DE VÄNTADE TALEN ÄR HANDRÄKNADE ur Epley (`vikt × (1 + reps/30)`, avrundat till
 * en decimal), inte hämtade genom att anropa `epley1RM`. Ett test som räknar fram
 * sitt facit på samma sätt som koden kan aldrig säga emot koden:
 *
 *   92,5 × 3  →  92,5 × 33/30 = 101,75  →  101,8
 *   82,5 × 8  →  82,5 × 38/30 = 104,5   →  104,5
 *
 * Alltså: tyngst = 92,5 (första setet), bästa e1RM = 104,5 (andra setet).
 */
test('2. tyngsta set och bästa e1RM visar rätt siffror med decimal', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  const tyngstSkrevs = await seedaRått(page, övning.id, {
    id: 'vakt-2-tyngsta-setet',
    source: 'manual',
    weightKg: 92.5,
    reps: 3,
    performedAt: '2024-05-01T10:00:00.000Z',
  });
  const starkastSkrevs = await seedaRått(page, övning.id, {
    id: 'vakt-2-basta-e1rm',
    source: 'manual',
    weightKg: 82.5,
    reps: 8,
    performedAt: '2024-05-02T10:00:00.000Z',
  });
  expect(tyngstSkrevs && starkastSkrevs, 'båda råa skrivningarna ska lyckas').toBe(true);

  await page.goto(`/ovning/${övning.id}`);

  const tyngsta = page.getByRole('group', { name: 'Tyngsta set' });
  await expect(tyngsta).toContainText('92,5');
  await expect(tyngsta).toContainText('3 reps');

  const bästaE1rm = page.getByRole('group', { name: 'Bästa e1RM' });
  await expect(bästaE1rm).toContainText('104,5');
  // Härledningen ska stå kvar: e1RM utan sitt ursprungsset är ett tal utan historia.
  await expect(bästaE1rm).toContainText('82,5');
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
