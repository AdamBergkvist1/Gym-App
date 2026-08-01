import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from '../db/db';
import { endWorkout, ensureCatalog, logSet, startWorkout } from '../db/repo';
import { buildAiContext, HISTORY_EXERCISE_LIMIT } from './context';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';
const KNABOJ = '1c9ac04d-9226-42d1-a47e-ca9b27530e0b';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`ai-ctx-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

describe('8.0 kontraktet innehåller katalogen', () => {
  it('skickar med alla övningar med id, namn och alias', async () => {
    const ctx = await buildAiContext('bänk 90x5', db);
    expect(ctx.catalogue.length).toBeGreaterThanOrEqual(45);
    const benk = ctx.catalogue.find((e) => e.id === BENK);
    expect(benk?.name).toBe('Bänkpress');
    expect(benk?.aliases).toContain('bänk');
  });

  it('bär råtexten och klientens tid', async () => {
    const ctx = await buildAiContext('samma som förra gången', db);
    expect(ctx.rawText).toBe('samma som förra gången');
    expect(Number.isNaN(Date.parse(ctx.clientTime))).toBe(false);
  });
});

describe('8.0 kontraktet innehåller HISTORIKEN — annars är det ingen coach', () => {
  it('ger senaste utförandet per övning, så "samma som förra gången" betyder något', async () => {
    const w1 = await startWorkout(db);
    await logSet({ workoutId: w1.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await endWorkout(db);

    const ctx = await buildAiContext('samma som sist', db);
    const benk = ctx.history.find((h) => h.exerciseId === BENK);
    expect(benk?.last?.weightKg).toBe(90);
    expect(benk?.last?.reps).toBe(5);
  });

  it('ger ett typiskt spann, så att ett orimligt värde går att känna igen', async () => {
    const w = await startWorkout(db);
    for (const kg of [80, 85, 90, 90, 95]) {
      await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: kg, reps: 5 }, db);
    }
    await endWorkout(db);

    const benk = (await buildAiContext('bänk', db)).history.find((h) => h.exerciseId === BENK);
    expect(benk?.typical?.minKg).toBe(80);
    expect(benk?.typical?.maxKg).toBe(95);
    expect(benk?.typical?.medianKg).toBe(90);
    expect(benk?.typical?.medianReps).toBe(5);
  });

  it('ger bästa e1RM per övning', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 100, reps: 5 }, db);
    await endWorkout(db);

    const benk = (await buildAiContext('bänk', db)).history.find((h) => h.exerciseId === BENK);
    expect(benk?.bestE1rm).toBe(116.7);
  });

  it('tar bara med övningar som faktiskt tränats — inte alla 45', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await endWorkout(db);

    const ctx = await buildAiContext('bänk', db);
    expect(ctx.history).toHaveLength(1);
    expect(ctx.history[0]!.exerciseId).toBe(BENK);
  });

  it('ger tom historik för en ny användare i stället för att fela', async () => {
    const ctx = await buildAiContext('bänk 90x5', db);
    expect(ctx.history).toEqual([]);
    expect(ctx.currentWorkout).toBeNull();
  });

  it('begränsar antalet övningar så att payloaden inte växer obegränsat', async () => {
    const w = await startWorkout(db);
    const ids = (await db.exercises.toArray()).slice(0, HISTORY_EXERCISE_LIMIT + 5);
    for (const e of ids) {
      await logSet({ workoutId: w.id, exerciseId: e.id, weightKg: 50, reps: 5 }, db);
    }
    const ctx = await buildAiContext('bänk', db);
    expect(ctx.history).toHaveLength(HISTORY_EXERCISE_LIMIT);
  });
});

describe('8.0 kontraktet innehåller det pågående passet', () => {
  it('så att "en till" och "samma igen" har något att syfta på', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 120, reps: 3 }, db);

    const ctx = await buildAiContext('en till', db);
    expect(ctx.currentWorkout?.workoutId).toBe(w.id);
    expect(ctx.currentWorkout?.sets).toHaveLength(2);
    expect(ctx.currentWorkout?.sets[0]).toMatchObject({
      exerciseId: BENK,
      exerciseName: 'Bänkpress',
      weightKg: 90,
      reps: 5,
    });
  });

  it('är null när inget pass pågår', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await endWorkout(db);
    expect((await buildAiContext('bänk', db)).currentWorkout).toBeNull();
  });
});

describe('8.0 payloaden håller sig liten', () => {
  it('ryms i en rimlig storlek även med full historik', async () => {
    const w = await startWorkout(db);
    const alla = await db.exercises.toArray();
    for (const e of alla) {
      await logSet({ workoutId: w.id, exerciseId: e.id, weightKg: 60, reps: 8 }, db);
    }
    const ctx = await buildAiContext('bänk 90x5', db);
    const bytes = JSON.stringify(ctx).length;
    // Payloaden går i VARJE anrop. Växer den okontrollerat blir varje
    // fritextmiss dyrare och långsammare utan att någon märker det.
    expect(bytes, `payloaden är ${bytes} tecken`).toBeLessThan(20_000);
  });
});
