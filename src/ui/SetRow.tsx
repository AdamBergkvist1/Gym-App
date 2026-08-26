import { useEffect, useState } from 'react';
import { formatWeight } from '../lib/steps';
import { IkonBock } from './icons';
import { useLongPress } from './useLongPress';
import type { SetAverage } from '../db/history';
import type { PlannedSet } from '../db/plan';

/**
 * En setrad. Omgjord 2026-08-02 efter referensbilderna i `docs/Reference-pics/`,
 * igen 2026-08-04 efter en visuell granskning, och igen 2026-08-26 i steg 4.2
 * när `FÖRRA` ersattes av snittet i form 2B.
 *
 * VARFÖR TABELL OCH INTE FLEXRAD: två tidigare försök klipptes av på mobilskärm.
 * Referensappen löser det med en **tabell med smala kolumner och rubriker EN
 * gång**. När kolumnen är namngiven i huvudet behöver cellen inte bära sin egen
 * etikett, och då räcker bredden.
 *
 * VAD SKÄRMDUMPEN AVSLÖJADE 2026-08-04, och som ingen beskrivning hade fångat:
 *
 * 1. **Setvärdena var 16 px** — mindre än sidrubriken och mindre än knappen
 *    "Lägg till övning". Siffrorna man är där för att ändra var bland det minsta
 *    på skärmen. Nu `--text-set`, 24 px.
 * 2. **Bekräfta-knappen var 40×36 px** via `min-h-0`, alltså under projektets
 *    egen 48 px-regel — och det är appens mest tryckta kontroll.
 * 3. **`0` renderades som ett värde.** `plan.ts` skapar rader med vikt 0 när
 *    historik saknas, med den uttryckliga avsikten "tomma rader som måste fyllas
 *    i". Raden påstod alltså `0 kg` där koden menade *ingenting angivet*.
 * 4. **`Förra` var radens bredaste kolumn** och visade ett streck. Det såg ut
 *    som ett renderingsfel snarare än som frånvaro av data.
 *
 * ⚠️ **Fynd 4 är skälet att snittet INTE visar `–` när underlag saknas helt.**
 * `DESIGN.md` §3.1 reserverar `–` för det fallet, men den regeln skrevs när
 * snittet var en egen kolumn som annars stod tom. I 2B är snittet en andrarad
 * under värdet, och ett streck där skapar en rad som ser ut att bära
 * information. Frånvaron av tal ÄR svaret. Regelns egen poäng — *"aldrig en
 * nolla: en nolla ser ut som ett resultat"* — är oförändrat uppfylld.
 */

/**
 * Delas med rubrikraden i ExerciseCard så att kolumnerna garanterat linjerar.
 *
 * ⚠️ **`Förra` är borta, och dess ~133 px gick till Kg och Reps.** Fyndet ur
 * Strong (`DESIGN.md` §0.5) var att spökdatakolumnen kostade ~⅓ av radbredden
 * och stod tom ändå. Kvar: Set 28 + ✓ 48 = 76 px fast, resten delas lika av de
 * två talkolumnerna. Vakten i `e2e/no-horizontal-overflow.spec.ts` mäter det på
 * riktigt.
 */
export const SET_GRID =
  'grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-1';

interface Props {
  /**
   * Radens plats bland ARBETSSETEN, eller `null` för uppvärmning.
   *
   * ⛔ **Inte radens plats i listan.** Räknas den i stället visar en rad med
   * uppvärmning överst set 2:s snitt på set 1:s rad, tyst. Numret kommer från
   * `workSetIndices`, samma regel som `getSetAverages` grupperar på — se
   * kontraktstestet i `history.test.ts`.
   */
  workSetIndex: number | null;
  set: PlannedSet;
  /** Snittet för just det här setnumret, eller null när underlag saknas. */
  average: SetAverage | null;
  onOpenAdjust: () => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}

