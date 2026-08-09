/**
 * Kontraktet mot `apply_mutations`, sett från klienten. Uppgift 13.1.
 *
 * Ett felstavat fältnamn här märks annars inte förrän synken kör, och då som
 * ett kryptiskt fel långt från orsaken. Därför asserteras serverns namn
 * bokstavligt — inte via en konstant som skulle kunna vara fel på båda håll.
 */

import { describe, expect, it } from 'vitest';
import { setToWire, workoutToWire } from './toWire';
import type { LocalSet, LocalWorkout } from './types';

const workout = (over: Partial<LocalWorkout> = {}): LocalWorkout => ({
  id: 'w-1',
  startedAt: '2024-04-01T10:00:00.000Z',
  endedAt: null,
  title: null,
  note: null,
  isImported: false,
  isDeleted: false,
  updatedAt: '2024-04-01T10:00:00.000Z',
  ...over,
});

const set = (over: Partial<LocalSet> = {}): LocalSet => ({
  id: 's-1',
  workoutId: 'w-1',
  exerciseId: 'e-1',
  setIndex: 0,
  weightKg: 90,
  reps: 1,
  effortType: null,
  effortValue: null,
  restSeconds: null,
  note: null,
  isWarmup: false,
  performedAt: '2024-04-01T10:00:00.000Z',
  source: 'manual',
  isDeleted: false,
  updatedAt: '2024-04-01T10:00:00.000Z',
  ...over,
});

describe('13.1 importflaggan över tråden', () => {
  it('skickar med is_imported för ett importerat pass', () => {
    expect(workoutToWire(workout({ isImported: true }))['is_imported']).toBe(true);
  });

  it('skickar med is_imported = false för ett vanligt pass', () => {
    expect(workoutToWire(workout())['is_imported']).toBe(false);
  });

  it("skickar upp source = 'import' oförändrat", () => {
    expect(setToWire(set({ source: 'import' }))['source']).toBe('import');
  });
});
