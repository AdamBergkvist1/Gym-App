import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from '../db/db';
import { ensureCatalog, logSet, startWorkout } from '../db/repo';
import { pushOutbox, retryFailed, type RpcCaller } from './push';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`push-test-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

/** Fejkad RPC som spelar in anropen och kan programmeras att fela. */
function fakeClient(
  behaviour: (batch: unknown[], call: number) => { error?: { message: string; code?: string } } = () => ({})
): RpcCaller & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  let call = 0;
  return {
    calls,
    rpc(_fn, args) {
      const batch = (args['batch'] ?? []) as unknown[];
      calls.push(batch);
      const outcome = behaviour(batch, call++);
      if (outcome.error) return Promise.resolve({ data: null, error: outcome.error });
      return Promise.resolve({
        data: { applied: batch.length, skipped: 0 },
        error: null,
      });
    },
  };
}

async function seedSets(count: number) {
  const w = await startWorkout(db);
  for (let i = 0; i < count; i++) {
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
  }
  return w;
}

describe('7.5 sändaren', () => {
  it('tömmer kön och raderar de skickade posterna', async () => {
    await seedSets(3);
    const client = fakeClient();

    const result = await pushOutbox(client, db);

    expect(result.applied).toBe(4); // ett pass + tre set
    expect(result.blocked).toBe(false);
    expect(await db.outbox.count()).toBe(0);
  });

  it('skickar i FIFO-ordning med passet först', async () => {
    const w = await seedSets(2);
    const client = fakeClient();
    await pushOutbox(client, db);

    const first = client.calls[0] as Array<{ table: string; payload: { id: string } }>;
    expect(first[0]!.table).toBe('workouts');
    expect(first[0]!.payload.id).toBe(w.id);
  });

  it('skickar mutation_id med varje post', async () => {
    await seedSets(1);
    const client = fakeClient();
    await pushOutbox(client, db);

    const batch = client.calls[0] as Array<{ mutation_id: string }>;
    for (const m of batch) expect(m.mutation_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('7.6 felhantering', () => {
  it('låter kön ligga kvar vid nätfel', async () => {
    await seedSets(2);
    const client = fakeClient(() => ({ error: { message: 'Failed to fetch' } }));

    const result = await pushOutbox(client, db);

    expect(result.blocked).toBe(false); // övergående, inte permanent
    expect(await db.outbox.count()).toBe(3);
    expect((await db.outbox.toArray()).every((e) => e.status === 'pending')).toBe(true);
  });

  it('behandlar utgången JWT som övergående', async () => {
    await seedSets(1);
    const client = fakeClient(() => ({ error: { message: 'JWT expired', code: 'PGRST301' } }));

    const result = await pushOutbox(client, db);
    expect(result.blocked).toBe(false);
    expect(await db.outbox.count()).toBe(2);
  });

  it('isolerar den trasiga posten och STOPPAR kön', async () => {
    await seedSets(3);
    // Hela batchen felar; vid enstyckskörning felar bara den tredje posten.
    const client = fakeClient((batch) => {
      if (batch.length > 1) return { error: { message: 'violates foreign key constraint' } };
      const m = batch[0] as { payload: { reps?: number } };
      return m.payload.reps === 5 && (batch[0] as { table: string }).table === 'logged_sets'
        ? { error: { message: 'violates foreign key constraint' } }
        : {};
    });

    const result = await pushOutbox(client, db);

    expect(result.blocked).toBe(true);
    expect(result.error).toMatch(/foreign key/);

    const failed = (await db.outbox.toArray()).filter((e) => e.status === 'failed');
    expect(failed).toHaveLength(1);
    expect(failed[0]!.lastError).toMatch(/foreign key/);
  });

  it('hoppar ALDRIG över en misslyckad post', async () => {
    await seedSets(3);
    const client = fakeClient((batch) => {
      if (batch.length > 1) return { error: { message: 'bad request' } };
      return (batch[0] as { table: string }).table === 'workouts'
        ? { error: { message: 'bad request' } }
        : {};
    });

    await pushOutbox(client, db);

    // Passet är trasigt. Seten som pekar på det får INTE skickas — de skulle
    // fällas av främmandenyckeln och lämna hål i molndatan.
    expect(await db.outbox.where('status').equals('pending').count()).toBe(3);
  });

  it('kan återställa misslyckade poster för nytt försök', async () => {
    await seedSets(1);
    const trasig = fakeClient(() => ({ error: { message: 'bad request' } }));
    await pushOutbox(trasig, db);
    expect(await db.outbox.where('status').equals('failed').count()).toBe(1);

    expect(await retryFailed(db)).toBe(1);
    expect(await db.outbox.where('status').equals('failed').count()).toBe(0);

    const okej = fakeClient();
    const result = await pushOutbox(okej, db);
    expect(result.blocked).toBe(false);
    expect(await db.outbox.count()).toBe(0);
  });
});

describe('7.11 idempotens', () => {
  it('skickas en post två gånger blir den inte en dubblett', async () => {
    await seedSets(1);
    const skickade: string[] = [];
    const client: RpcCaller = {
      rpc(_fn, args) {
        const batch = (args['batch'] ?? []) as Array<{ mutation_id: string }>;
        // Servern kvitterar nycklar den redan sett som "skipped" — precis som
        // sync_mutations gör i apply_mutations.
        let applied = 0;
        let skipped = 0;
        for (const m of batch) {
          if (skickade.includes(m.mutation_id)) skipped++;
          else {
            skickade.push(m.mutation_id);
            applied++;
          }
        }
        return Promise.resolve({ data: { applied, skipped }, error: null });
      },
    };

    const entries = await db.outbox.toArray();
    await pushOutbox(client, db);

    // Simulera att svaret tappades bort: samma poster läggs tillbaka i kön.
    for (const e of entries) {
      const { seq: _seq, ...rest } = e;
      await db.outbox.add(rest as typeof e);
    }
    const andra = await pushOutbox(client, db);

    expect(andra.applied).toBe(0);
    expect(andra.skipped).toBe(2);
    expect(new Set(skickade).size).toBe(2); // inga dubbletter på servern
  });
});

describe('robusthet: kön får aldrig snurra', () => {
  it('stoppar i stället för att loopa när en post saknar seq', async () => {
    // Ett läge som inte SKA kunna uppstå — seq är Dexies primärnyckel. Men
    // filtret i push.ts tog tyst bort sådana poster ur raderingslistan, vilket
    // gjorde att `for(;;)` hämtade samma poster i all oändlighet och frös
    // fliken mitt i ett pass. Testet vaktar att kön stannar i stället.
    const utanSeq = [
      {
        seq: undefined,
        mutationId: '11111111-1111-4111-8111-111111111111',
        table: 'workouts',
        payload: {},
        status: 'pending',
        attempts: 0,
        lastError: null,
      },
    ];

    let hämtningar = 0;
    const fakeDb = {
      outbox: {
        where: () => ({
          anyOf: () => ({
            sortBy: () => {
              hämtningar++;
              // Fler än en handfull rundor betyder att buggen är tillbaka.
              if (hämtningar > 5) throw new Error('EVIGHETSLOOP: kön hämtade om samma poster');
              return Promise.resolve(utanSeq);
            },
          }),
        }),
        bulkDelete: () => Promise.resolve(),
      },
    } as unknown as GymDatabase;

    const result = await pushOutbox(fakeClient(), fakeDb);

    expect(result.blocked).toBe(true);
    expect(result.error).toMatch(/utan seq/);
    expect(hämtningar).toBe(1);
  });
});
