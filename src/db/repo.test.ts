import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from './db';
import {
  createExercise,
  deleteSet,
  endWorkout,
  ensureCatalog,
  getActiveWorkout,
  getLastPerformance,
  getSetsForWorkout,
  loadExerciseRefs,
  logSet,
  pendingCount,
  startWorkout,
} from './repo';
import { isUuidV4 } from '../lib/id';
import { CATALOG } from './catalog';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf'; // Bänkpress
const KNABOJ = '1c9ac04d-9226-42d1-a47e-ca9b27530e0b'; // Knäböj

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`gym-test-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});

afterEach(async () => {
  db.close();
});

describe('5.2 pass', () => {
  it('skapar ett pass med klientgenererat UUID', async () => {
    const w = await startWorkout(db);
    expect(isUuidV4(w.id)).toBe(true);
    expect(w.endedAt).toBeNull();
  });

  it('startar inte ett andra pass när ett redan är aktivt', async () => {
    const first = await startWorkout(db);
    const second = await startWorkout(db);
    expect(second.id).toBe(first.id);
    expect(await db.workouts.count()).toBe(1);
  });

  it('avslutar passet och rensar markören', async () => {
    await startWorkout(db);
    const ended = await endWorkout(db);
    expect(ended?.endedAt).not.toBeNull();
    expect(await getActiveWorkout(db)).toBeNull();
  });

  it('behandlar en inaktuell markör som inget aktivt pass', async () => {
    const w = await startWorkout(db);
    await db.workouts.delete(w.id); // som om raden försvunnit
    expect(await getActiveWorkout(db)).toBeNull();
  });
});

describe('5.3 logSet skriver atomärt till både tabell och utkorg', () => {
  it('skriver setet och en utkorgspost', async () => {
    const w = await startWorkout(db);
    const set = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);

    expect(await db.loggedSets.get(set.id)).toBeDefined();

    const entries = (await db.outbox.toArray()).filter((e) => e.table === 'logged_sets');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.rowId).toBe(set.id);
    expect(entries[0]!.status).toBe('pending');
    expect(isUuidV4(entries[0]!.mutationId)).toBe(true);
  });

  it('utkorgens payload använder serverns fältnamn', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 92.5, reps: 5 }, db);
    const entry = ((await db.outbox.toArray()).filter((e) => e.table === 'logged_sets'))[0]!;

    expect(entry.payload).toMatchObject({
      exercise_id: BENK,
      weight_kg: 92.5,
      reps: 5,
      is_warmup: false,
      source: 'manual',
    });
    // user_id ska ALDRIG skickas — servern tar ägaren ur JWT:n.
    expect(entry.payload).not.toHaveProperty('user_id');
  });

  it('skriver INGENTING när indata är ogiltigt', async () => {
    const w = await startWorkout(db);
    const före = await db.outbox.count();

    await expect(logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 0 }, db))
      .rejects.toThrow();
    await expect(logSet({ workoutId: w.id, exerciseId: BENK, weightKg: -1, reps: 5 }, db))
      .rejects.toThrow();

    expect(await db.loggedSets.count()).toBe(0);
    expect(await db.outbox.count()).toBe(före);
  });

  it('räknar setIndex per övning, inte per pass', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 120, reps: 5 }, db);
    const tredje = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 4 }, db);

    // Bänkpressens andra set ska vara index 1, trots att knäböjen låg emellan.
    expect(tredje.setIndex).toBe(1);
  });

  it('mjukraderar och köar raderingen', async () => {
    const w = await startWorkout(db);
    const set = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await deleteSet(set.id, db);

    expect((await db.loggedSets.get(set.id))?.isDeleted).toBe(true);
    expect(await getSetsForWorkout(w.id, db)).toHaveLength(0);
    const entries = (await db.outbox.toArray()).filter((e) => e.table === 'logged_sets');
    expect(entries).toHaveLength(2); // skapandet + raderingen
  });
});

describe('5.4 spökdata', () => {
  it('ger senaste setet för rätt övning', async () => {
    const w1 = await startWorkout(db);
    await logSet({ workoutId: w1.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w1.id, exerciseId: KNABOJ, weightKg: 120, reps: 5 }, db);
    await endWorkout(db);

    const senaste = await getLastPerformance(BENK, {}, db);
    expect(senaste?.weightKg).toBe(90);
    expect(senaste?.exerciseId).toBe(BENK);
  });

  it('ger null när övningen aldrig gjorts', async () => {
    expect(await getLastPerformance(KNABOJ, {}, db)).toBeNull();
  });

  it('hoppar över det pågående passet — spökdata är FÖRRA passet', async () => {
    const w1 = await startWorkout(db);
    await logSet({ workoutId: w1.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await endWorkout(db);

    const w2 = await startWorkout(db);
    await logSet({ workoutId: w2.id, exerciseId: BENK, weightKg: 95, reps: 3 }, db);

    const spoke = await getLastPerformance(BENK, { excludeWorkoutId: w2.id }, db);
    expect(spoke?.weightKg).toBe(90);
  });

  it('hoppar över raderade och uppvärmningsset', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 60, reps: 10, isWarmup: true }, db);
    const riktigt = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    const senare = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 95, reps: 3 }, db);
    await deleteSet(senare.id, db);

    expect((await getLastPerformance(BENK, {}, db))?.id).toBe(riktigt.id);
  });
});

describe('utkorgen', () => {
  it('räknar osända mutationer', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    // ett pass + ett set
    expect(await pendingCount(db)).toBe(2);
  });

  it('ger unika idempotensnycklar', async () => {
    const w = await startWorkout(db);
    for (let i = 0; i < 20; i++) {
      await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    }
    const entries = await db.outbox.toArray();
    expect(new Set(entries.map((e) => e.mutationId)).size).toBe(entries.length);
  });

  it('behåller FIFO-ordning via seq', async () => {
    const w = await startWorkout(db);
    const a = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    const b = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 4 }, db);

    const entries = await db.outbox.orderBy('seq').toArray();
    // Passet först, sedan setet — den ordningen krävs av apply_mutations.
    expect(entries.map((e) => e.rowId)).toEqual([w.id, a.id, b.id]);
  });
});

describe('katalogen', () => {
  it('seedas och är idempotent', async () => {
    // Antalet läses ur katalogen, inte skrivet som siffra: det testet mäter är
    // att en andra seedning inte skapar dubbletter. Antalet i sig vaktas av
    // `catalog.test.ts` mot databasens kontrollsumma, och en hårdkodad siffra
    // här hade bara gjort varje framtida katalogändring till två röda tester.
    expect(await db.exercises.count()).toBe(CATALOG.length);
    await ensureCatalog(db);
    expect(await db.exercises.count()).toBe(CATALOG.length);
  });
});

describe('5.9 skapa egen övning från en parsermiss', () => {
  it('skapar övningen och köar den', async () => {
    const ex = await createExercise('Nackpress', db);
    expect(ex.name).toBe('Nackpress');
    expect(ex.normalizedName).toBe('nackpress');
    // Namnet blir sitt eget alias, annars hittar parsern den inte.
    expect(ex.aliases).toContain('nackpress');

    const entries = (await db.outbox.toArray()).filter((e) => e.table === 'exercises');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.payload).not.toHaveProperty('owner_id');
  });

  it('är idempotent — samma namn ger samma rad', async () => {
    const a = await createExercise('Nackpress', db);
    const b = await createExercise('  nackpress  ', db);
    expect(b.id).toBe(a.id);
    expect((await db.outbox.toArray()).filter((e) => e.table === 'exercises')).toHaveLength(1);
  });

  it('vägrar tomt namn', async () => {
    await expect(createExercise('   ', db)).rejects.toThrow();
  });

  it('gör övningen sökbar för parsern direkt', async () => {
    await createExercise('Nackpress', db);
    const refs = await loadExerciseRefs(db);
    expect(refs.some((r) => r.normalizedName === 'nackpress')).toBe(true);
  });
});

describe('ordningen på ett passets set är deterministisk', () => {
  it('behåller loggningsordningen även när set skrivs i samma millisekund', async () => {
    // Regression för fyndet 2026-08-04. CI föll på context.test.ts medan samma
    // test passerade lokalt: en snabbare maskin hinner logga flera set inom
    // samma millisekund, och då avgjorde Dexies UUID-ordning.
    //
    // Loopen härmar fritextvägen, som tolkar "bänk 90x5, 90x5, 90x5" och skriver
    // tre set direkt efter varandra utan paus.
    const w = await startWorkout(db);
    const övningar = (await db.exercises.toArray()).slice(0, 6);

    for (const e of övningar) {
      await logSet({ workoutId: w.id, exerciseId: e.id, weightKg: 60, reps: 5 }, db);
    }

    const sets = await getSetsForWorkout(w.id, db);
    expect(sets.map((s) => s.exerciseId)).toEqual(övningar.map((e) => e.id));

    // Tidsstämplarna ska dessutom vara strikt växande — det är den garantin
    // som gör ordningen korrekt och inte bara stabil.
    const tider = sets.map((s) => s.performedAt);
    expect(tider).toEqual([...tider].sort());
    expect(new Set(tider).size).toBe(tider.length);
  });
});

describe('13.1 importflaggan når utkorgen', () => {
  it('bär is_imported i utkorgens payload, inte bara i den lokala raden', async () => {
    const w = await startWorkout(db);

    const entry = (await db.outbox.toArray()).find(
      (e) => e.table === 'workouts' && e.rowId === w.id
    )!;

    // Nyckeln måste FINNAS, inte bara vara falsk. Ett fält som tappas på väg
    // till utkorgen är osynligt lokalt — passet ser rätt ut i appen och blir
    // fel först på nästa enhet, vilket är exakt den sortens tysta fel som
    // hela synken är byggd för att undvika.
    expect(Object.hasOwn(entry.payload, 'is_imported')).toBe(true);
    expect(entry.payload['is_imported']).toBe(false);
  });
});
