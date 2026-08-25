/**
 * Historikfrågor. Uppgift 9.1–9.4.
 *
 * Allt räknas i klienten ur Dexie. `personal_records` finns medvetet inte som
 * tabell (PLAN.md §2.4): e1RM är en multiplikation per set, och att
 * materialisera det innan vi mätt att det är långsamt vore att bygga före
 * mätning. Blir det trögt vid tiotusentals set är det då det ska cachas.
 */

import { epley1RM, volumeKg } from '../lib/oneRepMax';
import { db, type GymDatabase } from './db';
import type { LocalSet, LocalWorkout } from './types';

export interface WorkoutSummary {
  workout: LocalWorkout;
  /** Alla loggade set, uppvärmning inräknad — de gjordes. */
  setCount: number;
  /** Bara arbetsset. Uppvärmning är förberedelse, inte arbete. */
  totalVolumeKg: number;
  /** Övningsnamn i den ordning de först dök upp i passet. */
  exerciseIds: string[];
  durationMinutes: number | null;
}

export interface ExercisePoint {
  setId: string;
  performedAt: string;
  weightKg: number;
  reps: number;
  /** null när repsen ligger utanför spannet där formeln betyder något. */
  e1rm: number | null;
  /**
   * Ur Adams gamla anteckningar (13.1), inte loggat i appen. Punkten är verklig
   * men datumet är uppskattat ur ett veckonummer — därför textraden i 13.5.
   */
  isImported: boolean;
}

export interface PersonalRecords {
  exerciseId: string;
  /** Tyngsta enskilda set, oavsett reps. */
  heaviest: LocalSet | null;
  /** Setet med högst estimerat 1RM — det verkliga styrkerekordet. */
  bestE1rm: { set: LocalSet; e1rm: number } | null;
  totalSets: number;
}

function byPerformedAt(a: LocalSet, b: LocalSet): number {
  return a.performedAt < b.performedAt ? -1 : a.performedAt > b.performedAt ? 1 : 0;
}

