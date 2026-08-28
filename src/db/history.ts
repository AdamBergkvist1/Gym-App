/**
 * Historikfrågor. Uppgift 9.1–9.4.
 *
 * Allt räknas i klienten ur Dexie. `personal_records` finns medvetet inte som
 * tabell (PLAN.md §2.4): e1RM är en multiplikation per set, och att
 * materialisera det innan vi mätt att det är långsamt vore att bygga före
 * mätning. Blir det trögt vid tiotusentals set är det då det ska cachas.
 */

import { epley1RM, volumeKg } from '../lib/oneRepMax';
import { weightStepFor } from '../lib/steps';
import { skapaArbetssetRäknare } from '../lib/worksets';
import { db, type GymDatabase } from './db';
import type { LocalSet, LocalWorkout } from './types';

export interface WorkoutSummary {
  workout: LocalWorkout;
  /**
   * Bara arbetsset. Uppvärmning är förberedelse, inte arbete.
   *
   * ✏️ **HÄR STOD "uppvärmning inräknad — de gjordes" fram till 12.48.** 12.16
   * avgjorde det, och det var inte fel då. Men historikraden visar `N set · M kg`
   * bredvid varandra, och när 12.44 hittade samma form på övningskortet blev
   * mönstret tydligt: **två tal ur olika mängder på samma rad är värre än att ett
   * av dem är fel.** Adam avgjorde 2026-08-27 att regeln ska vara densamma överallt.
   */
  setCount: number;
  /** Bara arbetsset. Uppvärmning är förberedelse, inte arbete. */
  totalVolumeKg: number;
  /**
   * Övningarna som fick **minst ett loggat arbetsset**, i den ordning de först
   * dök upp, med antal arbetsset var.
   *
   * ✏️ **HÄR STOD `exerciseIds: string[]`, byggd ur ALLA setrader — och det var
   * ett fel. Uppgift steg 4.3 del A.** En övning man bara värmt upp på och
   * lämnat räknades som en övning men bidrog med noll set och noll kilo. Så
   * länge listan bara radade upp namn syntes det inte; `DESIGN.md` §3.2 sätter
   * talen **bredvid varandra** (`18 set · 5 210 kg · 5 övn`), och där blir det
   * tre tal ur två olika mängder — exakt formen Adam förbjöd i **12.48**.
   *
   * `repo.ts`:s `summarizeWorkout` räknade redan rätt (`exerciseCount` ur
   * arbetsseten). De två divergerade alltså, och ingen grind mätte det.
   *
   * ⚠️ **Antalet arbetsset per övning bär muskelgruppsraden.** Den väger
   * grupper mot varandra, inte övningar — se `src/lib/muskelgrupper.ts`. Utan
   * talet hade skärmen fått räkna om samma sak själv, vilket är den vana
   * 12.42, 12.48 och 12.49 alla kom ur.
   */
  workExercises: WorkExercise[];
  durationMinutes: number | null;
}

/** En övning i ett pass, med sitt antal loggade arbetsset. */
export interface WorkExercise {
  exerciseId: string;
  setCount: number;
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

    // Uppvärmningsset räknas INTE i volymen — samma regel som `summarizeWorkout`
    // i repo.ts och som `getExerciseHistory`/`getPersonalRecords` längre ner i den
    // här filen. De är förberedelse, inte arbete, och att blanda in dem gör siffran
    // obrukbar för jämförelser mellan pass. Saknades här fram till 12.16, vilket gav
    // historiken och startskärmen olika volym för samma pass.
    const arbetsset = rows.filter((s) => !s.isWarmup);
    const totalVolumeKg = arbetsset.reduce((sum, s) => sum + volumeKg(s.weightKg, s.reps), 0);

