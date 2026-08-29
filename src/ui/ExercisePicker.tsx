import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { listTrainedExercises } from '../db/history';
import { normalizeName } from '../parser/normalize';
import type { LocalExercise } from '../db/types';

/**
 * Övningsväljaren. Uppgift 11A.4 och 11A.5.
 *
 * RITNINGEN: fullskärm, sökfält högst upp, senast använda överst som genvägar.
 *
 * Varför senast använda ligger först: en `<select>` med 45 rader är en lista,
 * inte ett gränssnitt. I praktiken roterar man mellan en handfull övningar, och
 * de ska nås utan att man scrollar eller skriver. Det är också det som gör
 * 11A.5 möjlig — att byta övning på två tryck när utrustningen är upptagen.
 */

interface Props {
  /** Redan tillagda i passet — visas som redan valda. */
  excludeIds?: string[];
  title?: string;
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}

export function ExercisePicker({ excludeIds = [], title = 'Lägg till övning', onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const trained = useLiveQuery(() => listTrainedExercises(), [], []);

  const tillgängliga = useMemo(
    () => exercises.filter((e) => !e.isDeleted && !e.isArchived),
    [exercises]
  );

  const q = normalizeName(query);

  const träffar = useMemo(() => {
    if (q === '') return null;
    return tillgängliga.filter(
      (e) => e.normalizedName.includes(q) || e.aliases.some((a) => normalizeName(a).includes(q))
    );
  }, [tillgängliga, q]);

  const senaste = useMemo(() => {
    const byId = new Map(tillgängliga.map((e) => [e.id, e]));
    return trained
      .map((t) => byId.get(t.exerciseId))
      .filter((e): e is LocalExercise => e !== undefined)
      .slice(0, 8);
  }, [trained, tillgängliga]);

  const perMuskel = useMemo(() => {
    const map = new Map<string, LocalExercise[]>();
    for (const e of [...tillgängliga].sort((a, b) => a.name.localeCompare(b.name, 'sv'))) {
      const list = map.get(e.primaryMuscle);
      if (list) list.push(e);
      else map.set(e.primaryMuscle, [e]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'sv'));
  }, [tillgängliga]);

  function Rad({ e }: { e: LocalExercise }) {
    const redan = excludeIds.includes(e.id);
    return (
      <li>
        <button
          type="button"
          disabled={redan}
          onClick={() => onPick(e.id)}
          className="flex w-full items-center justify-between border-b border-[var(--color-line)]
                     px-4 text-left active:bg-[var(--color-surface)] disabled:opacity-40"
        >
          <span>{e.name}</span>
          <span className="text-xs text-[var(--color-dim)]">
            {redan ? 'tillagd' : e.primaryMuscle}
          </span>
        </button>
      </li>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]"
    >
      <header className="flex items-center gap-2 border-b border-[var(--color-line)] p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök övning…"
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-[var(--color-line-strong)] px-4 text-[var(--color-dim)]"
        >
          Avbryt
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {träffar !== null ? (
          träffar.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-dim)]">
              Ingen övning matchar &bdquo;{query}&ldquo;.
            </p>
          ) : (
            <ul>
              {träffar.map((e) => (
                <Rad key={e.id} e={e} />
              ))}
            </ul>
          )
        ) : (
          <>
            {senaste.length > 0 && (
              <section>
                <h2 className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
                  Senast använda
                </h2>
                <ul>
                  {senaste.map((e) => (
                    <Rad key={e.id} e={e} />
                  ))}
                </ul>
              </section>
            )}
            {perMuskel.map(([muskel, list]) => (
              <section key={muskel}>
                <h2 className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
                  {muskel}
                </h2>
                <ul>
                  {list.map((e) => (
                    <Rad key={e.id} e={e} />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
