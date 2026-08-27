import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatVolume } from '../../lib/steps';
import { loggadeArbetsset } from '../../lib/worksets';
import { db } from '../../db/db';
import {
  createExercise,
  endWorkout,
  getActiveWorkout,
  logSet,
  pendingCount,
  startWorkout,
  summarizeWorkout,
  type WorkoutSummary,
} from '../../db/repo';
import {
  addExerciseToPlan,
  attachLoggedSetToPlan,
  addSetToPlan,
  clearPlan,
  confirmPlannedSet,
  copyWorkoutIntoPlan,
  findPreviousWorkoutId,
  getPlan,
  removeExerciseFromPlan,
  removeSetFromPlan,
  unconfirmPlannedSet,
  updatePlannedSet,
} from '../../db/plan';
import type { ParsedSet } from '../../parser/types';
import { IkonTangentbord } from '../icons';
import { QuickLog } from '../QuickLog';
import { ExerciseCard } from '../ExerciseCard';
import { ExercisePicker } from '../ExercisePicker';
import { RestTimer } from '../RestTimer';
import { DEFAULT_REST_SECONDS, startRestTimer } from '../../timer/restTimer';

/**
 * Passvyn. Uppgift 11A.1, 11A.2, 11A.7.
 *
 * RITNINGEN, och därmed informationsarkitekturen:
 * fritextrutan ligger kvar i toppen som en **snabblänk**, men resten av
 * skärmen domineras av passets struktur — övningskort med setrader som bockas
 * av. Tidigare var det tvärtom: fritexten var hjälten och manuell inmatning låg
 * hopfälld bakom en länk. Det var tvärtemot hur folk faktiskt loggar.
 */

function elapsed(fromIso: string): string {
  const min = Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

const VECKODAGAR = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];

/** "5 övningar · 18 set · tisdag" — vad knappen faktiskt kommer att kopiera. */
function beskrivPass(s: WorkoutSummary): string {
  const dag = VECKODAGAR[new Date(s.startedAt).getDay()] ?? '';
  const delar = [
    `${s.exerciseCount} ${s.exerciseCount === 1 ? 'övning' : 'övningar'}`,
    `${s.setCount} set`,
  ];
  if (dag) delar.push(dag);
  return delar.join(' · ');
}

