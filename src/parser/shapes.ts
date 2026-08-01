/**
 * Tolkning av talen till set. Uppgift 4.13.
 *
 * Här avgörs vad `90x5x3` betyder. Nyckeln är att formen läses ur HUR talen
 * satt ihop, inte ur deras storlek. Ett magnitudresonemang ("det största talet
 * är vikten") ser klokt ut men går sönder på `20x30x2` — 30 är störst men är
 * repsen. Kopplingsmönstret är entydigt där magnituden gissar.
 */

import type { NumberAtom } from './tokenize';
import type { Unit } from './types';

/** Fler set än så på en rad är nästan säkert en felskrivning, inte en avsikt. */
export const MAX_SETS_PER_LINE = 10;

export interface RawSet {
  /** Talet användaren skrev, före enhetsomvandling. */
  enteredWeight: number;
  reps: number;
  unit: Unit | null;
  /** Sant när användaren själv skrev ut enheten. */
  unitExplicit: boolean;
}

export type ShapeResult =
  | { ok: true; sets: RawSet[] }
  | { ok: false; reason: 'missing_numbers' | 'missing_reps' | 'ambiguous_numbers'; hint?: string };

/**
 * Avgör vilket av två tal som är vikten.
 *
 * Ordningen på reglerna är prioritetsordning: en utskriven enhet slår allt,
 * en repmarkör slår ordningen, och först när användaren inte sagt någonting
 * faller vi tillbaka på konventionen vikt-först. Den sista är en TOLKNING, och
 * det är därför konfidensregeln i parse.ts finns.
 */
function pair(a: NumberAtom, b: NumberAtom): RawSet {
  if (a.unit !== null) return set(a, b);
  if (b.unit !== null) return set(b, a);
  if (a.repMarked && !b.repMarked) return set(b, a);
  if (b.repMarked && !a.repMarked) return set(a, b);
  return set(a, b); // konventionen: vikt först
}

function set(weight: NumberAtom, reps: NumberAtom): RawSet {
  return {
    enteredWeight: weight.value,
    reps: reps.value,
    unit: weight.unit,
    unitExplicit: weight.unit !== null,
  };
}

function repeat(single: RawSet, count: number): ShapeResult {
  if (!Number.isInteger(count) || count < 1) {
    return { ok: false, reason: 'ambiguous_numbers', hint: 'antalet set är inte ett heltal' };
  }
  if (count > MAX_SETS_PER_LINE) {
    return {
      ok: false,
      reason: 'ambiguous_numbers',
      hint: `${count} set på en rad ser ut som en felskrivning`,
    };
  }
  return { ok: true, sets: Array.from({ length: count }, () => ({ ...single })) };
}

function validReps(sets: RawSet[]): boolean {
  return sets.every((s) => Number.isInteger(s.reps) && s.reps > 0 && s.enteredWeight >= 0);
}

export function interpret(atoms: NumberAtom[]): ShapeResult {
  if (atoms.length === 0) {
    return { ok: false, reason: 'missing_numbers', hint: 'ingen vikt och inga reps' };
  }
  if (atoms.length === 1) {
    return { ok: false, reason: 'missing_reps', hint: 'bara ett tal angivet' };
  }

  const joins = atoms.slice(1).map((a) => a.join);

  // ---- Ett set: två tal. -------------------------------------------------
  if (atoms.length === 2) {
    const s = pair(atoms[0]!, atoms[1]!);
    return validReps([s])
      ? { ok: true, sets: [s] }
      : { ok: false, reason: 'ambiguous_numbers', hint: 'reps måste vara ett heltal över noll' };
  }

  // ---- Tre tal: två kända former, allt annat avvisas. --------------------
  if (atoms.length === 3) {
    const [a, b, c] = atoms as [NumberAtom, NumberAtom, NumberAtom];

    // `90x5x3` — allt i en kedja. Konventionen är vikt × reps × set.
    // Läses positionellt, inte efter storlek: i `20x30x2` är det största
    // talet repsen, och en magnitudregel hade tolkat raden bakvänt.
    if (joins[0] === 'x' && joins[1] === 'x') {
      const s = pair(a, b);
      return validReps([s])
        ? repeat(s, c.value)
        : { ok: false, reason: 'ambiguous_numbers', hint: 'reps måste vara ett heltal' };
    }

    // `3x8 bänk 60` — set×reps före övningen, vikten efter. Det är övningsnamnet
    // emellan ('text') som gör formen entydig; med bara blanksteg vore raden
    // lika gärna ett set plus ett löst tal, och då avvisar vi hellre.
    if (joins[0] === 'x' && joins[1] === 'text') {
      const s: RawSet = {
        enteredWeight: c.value,
        reps: b.value,
        unit: c.unit,
        unitExplicit: c.unit !== null,
      };
      return validReps([s])
        ? repeat(s, a.value)
        : { ok: false, reason: 'ambiguous_numbers', hint: 'reps måste vara ett heltal' };
    }

    return {
      ok: false,
      reason: 'ambiguous_numbers',
      hint: 'tre tal i en form vi inte känner igen',
    };
  }

  // ---- Jämnt antal tal i par: `90x5 85x5`. -------------------------------
  // Varje par hålls ihop med x, och paren skiljs åt av något annat än x.
  // `90x5x3x2` faller därför igenom — där är allt x, och det är ingen känd form.
  if (atoms.length % 2 === 0) {
    let parVis = true;
    for (let i = 1; i < atoms.length && parVis; i++) {
      const j = atoms[i]!.join;
      const inomPar = i % 2 === 1;
      if (inomPar && j !== 'x') parVis = false;
      if (!inomPar && j === 'x') parVis = false;
    }

    if (parVis) {
      const sets: RawSet[] = [];
      for (let i = 0; i < atoms.length; i += 2) sets.push(pair(atoms[i]!, atoms[i + 1]!));
      if (sets.length > MAX_SETS_PER_LINE) {
        return { ok: false, reason: 'ambiguous_numbers', hint: 'för många set på en rad' };
      }
      return validReps(sets)
        ? { ok: true, sets }
        : { ok: false, reason: 'ambiguous_numbers', hint: 'reps måste vara heltal över noll' };
    }
  }

  return {
    ok: false,
    reason: 'ambiguous_numbers',
    hint: `${atoms.length} tal i en form vi inte känner igen`,
  };
}
