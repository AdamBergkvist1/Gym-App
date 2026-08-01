/** Uppgift 4.1 — typerna för fritextparsningen. */

export type EffortType = 'rir' | 'rpe';
export type Unit = 'kg' | 'lb';
export type Confidence = 'high' | 'low';

/** Det parsern behöver veta om en övning för att kunna matcha den. */
export interface ExerciseRef {
  id: string;
  name: string;
  /** Måste vara framräknad likadant som kolumnen i databasen. */
  normalizedName: string;
  aliases: string[];
}

export interface ParsedSet {
  exerciseId: string;
  exerciseName: string;
  /** Alltid kg. Databasen har ingen kolumn för vikt utan känd enhet. */
  weightKg: number;
  reps: number;
  effortType: EffortType | null;
  effortValue: number | null;
  note: string | null;
  /**
   * `explicit` = användaren skrev ut enheten. `profile` = vi tolkade enligt
   * profilens inställning. Skillnaden ska synas i UI:t — en tolkad enhet är
   * ett beslut, inte ett faktum.
   */
  unitSource: 'explicit' | 'profile';
  /** `low` betyder att UI:t ska be om bekräftelse innan setet sparas. */
  confidence: Confidence;
  /**
   * Sätts bara av AI-vägen (fas 8), när modellen härlett något ur historiken
   * — t.ex. "samma vikt som förra passet". Visas för användaren, eftersom
   * härledd data aldrig får se ut som inmatad data.
   */
  reasoning?: string;
}

export type UnresolvedReason =
  | 'empty'
  | 'missing_exercise'
  | 'unknown_exercise'
  | 'ambiguous_exercise'
  | 'missing_numbers'
  | 'missing_reps'
  | 'ambiguous_numbers'
  | 'effort_out_of_range';

export interface Unresolved {
  rawText: string;
  reason: UnresolvedReason;
  hint?: string;
  /**
   * Namnet parsern försökte slå upp, när `reason` är `unknown_exercise`.
   *
   * Finns som eget fält och inte bara i `hint`, eftersom UI:t behöver det för
   * att kunna erbjuda "skapa övningen" (uppgift 5.9). Att plocka ut det ur en
   * prosasträng hade fungerat tills någon skrev om formuleringen.
   */
  attemptedName?: string;
}

export interface ParseContext {
  exercises: ExerciseRef[];
  unitPreference: Unit;
  defaultEffortScale: EffortType;
}

export interface ParseResult {
  sets: ParsedSet[];
  unresolved: Unresolved[];
}
