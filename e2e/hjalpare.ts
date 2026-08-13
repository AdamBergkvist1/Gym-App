import type { Page } from '@playwright/test';
import type { LocalSet } from '../src/db/types';

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

/**
 * Såddraden minus `exerciseId`, som fylls i vid anropet eftersom katalogens id:n
 * inte är våra att bestämma.
 *
 * Typen är bunden till appens riktiga `LocalSet` med flit. Konstanten låg tidigare
 * som `as const` och var därmed bara sig själv — ändrades schemat kunde sådden ha
 * fortsatt skriva en form appen inte längre läser, utan att någon grind sa ett ord.
 * Nu bryter `npm run typecheck` i stället, vilket är hela poängen med en grind.
 */
type SåddSet = Omit<LocalSet, 'exerciseId'>;

/**
 * Ett importerat set. `source: 'import'` är det enda som inte går att skapa genom
 * appen: `repo.ts:156` hårdkodar `isImported: false` och `true` kan bara komma in
 * via synken (`wire.ts:37`). Därför seedas just det rått.
 *
 * ⚠️ **`workoutId` pekar med flykt på ett pass som aldrig skapas** (uppgift 12.27).
 * Raden är alltså föräldralös, och det är en rad appen själv aldrig hade kunnat
 * skapa. Det är säkert **här** och bara här: `getExerciseHistory`
 * (`src/db/history.ts:121`) läser på `[exerciseId+performedAt]` och slår aldrig upp
 * passet, så föräldralösheten kan inte påverka utfallet. Skulle någon vakt börja
 * mäta något som går via `workouts` — passlistan, spökdatan — **duger inte den här
 * konstanten**, och då måste ett riktigt pass seedas. Vakt 4 och 5 i 12.20 är
 * precis sådana. Detta är villkoret 12.27 bad om att få nedskrivet.
 */
export const IMPORTERAT_SET: SåddSet = {
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
};

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

/**
 * Skriver setet rått i `loggedSets`, förbi Dexie. Returnerar true vid lyckad skrivning.
 *
 * ⚠️ **Returvärdet MÅSTE assertas av anroparen.** Kastas det bort kan skrivningen
 * misslyckas tyst, och testet går grönt mot en databas som aldrig fick sin rad —
 * alltså grönt av ett skäl som inte har med det påstådda att göra. Det är samma
 * klass av fel som uppgift 12.25 handlade om, och `/code-review` hittade det här
 * 2026-08-13 i test 2 i `sadd-provning.spec.ts`.
 *
 * `överskrivning` finns för att vakt 3b behöver seeda ett **icke**-importerat set:
 * negationen "ingen notis" måste ankras i ett positivt utfall ur samma fråga, annars
 * går den grön även när `getExerciseHistory` aldrig löses ut.
 */
export async function seedaRått(
  page: Page,
  exerciseId: string,
  överskrivning: Partial<SåddSet> = {}
): Promise<boolean> {
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
    { exerciseId, mall: { ...IMPORTERAT_SET, ...överskrivning } }
  );
}
