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
 * ⏰ **TALET ÄR VALT, INTE UPPMÄTT.** Hela invändningen mot övningsnamnen var att
 * de kapades mitt i ett ord, och ett tak som ändå kapar löser ingenting. Mät
 * raden på 375 px när skärmen är byggd — kapas den, är taket två. Se steg 4.3.
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

/** `a` · `a och b` · `a, b och c`. Sista skarven är ett *och*, resten kommatecken. */
function foga(grupper: readonly string[]): string {
  if (grupper.length === 1) return grupper[0]!;
  return `${grupper.slice(0, -1).join(', ')} och ${grupper.at(-1)}`;
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