export function SetRow({
  workSetIndex,
  set,
  average,
  onOpenAdjust,
  onConfirm,
  onUnconfirm,
}: Props) {
  const confirmed = set.loggedSetId !== null;
  const dämpad = set.fromGhost && !confirmed;

  /**
   * Vikt 0 på en orörd rad utan spökdata betyder "inte angivet", inte "noll
   * kilo". Se `plan.ts`: raderna skapas tomma med flit eftersom en gissad vikt
   * vore påhittad data.
   *
   * Efter bekräftelse visas 0 som 0 — **kroppsviktsövningar väger på riktigt
   * noll**, och att dölja det hade varit ett nytt fel i motsatt riktning.
   */
  const viktSaknas = set.weightKg === 0 && !set.fromGhost && !confirmed;

  /** Vad etiketterna säger. Uppvärmningen har inget nummer, den har en bokstav. */
  const nummer = workSetIndex === null ? 'uppvärmningen' : `set ${workSetIndex + 1}`;

  /**
   * Snittet i klartext, för den som inte ser det.
   *
   * ⚠️ **2B skapar en tillgänglighetslucka som 2A inte hade.** Snittalen är
   * nakna spans utan tillgängligt namn — de fanns inte alls för en skärmläsare.
   * En egen kolumn hade åtminstone haft en rubrik. Att lägga talet i knappens
   * etikett är billigare än att uppfinna en rubrik åt en kolumn som inte finns.
   *
   * Formuleringen *"brukar vara"* bär dessutom det långtrycket ska förklara för
   * den som ser: **vad talet är.** Den öppna frågan från 2B (`DESIGN.md` §3.1)
   * gäller alltså bara den seende vägen.
   */
  const brukar = (värde: string) =>
    average
      ? `, brukar vara ${värde}${average.workoutCount < 3 ? ` enligt ${average.workoutCount} pass` : ''}`
      : '';

  const snittVikt = average ? formatWeight(average.weightKg) : '';

  /**
   * Långtryck förklarar snittalen. Adams beslut 2026-08-26.
   *
   * Gesten sitter på de två talknapparna och inte på raden, eftersom det är
   * talen den förklarar — och för att raden inte är en tryckyta.
   *
   * ⚠️ **Finns inget snitt finns inget att förklara**, och då ska gesten inte
   * heller svälja klicket. `onLongPress` blir en tom funktion, men timern och
   * klickspärren skulle ändå ha kostat ett tryck.
   */
  const [visarInfo, setVisarInfo] = useState(false);
  const långtryck = useLongPress({
    onLongPress: () => average && setVisarInfo(true),
    onTap: onOpenAdjust,
  });

  // `select-none` och `-webkit-touch-callout` hindrar iOS egen callout-meny och
  // textmarkering under gesten. Den första ensam räcker inte — den gäller bara
  // länkar. Se `useLongPress` för hela fällistan.
  const cell =
    'h-14 min-h-0 rounded-md text-center tabular-nums select-none ' +
    '[-webkit-touch-callout:none] active:bg-[var(--color-bg)]';

  return (
    <li
      className={[
        SET_GRID,
        'relative border-b border-[var(--color-line)] px-2 last:border-b-0',
        confirmed ? 'bg-[var(--color-ok-bg)]' : '',
      ].join(' ')}
    >
      {/* Set — 'W' för uppvärmning.
          NEUTRAL färg, inte gul: uppvärmning är en KATEGORI, inte en varning.
          Att märka den med varningsfärg säger åt ögat att något är fel när inget
          är fel. Gul är reserverad för det som kräver ett beslut. Se DESIGN.md §3. */}
      <span
        className={[
          'text-center text-meta tabular-nums text-[var(--color-dim)]',
          set.isWarmup ? 'font-semibold' : '',
        ].join(' ')}
      >
        {workSetIndex === null ? 'W' : workSetIndex + 1}
      </span>

      {/* Kg — värdet stort, snittvikten litet och grått under. Form 2B, vald av
          Adam 2026-08-19 ur `docs/mockups/11b-0g-pass.html`. Konstruktionen är
          MacroFactors: `2108` stort, `of 2643` litet och grått under. */}
      <button
        type="button"
        {...långtryck}
        aria-label={
          viktSaknas
            ? `Vikt inte angiven för ${nummer}${brukar(`${snittVikt} kilo`)}, tryck för att ange`
            : `Vikt ${formatWeight(set.weightKg)} kilo för ${nummer}${brukar(`${snittVikt} kilo`)}, tryck för att ändra`
        }
        className={`${cell} ${dämpad || viktSaknas ? 'text-[var(--color-dim)]' : ''}`}
      >
        <span className="block text-set leading-tight">
          {viktSaknas ? '–' : formatWeight(set.weightKg)}
        </span>
        {average && <Snitt värde={snittVikt} pass={average.workoutCount} />}
      </button>

      {/* Reps — samma konstruktion. Snittrepsen står under repsen, så man aldrig
          behöver fråga sig vilket tal som är vilket. Det var Adams eget skäl att
          välja 2B när snittet blev två tal. */}
      <button
        type="button"
        {...långtryck}
        aria-label={`${set.reps} reps för ${nummer}${brukar(`${average?.reps} reps`)}, tryck för att ändra`}
        className={`${cell} ${dämpad ? 'text-[var(--color-dim)]' : ''}`}
      >
        <span className="block text-set leading-tight">{set.reps}</span>
        {average && <Snitt värde={String(average.reps)} pass={average.workoutCount} />}
      </button>

      {/* ✓ — 48×48, inte 40×36. `min-h-0` används INTE här längre: regeln i
          index.css finns för att finmotoriken minskar under ansträngning, och
          att kringgå den på appens mest tryckta knapp var precis fel väg.

          Obekräftad har `--color-line-strong` och inte `--color-line`: kanten är
          det enda som visar att rutan går att trycka på. */}
      <button
        type="button"
        onClick={confirmed ? onUnconfirm : onConfirm}
        aria-label={confirmed ? `Ångra ${nummer}` : `Klarmarkera ${nummer}`}
        aria-pressed={confirmed}
        className={[
          'flex h-12 w-12 items-center justify-center justify-self-center rounded-md text-set',
          confirmed
            ? 'bg-[var(--color-ok-solid)] font-bold text-[var(--color-bg)]'
            : 'border border-[var(--color-line-strong)] text-[var(--color-dim)] active:opacity-60',
        ].join(' ')}
      >
        <IkonBock className="size-6" />
      </button>

      {visarInfo && average && (
        <Infobricka average={average} onStäng={() => setVisarInfo(false)} />
      )}
    </li>
  );
}

