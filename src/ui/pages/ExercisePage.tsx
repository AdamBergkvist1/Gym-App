import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router';
import { importedNotice } from '../../lib/importNotice';
import { formatWeight } from '../../lib/steps';
import { db } from '../../db/db';
import { getExerciseHistory, getPersonalRecords } from '../../db/history';
import { Sparkline } from '../Sparkline';
import { IkonPilVänster } from '../icons';

/**
 * En övning över tid: personbästa, e1RM-trend och alla set. Uppgift 9.2, 9.4, 9.5.
 *
 * Tyngsta set och bästa e1RM visas som två SKILDA rekord, eftersom de inte är
 * samma sak: 90×3 är tyngre på stången, men 80×8 är den starkare prestationen.
 * Att slå ihop dem hade dolt just den insikt e1RM finns för att ge.
 */

export function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const exerciseId = id ?? '';

  const exercise = useLiveQuery(
    () => (exerciseId ? db.exercises.get(exerciseId) : undefined),
    [exerciseId],
    undefined
  );
  const history = useLiveQuery(
    () => (exerciseId ? getExerciseHistory(exerciseId) : Promise.resolve([])),
    [exerciseId],
    []
  );
  const pb = useLiveQuery(
    () => (exerciseId ? getPersonalRecords(exerciseId) : null),
    [exerciseId],
    null
  );

  if (exercise === undefined) return null;

  if (exercise === null) {
    return (
      <section>
        <p className="text-sm text-[var(--color-dim)]">Övningen finns inte.</p>
        <Link to="/historik" className="text-sm underline">
          Tillbaka till historiken
        </Link>
      </section>
    );
  }

  const e1rmSerie = history.map((p) => p.e1rm).filter((v): v is number => v !== null);
  // 13.5. null när övningen inte har några importerade set — då står det inget.
  const importnotis = importedNotice(history);

  return (
    <section className="space-y-5">
      <div>
        {/* `inline-flex`, inte `flex`: med `flex` hade länken tagit hela radens
            bredd och gett en tryckyta långt utanför texten. */}
        <Link
          to="/historik"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-dim)]"
        >
          <IkonPilVänster className="size-4" />
          Historik
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{exercise.name}</h1>
        <p className="text-sm text-[var(--color-dim)]">
          {pb?.totalSets ?? 0} set · {exercise.primaryMuscle}
        </p>
      </div>

      {pb && (pb.heaviest || pb.bestE1rm) && (
        <div className="grid grid-cols-2 gap-2">
          {/* `role="group"` + `aria-labelledby` ger vakt 2 i `ovningssida.spec.ts` ett
              sätt att peka på RÄTT kort. Utan det hade testet fått matcha på siffran
              lösryckt, och 92,5 dyker upp på flera ställen på sidan — vakten hade
              inte kunnat skilja på om talet stod under rätt rubrik.

              `aria-labelledby` och inte `aria-label`: rubriken står redan som synlig
              text, och två kopior av samma sträng driver isär. Nu är det bokstavligen
              samma sträng som både syns och namnger gruppen. */}
          <div
            role="group"
            aria-labelledby="pb-tyngsta"
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
          >
            <p id="pb-tyngsta" className="text-xs text-[var(--color-dim)]">
              Tyngsta set
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {pb.heaviest ? formatWeight(pb.heaviest.weightKg) : '–'}
              <span className="text-sm text-[var(--color-dim)]"> kg</span>
            </p>
            {pb.heaviest && (
              <p className="text-xs text-[var(--color-dim)] tabular-nums">
                × {pb.heaviest.reps} reps
              </p>
            )}
          </div>

          <div
            role="group"
            aria-labelledby="pb-basta-e1rm"
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
          >
            <p id="pb-basta-e1rm" className="text-xs text-[var(--color-dim)]">
              Bästa e1RM
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {pb.bestE1rm ? formatWeight(pb.bestE1rm.e1rm) : '–'}
              <span className="text-sm text-[var(--color-dim)]"> kg</span>
            </p>
            {pb.bestE1rm && (
              <p className="text-xs text-[var(--color-dim)] tabular-nums">
                från {formatWeight(pb.bestE1rm.set.weightKg)} × {pb.bestE1rm.set.reps}
              </p>
            )}
          </div>
        </div>
      )}

      {(importnotis || e1rmSerie.length >= 2) && (
        <div className="space-y-2">
          {importnotis && (
            // `role="note"` + `aria-label` ger vakten i `ovningssida.spec.ts` något
            // att haka i som INTE är lydelsen. 12.22 skrev om just den här meningen
            // 2026-08-14, och ett test som matchat på texten hade gått sönder av den
            // rena textstädningen. Rollen är också ärlig mot innehållet: det är en
            // sidoupplysning om datan, inte en varning och inte en statusrad.
            //
            // ⚠️ **Etiketten måste vara namnet på vad raden HANDLAR om, aldrig en
            // upprepning av vad den säger.** `role="note"` ärver inget tillgängligt
            // namn från sitt innehåll, så utan den här raden uppfyller selektorn bara
            // halva beslut 7 i 11B.0e (`role` + tillgängligt namn) — vilket
            // `/code-review` påpekade 2026-08-13. Skriv aldrig om etiketten när
            // meningen skrivs om; det är hela poängen att de kan röra sig isär.
            <p
              role="note"
              aria-label="Om datans ursprung"
              className="text-xs text-[var(--color-dim)]"
            >
              {importnotis}
            </p>
          )}
          {e1rmSerie.length >= 2 && (
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
              <Sparkline values={e1rmSerie} label="e1RM över tid" />
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
          Alla set
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--color-dim)]">Inga set loggade ännu.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-[var(--color-line)]">
            {[...history].reverse().map((p) => (
              <li
                key={p.setId}
                className="flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 last:border-b-0"
              >
                <span className="w-24 text-xs text-[var(--color-dim)]">
                  {new Date(p.performedAt).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-lg tabular-nums">
                  {formatWeight(p.weightKg)}
                  <span className="text-sm text-[var(--color-dim)]"> kg</span>
                </span>
                <span className="text-lg tabular-nums">
                  {p.reps}
                  <span className="text-sm text-[var(--color-dim)]"> reps</span>
                </span>
                <span className="flex-1" />
                <span className="text-sm text-[var(--color-dim)] tabular-nums">
                  {/* Ingen siffra hittas på när formeln inte betyder något. */}
                  {p.e1rm === null ? '–' : `e1RM ${formatWeight(p.e1rm)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
