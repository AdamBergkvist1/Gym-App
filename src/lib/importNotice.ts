/**
 * Textraden om uppskattade datum ovanför övningsgrafen. Uppgift 13.5.
 *
 * Adams gamla anteckningar hade veckonummer, inte datum: `2024 V 14` blev en
 * måndag i den veckan. Punkterna ligger alltså rätt i ordning men inte exakt
 * rätt i tiden, och det måste synas — annars läser man av en kurva som ser
 * mer exakt ut än den är.
 *
 * Medvetet en mening i klartext och **inte** en visuell markering i grafen
 * (ihåliga prickar e.d.): det vore att införa ett nytt visuellt språk innan
 * designbriefen i 11B är klar. Meningen är sann, syns, och kostar ingenting
 * att ta bort när riktig design kommer.
 *
 * Ligger i `lib/` och tar en strukturell typ i stället för att importera
 * `ExercisePoint` — nivå 0 importerar ingenting utanför sig själv (ADR 0001).
 */

/**
 * Månadsnamnen skrivs ut i stället för att hämtas ur `toLocaleDateString`.
 * Locale-data varierar mellan Node-byggen och webbläsare, och en mening som
 * lyder olika i testet och i telefonen är värre än tolv rader data.
 */
const MÅNADER = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

interface Punkt {
  performedAt: string;
  isImported: boolean;
}

/**
 * Meningen, eller `null` när övningen inte har några importerade set.
 *
 * Gränsen sätts till månaden EFTER den sista importerade punkten, så att
 * "före maj 2024" omsluter en import daterad 4 april. Formuleringen förutsätter
 * att importen ligger samlad före den appade historiken, vilket den gör: Adams
 * anteckningar slutar 2024 och appen togs i bruk 2026.
 */
export function importedNotice(punkter: readonly Punkt[]): string | null {
  const importerade = punkter.filter((p) => p.isImported);
  if (importerade.length === 0) return null;

  const sista = importerade.reduce((a, b) => (a.performedAt > b.performedAt ? a : b));
  const d = new Date(sista.performedAt);
  if (Number.isNaN(d.getTime())) return null;

  // +1 månad. December rullar till januari nästa år — Date räknar ut det åt oss
  // om månaden får bli 12.
  const gräns = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const månad = `${MÅNADER[gräns.getUTCMonth()]} ${gräns.getUTCFullYear()}`;

  const n = importerade.length;
  return n === 1
    ? `1 punkt före ${månad} är importerad från gamla anteckningar. Datumet är uppskattat.`
    : `${n} punkter före ${månad} är importerade från gamla anteckningar. Datumen är uppskattade.`;
}
