import { test, expect, type Page } from '@playwright/test';
import { hämtaÖvningar, seedaRått } from './hjalpare';

/**
 * VAKT 5 över passvyn. Uppgift 12.20, punkt 5.
 *
 * Påståendet: **`FÖRRA`-kolumnen är tom när enda tidigare setet är importerat.**
 * Filtret sitter i `getLastPerformance` (`src/db/repo.ts:336`) och är uppgift
 * 13.4 — Adams `2024 vecka 14: Bänk 90 kg` var ett 1-repsmax, och spökdatan är
 * ett minnesstöd om förra passet, inte ett rekord att matcha varje gång.
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
 */

/** Sidan har två knappar med snarlik text; den här är den på tomma passvyn. */
async function startaPass(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Starta tomt pass' }).click();
}

async function läggTillÖvning(page: Page, namn: string): Promise<void> {
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

/**
 * Loggar ett riktigt set genom UI:t: justera vikten, bocka av raden.
 *
 * VIKTEN STEGAS I STÄLLET FÖR ATT SKRIVAS. `+2,5` fyra gånger ger 10 kg — och
 * mellansteget assertas innan raden bockas av, så att testet aldrig loggar en
 * vikt det inte vet vad den blev. Utan den kontrollen hade en ändring i
 * `stepWeight` gjort testet grönt mot fel siffra.
 */
async function loggaSetGenomAppen(page: Page, övningsnamn: string): Promise<void> {
  await page.getByRole('button', { name: /^Vikt inte angiven för set 1/ }).click();

  const arket = page.getByRole('dialog', { name: `Justera set 1, ${övningsnamn}` });
  for (let i = 0; i < 4; i++) await arket.getByRole('button', { name: '+2,5' }).click();
  // `Klar`, inte `Stäng`. Den senare finns också och heter rätt, men den är
  // bakgrundsytan bakom arket (`absolute inset-0`) — tryck-utanför-för-att-
  // stänga, gjord nåbar för skärmläsare. Själva arket ligger ovanpå och tar
  // klicket, precis som det ska. `Klar` är knappen en användare trycker på.
  await arket.getByRole('button', { name: 'Klar' }).click();
  await expect(arket).toHaveCount(0);

  await expect(page.getByRole('button', { name: /^Vikt 10 kilo för set 1/ })).toBeVisible();
  await page.getByRole('button', { name: 'Klarmarkera set 1' }).click();
  await expect(page.getByRole('button', { name: 'Ångra set 1' })).toBeVisible();
}

/** Setraderna för en övning. Namnet sattes i `ExerciseCard` för just det här. */
function setlista(page: Page, övningsnamn: string) {
  return page.getByRole('list', { name: `Set för ${övningsnamn}` });
}

function förstaFörraCellen(page: Page, övningsnamn: string) {
  return setlista(page, övningsnamn).getByTestId('setrad-forra').first();
}

test('5a. FÖRRA är tom när enda tidigare setet är importerat', async ({ page }) => {
  await page.goto('/');
  // TVÅ övningar, och den andra är inte dekoration — se ankringen längst ner.
  const [medBaraImport, medRiktigHistorik] = await hämtaÖvningar(page, 2);
  const importerad = medBaraImport!;
  const riktig = medRiktigHistorik!;

  const skrevs = await seedaRått(page, importerad.id, {
    id: 'vakt-5a-importerat-set',
    weightKg: 82.5,
    reps: 5,
  });
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  await page.goto('/');

  // Pass 1 ger `riktig` en historik som appen själv skapat. `importerad` får
  // ingen — dess enda set är det seedade.
  await startaPass(page);
  await läggTillÖvning(page, riktig.name);
  await loggaSetGenomAppen(page, riktig.name);
  await page.getByRole('button', { name: 'Avsluta pass' }).click();

  // Pass 2 är där mätningen sker: spökdatan utesluter alltid det pågående
  // passet (`excludeWorkoutId`), så setet ovan måste ligga i ett avslutat pass
  // för att kunna bli spökdata över huvud taget.
  await startaPass(page);
  await läggTillÖvning(page, importerad.name);
  await läggTillÖvning(page, riktig.name);

  // ⚠️ ANKRINGEN. `Förra`-cellen drivs av en `useLiveQuery` med startvärdet
  // `null`, och en tom cell ser likadan ut oavsett om frågan svarade "inget"
  // eller aldrig svarade alls. Samma fälla som vakt 3b gick i.
  //
  // Därför står en övning med KÄND historik bredvid, renderad av samma
  // komponent i samma ögonblick. Visar den sin spökdata har visningsvägen
  // bevisligen löst ut — och först då betyder den tomma cellen något.
  await expect(förstaFörraCellen(page, riktig.name)).toHaveText(/10\s*×\s*8/);

  // Visningsvägen: kolumnen är tom.
  await expect(förstaFörraCellen(page, importerad.name)).toHaveText('');

  // Planvägen: raderna förifylldes aldrig, alltså står vikten som ej angiven.
  // `82,5` får inte ha läckt in någonstans i kortet.
  await expect(
    setlista(page, importerad.name).getByRole('button', { name: /^Vikt inte angiven för set 1/ })
  ).toBeVisible();
  await expect(setlista(page, importerad.name)).not.toContainText('82,5');
});

test('5b. blandat: spökdatan blir det app-loggade setet, aldrig det importerade', async ({
  page,
}) => {
  await page.goto('/');
  const [övning] = await hämtaÖvningar(page, 1);
  const den = övning!;

  // ⚠️ **ORDNINGEN ÄR INTE GODTYCKLIG: det app-loggade setet skapas FÖRST, det
  // importerade seedas efteråt.** Tvärtom hade testet blivit rött av sabotage —
  // men på fel rad. Med det importerade setet redan på plats förifylls planen
  // ur det redan i pass 1, och då faller `loggaSetGenomAppen` på att Kg-fältet
  // inte längre står som ej angivet. Testet hade dött i uppsättningen, innan
  // det mätt sitt eget påstående, och felmeddelandet hade pekat på en hjälpare
  // i stället för på spökdatan. Prövat 2026-08-13, just så blev det.
  await startaPass(page);
  await läggTillÖvning(page, den.name);
  await loggaSetGenomAppen(page, den.name);
  await page.getByRole('button', { name: 'Avsluta pass' }).click();

  // ⚠️ **DATUMET ÄR HELA TESTET.** Ligger det importerade setet FÖRE det
  // app-loggade vinner det app-loggade ändå, av ren sortering — och då hade
  // testet gått grönt även med importfiltret borttaget, alltså mätt ingenting.
  // Genom att lägga det en timme FRAM i tiden är sorteringen emot oss, och det
  // enda som kan hålla det borta är filtret i `getLastPerformance`.
  const senareÄnAllaAppLoggade = new Date(Date.now() + 3_600_000).toISOString();
  const skrevs = await seedaRått(page, den.id, {
    id: 'vakt-5b-importerat-set',
    weightKg: 82.5,
    reps: 5,
    performedAt: senareÄnAllaAppLoggade,
    updatedAt: senareÄnAllaAppLoggade,
  });
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  // Seeda först, navigera sedan — regeln gäller varje rå skrivning för sig,
  // inte bara den första i filen. Utan den här omladdningen ser den öppna sidan
  // aldrig raden.
  await page.goto('/');

  await startaPass(page);
  await läggTillÖvning(page, den.name);

  // Både påståendet och dess ankare i samma rad: syns `10 × 8` har frågan löst
  // ut OCH valt rätt set. Här behövs ingen granne som kontroll.
  await expect(förstaFörraCellen(page, den.name)).toHaveText(/10\s*×\s*8/);
  await expect(setlista(page, den.name)).not.toContainText('82,5');

  // Planvägen ska ha förifyllt ur samma set.
  await expect(page.getByRole('button', { name: /^Vikt 10 kilo för set 1/ })).toBeVisible();
});
