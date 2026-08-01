import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from './db';
import { getParseStats, recordParseAttempt, setParseOutcome } from './parseLog';
import type { ParsedSet } from '../parser/types';

const set = (p: Partial<ParsedSet> = {}): ParsedSet => ({
  exerciseId: '38433903-c5f6-41e4-b2e8-4f0587b6d0cf',
  exerciseName: 'Bänkpress',
  weightKg: 90,
  reps: 5,
  effortType: null,
  effortValue: null,
  note: null,
  unitSource: 'profile',
  confidence: 'high',
  ...p,
});

let db: GymDatabase;
let n = 0;

beforeEach(async () => {
  db = createTestDb(`parselog-${++n}-${Date.now()}`);
  await db.open();
});
afterEach(() => db.close());

describe('8.10 varje tolkningsförsök loggas och köas', () => {
  it('skriver raden och en utkorgspost i samma transaktion', async () => {
    const id = await recordParseAttempt({ rawText: 'bänk 90x5', parser: 'local', sets: [set()] }, db);

    expect(await db.parseLog.get(id)).toBeDefined();
    const köade = (await db.outbox.toArray()).filter((e) => e.table === 'ai_parse_log');
    expect(köade).toHaveLength(1);
    expect(köade[0]!.rowId).toBe(id);
  });

  it('payloaden använder serverns fältnamn och saknar user_id', async () => {
    await recordParseAttempt(
      { rawText: 'bänk 90x5', parser: 'llm', sets: [set()], provider: 'groq', model: 'x', latencyMs: 900 },
      db
    );
    const e = (await db.outbox.toArray()).filter((x) => x.table === 'ai_parse_log')[0]!;
    expect(e.payload).toMatchObject({
      raw_text: 'bänk 90x5',
      parser: 'llm',
      provider: 'groq',
      latency_ms: 900,
    });
    expect(e.payload).not.toHaveProperty('user_id');
  });

  it('förvalet är REJECTED — en rad som aldrig ledde till ett set är inte accepterad', async () => {
    // Att i stället anta accepted hade gjort statistiken systematiskt för
    // snäll, och en mätning som smickrar sig själv är värdelös.
    const id = await recordParseAttempt({ rawText: 'x', parser: 'local', sets: [set()] }, db);
    expect((await db.parseLog.get(id))?.outcome).toBe('rejected');
  });

  it('sparar modellens motivering, men inte mer än nödvändigt', async () => {
    const id = await recordParseAttempt(
      { rawText: 'samma som sist', parser: 'llm', sets: [set({ reasoning: 'förra passet' })] },
      db
    );
    const rad = await db.parseLog.get(id);
    const parsed = rad?.parsed as Array<Record<string, unknown>>;
    expect(parsed[0]!['reasoning']).toBe('förra passet');
    expect(parsed[0]).not.toHaveProperty('unitSource');
  });
});

describe('8.11 utfallet fångas', () => {
  it('accepted när förslaget sparades orört', async () => {
    const id = await recordParseAttempt({ rawText: 'bänk 90x5', parser: 'local', sets: [set()] }, db);
    await setParseOutcome(id, 'accepted', null, db);

    expect((await db.parseLog.get(id))?.outcome).toBe('accepted');
    // Uppdateringen köas också — servern behöver det slutliga utfallet.
    expect((await db.outbox.toArray()).filter((e) => e.table === 'ai_parse_log')).toHaveLength(2);
  });

  it('edited sparar VAD som blev rätt, inte bara att det blev fel', async () => {
    const id = await recordParseAttempt({ rawText: 'bänk 20x30', parser: 'local', sets: [set({ weightKg: 20, reps: 30 })] }, db);
    await setParseOutcome(id, 'edited', [set({ weightKg: 30, reps: 20 })], db);

    const rad = await db.parseLog.get(id);
    expect(rad?.outcome).toBe('edited');
    const rättat = rad?.corrected as Array<Record<string, unknown>>;
    // Utan det rättade värdet går felen att räkna men inte att analysera.
    expect(rättat[0]!['weight_kg']).toBe(30);
    expect(rättat[0]!['reps']).toBe(20);
  });

  it('kastar inte när raden inte finns — telemetri får aldrig stoppa loggningen', async () => {
    await expect(setParseOutcome('finns-inte', 'accepted', null, db)).resolves.toBeUndefined();
  });
});

describe('statistiken säger ifrån när underlaget är för tunt', () => {
  it('ger null som träffsäkerhet under fem försök', async () => {
    for (let i = 0; i < 4; i++) {
      const id = await recordParseAttempt({ rawText: 'bänk 90x5', parser: 'local', sets: [set()] }, db);
      await setParseOutcome(id, 'accepted', null, db);
    }
    const stats = await getParseStats(db);
    expect(stats.byParser.local.accepted).toBe(4);
    // Fyra av fyra är 100 % — och en siffra som ser ut som ett resultat.
    expect(stats.accuracy.local).toBeNull();
  });

  it('räknar träffsäkerhet när underlaget räcker', async () => {
    for (let i = 0; i < 8; i++) {
      const id = await recordParseAttempt({ rawText: 'bänk 90x5', parser: 'local', sets: [set()] }, db);
      await setParseOutcome(id, i < 6 ? 'accepted' : 'edited', null, db);
    }
    const stats = await getParseStats(db);
    expect(stats.accuracy.local).toBeCloseTo(0.75, 2);
    expect(stats.byParser.local.edited).toBe(2);
  });

  it('håller lokal och LLM isär — de ska kunna jämföras', async () => {
    await recordParseAttempt({ rawText: 'a', parser: 'local', sets: [set()] }, db);
    await recordParseAttempt({ rawText: 'b', parser: 'llm', sets: [set()], latencyMs: 1200 }, db);

    const stats = await getParseStats(db);
    expect(stats.byParser.local.total).toBe(1);
    expect(stats.byParser.llm.total).toBe(1);
    expect(stats.medianLlmLatencyMs).toBe(1200);
  });

  it('ger nollställd statistik i stället för att fela när ingenting loggats', async () => {
    const stats = await getParseStats(db);
    expect(stats.total).toBe(0);
    expect(stats.accuracy.local).toBeNull();
    expect(stats.medianLlmLatencyMs).toBeNull();
  });
});
