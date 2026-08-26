import { test, expect } from '@playwright/test';
import {
  avslutaPass,
  fångaKonsolfel,
  hämtaÖvning,
  hämtaÖvningar,
  loggaSetGenomAppen,
  läggTillÖvning,
  seedaRått,
  setlista,
  startaPass,
} from './hjalpare';

/**
 * VAKT 5 över passvyn. Uppgift 12.20, punkt 5.
 *
 * Påståendet: **`FÖRRA`-kolumnen är tom när enda tidigare setet är importerat.**
 * Filtret sitter i `getLastPerformance` (`src/db/repo.ts:336`) och är uppgift
 * 13.4 — Adams `2024 vecka 14: Bänk 90 kg` var ett 1-repsmax, och spökdatan är
 * ett minnesstöd om förra passet, inte ett rekord att matcha varje gång.
 *
 * ⏰ **KOLUMNEN SKA BORT, OCH DEN HÄR VAKTEN MÅSTE SKRIVAS OM MED DEN.**
 * `SPEC.md` §2 ersätter `FÖRRA` med ett snitt, och `DESIGN.md` §3.1 valde formen
 * 2B: inget `setrad-forra`, utan snittvikten under vikten och snittrepsen under
 * repsen. Beräkningen finns redan — `getSetAverages` i `src/db/history.ts`,
 * byggd i 11B.0f med enhetstester som täcker 13.4-filtret.
 *
 * **Vakten står kvar oförändrad med flit.** Kolumnen finns fortfarande
 * (`SetRow.tsx:98`), så vakten mäter något som existerar och är därmed ärlig i
 * dag. Att skriva om den nu hade betytt påståenden om en skärm som ännu inte är
 * byggd — steg 4 bygger den.
 *
 * ⏰ **Den commit som byter `SetRow` till `getSetAverages` skriver om vakten.**
 * Det som ska överleva omskrivningen är påståendet, inte `data-testid`:t: **ett
 * importerat set får aldrig bli referensvärde, och dess vikt får inte synas
 * någonstans i kortet.**
 *
 * ✏️ **Här stod att vakten annars blir "grön mot en kolumn som inte finns".
 * Det stämmer inte, och rättades 2026-08-26 av `/simplify`.** Raden längre ner
 * mäter `getByTestId('setrad-forra')`. Försvinner testid:t matchar lokatorn noll
 * element och `toHaveText` **timeoutar** — vakten faller högljutt, den blir
 * aldrig tyst grön. Påståendet som bär 13.4 står dessutom redan
 * kolumnoberoende: `not.toContainText('82,5')`, opåverkad av att kolumnen går.
 *
 * Varningen står kvar för att omskrivningen ska bli gjord — men prosa som
 * överdriver risken blir diskonterad, och då tappar de sanna varningarna i det
 * här filhuvudet i vikt.
 *
 * ⚠️ **TVÅ KODVÄGAR LÄSER `getLastPerformance`, OCH BÅDA MÄTS HÄR.** Det är inte
 * en dubblering utan hela poängen:
 *
 *   1. **Planvägen** — `addExerciseToPlan` (`plan.ts:88`) förifyller setraderna
 *      när övningen läggs till. Syns i Kg-fältets tillgängliga namn.
 *   2. **Visningsvägen** — `ExerciseCard` (`ExerciseCard.tsx:46`) kör en egen
 *      `useLiveQuery` som driver `Förra`-cellen.
 *
 * De är helt oberoende. Mäts bara den ena kan den andra tappa filtret utan att
 * någon grind säger ett ord — och punkt 5 namnger uttryckligen kolumnen.
 *
 * ⚠️ **BESLUT 6 I 11B.0e: det vanliga setet skapas GENOM APPEN, som en riktig
 * användare.** Bara det importerade setet seedas rått, eftersom `source:
 * 'import'` inte går att skapa via UI:t (`repo.ts:156` hårdkodar
 * `isImported: false`). Blandfallet var oprövat före den här filen.
 *
 * ⚠️ **`workouts` SEEDAS INTE HÄR, TROTS VAD 12.20 LÄNGE PÅSTOD.**
 * `getLastPerformance` läser bara `loggedSets` (`repo.ts:325`) och slår aldrig
 * upp passet. Passen i den här filen finns för att `excludeWorkoutId` ska ha
 * något att utesluta — och de skapas genom appen, inte som fixtur.
 */

function förstaFörraCellen(page: Parameters<typeof setlista>[0], övningsnamn: string) {
  return setlista(page, övningsnamn).getByTestId('setrad-forra').first();
}

