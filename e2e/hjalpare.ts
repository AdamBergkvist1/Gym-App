import { expect, type Page } from '@playwright/test';
import type { LocalSet, LocalWorkout } from '../src/db/types';

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

export interface Övning {
  id: string;
  name: string;
}

/**
 * Väntar tills appen hunnit seeda övningskatalogen och returnerar de `antal`
 * första övningarna.
 *
 * Läser ur databasen i stället för att hårdkoda id:n: katalogen är seedad av
 * `bootstrap.ts` och dess id:n är inte våra att bestämma.
 *
 * ⚠️ **`antal` är ett KRAV, inte en önskan.** Väntan löser inte ut förrän så
 * många rader finns. Hade den nöjt sig med färre kunde ett test som behöver två
 * övningar ha fått en enda och fallit på en `undefined` långt senare, med ett
 * felmeddelande som pekar åt fel håll.
 */
export async function hämtaÖvningar(page: Page, antal = 1): Promise<Övning[]> {
  const handtag = await page.waitForFunction(
    (antal) =>
      new Promise<Array<{ id: string; name: string }> | null>((resolve) => {
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
            resolve(
              rader.length >= antal
                ? rader.slice(0, antal).map((r) => ({ id: r.id, name: r.name }))
                : null
            );
          };
        };
      }),
    antal,
    { timeout: 15_000 }
  );

  const övningar = await handtag.jsonValue();
  // `waitForFunction` löser först ut på ett sanningsenligt värde, så null kan
  // inte nås här. Kontrollen finns för typerna — och ger ett begripligt fel i
  // stället för ett kryptiskt om Playwrights beteende någon gång ändras.
  if (!övningar) throw new Error('övningskatalogen seedades aldrig');
  return övningar;
}

/** Bekvämlighet för de tester som bara behöver en övning. */
export async function hämtaÖvning(page: Page): Promise<Övning> {
  const [övning] = await hämtaÖvningar(page, 1);
  return övning!;
}

/**
 * Skriver en rad rått i angiven tabell, förbi Dexie. **Kastar** om skrivningen
 * misslyckas.
 *
 * ⚠️ **DEN KASTAR MED FLIT, OCH DET ÄR EN RÄTTELSE.** Funktionen returnerade
 * tidigare `boolean`, med en docblock som sa att anroparen *måste* komma ihåg
 * att asserta värdet. Den regeln glömdes — `/code-review` hittade 2026-08-13 en
 * kastad retur i `sadd-provning.spec.ts`, timmar efter att samma sak lagats på
 * ett annat ställe. En regel som måste minnas är ingen regel; strukturen ska
 * göra felet omöjligt i stället. Går skrivningen fel faller testet nu på
 * skrivningen, med en text som säger var det small.
 *
 * Ingen version anges vid `open`: då öppnas databasen som den är, och vi kan
 * aldrig råka trigga en uppgradering som krockar med Dexies eget schema.
 */
async function skrivRått(page: Page, tabell: string, rad: object): Promise<void> {
  const fel = await page.evaluate(
    ({ tabell, rad }) =>
      new Promise<string | null>((resolve) => {
        const öppna = indexedDB.open('gym');
        öppna.onerror = () => resolve(`kunde inte öppna databasen: ${öppna.error?.message ?? ''}`);
        öppna.onsuccess = () => {
          const db = öppna.result;
          if (!db.objectStoreNames.contains(tabell)) {
            db.close();
            resolve(`tabellen "${tabell}" finns inte`);
            return;
          }
          const tx = db.transaction(tabell, 'readwrite');
          tx.objectStore(tabell).put(rad);
          tx.oncomplete = () => {
            db.close();
            resolve(null);
          };
          tx.onerror = () => {
            db.close();
            resolve(`skrivningen mot "${tabell}" avvisades: ${tx.error?.message ?? ''}`);
          };
        };
      }),
    { tabell, rad }
  );

  if (fel !== null) throw new Error(`rå sådd misslyckades — ${fel}`);
}

