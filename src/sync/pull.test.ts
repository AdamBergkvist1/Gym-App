import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from '../db/db';
import { ensureCatalog, logSet, startWorkout } from '../db/repo';
import { pullChanges, type SelectCaller } from './pull';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`pull-test-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

/** Fejkad PostgREST som svarar med förprogrammerade rader per tabell. */
function fakeClient(rows: Record<string, Record<string, unknown>[]>): SelectCaller & {
  cursors: Record<string, string>;
} {
  const cursors: Record<string, string> = {};
  return {
    cursors,
    from(table) {
      return {
        select() {
          return {
            gt(_col, value) {
              cursors[table] = value;
              return {
                order() {
                  return {
                    limit() {
                      const data = (rows[table] ?? []).filter(
                        (r) => String(r['updated_at']) > value
                      );
                      return Promise.resolve({ data, error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

const serverWorkout = (id: string, updatedAt: string) => ({
  id,
  started_at: '2026-07-30T10:00:00.000Z',
  ended_at: null,
  title: 'Från servern',
  note: null,
  is_deleted: false,
  updated_at: updatedAt,
});

describe('7.8 hämtning', () => {
  it('skriver hämtade rader lokalt', async () => {
    const client = fakeClient({ workouts: [serverWorkout('w-1', '2026-07-30T12:00:00.000Z')] });

    const result = await pullChanges(client, db);

    expect(result.written).toBe(1);
    expect((await db.workouts.get('w-1'))?.title).toBe('Från servern');
  });

  it('flyttar markören så att nästa hämtning bara tar nytt', async () => {
    const client = fakeClient({ workouts: [serverWorkout('w-1', '2026-07-30T12:00:00.000Z')] });

    await pullChanges(client, db);
    const andra = await pullChanges(client, db);

    expect(andra.written).toBe(0);
    expect(client.cursors['workouts']).toBe('2026-07-30T12:00:00.000Z');
  });

  it('flyttar INTE markören när ingenting hämtades', async () => {
    const client = fakeClient({ workouts: [] });
    await pullChanges(client, db);
    expect(await db.meta.get('lastPulledAt:workouts')).toBeUndefined();
  });

  it('hoppar över rader utan id eller updated_at i stället för att skriva skräp', async () => {
    const client = fakeClient({
      workouts: [{ id: 'w-2', updated_at: null }, { updated_at: '2026-07-30T12:00:00.000Z' }],
    });
    const result = await pullChanges(client, db);
    expect(result.written).toBe(0);
    expect(await db.workouts.count()).toBe(0);
  });

  it('rapporterar fel i stället för att låtsas ha lyckats', async () => {
    const trasig: SelectCaller = {
      from() {
        return {
          select() {
            return {
              gt() {
                return {
                  order() {
                    return {
                      limit: () =>
                        Promise.resolve({ data: null, error: { message: 'permission denied' } }),
                    };
                  },
                };
              },
            };
          },
        };
      },
    };
    const result = await pullChanges(trasig, db);
    expect(result.error).toBe('permission denied');
    expect(result.written).toBe(0);
  });
});

describe('7.9 lokalt vinner över hämtat', () => {
  it('skriver ALDRIG över en rad som har en väntande utkorgspost', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);

    // Servern påstår att samma pass heter något annat och är raderat.
    const client = fakeClient({
      workouts: [
        {
          ...serverWorkout(w.id, '2099-01-01T00:00:00.000Z'),
          title: 'Serverns version',
          is_deleted: true,
        },
      ],
    });

    const result = await pullChanges(client, db);

    expect(result.skippedLocalWins).toBe(1);
    const lokal = await db.workouts.get(w.id);
    expect(lokal?.title).toBeNull();
    expect(lokal?.isDeleted).toBe(false);
  });

  it('skriver över när kön är tom', async () => {
    const w = await startWorkout(db);
    await db.outbox.clear();

    const client = fakeClient({
      workouts: [{ ...serverWorkout(w.id, '2099-01-01T00:00:00.000Z'), title: 'Serverns version' }],
    });
    await pullChanges(client, db);

    expect((await db.workouts.get(w.id))?.title).toBe('Serverns version');
  });
});

describe('13.1 importerade pass överlever hämtningen', () => {
  it('ett pass med is_imported = true kan hämtas ned och läsas lokalt', async () => {
    const client = fakeClient({
      workouts: [
        { ...serverWorkout('w-imp', '2026-07-30T12:00:00.000Z'), is_imported: true },
        serverWorkout('w-vanligt', '2026-07-30T12:00:00.000Z'),
      ],
    });

    await pullChanges(client, db);

    expect((await db.workouts.get('w-imp'))?.isImported).toBe(true);
    expect((await db.workouts.get('w-vanligt'))?.isImported).toBe(false);
  });
});
