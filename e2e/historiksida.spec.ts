import { test, expect } from '@playwright/test';
import {
  avslutaPass,
  bockknapp,
  fångaKonsolfel,
  hämtaÖvning,
  justeringsarket,
  loggaSetGenomAppen,
  läggTillÖvning,
  seedaPassRått,
  seedaRått,
  startaPass,
  talknapp,
} from './hjalpare';

/**
 * VAKT 4 över historiksidan. Uppgift 12.20, punkt 4.
 *
 * Påståendet: **passlistan visar det loggade passet men inte det importerade.**
 * Filtret sitter i `listWorkoutSummaries` (`src/db/history.ts:62`) och är
 * uppgift 13.3 — importerade pass är rader ur Adams gamla anteckningar med
 * uppskattade datum, inte pass han genomfört i appen.
 *
 * ⚠️ **EGEN FIL, INTE `ovningssida.spec.ts`.** 12.20:s "Klart när" namnger en
 * fil, men vakterna mäter tre skärmar. Beslutet i uppgiften är att varje vakt
 * bor i en fil som heter efter den skärm den mäter — annars ljuger filnamnet.
 */

test('4. passlistan visar det loggade passet men inte det importerade', async ({ page }) => {
  // Punkt 6 gäller hela flödet, inte bara övningssidan. Lyssnarna först av allt.
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // ⚠️ **DET VANLIGA PASSET SKAPAS GENOM APPEN — BESLUT 6 I 11B.0e:** *"Bara
  // det importerade setet seedas rått — det vanliga skapas genom appen, som en
  // riktig användare."*
  //
  // En tidigare version av det här testet seedade båda passen rått, och
  // `/code-review` underkände det 2026-08-13 med rätta: då kommer
  // `isImported: false` ur testets egen fixtur i stället för ur `startWorkout`.
  // Skulle appens skrivväg någon gång börja sätta fel flagga hade vakten stått
  // grön medan passlistan i verkligheten tappat alla pass. Vakten hade mätt sig
  // själv. Nu går det loggade passet hela vägen genom `repo.ts`.
  await startaPass(page);
  await läggTillÖvning(page, övning.name);
  const loggat = await loggaSetGenomAppen(page, övning.name);
  await avslutaPass(page);

  // Det importerade passet MÅSTE däremot seedas rått: `isImported: true` går
  // inte att sätta via UI:t. Det är precis undantaget beslut 6 pekar ut.
  await seedaPassRått(page, {
    id: 'vakt-4-importerat-pass',
    startedAt: '2024-07-02T17:00:00.000Z',
    endedAt: '2024-07-02T18:00:00.000Z',
    isImported: true,
  });
  await seedaRått(page, övning.id, {
    id: 'vakt-4-importerat-set',
    workoutId: 'vakt-4-importerat-pass',
    weightKg: 60,
    reps: 4,
    performedAt: '2024-07-02T17:30:00.000Z',
  });

  // Seeda först, navigera sedan. Se filhuvudet i `hjalpare.ts`.
  await page.goto('/historik');

  // VOLYMERNA ÄR TESTETS SKILJELINJE, och de är handräknade (`vikt × reps`) i
  // stället för hämtade ur `volumeKg` — ett test som räknar sitt facit med
  // samma kod det granskar kan aldrig säga emot den:
  //   10 × 8 = 80    (det app-loggade passet)
  //   60 × 4 = 240   (det importerade)
  const loggadVolym = loggat.vikt * loggat.reps;
  expect(loggadVolym, 'handräknad volym ska stämma med det som loggades').toBe(80);

  // ⚠️ **PASSLISTAN AVGRÄNSAS PÅ NAMN, INTE PÅ TEXTSÖKNING I HELA SIDAN.**
  // Sidan har två `ul` med `listitem` — passen och övningslistan längre ner.
  const passlistan = page.getByRole('list', { name: 'Pass' });

  // ANKRINGEN FÖRST, NEGATIONEN SEDAN — samma lärdom som vakt 3b.
  // `HistoryPage` har tre oberoende `useLiveQuery`, och passlistans startvärde
  // är `[]`. Hade `listWorkoutSummaries` hängt eller kastat hade sidan visat
  // tomma tillståndet, och en ensam negation gått grön utan att mäta ett dugg.
  await expect(passlistan.getByRole('listitem').filter({ hasText: `${loggadVolym} kg` })).toBeVisible();

  // ⚠️ **NEGATIONEN RÄKNAS, DEN SÖKS INTE.** En tidigare version letade efter
  // volymtexten och gick bet på att `hasText` matchar delsträngar: `180 kg`
  // innehåller `80 kg`, så ankaret träffade BÅDA raderna och föll på strict
  // mode i stället för på sitt påstående. Sabotageprövningen avslöjade det
  // 2026-08-13 — och att bara byta talen hade lämnat samma fälla åt nästa
  // person som rör siffrorna.
  //
  // Antalet rader är en identitet och inte en textmatchning: läcker det
  // importerade passet in blir det två, oavsett vilka volymer någon råkar
  // välja i framtiden.
  await expect(passlistan.getByRole('listitem')).toHaveCount(1);
  await expect(passlistan).not.toContainText('240 kg');

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});