test('5a. FÖRRA är tom när enda tidigare setet är importerat', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  // TVÅ övningar, och den andra är inte dekoration — se ankringen längst ner.
  const [importerad, riktig] = await hämtaÖvningar(page, 2);

  await seedaRått(page, importerad!.id, {
    id: 'vakt-5a-importerat-set',
    weightKg: 82.5,
    reps: 5,
  });

  // Seeda först, navigera sedan. Se filhuvudet i `hjalpare.ts`.
  await page.goto('/');

  // Pass 1 ger `riktig` en historik som appen själv skapat. `importerad` får
  // ingen — dess enda set är det seedade.
  await startaPass(page);
  await läggTillÖvning(page, riktig!.name);
  const loggat = await loggaSetGenomAppen(page, riktig!.name);
  await avslutaPass(page);

  // Pass 2 är där mätningen sker: spökdatan utesluter alltid det pågående
  // passet (`excludeWorkoutId`), så setet ovan måste ligga i ett avslutat pass
  // för att kunna bli spökdata över huvud taget.
  await startaPass(page);
  await läggTillÖvning(page, importerad!.name);
  await läggTillÖvning(page, riktig!.name);

  // ⚠️ ANKRINGEN. `Förra`-cellen drivs av en `useLiveQuery` med startvärdet
  // `null`, och en tom cell ser likadan ut oavsett om frågan svarade "inget"
  // eller aldrig svarade alls. Samma fälla som vakt 3b gick i.
  //
  // Därför står en övning med KÄND historik bredvid, renderad av samma
  // komponent i samma ögonblick. Visar den sin spökdata har visningsvägen
  // bevisligen löst ut — och först då betyder den tomma cellen något.
  await expect(förstaFörraCellen(page, riktig!.name)).toHaveText(
    new RegExp(`${loggat.vikt}\\s*×\\s*${loggat.reps}`)
  );

  // Visningsvägen: kolumnen är tom.
  await expect(förstaFörraCellen(page, importerad!.name)).toHaveText('');

  // Planvägen: raderna förifylldes aldrig, alltså står vikten som ej angiven.
  // `82,5` får inte ha läckt in någonstans i kortet.
  await expect(
    setlista(page, importerad!.name).getByRole('button', {
      name: /^Vikt inte angiven för set 1/,
    })
  ).toBeVisible();
  await expect(setlista(page, importerad!.name)).not.toContainText('82,5');

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});

test('5b. blandat: spökdatan blir det app-loggade setet, aldrig det importerade', async ({
  page,
}) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // ⚠️ **ORDNINGEN ÄR INTE GODTYCKLIG: det app-loggade setet skapas FÖRST, det
  // importerade seedas efteråt.** Tvärtom hade testet blivit rött av sabotage —
  // men på fel rad. Med det importerade setet redan på plats förifylls planen
  // ur det redan i pass 1, och då faller `loggaSetGenomAppen` på att Kg-fältet
  // inte längre står som ej angivet. Testet hade dött i uppsättningen, innan
  // det mätt sitt eget påstående, och felmeddelandet hade pekat på en hjälpare
  // i stället för på spökdatan. Prövat 2026-08-13, just så blev det.
  await startaPass(page);
  await läggTillÖvning(page, övning.name);
  const loggat = await loggaSetGenomAppen(page, övning.name);
  await avslutaPass(page);

  // ⚠️ **DATUMET ÄR HELA TESTET.** Ligger det importerade setet FÖRE det
  // app-loggade vinner det app-loggade ändå, av ren sortering — och då hade
  // testet gått grönt även med importfiltret borttaget, alltså mätt ingenting.
  // Genom att lägga det en timme FRAM i tiden är sorteringen emot oss, och det
  // enda som kan hålla det borta är filtret i `getLastPerformance`.
  const senareÄnAllaAppLoggade = new Date(Date.now() + 3_600_000).toISOString();
  await seedaRått(page, övning.id, {
    id: 'vakt-5b-importerat-set',
    weightKg: 82.5,
    reps: 5,
    performedAt: senareÄnAllaAppLoggade,
    updatedAt: senareÄnAllaAppLoggade,
  });

  // Seeda först, navigera sedan — regeln gäller varje rå skrivning för sig,
  // inte bara den första i filen. Utan den här omladdningen ser den öppna sidan
  // aldrig raden.
  await page.goto('/');

  await startaPass(page);
  await läggTillÖvning(page, övning.name);

  // Både påståendet och dess ankare i samma rad: syns det app-loggade setets
  // tal har frågan löst ut OCH valt rätt set. Här behövs ingen granne.
  await expect(förstaFörraCellen(page, övning.name)).toHaveText(
    new RegExp(`${loggat.vikt}\\s*×\\s*${loggat.reps}`)
  );
  await expect(setlista(page, övning.name)).not.toContainText('82,5');

  // Planvägen ska ha förifyllt ur samma set.
  await expect(
    setlista(page, övning.name).getByRole('button', { name: /^Vikt 10 kilo för set 1/ })
  ).toBeVisible();

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});
