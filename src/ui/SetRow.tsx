import { useState } from 'react';
import { formatWeight, parseRepsInput, parseWeightInput, stepReps, stepWeight } from '../lib/steps';
import type { PlannedSet } from '../db/plan';

/**
 * En setrad. Uppgift 11A.2 och 11A.3 — kärnan i hela det manuella flödet.
 *
 * RITNINGEN: loggade du 90×5 förra gången ska ett tryck på repsens `+` räcka
 * för att logga 90×6. Tangentbordet ska aldrig behöva öppnas för ett normalt
 * pass. Vill du göra ett stort hopp (90 → 120) trycker du på SIFFRAN och får
 * ett numeriskt tangentbord — men stegarna är primära.
 *
 * Spökdata visas dämpad tills den rörts eller bockats av. Härledd data ska
 * aldrig se ut som inmatad data.
 */

interface Props {
  index: number;
  set: PlannedSet;
  onChange: (patch: { weightKg?: number; reps?: number }) => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onRemove: () => void;
}

/** Stor tryckyta. 48 px är golvet, och fingrarna är svettiga. */
const STEP_BTN =
  'flex h-12 w-11 shrink-0 items-center justify-center rounded-md border ' +
  'border-[var(--color-line)] text-xl leading-none select-none active:opacity-60';

export function SetRow({ index, set, onChange, onConfirm, onUnconfirm, onRemove }: Props) {
  const [editing, setEditing] = useState<'weight' | 'reps' | null>(null);
  const [draft, setDraft] = useState('');

  const confirmed = set.loggedSetId !== null;

  function startEdit(field: 'weight' | 'reps') {
    if (confirmed) return;
    setEditing(field);
    setDraft(field === 'weight' ? formatWeight(set.weightKg) : String(set.reps));
  }

  function commitEdit() {
    if (editing === 'weight') {
      const v = parseWeightInput(draft);
      // Ogiltig inmatning behåller det gamla värdet. Att tolka skräp som noll
      // vore att skriva data ingen matat in.
      if (v !== null) onChange({ weightKg: v });
    } else if (editing === 'reps') {
      const v = parseRepsInput(draft);
      if (v !== null) onChange({ reps: v });
    }
    setEditing(null);
  }

  const dämpad = set.fromGhost && !confirmed;

  return (
    <li
      className={[
        'flex items-center gap-1.5 border-b border-[var(--color-line)] px-2 py-1.5 last:border-b-0',
        confirmed ? 'bg-emerald-950/40' : '',
      ].join(' ')}
    >
      <span className="w-5 shrink-0 text-center text-sm text-[var(--color-dim)] tabular-nums">
        {index + 1}
      </span>

      {/* ---- vikt ---- */}
      {!confirmed && (
        <button
          type="button"
          aria-label={`Minska vikten för set ${index + 1}`}
          onClick={() => onChange({ weightKg: stepWeight(set.weightKg, -1) })}
          className={STEP_BTN}
        >
          −
        </button>
      )}
      {editing === 'weight' ? (
        <input
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          aria-label="Vikt i kg"
          className="h-12 w-16 min-h-0 rounded-md border border-[var(--color-fg)] bg-[var(--color-bg)] text-center text-lg tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => startEdit('weight')}
          aria-label={`Vikt ${formatWeight(set.weightKg)} kilo, tryck för att skriva in`}
          className={[
            'h-12 w-16 min-h-0 shrink-0 rounded-md text-lg tabular-nums',
            dämpad ? 'text-[var(--color-dim)]' : '',
          ].join(' ')}
        >
          {formatWeight(set.weightKg)}
        </button>
      )}
      {!confirmed && (
        <button
          type="button"
          aria-label={`Öka vikten för set ${index + 1}`}
          onClick={() => onChange({ weightKg: stepWeight(set.weightKg, 1) })}
          className={STEP_BTN}
        >
          +
        </button>
      )}

      <span className="shrink-0 text-xs text-[var(--color-dim)]">×</span>

      {/* ---- reps ---- */}
      {!confirmed && (
        <button
          type="button"
          aria-label={`Minska reps för set ${index + 1}`}
          onClick={() => onChange({ reps: stepReps(set.reps, -1) })}
          className={STEP_BTN}
        >
          −
        </button>
      )}
      {editing === 'reps' ? (
        <input
          autoFocus
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          aria-label="Antal reps"
          className="h-12 w-12 min-h-0 rounded-md border border-[var(--color-fg)] bg-[var(--color-bg)] text-center text-lg tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => startEdit('reps')}
          aria-label={`${set.reps} reps, tryck för att skriva in`}
          className={[
            'h-12 w-12 min-h-0 shrink-0 rounded-md text-lg tabular-nums',
            dämpad ? 'text-[var(--color-dim)]' : '',
          ].join(' ')}
        >
          {set.reps}
        </button>
      )}
      {!confirmed && (
        <button
          type="button"
          aria-label={`Öka reps för set ${index + 1}`}
          onClick={() => onChange({ reps: stepReps(set.reps, 1) })}
          className={STEP_BTN}
        >
          +
        </button>
      )}

      <span className="flex-1" />

      {/* ---- bekräfta ---- */}
      <button
        type="button"
        onClick={confirmed ? onUnconfirm : onConfirm}
        aria-label={confirmed ? `Ångra set ${index + 1}` : `Klarmarkera set ${index + 1}`}
        aria-pressed={confirmed}
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xl',
          confirmed
            ? 'bg-emerald-500 text-[var(--color-bg)]'
            : 'border border-[var(--color-line)] text-[var(--color-dim)] active:opacity-60',
        ].join(' ')}
      >
        ✓
      </button>

      {!confirmed && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Ta bort set ${index + 1}`}
          className="h-12 w-7 min-h-0 shrink-0 text-[var(--color-dim)]"
        >
          ×
        </button>
      )}
    </li>
  );
}
