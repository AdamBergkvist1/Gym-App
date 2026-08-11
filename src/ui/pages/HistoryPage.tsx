import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { formatVolume } from '../../lib/steps';
import { db } from '../../db/db';
import { listTrainedExercises, listWorkoutSummaries } from '../../db/history';

/**
 * Passhistorik och övningslista. Uppgift 9.1.
 *
 * Siffrorna står i centrum (SPEC). Datumet är underordnat volymen och
 * setantalet, eftersom det är de senare man jämför mellan pass.
 */

function formatDate(iso: string): string {
  const d = new Date(iso);
  const idag = new Date();
  const igår = new Date(Date.now() - 86_400_000);
  const sammaDag = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sammaDag(d, idag)) return 'I dag';
  if (sammaDag(d, igår)) return 'I går';
  return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function HistoryPage() {
  const workouts = useLiveQuery(() => listWorkoutSummaries(50), [], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const trained = useLiveQuery(() => listTrainedExercises(), [], []);

  const namn = new Map(exercises.map((e) => [e.id, e.name]));

  if (workouts.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Historik</h1>
        <p className="mt-2 text-sm text-[var(--color-dim)]">
          Inga pass ännu. Logga ditt första under Pass.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Historik</h1>
        <p className="mt-1 text-sm text-[var(--color-dim)]">
          {workouts.length} pass ·{' '}
          {workouts.reduce((n, w) => n + w.setCount, 0)} set totalt
        </p>
      </div>

      <ul className="space-y-2">
        {workouts.map((w) => (
          <li
            key={w.workout.id}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{formatDate(w.workout.startedAt)}</span>
              <span className="text-sm text-[var(--color-dim)] tabular-nums">
                {w.setCount} set · {formatVolume(w.totalVolumeKg)} kg
                {w.durationMinutes !== null && ` · ${w.durationMinutes} min`}
              </span>
            </div>
            {w.workout.endedAt === null && (
              <span className="text-xs text-[var(--color-ok-text)]">Pågår</span>
            )}
            <p className="mt-1 truncate text-sm text-[var(--color-dim)]">
              {w.exerciseIds.map((id) => namn.get(id) ?? 'Okänd').join(' · ') || 'Inga set'}
            </p>
          </li>
        ))}
      </ul>

      {trained.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
            Övningar
          </h2>
          <ul className="overflow-hidden rounded-lg border border-[var(--color-line)]">
            {trained.map((t) => (
              <li key={t.exerciseId} className="border-b border-[var(--color-line)] last:border-b-0">
                <Link
                  to={`/ovning/${t.exerciseId}`}
                  className="flex items-center justify-between bg-[var(--color-surface)] px-3 py-2"
                >
                  <span>{namn.get(t.exerciseId) ?? 'Okänd övning'}</span>
                  <span className="text-sm text-[var(--color-dim)] tabular-nums">
                    {t.setCount} set →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
