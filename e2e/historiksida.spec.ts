import { test, expect } from '@playwright/test';
import { hämtaÖvning, seedaPassRått, seedaRått } from './hjalpare';

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
 *
 * ⚠️ **SEEDA FÖRST, NAVIGERA SEDAN.** Se filhuvudet i `hjalpare.ts`.
 */

test('4. passlistan visar det loggade passet men inte det importerade', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // Två pass, identiska så när som på `isImported`. Att de i övrigt liknar
  // varandra är poängen: skiljer utfallet dem åt kan det bara vara flaggan som
  // gjorde det.
  const loggatPassSkrevs = await seedaPassRått(page, {
    id: 'vakt-4-loggat-pass',
    startedAt: '2024-07-01T17:00:00.000Z',
    endedAt: '2024-07-01T18:00:00.000Z',
  });
  const importeratPassSkrevs = await seedaPassRått(page, {
    id: 'vakt-4-importerat-pass',
    startedAt: '2024-07-02T17:00:00.000Z',
    endedAt: '2024-07-02T18:00:00.000Z',
    isImported: true,
  });

  // VOLYMERNA ÄR VALDA FÖR ATT KUNNA SÄRSKILJAS I EN TEXTSÖKNING, och de är
  // handräknade (`vikt × reps`) i stället för hämtade ur `volumeKg`:
  //   100 × 5 = 500   (det loggade passet)
  //    60 × 3 = 180   (det importerade)
  // Tresiffriga med flit — fyrsiffriga tal får tusentalsavgränsare av
  // `formatVolume` (`sv-SE`), och då hade söksträngen behövt känna till
  // lokalens blanksteg för att träffa.
  const loggatSetSkrevs = await seedaRått(page, övning.id, {
    id: 'vakt-4-loggat-set',
    workoutId: 'vakt-4-loggat-pass',
    source: 'manual',
    weightKg: 100,
    reps: 5,
    performedAt: '2024-07-01T17:30:00.000Z',
  });
  const importeratSetSkrevs = await seedaRått(page, övning.id, {
    id: 'vakt-4-importerat-set',
    workoutId: 'vakt-4-importerat-pass',
    weightKg: 60,
    reps: 3,
    performedAt: '2024-07-02T17:30:00.000Z',
  });

  expect(
    loggatPassSkrevs && importeratPassSkrevs && loggatSetSkrevs && importeratSetSkrevs,
    'alla fyra råa skrivningarna ska lyckas'
  ).toBe(true);

  await page.goto('/historik');

  // ⚠️ ANKRINGEN FÖRST, NEGATIONEN SEDAN — samma lärdom som vakt 3b i
  // `ovningssida.spec.ts`. `HistoryPage` har TRE oberoende `useLiveQuery`, och
  // passlistans startvärde är `[]`. Hade `listWorkoutSummaries` hängt eller
  // kastat hade sidan visat tomma tillståndet, och en ensam negation ("det
  // importerade passet syns inte") hade gått grön utan att mäta ett dugg.
  //
  // Därför bevisas det loggade passet FÖRST. Syns dess volym har frågan
  // bevisligen löst ut och levererat rader, och först då betyder frånvaron av
  // det andra passet något.
  await expect(page.getByRole('listitem').filter({ hasText: '500' })).toBeVisible();

  await expect(page.getByRole('listitem').filter({ hasText: '180' })).toHaveCount(0);
});
