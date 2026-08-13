import { test, expect } from '@playwright/test';
import { hämtaÖvning, seedaRått } from './hjalpare';

/**
 * PRÖVNING av såddmetoden i 11B.0e. Inte en vakt — den bevisar en teknik.
 *
 * FRÅGAN: går det att skriva rått i IndexedDB från Playwright och få sidan att
 * visa raden? Hela 12.20 hänger på svaret, eftersom ett importerat set inte går
 * att skapa genom att klicka i appen: `repo.ts:156` hårdkodar
 * `isImported: false` och `true` kan bara komma in via synken (`wire.ts:37`).
 *
 * RISKEN som mäts: sidorna läser genom `useLiveQuery`, som lyssnar på **Dexies**
 * ändringsspårning. En rå skrivning går förbi Dexie och kanske aldrig når sidan.
 *
 * Därför två test:
 *   1. Sådd → navigera. Det planen faktiskt behöver.
 *   2. Sådd medan sidan är öppen. Informationsvärde: säger om vi MÅSTE ladda om
 *      eller bara bör. Rött här är inget underkännande av metoden.
 */

test('1. sådd följt av navigering syns på sidan', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  const skrevs = await seedaRått(page, övning.id);
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  // Färsk navigering: sidan monteras om och useLiveQuery gör sin FÖRSTA läsning.
  // Ingen liveuppdatering behövs, vilket är hela poängen med metoden.
  await page.goto(`/ovning/${övning.id}`);

  await expect(page.getByRole('heading', { name: övning.name })).toBeVisible();

  // Påstår att notisen SYNS, aldrig vad den lyder — 12.22 skriver om meningen.
  await expect(page.getByRole('note', { name: 'Om datans ursprung' })).toBeVisible();
});

/**
 * MÄTT 2026-08-12: en rå IndexedDB-skrivning når **inte** en öppen sida.
 * `useLiveQuery` lyssnar på Dexies egen ändringsspårning, och den ser bara
 * skrivningar som gått genom Dexies API. Vår går förbi det.
 *
 * OMSKRIVET 2026-08-13 (uppgift 12.25). Testet använde tidigare `test.fail()`.
 * Det var fel verktyg, och `/code-review` hittade varför: `test.fail()` gäller
 * **hela testkroppen**, inte den rad man riktar den mot. Uppsättningen låg
 * därmed innanför det förväntat röda området, och gick uppsättningen sönder —
 * sidan renderade inte, övningen hittades inte — rapporterades testet ändå som
 * förväntat rött, alltså grönt i sviten. Mätningen kunde bli "grön" av skäl som
 * inte hade ett dugg med liveuppdatering att göra, vilket är det enda den
 * påstår sig mäta.
 *
 * LÖSNINGEN är att vända påståendet i stället för att flytta annoteringen.
 * Uteblivenhet är vad vi faktiskt mätte, så det är uteblivenhet vi påstår. Testet
 * är nu ett vanligt grönt test, och **båda** egenskaperna gäller:
 *
 *   - går uppsättningen sönder → rött, som vilket test som helst.
 *   - börjar liveuppdateringen plötsligt fungera — Dexie byter spårnings-
 *     mekanism, eller någon lägger till en BroadcastChannel → notisen dyker upp,
 *     `toHaveCount(0)` faller, och vi får veta att antagandet under 12.20 har
 *     ändrats. Exakt det larm `test.fail()` var tänkt att ge.
 *
 * FÖLJDEN FÖR 12.20: omladdning eller färsk navigering efter sådd är ett KRAV,
 * inte en försiktighetsåtgärd. Hoppar man över det står sidan tom och felet ser
 * ut som en trasig läsväg i stället för en utebliven uppdatering.
 */
test('2. sådd medan sidan är öppen når INTE fram — mätt, inte antaget', async ({ page }) => {
  await page.goto('/');
  const övning = await hämtaÖvning(page);

  await page.goto(`/ovning/${övning.id}`);
  await expect(page.getByRole('heading', { name: övning.name })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Om datans ursprung' })).toHaveCount(0);

  // Returvärdet MÅSTE assertas. Kastades det bort — vilket det gjorde fram till
  // 2026-08-13, funnet av `/code-review` — kunde den råa skrivningen misslyckas
  // tyst. Notisen hade då aldrig kunnat dyka upp, och testet gått grönt utan att
  // ha mätt liveuppdatering över huvud taget. Exakt samma klass av fel som 12.25.
  const skrevs = await seedaRått(page, övning.id);
  expect(skrevs, 'den råa IndexedDB-skrivningen ska lyckas').toBe(true);

  // Fast väntan, och den är motiverad: ett negativt påstående går inte att
  // bevisa med `expect`:s automatiska omförsök. `toHaveCount(0)` lyckas direkt
  // vid noll träffar och hade alltså gått grönt i samma ögonblick som sådden,
  // långt innan en eventuell liveuppdatering hunnit fram. Vi måste ge
  // uppdateringen tid att INTE komma innan frånvaron betyder något.
  await page.waitForTimeout(3_000);

  await expect(page.getByRole('note', { name: 'Om datans ursprung' })).toHaveCount(0);
});
