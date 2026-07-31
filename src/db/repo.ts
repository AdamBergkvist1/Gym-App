/**
 * Dataåtkomsten. Uppgift 5.2–5.4.
 *
 * Grundregeln genom hela filen: varje mutation skriver till entitetstabellen
 * OCH till utkorgen i EN transaktion. Antingen syns setet lokalt och ligger i
 * kön, eller inget av det. Ett set som syns i UI:t men aldrig hamnar i kön blir
 * borta vid nästa enhet — tyst.
 */

import { newId } from '../lib/id';
import { normalizeName } from '../parser/normalize';
import type { ExerciseRef } from '../parser/types';
import { CATALOG } from './catalog';
import { db, type GymDatabase } from './db';
import { setToWire, workoutToWire } from './toWire';
import {
  META_ACTIVE_WORKOUT,
  type LocalExercise,
  type LocalSet,
  type LocalWorkout,
  type OutboxEntry,
  type SetSource,
  type SyncTable,
} from './types';

const now = () => new Date().toISOString();

function outboxEntry(table: SyncTable, rowId: string, payload: Record<string, unknown>): OutboxEntry {
  return {
    mutationId: newId(),
    table,
    rowId,
    payload,
    createdAt: now(),
    attempts: 0,
    lastError: null,
    status: 'pending',
  };
}

// ---------------------------------------------------------------- katalog

/**
 * Seedar den globala katalogen vid första start. Uppdaterar befintliga rader
 * om katalogen ändrats i bygget, men rör aldrig användarens egna övningar.
 */
export async function ensureCatalog(database: GymDatabase = db): Promise<number> {
  const rows: LocalExercise[] = CATALOG.map((e) => ({
    id: e.id,
    ownerId: null,
    name: e.name,
    normalizedName: normalizeName(e.name),
    aliases: e.aliases,
    primaryMuscle: e.primaryMuscle,
    equipment: e.equipment,
    isArchived: false,
    isDeleted: false,
    updatedAt: now(),
  }));
  // bulkPut, inte bulkAdd: idempotent, och en ändrad katalog i ett nytt bygge
  // slår igenom utan migrationssteg.
  await database.exercises.bulkPut(rows);
  return rows.length;
}

/** Katalogen i den form parsern vill ha den. */
export async function loadExerciseRefs(database: GymDatabase = db): Promise<ExerciseRef[]> {
  const all = await database.exercises.toArray();
  return all
    .filter((e) => !e.isDeleted && !e.isArchived)
    .map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalizedName,
      aliases: e.aliases,
    }));
}

// ---------------------------------------------------------------- pass

export async function getActiveWorkout(database: GymDatabase = db): Promise<LocalWorkout | null> {
  const meta = await database.meta.get(META_ACTIVE_WORKOUT);
  const id = typeof meta?.value === 'string' ? meta.value : null;
  if (!id) return null;
  const w = await database.workouts.get(id);
  // Är passet avslutat eller borta är markören inaktuell — säg det, gissa inte.
  if (!w || w.endedAt !== null || w.isDeleted) return null;
  return w;
}

export async function startWorkout(
  database: GymDatabase = db,
  title: string | null = null
): Promise<LocalWorkout> {
  const existing = await getActiveWorkout(database);
  if (existing) return existing;

  const workout: LocalWorkout = {
    id: newId(),
    startedAt: now(),
    endedAt: null,
    title,
    note: null,
    isDeleted: false,
    updatedAt: now(),
  };

  await database.transaction('rw', database.workouts, database.outbox, database.meta, async () => {
    await database.workouts.add(workout);
    await database.outbox.add(outboxEntry('workouts', workout.id, workoutToWire(workout)));
    await database.meta.put({ key: META_ACTIVE_WORKOUT, value: workout.id });
  });
  return workout;
}

export async function endWorkout(database: GymDatabase = db): Promise<LocalWorkout | null> {
  const active = await getActiveWorkout(database);
  if (!active) return null;

  const ended: LocalWorkout = { ...active, endedAt: now(), updatedAt: now() };

  await database.transaction('rw', database.workouts, database.outbox, database.meta, async () => {
    await database.workouts.put(ended);
    await database.outbox.add(outboxEntry('workouts', ended.id, workoutToWire(ended)));
    await database.meta.delete(META_ACTIVE_WORKOUT);
  });
  return ended;
}

