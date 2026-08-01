/**
 * Systemprompten och kontextformateringen.
 *
 * Ligger i egen fil så att den går att läsa och ändra utan att röra
 * HTTP-hanteringen. Prompten ÄR produkten här — den avgör om svaret blir en
 * parser eller en coach.
 */

// Typerna speglar `src/ai/types.ts`. De kan inte dela modul över
// nätverksgränsen (Deno kräver filändelser, Vite gör inte det), och en fragil
// delningslösning vore sämre än några duplicerade rader. Ändras kontraktet ska
// BÅDA filerna ändras i samma commit.
export interface AiParseRequest {
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

export const SYSTEM_PROMPT = `Du tolkar fritext som en person skrivit i en träningsdagbok mitt i ett gympass.

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
Användaren skriver svenska gymslang. Svara på svenska i note, message och
reasoning.`;

/** Kompakt kontext. Varje tecken går i varje anrop. */
export function buildUserMessage(req: AiParseRequest): string {
  const rader: string[] = [];

  rader.push(`INMATNING: ${req.rawText}`);
  rader.push(`TID: ${req.clientTime}`);
  rader.push(`ENHET: ${req.profile.unitPreference}  ANSTRÄNGNINGSSKALA: ${req.profile.defaultEffortScale}`);

  rader.push('');
  rader.push('CATALOGUE (id | namn | alias):');
  for (const e of req.catalogue) {
    rader.push(`${e.id} | ${e.name} | ${e.aliases.join(', ')}`);
  }

  if (req.history.length > 0) {
    rader.push('');
    rader.push('HISTORIK (senast tränade övningar):');
    for (const h of req.history) {
      const delar: string[] = [`${h.name}`];
      if (h.last) delar.push(`senast ${h.last.weightKg} kg x ${h.last.reps} (${h.last.performedAt.slice(0, 10)})`);
      if (h.typical)
        delar.push(
          `typiskt ${h.typical.medianKg} kg x ${h.typical.medianReps} (spann ${h.typical.minKg}–${h.typical.maxKg})`
        );
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

export const RESPONSE_SCHEMA = {
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
