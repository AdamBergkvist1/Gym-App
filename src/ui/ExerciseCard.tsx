import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SetRow, SET_GRID } from './SetRow';
import { SetAdjustSheet } from './SetAdjustSheet';
import { IkonBock, IkonPrickar } from './icons';
import { getSetAverages } from '../db/history';
import { formatVolume } from '../lib/steps';
import { loggadeArbetsset, radnamn, volymAv, workSetIndices } from '../lib/worksets';
import type { PlannedExercise } from '../db/plan';
import type { LocalExercise } from '../db/types';

/**
 * En övning i passet, som kort. Uppgift 11A.2 och 11A.5.
 *
 * Kortet äger justeringsarket för sina rader — det behöver övningens namn och
 * ska bara finnas i ett exemplar åt gången.
 *
 * 🔄 **Steg 4.2: kortet driver setraderna ur `getSetAverages`, inte ur
 * `getLastPerformance`.** `SPEC.md` §2 ersatte "exakt vad du lyfte förra
 * passet" med ett snitt över de tre senaste passen med övningen. Skälet står
 * där — kort: en enskild mätning är brus, och en toppdag som referensvärde
 * varje pass därefter är precis den skada snittet finns för att ta bort.
 */

/** "senast tränad i oktober 2024". Formateringen hör till skärmen, inte frågan. */
const MÅNAD_ÅR = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });

interface Props {
  planned: PlannedExercise;
  exercise: LocalExercise | undefined;
  workoutId: string;
  onChangeSet: (setId: string, patch: { weightKg?: number; reps?: number; isWarmup?: boolean }) => void;
  onConfirmSet: (setId: string) => void;
  onUnconfirmSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onSwapExercise: () => void;
}