/**
 * Seedar ett set rått i `loggedSets`. Kastar om skrivningen misslyckas.
 *
 * `överskrivning` finns för att vakt 3b behöver seeda ett **icke**-importerat set:
 * negationen "ingen notis" måste ankras i ett positivt utfall ur samma fråga, annars
 * går den grön även när `getExerciseHistory` aldrig löses ut.
 */
export async function seedaRått(
  page: Page,
  exerciseId: string,
  överskrivning: Partial<SåddSet> = {}
): Promise<void> {
  await skrivRått(page, 'loggedSets', { ...IMPORTERAT_SET, ...överskrivning, exerciseId });
}

/**
 * Ett pass loggat i appen. Mallen som `seedaPassRått` skriver om inget annat sägs.
 *
 * `isImported: false` är default med flit: det importerade passet är undantaget
 * och ska behöva skrivas ut vid anropet, så att det syns i testet vilket av två
 * pass som är vilket.
 */
const PASS_MALL: LocalWorkout = {
  id: 'sadd-pass-1',
  startedAt: '2024-07-01T17:00:00.000Z',
  endedAt: '2024-07-01T18:00:00.000Z',
  title: null,
  note: null,
  isImported: false,
  isDeleted: false,
  updatedAt: '2024-07-01T18:00:00.000Z',
};

/**
 * Seedar ett pass rått i `workouts`. Kastar om skrivningen misslyckas.
 *
 * VARFÖR DEN BEHÖVS: `IMPORTERAT_SET` är föräldralöst med flit (12.27). Det
 * duger för `getExerciseHistory`, som aldrig slår upp passet, men vakt 4 mäter
 * `listWorkoutSummaries` — och den läser `workouts`-tabellen.
 *
 * ⚠️ **BARA FÖR IMPORTERADE PASS.** Beslut 6 i 11B.0e: *"Bara det importerade
 * setet seedas rått — det vanliga skapas genom appen, som en riktig
 * användare."* `isImported: true` går inte att sätta via UI:t (`repo.ts:156`
 * hårdkodar `false`, och `true` kan bara komma in via synken), så rått är enda
 * vägen dit. Ett **vanligt** pass ska i stället startas med `startaPass`.
 * Annars mäter vakten sin egen fixtur i stället för appens skrivväg: skulle
 * `startWorkout` någon gång börja sätta fel flagga hade testet stått grönt
 * medan appen var trasig. `/code-review` hittade precis det 2026-08-13.
 */
export async function seedaPassRått(
  page: Page,
  överskrivning: Partial<LocalWorkout> = {}
): Promise<void> {
  await skrivRått(page, 'workouts', { ...PASS_MALL, ...överskrivning });
}

/* ------------------------------------------------------------------ *
 * Vägen genom appen — beslut 6:s "som en riktig användare"            *
 * ------------------------------------------------------------------ */

/**
 * Startar ett tomt pass från passvyn.
 *
 * Eftervillkoret assertas, precis som i `avslutaPass`. Registrerades klicket
 * aldrig faller testet här i stället för längre ner med ett felmeddelande som
 * pekar på fel sak — sessionens lärdom 2026-08-13.
 */
export async function startaPass(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Starta tomt pass' }).click();
  await expect(page.getByRole('button', { name: '+ Lägg till övning' })).toBeVisible();
}

/** Avslutar det pågående passet. */
export async function avslutaPass(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Avsluta pass' }).click();
  await expect(page.getByRole('button', { name: 'Starta tomt pass' })).toBeVisible();
}

export async function läggTillÖvning(page: Page, namn: string): Promise<void> {
  await page.getByRole('button', { name: '+ Lägg till övning' }).click();
  const väljaren = page.getByRole('dialog', { name: 'Lägg till övning' });
  await väljaren.getByRole('searchbox').fill(namn);
  // Exakt textträff på övningsnamnet, inte på knappens tillgängliga namn:
  // knappen heter "<namn> <muskelgrupp>", och en prefixmatchning hade kunnat
  // träffa fel rad när två övningar delar början av sitt namn. Spannet ligger
  // inuti knappen, så klicket når fram.
  await väljaren.getByText(namn, { exact: true }).click();
  await expect(väljaren).toHaveCount(0);
}

