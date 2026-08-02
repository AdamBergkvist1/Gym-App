/**
 * Uppdelning av en vikt i siffror. Uppgift 11A.3b.
 *
 * Adams krav: hundratal, tiotal och ental ska gå att snurra var för sig, som i
 * ett iOS-hjul. Att trycka `+` sjutton gånger för att gå från 20 till 62,5 är
 * inte ett gränssnitt.
 *
 * Ren funktion i egen fil eftersom det är exakt den sortens aritmetik som ser
 * trivial ut och går sönder på 92,5 eller 0,5.
 */

export interface WeightDigits {
  hundreds: number; // 0–9
  tens: number; // 0–9
  ones: number; // 0–9
  /** Decimaldelen i halvkilo: 0 eller 5. Skivor finns sällan finare än så. */
  half: 0 | 5;
}

export const MAX_WEIGHT_KG = 999.5;

/** Avrundar till närmaste halvkilo — hjulet har inga finare steg. */
export function snapToHalf(kg: number): number {
  if (!Number.isFinite(kg) || kg < 0) return 0;
  return Math.min(MAX_WEIGHT_KG, Math.round(kg * 2) / 2);
}

export function toDigits(kg: number): WeightDigits {
  const snapped = snapToHalf(kg);
  const heltal = Math.floor(snapped);
  return {
    hundreds: Math.floor(heltal / 100) % 10,
    tens: Math.floor(heltal / 10) % 10,
    ones: heltal % 10,
    half: snapped - heltal === 0.5 ? 5 : 0,
  };
}

export function fromDigits(d: WeightDigits): number {
  const kg = d.hundreds * 100 + d.tens * 10 + d.ones + (d.half === 5 ? 0.5 : 0);
  return snapToHalf(kg);
}

/** Byter en enskild siffra och räknar fram den nya vikten. */
export function withDigit(
  kg: number,
  position: keyof WeightDigits,
  value: number
): number {
  const d = toDigits(kg);
  if (position === 'half') return fromDigits({ ...d, half: value === 5 ? 5 : 0 });
  return fromDigits({ ...d, [position]: value });
}

export const DIGIT_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const HALF_VALUES = [0, 5];
/** Fler reps än så loggar man inte set för set. */
export const REP_VALUES = Array.from({ length: 50 }, (_, i) => i + 1);
