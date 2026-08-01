/**
 * Klientsidan av AI-reserven. Uppgift 8.4 (anropet) och 8.8 (degradering).
 *
 * Anropas ENBART när den lokala grammatiken missat och nät finns. Den ringer
 * aldrig i förväg, aldrig i bakgrunden, och aldrig medan användaren skriver —
 * varje anrop ska vara något användaren bett om.
 */

import { db, type GymDatabase } from '../db/db';
import type { ParseResult } from '../parser/types';
import { buildAiContext } from './context';
import { validateAiResponse } from './validate';
import { getSupabase } from '../sync/supabase';

/** Efter detta är väntan värre än att skriva in setet för hand. */
const TIMEOUT_MS = 4000;

export type AiAvailability = 'ready' | 'not_configured' | 'signed_out' | 'offline';

export async function aiAvailability(): Promise<AiAvailability> {
  const client = getSupabase();
  if (!client) return 'not_configured';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  const { data } = await client.auth.getSession();
  return data.session ? 'ready' : 'signed_out';
}

export interface AiParseOutcome {
  result: ParseResult;
  provider: string | null;
  model: string | null;
  latencyMs: number;
}

function degraded(rawText: string, hint: string, latencyMs: number): AiParseOutcome {
  return {
    result: { sets: [], unresolved: [{ rawText, reason: 'unknown_exercise', hint }] },
    provider: null,
    model: null,
    latencyMs,
  };
}

/**
 * Skickar råtexten till Edge Function-funktionen och validerar svaret.
 *
 * Returnerar ALDRIG ett tomt lyckat resultat. Går något fel blir det ett
 * `unresolved` med ett skäl användaren kan agera på, och UI:t faller tillbaka
 * på manuell inmatning.
 */
export async function parseWithAi(
  rawText: string,
  database: GymDatabase = db
): Promise<AiParseOutcome> {
  const start = Date.now();
  const client = getSupabase();
  if (!client) return degraded(rawText, 'AI-tolkning är inte konfigurerad', 0);

  const context = await buildAiContext(rawText, database);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { data, error } = await client.functions.invoke('ai-parse', {
      body: context,
      // Timeouten hör hemma här och inte bara i funktionen: en Edge Function
      // som hänger ska inte kunna låsa inmatningsfältet.
      signal: controller.signal,
    });

    if (error) {
      return degraded(rawText, `AI:n svarade med fel: ${error.message}`, Date.now() - start);
    }

    const payload = data as { provider?: string; model?: string } | null;
    const result = validateAiResponse(payload, context.catalogue, rawText);

    return {
      result,
      provider: typeof payload?.provider === 'string' ? payload.provider : null,
      model: typeof payload?.model === 'string' ? payload.model : null,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const meddelande =
      err instanceof Error && err.name === 'AbortError'
        ? 'AI:n svarade inte i tid — skriv in setet manuellt'
        : `AI-anropet misslyckades: ${err instanceof Error ? err.message : String(err)}`;
    return degraded(rawText, meddelande, Date.now() - start);
  } finally {
    clearTimeout(timer);
  }
}
