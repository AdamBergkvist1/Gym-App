import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router';
import { formatVolume } from '../../lib/steps';
import { muskelrad } from '../../lib/muskelgrupper';
import { passdatum } from '../../lib/passdatum';
import { db } from '../../db/db';
import { listTrainedExercises, listWorkoutSummaries, summarizeHistory } from '../../db/history';
import { IkonPilHöger } from '../icons';
import { SegmentedControl, type Segment } from '../SegmentedControl';

/**
 * Passhistorik och övningslista. Uppgift 9.1, formen från steg 4.3.
 *
 * Siffrorna står i centrum (SPEC). Datumet är underordnat volymen och
 * setantalet, eftersom det är de senare man jämför mellan pass.
 */

type Vy = 'pass' | 'statistik';

const SEGMENT: readonly Segment<Vy>[] = [
  { value: 'pass', label: 'Pass' },
  { value: 'statistik', label: 'Statistik' },
];

/**
 * Valet bor i URL:en och inte i `useState`.
 *
 * Tre skäl, och inget av dem är smak: bakåtknappen gör vad man tror, en
 * omladdning landar på samma segment, och Playwright kan mäta Statistikvyn utan
 * att först klicka sig dit — vilket är skillnaden mellan en vakt som går att
 * skriva och en som inte gör det.
 *
 * **En frågeparameter och inte en nästlad rutt**, eftersom `ui/nav.ts` är
 * flikarnas enda sanning och Statistik inte är en flik (`SPEC.md` §2b). En rutt
 * hade lagt en andra sanning bredvid den.
 */
const VY_PARAM = 'vy';