    // ⛔ **ETT FILTER, TRE TAL.** Antal set, volym och antal övningar härleds ur
    // `arbetsset` och ingen annanstans ifrån. Historikraden sätter dem bredvid
    // varandra, och två tal ur olika mängder på en rad är värre än att ett av
    // dem är fel — ett fel tal kan man se, en tyst betydelseskillnad kan man
    // inte (Adam 2026-08-27, uppgift 12.48).
    //
    // `Map` bevarar insättningsordningen, och `rows` är sorterad på tid, så
    // listan blir "i den ordning de först dök upp" utan en egen sortering.
    const perÖvning = new Map<string, number>();
    for (const s of arbetsset) perÖvning.set(s.exerciseId, (perÖvning.get(s.exerciseId) ?? 0) + 1);

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
      setCount: arbetsset.length,
      // Avrundas INTE. Halvkilon är verkliga vikter (2,5 kg-skivor), och 12.18
      // avgjorde att de ska synas. `summarizeWorkout` i repo.ts returnerar också
      // orörd summa — divergerar de igen fångas det av testet i history.test.ts.
      totalVolumeKg,
      workExercises: [...perÖvning].map(([exerciseId, setCount]) => ({ exerciseId, setCount })),
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

/**
 * `SPEC.md` §2: snittet bygger på de tre senaste passen med övningen.
 *
 * ⚠️ **EXPORTERAD MED FLIT, OCH DET ÄR EN RÄTTELSE.** Talet var modullokalt, och
 * `SetRow` skrev en egen `3` på två ställen — i skärmläsartexten (*"enligt N
 * pass"*) och i prickarna som märker ett tunt underlag. **Ändrades tröskeln här
 * slutade båda stämma, tyst och utan att någon grind sa ett ord**: frågan hade
 * levererat fyra pass medan skärmen fortsatte kalla det tunt underlag.
 *
 * Det är samma sorts kopierade regel som `nudgeSteps` egen docblock varnar för,
 * och `/code-review` hittade den 2026-08-27 (uppgift 12.47). En regel som bor på
 * ett ställe kan inte glida isär med sig själv.
 */
export const ANTAL_PASS_I_SNITTET = 3;

/** Åtta veckor. Äldre underlag än så är inte längre ett normalläge. */
const ÅLDERSGRÄNS_MS = 56 * 24 * 60 * 60 * 1000;

export interface SetAverage {
  /**
   * Det n:te ARBETSSETET med övningen i passet, nollindexerat.
   *
   * ⚠️ **Inte samma sak som setradens plats i listan, och inte samma sak som
   * radens lagrade `setIndex`.** `logSet` numrerar alla set för övningen i
   * passet inklusive uppvärmningen (`repo.ts:232`), så ett pass med uppvärmning
   * lägger sitt första arbetsset på lagrat index 1 och ett pass utan lägger det
   * på 0. Grupperades det lagrade numret jämfördes arbetsset n med arbetsset
   * n+1 så fort uppvärmningsvanan skilde sig mellan passen — alltså ett utvilat
   * set mot ett trött, vilket är precis den förskjutning grupperingen finns för
   * att undvika. Hittat av `/code-review` 2026-08-25.
   *
   * **Skärmen måste räkna arbetsset själv för att slå upp rätt snitt.**
   * `SetRow` numrerar raderna med uppvärmningen inräknad och visar `W` för den.
   */
  workSetIndex: number;
  /** Snittet av underlagets vikter, avrundat till övningens viktsteg. */
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
  database: GymDatabase = db,
  options: {
    /**
     * Passet som INTE får bli sitt eget underlag.
     *
     * Passvyn skickar alltid med det pågående passet. Utan det blir
     * referensvärdet cirkulärt: bockar man av dagens set på 100 kg dras
     * snittet uppåt av det man just gjorde, mitt under passet. Talet ska säga
     * *"så här brukar det se ut"*, och då kan det inte innehålla det man
     * håller på med. Samma skäl och samma mönster som `getLastPerformance`.
     */
    excludeWorkoutId?: string;
  } = {}
): Promise<ExerciseSetAverages> {
  // Samma tre filter som spökdatan i 13.4: raderade, uppvärmning och
  // importerade. Det sista är det viktigaste — Adams `2024 vecka 14: Bänk:
  // 90 kg` var ett 1-repsmax ur gamla anteckningar, och blir det underlag lyfts
  // snittet av ett maxlyft.
  //
  // Filtret ligger FÖRE urvalet av pass: ett pass som bara innehåller
  // uppvärmning eller importerade rader har inget underlag att bidra med och
  // får inte äta en av de tre platserna.
  //
  // De tre senaste passen MED ÖVNINGEN — inte de tre senaste passen. Kör man
  // bänk på måndagen och ben tisdag till torsdag innehåller de tre senaste
  // passen noll bänkset, och raden hade stått tom just när den behövs.
  // Uppslaget går på `[exerciseId+performedAt]`, så pass utan övningen finns
  // aldrig i underlaget från första början.
  //
  // Läsningen går BAKLÄNGES genom indexet och stannar vid det fjärde passet, i
  // stället för att materialisera hela övningens historik och gallra efteråt.
  // Skillnaden växer med loggen: uppmätt på 1600 rader (400 pass) tar hela
  // vägen 13,7 ms mot baklängesvägens 1,3 ms, och baklänges är KONSTANT i
  // historikens storlek där den andra är linjär. Bänkpress två gånger i veckan
  // i två år ligger redan på ~830 rader, och frågan körs en gång per
  // övningskort plus en gång per loggat set.
  //
  // ⚠️ Det här förutsätter något den gamla vägen inte gjorde: att två pass inte
  // överlappar i tid. Appen har bara ett aktivt pass åt gången, så det gäller —
  // men ändras det är det HÄR det går sönder, inte i grupperingen.
  const underlag = new Set<string>();
  const rows: LocalSet[] = [];
  await database.loggedSets
    .where('[exerciseId+performedAt]')
    .between([exerciseId, ''], [exerciseId, '￿'])
    .reverse()
    .until((s) => underlag.size >= ANTAL_PASS_I_SNITTET && !underlag.has(s.workoutId))
    .each((s) => {
      if (s.isDeleted || s.isWarmup || s.source === 'import') return;
      if (s.workoutId === options.excludeWorkoutId) return;
      underlag.add(s.workoutId);
      rows.push(s);
    });
  // Tillbaka till stigande tid. Ordningen är inte kosmetisk: regeln för
  // oavgjort längre ner läser den.
  rows.reverse();

  // Sist i `rows` ÄR det senaste setet, eftersom listan är stigande. En reduce
  // som letar max hade gett samma svar men dolt att sorteringen bär regeln.
  const senastTränad = rows.at(-1)?.performedAt ?? null;
  if (senastTränad !== null && Date.now() - new Date(senastTränad).getTime() > ÅLDERSGRÄNS_MS) {
    return { sets: [], staleSince: senastTränad };
  }

  // Viktsteget följer utrustningen: 2,5 kg för skivstång, 1 kg för allt annat.
  // En hantelövning avrundad till 2,5 gör snittet 9 kg till 10 — en vikt som
  // kanske aldrig lyfts. Se `weightStepFor` för hela skälet.
  const övning = await database.exercises.get(exerciseId);
  const viktsteg = weightStepFor(övning?.equipment ?? null);

  // Per setnummer, eftersom man blir svagare för varje set i rad. Set 3
  // jämförs med set 3.
  //
  // Numret räknas om HÄR, bland de set som blivit kvar efter filtret — det
  // lagrade `setIndex` duger inte, se `workSetIndex` i `SetAverage`. `rows` är
  // sorterad stigande, så räknaren per pass ger arbetsseten i tidsordning.
  // Raderade och importerade set lämnar därmed inte heller några hål.
  //
  // Varje pass fyller platserna 0, 1, 2 … i följd, så en array blir tät och
  // stigande av sig själv. En Map hade behövt sorteras tillbaka efteråt, vilket
  // fick ordningen att se osäker ut trots att den är garanterad.
  //
  // 🔄 **RÄKNANDET ÄR DELAT MED SETRADEN SEDAN 2026-08-27, inte längre eget.**
  // Här stod en egen `Map<string, number>` som gjorde exakt det
  // `skapaArbetssetRäknare` gör. Del A krävde *"en delad härledning som båda
  // sidor anropar, inte två räkningar som ska råka stämma"*, och den här sidan
  // hade aldrig bytts om. `/code-review` hittade det (uppgift 12.42).
  const nästaNummer = skapaArbetssetRäknare();
  const perSetNummer: LocalSet[][] = [];
  for (const s of rows) {
    const nummer = nästaNummer(s.workoutId, s.isWarmup);
    // `rows` är redan filtrerad på `isWarmup`, så `null` kan inte nås här.
    // Kontrollen finns för typerna — och för att en framtida ändring av filtret
    // ovan inte tyst ska börja räkna uppvärmningar som arbetsset.
    if (nummer === null) continue;
    (perSetNummer[nummer] ??= []).push(s);
  }

  const sets = perSetNummer.map((rader, workSetIndex) => {
    const rått = rader.reduce((sum, s) => sum + s.weightKg, 0) / rader.length;
    const weightKg = Math.round(rått / viktsteg) * viktsteg;

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
      workSetIndex,
      weightKg,
      reps: närmast.reps,
      // Räknaren ovan ökar för varje set, så ett pass kan aldrig lägga två set
      // på samma setnummer: antalet rader ÄR antalet pass. En Set här hade sett
      // ut att skydda mot något och tvingat läsaren att bevisa att den inte gör
      // det.
      workoutCount: rader.length,
    };
  });

