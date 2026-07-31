import { adjustRestTimer, formatRemaining } from '../timer/restTimer';
import { useRestTimer } from '../timer/useRestTimer';

/**
 * Vilotimern i UI:t. Uppgift 6.3 och 6.4.
 *
 * När tiden gått ut byter hela panelen färg — det visuella larmet. Det kräver
 * inga behörigheter och kan inte tas ifrån oss av en iOS-uppdatering, till
 * skillnad från notis, vibration och ljud. Det är därför det är grunden och
 * inte tillägget.
 */
export function RestTimer() {
  const { state, remaining, expired, cancel } = useRestTimer();

  if (!state) return null;

  return (
    <div
      role="timer"
      aria-live={expired ? 'assertive' : 'off'}
      className={[
        'rounded-lg border p-3 transition-colors',
        expired
          ? 'border-emerald-500 bg-emerald-500 text-[var(--color-bg)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface)]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl font-semibold tabular-nums">
          {formatRemaining(remaining)}
        </span>
        <span className={expired ? 'text-sm' : 'text-sm text-[var(--color-dim)]'}>
          {expired ? 'Vila klar' : 'Vilar'}
        </span>

        <span className="flex-1" />

        {!expired && (
          <>
            <button
              type="button"
              onClick={() => void adjustRestTimer(-30)}
              aria-label="Minska vilotiden med 30 sekunder"
              className="rounded-md border border-[var(--color-line)] px-3 text-sm"
            >
              −30
            </button>
            <button
              type="button"
              onClick={() => void adjustRestTimer(30)}
              aria-label="Öka vilotiden med 30 sekunder"
              className="rounded-md border border-[var(--color-line)] px-3 text-sm"
            >
              +30
            </button>
          </>
        )}

        <button
          type="button"
          onClick={cancel}
          className={[
            'rounded-md px-3 text-sm',
            expired
              ? 'bg-[var(--color-bg)] text-[var(--color-fg)]'
              : 'border border-[var(--color-line)] text-[var(--color-dim)]',
          ].join(' ')}
        >
          {expired ? 'Okej' : 'Hoppa över'}
        </button>
      </div>

      {!expired && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
          <div
            className="h-full bg-[var(--color-fg)] transition-[width] duration-500 ease-linear"
            style={{
              width: `${Math.max(0, Math.min(100, (remaining / (state.durationSeconds * 1000)) * 100))}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
