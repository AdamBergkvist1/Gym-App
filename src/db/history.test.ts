import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  getSetAverages,
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

/**
 * 11B.0f — snittet som ersätter `FÖRRA` i setraden.
 *
 * Reglerna står i `SPEC.md` §2 och `DESIGN.md` §3.1. Testerna här är skrivna
 * före funktionen, i den ordning reglerna hänger ihop.
 *
 * Historiken skrivs genom den RIKTIGA loggningsvägen (`startWorkout`/`logSet`)
 * med `Date` fejkad, inte som handknackade rader. Skälet: `setIndex` räknas
 * fram inne i `logSet`, och en fixtur som sätter det själv hade kunnat vara
 * grön mot en numrering appen aldrig skapar.
 */
const NU = new Date('2026-08-25T18:00:00.000Z');
const DYGN = 24 * 60 * 60 * 1000;

describe('11B.0f snittet per setnummer', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: NU }));
  afterEach(() => vi.useRealTimers());

  /** Ett avslutat pass `dagarSedan` dagar tillbaka, med seten i ordning. */
  async function pass(
    setLista: Array<[weightKg: number, reps: number]>,
    dagarSedan: number,
    exerciseId = BENK
  ) {
    vi.setSystemTime(new Date(NU.getTime() - dagarSedan * DYGN));
    const w = await startWorkout(db);
    for (const [weightKg, reps] of setLista) {
      await logSet({ workoutId: w.id, exerciseId, weightKg, reps }, db);
    }
    await endWorkout(db);
    vi.setSystemTime(NU);
    return w;
  }

  it('snittar vikten per setnummer, inte över alla set i en klump', async () => {
    await pass(
      [
        [90, 5],
        [80, 5],
      ],
      7
    );
    await pass(
      [
        [100, 5],
        [90, 5],
      ],
      3
    );

    const { sets } = await getSetAverages(BENK, db);

    // Set 1: (90 + 100) / 2 = 95. Set 2: (80 + 90) / 2 = 85.
    // Klumpas alla fyra ihop blir svaret 90 på båda raderna — det är felet
    // grupperingen finns för att undvika. Man blir svagare för varje set i rad.
    expect(sets.map((s) => s.weightKg)).toEqual([95, 85]);
  });

  it('bygger på de tre senaste passen MED ÖVNINGEN, inte de tre senaste passen', async () => {
    // Fyra bänkpass. Det äldsta ska falla utanför underlaget.
    await pass([[40, 5]], 40);
    await pass([[90, 5]], 21);
    await pass([[100, 5]], 14);
    await pass([[95, 5]], 10);

    // Tre benpass EFTER alla bänkpassen. Kör man bänk på måndagen och ben
    // tisdag till torsdag innehåller "de tre senaste passen" noll bänkset, och
    // kolumnen står tom just när den behövs. Därför står de här.
    await pass([[100, 5]], 3, KNABOJ);
    await pass([[100, 5]], 2, KNABOJ);
    await pass([[100, 5]], 1, KNABOJ);

    const { sets } = await getSetAverages(BENK, db);

    // (90 + 100 + 95) / 3 = 95. Räknas det fjärde passet med blir svaret
    // 81,25 — därför är 40 kg avsiktligt orimligt lätt.
    expect(sets[0]?.weightKg).toBe(95);
  });

  it('avrundar snittvikten till närmaste 2,5 kg — en vikt som inte går på stången är oanvändbar', async () => {
    await pass([[90, 5]], 21);
    await pass([[85, 5]], 14);
    await pass([[92.5, 5]], 7);

    const { sets } = await getSetAverages(BENK, db);

    // Råsnittet är 89,1666… kg. Ingen skivkombination ger det.
    expect(sets[0]?.weightKg).toBe(90);
  });

  it('tar repsen från setet närmast snittvikten i stället för att snitta dem', async () => {
    // Briefens eget exempel, ordagrant ur `TASKS.md` 11B.0f.
    await pass([[90, 5]], 21);
    await pass([[85, 8]], 14);
    await pass([[92.5, 4]], 7);

    const { sets } = await getSetAverages(BENK, db);

    // Snittvikten är 90. Närmast den ligger 90-setet, som kördes på 5 reps.
    //
    // ⚠️ Snittas repsen i stället blir svaret 90×6, och det är inte bara "ett
    // set som aldrig hänt": i e1RM är 90×6 = 108, mot de faktiska setens
    // 105,0 / 107,7 och 104,8. Paret blir tyngre än VARTENDA set som utfördes.
    // Vikt och reps byter av varandra, så snittas de var för sig lutar felet
    // alltid uppåt — aldrig nedåt. Ett för högt referensvärde är precis den
    // skada `SPEC.md` §2 finns för att ta bort. Avgjort av Adam 2026-08-25.
    expect(sets[0]).toMatchObject({ weightKg: 90, reps: 5 });
  });

  it('låter det senaste setet vinna när två ligger lika nära snittvikten', async () => {
    await pass([[85, 10]], 14);
    await pass([[95, 3]], 7);

    const { sets } = await getSetAverages(BENK, db);

    // Snittet är precis 90, och båda seten ligger 5 kg bort. Utan en regel för
    // oavgjort avgörs raden av vilken ordning databasen råkar svara i.
    // Det senaste passet är den bättre gissningen om hur det ser ut nu.
    expect(sets[0]).toMatchObject({ weightKg: 90, reps: 3 });
  });

  it('räknar inte uppvärmningsset som underlag', async () => {
    vi.setSystemTime(new Date(NU.getTime() - 7 * DYGN));
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 40, reps: 10, isWarmup: true }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 85, reps: 5 }, db);
    await endWorkout(db);
    vi.setSystemTime(NU);

    const { sets } = await getSetAverages(BENK, db);

    // 40 kg är förberedelse, inte arbete — samma regel som volymen redan har.
    // Setnumret behålls som det lagrades: `logSet` räknar uppvärmningen som en
    // rad, och `SetRow` numrerar raderna likadant. Uppvärmningens plats blir
    // alltså tom i stället för att skjuta ner arbetssetens numrering.
    expect(sets.map((s) => [s.setIndex, s.weightKg])).toEqual([
      [1, 90],
      [2, 85],
    ]);
  });

  it('räknar inte raderade set som underlag', async () => {
    vi.setSystemTime(new Date(NU.getTime() - 7 * DYGN));
    const w = await startWorkout(db);
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 5 }, db);
    const bort = await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 500, reps: 5 }, db);
    await deleteSet(bort.id, db);
    await endWorkout(db);
    vi.setSystemTime(NU);

    const { sets } = await getSetAverages(BENK, db);

    // 500 kg är en felskrivning som ångrats. Får den ligga kvar i underlaget
    // förgiftar den snittet i tre pass framåt.
    expect(sets.map((s) => [s.setIndex, s.weightKg])).toEqual([[0, 90]]);
  });

  it('räknar aldrig importerade set som underlag — samma regel som 13.4', async () => {
    vi.setSystemTime(new Date(NU.getTime() - 7 * DYGN));
    const w = await startWorkout(db);
    await logSet(
      { workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 1, source: 'import' },
      db
    );
    await logSet({ workoutId: w.id, exerciseId: BENK, weightKg: 80, reps: 5 }, db);
    await endWorkout(db);
    vi.setSystemTime(NU);

    const { sets } = await getSetAverages(BENK, db);

    // Adams `2024 vecka 14: Bänk: 90 kg` var ett 1-repsmax ur gamla
    // anteckningar. Blir det underlag lyfts snittet av ett maxlyft, och
    // referensen blir ett rekord att matcha — precis det 13.4 stängde för
    // spökdatan och det `SPEC.md` §2 stängde för snittet.
    expect(sets.map((s) => [s.setIndex, s.weightKg, s.reps])).toEqual([[1, 80, 5]]);
  });

  it('visar inget snitt alls när övningen inte tränats på åtta veckor', async () => {
    await pass([[90, 5]], 70);

    const { sets, staleSince } = await getSetAverages(BENK, db);

    // Adam tar paus när utvecklingen står stilla och återkommer senare. Utan
    // gränsen presenteras ett två år gammalt snitt som "ditt normalläge",
    // vilket är exakt den jämförelse regeln ska ta bort. Raden ska i stället
    // säga när övningen senast tränades — därför datumet, inte bara `null`.
    expect(sets).toEqual([]);
    expect(staleSince).toBe('2026-06-16T18:00:00.000Z');
  });

  it('räknar exakt åtta veckor som fortfarande färskt — gränsen är ÄLDRE än, inte lika med', async () => {
    await pass([[90, 5]], 56);

    const { sets, staleSince } = await getSetAverages(BENK, db);

    // Regeln säger "äldre än åtta veckor". Dagen på gränsen ska alltså visa
    // snittet. Vakten kan inte bli röd av sig själv — den kontrollerades
    // genom att `>` tillfälligt gjordes om till `>=`, vilket fällde den.
    expect(sets).toHaveLength(1);
    expect(staleSince).toBeNull();
  });

  it('visar tunt underlag ändå och märker det med antalet pass, räknat per setnummer', async () => {
    await pass(
      [
        [90, 5],
        [85, 5],
      ],
      14
    );
    await pass([[95, 5]], 7);

    const { sets } = await getSetAverages(BENK, db);

    // Passen har olika många set. Set 1 har två pass bakom sig, set 2 bara ett.
    // Båda visas — `–` är reserverat för när underlag saknas HELT, samma regel
    // som §3.3: aldrig en nolla, en nolla ser ut som ett resultat.
    //
    // Att antalet räknas per setnummer och inte per övning är ett omdömesbeslut
    // 2026-08-25, utskrivet i `TASKS.md` 11B.0f. Det tillämpar en regel som
    // redan fanns på ett fall briefen inte hade tänkt på.
    expect(sets.map((s) => [s.setIndex, s.weightKg, s.workoutCount])).toEqual([
      [0, 92.5, 2],
      [1, 85, 1],
    ]);
  });

  it('ger tomt utan datum när övningens enda set är importerade — inte "senast tränad"', async () => {
    vi.setSystemTime(new Date(NU.getTime() - 400 * DYGN));
    const w = await startWorkout(db);
    await logSet(
      { workoutId: w.id, exerciseId: BENK, weightKg: 90, reps: 1, source: 'import' },
      db
    );
    await endWorkout(db);
    vi.setSystemTime(NU);

    const { sets, staleSince } = await getSetAverages(BENK, db);

    // De två tomma tillstånden är INTE samma sak: `–` betyder "aldrig loggat
    // i appen", datumet betyder "loggat, men för länge sedan". Räknas åldern
    // före filtret får en övning användaren aldrig loggat en datumrad ur
    // 2025 års anteckningar. Vakten kontrollerades genom att flytta
    // åldersberäkningen före filtret, vilket fällde den.
    expect(sets).toEqual([]);
    expect(staleSince).toBeNull();
  });

  it('ger tomt utan datum för en övning som aldrig loggats', async () => {
    // Kontraktsvakt för `–`-tillståndet. `SPEC.md` §3.3: aldrig en nolla, en
    // nolla ser ut som ett resultat.
    expect(await getSetAverages(KNABOJ, db)).toEqual({ sets: [], staleSince: null });
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
