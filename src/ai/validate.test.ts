import { describe, expect, it } from 'vitest';
import { validateAiResponse } from './validate';
import type { AiExerciseRef } from './types';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';
const KNABOJ = '1c9ac04d-9226-42d1-a47e-ca9b27530e0b';

const katalog: AiExerciseRef[] = [
  { id: BENK, name: 'Bänkpress', aliases: ['bänk'] },
  { id: KNABOJ, name: 'Knäböj', aliases: ['böj'] },
];

const giltigt = {
  sets: [{ exerciseId: BENK, weightKg: 90, reps: 5 }],
  unresolved: [],
};

describe('8.9 modellens svar valideras innan det når databasen', () => {
  it('släpper igenom ett giltigt svar', () => {
    const r = validateAiResponse(giltigt, katalog, 'råtext');
    expect(r.sets).toHaveLength(1);
    expect(r.sets[0]!.exerciseName).toBe('Bänkpress');
    expect(r.unresolved).toHaveLength(0);
  });

  it('AVVISAR ett påhittat övnings-id', () => {
    // Det farligaste felläget: modellen hittar på ett id som ser ut som ett
    // UUID. Utan denna kontroll hade setet skrivits mot en övning som inte
    // finns, och främmandenyckeln hade fällt hela synkbatchen långt senare.
    const r = validateAiResponse(
      { sets: [{ exerciseId: '00000000-0000-4000-8000-000000000000', weightKg: 90, reps: 5 }], unresolved: [] },
      katalog,
      'råtext'
    );
    expect(r.sets).toHaveLength(0);
    expect(r.unresolved[0]!.reason).toBe('unknown_exercise');
  });

  it('avvisar ett svar som inte är ett objekt', () => {
    for (const skräp of [null, undefined, 'text', 42, []]) {
      const r = validateAiResponse(skräp, katalog, 'råtext');
      expect(r.sets).toHaveLength(0);
      expect(r.unresolved).toHaveLength(1);
    }
  });

  it('avvisar set med orimlig vikt eller reps', () => {
    const fall = [
      { exerciseId: BENK, weightKg: -5, reps: 5 },
      { exerciseId: BENK, weightKg: 9999, reps: 5 },
      { exerciseId: BENK, weightKg: 90, reps: 0 },
      { exerciseId: BENK, weightKg: 90, reps: 5.5 },
      { exerciseId: BENK, weightKg: 90, reps: 500 },
      { exerciseId: BENK, weightKg: Number.NaN, reps: 5 },
    ];
    for (const s of fall) {
      const r = validateAiResponse({ sets: [s], unresolved: [] }, katalog, 'råtext');
      expect(r.sets, JSON.stringify(s)).toHaveLength(0);
    }
  });

  it('avvisar bara det trasiga setet, inte hela svaret', () => {
    const r = validateAiResponse(
      {
        sets: [
          { exerciseId: BENK, weightKg: 90, reps: 5 },
          { exerciseId: 'påhittat', weightKg: 90, reps: 5 },
        ],
        unresolved: [],
      },
      katalog,
      'råtext'
    );
    expect(r.sets).toHaveLength(1);
    expect(r.unresolved).toHaveLength(1);
  });

  it('normaliserar ansträngning och avvisar värden utanför 0–10', () => {
    const ok = validateAiResponse(
      { sets: [{ exerciseId: BENK, weightKg: 90, reps: 5, effortType: 'rpe', effortValue: 8 }], unresolved: [] },
      katalog,
      'r'
    );
    expect(ok.sets[0]!.effortType).toBe('rpe');
    expect(ok.sets[0]!.effortValue).toBe(8);

    const fel = validateAiResponse(
      { sets: [{ exerciseId: BENK, weightKg: 90, reps: 5, effortType: 'rpe', effortValue: 42 }], unresolved: [] },
      katalog,
      'r'
    );
    // Ansträngningen slängs, men setet är fortfarande användbart.
    expect(fel.sets).toHaveLength(1);
    expect(fel.sets[0]!.effortValue).toBeNull();
  });

  it('tvingar okänd effortType till null i stället för att skriva skräp', () => {
    const r = validateAiResponse(
      { sets: [{ exerciseId: BENK, weightKg: 90, reps: 5, effortType: 'borg', effortValue: 8 }], unresolved: [] },
      katalog,
      'r'
    );
    expect(r.sets[0]!.effortType).toBeNull();
    expect(r.sets[0]!.effortValue).toBeNull();
  });

  it('behåller modellens motivering — härledd data ska inte se ut som inmatad', () => {
    const r = validateAiResponse(
      {
        sets: [
          {
            exerciseId: BENK,
            weightKg: 90,
            reps: 5,
            reasoning: 'samma som förra passet',
            confidence: 'low',
          },
        ],
        unresolved: [],
      },
      katalog,
      'samma som sist'
    );
    expect(r.sets[0]!.reasoning).toBe('samma som förra passet');
    expect(r.sets[0]!.confidence).toBe('low');
  });

  it('sätter låg konfidens som förval när modellen inte angett någon', () => {
    // Modellen har härlett något ur historiken. Utan uttryckligt "high" ska
    // användaren få bekräfta — hellre fråga än att skriva en gissning.
    const r = validateAiResponse(giltigt, katalog, 'råtext');
    expect(r.sets[0]!.confidence).toBe('low');
  });

  it('för vidare modellens unresolved med begriplig text', () => {
    const r = validateAiResponse(
      { sets: [], unresolved: [{ reason: 'unclear', message: 'Vilken övning menar du?' }] },
      katalog,
      'något otydligt'
    );
    expect(r.unresolved).toHaveLength(1);
    expect(r.unresolved[0]!.hint).toBe('Vilken övning menar du?');
  });

  it('ett tomt svar blir unresolved, aldrig ett tyst lyckat resultat', () => {
    const r = validateAiResponse({ sets: [], unresolved: [] }, katalog, 'råtext');
    expect(r.sets).toHaveLength(0);
    expect(r.unresolved).toHaveLength(1);
  });
});
