/**
 * Bygger kontexten som skickas till modellen. Uppgift 8.0.
 *
 * Detta är det som skiljer fas 8 från en dyrare fas 4. Utan historiken kan
 * modellen bara tolka meningen; med den kan den resonera om personen bakom.
 *
 * Payloaden går i VARJE anrop, så den är medvetet begränsad: hela katalogen
 * (den behövs för att kunna välja ett giltigt id) men historik bara för de
 * senast tränade övningarna. En obegränsad payload gör varje fritextmiss
 * dyrare och långsammare utan att någon märker det.
 */

import { db, type GymDatabase } from '../db/db';
import { getActiveWorkout, getSetsForWorkout } from '../db/repo';
import { epley1RM } from '../lib/oneRepMax';
import type { AiExerciseHistory, AiExerciseRef, AiParseRequest } from './types';

/** Fler övningar än så tillför brus, inte kontext. */
export const HISTORY_EXERCISE_LIMIT = 12;
/** Hur många set bakåt som räknas som "typiskt" per övning. */
const TYPICAL_WINDOW = 20;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  // Jämnt antal: ta det undre av de två mittersta. Ett medelvärde hade kunnat
  // hitta på en vikt som aldrig lyfts, t.ex. 87,5 mellan 85 och 90.
  return s.length % 2 === 0 ? s[mid - 1]! : s[mid]!;
}

export async function buildAiContext(
  rawText: string,
  database: GymDatabase = db
): Promise<AiParseRequest> {
  const exercises = await database.exercises.toArray();
  const aktiva = exercises.filter((e) => !e.isDeleted && !e.isArchived);

  const catalogue: AiExerciseRef[] = aktiva.map((e) => ({
    id: e.id,
    name: e.name,
    aliases: e.aliases,
  }));

  const namn = new Map(aktiva.map((e) => [e.id, e.name]));

  // --- historik för de senast tränade övningarna ---
  const alla = (await database.loggedSets.toArray()).filter((s) => !s.isDeleted && !s.isWarmup);

  const perÖvning = new Map<string, typeof alla>();
  for (const s of alla) {
    const list = perÖvning.get(s.exerciseId);
    if (list) list.push(s);
    else perÖvning.set(s.exerciseId, [s]);
  }

  const history: AiExerciseHistory[] = [...perÖvning.entries()]
    .map(([exerciseId, rader]) => {
      const sorterade = [...rader].sort((a, b) => (a.performedAt < b.performedAt ? -1 : 1));
      const senaste = sorterade[sorterade.length - 1];
      const fönster = sorterade.slice(-TYPICAL_WINDOW);
      const vikter = fönster.map((s) => s.weightKg);

      let bestE1rm: number | null = null;
      for (const s of sorterade) {
        const e = epley1RM(s.weightKg, s.reps);
        if (e !== null && (bestE1rm === null || e > bestE1rm)) bestE1rm = e;
      }

      return {
        exerciseId,
        name: namn.get(exerciseId) ?? 'Okänd',
        last: senaste
          ? { weightKg: senaste.weightKg, reps: senaste.reps, performedAt: senaste.performedAt }
          : null,
        typical:
          vikter.length === 0
            ? null
            : {
                minKg: Math.min(...vikter),
                maxKg: Math.max(...vikter),
                medianKg: median(vikter),
                medianReps: median(fönster.map((s) => s.reps)),
              },
        bestE1rm,
        totalSets: sorterade.length,
        _senast: senaste?.performedAt ?? '',
      };
    })
    .sort((a, b) => (a._senast < b._senast ? 1 : -1))
    .slice(0, HISTORY_EXERCISE_LIMIT)
    .map(({ _senast, ...rest }) => {
      void _senast;
      return rest;
    });

  // --- pågående pass ---
  const workout = await getActiveWorkout(database);
  const currentWorkout = workout
    ? {
        workoutId: workout.id,
        startedAt: workout.startedAt,
        sets: (await getSetsForWorkout(workout.id, database)).map((s) => ({
          exerciseId: s.exerciseId,
          exerciseName: namn.get(s.exerciseId) ?? 'Okänd',
          weightKg: s.weightKg,
          reps: s.reps,
          setIndex: s.setIndex,
        })),
      }
    : null;

  const profil = await database.meta.get('profile');
  const p = (profil?.value ?? {}) as { unitPreference?: 'kg' | 'lb'; defaultEffortScale?: 'rir' | 'rpe' };

  return {
    rawText,
    clientTime: new Date().toISOString(),
    profile: {
      unitPreference: p.unitPreference ?? 'kg',
      defaultEffortScale: p.defaultEffortScale ?? 'rir',
    },
    catalogue,
    history,
    currentWorkout,
  };
}
