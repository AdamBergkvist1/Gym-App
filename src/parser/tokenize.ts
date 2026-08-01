/**
 * Tokenisering. Uppgift 4.13.
 *
 * Den ursprungliga grammatiken var ETT regex förankrat i båda ändar. Det
 * fungerade så länge inmatningen såg ut som `bänk 90x5`, men kunde aldrig
 * hantera att övningsnamnet flyttar sig — `80x7 bänk`, `3x8 bänk 60` — eftersom
 * ett ankrat mönster förutsätter en fast ordning.
 *
 * Lösningen är att sluta gissa formen och i stället plocka isär strängen i
 * **taltokens** och **ordtokens**, och notera HUR varje tal satt ihop med det
 * föregående. Kopplingen (`x` eller mellanslag eller text emellan) är det som
 * skiljer `90x5x3` (tre set) från `90x5 85x5` (två set) från `3x8 ... 60`
 * (set×reps, sedan vikt) — och den informationen finns inte kvar om man bara
 * samlar in en lista med siffror.
 */

import type { Unit } from './types';

export type Join =
  /** Första talet i strängen. */
  | 'start'
  /** Satt ihop med föregående tal med x, *, × — samma uttryck. */
  | 'x'
  /** Skilt från föregående tal med bara blanksteg. */
  | 'space'
  /** Det stod bokstäver emellan — typiskt övningsnamnet. */
  | 'text';

export interface NumberAtom {
  value: number;
  /** Utskriven viktenhet. null = ingen angiven. */
  unit: Unit | null;
  /** Suffixat med r/rep/reps — då VET vi att det är repetitioner. */
  repMarked: boolean;
  join: Join;
}

export interface Tokenized {
  atoms: NumberAtom[];
  /** Allt som inte var tal, i den ordning det förekom. Övningsnamnet. */
  nameParts: string[];
}

/**
 * Talet, plus ett valfritt suffix som inte får äta in i ett ord.
 *
 * Suffixgruppen har en egen negativ lookahead: utan den skulle `5 rodd` tolkas
 * som "5 reps" följt av "odd", eftersom `r` matchar. Lookaheaden ligger INNE i
 * den valfria gruppen så att `90x5` fortfarande matchar — där följs talet av
 * `x`, som är en bokstav, och en lookahead på hela matchningen hade fällt den.
 */
const NUMBER = /(\d+(?:\.\d+)?)(?:\s*(kg|kilo|lbs|lb|reps|rep|r)(?![\p{L}]))?/gu;

const X_ONLY = /^\s*[x]\s*$/;
const BLANK_ONLY = /^\s*$/;

function unitFrom(suffix: string | undefined): { unit: Unit | null; repMarked: boolean } {
  if (suffix === undefined) return { unit: null, repMarked: false };
  if (suffix === 'kg' || suffix === 'kilo') return { unit: 'kg', repMarked: false };
  if (suffix === 'lb' || suffix === 'lbs') return { unit: 'lb', repMarked: false };
  return { unit: null, repMarked: true }; // r / rep / reps
}

/** `text` ska redan vara normaliserad (gemener, x som separator, punkt som decimal). */
export function tokenize(text: string): Tokenized {
  const atoms: NumberAtom[] = [];
  const nameParts: string[] = [];

  let cursor = 0;
  NUMBER.lastIndex = 0;

  for (let m = NUMBER.exec(text); m !== null; m = NUMBER.exec(text)) {
    const gap = text.slice(cursor, m.index);

    let join: Join;
    if (atoms.length === 0 && BLANK_ONLY.test(gap)) join = 'start';
    else if (X_ONLY.test(gap)) join = 'x';
    else if (BLANK_ONLY.test(gap)) join = 'space';
    else {
      join = 'text';
      const ord = gap.trim();
      if (ord !== '') nameParts.push(ord);
    }

    const raw = m[1];
    if (raw === undefined) continue;
    const { unit, repMarked } = unitFrom(m[2]);
    atoms.push({ value: Number(raw), unit, repMarked, join });

    cursor = m.index + m[0].length;
  }

  const svans = text.slice(cursor).trim();
  if (svans !== '') nameParts.push(svans);

  return { atoms, nameParts };
}

/**
 * Sätter ihop namnet ur ordbitarna.
 *
 * Ensamma `x` faller bort: i `80 x 7 bänk` blir mellanrummet mellan 80 och 7
 * ett eget ordfragment, och utan filtret hade övningen hetat "x bänk".
 */
export function joinName(parts: string[]): string {
  return parts
    .flatMap((p) => p.split(/\s+/))
    .filter((w) => w !== '' && w !== 'x')
    .join(' ')
    .trim();
}
