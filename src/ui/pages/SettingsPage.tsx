import { useEffect, useState } from 'react';
import {
  formatBytes,
  requestPersistentStorage,
  type StorageStatus,
} from '../../lib/persistStorage';
import { SyncStatus } from '../SyncStatus';
import { SignIn } from '../SignIn';
import { TimerDiagnostics } from '../TimerDiagnostics';
import { ParseStats } from '../ParseStats';

/**
 * Inställningar — och tills vidare appens diagnosvy (uppgift 3.5).
 *
 * Att lagringsläget syns är inte en utvecklardetalj: nekas beständig lagring
 * kan iOS rensa osynkade pass efter sju dagar. Då ska det gå att se, inte
 * upptäckas när datan är borta.
 */

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const legacyIos = (window.navigator as { standalone?: boolean }).standalone === true;
  return legacyIos || window.matchMedia('(display-mode: standalone)').matches;
}

const STATE_TEXT: Record<StorageStatus['state'], string> = {
  persisted: 'Beständig',
  denied: 'Inte beständig',
  unsupported: 'Stöds inte',
  error: 'Fel',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-line)] py-2 text-sm last:border-b-0">
      <span className="text-[var(--color-dim)]">{label}</span>
      <span className="text-right font-mono break-all">{value}</span>
    </div>
  );
}

export function SettingsPage() {
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const standalone = isStandalone();

  useEffect(() => {
    let alive = true;
    void requestPersistentStorage().then((s) => {
      if (alive) setStorage(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section>
      <h1>Inställningar</h1>
      <p className="mt-2 text-sm text-[var(--color-dim)]">
        Enhet, viloti­der och konto byggs senare. Här nedan syns appens tillstånd.
      </p>

      <h2 className="mt-6 mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
        Fritextparsningens träffsäkerhet
      </h2>
      <ParseStats />

      <h2 className="mt-6 mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
        Vilotimerns larm
      </h2>
      <TimerDiagnostics />

      <h2 className="mt-6 mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
        Synk
      </h2>
      <SyncStatus />
      <div className="mt-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
        <SignIn />
      </div>

      <h2 className="mt-6 mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
        Lagring
      </h2>
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4">
        <Row label="Läge" value={storage ? STATE_TEXT[storage.state] : 'kontrollerar…'} />
        <Row label="Detalj" value={storage?.detail ?? '–'} />
        <Row label="Använt" value={formatBytes(storage?.usageBytes ?? null)} />
        <Row label="Uppskattat tak" value={formatBytes(storage?.quotaBytes ?? null)} />
      </div>

      {storage?.state === 'denied' && (
        <p className="mt-2 text-sm text-[var(--color-dim)]">
          Lagringen är inte beständig. Lägg till appen på hemskärmen, annars kan
          webbläsaren rensa osynkade pass.
        </p>
      )}

      <h2 className="mt-6 mb-1 text-xs font-semibold tracking-wider text-[var(--color-dim)] uppercase">
        App
      </h2>
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4">
        <Row label="Visningsläge" value={standalone ? 'Installerad' : 'Webbläsarflik'} />
        <Row
          label="Servicearbetare"
          value={
            typeof navigator !== 'undefined' && 'serviceWorker' in navigator
              ? 'stöds'
              : 'stöds inte'
          }
        />
      </div>

      {!standalone && (
        <p className="mt-2 text-sm text-[var(--color-dim)]">
          Appen körs i en flik. Installerad på hemskärmen får den notiser för vilotimern
          och undantas från webbläsarens lagringsrensning.
        </p>
      )}
    </section>
  );
}
