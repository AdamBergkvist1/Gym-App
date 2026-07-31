import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  deleteSet,
  endWorkout,
  getActiveWorkout,
  getSetsForWorkout,
  logSet,
  pendingCount,
  startWorkout,
} from '../../db/repo';
import type { ParsedSet } from '../../parser/types';
import { QuickLog } from '../QuickLog';
import { ManualEntry } from '../ManualEntry';
import { SetList } from '../SetList';

/**
 * Vyn för aktivt pass. Uppgift 5.5, 5.7.
 *
 * All data kommer från Dexie via `useLiveQuery`. Ingen läsning går till nätet,
 * och därför finns ingen laddningsspinnare i den kritiska vägen: skrivningen
 * går till IndexedDB och UI:t uppdateras av prenumerationen.
 */

function elapsed(fromIso: string): string {
  const min = Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function TodayPage() {
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [visaManuell, setVisaManuell] = useState(false);

  const workout = useLiveQuery(() => getActiveWorkout(), [], undefined);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const sets = useLiveQuery(
    () => (workout ? getSetsForWorkout(workout.id) : Promise.resolve([])),
    [workout?.id],
    []
  );
  const osynkade = useLiveQuery(() => pendingCount(), [], 0);

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const exerciseRefs = exercises
    .filter((e) => !e.isArchived && !e.isDeleted)
    .map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalizedName,
      aliases: e.aliases,
    }));

  /** Markerar raden kort — "tyst framgång", ingen popup. */
  function flash(id: string) {
    setJustAdded(id);
    setTimeout(() => setJustAdded((current) => (current === id ? null : current)), 1200);
  }

  async function handleParsedLog(parsed: ParsedSet) {
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
        source: 'local_parse',
      },
      db
    );
    flash(row.id);
    return row;
  }

  // useLiveQuery ger undefined tills första svaret kommit.
  if (workout === undefined) return null;

  if (workout === null) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Pass</h1>
        <p className="text-sm text-[var(--color-dim)]">Inget pågående pass.</p>
        <button
          type="button"
          onClick={() => void startWorkout()}
          className="w-full rounded-lg bg-[var(--color-fg)] py-4 text-lg font-semibold text-[var(--color-bg)]"
        >
          Starta pass
        </button>
        {osynkade > 0 && (
          <p className="text-xs text-[var(--color-dim)]">
            {osynkade} ändringar väntar på synk. Synken byggs i fas 7 — datan ligger kvar
            lokalt tills dess.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Pass</h1>
        <span className="text-sm text-[var(--color-dim)]">
          {elapsed(workout.startedAt)} · {sets.length} set
        </span>
      </header>

      <QuickLog
        exercises={exerciseRefs}
        unitPreference="kg"
        defaultEffortScale="rir"
        onLog={handleParsedLog}
      />

      <SetList
        sets={sets}
        exercises={exerciseMap}
        justAddedId={justAdded}
        onDelete={(id) => void deleteSet(id, db)}
      />

      <div className="rounded-lg border border-[var(--color-line)] p-3">
        <button
          type="button"
          onClick={() => setVisaManuell((v) => !v)}
          className="w-full text-left text-sm text-[var(--color-dim)]"
        >
          {visaManuell ? '− Dölj manuell inmatning' : '+ Manuell inmatning'}
        </button>
        {visaManuell && (
          <div className="mt-3">
            <ManualEntry
              exercises={exercises.filter((e) => !e.isArchived && !e.isDeleted)}
              workoutId={workout.id}
              onLog={async (input) => {
                const row = await logSet({ workoutId: workout.id, ...input }, db);
                flash(row.id);
              }}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void endWorkout()}
        className="w-full rounded-lg border border-[var(--color-line)] py-3 text-[var(--color-dim)]"
      >
        Avsluta pass
      </button>
    </section>
  );
}
