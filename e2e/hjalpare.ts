import { expect, type Locator, type Page } from '@playwright/test';
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
 * Lägger till en rad i en övning. Ny 2026-09-03 med uppgift `12.59`.
 *
 * **Varför den behövdes just nu:** fram till 12.59 fick en övning utan historik
 * tre rader vid tillägg, och tester som behövde två rader fick dem gratis. Nu
 * ges en rad, och den andra måste begäras. Att skriva det i testet i stället
 * för att sänka påståendet är skillnaden mellan att laga ett test och att
 * försvaga det.
 */
export async function läggTillSet(page: Page, övningsnamn: string): Promise<void> {
  const rader = setlista(page, övningsnamn).getByRole('listitem');
  const före = await rader.count();
  await page.getByRole('button', { name: `Lägg till set för ${övningsnamn}` }).click();
  await expect(rader).toHaveCount(före + 1);
}

/**
 * Vilken rad. `SetRow.tsx:92` bygger samma fras — uppvärmningen har inget
 * nummer, den har ett namn.
 */
export type Setnummer = number | 'uppvärmning';

/**
 * Radens identitetsfras, så som den står i VARJE etikett på raden.
 *
 * ⛔ **DEN HÄR FRASEN ÄR PRIMITIVEN, INTE LOKATORERNA.** Fram till 12.47 punkt 3
 * stavade elva anropsplatser ut radens identitet för hand, och alla elva blandade
 * ihop två frågor som inte är samma fråga: **vilken knapp** (övning, rad, fält)
 * och **vad den visar just nu** (`inte angiven` / `10 kilo`). Bakas tillståndet in
 * i identiteten måste varje anropsplats kunna hela etikettgrammatiken — även de
 * som bara vill trycka på knappen. Samma rörelse som `src/lib/worksets.ts` gjorde
 * när arraysignaturen visade sig vara ett enpassfall av en räknare.
 *
 * ⚠️ **STAVAS SJÄLVSTÄNDIGT MED FLIT.** Frasen importeras INTE från `src/` — då
 * hade sviten mätt sin egen import och en ändrad etikett gått grön. Det är samma
 * skäl som `SåddSet` har motsatt behandling: **fixturer binds till appen,
 * påståenden stavas självständigt.**
 */
function radnamn(set: Setnummer): string {
  return set === 'uppvärmning' ? 'uppvärmningen' : `set ${set}`;
}

/**
 * Kg- eller Reps-knappen på en setrad. **Adresserar bara — påstår ingenting.**
 *
 * Vill du veta vad knappen visar, assertera det med `toHaveAccessibleName`. Då
 * säger ett fel *"namnet var fel"* i stället för *"locator resolved to 0
 * elements"*, vilket läser som att kortet aldrig renderades.
 *
 * ⚠️ **Asymmetrin i regexarna är etiketternas, inte vår.** Vikten heter
 * `Vikt <värde> kilo för <rad>`, repsen heter `<värde> reps för <rad>` — fältet
 * står först i den ena och efter talet i den andra.
 *
 * ✏️ **DET SOM SKILJER KNAPPARNA ÅT ÄR ORDET `Vikt`, INTE `^`-ANKARET.** Den här
 * kommentaren påstod motsatsen tills den saboterades 2026-08-27: `^` togs bort
 * och båda vakterna förblev gröna, medan ordet `Vikt` borttaget gav *"strict mode
 * violation … resolved to 2 elements"* direkt. Ankaret är alltså **inte bärande i
 * dagens grammatik** — det står kvar för att en framtida etikett skulle kunna bära
 * `Vikt` mitt i strängen, och det ska läsas som en försiktighetsåtgärd, inte som
 * en vakt. Formuleringen i `passvy.spec.ts` menade `^Vikt` mot enbart `för set 1`;
 * jag läste den som ett påstående om ankaret och skrev fel.
 */
export function talknapp(
  page: Page,
  övningsnamn: string,
  fält: 'vikt' | 'reps',
  set: Setnummer = 1
): Locator {
  const rad = radnamn(set);
  return setlista(page, övningsnamn).getByRole('button', {
    name: fält === 'vikt' ? new RegExp(`^Vikt .*för ${rad}`) : new RegExp(` reps för ${rad}`),
  });
}

