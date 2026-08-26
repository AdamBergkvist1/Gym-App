/**
 * Arbetssetets nummer — EN regel, ett ställe. Uppgift steg 4.2 del A.
 */

/**
 * Ger varje set dess plats bland arbetsseten, eller `null` för uppvärmning.
 */
export function workSetIndices(sets: readonly { isWarmup: boolean }[]): (number | null)[] {
  let nästa = 0;
  return sets.map((s) => (s.isWarmup ? null : nästa++));
}
