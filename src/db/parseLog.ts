/**
 * Telemetri för fritextparsningen. Uppgift 8.10–8.11.
 *
 * Frågan den finns för att besvara: **hur ofta har parsern rätt?** Utan svaret
 * går det varken att försvara LLM-anropets latens, välja modell, eller veta om
 * en ändring i grammatiken gjorde saken bättre eller sämre.
 *
 * Skrivs lokalt först och synkas via utkorgen som allt annat. De flesta
 * inmatningar sker i en gymkällare — en telemetrirad som bara skrevs online
 * hade systematiskt missat exakt de fall som är intressantast.
 */

import { newId } from '../lib/id';
import type { ParsedSet } from '../parser/types';
import { db, type GymDatabase } from './db';
import type { LocalParseLog, ParseOutcome, ParserKind } from './types';

const now = () => new Date().toISOString();

/** Bara det som säger något om tolkningen. Ingen anledning att spara mer. */
function slim(sets: ParsedSet[]): unknown {
  return sets.map((s) => ({
    exercise_id: s.exerciseId,
    exercise_name: s.exerciseName,
    weight_kg: s.weightKg,
    reps: s.reps,
    effort_type: s.effortType,
    effort_value: s.effortValue,
    confidence: s.confidence,
    ...(s.reasoning === undefined ? {} : { reasoning: s.reasoning }),
  }));
}

function toWire(row: LocalParseLog): Record<string, unknown> {
  return {
    id: row.id,
    raw_text: row.rawText,
    parser: row.parser,
    provider: row.provider,
    model: row.model,
    parsed: row.parsed,
    outcome: row.outcome,
    corrected: row.corrected,
    latency_ms: row.latencyMs,
  };
}

async function queue(row: LocalParseLog, database: GymDatabase): Promise<void> {
  await database.outbox.add({
    mutationId: newId(),
    table: 'ai_parse_log',
    rowId: row.id,
    payload: toWire(row),
    createdAt: now(),
    attempts: 0,
    lastError: null,
    status: 'pending',
  });
}

export interface RecordAttemptInput {
  rawText: string;
  parser: ParserKind;
  sets: ParsedSet[];
  provider?: string | null;
  model?: string | null;
  latencyMs?: number | null;
}

/**
 * Registrerar ett tolkningsförsök. Returnerar id:t så att utfallet kan
 * uppdateras när användaren bestämt sig.
 *
 * Förvalet är `rejected`: har raden aldrig lett till ett sparat set är det vad
 * som faktiskt hände. Att i stället anta `accepted` hade gjort statistiken
 * systematiskt för snäll — och en mätning som smickrar sig själv är värdelös.
 */
export async function recordParseAttempt(
  input: RecordAttemptInput,
  database: GymDatabase = db
): Promise<string> {
  const row: LocalParseLog = {
    id: newId(),
    rawText: input.rawText,
    parser: input.parser,
    provider: input.provider ?? null,
    model: input.model ?? null,
    parsed: slim(input.sets),
    outcome: 'rejected',
    corrected: null,
    latencyMs: input.latencyMs ?? null,
    createdAt: now(),
  };

  await database.transaction('rw', database.parseLog, database.outbox, async () => {
    await database.parseLog.add(row);
    await queue(row, database);
  });
  return row.id;
}

/**
 * Uppdaterar utfallet. Uppgift 8.11.
 *
 * `accepted` = användaren sparade förslaget orört.
 * `edited`   = användaren rättade något först — `corrected` visar vad det blev.
 * `rejected` = förslaget ledde aldrig till ett sparat set.
 */
export async function setParseOutcome(
  logId: string,
  outcome: ParseOutcome,
  correctedSets: ParsedSet[] | null = null,
  database: GymDatabase = db
): Promise<void> {
  const existing = await database.parseLog.get(logId);
  if (!existing) return; // telemetri får aldrig kasta och stoppa loggningen

  const updated: LocalParseLog = {
    ...existing,
    outcome,
    corrected: correctedSets === null ? null : slim(correctedSets),
  };

  await database.transaction('rw', database.parseLog, database.outbox, async () => {
    await database.parseLog.put(updated);
    await queue(updated, database);
  });
}

export interface ParseStats {
  total: number;
  byParser: Record<ParserKind, { total: number; accepted: number; edited: number; rejected: number }>;
  /** Andel som sparades utan rättelse. Null när underlaget är för tunt. */
  accuracy: { local: number | null; llm: number | null };
  medianLlmLatencyMs: number | null;
}

/** Under detta är en andel inte en mätning utan brus. */
const MIN_SAMPLES = 5;

export async function getParseStats(database: GymDatabase = db): Promise<ParseStats> {
  const rows = await database.parseLog.toArray();

  const tom = () => ({ total: 0, accepted: 0, edited: 0, rejected: 0 });
  const byParser: ParseStats['byParser'] = { local: tom(), llm: tom() };

  for (const r of rows) {
    const bucket = byParser[r.parser];
    bucket.total++;
    bucket[r.outcome]++;
  }

  const andel = (k: ParserKind) =>
    byParser[k].total < MIN_SAMPLES ? null : byParser[k].accepted / byParser[k].total;

  const latenser = rows
    .filter((r) => r.parser === 'llm' && typeof r.latencyMs === 'number')
    .map((r) => r.latencyMs as number)
    .sort((a, b) => a - b);

  return {
    total: rows.length,
    byParser,
    accuracy: { local: andel('local'), llm: andel('llm') },
    medianLlmLatencyMs: latenser.length === 0 ? null : latenser[Math.floor(latenser.length / 2)]!,
  };
}
