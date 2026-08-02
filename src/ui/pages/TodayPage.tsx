import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  createExercise,
  endWorkout,
  getActiveWorkout,
  logSet,
  pendingCount,
  startWorkout,
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
        <h1 className="text-2xl font-semibold">Pass</h1>

        <button
          type="button"
          onClick={() => void startWorkout()}
          className="w-full rounded-lg bg-[var(--color-fg)] py-4 text-lg font-semibold text-[var(--color-bg)] active:opacity-80"
        >
          Starta pass
        </button>

        {/* 11A.6 — den vanligaste loggningen som finns ska vara den snabbaste
            vägen genom appen, inte något man letar reda på. */}
        {previousId !== null && (
          <button
            type="button"
            onClick={() =>
              void (async () => {
                const w = await startWorkout();
                await copyWorkoutIntoPlan(w.id, previousId);
              })()
            }
            className="w-full rounded-lg border border-[var(--color-line)] py-4 text-lg active:bg-[var(--color-surface)]"
          >
            Kopiera förra passet
          </button>
        )}

        {osynkade > 0 && (
          <p className="text-xs text-[var(--color-dim)]">
            {osynkade} ändringar väntar på synk.
          </p>
        )}
      </section>
    );
  }

  const övningar = plan?.exercises ?? [];
  const klaraSet = övningar.reduce(
    (n, e) => n + e.sets.filter((s) => s.loggedSetId !== null).length,
    0
  );

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Pass</h1>
        <span className="text-sm text-[var(--color-dim)] tabular-nums">
          {elapsed(workout.startedAt)} · {klaraSet} set
        </span>
      </header>

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
          className="w-full rounded-lg border border-dashed border-[var(--color-line)] py-2 text-sm text-[var(--color-dim)]"
        >
          ⌨ Skriv i stället — &bdquo;Bänk 90x5&ldquo;
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
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]
                   py-4 text-lg font-medium active:opacity-80"
      >
        + Lägg till övning
      </button>

      {övningar.length === 0 && previousId !== null && (
        <button
          type="button"
          onClick={() => void copyWorkoutIntoPlan(workout.id, previousId)}
          className="w-full rounded-lg border border-[var(--color-line)] py-3 text-[var(--color-dim)]"
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
        className="w-full rounded-lg border border-[var(--color-line)] py-3 text-[var(--color-dim)]"
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
