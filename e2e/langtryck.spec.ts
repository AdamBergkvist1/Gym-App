import { test, expect } from '@playwright/test';
import {
  avslutaPass,
  fångaKonsolfel,
  hämtaÖvning,
  loggaSetGenomAppen,
  läggTillÖvning,
  setlista,
  startaPass,
} from './hjalpare';

/**
 * VAKT över långtrycket som förklarar snittalen. Uppgift steg 4.2 del E.
 *
 * **Varför gesten mäts här och inte som enhetstest.** Långtryck är en sekvens
 * av riktiga pointer-events med tid emellan, och tre av dess fyra fällor finns
 * bara i en verklig webbläsare: iOS callout-meny, `contextmenu` på långtryck,
 * och klicket som kommer ändå när fingret lyfts. Ett jsdom-test hade mätt vår
 * egen timer och ingenting av det som faktiskt går sönder.
 *
 * ⚠️ **Den tredje fällan är den som kostar mest om den missas:** webbläsaren
 * skickar ett `click` efter långtrycket också. Utan spärren i `useLongPress`
 * öppnas justeringsarket ovanpå infobrickan, och användaren ser aldrig
 * förklaringen — bara ett ark hen inte bad om.
 */

/** Håller ner fingret på ett element tillräckligt länge för att gesten ska lösa ut. */
async function långtryck(locator: ReturnType<typeof setlista>, ms = 700) {
  const ruta = await locator.boundingBox();
  if (!ruta) throw new Error('elementet har ingen yta att trycka på');
  const x = ruta.x + ruta.width / 2;
  const y = ruta.y + ruta.height / 2;
  const page = locator.page();
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Fingret ligger still. Rör det sig mer än tröskeln avbryts gesten med flit.
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test('långtryck på ett snittal förklarar vad talet är', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  // Ett avslutat pass ger övningen ett snitt att förklara. Utan underlag finns
  // ingen bricka, och testet hade mätt frånvaron av en gest i stället för gesten.
  await startaPass(page);
  await läggTillÖvning(page, övning.name);
  await loggaSetGenomAppen(page, övning.name);
  await avslutaPass(page);

  await startaPass(page);
  await läggTillÖvning(page, övning.name);

  const kgKnappen = setlista(page, övning.name).getByRole('button', {
    name: /^Vikt .*för set 1/,
  });

  // ANKRING: knappen bär snittet innan vi rör den. Löser gesten inte ut vet vi
  // att det är gesten som fallerat och inte underlaget.
  await expect(kgKnappen).toHaveAccessibleName(/brukar vara/);
  await expect(page.getByRole('tooltip')).toBeHidden();

  await långtryck(kgKnappen);

  const bricka = page.getByRole('tooltip');
  await expect(bricka).toBeVisible();
  await expect(bricka).toContainText(/Snitt av|Bygger på/);

  // ⚠️ HELA POÄNGEN MED SPÄRREN: klicket som följer på att fingret lyfts får
  // inte öppna justeringsarket. Gör det ändå ser användaren aldrig brickan.
  await expect(page.getByRole('dialog')).toBeHidden();

  expect(konsolfel, 'konsolen ska vara tyst under gesten').toEqual([]);
});

test('ett kort tryck öppnar justeringsarket som förut', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await startaPass(page);
  await läggTillÖvning(page, övning.name);

  // ⚠️ REGRESSIONEN DEN HÄR VAKTEN FINNS FÖR. Långtrycket lades på samma knapp
  // som redan öppnade arket, och hela gesthanteringen ersatte knappens `onClick`.
  // Går spärren i `useLongPress` sönder åt andra hållet slutar det korta
  // trycket fungera — alltså appens vanligaste väg att ändra en vikt.
  await setlista(page, övning.name)
    .getByRole('button', { name: /^Vikt .*för set 1/ })
    .click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('tooltip')).toBeHidden();

  expect(konsolfel, 'konsolen ska vara tyst').toEqual([]);
});
