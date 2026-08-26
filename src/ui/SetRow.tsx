import { formatWeight } from '../lib/steps';
import { IkonBock } from './icons';
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

  const cell =
    'h-14 min-h-0 rounded-md text-center tabular-nums active:bg-[var(--color-bg)]';

  return (
    <li
      className={[
        SET_GRID,
        'border-b border-[var(--color-line)] px-2 last:border-b-0',
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
        onClick={onOpenAdjust}
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
        onClick={onOpenAdjust}
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
    </li>
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
