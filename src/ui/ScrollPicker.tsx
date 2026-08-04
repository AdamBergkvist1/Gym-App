import { useEffect, useRef } from 'react';

/**
 * Ett rullhjul. Uppgift 11A.3b.
 *
 * Byggt med `scroll-snap` i stället för ett bibliotek: webbläsarens egen
 * scrollning ger tröghet, studs och rätt känsla på iOS gratis. Ett
 * JavaScript-drivet hjul känns alltid som en imitation, och skulle dessutom
 * lägga hundratals kB på en bundle som redan är stor.
 *
 * Fyllnadsutrymmet över och under listan gör att första och sista värdet kan
 * hamna i mitten — utan det går det inte att välja ytterlägena.
 */

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
  /** Visas under hjulet, t.ex. "kg" eller "reps". */
  caption?: string;
  className?: string;
}

const ITEM_H = 44; // px — stort nog att träffa med svettiga fingrar

/**
 * Tre rader, inte fem. Ändrat 2026-08-04 i fas 11B steg 4.2.
 *
 * Fem rader valdes utan att någon mätte mot den minsta skärm vi lovat stödja.
 * Resultatet: bottenarket blev **793 px högt på en 667 px skärm** (iPhone SE),
 * och headern med övningsnamnet och det sammansatta värdet trycktes 113 px
 * ovanför skärmkanten. Man kunde alltså aldrig se vilken vikt man ställde in —
 * fyra sifferhjul som visade `0 0 0 0` utan någon sammanräknad siffra.
 *
 * Två hjulrader × 2 borttagna rader × 44 px = **176 px sparade**, vilket får in
 * arket med marginal. Tre rader räcker: man ser valt värde plus ett steg åt
 * vardera hållet, vilket är allt som behövs för att förstå att det går att dra.
 */
const VISIBLE = 3;

export function ScrollPicker({ values, value, onChange, label, caption, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Hindrar att vår egen programmatiska scroll rapporteras som ett val. */
  const självScroll = useRef(false);

  const index = Math.max(0, values.indexOf(value));

  // Håll hjulet i synk när värdet ändras utifrån (t.ex. av +/−-knapparna).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mål = index * ITEM_H;
    if (Math.abs(el.scrollTop - mål) < 2) return;
    självScroll.current = true;
    el.scrollTo({ top: mål, behavior: 'auto' });
    // Släpp spärren när scrollhändelserna hunnit rinna av.
    setTimeout(() => (självScroll.current = false), 60);
  }, [index]);

  function handleScroll() {
    if (självScroll.current) return;
    if (timer.current) clearTimeout(timer.current);
    // `scrollend` finns inte i alla Safari-versioner vi bryr oss om, så vi
    // debouncar i stället. 90 ms är kort nog att kännas direkt.
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM_H);
      const v = values[Math.max(0, Math.min(values.length - 1, i))];
      if (v !== undefined && v !== value) onChange(v);
    }, 90);
  }

  const pad = ((VISIBLE - 1) / 2) * ITEM_H;

  return (
    <div className={`flex min-w-0 flex-col items-center ${className ?? ''}`}>
      <div className="relative" style={{ height: VISIBLE * ITEM_H }}>
        {/* Markering för det valda värdet, bakom siffrorna. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-0 rounded-md bg-[var(--color-line)]/50"
          style={{ top: pad, height: ITEM_H }}
        />
        <div
          ref={ref}
          onScroll={handleScroll}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          className="relative z-10 h-full snap-y snap-mandatory overflow-y-scroll
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollPaddingBlock: pad }}
        >
          <div style={{ height: pad }} aria-hidden />
          {values.map((v) => (
            <div
              key={v}
              role="option"
              aria-selected={v === value}
              onClick={() => onChange(v)}
              className={[
                'flex snap-center items-center justify-center text-xl tabular-nums',
                v === value ? 'font-semibold' : 'text-[var(--color-dim)]',
              ].join(' ')}
              style={{ height: ITEM_H }}
            >
              {v}
            </div>
          ))}
          <div style={{ height: pad }} aria-hidden />
        </div>
      </div>
      {caption !== undefined && (
        <span className="mt-1 text-xs text-[var(--color-dim)]">{caption}</span>
      )}
    </div>
  );
}
