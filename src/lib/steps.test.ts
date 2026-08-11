import { describe, expect, it } from 'vitest';
import {
  formatVolume,
  formatWeight,
  parseRepsInput,
  parseWeightInput,
  stepReps,
  stepWeight,
} from './steps';

describe('11A.3 viktstegaren', () => {
  it('ökar och minskar med 2,5 kg', () => {
    expect(stepWeight(90, 1)).toBe(92.5);
    expect(stepWeight(92.5, 1)).toBe(95);
    expect(stepWeight(90, -1)).toBe(87.5);
  });

  it('SNAPPAR INTE till rutnätet — 91 kg står där för att någon valde det', () => {
    // Att tyst flytta ett värde användaren skrivit in är precis den sortens
    // hjälpsamhet som gör att man slutar lita på loggen.
    expect(stepWeight(91, 1)).toBe(93.5);
    expect(stepWeight(91, -1)).toBe(88.5);
  });

  it('går aldrig under noll — kroppsvikt loggas som 0', () => {
    expect(stepWeight(1, -1)).toBe(0);
    expect(stepWeight(0, -1)).toBe(0);
  });

  it('undviker flyttalsskräp', () => {
    let v = 0;
    for (let i = 0; i < 40; i++) v = stepWeight(v, 1);
    expect(v).toBe(100);
  });

  it('tål ett eget steg för maskiner med andra intervall', () => {
    expect(stepWeight(50, 1, 5)).toBe(55);
    expect(stepWeight(20, 1, 1.25)).toBe(21.25);
  });
});

describe('11A.3 repsstegaren', () => {
  it('ökar och minskar med ett', () => {
    expect(stepReps(5, 1)).toBe(6);
    expect(stepReps(5, -1)).toBe(4);
  });

  it('går aldrig under ett — ett set med noll reps är inget set', () => {
    expect(stepReps(1, -1)).toBe(1);
  });
});

describe('inmatning för de stora hoppen', () => {
  it('tar emot svenskt decimalkomma', () => {
    expect(parseWeightInput('92,5')).toBe(92.5);
    expect(parseWeightInput('92.5')).toBe(92.5);
    expect(parseWeightInput(' 120 ')).toBe(120);
  });

  it('avvisar skräp i stället för att tolka det som noll', () => {
    for (const bad of ['', 'abc', '-5', 'NaN']) {
      expect(parseWeightInput(bad), bad).toBeNull();
    }
  });

  it('kräver heltal över noll för reps', () => {
    expect(parseRepsInput('8')).toBe(8);
    expect(parseRepsInput('0')).toBeNull();
    expect(parseRepsInput('5.5')).toBeNull();
    expect(parseRepsInput('')).toBeNull();
  });
});

describe('viktformatering', () => {
  it('visar heltal utan decimaler och 92,5 med komma', () => {
    expect(formatWeight(90)).toBe('90');
    expect(formatWeight(92.5)).toBe('92,5');
    expect(formatWeight(0)).toBe('0');
  });
});

describe('volymformatering (12.18)', () => {
  it('behåller halvkilot i stället för att avrunda bort det', () => {
    expect(formatVolume(462.5)).toBe('462,5');
    expect(formatVolume(962.5)).toBe('962,5');
  });

  it('visar heltal utan efterhängande decimal', () => {
    expect(formatVolume(1310)).toMatch(/^1.310$/);
    expect(formatVolume(450)).toBe('450');
    expect(formatVolume(0)).toBe('0');
  });

  it('grupperar tusental så att fyrsiffriga volymer går att läsa', () => {
    // sv-SE använder hårt mellanslag som avgränsare — normaliseras för jämförelsen.
    expect(formatVolume(12345.5).replace(/\s/g, ' ')).toBe('12 345,5');
  });
});
