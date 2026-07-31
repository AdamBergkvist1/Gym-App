import { describe, expect, it } from 'vitest';
import { parseSetText } from './parse';
import { BENKPRESS_ID, TEST_EXERCISES } from './fixtures';
import type { EffortType, ParseContext, Unit } from './types';

function ctx(unit: Unit = 'kg', effort: EffortType = 'rir'): ParseContext {
  return { exercises: TEST_EXERCISES, unitPreference: unit, defaultEffortScale: effort };
}

/** Plockar ut det enda setet, och gör testet högljutt om det inte finns. */
function onlySet(raw: string, c: ParseContext = ctx()) {
  const r = parseSetText(raw, c);
  expect(r.unresolved, `oväntat otolkat: ${JSON.stringify(r.unresolved)}`).toHaveLength(0);
  expect(r.sets).toHaveLength(1);
  return r.sets[0]!;
}

// =====================================================================
// 4.6 — testkorpus. Varje rad kommer från PLAN.md §4.3 och ska ge
// Bänkpress, 90 kg, 5 reps om inget annat anges.
// =====================================================================

describe('4.6 grammatiken — måste tolkas felfritt', () => {
  const grundfall: Array<[string, string]> = [
    ['Bänkpress 90x5', 'grundfallet'],
    ['Bänk 90 kg 5 reps', 'alias + utskrivna enheter'],
    ['bänk 90kg x 5', 'gemener, hopskriven enhet'],
    ['BÄNKPRESS 90 X 5', 'versaler'],
    ['Bänkpress 90*5', 'asterisk som separator'],
    ['Bänkpress 90×5', 'unicode multiplikationstecken'],
    ['bench 90x5', 'engelskt alias'],
    ['Bänkpress 90 5', 'två bara tal, ingen separator'],
    ['  Bänk   90x5  ', 'extra blanksteg'],
  ];

  for (const [input, vad] of grundfall) {
    it(`${JSON.stringify(input)} — ${vad}`, () => {
      const s = onlySet(input);
      expect(s.exerciseId).toBe(BENKPRESS_ID);
      expect(s.weightKg).toBe(90);
      expect(s.reps).toBe(5);
    });
  }

  it('"Bänk 92,5x5" — svenskt decimalkomma', () => {
    expect(onlySet('Bänk 92,5x5').weightKg).toBe(92.5);
  });

  it('"Bänk 92.5x5" — punkt', () => {
    expect(onlySet('Bänk 92.5x5').weightKg).toBe(92.5);
  });

  it('"Bänk 90x5 @8" — effort med profilens skala', () => {
    const s = onlySet('Bänk 90x5 @8');
    expect(s.effortValue).toBe(8);
    expect(s.effortType).toBe('rir');
  });

  it('"Bänk 90x5 rir 2" — utskriven skala', () => {
    const s = onlySet('Bänk 90x5 rir 2');
    expect(s.effortType).toBe('rir');
    expect(s.effortValue).toBe(2);
  });

  it('"Bänk 90x5 @8 rpe" — skalan efter värdet', () => {
    const s = onlySet('Bänk 90x5 @8 rpe', ctx('kg', 'rir'));
    expect(s.effortType).toBe('rpe');
    expect(s.effortValue).toBe(8);
  });

  it('"Bänk 90x5, kändes lätt" — anteckning', () => {
    const s = onlySet('Bänk 90x5, kändes lätt');
    expect(s.note).toBe('kändes lätt');
    expect(s.weightKg).toBe(90);
    expect(s.reps).toBe(5);
  });

  it('"Bänk 90x5, ont i axeln" — anteckning', () => {
    expect(onlySet('Bänk 90x5, ont i axeln').note).toBe('ont i axeln');
  });

  it('sätter note till null när ingen anteckning finns', () => {
    expect(onlySet('Bänkpress 90x5').note).toBeNull();
  });
});

// =====================================================================
// 4.7 — måste avvisas. Aldrig gissa.
// =====================================================================

