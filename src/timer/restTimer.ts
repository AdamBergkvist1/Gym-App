/**
 * Vilotimerns tillstånd. Uppgift 6.1.
 *
 * TIMERN LAGRAS SOM SLUTTIDPUNKT, aldrig som en nedräknande räknare.
 * Bakgrundade `setInterval` strypes hårt av mobilwebbläsare — en räknare som
 * tickar ner blir fel så snart skärmen släcks, och felet växer med tiden.
 * Genom att lagra `endsAt` och rendera `endsAt - Date.now()` överlever timern
 * både omladdning, bakgrundsläge och att telefonen låses.
 */

import { db, type GymDatabase } from '../db/db';

export const META_REST_TIMER = 'restTimer';
export const DEFAULT_REST_SECONDS = 180;

export interface RestTimerState {
  /** ISO 8601. Sanningen — allt annat härleds från den. */
  endsAt: string;
  startedAt: string;
  durationSeconds: number;
  /** Setet som startade timern, för spårbarhet i diagnostiken. */
  setId: string | null;
  /** Sätts när larmet faktiskt gick. null = har inte larmat än. */
  firedAt: string | null;
  /** Sant om appen låg i bakgrunden när timern startade. */
  startedHidden: boolean;
}

function isState(v: unknown): v is RestTimerState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['endsAt'] === 'string' && typeof o['durationSeconds'] === 'number';
}

export async function getRestTimer(database: GymDatabase = db): Promise<RestTimerState | null> {
  const row = await database.meta.get(META_REST_TIMER);
  return isState(row?.value) ? row.value : null;
}

export async function startRestTimer(
  seconds: number = DEFAULT_REST_SECONDS,
  setId: string | null = null,
  database: GymDatabase = db
): Promise<RestTimerState> {
  const now = Date.now();
  const state: RestTimerState = {
    endsAt: new Date(now + seconds * 1000).toISOString(),
    startedAt: new Date(now).toISOString(),
    durationSeconds: seconds,
    setId,
    firedAt: null,
    startedHidden: typeof document !== 'undefined' && document.hidden,
  };
  await database.meta.put({ key: META_REST_TIMER, value: state });
  return state;
}

/** Justerar sluttiden. Behåller `durationSeconds` som ursprunglig avsikt. */
export async function adjustRestTimer(
  deltaSeconds: number,
  database: GymDatabase = db
): Promise<RestTimerState | null> {
  const current = await getRestTimer(database);
  if (!current) return null;
  const next: RestTimerState = {
    ...current,
    endsAt: new Date(new Date(current.endsAt).getTime() + deltaSeconds * 1000).toISOString(),
    // En justering efter att larmet gått innebär att timern körs igen.
    firedAt: null,
  };
  await database.meta.put({ key: META_REST_TIMER, value: next });
  return next;
}

export async function markFired(database: GymDatabase = db): Promise<void> {
  const current = await getRestTimer(database);
  if (!current || current.firedAt !== null) return;
  await database.meta.put({
    key: META_REST_TIMER,
    value: { ...current, firedAt: new Date().toISOString() } satisfies RestTimerState,
  });
}

export async function cancelRestTimer(database: GymDatabase = db): Promise<void> {
  await database.meta.delete(META_REST_TIMER);
}

/** Kvarvarande millisekunder. Negativt när timern gått ut. */
export function remainingMs(state: RestTimerState, now: number = Date.now()): number {
  return new Date(state.endsAt).getTime() - now;
}

export function hasExpired(state: RestTimerState, now: number = Date.now()): boolean {
  return remainingMs(state, now) <= 0;
}

/** mm:ss. Går aldrig under 0:00 — en negativ siffra hjälper ingen mitt i ett pass. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