/**
 * Vad de små grå talen är. Visas på långtryck, aldrig av sig själv.
 *
 * ⚠️ **Det här är den ENDA vägen till förklaringen tills 11B.6 byggs**, och den
 * är osynlig tills man hittar den. Accepterat med öppna ögon 2026-08-26 — Adam
 * är appens enda användare i dag och vet vad talen betyder.
 * Engångsförklaringen vid första passet hör till 11B.6, som redan äger samma
 * fråga: vad appen lär ut när den öppnas första gången.
 *
 * `role="dialog"` vore fel — brickan tar inget fokus och stjäl ingen
 * interaktion. `role="tooltip"` med `aria-live` säger vad den är utan att
 * påstå att den är modal. Skärmläsare når för övrigt samma innehåll utan
 * gesten: talen står i knapparnas egna etiketter.
 */
function Infobricka({ average, onStäng }: { average: SetAverage; onStäng: () => void }) {
  const pass = average.workoutCount;

  /**
   * Stängs av nästa nedtryck var som helst.
   *
   * ⛔ **INGEN `fixed inset-0`-overlay, och det är ett rättat fel.** Första
   * versionen la en heltäckande stängknapp bakom brickan. Den dök upp **under
   * fingret medan det fortfarande låg nere**, så `pointerup` hamnade på
   * overlayen i stället för på knappen — och då uteblir `click` helt, eftersom
   * ned- och upptryck skedde på olika element.
   *
   * Följden var värre än en skönhetsfläck: **klickspärren i `useLongPress` blev
   * omätbar.** Sabotage av spärren lämnade vakten grön, eftersom overlayen
   * råkade göra samma jobb av fel skäl. Samma klass av tyst grön vakt som
   * vakt 5 visade sig ha samma dag.
   *
   * `pointerdown` på document kan bara komma från ett NYTT nedtryck — det som
   * öppnade brickan är per definition redan nere. Ingen tidsfördröjning behövs.
   */
  useEffect(() => {
    const stäng = () => onStäng();
    document.addEventListener('pointerdown', stäng);
    return () => document.removeEventListener('pointerdown', stäng);
  }, [onStäng]);

  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="absolute inset-x-2 top-full z-50 -mt-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-3 text-meta shadow-[var(--shadow-card)]"
    >
      <p className="font-semibold">Så här brukar det se ut</p>
      <p className="mt-1 text-[var(--color-dim)]">
        {pass === 1
          ? 'Bygger på 1 pass — det enda som finns loggat än.'
          : `Snitt av dina ${pass} senaste pass med övningen.`}{' '}
        Vikten är ett medelvärde. Repsen är inte snittade, utan tagna från det set som låg
        närmast den vikten.
      </p>
    </div>
  );
}

/**
 * Snittalet under värdet. `--text-meta` och `--color-dim` — **aldrig samma
 * storlek som det du skriver in**, se `DESIGN.md` §3.1. Talet ska viska.
 *
 * ✅ **Prickarna är valda av Adam 2026-08-26.** Briefen kräver att ett snitt på
 * tunt underlag *"visas ändå, märkt med hur många pass det bygger på"*, och
 * mockupen som 2B valdes ur flaggade själv att märkningen *"inte får plats lika
 * lätt här som i en kolumn"*. Fyra former lades fram; en prick per pass vann
 * för att den kostar nästan ingen bredd — samma skäl som gjorde att 2B vann.
 *
 * ⚠️ **Vad valet kostar, och det ska stå kvar:** en ensam prick är tyst tills
 * någon förklarar den. **Långtrycket är den enda förklaringen** tills 11B.6
 * bygger engångsförklaringen, och det är accepterat med öppna ögon — Adam är
 * appens enda användare i dag. Skärmläsarvägen är oberoende: `brukar` i
 * `SetRow` skriver ut antalet i klartext.
 */
function Snitt({ värde, pass }: { värde: string; pass: number }) {
  return (
    <span className="flex items-center justify-center gap-1 text-meta leading-tight text-[var(--color-dim)]">
      {värde}
      {pass < 3 && (
        <span aria-hidden className="flex gap-0.5">
          {Array.from({ length: pass }, (_, i) => (
            <span key={i} className="size-1 rounded-full bg-[var(--color-dim)]" />
          ))}
        </span>
      )}
    </span>
  );
}
