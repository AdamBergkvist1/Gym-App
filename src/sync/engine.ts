/**
 * Synkmotorn. Uppgift 7.7 och sammanhållningen av 7.4–7.9.
 *
 * Kör i förgrunden. Background Sync API finns inte i iOS Safari (PLAN.md §2.3),
 * så det finns ingen väg att synka när appen är stängd — och det är acceptabelt
 * just för att IndexedDB, inte molnet, är sanningen.
 *
 * Motorn rör ALDRIG loggningsvägen. Går allt fel här fortsätter appen att
 * fungera exakt som förut; det enda som händer är att kön växer.
 */

import { db } from '../db/db';
import { pendingCount } from '../db/repo';
import { pushOutbox, type RpcCaller } from './push';
import { pullChanges, type SelectCaller } from './pull';
import { getSupabase } from './supabase';

export type SyncState =
  | 'disabled' // ingen backend konfigurerad
  | 'signed_out' // konfigurerad men ingen session
  | 'offline'
  | 'syncing'
  | 'idle' // allt uppe
  | 'pending' // kö kvar, men inget fel
  | 'error'; // permanent fel — kräver åtgärd

export interface SyncStatus {
  state: SyncState;
  pending: number;
  lastError: string | null;
  lastSyncedAt: string | null;
}

let status: SyncStatus = {
  state: 'disabled',
  pending: 0,
  lastError: null,
  lastSyncedAt: null,
};

const listeners = new Set<() => void>();

export function subscribeSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const fn of listeners) fn();
}

let running = false;
let queuedAgain = false;

/**
 * Kör en full synkrunda: skicka upp först, hämta ner sedan.
 *
 * Ordningen spelar roll. Skickar vi upp först kan hämtningen aldrig råka
 * skriva över något som ännu inte hunnit iväg.
 */
export async function syncNow(): Promise<SyncStatus> {
  const client = getSupabase();
  if (!client) {
    setStatus({ state: 'disabled', pending: await pendingCount(db) });
    return status;
  }

  if (running) {
    // En runda pågår redan. Kö upp en till i stället för att köra parallellt —
    // två samtidiga sändare skulle kunna skicka samma post två gånger.
    queuedAgain = true;
    return status;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus({ state: 'offline', pending: await pendingCount(db) });
    return status;
  }

  const { data } = await client.auth.getSession();
  if (!data.session) {
    setStatus({ state: 'signed_out', pending: await pendingCount(db) });
    return status;
  }

  running = true;
  setStatus({ state: 'syncing' });

  try {
    const push = await pushOutbox(client as unknown as RpcCaller, db);
    const pull = await pullChanges(client as unknown as SelectCaller, db);

    const pending = await pendingCount(db);
    const felmeddelande = push.blocked ? push.error : (pull.error ?? null);

    if (push.blocked) {
      setStatus({ state: 'error', pending, lastError: felmeddelande });
    } else if (push.error || pull.error) {
      // Övergående — nätet eller token. Inte ett fel användaren ska agera på.
      setStatus({ state: pending > 0 ? 'pending' : 'idle', pending, lastError: null });
    } else {
      setStatus({
        state: pending > 0 ? 'pending' : 'idle',
        pending,
        lastError: null,
        lastSyncedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    setStatus({
      state: 'error',
      pending: await pendingCount(db),
      lastError: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
  }

  if (queuedAgain) {
    queuedAgain = false;
    return syncNow();
  }
  return status;
}

let started = false;

/**
 * Kopplar in triggrarna. Anropas en gång vid appstart.
 *
 * Ingen intervallpollning: den skulle väcka radion i onödan och tömma batteriet
 * mitt i ett pass. Vi synkar när något faktiskt hänt.
 */
export function startSyncEngine(): void {
  if (started) return;
  started = true;

  const kick = () => void syncNow();

  kick();
  window.addEventListener('online', kick);
  window.addEventListener('focus', kick);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kick();
  });

  // Efter varje lokal ändring. Dexie ger oss ändringshändelser gratis via
  // hooks — men en debounce behövs, annars blir det ett anrop per set.
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(kick, 2000);
  };
  db.outbox.hook('creating', () => {
    debounced();
  });
}

/** Uppdaterar bara räknaren, utan nätanrop. Används av UI:t vid lokala ändringar. */
export async function refreshPendingCount(): Promise<void> {
  setStatus({ pending: await pendingCount(db) });
}
