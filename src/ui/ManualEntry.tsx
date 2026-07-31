import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getLastPerformance } from '../db/repo';
import type { LocalExercise } from '../db/types';

/**
 * Manuell inmatning med spökdata. Uppgift 5.6.
 *
 * Spökdatan är platshållartext, inte förifyllda värden. Skillnaden är viktig:
 * ett förifyllt fält som användaren inte rör blir loggat som om det vore
 * inmatat. En platshållare måste bekräftas — men den räcker som minnesstöd,
 * vilket är hela poängen (underlaget: "eliminerar det minnesmässiga pusslet").
 *
 * `inputMode` framkallar rätt tangentbord: decimal för vikt, numeric för reps.
 */

interface Props {
  exercises: LocalExercise[];
  workoutId: string;
  onLog: (input: { exerciseId: string; weightKg: number; reps: number; isWarmup: boolean }) => Promise<void>;
}

export function ManualEntry({ exercises, workoutId, onLog }: Props) {
  const [exerciseId, setExerciseId] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [busy, setBusy] = useState(false);

  const ghost = useLiveQuery(
    () => (exerciseId ? getLastPerformance(exerciseId, { excludeWorkoutId: workoutId }) : null),
    [exerciseId, workoutId],
    null
  );

  /**
   * Byter man övning ska förra övningens siffror inte ligga kvar — 90 kg
   * bänkpress får aldrig bli 90 kg sidolyft. Nollställningen sker här i
   * händelsehanteraren och inte i en effekt: en effekt hade gett en extra
   * renderomgång där de gamla siffrorna syns under en bildruta.
   */
  function bytOvning(id: string) {
    setExerciseId(id);
    setWeight('');
    setReps('');
  }

  const kanSpara =
    exerciseId !== '' &&
    Number.isFinite(Number(weight.replace(',', '.'))) &&
    weight.trim() !== '' &&
    Number.isInteger(Number(reps)) &&
    Number(reps) > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kanSpara || busy) return;
    setBusy(true);
    try {
      await onLog({
        exerciseId,
        weightKg: Number(weight.replace(',', '.')),
        reps: Number(reps),
        isWarmup,
      });
      setWeight('');
      setReps('');
      setIsWarmup(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2">
      <select
        value={exerciseId}
        onChange={(e) => bytOvning(e.target.value)}
        aria-label="Välj övning"
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base"
      >
        <option value="">Välj övning…</option>
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          // Spökdatan: exakt vad som lyftes senast, som grå platshållare.
          placeholder={ghost ? String(ghost.weightKg) : 'kg'}
          aria-label="Vikt i kg"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-center text-lg"
        />
        <span className="self-center text-[var(--color-dim)]">×</span>
        <input
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={ghost ? String(ghost.reps) : 'reps'}
          aria-label="Antal reps"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-center text-lg"
        />
        <button
          type="submit"
          disabled={!kanSpara || busy}
          className="rounded-lg bg-[var(--color-fg)] px-5 font-semibold text-[var(--color-bg)] disabled:opacity-40"
        >
          Spara
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-dim)]">
        <input
          type="checkbox"
          checked={isWarmup}
          onChange={(e) => setIsWarmup(e.target.checked)}
          className="size-5 min-h-0"
        />
        Uppvärmningsset
      </label>

      {exerciseId !== '' && ghost === null && (
        <p className="text-xs text-[var(--color-dim)]">
          Ingen tidigare historik för den här övningen.
        </p>
      )}
    </form>
  );
}
