/**
 * Serverrader → lokala rader. Motparten till `db/toWire.ts`.
 *
 * Varje fält plockas ut explicit. Ett `as LocalSet` på ett okänt objekt hade
 * dolt exakt de felstavningar den här filen finns för att fånga.
 */

import { normalizeName } from '../parser/normalize';
import type { EffortType } from '../parser/types';
import type { LocalExercise, LocalSet, LocalWorkout, SetSource } from '../db/types';

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v));
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: unknown): boolean => v === true;

export function workoutFromWire(r: Row): LocalWorkout {
  return {
    id: str(r['id']),
    startedAt: str(r['started_at']),
    endedAt: strOrNull(r['ended_at']),
    title: strOrNull(r['title']),
    note: strOrNull(r['note']),
    isDeleted: bool(r['is_deleted']),
    updatedAt: str(r['updated_at']),
  };
}

export function setFromWire(r: Row): LocalSet {
  const effort = strOrNull(r['effort_type']);
  return {
    id: str(r['id']),
    workoutId: str(r['workout_id']),
    exerciseId: str(r['exercise_id']),
    setIndex: num(r['set_index']),
    weightKg: num(r['weight_kg']),
    reps: num(r['reps']),
    effortType: effort === 'rir' || effort === 'rpe' ? (effort as EffortType) : null,
    effortValue: numOrNull(r['effort_value']),
    restSeconds: numOrNull(r['rest_seconds']),
    note: strOrNull(r['note']),
    isWarmup: bool(r['is_warmup']),
    performedAt: str(r['performed_at']),
    source: (['manual', 'local_parse', 'ai_parse'] as const).includes(
      str(r['source']) as SetSource
    )
      ? (str(r['source']) as SetSource)
      : 'manual',
    isDeleted: bool(r['is_deleted']),
    updatedAt: str(r['updated_at']),
  };
}

export function exerciseFromWire(r: Row): LocalExercise {
  const name = str(r['name']);
  return {
    id: str(r['id']),
    ownerId: strOrNull(r['owner_id']),
    name,
    // Servern har en genererad kolumn, men vi räknar om lokalt så att lokala
    // och hämtade rader garanterat normaliseras likadant.
    normalizedName: normalizeName(name),
    aliases: Array.isArray(r['aliases']) ? (r['aliases'] as string[]) : [],
    primaryMuscle: str(r['primary_muscle']),
    equipment: strOrNull(r['equipment']),
    isArchived: bool(r['is_archived']),
    isDeleted: bool(r['is_deleted']),
    updatedAt: str(r['updated_at']),
  };
}
