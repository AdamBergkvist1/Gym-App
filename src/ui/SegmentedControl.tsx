import { useId } from 'react';

/**
 * Segmenterad kontroll — piller, hela bredden. Uppgift steg 4.3 del C.
 *
 * `DESIGN.md` "Genomgående mönster": *"Piller, hela bredden, aktivt segment
 * `--color-fg` på `--color-surface`. Används för Historik och för tidsperiod i
 * Statistik."* Det andra bruket kommer i steg 4.4 — komponenten är generisk för
 * att briefen säger att den ska vara det, inte på spekulation.
 *
 * ## §7.1: sökningen gjordes, och plattformsprimitiven vann
 *
 * Fyra bibliotek vägdes (tabellen står i `docs/EXTERNT.md`). Alla fyra bygger
 * kontrollen på **samma primitiv som den här filen använder** — en radiogrupp —
 * och alla fyra kräver en ny post i `package.json`, vilket kräver Adams ja.
 * React Arias eget svar på frågan är att en `RadioGroup` räcker när valet är
 * enkelt. Då är §7.1:s regel entydig: *en plattformsprimitiv slår alltid ett
 * bibliotek som gör samma sak.*
 *
 * ⚠️ **`sr-only` och inte `hidden`, och det är hela tillgängligheten.** Riktiga
 * `<input type="radio">` med samma `name` ger piltangenter, `Home`/`End`,
 * skärmläsarens "1 av 2" och formulärsemantik **utan en rad JavaScript** — men
 * bara så länge de är fokuserbara. `display: none` eller `hidden` tar bort dem
 * ur tabbordningen, och då är kontrollen enbart muspekbar. `sr-only` gömmer dem
 * visuellt och behåller allt annat.
 *
 * **Fokusringen ligger därför på etiketten**, via `peer-focus-visible`: det är
 * den man ser, medan det är rutan som har fokus.
 */

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** Vad gruppen heter för en skärmläsare. Syns inte. */
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
}: Props<T>) {
  // Två kontroller på samma sida får inte dela `name` — då blir de en enda
  // radiogrupp och att välja i den ena avmarkerar den andra. `useId` gör det
  // omöjligt att råka ut för i stället för att vara något man ska minnas.
  const namn = useId();

  return (
    /* Spåret ligger på papperet och bär därför `--color-line-strong` som kant —
       briefens egen token för *"kanter som identifierar en kontroll"*, uppmätt
       3,16:1 mot papperet efter Adams beslut 2026-08-26. Utan kanten hade
       kontrollen varit ett osynligt fält med ett vitt piller svävande i sig. */
    <fieldset className="flex w-full rounded-full border border-[var(--color-line-strong)] p-1">
      <legend className="sr-only">{label}</legend>
      {segments.map((segment) => (
        <label key={segment.value} className="flex-1 cursor-pointer">
          <input
            type="radio"
            name={namn}
            value={segment.value}
            checked={value === segment.value}
            onChange={() => onChange(segment.value)}
            className="peer sr-only"
          />
          {/* `h-12` = 48 px, briefens tryckytekrav (`DESIGN.md` §2 "Tryckytor").
              Samma höjd som bottennavigeringens flikar. Etiketten är HELA
              tryckytan: `<input>` ligger `sr-only` i dess övre vänstra hörn, och
              ett klick på en `<label>` aktiverar dess kontroll — det är därför
              den 1×1 stora rutan inte är ett problem för fingret. */}
          <span className="text-meta flex h-12 items-center justify-center rounded-full text-[var(--color-dim)] peer-checked:bg-[var(--color-surface)] peer-checked:font-semibold peer-checked:text-[var(--color-fg)] peer-checked:shadow-[var(--shadow-card)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]">
            {segment.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
