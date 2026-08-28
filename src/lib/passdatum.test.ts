import { describe, expect, it } from 'vitest';
import { passdatum } from './passdatum';

/**
 * Vakt över historikradens datum. Uppgift steg 4.3 del A.
 *
 * ⚠️ **Datumen byggs med lokala konstruktorer och inte ur ISO-strängar med `Z`.**
 * `toLocaleDateString` formaterar i maskinens tidszon, så ett UTC-datum kan bli
 * gårdagen på en maskin väster om Greenwich — och då hade vakten varit röd av
 * skäl som inte har med koden att göra.
 */
const lokalt = (år: number, månadFrån1: number, dag: number) =>
  new Date(år, månadFrån1 - 1, dag, 12, 0, 0);

describe('steg 4.3 historikradens datum', () => {
  it('säger "I dag" om passet är i dag', () => {
    const nu = lokalt(2026, 8, 4);
    expect(passdatum(lokalt(2026, 8, 4).toISOString(), nu)).toBe('I dag');
  });

  it('säger "I går" om passet var i går', () => {
    const nu = lokalt(2026, 8, 4);
    expect(passdatum(lokalt(2026, 8, 3).toISOString(), nu)).toBe('I går');
  });

  it('skriver ut veckodagen med versal och utan punkt — `DESIGN.md` §3.2', () => {
    // 4 augusti 2026 är en tisdag. `sv-SE` ger `tisdag 4 aug.` — versalen och
    // punkten är våra, och det är dem raden mäter.
    const nu = lokalt(2026, 8, 20);
    expect(passdatum(lokalt(2026, 8, 4).toISOString(), nu)).toBe('Tisdag 4 aug');
  });

  it('ser likadan ut i en månad som inte förkortas', () => {
    // ⛔ DET HÄR ÄR HELA SKÄLET TILL PUNKTBORTTAGNINGEN. `mars`, `maj`, `juni`
    // och `juli` skrivs utan punkt av locale:t; de övriga åtta med. Tas punkten
    // inte bort byter raden utseende beroende på årstid, och det ser ut som ett
    // fel snarare än som en språkregel.
    const nu = lokalt(2026, 4, 20);
    expect(passdatum(lokalt(2026, 3, 4).toISOString(), nu)).toBe('Onsdag 4 mars');
  });

  it('räknar "i går" över ett månadsskifte', () => {
    // Ett dygn bakåt över den 1:a är inte samma sak som `dag - 1`, och det är
    // den sortens rad som ser för enkel ut för att kunna vara fel.
    const nu = lokalt(2026, 9, 1);
    expect(passdatum(lokalt(2026, 8, 31).toISOString(), nu)).toBe('I går');
  });
});