describe('4.7 avvisning — hellre otolkat än feltolkat', () => {
  const avvisas: Array<[string, string, string]> = [
    ['Bänkpress', 'missing_numbers', 'ingen vikt, inga reps'],
    ['90x5', 'missing_exercise', 'ingen övning'],
    ['Bänk 90', 'missing_reps', 'reps saknas'],
    ['Blaha 90x5', 'unknown_exercise', 'okänd övning'],
    ['Bänk 90x5x3', 'ambiguous_numbers', 'tre tal — tvetydigt'],
    ['', 'empty', 'tom sträng'],
  ];

  for (const [input, reason, vad] of avvisas) {
    it(`${JSON.stringify(input)} → ${reason} (${vad})`, () => {
      const r = parseSetText(input, ctx());
      expect(r.sets, 'inget set får skapas').toHaveLength(0);
      expect(r.unresolved).toHaveLength(1);
      expect(r.unresolved[0]!.reason).toBe(reason);
      expect(r.unresolved[0]!.rawText).toBe(input);
    });
  }

  it('lämnar tillbaka namnet den inte kände igen, så UI:t kan erbjuda att skapa det', () => {
    const r = parseSetText('Blaha 90x5', ctx());
    expect(r.unresolved[0]!.attemptedName).toBe('blaha');
  });

  it('sätter inte attemptedName när övningen inte är problemet', () => {
    expect(parseSetText('Bänk 90', ctx()).unresolved[0]!.attemptedName).toBeUndefined();
  });

  it('avvisar ansträngning utanför 0–10', () => {
    const r = parseSetText('Bänk 90x5 @14', ctx());
    expect(r.sets).toHaveLength(0);
    expect(r.unresolved[0]!.reason).toBe('effort_out_of_range');
  });

  it('avvisar bara blanksteg som tomt', () => {
    expect(parseSetText('   ', ctx()).unresolved[0]!.reason).toBe('empty');
  });
});

// =====================================================================
// 4.8 — enheter. Gissas aldrig; tolkas enligt profilen och det ska synas.
// =====================================================================

describe('4.8 enheter', () => {
  it('utan enhet och kg-profil: talet är kg', () => {
    const s = onlySet('Bänk 90x5', ctx('kg'));
    expect(s.weightKg).toBe(90);
    expect(s.unitSource).toBe('profile');
  });

  it('utan enhet och lb-profil: talet räknas om till kg', () => {
    const s = onlySet('Bänk 100x5', ctx('lb'));
    expect(s.weightKg).toBeCloseTo(45.36, 2);
    expect(s.unitSource).toBe('profile');
  });

  it('utskrivet kg slår profilen', () => {
    const s = onlySet('Bänk 100 kg x 5', ctx('lb'));
    expect(s.weightKg).toBe(100);
    expect(s.unitSource).toBe('explicit');
  });

  it('utskrivet lb slår profilen', () => {
    const s = onlySet('Bänk 100 lb x 5', ctx('kg'));
    expect(s.weightKg).toBeCloseTo(45.36, 2);
    expect(s.unitSource).toBe('explicit');
  });
});

// =====================================================================
// 4.9 — konfidens. Hellre fråga en gång än logga ett omvänt set.
// =====================================================================

describe('4.9 vikt/reps-konfidens', () => {
  it('tydligt fall ger hög konfidens', () => {
    expect(onlySet('Bänk 90x5').confidence).toBe('high');
    expect(onlySet('Bänk 92.5x8').confidence).toBe('high');
  });

  it('"20x30" ger låg konfidens — talen kan vara omkastade', () => {
    expect(onlySet('Bänk 20x30').confidence).toBe('low');
  });

  it('"5x5" ger låg konfidens — ser ut som set×reps-notation', () => {
    expect(onlySet('Bänk 5x5').confidence).toBe('low');
  });

  it('orimligt många reps ger låg konfidens', () => {
    expect(onlySet('Bänk 90x50').confidence).toBe('low');
  });

  it('utskriven enhet gör tvetydigheten till ett medvetet val', () => {
    // Användaren har själv sagt vilket tal som är vikten. Då ska vi inte fråga.
    expect(onlySet('Bänk 20 kg x 30').confidence).toBe('high');
  });
});
