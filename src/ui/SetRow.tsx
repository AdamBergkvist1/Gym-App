import { formatWeight } from '../lib/steps';
import type { PlannedSet } from '../db/plan';

/**
 * En setrad. Omgjord 2026-08-02 efter referensbilderna i `docs/Reference-pics/`.
 *
 * VARFÖR TABELL OCH INTE FLEXRAD: mina två tidigare försök klipptes av på
 * mobilskärm. Referensappen (Hevy/openworkout) löser det med en **tabell med
 * fem smala kolumner och rubriker EN gång** — `Set | Prev | KG | Reps | ✓`.
 *
 * Det är inte en detalj utan hela knepet: när kolumnen är namngiven i huvudet
 * behöver varje cell inte bära sin egen etikett, och då räcker bredden. Mina
 * versioner upprepade "kg" och "×" på varje rad och hade steppare inline,
 * vilket är det som sprängde raden.
 *
 * Rutnätet har fasta kolumnbredder utom `Prev`, som får ta det som blir över.
 * Ingen kolumn kan därför tryckas utanför skärmen.
 */

/** Delas med rubrikraden i ExerciseCard så att kolumnerna garanterat linjerar. */
export const SET_GRID = 'grid grid-cols-[1.75rem_1fr_3.25rem_2.75rem_2.5rem] items-center gap-1';

interface Props {
  index: number;
  set: PlannedSet;
  /** Vad som lyftes senast — visas i Prev-kolumnen, precis som i referensen. */
  ghost: { weightKg: number; reps: number } | null;
  onOpenAdjust: () => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}

export function SetRow({ index, set, ghost, onOpenAdjust, onConfirm, onUnconfirm }: Props) {
  const confirmed = set.loggedSetId !== null;
  const dämpad = set.fromGhost && !confirmed;

  const cell =
    'h-11 min-h-0 rounded-md text-center text-base tabular-nums active:bg-[var(--color-bg)]';

  return (
    <li
      className={[
        SET_GRID,
        'border-b border-[var(--color-line)] px-2 last:border-b-0',
        confirmed ? 'bg-emerald-950/40' : '',
      ].join(' ')}
    >
      {/* Set — 'W' för uppvärmning, som i referensen */}
      <span
        className={[
          'text-center text-sm tabular-nums',
          set.isWarmup ? 'font-semibold text-amber-400' : 'text-[var(--color-dim)]',
        ].join(' ')}
      >
        {set.isWarmup ? 'W' : index + 1}
      </span>

      {/* Prev — spökdatan där referensen har den: som jämförelse, inte i fältet */}
      <span className="truncate text-center text-sm text-[var(--color-dim)] tabular-nums">
        {ghost ? `${formatWeight(ghost.weightKg)} × ${ghost.reps}` : '–'}
      </span>

      {/* KG */}
      <button
        type="button"
        onClick={onOpenAdjust}
        aria-label={`Vikt ${formatWeight(set.weightKg)} kilo för set ${index + 1}, tryck för att ändra`}
        className={`${cell} ${dämpad ? 'text-[var(--color-dim)]' : ''}`}
      >
        {formatWeight(set.weightKg)}
      </button>

      {/* Reps */}
      <button
        type="button"
        onClick={onOpenAdjust}
        aria-label={`${set.reps} reps för set ${index + 1}, tryck för att ändra`}
        className={`${cell} ${dämpad ? 'text-[var(--color-dim)]' : ''}`}
      >
        {set.reps}
      </button>

      {/* ✓ */}
      <button
        type="button"
        onClick={confirmed ? onUnconfirm : onConfirm}
        aria-label={confirmed ? `Ångra set ${index + 1}` : `Klarmarkera set ${index + 1}`}
        aria-pressed={confirmed}
        className={[
          'flex h-9 w-9 min-h-0 items-center justify-center justify-self-center rounded-md text-base',
          confirmed
            ? 'bg-emerald-500 font-bold text-[var(--color-bg)]'
            : 'border border-[var(--color-line)] text-[var(--color-dim)] active:opacity-60',
        ].join(' ')}
      >
        ✓
      </button>
    </li>
  );
}
