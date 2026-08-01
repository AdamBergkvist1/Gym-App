/** Radtyper i den lokala databasen. Uppgift 5.1. */

import type { EffortType } from '../parser/types';

export type SetSource = 'manual' | 'local_parse' | 'ai_parse';

export interface LocalExercise {
  id: string;
  /** null = global katalogövning. Egna övningar får användarens id i fas 7. */
  ownerId: string | null;
  name: string;
  /** Måste räknas fram med parser/normalize.normalizeName. */
  normalizedName: string;
  aliases: string[];
  primaryMuscle: string;
  equipment: string | null;
  isArchived: boolean;
  isDeleted: boolean;
  updatedAt: string;
}

export interface LocalWorkout {
  id: string;
  /** ISO 8601. Sorterbart som sträng, vilket gör det indexerbart. */
  startedAt: string;
  endedAt: string | null;
  title: string | null;
  note: string | null;
  isDeleted: boolean;
  updatedAt: string;
}

export interface LocalSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  /** Alltid kg. Ingen kolumn får innehålla en vikt utan känd enhet. */
  weightKg: number;
  reps: number;
  effortType: EffortType | null;
  effortValue: number | null;
  restSeconds: number | null;
  note: string | null;
  isWarmup: boolean;
  performedAt: string;
  source: SetSource;
  isDeleted: boolean;
  updatedAt: string;
}

export type OutboxStatus = 'pending' | 'sending' | 'failed';
export type SyncTable = 'workouts' | 'logged_sets' | 'exercises' | 'ai_parse_log';

/**
 * En osänd mutation.
 *
 * `seq` är auto-inkrementerad och ger FIFO. Ordningen är inte kosmetisk:
 * `apply_mutations` kräver att ett pass kommer före sina set, annars fäller
 * den sammansatta främmandenyckeln hela batchen.
 */
export interface OutboxEntry {
  seq?: number;
  /** Idempotensnyckeln. Går aldrig att återanvända. */
  mutationId: string;
  table: SyncTable;
  rowId: string;
  /** Redan i serverns fältnamn — se toWire.ts. */
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError: string | null;
  status: OutboxStatus;
}

export type ParseOutcome = 'accepted' | 'edited' | 'rejected';
export type ParserKind = 'local' | 'llm';

/**
 * En fritextinmatning och vad den blev. Uppgift 8.10.
 *
 * Utan den här raden går det aldrig att svara på hur ofta parsern har rätt —
 * och då går det varken att försvara LLM-anropets latens eller att välja modell
 * på annat än känsla.
 *
 * Skrivs lokalt först och synkas via utkorgen som allt annat: de flesta
 * inmatningar sker i en gymkällare, och en telemetrirad som bara skrivs online
 * hade systematiskt missat exakt de fall som är intressantast.
 */
export interface LocalParseLog {
  id: string;
  rawText: string;
  parser: ParserKind;
  provider: string | null;
  model: string | null;
  /** Vad parsern föreslog, i serverns fältnamn. */
  parsed: unknown;
  outcome: ParseOutcome;
  /** Vad det blev efter användarens rättelse, när `outcome = 'edited'`. */
  corrected: unknown;
  latencyMs: number | null;
  createdAt: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export const META_ACTIVE_WORKOUT = 'activeWorkoutId';
export const META_CATALOG_VERSION = 'catalogChecksum';
