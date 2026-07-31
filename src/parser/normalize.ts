/** Uppgift 4.3 — normalisering. */

/**
 * Kanonisk form för ett övningsnamn.
 *
 * KONTRAKT MOT DATABASEN: kolumnen `exercises.normalized_name` är
 * `generated always as (lower(btrim(name)))`. Den här funktionen MÅSTE ge
 * exakt samma resultat. Lägg inte till kollaps av inre blanksteg eller
 * strippning av diakriter här utan att ändra migrationen samtidigt — glider
 * de isär slutar parsern hitta övningar som finns, utan att något fel syns.
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Förbereder användarens råtext för grammatiken.
 *
 * Till skillnad från normalizeName får den här vara generös: den ska tåla hur
 * en människa faktiskt skriver mitt i ett pass, med darriga fingrar.
 */
export function normalizeInput(raw: string): string {
  return (
    raw
      .toLowerCase()
      // Alla separatorer blir x: 90*5, 90×5, 90x5
      .replace(/[*×⋅·]/g, 'x')
      // Svenskt decimalkomma → punkt, men BARA mellan siffror. Ett generellt
      // komma→punkt hade förstört varenda anteckning ("90x5, kändes lätt").
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Delar av en avslutande anteckning vid första kommat som inte står mellan
 * två siffror. Körs på RÅtexten, före normalizeInput, så att anteckningens
 * versaler och mellanslag bevaras som användaren skrev dem.
 */
export function splitNote(raw: string): { head: string; note: string | null } {
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== ',') continue;
    const prev = raw[i - 1] ?? '';
    const next = raw[i + 1] ?? '';
    if (/\d/.test(prev) && /\d/.test(next)) continue; // decimaltal, inte anteckning
    const note = raw.slice(i + 1).trim();
    return { head: raw.slice(0, i), note: note === '' ? null : note };
  }
  return { head: raw, note: null };
}