export function ExerciseCard({
  planned,
  exercise,
  workoutId,
  onChangeSet,
  onConfirmSet,
  onUnconfirmSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
  onSwapExercise,
}: Props) {
  const [meny, setMeny] = useState(false);
  const [justerar, setJusterar] = useState<string | null>(null);

  const snitt = useLiveQuery(
    () => getSetAverages(planned.exerciseId, undefined, { excludeWorkoutId: workoutId }),
    [planned.exerciseId, workoutId],
    null
  );

  /**
   * ⛔ **Radens plats bland ARBETSSETEN, inte i listan.** `getSetAverages`
   * indexerar sitt svar på arbetssetnummer; räknas radens plats i stället
   * hamnar set 2:s snitt på set 1:s rad så fort en uppvärmningsrad ligger
   * överst — tyst, utan att något test bryts. Regeln bor i `workSetIndices`
   * och kontraktet mellan de två sidorna mäts i `history.test.ts`.
   */
  const nummer = workSetIndices(planned.sets);

  /**
   * De arbetsset som faktiskt är loggade. **Uppvärmning räknas inte.**
   *
   * 🔄 **BÅDA VILLKOREN ÄNDRADES 2026-08-27, och båda kommer ur Adams fråga
   * *"vart kommer det ifrån?"* om metaradens andra tal.**
   *
   * 1. **Att uppvärmningen inte räknas är en ren buggrättning.** Talet räknade
   *    den som ett set, medan resten av appen konsekvent räknar arbetsset.
   *    Ett pass med uppvärmning + tre arbetsset läste `av 4 set`. **Ingen av
   *    `/code-review`:s två agenter såg det**; det krävde frågan "varför står
   *    det fyra".
   * 2. **Namnet säger nu vad talet är.** `klara` beskrev en bock; det här
   *    beskriver arbetsset man gjort, vilket är det metaraden ska bära.
   *
   * ⛔ **SKRIV INTE OM FILTRET HÄR.** Villkoret satt inline fram till 12.48 och
   * glömdes då på tre ställen i tur och ordning. Regeln bor i `loggadeArbetsset`
   * med sina egna tester; den här raden är en anropare, inte en kopia.
   */
  const klaraArbetsset = loggadeArbetsset(planned.sets).length;
  /**
   * Raden arket är öppet för, och dess plats i listan.
   *
   * ⚠️ **PLATSEN ANVÄNDS FÖR ATT SLÅ UPP I `nummer`, ALDRIG SOM SETNUMMER.**
   * Fram till 12.49 skickades `findIndex(...) + 1` rakt in i arket som just ett
   * setnummer — alltså radens plats i listan, uppvärmningen inräknad. Det är
   * exakt den räkning `SetRow`:s docblock förbjuder, och den gjorde att arket
   * sa *"set 3"* om en rad som själv hette *"set 2"*.
   */
  const aktivtIndex = planned.sets.findIndex((s) => s.id === justerar);
  const aktivt = aktivtIndex === -1 ? undefined : planned.sets[aktivtIndex];

  /**
   * Metaradens delar: **utrustning · set · volym**, enligt B4.
   *
   * Byggs som en lista och fogas ihop, så att en saknad del inte lämnar en
   * hängande separator. Katalogens `equipment` är gemener (`skivstång`) och
   * versaliseras här — det är en visning, inte ett datavärde.
   *
   * ⚠️ **`staleSince` tar volymens plats när den finns.** De två utesluter inte
   * varandra tekniskt, men en övning som inte gjorts på åtta veckor har med
   * största sannolikhet noll volym i dag, och *"senast tränad i oktober 2024"*
   * är det raden ska säga då. Frågan lämnar ett rått ISO-datum; formateringen
   * hör till skärmen.
   *
   * ⚠️ **Volymen utesluter uppvärmning sedan 2026-08-27, av samma skäl som
   * setantalet ovan.** Annars hade raden sagt *"3 set · 862,5 kg"* där kilona
   * bar fyra set — två tal ur olika mängder bredvid varandra, vilket är värre
   * än att ett av dem är fel.
   *
   * 🔄 **Går via `volymAv` sedan 12.48**, som summerar genom `volumeKg` precis
   * som frågelagret. Här stod en egen multiplikation — samma tal, ett annat
   * räknesätt, och det är så en divergens börjar.
   */
  const volym = volymAv(planned.sets);

  const metarad = [
    exercise?.equipment ? exercise.equipment[0]!.toUpperCase() + exercise.equipment.slice(1) : null,
    /**
     * ⚠️ **TALET ÄR DET DU KÖRT, INTE DET APPEN GISSAT. Adams beslut
     * 2026-08-27**, och skälet är hans eget: *"man vet ju inte till en början
     * hur många set man vill köra på en övning. Borde ju bara öka 1x per set
     * som man faktiskt kör."*
     *
     * ✏️ **Här stod `${klara} av ${planned.sets.length} set`.** Nämnaren var
     * **appens gissning**: `startExercise` skapar lika många rader som förra
     * passets arbetsset (`plan.ts`), eller tre tomma utan historik. Användaren
     * har aldrig sagt fyra, så *"1 av 4 set"* påstod ett mål hen inte satt.
     *
     * 💡 **Det gjorde raden inkonsekvent på ett andra sätt också:** talet var
     * planerat medan volymen bredvid var loggad. Nu kommer båda ur samma
     * mängd — loggade arbetsset — och raden läser som en beskrivning av vad
     * som hänt.
     *
     * Tomfallet är mockupens (`Kabel · inga set än`) och behövs just för att
     * talet nu kan vara noll; tidigare stod det alltid `0 av N`.
     */
    klaraArbetsset > 0 ? `${klaraArbetsset} set` : 'inga set än',
    snitt?.staleSince
      ? `senast tränad i ${MÅNAD_ÅR.format(new Date(snitt.staleSince))}`
      : volym > 0
        ? `${formatVolume(volym)} kg`
        : null,
  ].filter((d): d is string => d !== null);

  return (
    <section className="overflow-hidden rounded-card bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <header className="flex items-center gap-3 px-3 py-3">
        {/* B4:s ACCENTBRICKA — 10 × 34 px, radie 5, ingen symbol.
            Måtten är mockupens egna (`11b-form-blandningar.html`, `.B4 .brick`).

            ⛔ **Leta inte efter en skivstångsikon.** Här satt 🏋 fram till
            2026-08-26, samma tecken för VARJE övning oavsett vad den var — och
            det var symtomet på att ingen någonsin löst frågan "vilken ikon har
            en lårcurl". B4 gör frågan onödig i stället för att svara på den:
            brickan bär identitet och färg utan att påstå något om rörelsen.
            Sista posten i 11B.0c, och den enda emoji som var kvar i `src/ui/`. */}
        <span
          aria-hidden
          className="h-[34px] w-[10px] shrink-0 rounded-[5px] bg-[var(--color-accent)]"
        />
        <div className="min-w-0 flex-1">
          <h2 className="rubrik-serif truncate text-exercise font-semibold">
            {exercise?.name ?? 'Okänd övning'}
          </h2>
          {/* B4:s METARAD. Den är inte dekoration — den kompenserar något
              konkret: när ikonrutan försvann tappade raden sin enda visuella
              hållpunkt utöver namnet. Metaraden ger tillbaka informationen i
              text i stället för i en symbol, vilket dessutom säger mer.
              Se `DESIGN.md` §3 "Metaraden är ny och kompenserar något konkret". */}
          <p className="truncate text-meta text-[var(--color-dim)] tabular-nums">
            {metarad.join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMeny((v) => !v)}
          aria-label={`Fler val för ${exercise?.name ?? 'övningen'}`}
          aria-expanded={meny}
          className="flex h-12 w-10 min-h-0 shrink-0 items-center justify-center text-[var(--color-dim)]"
        >
          <IkonPrickar className="size-5" />
        </button>
      </header>

      {meny && (
        <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)] px-3 pb-2">
          {/* 11A.5 — byt övning på två tryck. Historiken följer med automatiskt. */}
          <button
            type="button"
            onClick={() => {
              setMeny(false);
              onSwapExercise();
            }}
            className="min-h-0 rounded-md border border-[var(--color-line-strong)] px-3 py-1.5 text-sm"
          >
            Byt övning
          </button>
          {exercise && (
            <Link
              to={`/ovning/${exercise.id}`}
              className="min-h-0 rounded-md border border-[var(--color-line-strong)] px-3 py-1.5 text-sm"
            >
              Historik
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setMeny(false);
              onRemoveExercise();
            }}
            className="min-h-0 rounded-md border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-warn-text)]"
          >
            Ta bort övning
          </button>
        </div>
      )}

      {/*
        Kolumnrubriker EN gång, som i referensbilden. Det är detta som gör att
        cellerna får plats: de behöver inte upprepa "kg" och "×" på varje rad.
      */}
      <div
        className={`${SET_GRID} border-y border-[var(--color-line)] bg-[var(--color-bg)]/40 px-2 py-1`}
      >
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Set
        </span>
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Kg
        </span>
        <span className="text-center text-[0.65rem] tracking-wide text-[var(--color-dim)] uppercase">
          Reps
        </span>
        {/* Kolumnhuvudet, inte en knapp. `mx-auto` för att Tailwinds preflight
            gör svg till `display: block`, och då centrerar inte `text-center`. */}
        <span className="text-[var(--color-dim)]">
          <IkonBock className="mx-auto size-3" />
        </span>
      </div>

      {/* Namnet på listan gör två saker på en gång: en skärmläsare säger vilken
          övnings set den står i, och vakt 5 i 12.20 får ett fäste att avgränsa
          mot när passet innehåller flera övningar. Utan det träffar en sökning
          efter en setrad alla kort på skärmen. */}
      <ul aria-label={`Set för ${exercise?.name ?? 'okänd övning'}`}>
        {planned.sets.map((s, i) => {
          const workSetIndex = nummer[i] ?? null;
          return (
            <SetRow
              key={s.id}
              workSetIndex={workSetIndex}
              set={s}
              // Uppvärmningen har inget setnummer och därmed inget snitt att
              // slå upp — den jämförs inte med något.
              average={workSetIndex === null ? null : (snitt?.sets[workSetIndex] ?? null)}
              onOpenAdjust={() => setJusterar(s.id)}
              onConfirm={() => onConfirmSet(s.id)}
              onUnconfirm={() => onUnconfirmSet(s.id)}
            />
          );
        })}
      </ul>

      {/* Namnet bär övningen av samma skäl som listan ovanför gör det: med två
          kort på skärmen träffar "+ Lägg till set" annars båda. Etiketten är
          alltså inte bara för skärmläsare — den är det som gör knappen möjlig
          att adressera entydigt, i e2e och i verkligheten. */}
      <button
        type="button"
        onClick={onAddSet}
        aria-label={`Lägg till set för ${exercise?.name ?? 'okänd övning'}`}
        className="w-full border-t border-[var(--color-line)] py-2 text-sm text-[var(--color-dim)] active:bg-[var(--color-bg)]"
      >
        + Lägg till set
      </button>

      {aktivt && (
        <SetAdjustSheet
          exerciseName={exercise?.name ?? 'Övning'}
          /* ✏️ HÄR STOD `setNumber={planned.sets.findIndex(...) + 1}` — radens
             plats i LISTAN, alltså exakt den räkning `SetRow`:s docblock
             förbjuder. Arket får nu samma fras som raden, ur samma härledning:
             `nummer` är `workSetIndices(planned.sets)` och räknades redan på
             rad 70. Uppgift 12.49. */
          radnamn={radnamn(nummer[aktivtIndex] ?? null)}
          equipment={exercise?.equipment ?? null}
          weightKg={aktivt.weightKg}
          reps={aktivt.reps}
          isWarmup={aktivt.isWarmup}
          onChange={(patch) => onChangeSet(aktivt.id, patch)}
          onRemove={() => {
            onRemoveSet(aktivt.id);
            setJusterar(null);
          }}
          onClose={() => setJusterar(null)}
        />
      )}
    </section>
  );
}
