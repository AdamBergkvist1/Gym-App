/**
 * Validering av modellens svar. Uppgift 8.9, byggd redan nu eftersom den är
 * säkerhetskritisk och inte ett tillägg.
 *
 * **Modellen är aldrig auktoritet.** Den föreslår; den här filen avgör vad som
 * får bli data. Det farligaste felläget är ett påhittat övnings-id som ser ut
 * som ett UUID: utan kontrollen mot katalogen hade setet skrivits mot en
 * övning som inte finns, och främmandenyckeln hade fällt hela synkbatchen
 * långt senare — med ett felmeddelande långt från orsaken.
 *
 * Resultatet är samma `ParseResult` som den lokala parsern ger, så att UI:t
 * inte behöver veta varifrån ett set kom.
 */

import type { Confidence, EffortType, ParseResult, ParsedSet, Unresolved } from '../parser/types';
import type { AiExerciseRef } from './types';

/** Rimlighetsgränser. Utanför dem är det inte data utan brus. */
const MAX_WEIGHT_KG = 1000;
const MAX_REPS = 200;
const EFFORT_MIN = 0;
const EFFORT_MAX = 10;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function fail(rawText: string, hint: string, reason: Unresolved['reason'] = 'ambiguous_numbers'): ParseResult {
  return { sets: [], unresolved: [{ rawText, reason, hint }] };
}

export function validateAiResponse(
  payload: unknown,
  catalogue: AiExerciseRef[],
  rawText: string
): ParseResult {
  if (!isRecord(payload)) {
    return fail(rawText, 'AI-svaret hade fel form');
  }

  const byId = new Map(catalogue.map((e) => [e.id, e]));
  const sets: ParsedSet[] = [];
  const unresolved: Unresolved[] = [];

  const rawSets = Array.isArray(payload['sets']) ? payload['sets'] : [];
  for (const raw of rawSets) {
    if (!isRecord(raw)) {
      unresolved.push({ rawText, reason: 'ambiguous_numbers', hint: 'ett set hade fel form' });
      continue;
    }

    const exerciseId = typeof raw['exerciseId'] === 'string' ? raw['exerciseId'] : '';
    const exercise = byId.get(exerciseId);
    if (!exercise) {
      // Modellen valde en övning som inte fanns i katalogen vi skickade.
      unresolved.push({
        rawText,
        reason: 'unknown_exercise',
        hint: 'AI:n föreslog en övning som inte finns',
      });
      continue;
    }

    const weightKg = Number(raw['weightKg']);
    const reps = Number(raw['reps']);
    if (
      !Number.isFinite(weightKg) ||
      weightKg < 0 ||
      weightKg > MAX_WEIGHT_KG ||
      !Number.isInteger(reps) ||
      reps <= 0 ||
      reps > MAX_REPS
    ) {
      unresolved.push({
        rawText,
        reason: 'ambiguous_numbers',
        hint: `orimliga värden från AI:n (${String(raw['weightKg'])} kg × ${String(raw['reps'])})`,
      });
      continue;
    }

    // Ansträngning är valfri. Är den trasig slängs den — setet är fortfarande
    // användbart, och att avvisa hela raden för ett valfritt fält vore fel.
    const typKandidat = raw['effortType'];
    const effortType: EffortType | null =
      typKandidat === 'rir' || typKandidat === 'rpe' ? typKandidat : null;
    const värde = Number(raw['effortValue']);
    const effortValue =
      effortType !== null && Number.isFinite(värde) && värde >= EFFORT_MIN && värde <= EFFORT_MAX
        ? värde
        : null;

    // Förvalet är LÅG konfidens. Har modellen härlett något ur historiken ska
    // användaren få bekräfta — hellre fråga än att skriva en gissning.
    const confidence: Confidence = raw['confidence'] === 'high' ? 'high' : 'low';

    const resonemang = typeof raw['reasoning'] === 'string' ? raw['reasoning'].trim() : '';

    sets.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weightKg: Math.round(weightKg * 100) / 100,
      reps,
      effortType: effortValue === null ? null : effortType,
      effortValue,
      note: typeof raw['note'] === 'string' && raw['note'].trim() !== '' ? raw['note'].trim() : null,
      unitSource: 'profile',
      confidence,
      ...(resonemang === '' ? {} : { reasoning: resonemang }),
    });
  }

  const rawUnresolved = Array.isArray(payload['unresolved']) ? payload['unresolved'] : [];
  for (const raw of rawUnresolved) {
    if (!isRecord(raw)) continue;
    const message = typeof raw['message'] === 'string' ? raw['message'] : 'AI:n kunde inte tolka raden';
    unresolved.push({ rawText, reason: 'unknown_exercise', hint: message });
  }

  // Ett svar utan både set och skäl är ett tyst misslyckande. Sådana ska
  // aldrig passera som "det gick bra men blev inget".
  if (sets.length === 0 && unresolved.length === 0) {
    return fail(rawText, 'AI:n svarade utan innehåll');
  }

  return { sets, unresolved };
}
