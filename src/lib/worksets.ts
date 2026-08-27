/**
 * Arbetssetets nummer — EN regel, ett ställe. Uppgift steg 4.2 del A.
 *
 * ⚠️ **FILEN FICK EN RÄKNARE 2026-08-27, OCH DET ÄR SJÄLVA POÄNGEN MED DEN.**
 * Fram till dess exporterade den bara `workSetIndices`, som mappar en array
 * inom **ett** pass. `getSetAverages` behöver samma regel över en **ström av
 * set ur flera pass**, och kunde därför inte anropa den — så den räknade själv,
 * med en egen `Map<string, number>`. Två implementationer av samma regel, vilket
 * är precis vad del A förbjöd: *"en delad härledning som båda sidor anropar,
 * inte två räkningar som ska råka stämma. Kopplingen ska vara kod, inte prosa i
 * en doc-kommentar."* `/code-review` hittade det (uppgift 12.42).
 *
 * **Lösningen var att hitta den mindre primitiven.** Arraysignaturen var inte
 * regeln — den var ett *specialfall* av regeln, med ett enda pass. Räknaren
 * nedan är regeln, och `workSetIndices` är numera byggd på den.
 */

/**
 * En löpande numrering av arbetsset, en följd per pass.
 *
 * Anropas en gång per set i den ordning seten ska numreras och svarar med
 * setets plats bland passets arbetsset, eller `null` för uppvärmning.
 * Uppvärmningar förbrukar inget nummer — det är hela regeln.
 *
 * ⚠️ **RÄKNAREN ÄR TILLSTÅNDSBÄRANDE, och det är avsiktligt.** En ren funktion
 * hade krävt att anroparen först materialiserar alla set per pass, vilket är
 * exakt det `getSetAverages` inte får göra: dess snabbhet bygger på att gå
 * baklänges genom indexet och sluta tidigt (se kommentaren där). **Skapa en ny
 * räknare per genomgång.** Återanvänds en över två genomgångar fortsätter den
 * räkna där den slutade.
 *
 * ⚠️ **Anroparen bestämmer vad som är ett arbetsset — räknaren gör det inte.**
 * `getSetAverages` filtrerar bort raderade och importerade set *innan* den
 * räknar, så de lämnar inga hål. Skulle den ordningen kastas om ändras
 * numreringen tyst. Det är därför filtret och räknandet ligger i samma loop
 * där, och inte i två steg.
 */
export function skapaArbetssetRäknare(): (pass: string, isWarmup: boolean) => number | null {
  const räknatPerPass = new Map<string, number>();
  return (pass, isWarmup) => {
    if (isWarmup) return null;
    const nummer = räknatPerPass.get(pass) ?? 0;
    räknatPerPass.set(pass, nummer + 1);
    return nummer;
  };
}

/**
 * Nyckeln `workSetIndices` räknar under. Värdet spelar ingen roll — det finns
 * bara ett pass i en setlista — men en namngiven konstant säger det, medan en
 * naken sträng i anropet hade sett ut som en bugg.
 */
const ETT_ENDA_PASS = 'setlistan';

/**
 * Ger varje set dess plats bland arbetsseten, eller `null` för uppvärmning.
 *
 * Formen skärmen behöver: en setlista in, ett nummer per rad ut.
 * `ExerciseCard` slår upp snittet med numret, så en rad efter en uppvärmning
 * hämtar arbetsset 0 och inte arbetsset 1.
 */
export function workSetIndices(sets: readonly { isWarmup: boolean }[]): (number | null)[] {
  const nästaNummer = skapaArbetssetRäknare();
  return sets.map((s) => nästaNummer(ETT_ENDA_PASS, s.isWarmup));
}
