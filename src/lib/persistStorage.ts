/**
 * Uppgift 3.5 — beständig lagring.
 *
 * Varför detta spelar roll: IndexedDB är sanningen i den här appen, inte
 * molnet. iOS rensar lagring för webbplatser som inte använts på sju dagar.
 * En PWA som lagts till på hemskärmen är undantagen, men en flik i Safari är
 * det inte — och osynkade pass finns bara lokalt.
 *
 * Utfallet ska SYNAS, inte tigas ihjäl. Nekas beständig lagring är det ett
 * skäl att uppmana till installation på hemskärmen, inte något att gömma.
 */

export type PersistState =
  | 'persisted' // beviljad
  | 'denied' // webbläsaren sa nej
  | 'unsupported' // API:et finns inte
  | 'error';

export interface StorageStatus {
  state: PersistState;
  /** Byte som faktiskt används, när webbläsaren vill berätta det. */
  usageBytes: number | null;
  /** Uppskattat tak. Är en gissning från webbläsaren, inte ett löfte. */
  quotaBytes: number | null;
  detail: string;
}

export async function requestPersistentStorage(): Promise<StorageStatus> {
  const base = { usageBytes: null, quotaBytes: null };

  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return { ...base, state: 'unsupported', detail: 'navigator.storage.persist saknas' };
  }

  try {
    // Redan beviljad? Fråga inte igen.
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    const granted = already || (await navigator.storage.persist());

    let usageBytes: number | null = null;
    let quotaBytes: number | null = null;
    if (navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      usageBytes = est.usage ?? null;
      quotaBytes = est.quota ?? null;
    }

    return {
      state: granted ? 'persisted' : 'denied',
      usageBytes,
      quotaBytes,
      detail: granted
        ? already
          ? 'redan beviljad sedan tidigare'
          : 'beviljad nu'
        : 'nekad — lägg till appen på hemskärmen',
    };
  } catch (err) {
    return {
      ...base,
      state: 'error',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatBytes(n: number | null): string {
  if (n === null) return '–';
  if (n < 1024) return `${n} B`;
  const units = ['kB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}
