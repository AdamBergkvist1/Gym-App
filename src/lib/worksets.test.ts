import { describe, expect, it } from 'vitest';
import { workSetIndices } from './worksets';

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
