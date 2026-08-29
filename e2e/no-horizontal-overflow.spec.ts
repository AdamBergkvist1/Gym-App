import { test, expect } from '@playwright/test';

/**
 * Regressionsvakten för uppgift 11A.8 och 11A.12.
 *
 * Båda buggarna var samma fel: ett element blev bredare än skärmen och innehåll
 * hamnade utanför synfältet. Båda hittades av Adam, manuellt, på telefon — efter
 * att jag själv skrivit att raden var trång och shippat ändå. En känd risk som
 * inte mäts är inte hanterad. Detta är mätningen.
 *
 * Varför den kan lita på scrollWidth: `AppShell` sätter `overflow-x-hidden` som
 * skyddsnät, men det döljer bara symptomet på `<body>`. Vi mäter därför BÅDE
 * dokumentet och varje enskilt element, så att ett för brett kort fälls även när
 * skalet kapar det.
 */

const ROUTES = [
  { path: '/', name: 'Idag' },
  { path: '/historik', name: 'Historik' },
  // Statistiksegmentet är en egen vy på samma rutt, och den nås bara via
  // frågeparametern. Utan raden hade den aldrig mätts — vilket är exakt varför
  // valet ligger i URL:en (steg 4.3 del C).
  { path: '/historik?vy=statistik', name: 'Historik → Statistik' },
  { path: '/installningar', name: 'Inställningar' },
] as const;

for (const route of ROUTES) {
  test(`${route.name} scrollar inte i sidled`, async ({ page }) => {
    await page.goto(route.path);
    // Vänta in första renderingen från Dexie — useLiveQuery är asynkron, och
    // en mätning på ett tomt skal hade varit grön av fel skäl.
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    });

    expect(
      overflow.scrollWidth,
      `Dokumentet är ${overflow.scrollWidth} px brett på en ${overflow.clientWidth} px skärm`,
    ).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test(`${route.name} har inga element utanför skärmen`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const offenders = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const bad: { tag: string; cls: string; right: number; left: number }[] = [];

      for (const el of document.querySelectorAll('body *')) {
        const style = getComputedStyle(el);
        // Dolt innehåll kan inte klippas för användaren. Att fälla på det hade
        // gjort testet brusigt utan att fånga ett verkligt fel.
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        // Fast positionerade lager (bottenark, timer) ligger med flit utanför
        // flödet och mäts mot samma viewport ändå — de undantas inte.
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        // 1 px tolerans: subpixelavrundning i WebKit ger annars falska larm på
        // element som ligger exakt kant i kant.
        if (rect.right > viewportWidth + 1 || rect.left < -1) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute('class') ?? '').slice(0, 80),
            right: Math.round(rect.right),
            left: Math.round(rect.left),
          });
        }
      }
      return bad;
    });

    expect(
      offenders,
      `Element utanför skärmen:\n${offenders.map((o) => `  <${o.tag} class="${o.cls}"> left=${o.left} right=${o.right}`).join('\n')}`,
    ).toEqual([]);
  });
}
