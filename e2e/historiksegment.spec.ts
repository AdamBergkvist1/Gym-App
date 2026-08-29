import { test, expect, type Page } from '@playwright/test';
import { fångaKonsolfel } from './hjalpare';

/**
 * VAKT över segmentkontrollen på Historik. Uppgift steg 4.3 del C.
 *
 * Tre påståenden, och de mäter tre olika saker:
 *   1. segmentet **växlar vyn**
 *   2. valet är **adresserbart** — en URL landar direkt i rätt vy
 *   3. kontrollen går att använda med **tangentbord**
 *
 * ⚠️ **Punkt 3 finns för att den är hela skälet att kontrollen byggdes av
 * riktiga `<input type="radio">`.** §7.1:s slutsats var att plattformsprimitiven
 * slår biblioteken just för att den ger piltangenter och skärmläsarsemantik
 * gratis. Byter någon ut inputarna mot `<button>`-element går allt annat i den
 * här filen fortfarande igenom — och då är det den vakten som säger till.
 *
 * ⛔ **Ingen fixtur, ingen sådd.** Kontrollen ska finnas även på en tom
 * historik: utan den vore Statistiksegmentet omöjligt att nå på en ny
 * installation. Att testet klarar sig utan seedad data ÄR ett påstående.
 */

const STATISTIKENS_TEXT = /Statistik byggs härnäst/;

/**
 * Trycker där ett finger trycker: på etiketten.
 *
 * ⚠️ **`.check()` på radioknappen går INTE, och skälet är värt att skriva ner.**
 * Rutan är `sr-only` — en 1×1-pixel i etikettens övre vänstra hörn — så
 * Playwright rapporterar att etiketten *"intercepts pointer events"* och ger
 * upp. **Det är inget fel i appen:** ett klick på en `<label>` aktiverar dess
 * kontroll, vilket är hela poängen med konstruktionen.
 *
 * `{ force: true }` hade också gjort testet grönt — och samtidigt slutat mäta
 * att kontrollen går att trycka på. Den här vägen mäter tryckytan på riktigt.
 *
 * ⚠️ **ANKRAD I KONTROLLEN, för ordet `Pass` finns TVÅ gånger på skärmen:** här
 * och som flik i bottennavigeringen. Oankrad föll lokatorn på *strict mode
 * violation* — vilket är det bästa som kunde hända, eftersom alternativet hade
 * varit ett `.first()` som tyst kunde börja trycka på fliken i stället.
 *
 * Dubbleringen är inget fel: `DESIGN.md` §3.2 ritar segmentet med just de
 * orden, och rollerna skiljer dem åt (`radio` mot `link`).
 */
const segmentet = (page: Page) => page.getByRole('group', { name: 'Vy' });

const tryck = (page: Page, etikett: string) =>
  segmentet(page).getByText(etikett, { exact: true }).click();

test('segmentet växlar mellan passlistan och statistiken', async ({ page }) => {
  const konsolfel = fångaKonsolfel(page);

  await page.goto('/historik');
  await page.waitForLoadState('networkidle');

  // Ankringen först: passvyn ska vara förvalet. Utan den kunde negationen nedan
  // vara grön för att sidan aldrig renderades.
  await expect(page.getByRole('radio', { name: 'Pass' })).toBeChecked();
  await expect(page.getByText(STATISTIKENS_TEXT)).toHaveCount(0);

  await tryck(page, 'Statistik');

  await expect(page.getByText(STATISTIKENS_TEXT)).toBeVisible();
  // Passlistan ska vara BORTA, inte bara överlagrad.
  await expect(page.getByRole('list', { name: 'Pass' })).toHaveCount(0);

  expect(konsolfel, 'konsolen ska vara tyst under hela flödet').toEqual([]);
});

test('valet ligger i URL:en och överlever en omladdning', async ({ page }) => {
  // ⛔ DET HÄR ÄR INTE BEKVÄMLIGHET, DET ÄR VAD SOM GÖR VYN MÄTBAR. Ligger
  // valet i `useState` kan ingen vakt nå statistikvyn utan att först klicka sig
  // dit, och kontrastvakten (12.36) kan inte lägga till den som ett läge alls.
  await page.goto('/historik?vy=statistik');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('radio', { name: 'Statistik' })).toBeChecked();
  await expect(page.getByText(STATISTIKENS_TEXT)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Statistik' })).toBeChecked();

  // Och tillbaka: växlingen ska skriva URL:en, inte bara komponentens tillstånd.
  await tryck(page, 'Pass');
  await expect(page).toHaveURL(/\/historik$/);
});

test('kontrollen går att styra med piltangenter', async ({ page }) => {
  await page.goto('/historik');
  await page.waitForLoadState('networkidle');

  // Fokusera det valda segmentet direkt. Att tabba dit hade mätt tabbordningen
  // på hela sidan, vilket är ett annat påstående än det här.
  await page.getByRole('radio', { name: 'Pass' }).focus();
  await page.keyboard.press('ArrowRight');

  // Radiogruppens egen semantik: pil åt höger flyttar OCH väljer. Ingen rad
  // JavaScript i `SegmentedControl` gör det här — webbläsaren gör det, och det
  // är precis det §7.1-beslutet köpte.
  await expect(page.getByRole('radio', { name: 'Statistik' })).toBeChecked();
  await expect(page.getByText(STATISTIKENS_TEXT)).toBeVisible();
});
