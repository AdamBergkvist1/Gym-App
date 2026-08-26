/**
 * Stegarnas aritmetik. Uppgift 11A.3.
 *
 * Ett medvetet val: **stegen SNAPPAR INTE till ett rutnät.** 91 + 2,5 blir
 * 93,5, inte 92,5.
 *
 * Det hade sett prydligare ut att avrunda till närmaste 2,5, men 91 kg står
 * där för att användaren skrev in det — kanske är det en maskin med udda
 * steg. Att tyst flytta ett värde användaren valt är precis den sortens
 * hjälpsamhet som gör att man slutar lita på en logg. Förutsägbart slår
 * prydligt.
 */

import type { Equipment } from '../db/types';

/** Minsta viktökning på en skivstång: två 1,25-skivor. */
export const WEIGHT_STEP_KG = 2.5;
export const REP_STEP = 1;

/**
 * Den enda utrustning med ett garanterat grovt steg — typad, så att en
 * felstavning här fälls av bygget.
 *
 * Katalogens `equipment` typades av samma skäl (se `CatalogExercise`), men
 * jämförelsen som faktiskt AVGÖR steget stod kvar som en naken strängliteral.
 * Skyddet låg alltså en nivå för grunt: `'skivstáng'` hade gett tyst 1 kg åt
 * varje skivstångsövning, och det enda som fångade det var ett test. Ett test
 * kan strykas eller skrivas om av nästa författare; en typ kan det inte.
 *
 * `import type` raderas vid bygget, så kanten mot `db/` kostar ingenting i
 * bundlen. `db/types.ts` importerar inget ur `lib/`, så ingen cykel uppstår.
 */
const SKIVSTÅNG: Equipment = 'skivstång';

/**
 * Viktsteget för en övning, härlett ur dess utrustning. Uppgift 11B.0f.
 *
 * **Regeln: avrunda bara så grovt som utrustningen är garanterad att vara.**
 *
 * 1,25-skivor finns på varje gym, så 2,5 kg är garanterat för skivstång.
 * Hantelrack, kabelstackar och maskiner varierar mellan gym — och Adam tränar
 * på flera — så där finns inget grovt steg att luta sig mot.
 *
 * Asymmetrin är avsiktlig och kostnaderna är olika stora åt de två hållen. Ett
 * för FINT steg gör talet på sin höjd 1 kg fel, och ett tryck på `+1` rättar
 * det. Ett för GROVT steg raderar precision användaren faktiskt använde: ett
 * hantelsnitt på 9 kg blir 10, och det verkliga normalläget går inte längre att
 * se. Det första är återställbart, det andra är det inte.
 *
 * Marknaden lägger i stället steget redigerbart per övning (FitNotes) eller per
 * utrustningstyp (Hevy, i uppvärmningskalkylatorn). Vi börjar med utrustningen
 * eftersom katalogen redan bär `equipment` på alla övningar — se `SPEC.md` §2
 * och `docs/research/viktsteg-och-avrundning-i-gymappar.md`.
 *
 * ✏️ Här stod först att även Strong gör det per övning. Det är struket: källan
 * för det påståendet var StrongLifts, en annan app. Se rapportens läsanvisning.
 */
export function weightStepFor(equipment: string | null): number {
  // Parametern förblir medvetet `string | null`: egna övningar i fas 7 skapas
  // av användaren och kan bära vad som helst. Det är KATALOGEN som är data vi
  // äger, och det är literalen nedan som är typad.
  //
  // Allt annat — `hantlar`, `kabel`, `maskin`, `kroppsvikt` och okänd
  // utrustning — får hela kilon.
  return equipment === SKIVSTÅNG ? WEIGHT_STEP_KG : 1;
}

/**
 * ±-knapparnas fyra steg i visningsordning, **huvudsteget innerst**.
 *
 * Uppgift steg 4.2 del D. `SetAdjustSheet` hårdkodade `−1 / −2,5 / +2,5 / +1`
 * för varje övning, alltså skivstångens steg som förstahandsval även för
 * hantlar — och Adams eget fynd bakom hela utrustningsregeln var att *"vissa
 * övningar som hantelcurl kör man ju enkilos grejer ibland"*.
 *
 * **Båda stegen finns kvar för båda utrustningarna.** En skivstång kan bära
 * mikroplattor och en hantel kan hoppa 2,5 — det som ändras är vilket steg
 * tummen når först, inte vad som är möjligt. Att ta bort ett steg hade gjort
 * en vikt onåbar; att flytta det kostar ingenting.
 *
 * ⚠️ **Härleds ur `weightStepFor`, inte ur en egen kopia av regeln.** Skulle de
 * två skilja sig avrundade snittet till ett steg knappen inte kan nå, vilket är
 * precis den sortens tysta oenighet som två regler för samma sak ger.
 */
export function nudgeSteps(equipment: string | null): number[] {
  const huvud = weightStepFor(equipment);
  const andra = huvud === WEIGHT_STEP_KG ? 1 : WEIGHT_STEP_KG;
  return [-andra, -huvud, huvud, andra];
}

/** Flyttalsavrundning så att 92,5 + 2,5 aldrig blir 95.00000000000001. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function stepWeight(
  current: number,
  direction: 1 | -1,
  step: number = WEIGHT_STEP_KG
): number {
  if (!Number.isFinite(current)) return 0;
  // Aldrig negativ vikt. Kroppsviktsövningar loggas som 0.
  return Math.max(0, round2(current + direction * step));
}

export function stepReps(current: number, direction: 1 | -1): number {
  if (!Number.isInteger(current)) return 1;
  // Ett set med noll reps är inte ett set.
  return Math.max(1, current + direction * REP_STEP);
}

/** Tolkar det användaren skrivit i ett viktfält. Svenskt komma tillåtet. */
export function parseWeightInput(raw: string): number | null {
  const trimmad = raw.replace(',', '.').trim();
  // `Number('')` är 0. Utan denna rad hade ett tomt fält tyst blivit noll kilo
  // — ett värde som ser ut som data men aldrig matades in.
  if (trimmad === '') return null;
  const n = Number(trimmad);
  return Number.isFinite(n) && n >= 0 ? round2(n) : null;
}

export function parseRepsInput(raw: string): number | null {
  const trimmad = raw.trim();
  if (trimmad === '') return null;
  const n = Number(trimmad);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** 92,5 → "92,5" och 90 → "90". Svensk decimalkomma, inga onödiga nollor. */
export function formatWeight(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace('.', ',');
}

/**
 * Passvolym: 1310 → "1 310" och 462,5 → "462,5". Uppgift 12.18.
 *
 * Decimalen är Adams beslut och har ett skäl: man lägger på 2,5 kg-skivor, så
 * halvkilon är verkliga vikter och inte mätbrus. Att avrunda bort dem gör två
 * olika pass till samma siffra.
 *
 * Skiljer sig från `formatWeight` genom tusentalsavgränsaren — volymer blir
 * fyrsiffriga direkt, och "1310" är svårläst där "1 310" inte är det.
 */
export function formatVolume(kg: number): string {
  return kg.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
