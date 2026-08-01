/**
 * Kontraktet mot `/ai/parse`. Uppgift 8.0 och 8.3.
 *
 * DENNA FIL ÄR SANNINGEN för formatet. Edge Function-koden i
 * `supabase/functions/ai-parse/` speglar typerna i egen Deno-kod — de kan inte
 * dela modul över nätverksgränsen, och en fragil delningslösning vore sämre än
 * fyrtio rader duplicerade typer. Ändras något här ska funktionen ändras i
 * samma commit.
 *
 * VARFÖR HISTORIKEN SKICKAS MED (uppgift 8.0):
 * En modell som bara ser den inmatade texten kan *tolka* den. En modell som
 * också ser träningshistoriken kan *resonera* om den — veta att 90 kg är tungt
 * just för den här användaren, förstå vad "samma som förra gången" betyder, och
 * reagera när ett värde avviker kraftigt från vad personen brukar lyfta.
 * Det är skillnaden mellan en parser och en coach. Utan detta avsnitt vore
 * fas 8 bara en dyrare version av fas 4.
 */

import type { Confidence, EffortType, Unit } from '../parser/types';

// ---------------------------------------------------------------- begäran

/** Övningarna modellen får välja mellan. Den får ALDRIG hitta på ett id. */
export interface AiExerciseRef {
  id: string;
  name: string;
  aliases: string[];
}

/** Vad användaren brukar göra i en övning. Grunden för att kunna resonera. */
export interface AiExerciseHistory {
  exerciseId: string;
  name: string;
  /** Senaste utförandet — det "samma som förra gången" syftar på. */
  last: { weightKg: number; reps: number; performedAt: string } | null;
  /** Typiskt spann. Låter modellen känna igen ett orimligt värde. */
  typical: { minKg: number; maxKg: number; medianKg: number; medianReps: number } | null;
  bestE1rm: number | null;
  totalSets: number;
}

/** Det pågående passet — så att "en till" och "samma igen" betyder något. */
export interface AiCurrentWorkout {
  workoutId: string;
  startedAt: string;
  sets: Array<{
    exerciseId: string;
    exerciseName: string;
    weightKg: number;
    reps: number;
    setIndex: number;
  }>;
}

export interface AiParseRequest {
  rawText: string;
  /** Klientens tid. Servern har ingen aning om användarens tidszon. */
  clientTime: string;
  profile: { unitPreference: Unit; defaultEffortScale: EffortType };
  catalogue: AiExerciseRef[];
  /** Bara för nyligen tränade övningar — hela historiken vore både dyr och brus. */
  history: AiExerciseHistory[];
  currentWorkout: AiCurrentWorkout | null;
}

// ---------------------------------------------------------------- svar

export interface AiParsedSet {
  exerciseId: string;
  weightKg: number;
  reps: number;
  effortType: EffortType | null;
  effortValue: number | null;
  note: string | null;
  confidence: Confidence;
  /**
   * Modellens motivering när den härlett något ur historiken, t.ex.
   * "samma som förra passet". Visas för användaren — härledd data ska aldrig
   * se ut som inmatad data.
   */
  reasoning?: string;
}

export interface AiUnresolved {
  reason: string;
  message: string;
}

export interface AiParseResponse {
  sets: AiParsedSet[];
  unresolved: AiUnresolved[];
  provider: string;
  model: string;
  latencyMs: number;
}

/**
 * JSON-schemat modellen tvingas svara enligt. Skickas till leverantören som
 * `response_format` / `responseSchema` — struktur ska garanteras av API:t, inte
 * hoppas på i prompten.
 */
export const AI_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sets', 'unresolved'],
  properties: {
    sets: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['exerciseId', 'weightKg', 'reps'],
        properties: {
          exerciseId: { type: 'string' },
          weightKg: { type: 'number' },
          reps: { type: 'integer' },
          effortType: { type: ['string', 'null'], enum: ['rir', 'rpe', null] },
          effortValue: { type: ['number', 'null'] },
          note: { type: ['string', 'null'] },
          confidence: { type: 'string', enum: ['high', 'low'] },
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
} as const;
