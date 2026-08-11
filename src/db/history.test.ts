import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type GymDatabase } from './db';
import {
  deleteSet,
  endWorkout,
  ensureCatalog,
  logSet,
  startWorkout,
  summarizeWorkout,
} from './repo';
import {
  getExerciseHistory,
  getPersonalRecords,
  getWorkoutSets,
  listTrainedExercises,
  listWorkoutSummaries,
} from './history';

const BENK = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf';
const KNABOJ = '1c9ac04d-9226-42d1-a47e-ca9b27530e0b';

let db: GymDatabase;
let n = 0;

function importeratPass(id: string, startedAt = '2024-04-01T10:00:00.000Z') {
  return {
    id,
    startedAt,
    endedAt: startedAt,
    title: null,
    note: null,
    isImported: true,
    isDeleted: false,
    updatedAt: startedAt,
  };
}

function importeratSet(id: string, workoutId: string) {
  return {
    id,
    workoutId,
    exerciseId: BENK,
    setIndex: 0,
    weightKg: 90,
    reps: 1,
    effortType: null,
    effortValue: null,
    restSeconds: null,
    note: null,
    isWarmup: false,
    performedAt: '2024-04-01T10:00:00.000Z',
    source: 'import' as const,
    isDeleted: false,
    updatedAt: '2024-04-01T10:00:00.000Z',
  };
}

beforeEach(async () => {
  db = createTestDb(`hist-test-${++n}-${Date.now()}`);
  await db.open();
  await ensureCatalog(db);
});
afterEach(() => db.close());

describe('9.1 passhistorik', () => {
  it('sammanfattar set, volym och övningar per pass', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 4 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 100, reps: 5 }, db);
    await endWorkout(db);

    const [sammanfattning] = await listWorkoutSummaries(50, db);

    expect(sammanfattning?.setCount).toBe(3);
    // 90*5 + 90*4 + 100*5 = 450 + 360 + 500
    expect(sammanfattning?.totalVolumeKg).toBe(1310);
    expect(sammanfattning?.exerciseIds).toEqual([BENK, KNABOJ]);
  });

  it('listar nyaste passet först', async () => {
    const w1 = await startWorkout(db);
    await endWorkout(db);
    await new Promise((r) => setTimeout(r, 5));
    const w2 = await startWorkout(db);
    await endWorkout(db);

    const rader = await listWorkoutSummaries(50, db);
    expect(rader.map((r) => r.workout.id)).toEqual([w2.id, w1.id]);
  });

  it('räknar inte raderade set i volymen', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    const bort = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 500, reps: 5 }, db);
    await deleteSet(bort.id, db);

    const [s] = await listWorkoutSummaries(50, db);
    expect(s?.setCount).toBe(1);
    expect(s?.totalVolumeKg).toBe(450);
  });

  it('räknar inte uppvärmningsset i volymen, men räknar dem i setCount', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 40, reps: 10, isWarmup: true }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);

    const [s] = await listWorkoutSummaries(50, db);

    // Setet gjordes, så det räknas. Men uppvärmning är förberedelse, inte arbete:
    // 400 kg får inte smyga in i volymen och göra passet ojämförbart med andra.
    expect(s?.setCount).toBe(2);
    expect(s?.totalVolumeKg).toBe(450);
  });

  it('visar samma volym som passvyns sammanfattning — regression för 12.16', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 40, reps: 10, isWarmup: true }, db);
    // 92,5 är avsiktligt: en heltalsvikt hade dolt avrundningsskillnaden i 12.18.
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 92.5, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 100, reps: 5 }, db);

    const [historik] = await listWorkoutSummaries(50, db);
    const passvy = await summarizeWorkout(w.id, db);

    // Historiken och startskärmen läser samma pass ur samma tabell. Divergerar de
    // igen är det den här raden som säger till, inte en användare som undrar.
    expect(historik?.totalVolumeKg).toBe(passvy?.volumeKg);
    expect(historik?.totalVolumeKg).toBe(962.5);
  });

  it('ger null som längd för ett pågående pass i stället för att gissa', async () => {
    await startWorkout(db);
    const [s] = await listWorkoutSummaries(50, db);
    expect(s?.durationMinutes).toBeNull();
  });

  it('ger tom lista när ingenting loggats — inte ett fel', async () => {
    expect(await listWorkoutSummaries(50, db)).toEqual([]);
  });

  it('hämtar setet i ett enskilt pass i loggningsordning', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 100, reps: 5 }, db);
    const rader = await getWorkoutSets(w.id, db);
    expect(rader.map((s) => s.exerciseId)).toEqual([BENK, KNABOJ]);
  });
});

