/**
 * Dataåtkomsten. Uppgift 5.2–5.4.
 *
 * Grundregeln genom hela filen: varje mutation skriver till entitetstabellen
 * OCH till utkorgen i EN transaktion. Antingen syns setet lokalt och ligger i
 * kön, eller inget av det. Ett set som syns i UI:t men aldrig hamnar i kön blir
 * borta vid nästa enhet — tyst.
 */

import { newId } from '../lib/id';
import { volumeKg } from '../lib/oneRepMax';
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

/**
 * Skapar en egen övning. Uppgift 5.9.
 *
 * `ownerId` sätts till null lokalt och fylls av servern från JWT:n vid synk —
 * samma regel som för allt annat: klienten bestämmer aldrig vem datan tillhör.
 * Namnet blir sitt eget första alias, så att fritextparsern hittar den direkt.
 */
export async function createExercise(
  name: string,
  database: GymDatabase = db
): Promise<LocalExercise> {
  const trimmed = name.trim();
  if (trimmed === '') throw new Error('övningen måste ha ett namn');

  const normalized = normalizeName(trimmed);
  const existing = await database.exercises.where('normalizedName').equals(normalized).first();
  if (existing) return existing;

  const row: LocalExercise = {
    id: newId(),
    ownerId: null,
    name: trimmed,
    normalizedName: normalized,
    aliases: [normalized],
    primaryMuscle: 'övrigt',
    equipment: null,
    isArchived: false,
    isDeleted: false,
    updatedAt: now(),
  };

  await database.transaction('rw', database.exercises, database.outbox, async () => {
    await database.exercises.add(row);
    await database.outbox.add(
      outboxEntry('exercises', row.id, {
        id: row.id,
        name: row.name,
        aliases: row.aliases,
        primary_muscle: row.primaryMuscle,
        secondary_muscles: [],
        equipment: row.equipment,
        is_archived: false,
        is_deleted: false,
      })
    );
  });
  return row;
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
    .sort((a, b) => {
      if (a.performedAt !== b.performedAt) return a.performedAt < b.performedAt ? -1 : 1;
      // Tiebreak på id. Utan den returnerade sorteringen 0 för set med samma
      // tidsstämpel, och då avgjorde Dexies returordning — som går på
      // primärnyckeln, ett UUID. Ordningen blev alltså SLUMPMÄSSIG.
      //
      // Det upptäcktes 2026-08-04 av CI: `context.test.ts` föll där men
      // passerade lokalt, eftersom en snabbare maskin hinner logga två set inom
      // samma millisekund. Testet var inte flaxigt — det avslöjade en verklig
      // odeterminism.
      //
      // `logSet` garanterar numera strikt växande tidsstämplar, så nya set kan
      // inte kollidera. Detta gäller rader som skrevs före den ändringen.
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
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

  /**
   * Tidsstämpeln måste vara STRIKT större än passets senaste set.
   *
   * VARFÖR: `now()` har millisekundupplösning, och flera set kan skrivas inom
   * samma millisekund. Det sker inte när en människa trycker — men det sker
   * varje gång fritextvägen tolkar "bänk 90x5, 90x5, 90x5" och loopar tre
   * skrivningar direkt efter varandra.
   *
   * Konsekvensen var inte kosmetisk. AI-kontraktet skickar passets set i
   * ordning, och systemprompten säger att *"en till" syftar på senaste setet i
   * currentWorkout*. Med kolliderande tidsstämplar var "senaste" slumpmässigt,
   * så "en till" kunde upprepa fel övning.
   *
   * Att skjuta fram med 1 ms är harmlöst för en träningslogg och gör ordningen
   * korrekt i stället för bara stabil.
   *
   * Kapplöpning: två samtidiga anrop kan läsa samma max. JavaScript är
   * enkeltrådat och båda anropsvägarna (knapptryck och fritextloopen) är
   * sekventiellt awaitade, så det kan inte inträffa i dag. Skulle skrivningar
   * någon gång parallelliseras hör beräkningen hemma inne i transaktionen.
   */
  const senasteISamePass = await database.loggedSets
    .where('workoutId')
    .equals(input.workoutId)
    .toArray();
  const senasteTid = senasteISamePass.reduce<string | null>(
    (max, s) => (max === null || s.performedAt > max ? s.performedAt : max),
    null
  );

  const nu = now();
  const timestamp =
    senasteTid !== null && nu <= senasteTid
      ? new Date(new Date(senasteTid).getTime() + 1).toISOString()
      : nu;

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

export interface WorkoutSummary {
  setCount: number;
  exerciseCount: number;
  volumeKg: number;
  startedAt: string;
}

/**
 * Sammanfattning av ett pass. Uppgift 11B steg 4.2.
 *
 * Två ställen behöver den, och båda löser samma problem: **att man inte ser vad
 * något innehåller förrän det är för sent.**
 *
 * 1. Passvyns sammanfattningsrad — `Set · Volym · Övningar`. Volym är appens
 *    bästa mått på ett pass och stod tidigare ingenstans.
 * 2. Startskärmens "Kopiera förra passet" — i dag vet man inte vad man kopierar
 *    förrän efteråt.
 *
 * Uppvärmningsset räknas INTE i volymen. De är förberedelse, inte arbete, och
 * att blanda in dem gör siffran obrukbar för jämförelser mellan pass.
 */
export async function summarizeWorkout(
  workoutId: string,
  database: GymDatabase = db
): Promise<WorkoutSummary | null> {
  const workout = await database.workouts.get(workoutId);
  if (!workout || workout.isDeleted) return null;

  const sets = await getSetsForWorkout(workoutId, database);
  const arbetsset = sets.filter((s) => !s.isWarmup);

  return {
    setCount: sets.length,
    exerciseCount: new Set(sets.map((s) => s.exerciseId)).size,
    volumeKg: arbetsset.reduce((sum, s) => sum + volumeKg(s.weightKg, s.reps), 0),
    startedAt: workout.startedAt,
  };
}
