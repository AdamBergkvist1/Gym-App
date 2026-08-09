/**
 * Serverrader → lokala rader. Uppgift 13.1.
 *
 * Motparten till `db/toWire.test.ts`: att fältet skickas upp hjälper inte om
 * det tappas på vägen ned.
 */

import { describe, expect, it } from 'vitest';
import { setFromWire, workoutFromWire } from './wire';

const serverWorkout = (over: Record<string, unknown> = {}) => ({
  id: 'w-1',
  started_at: '2024-04-01T10:00:00.000Z',
  ended_at: null,
  title: null,
  note: null,
  is_imported: false,
  is_deleted: false,
  updated_at: '2024-04-01T10:00:00.000Z',
  ...over,
});

describe('13.1 importflaggan ned från servern', () => {
  it('läser is_imported', () => {
    expect(workoutFromWire(serverWorkout({ is_imported: true })).isImported).toBe(true);
  });

  it('tolkar ett saknat is_imported som icke-importerat', () => {
    const { is_imported: _utelämnat, ...utan } = serverWorkout();
    expect(workoutFromWire(utan).isImported).toBe(false);
  });
});

const serverSet = (over: Record<string, unknown> = {}) => ({
  id: 's-1',
  workout_id: 'w-1',
  exercise_id: 'e-1',
  set_index: 0,
  weight_kg: 90,
  reps: 1,
  effort_type: null,
  effort_value: null,
  rest_seconds: null,
  note: null,
  is_warmup: false,
  performed_at: '2024-04-01T10:00:00.000Z',
  source: 'manual',
  is_deleted: false,
  updated_at: '2024-04-01T10:00:00.000Z',
  ...over,
});

describe("13.1 source = 'import'", () => {
  it('behåller import som källa i stället för att degradera den till manual', () => {
    expect(setFromWire(serverSet({ source: 'import' })).source).toBe('import');
  });

  it('faller fortfarande tillbaka på manual för en okänd källa', () => {
    expect(setFromWire(serverSet({ source: 'gissning' })).source).toBe('manual');
  });
});
