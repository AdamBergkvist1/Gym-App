// =====================================================================
// Gym-App — Edge Function `ai-parse`
//
// EN ENDA FIL, med flit. Funktionen klistras in i Supabase webbdashboard
// (Edge Functions → Deploy a new function → Via Editor), som bara hanterar
// en fil. Dela aldrig upp den igen utan att först byta till CLI-deploy.
//
// Webbeditorn har INGEN versionshantering. Den här filen i git är sanningen;
// dashboarden är bara en kopia. Ändras filen måste den klistras in på nytt.
//
// ---------------------------------------------------------------------
// SÄKERHETSGRÄNSER
//
// 1. LLM-nycklarna finns bara här, som miljövariabler. De når aldrig
//    klienten, aldrig git, aldrig `.env.example`.
// 2. Anonyma anrop avvisas. Utan giltig session, ingen tolkning — annars
//    vore funktionen en gratis LLM-proxy för vem som helst med URL:en.
// 3. Funktionen skriver INGENTING till databasen. Den tolkar och svarar.
//    Klienten validerar svaret och skriver till Dexie. En bugg här kan
//    därför i värsta fall ge ett dåligt förslag — aldrig korrupt data.
// 4. `user_id` finns inte i kontraktet. Modellen får aldrig ett fält som
//    avgör vem datan tillhör.
//
// ---------------------------------------------------------------------
// SÅ HÄR DEPLOYAR DU (inget CLI behövs)
//
// 1. Supabase Dashboard → Edge Functions → Secrets. Lägg till:
//      GROQ_API_KEY     = <nyckel från ett EGET Groq-konto>
//      GEMINI_API_KEY   = <nyckel, valfri men rekommenderad som reserv>
//    Valfria finjusteringar:
//      GROQ_MODEL           (förval: llama-3.3-70b-versatile)
//      GEMINI_MODEL         (förval: gemini-2.0-flash)
//      AI_PROVIDER_ORDER    (förval: groq,gemini)
//
// 2. Edge Functions → Deploy a new function → Via Editor.
//    Namn: exakt `ai-parse`. Klistra in HELA denna fil. Deploy.
//
// 3. Klart. Klienten anropar den automatiskt när den lokala grammatiken
//    missar och du är inloggad.
//
// Kontraktet speglar `src/ai/types.ts`. Ändras det ska båda ändras i
// samma commit.
// =====================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------- typer

interface AiParseRequest {
  rawText: string;
  clientTime: string;
  profile: { unitPreference: 'kg' | 'lb'; defaultEffortScale: 'rir' | 'rpe' };
  catalogue: Array<{ id: string; name: string; aliases: string[] }>;
  history: Array<{
    exerciseId: string;
    name: string;
    last: { weightKg: number; reps: number; performedAt: string } | null;
    typical: { minKg: number; maxKg: number; medianKg: number; medianReps: number } | null;
    bestE1rm: number | null;
    totalSets: number;
  }>;
  currentWorkout: {
    workoutId: string;
    startedAt: string;
    sets: Array<{
      exerciseId: string;
      exerciseName: string;
      weightKg: number;
      reps: number;
      setIndex: number;
    }>;
  } | null;
}

interface ProviderResult {
  payload: unknown;
  provider: string;
  model: string;
}

class ProviderError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'ProviderError';
    this.retryable = retryable;
  }
}

// ---------------------------------------------------------------- prompt

