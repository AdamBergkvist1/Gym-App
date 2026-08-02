/**
 * Passets plan. Uppgift 11A.1, 11A.2, 11A.6.
 *
 * Ritningen kräver set som SYNS innan de loggas: man ska se förra passets
 * siffror som spökdata, justera med + och −, och sedan bocka av. Det behövs
 * alltså ett mellanled mellan "inget" och "loggat set".
 *
 * Planen är det mellanledet. Den ligger i Dexie och inte i komponentstate,
 * eftersom den måste överleva att appen stängs mitt i ett pass — det gör den
 * hela tiden på ett gym.
 *
 * **Planen synkas ALDRIG.** Den är arbetsyta, inte data. Bara bekräftade set
 * hamnar i `loggedSets` och i utkorgen. En halvfärdig plan har inget värde för
 * någon annan enhet, och att synka den hade gjort utkorgen full av brus.
 */

import { newId } from '../lib/id';
import { db, type GymDatabase } from './db';
import { getLastPerformance, logSet, deleteSet } from './repo';
import { getWorkoutSets } from './history';

/** Utan historik: så många set en övning får när den läggs till. */
export const DEFAULT_SET_COUNT = 3;

export interface PlannedSet {
  id: string;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  /** Sätts när setet bekräftats och skrivits till `loggedSets`. */
  loggedSetId: string | null;
  /**
   * Värdena kommer från förra passet och är inte bekräftade. Styr att raden
   * visas dämpad — härledd data ska inte se ut som inmatad data.
   */
  fromGhost: boolean;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: PlannedSet[];
}

export interface WorkoutPlan {
  workoutId: string;
  exercises: PlannedExercise[];
  updatedAt: string;
}

const now = () => new Date().toISOString();

function emptyPlan(workoutId: string): WorkoutPlan {
  return { workoutId, exercises: [], updatedAt: now() };
}

export async function getPlan(
  workoutId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  return (await database.plans.get(workoutId)) ?? emptyPlan(workoutId);
}

async function save(plan: WorkoutPlan, database: GymDatabase): Promise<WorkoutPlan> {
  const next = { ...plan, updatedAt: now() };
  await database.plans.put(next);
  return next;
}

function ghostSet(weightKg: number, reps: number, fromGhost: boolean): PlannedSet {
  return { id: newId(), weightKg, reps, isWarmup: false, loggedSetId: null, fromGhost };
}

/**
 * Lägger till en övning med set förifyllda från förra gången.
 *
 * Antalet set kommer också från historiken: gjorde man fyra set bänkpress
 * förra passet är det fyra rader som dyker upp, inte tre. Det är skillnaden
 * mellan att slippa tänka och att behöva rätta appen varje gång.
 */
export async function addExerciseToPlan(
  workoutId: string,
  exerciseId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  if (plan.exercises.some((e) => e.exerciseId === exerciseId)) return plan;

  const senaste = await getLastPerformance(exerciseId, { excludeWorkoutId: workoutId }, database);

  let sets: PlannedSet[];
  if (senaste) {
    const tidigare = (await database.loggedSets.toArray()).filter(
      (s) => s.exerciseId === exerciseId && s.workoutId === senaste.workoutId && !s.isDeleted && !s.isWarmup
    );
    const antal = Math.max(1, Math.min(tidigare.length, 10));
    sets = Array.from({ length: antal }, () => ghostSet(senaste.weightKg, senaste.reps, true));
  } else {
    // Ingen historik: tomma rader som måste fyllas i. Att gissa 20 kg vore
    // att hitta på data.
    sets = Array.from({ length: DEFAULT_SET_COUNT }, () => ghostSet(0, 8, false));
  }

  return save({ ...plan, exercises: [...plan.exercises, { exerciseId, sets }] }, database);
}

export async function removeExerciseFromPlan(
  workoutId: string,
  exerciseId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  const övning = plan.exercises.find((e) => e.exerciseId === exerciseId);

  // Redan loggade set i övningen tas bort på riktigt — annars skulle de bli
  // kvar i historiken utan att synas i UI:t.
  for (const s of övning?.sets ?? []) {
    if (s.loggedSetId) await deleteSet(s.loggedSetId, database);
  }

  return save(
    { ...plan, exercises: plan.exercises.filter((e) => e.exerciseId !== exerciseId) },
    database
  );
}

/** Nytt set kopierar det föregående — man kör sällan bara ett. */
export async function addSetToPlan(
  workoutId: string,
  exerciseId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  return save(
    {
      ...plan,
      exercises: plan.exercises.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sist = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, ghostSet(sist?.weightKg ?? 0, sist?.reps ?? 8, false)],
        };
      }),
    },
    database
  );
}

export async function removeSetFromPlan(
  workoutId: string,
  exerciseId: string,
  setId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  const rad = plan.exercises
    .find((e) => e.exerciseId === exerciseId)
    ?.sets.find((s) => s.id === setId);
  if (rad?.loggedSetId) await deleteSet(rad.loggedSetId, database);

  return save(
    {
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      ),
    },
    database
  );
}

/** Justering via + / − eller direktinmatning. */
export async function updatePlannedSet(
  workoutId: string,
  exerciseId: string,
  setId: string,
  patch: Partial<Pick<PlannedSet, 'weightKg' | 'reps' | 'isWarmup'>>,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  return save(
    {
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                // Rör man siffrorna är de inte längre spökdata utan ett val.
                s.id === setId ? { ...s, ...patch, fromGhost: false } : s
              ),
            }
          : e
      ),
    },
    database
  );
}

