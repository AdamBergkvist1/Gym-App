import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from '../db/db';
import { ensureCatalog, logSet, startWorkout } from '../db/repo';
import { META_ACTIVE_WORKOUT } from '../db/types';
import { META_USER_ID, reconcileOwner } from './ownership';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';
const ADAM = '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e';
const TEST1 = '90628edf-7b89-49f6-8269-09d5f4cef8aa';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`ownership-test-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

/** Ett pass med ett set, som om användaren loggat det. Fyller även utkorgen. */
async function loggaEttPass(): Promise<string> {
  const workout = await startWorkout(db);
  await logSet({ workoutId: workout.id, exerciseId: BENK, weightKg: 80, reps: 5 }, db);
  return workout.id;
}

/** Härmar att en hämtning skett — det är markören som avslöjar en tidigare ägare. */
async function sättHämtningsmarkör(): Promise<void> {
  await db.meta.put({ key: 'lastPulledAt:workouts', value: '2026-07-31T16:43:17.931Z' });
}

describe('reconcileOwner', () => {
  it('adopterar data som loggats i utloggat läge', async () => {
    const workoutId = await loggaEttPass();

    const åtgärd = await reconcileOwner(ADAM, db);

    expect(åtgärd).toBe('adopted');
    // Hela poängen med att appen fungerar utloggad: passet får inte försvinna
    // för att användaren loggar in efteråt.
    expect(await db.workouts.get(workoutId)).toBeDefined();
    expect(await db.loggedSets.count()).toBe(1);
    // Två poster: passet och setet. Kön ska följa med in i det nya kontot,
    // annars går det osynkade passet förlorat vid första inloggningen.
    expect(await db.outbox.count()).toBe(2);
    expect((await db.meta.get(META_USER_ID))?.value).toBe(ADAM);
  });

  it('rensar när markör finns men ägare saknas — en bas fylld av någon vi inte kan identifiera', async () => {
    await loggaEttPass();
    await sättHämtningsmarkör();

    const åtgärd = await reconcileOwner(ADAM, db);

    expect(åtgärd).toBe('wiped');
    expect(await db.workouts.count()).toBe(0);
    expect(await db.loggedSets.count()).toBe(0);
    expect((await db.meta.get(META_USER_ID))?.value).toBe(ADAM);
  });

  it('rensar vid kontobyte', async () => {
    await db.meta.put({ key: META_USER_ID, value: TEST1 });
    await loggaEttPass();

    const åtgärd = await reconcileOwner(ADAM, db);

    expect(åtgärd).toBe('wiped');
    expect(await db.workouts.count()).toBe(0);
    expect(await db.loggedSets.count()).toBe(0);
    expect((await db.meta.get(META_USER_ID))?.value).toBe(ADAM);
  });

  it('rör ingenting när samma konto loggar in igen', async () => {
    await db.meta.put({ key: META_USER_ID, value: ADAM });
    const workoutId = await loggaEttPass();
    await sättHämtningsmarkör();

    const åtgärd = await reconcileOwner(ADAM, db);

    expect(åtgärd).toBe('unchanged');
    expect(await db.workouts.get(workoutId)).toBeDefined();
    expect(await db.outbox.count()).toBe(2);
    expect((await db.meta.get('lastPulledAt:workouts'))?.value).toBe(
      '2026-07-31T16:43:17.931Z'
    );
  });

  it('tömmer utkorgen vid kontobyte, så främmande poster aldrig kan skickas upp', async () => {
    // Kärnan i buggen. `apply_mutations` tar ägaren ur JWT:n och hade skrivit
    // det gamla kontots set till det nya utan att knota. Kön måste vara borta
    // innan `pushOutbox` får se den — därför ligger anropet före push i motorn.
    await db.meta.put({ key: META_USER_ID, value: TEST1 });
    await loggaEttPass();
    expect(await db.outbox.count()).toBeGreaterThan(0);

    await reconcileOwner(ADAM, db);

    expect(await db.outbox.count()).toBe(0);
  });

  it('rensar användarens meta-nycklar men behåller enhetens', async () => {
    await db.meta.put({ key: META_USER_ID, value: TEST1 });
    await db.meta.put({ key: 'profile', value: { unitPreference: 'lb' } });
    await db.meta.put({ key: 'restTimer', value: { endsAt: '2026-08-09T10:00:00.000Z' } });
    await db.meta.put({ key: 'timerDiagnostics', value: [{ kanal: 'notis' }] });
    await loggaEttPass();
    await sättHämtningsmarkör();

    await reconcileOwner(ADAM, db);

    // Beskriver användaren → borta.
    expect(await db.meta.get('profile')).toBeUndefined();
    expect(await db.meta.get(META_ACTIVE_WORKOUT)).toBeUndefined();
    expect(await db.meta.get('lastPulledAt:workouts')).toBeUndefined();
    // Beskriver enheten → kvar. `timerDiagnostics` är mätunderlaget bakom
    // PLAN.md §2.6 och får inte gå förlorat vid ett kontobyte.
    expect(await db.meta.get('restTimer')).toBeDefined();
    expect(await db.meta.get('timerDiagnostics')).toBeDefined();
  });

  it('behåller den globala katalogen — den är inte kontodata', async () => {
    await db.meta.put({ key: META_USER_ID, value: TEST1 });
    await loggaEttPass();
    const före = await db.exercises.count();
    expect(före).toBeGreaterThan(0);

    await reconcileOwner(ADAM, db);

    // Utan omseedningen står parsern utan ordförråd tills appen startas om:
    // `bootstrap.ts` seedar bara vid modulladdning.
    expect(await db.exercises.count()).toBe(före);
    expect(await db.exercises.get(BENK)).toBeDefined();
  });
});
