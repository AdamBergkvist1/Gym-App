import { describe, expect, it } from 'vitest';
import { loggadeArbetsset, radnamn, volymAv, workSetIndices } from './worksets';

describe('steg 4.2 arbetssetets nummer', () => {
  it('numrerar arbetsseten 0, 1, 2 i den ordning de står', () => {
    expect(workSetIndices([{ isWarmup: false }, { isWarmup: false }, { isWarmup: false }])).toEqual([
      0, 1, 2,
    ]);
  });

  it('ger uppvärmningen inget nummer, och låter den inte stjäla ett heller', () => {
    // ⚠️ DET HÄR ÄR HELA SKÄLET ATT FUNKTIONEN FINNS. Raden efter uppvärmningen
    // är passets FÖRSTA arbetsset och ska slå upp snittet för arbetsset 0 —
    // inte för arbetsset 1. Räknas radens plats i listan i stället hamnar set
    // 2:s snitt på set 1:s rad så fort en uppvärmningsrad ligger överst, och
    // det faller tyst: inget kastar, inget ser fel ut, talet är bara osant.
    // Samma buggklass som `e02abf1` fixade inuti `getSetAverages`, flyttad över
    // komponentgränsen.
    expect(workSetIndices([{ isWarmup: true }, { isWarmup: false }, { isWarmup: false }])).toEqual([
      null,
      0,
      1,
    ]);
  });

  it('låter numreringen fortsätta obruten över en uppvärmning mitt i listan', () => {
    // Inte ett påhittat fall: `SetAdjustSheet` togglar `isWarmup` per set, så
    // vilken rad som helst kan bli uppvärmning i efterhand. Att räkna vidare —
    // inte börja om, inte lämna ett hål — är samma sak som `getSetAverages`
    // gör med databasens rader, där uppvärmningen filtreras bort FÖRE
    // numreringen. Skulle de två räkna olika vore delningen meningslös.
    expect(workSetIndices([{ isWarmup: false }, { isWarmup: true }, { isWarmup: false }])).toEqual([
      0,
      null,
      1,
    ]);
  });

  it('ger tom lista för tom lista i stället för att kasta', () => {
    // Ett övningskort utan set finns på riktigt: `addExerciseToPlan` kan lägga
    // till en övning som inte fått några rader än, och kortet renderas ändå.
    //
    // ⚠️ DEN HÄR RADEN KAN INTE BLI RÖD AV SIG SJÄLV. `[].map()` ger tom lista
    // oavsett vad återanropet gör, så den vaktar ingenting — den dokumenterar
    // en kontraktsgräns anroparen lutar sig mot. Står det inte utskrivet läser
    // nästa person den som en vakt och tror att fallet är skyddat.
    expect(workSetIndices([])).toEqual([]);
  });
});

describe('12.48 loggade arbetsset ur en plan', () => {
  /**
   * Formen `ExerciseCard` och `TodayPage` faktiskt har: planens rader, där
   * `loggedSetId` är satt först när raden bockats av.
   */
  const rad = (isWarmup: boolean, loggad: boolean, weightKg = 100, reps = 5) => ({
    isWarmup,
    loggedSetId: loggad ? 'set-1' : null,
    weightKg,
    reps,
  });

  it('räknar inte ett avbockat uppvärmningsset som ett arbetsset', () => {
    // ⚠️ DET HÄR ÄR BUGGEN, TRE GÅNGER OM: 12.16, och två i 12.44. Ett avbockat
    // uppvärmningsset ser ut precis som ett arbetsset för den som bara tittar på
    // `loggedSetId`, och typen tillåter det lika gärna. Raden nedan är den enda
    // skillnaden mellan `av 4 set` och `3 set`.
    expect(loggadeArbetsset([rad(true, true), rad(false, true), rad(false, true)])).toHaveLength(2);
  });

  it('räknar inte en spökrad som ännu inte bockats av', () => {
    // Planen fylls med förra passets siffror INNAN de gjorts (`plan.ts`,
    // spökdata). De raderna är appens gissning om vad du ska göra, inte något
    // du gjort — och det var precis förväxlingen 12.44 rättade när `av 4 set`
    // visade sig ha en nämnare användaren aldrig satt.
    expect(loggadeArbetsset([rad(false, true), rad(false, false), rad(false, false)])).toHaveLength(
      1
    );
  });
});

describe('12.48 volymen av en plans loggade arbetsset', () => {
  const rad = (isWarmup: boolean, loggad: boolean, weightKg: number, reps: number) => ({
    isWarmup,
    loggedSetId: loggad ? 'set-1' : null,
    weightKg,
    reps,
  });

  it('summerar bara det som räknas som arbete — inte uppvärmningen, inte spöket', () => {
    // Talen är valda så att varje bortfiltrerad rad ger ett SYNLIGT fel om den
    // smyger in: uppvärmningen bär 400 kg (samma differens som gjorde 12.16:s
    // test rött med 1350 mot 950), spöket 500. Passerar en av dem blir svaret
    // 862,5 eller 962,5 i stället för 462,5, och testet säger vilken.
    //
    // ⚠️ ATT SUMMAN GÅR VIA `volumeKg` VAKTAS INTE HÄR, och det ska stå utskrivet.
    // Vikter kommer i halvkilosteg och reps i heltal, så produkten har aldrig mer
    // än en decimal — `volumeKg`:s avrundning kan alltså inte skilja sig från en
    // rå multiplikation på något värde appen kan producera. Delegeringen är ett
    // val om var regeln bor, inte ett beteende ett test kan falla på. 92,5 står
    // kvar för att halvkilot ska synas i talet, inte för att det bevisar något.
    expect(
      volymAv([rad(true, true, 40, 10), rad(false, true, 92.5, 5), rad(false, false, 100, 5)])
    ).toBe(462.5);
  });
});

describe('12.49 radens namn i etiketterna', () => {
  it('kallar uppvärmningsraden vid namn i stället för att ge den ett nummer', () => {
    // ⛔ HELA SKÄLET ATT FUNKTIONEN FINNS. `SetRow` och `SetAdjustSheet` byggde
    // frasen var för sig, och arket räknade radens plats i LISTAN medan raden
    // räknade bland arbetsseten. Med en uppvärmning överst sa raden "set 2" och
    // arket "set 3" — om samma rad.
    expect(radnamn(null)).toBe('uppvärmningen');
  });

  it('numrerar arbetssetet från ett, inte från noll', () => {
    // `workSetIndices` är nollbaserad eftersom `getSetAverages` indexerar sitt
    // svar så. Människor räknar från ett. Översättningen sker HÄR och ingen
    // annanstans — den låg tidigare som `+ 1` på två ställen.
    expect(radnamn(0)).toBe('set 1');
    expect(radnamn(2)).toBe('set 3');
  });
});