/** Avslutade och pågående pass, nyast först. */
export async function listWorkoutSummaries(
  limit = 50,
  database: GymDatabase = db
): Promise<WorkoutSummary[]> {
  // Importerade pass (13.3) hör inte hemma i passlistan: de är rader ur Adams
  // gamla anteckningar, inte pass han genomfört i appen, och deras datum är
  // uppskattade. Filtret ligger FÖRE slice — annars hade 17 importerade pass
  // kunnat äta upp hela limiten och lämna listan tom.
  const workouts = (await database.workouts.orderBy('startedAt').reverse().toArray())
    .filter((w) => !w.isDeleted && !w.isImported)
    .slice(0, limit);
  if (workouts.length === 0) return [];

  const ids = new Set(workouts.map((w) => w.id));
  const sets = (await database.loggedSets.toArray()).filter(
    (s) => !s.isDeleted && ids.has(s.workoutId)
  );

  const perWorkout = new Map<string, LocalSet[]>();
  for (const s of sets) {
    const list = perWorkout.get(s.workoutId);
    if (list) list.push(s);
    else perWorkout.set(s.workoutId, [s]);
  }

  return workouts.map((workout) => {
    const rows = (perWorkout.get(workout.id) ?? []).sort(byPerformedAt);
    const exerciseIds: string[] = [];
    for (const s of rows) if (!exerciseIds.includes(s.exerciseId)) exerciseIds.push(s.exerciseId);

    // Uppvärmningsset räknas INTE i volymen — samma regel som `summarizeWorkout`
    // i repo.ts och som `getExerciseHistory`/`getPersonalRecords` längre ner i den
    // här filen. De är förberedelse, inte arbete, och att blanda in dem gör siffran
    // obrukbar för jämförelser mellan pass. Saknades här fram till 12.16, vilket gav
    // historiken och startskärmen olika volym för samma pass.
    const arbetsset = rows.filter((s) => !s.isWarmup);
    const totalVolumeKg = arbetsset.reduce((sum, s) => sum + volumeKg(s.weightKg, s.reps), 0);
    const durationMinutes =
      workout.endedAt === null
        ? null
        : Math.max(
            0,
            Math.round(
              (new Date(workout.endedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000
            )
          );

    return {
      workout,
      setCount: rows.length,
      // Avrundas INTE. Halvkilon är verkliga vikter (2,5 kg-skivor), och 12.18
      // avgjorde att de ska synas. `summarizeWorkout` i repo.ts returnerar också
      // orörd summa — divergerar de igen fångas det av testet i history.test.ts.
      totalVolumeKg,
      exerciseIds,
      durationMinutes,
    };
  });
}

export async function getWorkoutSets(
  workoutId: string,
  database: GymDatabase = db
): Promise<LocalSet[]> {
  const rows = await database.loggedSets.where('workoutId').equals(workoutId).toArray();
  return rows.filter((s) => !s.isDeleted).sort(byPerformedAt);
}

/** Alla set för en övning över tid, äldst först — grafens x-axel. */
export async function getExerciseHistory(
  exerciseId: string,
  database: GymDatabase = db
): Promise<ExercisePoint[]> {
  const rows = await database.loggedSets
    .where('[exerciseId+performedAt]')
    .between([exerciseId, ''], [exerciseId, '￿'])
    .toArray();

  return rows
    .filter((s) => !s.isDeleted && !s.isWarmup)
    .sort(byPerformedAt)
    .map((s) => ({
      setId: s.id,
      performedAt: s.performedAt,
      weightKg: s.weightKg,
      reps: s.reps,
      e1rm: epley1RM(s.weightKg, s.reps),
      isImported: s.source === 'import',
    }));
}

export async function getPersonalRecords(
  exerciseId: string,
  database: GymDatabase = db
): Promise<PersonalRecords> {
  const rows = (
    await database.loggedSets
      .where('[exerciseId+performedAt]')
      .between([exerciseId, ''], [exerciseId, '￿'])
      .toArray()
  ).filter((s) => !s.isDeleted && !s.isWarmup);

  let heaviest: LocalSet | null = null;
  let bestE1rm: { set: LocalSet; e1rm: number } | null = null;

  for (const s of rows) {
    if (!heaviest || s.weightKg > heaviest.weightKg) heaviest = s;
    const e = epley1RM(s.weightKg, s.reps);
    if (e !== null && (!bestE1rm || e > bestE1rm.e1rm)) bestE1rm = { set: s, e1rm: e };
  }

  return { exerciseId, heaviest, bestE1rm, totalSets: rows.length };
}

/** `SPEC.md` §2: snittet bygger på de tre senaste passen med övningen. */
const ANTAL_PASS_I_SNITTET = 3;

/** Minsta skivpar. Ett snitt som inte går att lägga på stången är oanvändbart. */
const VIKTSTEG_KG = 2.5;

/** Åtta veckor. Äldre underlag än så är inte längre ett normalläge. */
const ÅLDERSGRÄNS_MS = 56 * 24 * 60 * 60 * 1000;

export interface SetAverage {
  setIndex: number;
  /** Snittet av underlagets vikter, avrundat till närmaste 2,5 kg. */
  weightKg: number;
  /**
   * INTE ett snitt. Repsen från det set vars vikt ligger närmast `weightKg`.
   *
   * Vikt och reps byter av varandra — kör man tyngre blir det färre reps — så
   * snittas de var för sig hamnar paret ALLTID ovanför den verkliga kurvan,
   * aldrig under. Det ger ett referensvärde som är tyngre än allt användaren
   * faktiskt gjort, vilket är precis den skada `SPEC.md` §2 finns för att ta
   * bort. Avgjort av Adam 2026-08-25, se `DESIGN.md` §3.1.
   */
  reps: number;
  /**
   * Hur många pass just det här setnumret bygger på, 1–3.
   *
   * Räknas per setnummer och inte per övning, eftersom passen har olika många
   * set: har man kört fyra set en gång och två set två gånger har set 3 tunnare
   * underlag än set 1. Färre än tre visas ändå, märkt med antalet — `–` är
   * reserverat för när underlag saknas helt.
   */
  workoutCount: number;
}

export interface ExerciseSetAverages {
  /** Snitt per setnummer, stigande. Tomma platser betyder `–`, aldrig en nolla. */
  sets: SetAverage[];
  /**
   * Satt bara när senaste passet med övningen är äldre än åtta veckor. Då är
   * `sets` tom, och raden visar *"senast tränad i \<månad år\>"* i stället.
   *
   * Skälet är Adams bruksmönster: han tar paus när utvecklingen står stilla.
   * Utan gränsen presenteras ett två år gammalt snitt som hans normalläge.
   */
  staleSince: string | null;
}

/**
 * Snittet som ersätter `FÖRRA` i setraden. Uppgift 11B.0f.
 *
 * Reglerna och skälen står i `SPEC.md` §2 och `DESIGN.md` §3.1 — läs dem där.
 */
export async function getSetAverages(
  exerciseId: string,
  database: GymDatabase = db
): Promise<ExerciseSetAverages> {
  // Samma tre filter som spökdatan i 13.4: raderade, uppvärmning och
  // importerade. Det sista är det viktigaste — Adams `2024 vecka 14: Bänk:
  // 90 kg` var ett 1-repsmax ur gamla anteckningar, och blir det underlag lyfts
  // snittet av ett maxlyft.
  //
  // Filtret ligger FÖRE urvalet av pass: ett pass som bara innehåller
  // uppvärmning eller importerade rader har inget underlag att bidra med och
  // får inte äta en av de tre platserna.
  const rows = (
    await database.loggedSets
      .where('[exerciseId+performedAt]')
      .between([exerciseId, ''], [exerciseId, '￿'])
      .toArray()
  )
    .filter((s) => !s.isDeleted && !s.isWarmup && s.source !== 'import')
    // Sorteringen är inte kosmetisk: regeln för oavgjort längre ner läser den
    // här ordningen. Indexet svarar visserligen stigande, men resten av filen
    // sorterar också om efter `toArray()` i stället för att lita på det.
    .sort(byPerformedAt);

  const senastTränad = rows.reduce<string | null>(
    (max, s) => (max === null || s.performedAt > max ? s.performedAt : max),
    null
  );
  if (senastTränad !== null && Date.now() - new Date(senastTränad).getTime() > ÅLDERSGRÄNS_MS) {
    return { sets: [], staleSince: senastTränad };
  }

  // De tre senaste passen MED ÖVNINGEN — inte de tre senaste passen. Kör man
  // bänk på måndagen och ben tisdag till torsdag innehåller de tre senaste
  // passen noll bänkset, och raden hade stått tom just när den behövs.
  // Uppslaget går på `[exerciseId+performedAt]`, så passen som saknar övningen
  // finns aldrig i `rows` från första början.
  const senastIPasset = new Map<string, string>();
  for (const s of rows) {
    const nuvarande = senastIPasset.get(s.workoutId);
    if (nuvarande === undefined || s.performedAt > nuvarande) {
      senastIPasset.set(s.workoutId, s.performedAt);
    }
  }
  const underlag = new Set(
    [...senastIPasset.entries()]
      .sort(([, a], [, b]) => (a < b ? 1 : a > b ? -1 : 0))
      .slice(0, ANTAL_PASS_I_SNITTET)
      .map(([workoutId]) => workoutId)
  );

  // Per setnummer, eftersom man blir svagare för varje set i rad. Set 3
  // jämförs med set 3.
  const perSetIndex = new Map<number, LocalSet[]>();
  for (const s of rows) {
    if (!underlag.has(s.workoutId)) continue;
    const list = perSetIndex.get(s.setIndex);
    if (list) list.push(s);
    else perSetIndex.set(s.setIndex, [s]);
  }

  const sets = [...perSetIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([setIndex, rader]) => {
      const rått = rader.reduce((sum, s) => sum + s.weightKg, 0) / rader.length;
      const weightKg = Math.round(rått / VIKTSTEG_KG) * VIKTSTEG_KG;

      // Repsen snittas inte — de tas från setet närmast den vikt som VISAS,
      // inte närmast råsnittet. Paret måste hänga ihop för den som läser det:
      // "90 kg, och på 90 kg brukar det bli 5 reps". Ett repsantal valt efter
      // ett tal användaren aldrig ser vore godtyckligt.
      //
      // Vid lika avstånd vinner det senaste setet. `rader` kommer ur indexet i
      // stigande `performedAt`, så `<=` låter det senare skriva över det
      // tidigare. Utan regeln avgörs raden av vilken ordning databasen råkar
      // svara i, och det senaste passet är den bättre gissningen om hur det
      // ser ut nu.
      const närmast = rader.reduce((bäst, s) =>
        Math.abs(s.weightKg - weightKg) <= Math.abs(bäst.weightKg - weightKg) ? s : bäst
      );

      return {
        setIndex,
        weightKg,
        reps: närmast.reps,
        workoutCount: new Set(rader.map((s) => s.workoutId)).size,
      };
    });

  return { sets, staleSince: null };
}

/** Övningar användaren faktiskt har loggat, nyast först. Driver historiklistan. */
export async function listTrainedExercises(
  database: GymDatabase = db
): Promise<Array<{ exerciseId: string; lastPerformedAt: string; setCount: number }>> {
  const rows = (await database.loggedSets.toArray()).filter((s) => !s.isDeleted);
  const map = new Map<string, { lastPerformedAt: string; setCount: number }>();
  for (const s of rows) {
    const current = map.get(s.exerciseId);
    if (!current) map.set(s.exerciseId, { lastPerformedAt: s.performedAt, setCount: 1 });
    else {
      current.setCount++;
      if (s.performedAt > current.lastPerformedAt) current.lastPerformedAt = s.performedAt;
    }
  }
  return [...map.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => (a.lastPerformedAt < b.lastPerformedAt ? 1 : -1));
}
