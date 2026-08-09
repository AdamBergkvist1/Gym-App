/**
 * Översättning från lokala rader till serverns fältnamn.
 *
 * Detta är klientens halva av kontraktet mot `apply_mutations`. Ligger i en
 * egen modul med egna tester, eftersom ett felstavat fältnamn här inte märks
 * förrän synken körs — och då som ett kryptiskt fel långt från orsaken.
 *
 * `user_id` finns MEDVETET inte med. Servern tar alltid ägaren från JWT:n och
 * ignorerar payloaden. Skickade vi den skulle vi antyda att klienten bestämmer
 * vem datan tillhör, vilket den inte gör.
 */

import type { LocalSet, LocalWorkout } from './types';

export function workoutToWire(w: LocalWorkout): Record<string, unknown> {
  return {
    id: w.id,
    started_at: w.startedAt,
    ended_at: w.endedAt,
    title: w.title,
    note: w.note,
    is_imported: w.isImported,
    is_deleted: w.isDeleted,
  };
}

export function setToWire(s: LocalSet): Record<string, unknown> {
  return {
    id: s.id,
    workout_id: s.workoutId,
    exercise_id: s.exerciseId,
    set_index: s.setIndex,
    weight_kg: s.weightKg,
    reps: s.reps,
    effort_type: s.effortType,
    effort_value: s.effortValue,
    rest_seconds: s.restSeconds,
    note: s.note,
    is_warmup: s.isWarmup,
    performed_at: s.performedAt,
    source: s.source,
    is_deleted: s.isDeleted,
  };
}