// ---------------------------------------------------------------- set

export interface LogSetInput {
  workoutId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  effortType?: LocalSet['effortType'];
  effortValue?: number | null;
  note?: string | null;
  isWarmup?: boolean;
  source?: SetSource;
}

/** Alla set i ett pass, i loggningsordning. */
export async function getSetsForWorkout(
  workoutId: string,
  database: GymDatabase = db
): Promise<LocalSet[]> {
  const rows = await database.loggedSets.where('workoutId').equals(workoutId).toArray();
  return rows
    .filter((s) => !s.isDeleted)
    .sort((a, b) => (a.performedAt < b.performedAt ? -1 : a.performedAt > b.performedAt ? 1 : 0));
}

export async function logSet(input: LogSetInput, database: GymDatabase = db): Promise<LocalSet> {
  if (!Number.isFinite(input.weightKg) || input.weightKg < 0) {
    throw new Error(`ogiltig vikt: ${input.weightKg}`);
  }
  if (!Number.isInteger(input.reps) || input.reps <= 0) {
    throw new Error(`ogiltiga reps: ${input.reps}`);
  }

  // setIndex räknas per övning inom passet, så att "set 3 av bänkpress" är
  // rätt även när övningarna varvas.
  const sameExercise = await database.loggedSets
    .where('workoutId')
    .equals(input.workoutId)
    .filter((s) => s.exerciseId === input.exerciseId && !s.isDeleted)
    .count();

  const timestamp = now();
  const row: LocalSet = {
    id: newId(),
    workoutId: input.workoutId,
    exerciseId: input.exerciseId,
    setIndex: sameExercise,
    weightKg: input.weightKg,
    reps: input.reps,
    effortType: input.effortType ?? null,
    effortValue: input.effortValue ?? null,
    restSeconds: null,
    note: input.note ?? null,
    isWarmup: input.isWarmup ?? false,
    performedAt: timestamp,
    source: input.source ?? 'manual',
    isDeleted: false,
    updatedAt: timestamp,
  };

  await database.transaction('rw', database.loggedSets, database.outbox, async () => {
    await database.loggedSets.add(row);
    await database.outbox.add(outboxEntry('logged_sets', row.id, setToWire(row)));
  });
  return row;
}

/** Mjuk radering — så att den kan propagera till molnet. */
export async function deleteSet(setId: string, database: GymDatabase = db): Promise<void> {
  const existing = await database.loggedSets.get(setId);
  if (!existing) throw new Error(`set ${setId} finns inte`);
  const updated: LocalSet = { ...existing, isDeleted: true, updatedAt: now() };

  await database.transaction('rw', database.loggedSets, database.outbox, async () => {
    await database.loggedSets.put(updated);
    await database.outbox.add(outboxEntry('logged_sets', updated.id, setToWire(updated)));
  });
}

/**
 * Spökdatan: exakt vad som lyftes senast i den här övningen.
 *
 * Använder det sammansatta indexet `[exerciseId+performedAt]` så att det blir
 * ett indexuppslag i stället för en genomsökning av hela historiken.
 *
 * `excludeWorkoutId` finns för att SPEC säger "förra passet" — värdena från
 * det pågående passet är inte spökdata, de står redan på skärmen.
 */
export async function getLastPerformance(
  exerciseId: string,
  options: { excludeWorkoutId?: string } = {},
  database: GymDatabase = db
): Promise<LocalSet | null> {
  const rows = await database.loggedSets
    .where('[exerciseId+performedAt]')
    .between([exerciseId, ''], [exerciseId, '￿'])
    .reverse()
    .toArray();

  for (const row of rows) {
    if (row.isDeleted || row.isWarmup) continue;
    if (options.excludeWorkoutId && row.workoutId === options.excludeWorkoutId) continue;
    return row;
  }
  return null;
}

/** Antal osända mutationer — driver synkindikatorn i fas 7. */
export async function pendingCount(database: GymDatabase = db): Promise<number> {
  return database.outbox.where('status').anyOf('pending', 'failed').count();
}