  return { sets, staleSince: null };
}

/**
 * Övningar användaren faktiskt har loggat, nyast först. Driver historiklistan.
 *
 * `setCount` räknar **arbetsset**, som resten av filen. Uppvärmningen togs bort
 * ur talet i 12.48: listan ligger i samma vy som passraderna, och två `N set` i
 * samma vy får inte betyda olika saker. Datumet däremot räknas ur ALLA set —
 * en dag man bara värmde upp är fortfarande en dag man rörde övningen, och
 * `lastPerformedAt` svarar på när, inte på hur mycket.
 */
export async function listTrainedExercises(
  database: GymDatabase = db
): Promise<Array<{ exerciseId: string; lastPerformedAt: string; setCount: number }>> {
  const rows = (await database.loggedSets.toArray()).filter((s) => !s.isDeleted);
  const map = new Map<string, { lastPerformedAt: string; setCount: number }>();
  for (const s of rows) {
    const current = map.get(s.exerciseId);
    const räknas = s.isWarmup ? 0 : 1;
    if (!current) map.set(s.exerciseId, { lastPerformedAt: s.performedAt, setCount: räknas });
    else {
      current.setCount += räknas;
      if (s.performedAt > current.lastPerformedAt) current.lastPerformedAt = s.performedAt;
    }
  }
  return [...map.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => (a.lastPerformedAt < b.lastPerformedAt ? 1 : -1));
}
