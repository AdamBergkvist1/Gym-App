/**
 * Historikfrågor. Uppgift 9.1–9.4.
 *
 * Allt räknas i klienten ur Dexie. `personal_records` finns medvetet inte som
 * tabell (PLAN.md §2.4): e1RM är en multiplikation per set, och att
 * materialisera det innan vi mätt att det är långsamt vore att bygga före
 * mätning. Blir det trögt vid tiotusentals set är det då det ska cachas.
 */

import { epley1RM, volumeKg } from '../lib/oneRepMax';
import { db, type GymDatabase } from './db';
import type { LocalSet, LocalWorkout } from './types';

export interface WorkoutSummary {
  workout: LocalWorkout;
  /** Alla loggade set, uppvärmning inräknad — de gjordes. */
  setCount: number;
  /** Bara arbetsset. Uppvärmning är förberedelse, inte arbete. */
  totalVolumeKg: number;
  /** Övningsnamn i den ordning de först dök upp i passet. */
  exerciseIds: string[];
  durationMinutes: number | null;
}

export interface ExercisePoint {
  setId: string;
  performedAt: string;
  weightKg: number;
  reps: number;
  /** null när repsen ligger utanför spannet där formeln betyder något. */
  e1rm: number | null;
  /**
   * Ur Adams gamla anteckningar (13.1), inte loggat i appen. Punkten är verklig
   * men datumet är uppskattat ur ett veckonummer — därför textraden i 13.5.
   */
  isImported: boolean;
}

export interface PersonalRecords {
  exerciseId: string;
  /** Tyngsta enskilda set, oavsett reps. */
  heaviest: LocalSet | null;
  /** Setet med högst estimerat 1RM — det verkliga styrkerekordet. */
  bestE1rm: { set: LocalSet; e1rm: number } | null;
  totalSets: number;
}

function byPerformedAt(a: LocalSet, b: LocalSet): number {
  return a.performedAt < b.performedAt ? -1 : a.performedAt > b.performedAt ? 1 : 0;
}

/** Avslutade och pågående pass, nyast först. */
export async function listWorkoutSummaries(
  limit = 50,
  database: GymDatabase = db
): Promise<WorkoutSummary[]> {
  // Importerade pass (13.3) hör inte hemma i passlistan: de är rader ur Adams
  // gamla anteckningar, inte pass han genomfört i appen, och deras datum är
  // uppskattade. Filtret ligger FÖRE slice — annars hade 17 importerade pass
  // kunnat äta upp hela limiten och lämna listan tom.
  const workouts = (await database.workouts.orderBy('startedAt').reverse().toArray())
    .filter((w) => !w.isDeleted && !w.isImported)
    .slice(0, limit);
  if (workouts.length === 0) return [];

  const ids = new Set(workouts.map((w) => w.id));
  const sets = (await database.loggedSets.toArray()).filter(
    (s) => !s.isDeleted && ids.has(s.workoutId)
  );

  const perWorkout = new Map<string, LocalSet[]>();
  for (const s of sets) {
    const list = perWorkout.get(s.workoutId);
    if (list) list.push(s);
    else perWorkout.set(s.workoutId, [s]);
  }

  return workouts.map((workout) => {
    const rows = (perWorkout.get(workout.id) ?? []).sort(byPerformedAt);
    const exerciseIds: string[] = [];
    for (const s of rows) if (!exerciseIds.includes(s.exerciseId)) exerciseIds.push(s.exerciseId);

    // Uppvärmningsset räknas INTE i volymen — samma regel som `summarizeWorkout`
    // i repo.ts och som `getExerciseHistory`/`getPersonalRecords` längre ner i den
    // här filen. De är förberedelse, inte arbete, och att blanda in dem gör siffran
    // obrukbar för jämförelser mellan pass. Saknades här fram till 12.16, vilket gav
    // historiken och startskärmen olika volym för samma pass.
    const arbetsset = rows.filter((s) => !s.isWarmup);
    const totalVolumeKg = arbetsset.reduce((sum, s) => sum + volumeKg(s.weightKg, s.reps), 0);
    const durationMinutes =
      workout.endedAt === null
        ? null
        : Math.max(
            0,
            Math.round(
              (new Date(workout.endedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000
            )
          );

    return {
      workout,
      setCount: rows.length,
      // Avrundas INTE. Halvkilon är verkliga vikter (2,5 kg-skivor), och 12.18
      // avgjorde att de ska synas. `summarizeWorkout` i repo.ts returnerar också
      // orörd summa — divergerar de igen fångas det av testet i history.test.ts.
      totalVolumeKg,
      exerciseIds,
      durationMinutes,
    };
  });
}

export async function getWorkoutSets(
  workoutId: string,
  database: GymDatabase = db
): Promise<LocalSet[]> {
  const rows = await database.loggedSets.where('workoutId').equals(workoutId).toArray();
  return rows.filter((s) => !s.isDeleted).sort(byPerformedAt);
}

/** Alla set för en övning över tid, äldst först — grafens x-axel. */
export async function getExerciseHistory(
  exerciseId: string,
  database: GymDatabase = db
): Promise<ExercisePoint[]> {
  const rows = await database.loggedSets
    .where('[exerciseId+performedAt]')
    .between([exerciseId, ''], [exerciseId, '￿'])
    .toArray();

  return rows
    .filter((s) => !s.isDeleted && !s.isWarmup)
    .sort(byPerformedAt)
    .map((s) => ({
      setId: s.id,
      performedAt: s.performedAt,
      weightKg: s.weightKg,
      reps: s.reps,
      e1rm: epley1RM(s.weightKg, s.reps),
      isImported: s.source === 'import',
    }));
}

export async function getPersonalRecords(
  exerciseId: string,
  database: GymDatabase = db
): Promise<PersonalRecords> {
  const rows = (
    await database.loggedSets
      .where('[exerciseId+performedAt]')
      .between([exerciseId, ''], [exerciseId, '￿'])
      .toArray()
  ).filter((s) => !s.isDeleted && !s.isWarmup);

  let heaviest: LocalSet | null = null;
  let bestE1rm: { set: LocalSet; e1rm: number } | null = null;

  for (const s of rows) {
    if (!heaviest || s.weightKg > heaviest.weightKg) heaviest = s;
    const e = epley1RM(s.weightKg, s.reps);
    if (e !== null && (!bestE1rm || e > bestE1rm.e1rm)) bestE1rm = { set: s, e1rm: e };
  }

  return { exerciseId, heaviest, bestE1rm, totalSets: rows.length };
}

/** Övningar användaren faktiskt har loggat, nyast först. Driver historiklistan. */
export async function listTrainedExercises(
  database: GymDatabase = db
): Promise<Array<{ exerciseId: string; lastPerformedAt: string; setCount: number }>> {
  const rows = (await database.loggedSets.toArray()).filter((s) => !s.isDeleted);
  const map = new Map<string, { lastPerformedAt: string; setCount: number }>();
  for (const s of rows) {
    const current = map.get(s.exerciseId);
    if (!current) map.set(s.exerciseId, { lastPerformedAt: s.performedAt, setCount: 1 });
    else {
      current.setCount++;
      if (s.performedAt > current.lastPerformedAt) current.lastPerformedAt = s.performedAt;
    }
  }
  return [...map.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => (a.lastPerformedAt < b.lastPerformedAt ? 1 : -1));
}
