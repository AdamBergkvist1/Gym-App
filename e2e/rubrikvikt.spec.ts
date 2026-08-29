import { test, expect } from '@playwright/test';

/**
 * **SIDRUBRIKENS VIKT ÄR STRUKTURELL. Uppgift 12.50.**
 *
 * `index.css` sätter typsnitt och storlek på **elementet** `h1`, och skriver ut
 * skälet: *"en klass man måste komma ihåg att sätta blir bortglömd, och då blir
 * en sida plötsligt satt i fel typsnitt utan att något går sönder."* Vikten 600
 * — som `DESIGN.md` §2:s skala anger för `--text-title` — satt fram till nu i en
 * `font-semibold`-klass på varje `h1` för sig.
 *
 * **Två av tre egenskaper var strukturella, den tredje var en vana.** En ny sida
 * med `<h1>Statistik</h1>` fick rätt typsnitt och rätt storlek men fel vikt, och
 * ingenting gick sönder. Det är samma felklass som klassen på typsnittet hade
 * haft, och samma svar: regeln flyttas till elementet.
 *
 * ⚠️ **Testet mäter en INJICERAD `h1` utan klasser och inte appens egna.** Appens
 * rubriker skulle klara kravet även med vikten kvar i en klass — det är just det
 * som gör dem oanvändbara som bevis här. Frågan gäller sidan som skrivs i morgon.
 * Appens egna rubriker mäts ändå i andra halvan, som en vakt mot att någon sätter
 * en klass som skriver över regeln.
 */
test('en h1 utan klasser bär briefens vikt', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const vikter = await page.evaluate(() => {
    const prov = document.createElement('h1');
    prov.className = '';
    prov.textContent = 'Prov';
    document.body.append(prov);

    return {
      // Läses ur den renderade DOM:en och inte ur stilmallen: det är webbläsarens
      // svar som avgör, och en regel som skrivs över av något annat syns bara här.
      prov: getComputedStyle(prov).fontWeight,
      appens: [...document.querySelectorAll('h1')]
        .filter((el) => el !== prov)
        .map((el) => `${(el.textContent ?? '').trim().slice(0, 20)}: ${getComputedStyle(el).fontWeight}`),
    };
  });

  expect(
    vikter.prov,
    'En `h1` utan klasser renderade inte i vikt 600. Då bor vikten fortfarande i ' +
      'en klass någon måste komma ihåg, och nästa sida får rätt typsnitt och fel ' +
      'vikt utan att något går sönder.'
  ).toBe('600');

  // Andra halvan: regeln får inte skrivas över av en klass på en riktig sida.
  // Grön både före och efter 12.50 — den vaktar framtiden, inte ändringen.
  expect(vikter.appens.filter((rad) => !rad.endsWith(': 600'))).toEqual([]);
});

/**
 * Städningen av `font-semibold`-klasserna gick i egen commit efter regeln ovan,
 * och det här är dess vakt: sidorna bär inte längre någon vikt av sig själva, så
 * de mäter nu om elementregeln verkligen når fram — inte bara om någon kom ihåg
 * klassen.
 *
 * `/ovning/:id` saknas med flit: rutten kräver ett id ur databasen, och rubriken
 * där är samma `h1` som de andra. Kostnaden att så ett pass för att mäta en regel
 * som redan är mätt på tre rutter bär inte sitt eget underhåll.
 */
for (const rutt of ['/', '/historik', '/installningar']) {
  test(`sidrubriken på ${rutt} bär vikt 600 utan egen klass`, async ({ page }) => {
    await page.goto(rutt);
    await page.waitForLoadState('networkidle');

    const rubriker = await page.evaluate(() =>
      [...document.querySelectorAll('h1')].map((el) => ({
        text: (el.textContent ?? '').trim().slice(0, 20),
        vikt: getComputedStyle(el).fontWeight,
        klasser: el.className,
      }))
    );

    // Utan den här raden vore en sida utan h1 en grön mätning av ingenting.
    expect(rubriker.length, `${rutt} renderade ingen h1 att mäta`).toBeGreaterThan(0);
    expect(rubriker.filter((r) => r.vikt !== '600')).toEqual([]);
    expect(
      rubriker.filter((r) => /font-(thin|light|normal|medium|semibold|bold|black)/.test(r.klasser)),
      'En viktklass har kommit tillbaka på en sidrubrik. Vikten bor i `index.css` ' +
        'sedan 12.50, och två sanningar om samma egenskap är hur den första gången ' +
        'gled isär.'
    ).toEqual([]);
  });
}