export function HistoryPage() {
  const [sökparametrar, sättSökparametrar] = useSearchParams();
  const vy: Vy = sökparametrar.get(VY_PARAM) === 'statistik' ? 'statistik' : 'pass';

  const workouts = useLiveQuery(() => listWorkoutSummaries(50), [], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const trained = useLiveQuery(() => listTrainedExercises(), [], []);
  // ⛔ **Egen fråga, inte `workouts.length`.** Listan ovan är kapad vid 50, och
  // en rubrik som räknar den slutar röra sig när historiken passerar taket.
  // Se `summarizeHistory`.
  const totaler = useLiveQuery(() => summarizeHistory(), [], null);

  // Hela raden, inte bara namnet: passkortets andra rad behöver `primaryMuscle`.
  const övningar = new Map(exercises.map((e) => [e.id, e]));
  const namn = (id: string) => övningar.get(id)?.name ?? 'Okänd';

  const väljVy = (ny: Vy) => {
    // `replace`: att växla segment är att titta på samma sida på ett annat sätt,
    // inte att navigera. Utan det bygger varje tryck en post i historiken, och
    // bakåtknappen blir en ångra-knapp för växlingar i stället för en väg ut.
    sättSökparametrar(ny === 'pass' ? {} : { [VY_PARAM]: ny }, { replace: true });
  };

  /**
   * ⚠️ **DEN HÄR ANROPAS, den renderas inte som `<Passvyn />`.** Skillnaden är
   * inte stilistisk: en komponent som deklareras inuti en annan får en ny
   * identitet vid varje rendering, och React monterar då om hela trädet under
   * den — listan tappar fokus och rullposition varje gång något ändras. Som
   * anropad funktion blir resultatet vanliga element i förälderns träd.
   */
  const passvyn = () => {
    if (workouts.length === 0) {
      return (
        <p className="text-body text-[var(--color-dim)]">
          Inga pass ännu. Logga ditt första under Pass.
        </p>
      );
    }

    return (
      <>
        {/* Namnet skiljer passlistan från övningslistan längre ner — båda är
            `ul` med `listitem`, och utan namn går de inte att hålla isär vare
            sig för en skärmläsare eller för vakt 4 i 12.20. */}
        <ul aria-label="Pass" className="space-y-2">
          {workouts.map((w) => {
            // ⚠️ **Övningar vi inte kan slå upp hoppas över i stället för att
            // gissas.** `exercises` är en egen `useLiveQuery` och är tom i
            // första renderingen — en gissad muskelgrupp hade då skrivit ut en
            // grupp passet inte innehöll, och sedan bytt till rätt utan att
            // någon såg det. Blir listan tom uteblir raden, vilket är samma
            // svar som för ett pass utan arbetsset.
            const muskler = muskelrad(
              w.workExercises.flatMap((ö) => {
                const övning = övningar.get(ö.exerciseId);
                return övning ? [{ muscle: övning.primaryMuscle, setCount: ö.setCount }] : [];
              })
            );

            // B4:s yta, samma som övningskortet: vit, 18 px radie, SKUGGA i
            // stället för ram. Separationen mot papperet är bara 1,19:1 —
            // `DESIGN.md` "Genomgående mönster". Ramen härstammar från det
            // mörka temat, där en skugga hade varit brus.
            return (
              <li
                key={w.workout.id}
                className="rounded-card bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{passdatum(w.workout.startedAt)}</span>
                  {/* Längden och `Pågår` delar plats för att de svarar på samma
                      fråga — hur länge höll passet på — och `durationMinutes`
                      är null i exakt de fall `endedAt` är det. Att grena på
                      null säger dessutom typerna vad vi vet. */}
                  {w.durationMinutes === null ? (
                    <span className="text-meta text-[var(--color-ok-text)]">Pågår</span>
                  ) : (
                    <span className="text-meta text-[var(--color-dim)] tabular-nums">
                      {w.durationMinutes} min
                    </span>
                  )}
                </div>

                {muskler !== null && <p className="text-meta mt-1 truncate">{muskler}</p>}

                {/* ⛔ **Tre tal ur EN mängd.** Alla tre kommer ur `arbetsset` i
                    `listWorkoutSummaries` — se doc-kommentaren på
                    `workExercises`. Räkna dem inte om här; det är vanan 12.42,
                    12.48 och 12.49 kom ur, tre gånger i rad.

                    Ett pass utan arbetsset visar en fras i stället för tre
                    nollor. §3.3: en nolla ser ut som ett resultat. */}
                <p className="text-meta mt-1 text-[var(--color-dim)] tabular-nums">
                  {w.setCount === 0
                    ? 'Inga arbetsset'
                    : `${w.setCount} set · ${formatVolume(w.totalVolumeKg)} kg · ${w.workExercises.length} övn`}
                </p>
              </li>
            );
          })}
        </ul>

        {trained.length > 0 && (
          <div>
            <h2 className="text-label mb-2 font-semibold tracking-wider text-[var(--color-dim)] uppercase">
              Övningar
            </h2>
            {/* ⚠️ **SAMMA FORMSPRÅK SOM PASSKORTEN OVAN, med flit.** Listan låg
                kvar i ramad form medan korten bytte till skugga, och två
                kortspråk på en skärm läser som att det ena är trasigt. Adam
                avgjorde 2026-08-28 att listan ligger kvar tills den blir en
                egen flik i steg 4.5 — den ska se ut som resten under tiden.

                Avdelarna INUTI kortet är dekorativa och behåller `--color-line`;
                det är kortets egen kant som ersatts av skuggan. */}
            <ul
              aria-label="Övningar"
              className="overflow-hidden rounded-card bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
            >
              {trained.map((t) => (
                <li
                  key={t.exerciseId}
                  className="border-b border-[var(--color-line)] last:border-b-0"
                >
                  <Link
                    to={`/ovning/${t.exerciseId}`}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span>{namn(t.exerciseId)}</span>
                    <span className="text-meta flex items-center gap-1 text-[var(--color-dim)] tabular-nums">
                      {t.setCount} set
                      <IkonPilHöger className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <section className="space-y-6">
      {/* Rubrik och sammanfattning på SAMMA rad. `DESIGN.md` "Genomgående
          mönster": *"Rubriken tar aldrig en egen rad för sig själv; skärmhöjd är
          dyrare än luft."* Samma form som `TodayPage`.

          Sammanfattningen uteblir när historiken är tom: `0 pass · 0 set` hade
          varit nollor där det inte finns något att sammanfatta, och §3.3 säger
          att en nolla ser ut som ett resultat. */}
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="font-semibold">Historik</h1>
        {totaler !== null && totaler.workoutCount > 0 && (
          <span className="text-meta text-[var(--color-dim)] tabular-nums">
            {totaler.workoutCount} pass · {totaler.workSetCount} set
          </span>
        )}
      </header>

      <SegmentedControl label="Vy" segments={SEGMENT} value={vy} onChange={väljVy} />

      {vy === 'statistik' ? <StatistikKommer /> : passvyn()}
    </section>
  );
}

/**
 * Statistiksegmentets innehåll tills steg 4.4 bygger det.
 *
 * ⛔ **DEN ÄR TOM MED FLIT, OCH DET ÄR ADAMS BESLUT 2026-08-28.** Frågan
 * ställdes med rekommendationen att vänta med hela kontrollen tills det fanns
 * något att växla till; han valde att bygga ändå, och **skälet han gav var
 * layouten** — inte innehållet.
 *
 * ⚠️ **Fyll den INTE med något "riktigt" för att den ska kännas mindre tom.**
 * 4.4 ligger i runda 2 och kräver en egen grillning; det som byggs här utan den
 * grillningen är precis det 4.4 får riva. Texten lovar bara två saker som redan
 * är avgjorda: volym per muskelgrupp (`12.3`) och den långa horisonten, som
 * `DESIGN.md` §3.2 kallar Statistiks bärande krav.
 */
function StatistikKommer() {
  return (
    <div className="py-8 text-center">
      <p className="text-body text-[var(--color-fg)]">Statistik byggs härnäst.</p>
      <p className="text-meta mx-auto mt-2 max-w-xs text-[var(--color-dim)]">
        Volym per muskelgrupp och styrkan över tid — med hela historiken bakom sig, inte bara
        de senaste månaderna.
      </p>
    </div>
  );
}
