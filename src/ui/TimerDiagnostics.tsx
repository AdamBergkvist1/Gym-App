import { useLiveQuery } from 'dexie-react-hooks';
import { clearTimerEvents, getTimerEvents, summarise } from '../timer/diagnostics';
import { notificationPermission, requestNotificationPermission } from '../timer/alarm';
import { useEffect, useState } from 'react';

/**
 * Svaret på den gamla uppgift 0.8: **håller larmet i tre minuter med appen i
 * bakgrunden?**
 *
 * Adam valde att inte göra ett separat test utan låta den riktiga timern
 * besvara frågan. Det svaret blir bara användbart om det mäts — annars blir
 * utfallet "jag tror den kom sent ibland", vilket inte går att agera på.
 *
 * Det farliga felläget är inte tystnad utan **försening**: kommer notisen i
 * samma sekund som appen öppnas ser det ut att fungera. Kolumnen "på
 * återkomst" är därför den viktigaste i tabellen.
 */
export function TimerDiagnostics() {
  const events = useLiveQuery(() => getTimerEvents(), [], []);
  const [permission, setPermission] = useState<string>('…');

  useEffect(() => {
    void notificationPermission().then(setPermission);
  }, []);

  const iBakgrunden = events.filter((e) => e.wasHidden);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <p className="text-sm">{summarise(events)}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--color-dim)]">Notisbehörighet: {permission}</span>
        {permission === 'default' && (
          <button
            type="button"
            // Måste ske i en användargest — iOS visar annars ingen dialog.
            onClick={() => void requestNotificationPermission().then(setPermission)}
            className="min-h-0 rounded-md border border-[var(--color-line)] px-3 py-1 text-sm"
          >
            Tillåt notiser
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="mt-2 text-xs text-amber-400">
          Notiser är blockerade. Larmet når dig då bara med appen framme. Återställs i
          Inställningar → Notiser på telefonen.
        </p>
      )}

      {iBakgrunden.length > 0 && (
        <table className="mt-3 w-full text-xs tabular-nums">
          <thead className="text-[var(--color-dim)]">
            <tr>
              <th className="text-left font-normal">Vilotid</th>
              <th className="text-right font-normal">Fel</th>
              <th className="text-right font-normal">På återkomst</th>
            </tr>
          </thead>
          <tbody>
            {iBakgrunden.slice(0, 8).map((e) => (
              <tr key={e.firedAt} className="border-t border-[var(--color-line)]">
                <td className="py-1">{e.durationSeconds} s</td>
                <td
                  className={`py-1 text-right ${e.driftSeconds > 5 ? 'text-amber-400' : ''}`}
                >
                  {e.driftSeconds > 0 ? '+' : ''}
                  {e.driftSeconds} s
                </td>
                <td className="py-1 text-right">{e.firedOnResume ? 'ja' : 'nej'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {events.length > 0 && (
        <button
          type="button"
          onClick={() => void clearTimerEvents()}
          className="mt-2 min-h-0 text-xs text-[var(--color-dim)]"
        >
          Rensa mätningen
        </button>
      )}
    </div>
  );
}
