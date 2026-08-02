import { describe, expect, it } from 'vitest';
import { fromDigits, snapToHalf, toDigits, withDigit } from './digits';

describe('11A.3b viktens siffror', () => {
  it('delar upp heltal', () => {
    expect(toDigits(90)).toEqual({ hundreds: 0, tens: 9, ones: 0, half: 0 });
    expect(toDigits(125)).toEqual({ hundreds: 1, tens: 2, ones: 5, half: 0 });
    expect(toDigits(7)).toEqual({ hundreds: 0, tens: 0, ones: 7, half: 0 });
  });

  it('hanterar halvkilo — det som brukar gå sönder', () => {
    expect(toDigits(92.5)).toEqual({ hundreds: 0, tens: 9, ones: 2, half: 5 });
    expect(toDigits(0.5)).toEqual({ hundreds: 0, tens: 0, ones: 0, half: 5 });
    expect(toDigits(100.5)).toEqual({ hundreds: 1, tens: 0, ones: 0, half: 5 });
  });

  it('går fram och tillbaka utan att tappa något', () => {
    for (const kg of [0, 0.5, 7, 20, 62.5, 90, 92.5, 125, 200, 999.5]) {
      expect(fromDigits(toDigits(kg)), `${kg} kg`).toBe(kg);
    }
  });

  it('snappar till närmaste halvkilo — hjulet har inga finare steg', () => {
    expect(snapToHalf(92.4)).toBe(92.5);
    expect(snapToHalf(92.2)).toBe(92);
    expect(snapToHalf(92.75)).toBe(93);
  });

  it('går aldrig under noll eller över taket', () => {
    expect(snapToHalf(-5)).toBe(0);
    expect(snapToHalf(5000)).toBe(999.5);
    expect(snapToHalf(NaN)).toBe(0);
  });
});

describe('att snurra ett enskilt hjul', () => {
  it('byter tiotal utan att röra resten — 20 kg blir 60 med ETT drag', () => {
    // Det här är hela poängen: att gå från 20 till 62,5 utan sjutton tryck.
    expect(withDigit(20, 'tens', 6)).toBe(60);
    expect(withDigit(62, 'half', 5)).toBe(62.5);
  });

  it('byter ental för finjustering — 1 kg i taget för hantlar', () => {
    expect(withDigit(20, 'ones', 2)).toBe(22);
    expect(withDigit(22, 'ones', 1)).toBe(21);
  });

  it('byter hundratal', () => {
    expect(withDigit(25, 'hundreds', 1)).toBe(125);
    expect(withDigit(125, 'hundreds', 0)).toBe(25);
  });

  it('behåller decimalen när heltalsdelen ändras', () => {
    expect(withDigit(92.5, 'tens', 8)).toBe(82.5);
  });

  it('nollar decimalen när half sätts till 0', () => {
    expect(withDigit(92.5, 'half', 0)).toBe(92);
  });
});
