import { useState } from 'react';
import { ScrollPicker } from './ScrollPicker';
import { IkonBock } from './icons';
import {
  DIGIT_VALUES,
  HALF_VALUES,
  REP_VALUES,
  toDigits,
  withDigit,
} from '../lib/digits';
import { formatWeight, nudgeSteps, stepReps, stepWeight } from '../lib/steps';

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
  /**
   * Vad raden HETER — `set 2` eller `uppvärmningen`. Färdig fras, inte ett tal.
   *
   * ✏️ **HÄR STOD `setNumber: number` FRAM TILL 12.49, och typen var själva
   * buggen.** Ett tal kan inte uttrycka *"uppvärmningen"*, så `ExerciseCard`
   * tvingades hitta på ett: den skickade radens plats i LISTAN. Med en
   * uppvärmningsrad överst hette knappen `… för set 1` medan arket den öppnade
   * hette `Justera set 2`, och uppvärmningsraden själv hette `uppvärmningen` i
   * raden men `set 1` i arket.
   *
   * Frasen kommer från `radnamn` (`src/lib/worksets.ts`), samma härledning som
   * raden använder. **Räkna inte fram den här.**
   */
  radnamn: string;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  /**
   * Övningens utrustning, som styr ±-knapparnas steg.
   *
   * `string | null` och inte en union: egna övningar (fas 7) skapas av
   * användaren och kan bära vad som helst. Det är katalogen som är data vi
   * äger. Okänd utrustning faller tillbaka på hela kilon — det FINA steget,
   * eftersom ett för grovt steg raderar vikter användaren faktiskt lyft.
   */
  equipment: string | null;
  onChange: (patch: { weightKg?: number; reps?: number; isWarmup?: boolean }) => void;
  onRemove: () => void;
  onClose: () => void;
}

const NUDGE =
  'flex h-10 flex-1 items-center justify-center rounded-md border ' +
  'border-[var(--color-line)] text-lg active:opacity-60';

export function SetAdjustSheet({
  exerciseName,
  radnamn,
  weightKg,
  reps,
  isWarmup,
  equipment,
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
      aria-label={`Justera ${radnamn}, ${exerciseName}`}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Tryck utanför för att stänga. Ändringarna är redan sparade. */}
      <button
        type="button"
        aria-label="Stäng"
        onClick={onClose}
        className="absolute inset-0 min-h-0 bg-black/60"
      />

      {/* `max-h-[92dvh]` + scroll är ett SKYDDSNÄT, inte designen. Arket ska få
          plats utan att scrolla — men växer innehållet någon gång igen ska det
          bli scrollbart i stället för att tryckas utanför skärmen, vilket är
          exakt vad som hände före 2026-08-04. */}
      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-2xl border-t border-[var(--color-line)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-line)]" aria-hidden />

        {/* Det sammansatta värdet är arkets viktigaste element.
            Fyra sifferhjul som visar `0 0 0 0` säger ingenting om att vikten är
            62,5 — den siffran måste stå någonstans, stor nog att läsas medan
            man drar. Den fanns här redan, men i 14 px och utanför skärmen. */}
        <header className="shrink-0 px-4 pt-2 pb-1">
          <p className="truncate text-meta text-[var(--color-dim)]">
            {exerciseName} · {radnamn}
          </p>
          <p className="text-timer font-semibold tabular-nums">
            {formatWeight(weightKg)}
            <span className="text-title text-[var(--color-dim)]"> kg × </span>
            {reps}
          </p>
        </header>

        {/* ---- vikt ---- */}
        <div className="px-4 pt-2">
          {/* Ingen "Vikt"-etikett: headern visar redan "62,5 kg × 8" i 32 px,
              vilket är exakt vad etiketten fanns för. Den kostade 20 px höjd på
              en skärm där arket inte fick plats. */}
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

          {/* Stegen följer övningens utrustning: skivstången får 2,5 kg som
              huvudsteg, allt annat 1 kg. Huvudsteget ligger innerst, närmast
              värdet det ändrar. Se `nudgeSteps` för hela skälet — kort: hela
              utrustningsregeln kom ur Adams fynd att hantelcurl körs i
              enkilossteg, och knapparna hade ändå skivstångens steg. */}
          <div className="mt-2 flex gap-2">
            {nudgeSteps(equipment).map((steg) => (
              <button
                key={steg}
                type="button"
                onClick={() =>
                  onChange({ weightKg: stepWeight(weightKg, steg < 0 ? -1 : 1, Math.abs(steg)) })
                }
                className={NUDGE}
              >
                {steg < 0 ? '−' : '+'}
                {formatWeight(Math.abs(steg))}
              </button>
            ))}
          </div>
        </div>

        {/* ---- reps ---- */}
        <div className="mt-3 flex items-start gap-4 px-4">
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
              <div className="flex flex-1 flex-col gap-2 pt-4">
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

        {/* Egen växlare i stället för <input type="checkbox">. Systemrutan
            renderas vit och fyrkantig i WebKit oavsett `accent-color`, vilket i
            ett mörkt gränssnitt ser ut som ett renderingsfel snarare än en
            kontroll. `aria-pressed` ger samma information till skärmläsare som
            en kryssruta gjorde.

            Neutral, inte gul: uppvärmning är en kategori och inte en varning.
            Se DESIGN.md §3. */}
        <div className="mt-2 px-4">
          <button
            type="button"
            onClick={() => onChange({ isWarmup: !isWarmup })}
            aria-pressed={isWarmup}
            className={[
              'flex w-full items-center gap-3 rounded-lg border px-3 text-body',
              isWarmup
                ? 'border-[var(--color-line-strong)] bg-[var(--color-bg)] text-[var(--color-fg)]'
                : 'border-[var(--color-line)] text-[var(--color-dim)]',
            ].join(' ')}
          >
            <span
              aria-hidden
              className={[
                'flex size-5 shrink-0 items-center justify-center rounded border text-xs',
                isWarmup
                  ? 'border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)]'
                  : 'border-[var(--color-line-strong)]',
              ].join(' ')}
            >
              {isWarmup ? <IkonBock className="size-3.5" /> : null}
            </span>
            Uppvärmningsset
          </button>
        </div>

        <div className="mt-3 flex gap-2 p-4 pt-0">
          {bekräftaBort ? (
            <>
              <button
                type="button"
                onClick={onRemove}
                className="flex-1 rounded-lg bg-[var(--color-err-solid)] font-semibold text-[var(--color-bg)]"
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
