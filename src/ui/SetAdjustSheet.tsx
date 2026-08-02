import { useState } from 'react';
import { ScrollPicker } from './ScrollPicker';
import {
  DIGIT_VALUES,
  HALF_VALUES,
  REP_VALUES,
  toDigits,
  withDigit,
} from '../lib/digits';
import { formatWeight, stepReps, stepWeight } from '../lib/steps';

/**
 * Bottenark för att justera ett set. Uppgift 11A.3b.
 *
 * VARFÖR DET FINNS: åtta tryckytor på en rad får inte plats på 375 px — det
 * gick sönder på riktig telefon. Lösningen är inte mindre knappar utan att
 * flytta justeringen hit, vilket är hur Hevy och Strong gör.
 *
 * Vikten har ett hjul per siffra så att 20 → 62,5 är två drag i stället för
 * sjutton tryck, och 1 kg-finjustering för hantlar sker på entalshjulet.
 * ±-knapparna finns kvar för den som bara vill nudga.
 */

interface Props {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  onChange: (patch: { weightKg?: number; reps?: number; isWarmup?: boolean }) => void;
  onRemove: () => void;
  onClose: () => void;
}

const NUDGE =
  'flex h-11 flex-1 items-center justify-center rounded-md border ' +
  'border-[var(--color-line)] text-lg active:opacity-60';

export function SetAdjustSheet({
  exerciseName,
  setNumber,
  weightKg,
  reps,
  isWarmup,
  onChange,
  onRemove,
  onClose,
}: Props) {
  const [bekräftaBort, setBekräftaBort] = useState(false);
  const d = toDigits(weightKg);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Justera set ${setNumber}, ${exerciseName}`}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Tryck utanför för att stänga. Ändringarna är redan sparade. */}
      <button
        type="button"
        aria-label="Stäng"
        onClick={onClose}
        className="absolute inset-0 min-h-0 bg-black/60"
      />

      <div className="relative w-full rounded-t-2xl border-t border-[var(--color-line)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-line)]" aria-hidden />

        <header className="px-4 pt-2 pb-1">
          <h2 className="truncate text-lg font-semibold">{exerciseName}</h2>
          <p className="text-sm text-[var(--color-dim)] tabular-nums">
            Set {setNumber} · {formatWeight(weightKg)} kg × {reps}
          </p>
        </header>

        {/* ---- vikt ---- */}
        <div className="px-4 pt-2">
          <p className="mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
            Vikt
          </p>
          <div className="flex items-start justify-center gap-1">
            <ScrollPicker
              label="Hundratal kilo"
              caption="100"
              values={DIGIT_VALUES}
              value={d.hundreds}
              onChange={(v) => onChange({ weightKg: withDigit(weightKg, 'hundreds', v) })}
              className="flex-1"
            />
            <ScrollPicker
              label="Tiotal kilo"
              caption="10"
              values={DIGIT_VALUES}
              value={d.tens}
              onChange={(v) => onChange({ weightKg: withDigit(weightKg, 'tens', v) })}
              className="flex-1"
            />
            <ScrollPicker
              label="Ental kilo"
              caption="1"
              values={DIGIT_VALUES}
              value={d.ones}
              onChange={(v) => onChange({ weightKg: withDigit(weightKg, 'ones', v) })}
              className="flex-1"
            />
            <ScrollPicker
              label="Halvkilo"
              caption=",5"
              values={HALF_VALUES}
              value={d.half}
              onChange={(v) => onChange({ weightKg: withDigit(weightKg, 'half', v) })}
              className="flex-1"
            />
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ weightKg: stepWeight(weightKg, -1, 1) })}
              className={NUDGE}
            >
              −1
            </button>
            <button
              type="button"
              onClick={() => onChange({ weightKg: stepWeight(weightKg, -1) })}
              className={NUDGE}
            >
              −2,5
            </button>
            <button
              type="button"
              onClick={() => onChange({ weightKg: stepWeight(weightKg, 1) })}
              className={NUDGE}
            >
              +2,5
            </button>
            <button
              type="button"
              onClick={() => onChange({ weightKg: stepWeight(weightKg, 1, 1) })}
              className={NUDGE}
            >
              +1
            </button>
          </div>
        </div>

        {/* ---- reps ---- */}
        <div className="mt-4 flex items-start gap-4 px-4">
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
              Reps
            </p>
            <div className="flex items-start gap-2">
              <ScrollPicker
                label="Antal reps"
                values={REP_VALUES}
                value={reps}
                onChange={(v) => onChange({ reps: v })}
                className="w-20"
              />
              <div className="flex flex-1 flex-col gap-2 pt-8">
                <button
                  type="button"
                  onClick={() => onChange({ reps: stepReps(reps, 1) })}
                  className={NUDGE}
                >
                  +1 rep
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ reps: stepReps(reps, -1) })}
                  className={NUDGE}
                >
                  −1 rep
                </button>
              </div>
            </div>
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 px-4 text-sm text-[var(--color-dim)]">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => onChange({ isWarmup: e.target.checked })}
            className="size-5 min-h-0"
          />
          Uppvärmningsset
        </label>

        <div className="mt-4 flex gap-2 p-4 pt-0">
          {bekräftaBort ? (
            <>
              <button
                type="button"
                onClick={onRemove}
                className="flex-1 rounded-lg bg-amber-500 font-semibold text-[var(--color-bg)]"
              >
                Ta bort setet
              </button>
              <button
                type="button"
                onClick={() => setBekräftaBort(false)}
                className="rounded-lg border border-[var(--color-line)] px-4 text-[var(--color-dim)]"
              >
                Nej
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setBekräftaBort(true)}
                className="rounded-lg border border-[var(--color-line)] px-4 text-[var(--color-dim)]"
              >
                Ta bort
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg bg-[var(--color-fg)] font-semibold text-[var(--color-bg)]"
              >
                Klar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
