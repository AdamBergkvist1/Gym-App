import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from './db';
import { endWorkout, ensureCatalog, logSet, startWorkout } from './repo';
import {
  addExerciseToPlan,
  addSetToPlan,
  confirmPlannedSet,
  copyWorkoutIntoPlan,
  findPreviousWorkoutId,
  getPlan,
  removeExerciseFromPlan,
  removeSetFromPlan,
  unconfirmPlannedSet,
  updatePlannedSet,
  DEFAULT_SET_COUNT,
} from './plan';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';
const KNABOJ = '1c9ac04d-9226-42d1-a47e-ca9b27530e0b';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`plan-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

/** Ett avslutat pass att ha historik från. */
async function tidigarePass(sets: Array<[string, number, number]>) {
  const w = await startWorkout(db);
  for (const [ex, kg, reps] of sets) {
    await logSet({ workoutId: w.id, exerciseId: ex, weightKg: kg, reps }, db);
  }
  await endWorkout(db);
  return w.id;
}

describe('11A.2 planen fylls med spökdata från förra passet', () => {
  it('förifyller vikt och reps från senaste utförandet', async () => {
    await tidigarePass([[BENK, 90, 5]]);
    const w = await startWorkout(db);

    const plan = await addExerciseToPlan(w.id, BENK, db);
    const sets = plan.exercises[0]!.sets;

    expect(sets[0]!.weightKg).toBe(90);
    expect(sets[0]!.reps).toBe(5);
    // Markerad som spökdata: härledd data ska inte se ut som inmatad.
    expect(sets[0]!.fromGhost).toBe(true);
    expect(sets[0]!.loggedSetId).toBeNull();
  });

  it('ger lika många set som förra gången — inte ett fast antal', async () => {
    // Gjorde man fyra set förra passet ska fyra rader dyka upp, annars måste
    // man rätta appen varje gång.
    await tidigarePass([
      [BENK, 90, 5],
      [BENK, 90, 5],
      [BENK, 90, 4],
      [BENK, 85, 5],
    ]);
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    expect(plan.exercises[0]!.sets).toHaveLength(4);
  });

  it('utan historik: tomma rader, inga påhittade vikter', async () => {
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, KNABOJ, db);
    const sets = plan.exercises[0]!.sets;

    expect(sets).toHaveLength(DEFAULT_SET_COUNT);
    expect(sets[0]!.weightKg).toBe(0);
    // Inte spökdata — det finns inget spöke. Att gissa 20 kg vore att hitta på.
    expect(sets[0]!.fromGhost).toBe(false);
  });

  it('lägger inte till samma övning två gånger', async () => {
    const w = await startWorkout(db);
    await addExerciseToPlan(w.id, BENK, db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    expect(plan.exercises).toHaveLength(1);
  });

  it('överlever att appen stängs — planen ligger i Dexie', async () => {
    const w = await startWorkout(db);
    await addExerciseToPlan(w.id, BENK, db);
    db.close();
    await db.open();
    expect((await getPlan(w.id, db)).exercises).toHaveLength(1);
  });
});

describe('11A.3 justering', () => {
  it('en justerad rad är inte längre spökdata utan ett val', async () => {
    await tidigarePass([[BENK, 90, 5]]);
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;

    const efter = await updatePlannedSet(w.id, BENK, setId, { reps: 6 }, db);
    const rad = efter.exercises[0]!.sets[0]!;
    expect(rad.reps).toBe(6);
    expect(rad.fromGhost).toBe(false);
  });

  it('nytt set kopierar det föregående — man kör sällan bara ett', async () => {
    await tidigarePass([[BENK, 90, 5]]);
    const w = await startWorkout(db);
    await addExerciseToPlan(w.id, BENK, db);
    const plan = await addSetToPlan(w.id, BENK, db);
    const sets = plan.exercises[0]!.sets;
    expect(sets[sets.length - 1]!.weightKg).toBe(90);
  });
});

describe('11A.2 avbockning är där ett värde blir data', () => {
  it('skriver setet till loggedSets först vid bekräftelse', async () => {
    await tidigarePass([[BENK, 90, 5]]);
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;

    // Innan bekräftelse finns inget loggat i det nya passet.
    expect(await db.loggedSets.where('workoutId').equals(w.id).count()).toBe(0);

    const { loggedSetId } = await confirmPlannedSet(w.id, BENK, setId, db);

    expect(await db.loggedSets.get(loggedSetId)).toBeDefined();
    expect((await getPlan(w.id, db)).exercises[0]!.sets[0]!.loggedSetId).toBe(loggedSetId);
  });

  it('dubbeltryck loggar inte två set', async () => {
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;

    const a = await confirmPlannedSet(w.id, BENK, setId, db);
    const b = await confirmPlannedSet(w.id, BENK, setId, db);
    expect(b.loggedSetId).toBe(a.loggedSetId);
    expect(await db.loggedSets.where('workoutId').equals(w.id).count()).toBe(1);
  });

  it('ångrad avbockning mjukraderar setet', async () => {
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;

    const { loggedSetId } = await confirmPlannedSet(w.id, BENK, setId, db);
    await unconfirmPlannedSet(w.id, BENK, setId, db);

    expect((await db.loggedSets.get(loggedSetId))?.isDeleted).toBe(true);
    expect((await getPlan(w.id, db)).exercises[0]!.sets[0]!.loggedSetId).toBeNull();
  });

  it('borttagen övning tar med sig sina loggade set', async () => {
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;
    const { loggedSetId } = await confirmPlannedSet(w.id, BENK, setId, db);

    await removeExerciseFromPlan(w.id, BENK, db);

    // Annars hade setet blivit kvar i historiken utan att synas i UI:t.
    expect((await db.loggedSets.get(loggedSetId))?.isDeleted).toBe(true);
    expect((await getPlan(w.id, db)).exercises).toHaveLength(0);
  });

  it('borttagen rad tar med sig sitt loggade set', async () => {
    const w = await startWorkout(db);
    const plan = await addExerciseToPlan(w.id, BENK, db);
    const setId = plan.exercises[0]!.sets[0]!.id;
    const { loggedSetId } = await confirmPlannedSet(w.id, BENK, setId, db);

    await removeSetFromPlan(w.id, BENK, setId, db);
    expect((await db.loggedSets.get(loggedSetId))?.isDeleted).toBe(true);
  });
});

describe('11A.6 kopiera förra passet', () => {
  it('laddar in samma övningar och set som spökdata, utan att logga något', async () => {
    const källa = await tidigarePass([
      [BENK, 90, 5],
      [BENK, 90, 5],
      [KNABOJ, 120, 3],
    ]);
    const w = await startWorkout(db);

    const plan = await copyWorkoutIntoPlan(w.id, källa, db);

    expect(plan.exercises.map((e) => e.exerciseId)).toEqual([BENK, KNABOJ]);
    expect(plan.exercises[0]!.sets).toHaveLength(2);
    expect(plan.exercises[0]!.sets[0]!.weightKg).toBe(90);
    expect(plan.exercises[0]!.sets[0]!.fromGhost).toBe(true);
    // Ingenting loggat än — allt väntar på avbockning.
    expect(await db.loggedSets.where('workoutId').equals(w.id).count()).toBe(0);
  });

  it('behåller övningarnas ordning från källpasset', async () => {
    const källa = await tidigarePass([
      [KNABOJ, 120, 5],
      [BENK, 90, 5],
    ]);
    const w = await startWorkout(db);
    const plan = await copyWorkoutIntoPlan(w.id, källa, db);
    expect(plan.exercises.map((e) => e.exerciseId)).toEqual([KNABOJ, BENK]);
  });

  it('hittar senast avslutade passet med innehåll', async () => {
    const första = await tidigarePass([[BENK, 90, 5]]);
    await new Promise((r) => setTimeout(r, 5));
    const senare = await tidigarePass([[KNABOJ, 100, 5]]);

    const w = await startWorkout(db);
    expect(await findPreviousWorkoutId(w.id, db)).toBe(senare);
    expect(await findPreviousWorkoutId(senare, db)).toBe(första);
  });

  it('hoppar över tomma pass — de går inte att kopiera', async () => {
    const medInnehåll = await tidigarePass([[BENK, 90, 5]]);
    await new Promise((r) => setTimeout(r, 5));
    await startWorkout(db);
    await endWorkout(db); // tomt pass

    expect(await findPreviousWorkoutId(null, db)).toBe(medInnehåll);
  });

  it('ger null när det inte finns något tidigare pass', async () => {
    const w = await startWorkout(db);
    expect(await findPreviousWorkoutId(w.id, db)).toBeNull();
  });
});

describe('planen är arbetsyta, inte data', () => {
  it('synkas ALDRIG — inga utkorgsposter för planen', async () => {
    const w = await startWorkout(db);
    const före = (await db.outbox.toArray()).length;

    await addExerciseToPlan(w.id, BENK, db);
    await addSetToPlan(w.id, BENK, db);
    const plan = await getPlan(w.id, db);
    await updatePlannedSet(w.id, BENK, plan.exercises[0]!.sets[0]!.id, { reps: 9 }, db);

    // Bara passet självt ska ha köats, ingenting från planen.
    expect((await db.outbox.toArray()).length).toBe(före);
  });
});
