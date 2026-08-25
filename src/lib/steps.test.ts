import { describe, expect, it } from 'vitest';
// Testet läser katalogen med flit — se kommentaren i det andra fallet nedan.
import { CATALOG } from '../db/catalog';
import {
  formatVolume,
  formatWeight,
  parseRepsInput,
  parseWeightInput,
  stepReps,
  stepWeight,
  weightStepFor,
} from './steps';

describe('11B.0f viktsteget per utrustning', () => {
  it('ger 2,5 kg bara åt skivstången — allt annat får hela kilon', () => {
    // Katalogens fem utrustningsvärden, alla fem prövade. 1,25-skivor finns på
    // varje gym; hantelrack, kabelstackar och maskiner varierar, och Adam
    // tränar på flera gym. Avrunda bara så grovt som utrustningen är
    // garanterad att vara — `SPEC.md` §2.
    expect(weightStepFor('skivstång')).toBe(2.5);
    expect(weightStepFor('hantlar')).toBe(1);
    expect(weightStepFor('kabel')).toBe(1);
    expect(weightStepFor('maskin')).toBe(1);
    expect(weightStepFor('kroppsvikt')).toBe(1);
  });

  it('känner igen katalogens faktiska värden — inte bara strängar i det här testet', () => {
    // ⚠️ VARFÖR TESTET LÄSER KATALOGEN. Testet ovan räknar upp värdena för hand,
    // och en felstavning i BÅDE `weightStepFor` och den uppräkningen hade gått
    // igenom. Här är katalogen sanningskällan: skivstångsövningarna måste få
    // 2,5 och de övriga 1 kg. Stavas literalen i `weightStepFor` fel får ingen
    // katalogövning 2,5, och raden faller.
    const skivstång = CATALOG.filter((ö) => ö.equipment === 'skivstång');
    const övriga = CATALOG.filter((ö) => ö.equipment !== 'skivstång');

    expect(skivstång.length).toBeGreaterThan(0);
    expect(övriga.length).toBeGreaterThan(0);
    expect(new Set(skivstång.map((ö) => weightStepFor(ö.equipment)))).toEqual(new Set([2.5]));
    expect(new Set(övriga.map((ö) => weightStepFor(ö.equipment)))).toEqual(new Set([1]));
  });

  it('faller tillbaka på hela kilon för okänd utrustning i stället för att anta stång', () => {
    // Egna övningar (fas 7) kan ha vilket värde som helst, eller inget alls.
    // Fallbacken ska vara det FINA steget: ett för grovt steg raderar vikter
    // användaren faktiskt lyft, och det går inte att ångra i efterhand.
    expect(weightStepFor(null)).toBe(1);
    expect(weightStepFor('kettlebell')).toBe(1);
  });
});

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