/**
 * Bockar av ett set: skriver det till `loggedSets` och kopplar id:t till planen.
 *
 * Det är HÄR ett planerat värde blir data. Innan detta har ingenting sparats,
 * vilket är hela poängen med att spökdatan är förifylld — den kräver en
 * medveten bekräftelse, till skillnad från ett fält man råkar lämna orört.
 */
export async function confirmPlannedSet(
  workoutId: string,
  exerciseId: string,
  setId: string,
  database: GymDatabase = db
): Promise<{ plan: WorkoutPlan; loggedSetId: string }> {
  const plan = await getPlan(workoutId, database);
  const rad = plan.exercises
    .find((e) => e.exerciseId === exerciseId)
    ?.sets.find((s) => s.id === setId);

  if (!rad) throw new Error(`planerat set ${setId} finns inte`);
  if (rad.loggedSetId) return { plan, loggedSetId: rad.loggedSetId };

  const loggat = await logSet(
    {
      workoutId,
      exerciseId,
      weightKg: rad.weightKg,
      reps: rad.reps,
      isWarmup: rad.isWarmup,
      source: 'manual',
    },
    database
  );

  const next = await save(
    {
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, loggedSetId: loggat.id, fromGhost: false } : s
              ),
            }
          : e
      ),
    },
    database
  );

  return { plan: next, loggedSetId: loggat.id };
}

/**
 * Kopplar ett REDAN loggat set till planen, som en färdigbockad rad.
 *
 * Fritext- och AI-vägen skriver direkt till `loggedSets` utan att gå via
 * planen. Utan den här funktionen hamnar setet i databasen men syns aldrig i
 * passvyn — det ser ut som dataförlust fast det bara är osynlighet, vilket är
 * ett värre fel eftersom man då loggar om samma set.
 *
 * Planen är visningsmodellen. Allt som loggas i ett pass ska finnas i den.
 */
export async function attachLoggedSetToPlan(
  workoutId: string,
  input: {
    exerciseId: string;
    loggedSetId: string;
    weightKg: number;
    reps: number;
    isWarmup?: boolean;
  },
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);

  const rad: PlannedSet = {
    id: newId(),
    weightKg: input.weightKg,
    reps: input.reps,
    isWarmup: input.isWarmup ?? false,
    loggedSetId: input.loggedSetId,
    fromGhost: false,
  };

  const finns = plan.exercises.some((e) => e.exerciseId === input.exerciseId);

  return save(
    {
      ...plan,
      exercises: finns
        ? plan.exercises.map((e) =>
            e.exerciseId === input.exerciseId ? { ...e, sets: [...e.sets, rad] } : e
          )
        : [...plan.exercises, { exerciseId: input.exerciseId, sets: [rad] }],
    },
    database
  );
}

/** Ångra en avbockning. Setet mjukraderas och raden blir redigerbar igen. */
export async function unconfirmPlannedSet(
  workoutId: string,
  exerciseId: string,
  setId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const plan = await getPlan(workoutId, database);
  const rad = plan.exercises
    .find((e) => e.exerciseId === exerciseId)
    ?.sets.find((s) => s.id === setId);
  if (rad?.loggedSetId) await deleteSet(rad.loggedSetId, database);

  return save(
    {
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, loggedSetId: null } : s)) }
          : e
      ),
    },
    database
  );
}

/**
 * "Kopiera förra passet". Uppgift 11A.6.
 *
 * Laddar in samma övningar och samma set som ett tidigare pass, med de gamla
 * siffrorna som spökdata. Ingenting loggas — allt väntar på avbockning.
 */
export async function copyWorkoutIntoPlan(
  targetWorkoutId: string,
  sourceWorkoutId: string,
  database: GymDatabase = db
): Promise<WorkoutPlan> {
  const källa = await getWorkoutSets(sourceWorkoutId, database);

  const perÖvning = new Map<string, PlannedSet[]>();
  const ordning: string[] = [];
  for (const s of källa) {
    if (s.isWarmup) continue;
    if (!perÖvning.has(s.exerciseId)) {
      perÖvning.set(s.exerciseId, []);
      ordning.push(s.exerciseId);
    }
    perÖvning.get(s.exerciseId)!.push(ghostSet(s.weightKg, s.reps, true));
  }

  const plan = await getPlan(targetWorkoutId, database);
  return save(
    {
      ...plan,
      exercises: ordning.map((exerciseId) => ({
        exerciseId,
        sets: perÖvning.get(exerciseId) ?? [],
      })),
    },
    database
  );
}

/** Senast avslutade passet — källan för "kopiera förra passet". */
export async function findPreviousWorkoutId(
  excludeWorkoutId: string | null,
  database: GymDatabase = db
): Promise<string | null> {
  const pass = (await database.workouts.orderBy('startedAt').reverse().toArray()).filter(
    (w) => !w.isDeleted && w.id !== excludeWorkoutId && w.endedAt !== null
  );
  for (const w of pass) {
    const antal = await database.loggedSets.where('workoutId').equals(w.id).count();
    if (antal > 0) return w.id;
  }
  return null;
}

export async function clearPlan(workoutId: string, database: GymDatabase = db): Promise<void> {
  await database.plans.delete(workoutId);
}
