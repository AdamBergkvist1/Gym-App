import type { ReactNode, SVGProps } from 'react';

/**
 * Ikonuppsättningen. Uppgift 11B.0c.
 *
 * **Ursprung:** https://github.com/tabler/tabler-icons
 * **Licens:** MIT — Copyright (c) 2020-2026 Paweł Kuna
 *
 * MIT kräver att upphovsrättsraden följer med kopian. Den står därför här, i
 * filhuvudet, och inte bara i `docs/EXTERNT.md` — registret uppfyller villkoret
 * för kopierade *värden*, men för kopierad kod hör raden hemma på båda ställena.
 *
 * **Varför JSX och inte `.svg`-filer:** att importera SVG som React-komponenter
 * kräver `vite-plugin-svgr`, och 11B.0c förbjuder nya poster i `package.json`.
 * `CLAUDE.md` §7.3 steg 6 säger dessutom att extern kod ska skrivas om till vår
 * standard — TypeScript-typer, Tailwind, våra namn. Det är vad det här är.
 * **Bara `d`-strängarna är kopierade.** Ramen omkring dem är vår.
 *
 * **Storlek sätts med Tailwind** (`size-4`, `size-6` …). Klassen vinner över
 * attributen 24×24 eftersom CSS slår presentationsattribut. Utan klass blir
 * ikonen 24 px.
 *
 * **Färgen ärvs** via `stroke="currentColor"`. Sätt `text-…` på föräldern —
 * aldrig `fill` eller `stroke` här, då slutar ikonen följa temat.
 *
 * **Alla ikoner är `aria-hidden`, och det är ett medvetet val.** Varje knapp som
 * bär en ikon har redan ett `aria-label` eller synlig text bredvid, så en
 * uppläst ikon hade blivit en dubblering. Behövs en ikon någon gång som ensam
 * betydelsebärare räcker det inte att ta bort `aria-hidden` — den ska då ha
 * `role="img"` och ett `<title>`-barn.
 *
 * ⚠️ **Tailwinds preflight sätter `svg { display: block }`.** En ikon centreras
 * alltså inte av `text-center` på föräldern. Använd `mx-auto`, eller gör
 * föräldern till `flex items-center justify-center`.
 */

/**
 * `children` är medvetet bortlyft: varje ikon bestämmer sina egna streck, så en
 * inskickad `children` hade tystnat utan att någon märkte det. Typen säger nej
 * i stället.
 */
type IkonProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

/**
 * Den gemensamma ramen. Alla värden utom `d` kommer härifrån, vilket är hela
 * poängen: linjetjocklek och ändavslut kan ändras för samtliga ikoner på ett
 * ställe i stället för i tio filer.
 */
function Ikon({ children, ...rest }: IkonProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Klarmarkering. Appens mest tryckta knapp — `SetRow`. */
export function IkonBock(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M5 12l5 5l10 -10" />
    </Ikon>
  );
}

/** Lägg till. */
export function IkonPlus(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M12 5l0 14" />
      <path d="M5 12l14 0" />
    </Ikon>
  );
}

/** Tillbaka. */
export function IkonPilVänster(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M5 12l14 0" />
      <path d="M5 12l6 6" />
      <path d="M5 12l6 -6" />
    </Ikon>
  );
}

/** Vidare in i en detaljvy. */
export function IkonPilHöger(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </Ikon>
  );
}

/** Fler val. Ersätter `⋯`, som ärvde textens tjocklek. */
export function IkonPrickar(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </Ikon>
  );
}

/**
 * Fliken Pass.
 *
 * ⚠️ Den här hör till **flikraden**, inte till övningskorten. Kortens 🏋 ersätts
 * inte av en ikon utan av B4:s accentbricka — se 11B.0c i `TASKS.md`.
 */
export function IkonSkivstång(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M2 12h1" />
      <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
      <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
      <path d="M9 12h6" />
      <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
      <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
      <path d="M22 12h-1" />
    </Ikon>
  );
}

/** Fliken Historik. */
export function IkonHistorik(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M12 8l0 4l2 2" />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </Ikon>
  );
}

/** Fliken Övningar. */
export function IkonLista(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M9 6l11 0" />
      <path d="M9 12l11 0" />
      <path d="M9 18l11 0" />
      <path d="M5 6l0 .01" />
      <path d="M5 12l0 .01" />
      <path d="M5 18l0 .01" />
    </Ikon>
  );
}

/** Vilotimern. */
export function IkonTidtagare(props: IkonProps) {
  return (
    <Ikon {...props}>
      <path d="M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0" />
      <path d="M14.5 10.5l-2.5 2.5" />
      <path d="M17 8l1 -1" />
      <path d="M14 3h-4" />
    </Ikon>
  );
}
