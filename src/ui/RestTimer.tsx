import { adjustRestTimer, formatRemaining, startRestTimer } from '../timer/restTimer';
import { useRestTimer } from '../timer/useRestTimer';

/**
 * Vilotimern i UI:t. Uppgift 6.3 och 6.4. Omgjord i steg 4.2 del C.
 *
 * När tiden gått ut byter hela panelen färg — det visuella larmet. Det kräver
 * inga behörigheter och kan inte tas ifrån oss av en iOS-uppdatering, till
 * skillnad från notis, vibration och ljud. Det är därför det är grunden och
 * inte tillägget.
 *
 * 🔄 **Det utgångna läget följer nu väg C, och det löste en kontrastskuld.**
 * Panelen var `--color-ok-solid` med vit text, och etiketten *"Vila klar"*
 * mätte **3,16:1** mot kravet 4,5:1 för liten text. Skulden kom inte ur
 * tokenbytet i steg 4.1 utan ur att en **fylld semantisk yta användes som
 * banderollbakgrund för brödtext** — väg C sanktionerade solid för *en glyf*,
 * aldrig för en textrad (`DESIGN.md` §1b).
 *
 * **Väg C:s egen regel gäller nu: betydelsen bärs av YTA + KANT, texten är
 * `--color-fg`.** Samma larm, samma färgbyte, men texten är läsbar.
 *
 * ⚠️ **Chipet ligger direkt på papperet, inte på ett vitt kort**, och fynd 3 i
 * §1b säger att tonade ytor försvinner där (1,04–1,09:1). Det är därför kanten
 * inte är valfri: den är det som identifierar rutan när ytan knappt syns mot
 * underlaget.
 *
 * ⛔ **Kanten är `--color-ok-text`, INTE `--color-ok-line`, och det är ett
 * medvetet avsteg.** Briefens kanttoken är uppmätt **mot vitt kort** (3,55:1).
 * Det här chipet ligger på papperet, och där mäter samma värde **2,99:1** —
 * marginellt under WCAG 1.4.11:s 3:1, alltså underkänt på den sida som vetter
 * utåt. Uppmätta alternativ, båda sidor av kanten:
 *
 * | Token | Mot papper (ut) | Mot `ok-bg` (in) |
 * |---|---|---|
 * | `--color-ok-line` | **2,99** ⛔ | 3,17 ✓ |
 * | `--color-ok-text` | **5,50** ✓ | 5,83 ✓ |
 *
 * Tokenen heter `-text` för att den föddes som textfärg, men den är den enda
 * gröna i systemet som klarar kravet mot **båda** underlagen. Att i stället
 * flytta chipet in på ett vitt kort hade följt §1b bokstavligt — men §3.1 säger
 * uttryckligen att timern ska vara *"en chip i flödet, inte ett
 * banderoll-lager"*, och ett kort runt den hade gjort den till just ett lager.
 */
export function RestTimer() {
  const { state, remaining, expired, cancel } = useRestTimer();

  /**
   * 🆕 **Utan vila är platsen inte tom längre — den bär knappen. Uppgift 12.57.**
   *
   * Adam: *"kanske kan man ha en knapp, om man nu vill ha exakt vilotid mellan
   * set, där vilotimern startar. Och så kan man fylla i vad man tog på setet
   * medans den tickar ner."*
   *
   * Knappen ligger i timerns egen plats i flödet och inte på setraden, av två
   * skäl: vilan hör till passet och inte till ett enskilt set, och platsen kan
   * bara visa **en** av de två sakerna åt gången — går vilan finns det inget
   * att starta. Att knappen och nedräkningen delar plats är därför inte en
   * layoutgenväg utan lägena i samma tillstånd.
   */
  if (!state) {
    return (
      <button
        type="button"
        onClick={() => void startRestTimer()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border
                   border-[var(--color-line-strong)] bg-[var(--color-surface)] py-3
                   text-body font-medium active:opacity-80"
      >
        Starta vila
      </button>
    );
  }

  return (
    <div
      role="timer"
      aria-live={expired ? 'assertive' : 'off'}
      className={[
        'rounded-lg border p-3 transition-colors',
        expired
          ? 'border-[var(--color-ok-text)] bg-[var(--color-ok-bg)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface)]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        {/* Glyfen är det solida får bära — en fylld prick, inte en textrad.
            Den gör larmet lika synligt på avstånd som den fyllda panelen
            gjorde, utan att lägga brödtext ovanpå en mättad yta. */}
        {expired && (
          <span aria-hidden className="size-3 shrink-0 rounded-full bg-[var(--color-ok-solid)]" />
        )}
        <span className="text-timer font-semibold tabular-nums">
          {formatRemaining(remaining)}
        </span>
        <span className={expired ? 'text-sm font-semibold' : 'text-sm text-[var(--color-dim)]'}>
          {expired ? 'Vila klar' : 'Vilar'}
        </span>

        <span className="flex-1" />

        {!expired && (
          <>
            <button
              type="button"
              onClick={() => void adjustRestTimer(-30)}
              aria-label="Minska vilotiden med 30 sekunder"
              className="rounded-md border border-[var(--color-line-strong)] px-3 text-sm"
            >
              −30
            </button>
            <button
              type="button"
              onClick={() => void adjustRestTimer(30)}
              aria-label="Öka vilotiden med 30 sekunder"
              className="rounded-md border border-[var(--color-line-strong)] px-3 text-sm"
            >
              +30
            </button>
          </>
        )}

        <button
          type="button"
          onClick={cancel}
          className={[
            'rounded-md px-3 text-sm',
            // Kanten identifierar knappen i båda lägena. I det utgångna låg den
            // tidigare som papper-på-grönt utan kant, vilket var samma
            // solid-som-yta-fel som etiketten bredvid.
            expired
              ? 'border border-[var(--color-line-strong)] bg-[var(--color-surface)] text-[var(--color-fg)]'
              : 'border border-[var(--color-line-strong)] text-[var(--color-dim)]',
          ].join(' ')}
        >
          {expired ? 'Okej' : 'Hoppa över'}
        </button>
      </div>

      {!expired && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
          <div
            className="h-full bg-[var(--color-fg)] transition-[width] duration-500 ease-linear"
            style={{
              width: `${Math.max(0, Math.min(100, (remaining / (state.durationSeconds * 1000)) * 100))}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