/**
 * VAKT över nollregeln på passraden. Uppgift steg 4.3 del A.
 *
 * Påståendet: **ett pass utan arbetsset visar en fras, inte tre nollor.**
 * `DESIGN.md` §3.3 — *"aldrig en nolla: en nolla ser ut som ett resultat"*.
 *
 * ⛔ **TILLSTÅNDET ÄR VERKLIGT OCH BLIR VANLIGARE, INTE OVANLIGARE.** Starta
 * pass, värm upp, gå hem. Uppgift **10.4** — det första riktiga gympasset — är
 * precis det tillfälle då det händer på riktigt.
 *
 * 💡 **Filen är sviten andra vakt som växlar en rad till uppvärmning.** Den
 * första kom i 12.49, och skälet den skrevs var att `isWarmup` fram till dess
 * bara fanns som `false` i fixturen — hela uppvärmningsvägen var omätt
 * end-to-end, och en synlig bugg överlevde tre granskningar på det.
 */
test('ett pass utan arbetsset visar en fras i stället för nollor', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await startaPass(page);
  await läggTillÖvning(page, övning.name);

  // Raden görs om till uppvärmning INNAN den bockas av. Bocken måste sitta:
  // ett pass med en obockad rad har inga loggade set alls, och då hade raden
  // sagt sitt utan att uppvärmningen bevisat något.
  await talknapp(page, övning.name, 'vikt', 1).click();
  await justeringsarket(page, övning.name, 1).getByRole('button', { name: 'Uppvärmningsset' }).click();
  await justeringsarket(page, övning.name, 'uppvärmning')
    .getByRole('button', { name: 'Klar' })
    .click();
  await bockknapp(page, övning.name, 'uppvärmning').click();
  await avslutaPass(page);

  await page.goto('/historik');
  const raden = page.getByRole('list', { name: 'Pass' }).getByRole('listitem');

  // Ankringen först: passet ska finnas kvar i listan. Ett pass som försvunnit
  // hade också "inte visat nollor", och negationen nedan vore grön av fel skäl.
  await expect(raden).toHaveCount(1);
  await expect(raden).toContainText('Inga arbetsset');

  // ⚠️ **`0 set` OCH INTE `0`.** Talet noll dyker upp i tider (`0 min`) och är
  // legitimt där — det är hur länge passet höll på, ett mätvärde och inte ett
  // resultat. Det är de tre RESULTATtalen regeln handlar om.
  await expect(raden).not.toContainText('0 set');
  await expect(raden).not.toContainText('0 kg');
  await expect(raden).not.toContainText('0 övn');

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});
