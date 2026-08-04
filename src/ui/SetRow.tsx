import { formatWeight } from '../lib/steps';
import type { PlannedSet } from '../db/plan';

/**
 * En setrad. Omgjord 2026-08-02 efter referensbilderna i `docs/Reference-pics/`,
 * och igen 2026-08-04 i fas 11B steg 4.2 efter att appen faktiskt granskats
 * visuellt (`npm run shots`).
 *
 * VARFÖR TABELL OCH INTE FLEXRAD: två tidigare försök klipptes av på mobilskärm.
 * Referensappen löser det med en **tabell med fem smala kolumner och rubriker EN
 * gång** — `Set | Förra | Kg | Reps | ✓`. När kolumnen är namngiven i huvudet
 * behöver cellen inte bära sin egen etikett, och då räcker bredden.
 *
 * VAD SKÄRMDUMPEN AVSLÖJADE, och som ingen beskrivning hade fångat:
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
 */

/**
 * Delas med rubrikraden i ExerciseCard så att kolumnerna garanterat linjerar.
 *
 * Breddbudget för iPhone SE, 317 px innanför kortets padding:
 *   Set 28 + Kg 68 + Reps 40 + ✓ 48 = 184 fasta, `Förra` får resterande ~133.
 * `Kg` rymmer `102,5` i 24 px tabulärt (≈59 px) med marginal. Vakten i
 * `e2e/no-horizontal-overflow.spec.ts` mäter detta på riktigt.
 */
export const SET_GRID =
  'grid grid-cols-[1.75rem_minmax(0,1fr)_4.25rem_2.5rem_3rem] items-center gap-1';

interface Props {
  index: number;
  set: PlannedSet;
  /** Vad som lyftes senast — visas i Förra-kolumnen som jämförelse, inte i fältet. */
  ghost: { weightKg: number; reps: number } | null;
  onOpenAdjust: () => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}

export function SetRow({ index, set, ghost, onOpenAdjust, onConfirm, onUnconfirm }: Props) {
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

  const cell =
    'h-12 min-h-0 rounded-md text-center text-set tabular-nums active:bg-[var(--color-bg)]';

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
        {set.isWarmup ? 'W' : index + 1}
      </span>

      {/* Förra — spökdatan som jämförelse. Saknas den visas ingenting alls:
          ett centrerat streck i en bred kolumn läste sig som ett fel. */}
      <span className="truncate text-center text-meta text-[var(--color-dim)] tabular-nums">
        {ghost ? `${formatWeight(ghost.weightKg)} × ${ghost.reps}` : ''}
      </span>

      {/* Kg */}
      <button
        type="button"
        onClick={onOpenAdjust}
        aria-label={
          viktSaknas
            ? `Vikt inte angiven för set ${index + 1}, tryck för att ange`
            : `Vikt ${formatWeight(set.weightKg)} kilo för set ${index + 1}, tryck för att ändra`
        }
        className={`${cell} ${dämpad || viktSaknas ? 'text-[var(--color-dim)]' : ''}`}
      >
        {viktSaknas ? '–' : formatWeight(set.weightKg)}
      </button>

      {/* Reps */}
      <button
        type="button"
        onClick={onOpenAdjust}
        aria-label={`${set.reps} reps för set ${index + 1}, tryck för att ändra`}
        className={`${cell} ${dämpad ? 'text-[var(--color-dim)]' : ''}`}
      >
        {set.reps}
      </button>

      {/* ✓ — 48×48, inte 40×36. `min-h-0` används INTE här längre: regeln i
          index.css finns för att finmotoriken minskar under ansträngning, och
          att kringgå den på appens mest tryckta knapp var precis fel väg.

          Obekräftad har `--color-line-strong` (3,15:1) och inte `--color-line`
          (1,46:1): kanten är det enda som visar att rutan går att trycka på, och
          då gäller WCAG 1.4.11. */}
      <button
        type="button"
        onClick={confirmed ? onUnconfirm : onConfirm}
        aria-label={confirmed ? `Ångra set ${index + 1}` : `Klarmarkera set ${index + 1}`}
        aria-pressed={confirmed}
        className={[
          'flex h-12 w-12 items-center justify-center justify-self-center rounded-md text-set',
          confirmed
            ? 'bg-[var(--color-ok-solid)] font-bold text-[var(--color-bg)]'
            : 'border border-[var(--color-line-strong)] text-[var(--color-dim)] active:opacity-60',
        ].join(' ')}
      >
        ✓
      </button>
    </li>
  );
}
