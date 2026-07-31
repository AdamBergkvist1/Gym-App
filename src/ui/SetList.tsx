import type { LocalExercise, LocalSet } from '../db/types';

/**
 * De loggade seten i passet, grupperade per övning.
 *
 * Siffrorna står i centrum (SPEC). Ingen dekor, inga ikoner som inte bär
 * information.
 */

function formatWeight(kg: number): string {
  // 92.5 ska visas som 92,5 — svensk konvention. 90 ska visas som 90, inte 90,0.
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace('.', ',');
}

interface Props {
  sets: LocalSet[];
  exercises: Map<string, LocalExercise>;
  justAddedId: string | null;
  onDelete: (id: string) => void;
}

export function SetList({ sets, exercises, justAddedId, onDelete }: Props) {
  if (sets.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-dim)]">
        Inga set ännu. Skriv t.ex. <span className="font-mono">Bänk 90x5</span>.
      </p>
    );
  }

  const grupper: Array<{ exerciseId: string; rader: LocalSet[] }> = [];
  for (const s of sets) {
    const sist = grupper[grupper.length - 1];
    if (sist && sist.exerciseId === s.exerciseId) sist.rader.push(s);
    else grupper.push({ exerciseId: s.exerciseId, rader: [s] });
  }

  return (
    <div className="space-y-4">
      {grupper.map((g, i) => (
        <section key={`${g.exerciseId}-${i}`}>
          <h2 className="mb-1 text-sm font-semibold text-[var(--color-dim)]">
            {exercises.get(g.exerciseId)?.name ?? 'Okänd övning'}
          </h2>
          <ul className="overflow-hidden rounded-lg border border-[var(--color-line)]">
            {g.rader.map((s) => (
              <li
                key={s.id}
                className={[
                  'flex items-center gap-3 border-b border-[var(--color-line)] px-3 py-2 last:border-b-0',
                  // "Tyst framgång": en diskret färgförändring, ingen popup.
                  justAddedId === s.id ? 'bg-emerald-950/40' : 'bg-[var(--color-surface)]',
                ].join(' ')}
              >
                <span className="w-6 text-sm text-[var(--color-dim)]">{s.setIndex + 1}</span>
                <span className="text-lg tabular-nums">
                  {formatWeight(s.weightKg)}
                  <span className="text-sm text-[var(--color-dim)]"> kg</span>
                </span>
                <span className="text-lg tabular-nums">
                  {s.reps}
                  <span className="text-sm text-[var(--color-dim)]"> reps</span>
                </span>
                {s.effortValue !== null && (
                  <span className="text-sm text-[var(--color-dim)]">
                    {s.effortType?.toUpperCase()} {s.effortValue}
                  </span>
                )}
                {s.isWarmup && <span className="text-xs text-[var(--color-dim)]">uppv.</span>}
                <span className="flex-1" />
                {s.note !== null && (
                  <span className="max-w-[40%] truncate text-xs text-[var(--color-dim)]">
                    {s.note}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  aria-label={`Ta bort set ${s.setIndex + 1}`}
                  className="px-2 text-[var(--color-dim)]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
