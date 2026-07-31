/**
 * Estimerat 1RM. Uppgift 9.3.
 *
 * Att faktiskt testa sitt 1RM på gymmet innebär hög skaderisk och en
 * trötthetsskuld som kan förstöra veckan efter. Ett estimat ur submaximala
 * lyft ger samma information gratis.
 *
 * Vi använder **Epley**, som underlaget rekommenderar för hypertrofispannet
 * (3–10 reps). Brzycki är mer konservativ men går mot division med noll när
 * repsen närmar sig 37, vilket gör den olämplig för högreps-set.
 *
 *   Epley:  1RM = w × (1 + r/30)
 *
 * Poängen med e1RM är att göra set jämförbara över olika rep-intervall:
 * 80 kg × 8 (e1RM 101,3) är en starkare prestation än 90 kg × 3 (e1RM 99,0),
 * vilket är omöjligt att se direkt ur en logg.
 */

/** Över detta blir formeln ren fantasi — uthållighet, inte styrka. */
export const E1RM_MAX_REPS = 15;

/**
 * Returnerar estimerat 1RM i kg, eller null när estimatet inte är meningsfullt.
 *
 * Null i stället för en siffra är avsiktligt: ett e1RM räknat på 30 reps ser ut
 * som data men är brus, och brus i en progressionsgraf är värre än en lucka.
 */
export function epley1RM(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null;
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps > E1RM_MAX_REPS) return null;
  // Ett singel ÄR ett max — formeln ska inte räcka upp det.
  if (reps === 1) return round1(weightKg);
  return round1(weightKg * (1 + reps / 30));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Total volym: vikt × reps. Det enklaste måttet på hur mycket arbete som gjorts. */
export function volumeKg(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return 0;
  if (weightKg <= 0 || reps <= 0) return 0;
  return round1(weightKg * reps);
}