export function TodayPage() {
  const [picker, setPicker] = useState<{ mode: 'add' | 'swap'; replacing?: string } | null>(null);
  const [visaFritext, setVisaFritext] = useState(false);

  const workout = useLiveQuery(() => getActiveWorkout(), [], undefined);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const plan = useLiveQuery(
    () => (workout ? getPlan(workout.id) : Promise.resolve(null)),
    [workout?.id],
    null
  );
  const previousId = useLiveQuery(
    () => findPreviousWorkoutId(workout?.id ?? null),
    [workout?.id],
    null
  );
  const osynkade = useLiveQuery(() => pendingCount(), [], 0);

  // Sammanfattning av förra passet — driver förhandsvisningen på
  // kopiera-knappen. null tills den laddats, och knappen klarar det.
  const förraSammanfattning = useLiveQuery(
    () => (previousId ? summarizeWorkout(previousId) : Promise.resolve(null)),
    [previousId],
    null
  );

  // Passets egen sammanfattning. Räknas ur planen som redan är laddad i stället
  // för en extra databasfråga.
  const sammanfattning = useLiveQuery(
    () => (workout ? summarizeWorkout(workout.id) : Promise.resolve(null)),
    [workout?.id],
    null
  );

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const exerciseRefs = exercises
    .filter((e) => !e.isArchived && !e.isDeleted)
    .map((e) => ({ id: e.id, name: e.name, normalizedName: e.normalizedName, aliases: e.aliases }));

  // ---- fritext (11A.7: genväg, inte huvudväg) ----
  async function handleParsedLog(parsed: ParsedSet, fromAi: boolean) {
    if (!workout) throw new Error('inget aktivt pass');
    const row = await logSet(
      {
        workoutId: workout.id,
        exerciseId: parsed.exerciseId,
        weightKg: parsed.weightKg,
        reps: parsed.reps,
        effortType: parsed.effortType,
        effortValue: parsed.effortValue,
        note: parsed.note,
        // Ett AI-tolkat set får inte bokföras som lokalt tolkat — då blir
        // träffsäkerhetsjämförelsen i 8.10 meningslös.
        source: fromAi ? 'ai_parse' : 'local_parse',
      },
      db
    );
    // Planen är visningsmodellen. Utan detta hamnar setet i databasen men
    // syns aldrig i passvyn.
    await attachLoggedSetToPlan(workout.id, {
      exerciseId: parsed.exerciseId,
      loggedSetId: row.id,
      weightKg: parsed.weightKg,
      reps: parsed.reps,
    });
    void startRestTimer(DEFAULT_REST_SECONDS, row.id);
    return row;
  }

  if (workout === undefined) return null;

  // ---- inget pågående pass ----
  if (workout === null) {
    return (
      <section className="space-y-3">
        <h1 className="font-semibold">Pass</h1>

        <button
          type="button"
          onClick={() => void startWorkout()}
          className="w-full rounded-lg bg-[var(--color-fg)] py-4 text-exercise font-semibold text-[var(--color-bg)] active:opacity-80"
        >
          Starta tomt pass
        </button>

        {/* 11A.6 — den vanligaste loggningen som finns ska vara den snabbaste
            vägen genom appen, inte något man letar reda på.

            NYTT 2026-08-05: knappen visar nu VAD som kopieras. Tidigare stod
            bara "Kopiera förra passet", och man fick veta innehållet först
            efteråt — alltså när det redan var för sent att välja bort. */}
        {previousId !== null && (
          <button
            type="button"
            onClick={() =>
              void (async () => {
                const w = await startWorkout();
                await copyWorkoutIntoPlan(w.id, previousId);
              })()
            }
            className="flex w-full flex-col items-start rounded-lg border border-[var(--color-line-strong)] px-4 py-3 text-left active:bg-[var(--color-surface)]"
          >
            <span className="text-exercise">Kopiera förra passet</span>
            {förraSammanfattning && (
              <span className="text-meta text-[var(--color-dim)] tabular-nums">
                {beskrivPass(förraSammanfattning)}
              </span>
            )}
          </button>
        )}

        {/* Tomt tillstånd. Fanns inte alls före 11B — skärmen var en rubrik och
            en knapp på 550 px svart, vilket inte säger nybörjaren någonting om
            vad appen är till för. Tomma tillstånd är flöde, inte polering.
            Se DESIGN.md §3. */}
        {previousId === null && (
          <p className="pt-2 text-meta text-[var(--color-dim)]">
            Starta ett pass och lägg till övningar allt eftersom. Nästa gång kan
            du kopiera det här passet med ett tryck.
          </p>
        )}

        {osynkade > 0 && (
          <p className="text-meta text-[var(--color-dim)]">
            {osynkade} ändringar väntar på synk.
          </p>
        )}
      </section>
    );
  }

  const övningar = plan?.exercises ?? [];
  /**
   * Loggade **arbetsset** i hela passet. Uppvärmning räknas inte.
   *
   * 🔄 **`!s.isWarmup` tillagt 2026-08-27, och det är en rättning av en ruta som
   * motsade sig själv.** Volymen bredvid utesluter uppvärmning — `history.ts`
   * skriver ut skälet: *"De är förberedelse, inte arbete, och att blanda in dem
   * gör siffran obrukbar för jämförelser mellan pass."* Setantalet gjorde det
   * inte, så ett pass med uppvärmning + två arbetsset läste **`3 SET · 0 VOLYM
   * KG`**: två tal ur olika mängder, sida vid sida i samma ruta.
   *
   * ⚠️ **Det var tredje förekomsten av samma fel i samma familj.** 12.16 rättade
   * volymen (historiken och startskärmen visade olika tal för samma pass),
   * övningskortets metarad rättades samma dag — och den här rutan var kvar.
   *
   * ✅ **12.48 stängde sömmen.** Regeln skrevs om av varje konsument så länge
   * den bara fanns i frågelagret; nu bor den i `loggadeArbetsset` och den här
   * raden anropar den. **Skriv inte tillbaka filtret hit.**
   */
  const klaraSet = övningar.reduce((n, e) => n + loggadeArbetsset(e.sets).length, 0);

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h1 className="font-semibold">Pass</h1>
        <span className="text-meta text-[var(--color-dim)] tabular-nums">
          {elapsed(workout.startedAt)}
        </span>
      </header>

      {/* Sammanfattningsraden. Ny i 11B steg 4.2, hämtad från referensbilden i
          docs/Reference-pics/.

          VOLYM ÄR POÄNGEN. Den är appens bästa mått på hur tungt ett pass var,
          och den stod tidigare ingenstans — headern visade "0 min · 0 set", där
          setantalet är det minst intressanta av de tre.

          Mönstret stor siffra + liten etikett kommer från MacroFactor och är
          rätt för en app där siffran ÄR innehållet. */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-center">
        <div>
          <p className="text-set font-semibold tabular-nums">{klaraSet}</p>
          <p className="text-label tracking-wider text-[var(--color-dim)] uppercase">Set</p>
        </div>
        <div>
          <p className="text-set font-semibold tabular-nums">
            {formatVolume(sammanfattning?.volumeKg ?? 0)}
          </p>
          <p className="text-label tracking-wider text-[var(--color-dim)] uppercase">Volym kg</p>
        </div>
        <div>
          <p className="text-set font-semibold tabular-nums">{övningar.length}</p>
          <p className="text-label tracking-wider text-[var(--color-dim)] uppercase">Övningar</p>
        </div>
      </div>

      <RestTimer />

      {/* 11A.7 — fritexten är en genväg. Den ligger kvar i toppen men är
          hopfälld tills man vill ha den, så att passets struktur får plats. */}
      {visaFritext ? (
        <div className="rounded-lg border border-[var(--color-line)] p-2">
          <QuickLog
            exercises={exerciseRefs}
            unitPreference="kg"
            defaultEffortScale="rir"
            onLog={handleParsedLog}
            onCreateExercise={async (namn) => {
              await createExercise(namn, db);
            }}
          />
          <button
            type="button"
            onClick={() => setVisaFritext(false)}
            className="mt-1 min-h-0 text-xs text-[var(--color-dim)]"
          >
            Dölj snabbinmatning
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setVisaFritext(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-line-strong)] py-2 text-sm text-[var(--color-dim)]"
        >
          <IkonTangentbord className="size-4" />
          Skriv i stället: &bdquo;Bänk 90x5&ldquo;
        </button>
      )}

      {övningar.map((pe) => (
        <ExerciseCard
          key={pe.exerciseId}
          planned={pe}
          exercise={exerciseMap.get(pe.exerciseId)}
          workoutId={workout.id}
          onChangeSet={(setId, patch) =>
            void updatePlannedSet(workout.id, pe.exerciseId, setId, patch)
          }
          onConfirmSet={(setId) =>
            void (async () => {
              const { loggedSetId } = await confirmPlannedSet(workout.id, pe.exerciseId, setId);
              // Avbockning startar vilan — samma ögonblick som i fritextvägen.
              void startRestTimer(DEFAULT_REST_SECONDS, loggedSetId);
            })()
          }
          onUnconfirmSet={(setId) => void unconfirmPlannedSet(workout.id, pe.exerciseId, setId)}
          onRemoveSet={(setId) => void removeSetFromPlan(workout.id, pe.exerciseId, setId)}
          onAddSet={() => void addSetToPlan(workout.id, pe.exerciseId)}
          onRemoveExercise={() => void removeExerciseFromPlan(workout.id, pe.exerciseId)}
          onSwapExercise={() => setPicker({ mode: 'swap', replacing: pe.exerciseId })}
        />
      ))}

      {/* Central och stor, enligt ritningen. */}
      <button
        type="button"
        onClick={() => setPicker({ mode: 'add' })}
        className="w-full rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)]
                   py-4 text-lg font-medium active:opacity-80"
      >
        + Lägg till övning
      </button>

      {övningar.length === 0 && previousId !== null && (
        <button
          type="button"
          onClick={() => void copyWorkoutIntoPlan(workout.id, previousId)}
          className="w-full rounded-lg border border-[var(--color-line-strong)] py-3 text-[var(--color-dim)]"
        >
          Kopiera förra passet
        </button>
      )}

      <button
        type="button"
        onClick={() =>
          void (async () => {
            await endWorkout();
            await clearPlan(workout.id);
          })()
        }
        className="w-full rounded-lg border border-[var(--color-line-strong)] py-3 text-[var(--color-dim)]"
      >
        Avsluta pass
      </button>

      {picker && (
        <ExercisePicker
          title={picker.mode === 'swap' ? 'Byt övning' : 'Lägg till övning'}
          excludeIds={övningar.map((e) => e.exerciseId)}
          onClose={() => setPicker(null)}
          onPick={(exerciseId) =>
            void (async () => {
              if (picker.mode === 'swap' && picker.replacing) {
                await removeExerciseFromPlan(workout.id, picker.replacing);
              }
              await addExerciseToPlan(workout.id, exerciseId);
              setPicker(null);
            })()
          }
        />
      )}
    </section>
  );
}
