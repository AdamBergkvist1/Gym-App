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
 * Påståendet, oförändrat sedan 2026-08-13: **ett importerat set får aldrig bli
 * referensvärde, och dess vikt får inte synas någonstans i kortet.** Uppgift
 * 13.4 — Adams `2024 vecka 14: Bänk 90 kg` var ett 1-repsmax ur gamla
 * anteckningar, och referensvärdet är ett minnesstöd om hur det brukar se ut,
 * inte ett rekord att matcha varje gång.
 *
 * 🔄 **OMSKRIVEN 2026-08-26 i steg 4.2, i samma commit som `SetRow` bytte till
 * `getSetAverages`.** Det var 11B.0f:s andra `Klart när`-kriterium och skälet
 * rutan stod obockad.
 *
 * **Vad som ändrades, och vad som INTE gjorde det:**
 *
 * | | Före | Nu |
 * |---|---|---|
 * | Referensvärdet | `FÖRRA`-kolumnen, `getLastPerformance` | Snittet under värdet, `getSetAverages` |
 * | Hur det mäts | `getByTestId('setrad-forra')` | Kg-knappens tillgängliga namn |
 * | **Påståendet** | **oförändrat** | **oförändrat** |
 *
 * `data-testid`:t är alltså borta, men det var aldrig påståendet — filhuvudet
 * sa uttryckligen att det var testid:t som fick offras, inte påståendet. Det
 * nya måttet är dessutom **starkare**: `setrad-forra` var en naken span, medan
 * snittet nu ligger i knappens etikett (`SetRow.tsx`) och därför mäts på
 * `role` + tillgängligt namn — projektets beslut 7, utan undantag den här gången.
 *
 * ⚠️ **TVÅ KODVÄGAR LÄSER HISTORIKEN, OCH BÅDA MÄTS HÄR.** Det är inte en
 * dubblering utan hela poängen:
 *
 *   1. **Planvägen** — `addExerciseToPlan` (`plan.ts:88`) förifyller setraderna
 *      när övningen läggs till, och läser `getLastPerformance`. **Den vägen är
 *      oförändrad i steg 4.2** — bara visningen bytte källa.
 *   2. **Visningsvägen** — `ExerciseCard` kör en egen `useLiveQuery`, numera mot
 *      `getSetAverages`, som driver snittalen.
 *
 * De är helt oberoende, och läser nu **två olika funktioner med var sitt
 * importfilter**. Mäts bara den ena kan den andra tappa sitt filter utan att
 * någon grind säger ett ord.
 *
 * ⚠️ **BESLUT 6 I 11B.0e: det vanliga setet skapas GENOM APPEN, som en riktig
 * användare.** Bara det importerade setet seedas rått, eftersom `source:
 * 'import'` inte går att skapa via UI:t (`repo.ts:156` hårdkodar
 * `isImported: false`). Blandfallet var oprövat före den här filen.
 *
 * ⚠️ **`workouts` SEEDAS INTE HÄR, TROTS VAD 12.20 LÄNGE PÅSTOD.** Varken
 * `getLastPerformance` eller `getSetAverages` slår upp passet — båda läser bara
 * `loggedSets`. Passen i den här filen finns för att `excludeWorkoutId` ska ha
 * något att utesluta, och de skapas genom appen, inte som fixtur.
 */

/**
 * Kg-knappen på första setraden, vars tillgängliga namn bär referensvärdet.
 *
 * Formen är `Vikt <inmatat> kilo för set 1, brukar vara <snitt> kilo, tryck …`
 * — eller utan `brukar vara`-delen när det inte finns något snitt. Det är den
 * frånvaron 5a mäter.
 */
function förstaKgKnappen(page: Parameters<typeof setlista>[0], övningsnamn: string) {
  // `^Vikt` och inte bara `för set 1`: Reps-knappen på samma rad heter
  // "5 reps för set 1, …" och hade matchat lika bra.
  return setlista(page, övningsnamn).getByRole('button', { name: /^Vikt .*för set 1/ });
}

test('5a. inget snitt visas när enda tidigare setet är importerat', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  // TVÅ övningar, och den andra är inte dekoration — se ankringen längst ner.
  const [importerad, riktig] = await hämtaÖvningar(page, 2);

  // ⚠️ **DATUMET ÄR INTE KOSMETIK, OCH DET VAR FEL FRAM TILL 2026-08-26.**
  // `IMPORTERAT_SET` har `performedAt: '2024-04-04'`, alltså över två år
  // tillbaka. Det dög när kolumnen drevs av `getLastPerformance`, som inte har
  // någon åldersgräns — men `getSetAverages` har en på åtta veckor, och då
  // **maskerar de två filtren varandra**: saboterades importfiltret stod
  // vakten grön ändå, eftersom åldersgränsen tog setet i stället. Vakten hade
  // mätt fel filter utan att någon märkt det.
  //
  // Med setet inom åtta veckor är importfiltret det ENDA som kan hålla det
  // borta. Kontrollerat genom sabotage: filtret borttaget → vakten faller.
  const inomÅldersgränsen = new Date(Date.now() - 3_600_000).toISOString();
  await seedaRått(page, importerad!.id, {
    id: 'vakt-5a-importerat-set',
    weightKg: 82.5,
    reps: 5,
    performedAt: inomÅldersgränsen,
    updatedAt: inomÅldersgränsen,
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

  // ⚠️ ANKRINGEN, OCH DEN ÖVERLEVDE OMSKRIVNINGEN OFÖRÄNDRAD I SIN FUNKTION.
  // Snittet drivs av en `useLiveQuery` med startvärdet `null`, och ett saknat
  // snitt ser likadant ut oavsett om frågan svarade "inget" eller aldrig
  // svarade alls. Samma fälla som vakt 3b gick i.
  //
  // Därför står en övning med KÄND historik bredvid, renderad av samma
  // komponent i samma ögonblick. Visar den sitt snitt har visningsvägen
  // bevisligen löst ut — och först då betyder frånvaron hos den andra något.
  await expect(förstaKgKnappen(page, riktig!.name)).toHaveAccessibleName(
    new RegExp(`brukar vara ${loggat.vikt} kilo`)
  );

  // Visningsvägen: inget snitt alls, eftersom det enda underlaget är importerat.
  await expect(förstaKgKnappen(page, importerad!.name)).not.toHaveAccessibleName(/brukar vara/);

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

test('5b. blandat: snittet bygger på det app-loggade setet, aldrig på det importerade', async ({
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
  // tal har frågan löst ut OCH valt rätt underlag. Här behövs ingen granne.
  await expect(förstaKgKnappen(page, övning.name)).toHaveAccessibleName(
    new RegExp(`brukar vara ${loggat.vikt} kilo`)
  );
  await expect(setlista(page, övning.name)).not.toContainText('82,5');

  // Planvägen ska ha förifyllt ur samma set.
  await expect(
    setlista(page, övning.name).getByRole('button', { name: /^Vikt 10 kilo för set 1/ })
  ).toBeVisible();

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});
