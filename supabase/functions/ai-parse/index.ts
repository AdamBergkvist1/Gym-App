/**
 * Edge Function `ai-parse`. Uppgift 8.4.
 *
 * SÄKERHETSGRÄNSEN I DEN HÄR FILEN:
 *
 * 1. **LLM-nycklarna finns bara här**, som miljövariabler. De når aldrig
 *    klienten, aldrig git, aldrig `.env.example`.
 * 2. **Anonyma anrop avvisas.** Utan giltig session, ingen tolkning — annars
 *    vore funktionen en gratis LLM-proxy för vem som helst med URL:en.
 * 3. **Funktionen skriver ingenting till databasen.** Den tolkar och svarar.
 *    Klienten validerar svaret och skriver till Dexie, vilket betyder att en
 *    bugg här i värsta fall ger ett dåligt förslag — aldrig korrupt data.
 * 4. **`user_id` finns inte i kontraktet.** Modellen får aldrig ett fält som
 *    avgör vem datan tillhör.
 *
 * Deploya: `supabase functions deploy ai-parse`
 * Hemligheter: `supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...`
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parseWithLLM, ProviderError } from './providers.ts';
import type { AiParseRequest } from './prompt.ts';

/** Efter detta är väntan värre än att skriva in setet för hand. */
const TIMEOUT_MS = 3500;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/**
 * Aldrig ett tomt lyckat svar. Går något fel svarar vi med ett `unresolved`
 * som klienten kan visa, så att användaren faller tillbaka på manuell
 * inmatning i stället för att stirra på ingenting.
 */
function degraded(message: string, status = 200): Response {
  return json({ sets: [], unresolved: [{ reason: 'ai_unavailable', message }] }, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return degraded('fel metod', 405);

  // ---- autentisering ----
  const auth = req.headers.get('Authorization');
  if (!auth) return degraded('kräver inloggning', 401);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return degraded('funktionen är felkonfigurerad', 500);

  // Klienten byggs med ANROPARENS token, aldrig med den hemliga nyckeln.
  // Skulle funktionen någon gång röra databasen gäller RLS även härinne.
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return degraded('ogiltig session', 401);

  // ---- begäran ----
  let body: AiParseRequest;
  try {
    body = (await req.json()) as AiParseRequest;
  } catch {
    return degraded('kunde inte läsa begäran', 400);
  }

  if (typeof body?.rawText !== 'string' || body.rawText.trim() === '') {
    return degraded('ingen text att tolka', 400);
  }
  if (!Array.isArray(body.catalogue) || body.catalogue.length === 0) {
    // Utan katalog kan modellen inte välja ett giltigt id, och skulle tvingas
    // hitta på ett. Bättre att avvisa än att bjuda in till det.
    return degraded('katalogen saknas i begäran', 400);
  }

  // ---- tolkning ----
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const result = await parseWithLLM(body, controller.signal);
    const payload = result.payload as Record<string, unknown>;
    return json({
      sets: Array.isArray(payload?.['sets']) ? payload['sets'] : [],
      unresolved: Array.isArray(payload?.['unresolved']) ? payload['unresolved'] : [],
      provider: result.provider,
      model: result.model,
      latencyMs: Date.now() - start,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return degraded('AI:n svarade inte i tid — skriv in setet manuellt');
    }
    const message = err instanceof ProviderError ? err.message : String(err);
    console.error('[ai-parse]', message);
    return degraded('AI-tolkningen är inte tillgänglig just nu');
  } finally {
    clearTimeout(timer);
  }
});
