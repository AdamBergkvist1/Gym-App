import { useState } from 'react';
import { parseSetText } from '../parser/parse';
import { aiAvailability, parseWithAi } from '../ai/client';
import { recordParseAttempt, setParseOutcome } from '../db/parseLog';
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
  /** Alla set raden gav. `90x5x3` ger tre. */
  sets: ParsedSet[];
  weight: string;
  reps: string;
  /** Kom förslaget från AI:n? Då ska det märkas ut. */
  fromAi?: boolean;
  /** Raden i `parseLog` som ska få sitt utfall när användaren bestämt sig. */
  logId: string;
}

type AiState = 'idle' | 'thinking' | 'failed' | 'offline' | 'unavailable';

interface Props {
  exercises: ExerciseRef[];
  unitPreference: 'kg' | 'lb';
  defaultEffortScale: 'rir' | 'rpe';
  onLog: (set: ParsedSet, fromAi: boolean) => Promise<LocalSet>;
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
  const [aiState, setAiState] = useState<AiState>('idle');

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

      // Fas 8: AI-reserven träder in HÄR och bara här — efter att den lokala
      // grammatiken sagt ifrån. Aldrig i förväg, aldrig medan man skriver.
      const tillgänglig = await aiAvailability();
      if (tillgänglig !== 'ready') {
        setAiState(tillgänglig === 'offline' ? 'offline' : 'unavailable');
        return;
      }

      setAiState('thinking');
      const utfall = await parseWithAi(text);
      const aiProblem = utfall.result.unresolved[0];

      if (utfall.result.sets.length === 0) {
        setAiState('failed');
        if (aiProblem) setProblem(aiProblem);
        return;
      }

      setAiState('idle');
      setProblem(null);
      const aiLogId = await recordParseAttempt({
        rawText: text,
        parser: 'llm',
        sets: utfall.result.sets,
        provider: utfall.provider,
        model: utfall.model,
        latencyMs: utfall.latencyMs,
      });
      // AI-tolkade set får ALLTID bekräftas. Modellen föreslår; människan
      // avgör. Det är skillnaden mellan en assistent och en gissningsmaskin.
      setDraft({
        sets: utfall.result.sets,
        weight: String(utfall.result.sets[0]!.weightKg),
        reps: String(utfall.result.sets[0]!.reps),
        fromAi: true,
        logId: aiLogId,
      });
      return;
    }
    setAiState('idle');

    const parsed = result.sets;
    if (parsed.length === 0) return;

    setProblem(null);

    const logId = await recordParseAttempt({ rawText: text, parser: 'local', sets: parsed });

    // Räcker att ETT set är tvetydigt för att fråga om hela raden — de delar
    // ändå tolkning, och att spara hälften vore värre än att fråga en gång.
    const första = parsed[0]!;
    if (parsed.some((s) => s.confidence === 'low')) {
      setDraft({
        sets: parsed,
        weight: String(första.weightKg),
        reps: String(första.reps),
        logId,
      });
      return;
    }

    setBusy(true);
    try {
      // I ordning, så att setIndex blir rätt.
      for (const s of parsed) await onLog(s, false);
      // Sparat orört, utan att användaren behövt röra något: accepted.
      await setParseOutcome(logId, 'accepted');
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

    const första = draft.sets[0]!;
    // Rörde användaren fälten gäller den rättelsen hela raden. Rörde hen dem
    // inte behåller varje set sina egna värden — annars hade "90x5 85x5" blivit
    // två likadana set så fort man bekräftade.
    const ändrad = weight !== första.weightKg || reps !== första.reps;

    setBusy(true);
    try {
      const sparade = draft.sets.map((s) =>
        ändrad ? { ...s, weightKg: weight, reps, confidence: 'high' as const } : s
      );
      for (const s of sparade) await onLog(s, draft.fromAi === true);

      // 8.11: rörde användaren siffrorna hade parsern fel — och exakt VAD som
      // blev rätt sparas, så att felen går att analysera och inte bara räknas.
      await setParseOutcome(draft.logId, ändrad ? 'edited' : 'accepted', ändrad ? sparade : null);

      setText('');
      setDraft(null);
    } finally {
      setBusy(false);
    }
  }

  /** Avbryt = förslaget dög inte. Det är ett resultat, inte en icke-händelse. */
  async function dismissDraft() {
    if (!draft) return;
    await setParseOutcome(draft.logId, 'rejected');
    setDraft(null);
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
          <p className="text-sm text-[var(--color-warn-text)]">
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

      {aiState === 'thinking' && (
        <p className="mt-2 text-sm text-[var(--color-dim)]">Frågar AI:n…</p>
      )}
      {aiState === 'offline' && problem && (
        <p className="mt-1 text-xs text-[var(--color-dim)]">
          Offline — AI-tolkning kräver nät. Texten ligger kvar.
        </p>
      )}

      {draft && (
        <div className="mt-2 rounded-lg border border-[var(--color-warn-line)] bg-[var(--color-warn-bg)] p-3">
          {draft.fromAi && (
            <p className="mb-1 text-xs font-semibold text-[var(--color-warn-text)]">AI-tolkning</p>
          )}
          <p className="text-sm">
            Är det <strong>{draft.sets[0]!.exerciseName}</strong>, {draft.weight} kg ×{' '}
            {draft.reps} reps
            {draft.sets.length > 1 && <> — {draft.sets.length} set</>}?
          </p>
          {/* Modellens motivering. Härledd data får aldrig se ut som inmatad. */}
          {draft.sets[0]!.reasoning !== undefined && (
            <p className="mt-1 text-xs text-[var(--color-warn-text)]">{draft.sets[0]!.reasoning}</p>
          )}
          <p className="mt-1 text-xs text-[var(--color-dim)]">
            {draft.fromAi
              ? 'AI:n tolkade det åt dig. Kontrollera innan du sparar.'
              : 'Talen är tvetydiga när ingen enhet skrivs ut. Rätta om det blev fel.'}
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
              onClick={() => void dismissDraft()}
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