describe('13.3 importerade pass hör inte hemma i passlistan', () => {
  it('visar det vanliga passet men inte det importerade', async () => {
    const vanligt = await startWorkout(db);
    await logSet({ workoutId: vanligt.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await endWorkout(db);

    // Importen (13.6) skriver sina rader via SQL och synken, inte via
    // startWorkout — därför läggs raden in direkt här.
    await db.workouts.add(importeratPass('w-importerat'));
    await db.loggedSets.add(importeratSet('s-importerat', 'w-importerat'));

    const rader = await listWorkoutSummaries(50, db);

    expect(rader.map((r) => r.workout.id)).toEqual([vanligt.id]);
  });

  it('filtrerar före limiten, så importerade pass inte äter platser i listan', async () => {
    // Det importerade passet är nyast och hade fyllt hela listan om filtret
    // låg efter slice(0, limit).
    await db.workouts.add(importeratPass('w-imp-nytt', '2099-01-01T10:00:00.000Z'));
    const vanligt = await startWorkout(db);

    const rader = await listWorkoutSummaries(1, db);

    expect(rader.map((r) => r.workout.id)).toEqual([vanligt.id]);
  });
});

describe('9.2 övningshistorik', () => {
  it('ger punkterna äldst först med e1RM', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 100, reps: 5 }, db);

    const punkter = await getExerciseHistory(BENK, db);
    expect(punkter).toHaveLength(1);
    expect(punkter[0]!.e1rm).toBe(116.7);
  });

  it('utesluter uppvärmning och raderade set', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 40, reps: 10, isWarmup: true }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);

    expect(await getExerciseHistory(BENK, db)).toHaveLength(1);
  });

  it('märker ut vilka punkter som är importerade — underlaget till 13.5', async () => {
    const w = await startWorkout(db);
    await logSet(
      { workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 1, source: 'import' },
      db
    );
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 80, reps: 5 }, db);

    // Importerade set ligger kvar i grafen — de gjordes. Det är datumet som är
    // uppskattat, och det är det textraden talar om.
    expect((await getExerciseHistory(BENK, db)).map((p) => p.isImported)).toEqual([true, false]);
  });

  it('lämnar e1RM som null när repsen ligger utanför formelns spann', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 30, reps: 25 }, db);
    expect((await getExerciseHistory(BENK, db))[0]!.e1rm).toBeNull();
  });
});

describe('9.4 personbästa', () => {
  it('skiljer tyngsta set från bästa e1RM — det är inte samma sak', async () => {
    const w = await startWorkout(db);
    // 90×3 är tyngre på stången, men 80×8 är den starkare prestationen.
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 3 }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 80, reps: 8 }, db);

    const pb = await getPersonalRecords(BENK, db);
    expect(pb.heaviest?.weightKg).toBe(90);
    expect(pb.bestE1rm?.set.weightKg).toBe(80);
    expect(pb.bestE1rm?.e1rm).toBe(101.3);
  });

  it('ger null i stället för nollor när övningen aldrig gjorts', async () => {
    const pb = await getPersonalRecords(KNABOJ, db);
    expect(pb.heaviest).toBeNull();
    expect(pb.bestE1rm).toBeNull();
    expect(pb.totalSets).toBe(0);
  });

  it('räknar inte uppvärmning som rekord', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 200, reps: 1, isWarmup: true }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    expect((await getPersonalRecords(BENK, db)).heaviest?.weightKg).toBe(90);
  });
});

describe('tränade övningar', () => {
  it('listar bara övningar som faktiskt loggats, nyast först', async () => {
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: KNABOJ, weightKg: 100, reps: 5 }, db);

    const rader = await listTrainedExercises(db);
    expect(rader).toHaveLength(2); // inte 45 — bara de tränade
    expect(rader[0]!.exerciseId).toBe(KNABOJ);
  });
});
