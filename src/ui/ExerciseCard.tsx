import { useState } from 'react';
import { Link } from 'react-router';
import { SetRow } from './SetRow';
import type { PlannedExercise } from '../db/plan';
import type { LocalExercise } from '../db/types';

/**
 * En övning i passet, som kort. Uppgift 11A.2.
 *
 * Kortet är passets struktur: övningsnamn, dess set som rader, och en
 * "+ Lägg till set". Byt-knappen är 11A.5 — är utrustningen upptagen ska man
 * kunna byta övning och få den nyas historik direkt.
 */

interface Props {
  planned: PlannedExercise;
  exercise: LocalExercise | undefined;
  onChangeSet: (setId: string, patch: { weightKg?: number; reps?: number }) => void;
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
  onChangeSet,
  onConfirmSet,
  onUnconfirmSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
  onSwapExercise,
}: Props) {
  const [meny, setMeny] = useState(false);
  const klara = planned.sets.filter((s) => s.loggedSetId !== null).length;

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
      <header className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{exercise?.name ?? 'Okänd övning'}</h2>
          <p className="text-xs text-[var(--color-dim)] tabular-nums">
            {klara} av {planned.sets.length} set
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMeny((v) => !v)}
          aria-label={`Fler val för ${exercise?.name ?? 'övningen'}`}
          aria-expanded={meny}
          className="h-12 w-10 min-h-0 text-[var(--color-dim)]"
        >
          ⋯
        </button>
      </header>

      {meny && (
        <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)] px-3 pb-2">
          {/* 11A.5 — byt övning på två tryck. Historiken följer med automatiskt,
              eftersom den nya övningens spökdata hämtas när den läggs till. */}
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
            Ta bort
          </button>
        </div>
      )}

      <ul>
        {planned.sets.map((s, i) => (
          <SetRow
            key={s.id}
            index={i}
            set={s}
            onChange={(patch) => onChangeSet(s.id, patch)}
            onConfirm={() => onConfirmSet(s.id)}
            onUnconfirm={() => onUnconfirmSet(s.id)}
            onRemove={() => onRemoveSet(s.id)}
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
    </section>
  );
}