const SYSTEM_PROMPT = `Du tolkar fritext som en person skrivit i en träningsdagbok mitt i ett gympass.

DITT JOBB
Omvandla texten till konkreta set. Svara ALLTID med JSON enligt schemat.

ABSOLUTA REGLER
1. exerciseId MÅSTE vara ett id ur listan CATALOGUE. Hitta ALDRIG på ett id.
   Passar ingen övning: lämna sets tom och förklara i unresolved.
2. Gissa ALDRIG en vikt eller ett repsantal som inte går att härleda. Hellre
   unresolved än ett påhittat värde — fel data i loggen går inte att upptäcka
   i efterhand.
3. Vikt anges i kilo i svaret. Är profilens enhet lb och användaren inte skrivit
   ut någon enhet: räkna om till kilo (1 lb = 0,45359237 kg).
4. reps är ett heltal större än noll.

ANVÄND HISTORIKEN — det är därför du får den
- "samma som förra gången", "samma vikt", "som sist" syftar på history.last för
  den övningen.
- "en till", "en till på samma" syftar på senaste setet i currentWorkout.
- "öka 2,5", "lite tyngre" utgår från history.last eller senaste setet i passet.
- Avviker ett värde kraftigt från history.typical: tolka ändå som användaren
  skrev, men sätt confidence: "low" och förklara i reasoning.

CONFIDENCE
- "high" endast när både övning, vikt och reps står uttryckligen i texten.
- "low" i alla andra fall, särskilt när du härlett något ur historiken.
  Låg konfidens innebär att användaren får bekräfta — det är billigt.
  Ett felaktigt sparat set är det inte.

REASONING
Har du härlett något ur historiken: förklara kort på svenska, t.ex.
"samma som förra passet (90 kg x 5)". Fältet visas för användaren, så att
härledd data aldrig ser ut som inmatad data. Skriv inget när allt stod i texten.

SPRÅK
Användaren skriver svensk gymslang. Svara på svenska i note, message och
reasoning.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sets', 'unresolved'],
  properties: {
    sets: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['exerciseId', 'weightKg', 'reps', 'confidence'],
        properties: {
          exerciseId: { type: 'string' },
          weightKg: { type: 'number' },
          reps: { type: 'integer' },
          effortType: { type: ['string', 'null'] },
          effortValue: { type: ['number', 'null'] },
          note: { type: ['string', 'null'] },
          confidence: { type: 'string' },
          reasoning: { type: 'string' },
        },
      },
    },
    unresolved: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['reason', 'message'],
        properties: {
          reason: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

/** Kompakt kontext. Varje tecken går i varje anrop. */
function buildUserMessage(req: AiParseRequest): string {
  const rader: string[] = [];

  rader.push(`INMATNING: ${req.rawText}`);
  rader.push(`TID: ${req.clientTime}`);
  rader.push(
    `ENHET: ${req.profile.unitPreference}  ANSTRÄNGNINGSSKALA: ${req.profile.defaultEffortScale}`
  );

  rader.push('');
  rader.push('CATALOGUE (id | namn | alias):');
  for (const e of req.catalogue) {
    rader.push(`${e.id} | ${e.name} | ${e.aliases.join(', ')}`);
  }

  if (req.history.length > 0) {
    rader.push('');
    rader.push('HISTORIK (senast tränade övningar):');
    for (const h of req.history) {
      const delar: string[] = [h.name];
      if (h.last) {
        delar.push(`senast ${h.last.weightKg} kg x ${h.last.reps} (${h.last.performedAt.slice(0, 10)})`);
      }
      if (h.typical) {
        delar.push(
          `typiskt ${h.typical.medianKg} kg x ${h.typical.medianReps} (spann ${h.typical.minKg}–${h.typical.maxKg})`
        );
      }
      if (h.bestE1rm !== null) delar.push(`bästa e1RM ${h.bestE1rm}`);
      delar.push(`${h.totalSets} set totalt`);
      rader.push(`- ${delar.join(' | ')}  [id ${h.exerciseId}]`);
    }
  } else {
    rader.push('');
    rader.push('HISTORIK: tom — användaren har inte loggat något ännu.');
  }

  if (req.currentWorkout) {
    rader.push('');
    rader.push(`PÅGÅENDE PASS (startat ${req.currentWorkout.startedAt}):`);
    if (req.currentWorkout.sets.length === 0) {
      rader.push('- inga set ännu');
    } else {
      for (const s of req.currentWorkout.sets) {
        rader.push(`- ${s.exerciseName} set ${s.setIndex + 1}: ${s.weightKg} kg x ${s.reps}`);
      }
    }
  } else {
    rader.push('');
    rader.push('PÅGÅENDE PASS: inget.');
  }

  return rader.join('\n');
}

// ---------------------------------------------------------------- leverantörer

const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

/** Kvot- och serverfel är övergående; allt annat är fel i vår begäran. */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Modeller lägger ibland svaret i en kodblocksmarkering trots schema.
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new ProviderError('modellen svarade inte med JSON', false);
    return JSON.parse(m[0]);
  }
}

async function callGroq(req: AiParseRequest, signal: AbortSignal): Promise<ProviderResult> {
  const key = Deno.env.get('GROQ_API_KEY');
  if (!key) throw new ProviderError('GROQ_API_KEY saknas', false);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${buildUserMessage(req)}\n\nSvara med JSON enligt: ${JSON.stringify(RESPONSE_SCHEMA)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new ProviderError(`groq ${res.status}: ${await res.text()}`, isRetryable(res.status));
  }

  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ProviderError('groq svarade utan innehåll', true);

  return { payload: parseJson(content), provider: 'groq', model: GROQ_MODEL };
}

async function callGemini(req: AiParseRequest, signal: AbortSignal): Promise<ProviderResult> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new ProviderError('GEMINI_API_KEY saknas', false);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(req) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    throw new ProviderError(`gemini ${res.status}: ${await res.text()}`, isRetryable(res.status));
  }

  const body = await res.json();
  const content = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== 'string') throw new ProviderError('gemini svarade utan innehåll', true);

  return { payload: parseJson(content), provider: 'gemini', model: GEMINI_MODEL };
}

/**
 * Groq först, Gemini som reserv.
 *
 * Ett PERMANENT fel hos Groq (t.ex. saknad nyckel) faller ändå vidare till
 * Gemini — annars vore reserven värdelös just i det fall den behövs mest.
 */
async function parseWithLLM(req: AiParseRequest, signal: AbortSignal): Promise<ProviderResult> {
  const ordning = (Deno.env.get('AI_PROVIDER_ORDER') ?? 'groq,gemini').split(',');
  const fel: string[] = [];

  for (const namn of ordning) {
    try {
      const trimmad = namn.trim();
      if (trimmad === 'groq') return await callGroq(req, signal);
      if (trimmad === 'gemini') return await callGemini(req, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      fel.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new ProviderError(`alla leverantörer misslyckades: ${fel.join(' | ')}`, true);
}

// ---------------------------------------------------------------- HTTP

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
  const supabase = createClient(url, anon, { global: { headers: { Authorization: auth } } });

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
    // Utan katalog kan modellen inte välja ett giltigt id och skulle tvingas
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
