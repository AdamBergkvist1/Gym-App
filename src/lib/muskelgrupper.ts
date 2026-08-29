/**
 * Passets muskelgruppsrad — `Bröst och triceps`. Uppgift steg 4.3 del A.
 *
 * Raden svarar på *vad för slags pass var det här* med ett ögonkast, vilket
 * övningsnamnen inte gjorde: de kapades mitt i ordet så fort passet hade fler än
 * tre övningar, och då är det de sista som försvinner. `DESIGN.md` §3.2 ritar
 * raden, Adam valde formen 2026-08-28.
 *
 * ⚠️ **FUNKTIONEN VET INGENTING OM DATABASEN, OCH DET ÄR AVSIKTLIGT.** Anroparen
 * slår upp muskelgruppen per övning och skickar in paren. Regeln kan därmed
 * prövas utan en Dexie-instans, och den kan användas av statistiksegmentet i 4.4
 * utan att först flyttas.
 *
 * ⛔ **ANROPAREN SKICKAR BARA ÖVNINGAR MED LOGGADE ARBETSSET.** Samma mängd som
 * `övn`-talet på raden under räknar. Skickas uppvärmningar in börjar raden namnge
 * grupper man inte tränade, och då är vi tillbaka i 12.48:s fel — tal och text ur
 * olika mängder bredvid varandra.
 */

/** En övning sedd från raden: vad den tränar, och hur tungt den vägde i passet. */
export interface ÖvningIPasset {
  /** `exercises.primaryMuscle`. Egna övningar har `'övrigt'` (`repo.ts`). */
  muscle: string;
  /** Antal loggade **arbetsset** i det här passet. */
  setCount: number;
}

/**
 * Hur många grupper som namnges innan resten blir *"och N till"*.
 *
 * ✅ **UPPMÄTT PÅ 375 px 2026-08-29, efter att `/code-review` påpekade att
 * mätningen aldrig gjorts.** Talet var valt, inte mätt, och hela invändningen mot
 * övningsnamnen var att de kapades mitt i ett ord — ett tak som ändå kapar löser
 * ingenting.
 *
 * | Längsta möjliga rad | scrollWidth | clientWidth |
 * |---|---|---|
 * | `Baksida lår, framsida lår och axlar` | 327 | 327 |
 * | `Baksida lår, framsida lår, triceps och 2 till` | 327 | 327 |
 *
 * Ingen av dem kapas. **Taket på tre håller**, och det gäller värsta fallet:
 * katalogens två längsta gruppnamn (`framsida lår`, `baksida lår`) plus det
 * tredje längsta, med svansen påhängd.
 *
 * ⚠️ **Mätningen kontrollerades själv** — en påtvingad orimligt lång sträng i
 * samma element gav 575 mot 327 och `kapas: true`. Utan den kontrollen hade
 * "ingenting kapas" lika gärna kunnat betyda att ingenting mättes.
 *
 * ⛔ **Blir gruppnamnen längre gäller mätningen inte längre.** Den bygger på
 * katalogens nuvarande ordlista; en ny grupp med ett långt namn kräver om.
 */
const NAMNGES_MEST = 3;

/**
 * Passets muskelgrupper som en läsbar rad, störst först — eller `null` när
 * passet inte har något arbete att beskriva.
 *
 * `null` och inte `''`: den tomma strängen ser ut som ett svar i en `if`-sats,
 * och raden ska då inte ritas alls. Samma skäl som §3.3:s *"aldrig en nolla: en
 * nolla ser ut som ett resultat"*.
 */
export function muskelrad(övningar: readonly ÖvningIPasset[]): string | null {
  const perGrupp = new Map<string, number>();
  for (const övning of övningar) {
    perGrupp.set(övning.muscle, (perGrupp.get(övning.muscle) ?? 0) + övning.setCount);
  }
  if (perGrupp.size === 0) return null;

  // ⚠️ **SUMMAN PER GRUPP AVGÖR ORDNINGEN, INTE DEN ENSKILDA ÖVNINGEN.** Två
  // bröstövningar med 3 + 2 set väger tyngre än en ryggövning med 4, och raden
  // ska säga vad passet MEST var. Sorterar man övningarna i stället för
  // grupperna hamnar rygg först, och raden ljuger utan att något går sönder.
  //
  // Lika stora grupper avgörs av vilken som kom först i passet: `Map` bevarar
  // insättningsordningen och `sort` är stabil sedan ES2019, så oavgjort faller
  // ut åt rätt håll utan en egen jämförelse. **Det är en regel, inte en
  // slump** — därför står den här och inte bara i testet.
  const ordnade = [...perGrupp.entries()].sort(([, a], [, b]) => b - a).map(([grupp]) => grupp);

  const namngivna = ordnade.slice(0, NAMNGES_MEST);
  const kvar = ordnade.length - namngivna.length;
  return versalisera(kvar > 0 ? `${namngivna.join(', ')} och ${kvar} till` : foga(namngivna));
}

/**
 * `a` · `a och b` · `a, b och c`. Sista skarven är ett *och*, resten kommatecken.
 *
 * ✏️ **SKRIVEN UTAN ICKE-NULL-FÖRSÄKRAN 2026-08-29 (12.51, fynd ur `/code-review`).**
 * Här stod `grupper[0]!` bredvid ett otypat `grupper.at(-1)` — två svar på samma
 * invariant i två rader. Det farliga var det senare: bryts invarianten skriver
 * `!` ett fel medan `at(-1)` tyst skriver **`undefined` i raden**, alltså ordet
 * på skärmen. Nu kan varken hända: funktionen är total.
 *
 * Den tomma listan är onåbar via `muskelrad`, som svarar `null` innan den kommer
 * hit. Den hanteras ändå, för det kostar en rad och tar bort en invariant som
 * annars bara finns i en kommentar.
 */
function foga(grupper: readonly string[]): string {
  const sista = grupper.at(-1);
  if (sista === undefined) return '';

  const utomSista = grupper.slice(0, -1);
  return utomSista.length === 0 ? sista : `${utomSista.join(', ')} och ${sista}`;
}

/**
 * Versal på radens första bokstav — inte på varje grupp.
 *
 * `baksida lår` är en grupp och inte två ord, och `Baksida Lår` hade sett ut som
 * ett egennamn. Katalogen skriver alla grupper gement (`catalog.ts`).
 */
function versalisera(rad: string): string {
  return rad.charAt(0).toUpperCase() + rad.slice(1);
}