/** Setraderna för en övning. Namnet sattes i `ExerciseCard` för just det här. */
export function setlista(page: Page, övningsnamn: string) {
  return page.getByRole('list', { name: `Set för ${övningsnamn}` });
}

/**
 * Loggar ett riktigt set genom UI:t: justera vikten, bocka av raden.
 * Returnerar vikten som loggades, så att anroparen slipper upprepa talet.
 *
 * VIKTEN STEGAS I STÄLLET FÖR ATT SKRIVAS. `+2,5` fyra gånger ger 10 kg — och
 * mellansteget assertas innan raden bockas av, så att testet aldrig loggar en
 * vikt det inte vet vad den blev. Utan den kontrollen hade en ändring i
 * `stepWeight` gjort testet grönt mot fel siffra.
 *
 * Reps lämnas på förvalet `plan.ts` sätter på en tom rad. **Också det assertas
 * innan raden bockas av** — returvärdet är annars ett påstående funktionen inte
 * har täckning för, och anroparna bygger sina jämförelser på just det talet.
 */
export async function loggaSetGenomAppen(
  page: Page,
  övningsnamn: string
): Promise<{ vikt: number; reps: number }> {
  const raderna = setlista(page, övningsnamn);
  await raderna.getByRole('button', { name: /^Vikt inte angiven för set 1/ }).click();

  const arket = page.getByRole('dialog', { name: `Justera set 1, ${övningsnamn}` });
  for (let i = 0; i < 4; i++) await arket.getByRole('button', { name: '+2,5' }).click();
  // `Klar`, inte `Stäng`. Den senare finns också och heter rätt, men den är
  // bakgrundsytan bakom arket (`absolute inset-0`) — tryck-utanför-för-att-
  // stänga, gjord nåbar för skärmläsare. Själva arket ligger ovanpå och tar
  // klicket, precis som det ska. `Klar` är knappen en användare trycker på.
  await arket.getByRole('button', { name: 'Klar' }).click();
  await expect(arket).toHaveCount(0);

  await expect(raderna.getByRole('button', { name: /^Vikt 10 kilo för set 1/ })).toBeVisible();
  await expect(raderna.getByRole('button', { name: /^8 reps för set 1/ })).toBeVisible();
  await raderna.getByRole('button', { name: 'Klarmarkera set 1' }).click();
  await expect(raderna.getByRole('button', { name: 'Ångra set 1' })).toBeVisible();

  return { vikt: 10, reps: 8 };
}

/**
 * Kopplar lyssnare för konsolfel och returnerar listan de fylls i.
 *
 * ⚠️ **TVÅ LYSSNARE, OCH SABOTAGET BEVISADE VARFÖR.** Ett okastat undantag dök
 * upp **bara** som `pageerror`, aldrig som `console.error` (vakt 6, 2026-08-13).
 * Hade vakten lyssnat på det ena men inte det andra hade den felklassen
 * passerat tyst — och en vakt som ser grön ut utan att kunna larma är värre än
 * ingen vakt.
 *
 * ⚠️ **MÅSTE ANROPAS FÖRE FÖRSTA `goto`.** Ett fel som hinner uppstå innan dess
 * fångas aldrig, och listan hade varit tom utan att någon märkt det.
 */
export function fångaKonsolfel(page: Page): string[] {
  const fel: string[] = [];
  page.on('console', (meddelande) => {
    if (meddelande.type() === 'error') fel.push(`console.error: ${meddelande.text()}`);
  });
  page.on('pageerror', (undantag) => fel.push(`okastat fel: ${undantag.message}`));
  return fel;
}
