/**
 * Leverantörsgränssnittet. Uppgift 8.5.
 *
 * En implementation per leverantör bakom en gemensam signatur, så att ett byte
 * är en miljövariabel och inte en omskrivning. `ai_parse_log.provider` gör att
 * vi i efterhand kan jämföra träffsäkerhet mellan dem på exakt samma indata.
 *
 * GROQ ÄR PRIMÄR för latensen — svarstiden är den avgörande egenskapen mitt i
 * ett pass. GEMINI ÄR RESERV och har en egen kvot, så att ett kvottak hos den
 * ena inte tar ner fritextinmatningen helt.
 */

import { buildUserMessage, RESPONSE_SCHEMA, SYSTEM_PROMPT, type AiParseRequest } from './prompt.ts';

export interface ProviderResult {
  /** Rå JSON från modellen. Valideras alltid av klienten innan den blir data. */
  payload: unknown;
  provider: string;
  model: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';

/** Kvot- och nätfel är övergående; allt annat är fel i vår begäran. */
function retryable(status: number): boolean {
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

export async function callGroq(req: AiParseRequest, signal: AbortSignal): Promise<ProviderResult> {
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
    throw new ProviderError(`groq ${res.status}: ${await res.text()}`, retryable(res.status));
  }

  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ProviderError('groq svarade utan innehåll', true);

  return { payload: parseJson(content), provider: 'groq', model: GROQ_MODEL };
}

export async function callGemini(req: AiParseRequest, signal: AbortSignal): Promise<ProviderResult> {
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
    throw new ProviderError(`gemini ${res.status}: ${await res.text()}`, retryable(res.status));
  }

  const body = await res.json();
  const content = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== 'string') throw new ProviderError('gemini svarade utan innehåll', true);

  return { payload: parseJson(content), provider: 'gemini', model: GEMINI_MODEL };
}

/**
 * Groq först, Gemini vid övergående fel.
 *
 * Ett permanent fel hos Groq (t.ex. saknad nyckel) faller ändå vidare till
 * Gemini — annars vore reserven värdelös just i det fall den behövs mest.
 */
export async function parseWithLLM(
  req: AiParseRequest,
  signal: AbortSignal
): Promise<ProviderResult> {
  const ordning = (Deno.env.get('AI_PROVIDER_ORDER') ?? 'groq,gemini').split(',');
  const fel: string[] = [];

  for (const namn of ordning) {
    try {
      if (namn.trim() === 'groq') return await callGroq(req, signal);
      if (namn.trim() === 'gemini') return await callGemini(req, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      fel.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new ProviderError(`alla leverantörer misslyckades: ${fel.join(' | ')}`, true);
}
