import { test, expect } from '@playwright/test';
import {
  fångaKonsolfel,
  hämtaÖvning,
  justeringsarket,
  läggTillÖvning,
  startaPass,
  talknapp,
} from './hjalpare';

/**
 * VAKT över uppvärmningsradens NAMN. Uppgift 12.49.
 *
 * ⛔ **DEN HÄR FILEN FINNS FÖR ATT SVITEN ALDRIG HADE EN UPPVÄRMNINGSRAD.**
 * `isWarmup` fanns bara som `false` i `hjalpare.ts`:s fixtur, och därför var hela
 * uppvärmningsvägen omätt end-to-end. Det är skälet att buggen nedan överlevde
 * tre granskningar, `/code-review` inräknad: **den kräver att en rad faktiskt är
 * uppvärmning för att synas alls.**
 *
 * **Buggen:** `ExerciseCard` skickade radens plats i LISTAN till justeringsarket,
 * medan raden själv numrerades bland ARBETSSETEN. Med en uppvärmning överst hette
 * knappen `… för set 1` medan arket den öppnade hette `Justera set 2` — om exakt
 * samma rad. Uppvärmningsraden själv hette `uppvärmningen` i raden och `set 1` i
 * arket.
 *
 * ⚠️ **Vakten mäter det ANVÄNDAREN ser, inte härledningen.** `radnamn` har egna
 * enhetstester i `worksets.test.ts`. Den här filen finns för att en delad funktion
 * inte garanterar att den anropas — samma gräns som `12.42`:s kontraktstest pekar
 * ut, och den gränsen var precis vad som brast här.
 */

test('arket säger samma sak som raden man öppnade det från', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await startaPass(page);
  await läggTillÖvning(page, övning.name);

  // Utan historik får övningen tomma rader, och den första är arbetsset 1.
  await talknapp(page, övning.name, 'vikt', 1).click();
  const arket = justeringsarket(page, övning.name, 1);
  await expect(arket).toBeVisible();

  // Raden görs om till uppvärmning MEDAN arket är öppet. Arkets rubrik ska följa
  // med direkt — den läser samma härledning som raden.
  await arket.getByRole('button', { name: 'Uppvärmningsset' }).click();

  // ⚠️ ARKET MÅSTE ADRESSERAS OM HÄR, och det är inte en omständlighet — det är
  // påståendet. `arket` ovan är bunden till namnet `Justera set 1`; slutar den
  // träffa har rubriken bevisligen bytt namn i samma ögonblick som raden gjorde
  // det. Skrevs testet utan omadresseringen föll det på en timeout i stället, med
  // ett felmeddelande som pekade på `Klar`-knappen.
  const somUppvärmning = justeringsarket(page, övning.name, 'uppvärmning');
  await expect(somUppvärmning).toBeVisible();
  await expect(arket).toHaveCount(0);
  await somUppvärmning.getByRole('button', { name: 'Klar' }).click();

  // 🔴 HÄR SATT BUGGEN. Rad ett är nu uppvärmning, alltså är rad TVÅ passets
  // första arbetsset — och dess knapp heter `… för set 1`.
  await expect(talknapp(page, övning.name, 'vikt', 1)).toBeVisible();

  // Arket som öppnas från den raden måste heta `set 1`. Före 12.49 hette det
  // `set 2`, eftersom kortet räknade radens plats i listan med uppvärmningen
  // inräknad.
  await talknapp(page, övning.name, 'vikt', 1).click();
  await expect(justeringsarket(page, övning.name, 1)).toBeVisible();
  await expect(justeringsarket(page, övning.name, 2)).toHaveCount(0);
  // Scopat till arket: `Klar` matchar annars radernas `Klarmarkera …` också.
  await justeringsarket(page, övning.name, 1).getByRole('button', { name: 'Klar' }).click();

  // Och uppvärmningsraden själv heter sitt namn i BÅDA lägena. Före 12.49 sa
  // raden `uppvärmningen` medan arket sa `set 1`.
  await talknapp(page, övning.name, 'vikt', 'uppvärmning').click();
  await expect(justeringsarket(page, övning.name, 'uppvärmning')).toBeVisible();

  expect(konsolfel, 'konsolen ska vara tyst').toEqual([]);
});
