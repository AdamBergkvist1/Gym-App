import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SetRow, SET_GRID } from './SetRow';
import { SetAdjustSheet } from './SetAdjustSheet';
import { getLastPerformance } from '../db/repo';
import type { PlannedExercise } from '../db/plan';
import type { LocalExercise } from '../db/types';

/**
 * En övning i passet, som kort. Uppgift 11A.2 och 11A.5.
 *
 * Kortet äger justeringsarket för sina rader — det behöver övningens namn och
 * ska bara finnas i ett exemplar åt gången.
 */

interface Props {
  planned: PlannedExercise;
  exercise: LocalExercise | undefined;
  workoutId: string;
  onChangeSet: (setId: string, patch: { weightKg?: number; reps?: number; isWarmup?: boolean }) => void;
  onConfirmSet: (setId: string) => void;
  onUnconfirmSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onSwapExercise: () => void;
}

export function ExerciseCard({
  planned,
  exercise,
  workoutId,
  onChangeSet,
  onConfirmSet,
  onUnconfirmSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
  onSwapExercise,
}: Props) {
  const [meny, setMeny] = useState(false);
  const [justerar, setJusterar] = useState<string | null>(null);

  const ghost = useLiveQuery(
    () => getLastPerformance(planned.exerciseId, { excludeWorkoutId: workoutId }),
    [planned.exerciseId, workoutId],
    null
  );

  const klara = planned.sets.filter((s) => s.loggedSetId !== null).length;
  const aktivt = planned.sets.find((s) => s.id === justerar);

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
      <header className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{exercise?.name ?? 'Okänd övning'}</h2>
          <p className="text-xs text-[var(--color-dim)] tabular-nums">
            {klara} av {planned.sets.length} set
            {ghost && ` · sist ${ghost.weightKg} kg × ${ghost.reps}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMeny((v) => !v)}
          aria-label={`Fler val för ${exercise?.name ?? 'övningen'}`}
          aria-expanded={meny}
          className="h-12 w-10 min-h-0 shrink-0 text-[var(--color-dim)]"
        >
          ⋯
        </button>
      </header>

      {meny && (
        <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)] px-3 pb-2">
          {/* 11A.5 — byt övning på två tryck. Historiken följer med automatiskt. */}
          <button
            type="button"
            onClick={() => {
              setMeny(false);
              onSwapExercise();
            }}
            className="min-h-0 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm"
          >
            Byt övning
          </button>
          {exercise && (
            <Link
              to={`/ovning/${exercise.id}`}
              className="min-h-0 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm"
            >
              Historik
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setMeny(false);
              onRemoveExercise();
            }}
            className="min-h-0 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm text-amber-400"
          >
            Ta bort övning
          </button>
        </div>
      )}

      {/*
        Kolumnrubriker EN gång, som i referensbilden. Det är detta som gör att
        cellerna får plats: de behöver inte upprepa "kg" och "×" på varje rad.
      */}
      <div
        className={`${SET_GRID} border-y border-[var(--color-line)] bg-[var(--color-bg)]/40 px-2 py-1`}
      >
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Set
        </span>
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Förra
        </span>
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Kg
        </span>
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Reps
        </span>
        <span className="text-center text-[0.65rem] text-[var(--color-dim)]">✓</span>
      </div>

      <ul>
        {planned.sets.map((s, i) => (
          <SetRow
            key={s.id}
            index={i}
            set={s}
            ghost={ghost ? { weightKg: ghost.weightKg, reps: ghost.reps } : null}
            onOpenAdjust={() => setJusterar(s.id)}
            onConfirm={() => onConfirmSet(s.id)}
            onUnconfirm={() => onUnconfirmSet(s.id)}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={onAddSet}
        className="w-full border-t border-[var(--color-line)] py-2 text-sm text-[var(--color-dim)] active:bg-[var(--color-bg)]"
      >
        + Lägg till set
      </button>

      {aktivt && (
        <SetAdjustSheet
          exerciseName={exercise?.name ?? 'Övning'}
          setNumber={planned.sets.findIndex((s) => s.id === aktivt.id) + 1}
          weightKg={aktivt.weightKg}
          reps={aktivt.reps}
          isWarmup={aktivt.isWarmup}
          onChange={(patch) => onChangeSet(aktivt.id, patch)}
          onRemove={() => {
            onRemoveSet(aktivt.id);
            setJusterar(null);
          }}
          onClose={() => setJusterar(null)}
        />
      )}
    </section>
  );
}
