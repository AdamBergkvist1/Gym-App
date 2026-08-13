import { test, expect, type Page } from '@playwright/test';

/**
 * PRÖVNING av såddmetoden i 11B.0e. Inte en vakt — den bevisar en teknik.
 *
 * FRÅGAN: går det att skriva rått i IndexedDB från Playwright och få sidan att
 * visa raden? Hela 12.20 hänger på svaret, eftersom ett importerat set inte går
 * att skapa genom att klicka i appen: `repo.ts:156` hårdkodar
 * `isImported: false` och `true` kan bara komma in via synken (`wire.ts:37`).
 *
 * RISKEN som mäts: sidorna läser genom `useLiveQuery`, som lyssnar på **Dexies**
 * ändringsspårning. En rå skrivning går förbi Dexie och kanske aldrig når sidan.
 *
 * Därför två test:
 *   1. Sådd → navigera. Det planen faktiskt behöver.
 *   2. Sådd medan sidan är öppen. Informationsvärde: säger om vi MÅSTE ladda om
 *      eller bara bör. Rött här är inget underkännande av metoden.
 */

const IMPORTERAT_SET = {
  id: 'provning-set-1',
  workoutId: 'provning-pass-1',
  setIndex: 0,
  weightKg: 82.5,
  reps: 5,
  effortType: null,
  effortValue: null,
  restSeconds: null,
  note: null,
  isWarmup: false,
  performedAt: '2024-04-04T10:00:00.000Z',
  source: 'import',
  isDeleted: false,
  updatedAt: '2024-04-04T10:00:00.000Z',
} as const;

/**
 * Väntar tills appen hunnit seeda övningskatalogen och returnerar en övnings id.
 *
 * Läser ur databasen i stället för att hårdkoda ett id: katalogen är seedad av
 * `bootstrap.ts` och dess id:n är inte vårt att bestämma.
 */
async function hämtaÖvning(page: Page): Promise<{ id: string; name: string }> {
  const handtag = await page.waitForFunction(
    () =>
      new Promise<{ id: string; name: string } | null>((resolve) => {
        const öppna = indexedDB.open('gym');
        öppna.onerror = () => resolve(null);
        öppna.onsuccess = () => {
          const db = öppna.result;
          if (!db.objectStoreNames.contains('exercises')) {
            db.close();
            resolve(null);
            return;
          }
          const begäran = db.transaction('exercises', 'readonly').objectStore('exercises').getAll();
          begäran.onerror = () => {
            db.close();
            resolve(null);
          };
          begäran.onsuccess = () => {
            const rader = begäran.result as Array<{ id: string; name: string }>;
            db.close();
            resolve(rader.length > 0 ? { id: rader[0]!.id, name: rader[0]!.name } : null);
          };
        };
      }),
    null,
    { timeout: 15_000 }
  );

  const övning = await handtag.jsonValue();
  // `waitForFunction` löser först ut på ett sanningsenligt värde, så null kan
  // inte nås här. Kontrollen finns för typerna — och ger ett begripligt fel i
  // stället för ett kryptiskt om Playwrights beteende någon gång ändras.
  if (!övning) throw new Error('övningskatalogen seedades aldrig');
  return övning;
}

/** Skriver setet rått i `loggedSets`, förbi Dexie. Returnerar true vid lyckad skrivning. */
async function seedaRått(page: Page, exerciseId: string): Promise<boolean> {
  return await page.evaluate(
    ({ exerciseId, mall }) =>
      new Promise<boolean>((resolve) => {
        // Ingen version anges: då öppnas databasen som den är, och vi kan aldrig
        // råka trigga en uppgradering som krockar med Dexies eget schema.
        const öppna = indexedDB.open('gym');
        öppna.onerror = () => resolve(false);
        öppna.onsuccess = () => {
          const db = öppna.result;
          const tx = db.transaction('loggedSets', 'readwrite');
          tx.objectStore('loggedSets').put({ ...mall, exerciseId });
          tx.oncomplete = () => {
            db.close();
            resolve(true);
          };
          tx.onerror = () => {
            db.close();
            resolve(false);
          };
        };
      }),
    { exerciseId, mall: IMPORTERAT_SET }
  );
}

test('1. sådd följt av navigering syns på sidan', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  const skrevs = await seedaRått(page, övning.id);
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  // Färsk navigering: sidan monteras om och useLiveQuery gör sin FÖRSTA läsning.
  // Ingen liveuppdatering behövs, vilket är hela poängen med metoden.
  await page.goto(`/ovning/${övning.id}`);

  await expect(page.getByRole('heading', { name: övning.name })).toBeVisible();

  // Påstår att notisen SYNS, aldrig vad den lyder — 12.22 skriver om meningen.
  await expect(page.getByText(/importerad/i)).toBeVisible();
});

/**
 * MÄTT 2026-08-12: en rå IndexedDB-skrivning når **inte** en öppen sida.
 * `useLiveQuery` lyssnar på Dexies egen ändringsspårning, och den ser bara
 * skrivningar som gått genom Dexies API. Vår går förbi det.
 *
 * OMSKRIVET 2026-08-13 (uppgift 12.25). Testet använde tidigare `test.fail()`.
 * Det var fel verktyg, och `/code-review` hittade varför: `test.fail()` gäller
 * **hela testkroppen**, inte den rad man riktar den mot. Uppsättningen låg
 * därmed innanför det förväntat röda området, och gick uppsättningen sönder —
 * sidan renderade inte, övningen hittades inte — rapporterades testet ändå som
 * förväntat rött, alltså grönt i sviten. Mätningen kunde bli "grön" av skäl som
 * inte hade ett dugg med liveuppdatering att göra, vilket är det enda den
 * påstår sig mäta.
 *
 * LÖSNINGEN är att vända påståendet i stället för att flytta annoteringen.
 * Uteblivenhet är vad vi faktiskt mätte, så det är uteblivenhet vi påstår. Testet
 * är nu ett vanligt grönt test, och **båda** egenskaperna gäller:
 *
 *   - går uppsättningen sönder → rött, som vilket test som helst.
 *   - börjar liveuppdateringen plötsligt fungera — Dexie byter spårnings-
 *     mekanism, eller någon lägger till en BroadcastChannel → notisen dyker upp,
 *     `toHaveCount(0)` faller, och vi får veta att antagandet under 12.20 har
 *     ändrats. Exakt det larm `test.fail()` var tänkt att ge.
 *
 * FÖLJDEN FÖR 12.20: omladdning eller färsk navigering efter sådd är ett KRAV,
 * inte en försiktighetsåtgärd. Hoppar man över det står sidan tom och felet ser
 * ut som en trasig läsväg i stället för en utebliven uppdatering.
 */
test('2. sådd medan sidan är öppen når INTE fram — mätt, inte antaget', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await page.goto(`/ovning/${övning.id}`);
  await expect(page.getByRole('heading', { name: övning.name })).toBeVisible();
  await expect(page.getByText(/importerad/i)).toHaveCount(0);

  await seedaRått(page, övning.id);

  // Fast väntan, och den är motiverad: ett negativt påstående går inte att
  // bevisa med `expect`:s automatiska omförsök. `toHaveCount(0)` lyckas direkt
  // vid noll träffar och hade alltså gått grönt i samma ögonblick som sådden,
  // långt innan en eventuell liveuppdatering hunnit fram. Vi måste ge
  // uppdateringen tid att INTE komma innan frånvaron betyder något.
  await page.waitForTimeout(3_000);

  await expect(page.getByText(/importerad/i)).toHaveCount(0);
});
