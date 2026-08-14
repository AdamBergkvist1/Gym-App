/**
 * Mätning av om larmet faktiskt når fram. Ersätter uppgift 0.8.
 *
 * BAKGRUND: den öppna frågan var om iOS fryser sidans JavaScript när appen
 * ligger i bakgrunden, så att en tre minuter lång vilotimer aldrig larmar i
 * tid. Adam valde 2026-07-31 att inte göra ett separat test utan att låta den
 * riktiga timern svara på frågan.
 *
 * Det svaret blir bara användbart om det MÄTS. Utan detta blir utfallet "jag
 * tror den kom sent ibland", vilket inte går att agera på. Här loggas därför
 * varje larm med hur många sekunder fel det gick och om appen var dold — och
 * resultatet visas under Inställningar.
 *
 * Det farliga felläget är inte tystnad utan **försening**: kommer notisen i
 * samma sekund som appen öppnas ser det ut att fungera.
 */

import { db, type GymDatabase } from '../db/db';

export const META_TIMER_LOG = 'timerDiagnostics';
const MAX_ENTRIES = 20;

export interface TimerEvent {
  /** När timern skulle ha larmat. */
  dueAt: string;
  /** När larmet faktiskt gick. */
  firedAt: string;
  /** Positivt = för sent. Det här är hela mätningen. */
  driftSeconds: number;
  /** Låg appen i bakgrunden när timern gick ut? */
  wasHidden: boolean;
  /** Utlöstes larmet av att appen kom tillbaka i förgrunden? */
  firedOnResume: boolean;
  durationSeconds: number;
}

function isEvents(v: unknown): v is TimerEvent[] {
  return Array.isArray(v);
}

export async function recordTimerEvent(
  event: TimerEvent,
  database: GymDatabase = db
): Promise<void> {
  const row = await database.meta.get(META_TIMER_LOG);
  const existing = isEvents(row?.value) ? row.value : [];
  const next = [event, ...existing].slice(0, MAX_ENTRIES);
  await database.meta.put({ key: META_TIMER_LOG, value: next });
}

export async function getTimerEvents(database: GymDatabase = db): Promise<TimerEvent[]> {
  const row = await database.meta.get(META_TIMER_LOG);
  return isEvents(row?.value) ? row.value : [];
}

export async function clearTimerEvents(database: GymDatabase = db): Promise<void> {
  await database.meta.delete(META_TIMER_LOG);
}

/**
 * Sammanfattar mätningen till ett svar på frågan från 0.8.
 *
 * Säger uttryckligen ifrån när underlaget är för tunt, i stället för att
 * presentera en siffra som ser ut som ett resultat.
 */
export function summarise(events: TimerEvent[]): string {
  const iBakgrunden = events.filter((e) => e.wasHidden);
  if (iBakgrunden.length === 0) {
    return events.length === 0
      ? 'Inga larm ännu.'
      : `${events.length} larm, alla med appen i förgrunden. Frågan om bakgrundsläget är obesvarad.`;
  }
  const sena = iBakgrunden.filter((e) => e.driftSeconds > 5);
  const påÅterkomst = iBakgrunden.filter((e) => e.firedOnResume);
  const värsta = Math.max(...iBakgrunden.map((e) => e.driftSeconds));

  if (påÅterkomst.length > 0) {
    return `⚠️ ${påÅterkomst.length} av ${iBakgrunden.length} larm i bakgrunden kom först när appen öppnades igen. iOS fryser timern. Larmet går inte att lita på i bakgrunden.`;
  }
  if (sena.length > 0) {
    return `⚠️ ${sena.length} av ${iBakgrunden.length} larm i bakgrunden var mer än 5 s sena. Värst: ${värsta} s.`;
  }
  return `✅ ${iBakgrunden.length} larm i bakgrunden, alla i tid (max ${värsta} s fel).`;
}
