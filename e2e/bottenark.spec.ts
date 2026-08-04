import { test, expect } from '@playwright/test';

/**
 * Vakt för justeringsarket. Skriven 2026-08-04 efter en bugg som fanns i
 * produktion utan att någon sett den.
 *
 * VAD SOM HÄNDE
 * Arket var **793 px högt på en 667 px skärm** (iPhone SE). Eftersom det ligger
 * `justify-end` trycktes toppen 126 px ovanför skärmkanten — och där låg
 * headern med övningsnamnet och det sammansatta värdet. Man kunde alltså ändra
 * vikt med fyra sifferhjul som visade `0 0 0 0`, utan att någonstans se att
 * resultatet blev 62,5.
 *
 * VARFÖR DEN BEFINTLIGA VAKTEN MISSADE DET
 * `no-horizontal-overflow.spec.ts` mäter **horisontell** överflödning, på tre
 * rutter, utan att öppna något bottenark. Buggen var vertikal och låg i ett
 * tillstånd som bara nås efter fyra klick. Vakten var inte fel — den mätte bara
 * en annan sak, precis som timerdiagnostiken i fas 6.
 *
 * Lärdomen är återkommande nog att skrivas ut: **en grön vakt bevisar bara det
 * den mäter.**
 */

async function öppnaArket(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Starta pass/i }).click();
  await page.getByRole('button', { name: /Lägg till övning/i }).click();
  await page.getByRole('button', { name: /press|drag|böj|lyft/i }).first().click();

  // Första värdeknappen i första setraden öppnar arket.
  await page.locator('li button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('justeringsarket får plats på skärmen', async ({ page }) => {
  await öppnaArket(page);

  const mått = await page.evaluate(() => {
    const ark = document.querySelector('[role="dialog"] > div:last-child');
    if (!ark) return null;
    const r = ark.getBoundingClientRect();
    return { höjd: Math.round(r.height), topp: Math.round(r.top), viewport: window.innerHeight };
  });

  expect(mått).not.toBeNull();
  expect(
    mått!.topp,
    `Arket är ${mått!.höjd} px högt på en ${mått!.viewport} px skärm och börjar ${mått!.topp} px från toppen. Är det negativt ligger innehåll utanför skärmen.`
  ).toBeGreaterThanOrEqual(0);
});

test('justeringsarket behöver inte scrollas', async ({ page }) => {
  await öppnaArket(page);

  /**
   * Det här testet finns för att det förra inte räckte.
   *
   * `max-h-[92dvh]` med `overflow-y-auto` gör att arket ALDRIG hamnar utanför
   * skärmen — även när innehållet är för stort. Testet ovan blev därför grönt
   * också med det gamla femradiga hjulet. Det mätte skyddsnätet, inte problemet.
   *
   * Skyddsnätet ska aldrig behöva träda in: ett bottenark som måste scrollas
   * innehåller dessutom scroll-snap-hjul, och två scrollytor inuti varandra är
   * en usel upplevelse på touch. Här mäts att innehållet faktiskt får plats.
   */
  const scroll = await page.evaluate(() => {
    const ark = document.querySelector('[role="dialog"] > div:last-child');
    if (!ark) return null;
    return { innehåll: ark.scrollHeight, synligt: ark.clientHeight };
  });

  expect(scroll).not.toBeNull();
  expect(
    scroll!.innehåll,
    `Arkets innehåll är ${scroll!.innehåll} px men bara ${scroll!.synligt} px syns — det måste scrollas, och skyddsnätet är inte designen.`
  ).toBeLessThanOrEqual(scroll!.synligt + 1);
});

test('övningsnamn och sammansatt värde syns i arket', async ({ page }) => {
  await öppnaArket(page);

  // Det här är felet som faktiskt drabbade användaren: värdet fanns i DOM:en
  // men låg utanför skärmen. `toBeInViewport` och inte `toBeVisible` — det
  // senare hade varit grönt hela tiden.
  const header = page.getByRole('dialog').locator('header');
  await expect(header).toBeInViewport();

  // Den sammansatta siffran måste stå någonstans. Fyra hjul som visar
  // 0 0 0 0 säger ingenting om vad vikten faktiskt blev.
  await expect(header).toContainText(/kg ×/);
});

test('arket kan stängas', async ({ page }) => {
  await öppnaArket(page);
  await page.getByRole('button', { name: /^Klar$/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
