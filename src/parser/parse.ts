/** Grammatiken. Uppgift 4.10, omskriven i 4.13. */

import { matchExercise } from './matchExercise';
import { normalizeInput, splitNote } from './normalize';
import { interpret, type RawSet } from './shapes';
import { joinName, tokenize } from './tokenize';
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function unresolved(
  rawText: string,
  reason: UnresolvedReason,
  hint?: string,
  attemptedName?: string
): ParseResult {
  const item: Unresolved = {
    rawText,
    reason,
    ...(hint === undefined ? {} : { hint }),
    ...(attemptedName === undefined ? {} : { attemptedName }),
  };
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
  const patterns: Array<{ re: RegExp; value: 1 | 2; type: 1 | 2 }> = [
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
    const scale = m[type] as EffortType | undefined;
    return {
      type: scale ?? fallback,
      value: parsed,
      rest: body.replace(m[0], ' '),
      outOfRange: parsed < EFFORT_MIN || parsed > EFFORT_MAX,
    };
  }
  return { type: null, value: null, rest: body, outOfRange: false };
}

function toKg(raw: RawSet, profile: Unit): { weightKg: number; source: 'explicit' | 'profile' } {
  const unit = raw.unit ?? profile;
  const weightKg = unit === 'lb' ? round2(raw.enteredWeight * LB_TO_KG) : raw.enteredWeight;
  return { weightKg, source: raw.unitExplicit ? 'explicit' : 'profile' };
}

/**
 * Tolkar en rad fritext till ett eller flera set.
 *
 * Returnerar antingen minst ett set eller exakt ett `unresolved` med skäl.
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
    return unresolved(
      raw,
      'effort_out_of_range',
      `ansträngning måste vara ${EFFORT_MIN}–${EFFORT_MAX}`
    );
  }
  body = normalizeInput(effort.rest);

  const { atoms, nameParts } = tokenize(body);

  // Namnet först: utan övning spelar talen ingen roll, och felmeddelandet blir
  // mer användbart ("ingen övning angiven") än "kunde inte tolka talen".
  const nameQuery = joinName(nameParts);
  if (nameQuery === '') {
    return atoms.length === 0
      ? unresolved(raw, 'empty')
      : unresolved(raw, 'missing_exercise', 'ingen övning angiven');
  }

  const exercise = matchExercise(nameQuery, ctx.exercises);
  if (!exercise) {
    return unresolved(raw, 'unknown_exercise', `känner inte igen "${nameQuery}"`, nameQuery);
  }

  const shape = interpret(atoms);
  if (!shape.ok) return unresolved(raw, shape.reason, shape.hint);

  const sets: ParsedSet[] = shape.sets.map((rawSet) => {
    const { weightKg, source } = toKg(rawSet, ctx.unitPreference);

    // Har användaren skrivit ut enheten har hen själv sagt vilket tal som är
    // vikten. Då finns ingen tvetydighet kvar att fråga om.
    const confidence: Confidence =
      source === 'profile' &&
      (rawSet.enteredWeight <= AMBIGUOUS_WEIGHT_MAX || rawSet.reps > IMPLAUSIBLE_REPS)
        ? 'low'
        : 'high';

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weightKg,
      reps: rawSet.reps,
      effortType: effort.value === null ? null : effort.type,
      effortValue: effort.value,
      note,
      unitSource: source,
      confidence,
    };
  });

  return { sets, unresolved: [] };
}
