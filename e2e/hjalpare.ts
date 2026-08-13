import type { Page } from '@playwright/test';

/**
 * Delade hjälpare för e2e-sviten.
 *
 * VARFÖR FILEN FINNS: `sadd-provning.spec.ts` ägde `hämtaÖvning` och `seedaRått`,
 * och 12.20 behöver båda. Att kopiera dem hade gett två kopior som driver isär —
 * `/code-review` flaggade redan duplicering i den här ändringsomgången. Utbrutna
 * 2026-08-13, oförändrade till innehållet.
 *
 * ⚠️ **REGELN SOM GÄLLER ALLA ANROPARE:** seeda FÖRST, navigera SEDAN.
 * `useLiveQuery` lyssnar på Dexies egen ändringsspårning och ser bara skrivningar
 * som gått genom Dexies API. `seedaRått` går förbi det med flit. Skriver man mot en
 * redan öppen sida når raden aldrig fram, sidan står tom, och felet läser som en
 * trasig läsväg i stället för en utebliven uppdatering. Mätningen som slog fast det
 * ligger som test 2 i `sadd-provning.spec.ts`.
 */

/** Ett importerat set. `source: 'import'` är det enda som inte går att skapa genom appen. */
export const IMPORTERAT_SET = {
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
export async function hämtaÖvning(page: Page): Promise<{ id: string; name: string }> {
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
export async function seedaRått(page: Page, exerciseId: string): Promise<boolean> {
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
