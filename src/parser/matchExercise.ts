/** Uppgift 4.5 — övningsmatchning. Gissar aldrig. */

import { normalizeName } from './normalize';
import type { ExerciseRef } from './types';

/** Kortare än så säger för lite för att kunna peka ut en övning. */
const MIN_QUERY_LENGTH = 2;
/** Prefixmatchning kräver lite mer, annars matchar "ba" halva katalogen. */
const MIN_PREFIX_LENGTH = 3;
/** Felstavningstolerans kräver ett ord med substans bakom sig. */
const MIN_FUZZY_LENGTH = 4;
const MAX_EDIT_DISTANCE = 1;

const SCORE_EXACT = 3;
const SCORE_PREFIX = 2;
const SCORE_FUZZY = 1;

/** Levenshtein med två rader i stället för hel matris. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > MAX_EDIT_DISTANCE) return MAX_EDIT_DISTANCE + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost
      );
    }
    prev = curr;
  }
  return prev[b.length] ?? MAX_EDIT_DISTANCE + 1;
}

function scoreCandidate(query: string, candidate: string): number {
  if (candidate === query) return SCORE_EXACT;
  if (query.length >= MIN_PREFIX_LENGTH && candidate.startsWith(query)) return SCORE_PREFIX;
  if (query.length >= MIN_FUZZY_LENGTH && editDistance(query, candidate) <= MAX_EDIT_DISTANCE) {
    return SCORE_FUZZY;
  }
  return 0;
}

/**
 * Returnerar den övning frågan pekar på, eller null.
 *
 * Null betyder "vet inte" och ska leda till att UI:t frågar — aldrig till att
 * vi väljer den mest sannolika. Två kandidater med samma poäng ger också null:
 * ett tyst felval skriver fel övning till databasen, och det upptäcks aldrig.
 */
export function matchExercise(query: string, exercises: ExerciseRef[]): ExerciseRef | null {
  const q = normalizeName(query);
  if (q.length < MIN_QUERY_LENGTH) return null;

  let best = 0;
  let winners: ExerciseRef[] = [];

  for (const ex of exercises) {
    const candidates = [ex.normalizedName, ...ex.aliases.map(normalizeName)];
    let score = 0;
    for (const c of candidates) {
      const s = scoreCandidate(q, c);
      if (s > score) score = s;
    }
    if (score === 0) continue;

    if (score > best) {
      best = score;
      winners = [ex];
    } else if (score === best) {
      winners.push(ex);
    }
  }

  return winners.length === 1 ? (winners[0] ?? null) : null;
}
