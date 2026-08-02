import { formatWeight } from '../lib/steps';
import type { PlannedSet } from '../db/plan';

/**
 * En setrad. Uppgift 11A.2, omgjord 2026-08-01.
 *
 * VARFÖR DEN GJORDES OM: den första versionen hade −/värde/+ för både vikt och
 * reps, plus bekräfta och ta bort — åtta tryckytor på en rad. Det fick inte
 * plats på en iPhone i porträttläge; repsens `+` hamnade utanför skärmen och
 * kryssknappen syntes inte alls.
 *
 * Fixen är inte mindre knappar. **Raden har nu tre element** — nummer, värde,
 * bekräfta — och all justering ligger i ett bottenark (`SetAdjustSheet`). Det
 * är också hur Hevy och Strong gör: raden är till för att läsa och bocka av,
 * inte för att mecka i.
 *
 * Layouten kan inte klippas: värdeknappen är den enda som får växa (`flex-1`,
 * `min-w-0`), resten har fast bredd.
 */

interface Props {
  index: number;
  set: PlannedSet;
  /** Vad som lyftes senast i övningen — visas som jämförelse. */
  ghost: { weightKg: number; reps: number } | null;
  onOpenAdjust: () => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}

export function SetRow({ index, set, ghost, onOpenAdjust, onConfirm, onUnconfirm }: Props) {
  const confirmed = set.loggedSetId !== null;
  const dämpad = set.fromGhost && !confirmed;

  return (
    <li
      className={[
        'flex items-center gap-2 border-b border-[var(--color-line)] px-2 py-1.5 last:border-b-0',
        confirmed ? 'bg-emerald-950/40' : '',
      ].join(' ')}
    >
      <span className="w-5 shrink-0 text-center text-sm text-[var(--color-dim)] tabular-nums">
        {index + 1}
      </span>

      {/* Enda elementet som får växa. Hela ytan öppnar justeringen. */}
      <button
        type="button"
        onClick={onOpenAdjust}
        aria-label={`Justera set ${index + 1}: ${formatWeight(set.weightKg)} kilo gånger ${set.reps} reps`}
        className="flex min-w-0 flex-1 items-baseline gap-1.5 rounded-md px-1 text-left active:bg-[var(--color-bg)]"
      >
        <span className={`text-xl tabular-nums ${dämpad ? 'text-[var(--color-dim)]' : ''}`}>
          {formatWeight(set.weightKg)}
        </span>
        <span className="text-xs text-[var(--color-dim)]">kg</span>
        <span className="text-xs text-[var(--color-dim)]">×</span>
        <span className={`text-xl tabular-nums ${dämpad ? 'text-[var(--color-dim)]' : ''}`}>
          {set.reps}
        </span>
        {set.isWarmup && <span className="text-xs text-[var(--color-dim)]">uppv</span>}

        {/* Förra gången, när den skiljer sig — jämförelsen är hela poängen. */}
        {ghost && !confirmed && (ghost.weightKg !== set.weightKg || ghost.reps !== set.reps) && (
          <span className="truncate text-xs text-[var(--color-dim)] tabular-nums">
            (sist {formatWeight(ghost.weightKg)}×{ghost.reps})
          </span>
        )}
      </button>

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
    </li>
  );
}
