import { volumeKg } from './oneRepMax';

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

/**
 * Ett set i planen, sett från den som räknar. Bara de två fälten som avgör om
 * raden är ett gjort arbete — resten av `PlannedSet` angår inte regeln, och en
 * smalare typ gör funktionen anropbar från vilken vy av planen som helst.
 */
interface PlanradSomKanRäknas {
  isWarmup: boolean;
  loggedSetId: string | null;
}

/**
 * En **loggad** rad, sedd från den som frågar om den är gjort arbete.
 *
 * Strukturell typ och ingen import från `src/db` — `src/lib` känner inte till
 * databasen, precis som `PlanradSomKanRäknas` ovan inte känner till planen.
 */
interface LoggadRadSomKanRäknas {
  isWarmup: boolean;
  isDeleted: boolean;
}

/**
 * Räknas den här loggade raden som arbete?
 *
 * ⛔ **REGELN HADE FEM STAVNINGAR I `history.ts` OCH INGEN HEMVIST. Uppgift 12.51.**
 * `!s.isDeleted && !s.isWarmup` stod ordagrant på tre ställen, som delmängd på ett
 * fjärde och komponerad med importfiltret på ett femte. `/code-review` pekade på
 * det när en sjätte kopia hann skrivas i steg 4.3 — och namngav orsaken:
 * `loggadeArbetsset` nedan går inte att anropa från frågelagret.
 *
 * ⚠️ **DE TVÅ FUNKTIONERNA ÄR INTE SAMMA REGEL, OCH SKA INTE SLÅS IHOP.** De
 * svarar på samma fråga för två olika former, och formerna bär olika bevis för
 * att arbetet blev gjort:
 *
 * | Form | Bevis för "gjort" | Bevis för "finns" |
 * |---|---|---|
 * | Planrad (skärmen) | `loggedSetId !== null` — raden är avbockad | — raden finns i planen |
 * | Loggad rad (databasen) | — den ÄR loggad, annars fanns den inte | `!isDeleted` |
 *
 * En planrad kan finnas utan att vara gjord; en loggad rad kan vara gjord men
 * borttagen. **Att tvinga ihop dem hade krävt en typ som ljuger om ena hållet.**
 * Det är därför de ligger bredvid varandra med varsitt namn i stället.
 */
export function räknasSomArbete(rad: LoggadRadSomKanRäknas): boolean {
  return !rad.isDeleted && !rad.isWarmup;
}

/**
 * Planens rader som faktiskt är **gjort arbete**: avbockade, och inte uppvärmning.
 *
 * ⛔ **DEN HÄR FUNKTIONEN FINNS FÖR ATT REGELN GLÖMDES TRE GÅNGER.** Uppgift
 * 12.48. Frågelagret har alltid vetat att uppvärmning inte räknas — `history.ts`
 * skriver till och med ut skälet: *"De är förberedelse, inte arbete, och att
 * blanda in dem gör siffran obrukbar för jämförelser mellan pass."* Men den som
 * räknar i en SKÄRM måste minnas det själv, och tre av tre glömde: startskärmens
 * volym (12.16), övningskortets metarad och passets sammanfattningsruta (båda
 * 12.44). Symtomet var varje gång **två tal ur olika mängder bredvid varandra** —
 * `3 SET · 0 VOLYM KG`.
 *
 * 💡 **Det var aldrig slarv, det var en saknad söm.** Ett `sets.filter(s =>
 * s.loggedSetId !== null)` i en komponent har ingen aning om att `isWarmup` bär
 * en regel; typen tillåter det lika gärna. Regeln bor här nu, och skärmarna
 * anropar den i stället för att skriva om den.
 */
export function loggadeArbetsset<T extends PlanradSomKanRäknas>(sets: readonly T[]): T[] {
  return sets.filter((s) => !s.isWarmup && s.loggedSetId !== null);
}


/**
 * Volymen av planens loggade arbetsset — appens mått på hur tungt något var.
 *
 * ⚠️ **Summerar via `volumeKg` och inte med en egen multiplikation**, så att
 * skärmen och frågelagret avrundar likadant. `history.ts` och `repo.ts` går
 * redan den vägen; övningskortet gjorde det inte, och två räknesätt för samma
 * tal är samma sorts glapp som 12.18 fick lösa en gång.
 */
export function volymAv(
  sets: readonly (PlanradSomKanRäknas & { weightKg: number; reps: number })[]
): number {
  return loggadeArbetsset(sets).reduce((n, s) => n + volumeKg(s.weightKg, s.reps), 0);
}

/**
 * Vad raden HETER i etiketterna — `uppvärmningen`, eller `set N` räknat från ett.
 *
 * ⛔ **FRASEN BYGGDES PÅ TVÅ STÄLLEN OCH DE RÄKNADE OLIKA. Uppgift 12.49.**
 * `SetRow` byggde den ur `workSetIndex`, alltså platsen bland arbetsseten.
 * `ExerciseCard` byggde arkets variant ur `findIndex(...) + 1`, alltså platsen i
 * LISTAN. Med planen `[uppvärmning, arbetsset, arbetsset]` sa raden *"set 2"* och
 * arket som öppnades från den *"set 3"* — om exakt samma rad. Uppvärmningsraden
 * sa *"uppvärmningen"* i raden och *"set 1"* i arket.
 *
 * 💡 **Det är tredje gången samma familj:** 12.42 (arbetssetnumret räknades på två
 * ställen), 12.48 (uppvärmningsfiltret skrevs om av varje skärm), och nu frasen
 * som numret sitter i. Varje gång ägde `src/lib` regeln medan skärmlagret hade en
 * egen kopia.
 *
 * **Översättningen från nollbaserat till människors räkning bor här.** `+ 1` låg
 * tidigare på två ställen, och det är precis en sådan rad som ser för enkel ut
 * för att kunna vara fel.
 *
 * ⚠️ **`e2e/hjalpare.ts` har en egen `radnamn` med samma innehåll, och de ska
 * INTE delas.** Sviten stavar sina påståenden självständigt — importerade den
 * frasen härifrån hade den mätt sin egen import och en ändrad etikett gått grön.
 * Se regeln i `hjalpare.ts`: *fixturer binds till appen, påståenden stavas
 * självständigt.*
 */
export function radnamn(workSetIndex: number | null): string {
  return workSetIndex === null ? 'uppvärmningen' : `set ${workSetIndex + 1}`;
}
