import { useState } from 'react';
import { parseSetText } from '../parser/parse';
import type { ExerciseRef, ParsedSet, Unresolved, UnresolvedReason } from '../parser/types';
import type { LocalSet } from '../db/types';

/**
 * Fritextinmatningen. Uppgift 5.8.
 *
 * Ordningen är den i PLAN.md §4.3: den lokala grammatiken körs alltid först,
 * offline och på nolltid. LLM-reserven (fas 8) kopplas in på `unresolved`, inte
 * i stället för det här.
 *
 * Hög konfidens loggas direkt — "tysta framgångar", ingen bekräftelseruta.
 * Låg konfidens visar ett redigerbart utkast: hellre fråga en gång än logga
 * ett omvänt set.
 */

const REASON_TEXT: Record<UnresolvedReason, string> = {
  empty: 'Skriv något först.',
  missing_exercise: 'Vilken övning? Skriv t.ex. "Bänk 90x5".',
  unknown_exercise: 'Känner inte igen övningen.',
  ambiguous_exercise: 'Flera övningar passar. Skriv hela namnet.',
  missing_numbers: 'Vikt och reps saknas.',
  missing_reps: 'Reps saknas. Skriv t.ex. "90x5".',
  ambiguous_numbers: 'Kunde inte se vad som är vikt och reps.',
  effort_out_of_range: 'Ansträngning måste vara mellan 0 och 10.',
};

interface Draft {
  set: ParsedSet;
  weight: string;
  reps: string;
}

interface Props {
  exercises: ExerciseRef[];
  unitPreference: 'kg' | 'lb';
  defaultEffortScale: 'rir' | 'rpe';
  onLog: (set: ParsedSet) => Promise<LocalSet>;
  /** Uppgift 5.9 — skapar övningen och låter användaren logga direkt efteråt. */
  onCreateExercise: (name: string) => Promise<void>;
}

export function QuickLog({
  exercises,
  unitPreference,
  defaultEffortScale,
  onLog,
  onCreateExercise,
}: Props) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<Unresolved | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const result = parseSetText(text, { exercises, unitPreference, defaultEffortScale });

    const problemet = result.unresolved[0];
    if (problemet) {
      // Texten ligger kvar. Den får aldrig försvinna bara för att vi inte
      // förstod den.
      setProblem(problemet);
      setDraft(null);
      return;
    }

    const parsed = result.sets[0];
    if (!parsed) return;

    setProblem(null);

    if (parsed.confidence === 'low') {
      setDraft({ set: parsed, weight: String(parsed.weightKg), reps: String(parsed.reps) });
      return;
    }

    setBusy(true);
    try {
      await onLog(parsed);
      setText('');
      setDraft(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDraft() {
    if (!draft || busy) return;
    const weight = Number(draft.weight.replace(',', '.'));
    const reps = Number(draft.reps);
    if (!Number.isFinite(weight) || !Number.isInteger(reps) || reps <= 0) return;

    setBusy(true);
    try {
      await onLog({ ...draft.set, weightKg: weight, reps, confidence: 'high' });
      setText('');
      setDraft(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={(e) => void submit(e)} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (problem) setProblem(null);
          }}
          placeholder="Bänk 90x5"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Logga ett set med fritext"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)]
                     bg-[var(--color-surface)] px-3 text-lg"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[var(--color-fg)] px-5 font-semibold text-[var(--color-bg)]
                     disabled:opacity-50"
        >
          Logga
        </button>
      </form>

      {problem && (
        <div role="alert" className="mt-2">
          <p className="text-sm text-amber-400">
            {REASON_TEXT[problem.reason]}
            {problem.hint !== undefined && (
              <span className="text-[var(--color-dim)]"> ({problem.hint})</span>
            )}
          </p>
          {/*
            Uppgift 5.9. En miss ska ha en väg vidare, inte bara ett nej.
            Övningen skapas, texten ligger kvar, och nästa tryck på Logga
            fungerar — två tryck totalt.
          */}
          {problem.reason === 'unknown_exercise' && problem.attemptedName !== undefined && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const namn = problem.attemptedName;
                if (namn === undefined) return;
                setBusy(true);
                void onCreateExercise(namn)
                  .then(() => setProblem(null))
                  .finally(() => setBusy(false));
              }}
              className="mt-2 w-full rounded-lg border border-[var(--color-line)]
                         bg-[var(--color-surface)] px-3 text-sm disabled:opacity-50"
            >
              Skapa övningen &bdquo;{problem.attemptedName}&rdquo;
            </button>
          )}
        </div>
      )}

      {draft && (
        <div className="mt-2 rounded-lg border border-amber-700/60 bg-amber-950/30 p-3">
          <p className="text-sm">
            Är det <strong>{draft.set.exerciseName}</strong>, {draft.weight} kg × {draft.reps}{' '}
            reps?
          </p>
          <p className="mt-1 text-xs text-[var(--color-dim)]">
            Talen är tvetydiga när ingen enhet skrivs ut. Rätta om det blev fel.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              inputMode="decimal"
              value={draft.weight}
              onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
              aria-label="Vikt i kg"
              className="w-20 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 text-center text-lg"
            />
            <span className="self-center text-[var(--color-dim)]">×</span>
            <input
              inputMode="numeric"
              value={draft.reps}
              onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
              aria-label="Antal reps"
              className="w-20 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-2 text-center text-lg"
            />
            <button
              type="button"
              onClick={() => void confirmDraft()}
              disabled={busy}
              className="flex-1 rounded-md bg-[var(--color-fg)] font-semibold text-[var(--color-bg)] disabled:opacity-50"
            >
              Spara
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md border border-[var(--color-line)] px-3 text-[var(--color-dim)]"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