/**
 * Bocken på en setrad, i båda lägena.
 *
 * Namnet växlar mellan `Klarmarkera` och `Ångra`, så lokatorn tar båda och
 * lämnar tillståndet till `aria-pressed` (`SetRow.tsx:199`). Annars vore ett
 * namnbyte omöjligt att skilja från en försvunnen knapp.
 */
export function bockknapp(page: Page, övningsnamn: string, set: Setnummer = 1): Locator {
  return setlista(page, övningsnamn).getByRole('button', {
    name: new RegExp(`^(Klarmarkera|Ångra) ${radnamn(set)}$`),
  });
}

/**
 * Justeringsarket för en setrad.
 *
 * ✏️ **RUTAN HÄR VARNADE FÖR ATT ARKETS NUMMER INTE KOM UR SAMMA RÄKNING SOM
 * RADENS. Det är rättat i 12.49.** `ExerciseCard` skickade radens plats i LISTAN
 * (`findIndex(...) + 1`) medan raden numrerades bland arbetsseten, så en
 * uppvärmningsrad överst gav knappen `… för set 1` och arket `Justera set 2`.
 * Båda sidor läser nu `radnamn` i `src/lib/worksets.ts`.
 *
 * Rutan sa också att kedjan *"håller av tur"* eftersom ingen vakt hade en
 * uppvärmningsrad. **Det stämmer inte längre heller:** `uppvarmning.spec.ts` är
 * sviten första vakt som faktiskt växlar en rad till uppvärmning, och den var
 * röd mot den gamla räkningen.
 */
export function justeringsarket(page: Page, övningsnamn: string, set: Setnummer = 1): Locator {
  return page.getByRole('dialog', { name: `Justera ${radnamn(set)}, ${övningsnamn}` });
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
  const kg = talknapp(page, övningsnamn, 'vikt');

  // ⚠️ FÖRUTSÄTTNINGEN ASSERTAS I STÄLLET FÖR ATT LIGGA I LOKATORN. Raden måste
  // vara tom — annars ger fyra `+2,5` en annan vikt än 10, och returvärdet nedan
  // vore en lögn. Låg villkoret i lokatorn (`/^Vikt inte angiven …/`) föll en
  // förifylld rad i stället som "locator resolved to 0 elements", vilket läser
  // som att kortet aldrig renderades.
  await expect(kg).toHaveAccessibleName(/^Vikt inte angiven/);
  await kg.click();

  const arket = justeringsarket(page, övningsnamn);
  for (let i = 0; i < 4; i++) await arket.getByRole('button', { name: '+2,5' }).click();
  // `Klar`, inte `Stäng`. Den senare finns också och heter rätt, men den är
  // bakgrundsytan bakom arket (`absolute inset-0`) — tryck-utanför-för-att-
  // stänga, gjord nåbar för skärmläsare. Själva arket ligger ovanpå och tar
  // klicket, precis som det ska. `Klar` är knappen en användare trycker på.
  await arket.getByRole('button', { name: 'Klar' }).click();
  await expect(arket).toHaveCount(0);

  // Talen assertas som NAMN, inte som lokator. Samma styrka på påståendet —
  // vikten och repsen måste fortfarande vara 10 och 8 för att raden ska passera —
  // men ett fel säger nu vilket tal som blev fel i stället för att knappen inte
  // fanns.
  await expect(kg).toHaveAccessibleName(/^Vikt 10 kilo/);
  await expect(talknapp(page, övningsnamn, 'reps')).toHaveAccessibleName(/^8 reps/);

  const bock = bockknapp(page, övningsnamn);
  await bock.click();
  // `aria-pressed`, inte namnbytet till `Ångra`. Tillståndet finns redan som
  // attribut (`SetRow.tsx:199`), och mätt på namnet går ett namnbyte inte att
  // skilja från en försvunnen knapp.
  await expect(bock).toHaveAttribute('aria-pressed', 'true');

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
