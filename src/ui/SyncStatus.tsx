import { useSyncExternalStore } from 'react';
import { getSyncStatus, subscribeSync, syncNow, type SyncState } from '../sync/engine';

/**
 * Synkindikatorn. Uppgift 7.7.
 *
 * Tre lägen som betyder något för användaren: **i synk**, **köar** och **fel**.
 * Felläget är det enda som kräver åtgärd, och därför det enda som får färg och
 * är tryckbart. Att en post ligger kvar för att nätet är borta är inte ett fel
 * — det är precis vad appen är byggd för.
 *
 * Ett tyst fel vore värre än inget synkläge alls: då tror man att datan är i
 * säkert förvar när den bara ligger på telefonen.
 */

const TEXT: Record<SyncState, (n: number) => string> = {
  disabled: () => 'Endast lokalt',
  signed_out: (n) => (n > 0 ? `${n} osynkade · logga in` : 'Inte inloggad'),
  offline: (n) => (n > 0 ? `${n} väntar · offline` : 'Offline'),
  syncing: () => 'Synkar…',
  idle: () => 'I synk',
  pending: (n) => `${n} väntar`,
  error: () => 'Synkfel',
};

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const status = useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);

  const färg =
    status.state === 'error'
      ? 'text-[var(--color-warn-text)]'
      : status.state === 'idle'
        ? 'text-[var(--color-ok-text)]'
        : 'text-[var(--color-dim)]';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void syncNow()}
        className={`min-h-0 text-xs ${färg}`}
        aria-label={`Synkstatus: ${TEXT[status.state](status.pending)}. Tryck för att synka nu.`}
      >
        {TEXT[status.state](status.pending)}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${färg}`}>{TEXT[status.state](status.pending)}</span>
        <button
          type="button"
          onClick={() => void syncNow()}
          className="min-h-0 rounded-md border border-[var(--color-line)] px-3 py-1 text-sm"
        >
          Synka nu
        </button>
      </div>

      {status.lastError !== null && (
        <p className="mt-2 text-xs break-words text-[var(--color-warn-text)]">
          {status.lastError}
          <span className="block text-[var(--color-dim)]">
            Kön är stoppad tills detta är löst. Inget har gått förlorat — datan ligger kvar
            lokalt.
          </span>
        </p>
      )}

      {status.lastSyncedAt !== null && (
        <p className="mt-1 text-xs text-[var(--color-dim)]">
          Senast i synk {new Date(status.lastSyncedAt).toLocaleTimeString('sv-SE')}
        </p>
      )}
    </div>
  );
}
