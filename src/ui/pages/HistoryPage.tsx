import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { formatVolume } from '../../lib/steps';
import { muskelrad } from '../../lib/muskelgrupper';
import { passdatum } from '../../lib/passdatum';
import { db } from '../../db/db';
import { listTrainedExercises, listWorkoutSummaries } from '../../db/history';
import { IkonPilHöger } from '../icons';

/**
 * Passhistorik och övningslista. Uppgift 9.1, formen från steg 4.3.
 *
 * Siffrorna står i centrum (SPEC). Datumet är underordnat volymen och
 * setantalet, eftersom det är de senare man jämför mellan pass.
 */

export function HistoryPage() {
  const workouts = useLiveQuery(() => listWorkoutSummaries(50), [], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const trained = useLiveQuery(() => listTrainedExercises(), [], []);

  // Hela raden, inte bara namnet: passkortets andra rad behöver `primaryMuscle`.
  const övningar = new Map(exercises.map((e) => [e.id, e]));
  const namn = (id: string) => övningar.get(id)?.name ?? 'Okänd';

  if (workouts.length === 0) {
    return (
      <section>
        <h1 className="font-semibold">Historik</h1>
        <p className="mt-2 text-sm text-[var(--color-dim)]">
          Inga pass ännu. Logga ditt första under Pass.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-semibold">Historik</h1>
        <p className="mt-1 text-sm text-[var(--color-dim)]">
          {workouts.length} pass ·{' '}
          {workouts.reduce((n, w) => n + w.setCount, 0)} set totalt
        </p>
      </div>

      {/* Namnet skiljer passlistan från övningslistan längre ner — båda är
          `ul` med `listitem`, och utan namn går de inte att hålla isär vare sig
          för en skärmläsare eller för vakt 4 i 12.20. */}
      <ul aria-label="Pass" className="space-y-2">
        {workouts.map((w) => {
          // ⚠️ **Övningar vi inte kan slå upp hoppas över i stället för att
          // gissas.** `exercises` är en egen `useLiveQuery` och är tom i första
          // renderingen — en gissad muskelgrupp hade då skrivit ut en grupp
          // passet inte innehöll, och sedan bytt till rätt utan att någon såg
          // det. Blir listan tom uteblir raden, vilket är samma svar som för
          // ett pass utan arbetsset.
          const muskler = muskelrad(
            w.workExercises.flatMap((ö) => {
              const övning = övningar.get(ö.exerciseId);
              return övning ? [{ muscle: övning.primaryMuscle, setCount: ö.setCount }] : [];
            })
          );

          return (
            <li
              key={w.workout.id}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{passdatum(w.workout.startedAt)}</span>
                {/* Längden och `Pågår` delar plats för att de svarar på samma
                    fråga — hur länge höll passet på — och `durationMinutes` är
                    null i exakt de fall `endedAt` är det. Att grena på null
                    säger dessutom typerna vad vi vet. */}
                {w.durationMinutes === null ? (
                  <span className="text-meta text-[var(--color-ok-text)]">Pågår</span>
                ) : (
                  <span className="text-meta text-[var(--color-dim)] tabular-nums">
                    {w.durationMinutes} min
                  </span>
                )}
              </div>

              {muskler !== null && <p className="mt-1 truncate text-meta">{muskler}</p>}

              {/* ⛔ **Tre tal ur EN mängd.** Alla tre kommer ur `arbetsset` i
                  `listWorkoutSummaries` — se doc-kommentaren på `workExercises`.
                  Räkna dem inte om här; det är vanan 12.42, 12.48 och 12.49 kom
                  ur, tre gånger i rad.

                  Ett pass utan arbetsset visar en fras i stället för tre nollor.
                  §3.3: en nolla ser ut som ett resultat. */}
              <p className="mt-1 text-meta text-[var(--color-dim)] tabular-nums">
                {w.setCount === 0
                  ? 'Inga arbetsset'
                  : `${w.setCount} set · ${formatVolume(w.totalVolumeKg)} kg · ${w.workExercises.length} övn`}
              </p>
            </li>
          );
        })}
      </ul>

      {trained.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
            Övningar
          </h2>
          <ul
            aria-label="Övningar"
            className="overflow-hidden rounded-lg border border-[var(--color-line)]"
          >
            {trained.map((t) => (
              <li key={t.exerciseId} className="border-b border-[var(--color-line)] last:border-b-0">
                <Link
                  to={`/ovning/${t.exerciseId}`}
                  className="flex items-center justify-between bg-[var(--color-surface)] px-3 py-2"
                >
                  <span>{namn(t.exerciseId)}</span>
                  <span className="flex items-center gap-1 text-sm text-[var(--color-dim)] tabular-nums">
                    {t.setCount} set
                    <IkonPilHöger className="size-4" />
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
