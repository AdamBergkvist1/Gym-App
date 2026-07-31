import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from '../db/db';
import {
  adjustRestTimer,
  cancelRestTimer,
  formatRemaining,
  getRestTimer,
  hasExpired,
  markFired,
  remainingMs,
  startRestTimer,
} from './restTimer';
import { recordTimerEvent, getTimerEvents, summarise, type TimerEvent } from './diagnostics';

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`timer-test-${++n}-${Date.now()}`);
  await db.open();
});
afterEach(() => db.close());

describe('6.1 timern lagras som sluttidpunkt', () => {
  it('räknar kvarvarande tid från klockan, inte från en räknare', async () => {
    const state = await startRestTimer(180, null, db);

    // Simulerar att appen legat i bakgrunden i två minuter och att alla
    // intervall strypts. Med en nedräknande räknare hade siffran varit fel;
    // här härleds den ur endsAt.
    const om2min = new Date(state.startedAt).getTime() + 120_000;
    expect(Math.round(remainingMs(state, om2min) / 1000)).toBe(60);
  });

  it('överlever att läsas tillbaka från databasen', async () => {
    await startRestTimer(90, 'set-1', db);
    const läst = await getRestTimer(db);
    expect(läst?.durationSeconds).toBe(90);
    expect(läst?.setId).toBe('set-1');
    expect(läst?.firedAt).toBeNull();
  });

  it('vet när den gått ut', async () => {
    const state = await startRestTimer(60, null, db);
    const efter = new Date(state.endsAt).getTime() + 1;
    expect(hasExpired(state, efter)).toBe(true);
    expect(hasExpired(state, new Date(state.endsAt).getTime() - 1000)).toBe(false);
  });

  it('justerar sluttiden och nollställer larmet', async () => {
    const start = await startRestTimer(60, null, db);
    await markFired(db);
    expect((await getRestTimer(db))?.firedAt).not.toBeNull();

    const efter = await adjustRestTimer(30, db);
    expect(efter?.firedAt).toBeNull();
    expect(new Date(efter!.endsAt).getTime() - new Date(start.endsAt).getTime()).toBe(30_000);
  });

  it('markerar larmet bara en gång', async () => {
    await startRestTimer(1, null, db);
    await markFired(db);
    const första = (await getRestTimer(db))!.firedAt;
    await markFired(db);
    expect((await getRestTimer(db))!.firedAt).toBe(första);
  });

  it('går att avbryta', async () => {
    await startRestTimer(60, null, db);
    await cancelRestTimer(db);
    expect(await getRestTimer(db)).toBeNull();
  });
});

describe('formatRemaining', () => {
  it('formaterar mm:ss', () => {
    expect(formatRemaining(180_000)).toBe('3:00');
    expect(formatRemaining(65_000)).toBe('1:05');
    expect(formatRemaining(9_000)).toBe('0:09');
  });

  it('går aldrig under noll — en negativ siffra hjälper ingen', () => {
    expect(formatRemaining(-5_000)).toBe('0:00');
  });
});

describe('diagnostiken svarar på frågan från 0.8', () => {
  const event = (p: Partial<TimerEvent>): TimerEvent => ({
    dueAt: '2026-07-31T12:00:00.000Z',
    firedAt: '2026-07-31T12:00:00.000Z',
    driftSeconds: 0,
    wasHidden: true,
    firedOnResume: false,
    durationSeconds: 180,
    ...p,
  });

  it('säger ifrån när underlaget är för tunt i stället för att visa en siffra', () => {
    expect(summarise([])).toMatch(/Inga larm/);
    expect(summarise([event({ wasHidden: false })])).toMatch(/obesvarad/);
  });

  it('flaggar när larmet kom först vid återkomst — det farliga felläget', () => {
    const s = summarise([event({ firedOnResume: true, driftSeconds: 240 })]);
    expect(s).toMatch(/iOS fryser timern/);
  });

  it('flaggar sena larm', () => {
    expect(summarise([event({ driftSeconds: 42 })])).toMatch(/sena/);
  });

  it('godkänner när larmen kom i tid i bakgrunden', () => {
    expect(summarise([event({ driftSeconds: 1 })])).toMatch(/^✅/);
  });

  it('sparar händelser med nyast först', async () => {
    await recordTimerEvent(event({ driftSeconds: 1 }), db);
    await recordTimerEvent(event({ driftSeconds: 2 }), db);
    const rader = await getTimerEvents(db);
    expect(rader[0]!.driftSeconds).toBe(2);
    expect(rader).toHaveLength(2);
  });
});
