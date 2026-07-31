/** Uppgift 4.10 — grammatiken. */

import { matchExercise } from './matchExercise';
import { normalizeInput, splitNote } from './normalize';
import type {
  Confidence,
  EffortType,
  ParseContext,
  ParseResult,
  ParsedSet,
  Unit,
  Unresolved,
  UnresolvedReason,
} from './types';

const LB_TO_KG = 0.45359237;

/**
 * Under denna vikt, utan utskriven enhet, är det inte längre uppenbart vilket
 * tal som är vikten och vilket som är reps. "20x30" och "5x5" ser likadana ut
 * för en maskin. Hellre fråga en gång än logga ett omvänt set.
 */
const AMBIGUOUS_WEIGHT_MAX = 30;
/** Fler reps än så tyder på att talen är omkastade. */
const IMPLAUSIBLE_REPS = 30;

const EFFORT_MIN = 0;
const EFFORT_MAX = 10;

/**
 * Vikt, valfri enhet, separator (x eller blanksteg), reps, valfritt rep-suffix.
 * Den lata prefixgruppen blir övningsnamnet.
 */
const SET_PATTERN =
  /^(.*?)\s*(\d+(?:\.\d+)?)\s*(kg|kilo|lbs?)?\s*(?:x\s*|\s+)(\d+)\s*(?:reps?|r)?\s*$/;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function unresolved(rawText: string, reason: UnresolvedReason, hint?: string): ParseResult {
  const item: Unresolved = { rawText, reason, ...(hint === undefined ? {} : { hint }) };
  return { sets: [], unresolved: [item] };
}

interface Effort {
  type: EffortType | null;
  value: number | null;
  rest: string;
  outOfRange: boolean;
}

/** Plockar ut RIR/RPE och lämnar tillbaka texten utan den. */
function extractEffort(body: string, fallback: EffortType): Effort {
  const none: Effort = { type: null, value: null, rest: body, outOfRange: false };

  const patterns: Array<{ re: RegExp; value: 1 | 2; type: 1 | 2 | null }> = [
    { re: /@\s*(\d+(?:\.\d+)?)\s*(rir|rpe)?/, value: 1, type: 2 }, // "@8", "@8 rpe"
    { re: /\b(rir|rpe)\s*(\d+(?:\.\d+)?)\b/, value: 2, type: 1 }, // "rir 2"
    { re: /\b(\d+(?:\.\d+)?)\s*(rir|rpe)\b/, value: 1, type: 2 }, // "8 rpe"
  ];

  for (const { re, value, type } of patterns) {
    const m = body.match(re);
    if (!m) continue;
    const raw = m[value];
    if (raw === undefined) continue;
    const parsed = Number(raw);
    const scale = (type === null ? undefined : m[type]) as EffortType | undefined;
    return {
      type: scale ?? fallback,
      value: parsed,
      rest: body.replace(m[0], ' '),
      outOfRange: parsed < EFFORT_MIN || parsed > EFFORT_MAX,
    };
  }
  return none;
}

/**
 * Tolkar en rad fritext till ett set.
 *
 * Returnerar antingen exakt ett set eller exakt ett `unresolved` med skäl.
 * Aldrig ett halvt tolkat set, och aldrig ett gissat värde: en tyst
 * feltolkning förstör insamlad träningsdata på ett sätt som inte går att
 * upptäcka i efterhand.
 */
export function parseSetText(raw: string, ctx: ParseContext): ParseResult {
  if (raw.trim() === '') return unresolved(raw, 'empty');

  const { head, note } = splitNote(raw);
  let body = normalizeInput(head);
  if (body === '') return unresolved(raw, 'empty');

  const effort = extractEffort(body, ctx.defaultEffortScale);
  if (effort.outOfRange) {
    return unresolved(raw, 'effort_out_of_range', `ansträngning måste vara ${EFFORT_MIN}–${EFFORT_MAX}`);
  }
  body = normalizeInput(effort.rest);

  // Räkna talen innan mönstret körs. Regexen kan annars "lyckas" på fel sätt
  // för "90x5x3" genom att svälja de två första talen i övningsnamnet.
  const numbers = body.match(/\d+(?:\.\d+)?/g) ?? [];
  if (numbers.length === 0) return unresolved(raw, 'missing_numbers', 'ingen vikt och inga reps');
  if (numbers.length === 1) return unresolved(raw, 'missing_reps', 'bara ett tal angivet');
  if (numbers.length > 2) return unresolved(raw, 'ambiguous_numbers', 'fler tal än vikt och reps');

  const m = body.match(SET_PATTERN);
  if (!m) return unresolved(raw, 'ambiguous_numbers', 'kunde inte se vad som är vikt och reps');

  const nameQuery = (m[1] ?? '').trim();
  if (nameQuery === '') return unresolved(raw, 'missing_exercise', 'ingen övning angiven');

  const exercise = matchExercise(nameQuery, ctx.exercises);
  if (!exercise) {
    return unresolved(raw, 'unknown_exercise', `känner inte igen "${nameQuery}"`);
  }

  const enteredWeight = Number(m[2]);
  const reps = Number(m[4]);
  if (!Number.isFinite(enteredWeight) || !Number.isFinite(reps)) {
    return unresolved(raw, 'ambiguous_numbers', 'kunde inte tolka talen');
  }
  if (reps <= 0) return unresolved(raw, 'missing_reps', 'reps måste vara minst 1');

  const unitToken = m[3];
  const explicit = unitToken !== undefined;
  const unit: Unit = explicit ? (unitToken.startsWith('l') ? 'lb' : 'kg') : ctx.unitPreference;
  const weightKg = unit === 'lb' ? round2(enteredWeight * LB_TO_KG) : enteredWeight;

  // Har användaren skrivit ut enheten har hen själv sagt vilket tal som är
  // vikten. Då finns ingen tvetydighet kvar att fråga om.
  const confidence: Confidence =
    !explicit && (enteredWeight <= AMBIGUOUS_WEIGHT_MAX || reps > IMPLAUSIBLE_REPS)
      ? 'low'
      : 'high';

  const set: ParsedSet = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    weightKg,
    reps,
    effortType: effort.value === null ? null : effort.type,
    effortValue: effort.value,
    note,
    unitSource: explicit ? 'explicit' : 'profile',
    confidence,
  };

  return { sets: [set], unresolved: [] };
}
