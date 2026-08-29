# Att göra (Checklista)

Nedbrytning av `docs/PLAN.md`. Ordningen är inte godtycklig — se §6 i planen.

**Så här används listan:**

- En uppgift i taget. En commit per uppgift (`CLAUDE.md`, regel 3).
- **Grindar** (`🚧`) får inte passeras. De markerar punkter där nästa fas bygger på ett
  antagande som måste vara verifierat först.
- Varje uppgift har ett **Klart när**-villkor. Är det inte uppfyllt är uppgiften inte klar,
  oavsett hur mycket kod som skrivits.
- Ingen uppgift är klar förrän `npm run typecheck && npm test` går igenom.

---

## ✅ Avslutat — drift och kostnad

- [x] **A.1 Egressen kom aldrig från Gym-App. AVSLUTAD 2026-08-12.**
      Larmet 2026-08-09 var 5,02 av 5 GB på Free-planen, med enskilda dygn över 500 MB.
      **Mätt i Usage-vyn per projekt 2026-08-10:**

      | Projekt | Egress |
      | :--- | ---: |
      | `Gym-App` | 0,001 GB |
      | `news-signal-engine` | 5,39 GB |
      | **Organisationens totala** | **5,39 GB** |

      Free-planens kvoter räknas per organisation, inte per projekt — därför slog taket
      trots att Gym-App står för **en tusendel** av trafiken. Hypotesen om trasiga
      `lastPulledAt`-markörer är avskriven *som förklaring till egressen*; aritmetiken
      talade emot den från början (10 pass och 25 set är kilobyte, inte gigabyte).

      **Åtgärdat i NSE-repot, inte här.** Adam 2026-08-12: insamlaren drog onödigt mycket
      och drar mindre nu. Utredningen tillhör det repot. **Kvoten resetas 17 augusti 2026** —
      till dess är marginalen tunn, men ingenting i Gym-App behöver ändras för det.

      Markörerna lever vidare som **12.21** nedan — inte som kostnadsmisstanke, utan som
      en funktion vi aldrig bevisat fungerar.
---

## Fas 0 — Mätningar som blockerar design

Dessa kräver ingen kodbas och kan göras nu. De avgör hur fas 6 får byggas.

- [x] **0.1 Skapa testsidan för återkoppling.** `test/feedback-test.html` — ingen byggkedja,
      inga beroenden, vanlig HTML/JS. Fyra knappar med API-utfall under varje, plus en
      Ja/Nej-fråga per kanal (API:ets returvärde säger inte om telefonen faktiskt skakade)
      och en fördröjningsväljare (direkt / 5 s / 10 s) så att larmet kan testas med appen i
      bakgrunden — vilket är det scenario vilotimern körs i.
      Två filer utöver den planerade: `test/sw.js`, eftersom iOS saknar `new Notification()`
      och bara stöder `registration.showNotification()`, samt `test/make-icons.mjs` som
      genererar ikonerna så att PNG-filerna har en spårbar källa.
- [x] **0.2 Lägg till minimal `manifest.json` för testsidan.** Klar, med
      `apple-touch-icon.png` (180×180) och manifestikoner i 192/512 px, `display: standalone`
      och `viewport-fit=cover`. `test/vercel.json` gör att `/` serverar testsidan direkt.
- [x] **0.3 Publicera testsidan på en HTTPS-adress.** Publicerad på Vercel:
      `https://gym-app-gold-psi-81.vercel.app/`
- [x] **0.4–0.6 Mätningen utförd 2026-07-30.** iPhone, iOS 18.7, Safari 26.5.2, installerad
      PWA, tyst läge, 5 s fördröjning med appen i bakgrunden. Utfall: **notis ✅** (kom fram
      med systemets eget ljud och vibration), **visuell blink ❌** (endast förgrund),
      **vibration ❌** (`'vibrate' in navigator === false`), **ljud ❌** (`AudioContext`
      gick till `interrupted` i bakgrunden).
- [x] **0.7 Mätresultatet inskrivet i `docs/PLAN.md` §2.6** som tabell med observerat utfall.

🚧 **GRIND 1 — ÖPPNAD 2026-07-30.** Fas 6 får byggas.

- [x] ~~**0.8 Separat treminuterstest.**~~ **Ersatt 2026-07-31 på Adams begäran.**
      Han valde att inte bygga om testsidan utan att låta den riktiga vilotimern besvara
      frågan under användning: *"Vi tar den smällen om den kommer."*

      **Rimligt — men bara om smällen går att se.** Frågan (fryser iOS sidans JavaScript så
      att en tre minuter lång timer aldrig larmar i tid?) blir värdelös om svaret bara blir
      "jag tror den kom sent ibland". Därför är mätningen inbyggd i stället för borttagen:
      `src/timer/diagnostics.ts` loggar varje larm med hur många sekunder fel det gick, om
      appen var dold, och — viktigast — **om larmet utlöstes först när appen kom tillbaka i
      förgrunden**. Resultatet sammanfattas under Inställningar → Vilotimerns larm.

      Det farliga felläget är inte tystnad utan **försening**: kommer notisen i samma sekund
      som appen öppnas ser det ut att fungera. Kolumnen "på återkomst" finns för att fånga
      exakt det.
      **AVGJORD 2026-07-31.** Full analys i `PLAN.md` §2.6.1. Kort:

      Två larm på 180 s, appen stängd: `wasHidden: ja`, `firedOnResume: nej`, fel +11 s och
      +20 s. Adam fick ingen notis förrän han öppnade appen — båda gångerna, medan han
      aktivt väntade.

      **JavaScript körde alltså i bakgrunden** (det är vad `wasHidden: ja` med 11–20 s fel
      bevisar), men **iOS presenterade inte notisen förrän appen kom i förgrunden**.
      Timern fungerar; visningen håller operativsystemet inne.

      **Mätningen mätte fel sak** — den loggade när vi *anropade* `showNotification()`, inte
      när iOS *visade* den. I fas 0-testet med 5 s fördröjning sammanföll de två, så felet
      syntes inte. `firedOnResume` svarade därför `nej` på en fråga den inte mätte, och det
      var den mänskliga observationen som avgjorde. Värt att komma ihåg: när mätning och
      upplevelse säger emot varandra, kontrollera först att mätningen mäter rätt sak.

      **Följd:** Wake Lock är inte en bekvämlighet utan bärande. Vilan förutsätter att appen
      ligger framme med tänd skärm. Web Push byggs inte — den kräver nät i det ögonblick
      larmet ska gå, vilket är precis vad ett gym saknar.

---

## Fas 1 — Projektuppsättning

- [x] **1.1 Initiera Vite-projekt.** Scaffoldat **manuellt** i stället för
      `npm create vite@latest` — det kommandot erbjuder sig att tömma katalogen när den inte
      är tom, och `docs/` och `test/` låg redan där. Risken var inte värd bekvämligheten.
      Vite 7 + React 19 + TypeScript.
- [x] **1.2 Lägg till Tailwind CSS.** v4 via `@tailwindcss/vite`. Mörkt tema som enda tema,
      färgskala som CSS-variabler i `src/index.css`, plus globala regler för
      `env(safe-area-inset-*)`, `100dvh` och 48 px tryckytor.
- [x] **1.3 Konfigurera TypeScript strikt.** `strict`, `noUncheckedIndexedAccess`,
      `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`.
- [x] **1.4 Lägg till Vitest.** **`passWithNoTests` är medvetet AV** — annars hade en trasig
      testglob senare gett grön svit med noll tester, exakt det felläge projektet ska undvika.
      Därför skrevs `src/lib/id.ts` (klientgenererade UUID:n, grunden för idempotensen) med
      tester direkt. 3 tester, gröna.
- [x] **1.5 Lägg till ESLint.** Flat config, typescript-eslint. Prettier utelämnad: ingen
      formateringskonflikt finns ännu och en till konfigurationsfil utan problem att lösa är
      bara underhåll. Läggs till om formateringsdiffar börjar störa.
- [x] **1.6 Skapa `.env.example`** med `VITE_SUPABASE_URL` och
      `VITE_SUPABASE_PUBLISHABLE_KEY`. Inga värden. `.env` gitignorerad, med en utskriven
      varning om att allt med `VITE_`-prefix bakas in i det publika bygget.
- [x] **1.7 Mappstruktur** `src/{db,parser,sync,ui,timer,lib}` med en `index.ts` i varje som
      säger vilken fas som fyller den.

**Fas 1 verifierad:** `npm run typecheck`, `npm run lint`, `npm test` (3 gröna) och
`npm run build` (194 kB / 61 kB gzip) går alla igenom.

---

## Fas 2 — Supabase: schema och RLS

> **Uppgift 2.3–2.16: KLARA.** `supabase/migrations/0001_initial_schema.sql` kördes av Adam
> i Supabase SQL Editor 2026-07-31 utan fel. Projektet: `Gym-App`, eu-north-1, Postgres 17.6.
> Självkontrollblocket passerade, vilket bevisar att RLS är påslaget på alla sex tabeller,
> att var och en har minst en policy, och att katalogen har ≥30 övningar.

- [x] **2.1 Supabase-projekt skapat 2026-07-31.** `Gym-App`, ref `oyccchcleypfuyuqmueq`,
      region eu-north-1 (Stockholm), Postgres 17.6, status ACTIVE_HEALTHY. Data API på,
      auto-expose av, Auto-RLS på. Nycklarna finns bara hos Adam.

      **Avvikelse värd att notera:** projektet ligger i **samma organisation** som
      `news-signal-engine` (`qfqgeranbxnftnnlkcfo`), inte i en egen. Ingen åtgärd krävs — men
      konsekvensen är att prenumerationsplanen och Fair Use-restriktioner gäller
      *organisationen*, inte projektet. Slår signalmotorn i taket kan Gym-App bli begränsat
      med den. Båda är i dag försumbart små, så det är noterat, inte ett problem.
      (Kravet på *separata organisationer* i `PLAN.md` §4.5 gäller Groq och Gemini, där
      kvotkollisionen är dokumenterad och verklig — det står kvar.)
- [ ] **2.2 Supabase CLI — uppskjuten.** Adam kör migrationen i webb-editorn tills vidare,
      så CLI:t behövs inte än. Filerna ligger ändå i `supabase/migrations/` med
      migrationsnamn, så CLI:t kan ta över utan att något behöver flyttas.
      **Behövs senast i fas 8**, när Edge Functions ska deployas — det går inte från webben.
- [x] **2.3 Migration: `profiles`.** Tabell enligt planen §3.1 + trigger som skapar rad vid ny
      `auth.users`. **Klart när:** migrationen kör rent mot en tom databas.
- [x] **2.4 Migration: `exercises`.** Tabell enligt §3.1 inklusive `owner_id` nullable.
      **Klart när:** migrationen kör rent.
- [x] **2.5 Migration: `workouts`.** **Klart när:** migrationen kör rent.
- [x] **2.6 Migration: `logged_sets`.** Inklusive `user_id` denormaliserad och
      främmandenycklar. `effort` som **ett fält**: `effort_type` (`'rir'` / `'rpe'`) +
      `effort_value` — beslutat 2026-07-30, inte två separata kolumner.
      **Klart när:** migrationen kör rent.
- [x] **2.7 Migration: `sync_mutations` och `ai_parse_log`.**
      **Klart när:** migrationen kör rent.
- [x] **2.8 Migration: `updated_at`-trigger** på alla tabeller med det fältet.
      **Klart när:** en `update` bumpar `updated_at` utan att klienten skickar det.
- [x] **2.9 Migration: samtliga index enligt §3.2.**
      **Klart när:** `\di` visar alla fem indexgrupperna.
- [x] **2.10 Migration: aktivera RLS på alla tabeller.** Enbart `enable row level security`,
      inga policyer ännu. **Klart när:** ett `select` som anon returnerar noll rader.
- [x] **2.11 Migration: RLS-policyer för `workouts`.** Fyra separata policyer (SELECT/INSERT/
      UPDATE/DELETE) med `(select auth.uid()) = user_id`. **Klart när:** migrationen kör rent.
- [x] **2.12 Migration: RLS-policyer för `logged_sets`.** Fyra policyer. `WITH CHECK` på INSERT
      verifierar dessutom att `workout_id` pekar på ett pass som ägs av samma användare.
      **Klart när:** migrationen kör rent.
- [x] **2.13 Migration: RLS-policyer för `exercises`.** SELECT tillåter `owner_id is null OR
      owner_id = (select auth.uid())`. Skrivoperationer kräver `owner_id = (select
      auth.uid())`. **Klart när:** global katalograd går att läsa men inte ändra.
- [x] **2.14 Migration: RLS-policyer för `profiles`, `sync_mutations`, `ai_parse_log`.**
      **Klart när:** migrationen kör rent.
- [x] **2.15 Migration: funktionen `apply_mutations(batch jsonb)`.** `SECURITY INVOKER`. Hoppar
      över `mutation_id` som redan finns i `sync_mutations`. Allt i en transaktion.
      **Klart när:** samma batch körd två gånger ger samma radantal som en gång.
- [x] **2.16 Seed: global övningskatalog.** 30–50 vanliga övningar med `aliases` ifyllda
      (svenska + engelska + kortformer). `owner_id = null`. Genereras av Claude — beslutat
      2026-07-30. Aliasen är inte dekoration: de är det parsern i fas 4 matchar mot, så
      varje övning behöver både fullt namn, vardagligt kortnamn och engelsk motsvarighet.
      **Klart när:** `select count(*) from exercises where owner_id is null` ≥ 30, och varje
      rad har minst två alias.
- [x] **2.17 Negativt åtkomsttest — KÖRT 2026-07-31. `GODKÄNT: 11 av 11 kontroller.`**
      Två riktiga auth-användare, `scripts/rls-negative-test.mjs` mot rå REST. B fick noll
      rader vid läsning av A:s data, 403 vid försök att skriva en rad märkt med A:s
      `user_id`, och testdatan städades bort efteråt.
      (Skriptet har 11 kontroller, inte 10 som det stod här tidigare — min felräkning.)
- [x] **2.18 `get_advisors` i security-läge — KÖRD 2026-07-31.**
      **Rapporten kom INTE tillbaka ren.** Fyra varningar, alla av typen "SECURITY DEFINER-
      funktion körbar av anon/authenticated". Rotorsak: **Postgres ger EXECUTE på nya
      funktioner till PUBLIC by default.** I 0001 revokerades detta för `apply_mutations`
      men inte för `handle_new_user`, `set_updated_at` eller `jsonb_to_text_array`.
      Praktisk risk låg (triggerfunktioner går inte att anropa via RPC), men åtgärdad ändå.
      Se 2.19.
- [x] **2.19 `0002_revoke_function_execute.sql` KÖRD 2026-07-31.** Verifierat direkt mot
      databasen efteråt: `handle_new_user` och `set_updated_at` har nu bara
      `postgres=X/postgres`, och `jsonb_to_text_array` behöll `authenticated=X/postgres`
      precis som den måste. `rls_auto_enable` orörd, som avsett.

🚧 **GRIND 2 — PASSERAD 2026-07-31.** Fas 5 och 7 får röra databasen.

**Bevisen:** 2.17 kört med två riktiga användare, 11 av 11 kontroller godkända.
2.18 kört. 2.19 kört och verifierat mot `pg_proc`. Samtliga 20 policyer lästa direkt ur
`pg_policies` — alla scopade `to authenticated` med `(select auth.uid())`-formen, ingen
`using (true)` någonstans.

- [x] ~~**2.20 Slå på Leaked Password Protection.**~~ **Struken 2026-07-31.** Adams
      observation: inställningen finns inte på Free Tier. Beslut: vi lever med det, eftersom
      han är ende användaren och väljer sitt eget lösenord. Att inställningen skulle vara
      betalfunktion är hans iakttagelse i gränssnittet, inte något jag verifierat.
      **Advisorn kommer fortsätta rapportera varningen** — det är förväntat, inte ett
      förbisett fel. Ompröva om appen någon gång får fler användare.

**Kvarvarande advisorvarning, medvetet obehandlad:** `rls_auto_enable` × 2. Den är Supabases
egen funktion, returnerar `event_trigger` och går inte att anropa via RPC — en falsk positiv.
Att revokera på plattformsägda objekt riskerar att gå sönder vid nästa uppdatering utan att
vinna något.

---

## Fas 3 — PWA-skalet

- [x] **3.1 `vite-plugin-pwa` med `registerType: 'prompt'`.** Produktionsbygget genererar
      `dist/sw.js` med **9 precachade poster, inga dubbletter**.

      Två val i workbox-konfigurationen som är värda att veta om:
      **Ingen `runtimeCaching`.** Supabase-anrop får aldrig cachas av servicearbetaren —
      synken (fas 7) äger sin egen köhantering, och en cachad databasrespons skulle visa
      gammal data som om den vore färsk.
      **Ikonansvaret är uppdelat** (plugin-et tar manifestikonerna, `includeAssets` tar
      apple-touch-icon, och png saknas i `globPatterns`). Med båda vägarna hamnade varje
      ikon två gånger i precache-manifestet. Det gick bra så länge revisionerna var
      identiska — men två poster för samma URL med olika revision får workbox att faila vid
      install, och då startar appen inte offline alls.
- [x] **3.2 Manifestet.** Genereras av plugin-et. `display: standalone`, `orientation:
      portrait`, `lang: sv`, mörk tema- och bakgrundsfärg, ikoner i 192/512 px plus en
      **maskable**-variant där motivet skalats till 62 % så att det överlever Androids och
      iOS beskärning. Ikonerna genereras av `scripts/make-app-icons.mjs`, så PNG-filerna i
      repot har en spårbar källa.
- [x] **3.3 `viewport-fit=cover` + safe-area.** Metataggen i `index.html`, och
      `env(safe-area-inset-bottom)` som padding på **bottennavigeringen** i stället för på
      `body`. Med padding på body hade en remsa bakgrundsfärg lagt sig utanför navigeringen;
      nu blöder den ut till skärmkanten medan innehållet lyfts ovanför hemindikatorn.
- [x] **3.4 `100dvh`** på `html`, `body` och `#root`.
- [x] **3.5 `navigator.storage.persist()`** anropas vid appstart, och utfallet syns under
      **Inställningar**: läge, detalj, använt utrymme och uppskattat tak. Nekas beständig
      lagring visas en uppmaning att installera appen — det är inget att gömma, eftersom iOS
      annars kan rensa osynkade pass efter sju dagar.
- [x] **3.6 Uppdateringsnotisen.** Diskret rad i botten med *Uppdatera* / *Senare*, ingen
      blockerande dialog.

      **Kravet "får inte byta app mitt i ett pass" är löst strukturellt, inte med logik:**
      `registerType: 'prompt'` gör att en ny servicearbetare **aldrig** aktiveras utan ett
      knapptryck. Det finns därför ingen kodväg där appen byts ut mitt i ett pass, och inget
      passtillstånd att hålla reda på. Vill vi senare *dölja* notisen under ett pågående
      pass är det en kosmetisk förbättring i fas 5, inte en säkerhetsåtgärd.
- [x] **3.7 Offlinestart VERIFIERAD på enhet 2026-07-31.** iPhone, installerad på hemskärmen,
      flygplansläge: appen startar, bottennavigeringen och innehållet renderar.
      iOS visar en systemruta om att dataåtkomst saknas — det är väntat och inte ett fel:
      servicearbetaren gör en uppdateringskoll vid start, och iOS kommenterar varje
      nätförsök i flygplansläge. Att appen ändå renderade är beviset för att precachen bar
      den.

**Utöver uppgiftslistan:** routing med `react-router` (tre rutter: Pass, Historik,
Inställningar) och ett appskal med bottennavigering — tummen når botten, varje flik är 64 px
hög. Rutterna har medvetet **inga loaders**: data kommer från Dexie via `useLiveQuery`
(fas 5), inte från navigeringen. Det är därför navigering fungerar identiskt med och utan nät.

**Fas 3 verifierad:** typecheck, lint och 59 tester gröna. Bygge: 237 kB JS / 76 kB gzip.

---

## Fas 4 — Den lokala parsern (testdriven)

**KLAR 2026-07-31.** Ordningen hölls: testerna committades i `361dd9a` medan modulerna inte
fanns och sviten var röd; implementationen i nästa commit. Röd→grön-övergången syns i
historiken och går att granska i efterhand.

- [x] **4.1 Typerna.** `src/parser/types.ts`. Inga `any`.
- [x] **4.2–4.3 Normalisering.** `normalizeName` speglar databasens genererade kolumn
      (`lower(btrim(name))`) exakt. Kontraktet är utskrivet som testfall, eftersom en
      glidning där tyst gör att parsern slutar hitta övningar som finns — utan felmeddelande.
      `normalizeInput` är generösare: kollapsar blanksteg, gör `*` och `×` till `x`, och
      decimalkomma till punkt **bara mellan siffror**. Ett generellt komma→punkt hade
      förstört varenda anteckning.
- [x] **4.4–4.5 Övningsmatchning.** Exakt → prefix → felstavning (Levenshtein ≤ 1). Två
      kandidater med samma poäng ger `null`, aldrig ett val. `hantel` matchar därför varken
      Hantelcurl eller Hantelpress.
- [x] **4.6 Testkorpus.** Alla 16 raderna ur `PLAN.md` §4.3, en `it()` per rad.
- [x] **4.7 Avvisning.** Alla 6 raderna, var och en med sitt eget skäl i `UnresolvedReason`.
- [x] **4.8 Enhetsregeln.** Enhet gissas aldrig. Utan utskriven enhet används profilens, och
      `unitSource` gör skillnaden mellan *faktum* och *tolkning* synlig för UI:t.
- [x] **4.9 Konfidens.** Låg konfidens utan utskriven enhet när vikten ≤ 30 eller reps > 30.
      Skriver användaren ut enheten har hen själv löst tvetydigheten — då frågar vi inte.
- [x] **4.10 Implementationen.** 56 tester gröna på första körningen.
- [x] **4.11 Fuzz.** 1000 slumpade indata från en deterministisk PRNG (seedad, så ett
      misslyckande går att återskapa) plus 15 extremfall. Parsern kastar aldrig — ett
      undantag där blir en vit skärm mitt i ett pass.
- [x] **4.12 Täckning.** `src/parser/`: **91,3 % grenäckning**, 99 % satser. Kravet var 90 %.
      `parse.ts` 94,8 %, `matchExercise.ts` 82,5 % (oträffat: en tidig utgång i
      Levenshtein-funktionen). Siffran inkluderar tomma platshållarfiler på 0 % — de är
      medvetet inte bortfiltrerade, så den verkliga täckningen på logiken är högre.

**Fas 4 verifierad:** 59 tester gröna, `npm run typecheck` och `npm run lint` rena.

- [x] **4.13 GRAMMATIKEN TRIMMAD FÖR GYM-SLANG. Klar 2026-08-01.** Hela korpusen grön:
      `80x7 bänk`, `90kg 5r bänkpress`, `100 kg 3 reps knäböj`, `3x8 bänk 60`,
      `bänk 90x5x3` (tre set), `bänk 90x5 85x5` (två set).

      **Grammatiken skrevs om, inte lappades.** Den gamla var ETT regex förankrat i båda
      ändar — det fungerade så länge inmatningen såg ut som `bänk 90x5`, men ett ankrat
      mönster förutsätter en fast ordning och kunde därför aldrig hantera att övningsnamnet
      flyttar sig. Ersatt av en tokeniserare (`tokenize.ts`) plus formtolkning (`shapes.ts`).

      **Nyckelinsikten: formen läses ur HUR talen satt ihop, inte ur deras storlek.**
      En magnitudregel ("det största talet är vikten") ser klok ut och går sönder direkt på
      `20x30x2` — där är 30 störst men är repsen. Kopplingen mellan talen (`x`, blanksteg,
      eller text emellan) är entydig där magnituden gissar:
      `90x5x3` är en x-kedja → vikt × reps × set. `3x8 bänk 60` har övningsnamnet emellan →
      set × reps, sedan vikt. `90x5 85x5` är två x-par skilda av blanksteg → två set.

      **Regeln som inte luckrades upp:** `20x30` och `5x5` ger fortfarande låg konfidens och
      ber om bekräftelse — det finns egna regressionsvakter för båda. Samtliga sex
      avvisningsfall från 4.7 avvisas fortfarande.

      **En medveten specändring:** `bänk 90x5x3` flyttades från avvisningslistan till de
      positiva fallen. Den ersattes där av `90x5x3x2`, som inte är någon känd form.

      **Nya vakter:** högst 10 set per rad, heltalskrav på både reps och antal set, och
      `hint` på varje avvisning så att skälet går att visa för användaren i stället för att
      bara loggas.

      **Verifierat:** 83 parsertester, **91,8 % grenäckning** på `src/parser/` (kravet är 90).
      UI:t loggar nu alla set från en rad i ordning — och rättar man siffrorna i
      bekräftelserutan gäller rättelsen hela raden, medan orörda fält behåller varje sets
      egna värden, så att `90x5 85x5` inte kollapsar till två likadana set.

🚧 **GRIND 3 — ÖPPNAD 2026-07-31.** UI får anropa parsern.

---

## Fas 5 — Lokalt datalager och loggning

- [x] **5.1 Dexie-schemat.** `src/db/db.ts`, fem stores.

      **Rättelse mot `PLAN.md` §2.4:** planen listade `isDeleted` som index på `workouts`.
      Det går inte. IndexedDB accepterar bara number, string, Date, binärdata och arrayer
      som nycklar — **booleaner är inte giltiga nycklar**. Raderade rader filtreras i minnet
      i stället, vilket är gratis i den här storleksordningen. Hade det byggts som planerat
      hade indexet blivit tyst trasigt.
- [x] **5.2 `startWorkout()` / `endWorkout()`.** Klientgenererade UUID:n. Startar aldrig ett
      andra pass när ett redan är aktivt, och behandlar en inaktuell markör som "inget
      aktivt pass" i stället för att krascha.
- [x] **5.3 `logSet()`.** Skriver till `loggedSets` **och** `outbox` i en Dexie-transaktion.
      Testat att båda skrivs — och att **ingendera** skrivs vid ogiltig indata.
      `setIndex` räknas per övning inom passet, så att "set 2 av bänkpress" stämmer även
      när övningarna varvas.
- [x] **5.4 `getLastPerformance()`.** Använder det sammansatta indexet
      `[exerciseId+performedAt]`. Hoppar över raderade och uppvärmningsset, och kan utesluta
      det pågående passet — SPEC säger "förra passet", och siffrorna från passet man står i
      är inte spökdata, de står redan på skärmen.
- [x] **5.5 Vyn "Aktivt pass".** `useLiveQuery` genom hela vyn: skrivningen går till
      IndexedDB och listan uppdaterar sig själv. Ingen laddningsindikator i den kritiska
      vägen, eftersom ingen läsning går till nätet.
- [x] **5.6 Setinmatning med spökdata.** Förra passets siffror som **platshållare**, inte
      förifyllda värden. Skillnaden är avsiktlig: ett förifyllt fält som användaren inte rör
      blir loggat som om det vore inmatat. `inputMode="decimal"` respektive `"numeric"`,
      tryckytor ≥ 48 px.
- [x] **5.7 Tyst framgång.** Diskret grön ton på den nya raden i 1,2 s. Ingen dialog, inget
      som blockerar skärmen.
- [x] **5.8 Fritextfältet mot parsern.** Hög konfidens loggas direkt. Låg konfidens visar ett
      redigerbart utkast med förklaringen varför. Miss visar skälet på svenska **och behåller
      texten** — den får aldrig försvinna bara för att vi inte förstod den.
- [x] **5.9 "Skapa ny övning" från en parsermiss.** Parsern lämnar nu tillbaka
      `attemptedName` som **eget fält** — att plocka namnet ur prosahinten hade fungerat
      tills någon skrev om formuleringen. Vid `unknown_exercise` visas en knapp; övningen
      skapas med namnet som sitt eget alias så att parsern hittar den direkt, texten ligger
      kvar i fältet, och nästa tryck på Logga fungerar. Två tryck totalt, som specificerat.
      `createExercise` är idempotent på normaliserat namn och köar mot `exercises`-grenen
      i utkorgen.
- [x] **5.10 Loggningsvägen VERIFIERAD offline på enhet 2026-07-31.** Pass startat och flera
      set loggade via fritext i flygplansläge. `Bänk 90x5` gick rakt igenom, `Bänk 5x5`
      skapade utkast, spökdatan syntes, och både det pågående passet och all data överlevde
      att appen stängdes helt.

**Utöver uppgiftslistan:** `src/db/catalog.ts` — den globala katalogen inbakad i bygget
(45 övningar då, 46 efter 13.2), med **databasens riktiga id:n**. Hade klienten seedat med
egna id:n hade synken i fas 7 sett dem som nya rader och skapat en dubblett per övning. Katalogen är transkriberad för hand och verifieras
av `catalog.test.ts` mot md5-kontrollsummor tagna ur Supabase — ändras katalogen i en framtida
migration ska summorna uppdateras i samma commit, annars går testet sönder, vilket är precis
vad det ska göra.

**Fas 5 verifierad:** 81 tester gröna (22 nya mot en riktig IndexedDB via `fake-indexeddb`),
typecheck och lint rena.

---

## Fas 6 — Vilotimern

Kräver att **grind 1** är passerad. Bygg kanalerna i den ordning mätningen i fas 0 visade
fungerar — men nivå 1 byggs alltid, oavsett utfall.

- [x] **6.1 Timern lagras som sluttidpunkt.** `restTimer` i `meta` med `endsAt` som enda
      sanning; allt annat härleds. Testat att kvarvarande tid blir rätt även om alla
      intervall strypts i två minuter — med en nedräknande räknare hade siffran varit fel,
      och felet hade växt med tiden.
- [x] **6.2 Timern startar automatiskt när ett set loggas**, både via fritext och manuellt.
      Ett loggat set betyder att man just börjat vila, så det kräver ingen handling.
- [x] **6.3 Nedräkningen renderas.** Intervallet finns bara för att trigga omritning —
      värdet läses alltid från klockan. Plus en förloppsindikator, +30/−30 s och hoppa över.
- [x] **6.4 Visuellt larm.** Hela panelen byter till grön yta vid noll. Kräver inga
      behörigheter och kan inte tas ifrån oss av en iOS-uppdatering — därför är det grunden
      och inte tillägget.
- [x] **6.5 Wake Lock.** Begärs vid timerstart och **återbegärs vid `visibilitychange`** —
      låset släpps av webbläsaren så fort appen tappar fokus, så ett enda anrop räcker inte.
      Nekas det (t.ex. vid lågt batteri) loggas det i konsolen i stället för att sväljas.
- [x] **6.6 Lokal notis i bakgrunden.** `registration.showNotification()` via
      servicearbetaren — **inte Web Push**, som kräver nät i det ögonblick larmet ska gå.
      Behörighet begärs vid en explicit användargest under Inställningar. Notis visas **bara**
      när `document.hidden` är sant; ligger appen framme räcker det visuella larmet.

      **Byggd trots att 0.8 inte var utförd.** Adam vaskade prerekvisitet 2026-07-31 med
      motiveringen att den riktiga timern får bli testet — och utan notisen finns ingenting
      att testa. Mätningen är därför inbyggd, se 0.8.

**Fas 6 verifierad:** 13 nya tester (116 totalt), typecheck och lint gröna. Beteendet i
bakgrunden på riktig hårdvara är **inte** verifierat — det är själva mätningen som pågår.
- [x] ~~**6.7 Vibration.**~~ **Struken 2026-07-30.** `'vibrate' in navigator === false` på
      iOS 18.7. Notisen ger ändå vibration — via systemet, inte via oss.
- [x] ~~**6.8 Ljudlarm via Web Audio.**~~ **Struken 2026-07-30.** `AudioContext` går till
      `interrupted` när appen bakgrundas; ljud kan aldrig bära larmet. Notisen ger systemets
      eget ljud.
- [ ] **6.9 Justerbar vilotid.** Per övning, sparad i `meta`.
      **Klart när:** vald tid används vid nästa set av samma övning.

---

## Fas 7 — Synk

- [x] **7.1 Supabase-klienten.** `getSupabase()` returnerar **null** när miljövariablerna
      saknas. Det är inte ett fel — saknad konfiguration betyder "synk avstängd", inte
      "appen trasig". Endast publishable-nyckeln finns i klienten.
- [x] **7.2 Inloggning (e-post + lösenord).** Ligger under Inställningar och ingen annanstans.
- [x] **7.3 Utgången token blockerar inte loggningen — och kan inte göra det.**
      Loggningsvägen rör aldrig `getSupabase()` eller sessionen. Det är inte en kontroll som
      kan glömmas bort utan en följd av att beroendet inte finns: `TodayPage` importerar
      `db/repo`, aldrig `sync/`. En utgången token påverkar exakt en sak — att kön inte töms.
- [x] **7.4 Utkorgens läsare.** FIFO på `seq`, batchar om 50. Testat att passet kommer före
      sina set, vilket `apply_mutations` kräver.
- [x] **7.5 Sändaren mot `apply_mutations`.** Skickar `mutation_id` per post, raderar posterna
      först när servern kvitterat.
- [x] **7.6 Felhantering.**

      **Övergående** (nätfel, `PGRST301` utgången JWT): posterna ligger kvar orörda, inget
      felläge visas. Att kön växer offline är precis vad appen är byggd för.

      **Permanent** (t.ex. främmandenyckelbrott): posten markeras `failed` med felmeddelandet
      och **kön STOPPAS**. Två saker här är medvetna och viktiga:
      dels **hoppas en misslyckad post aldrig över** — posterna efter kan bero på den, och en
      kö som fortsätter förbi ett fel skapar hål i molndatan som ingen upptäcker;
      dels **isoleras den trasiga posten** genom att batchen körs om en post i taget. Utan det
      vet man bara att "en av 50 rader är fel", vilket inte går att felsöka.
- [x] **7.7 Synkindikatorn.** Kompakt i skalet, fullständig under Inställningar. Felläget är
      det enda som får färg och kräver åtgärd — plus en knapp för att försöka igen.
- [x] **7.8 Hämtningen.** Markör per tabell i `meta`, `updated_at > markör`. Markören flyttas
      **inte** när ingenting hämtades: en tom sida får inte råka hoppa förbi rader som kommer
      in en millisekund senare.
- [x] **7.9 Lokalt vinner.** En hämtad rad med väntande utkorgspost skrivs aldrig över.
      Testat med en serverrad som påstår sig vara nyare och raderad — den lokala raden står
      kvar orörd.
- [x] **7.10 Mjuk radering.** Byggd redan i fas 5; `deleteSet` sätter `isDeleted` och köar.
- [x] **7.11 Idempotensen testad.** Poster som skickas två gånger (som vid ett tappat svar)
      ger `applied: 0, skipped: 2` och noll dubbletter — samma kvittensmekanik som
      `sync_mutations` i `apply_mutations`.

**Fas 7 verifierad:** 16 nya synktester mot fejkade klienter, 103 totalt. Typecheck, lint
och bygge gröna.

- [x] **7.12 Synken VERIFIERAD mot riktig Supabase 2026-07-31.** Adam la in miljövariablerna,
      loggade set i flygplansläge och såg raderna dyka upp när nätet kom tillbaka.

      **Bekräftat direkt mot databasen:** 2 pass, 6 set, 9 kvitton i `sync_mutations`, en
      användare, inga dubbletter. Alla 6 set har `source = 'local_parse'` — parsern skrev
      dem hela vägen från fritext till Postgres. Kontraktet mot `apply_mutations` håller,
      inte bara logiken mot fejkade klienter.
- [ ] **7.13 Överväg att lata-ladda `@supabase/supabase-js`.** **Mätt 2026-07-31:**
      huvudbundlen växte från **237 kB till 575 kB** när klienten lades till — mer än en
      fördubbling. Biblioteket behövs bara för synk, aldrig i loggningsvägen, så det borde
      inte ligga i det som precachas för att appen ska starta offline.
      Kräver att `getSupabase()` blir asynkron, vilket rippplar genom push, pull, engine och
      auth. **Mät först om det märks** på en riktig telefon innan refaktoreringen görs — 575 kB
      över ett hemnät är något helt annat än över 3G.

---

## Fas 8 — LLM-reserven

> ### ⚠️ DENNA FAS SKA BYGGAS. Den är uppskjuten, inte struken.
>
> Bekräftat av Adam 2026-07-31. **Målet är en sömlös AI-coach-känsla** — att man skriver som
> man tänker och att appen förstår, utan att någonsin behöva anpassa sig till en syntax.
>
> Den lokala grammatiken (fas 4, trimmad i 4.13) kommer aldrig ensam dit. Den är **golvet**
> som gör att appen fungerar i en gymkällare utan nät — inte taket.
>
> **Varför den väntar på fas 9 och inget annat:** en LLM som bara ser den inmatade texten kan
> *tolka* den. En LLM som också ser träningshistoriken kan *resonera* om den — veta att 90 kg
> är tungt just för Adam, förstå vad "samma som förra gången" betyder, och reagera när ett
> inmatat värde är orimligt mot historiken. Det är skillnaden mellan en parser och en coach,
> och den kräver att historiken finns först.
>
> Ordningen är alltså inte en nedprioritering utan en förutsättning. När fas 9 är klar finns
> inget kvar som motiverar att vänta.

- [x] **8.0 Kontraktet utökat med historik. Klart 2026-08-01.** `src/ai/context.ts`.
      Modellen får: hela övningskatalogen (id, namn, alias), **senaste utförandet** per
      övning, **typiskt viktspann** (min/median/max och medianreps över de 20 senaste seten),
      **bästa e1RM**, och **det pågående passets set**.

      Det är detta som gör skillnaden mellan en parser och en coach: "samma som förra
      gången" har något att syfta på, "en till" vet vad som just loggades, och ett värde
      som avviker kraftigt från det typiska går att känna igen.

      **Payloaden är medvetet begränsad** — hela katalogen (den behövs för att kunna välja
      ett giltigt id) men historik bara för de **12 senast tränade** övningarna. Ett eget
      test vaktar att payloaden håller sig under 20 000 tecken även med full historik: den
      går i varje anrop, och växer den okontrollerat blir varje fritextmiss dyrare och
      långsammare utan att någon märker det.
      **11 tester.**
> **8.1, 8.2 och deployen kräver Adam — koden är klar och väntar.**
>
> ```
> supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
> supabase functions deploy ai-parse
> ```
>
> CLI:t behövs nu (uppgift 2.2) — Edge Functions går inte att deploya från webbeditorn.

- [ ] **8.1 Skapa Groq-nyckel i EGEN organisation**, skild från `news-signal-engine`.
      Signalmotorn har en dokumenterad incident där ett testanrop tömde dygnskvoten och slog
      ut 22 % av en handelsdags signaler. Delas kontot kan en fritextmiss på gymmet tysta
      produktionssignaler — eller tvärtom.
      **Klart när:** nyckeln är satt som secret i Supabase, inte i repot.
- [ ] **8.2 Skapa Gemini-nyckel, likaså separat.**
      **Klart när:** nyckeln är satt som secret i Supabase.

> ### 🟡 8.1 och 8.2 är UPPSKJUTNA med flit — 2026-08-03
>
> **Mätt läge:** `ai_parse_log` visar att endast **groq** (`llama-3.3-70b-versatile`) någonsin
> kört, senast 2026-08-02. Gemini har aldrig svarat, alltså är nyckeln inte satt. Groq-nyckeln
> är enligt Adam **samma som `news-signal-engine`**.
>
> **Två följder, båda accepterade tills vidare:**
> 1. **Reserven finns inte.** `parseWithLLM` faller vidare till Gemini när Groq fallerar —
>    men utan nyckel finns inget att falla till. Tar Groqs kvot slut dör AI-vägen helt.
> 2. **Kvoten delas åt båda hållen.** En fritextmiss på gymmet kan tysta handelssignaler,
>    och en tung handelsdag kan döda AI:n mitt i ett pass.
>
> **Varför det ändå är okej nu:** AI-vägen träder bara in när den lokala grammatiken sagt
> ifrån, och har körts **en (1) gång**. Användningen är i praktiken noll. Risken skalar med
> användningen, inte med tiden.
>
> **Detta är alltså ett beslut, inte en försummelse.** Bocka INTE av uppgifterna och föreslå
> inte "fixen" igen förrän villkoret nedan är uppfyllt.
>
> ⏰ **Villkor för att göra det:** när AI-vägen används mer än någon enstaka gång per pass,
> eller innan någon annan än Adam börjar använda appen.
>
> **Detalj som är lätt att missa när det görs:** Groqs kvot ligger på **kontot**, inte på
> nyckeln. En andra nyckel i samma konto delar samma kvot — det måste vara ett separat konto.
- [x] **8.3 JSON-schemat definierat.** `src/ai/types.ts` är sanningen; Edge Function-koden
      speglar det i egen Deno-kod. De **kan inte** dela modul över nätverksgränsen — Deno
      kräver filändelser i importer, Vite gör det inte — och en fragil delningslösning vore
      sämre än fyrtio duplicerade rader. Båda filerna har en kommentar om att ändringar ska
      ske i samma commit.
- [x] **8.4 Edge Function `ai-parse` skriven.** `supabase/functions/ai-parse/`.
      Klienten byggs med **anroparens token**, aldrig med den hemliga nyckeln.
      `verify_jwt = false` i `config.toml`; auktoriseringen sker i funktionen, eftersom
      plattformens kontroll inte förstår de nya publishable-nycklarna.

      Fyra säkerhetsgränser, utskrivna i filhuvudet: **LLM-nycklarna finns bara där** som
      miljövariabler; **anonyma anrop avvisas** (annars vore funktionen en gratis LLM-proxy
      för vem som helst med URL:en); **funktionen skriver ingenting till databasen** — den
      tolkar och svarar, klienten validerar och skriver, så att en bugg i funktionen i
      värsta fall ger ett dåligt förslag och aldrig korrupt data; och **`user_id` finns inte
      i kontraktet**, så modellen får aldrig ett fält som avgör vem datan tillhör.
- [x] **8.5–8.7 Leverantörsgränssnittet.** `parseWithLLM` med en implementation per
      leverantör, ordningen styrd av `AI_PROVIDER_ORDER`. **Groq primär** för latensen —
      svarstiden är den avgörande egenskapen mitt i ett pass. **Gemini reserv** med egen
      kvot, så att ett kvottak hos den ena inte tar ner fritextinmatningen helt.
      Ett permanent fel hos Groq (t.ex. saknad nyckel) faller ändå vidare till Gemini —
      annars vore reserven värdelös just i det fall den behövs mest.
- [x] **8.8 Timeout och degradering.** 3,5 s i funktionen, 4 s i klienten. **Aldrig ett tomt
      lyckat svar** — varken funktionen eller klienten kan returnera "det gick bra men blev
      inget". Vid fel blir det ett `unresolved` med ett skäl på svenska, och UI:t faller
      tillbaka på manuell inmatning.
- [x] **8.9 Validering av modellens utdata.** `src/ai/validate.ts`, **11 tester**.

      **Modellen är aldrig auktoritet.** Den föreslår; valideringen avgör vad som får bli
      data. Det farligaste felläget är ett **påhittat övnings-id** som ser ut som ett UUID:
      utan kontrollen mot katalogen hade setet skrivits mot en övning som inte finns, och
      främmandenyckeln hade fällt hela synkbatchen långt senare — med ett felmeddelande
      långt från orsaken.

      Övrigt som avvisas: orimlig vikt eller reps, svar som inte är objekt, och tomma svar
      (som blir `unresolved`, aldrig tyst framgång). Ett trasigt set avvisas ensamt, inte
      hela svaret. **Förvalet är LÅG konfidens** — har modellen härlett något ur historiken
      ska människan bekräfta.
- [x] **8.10 Telemetrin skriven. Klar 2026-08-01.** `src/db/parseLog.ts` + Dexie v2.
      En rad per fritextinmatning, för **både** `local` och `llm`.

      **Går via utkorgen som all annan data**, inte direkt till PostgREST. De flesta
      inmatningar sker i en gymkällare — en telemetrirad som bara skrevs online hade
      systematiskt missat exakt de fall som är intressantast att mäta.

      **Kräver migration 0003**, som lägger till `ai_parse_log`-grenen i `apply_mutations`.
      Utan den avvisas mutationen med "okänd tabell" och **hela utkorgen fastnar** — kön
      stannar ju vid permanenta fel, med flit. Migrationen måste köras innan en klient med
      8.10 används.
- [x] **8.11 Utfallet fångas i UI:t.** `accepted` = sparat orört. `edited` = användaren
      rättade först, **och vad det blev sparas** — utan det rättade värdet går felen att
      räkna men inte att analysera. `rejected` = förslaget ledde aldrig till ett set.

      **Förvalet är `rejected`.** En rad som aldrig ledde till ett sparat set är inte
      accepterad, och att anta motsatsen hade gjort statistiken systematiskt för snäll.
      En mätning som smickrar sig själv är värdelös.

      Resultatet visas under **Inställningar → Fritextparsningens träffsäkerhet**, med
      lokal grammatik och AI-reserv **åtskilda** så att de går att jämföra. Panelen säger
      uttryckligen ifrån under fem försök i stället för att visa en procentsats — fyra av
      fyra är 100 %, och en siffra som ser ut som ett resultat men inte är det är värre än
      ingen siffra alls.
      **11 tester.**

---

## Fas 9 — Historik och progression

- [x] **9.1 Passhistoriken.** Datum (med "I dag" / "I går"), setantal, totalvolym och
      passlängd. Pågående pass märks ut. Raderade set räknas inte in i volymen.
- [x] **9.2 Övningsvyn** på `/ovning/:id`, nåbar från historikens övningslista. Alla set över
      tid med datum, vikt, reps och e1RM per rad.
- [x] **9.3 e1RM enligt Epley** som ren funktion med 8 tester.

      Två beslut i funktionen: **ett singel returnerar sin egen vikt** i stället för att
      räknas upp av formeln, och **e1RM returnerar `null` över 15 reps** i stället för en
      siffra. Ett e1RM räknat på 25 reps ser ut som data men är brus, och brus i en
      progressionsgraf är värre än en lucka — det senare syns, det förra inte.
- [x] **9.4 PB-vyn.** **Tyngsta set och bästa e1RM visas som två SKILDA rekord**, eftersom de
      inte är samma sak: 90×3 är tyngre på stången, men 80×8 är den starkare prestationen
      (e1RM 101,3 mot 99,0). Att slå ihop dem hade dolt exakt den insikt e1RM finns för att
      ge. Uppvärmningsset räknas aldrig som rekord.
- [x] **9.5 SVG-sparkline för e1RM.** Handritad, inget bibliotek — Recharts och uPlot är
      hundratals kB för en vy, och bundlen är redan stor. Hanterar en helt platt serie utan
      division med noll, och säger ifrån vid färre än två mätpunkter i stället för att rita
      en tom ruta.

**Fas 9 verifierad:** 21 nya tester (137 totalt), typecheck, lint och bygge gröna.

---

## Fas 10 — Deploy

> ### 🚩 Rättad 2026-08-03 — fasen var redan gjord, men bokförd som ogjord
>
> Adam frågade "är inte appen redan på Vercel?" Svaret var ja, och `TASKS.md` hade fel.
> **10.1 och 10.2 var klara sedan tidigare** utan att någonsin bockas av. En plan som
> påstår att gjort arbete är ogjort är inte bara slarv — den skulle fått nästa session
> att bygga om något som redan fungerade.
>
> **Produktionsadress: https://adam-gym-app.vercel.app**
>
> ⚠️ **Det finns TVÅ Vercel-projekt mot samma repo, och bara det ena är rätt.**
> Se 10.5 nedan. Repots `homepageUrl` på GitHub pekar på **fel** projekt.

- [x] **10.1 Koppla repot till Vercel.** Verifierat: 30 deployments, senaste från commit
      `deab028` som pushades idag. Push till `main` bygger automatiskt.
- [x] **10.2 Sätt miljövariabler i hostingen.** Verifierat indirekt men entydigt: produktions-
      appen visar synkstatus **"Inte inloggad"**, medan en lokal körning utan `.env` visar
      **"Endast lokalt"** och loggar *"Supabase är inte konfigurerat"*. Nycklarna finns alltså
      i produktion. (Ingen `.env` finns lokalt — därför kör dev-servern utan Supabase.)
- [ ] **10.3 Installera appen på Adams telefon från produktions-URL:en.**
      **Använd `https://adam-gym-app.vercel.app`** — inte den adress som står som homepage på
      GitHub, den serverar fel sida. **Klart när:** appen ligger på hemskärmen.
- [ ] **10.5 Städa upp de dubbla Vercel-projekten.** Två projekt bygger från samma repo:
      - `adam-gym-app` → **rätt.** Serverar appen. Stabil adress `adam-gym-app.vercel.app`.
      - `gym-app` → **fel.** Serverar `test/feedback-test.html` från fas 0 i stället för
        appen, alltså larmtestsidan. Adressen `gym-app-gold-psi-81.vercel.app` står dessutom
        som repots homepage på GitHub.

      **Varför det inte är kosmetiskt:** installerar Adam PWA:n från homepage-länken hamnar
      **larmtestet** på hemskärmen, inte appen — och det ser ut som att appen är trasig.
      Två produktionsadresser för samma repo betyder också två servicearbetare och två
      separata IndexedDB-lagringar; loggar man i fel flik hamnar passet i en databas man
      sedan inte hittar. Det är samma sorts tysta fel som 11A.10.

      **Klart när:** `gym-app`-projektet är borttaget eller ombyggt mot rätt utdata, och
      repots homepage pekar på `adam-gym-app.vercel.app`.
- [ ] **10.4 Kör ett helt riktigt pass i gymmet.** Utan nät.
      **Klart när:** passet är loggat och synkat efteråt, och erfarenheterna står i `HANDOFF.md`.

---

## Fas 11 — Gränssnittet: touch-först, sedan polering

**Fasen är delad i två efter Adams invändning 2026-08-01.** Del A är strukturell och
sannolikt viktigare för hur appen upplevs än allt annat som återstår. Del B är den
polering som ursprungligen planerades. **Del A först.**

---

### 11A — Det touch-baserade gränssnittet (STRUKTURELLT)

> **Detta är inte polering.** Fullständigt resonemang i `PLAN.md` §8.1b.
>
> Som appen ser ut i dag är fritexten hjälten och manuell inmatning ligger hopfälld bakom
> en länk, med en rå `<select>` av 45 övningar. Det är tvärtemot hur Strong och Hevy
> fungerar — där sker uppskattningsvis **90 % av loggningen genom att trycka och bekräfta**,
> särskilt när man bygger vidare på ett tidigare pass.
>
> **Vi ska inte uppfinna hjulet.** Underlaget i `docs/research/` har redan kartlagt vad
> konkurrenterna gör rätt. Kopiera medvetet.

- [x] **11A.1 "Kopiera förra passet".** Finns både på startskärmen (utan pågående pass) och
      inne i ett tomt pass. Laddar in samma övningar och set med gamla siffror som spökdata.
- [x] **11A.2 Setraden som primärt element.** Övningskort med rader som bockas av. Varje rad
      är förifylld från förra gången, och **antalet rader kommer också från historiken** —
      gjorde du fyra set förra passet dyker fyra rader upp. Ett tryck på ✓ loggar setet och
      startar vilan.

      **Ett mellanled behövdes:** planerade set som syns innan de loggas.
      `src/db/plan.ts` ligger i Dexie (den måste överleva att appen stängs mitt i ett pass)
      men **synkas aldrig** — den är arbetsyta, inte data. Bara avbockade set hamnar i
      `loggedSets` och i utkorgen. Ett eget test vaktar att planen inte skapar utkorgsposter.
- [x] **11A.3 Stegare i stället för tangentbord.** ±2,5 kg och ±1 rep, 48 px tryckytor.
      Tryck på siffran ger numeriskt tangentbord för stora hopp.

      **Stegen snappar INTE till rutnätet:** 91 + 2,5 blir 93,5, inte 92,5. Prydligare hade
      det varit att avrunda, men 91 kg står där för att någon valde det. Att tyst flytta ett
      värde användaren skrivit in är den sortens hjälpsamhet som gör att man slutar lita på
      loggen.
- [x] **11A.4 Övningsväljare.** Fullskärm, sökfält högst upp, **senast använda överst**,
      därefter grupperat per muskelgrupp. Sökningen matchar både namn och alias.
- [x] **11A.5 Byt övning på två tryck.** ⋯-menyn på kortet → Byt övning → välj. Den nya
      övningens historik följer med automatiskt, eftersom spökdatan hämtas vid tillägget.
- [x] **11A.6 Mallar via "kopiera förra passet".** Uppflyttad från backlog och löst utan att
      införa `routines`-tabellerna — källan är helt enkelt ett tidigare pass. Enklare, och
      det täcker det Adam faktiskt beskrev. `routines` kan fortfarande läggas till senare om
      namngivna mallar visar sig behövas.
- [x] **11A.7 Fritexten är nu en genväg.** Ligger kvar i toppen men hopfälld bakom en rad,
      så att passets struktur får plats. Fungerar exakt som förut när den fälls ut.

**Fas 11A verifierad:** 29 nya tester (224 totalt), typecheck, lint och bygge gröna.
Kvar att verifiera på enhet: att ett upprepat pass verkligen går att logga utan tangentbord.

🚩 **Acceptanskriterium för hela 11A (justerat 2026-08-01):** ett normalt upprepat pass
ska gå att logga **utan att tangentbordet öppnas en enda gång**. Hevy är måttstock, inte
lagkrav — tydlighet och funktion går före tryckantal.

---

### 11B — Designrundan

Efterfrågad av Adam 2026-07-31 efter att ha använt appen på riktigt: den fungerar men är
"basic och rätt ful". Det är väntat — UI:t har byggts råt med flit. Men det ska vara ett
beslut, inte något som glöms bort, och det ska göras **samlat**. Görs det styckvis blir
resultatet ojämnt, och ojämnt är värre än rått.

Fullständigt resonemang inklusive vad fasen INTE ska omfatta: `PLAN.md` §8.
Referens enligt SPEC: RP Hypertrophy för datafokus, Jeff Nippard och Boostcamp för estetik.

**Ligger efter 11A med flit.** Att polera ett gränssnitt som ska struktureras om är
bortkastat arbete — och designspråket ska sättas av den slutliga formen, inte av den
nuvarande.

---

> ### ⚠️ Omstrukturerad 2026-08-03 — och det är en korrigering, inte ett tillägg
>
> Adam frågade om designen redan var färdig, och om det skulle bli **en riktig designrunda
> där allt bestäms för alla funktioner** — eller bara putsning. Frågan avslöjade ett fel i
> hur fasen var skriven.
>
> **11B var nio isolerade putsuppgifter.** Typografisk skala, `tabular-nums`, vertikal rytm,
> tryckåterkoppling… Det är en checklista, inte en designrunda. Och fasen varnar i sin egen
> ingress för att styckvis arbete blir ojämnt — samtidigt som den var upplagd för att göras
> just styckvis. Nio separata beslut fattade var för sig **är** styckvis, oavsett att de står
> under samma rubrik.
>
> **Fixen:** en ny uppgift **11B.0** där hela appen designas i ett svep, innan en rad kod
> skrivs. Därefter blir 11B.1–11B.9 **implementation av den briefen** i stället för nio egna
> beslut. Först då stämmer fasen med sin egen ingress.
>
> **Adams andra invändning hörde inte hemma i polering:** att en träningsapp "brukar ha flera
> sidor och massa funktioner". Appen har fyra rutter i dag. Om informationsarkitekturen ska
> växa är det ett **`SPEC.md`-beslut som måste tas före designbriefen** — inte något som
> upptäcks halvvägs in i den. Det är uppgift 11B.0a, och den kommer först av allt.

> ### ⚠️ LÄGET 2026-08-12, läs detta innan uppgiftstexterna nedan
>
> **Fas 11B är inte ostartad. Den är påbörjad och delvis implementerad**, och texterna nedan
> var skrivna som om ingenting fanns. Det kostade en halv grillningssession att upptäcka.
>
> Vad som faktiskt finns: `SPEC.md` §2b (informationsarkitektur, godkänd 2026-08-03),
> `docs/DESIGN.md` (702 rader: färgsystem, typografi, skärmskisser för alla fyra flikarna),
> nio referensbilder i `docs/Reference-pics/`, och två commits av implementationen —
> `cfb2ca2` (tokens + datadriven navigation) och `6d70223` (setraden + justeringsarket).
>
> **Vad grillningen 2026-08-12 ändrade:** temat vändes från mörkt till **ljust som förval**
> (`SPEC.md` §4), vilket öppnar `DESIGN.md` §0.5 och §1 på nytt. §2 och all kod överlever.

- [x] **11B.0a Informationsarkitekturen. KLAR — `SPEC.md` §2b, godkänd 2026-08-03,
      omprövad och bekräftad oförändrad 2026-08-12.**
      Fyra flikar: Pass, Historik (segmenten Pass och Statistik), Övningar, Mer. Program är
      startval i Pass, inte egen flik. `/ovning/:id` är detaljvy, inte flik.

      **Statistiksegmentets innehåll avgjordes 2026-08-12** och står i `SPEC.md` §2b: set per
      muskelgrupp och vecka med undertränade grupper synliga, volymkurva (reps × vikt) med
      justerbart tidsfönster, samt e1RM-trend och personbästa. Det var den sista skärmen vars
      innehåll ingen bestämt.

      **Kvar i koden, inte i beslutet:** `src/ui/nav.ts` har tre flikar, inte fyra. Övningar
      och Mer är obyggda och ligger som steg 5 och 6 i `DESIGN.md`.

- [x] **11B.0b Designbriefen — `docs/DESIGN.md`. STÄNGD 2026-08-19, se rutan om slutvillkoret.**
      Alla skärmar samtidigt, inklusive bottenark, timer och övningsväljaren.

      **Steg 1, 2 och 4 nedan är gjorda** (referenser ligger i `docs/Reference-pics/`, briefen
      är skriven). **Steg 3 är delvis ogiltigförklarat** av temabytet 2026-08-12: färgtokens är
      mätta mot svart bakgrund och måste göras om mot ljus. Typografi, spacing och radier
      överlever.

      ⚠️ **STEG 3 VAR BREDARE BESKRIVET ÄN DET ÄR. Rättat 2026-08-14.**
      Formuleringen ovan säger *"färgtokens"* utan avgränsning, vilket lät som att hela
      färgsystemet skulle göras om. **Karaktärstokens är redan omgjorda mot ljus botten** —
      papper, kort, fg, dim, line, line-strong och accent avgjordes i 11B.0d senare samma dag
      och står uppmätta i `DESIGN.md` §0.5. Det som faktiskt återstod var **semantiken**
      (`ok`, `warn`, `err`, `pb`), och den var inte bara omätt utan **felaktigt bokförd som
      klar** — §0.5 påstod att den *"står kvar oförändrad från §1"*.

      ✅ **MÄTNINGEN ÄR GJORD 2026-08-14. Se `DESIGN.md` §1b.** Tre fynd, alla uppmätta:
      1. De mörka värdena mäter **1,29–1,77:1** mot papperet. `--color-warn-text` hamnar på
         1,29:1 och är i praktiken osynligt. Omskrivning, inte justering.
      2. **§1:s regel "färgad text använder ALLTID steg 11" går inte att följa.** Radix ljusa
         steg 11 är konstruerat för 4,5:1 mot **vitt**; vårt papper är mörkare och äter
         marginalen. Alla tre landar på 3,88–4,39:1. Stegregeln ersätts av ett kontrastmål.
      3. **Tonade ytor (steg 3) mäter 1,04–1,09:1 mot papperet** — mindre separation än ett
         vitt kort har (1,188:1). En semantisk yta måste därför **alltid ligga på ett kort**,
         aldrig direkt på bakgrunden.

      Mätskriptet kontrollerades mot briefens egna publicerade tal innan det användes på nya
      värden (kort/papper 1,188:1, dim 4,57:1, accent 8,08:1 — alla tre stämde).

      ✅ **VÄG C VALD AV ADAM 2026-08-14. STEG 3 ÄR STÄNGT.** Betydelsen bärs av **yta och
      kant**, texten är nästan svart. Tokenblocket ligger färdigt i `DESIGN.md` §1b.

      **Valet ändrade kraven, vilket mättes efteråt och är fynd 4.** Under de andra vägarna
      bar texten betydelsen och kanten var dekorativ. Under C är kanten det som identifierar
      rutan, och då gäller WCAG 1.4.11: **3:1 mot kortet.** Radix steg 8 klarar det inte för
      någon roll (2,20–2,40:1), så kanterna flyttades till steg 10 och 11.

      ⚠️ **Klargult kan inte bära betydelse mot vitt.** Amber steg 8, 9 och 10 mäter
      1,58–2,20:1. Det finns **exakt ett** användbart värde, steg 11 `#ab6400` (4,61:1), och
      det är mörk ockra. Kulören lever därför i **ytan** `#fff7c2`, inte i kanten. Följd:
      `warn` får aldrig en fylld yta med vit glyf — vitt på `#ffc53d` är 1,58:1.

      ⚠️ **Mockupen visade först fel i C-kolumnen** (gul stapel `#ffc53d`, 1,58:1). Den dög
      för att jämföra vägar men inte som beslutad token. Rättad i samma commit, med felet
      utskrivet i filen — ett beslutsunderlag som tyst korrigeras är inte längre ett underlag.

      ✅ **ALLA FYRA STEG ÄR KLARA 2026-08-14 (kväll). Kvar: bara Adams godkännande.**
      Steg 3:s två delar stängdes samma dag — färgen genom väg C, ikonerna genom **11B.0c**.
      Steg 1:s rest, referenserna Luna och Ellie, är hämtad och **läst**: tio App Store-bilder
      i `docs/Reference-pics/`, med anteckningar i `DESIGN.md` §0.5.

      **Uppgiftens eget slutvillkor är *"`docs/DESIGN.md` finns och Adam har godkänt den"*.**
      Filen finns. Godkännandet saknas, och det är inte något jag kan kryssa i åt honom —
      därför står rutan öppen trots att allt arbete är gjort. **Det enda som återstår av hela
      11B:s förarbete är att Adam läser briefen och säger ja.**

      ⚠️ **Vad referenssteget inte kunde leverera.** `SPEC.md` §4 bad om Ellie för *"färg, form
      och **rörelse**"*. App Store-bilder är stillbilder — **rörelsen är inte inhämtad**, och
      11B.5 har alltså inget referensstöd. Källan för den delen är Raroques YouTube-spellistor,
      där han bygger båda apparna på kamera. Utbrutet som en egen rest snarare än dolt i ett
      ✅: se noten i `DESIGN.md` §0.5.

      Arbetsordningen är hämtad från Chris Raroques flöde och står i
      `ai-workbench/tools/`: **referenser → prototyp → implementation.**
      1. ✅ **KLART 2026-08-14.** Referenser i `docs/Reference-pics/` — nio bilder (Hevy,
         MacroFactor, Strava, Apple Watch, Lifesum) plus **tio nya: Ellie och Luna** (Raroque,
         App Store, `Ellie iOS 1–5.jpg` och `Luna iOS 1–5.jpg`). Anteckningarna om **vad och
         varför** står i `DESIGN.md` §0.5 och §3 — det var kravet, inte att filerna finns.
      2. ✅ Skissa varje skärm mot referenserna — `DESIGN.md` §3.
      3. ✅ Fastställ **tokens**: färg ✅ (omgjord mot ljus botten 2026-08-14, `DESIGN.md`
         §0.5 + §1b), typografi ✅, spacing ✅, radier ✅,
         **ikonuppsättning ✅ (11B.0c stängd 2026-08-14).**
      4. ✅ Skriv `DESIGN.md` med tokens plus en skiss per skärm.

      **Varför referensdrivet och inte fritt:** `11A.12` byggdes från referensbilder efter
      att mina två egna försök klipptes av på mobilskärm. Referensversionen håller. Det är
      inte en tillfällighet — en referens bär beslut någon redan testat mot riktiga
      användare, och den informationen finns inte i en beskrivning.

      **Adams krav 2026-08-11, och det skärper punkt 1:** *"vill även ta inspo för design
      från nätet och vad som finns så det inte ser AI-gjort och alltför stereotypiskt ut"*.

      Det är inte en smakfråga utan ett acceptanskriterium, och det pekar ut vad steg 1 ska
      leta efter. En modell som ombeds designa fritt återger medelvärdet av allt den sett:
      lila gradient, glasmorfism, jämnt rundade kort, ett `emoji`-ikonspråk. Motmedlet är
      inte att be om "något unikt" — det är att låta konkreta referenser fatta besluten, och
      att skriva ner **vad** i varje referens som ska tas efter och varför. En referensmapp
      utan anteckningar är bara bilder.

      Minst en referens ska ligga **utanför** träningsappsgenren, så att briefen inte bara
      medelvärdar Boostcamp och Hevy. Kandidater värda att titta på: Mobbins arkiv, men
      också dagböcker, kassaappar och kollektivtrafiksappar — allt som visar täta sifferrader
      på liten skärm.

      **Klart när:** `docs/DESIGN.md` finns och Adam har godkänt den.

      > ### ⏰ 2026-08-18: briefen är omskriven efter grillningen inför steg 4. Godkännandet kvarstår
      >
      > `HANDOFF.md` rekommenderade en grillning **före** steg 4, eftersom det är projektets
      > största kodändring och 11B redan visat sig vara halvbyggt en gång. Den kördes, och den
      > välte mer än väntat — se `SPEC.md` §2 och `DESIGN.md` §3.1.
      >
      > **Ordningen som avtalades med Adam i grillningens första runda:** grilla → briefen
      > rättas → **Adam läser och säger ja** → först därefter kod. Att godkänna en brief som
      > höll på att ändras hade varit att godkänna ingenting.
      >
      > Briefen är nu rättad. **Det som återstår av hela 11B:s förarbete är fortfarande bara
      > Adams ja** — men det är nu ett ja till ett annat dokument än det han hade läst före
      > 2026-08-18.

      > ### ✅ SLUTVILLKORET OMFORMULERAT 2026-08-19. 11B.0b är därmed stängd
      >
      > Adam, ombedd att läsa och godkänna: *"DESIGN.md är typ 1300 rader lång väl. Den orkar
      > jag nog inte läsa, litar på dig."*
      >
      > **Han har rätt, och kravet var fel ställt från början.** Briefens egen §0.2 slår fast
      > att *"valet står mellan färdiga alternativ som bedöms på synintryck, inte mellan
      > hexkoder i en textfil"* — och att Adam inte är designer och inte ska behöva vara det.
      > Ett slutvillkor som kräver att han läser 1300 rader teknisk text **motsäger briefens
      > egen metod.** Det begär dessutom fel sorts omdöme: han kan avgöra om något ser bra ut,
      > inte om ett kontrastvärde är rätt uppmätt.
      >
      > **Vad som FAKTISKT är godkänt, och det är det mesta.** Varje bärande val i briefen är
      > redan hans, taget mot körbara alternativ: ljust tema (2026-08-12), färgriktningen Bläck
      > (11B.0d), semantikens väg C (11B.0b steg 3), formen B4 (2026-08-12), ikonpaketet Tabler
      > (11B.0c). Allt som tillkom 2026-08-18 godkände han **fråga för fråga genom sex
      > grillningsrundor**. Det är ett starkare godkännande än en genomögning hade gett.
      >
      > ⚠️ **Vad som INTE är godkänt, och som inte får bokföras som det:**
      >
      > | Kvarstår | Var det avgörs |
      > |---|---|
      > | Ljusa temat sett på en **riktig telefonskärm** — färgerna är uppmätta, aldrig upplevda | Efter 4.1, före 4.2. Adam tittar en gång och säger ja eller nej |
      > | **Pass-skärmens layout** — fritextens plats och snittkolumnens synlighet | 11B.0g, som körbara mockuper |
      >
      > **Klart när (ersätter raden ovan):** `docs/DESIGN.md` finns, dess bärande val är valda
      > av Adam mot körbara alternativ, och det som återstår att bedöma på synintryck är
      > utbrutet till 11B.0g och telefonkontrollen efter 4.1. ✅ Uppfyllt 2026-08-19.

      **Att göra först:** en grillning, på Adams begäran samma dag — *"där behövs en stor
      grill me tror jag"*. Den ska köras före steg 1, inte efter, eftersom den avgör vad
      referenserna ska leta efter. 11B.0a (informationsarkitekturen) hör till samma
      grillning: att veta om det finns en femte flik är en förutsättning för att kunna skissa
      navigationen.

- [x] **11B.0c Ikonuppsättning ersätter emoji. Ny 2026-08-12. KLAR 2026-08-14.**
      `DESIGN.md` §3 undantog uttryckligen ikoner: *"Vi använder unicode och emoji i dag."*
      Det står i direkt konflikt med förbudslistan i §0.3, och konflikten är Adams beslut att
      lösa åt ikonernas fördel.

      **Åtta förekomster, mätta och inte antagna. Notera att de INTE har samma öde** — den
      första ersätts inte av en ikon utan tas bort helt:

      ⚠️ **Rubriken sa "sju" fram till 2026-08-14.** Rätt antal är åtta; `⌨` i
      `TodayPage.tsx:268` saknades i tabellen nedan. Det var 12.28, nu stängd.

      ✅ **ALLA ÅTTA ÄR ÅTGÄRDADE 2026-08-26.** Den sista, 🏋, raderades med hela ikonrutan när
      B4:s accentbricka byggdes i steg 4.2 del B — som raden nedan sa att den skulle. `src/`
      innehåller inte längre någon emoji som ikon. Uppmätt kontrast för 🏋 innan den gick:
      **1,82:1** — den var dessutom det sista kontrastfelet på skärmen utöver timerchipet.

      | Fil | Vad | Vad som ska hända |
      |---|---|---|
      | `src/ui/ExerciseCard.tsx:66` | **🏋** i övningens ikonruta | ⛔ **RADERAS I STEG 4**, inte här. Hela `<span>`-rutan går bort och ersätts av accentbrickan (10 × 34 px, ingen symbol). **Leta inte efter en skivstångsikon.** Uttryckligen undantagen från 0c:s slutvillkor |
      | `src/ui/ExerciseCard.tsx:83` | `⋯` menyknappen | → ikon ur paketet. **Tillagd 2026-08-12** — den saknades i listan, som därför sa sex |
      | `src/ui/SetRow.tsx:136` | `✓` bekräfta-knapp | → ikon ur paketet |
      | `src/ui/ExerciseCard.tsx:140` | `✓` | → ikon ur paketet |
      | `src/ui/SetAdjustSheet.tsx:224` | `✓` uppvärmningsset | → ikon ur paketet |
      | `src/ui/pages/ExercisePage.tsx:58` | `←` tillbaka | → ikon ur paketet |
      | `src/ui/pages/HistoryPage.tsx:89` | `→` | → ikon ur paketet |

      **Om 🏋 särskilt.** Samma tecken används i dag för **varje** övning oavsett vad den är,
      vilket är symtomet på att ingen någonsin löst frågan "vilken ikon har en lårcurl". B4
      gör frågan onödig i stället för att svara på den. Emojin försvinner alltså helt ur appen,
      men den blir inte en ikon — den blir en färgad stapel utan symbol.

      `✓`, `←` och `→` är teckensnittsglyfer, inte emoji, men de ärver textens tjocklek och ser
      tillfälliga ut bredvid riktiga ikoner. De fem ersätts av SVG-ikoner.

      **Full lista på vad paketet behöver täcka (~10):** fyra flikikoner (Pass, Historik,
      Övningar, Mer), bock, plus, tillbakapil, menypunkter, klocka för timern, och eventuellt
      tangentbord för fritextgenvägen. Alla finns redan tecknade som egna SVG:er i mockuperna
      under `docs/mockups/`, så formen är prövad.

      ⚠️ **Flikikonerna är nytt arbete, inte ett emoji-byte. Mätt 2026-08-12.**
      `AppShell.tsx:63` renderar i dag bara `tab.label` som **text** — flikraden har inga ikoner
      alls att ersätta. Dessutom har `nav.ts` **tre** flikar (Pass, Historik, **Inställningar**),
      inte fyra: Övningar och Mer byggs först i steg 4.5 och 4.6. Att kopiera in fyra flikikoner
      här är alltså att förbereda steg 4, medan **själva inkopplingen hör till steg 4** och inte
      till 0c. Det som gör 0c klar är ikonfilerna, registerposten och att de sju glyferna ovan är
      borta.

      **Tre licensklarade kandidater, kontrollerade 2026-08-12 enligt §7.2:**

      | | Lucide | Tabler Icons | Phosphor |
      |---|---|---|---|
      | Licens | **ISC** (+MIT för Feather-ärvda) | **MIT** | **MIT** |
      | Stjärnor | 23 914 | 21 349 | 361 (se not) |
      | Senaste push | 2026-08-11 | 2026-08-10 | 2026-01-06 |
      | Transitiva beroenden | 0 | 0 | 0 |
      | Storlek | ~0,3–0,6 kB per kopierad SVG | dito | dito |

      **Om Lucides `NOASSERTION`:** GitHubs API rapporterar det, vilket enligt §7.2b skulle
      betyda "fråga Adam". Licensfilen lästes i stället: den innehåller **två** licenser, ISC
      för Lucides egna och MIT för Feather-ärvda ikoner. Båda fria att kopiera mot att
      upphovsrättsraden följer med. `NOASSERTION` betyder bara att detektorn inte klarar två
      licenser i en fil. **Ingen av de tre är blockerad.**

      **Noten om Phosphor:** 361 stjärnor gäller tillgångsrepot `phosphor-icons/core`, inte
      organisationens huvudsida, och är inte jämförbart. Underhållet är däremot mätbart svalare.

      **UPPGIFTEN KRYMPTE 2026-08-12 när formen valdes.** B4 ersätter ikonrutan med en
      accentbricka, alltså en fylld stapel utan symbol i. Det betyder att **ingen
      övningsspecifik ikonuppsättning behövs** — och det var den svåra delen, den som aldrig
      lösts (🏋 användes för samtliga övningar oavsett vad de var).

      **Kvar att ersätta: omkring tio ikoner totalt.** Navigeringens fyra flikar, bocken, plus,
      tillbakapil och menypunkterna. Alla mockuper från 11B.0d använder egna minimala SVG:er för
      just dessa, så formen är redan prövad och det som återstår är att välja ett paket med
      konsekvent linjetjocklek.

      **Valet görs nu när karaktären är vald.** Bläck med Fraunces är återhållsam och seriffen
      bär värmen, vilket talar för ett rakt, jämntjockt linjesnitt som inte konkurrerar med
      rubrikerna. Lucide och Tabler är båda sådana; Phosphor har mer karaktär men underhålls
      svalare.

      **Beslutsunderlag byggt 2026-08-12: `docs/mockups/11b-ikoner.html`.** Samma tio ikoner ur
      Lucide och Tabler, i 11B.0d:s valda design, med Fraunces **inbäddad i filen** — den
      renderar alltså likadant offline och om fem år, till skillnad från de fem tidigare
      mockuperna som hämtar typsnittet över nätet.

      ### ✅ Tabler valt av Adam 2026-08-12. Nio ikoner i `src/ui/icons.tsx`

      Nio `d`-strängar kopierade som JSX med MIT-raden i filhuvudet, noll nya beroenden.
      **Sex av de sju glyferna är borta.** Kvar: 🏋 i `ExerciseCard.tsx:66`, som inte kan
      raderas förrän B4:s accentbricka finns — den hör till steg 4, inte hit.

      **Två fynd ur mätning:**
      1. **Lucide har ingen `history`-ikon**, kontrollerat mot repots trees-API. Spelar inte
         längre roll för valet, men står kvar för att slippa utreda igen.
      2. **"Tabler ritar tyngre" var fel och är rättat.** Påståendet byggde på filstorlek.
         Uppmätt linjelängd vid identisk `stroke-width` ger Tabler **441 enheter mot Lucides
         470** — 6 % *mindre* linje. Se `docs/EXTERNT.md`.

      **Grindarna är körda. Uppdaterat 2026-08-14 (kväll).** Varningen som stod här sa att de
      *inte* var körda, eftersom maskinen saknade Node. Det gäller inte längre: hela sviten
      kördes på hemmadatorn efter sista kodändringen — typecheck ren, lint **0 fel** (3 kända
      `react-refresh`-varningar i `icons.tsx`), **274** tester i 22 filer, build **651,59 KiB**
      precache, e2e **60 passed** på 1,3 min. Handkontrollen som ersatte grindarna gissade rätt:
      inga komponenttester finns, och båda e2e-specarna väljer på roll och tillgängligt namn —
      inte på `✓`, `←`, `→` eller `⋯`.

      **Klart när:** de ikoner vi faktiskt använder är kopierade med ursprung och licens i
      kommentar överst, raden finns i `docs/EXTERNT.md`, och **noll emoji återstår i `src/ui/`
      med ett uttryckligt undantag: 🏋 i `ExerciseCard.tsx:66`.** **Noll nya poster i
      `package.json`.**

      ⚠️ **Om undantaget — omskrivet 2026-08-14 (kväll), och det är en ändring av ett
      slutvillkor, inte bokföring.** Villkoret sa tidigare "noll emoji återstår i `src/ui/`"
      utan undantag, vilket gjorde 0c omöjlig att kryssa i trots att allt arbete som hör till
      0c var gjort. 🏋 kan inte ersättas av en ikon, för den ska **inte** bli en ikon: hela
      `<span>`-rutan raderas när B4:s accentbricka byggs. Att låta 0c stå öppen i väntan på
      steg 4 hade gjort slutvillkoret till en beskrivning av steg 4 i stället för av 0c.
      **Ansvaret för 🏋 flyttas därför till steg 4** och står i tabellen ovan. Adam godkände
      omskrivningen 2026-08-14.

      **Två rättelser i samma svep, båda mätta:**
      1. Villkoret sa *"kopierade som SVG-filer"*. Det är de inte — de nio `d`-strängarna
         ligger som JSX i `src/ui/icons.tsx`. Skälet står i filhuvudet: separata `.svg`-filer
         som React-komponenter kräver `vite-plugin-svgr`, och 0c förbjuder nya poster i
         `package.json`. Ordet "filer" struket; kravet på ursprung och licens står kvar.
      2. `package.json` är **orörd sedan `26e4181`**, alltså långt före ikonarbetet. Kontrollerat
         i git-historiken, inte antaget.

- [x] **11B.0d Välj den ljusa karaktärsriktningen. Ny 2026-08-12. KLAR 2026-08-12.**
      Ersätter det val som gjordes 2026-08-05, då lime valdes mellan tre **mörka** alternativ.

      **Metoden behålls för att den fungerade** — körbara mockuper jämförda på synintryck slår
      hexkoder i en textfil. **Två steg**, beslutade i grillningen, för att karaktär och layout
      inte ska bedömas i samma svep:

      1. **Tre karaktärsriktningar på identisk layout.** Varierar färg, radier och typografi.
         Skärmen är Pass mitt i ett set, samma innehåll i alla tre.
      2. **Två layoutförslag i den vunna karaktären.** Adam 2026-08-12: *"tycker ändå inte den
         är så snyggt strukturerad nu"* — layouten är alltså inte låst till dagens.

      **Varför två steg och inte ett:** förra gången valdes lime, och resultatet blev en app
      Adam tyckte var tråkig. Det är vad som händer när karaktär och layout bedöms samtidigt —
      man vet inte efteråt vad man faktiskt valde.

      **Leverans:** HTML-filer i `docs/mockups/`, **committade**. De tre riktningarna från
      2026-08-05 finns inte kvar någonstans, så beslutet "Adam valde lime" går inte att granska
      i efterhand. Den förlusten upprepas inte.

      ### ✅ KLAR 2026-08-12. Fem mockupfiler, sex omgångar.

      | Fil | Vad den avgjorde |
      | :--- | :--- |
      | `11b-riktningar.html` | Tre ljusa karaktärer. Adam: C bäst, men vill ha A:s värme |
      | `11b-riktning-d.html` | C-struktur med A-värme, tre accenter |
      | `11b-papper-och-accent.html` | Papper och accent skilda åt, 5 + 6 alternativ |
      | `11b-slutlig-fargvanda.html` | Sex färdiga kombinationer + typsnitt. **Bläck valt** |
      | `11b-form-blandningar.html` | Fyra blandningar av Papper och Blad. **B4 valt** |

      **Resultatet:** papper `#F0EBE1`, accent `#2B4570`, Fraunces i rubriker, form B4
      "Blad, indraget". Allt inskrivet i `DESIGN.md` §0.5, §3 och Formspråk.

      **Två fynd som kom ur mätning, inte ur tycke:**
      1. Den valda kombinationen hade **1,01:1 separation** mellan kort och papper. Korten
         syntes bara via skuggan. Papperet fördjupades och korten blev rent vita, vilket gav
         1,19:1. Det förklarade Adams "lite tråkigt" bättre än accentfärgen gjorde.
      2. **Fraunces saknar tabulära siffror.** Därför sätter den bara rubriker, och systemets
         typsnitt sätter alla tal. Det är ett krav ur 11B.2, inte en smakfråga.

      **✅ Fraunces är hämtad som fil 2026-08-12.**
      `src/assets/fonts/fraunces-var-latin.woff2` (65,7 kB, latin, axlarna `opsz` och `wght`)
      med `OFL.txt` bredvid sig, registrerad i `docs/EXTERNT.md`. Beroendet av Google Fonts är
      därmed brutet för appen; mockuperna hämtar den fortfarande över nätet, vilket är rätt —
      de är beslutsunderlag, inte produktionskod. **`@font-face` är ännu inte skriven**; den
      hör till steg 4 i `src/index.css`.

- [x] **11B.0e Testsömmarna bestäms innan skärmarna byggs. AVGJORD 2026-08-12 (kväll).**
      Grillad i sin helhet. Adam godkände beslutstabellen samma kväll. Skälet att sömmarna
      bestäms först är att `/tdd` och `/code-review` båda arbetar mot överenskomna sömmar —
      en söm ingen kommit överens om dyker upp som en granskningsanmärkning.

      **Varför `/to-spec` inte kördes:** den publicerar specen som ett issue i `.scratch/`,
      som är gitignorerad och slängbar. Besluten hör hemma här, som regel 1 kräver.

      ### Grillningen välte tre påståenden. Läs dem innan något byggs

      1. **Vägskälet var inget vägskäl.** `repo.ts:156` sätter `isImported: false` hårdkodat,
         och `true` kan bara komma in via synken (`wire.ts:37`). **Det går alltså inte att
         skapa ett importerat set genom att klicka i appen** — importfunktionen finns inte
         (12.9 är öppen). Punkt 3, 4 och 5 i 12.20, som 12.20 själv kallar *"de intressanta"*,
         är därmed omöjliga att seeda genom UI:t. Alternativet "seeda genom UI:t" existerar
         inte för dem.
      2. **12.20:s bärande skäl mot komponenttester är falskt.** Se rättelsen i 12.20 nedan.
      3. **12.22 är dubbelt så stor som den påstår.** Se 12.22.

      ### Besluten

      | # | Beslut |
      |---|---|
      | 1 | **Två vakter, inte en.** Vakt B = *"skärmen renderar och får plats"*. Vakt A = *"skärmen visar rätt data"* (12.20). De har olika livslängd och olika värde |
      | 2 | **E2E för båda.** Det bärande skälet är att layout bara kan mätas i en riktig renderingsmotor. **Inte** det skäl som stod i 12.20 |
      | 3 | **12.20 skrivs FÖRE ombyggnaden.** Går ett text-och-tal-test sönder av en ren omdesign, då ändrade omdesignen beteendet — och det är precis vad man vill få veta |
      | 4 | **Dev är enda målet.** Att sviten aldrig rört produktionsbygget bryts ut till **12.23** |
      | 5 | **Alla sex vakterna i 12.20.** Punkt 3 påstår att notisen *syns*, aldrig vad den *lyder* — annars spräcker 12.22 den |
      | 6 | **Sådd: testet skriver rått i IndexedDB och laddar sedan om sidan.** Noll ny kod i appen. **Bara det importerade setet seedas rått** — det vanliga skapas genom appen, som en riktig användare |
      | 7 | **Selektorer: `role` + tillgängligt namn.** `data-testid` bara där tillgängligt namn saknas |
      | 8 | **Vakt B utökas** från tre rutter till fem skärmar, plus ett *"renderar alls"* per skärm |
      | 9 | **Ordning:** prövning av sådden → 12.20 → vakt B → steg 4 |

      ### Varför bara det importerade setet seedas rått

      Adam under grillningen: *"man måste se till att testerna faktiskt är rätt och inte ger
      felaktiga svar"*. Rå sådd går förbi `repo.ts` och kan därför skriva en rad appen aldrig
      hade kunnat skapa. Testet blir då grönt mot data som inte kan existera. **Falskt grönt är
      värre än rött.** Därför skapas allt som *kan* skapas genom appen, genom appen.

      ### Prövningen är KÖRD 2026-08-12 (kväll). Metoden håller — och risken var verklig

      `e2e/sadd-provning.spec.ts`. Två påståenden, båda mätta, inget antaget:

      | | Utfall |
      |---|---|
      | **Sådd → färsk navigering → sidan visar raden** | ✅ **Grönt på alla tre bredder**, ~4–5 s per körning |
      | **Sådd medan sidan redan är öppen** | ❌ **Når aldrig fram** |

      **Metoden är därmed godkänd och fallbacken behövs inte.** Inget såddinsläpp byggs, ingen
      byggflagga, noll ny kod i appen.

      ⚠️ **Men omladdning är ett KRAV, inte en försiktighetsåtgärd.** `useLiveQuery` lyssnar på
      Dexies egen ändringsspårning och ser bara skrivningar som gått genom Dexies API. Vår går
      förbi det. Seedar man mot en öppen sida händer ingenting — och felet ser ut som en trasig
      läsväg i stället för en utebliven uppdatering, vilket är den dyraste sortens vilseledning.

      ⚠️ **ÖVERSPELAT 2026-08-13 av uppgift 12.25: `test.fail()` finns inte längre i filen.**
      Larmet nedan gäller fortfarande, men bärs numera av ett vänt påstående
      (`toHaveCount(0)` efter en fast väntan) i ett vanligt grönt test. Skälet står i 12.25:
      `test.fail()` täckte hela testkroppen, alltså även uppsättningen, och gjorde mätningen
      opålitlig i den ena riktningen. Läs stycket nedan som *avsikten*, inte som konstruktionen.

      Det andra testet ligger kvar som `test.fail()` i stället för att raderas: påståendet är en
      **mätning av hur systemet beter sig**, och börjar det plötsligt lyckas — Dexie byter
      mekanism, någon lägger till en `BroadcastChannel` — blir körningen röd och vi får veta att
      antagandet under 12.20 har ändrats.

      **Grindarna efter prövningen:** typecheck ren, lint 0 fel, **e2e 36 passed**. Typecheck
      fångade förresten ett riktigt fel i prövningen (`waitForFunction` returnerar `null` i
      typen), vilket är ett litet argument för att den hör hemma i `e2e/` och inte i ett skript
      vid sidan om.

      **Klart när:** ✅ uppfyllt — sömmarna står skrivna här och Adam har sagt ja.

- [x] **11B.0f Snittkolumnen ersätter `FÖRRA` i setraden. Ny 2026-08-18. KLAR 2026-08-26.**
      Kom ur grillningen inför steg 4 och är dess viktigaste enskilda resultat. Hela
      resonemanget ligger i `SPEC.md` §2 och formen i `DESIGN.md` §3.1 — **läs dem, inte
      den här rutan.** Här står bara vad som ska byggas och hur det ska prövas.

      **Ny funktion i `src/db/history.ts`**, inte i `repo.ts`: det är en historikfråga, inte
      en loggningsoperation. Signaturen ska ta emot `exerciseId` och ett setnummer.

      | Regel | Värde |
      |---|---|
      | Underlag | De tre senaste passen **med den övningen** — inte de tre senaste passen |
      | Gruppering | Per **setnummer räknat bland arbetsseten**, eftersom man blir svagare för varje set i rad. **Preciserat 2026-08-25** — inte det lagrade `setIndex`, se rutan längst ner |
      | Avrundning | Närmaste viktsteg för övningens **utrustning** — `skivstång` 2,5 kg, allt annat 1 kg. **Ändrad 2026-08-25**, se rutan längst ner |
      | Åldersgräns | **8 veckor**, annars *"senast tränad i \<månad år\>"* |
      | Filter | Raderade, uppvärmningsset **och importerade** — samma tre som 13.4 |
      | Färre än 3 pass | Visa ändå, märkt med antalet — **en prick per pass**, valt av Adam 2026-08-26 |
      | Inget underlag alls | **Visa ingenting.** ✏️ Här stod `–`; ändrat 2026-08-27, se rutan nedan |

      > ✏️ **RÄTTELSE 2026-08-27 (uppgift 12.46): raden ovan sa `–` bara när underlag saknas
      > helt.** Koden gör inte det — `SetRow` renderar `{average && <Snitt …>}`, alltså
      > ingenting. **Koden har rätt och den här raden hade fel**, och skälet står nu utskrivet i
      > `DESIGN.md` §"Färre än tre pass": `–`-regeln skrevs när snittet var en egen kolumn som
      > annars stod tom, och form 2B gjorde snittet till en andrarad under värdet där ett streck
      > i stället *ser ut att bära information*.
      >
      > ⛔ **Ändringen skedde i steg 4.2 del A utan att den här raden rättades**, och skälet
      > låg bara i en kodkommentar. Det är ett regel 1-brott även när koden blev rätt — briefen
      > ska ändras först. `/code-review` hittade det.

      ⚠️ **Formuleringen "de tre senaste passen" är den fälla uppgiften finns för att undvika.**
      Adam preciserade den själv: kör man bänk på måndagen och ben tisdag till torsdag
      innehåller de tre senaste passen noll bänkset, och kolumnen står tom just när den behövs.
      Indexet finns redan — `getLastPerformance` slår upp på `[exerciseId+performedAt]` och går
      bakåt genom set för övningen oberoende av pass.

      **Fällan som inte är löst än:** passen har olika många set. Set 5 kan ha ett enda
      underlag när set 1 har tre. Vad som då visas ska avgöras när funktionen skrivs, inte
      antas.

      ⏰ **Skalan på fällan, preciserad av Adam 2026-08-19:** han kör **sällan 5 set — oftast
      2–4**. Exemplet "set 5" i stycket ovan är alltså det ovanliga fallet, inte det typiska.
      **Men problemet försvinner inte**, det flyttar bara ner: har han kört 4 set en gång och
      2 set två gånger har set 3 och 4 tunnare underlag än set 1 och 2. Frågan står kvar —
      den är bara mindre extrem än formuleringen antyder.

      ✅ **Avgjord 2026-08-25, och den behövde ingen ny regel.** Raden *"färre än 3 pass: visa
      snittet ändå, märkt med antalet"* gäller **per setnummer**, inte per övning. Har set 1
      tre underlag och set 3 ett, visas båda — set 3 märkt med att det bygger på ett pass.
      `–` bara när setnumret saknar underlag helt. Detta är ett omdömesbeslut fattat när
      funktionen skrevs, inte Adams: det tillämpar en regel som redan stod i briefen på ett
      fall briefen inte hade tänkt på. Vill man annat är det fritt att ändra här.

      ⚠️ **NY OCH ÖPPEN 2026-08-19: snittet är två tal, och de kan ljuga tillsammans.**
      Funktionen ska returnera **snittvikt OCH snittreps**, inte bara vikt — Adams
      precisering, se `SPEC.md` §2 och `DESIGN.md` §3.1. Signaturen ovan ändras därefter.

      **Frågan som måste avgöras här, och som medvetet lämnades öppen i briefen:** snittas
      vikt och reps var för sig kan resultatet bli **en kombination som aldrig utförts**.
      Underlaget 90×5, 85×8 och 92,5×4 ger snittet `90×6` — ett set som inte hänt.

      | Väg | Vad den ger |
      |---|---|
      | **Snitta var för sig** | Enklast. Kan visa ett set som aldrig utförts |
      | **Välj det mest representativa faktiska setet** | Alltid sant. Men är inte längre ett snitt, och en enskild mätning är brus — vilket var skälet till snittet från början (`SPEC.md` §2) |
      | **Snitta vikten, visa vanligaste repsantalet på den vikten** | Mellanläge. Fler regler att testa |

      ✅ **AVGJORD 2026-08-25 av Adam: väg 3, med ett hål lagat.** Vikten snittas och avrundas
      till 2,5 kg; **repsen snittas inte** utan tas från det set vars vikt ligger närmast
      snittvikten. Underlaget ovan ger då `90×5`.

      **Hålet i den bokstavliga väg 3:** *"vanligaste repsantalet på den vikten"* har inget
      svar när ingen kört exakt den avrundade snittvikten — 85, 87,5 och 92,5 ger snittet 87,5
      i ett underlag där inget set ligger på 87,5. **Närmaste vikt** har alltid ett svar.
      Vid lika avstånd vinner det senaste setet.

      ⚠️ **Skälet väg 1 föll är mätt, inte tyckt — och det är starkare än "ett set som aldrig
      hänt".** Vikt och reps byter av varandra, så snittas de var för sig hamnar paret **alltid
      ovanför** den verkliga kurvan, aldrig under. Briefens eget exempel ger `90×6`, vilket i
      e1RM är **108** mot de faktiska setens **105,0 / 107,7 / 104,8** — tyngre än vartenda set
      som utfördes. Ett för lågt referensvärde vore ofarligt; **ett för högt är precis den
      skada `SPEC.md` §2 finns för att ta bort.** Driften är systematisk, inte en artefakt av
      exemplet.

      **Det är fortfarande inte fel att visa en kombination som aldrig hänt** — talet är ett
      typvärde, inte ett facit. Att regeln nu råkar ge ett verkligt set är en följd, inte ett
      krav. **Men det blev ett val, inte en bieffekt.** Adam avgjorde 2026-08-25 efter att ha
      fått driften ovan mätt och utskriven.

      💡 **Öppen fråga som följer av 2B-valet: vad förklarar talen första gången?** Med 2B
      finns ingen kolumnrubrik, så de små grå siffrorna är inte självförklarande. Adams förslag
      2026-08-19: **långtryck som visar en infobricka.** Det kostar noll permanent yta, vilket
      är samma skäl som gjorde att 2B vann. ⚠️ Appen är en telefon-PWA — det är `long-press`,
      inte hover, och den är osynlig tills den hittas. **Förslag, inte beslut.** Se
      `DESIGN.md` §3.1.

      **Klart när:** funktionen har enhetstester som täcker alla reglerna ovan — inklusive
      åldersgränsen, blandfallet med importerade set och **att både vikt och reps returneras**.
      Vakt 5 i 12.20 mäter `FÖRRA` och **måste skrivas om i samma commit** — annars är den grön
      mot en kolumn som inte finns.

      ✅ **FUNKTIONEN ÄR BYGGD OCH TESTAD 2026-08-25.** `getSetAverages` i
      `src/db/history.ts`, byggd med `/tdd` — **13 tester, varje regel röd före den blev grön.**
      Returnerar `{ sets: SetAverage[]; staleSince: string | null }`.

      **Signaturen tar bara `exerciseId`, inte ett setnummer.** Briefen ovan skrev
      *"exerciseId och ett setnummer"*. Avvikelsen är avsiktlig: `ExerciseCard.tsx:46` gör i dag
      **ett** anrop per övningskort och skickar värdet ner i raderna. En signatur per setnummer
      hade gjort en `useLiveQuery` per kort till en per rad, och ett indexuppslag per rad.
      Bekräftat med Adam 2026-08-25.

      **Två vakter kan inte bli röda av sig själva** — gränsen på exakt åtta veckor, och att en
      övning med bara importerade set ger `–` i stället för *"senast tränad"*. Båda
      kontrollerades genom att implementationen tillfälligt saboterades (`>` → `>=`, och
      importfiltret borttaget), och båda föll. **Det står också i testernas kommentarer**, så
      nästa läsare vet att de mäter något.

      ⏰ **KVAR: vakt 5 i 12.20 är INTE omskriven, och det är ett medvetet avsteg från raden
      ovan.** Skälet raden anger — *"annars är den grön mot en kolumn som inte finns"* — gäller
      inte än: `FÖRRA`-kolumnen finns kvar i `SetRow.tsx:98` och drivs fortfarande av
      `getLastPerformance`. Vakten mäter alltså något som existerar. Att skriva om den nu hade
      krävt påståenden om en skärm som ännu inte är byggd.

      **Kravet är flyttat, inte struket:** det gäller den commit som byter `SetRow` till
      `getSetAverages` i steg 4. Snubbeltråden ligger i `e2e/passvy.spec.ts`
      filhuvud som en ⛔-ruta.

      ✅ **AVGJORT 2026-08-26: rutan står obockad tills den commiten är gjord.** Adam lämnade
      avgörandet till den som bygger, med villkoret *"så länge inget missas"* — och det
      villkoret är hela skälet. Uppgiftens eget **Klart när** namnger vakt 5-omskrivningen som
      ett av två kriterier. Bockas rutan av nu står det KLAR över ett ouppfyllt kriterium, och
      då finns bara ⛔-rutan i en testfil kvar som påminnelse. **En obockad ruta är en
      påminnelse; en bockad är det inte.**

      Kostnaden är noll: 4.2 Pass är nästa kodarbete efter tokenbytet i 4.1, och det är exakt
      den commit som stänger rutan. Funktionen är färdig och testad sedan 2026-08-25 — det som
      återstår är inte arbete på funktionen utan på vakten som mäter den.

      ✅ **STÄNGD 2026-08-26 i steg 4.2 del A. Vakt 5 är omskriven i samma commit som `SetRow`
      bytte källa**, och påminnelsen fungerade precis som avsett: rutan pekade ut kriteriet, och
      omskrivningen hittade **ett fel den gamla vakten hade dolt**.

      🔴 **Vad omskrivningen avslöjade: två filter maskerade varandra.** `IMPORTERAT_SET` i
      `e2e/hjalpare.ts` har `performedAt: '2024-04-04'`, alltså över två år tillbaka. Det dög
      när kolumnen drevs av `getLastPerformance`, som saknar åldersgräns — men `getSetAverages`
      har en på åtta veckor. **Saboterades importfiltret stod vakten grön ändå**, eftersom
      åldersgränsen tog setet i stället. Vakten hade mätt fel filter, och 13.4 hade varit
      oskyddad på visningsvägen utan att någon grind sagt ett ord. Rättat: setet seedas nu inom
      åtta veckor, och båda vakterna faller vid sabotage — kontrollerat, inte antaget.

      💡 **Lärdomen:** när en konsument byter datakälla ärver den källans ALLA filter, och ett
      test som var ärligt mot den gamla källan kan bli tyst grönt mot den nya. Det syns inte i
      ett diff. Sabotera om varje vakt vars källa bytt.

      ⏰ **Ett hål i `getSetAverages` hittades när konsumenten byggdes, inte när frågan
      skrevs:** funktionen saknade `excludeWorkoutId`, så det pågående passets egna set räknades
      in i sitt eget referensvärde. Bockar man av dagens set på 100 kg drogs snittet uppåt av
      det man just gjort, mitt under passet. `getLastPerformance` hade parametern och passvyn
      skickade alltid med den. Tillagd med eget test.

      🧹 **`/simplify` kördes 2026-08-26, före steg 4. Sex commits.** Fyra kalla granskare
      (återanvändning, förenkling, effektivitet, nivå). Det tyngsta fyndet var **mätt**:
      `getSetAverages` läste hela övningens historik för att använda tre pass — 13,7 ms mot
      1,3 ms vid 1600 rader, och linjärt där baklängesvägen är konstant. Funktionen gick från
      **61 till 45 kodrader** medan kommentarerna växte, vilket är rätt riktning åt båda hållen.

      ⏰ **TRE SAKER LÄMNADES MEDVETET TILL 4.2. De är inte glömda, de hör dit:**

      1. **Skärmen får INTE räkna arbetsset på egen hand ad hoc.** Nivågranskaren pekade ut att
         `workSetIndex` nu härleds på två ställen — i `getSetAverages` och, kommande, i
         skärmen — med **prosa som enda koppling**. `ExerciseCard.tsx:153` skickar i dag
         `index={i}` rakt ur `planned.sets.map()`, alltså radens plats **inklusive
         uppvärmning**. Kopplas snittet till den ordinalen visas set 2:s snitt på set 1:s rad
         så fort en uppvärmningsrad ligger överst. **Det är exakt samma buggklass som `e02abf1`
         fixade, flyttad över komponentgränsen** — och den faller tyst, inget test bryts.
         **Åtgärd i 4.2:** en delad härledning som båda sidor anropar, inte två räkningar som
         ska råka stämma. Byggdes inte nu eftersom konsumenten inte finns än.
      2. **Låt anroparen skicka övningsraden.** `getSetAverages` gör ett eget
         `database.exercises.get()` för att få `equipment`. Det drar in hela `exercises`-tabellen
         i `useLiveQuery`:s observerade mängd, så **varje skrivning dit kör om samtliga korts
         historikskanning**. `TodayPage.tsx:73` har redan raden i minnet och skickar ner den som
         prop till `ExerciseCard`. Latent i dag (`ensureCatalog` anropas bara från tester), men
         fas 7:s synk-pull skriver `exercises` skarpt.
      3. **`staleSince` är ett rått ISO-datum.** Raden ska lyda *"senast tränad i \<månad år\>"*.
         Formateringen hör till skärmen, inte till frågan.

      ✅ **Ett påstått fynd höll inte vid kontroll och avvisades.** Förenklingsaxeln föreslog att
      `EQUIPMENT`-arrayen i `types.ts` skulle ersättas av en naken union, med motiveringen *"två
      deklarationer att hålla i takt"*. Det stämmer inte: `Equipment` är **härledd** ur arrayen
      med `as const`, så de kan inte glida isär. Förslaget hade dessutom ångrat `514c5e2` två
      dagar efter att granskningen bad om den formen. Behållen.

      🔄 **AVRUNDNINGEN GJORDES OM 2026-08-25, efter research.** Den var 2,5 kg för allt, och
      det är fel för allt som inte är en skivstång: hantelcurl på 8, 9 och 10 kg ger snittet 9,
      som avrundat till 2,5-rutnätet blir **10** — en vikt Adam kanske aldrig lyft. Fyndet är
      hans: *"vissa övningar som hantelcurl kör man ju enkilos grejer ibland."*

      **Ny regel:** steget härleds ur övningens `equipment`. `skivstång` → 2,5 kg, allt annat
      → 1 kg. Principen bakom står i `SPEC.md` §2 och är det som ska överleva talen:
      **avrunda bara så grovt som utrustningen är garanterad att vara.**

      **Varför inte per övning som marknaden gör.** `docs/research/viktsteg-och-avrundning-i-gymappar.md`
      visar att FitNotes, Strong och kommande MacroFactor Workouts alla lägger ett redigerbart
      steg per övning. Vi börjar ändå med utrustningen, av ett mätbart skäl: **katalogen bär
      redan `equipment` på alla 46 övningar** (`skivstång` 15, `hantlar` 13, `kroppsvikt` 7,
      `kabel` 6, `maskin` 5), så regeln blir en ren funktion utan schemaändring eller
      migration. Ett redigerbart fält per övning läggs till **om** ett standardvärde skaver.
      Adams beslut: *"kanske kan börja med denna … och om det behövs i framtiden kanske köra
      på redigerbart fält om vi märker att det är nice."*

      ⚠️ **Rapporten ska läsas med en spärr, och granskningen hittade två fel.** Källistan
      saknades vid inklistringen; Adam eftersände den samma dag och den ligger nu sist i
      rapportfilen, med en läsanvisning överst i samma fil.

      ⛔ **Rapportens "Strong" är till stor del StrongLifts — en annan app.** Källorna för
      *"Progression settings"*, skivaktivering och destruktiv enhetsavrundning är alla
      `support.stronglifts.com`. Strongs egen hjälp ligger på `help.strongapp.io` och bär bara
      ett av påståendena. **Följden: att Strong har viktsteg per övning är obelagt, och det
      påståendet är struket ur `SPEC.md` §2.** Slutsatsen står kvar — den bärs av FitNotes och
      Hevy, som båda har förstahandskällor.

      ⚠️ Ungefär hälften av källorna är Reddit-trådar. JEFIT:s citerade *"snap to equipment
      increments"* sägs komma ur uppdateringsloggar men styrks av en Google Play-sida och en
      bloggpost. EWMA-avsnittet stöds av en generell Medium-artikel som inte nämner
      MacroFactor, och en av MacroFactor-källorna är appen *"Macro Me"* — en annan app.

      💡 **Öppen följdfråga:** `±`-knapparna i `SetAdjustSheet` är hårdkodade till
      `−1 / −2,5 / +2,5 / +1`. Samma utrustningsregel skulle kunna styra dem. Det är en
      UI-ändring i en komponent steg 4 bygger om, så den ligger som förslag — inte beslut.
      ✅ **Adam 2026-08-25: skjuts till steg 4** — *"dom får vi ta när det steget kommer."*

      🔴 **RÄTTELSE 2026-08-25 efter `/code-review`: grupperingen använde fel setnummer.**
      Första implementationen grupperade på det `setIndex` som ligger lagrat på raden. `logSet`
      numrerar alla set för övningen i passet **inklusive uppvärmningen** (`repo.ts:232`), så
      ett pass med uppvärmning lade första arbetssetet på index 1 och ett pass utan lade det på
      index 0. **Skiljer sig uppvärmningsvanan mellan passen jämfördes arbetsset *n* med
      arbetsset *n+1*** — exakt den trötthetsförskjutning regeln finns för att undvika.

      Fältet heter nu `workSetIndex` och räknas om bland de set som blir kvar efter filtret.
      Raderade och importerade set lämnar därmed inga hål i numreringen heller.

      ⚠️ **Kostnaden är utskriven i `SPEC.md` §2 och gäller den som bygger skärmen:**
      `workSetIndex` är **inte** setradens plats i listan. `SetRow` numrerar raderna med
      uppvärmningen inräknad och visar `W` för den, så skärmen måste räkna arbetsset själv.
      Betalas medvetet — alternativet är ett snitt som tyst jämför fel set.

      **Att felet fanns är i sig ett argument för att granska innan man bygger vidare.** Det
      överlevde 13 tester skrivna med `/tdd`, eftersom testerna cementerade beteendet i stället
      för att pröva regeln: fixturen hade uppvärmning i *ett* pass och jämförde aldrig två pass
      med olika uppvärmningsvana.

- [x] **11B.0i `ScrollPicker` rapporterade sin egen scroll som ett val. Ny och KLAR 2026-08-25.**
      **Stod inte i planen — den hittades.** E2E-sviten började faila slumpmässigt under
      arbetet med 11B.0f, och `/diagnosing-bugs` visade att det inte var flakighet utan en
      bugg i appen: hjulets spärr mot att rapportera sin **egen** programmatiska scroll släpptes
      efter 60 ms medan debouncen som rapporterar väntade 90 ms.

      **Följden var tyst datakorruption i kärnflödet:** fyra tryck på `+2,5` gav **8 kg i
      stället för 10**. Det drabbar telefonen, inte bara sviten.

      Fixen tar bort tiden ur villkoret i stället för att justera den: bara scroll som följer
      på `pointerdown`, `touchstart`, `wheel` eller `keydown` får bli ett val. **En avsikt kan
      inte komma för sent på samma sätt som en tidsgräns.**

      🆕 `src/ui/ScrollPicker.test.tsx` är **repots första komponenttest** — jsdom (redan
      installerat) och `react-dom`, inga nya poster i `package.json`. Det finns alltså nu en
      söm för UI-logik som inte kräver e2e.

      **Mätt före → efter:** serie `repeat-each=6 workers=1` 3/4 rött → 6/6 grönt; parallellt
      `repeat-each=4 workers=2` 7/8 rött → 8/8 grönt; full svit 1–2 fel per körning → 60/60.

      ⏰ **Inte verifierad på riktig hårdvara.** Allt är kört mot WebKit i Playwright, aldrig
      mot Safari på Adams telefon.

      **Raden är efterhandsförd 2026-08-25** — `/code-review` flaggade med rätta att fixen
      saknade förankring i planen (regel 1: *"arbeta strikt utifrån `TASKS.md`"*).

- [x] **11B.0g Mockuper för Pass, och Strong som negativ referens. Ny 2026-08-18. KLAR 2026-08-19.**
      **Slutvillkoret uppfyllt:** Adam har valt en variant per axel — `1A` invikt genväg och
      `2B` snittet under värdet — och båda valen står i `DESIGN.md` §3.1 med skäl.
      Två till tre körbara varianter i `docs/mockups/`, samma metod som gav färgen och formen
      i sex omgångar. **Två axlar ska varieras, en i taget** enligt den metod 11B.0d bevisade:

      1. **Fritextinmatningen:** alltid synligt fält överst mot hopfälld genväg ritad som en
         riktig kontroll. Se `DESIGN.md` §3.1.
      2. **Snittkolumnen:** synlig i `--text-meta`/`--color-dim` mot dold bakom ett tryck.

      ⛔ **Varianterna ska härledas ur etablerade appar, inte ur egna idéer.** Adams krav
      2026-08-18, och det är §0.2 med skärpta tänder: *"utgå fortfarande från hur tidigare
      etablerade appar fungerar, så att man inte uppfinner hjulet på nytt"*.

      ✅ **Strong är hämtad och läst 2026-08-19.** Sex bilder som `Strong iOS 1–6.jpg`,
      registrerade i `docs/EXTERNT.md`, med anteckningarna i `DESIGN.md` §0.5. **Bild 1 är
      vår Pass-skärm byggd av någon annan** och räcker för båda axlarna:

      | Axel | Vad Strong visar |
      |---|---|
      | Fritexten | Ligger **överst, alltid synlig, utan ram** — men som passanteckning, inte inmatning |
      | Spökdatan | Egen kolumn, **tom i alla tre raderna**, uppmätt **1,6–1,7:1** i kontrast mot 13:1 för viktvärdet bredvid, och ~⅓ av radbredden |

      ⏰ Bilderna är äldre än appen (1242×2208, iOS 10-statusrad, mot version 6.5.0), men
      **Adam känner igen versionen** — åldersvarningen är därmed mildrad, inte upphävd.

      **Referensen gav inget lokaliserat visuellt utslag.** Adam tycker fortfarande inte att
      Strong är snyggt, men kunde inte peka ut ett enskilt element: *"inget riktigt
      speciellt"*. Motviljan är alltså diffus. **Följden för arbetssättet:** leta inte efter
      den avgörande detaljen i bilderna — referensen ger en helhet att undvika.

      **`Previous`-kolumnen avgör ingenting.** *"Tror jag tittade lite … minns inte exakt"*,
      och Adam bad uttryckligen om att inte tolkas ordagrant. Axel 2 avgörs i mockupen.

      **Passets titel får tas bort under pass** — frigör översta raden, som axel 1 konkurrerar
      om.

      ⚠️ **Axel 1 delades i två.** Adam skiljer
      på **passkommentar** (fritext om passet, skriven vid avslut — *"kan vi prova att ha den
      för oss ändå"*) och **fritext-loggning** (`bänk 80x8` → set). Om det senare är han
      osäker: *"vet inte om jag kommer använda fritext alternativet så mycket men får se"*, och
      han tror strukturerad inmatning kan vara effektivare för att logga. Det är osäkerhet,
      inte avslag — och `SPEC.md` §2:s andra loggningsläge är redan svaret. Detaljerna i
      `DESIGN.md` §0.5.

      **Mockupen ska pröva dem som två element, inte ett.** Placeringen överst gäller
      passkommentaren.

      ✅ **Mockupen är byggd:** `docs/mockups/11b-0g-pass.html`, fyra körbara rutor.

      ✅ **AXEL 2 ÄR AVGJORD 2026-08-19: `2B`, snittet under värdet.** Ingen egen kolumn;
      varje talkolumn bär sitt eget snitt under sig. Skälen står i `DESIGN.md` §3.1.
      **Kolumnrubriksfrågan (`Snitt`/`Normalt`/`Typiskt`) faller därmed** — det finns ingen
      kolumn att namnge.

      ⚠️ **Adam hittade ett fel i mockupen som gjorde hela axeln missvisande:** snittet
      ritades som **ett** tal när det måste vara **två** — vikt kopplad till reps. Briefens
      egen skiss sa redan `90×5`; mockupen ritade bara vikten. Rättat i `3a43135`, och
      preciseringen är införd i `SPEC.md` §2, `DESIGN.md` §3.1 och 11B.0f ovan.

      ✅ **AXEL 1 ÄR AVGJORD 2026-08-19: `1A`, invikt genväg** som fälls ut vid tryck. Skälen
      står i `DESIGN.md` §3.1. Frågeformuleringen var fel först — den skrev 1A/1B som *synlig
      mot dold* när båda syns; det som skiljer är radens **vilotillstånd**. Rättat i `3a43135`.

      💡 **Adams förslag på den olösta förklaringsfrågan:** långtryck som visar en infobricka
      om vad talet betyder. Nedskrivet i `DESIGN.md` §3.1 som **förslag, inte beslut** — hör
      till 11B.0f eller steg 4.

      **Klart när:** Adam har valt en variant per axel, och valet står i `DESIGN.md` med skäl.

- [x] **11B.0h Betalfunktionerna hos konkurrenterna. Ny och KLAR 2026-08-18.**
      Adams iakttagelse: bygger han appen själv slipper han både betalvägg och påminnelser,
      och det som ligger bakom andras betalsteg är en färdig lista över vad folk faktiskt
      vill ha. **Två oberoende sökningar kördes på samma fråga**, vilket var avsikten:

      | Fil | Källa |
      |---|---|
      | `docs/research/betalfunktioner-i-gymappar.md` | Gemini Deep Research, körd av Adam |
      | `docs/research/betalfunktioner-i-gymappar-oberoende.md` | `/research`, körd i repot |

      **Resultatet är en lista att prioritera ur, inte att bygga.** Fyndet som båda landar på:
      betalväggarna speglar nästan aldrig driftskostnad. De sex mest låsta funktionerna är
      alla artificiella, och den allra mest låsta är **full grafhistorik** — sex av nio appar.

      ⚠️ **Tre av rekommendationerna motsäger beslut som fattades samma dag**, och det står
      utskrivet så att ingen ändrar tillbaka för att "researchen sa så": klassisk spökdata
      (se `SPEC.md` §2), regelbaserad autoprogression (avvisad, gör appen till tränare), och
      Chart.js (nytt beroende — kräver Adams ja enligt §7.3, och `Sparkline.tsx` har redan ett
      skrivet beslut med utlösare).

      ⏰ **Reddit var blockerat** i den ena körningen, så dess användarröster kommer från
      Play Store och App Store i stället. Tre identifierade men olästa trådar är länkade.

      ⚠️ **Liftosaur är AGPL-3.0.** Inga kodrader därifrån, någonsin. Att läsa för idéer är
      fritt — men påverkar Liftoscript designen krävs en rad i `docs/EXTERNT.md`. Inget är
      hämtat, så ingen registerrad krävs i dag.

**11B.1–11B.9 nedan är implementation av briefen.** Ingen av dem är ett eget designbeslut
längre — värdena kommer från `DESIGN.md`. Motsäger en uppgift briefen är det briefen som
gäller, och uppgiften skrivs om.

> ### 🔄 Runda 1 omfattar 4.1–4.3. Avgjort 2026-08-18
>
> Steg 4 delas i två rundor — se `DESIGN.md` §"Implementationsordning för steg 4" för skälet.
> **Runda 1: tokens, Pass, Historik.** Runda 2 (Statistik, Övningar, Mer) kräver en egen
> grillning eftersom det är ny funktionalitet, inte omskrivning.
>
> **11B.5 (rörelse) ligger utanför runda 1** — referensstöd saknas, och animationer ändrar
> ingen struktur och kan därför läggas till i efterhand. Uppgiften står kvar oförändrad.

> ### ⚠️ NUMRERINGSKROCK. Skriv alltid ut ordet "Steg"
>
> **`Steg 4.1` och `4.1` är två olika uppgifter i det här dokumentet.** `4.1 Typerna` på
> rad 286 hör till **Fas 4, parsern**, och är klar sedan länge. `Steg 4.1` nedan är
> designrundans första delsteg och kommer ur `DESIGN.md` §"Implementationsordning för steg 4".
>
> Krocken uppstod för att briefen numrerar sina egna steg 4.1–4.6 medan `TASKS.md` numrerar
> faser. Den löses billigast genom att alltid skriva ut ordet — inte genom att numrera om
> något av dem, vilket hade brutit varenda korsreferens i båda dokumenten.

- [ ] **Steg 4.1 Tokens: appen byter från det mörka temat till Bläck. Ny 2026-08-26.**
      Designrundans första delsteg. **Inget nytt designbeslut fattas här** — allt är avgjort
      och godkänt av Adam: karaktären *Bläck* 2026-08-12 (`DESIGN.md` §0.5), semantikens
      **väg C** 2026-08-14 (§1b), formen **B4** 2026-08-12 (§3), Fraunces 2026-08-12.
      Uppgiften är att flytta de värdena in i koden.

      ⚠️ **Appen kör i dag hela det överspelade mörka lime-temat.** `src/index.css` har
      `--color-bg: #000000` och `--color-accent: #bef264`, alltså den riktning §0.5 uttryckligen
      märker som historik. Det är därför tokens måste gå **före** Pass-skärmen: bygger man
      skärmen först bygger man den mot färger som ändå ska bytas.

      **Mätt före start, så omfånget inte gissas:** hela `src/` innehåller **en enda** hårdkodad
      färg (`bg-black/60`, skärmen bakom bottenarket i `SetAdjustSheet.tsx:65`). Allt annat går
      via tokens. 14 färgtokens refereras i koden, 8 är definierade utan att användas — och
      `--color-pb-text`, som väg C tar bort, är en av de oanvända. Bytet är alltså ett
      tokenbyte, inte en genomgång av varje komponent.

      | Vad | Från | Till |
      |---|---|---|
      | Neutraler + accent | Svart/lime | Papper `#F0EBE1`, kort `#FFFFFF`, marinblå `#2B4570` |
      | Semantiska färger | §1:s mörka skalor | §1b väg C — betydelsen bärs av **yta + kant**, texten är `--color-fg` |
      | `--radius-card` | 16 px | **18 px** (§0.5 formspråk) |
      | Fraunces | Fontfilen ligger i repot sedan 2026-08-12 | `@font-face` i `index.css` + token som pekar rubrikerna dit |
      | PWA-temafärg | `#000000` på **två** ställen | Papperets färg |

      ⛔ **Temafärgen bor på tre ställen och ett av dem är redan ur synk.**
      `vite.config.ts:34-35` (manifestet) och `index.html:12` (`<meta name="theme-color">`)
      måste båda ändras — §0.5 rad 477 säger uttryckligen *i samma commit*, annars blir
      startskärmen och statusraden en annan färg än appen. `test/manifest.json` står kvar på
      `#0a0a0a`, ett värde appen lämnade redan när den var mörk; **den är en död testrigg från
      fas 3 och rörs inte här** — men den är värd en egen rad i backloggen.

      ⚠️ **Tonade ytor ligger ALLTID på ett vitt kort, aldrig direkt på papperet** (§1b fynd 3).
      Mot papperet mäter de 1,04–1,09:1 och försvinner — mindre än kortets egen separation.

      **Klart när:** appen renderar i ljust tema utan kvarvarande mörka värden; alla fem grindar
      gröna; och skärmarna är **visuellt kontrollerade i webbläsaren**, inte bara byggda. Det
      sista är inte formalia — kontrastvärdena i briefen är uppmätta mot rätt underlag, men
      *vilket* underlag varje token faktiskt hamnar på syns bara när sidan renderas.

      ✅ **BYGGD 2026-08-26. Alla fem grindar gröna** (294 tester, e2e 60 passed). Bygget växer
      med Fraunces: precache **651,50 → 718,51 KiB**, 9 → 10 entries. JS-bundlen oförändrad.

      **Den visuella kontrollen betalade sig direkt — den hittade tre osynliga kontroller.**
      `Avsluta pass`, `Kopiera förra passet` och fritextgenvägen ritades med `--color-line`
      (`#f0ece5`) utan egen yta, mot papperet `#f0ebe1`. Uppmätt **1,01:1** — kontrollerna hade
      ingen synlig avgränsning alls. I det mörka temat gav samma token 1,47:1 mot svart och
      *såg* ut att räcka. **Tokenbytet ändrade inte bara färgen utan vad färgen betyder på sitt
      underlag**, och det syns inte i ett diff. Åtgärdat: de tre bär nu `--color-line-strong`,
      alltså briefens egen token för kanter som identifierar en kontroll.

      ✅ **AVGJORD AV ADAM 2026-08-26: `#8A8378`. Rutan nedan stod kvar som "öppen fråga" i två
      dagar efter att den var stängd.** Beslutet ligger i `7daa2ab`, värdet ligger i
      `index.css:82`, och `DESIGN.md:418` bär det uppmätta talet — **men `TASKS.md` rördes inte
      i den commiten**, så det här dokumentet fortsatte be om ett beslut som redan var fattat
      och kalla `#C4BCB0` för "nuvarande" när koden inte hade det värdet längre.
      **Texten nedan står kvar och beskriver läget före beslutet** — bara ordet *nuvarande* i
      tabellen är rättat till *dåvarande*, eftersom det var det enda som var direkt falskt om
      koden. Resten, inklusive `⛔ Ändras INTE på eget bevåg`, är hur frågan såg ut när den var
      öppen och ska läsas så.

      💡 **Varför det är värt en rad och inte en tyst rättelse:** det är samma familj som
      **12.46** — koden hade rätt och dokumentet hade fel, alltså regel 1 åt fel håll. Skillnaden
      är att här bad dokumentet dessutom Adam om ett beslut han redan fattat, och det är den
      dyraste sortens osanning ett uppgiftsdokument kan bära.

      ⏰ ~~**ÖPPEN FRÅGA TILL ADAM**~~ — **`--color-line-strong` klarade inte sitt eget krav.**
      Briefen definierar tokenen som *"kanter som BÄR BETYDELSE — t.ex. en obekräftad setrads
      tryckyta"* och skriver ut **WCAG 1.4.11: 3:1** som kravet. Det mörka temats värde mätte
      3,37:1. Bläcks `#C4BCB0` mäter:

      | Underlag | Uppmätt | Krav |
      |---|---|---|
      | Mot papperet `#F0EBE1` | **1,58:1** | 3:1 |
      | Mot vitt kort `#FFFFFF` | **1,88:1** | 3:1 |

      Det gäller **bekräfta-bocken på setraden** — appens mest tryckta kontroll, och briefens
      eget exempel på en kant som bär betydelse. Värdet är alltså inte fel *för att* det är
      ljust; det är fel för att briefen ställer ett krav som värdet inte uppfyller. Samma klass
      av självmotsägelse som `--text-title` ovan.

      **Framräknade alternativ i samma varma familj, alla uppmätta:**

      | Värde | Mot papper | Mot kort | Klarar 3:1 på båda |
      |---|---|---|---|
      | `#C4BCB0` (dåvarande) | 1,58 | 1,88 | ❌ |
      | `#9A9186` | 2,61 | 3,10 | ❌ |
      | **`#8A8378`** ← **valt** | **3,16** | **3,75** | ✅ ljusaste som klarar |
      | `#7D766C` | 3,78 | 4,49 | ✅ |

      ⛔ **Ändras INTE på eget bevåg.** `#C4BCB0` är valt av Adam 2026-08-12 och en mörkare kant
      är en synlig karaktärsändring — papperet blir strängare. Rekommendationen är `#8A8378`,
      som är det minsta steg som uppfyller kravet. **Adam avgör.** Alternativet är att skriva om
      briefens krav i stället, men då ska det stå varför.

      ✅ **Han valde `#8A8378`, och invände samtidigt mot vem kravet tillhörde:** *"det är inte
      jag som har satt utan jag har bara valt och sagt vad jg önskar för färger men inget om
      kontraster."* Invändningen är riktig och står i `7daa2ab`:s commitmeddelande —
      **kontrastkraven är mina, färgvalen hans.**

      🔴 **EN REGRESSION INFÖRDES OCH RÄTTADES I SAMMA OMGÅNG — mekanismen är värd att bära
      vidare.** Vilotimerns utgångna läge ritade sin text med `text-[var(--color-bg)]` ovanpå
      `--color-ok-solid`. Raden ändrades aldrig, men **tokenens innebörd bytte med temat**:
      svart på grönt var 6,07:1, papper på grönt är **2,66:1**. Rättat till vit text enligt väg
      C:s egen parning solid + vit glyf, uppmätt **3,16:1** — de 32 px stora siffrorna klarar
      därmed kravet för stor text (3:1).

      ⚠️ **Kvar till 4.2:** etiketten *"Vila klar"* är 14 px och ligger på **3,16:1** mot
      kravet **4,5:1** för liten text. Det är inte en följd av tokenbytet utan av att en fylld
      semantisk yta används som **banderollbakgrund för brödtext**, vilket väg C aldrig
      sanktionerade — solid är till för en glyf. Timerchipet byggs om i 4.2 (`DESIGN.md` §3.1),
      och den omskrivningen ska lösa det här, inte lämna det.

      ✅ **LÖST 2026-08-26 i steg 4.2 del C. Uppmätt 3,16 → 15,61:1.** Det utgångna läget bär
      nu yta + kant med `--color-fg` som text, alltså väg C:s egen regel, och det solida
      flyttade till en fylld prick — som är vad en solid får bära.

      ⏰ **RUTAN STÅR OBOCKAD, OCH DEN SOM BYGGDE 4.2 LÄT DEN VARA.** Alla tre kriterier i
      **Klart när** ser uppfyllda ut: appen är ljus, grindarna var gröna, skärmarna
      kontrollerades i webbläsaren. **Men rutan är inte min att bocka av** — jag vet inte om
      föregående session lämnade den öppen med flit. Den enda kandidaten jag hittar är att
      `apple-mobile-web-app-status-bar-style` fortfarande är **overifierad**; den gäller bara
      iOS i standalone-läge och kan varken prövas av Playwright, skrivbordet eller
      webbläsarpanelen. **Adam avgör:** lägg till appen på hemskärmen, starta därifrån och
      titta på statusraden — stämmer den är rutan klar.

      💡 **Lärdomen, som gäller bortom den här uppgiften:** ett temabyte kan gå sönder utan att
      en enda rad i komponenten ändras. Både de tre osynliga kanterna och timern var rader som
      var korrekta före bytet och fel efter, och **ingen av dem syns i ett diff eller fälls av
      en grind.** Det enda som hittade dem var att rendera appen och mäta kontrasten
      programmatiskt i DOM:en. Gör om den mätningen efter 4.2 och 4.3.

- [x] **Steg 4.2 Pass-skärmen mot B4 + 2B. Ny 2026-08-26. KLAR 2026-08-26 —
      MEN TRE KRITERIER VAR INTE UPPFYLLDA. Se rutan direkt nedan.**

      > ### ⛔ RÄTTELSE 2026-08-27: rutan bockades av för tidigt
      >
      > `/code-review` mot `cc54451...HEAD` granskade steg 4.2 för första gången — förra
      > sessionen bad om den granskningen och den kördes aldrig. **Fem spec-fynd och två
      > standardbrott sitter i den här uppgiften**, alla verifierade mot koden 2026-08-27.
      >
      > **Bocken står kvar med flit.** Delarna A–E ÄR byggda och de fem commitarna är verkliga;
      > att avbocka hade gjort historien osann åt andra hållet. Men **den som läser rutan som
      > "klart" utan att läsa vidare får fel bild**, och därför står rättelsen i rubriken.
      >
      > | Del | Vad som INTE blev gjort | Uppgift |
      > |---|---|---|
      > | **A** | Härledningen är **inte delad**. `history.ts:315-319` räknar arbetsset själv, parallellt med `workSetIndices`. Specen: *"Kopplingen ska vara kod, inte prosa i en doc-kommentar"* | **12.42** |
      > | **B** | Metaraden bär fortfarande `{klara} av {n} set` — **precis den form specen pekade ut som "i dag"** | **12.44** |
      > | **B** | Kortet är indraget **12 px**, inte 16 som specen säger | **12.45** |
      > | **C** | Chipet är ingen chip. `rounded-lg border p-3`, full radbredd. `DESIGN.md:511`: *"Knappar och chips: pillerform"* | **12.43** |
      > | **D** | `DESIGN.md` 1312–1316 säger fortfarande att `±`-stegen *"ligger kvar som förslag tills Adam sagt till"*. Del D avgjorde det | **12.46** |
      >
      > 🔴 **Den gemensamma orsaken är värd mer än fynden.** Tre av de fem gled igenom för att
      > **delens `Klart när` mätte något annat än delens brödtext.** Del C:s brödtext beställer
      > en **form** (*"en chip i flödet … Siffran är 32 px, alltså en stor chip"*) men dess
      > `Klart när` mäter bara **kontrast** — så formen blev aldrig grindad, och delen såg
      > uppfylld ut. Samma sak i B: brödtexten beställer en metarad och ett indrag, `Klart när`
      > kräver bara att en emoji är borta och att kortet *"ser ut som B4-skissen"*, vilket ingen
      > kan falla på.
      >
      > > **Regeln som faller ut, och den gäller varje uppgift som skrivs härefter:** *ett
      > > `Klart när` som inte kan falla på uppgiftens egen brödtext är ingen grind — det är en
      > > sammanfattning.* Skriv kriteriet mot det svåraste kravet i texten, inte mot det
      > > lättaste att mäta.
      >
      > ⚠️ **Del B:s kriterium `grep -rn "🏋" src/` är tom — är fortfarande falskt, men inte
      > ett fel.** Två träffar återstår och **båda är kommentarer** som förklarar att ikonen är
      > borttagen. Ikonen ÄR borta. Kriteriet är för bokstavligt formulerat; det är samma
      > sjuka som ovan, sedd från andra hållet. Ingen uppgift — noterat här och inget mer.

      Designrundans andra delsteg, och den skärm appen används mest på. **Inget nytt
      designbeslut fattas här** — formen **B4** valdes 2026-08-12, snittets form **2B**
      2026-08-19, kopplingen vikt/reps och viktsteget 2026-08-25, långtrycket 2026-08-26.
      Uppgiften är att flytta besluten in i koden.

      **Läs `DESIGN.md` §3.1 och `11B.0f` ovan för *varför*, inte den här rutan.** Här står
      vad som byggs, i vilken ordning, och vad varje del är klar när.

      ⚠️ **Uppgiften byggs INTE i en commit.** Regel 3 i `CLAUDE.md` — atomära commits. De
      fem delarna nedan är fem commits, och ordningen är inte godtycklig: A bär hela rundans
      tyngsta ändring och den enda kvarvarande snubbeltråden, resten är renodlad form.

      ---

      **A. Snittet ersätter `FÖRRA` i setraden. Formen är 2B.**
      Det här är rundans tyngsta ändring och den enda som rör datavägen.

      | Vad | Från | Till |
      |---|---|---|
      | Kolumnen `Förra` | Egen kolumn i `SET_GRID`, driven av `getLastPerformance` | **Borta.** Snittvikten under vikten, snittrepsen under repsen (`--text-meta`, `--color-dim`) |
      | Datakälla i kortet | `getLastPerformance` | `getSetAverages` (byggd och testad 2026-08-25) |
      | `staleSince` | Rått ISO-datum | *"senast tränad i \<månad år\>"* — formateringen hör till skärmen, inte till frågan |

      ⛔ **`workSetIndex` får INTE räknas ad hoc i skärmen.** `ExerciseCard.tsx:153` skickar
      i dag `index={i}` rakt ur `planned.sets.map()`, alltså radens plats **inklusive
      uppvärmning**, medan `getSetAverages` numrerar bland arbetsseten. Kopplas snittet till
      radens ordinal visas set 2:s snitt på set 1:s rad så fort en uppvärmningsrad ligger
      överst — **tyst, utan att ett enda test bryts.** Det är exakt buggklassen `e02abf1`
      fixade, flyttad över komponentgränsen.

      **Åtgärden är en delad härledning som båda sidor anropar**, inte två räkningar som ska
      råka stämma. Kopplingen ska vara kod, inte prosa i en doc-kommentar. Signaturen avgörs
      när funktionen skrivs — skälet skrivs ut i filen.

      ⛔ **Vakt 5 i `e2e/passvy.spec.ts` skrivs om i SAMMA commit.** Det är det andra av
      11B.0f:s två `Klart när`-kriterier och skälet rutan står obockad. **Det som ska överleva
      omskrivningen är påståendet, inte `data-testid`:t:** ett importerat set får aldrig bli
      referensvärde, och dess vikt får inte synas någonstans i kortet. Ankringen i 5a — en
      övning med känd historik bredvid — måste överleva; utan den betyder en tom cell
      ingenting. Vakten raderas inte.

      ✅ **Bocka av 11B.0f i samma commit.** Då, och först då, är dess `Klart när` uppfyllt.

      **Klart när:** kortet driver setraderna ur `getSetAverages`, `setrad-forra` finns inte
      kvar någonstans, härledningen av arbetssetnummer har ett eget test som går rött om
      uppvärmningsraden räknas in, vakt 5 mäter den nya formen, och `staleSince` visas som
      månad och år.

      ---

      **B. Kortets form: B4, och 🏋 raderas.**
      Sista posten i **11B.0c** — den enda emoji som är kvar i `src/ui/`.

      - **Accentbricka** 10 × 34 px, radie 5 px, `--color-accent`, till vänster om namnet.
        **Ingen symbol i den.** Hela `<span>`-rutan på `ExerciseCard.tsx:62-67` går bort;
        leta inte efter en skivstångsikon — B4 gör frågan *"vilken ikon har en lårcurl"*
        onödig i stället för att svara på den.
      - **Metaraden** under namnet: `Skivstång · 3 set · 1 385 kg`. Den kompenserar något
        konkret — när ikonrutan försvann tappade raden sin enda visuella hållpunkt utöver
        namnet. I dag står där `{klara} av {n} set · sist 90 kg × 5`.

        🔄 **PRECISERAT 2026-08-27 av Adam: talet är LOGGADE ARBETSSET, inte planerade.**
        Raden ovan sa bara `3 set` utan att säga *vilka* tre. Adam: *"man vet ju inte till en
        början hur många set man vill köra på en övning. Borde ju bara öka 1x per set som man
        faktiskt kör."* Tomfallet är mockupens `Kabel · inga set än`. Se **12.44**.
      - **Ytan:** vit, radie 18 px (`--radius-card`, redan satt i 4.1), **skugga
        `--shadow-card` i stället för ram**, indragen **12 px**. Se `DESIGN.md` §"Genomgående
        mönster" — på ljus botten bär skuggan avgränsningen, separationen mot papperet är
        bara 1,19:1.

        ✏️ **Här stod 16 px, efter mockupen. Ändrat till 12 px av Adam 2026-08-27 (12.45), och
        koden är oförändrad.** Skälet är att indraget inte är kortets: det kommer ur `px-3` på
        `<main>` i [AppShell.tsx](../src/ui/AppShell.tsx) och gäller **alla skärmar**. Att
        följa mockupen hade flyttat Historik, Inställningar och Övningar också, för 4 px — och
        på iPhone SE är det den bredd som är minst. Ett eget indrag på bara övningskortet hade
        i stället brutit linjeringen mot allt annat på passkärmen.
      - Övningsnamnet i Fraunces.

      **Klart när:** ingen 🏋 **renderas** någonstans i `src/` — alltså inga träffar utanför
      kommentarer — 11B.0c:s sista rad är därmed uppfylld, och kortet ser ut som B4-skissen i
      `DESIGN.md` §3.1, **inklusive metaradens form och indraget**, visuellt kontrollerat.

      ✏️ **KRITERIET ÄR OMSKRIVET 2026-08-27, och det är en rättelse och ingen uppmjukning.**
      Här stod `grep -rn "🏋" src/` är tom. Det är **falskt i dag** och kommer att förbli det:
      två kommentarer förklarar att ikonen är borttagen, och de ska stå kvar — `ExerciseCard`
      säger uttryckligen *"Leta inte efter en skivstångsikon"*. **Ikonen ÄR borta.** Ett
      kriterium som en korrekt kodbas inte kan uppfylla är inte en grind utan en felkälla.

      **Samtidigt är kriteriet nu SVÅRARE på det som faktiskt fallerade:** *"ser ut som
      B4-skissen"* kunde ingen falla på, och därför gled både metaraden (**12.44**) och
      indraget (**12.45**) igenom. Se rättelserutan i den här uppgiftens rubrik.

      ---

      **C. Timerchipet byggs om, och det löser en kontrastskuld 4.1 lämnade.**
      Etiketten *"Vila klar"* är 14 px på `--color-ok-solid` och mäter **3,16:1** mot 4,5:1
      för liten text. **Skulden är inte en följd av tokenbytet** utan av att en fylld semantisk
      yta används som **banderollbakgrund för brödtext** — väg C sanktionerade solid för *en
      glyf*, inte för en textrad. Chipet byggs om ändå (`DESIGN.md` §3.1), och omskrivningen
      ska lösa det här, inte lämna det vidare.

      Formen: **en chip i flödet, inte ett banderoll-lager** — timern får inte skymma setraden
      man just loggat. Siffran är 32 px (`--text-timer`), alltså en *stor* chip.

      **Klart när:** varje text i chipet är uppmätt i DOM:en mot sitt faktiska underlag och
      klarar sitt krav för sin storlek — 4,5:1 under 24 px, 3:1 över.

      ---

      **D. `±`-knapparna följer utrustningsregeln.**
      `SetAdjustSheet.tsx` hårdkodar `−1 / −2,5 / +2,5 / +1`. `weightStepFor` finns sedan
      2026-08-25 (`src/lib/steps.ts:58`) och ska styra dem, så att hantelövningar får `+1`
      som huvudsteg. Adam 2026-08-26: *"dom får vi ta när det steget kommer."*

      **Klart när:** stegen härleds ur övningens `equipment` genom samma funktion som snittets
      avrundning, och ett test visar att en hantelövning och en skivstångsövning får olika steg.

      ---

      **E. Långtryck förklarar snittalen.**
      Adams beslut 2026-08-26: *"Långtryck är bra allmänt annars."* Det kostar noll permanent
      yta, vilket är samma skäl som gjorde att 2B vann.

      ⚠️ **Engångsförklaringen hör INTE hit** — den ligger i **11B.6**, och skälet är konkret:
      ögonblicket finns inte, appen har varken registrering eller förstagångsflöde.
      **Följden, accepterad med öppna ögon:** långtrycket är ett tag den enda vägen till
      förklaringen, och det är osynligt tills man hittar det.

      🔍 **§7.1 gäller: sök innan du bygger.** Långtryck är rundans enda *nya* funktion. Det
      finns ingen plattformsprimitiv som gör det rakt av, men det är ett löst problem med
      kända fällor — **den krockar med systemets egen textmarkering och med iOS
      callout-menyn om den byggs slarvigt.** Redovisa vad sökningen gav innan första raden
      skrivs, även om svaret blir "inget som passar".

      **Klart när:** långtryck på ett snittal visar vad talet är, det fungerar med
      pekskärmens egen textmarkering i stället för mot den, och en mus-/tangentbordsväg finns
      för Playwright att mäta.

      ---

      ### Gemensamt slutvillkor för hela steg 4.2

      🔴 **Mät kontrasten i DOM:en när skärmen är byggd.** Det är inte formalia. Steg 4.1
      lämnade fyra fel som **inga av de fem grindarna fångade** — raderna var korrekta före
      temabytet och fel efter, för att tokens *innebörd* ändrades under dem. Det enda som
      hittade dem var att rendera appen och mäta programmatiskt med `javascript_tool`.
      Metoden står i `Steg 4.1` ovan.

      **Alla fem grindar gröna**, och skärmen **visuellt kontrollerad i `preset: mobile`**
      (375 × 812) — inte bara byggd.

      ---

      ✅ **BYGGD 2026-08-26 i fem commits, som planerat.** Grindar i slutläget: **302 tester**,
      typecheck rent, lint **0 fel** (3 kända `react-refresh`-varningar), **e2e 66 passed**,
      bygge **722,92 KiB precache** / JS 641,78 kB (gzip 193,14).

      🔴 **MÄTNINGEN BETALADE SIG IGEN, OCH DEN HITTADE TVÅ TYSTA VAKTER — INTE BARA FÄRGER.**
      Lärdomen från 4.1 var att rendera och mäta. I 4.2 gav samma metod tre fynd som **ingen av
      de fem grindarna** hade fällt:

      1. **Vakt 5 mätte fel filter.** Se 11B.0f ovan — två filter maskerade varandra efter
         källbytet, och sabotage av importfiltret lämnade vakten grön.
      2. **Långtrycksvakten var tyst grön i sin första form.** Infobrickans `fixed inset-0`-
         overlay dök upp **under fingret medan det låg nere**, så `pointerup` hamnade på
         overlayen och `click` uteblev helt. Klickspärren i `useLongPress` blev därmed omätbar
         — sabotage av den ändrade ingenting. Overlayen är borttagen; brickan stängs nu av
         nästa `pointerdown` på document, och sabotaget fäller vakten.
      3. **Mitt eget mätskript ljög först.** Det läste `oklab(0.94 … / 0.4)` med en
         RGB-regex och rapporterade tre falska kontrastfel på kolumnrubrikerna. Rättat till
         canvas-kompositering, som hanterar både alfa och moderna färgrymder. **En mätning som
         inte själv är kontrollerad är inte ett bevis** — och den hade sänt mig att "fixa"
         rader som var korrekta.

      ⏰ **Ett hål i `getSetAverages` hittades när konsumenten byggdes:** ingen
      `excludeWorkoutId`, så det pågående passets egna set räknades in i sitt eget
      referensvärde. Se 11B.0f. **Regeln som faller ut: en fråga utan konsument är inte
      färdig, den är bara oprövad.**

      📋 **Fyra öppna trådar lämnas vidare, alla medvetet:**

      1. **Långtrycket är enda vägen till förklaringen** tills **11B.6** bygger
         engångsförklaringen. Accepterat av Adam med öppna ögon.
      2. **`--color-ok-text` används som kant** i timerchipet, inte `--color-ok-line`. Skälet
         är uppmätt och står i `RestTimer.tsx` — briefens kanttoken är mätt mot vitt kort och
         chipet ligger på papperet. **Värt att avgöra i 4.3** om briefen ska få en egen
         kanttoken för element som ligger direkt på papperet.
      3. **`getSetAverages` gör fortfarande ett eget `exercises.get()`** för att få
         `equipment`. Punkt 2 i `/simplify`-listan i 11B.0f är alltså **inte** åtgärdad —
         den är latent i dag men blir skarp när fas 7:s synk-pull skriver `exercises`.
      4. **Steg 4.1:s ruta står obockad.** Se noten i den uppgiften.

- [x] **Steg 4.3 Historik mot §3.2. Ny 2026-08-28. KLAR 2026-08-29 i tre commits.**

      > ### ✅ UTFALLET — läs den här rutan före brödtexten
      >
      > **A, B och C är byggda som skrivna, och tre saker blev annorlunda än texten sa.**
      > Alla tre står utskrivna nedan, för det är dem nästa läsare snubblar på.
      >
      > | Vad texten sa | Vad som gäller |
      > |---|---|
      > | `font-semibold` på `h1` är en rest och ska bort | **Fel.** `DESIGN.md` §2 ger `--text-title` vikt 600. Klassen står kvar; texten i del B är rättad, och att vikten är *ihågkommen* i stället för strukturell blev **12.50** |
      > | 12.40 avgörs här om fallet uppstår | **Det uppstod inte.** Skärmens enda semantiska element (`Pågår`) ligger på ett kort. 12.40 är uppdaterad med varför, och väntar på 4.4 |
      > | Del B: *"inget element ritar en yta med `border-[var(--color-line)]`"* | **Kriteriet är för bokstavligt.** Inget KORT gör det; avdelarna inuti övningslistan gör, och ska. Samma sjuka som 4.2:s `grep 🏋` — se rutan där |
      >
      > 🔴 **Fyndet som var större än uppgiften: kontrastvakten ursäktade sin egen kontroll.**
      > `e2e/kontrast.spec.ts` undantar `--color-line`-kanter på allt som inte är
      > `button, input, select, textarea, a`. Segmentkontrollen är en `<fieldset>` med
      > `sr-only` radioknappar — alltså **ingendera**, och en osynlig kontrollkant (1,09:1 mot
      > papperet) gick grön. Det är exakt felklassen vakten byggdes för, och den hittades bara
      > för att sabotaget kördes. Lagat i del C:s commit; `fieldset` och grupproller är
      > tillagda, och samma sabotage är rött nu.
      >
      > ⚠️ **Ett sabotage ljög innan det avslöjade något.** `perl -0pi -e 's///'` utan `/g`
      > byter **första förekomsten i hela filen** — vilket var en doc-kommentar. Bytet av
      > `weekday: 'long'` lämnade koden orörd och allt grönt, och såg ut som en tyst vakt.
      > **En mätning som inte själv är kontrollerad är inte ett bevis** — samma lärdom som
      > 4.2:s mätskript, i ny förklädnad. Kontrollera att sabotaget träffade koden.
      >
      > **Grindar i slutläget:** 329 tester i 26 filer · typecheck rent · lint 0 fel (3 kända
      > `react-refresh`-varningar) · **e2e 105 passed** · bygge **727,78 KiB** precache,
      > JS 645,45 kB (gzip 194,48). Visuellt kontrollerat på 375 px i alla tre tillstånden.
      >
      > ✏️ **Här stod `e2e 102 passed`. Rätt tal är 105** — rutan skrevs innan nollregelns vakt
      > lades till, och uppdaterades inte. Hittat av `/code-review` 2026-08-29. **Det är sjätte
      > gången i rad ett skrivet antal blivit fel i det här projektet**; kör grinden själv.
      >
      > ### 🔍 `/code-review` kördes 2026-08-29, efter avbockningen
      >
      > Två kalla agenter mot `76dc2a6..HEAD`. **Åtta fynd, varav ett falskt.** De två axlarna
      > hittade **samma tyngsta fynd oberoende av varandra:** mätningen av muskelradens tak
      > gjordes aldrig, trots att uppgiften beställde den. Den är gjord nu — taket håller — och
      > det ändrar inte att rutan bockades av med ett obockat kriterium i sig.
      >
      > | # | Fynd | Utfall |
      > |---|---|---|
      > | 1 | Muskelradens tak aldrig mätt (**båda axlarna**) | ✅ Mätt 2026-08-29, taket håller |
      > | 2 | `summarizeHistory` upprepar passfiltret från `listWorkoutSummaries` (**båda axlarna**) | ⏰ **12.51** |
      > | 3 | Utfallsrutan sa `e2e 102`, rätt är 105 | ✅ Rättat ovan |
      > | 4 | Del B:s `Klart när` motsade sin egen brödtext | ✅ Omskrivet |
      > | 5 | `2b65caa` blandar funktion, vaktlagning och tryckytefix — regel 3 | ⏰ **12.51** |
      > | 6 | `EN_DYGN_MS` ska heta `ETT_DYGN_MS` | ⏰ **12.51** |
      > | 7 | `foga()`: `grupper[0]!` mot otypat `.at(-1)` | ⏰ **12.51** |
      > | 8 | ~~Muskelraden saknar `--color-dim`~~ | ❌ **FALSKT** — §3.2:s skiss annoterar rad 2 `--text-meta` och rad 3 `--color-dim`. Koden följer skissen |
      >
      > 💡 **Fynd 8 är värt lika mycket som de sanna.** En granskare läste en radannotering i en
      > ASCII-skiss som om den gällde hela blocket. **Verifiera varje fynd mot koden innan det
      > blir en uppgift** — annars hade rätt kod ändrats för att blidka en felläsning, vilket är
      > samma fälla som steg 4.2:s mätskript.

      Runda 1:s sista delsteg. **Ingen ny form uppfinns här** — B4 valdes 2026-08-12, väg C
      2026-08-14, och skissen står i `DESIGN.md` §3.2. Tre beteendefrågor var öppna; Adam
      avgjorde dem 2026-08-28. Resten är att flytta besluten in i koden.

      **Läs `DESIGN.md` §3.2 och "Genomgående mönster" för *varför*, inte den här rutan.**
      Här står vad som byggs, i vilken ordning, och vad varje del är klar när.

      ### ✅ Adams tre beslut 2026-08-28

      | Fråga | Valet | Skälet |
      |---|---|---|
      | Segmentet `Pass` / `Statistik`, när Statistik byggs först i 4.4 | **Byggs nu, med en tom Statistikvy** | *"om det går att bygga det nu även fast den är lite tom. men layouten är rätt så kanske det kan göras ändå."* |
      | Passkortets andra rad | **Muskelgrupper, som skissen** | Skissens form framför övningsnamnen |
      | Övningslistan längst ner | **Ligger kvar tills 4.5** | Den är enda vägen till en övnings historik för övningar som inte ingår i ett pågående pass |

      ⚠️ **Segmentfrågan ställdes med rekommendationen att vänta, och Adam byggde ändå.** Hans
      svar började med *"vet inte exakt"*, och **skälet han gav är layouten — inte innehållet.**
      Bygg därför den tomma vyn så att den är billig att ändra åsikt om: en vy, ingen
      rutt-struktur som 4.4 måste riva först.

      ⚠️ **Uppgiften byggs INTE i en commit.** Regel 3 — A, B och C är tre commits, och
      ordningen är inte godtycklig: A är den enda delen som rör datavägen, B och C är form.

      ---

      **A. Passraden: skissens tre rader, och `övn`-talet som inte finns.**

      | Rad | I dag | §3.2 |
      |---|---|---|
      | 1 | `tis 2 aug` till vänster, allt annat till höger | **`Tisdag 2 aug`** vänster, **`58 min`** höger |
      | 2 | övningsnamnen, `truncate` | **muskelgrupperna**, `--text-meta` |
      | 3 | finns inte | **`18 set · 5 210 kg · 5 övn`**, `--color-dim` |

      ⛔ **`5 övn` får INTE räknas ur `exerciseIds` som den ser ut i dag.** `history.ts:90-91`
      bygger listan ur **alla** setrader, uppvärmningar inräknade, medan `setCount` och
      `totalVolumeKg` åtta rader längre ner räknar utan dem (`history.ts:98`). En övning man
      bara värmt upp på och lämnat räknas alltså som en övning men bidrar med noll set och noll
      kilo — **tre tal ur två olika mängder på samma rad.** Det är exakt formen Adam förbjöd i
      **12.48** och exakt det §3.2:s egen varningsruta pekar på.

      **Åtgärden ligger i frågelagret, inte i skärmen.** `loggadeArbetsset` i
      `src/lib/worksets.ts` tar planrader (`loggedSetId`) och passar inte rakt av på `LocalSet`
      — antingen hittas den mindre primitiven, som i 12.42, eller så filtrerar
      `listWorkoutSummaries` **en gång** och härleder alla tre talen ur samma mängd.
      **Ett filter, tre tal.** Skriv inte om regeln i komponenten.

      **Muskelgruppsraden — källa och ordning:**
      - `primaryMuscle` för de övningar som har **loggade arbetsset** i passet. Samma mängd som
        `övn`-talet räknar: en mängd, tre tal och en rad, annars är vi tillbaka i samma fel.
      - Ordning: flest arbetsset först, lika antal bryts av vilken som kom först i passet.
        Raden ska säga vad passet **mest** var.

      **Formen — valen är mina, skälen skrivna, och Adam får ändra dem:**

      | Passets grupper | Raden |
      |---|---|
      | en | `Bröst` |
      | två | `Bröst och triceps` |
      | tre | `Bröst, triceps och axlar` |
      | fler än tre | `Bröst, triceps, axlar och 2 till` |
      | bara egna övningar | `Övrigt` — `createExercise` sätter `primaryMuscle: 'övrigt'` (`repo.ts:104`) |
      | inga arbetsset | raden utelämnas. Se nollregeln nedan |

      **Taket på tre namn är inte mätt, och det ska det bli.** Hela invändningen mot
      övningsnamnen var att de kapas mitt i ett ord; ett tak som ändå kapar löser ingenting.
      **Mät raden på 375 px när skärmen är byggd — kapas den, är taket två.**

      ✅ **MÄTT 2026-08-29 — taket håller.** Längsta möjliga rad,
      `Baksida lår, framsida lår, triceps och 2 till`, ger `scrollWidth` **327** mot
      `clientWidth` **327**: ingen kapning. Mätningen kontrollerades själv (påtvingad lång
      sträng gav 575/327). Talen bor i `src/lib/muskelgrupper.ts`.
      ⛔ **Mätningen gjordes INTE när rutan bockades av** — den kom först när `/code-review`
      påpekade det. Se rättelserutan i rubriken.

      ⛔ **Ett pass utan arbetsset får inte visa `0 set · 0 kg · 0 övn`.** §3.3:s regel gäller:
      *"aldrig en nolla: en nolla ser ut som ett resultat"*. Tillståndet är verkligt — starta
      pass, värm upp, gå hem — och blir vanligare, inte ovanligare, när **10.4** körs på riktigt.
      Passet visar då datum, tid och **en** fras (`Inga arbetsset`) i stället för tre nollor.

      **Pågående pass har ingen längd.** I dag står `Pågår` i `--color-ok-text` på en egen rad
      under rad 1. Det flyttar till **längdens plats till höger på rad 1** — det svarar på samma
      fråga och kostar ingen rad. Det ligger inne på det vita kortet, alltså väg C:s normalfall.

      **Klart när:** `listWorkoutSummaries` härleder set, volym och övningsantal ur **en** mängd,
      och ett enhetstest med ett pass där en övning bara har uppvärmningsset går **rött** om
      övningsantalet räknar den; muskelgruppsraden har ett test per rad i formtabellen ovan,
      `övrigt` och tomfallet inräknade; vakten i `e2e/historiksida.spec.ts` mäter fortfarande
      sitt påstående efter omskrivningen; och ett pass utan arbetsset visar ingen nolla.

      ⚠️ **Regel 2 (b) gäller här: raden byter datakälla, alltså är sabotaget obligatoriskt.**
      Den ärver hela källans filter, och ett grönt test bevisar ingenting förrän det setts bli
      rött. `historiksida.spec.ts` ankrar i dag på texten `80 kg`; överlever den formeln
      omskrivningen mäter den fortfarande sin sak — **det ska prövas, inte antas.**

      ---

      **B. Ytorna: kortet, sidrubriken, och sammanfattningen som har ett tak.**

      - **Passkortet:** vit yta, `--radius-card` (18 px), `--shadow-card`, **ingen ram**. I dag
        `rounded-lg border border-[var(--color-line)]`. Se "Genomgående mönster": separationen
        mot papperet är bara 1,19:1, och det är skuggan som bär avgränsningen på ljus botten.
      - **Indraget rörs inte.** Det kommer ur `px-3` på `<main>` i `AppShell.tsx` och gäller
        alla skärmar — Adams beslut i **12.45**.
      - **Sidrubriken:** `Historik` med sammanfattningen **till höger på samma rad** i
        `--text-meta`. I dag ligger den på egen rad under. Briefen är uttrycklig: *"Rubriken tar
        aldrig en egen rad för sig själv; skärmhöjd är dyrare än luft."* `h1` bär redan Fraunces
        och `--text-title` via elementregeln i `index.css`.

        ✏️ **HÄR STOD ATT `font-semibold` PÅ `h1` SKA BORT. Det var fel, och kontrollerat
        2026-08-28 innan det följdes.** `DESIGN.md` §2:s skala ger `--text-title` **vikt 600**,
        alltså är halvfet den beslutade vikten — inte en rest från det mörka temat.
        `TodayPage` sätter den likadant. **Klassen står kvar.** Att vikten sätts med en klass i
        stället för i `h1`-regeln är däremot samma sorts *ihågkommen* regel som `tabular-nums`
        och `font-family` redan slipper — noterat som **12.50**, inte gjort här.
      - ⛔ **`N pass` i sammanfattningen har ett tak på 50 och blir en lögn som aldrig ändrar
        sig.** Talet är `workouts.length` på en lista `listWorkoutSummaries(50)` redan kapat. Det
        syns inte i dag; efter ett år av loggning står det `50 pass` för alltid. Talet ska
        antingen räknas utan att gå via listan, eller sägas vara vad det är.
      - **Övningslistan ligger kvar** (Adams beslut) men **får samma formspråk**. Den bär i dag
        `rounded-lg border border-[var(--color-line)]`, alltså den ramade formen kortet just
        lämnat. Två kortspråk på en skärm är sämre än en gammal skärm.

      **Klart när:** inget **kort** på `/historik` ritar sin yta med `border-[var(--color-line)]`;
      rubrik och sammanfattning delar rad; `h1` bär briefens vikt; och ett test med **fler pass
      än frågans limit** går rött om sammanfattningens tal fortfarande är kapat.

      ✏️ **KRITERIET ÄR OMSKRIVET 2026-08-29 efter `/code-review`, och båda ändringarna är
      rättelser — inga uppmjukningar.** Här stod *"inget element … ritar en yta"* (avdelarna
      inuti övningslistan ritar med `--color-line` och **ska** göra det — bara kortens egna
      kanter var fel) och *"`font-semibold` finns inte kvar på `h1`"*, vilket uppgiften själv
      hade vänt på tio rader längre upp: `DESIGN.md` §2 ger `--text-title` vikt 600, alltså ska
      klassen vara kvar. **Ett kriterium som motsäger sin egen brödtext är värre än inget** —
      granskningen läste dem som två motstridiga krav, precis som en människa hade gjort.

      ---

      **C. Segmentkontrollen, och en tom vy som inte ser trasig ut.**

      Formen: **piller, hela bredden, aktivt segment `--color-fg` på `--color-surface`**
      ("Genomgående mönster"). `SPEC.md` §2b har hela tiden sagt två segment; det är
      implementationen som saknats.

      ⚠️ **Kontrollen hamnar på samma skärm som bottennavigeringens piller**, som också är ett
      piller i `--color-surface` men märker sitt aktiva val med `--color-accent`
      (`AppShell.tsx`). Två pillerkontroller med olika innebörd av *aktiv*. Briefen har redan
      skilt dem åt på färgen — **kontrollera att skillnaden syns i den renderade appen**, för
      det är den sortens fel bara ett öga hittar.

      🔍 **§7.1 gäller: sök innan du bygger.** Segmentkontrollen är delstegets enda nya kontroll.
      **Plattformsprimitiven är förstahandsvalet och ska prövas först:** en `radiogroup` av
      `<input type="radio">` med etiketter ger tangentbord, skärmläsare och `:checked` utan en
      rad JavaScript, och §7.1 säger uttryckligen att en primitiv slår ett bibliotek som gör
      samma sak. **Redovisa ändå vad sökningen gav** innan första raden skrivs, även om svaret
      blir "inget som passar".

      **Den tomma Statistikvyn:** Adam valde layouten, inte innehållet. Vyn ska säga vad som
      kommer och inte se ut som ett fel eller som något användaren orsakat.
      ⛔ **Flytta inte in sidsammanfattningen eller något annat "riktigt" för att fylla ut den.**
      4.4 ligger i runda 2 och kräver en egen grillning; det som byggs här utan den grillningen
      är sådant 4.4 får riva.

      **Klart när:** segmentet växlar vy; valet är **adresserbart** — Playwright ska nå
      Statistikvyn utan att klicka sig dit, och en omladdning ska landa på samma segment (rutt
      eller frågeparameter avgörs när den skrivs, skälet skrivs i filen); kontrollen går att
      använda med tangentbord; och den tomma vyn säger vad som kommer.

      ---

      ### Gemensamt slutvillkor för hela steg 4.3

      🔴 **Mät kontrasten i DOM:en — men nu finns vakten.** `e2e/kontrast.spec.ts` (12.36) mäter
      redan *Historik med ett loggat pass* som ett av fyra lägen. **Två saker gäller ändå:**
      filens egen kommentar säger att Historiks enda kanter är dekorativa avdelare och att
      kanträknaren därför är legitimt noll där — **det slutar gälla i samma stund
      segmentkontrollen finns.** Och **Statistiksegmentets vy är ett femte läge som inte mäts
      alls** om ingen lägger till det.

      ⏰ **12.40 avgörs här — men bara om fallet uppstår.** Frågan är om briefen behöver en
      kanttoken för semantiska element **direkt på papperet**. **Mätt före start: fallet uppstår
      antagligen inte.** Skärmens enda semantiska element är `Pågår`, och det ligger inne på ett
      vitt kort, alltså väg C:s normalfall. Uppstår inget andra fall ska **det skrivas ut i
      12.40** att 4.3 inte gav ett, och beslutet vänta till 4.4. Att fatta det mot ett enda fall
      är precis vad 12.40 ber oss låta bli.

      **Alla fem grindar gröna**, och skärmen visuellt kontrollerad i `preset: mobile`
      (375 × 812) i **tre tillstånd**: tomt, ett vanligt pass, och ett pass där en övning har
      uppvärmning som enda set. Det tredje är inte formalia — det är tillståndet del A finns för.

- [ ] **11B.1 Typografisk skala.** I dag används Tailwinds förval rakt av. Setraden ska vara
      största elementet på skärmen; allt annat underordnar sig den.
      **Klart när:** skalan är definierad i `index.css` och ingen komponent sätter egen storlek.
- [ ] **11B.2 `tabular-nums` överallt där siffror ändras.** Finns på setraden, saknas i
      historik och timer. Siffror som hoppar i sidled är svårlästa och känns billiga.
- [ ] **11B.3 Vertikal rytm.** Avstånden är i dag valda per komponent. Ska följa en skala.
- [ ] **11B.4 Tryckåterkoppling.** Ingen knapp har `:active`-tillstånd. Omedelbar kvittens
      är skillnaden mellan att lita på appen och att trycka igen.
      **Klart när:** varje tryckyta svarar synligt inom en bildruta.
- [ ] **11B.5 Rörelse. OMSKRIVEN 2026-08-12 — 150 ms-regeln gällde fel saker.**
      Setraden dyker upp abrupt. En kort inanimation gör att ögat hittar den nya raden.

      **Varifrån 150 ms kom:** en enda mening i `PLAN.md` (*"Allt över ~150 ms känns långsamt
      mitt i ett pass"*). Det är ett antagande, inte en mätning, och det skrevs om **setraden**.
      Sedan generaliserades det till hela appen utan att någon prövade om det borde gälla där.

      **Vad som gäller nu:** snabbt i **Pass**, uttrycksfullare i **Historik** och **Övningar**.
      Under ett set med skivstången i handen är väntan ren kostnad. När du bläddrar i historiken
      efteråt är samma 300 ms skillnaden mellan billigt och genomtänkt. Adam vill uttryckligen
      åt det håll Chris Raroque arbetar.

      **Inget bibliotek behövs.** Det som ger den känslan är CSS: knapp som krymper till ~97 %
      vid tryck, rad som glider in, färg som tonar. Plattformsprimitiver, noll kilobyte.

      ⚠️ **Haptik går sannolikt inte att få.** Raroques appar är native iOS och kan vibrera; vår
      är en PWA i iOS Safari, som saknar stöd för Vibration API. Samma familj av begränsningar
      som redan gjort bakgrundstimern opålitlig (se `src/timer/diagnostics.ts`).
      **Detta ska verifieras innan något byggs på det**, inte antas åt något håll.

      **Klart när:** Pass håller sig under ~150 ms, Historik och Övningar får röra sig mer, och
      haptikfrågan är avgjord med ett mätresultat.
- [ ] **11B.6 Tomma tillstånd.** Första passet är enda tillfället att lära ut fritextsyntaxen,
      och det tillfället används inte i dag.

      🔄 **UTÖKAD 2026-08-26: engångsförklaringen av snittalen hör hit, inte till 4.2.**
      Adams beslut. Med form 2B står snittvikten och snittrepsen som små grå siffror **utan
      rubrik**, och något måste säga vad de är första gången. Långtrycket byggs i 4.2, men det
      är osynligt tills man hittar det.

      ⚠️ **Varför den inte kunde byggas i 4.2:** ögonblicket finns inte. Appen har **varken
      registrering eller förstagångsflöde** — `src/main.tsx` slår fast att den ska fungera
      *"första gången appen öppnas, utan nät och utan konto"*, och inloggningen i Inställningar
      finns bara för synk. Adam föreslog *"precis när man har signat upp"*, vilket är rätt
      tanke men förutsätter något som inte är byggt. Att lägga det i 4.2 hade betytt att
      uppfinna ett förstagångsläge åt en enda tooltip.

      **Det hör hit för att den här uppgiften redan äger samma fråga och samma ögonblick:**
      vad appen lär ut vid första passet. Fritextsyntaxen och snittalen ska förklaras
      **tillsammans**, i samma mekanism — inte som två skilda lösningar på samma problem.

      **Klart när:** båda förklaringarna visas en gång vid första passet och aldrig igen, och
      långtrycket är vägen tillbaka till dem. Se `DESIGN.md` §3.1.
- [ ] **11B.7 Färgsemantik som system.** Grönt = sparat, gult = tvetydigt är i dag enstaka val.
      **Klart när:** betydelserna är definierade och kontrasterna håller mot **ljus** botten.
      ✏️ Här stod *"mot mörk botten"*. Överspelat av steg 4.1 — appen är ljus sedan 2026-08-26,
      och semantiken följer väg C, där betydelsen bärs av yta + kant i stället för av textfärg.
- [ ] **11B.8 Personbästa markeras när det slås.** Den starkaste återkopplingen en träningsapp
      kan ge, och nästan gratis när e1RM från fas 9 finns.
- [ ] **11B.9 Densitet.** Ett pass med 25 set ska gå att överblicka. Nuvarande radhöjd är vald
      för träffsäkerhet, inte för överblick — de två målen ska vägas mot varandra.

---

## Fas 13 — Import av Adams gamla anteckningar

Designad i en grillningssession 2026-08-07. Beslutet ligger i `PLAN.md` §3.5b, kravet i
`SPEC.md` §3c, orden i `SPEC.md` §3d.

**Fem kodändringar blir permanenta. Resten är ett engångsjobb som inte lämnar spår i appen.**
Fasen är oberoende av 11B och kan köras när som helst. **13.0 går före allt annat i fasen**,
och 13.1 måste vara klar före 13.6.

- [x] **13.0 Lokal data måste tillhöra ett konto.** Hittad av Adam 2026-08-09, samma dag som
      hans riktiga konto skapades i 13.6 steg 1. Han loggade in på det, och såg testkontots
      10 pass och 21 set ligga kvar — som om de var hans.

      **Diagnos (verifierad, inte gissad).** Servern är oskyldig: RLS isolerar korrekt, och
      `adambergkvist16@gmail.com` hade 0 pass och 0 set medan `test1@gym.se` hade 10 pass och
      21 icke-raderade set — exakt vad appen visade. Datan låg alltså kvar i telefonens
      IndexedDB. Tre orsaker, alla i koden:

      1. Den lokala databasen har **inget ägarbegrepp alls**. `db.ts` skapar en enda Dexie-bas
         vid namn `'gym'`, och `user_id` finns inte på någon rad i `src/db/` — enda träffen är
         kommentaren i `toWire.ts` som förklarar att fältet utelämnas *med flit* eftersom
         servern tar ägaren ur JWT:n. Det är rätt för uppladdning, och just därför vet den
         lokala datan inte vems den är.
      2. `signOut()` i `src/sync/auth.ts` anropar `client.auth.signOut()` och inget mer.
      3. Hämtningsmarkörerna `lastPulledAt:*` i `meta` överlever kontobytet.

      **Varför det är allvarligt och inte bara skräpigt.** Hämtade rader hamnar aldrig i
      utkorgen — `pull.ts` skriver direkt till Dexie — så ingenting hade läckt när buggen
      hittades. Men rör användaren en enda av de främmande raderna skapas en utkorgspost, och
      den skickas upp under **den nya** användarens JWT. `apply_mutations` tar ägaren ur token
      och skriver den utan invändning. Ingen felkod, ingen varning: testdatan blir tyst hans.
      Spökdatan läser dessutom fel konto under tiden.

      **Regeln.** `meta['userId']` sparas lokalt och jämförs vid varje inloggning:

      | Läge | Betyder | Åtgärd |
      |---|---|---|
      | `userId` saknas, **ingen** markör | Loggat i utloggat läge | **Adoptera** |
      | `userId` saknas, **markör finns** | Okänd tidigare ägare | **Rensa** |
      | `X → Y` | Kontobyte | **Rensa** |
      | `X → X` | Samma konto | Gör ingenting |
      | Utloggning | — | Rör ingenting |

      **Rad två är hela poängen, och den saknades i första utkastet.** Ett tomt `userId`
      betyder två oförenliga saker: *"jag loggade innan jag hann logga in"* (ska adopteras —
      det är hela vitsen med att appen fungerar utloggad) och *"ett annat konto fyllde
      databasen och lämnade den här"* (ska rensas). Markören skiljer dem åt utan att gissa:
      `lastPulledAt:*` sätts bara av `pull.ts`, alltså bara när någon varit inloggad. En
      hämtningsmarkör utan ägare betyder att basen fyllts av någon vi inte kan identifiera.
      Formulerad så är det en invariant som gäller för all framtid — inte ett engångsundantag
      för en telefon, och den behöver varken versionsflagga eller brytdatum.

      **Rensning sker vid inloggning, aldrig vid utloggning.** Rensade utloggning skulle
      osynkad offlinedata försvinna i samma sekund som en token gick ut — precis det som
      `auth.ts` inledande kommentar säger att appen aldrig får göra.

      **Vad som rensas står i `PLAN.md` §2.4** — listan hör hemma där, inte här, eftersom den
      måste gälla efter att den här uppgiften bockats av. Kort: `workouts`, `loggedSets`,
      `exercises`, `plans`, `parseLog`, `outbox`, samt `meta`-nycklarna `lastPulledAt:*`,
      `activeWorkoutId` och `profile`. `restTimer` och `timerDiagnostics` lämnas.
      **`meta` får alltså inte tömmas rakt av.** `resetPullCursors` finns redan.

      **Avvisat alternativ:** märka varje lokal rad med `userId` och filtrera i varje läsväg.
      Det vore att bygga flerkontostöd som ingen bett om — appen har en användare, och
      testkontona är enda anledningen att två identiteter någonsin rört samma telefon.

      **Klart när:** fem tester, ett per rad i tabellen ovan. Adoptionsfallet ska visa att
      lokalt loggade pass överlever första inloggningen, rensningsfallen att både rader och
      markörer är borta, och utloggningsfallet att ingenting rörs. Därtill ett test som visar
      att en osänd utkorgspost från ett annat konto aldrig skickas upp.

      **✅ Verifierat i skarpt läge 2026-08-09**, utöver de sju enhetstesterna. Adam körde
      kedjan för hand mot riktig Supabase: inloggning som `test1` (10 pass syntes,
      `lastPulledAt:workouts` = `2026-08-06T16:05:04`), utloggning (datan låg kvar, som
      designat), inloggning som han själv. Efteråt: Historik tom, `userId` omslaget, och
      **`lastPulledAt:workouts` och `:logged_sets` borta** — den avgörande observationen,
      eftersom `resetPullCursors` bara anropas inifrån `wipeForeignData`. `bänk 80x5`
      matchade Bänkpress, alltså överlevde katalogen omseedningen i rensningstransaktionen.
      Serverkontroll: hans konto innehöll exakt en rad — hans egen — och testkontots 10 pass
      och 25 set var orörda, utan en enda `updated_at` från den dagen.

      **Rättelse till testplanen: signatur 4 var felformulerad.** Planen sa att
      `lastPulledAt:exercises` skulle vara *nyhämtad* efter rensningen. Adam observerade att
      den stod kvar på test1:s gamla värde och ifrågasatte det — med rätta.

      **Orsaken:** markören sätts till högsta `updated_at` bland de hämtade **raderna**
      (`pull.ts`), inte till klockslaget då hämtningen skedde. Den globala katalogen seedades
      på servern `2026-07-31T15:40:32` och har inte ändrats sedan. Rensades markören hämtas
      katalogen om från epok och markören landar på just det värdet; rensades den inte
      returnerar frågan noll rader och värdet står kvar. **Identiskt observerbart i båda
      fallen** — signaturen kunde alltså inte skilja dem åt och bevisade ingenting.

      **Lärdomen, som gäller bredare än den här uppgiften:** en markör som speglar *datans*
      ålder duger inte som kvitto på att en *händelse* inträffat. Signatur 3 höll för att
      frånvaro av en rad bara kan orsakas av en radering.

- [x] **13.1 Migration: `workouts.is_imported` + `source = 'import'`.** En boolean med
      `default false`, och `logged_sets.source`-villkoret utökat med `'import'`. Speglas i
      `src/db/types.ts` och `toWire.ts`. `apply_mutations` i migration 0003 måste kunna
      skriva fältet, annars går ett importerat pass inte att synka tillbaka.
      **Klart när:** ett pass med `is_imported = true` kan skrivas, synkas ned och läsas.

      **✅ KLAR 2026-08-09. Migrationen körd av Adam och verifierad utifrån.**
      `supabase/migrations/0004_import_flag.sql` är applicerad på det skarpa projektet.
      Verifieringsfrågan nedan kördes i SQL-editorn i en egen session och gav:

      | Kontroll | Svar |
      | :---- | :---- |
      | `workouts.is_imported` | `boolean, nullable=NO, default=false` |
      | Check-villkor på `logged_sets.source` | **en rad:** `logged_sets_source_check → CHECK ((source = ANY (ARRAY['manual'::text, 'local_parse'::text, 'ai_parse'::text, 'import'::text])))` |
      | `apply_mutations` skriver `is_imported` | ✅ ja |

      Att det blev **exakt en** rad på andra kontrollen är den avgörande observationen:
      drop-mönstret träffade det gamla villkoret, och inget förbjudande villkor lever kvar
      bredvid det nya. Det var det enda som skilde "migrationen tog" från "migrationen såg ut
      att ta", och det är nu observerat — inte antaget.

      **Verifiering utifrån.** Självkontrollen inuti 0004 kan
      inte bevisa serverläget — den inspekterar tillstånd som skapades av satserna ovanför i
      samma transaktion, så den är ett skydd mot att filen skrivs fel, inget annat. Beviset
      hämtas i stället i en egen session, i SQL-editorn:

      ```sql
      select 'workouts.is_imported' as kontroll,
             coalesce((
               select format('%s, nullable=%s, default=%s', data_type, is_nullable, column_default)
               from information_schema.columns
               where table_schema = 'public' and table_name = 'workouts'
                 and column_name = 'is_imported'
             ), '❌ SAKNAS') as resultat
      union all
      select 'check-villkor på logged_sets.source',
             coalesce((
               select string_agg(conname || ' → ' || pg_get_constraintdef(oid), E'\n')
               from pg_constraint
               where conrelid = 'public.logged_sets'::regclass and contype = 'c'
                 and pg_get_constraintdef(oid) ilike '%source%'
             ), '❌ SAKNAS')
      union all
      select 'apply_mutations skriver is_imported',
             case when (
               select position('is_imported = excluded.is_imported' in
                 regexp_replace(pg_get_functiondef(p.oid), '--[^\n]*', '', 'g'))
               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = 'apply_mutations'
             ) > 0 then '✅ ja' else '❌ nej' end;
      ```

      Rad 2 är den viktiga och ska läsas, inte bara bockas av: den listar **alla**
      check-villkor på `source`, så ett kvarlämnat gammalt villkor syns som en extra rad.
      Godkänt är exakt ett villkor, och dess text ska innehålla `'import'::text` — Postgres
      lagrar `in (...)` som `= ANY (ARRAY[...])`, så det är den formen som visas.

      **Vad som är bevisat, exakt.** Nio vitest-tester täcker tre led: fältet når utkorgens
      payload (`repo.test.ts`), det översätts rätt åt båda hållen (`toWire`, `wire`), och ett
      hämtat pass med `is_imported = true` landar läsbart i Dexie (`pullChanges`).
      **Obevisat:** allt på serversidan. Migrationen har aldrig körts — det finns ingen
      Postgres på maskinen — så varken kolumnen, det utökade villkoret, `apply_mutations`
      eller filens egen självkontroll har exekverats en enda gång. De är lästa, inte prövade.

      **Ändringen ligger i en ny fil 0004, inte i 0003 som uppgiftstexten säger.** 0003 är
      redan applicerad på det skarpa projektet, och en redigering där hade inte nått
      databasen. Innehållet är detsamma: `apply_mutations` skrivs om i sin helhet med
      `is_imported` i `workouts`-grenen.

      **Villkorsnamnet gissas inte.** `logged_sets.source`-villkoret skrevs inline i 0001 och
      heter det Postgres döpte det till. Ett `drop constraint if exists`
      på ett gissat namn hade varit tyst verkningslöst och lämnat det gamla villkoret kvar
      bredvid det nya — fortfarande förbjudande `'import'`, med en grön självkontroll.
      0004 släpper i stället varje check-villkor på tabellen som nämner `source`.

      **En kontroll får inte kunna bli grön av sin egen kommentar.** Första utkastet av 0004
      sökte efter strängen `is_imported` i `pg_get_functiondef` — som bevarar kommentarer, och
      kroppen innehåller raden `-- NYTT I 0004: is_imported`. Kontrollen hade passerat även om
      båda de riktiga raderna tagits bort. Hittad av granskningen, inte av mig. Självkontrollen
      strippar nu radkommentarer först och kräver därefter två exakta kodfragment, ett per
      skrivväg. Villkorskontrollen ställer dessutom två frågor i stället för en: *finns ett
      villkor som tillåter import* och *finns inget kvar som förbjuder det* — den förra saknades,
      och utan den var en source-kolumn helt utan check ett godkänt resultat.

- [x] **13.2 Katalogen: dela `Chins` och `Pullups`.** Knogar bakåt (mot rumpan) = överhand =
      **Pullups**. Knogar framåt (dit ögonen tittar) = underhand = **Chins**.

      `Chins` behåller sitt UUID (`9f99d443-…`) — annars pekar redan loggade set fel — och får
      aliasen `chins`, `chin`, `underhandsgrepp`. Ny post `Pullups` får `pullup`, `pull-up`,
      `pullups`, `överhandsgrepp`. **Aliaset `räck` tas bort helt:** Adam, som är svensk och
      tränar, kände inte igen ordet. Ett alias som betyder två övningar gör `matchExercise`
      tvetydig med flit, och den är byggd för att aldrig gissa.

      Ändringen sker på två ställen som måste hållas i takt: migrationen (global katalog) och
      `src/db/catalog.ts` (klientens spegling med hårdkodade UUID:n).
      **Klart när:** `matchExercise('pullups')` ger Pullups, `matchExercise('chins')` ger
      Chins, och `matchExercise('räck')` ger `null`. Tre tester.

      **✅ Byggd 2026-08-10.** `supabase/migrations/0005_chins_pullups.sql` plus katalogen i
      `src/db/catalog.ts`. Pullups fick id `6b0a5be9-a1db-4373-84cc-5eab1fb0688a`, **skrivet i
      migrationen och inte genererat** — ett `gen_random_uuid()` hade gett servern ett annat id
      än det klienten bakar in, och synken hade sett två övningar med samma namn. De tre
      testerna ligger i `matchExercise.test.ts` och körs mot den **riktiga** katalogen, inte
      mot fixturen: påståendet som ska hållas är att just våra alias pekar rätt, och en fixtur
      med påhittade alias hade varit grön oavsett vad katalogen innehöll. Alla tre var röda
      före ändringen.

      **✅ MIGRATIONEN ÄR KÖRD OCH VERIFIERAD UTIFRÅN 2026-08-10.** Adam körde `0005` i
      SQL-editorn, och verifieringsfrågan i en egen session efteråt:

      | Kontroll | Svar |
      | :---- | :---- |
      | Antal globala övningar | **46** |
      | Pullups | `6b0a5be9-a1db-4373-84cc-5eab1fb0688a` · `{pullup,pull-up,pullups,överhandsgrepp}` |
      | Chins | `9f99d443-…` **oförändrat id** · `{chins,chin,underhandsgrepp}` |
      | `räck` i hela katalogen | **0 rader** |
      | Id-, namn- och alias-summa | alla tre matchar `catalog.ts` |

      Att verifieringen kördes i en **egen session** är poängen: självkontrollen inuti
      migrationen inspekterar tillstånd som dess egna satser just skapat, så den bevisar att
      filen är rätt skriven — inte att servern hamnat rätt. De två sista summorna kontrollerades
      dessutom utifrån efteråt, eftersom Adams fråga bara täckte aliassumman.

      **Läget före ändringen mättes också, innan något skrevs:** 45 rader, id-summa
      `4e361bd25fa3726585b88318df886e26` — exakt vad repot påstod. Repo och databas var alltså
      överens redan innan, vilket är förutsättningen för att de ska vara det efteråt.

      **En rättelse till mitt eget skäl.** Jag skrev att Chins måste behålla sitt id för att
      "redan loggade set pekar på det". Mätt i efterhand: **noll** set pekar på Chins i dag.
      Beslutet är ändå rätt — importen i 13.6 kommer att skapa historiska Chins-set, och ett
      id-byte hade då träffat data som fanns. Men skälet var hypotetiskt när det skrevs, och det
      ska stå som det var: en riktig regel, inte en observation.

      **Risken som fanns fram till körningen, för protokollet:** klienten seedar katalogen ur
      bygget, så Pullups syns i väljaren så fort appen byggs om — oavsett servern. Hade ett set
      loggats på den före migrationen hade främmandenyckeln på `logged_sets.exercise_id` fällt,
      och `push.ts` klassar det som permanent fel: posten markeras `failed` och **hela utkorgen
      blockeras**. Ordningen migration-före-deploy höll, så det inträffade aldrig.

      **Självkontrollen i 0005 är starkare än den i 0004, och det är inte en tillfällighet.**
      0004:s kontroll kunde bara bevisa att filen var rätt skriven — allt den inspekterade
      skapades av satserna ovanför i samma transaktion. 0005 räknar i stället kontrollsummor
      över **hela** den globala katalogen, inklusive de 44 rader den inte rör och som fanns före
      transaktionen. Stämmer de vet vi att repot och databasen är överens om varenda rad, inte
      bara om de två vi ändrade.

      **En tredje kontrollsumma tillkom: aliasen.** Granskningen påpekade att id- och
      namnsummorna inte hade märkt om en alias-array glidit isär — vilket är precis vad den här
      uppgiften handlar om, och det enda som märker det annars är parsern, tyst, genom att sluta
      hitta en övning som finns. `CATALOG_ALIAS_CHECKSUM` finns nu i `catalog.ts`, kontrolleras
      av både testet och 0005, och är mätt av Postgres på samma simulerade läge:
      `ce2e0ee411574e4a14111d3131b8be0a`. **Testet är prövat mot buggen:** byter man plats på
      `chins` och `chin` blir alias-testet rött medan id, namn och antal förblir gröna.

      **Hela migrationen ligger i ETT `do`-block, till skillnad från 0004.** Ett do-block är en
      sats, så en röd självkontroll rullar tillbaka varje skrivning blocket hunnit göra. Med
      satserna löst efter varandra hade en körning i autocommit — psql, inte SQL-editorn —
      kunnat lämna Pullups inlagd och Chins orörd. Ett halvt utfört kataloggrepp är värre än
      inget, eftersom nästa körning då startar från ett läge ingen beskrivit.

      **Känd begränsning, och den är äldre än uppgiften:** filen gäller det skarpa projektet,
      inte en färsk databas. `0001` seedar katalogen utan id:n, så en nyuppsatt databas får
      andra uuid:n än `catalog.ts` bakar in — då hittar `update` ingen Chins och summorna kan
      omöjligt stämma. 0005 avbryter, vilket är rätt utfall men inte en körbar uppsättningsväg.
      Problemet bor i `0001`:s seed och löses inte här. **Ligger som 12.15.**

      **`collate "C"` i summeringen är inte pynt.** JavaScript-testet sorterar teckenvis;
      Postgres standardkollation kan behandla bindestreck som osynliga. Två sorteringsordningar
      över samma 46 rader ger två olika md5, och felet hade visat sig som en trasig katalog i
      stället för en trasig jämförelse. Att de gav samma svar för de 45 gamla raderna
      kontrollerades — men det är tur, inte en garanti, och det nya id:t hade kunnat bryta den.

- [x] **13.3 Filter: importerade pass syns inte i passlistan.** `listWorkoutSummaries` i
      `src/db/history.ts` filtrerar bort pass med `isImported`.
      **Klart när:** ett test visar att ett importerat pass finns i databasen men inte i
      listan, medan ett vanligt pass i samma test gör det.

      **Gjort 2026-08-11.** Filtret ligger i samma `.filter()` som `!w.isDeleted` och alltså
      **före** `slice(0, limit)`. Ordningen är inte kosmetisk: importen lägger 17 pass i
      databasen, och hade filtret legat efter sliceningen kunde de ha fyllt hela limiten och
      lämnat passlistan tom. Ett andra test håller den ordningen på plats — ett importerat
      pass daterat 2099 med `limit = 1`.

- [x] **13.4 Filter: importerade set blir aldrig spökdata.** `getLastPerformance` i
      `src/db/repo.ts` hoppar över set med `source === 'import'`.

      **Varför det spelar roll:** raden `2024 vecka 14: Bänk: 90 kg` var ett 1-repsmax. Utan
      filtret viskar appen "sist tog du 90 kg × 1" varje gång bänkpress öppnas. Ett rekord är
      inte ett arbetsset, och spökdatan är ett minnesstöd — inte en utmaning.
      **Klart när:** ett test där enda tidigare setet är importerat ger `null` från
      `getLastPerformance`. Funktionen har tre anropare och alla tre ärver filtret.

      **Gjort 2026-08-11.** En `continue` i den befintliga loopen, bredvid `isDeleted` och
      `isWarmup`. Två tester: enda setet importerat ger `null`, och ett importerat set som
      ligger *senare* än ett riktigt hoppas förbi i stället för att stoppa sökningen. De tre
      anroparna (`plan.ts`, `ExerciseCard`, `ManualEntry`) ärver filtret utan ändring.

- [x] **13.5 Textrad om uppskattade datum ovanför övningsgrafen.** *"7 punkter före maj 2024
      är importerade från gamla anteckningar — datumen är uppskattade."* Visas bara när
      övningen faktiskt har importerade set.

      Medvetet **inte** en visuell markering i grafen (ihåliga prickar e.d.): det vore att
      införa ett nytt visuellt språk innan designbriefen i 11B är klar. Meningen är sann,
      syns, och kostar ingenting att ta bort när riktig design kommer.

      **Gjort 2026-08-11.** Meningen byggs av `importedNotice` i `src/lib/importNotice.ts` —
      en ren funktion med fem tester, medvetet lagd i `lib/` (nivå 0) och tagande en
      strukturell typ i stället för att importera `ExercisePoint`, så att skiktningen i
      ADR 0001 håller. `ExercisePoint` fick ett `isImported`-fält som underlag.

      Två detaljer som kostade eftertanke:
      - **Gränsmånaden räknas fram**, den står inte i koden: månaden efter den sista
        importerade punkten, så att en import daterad 4 april ger "före maj 2024".
        Årsskiftet rullar via `Date.UTC(år, månad + 1, 1)` och har ett eget test.
      - **Månadsnamnen är utskrivna** i stället för hämtade ur `toLocaleDateString`.
        Locale-data varierar mellan Node-byggen och webbläsare, och en mening som lyder
        olika i testet och i telefonen är värre än tolv rader data.

      Singularformen böjs (`1 punkt … är importerad … datumet är uppskattat`).

- [x] **13.6 ENGÅNGS: Adams konto och SQL-filen. KLAR i databasen 2026-08-12.**
      Lämnar inga spår i kodbasen.

      ### ✅ Verifierat mot produktionsdatabasen 2026-08-12

      Kontrollfrågan svarade **exakt** vad acceptanskriteriet krävde:
      `pass 19, antal_set 22`, bänkkurvan `70 → 75 → 80 → 85 → 90 → 95`.

      95 kg-raden kontrollerades separat och stämmer med filens avsnitt 3b i varje fält:
      `reps 1`, `set_index 0`, `is_warmup false`, `source 'import'`, passet `is_imported true`,
      datum `2025-12-01`.

      **Överlämningen var alltså fel.** Både kvällssektionen 2026-08-11 och toppsektionen
      2026-08-12 påstod att Adam inte kört om filen med 95 kg-tillägget. Datan säger att den
      är körd. Lärdomen är billig men värd att skriva ned: **fråga databasen innan du påstår
      något om dess innehåll**, även när ett handoff-dokument säger något annat.

      **Notistexten kontrollerades genom att köra den riktiga funktionen**, inte genom att
      resonera fram strängen. De 12 importerade bänkpunkternas datum hämtades ur databasen och
      matades genom `importedNotice()` i ett tillfälligt test som raderades efteråt. Utfall:

      > 12 punkter före januari 2026 är importerade från gamla anteckningar — datumen är uppskattade.

      **Bekräftat i appen av Adam 2026-08-12.** Bänkpress visar tyngsta set **95 kg**, och
      notisraden står ovanför grafen. Därmed är hela kedjan bevisad: SQL-filen → databasen →
      synken → gränssnittet. **Fas 13 är avslutad i sin helhet.**

      **Ordning (historik):** 1) Adam registrerar sig i appen med sin riktiga e-post — det måste
      han göra själv, konton och lösenord är inget jag rör. 2) Jag genererar
      `scripts/import-adam.sql` med hans `user_id` inlagt. 3) Han läser igenom den — 21 set,
      17 pass, läsbart i klartext.
      4) Han kör den i Supabase SQL-editorn, precis som migrationerna. 5) Appen synkar ned den.

      **Fasta UUID:n + `on conflict (id) do nothing`.** Körs filen två gånger händer ingenting
      andra gången. Rå SQL går utanför `apply_mutations`, så idempotensen (`CLAUDE.md` regel 4)
      måste byggas in i filen själv.

      **Tolkningsbeslut som ligger i filen:**
      - Ett syntetiskt pass **per vecka**, inte per rad. Tre veckor har två övningar i sig
        (v52 2023, v14 2021, v14 2024) och de delar pass. Undantag: de två `V 12`-bänkraderna
        var olika tillfällen — måndag respektive torsdag.
      - `Bänk`/`Bänkpress` → Bänkpress. `Squat`/`Squats` → Knäböj. `Sne bänk (första steget
        upp)` → Lutande bänkpress, **15°**. `pull ups` → Pullups, **0 kg** (appens konvention
        för kroppsviktsövningar). `Hacksquat + lila gummiband` → Adams egen övning
        `Hacklyft (med gummiband)`, skapad med `createExercise` — bandet gjorde lyftet
        *lättare*, så den får inte slås ihop med vanligt hacklyft.
      - **Utelämnas:** `Höj till 100 kg nästa och reppa` (en plan, inte ett set),
        `Vikt innan kreatin laddning` (minnesanteckning), och `70 kg * 8 V 3` — Adams bästa
        siffra på papperet, men han underkände den själv: *"det kändes som att jag fuskade"*.
        Den ligger kvar i `raw-notes.txt` om han ändrar sig. Alternativet vore att märka den
        som uppvärmning, vilket hade fungerat gratis eftersom uppvärmningsset redan filtreras
        ur personbästa — men det vore en osanning i databasen, och osanningar i en databas ser
        rimliga ut för alltid.

      **Klart när:** Adams bänkkurva 70 → 75 → 80 → 85 → 90 kg syns i appen på hans telefon.

      **Läge 2026-08-11: steg 1 och 2 klara, steg 3–5 är Adams.**

      Steg 1 gjordes redan 2026-08-09 — `adambergkvist16@gmail.com` finns i `auth.users`
      sedan 15:02 UTC den dagen, hämtat ur databasen, inte antaget. Steg 2 är gjort:
      `scripts/import-adam.sql` är genererad med hans `user_id` inlagt.

      **Filen är provkörd mot den riktiga databasen inuti `begin … rollback`.** Den skrev
      18 pass, 21 set och 1 egen övning över 5 olika övningar, självkontrollen passerade,
      och allt rullades tillbaka — kontrollfrågan efteråt visar 1 pass och 1 set på kontot,
      alltså bara hans egen riktiga användning. Syntax, främmandenycklar och check-villkor
      är därmed bevisade **utan** att en enda rad skrevs före hans genomläsning.

      **18 pass, inte 17.** `SPEC.md` §3c sade 17, vilket är antalet veckor med data. Vecka
      12 2024 rymmer två tillfällen och alltså två pass — undantaget som står utskrivet
      ovan. SPEC är rättad i samma commit; antalet set är oförändrat 21.

      **Steg 3 och 4 gjorda 2026-08-11.** Adam godkände tabellen över de 21 seten och körde
      filen. Kontrollfrågan svarade `pass 18, antal_set 21, bank_1rm 70 → 75 → 80 → 85 → 90`
      — hans egen körning, inte min. Fördelningen i databasen efteråt: Bänkpress 11 set,
      Knäböj 4, Hacklyft (med gummiband) 4, Lutande bänkpress 1, Pullups 1.

      **Sedan utökad till 19 pass och 22 set.** Vid genomläsningen sade Adam att han tagit
      **95 kg i bänk i december 2025** — det står inte i `raw-notes.txt`, som slutar i maj
      2024. Datumet sattes till första måndagen i månaden på hans anvisning (*"kör det som
      vanligt typ"*). Tillägget ligger i avsnitt 3b i SQL-filen, med de två antagandena
      utskrivna: **ett rep** (samma skrivsätt som anteckningarnas `Bänk: X kg`) och
      **`source = 'import'`** (kom inte in via appen, uppskattat datum — och ett max ska
      aldrig bli spökdata). Provkört i `begin … rollback`: 19 pass, 22 set, 12 bänkset,
      kurvan 70 → 75 → 80 → 85 → 90 → 95.

      **Kvar:** Adam kör om filen (de 21 första seten rörs inte — `on conflict do nothing`)
      och bekräftar i appen. Årtalen är en härledning och kan inte bevisas av någon fråga
      till databasen — det är den enda punkten i filen som vilar på ett resonemang i stället
      för en mätning.

---

## Fas 12 — Backlog (efter v1)

- [ ] **12.1 Export till JSON och CSV.**
- [ ] **12.2 Rutiner och mallar** (`routines`, `routine_exercises` — additivt).
- [ ] **12.3 Volym per muskelgrupp och vecka.**
- [ ] **12.4 MCP-server (spår 2)** — när Supabase stöder autentiserad MCP.
- [ ] **12.5 Superset och dropset.**
- [ ] **12.6 Jämför Groq mot Gemini på samma indata** med `ai_parse_log` som underlag.
- [ ] **12.7 Personligt anpassat 1RM i stället för Epley.** Efterfrågat av Adam 2026-08-01
      efter att ha sett e1RM-siffrorna: *"frågan är bara om det är så accurate"*.

      **Han har rätt att tvivla.** Epley är en **populationsformel** — den antar att alla har
      samma förhållande mellan maxstyrka och uthållighet. Det stämmer inte: vissa är
      rep-starka och får sitt max systematiskt underskattat, andra tvärtom. Felet är alltså
      inte slumpmässigt utan konsekvent åt samma håll för en given person, vilket är värre
      än brus eftersom det ser stabilt ut.

      **Vad formeln ändå duger till:** att jämföra dina egna set med varandra över tid.
      Trenden är meningsfull även när nivån är fel — och det är trenden grafen visar.
      **Vad den inte duger till:** att påstå vad du faktiskt lyfter.

      **Åtgärden:** anpassa kurvan efter användarens egen data. Med tillräckligt många set
      över olika rep-intervall går exponenten att skatta individuellt i stället för att
      antas. Kräver data över tid, vilket är precis vad appen nu samlar in.
      **Klart när:** e1RM räknas med en personlig parameter när underlaget räcker, och
      faller tillbaka på Epley när det inte gör det — med skillnaden **synlig i UI:t**, så
      att en anpassad siffra aldrig förväxlas med en antagen.

- [ ] **12.8 Kroppsvikt — hela funktionen.** `SPEC.md` §3b säger att kroppsvikt ska sparas,
      men **ingenting är byggt**: ingen tabell, ingen RLS, ingen lokal lagring, ingen synk,
      ingen vy. Adam har ~100 rader kroppsvikt i `raw-notes.txt` som väntar på den.

      **Det är ingen import, det är en funktion** — och den har egna oavgjorda frågor som
      måste grillas innan något byggs: hans rader har **två mätvärden samma dag**
      (`7 april: 78,3 (77,6 post shit)`), ibland ett tredje (`5 maj kvälls vikt`), och
      perioderna `Deff 2025` / `Sommar bulk 2026` är ett begrepp appen inte har.
      **Nästa steg: en egen grillningssession.** Inte kod.

- [ ] **12.9 Import-UI för nya användare.** Klistra in egna anteckningar, låt AI:n tolka, fråga
      användaren när något är otydligt. Onboarding-värde för **andra** än Adam — han har redan
      sin data via Fas 13. Uttryckligen låg prioritet: *"we need to focus on getting the most
      important functions in the app to begin with"*.

- [ ] **12.10 Gradval på lutande bänkpress.** Adam vill vara exakt när han loggar: 15°, 30°,
      45° som egna övningar — **plus** en generisk `Lutande bänkpress` för den som bara vill
      logga så. *"Angled bench press is angled bench press for themselves, and they know what
      they usually do."*

- [ ] **12.11 Beskrivningsfält på egna övningar.** `createExercise` tar bara ett namn, och
      `exercises` har ingen `description`-kolumn. Adams poäng: hittar man inte sin övning ska
      man kunna skapa den **med en förklaring** av vad den är — särskilt för utrustning som
      bara finns på ett visst gym.

- [ ] **12.12 Extravikt på kroppsviktsövningar.** Adam: *"maybe the kg shouldn't even be an
      option, or perhaps it should be an add-on kg if someone adds 5, 10, 15 kg while
      hanging."* I dag loggas kroppsviktsövningar som 0 kg, vilket gör ett bälte med 15 kg
      omöjligt att skilja från ett rent set. Frågan är om vikten ska betyda *tillagd* vikt när
      övningens utrustning är `kroppsvikt`.

- [x] **12.13 Genomgång av kodbasens struktur.** Adam 2026-08-07: *"I felt that the codebase
      was kind of messy. I don't know where things are and how they should work."*

      **Det är inte nödvändigtvis sant att den är rörig** — det kan lika gärna vara att den
      växt utan att någon skrivit en karta. Uppgiften är därför att **först ta reda på vilket
      det är**, inte att börja flytta filer. En orienteringskarta över `src/` (vad varje mapp
      ansvarar för och vad som anropar vad) kan visa sig vara hela åtgärden.

      **Avgjord 2026-08-11: strukturen är inte rörig. Den är omappad.**

      Beroendegrafen över `src/` är **acyklisk** och skiktad i fem nivåer:

      ```
      nivå 0 (löv)  lib, parser      importerar ingenting utanför sig själva
      nivå 1        db               → parser, lib
      nivå 2        sync, timer      → db, parser
      nivå 3        ai               → sync, db, parser, lib
      nivå 4        ui               → alla ovan
      ```

      **Verifierat genom uttömmande sökning, inte stickprov.** Inga bakåtkanter existerar:
      `db` importerar aldrig sync/ai/ui/timer, `sync` aldrig ai/ui, `ai` aldrig ui, och
      `lib`/`parser` importerar ingenting alls över mappgräns. Varje funktion i `db/` tar
      dessutom `database: GymDatabase = db` som sista parameter — ett konsekvent genomfört
      seam som gör hela datalagret testbart utan mockning.

      **Följd: ingen omstrukturering ska göras.** Det fanns ett stående förslag att bryta upp
      `src/` i en `src/packages/<namn>/`-layout. Det förslaget har inget problem kvar att
      lösa och avförs härmed. Se `docs/adr/0001-ingen-omstrukturering-av-src.md`.

      **Vad känslan av rörighet faktiskt kom av:** de sex `index.ts` som deklarerar strukturen
      är tomma och beskriver byggd kod som ogjord. Det blir uppgift 12.17.

      **Sidofynd som genomgången hittade:** volymen räknas på två sätt (12.16). Den hade inte
      upptäckts utan kartläggningen.

- [x] **12.14 `META_CATALOG_VERSION` är död kod. KLAR 2026-08-29.** Konstanten `catalogChecksum` deklareras i
      `src/db/types.ts` men används ingenstans — `grep -rn "META_CATALOG_VERSION\|catalogChecksum" src/`
      ger bara deklarationen. Hittad 2026-08-09 under arbetet med 13.0, när rensningen behövde
      veta hur katalogen laddas om.

      **Varför det är värt en rad och inte bara en radering:** namnet antyder en
      versionsmekanism som inte finns. `ensureCatalog` gör ett ovillkorligt `bulkPut` av hela
      den hårdkodade katalogen vid varje appstart och konsulterar aldrig någon checksumma.
      Nästa person som läser `types.ts` drar rimligen slutsatsen att omseedningen är villkorad,
      och den slutsatsen är fel. En konstant som beskriver något appen inte gör är sämre än
      ingen konstant alls.

      **Frågan att avgöra först:** är ovillkorlig omseedning vid varje start ett verkligt
      problem? Är det inte det — och inget tyder på det, det är ett `bulkPut` av ett
      trettiotal rader — ska konstanten bara bort. Är det det, är det en egen uppgift.
      **Klart när:** antingen är konstanten borta, eller så finns en uppgift som beskriver
      vad den skulle användas till.

      ✅ **Utfall 2026-08-29: konstanten borta.** Frågan var redan besvarad i koden —
      `ensureCatalog` (`repo.ts:61`) motiverar sitt `bulkPut` med *"idempotent, och en ändrad
      katalog i ett nytt bygge slår igenom utan migrationssteg"*. Ovillkorligheten är alltså
      **designen**, och konstanten antydde en grind som medvetet valts bort. Ingen ny vakt:
      `tsc` fångar varje användning av en konstant som inte finns.

- [ ] **12.15 Migrationskedjan går inte att köra på en ren databas.** `0001` seedar den globala
      katalogen med `insert into public.exercises (owner_id, name, aliases, …)` — **utan id:n**,
      så Postgres genererar dem. `src/db/catalog.ts` bakar samtidigt in exakt de 46 uuid:n som
      råkade genereras i det skarpa projektet den 2026-07-31.

      **Följden:** en nyuppsatt databas får 46 andra uuid:n, och då är repot och den databasen
      oförenliga från första sekunden. Klienten seedar sin katalog ur bygget, servern sin ur
      migrationen, och synken ser två uppsättningar av samma övningar. Uppdagat 2026-08-10 av
      granskningen av 13.2, som påpekade att `0005` inte kan gå igenom på en färsk databas:
      dess `update … where id = '9f99d443-…'` träffar noll rader.

      **Att 0005 avbryter är rätt beteende och ska inte "lagas" genom att mjuka upp den.**
      Kontrollsummorna gör felet högljutt i stället för tyst, och tyst är det dyra läget —
      alternativet är 46 dubbletter som ingen upptäcker förrän katalogen är obrukbar.
      Symptomet sitter i `0001`, inte i `0005`.

      **Varför det är ett riktigt hinder och inte teori.** Utan detta finns ingen väg till en
      ren databas: inget lokalt utvecklingsläge mot Postgres, ingen Supabase-branch för att
      pröva en migration innan den körs skarpt, och ingen återställning om produktionen skulle
      behöva sättas upp på nytt. I dag prövas varje migration i praktiken direkt i skarpt läge,
      och det är hela skälet till att 0004 och 0005 måste bära så tunga självkontroller.

      **Fixen är liten men rör en applicerad migration.** `0001`:s seed skrivs om till explicita
      id:n hämtade ur `catalog.ts`, med `on conflict (id) do update`. Den får INTE redigeras på
      plats — `0001` är redan körd på det skarpa projektet, så en ändring där når aldrig
      databasen och gör bara filen osann. Ett `0006` som stämmer av befintliga rader, eller en
      separat seedfil som bara körs på nya databaser, är vägarna att välja mellan.
      **Klart när:** en tom Postgres kan köra `0001` → `0005` i följd och sluta med gröna
      kontrollsummor, alltså samma katalog som `catalog.ts` påstår.

- [x] **12.16 Volymen räknas på två sätt, och skärmarna visar olika siffror.** Hittad
      2026-08-11 av strukturgenomgången i 12.13.

      Två interface med **samma namn** `WorkoutSummary` bor i samma mapp:

      | | Fil | Volymen | Konsument |
      |---|---|---|---|
      | A | `src/db/repo.ts:344` | `sets.filter(s => !s.isWarmup)` före summering | `TodayPage` |
      | B | `src/db/history.ts:14` | `rows.reduce(…)` — **ingen** filtrering | `HistoryPage` |

      Båda anropar samma `volumeKg` från `src/lib/oneRepMax.ts`. Skillnaden sitter i
      filtreringen, och den gör att **samma pass visar olika volym** beroende på skärm.

      **Att det är ett förbiseende och inte ett beslut syns i history.ts själv:** filen
      filtrerar bort uppvärmningsset på rad 112 (`getExerciseHistory`) och rad 132
      (`getPersonalRecords`) — men inte på rad 72. Regeln är alltså redan etablerad i filen
      och tillämpad överallt utom där. `repo.ts:365` motiverar den uttryckligen: *"att blanda
      in dem gör siffran obrukbar för jämförelser mellan pass."*

      **Riktningen är därför given:** B rättas till A:s regel, inte tvärtom. Namnkrocken bör
      lösas i samma veva — två typer med samma namn i samma mapp är en navigationsfälla
      oavsett buggen.

      **Klart när:** ett pass med uppvärmningsset visar samma volym på startskärmen som i
      historiken, med ett test som skulle fånga en återkommande divergens.

      **Åtgärdad 2026-08-11.** Adam avgjorde riktningen: uppvärmning räknas inte som volym.
      `history.ts` filtrerar nu `!s.isWarmup` före summeringen, som repo.ts och som de två
      andra ställena i samma fil. `setCount` räknar fortfarande alla set — de gjordes.

      > ✏️ **RÄTTELSE 2026-08-27 (uppgift 12.48): sista meningen gäller inte längre.**
      > `setCount` räknar numera bara arbetsset, både i `listWorkoutSummaries` och i
      > `summarizeWorkout`. **Beslutet var inte fel när det fattades** — "de gjordes" är ett
      > hållbart svar på frågan isolerat. Det som ändrade svaret var att 12.44 visade vad
      > talet står BREDVID: historikraden lyder `N set · M kg`, och när bara det ena talet
      > utesluter uppvärmningen läses raden som två påståenden om samma mängd. Adam avgjorde
      > 2026-08-27 att regeln ska vara densamma överallt.

      Testet skrevs först och var rött med **1350 mot 950**; differensen 400 var exakt
      uppvärmningssetets 40×10. Två tester tillkom: ett för regeln, ett som jämför
      `listWorkoutSummaries` mot `summarizeWorkout` direkt så att en framtida divergens
      säger till i CI i stället för på Adams skärm.

      **Verifierat:** 261 tester gröna, typecheck, lint och bygge rena.

      **Kvarstår, upptäckt under arbetet — se 12.18:** en andra divergens som inte har med
      uppvärmning att göra. `history.ts:94` avrundar volymen till heltal, `repo.ts:378` gör
      det inte.

- [x] **12.18 Volymen avrundades bort halvkilot.** Läst ur koden 2026-08-11 under arbetet
      med 12.16.

      **Första beskrivningen av den här uppgiften var fel och rättades innan den åtgärdades.**
      Den påstod att startskärmen visade 462,5 och historiken 463. Så var det inte:
      `TodayPage` hade en egen `formatVolym` som gjorde `Math.round` vid utskrift, så **båda
      skärmarna visade 463**. Felet fanns, men avrundningen skedde på två olika ställen —
      dataskiktet respektive visningsskiktet — och divergensen var därför osynlig. Läxan är
      att följa siffran hela vägen ut till skärmen innan man beskriver vad användaren ser.

      **Adams beslut:** volymen ska ha decimal. Man lägger på 2,5 kg-skivor, så halvkilon är
      verkliga vikter och inte mätbrus; att avrunda bort dem gör två olika pass till samma
      siffra.

      **Tre ändringar, inte en:**

      1. `history.ts` returnerar summan orörd — `Math.round` borta.
      2. `TodayPage`:s lokala `formatVolym` ersatt av delad `formatVolume` i `lib/steps.ts`.
      3. `HistoryPage` använder samma formaterare i stället för ett inlinat
         `toLocaleString`.

      `formatVolume` skiljer sig från `formatWeight` genom tusentalsavgränsaren — volymer blir
      fyrsiffriga direkt, och `1 310` är läsbart där `1310` inte är det.

      **Personbästa krävde ingen ändring.** `formatWeight` gav redan "92,5" och "101,3".

      **Verifierat 2026-08-11:** regressionstestet använder nu 92,5 kg och låser 962,5;
      264 tester gröna, **30 e2e gröna** (volymsträngen blev bredare, och
      `no-horizontal-overflow` passerar ändå — relevant efter 11A.8), typecheck, lint och
      bygge rena.

- [x] **12.19 `formatWeight` finns i två exemplar.** Hittad 2026-08-11 under 12.18.

      `src/lib/steps.ts:57` exporterar den, och `src/ui/pages/ExercisePage.tsx:15` har en
      teckenidentisk lokal kopia som filens fem anropsställen använder i stället. Kopian har
      inga egna tester; `lib`-versionen har tre.

      **Varför det är värt en rad:** de är identiska i dag, vilket är precis när dubbletter är
      farligast — nästa ändring av formateringen görs på ett ställe och syns inte på det
      andra. Övningssidan är dessutom den enda skärm där halvkilon syns oftast.

      **Klart när:** `ExercisePage` importerar från `lib/steps` och den lokala kopian är
      borta, med grindarna gröna.

      **Åtgärdad 2026-08-11.** Kopian borta, importen på plats. En sökning efter
      `Number.isInteger(kg)` och `toFixed(1).replace` ger nu en enda träff i hela `src/` —
      `lib/steps.ts:58`.

      **Verifierat i webbläsare, inte bara av grindarna.** `ExercisePage` har varken
      enhetstester eller e2e-täckning, så typecheck och bygge hade inte fångat en trasig
      rendering. WebKit på 393 px, med ett riktigt 92,5-set inloggat via fritexten:
      tyngsta set **92,5 kg × 5**, bästa e1RM **107,9** — decimalerna kommer alltså fram
      genom den delade formateraren. Inga konsolfel. 264 tester, typecheck, lint och bygge
      rena.

      **Kvarstående lucka, inte åtgärdad här:** övningssidan är fortfarande otestad. Den
      ligger under samma paraply som kandidat 3 i strukturgenomgången (`ui/` — 21 källfiler,
      0 testfiler).

- [x] **12.17 Radera de sex tomma `index.ts`.** Följer direkt ur 12.13.

      `src/{db,lib,parser,sync,timer,ui}/index.ts` innehåller alla `export {}` plus en
      kommentar av typen *"Byggs i fas 7"*. Faserna 4, 5, 6 och 7 är byggda. `src/ai/` har
      aldrig haft någon `index.ts`, vilket säger något om hur underhållna de var.

      **Noll importer i hela `src/` går via en barrel** — verifierat. Inga `tsconfig`-paths,
      inga Vite-alias. (`from './db'` inuti `src/db/` resolverar till filen `db.ts`, aldrig
      till `index.ts`.)

      **Varför radera i stället för att fylla dem.** Att fylla dem hade betytt ~60 ändrade
      importrader utan en enda beteendeändring, och resultatet hade blivit barrelfiler som
      re-exporterar hela mappen — precis den form `/setup-ts-deep-modules` uttryckligen
      avråder från. Principen *"en adapter = hypotetiskt seam, två = verkligt"* avgör saken:
      ingenting varierar över ett `src/db`-barrel, så seamet vore hypotetiskt.

      **Att låta dem ligga är inte ett alternativ.** En tom fil som påstår att fas 7 ska
      byggas får nästa läsare — människa eller agent — att dra fel slutsats om vad som är
      gjort. Deletion-testet: de exporterar ingenting och importeras av ingen, så
      raderingen flyttar ingen komplexitet någonstans.

      **Klart när:** de sex filerna är borta och `npm run typecheck && npm test && npm run
      lint && npm run build` är gröna.

- [x] **12.20 `ui/` har noll tester — täck det med e2e, inte med enhetstester. KLAR 2026-08-13 (kväll).**
      Upplagd 2026-08-11 på Adams fråga *"vet inte själv alls hur man bygger lämpliga tester
      för ui"*. Svaret är att det går, men inte på det sätt man först tänker.

      **Problemet är mätt, inte anat.** `src/ui/` är 21 källfiler och 0 testfiler. Tre gånger
      på tre sessioner (12.19, 12.16/12.18, 13.5) har en webbläsare fått startas för hand för
      att bevisa något ett test borde bevisat. `ExercisePage` kan sluta rendera helt utan att
      typecheck, lint eller bygge säger ett ord.

      **Varför e2e och inte enhetstester på komponenterna. OMSKRIVET 2026-08-12 (kväll) — det
      gamla skälet var falskt.** Slutsatsen står kvar, men den vilade på ett påstående som inte
      höll, och ett argument som råkar leda rätt är fortfarande ett dåligt argument.

      **Det som bär:** vakt B mäter **layout** — får sidan plats på 375 px, sticker något
      utanför. Layout kan bara mätas i en riktig renderingsmotor. I jsdom har ingenting någon
      storlek, så varje mått ljuger. Playwright finns redan och kör riktig WebKit på tre
      mobilbredder. Vakt A hade kunnat köras som komponenttest, men att underhålla två
      testfordon för att vinna lite fart på halva sviten lönar sig inte — och det hade kostat
      en post i `package.json`, vilket den här uppgiftens eget "Klart när" förbjuder.

      ⚠️ **TRE påståenden i den här uppgiften var fel. Två rättades 2026-08-12 (dag), det
      tredje samma kväll under grillningen av 11B.0e.**

      1. **`jsdom` saknas inte.** Det ligger redan i `package.json` (`^28.0.0`) — och används
         av ingenting. Kontrollerat mot `src/`, `e2e/`, `scripts/` och `playwright.config`:
         `vite.config.ts:63` sätter `environment: 'node'` och ingen fil åsidosätter det. Det
         enda beroende ett komponenttest faktiskt hade krävt är `@testing-library/react`.
         Att jsdom ligger oanvänt är värt en egen städuppgift.
      2. **Sådd via `page.evaluate()` är inget bevisat mönster i sviten.** Alla fyra
         `evaluate()`-anropen i `e2e/` är **avläsningar** — mått, scroll, overflow. `bottenark`
         sätter i stället upp sitt läge genom att **klicka sig genom UI:t**. Det som gjordes i
         13.5 var en handpåläggning mot dev-servern (`HANDOFF.md`: *"seedad IndexedDB …
         seedraderna raderades efteråt"*), inte något automatiserat. Tekniken fungerar alltså,
         men det som är prövat i repot är **noll nya sömmar** — inte en.
      3. **"Ett jsdom-test hade mätt en attrapp av databasen" är fel.** `fake-indexeddb` ligger
         i `package.json` och importeras av **nio testfiler** (`import 'fake-indexeddb/auto'`),
         som sedan kör `createTestDb()` från `db.ts:61`. Det är riktig Dexie mot riktig
         IndexedDB-semantik i node — exakt den stack 274 gröna tester redan står på. Ingen
         attrapp någonstans. Det enda som saknades för ett komponenttest var
         `@testing-library/react`, precis som rättelse 1 säger. **Skälet som kallades "det som
         bär" bar alltså ingenting.** Slutsatsen (e2e) står kvar, men på ett annat skäl — se
         ovan.

      **Följden för 11B.0e — AVGJORD 2026-08-12 (kväll), se 11B.0e för hela beslutet.**
      Det påstådda vägskälet visade sig ha ett ben som inte leder någonstans: `repo.ts:156`
      hårdkodar `isImported: false`, och `true` kan bara komma in via synken (`wire.ts:37`).
      **Ett importerat set går alltså inte att skapa genom att klicka i appen**, vilket gör
      punkt 3–5 nedan omöjliga att seeda den vägen. Beslutet blev: **testet skriver rått i
      IndexedDB och laddar om sidan** — noll ny kod i appen — och **bara det importerade setet**
      seedas så. Faller prövningen byggs ett såddinsläpp bakom `import.meta.env.DEV`.

      **Selektorer:** `role` + tillgängligt namn, som båda befintliga specar redan använder.
      `data-testid` bara där tillgängligt namn saknas. 12.22 rör ingen knapptext, bara brödtext,
      så texten är stabil nog — men **punkt 3 nedan påstår att notisen syns, aldrig dess
      lydelse**.

      **Det som ska automatiseras är exakt det jag gjorde manuellt 2026-08-11:** seeda sju
      importerade bänkset plus ett riktigt, öppna `/ovning/<id>`, och läsa av sidan.

      **Vad som är värt att påstå i ett test — och vad som inte är det.** Inga
      pixeljämförelser och inga skärmdumpsdiffar: de blir röda av en typsnittsuppdatering och
      lär en att ignorera rött. Testa **text och tal**, alltså det sidan påstår:
      1. Övningssidan renderar över huvud taget (rubrik = övningens namn).
      2. Tyngsta set och bästa e1RM visar rätt siffror med decimal — regressionsvakt för 12.18.
      3. Importnotisen syns när importerade set finns, och **inte** när de saknas (13.5).
         ⚠️ **Påstå att den syns — aldrig vad den lyder.** 12.22 skriver om just den meningen.
      4. Passlistan visar det vanliga passet men inte det importerade (13.3).
      5. `FÖRRA`-kolumnen är tom när enda tidigare setet är importerat (13.4).
      6. Inga konsolfel under hela flödet.

      Punkt 3–5 är de intressanta: de täcker precis de filter som i dag bara har
      enhetstester på datalagret, och som alltså kan vara rätt i `db/` och ändå fel i UI:t.

      **Klart när:** `e2e/ovningssida.spec.ts` finns, kör grönt i CI, och en avsiktligt
      trasig `ExercisePage` (t.ex. borttagen importnotis) gör den röd. Noll nya poster i
      `package.json`.

      **Grillningen är gjord 2026-08-12 (kväll)** — den låg som förutsättning här och kördes
      som en del av 11B.0e. Adam 2026-08-11: *"behövs väl allmänt sen en grill session för varje
      stor viktig uppgift"*. Frågan var vilka påståenden ovan som är värda underhållskostnaden.
      **Svaret blev alla sex**, och skälet är att varje rad skyddar en bugg som redan bitit
      (12.18, 13.3, 13.4, 13.5) — de är ärr, inte gissningar. Marginalkostnaden efter den första
      är låg, eftersom alla delar samma uppsättning.

      ✅ **Prövningen är gjord 2026-08-12 (kväll) och metoden håller.**
      `e2e/sadd-provning.spec.ts` bevisar att en rå IndexedDB-skrivning följd av **färsk
      navigering** syns på sidan, grönt på alla tre bredder. Fallbacken behövs inte — inget
      såddinsläpp byggs.

      ⚠️ **Regeln som föll ut, och som inte får glömmas när de sex vakterna skrivs:** sådd mot en
      **öppen** sida når aldrig fram, eftersom `useLiveQuery` bara ser skrivningar genom Dexies
      API. **Varje test måste alltså seeda först och navigera sedan.** Hoppas det över står
      sidan tom och felet läser som en trasig läsväg. Det andra testet i prövningsfilen låser
      fast det beteendet — sedan 12.25 med ett vänt påstående i stället för `test.fail()`.
      Hela mätningen står i 11B.0e.

      ✅ **STATUS 2026-08-13 (kväll): alla sex vakterna är byggda och granskade.** Sviten kör
      **60 tester** gröna på alla tre bredder (51 vid dagens början). Vakterna bor i tre filer:
      `e2e/ovningssida.spec.ts` (1, 2, 3a, 3b, 6), `e2e/historiksida.spec.ts` (4) och
      `e2e/passvy.spec.ts` (5a, 5b).

      **Varje vakt är sabotageprövad, inte bara sedd grön.** Det är det enda som skiljer en
      vakt från en rad som råkar vara grön:

      | Vakt | Sabotaget som gjorde den röd |
      |---|---|
      | 2 | `formatWeight` ändrad till att avrunda — `92,5` blev `93`, alltså 12.18 igen |
      | 3b | Notisen tvingad att alltid visas |
      | 4 | `!w.isImported` borttaget ur `listWorkoutSummaries` → `Expected 1, Received 2` |
      | 5a, 5b | `source === 'import'`-filtret borttaget ur `getLastPerformance` → `Förra` visade `82,5 × 5` i stället för det app-loggade setet |
      | 6 | Ett `console.error`, och separat ett okastat undantag i en `setTimeout` |

      ⚠️ **SABOTAGET AVSLÖJADE ETT FEL I VAKT 4 SJÄLV, och det är lärdomen värd att behålla.**
      Vakten föll först på sitt **ankare** i stället för på sin negation: Playwrights `hasText`
      matchar **delsträngar**, och `180 kg` innehåller `80 kg`. Ankaret träffade båda raderna
      och dog på strict mode. Att bara byta siffror hade lämnat fällan kvar åt nästa person —
      negationen räknar därför **rader i passlistan** i stället för att söka text. Ett antal är
      en identitet; en delsträng är en gissning.

      ⚠️ **Vakt 6 krävde TVÅ lyssnare, och sabotaget bevisade varför.** Det okastade undantaget
      dök upp **bara** som `pageerror`, aldrig som `console.error`. Hade vakten lyssnat på det
      ena men inte det andra hade den felklassen passerat tyst — och en vakt som ser grön ut
      utan att kunna larma är värre än ingen vakt.

      | Vakt | Skärm | Läge |
      |---|---|---|
      | 1 — sidan renderar, rubrik = övningens namn | Övningssidan | ✅ |
      | 2 — tyngsta set och bästa e1RM med decimal | Övningssidan | ✅ |
      | 3 — importnotisen syns / syns inte (3a och 3b) | Övningssidan | ✅ |
      | 6 — inga konsolfel under flödet | Alla tre skärmarna | ✅ |
      | 4 — passlistan (13.3) | **Historiksidan** | ✅ |
      | 5 — `FÖRRA`-kolumnen (13.4) | **Passvyn** | ✅ |

      **Punkt 6 täcker numera alla tre skärmarna**, inte bara övningssidan. Spec-granskningen
      påpekade att *"inga konsolfel under hela flödet"* mätte en tredjedel av flödet — och
      passvyns flöde är det tyngsta UI:t i hela sviten.

      **Vakt 5 mäter TVÅ oberoende kodvägar.** Både `addExerciseToPlan` (`plan.ts:88`, som
      förifyller setraderna) och `ExerciseCard` (`ExerciseCard.tsx:46`, som driver
      `Förra`-cellen) läser `getLastPerformance` genom var sin fråga. Mäts bara den ena kan den
      andra tappa filtret utan att någon grind säger ett ord.

      ✅ **`/code-review` av alla sex vakterna är GJORD 2026-08-13 (kväll)**, som Adam begärde,
      med fixpunkt `b7cb126`. Båda axlarna hittade verkliga fel, och båda flaggade oberoende av
      varandra samma svaghet i vakt 4:s ankare — vilket är det starkaste skäl som finns att tro
      på ett fynd. Åtgärdat i `622f1be`:

      | Fynd | Åtgärd |
      |---|---|
      | **Vakt 4 bröt mot beslut 6** — seedade det vanliga passet rått | Passet skapas nu genom appen. `isImported: false` kom förut ur testets egen fixtur, så vakten mätte sig själv |
      | Vakt 4:s ankare var en delsträngsmatchning | Negationen räknar rader i stället. Se sabotagerutan ovan |
      | `seedaRått` krävde att anroparen kom ihåg att asserta returvärdet | Kastar nu i stället. Regeln var redan glömd en gång |
      | `seedaRått`/`seedaPassRått` delade IndexedDB-skalet ordagrant | Utbrutet till `skrivRått` |
      | Punkt 6 täckte bara en av tre skärmar | Konsolvakt tillagd i vakt 4, 5a och 5b |

      **Kvarstående fynd är utbrutna till egna uppgifter:** 12.30 (vakt 2, 3b och 6 bryter också
      mot beslut 6), 12.31 (`IMPORTERAT_SET` är felnamngiven) och 12.32 (sökningen enligt §7.1
      gjordes aldrig före `hjalpare.ts`).

      ⚠️ **"Klart när" här namnger EN fil, men vakterna mäter TRE skärmar.** 13.3 sitter i
      `listWorkoutSummaries` (passlistan) och 13.4 i `getLastPerformance` (spökdatan) — ingen
      av dem ligger på övningssidan. **Beslut:** alla sex byggs som beslut 5 kräver, men i
      filer som heter efter den skärm de mäter. Uppgiften förblir 12.20.

      ⚠️ **RÄTTAD 2026-08-13 (kväll) — den här varningen var fel om vakt 5.** Den löd tidigare
      att *"vakt 4 och 5 går via `workouts` och kräver ett riktigt seedat pass"*. Halva
      påståendet höll inte, och spec-granskningen hittade det:

      - **Vakt 4: stämmer.** `listWorkoutSummaries` (`history.ts:61`) läser `workouts`-tabellen,
        så `IMPORTERAT_SET` ensamt duger inte — ett importerat pass måste seedas.
      - **Vakt 5: stämmer INTE.** `getLastPerformance` (`repo.ts:325`) läser **bara**
        `loggedSets` och slår aldrig upp passet. Vakt 5 seedar inget pass alls. Passen den
        använder finns för att `excludeWorkoutId` ska ha något att utesluta, och de **skapas
        genom appen**, inte som fixtur.

      Skillnaden spelar roll: ett dokument som anger fel skäl får nästa agent att tro att kravet
      är uppfyllt av fel anledning, och då försvinner det verkliga kravet ur synfältet.
      Konstanten själv är fortfarande medvetet föräldralös (12.27), och villkoret står utskrivet
      i `e2e/hjalpare.ts`.

      **Uppgiften ersätter INTE att köra appen i webbläsaren under byggandet.** Adam
      2026-08-11: *"det ska inte sluta användas"*. De två gör olika saker och båda behövs:
      att öppna appen och titta är hur man **upptäcker** att något ser fel ut — ett test kan
      bara kontrollera det någon redan tänkt på. E2E-svitens uppgift är att hålla kvar det
      som en gång bevisats, så att samma sak inte behöver bevisas för hand en fjärde gång.

      **Verifierat 2026-08-11:** filerna borta, typecheck ren, **259 tester i 21 filer gröna**,
      lint ren, bygget klart (648,69 kB precache). Noll importrader behövde ändras — vilket
      var hela poängen med att radera i stället för att fylla.

- [x] **12.22 Tankstreck i apptexten bryter mot förbudslistan. Ny 2026-08-12. KLAR 2026-08-14.**
      Hittad vid verifieringen av 13.6. `DESIGN.md` §0.3 förbjuder tankstreck (—) i **det appen
      skriver till användaren**, på Adams begäran: det läser som AI-skriven text. Men
      `src/lib/importNotice.ts` producerar just det:

      > 12 punkter före januari 2026 är importerade från gamla anteckningar **—** datumen är uppskattade.

      Regeln skrevs samma dag som strängen upptäcktes, så det är ingen försummelse — men den
      gäller nu och strängen bryter mot den.

      ⚠️ **OMFÅNGET VAR FEL. Rättat 2026-08-12 (kväll) under grillningen av 11B.0e.**
      Uppgiften sa *"`importNotice.ts` har två förekomster"* och kallade sig **litet jobb**.
      Sökning i `src/**/*.tsx` gav minst sju till i användarsynlig text.

      ✅ **INVENTERINGEN ÄR GJORD OCH STÄNGD 2026-08-13.** Den varning som stod här —
      *"listan är inte bevisat fullständig, `.ts`-filer är inte kontrollerade"* — gäller inte
      längre. Hela `src/` är genomsökt, `.ts` såväl som `.tsx`, och **varje träff nedan är
      spårad hela vägen till den JSX som renderar den**. Ingen post vilar på antagande.

      **Metoden, så att den går att göra om:** tre sökningar vars resultat jämfördes.
      (1) Alla tankstreck i `*.tsx`, lästa i sin helhet. (2) Alla i `*.ts` med citattecken på
      samma rad. (3) Alla i `*.ts` på rader som inte inleds med `*` eller `//` — den fångar
      mallsträngar där citattecknet står på en tidigare rad, vilket sökning 2 missar.
      **2 och 3 gav samma mängd**, vilket är skälet att mängden får kallas stängd.

      **De 13 strängar som renderas — alla verifierade:**

      | # | Fil | Strängen | Renderas av |
      |---|---|---|---|
      | 1 | `src/ui/QuickLog.tsx:230` | *"fungerar — två tryck totalt."* | JSX direkt |
      | 2 | `src/ui/QuickLog.tsx:258` | *"Offline — AI-tolkning kräver nät…"* | JSX direkt |
      | 3 | `src/ui/QuickLog.tsx:270` | *"— {n} set"* | JSX direkt |
      | 4 | `src/ui/pages/SettingsPage.tsx:93` | *"…på hemskärmen — annars kan…"* | JSX direkt |
      | 5 | `src/ui/pages/TodayPage.tsx:268` | *"Skriv i stället — „Bänk 90x5"* | JSX direkt |
      | 6 | `src/ui/SyncStatus.tsx:66` | *"…gått förlorat — datan ligger kvar"* | JSX direkt |
      | 7 | `src/ui/ParseStats.tsx:41` | *"{n} försök — för få för en siffra"* | JSX direkt |
      | 8 | `src/lib/importNotice.ts:66` | *"…importerad… — datumet är uppskattat."* | entalsgrenen |
      | 9 | `src/lib/importNotice.ts:67` | *"…importerade… — datumen är uppskattade."* | flertalsgrenen |
      | 10 | `src/timer/diagnostics.ts:78` | *"…iOS fryser timern — larmet går inte att lita på…"* | `summarise()` → `TimerDiagnostics.tsx:30` |
      | 11 | `src/lib/persistStorage.ts:56` | *"nekad — lägg till appen på hemskärmen"* | `detail` → `SettingsPage.tsx:86` |
      | 12 | `src/sync/push.ts:103` | *"…utan seq — synken stoppad i stället för att loopa"* | `blocked` → `engine.ts:105,108` → `SyncStatus.tsx:64` |
      | 13 | `src/ai/client.ts:88` | *"AI:n svarade inte i tid — skriv in setet manuellt"* | `degraded()` → `hint` → `QuickLog.tsx:224` |

      **Rad 10–13 är helt nya.** De ligger alla i `.ts`-filer, alltså precis den lucka den
      gamla varningen pekade ut. Ingen av dem är en literal i JSX: de föds i logiklagret och
      renderas via en variabel, vilket är skälet att en sökning i `.tsx` aldrig kunde hitta dem.

      **Rad 12 och 13 är felmeddelanden och syns bara när något gått snett. De rättas ändå.**
      AVGJORT 2026-08-13. Ett felmeddelande är det tillfälle då texten spelar som störst roll:
      användaren är redan irriterad och vill veta vad som hänt. Att låta just den texten läsa
      som AI-skriven är sämre än någon annanstans, inte bättre. §0.3 gör ingen skillnad på
      brödtext och feltext, och det finns inget skäl att införa en.

      **`src/lib/id.ts:15` rättas också. AVGJORT 2026-08-13.** Den kastar
      `'crypto.randomUUID saknas — kräver säker kontext (https)'` och når skärmen via
      `engine.ts:124`, som fångar godtyckligt fel och lägger `err.message` i `lastError` — som
      `SyncStatus.tsx:64` renderar. Att det bara sker över osäker kontext gör den sällsynt,
      inte osynlig. **Regeln blir lättare att följa utan undantag att minnas**, och kostnaden
      är en rad. Därmed är antalet strängar som ska rättas **14**, inte 13.

      ⚠️ **Det här var två tekniska frågor som en tidigare version av uppgiften lade fram som
      beslut åt Adam.** Det var fel enligt den arbetsregel `HANDOFF.md` 2026-08-12 (kväll)
      slog fast: tekniska val avgörs av agenten och redovisas. Frågor går till Adam bara när de
      rör hans data, hans tid eller hans prioritering. Ingen av dessa gjorde det.

      **Testerna som låser texten, och som måste ändras i samma commit:**
      `src/lib/importNotice.test.ts:31` och `:37`. Det är de **enda två**. Övriga tankstreck i
      testfiler sitter i `describe`/`it`-beskrivningar, som aldrig når användaren och därför
      inte rörs.

      ✅ **Kontrollerat och rent:** `src/index.css` (23 träffar, alla i CSS-kommentarer, noll i
      `content:`-regler), `index.html` och `public/` (noll träffar).

      ℹ️ **Bara em-strecket (—) är förbjudet.** `DESIGN.md` §0.3 rad 93 nämner inget annat
      streck. `SettingsPage.tsx:86` använder tankstreckets kortare släkting `–` som
      tomvärdesmarkör — **den ska stå kvar**.

      **Viktigt:** ingen av dem är namnet på en knapp eller flik. Alla är brödtext. Det är
      skälet till att 11B.0e kunde välja `role` + tillgängligt namn som selektorstrategi utan
      att bygga in en brytpunkt.

      **Att göra — sökningen är redan gjord, kvar är redigeringen.** Ersätt tankstrecket i
      samtliga 14 rader ovan (de 13 i tabellen plus `id.ts:15`) med komma, punkt eller kolon.
      Kodkommentarer rörs inte, där är strecket fritt. `importNotice.ts` har två förekomster,
      en i varje gren av entals/flertalsfallet, och båda har tester som låser texten —
      `importNotice.test.ts:31` och `:37` ändras i samma commit.
      **Klart när:** noll tankstreck återstår i strängar som renderas, och testerna speglar det.

      ⚠️ **Radnumren ovan är från 2026-08-13 och rör sig om någon annan uppgift redigerar
      filerna först.** Sök på strängen, inte på raden. Metoden står under inventeringen och
      går att köra om på under en minut.
      **Körs efter 12.20**, inte ihop med den: att blanda textstädning i testarbetet bryter mot
      regel 3 om atomära commits. Ordningen är säker eftersom 12.20:s vakt bara påstår att
      importnotisen syns, aldrig vad den lyder.

      ---

      ### ✅ GENOMFÖRT 2026-08-14. Två fel i inventeringen rättade på vägen.

      Metoden kördes om innan redigeringen: **samtliga 14 rader låg kvar på sina dokumenterade
      radnummer**, ingen fil hade flyttat sig. Sökning 2 och 3 gav fortfarande samma mängd.

      ⚠️ **RÄTTELSE 1: rad 1 i tabellen var ingen sträng. Antalet är 13, inte 14.**
      `src/ui/QuickLog.tsx:230` (*"fungerar — två tryck totalt."*) står inne i ett
      `{/* … */}`-block som börjar på rad 227 — det är en **JSX-kommentar**, inte renderad text.
      Tabellen påstod *"JSX direkt"*. Den raden är alltså uttryckligen undantagen av uppgiftens
      egen mening *"Kodkommentarer rörs inte"*, och **lämnades orörd**.
      **Varför felet uppstod:** inventeringen spårade varje träff till *filen och raden* som
      renderar, men rad 1 kontrollerades aldrig mot omgivande rader. En träff mitt i ett
      flerradigt `{/* */}` ser ut som brödtext när man bara läser sin egen rad.

      ⚠️ **RÄTTELSE 2: påståendet "ingen av dem är namnet på en knapp" stämmer inte.**
      `src/ui/pages/TodayPage.tsx:268` **är** en `<button>`-etikett, alltså knappens
      tillgängliga namn. Ingen skada skedd — **inget test refererar strängen** (kontrollerat med
      sökning i `e2e/` och alla testfiler), så beslut 7 i 11B.0e fick ingen brytpunkt.
      Men slutsatsen *"11B.0e kunde välja `role` + tillgängligt namn utan att bygga in en
      brytpunkt"* vilade på fel premiss och var sann av tur, inte av konstruktion.

      **De 13 ändringarna, med valt ersättningstecken:**

      | Fil | Blev |
      |---|---|
      | `QuickLog.tsx:258` | `Offline:` |
      | `QuickLog.tsx:270` | `, {n} set` |
      | `SettingsPage.tsx:93` | `hemskärmen, annars` |
      | `TodayPage.tsx:268` | `Skriv i stället:` |
      | `SyncStatus.tsx:66` | `förlorat. Datan` |
      | `ParseStats.tsx:41` | `försök, för få` |
      | `importNotice.ts:66,67` | `anteckningar. Datumet/Datumen` |
      | `diagnostics.ts:78` | `timern. Larmet` |
      | `persistStorage.ts:56` | `nekad: lägg till` |
      | `push.ts:103` | `utan seq. Synken` |
      | `client.ts:88` | `i tid, skriv in` |
      | `id.ts:15` | `saknas, kräver` |

      Kolon valdes där ledet efter strecket förklarar det före (`Offline:`, `nekad:`), punkt där
      båda leden är egna påståenden, komma där texten renderas inuti parenteser
      (`client.ts:88` → `({problem.hint})` i `QuickLog.tsx:224`, där en punkt hade läst illa).

      **Testerna:** `importNotice.test.ts:31` och `:37` ändrade i samma commit, som föreskrivet.
      `push.test.ts:230` och `restTimer.test.ts:106` matchar på delsträngar utan tankstreck
      (`/utan seq/`, `/iOS fryser timern/`) och överlevde oförändrade — kontrollerat före
      redigeringen, inte upptäckt efteråt.

      ℹ️ **Medvetet orörd:** `src/sync/supabase.ts:24` har ett tankstreck i ett
      `console.info`-anrop. Det når konsolen, aldrig skärmen, och faller därför utanför §0.3:s
      *"det appen skriver till användaren"*. Noterat här så att nästa sökning inte tar om frågan.

      **Verifierat efteråt:** sökningarna körda om — noll tankstreck återstår i någon sträng som
      renderas. Samtliga kvarvarande träffar i `src/` är kommentarsrader, kontrollerade i sitt
      sammanhang en och en.

- [ ] **12.21 `lastPulledAt`-markörerna är aldrig bevisade.** Utbruten ur A.1 2026-08-12 när
      egressutredningen avslutades. **Detta är inte en kostnadsfråga** — mätningen visade att
      Gym-App står för 0,001 GB, och en trasig markör hade flyttat kilobyte. Posten finns kvar
      av ett annat skäl: vi vet fortfarande inte om inkrementell hämtning fungerar.

      **Vad som är okänt:** om `lastPulledAt:*` faktiskt sätts och läses, eller om `pull.ts`
      hämtar hela tabeller vid varje synkrunda. `syncNow` triggas vid appstart, `focus`,
      `visibilitychange` och 2 s efter varje utkorgsskrivning — under ett pass blir det många
      rundor. `src/sync/pull.test.ts` har 8 tester, men ingen av dem har verifierats täcka
      just markörernas livscykel; det är en läsning som återstår, inte ett påstående.

      **Varför det ändå betyder något:** i dag är datamängden så liten att skillnaden är
      omätbar. Med Adams importerade historik inne (19 pass, 22 set) och fler år loggade
      växer den. En markör som aldrig fungerat märks först när tabellen blivit stor nog att
      göra ont — och då är det svårare att felsöka än nu.

      **Klart när:** det står svart på vitt om andra synkrundan hämtar noll rader när
      ingenting ändrats. En logg eller ett test räcker; det behöver inte bli en optimering.
      **Låg prioritet** — ingenting är trasigt som användaren märker.

- [ ] **12.23 E2E-sviten har aldrig rört produktionsbygget. Ny 2026-08-12 (kväll).**
      Utbruten ur grillningen av 11B.0e. `playwright.config.ts` startar `npm run dev`. Alla 30
      testerna kör alltså mot **dev-bygget**, aldrig mot det som hamnar på telefonen.

      **Vad som därmed är osett av varje test vi har:** servicearbetaren, precachen (9 poster,
      650,90 kB), offline-navigeringen via `navigateFallback`, och minifieringen. Det är
      samtidigt de delar som är svårast att felsöka när de går sönder, eftersom de bara
      existerar i produktionsläge.

      **Varför det inte löstes i 11B.0e:** hade sviten behövt köra mot produktionsbygget vore
      `import.meta.env.DEV` diskvalificerat som byggflagga för såddinsläppet — grenen stryks ju
      ur just det bygget. Adam bekräftade att dev är enda målet **för nu**, så beslutet står.
      Ändras det här, läs om 11B.0e:s fallback först.

      **Att göra:** ett andra Playwright-projekt som kör mot `vite preview` med ett litet urval
      rökprov — appen startar, servicearbetaren registreras, en rutt fungerar offline. **Inte**
      hela sviten: seedade tester kan inte köra där, vilket är hela poängen ovan.
      **Klart när:** minst ett test bevisar att produktionsbygget startar och registrerar sin
      servicearbetare. **Låg prioritet, men inte noll** — hålet är osynligt tills det smäller.

- [ ] **12.24 `jsdom` ligger oanvänt i `package.json`. Ny 2026-08-12 (kväll).**
      Utbruten ur 12.20:s rättelse 1. `jsdom@^28.0.0` är installerat och används av
      **ingenting**: `vite.config.ts:63` sätter `environment: 'node'` och ingen fil åsidosätter
      det. Kontrollerat mot `src/`, `e2e/`, `scripts/` och `playwright.config.ts`.

      **Beslutet i 11B.0e cementerar det.** Sviten kör e2e, inte komponenttester, så jsdom har
      ingen inbokad användning. Ta bort det.

      ⚠️ **Kontrollera först att inget verktyg drar in det implicit** — `@vitest/coverage-v8`
      och Vitests egen `environment`-växel refererar jsdom utan att kräva det. Går `npm run
      test` grönt efter borttagningen är svaret nej.
      **Klart när:** posten är borta ur `package.json` och alla fem grindarna är gröna.
      **Litet jobb.**

- [x] **12.25 `test.fail()` i såddprövningen täcker sin egen uppsättning. Ny 2026-08-13. KLAR samma dag.**
      Funnen av `/code-review` (Spec-axeln) på commit `05c21b7`. **Det allvarligaste fyndet i
      granskningen.**

      `test.fail()` står på rad 143 i `e2e/sadd-provning.spec.ts` och gäller **hela
      testkroppen**. Raderna 148–150 är uppsättning, inte mätning:

      ```
      await page.goto(`/ovning/${övning.id}`);
      await expect(page.getByRole('heading', { name: övning.name })).toBeVisible();
      await expect(page.getByText(/importerad/i)).toHaveCount(0);
      ```

      **Följden:** går uppsättningen sönder — sidan renderar inte, övningen hittas inte —
      rapporteras testet fortfarande som *förväntat rött*, alltså grönt i sviten. Testet kan
      alltså vara "grönt" av skäl som inte har ett dugg med liveuppdatering att göra, vilket är
      det enda det påstår sig mäta.

      Påståendet i 11B.0e — *"börjar det plötsligt lyckas blir körningen röd"* — håller
      fortfarande. Det är det **omvända** som inte gör det: att grönt betyder att mätningen
      faktiskt utfördes.

      ✅ **LÖST 2026-08-13, men inte på det sätt uppgiften först föreslog.**

      Förslaget här löd *"flytta uppsättningen till en `beforeEach`, eller dela testet så att
      `test.fail()` bara omsluter den sista `expect`-raden"*. **Båda vägarna bygger på ett
      felaktigt antagande:** `test.fail()` går inte att rikta mot en rad. Den markerar hela
      testet som förväntat rött oavsett var i kroppen den står, och ett fel i en `beforeEach`
      räknas fortfarande som att testet föll. Att flytta annoteringen hade inte löst något.

      **Det som gjordes i stället: påståendet vändes.** Uteblivenhet var vad vi faktiskt mätte,
      alltså är det uteblivenhet som påstås. `test.fail()` är borta och testet är ett vanligt
      grönt test. Båda egenskaperna gäller nu:

      - Går uppsättningen sönder blir testet **rött**, som vilket test som helst.
      - Börjar liveuppdateringen plötsligt fungera dyker notisen upp, `toHaveCount(0)` faller,
        och körningen blir röd. Exakt det larm `test.fail()` var till för.

      En **fast väntan på 3 s** lades in före mätningen, och den är motiverad i filen: ett
      negativt påstående går inte att bevisa med `expect`:s automatiska omförsök, eftersom
      `toHaveCount(0)` lyckas direkt vid noll träffar och därmed hade gått grönt i samma
      ögonblick som sådden — långt innan en eventuell uppdatering hunnit fram.

      **Verifierat 2026-08-13, inte antaget.** Uppsättningen sabbades med flit (rubriknamnet
      byttes mot en sträng som inte finns). Testet blev **rött**, `1 failed`, genom alla tre
      omförsöken. Med den gamla `test.fail()` hade samma sabotage rapporterats som förväntat
      fel och räknats som grönt. Därefter återställt, och grindarna körda: typecheck ren,
      lint 0 fel, **e2e 36 passed**.

- [x] **12.26 Såddprövningens selektor motsäger sin egen kommentar. Ny 2026-08-13. KLAR samma dag.**
      Funnen av `/code-review` (Spec-axeln). `e2e/sadd-provning.spec.ts:120-121`:

      ```
      // Påstår att notisen SYNS, aldrig vad den lyder — 12.22 skriver om meningen.
      await expect(page.getByText(/importerad/i)).toBeVisible();
      ```

      Kommentaren säger att raden inte rör lydelsen. `getByText` matchar **på just lydelsen**.
      Kommentaren beskriver alltså inte koden.

      ⚠️ **Granskaren påstod att 12.22 fäller testet. Det stämmer inte som 12.22 är avgränsad
      i dag** — inventeringen 2026-08-13 visar att bara tankstrecket byts och att ordet
      *"importerad"* överlever i båda grenarna av `importNotice.ts:66-67`. **Risken är latent,
      inte akut.** Skrivs meningen om på riktigt någon gång faller testet tyst.

      **Det som däremot är ett brott i dag:** beslut 7 i 11B.0e säger *"Selektorer: `role` +
      tillgängligt namn. `data-testid` bara där tillgängligt namn saknas"*. `getByText` är
      varken det ena eller det andra.

      ✅ **LÖST 2026-08-13, i två steg — och det första steget räckte inte.**

      Steg 1 (`1b7cd54`) gav notisen `role="note"`. Commiten märktes `(12.26)`, vilket
      **överdrev vad som gjorts**: `/code-review` visade samma dag att `role="note"` **inte
      ärver något tillgängligt namn från sitt innehåll**. Beslut 7 kräver *"`role` +
      tillgängligt namn"*, så selektorn uppfyllde bara halva beslutet — och prövningsfilen var
      inte rättad alls, trots att uppgiften sa *"i samma svep"*.

      Steg 2 (`f247a91`) stängde båda hålen. Noten har nu
      `aria-label="Om datans ursprung"` — **namnet på vad raden handlar om, aldrig en
      upprepning av vad den säger.** De två ska kunna röra sig isär; det är hela poängen.
      Alla tre `getByText(/importerad/i)` i `sadd-provning.spec.ts` är utbytta mot
      `getByRole('note', { name: 'Om datans ursprung' })`.

      **Följden:** 12.22 kan nu skriva om importnotisens mening utan att ett enda test går
      sönder. Det var kravet bakom beslut 5.
      **Verifierat:** typecheck ren, 274 tester, bygget klart, e2e 45 passed.

- [x] **12.27 Såddraden pekar på ett pass som aldrig skapas. Ny 2026-08-13. KLAR samma dag.**
      Funnen av `/code-review` (Spec-axeln). `e2e/sadd-provning.spec.ts:22` sätter
      `workoutId = 'provning-pass-1'` — ett pass som aldrig läggs in i `workouts`.
      `getExerciseHistory` (`src/db/history.ts:121`) slår aldrig upp passet, så det passerar
      tyst.

      **Det är precis vad 11B.0e varnade för** i avsnittet *"Varför bara det importerade setet
      seedas rått"*: *"Rå sådd går förbi `repo.ts` och kan därför skriva en rad appen aldrig
      hade kunnat skapa. Testet blir då grönt mot data som inte kan existera."*

      Dessutom är **blandfallet oprövat**: beslut 6 säger *"det vanliga skapas genom appen, som
      en riktig användare"*, men prövningen skapar aldrig något genom appen. Slutsatsen
      *"fallbacken behövs inte"* bär för den väg som mättes — en sida, en rad — men är inte ett
      generellt godkännande av sådden för alla sex vakterna.
      ✅ **LÖST 2026-08-13 med uppgiftens andra alternativ: villkoret är utskrivet.**
      Det står i `e2e/hjalpare.ts` ovanför `IMPORTERAT_SET`, alltså på det ställe varje
      framtida anropare läser — inte i ett test som råkar äga konstanten.

      **Vad villkoret säger:** föräldralösheten är ofarlig **här och bara här**, eftersom
      `getExerciseHistory` (`src/db/history.ts:121`) läser på `[exerciseId+performedAt]` och
      aldrig slår upp passet. **Men den duger inte för vakt 4 och 5**, som går via `workouts` —
      då måste ett riktigt pass seedas. Det står utskrivet i filen så att nästa session inte
      återupptäcker fällan genom att gå i den.

      ⚠️ **Blandfallet är fortfarande oprövat.** Beslut 6 säger *"det vanliga skapas genom
      appen, som en riktig användare"*, och ingen vakt gör det ännu. Det avgörs när vakt 5
      byggs, som är den enda som faktiskt kräver ett pågående pass.

- [x] **12.28 Emojiräkningen i 11B.0c är fel: åtta, inte sju. Ny 2026-08-13. KLAR 2026-08-14.**
      Funnen av `/code-review` (Spec-axeln), oberoende bekräftad mot repot samma dag.
      11B.0c:s rubrik lyder *"Sju förekomster, mätta och inte antagna"*. Det är **åtta**:
      **⌨ i `src/ui/pages/TodayPage.tsx:268`** saknas i tabellen.

      Uppgiftens egen paketlista nämner *"eventuellt tangentbord för fritextgenvägen"*, så
      behovet var känt — men ingen `IkonTangentbord` finns i `src/ui/icons.tsx`. **Sex av åtta
      glyfer är bytta, inte sex av sju.** 🏋 i `ExerciseCard.tsx:66` är sedan tidigare en
      dokumenterad senareläggning till steg 4.

      ⚠️ `docs/DESIGN.md:90` säger i sin tur *"Sex förekomster i dag"*. Tre dokument, tre
      siffror, och verkligheten är en fjärde. **Rätta alla tre.**
      **Att göra:** lägg till `IkonTangentbord`, byt ⌨, och rätta siffran i 11B.0c och
      `DESIGN.md`. Litet jobb, men det får inte glömmas — *"noll emoji återstår i `src/ui/`"*
      går annars aldrig att stänga ärligt.

      ✅ **KLAR 2026-08-14.** `IkonTangentbord` tillagd i `src/ui/icons.tsx` (Tabler
      `outline/keyboard`, hämtad ur källan och inte hittepå-path-data), `⌨` utbytt i
      `TodayPage.tsx:268`, och alla tre siffrorna rättade till åtta.

      ⚠️ **En fjärde siffra saknades också, och den är värre.** Sökningen efter emoji gjordes
      om över **hela `src/`**, inte bara `src/ui/`, och hittade tre till som **renderas för
      användaren** men aldrig räknats av någon av de tre dokumenten:

      | Fil | Glyf | Renderas av |
      |---|---|---|
      | `src/timer/diagnostics.ts:78` | ⚠️ | `summarise()` → `TimerDiagnostics.tsx:30` |
      | `src/timer/diagnostics.ts:81` | ⚠️ | samma väg |
      | `src/timer/diagnostics.ts:83` | ✅ | samma väg |

      **De faller utanför 11B.0c för att uppgiften avgränsade sig till `src/ui/`** — men
      användaren ser ingen skillnad på var en glyf bor i filträdet. De är dessutom en annan
      sorts fix: glyfen sitter i en **mallsträng**, och en SVG går inte att stoppa i en
      sträng. Antingen stryks tecknet och `TimerDiagnostics.tsx` sätter ikonen, eller så får
      raden bära sin status på annat sätt. **Utbrutet till 12.34** i stället för att lösas
      här, eftersom det ändrar ett gränssnitt mellan logik och vy.

- [ ] **12.29 Småfynd ur granskningen 2026-08-13. Låg prioritet.**
      Standards-axeln gav fyra bedömningsfrågor, ingen hård överträdelse. Härkomstregistret,
      licensraden i filhuvudet, §0.3 och ADR 0001 var alla uppfyllda.

      1. **48×48 px** — `src/ui/ExerciseCard.tsx:82` har `h-12 w-10` (48×40) på menyknappen.
         Diffen i `7bd43b5` redigerade exakt den raden men lämnade bredden.
      2. **Fem oanvända ikonexporter** — `IkonPlus`, `IkonSkivstång`, `IkonHistorik`,
         `IkonLista`, `IkonTidtagare`. `DESIGN.md` sanktionerar förberedelse av flikikoner, men
         `src/ui/nav.ts` har **tre** flikar, inte fyra. `IkonLista` och `IkonTidtagare` saknar
         alltså dokumenterad mottagare. Behåll om steg 4 tar dem, radera annars.
      3. **Samma preflight-omväg löst på tre sätt** — `svg { display: block }` hanteras med
         `mx-auto` (`ExerciseCard.tsx:141`), `inline-flex` (`ExercisePage.tsx:58`) och `flex`
         (`HistoryPage.tsx:89`). Formen kunde bo i `Ikon` självt.
      4. **Regel 3** — `7bd43b5` blandade ikonbytet med en rättelse av
         `docs/mockups/11b-ikoner.html`. Redan skedd, inget att åtgärda. Noterad så att
         mönstret inte upprepas.

- [ ] **12.30 Vakt 2, 3b och 6 bryter mot beslut 6. Ny 2026-08-13 (kväll).**
      Utbruten ur `/code-review` av 12.20. Beslut 6 i 11B.0e: *"Bara det importerade setet
      seedas rått — det vanliga skapas genom appen, som en riktig användare."*

      **De tre vakterna på övningssidan seedar sina vanliga set rått** med
      `source: 'manual'`. Vakt 4 gjorde det också tills granskningen fångade det; vakt 5 har
      följt beslutet från början.

      **Varför det spelar roll, och varför det ändå inte är brådskande:** en rå skrivning går
      förbi `repo.ts`, så vakten mäter sin egen fixtur i stället för appens skrivväg. Ändras
      det som skrivs vid en riktig loggning fortsätter vakten stå grön. Men de tre vakternas
      påståenden rör **avläsning** (rubrik, tyngsta set, importnotisen), inte skrivvägen, så
      exponeringen är mindre än vakt 4:s var — där var flaggan `isImported` själva
      skiljelinjen.

      **Hindret som fanns finns inte längre.** `e2e/hjalpare.ts` har numera `startaPass`,
      `läggTillÖvning` och `loggaSetGenomAppen`, prövade av vakt 4 och 5.
      **Klart när:** de tre vakterna skapar sina vanliga set genom appen, och var och en är
      sabotageprövad om efteråt. **Låg prioritet.**

- [ ] **12.31 `IMPORTERAT_SET` heter inte längre vad den är. Ny 2026-08-13 (kväll).**
      Utbruten ur `/code-review` av 12.20. Konstanten i `e2e/hjalpare.ts` är i praktiken
      **standardmallen** som `seedaRått` skriver om inget annat sägs — flera vakter skriver
      över `source` till `'manual'` och får då ett helt vanligt set ur något som heter
      `IMPORTERAT_SET`. Grannen `PASS_MALL` namnger sig rätt.

      Att förvalet *är* ett importerat set är avsiktligt och ska stå kvar; det är namnet som
      ljuger om räckvidden. **Klart när:** konstanten heter något som täcker båda användningarna
      (`SET_MALL`, med förvalet dokumenterat i docblocken). **Låg prioritet, ren omdöpning.**

      🔄 **Inte längre bara en omdöpning — gör den ihop med 12.38.** Samma konstant bär ett
      andra problem som steg 4.2 hittade: `performedAt` ligger två år tillbaka, vilket **kan
      maskera tidsberoende filter** i vakter som mäter frågor med åldersgräns. Det träffade
      vakt 5 på riktigt. Namnet och datumet sitter på samma rader; att dela upp dem i två
      commits vore att röra samma ställe två gånger.

- [x] **12.32 §7.1-sökningen gjordes aldrig före `e2e/hjalpare.ts`. Ny 2026-08-13 (kväll).
      KLAR 2026-08-13.**
      Utbruten ur `/code-review` av 12.20. §7.1: *"Att söka efter befintliga lösningar är ett
      standardsteg i varje ny funktion … Att inte ha letat är aldrig ett godtagbart skäl."*
      Ingen sökning redovisades, varken i diffen, `TASKS.md` eller `EXTERNT.md`.

      **Motargumentet som faktiskt bär, men som ska prövas och inte antas:** §7.1:s egen
      motvikt säger att en plattformsprimitiv slår ett bibliotek som gör samma sak, och att
      40 egna rader slår 200 kB i bundlen. `skrivRått` är rå IndexedDB — en plattformsprimitiv
      — och 12.20:s eget *"Klart när"* förbjuder nya poster i `package.json`. Slutsatsen
      *blir* med all sannolikhet "inget som passar", men **den slutsatsen är inte dragen än**,
      och ett argument som råkar leda rätt är fortfarande ett dåligt argument (samma fel som
      12.20:s egen rättelse 3 handlade om).

      **Klart när:** en riktig sökning är gjord och redovisad — även om svaret blir "inget som
      passar". **Låg prioritet**, men den ska inte tyst skrivas av.

      ✅ **SÖKNINGEN ÄR GJORD OCH REDOVISAD** i `docs/EXTERNT.md` under *Övervägt och
      uppskjutet* → *"Hjälpare för e2e-sviten"*. Fyra kandidater med licens, stjärnor, senaste
      commit och beroenden. **Inget infört, noll nya poster i `package.json`.**

      ⚠️ **Och slutsatsen "inget som passar" blev bara delvis rätt — vilket är hela skälet
      till att uppgiften inte fick skrivas av tyst.** Sökningen förutspåddes ge noll. På sådden
      gjorde den det, av två skäl som nu är nedskrivna: `playwright-indexeddb` går inte att
      belägga licensmässigt (npm säger MIT, repot har ingen `LICENSE`-fil → §7.2b stoppar den),
      och `dexie-export-import` arbetar genom Dexies API som inte är nåbar från `page.evaluate`.

      **Men på det tredje ansvaret fanns en riktig träff.** `fångaKonsolfel` duplicerar
      Playwrights inbyggda `page.consoleMessages()` och `page.pageErrors()`. Utbrutet till
      **12.33**. Uppgiften betalade alltså för sig, tvärtemot vad den själv gissade.

- [ ] **12.33 `fångaKonsolfel` duplicerar en plattformsprimitiv. Ny 2026-08-13 (kväll).**
      Utbruten ur 12.32:s sökning. `e2e/hjalpare.ts:316` bygger för hand det Playwright numera
      har inbyggt:

      | Vår kod | Inbyggt | Sedan |
      |---|---|---|
      | `page.on('console', …)` filtrerad på `type() === 'error'` | `page.consoleMessages({ filter })` | 1.56 |
      | `page.on('pageerror', …)` | `page.pageErrors()` | 1.56 |

      **Verifierat i typerna för den version vi kör**, inte ur sökträffar:
      `node_modules/playwright-core@1.62.1/types/types.d.ts:2361` respektive `:3933`. Även
      `clearConsoleMessages()` och `clearPageErrors()` finns (`:2206`, `:2213`).

      **Vinsten är inte färre rader — den är att en fälla försvinner.** Hjälparens docblock
      varnar i dag: *"MÅSTE ANROPAS FÖRE FÖRSTA `goto`. Ett fel som hinner uppstå innan dess
      fångas aldrig, och listan hade varit tom utan att någon märkt det."* De inbyggda
      metoderna är **retroaktiva** — upp till 200 senaste — så anropsordningen slutar spela
      roll. Det är samma resonemang som `skrivRått`-rättelsen 2026-08-13: *en regel som måste
      minnas är ingen regel; strukturen ska göra felet omöjligt i stället.*

      ⚠️ **`filter`-valet är inte kosmetiskt och ska avgöras, inte glidas förbi.**
      `consoleMessages()` tar `'all' | 'since-navigation'`. Vakt 6 mäter en sida efter dess
      `goto`, men hjälparen används av fler. Fel val ger antingen missade fel eller läckage
      mellan navigeringar. Skriv ut vilket som valdes och varför.

      **Klart när:** `fångaKonsolfel` är antingen borttagen till förmån för de inbyggda
      anropen, eller kvar som tunn omslagsfunktion **utan** ordningskravet i docblocken — och
      **vakt 6 är sabotageprövad om**. Vakten ändras här, och 12.20:s lärdom gäller: *att en
      vakt blir röd räcker inte, den ska bli röd på rätt rad.* Läs felmeddelandet under
      sabotaget; pekar det på hjälparen eller uppsättningen är påståendet oprövat.

      **Låg prioritet.** Nuvarande kod är korrekt så länge ordningsregeln följs — detta är
      härdning, inte en bugg.

- [ ] **12.34 Tre emoji utanför `src/ui/` som ingen räkning fångat. Ny 2026-08-14.**
      Utbruten ur 12.28. `DESIGN.md` §0.3 förbjuder emoji som ikoner, och 11B.0c räknar dem
      — men **avgränsat till `src/ui/`**. Tre glyfer bor utanför den mappen och renderas ändå:

      | Fil | Glyf | Renderas av |
      |---|---|---|
      | `src/timer/diagnostics.ts:78` | ⚠️ | `summarise()` → `TimerDiagnostics.tsx:30` |
      | `src/timer/diagnostics.ts:81` | ⚠️ | samma väg |
      | `src/timer/diagnostics.ts:83` | ✅ | samma väg |

      **Varför de aldrig fångades:** tre dokument räknade emoji och alla tre sökte i `src/ui/`.
      Användaren ser däremot ingen skillnad på var i filträdet en glyf bor. Det är samma
      lucka som 12.22 hade: en inventering ärver sin sökväg, och sökvägen var snävare än
      problemet. **Skriv därför sökningen mot hela `src/`, inte mot `src/ui/`.**

      **Varför det inte är samma fix som de övriga sju:** glyfen sitter i en **mallsträng**,
      inte i JSX. En SVG går inte att lägga i en sträng. Antingen stryks tecknet och
      `TimerDiagnostics.tsx` sätter ikonen utifrån vilken gren `summarise()` returnerade, eller
      så får raden bära sin status på annat sätt. **Det ändrar gränssnittet mellan logik och
      vy**, vilket är skälet att det inte gjordes i förbifarten.

      ⚠️ **`summarise()` returnerar i dag en färdig mening.** Ska vyn kunna välja ikon måste
      den veta *vilket* av tre lägen det är — alltså behöver funktionen returnera ett läge
      plus en text, inte en sträng. Det är den verkliga kostnaden här, inte tecknet.

      **Klart när:** noll emoji återstår i strängar som renderas, mätt över **hela `src/`**,
      och `src/timer/restTimer.test.ts` speglar det som testet på rad 106 låser.
      **Låg prioritet** — diagnosvyn är Adams felsökningsverktyg, inte en huvudskärm.

- [ ] **12.35 `ScrollPicker`:s 2 px-tröskel bär nu härkomst, inte bara avstånd. Ny 2026-08-26.**
      Hittad av nivåaxeln i `/simplify`. **Inte ett fel i dag** — och `a95b1fc`:s fix ligger på
      rätt nivå, det är verifierat: bytet från en tidsgräns till `användarrörde` flyttade
      spärren från *när* till *vem*, vilket var hela poängen.

      **Men en tröskel överlevde och har fått en andra betydelse.** Spåra `ScrollPicker.tsx:71`:
      när användaren själv drar hjulet går `onChange` → `value` ändras → effekten kör → hjulet
      står redan på målet → `if (Math.abs(el.scrollTop - mål) < 2) return;` → och
      `användarrörde.current` nollställs **inte**. Att flaggan överlever mitt i användarens gest
      hänger alltså på att `scrollTop` råkar ligga inom 2 px av `index * ITEM_H`.

      **Vad som får det att fela:** en annan `ITEM_H`, webbläsarzoom som ger bråkdels-CSS-pixlar,
      eller en `scroll-snap`-implementation som avrundar annorlunda. Då tar effekten den andra
      grenen mitt i gesten, nollställer flaggan, avbryter rapporten och anropar `scrollTo` mot
      användarens finger. **Att det inte händer i dag är webbläsarens `snap-mandatory`-garanti,
      inte vår.** Samma buggklass som just åtgärdades, återinförd genom en avståndsgräns i
      stället för en tidsgräns.

      **Föreslagen åtgärd — avsikt i stället för tröskel:** en `rapporterat`-ref som håller det
      värde vi själva rapporterade sist. Kommer det tillbaka som prop är ändringen hjulets egen,
      och effekten kan returnera utan att röra vare sig flaggan eller hjulet. Rad 71 blir då
      återigen bara den optimering den utger sig för att vara.

      ⛔ **Gjordes INTE i `/simplify`, med flit.** Det är en beteendeändring i en
      kappkörning som lagades för två dagar sedan, och `/simplify` är kvalitet — inte
      korrekthet. Ändras det ska det ske med `/diagnosing-bugs` eller `/tdd`, med ett test som
      först är rött. `ScrollPicker.test.tsx` är rätt plats; sömmen finns redan.

> ### 🔴 12.36–12.41 kommer ur steg 4.2. LÄS PRIORITERINGEN INNAN DU PLOCKAR EN
>
> Uppgifterna är **inte** lika mycket värda. Steg 4.2 hittade tre fel som ingen av de fem
> grindarna fällde, och **två av dem var tester som såg ut att mäta något men inte gjorde
> det.** De hittades genom att jag saboterade koden med flit — alltså av en vana, inte av en
> process. Händer det bara när någon råkar komma på det kommer nästa tysta vakt inte hittas.
>
> | # | Vad | När |
> |---|---|---|
> | ~~**12.36**~~ | ~~Kontrastmätningen finns inte i repot~~ | ✅ **KLAR 2026-08-27.** `e2e/kontrast.spec.ts`. Hittade elva kontroller med osynlig kant |
> | ~~**12.37**~~ | ~~Sabotagekontrollen är en vana, inte en regel~~ | ✅ **KLAR 2026-08-27.** Regel 2 i `CLAUDE.md`, **tre** tillfällen, fem belägg |
> | **12.38** | `IMPORTERAT_SET`:s datum kan maskera tidsberoende filter | **Med 12.31**, inte med 12.37 — det är samma rad |
> | **12.39** | `getSetAverages` drar in hela `exercises` i sin observerade mängd | Före **fas 7** |
> | **12.40** | Briefen saknar kanttoken för element direkt på papperet | **I 4.3.** Frågan är nu mätbar — se raden |
> | **12.41** | Kontrastvakten ser fyra lägen, inte hela appen | Efter 4.3. `/ovning/:id` är den allvarligaste delen |
>
> ✅ **12.37 var den enda kvarvarande som hindrade FRAMTIDA fel, och den är gjord.** Regeln bor
> i `CLAUDE.md` regel 2 sedan 2026-08-27 och namnger tre tillfällen då sabotagekontrollen är
> obligatorisk. **Att den var en vana och inte en process var hela problemet** — fem belägg
> hann samlas innan den skrevs ner, och tabellen i uppgiften listar alla fem.
>
> ⛔ **Kvarvarande i rutan hindrar inga fel i dag.** 12.38 är en fälla för nästa vakt, 12.39 är
> latent till fas 7, 12.40 avgörs i 4.3 och 12.41 utvidgar kontrastvakten. Ingen av dem ger
> fel siffror eller fel utseende nu.
>
> ⏰ **12.42–12.49 tillkom 2026-08-27 ur `/code-review`, Adams fråga och `/simplify`, och har
> en egen ruta längre ner.** Alla åtta är nu stängda. **12.46 gick före 12.37**, och skälet var att den
> var en regel 1-skuld: `DESIGN.md` påstod tre saker koden motsade, och så länge det gällde var
> briefen inte sanningskällan.

- [x] **12.36 Kontrastmätningen bor i ett sessionstranskript, inte i repot. Ny 2026-08-26.
      KLAR 2026-08-27 i `e2e/kontrast.spec.ts`.**
      **Det här är det tyngsta fyndet ur steg 4.2**, och det handlar inte om en färg.

      Steg 4.1 lämnade fyra fel som **inga grindar fångade**, för att tokens *innebörd* ändrades
      under rader som aldrig rördes. Det enda som hittade dem var att rendera appen och mäta
      kontrasten programmatiskt i DOM:en. Steg 4.2 gjorde om mätningen och hittade tre fel till.

      ⛔ **Men skriptet finns ingenstans.** Det skrevs i webbläsarpanelen båda gångerna och dog
      med sessionen. Nästa session måste återuppfinna det — **och kan göra om samma misstag**:

      💡 **Mätskriptet ljög första gången det kördes i 4.2.** Det läste
      `oklab(0.94 0.001 0.014 / 0.4)` med en RGB-regex, plockade `0.94` som rödvärde och
      rapporterade **tre falska fel** på kolumnrubrikerna. Hade de "fixats" hade korrekta rader
      ändrats. **En mätning som inte själv är kontrollerad är inte ett bevis.**

      **Den fungerande metoden, och skälet den fungerar:** låt webbläsaren göra färgmatten.
      Sätt en känd bottenfärg på en 1×1-canvas, måla elementets färg ovanpå, läs pixeln. Då
      hanteras alfa, `oklab`, `color-mix` och allt annat CSS kan hitta på — utan att vi tolkar
      en enda färgsträng själva. Bakgrunden byggs likadant: samla lagren från roten och ned och
      måla dem i tur och ordning.

      **Föreslagen form: en e2e-vakt, inte ett skript.** `e2e/no-horizontal-overflow.spec.ts`
      är redan exakt det här mönstret — gå igenom varje element på varje rutt och mät något
      som annars bara upptäcks av ett öga. Kontrastvakten är dess syskon, och som e2e körs den
      av sig själv i stället för att kräva att någon minns den. Det är samma val som
      `tabular-nums`: **strukturellt i stället för ihågkommet.**

      ⚠️ **Den ärliga risken, som ska mötas och inte ignoreras:** en sådan vakt kan bli brusig.
      Avsiktligt dämpad text, inaktiverade kontroller och dekorativa glyfer kan falla utan att
      något är fel. **Bygg den med en uttrycklig undantagslista där varje post bär sitt skäl
      i klartext** — ett tyst undantag är samma sorts lögn som en tyst grön vakt. Faller den på
      något är svaret antingen en rättad färg eller en motiverad rad i listan, aldrig en höjd
      tröskel.

      **Klart när:** vakten mäter varje synligt textelement på Pass, Historik och Inställningar
      mot sitt **faktiska** underlag; kravet följer storleken (4,5:1 under 24 px, 3:1 över, och
      3:1 för kanter som bär betydelse enligt WCAG 1.4.11); den faller på ett infört fel —
      **kontrollerat genom sabotage, inte antaget**; och undantagslistan är tom eller motiverad
      post för post.

      ✅ **BYGGD 2026-08-27, commit `177ec56`.** Fem tester (fyra lägen + en listgranskning) ×
      tre viewportbredder. E2E gick 66 → **81 passed**. Fyra lägen mäts, och andra läget är det
      som bär vakten: *Idag utan pass*, **Idag med pågående pass och en bekräftad rad**,
      *Historik*, *Inställningar*.

      ✏️ **RÄTTELSE 2026-08-27: siffran var ELVA, inte tio.** `/code-review` hittade felet.
      `822babd` gör elva tokenbyten — 3 i övningsmenyn, 3 i timern, 3 i `SignIn`, 1 i
      `SyncStatus`, 1 i `TodayPage` — och **commitmeddelandets egen uppräkning summerar också
      till elva** medan dess rubrik säger tio. Historiken skrivs inte om för det; siffran står
      rätt här, i `12.41` och i `HANDOFF.md`. **Commit `822babd`:s meddelande bär alltså en
      siffra som aldrig stämde**, precis som `15bccb7` gör (se `Steg 4.2` ovan). Två gånger på
      två sessioner — räkna uppräkningen innan rubriken skrivs.

      🔴 **VAKTEN HITTADE ELVA KONTROLLER MED OSYNLIG KANT, LAGADE I `822babd`.** Alla hade
      `--color-line` — tokenen `index.css` uttryckligen kallar **dekorativ** — som enda
      avgränsning, uppmätt till **1,01–1,18:1** mot sitt faktiska underlag. **Det är samma fynd
      som steg 4.1 gjorde** (*"tre kontroller med `--color-line` som enda avgränsning"*);
      migreringen till `--color-line-strong` blev aldrig färdig, och **steg 4.2 lade till tre
      nya fall** i vilotimern. Noll textfynd — textsidan var alltså redan ren.

      💡 **Sabotaget som är värt att bära vidare, för det bevisar metoden och inte bara vakten.**
      `--color-dim` sattes tillfälligt till `color-mix(in oklab, #1c1917 25%, transparent)`.
      Datorstilen blev `oklab(0.216115 0.003422 0.005081 / 0.25)`, och vakten mätte **1,70:1**
      mot papperet — rätt. **En RGB-regex hade läst `0.216` som rödvärde, fått närmast svart,
      rapporterat ~17:1 och gått grön.** Det är exakt felet 4.2:s första skript gjorde, nu
      omöjligt: ingen färgsträng tolkas någonstans i filen, inte ens för att avgöra om något är
      genomskinligt (det målas på svart och på vitt och jämförs).

      ⚠️ **En tyst grön vakt byggdes in i vakten och rättades under bygget.** Första versionen
      räknade ett enda `mätta`-tal. Eftersom kantvägen ger utslag på varje sida hade den
      räknaren stått långt över noll **även om textvägen aldrig kört en enda mätning** — alltså
      precis den felklass 12.37 handlar om, inbyggd i verktyget som finns för att hitta den.
      Sorterna räknas nu var för sig. **Regeln som faller ut: en liveness-räknare som slås ihop
      över två oberoende vägar bevisar ingen av dem.**

      📋 **Undantagslistan har tre poster, alla med skälet utskrivet i filen.** En fjärde
      (`:disabled` för kanter) **togs bort samma dag den skrevs** — granskningstestet fällde den
      direkt, eftersom inget av de fyra lägena har en inaktiv kontroll med synlig kant. Det är
      den rörelsen listan finns för.

      ⏰ **`+ Lägg till set` är den enda kontroll som medvetet INTE bytte token**, och skälet är
      uppmätt: knappen har bara `border-t`, alltså en avdelare mellan rader och ingen kontur. I
      den starka tokenen blev linjen **tyngre än setradernas egna avdelare** — sämre läsbarhet
      av en bokstavstrogen tillämpning av 1.4.11. Undantaget är därför strukturellt formulerat
      (*en kontur har fyra sidor*) och inte en smakbedömning.

      ✏️ **RÄTTELSE SAMMA DAG, `4bd2ead`: Historik mättes först TOM.** Läget gick rakt till
      `/historik` på en tom databas, så det som mättes var en tomstatusruta och flikraden —
      passlistan fanns aldrig i urvalet. Grön av fel skäl, i den fil som finns för att hitta
      just det. Passet loggas nu genom appen och avslutas. **Inga nya fynd av det utökade
      urvalet**, men vakten mäter nu det den påstår sig mäta.

      ⏰ **VAD VAKTEN ÄNNU INTE SER — se 12.41.** Fyra lägen är fyra lägen, inte hela appen.
      Bottenarket, övningsväljaren, fritextinmatningen och hela rutten `/ovning/:id` mäts inte,
      och de innehåller kontroller med samma `--color-line`-kant som nyss lagades på tio andra
      ställen. Uppgiftens **Klart när** namnger Pass, Historik och Inställningar och är därmed
      uppfylld — men luckan är verklig och skriven som egen rad så den inte blir kvar i löptext.

      ⏰ **Adam hade inte hunnit svara på om de elva kanterna får se ut så här** när sessionen
      tog slut. **Ingenting är pushat** — se `HANDOFF.md` för hur de backas.

- [x] **12.37 Sabotagekontrollen är en vana, inte en regel. Ny 2026-08-26.**
      Steg 4.2 hittade **två tysta gröna vakter**, båda genom att koden de mäter saboterades
      med flit:

      1. **Vakt 5 mätte fel filter.** Se `11B.0f`. Konsumenten bytte från `getLastPerformance`
         till `getSetAverages`, och den nya källan har en åldersgräns den gamla saknade. Det
         seedade setet låg två år tillbaka, så **åldersgränsen tog det även när importfiltret
         saboterades.** 13.4 var oskyddad på visningsvägen utan att någon grind sa ett ord.
      2. **Långtrycksvakten dolde ett designfel.** Se `Steg 4.2` del E. Infobrickans
         `fixed inset-0`-overlay dök upp under fingret medan det låg nere, så `pointerup`
         hamnade på overlayen och `click` uteblev helt — klickspärren blev omätbar.

      **Vad de har gemensamt:** i båda fallen gick vakten grön **av rätt skäl av en slump**.
      Ingen av dem syns i ett diff, och ingen grind kan fånga dem — ett test som passerar ser
      likadant ut oavsett om det mäter något.

      `history.test.ts` har redan vanan nedskriven på två ställen (*"Två vakter kan inte bli
      röda av sig själva … båda kontrollerades genom att implementationen tillfälligt
      saboterades"*), men det är en anteckning i en fil, inte en regel någon läser i tid.

      **Klart när:** regeln står i `CLAUDE.md` och namnger de två tillfällen den gäller —
      **(a) när ett test går grönt utan att implementationen ändrats**, och **(b) när en
      konsument byter datakälla**, eftersom den då ärver källans alla filter. Formuleringen ska
      vara kort; skälen bor här och i `11B.0f`.

      💡 **Sidoiakttagelse värd att bära med:** ett test som *inte kan* bli rött är inte
      värdelöst, men det ska stå utskrivet att det är dokumentation och inte en vakt. Se
      `worksets.test.ts`, tomma-listan-fallet.

      **Åtgärdad 2026-08-27.** Regeln står i `CLAUDE.md` som två punktsatser under regel 2
      (*Diagnos före fix*), inte som en egen regel 7 — HOW-listan slutar på 6 och kapitelrubrikerna
      fortsätter på 7, så en sjunde listpunkt hade kolliderat i numreringen. Rule 2 är dessutom
      rätt hem i sak: *"gissa aldrig varför en bugg uppstår"* och *"gissa aldrig att ett grönt
      test mäter något"* är samma sats.

      ⚠️ **REGELN NAMNGER TRE TILLFÄLLEN, INTE TVÅ. Det tredje är mitt tillägg och inte Adams**,
      så det ska synas här: **(c) den röda fasen föll på att något saknades (`is not defined`)**.
      Belägget kom ur `12.48` samma dag. Första testet för `loggadeArbetsset` var rött — men
      rött för att funktionen inte fanns, inte för att villkoret inuti den mättes. Filtret
      byggdes därför i två steg så att båda villkoren fick var sitt fallande test. **En röd fas
      som föll på fel sak är samma tomma bevis som en grön som inte mäter något**, bara
      speglad, och den är lättare att missa eftersom den ser ut som en korrekt TDD-cykel.

      **Fem belägg, alla uppmätta genom sabotage och inte antagna:**

      | # | Var | Vad sabotaget visade |
      |---|---|---|
      | 1 | Vakt 5, steg 4.2 (`11B.0f`) | Konsumenten bytte datakälla och ärvde en åldersgräns. Setet föll på åldern även när importfiltret saboterades |
      | 2 | Långtrycksvakten, steg 4.2 del E | Overlayen dök upp under fingret, så `click` uteblev och klickspärren blev omätbar |
      | 3 | Kontrastvakten, `12.36` | En hopslagen liveness-räknare stod över noll även om textvägen aldrig kört en mätning — felklassen inbyggd i verktyget som finns för att hitta den |
      | 4 | `12.42` | Testerna gick gröna direkt. Sabotage åt två håll visade att båda konsumenterna bar regeln |
      | 5 | `12.48` | Den röda fasen föll på `is not defined`. Se rutan ovan |

      **Ingen kodändring, ingen grind rörd.** `CLAUDE.md` är instruktion, inte källkod.

      ⏰ **`12.38` står kvar och är inte gjord här**, trots att tabellen längre upp säger
      *"Med 12.37"*. Dess egen text pekar på `12.31` i stället: *"gör dem i samma commit, det är
      samma rad."* Den hör alltså ihop med 12.31, inte med den här.

- [ ] **12.38 `IMPORTERAT_SET`:s datum kan maskera tidsberoende filter. Ny 2026-08-26.**
      Utbruten ur vakt 5-omskrivningen i steg 4.2. Mallen i `e2e/hjalpare.ts:56` har
      `performedAt: '2024-04-04'` — **över två år tillbaka.**

      Det var ofarligt så länge vakterna mätte `getLastPerformance`, som inte bryr sig om
      ålder. Det slutade vara ofarligt i samma stund en vakt mätte `getSetAverages`, som har en
      **åttaveckorsgräns**: setet faller då på åldern oavsett vad vakten tror sig mäta. Vakt 5
      är rättad för egen del (den seedar nu inom gränsen), men **mallen är kvar och nästa vakt
      går i samma fälla.**

      **Klart när:** förvalet ligger nära nutid — eller, om ett gammalt datum är poängen för
      någon vakt, att `seedaRått` tvingar anroparen att välja. **Hör ihop med 12.31**
      (konstanten heter inte längre vad den är); gör dem i samma commit, det är samma rad.

- [ ] **12.39 `getSetAverages` drar in hela `exercises` i sin observerade mängd. Ny 2026-08-26.**
      **Punkt 2 i `/simplify`-listan under `11B.0f`, som lämnades till 4.2 och inte gjordes
      där heller.** Skrivs upp som egen rad så den inte blir kvar i en löptext.

      Funktionen gör ett eget `database.exercises.get()` för att få `equipment`. Anropas den
      från `useLiveQuery` — vilket `ExerciseCard` gör, ett anrop per övningskort — hamnar hela
      `exercises`-tabellen i den observerade mängden, så **varje skrivning dit kör om samtliga
      korts historikskanning.**

      **Latent i dag:** `ensureCatalog` anropas bara från tester. **Skarpt i fas 7**, när
      synk-pullen skriver `exercises` under pågående pass.

      **Åtgärden är billig och redan uttänkt:** låt anroparen skicka övningsraden.
      `TodayPage.tsx` har den redan i minnet och skickar ner den som prop till `ExerciseCard`,
      som i sin tur redan tar emot `exercise`. Signaturen blir `getSetAverages(exerciseId,
      database, { excludeWorkoutId, equipment })` — eller `equipment` som eget argument.

      **Klart när:** frågan läser inte `exercises`, och ett test visar att viktsteget följer
      den utrustning anroparen skickar.

- [ ] **12.40 Briefen saknar en kanttoken för element som ligger direkt på papperet. Ny 2026-08-26.**
      Hittad i steg 4.2 del C, genom mätning. **Inte ett fel i koden i dag** — timerchipet är
      korrekt — men en lucka i tokensystemet som kommer tillbaka.

      §1b väg C mätte alla kanttokens **mot vitt kort**, eftersom fynd 3 slår fast att tonade
      ytor alltid ligger på ett kort. `--color-ok-line` fick **3,55:1** där. Men §3.1 säger
      samtidigt att vilotimern ska vara *"en chip i flödet, inte ett banderoll-lager"*, alltså
      ett semantiskt element **direkt på papperet** — och där mäter samma token:

      | Token | Mot papper (ut) | Mot `ok-bg` (in) |
      |---|---|---|
      | `--color-ok-line` | **2,99** ⛔ | 3,17 ✓ |
      | `--color-ok-text` | **5,50** ✓ | 5,83 ✓ |

      **Timerchipet använder därför `--color-ok-text` som kant**, vilket fungerar men är fel
      namn på rätt värde: tokenen föddes som textfärg. Skälet står utskrivet i `RestTimer.tsx`.

      ⚠️ **Frågan återkommer i 4.3.** Historik lägger med all sannolikhet semantiska element
      utanför kort, och då upprepas valet — antingen med samma tysta avsteg eller med ett eget
      beslut varje gång.

      🔄 **Frågan är nu MÄTBAR, vilket den inte var när raden skrevs.** `e2e/kontrast.spec.ts`
      (12.36) mäter varje kant mot **både** sitt inre och sitt yttre underlag och kräver 3:1 på
      båda — alltså exakt den tabell den här uppgiften handlar om. Beslutet i 4.3 fattas därför
      mot en körbar mätning i stället för mot handräknade tal.

      **Att avgöra, och det är en designfråga för Adam att godkänna:** ska §1b få en andra
      kantnivå för element på papperet (t.ex. `--color-ok-line-paper`), eller ska regeln i
      stället vara *"semantiska element ligger alltid på ett kort"* — vilket hade tvingat om
      timerchipet? **Ta det i 4.3, inte tidigare**, så beslutet fattas mot ett verkligt andra
      fall och inte mot ett hypotetiskt.

      ⏰ **4.3 GAV INGET ANDRA FALL. Kontrollerat 2026-08-29, och frågan står kvar öppen.**
      Uppgiften ovan förutsåg att *"Historik med all sannolikhet lägger semantiska element
      utanför kort"*. Det blev inte så, och skälet är strukturellt snarare än en slump:

      | Element på Historik | Ligger på | Semantiskt? |
      |---|---|---|
      | `Pågår` (`--color-ok-text`) | **vitt kort** — det är en rad i passkortet | ja, men på kort = väg C:s normalfall |
      | Segmentkontrollen (`--color-line-strong`) | papperet | **nej** — neutral kant som identifierar en kontroll |
      | Passkorten, övningslistan | papperet | nej — skugga, ingen semantik |

      **Att fatta beslutet nu hade alltså varit att fatta det mot ett enda fall igen**, vilket
      är precis vad den här uppgiften ber oss låta bli. **Nästa verkliga tillfälle är 4.4:**
      statistiksegmentet har staplar, kurvor och avvikelser, och där uppstår frågan på riktigt.

      💡 **Sidovinsten var större än frågan:** när segmentets kant skulle mätas visade ett
      sabotage att `e2e/kontrast.spec.ts` **ursäktade** den. Undantagets kontrollista räknade
      `button, input, select, textarea, a` — men inte `fieldset` eller `role="group"`, och
      radioknapparna inuti är `sr-only`. En `--color-line`-kant på kontrollen gick alltså grön,
      1,09:1 mot papperet. Lagat i samma commit som del C, och sabotaget som var grönt är rött nu.

- [ ] **12.41 Kontrastvakten ser fyra lägen, inte hela appen. Ny 2026-08-27.**
      Utbruten ur 12.36 så att luckan inte blir kvar i en löptext. **Inte ett fel i vakten** —
      12.36:s **Klart när** namnger Pass, Historik och Inställningar, och alla tre mäts. Men
      fyra lägen är fyra lägen.

      **Vad som aldrig mäts i dag**, och alla fyra innehåller kontroller med samma
      `--color-line`-kant som just lagades på elva andra ställen:

      | Vad | Var | Varför den inte nås |
      |---|---|---|
      | Bottenarket för setjustering | `SetAdjustSheet.tsx` | Öppnas bara av ett tryck på en setrad |
      | Övningsväljaren | `ExercisePicker.tsx` | Egen dialog ovanpå passet |
      | Fritextinmatningen | `QuickLog.tsx`, `ManualEntry.tsx` | Fälls ut ur genvägen |
      | **Hela rutten `/ovning/:id`** | `ExercisePage.tsx` | Står inte i `LÄGEN` alls |

      ⚠️ **Rutten är den allvarligaste av de fyra.** De tre andra är överlagringar som kräver en
      gest; `/ovning/:id` är en vanlig sida vem som helst når från historiken, och den mäts
      **inte alls**. Att lägga till den är två rader i `LÄGEN`.

      💡 **Överlagringarna bär en egen risk vakten i dag inte kan uttrycka:** ett ark ligger
      ovanpå annat innehåll, och lagermodellen i `bakgrundslager()` går uppåt genom
      *förfäderskedjan* — inte genom det som råkar ligga bakom på skärmen. Så länge arket har en
      egen ogenomskinlig bakgrund stämmer det ändå. **Det ska verifieras, inte antas**, och
      faller det är rätt svar att rapportera elementet som omätbart snarare än att gissa.

      **Klart när:** `/ovning/:id` mäts som eget läge, de tre överlagringarna mäts i öppnat
      tillstånd, och överlagringarnas underlag är kontrollerat — antingen som korrekt mätt eller
      som uttryckligen omätbart.

> ### 🔍 12.42–12.47 kommer ur `/code-review` 2026-08-27, basen `cc54451`
>
> Första granskningen av **steg 4.2** — förra sessionen bad om den och den kördes aldrig. Två
> kalla agenter, en per axel (Standards / Spec), enligt `.claude/skills/code-review`.
> **Tolv fynd, alla verifierade mot koden innan de skrevs hit.** Ett av dem var mitt (12.36:s
> "tio kontroller" är elva); fem spec-fynd och två standardbrott satt i steg 4.2.
>
> | # | Vad | Sort | Utfall |
> |---|---|---|---|
> | ~~**12.42**~~ | ~~Del A:s härledning är inte delad~~ | Spec | ✅ **KLAR.** Delad räknare, saboterad i båda riktningarna |
> | ~~**12.43**~~ | ~~Timerchipet är ingen chip~~ | Spec, synlig | ✅ **KLAR.** Adam undantog timern i briefen; koden orörd |
> | ~~**12.44**~~ | ~~Metaraden bär `{klara} av {n}`~~ | Spec, synlig | ✅ **KLAR.** Adams fråga hittade **uppvärmningsbuggen** granskningen missade |
> | ~~**12.45**~~ | ~~Kortets indrag är 12 px, inte 16~~ | Spec, synlig | ✅ **KLAR.** Adam behöll 12 px; specen rättad |
> | ~~**12.46**~~ | ~~`DESIGN.md` är osann på tre punkter~~ | Standard, regel 1 | ✅ **KLAR.** Alla tre var dokumentfel, inte kodfel |
> | ~~**12.47**~~ | ~~Två baslinjeluktar kvar (punkt 1 klar)~~ | Omdöme | ✅ **KLAR 2026-08-27** med `/simplify`. Punkt 3 var **elva** ställen, inte tre |
> | ~~**12.48**~~ | ~~*"Uppvärmning räknas inte"* skrivs om av varje konsument~~ | 🔴 **Verkligt fel** | ✅ **KLAR.** Det var **fem** ställen, inte tre — se uppgiften |
> | ~~**12.49**~~ | ~~Arket och raden numrerade samma rad olika~~ | 🔴 **Verkligt fel, synligt** | ✅ **KLAR.** Utbruten ur `/simplify` av 12.47. **Sviten hade aldrig en uppvärmningsrad** — därför överlevde den |
>
> ✅ **12.48 var den enda kvarvarande som kunde ge fel siffror**, och den var inte ett
> granskningsfynd — den kom ur **Adams fråga** *"vart kommer det ifrån?"*. Två granskaragenter
> läste hela diffen och såg ingen av förekomsterna, eftersom de mätte mot specen — och specen
> hade fel tillsammans med koden.
>
> ✅ **Fyra fynd åtgärdades direkt 2026-08-27 och blev därför aldrig uppgifter:** em-dashen i
> `SetRow.tsx:265` (`DESIGN.md` §0.3), felsiffran *"tio"* → *"elva"* i tre dokument,
> `EXTERNT.md`:s saknade **Övervägt**-rader för axe-core och långtryckspaketen, och del B:s
> för bokstavliga emoji-kriterium.
>
> 🔴 **12.46 ligger först och det är inte en smaksak.** Så länge `DESIGN.md` påstår saker koden
> motsäger är briefen inte längre sanningskällan, och `CLAUDE.md` regel 1 vilar på att den är
> det. De tre andra spec-fynden är synliga ändringar Adam ska godkänna.

- [x] **12.42 Del A:s härledning är inte delad — `history.ts` räknar arbetsset själv.
      Ny 2026-08-27. KLAR 2026-08-27.**

      ✅ **`skapaArbetssetRäknare` i `src/lib/worksets.ts` är nu regeln, och båda sidor anropar
      den.** `history.ts`:s egna `Map<string, number>` är borta.

      💡 **Det som löste knuten var att hitta den MINDRE primitiven.** Arraysignaturen
      (`workSetIndices`) var aldrig regeln — den var ett **specialfall** av den, med ett enda
      pass. Regeln är en *räknare*: anropas en gång per set, svarar med numret eller `null` för
      uppvärmning. `workSetIndices` är numera byggd på den, och `getSetAverages` kan använda
      den utan att ge upp sin baklängesgång genom indexet. **När två konsumenter inte kan dela
      en funktion är frågan ofta inte "vem böjer sig" utan "vilken mindre sak är båda
      specialfall av".**

      ✅ **SABOTERAD I BÅDA RIKTNINGARNA, alltså inte antagen grön** — testerna gick nämligen
      gröna direkt, vilket är den signal 12.37 handlar om:
      1. Räknaren slutade hoppa över uppvärmning → **3 röda**, ett i `history.test.ts`
         (kontraktstestet) och två i `worksets.test.ts`. Båda konsumenterna alltså bärande.
      2. Räknaren ignorerade pass-nyckeln (en global räknare) → **6 röda i `history.test.ts`**
         och **noll i `worksets.test.ts`**. Det senare är rätt och inte en lucka: en setlista
         innehåller per definition ett enda pass, så nyckeln kan inte observeras där.

      ⏰ **Kontraktstestet i `history.test.ts` behölls, tvärtemot vad den här uppgiften först
      gissade.** Dess egen kommentar bär skälet: *"Testet är rött om NÅGONDERA sidan ändrar
      regeln, vilket en delad funktion ensam inte hade garanterat — **den kan anropas fel**."*
      Det är sant även nu: `getSetAverages` måste fortfarande filtrera i rätt ordning och
      `ExerciseCard` slå upp med rätt nummer. **En delad regel tar bort risken att två
      implementationer glider isär, inte risken att en av dem används fel.**
      Steg 4.2 del A säger: *"**Åtgärden är en delad härledning som båda sidor anropar**, inte
      två räkningar som ska råka stämma. **Kopplingen ska vara kod, inte prosa i en
      doc-kommentar.**"*

      `src/lib/worksets.ts` finns och `ExerciseCard` anropar den. Men
      [history.ts:315-319](../src/db/history.ts) räknar fortfarande själv:

      ```
      const arbetssetIPasset = new Map<string, number>();
      … const nummer = arbetssetIPasset.get(s.workoutId) ?? 0;
      ```

      **Två implementationer av samma regel, precis vad delen förbjöd.** Kopplingen är i dag ett
      kontraktstest i `history.test.ts` — bättre än prosa, men det är fortfarande *"två räkningar
      som ska råka stämma"*, med ett test som larmar i efterhand.

      ⚠️ **Varför det inte är en trivial utbytning, och det ska stå här:** formerna skiljer sig.
      `workSetIndices` mappar en **array** i ett pass; `getSetAverages` räknar löpande över en
      **ström av set från flera pass**, grupperade på `workoutId`. En delad härledning måste
      alltså vara en primitiv båda kan bygga på — en räknare per pass — inte den nuvarande
      arraysignaturen. **Det är designarbete, inte en flytt.**

      **Klart när:** regeln "vilket arbetssetnummer har det här setet" finns på **ett** ställe,
      båda konsumenterna anropar det, och kontraktstestet i `history.test.ts` blir överflödigt
      eller skrivs om till att mäta primitivet.

- [x] **12.43 Timerchipet är ingen chip. Ny 2026-08-27. SYNLIG.
      KLAR 2026-08-27 — briefen rättad, koden orörd.**

      ✅ **Adams beslut: undanta timern i `DESIGN.md`.** Halva kravet var redan uppfyllt —
      timern ligger i flödet och skymmer ingenting, vilket var problemet meningen skrevs för
      att lösa. **Formdelen visade sig ogenomförbar när innehållet fanns:** chipet bär 32
      px-siffran, etiketten, `−30`, `+30` och avbryt på samma rad, och på 375 px finns ingen
      pillerform som rymmer det utan att äta raden. De tre knapparna är dessutom hur man
      justerar vilan mitt i ett pass och får inte kosta ett extra tryck.

      💡 **Lärdomen ligger ett steg före del C:s `Klart när`.** Meningen *"utan att äta en hel
      rad"* skrevs i en skiss **innan chipets innehåll var bestämt**. **Ett formkrav utan
      innehållet framför sig är en gissning**, och den gissningen överlevde sedan hela vägen
      till en uppgift och en granskning innan någon prövade den mot fem knappar på 375 px.

      Steg 4.2 del C:s brödtext: *"Formen: **en chip i flödet, inte ett banderoll-lager** —
      timern får inte skymma setraden man just loggat. Siffran är 32 px (`--text-timer`), alltså
      en *stor* chip."* `DESIGN.md:511`: *"Knappar och chips: pillerform."*

      `RestTimer.tsx:54` är `'rounded-lg border p-3'` — **full radbredd, radie 8 px.**

      ✅ **Halva kravet ÄR uppfyllt:** chipet ligger i flödet och är inget banderoll-lager, så
      den del som handlade om att inte skymma setraden är löst. **Formen är det som saknas.**

      ⛔ **Delen såg uppfylld ut för att dess `Klart när` bara mätte kontrast.** Se rättelserutan
      i `Steg 4.2`. Formen grindades aldrig.

      ⚠️ **Att göra den pillerformad är inte gratis, och därför är det Adams beslut:** chipet
      bär i dag en 32 px-siffra, en etikett, två `±`-knappar och en avbrytknapp på samma rad.
      En pillerform som inte äter hela raden rymmer inte allt det på 375 px. **Antingen** krymper
      innehållet, **eller** så gäller pillerformen bara det utgångna läget (som har färre
      knappar), **eller** så ändras `DESIGN.md` så att timern uttryckligen undantas från
      chip-regeln. Alla tre är försvarbara; ingen av dem är min att välja.

      ✅ **Vägen som valdes var den tredje:** `DESIGN.md` undantar timern uttryckligen, både i
      §3.1 och i §"Formspråk"-listan. Koden är orörd, så kontrastvakten är oförändrat grön.

- [x] **12.44 Metaraden bär fortfarande `{klara} av {n} set`. Ny 2026-08-27. SYNLIG.
      KLAR 2026-08-27 — och Adams fråga hittade en bugg granskningen missade.**

      ✅ **Formen är `N set`, där N är LOGGADE ARBETSSET.** Adams beslut, med hans eget skäl:
      *"man vet ju inte till en början hur många set man vill köra på en övning. Borde ju bara
      öka 1x per set som man faktiskt kör."* Tomfallet är mockupens `inga set än`.

      🔴 **BUGGEN INGEN AV GRANSKARNA SÅG: båda talen räknade uppvärmningen som ett set.**
      Adam frågade *"vart kommer det ifrån?"* om nämnaren, och svaret blottade två fel:

      1. **Nämnaren var appens gissning.** `startExercise` (`plan.ts`) skapar lika många rader
         som förra passets arbetsset, eller tre tomma utan historik. *"1 av 4 set"* påstod
         alltså ett mål användaren aldrig satt.
      2. **Täljaren OCH nämnaren räknade uppvärmning.** Ett pass med uppvärmning + tre
         arbetsset läste `av 4 set`, och bockades uppvärmningen av stod det `2 av 4`.
         **Resten av appen räknar konsekvent arbetsset** — `getSetAverages`, `workSetIndices`,
         `summarizeWorkout`, `getExerciseHistory`, `getPersonalRecords` filtrerar alla bort
         den. Volymen på **samma rad** gjorde det också, så raden bar två tal ur olika mängder.

      ⏰ **Tredje förekomsten hittades i samma andetag:** passets sammanfattningsruta i
      `TodayPage` läste `3 SET · 0 VOLYM KG` för ett pass med uppvärmning + två arbetsset —
      antalet räknade uppvärmningen, volymen bredvid inte. Rättad i samma commit. **Mönstret är
      utbrutet som 12.48.**

      ✅ **Uppmätt, inte antaget** (`skarmdumpar/`-körning, WebKit 375 px):

      | Steg | Metaraden | Före |
      |---|---|---|
      | Uppvärmningen avbockad | `Skivstång · inga set än` | `Skivstång · 1 av 4 set` |
      | Arbetsset 1 avbockat | `Skivstång · 1 set` | `2 av 4 set` |
      | Arbetsset 2 avbockat | `Skivstång · 2 set` | `3 av 4 set` |

      💡 **Lärdomen är inte om uppvärmning.** Två granskaragenter läste hela diffen och såg att
      formen avvek från specen; **ingen av dem frågade vad talet betydde.** Adams *"jag förstår
      inte vart det kommer ifrån"* gjorde det, och det var den frågan som hittade felet. En
      granskning mäter mot specen — den kan inte upptäcka att specen och koden har fel
      tillsammans.
      Steg 4.2 del B: *"**Metaraden** under namnet: `Skivstång · 3 set · 1 385 kg`. … I dag står
      där `{klara} av {n} set · sist 90 kg × 5`."*

      [ExerciseCard.tsx:94](../src/ui/ExerciseCard.tsx) producerar
      `` `${klara} av ${planned.sets.length} set` ``, alltså **`Skivstång · 0 av 3 set · 1 385 kg`**.
      Volymen lades till och `sist 90 kg × 5` togs bort — men `{klara} av {n}`, den enda del
      specen uttryckligen kallade *"i dag"*, blev kvar.

      ⚠️ **Det är inte självklart att specen har rätt, och det ska sägas.** `0 av 3 set` bär
      **framdrift** — hur långt man kommit i övningen — vilket `3 set` inte gör. Specen kan ha
      förbisett det. **Frågan är alltså inte "följ specen" utan "vilken av de två vill du ha".**
      Mockupens tomfall (`Kabel · inga set än`) finns inte heller i koden.

      **Klart när:** Adam har valt form, `TASKS.md` och `DESIGN.md` säger samma sak som koden,
      och tomfallet är hanterat.

- [x] **12.45 Kortets indrag är 12 px, inte 16 som specen säger. Ny 2026-08-27. SYNLIG.
      KLAR 2026-08-27 — specen rättad, koden orörd.**

      ✅ **Adams beslut: behåll 12 px.** Skälet är att indraget aldrig var kortets. Det kommer
      ur `px-3` på `<main>` i `AppShell.tsx` och gäller **alla skärmar**, så mockupens 16 px
      hade flyttat hela appen för 4 px — och på iPhone SE är det den bredd som är minst.
      Alternativet, ett eget indrag på bara övningskortet, hade brutit linjeringen mot allt
      annat på passkärmen.

      💡 **Fyndet var ändå värt något:** specen beskrev ett *korts* egenskap som i själva
      verket är en *layoutkonstant för hela appen*. Nästa gång ett indrag skrivs in i en
      uppgift ska det stå vilket av de två det är.

      Steg 4.2 del B: *"**Ytan:** vit, radie 18 px … indragen **16 px**."*
      [AppShell.tsx:26](../src/ui/AppShell.tsx) sätter `px-3` = **12 px**.

      ⚠️ **Paddingen sitter på `<main>`, inte på kortet.** Ändras den till `px-4` flyttas
      **allt innehåll på alla skärmar** — Historik, Inställningar, Övningar, flikraden ligger
      utanför. Det är alltså en app-bred layoutändring och inte den lokala kortjustering specen
      lät som. Alternativet är ett eget indrag på övningskortet, vilket bryter linjeringen mot
      allt annat på passkärmen.

      **Klart när:** Adam har valt mellan app-brett 16 px och att lämna 12 px, och `TASKS.md`
      del B säger samma sak som koden. **Mät med `e2e/no-horizontal-overflow.spec.ts` efteråt** —
      4 px mer padding på 375 px är den bredd som är minst.

- [x] **12.46 `DESIGN.md` påstår tre saker koden motsäger. Ny 2026-08-27. REGEL 1.
      KLAR 2026-08-27.**

      ✅ **Alla tre rättade, och i alla tre fallen var det dokumentet som ändrades — inte
      koden.** Skälen fanns redan och var goda; de låg bara på fel ställe. Punkt 3 är
      **inte avgjord**, bara nedskriven som öppen, eftersom beslutet tillhör `12.40`.
      `TASKS.md` `11B.0f`:s `–`-rad är rättad på samma sätt, med rättelseruta.

      💡 **Det gemensamma mönstret i alla tre är värt mer än rättelserna:** ändringen gjordes i
      koden, skälet skrevs i en kodkommentar, och briefen lämnades. Kodkommentaren är rätt
      plats för *hur*, men `DESIGN.md` §0.1 säger att den som ändrar ett värde skriver **varför
      i samma commit** — och regel 1 vilar på att briefen är sanningskällan. **En brief som
      halkar efter koden slutar vara en brief och blir en logg.**

      🔴 **Den här ligger först av granskningens fynd**, och skälet är inte städning: så länge
      briefen är osann är den inte längre sanningskällan, och `CLAUDE.md` regel 1 vilar på att
      den är det. `DESIGN.md` §0.1 säger dessutom uttryckligen att *"den som ändrar ett värde
      skriver varför i samma commit"* — det gjordes inte i någon av de tre.

      | # | `DESIGN.md` säger | Koden gör | Sedan |
      |---|---|---|---|
      | 1 | Rad 1312–1316: `±`-stegen är *"öppen följdfråga, inte avgjord … ligger kvar som förslag tills Adam sagt till"* | `SetAdjustSheet` härleder dem ur `weightStepFor` | Steg 4.2 **del D** |
      | 2 | Rad ~1326: *"`–` reserveras för när underlag saknas helt"* | `SetRow` visar **ingenting** — `{average && <Snitt …>}` | Steg 4.2 **del A** |
      | 3 | §1b: kanttokens är mätta **mot vitt kort** | `RestTimer` använder `--color-ok-text` som kant för att chipet ligger på papperet | Steg 4.2 **del C** |

      💡 **I alla tre fallen har koden sannolikt rätt och dokumentet fel.** Skälen är utskrivna
      och goda — särskilt nr 2, där `SetRow.tsx:31-36` förklarar att `–`-regeln skrevs när
      snittet var en egen kolumn som annars stod tom, och att ett streck under värdet i form 2B
      *"skapar en rad som ser ut att bära information"*. **Åtgärden är alltså att flytta skälen
      till briefen, inte att ändra koden.**

      ⛔ Nr 3 ska **inte** avgöras här — den är `12.40`, som hör till steg 4.3. Skriv in att
      avsteget finns och att frågan är öppen; avgör den inte.

      **Klart när:** ingen av de tre raderna i `DESIGN.md` motsäger koden, skälen står i briefen
      och inte bara i kodkommentarer, och `TASKS.md` `11B.0f`:s `–`-rad är rättad på samma sätt.

- [x] **12.47 Baslinjeluktar ur granskningen. Ny 2026-08-27. OMDÖMESFRÅGOR.
      Punkt 1 KLAR 2026-08-27; punkt 2 och 3 kvar.**
      Ingen av dem är en bugg. De ligger här för att `/simplify` annars hittar dem igen från
      noll, och för att den första har en verklig felrisk bakom sig.

      1. ✅ **KLAR 2026-08-27. Tröskeln `3` var kopierad, inte delad.** `ANTAL_PASS_I_SNITTET`
         var **modullokal** i [history.ts](../src/db/history.ts), medan `SetRow` skrev talet
         rått på **två** ställen: `average.workoutCount < 3` (skärmläsartexten) och `pass < 3`
         (prickarna). **Ändrades tröskeln i frågan slutade båda stämma, tyst** — frågan hade
         levererat fyra pass medan skärmen fortsatte kalla underlaget tunt. Konstanten är nu
         exporterad och alla fyra användningar går via den.

         💡 **Inget sabotage gjordes här, och det är ett medvetet val värt att skriva ut.**
         Felläget var **divergens mellan två tal**, och den är nu omöjlig per konstruktion —
         det finns bara ett tal. `npm run typecheck` bevisar att referenserna löser ut; ett
         sabotage hade bara visat att en konstant är en konstant. **Sabotage är rätt verktyg
         när en vakt påstår sig mäta något; det är fel verktyg mot en strukturell garanti.**
         Jämför 12.37, som handlar om det förra.
      2. **De två talknapparna i `SetRow` är samma form** — `{...långtryck}` + `<span className=
         "block text-set leading-tight">` + `{average && <Snitt/>}`, en gång för Kg och en för
         Reps. En `TalKnapp` vill födas.
      3. **E2E-lokatorn `/^Vikt .*för set 1/` står på tre ställen** — två i `langtryck.spec.ts`,
         en i `passvy.spec.ts` — trots att `hjalpare.ts` redan äger `setlista`.

      💡 **Granskaren flaggade också *Shotgun Surgery* på kanttokenen** (`822babd` rör fem filer
      för en logisk ändring) **och dubblerad uppsättning i `kontrast.spec.ts`** (staleness-testet
      kör om alla fyra lägen). Båda är noterade och **avfärdade med skäl**: den första är en
      tokenändring utan naturlig gemensam hemvist så länge Tailwind-klasser står i JSX, och den
      andra är priset för att granskningen ska vara oberoende av de fyra lägestesterna.

      **Klart när:** punkt 1 är åtgärdad. Punkt 2 och 3 är `/simplify`-material och behöver inte
      göras här.

      **Punkt 2 och 3 åtgärdade 2026-08-27 med `/simplify`**, fyra kalla agenter (återanvändning,
      förenkling, effektivitet, rätt djup) mot `SetRow.tsx` och de tre e2e-filerna.

      > 🔴 **PUNKT 3 VAR ELVA STÄLLEN, INTE TRE — och `hjalpare.ts` var själv fem av dem.**
      > Filen som äger `setlista` byggde alltså sina egna setradslokatorer inline.
      >
      > **Den mindre primitiven är radens identitetsfras**, inte lokatorn. Alla elva blandade
      > ihop två frågor: *vilken knapp* (övning, rad, fält) och *vad den visar just nu*
      > (`inte angiven` / `10 kilo`). Bakas tillståndet in i identiteten måste varje anropsplats
      > kunna hela etikettgrammatiken — även `langtryck.spec.ts`, som inte behöver veta något om
      > vikter. `talknapp`, `bockknapp` och `justeringsarket` adresserar; tillståndet assertas
      > med `toHaveAccessibleName`. Samma rörelse som `worksets.ts` gjorde i 12.42.

      **Regeln som föll ut och är värd mer än fyndet:** *fixturer binds till appen, påståenden
      stavas självständigt.* Därför exporteras `LÅNGTRYCK_MS` och vakten håller nere fingret
      `+250` (tröskeln är en fixtur den ska överskrida), medan etikettsträngarna fortsätter
      stavas för hand i `e2e/` (de är påståendet — importeras de mäter sviten sin egen import).

      ⚠️ **TVÅ SABOTAGE RÄTTADE PÅSTÅENDEN JAG SJÄLV HADE SKRIVIT.** Båda hade passerat som
      sanna utan kontrollen, och det är precis vad `12.37` handlar om:

      | Vad jag skrev | Vad sabotaget visade |
      |---|---|
      | *"`^`-ankaret är det som skiljer Kg- från Reps-knappen"* | Ankaret borttaget: **allt grönt.** Ordet `Vikt` borttaget: *strict mode violation, resolved to 2 elements.* **Ordet vaktar, ankaret gör det inte** |
      | Kg-etiketten är vaktad av e2e | Bara **början** är. `viktText`-grenarna omkastade → 3 röda. Verbet i slutet ändrat till `JUSTERA` → **allt grönt**, eftersom sviten ankrar sina regexar i etikettens början |

      Båda står nu utskrivna i koden, som `worksets.test.ts` gör med tomma-listan-fallet.

      ✏️ **Commit `f6e298e`:s meddelande säger `641,93 kB`. Rätt siffra är `642,01 kB`.** Jag
      skrev talet innan jag byggde. **Fjärde gången i samma familj** — jämför de tre
      off-by-one-felen i `HANDOFF.md`, alla av samma sort: ett tal nedskrivet innan det fanns
      något att mäta. Historiken skrivs inte om; siffran står rätt här.

      **Punkt 2:** `TalKnapp` bär fem invarianter som stod i två exemplar. **Etiketten ligger
      utanför med flit** — de två knapparna har inte samma form på etikettnivå (`Vikt <värde>
      kilo för <rad>` mot `<värde> reps för <rad>`; fältet står först i den ena och efter talet
      i den andra), så ett `fält`-prop hade flyttat ternärerna i stället för att ta bort dem.
      `useLongPress` anropas inte inuti: båda knapparna delar **en** hook-instans, och en egen
      per knapp vore en beteendeändring smugglad in i en förenkling. **Båda avgränsningarna kom
      från två granskare oberoende av varandra.**

      ⏰ **FYND SOM INTE ÅTGÄRDADES, med skäl.** Granskningen gav långt mer än punkt 2 och 3:

      | Fynd | Varför inte nu |
      |---|---|
      | `React.memo` + `useCallback`-kedjan (TodayPage → ExerciseCard → SetRow) | Prestanda som kräver **mätning först**. Halvvägs ger noll: varje prop är ny per render hela vägen upp, så `React.memo` ensamt skär inget arbete. Egen uppgift, inte en förenkling |
      | Exponera Dexie-instansen för `skrivRått`, batcha sådder | Ändrar testinfrastrukturen och kräver en mätning av att `useLiveQuery` verkligen väcks innan en `goto` tas bort |
      | Ersätt handrullat långtryck med `locator.click({ delay })` | Rör gest-timing, alltså det enda `langtryck.spec.ts` mäter. Frestande enligt §7.1, men inte i samma svep som en lokatoromskrivning |
      | `passMedLoggatSet`-hjälpare (sekvensen står på **fem** ställen) | **Två granskare oberoende.** Verklig, men två av de fem ligger i `kontrast.spec.ts` och `historiksida.spec.ts`, utanför granskningens mål. Halv adoption vore en egen lukt |
      | `getSetAverages` läser `exercises` | **Är redan `12.39`** — granskningen bekräftade den oberoende |
      | Predikatet `< ANTAL_PASS_I_SNITTET` på två ställen | Två granskare. Litet, men rör `db/history.ts` och hör ihop med `12.40`/4.3 |

      🔴 **En korrekthetsbugg hittades och lämnades medvetet:** `ExerciseCard.tsx:277` skickar
      radens plats i LISTAN till `SetAdjustSheet`, medan raden själv numreras bland arbetsseten.
      Med en uppvärmningsrad överst säger raden *"set 2"* och arket *"set 3"*. **Två granskare
      oberoende.** `/simplify` letar inte buggar — den hör till `/code-review`, och den är
      utbruten som egen uppgift.

      **Verifierat 2026-08-27:** 308 tester i 24 filer, typecheck rent, lint 0 fel, bygget
      **642,01 kB** (gzip 193,28), 81 e2e gröna.

- [x] **12.48 "Uppvärmning räknas inte" är en regel varje konsument skriver om själv.
      Ny 2026-08-27.**
      Utbruten ur 12.44, där samma fel hittades på **två ställen samtidigt** — och det var
      tredje gången totalt.

      **Regeln finns redan i frågelagret**, tre gånger: `getExerciseHistory`,
      `getPersonalRecords` och `summarizeWorkout` filtrerar alla `isWarmup`, och `history.ts`
      skriver ut skälet — *"De är förberedelse, inte arbete, och att blanda in dem gör siffran
      obrukbar för jämförelser mellan pass."*

      ⛔ **Men den som räknar i en SKÄRM måste minnas den själv**, och tre av tre glömde:

      | Var | Vad som räknades fel | Rättat |
      |---|---|---|
      | Startskärmens volym | Uppvärmning räknades in | **12.16** |
      | Övningskortets metarad + volym | Båda räknade uppvärmning | **12.44** |
      | Passets sammanfattningsruta (`klaraSet`) | Antalet räknade uppvärmning, volymen inte | **12.44** |

      💡 **Det är inte slarv tre gånger, det är en saknad söm.** Ett `planned.sets.filter(...)`
      i en komponent har ingen aning om att `isWarmup` bär en regel; typen tillåter det lika
      gärna. Frågelagret har skyddet, skärmlagret har det inte — och det är skärmlagret som
      räknar.

      **Möjliga vägar, ingen vald:**
      1. En härledning i `src/lib/` — `loggadeArbetsset(sets)` och `volymAv(sets)` — som
         skärmarna anropar. Samma rörelse som **12.42** gjorde för arbetssetnumret, och den
         lyckades där.
      2. Låta `PlannedSet` bära ett härlett fält, så att den som filtrerar fel syns.
      3. Ett test som går igenom varje skärm som visar ett setantal. Svagast — det fångar
         dagens tre, inte nästa.

      ⚠️ **Väg 1 är den som redan bevisat sig i det här projektet**, men den löser inte att en
      ny komponent kan låta bli att anropa den. Det är samma gräns som `12.42`:s kontraktstest
      pekar ut: *"en delad funktion garanterar inte att den anropas rätt."*

      **Klart när:** regeln finns på ett ställe skärmlagret kan nå, de tre kända ställena går
      via den, och det står utskrivet vad som INTE skyddas av valet.

      **Åtgärdad 2026-08-27. Väg 1, enligt Adams beslut.** Regeln bor i `src/lib/worksets.ts`
      som `loggadeArbetsset(sets)` och `volymAv(sets)`, med egna tester. `ExerciseCard` och
      `TodayPage` anropar dem i stället för att skriva om filtret.

      > 🔴 **DET VAR FEM STÄLLEN, INTE TRE. Två till hittades under arbetet**, och det ena var
      > allvarligare än de tre kända:
      >
      > | Var | Vad som var fel |
      > |---|---|
      > | **Knappen "Kopiera förra passet"** (`beskrivPass`) | Etiketten säger *"N övningar · M set"* om vad knappen kommer att hämta — men `copyWorkoutIntoPlan` hoppar över uppvärmning. **En övning man bara värmt upp på följde inte med alls**, och etiketten räknade den ändå. Talet var inte skevt, det var ett löfte som bröts |
      > | **Historiksidan** (`setCount`, båda listorna) | `N set · M kg` bredvid varandra där bara volymen uteslöt uppvärmningen |
      >
      > **Historiksidan var Adams att avgöra och inte min**, eftersom `setCount` där var ett
      > medvetet beslut från **12.16** (*"de gjordes"*) — inte ett förbiseende. Han valde
      > **samma regel överallt** 2026-08-27. Knappen rättades utan att fråga: där finns inget
      > val, bara ett tal som ljuger om vad knappen gör.

      **Vad som INTE skyddas av valet — läs det här innan du litar på sömmen:**

      1. ⛔ **En ny komponent kan låta bli att anropa `loggadeArbetsset`** och skriva
         `sets.filter(s => s.loggedSetId !== null)` precis som förut. Ingenting hindrar det;
         typen tillåter det lika gärna som den alltid gjort. Det är samma gräns som `12.42`:s
         kontraktstest pekar ut — *"en delad funktion garanterar inte att den anropas rätt"* —
         och den är accepterad, inte löst.
      2. ⛔ **Frågelagret delar inte funktionen.** `history.ts` och `repo.ts` har kvar sina egna
         `filter(s => !s.isWarmup)`. Det är avsiktligt: predikatet skiljer sig mellan lagren —
         planens rader måste dessutom vara avbockade (`loggedSetId !== null`), databasens rader
         är per definition redan loggade. Att pressa ihop dem hade gett en funktion vars
         betydelse berodde på anroparen. **Frågelagret är inte heller det som gick sönder** —
         alla fem förekomsterna satt i tal som visas på en skärm.
      3. ⛔ **Att volymen summeras via `volumeKg` vaktas inte av något test.** Vikter kommer i
         halvkilosteg och reps i heltal, så avrundningen kan inte skilja sig från en rå
         multiplikation på något värde appen kan producera. Delegeringen är ett val om var
         regeln bor, inte ett beteende ett test kan falla på. Det står också i testet.
      4. ⏰ **Ett pass man BARA värmde upp på läser nu `0 set · 0 kg`.** Uppmätt, inte antaget —
         raden står som ett test i `history.test.ts`. Passet försvinner inte: `exerciseIds`
         räknar fortfarande alla set, så övningens namn syns kvar i raden. Det är den
         konsekventa läsningen av Adams beslut (förberedelse är inte arbete, och ett pass som
         bara var förberedelse innehåller inget arbete) — **men det är en följd han inte
         uttryckligen valde**, och den är värd att titta på när 4.3 bygger historikraden.

      **Testerna:** `loggadeArbetsset` fick **röd fas per villkor**, inte en samlad — filtret
      byggdes i två steg så att både uppvärmnings- och avbockningsvillkoret hade ett eget
      fallande test, och det första saboterades dessutom till grönt-genom-att-släppa-igenom-allt
      för att visa att det verkligen vaktar. Knappens löfte mäts som **kontrakt mot
      `copyWorkoutIntoPlan`** i stället för mot en handskriven siffra: planen är facit, och
      divergerar de igen faller raden oavsett vilken sida som ändrats.

      **Verifierat 2026-08-27:** 308 tester i 24 filer, typecheck rent, lint 0 fel, bygget
      grönt, 81 e2e-tester gröna.

- [x] **12.49 Arket och raden numrerade samma rad olika. Ny 2026-08-27. SYNLIG BUGG.**
      Hittad under `/simplify` av 12.47, av **två granskare oberoende av varandra**, och
      medvetet lämnad utanför den uppgiften: `/simplify` letar inte korrekthetsfel.

      `ExerciseCard` skickade `planned.sets.findIndex(...) + 1` till `SetAdjustSheet` — alltså
      radens plats i **listan**. `SetRow` numrerar bland **arbetsseten** och har ett ⛔ i sin
      docblock om att listplatsen vore fel svar.

      | Planen `[uppvärmning, arbetsset, arbetsset]` | Raden sa | Arket sa |
      |---|---|---|
      | Andra arbetssetet | `set 2` | **`set 3`** |
      | Uppvärmningsraden | `uppvärmningen` | **`set 1`** |

      💡 **Tredje gången i samma familj:** `12.42` (arbetssetnumret räknades på två ställen),
      `12.48` (uppvärmningsfiltret skrevs om av varje skärm), och nu frasen numret sitter i.
      Varje gång ägde `src/lib` regeln medan skärmlagret bar en egen kopia.

      🔴 **VARFÖR DEN ÖVERLEVDE TRE GRANSKNINGAR — och det är fyndet värt mest här:**
      **ingen e2e-vakt i hela sviten hade någonsin en uppvärmningsrad.** `isWarmup` fanns bara
      som `false` i `hjalpare.ts`:s fixtur, så hela uppvärmningsvägen var omätt end-to-end.
      Buggen kräver att en rad faktiskt ÄR uppvärmning för att synas alls.

      **Adams beslut:** arket säger `uppvärmningen`, exakt som raden. Vägen: delad härledning
      **plus** en e2e-vakt, inte det ena eller det andra.

      **Åtgärdat.** `radnamn(workSetIndex)` i `src/lib/worksets.ts` äger frasen; `SetRow` och
      `ExerciseCard` anropar den. `SetAdjustSheet`:s prop bytte från `setNumber: number` till
      `radnamn: string` — **typen var själva buggen**: ett tal kan inte uttrycka
      *"uppvärmningen"*, så anroparen tvingades hitta på ett.

- [x] **12.51 Fyra fynd ur `/code-review` av steg 4.3. Ny 2026-08-29. KLAR 2026-08-29.**

      > ### ✅ UTFALLET
      >
      > | Punkt | Utfall |
      > |---|---|
      > | 1 | ✅ **Två commits, inte en.** `synligaPass` för det filter granskningen fann — och sedan orsaken uppgiften själv namngav |
      > | 2 | ✅ Ingen åtgärd, som skrivet. Lärdomen står kvar |
      > | 3 | ✅ `ETT_DYGN_MS` |
      > | 4 | ✅ `foga()` är total |
      >
      > 🔴 **Punkt 1 var större än granskningen såg.** Fyndet var ETT upprepat filter; orsaken
      > var att arbetssetregeln hade **fem stavningar** i `history.ts` och ingen hemvist för
      > databasrader. Fyra av dem var äldre än steg 4.3 — granskningen såg bara den sjätte, för
      > den låg i diffen. `räknasSomArbete` i `src/lib/worksets.ts` är regeln nu.
      >
      > ⛔ **De två funktionerna slogs medvetet INTE ihop**, och skälet står i filen: en planrad
      > och en loggad rad bär olika bevis för att arbetet blev gjort — `loggedSetId` mot
      > `isDeleted`. En planrad kan finnas utan att vara gjord; en loggad rad kan vara gjord men
      > borttagen. **Att tvinga ihop dem hade krävt en typ som ljuger om ena hållet.**
      >
      > **Sabotaget är det som gör delningen mer än kosmetisk:** uppvärmningsledet borttaget ur
      > `räknasSomArbete` ger **åtta röda tester i fem olika konsumenter** — passhistorik,
      > övningshistorik, personbästa, tränade övningar och sidrubrikens totaler. Borttaget
      > importfilter i `synligaPass` fäller **båda** sidor av det ursprungliga fyndet.
      >
      > **Grindar:** 329 tester · typecheck rent · lint 0 fel · **e2e 105 passed**.

      Granskningen kördes **efter** att rutan bockats av, vilket två handoff-sektioner
      uttryckligen bad om att slippa. De två fynd som gick att stänga direkt är stängda i
      uppgiften; de fyra nedan är kod och får inte blandas in i en annan ändring.

      **1. 🔴 `summarizeHistory` upprepar passfiltret — båda axlarna hittade det oberoende.**
      `!w.isDeleted && !w.isImported` står nu på `history.ts:96` och `:180`, och båda läser
      `loggedSets.toArray()`. Doc-kommentaren säger *"samma mängd som passlistan, med flit"* —
      alltså **prosa där det ska vara kod**, exakt vad `12.42` avgjorde: *"en delad härledning
      som båda sidor anropar … Kopplingen ska vara kod, inte prosa i en doc-kommentar."*

      ⚠️ **Det som gör fyndet värt en egen uppgift är varför det uppstod.** `loggadeArbetsset`
      i `src/lib/worksets.ts` går **inte** att anropa här: den typas på planrader
      (`isWarmup`, `loggedSetId`), inte på `LocalSet`. Regeln har alltså ingen hemvist för
      databasrader, och `!s.isWarmup` står redan på fem ställen i `history.ts` — fyra av dem
      äldre än den här diffen. **Nästa konsument skriver om den igen**, precis som 12.42, 12.48
      och 12.49 alla gjorde. Frågan att avgöra: en `synligaPass()`-härledning, eller en
      arbetssetregel som är typad på `LocalSet`.

      **2. `2b65caa` är inte atomär.** Regel 3. Den blandar ny funktion (`SegmentedControl`),
      en **rättelse av en delad vakt** (kontrastvaktens undantagslista) och en tryckytefix
      `h-10 → h-12`. **Vaktlagningen är seriens mest återanvändbara ändring och ligger begravd
      i en featurecommit.** Går inte att dela i efterhand utan att skriva om historien — raden
      finns för att nästa likadana ändring ska gå i egen commit.

      **3. `EN_DYGN_MS` heter fel.** `src/lib/passdatum.ts:11`. Ett dygn är neutrum:
      `ETT_DYGN_MS`. Huset skriver svenska domännamn korrekt.

      **4. `foga()` blandar två sätt att hantera samma invariant.** `src/lib/muskelgrupper.ts`:
      `grupper[0]!` använder icke-null-försäkran medan `grupper.at(-1)` lämnas otypad mot
      `undefined`. Bryts invarianten skriver den senare **`undefined` i raden** i stället för
      att fela. Anroparen garanterar i dag minst ett element, så det är inte en bugg — men två
      svar på samma fråga i fyra rader.

      **Klart när:** punkt 1 har en delad härledning båda sidor anropar, med sabotage åt båda
      hållen; 3 och 4 är åtgärdade; punkt 2 är ingen åtgärd utan en lärdom och bockas med de
      andra.

- [ ] **12.50 Sidrubrikens VIKT är ihågkommen, inte strukturell. Ny 2026-08-28.**
      Hittad i steg 4.3 del B, genom att en påstådd rest kontrollerades innan den togs bort.
      **Inget fel på skärmen i dag** — alla `h1` bär rätt vikt.

      `index.css` sätter Fraunces och `--text-title` på **elementet** `h1`, och skriver ut
      skälet: *"en klass man måste komma ihåg att sätta blir bortglömd, och då blir en sida
      plötsligt satt i fel typsnitt utan att något går sönder."* Exakt samma argument som
      `tabular-nums` bär i samma fil.

      **Men vikten 600 — som `DESIGN.md` §2:s skala anger för `--text-title` — sätts av en
      `font-semibold`-klass på varje `h1` för sig.** Två av tre egenskaper är strukturella,
      den tredje är en vana. En ny sida med `<h1>Statistik</h1>` får rätt typsnitt och rätt
      storlek men fel vikt, tyst.

      ⚠️ **Det är en enradsändring med bred yta.** Regeln träffar varje `h1` i appen, och
      klasserna blir då redundanta men oskadliga. Städas de i samma svep blir det en
      blandad commit; städas de inte står det kvar två sanningar. **Ta ställning till vilket
      innan raden skrivs**, och gör det inte mitt i en annan uppgift.

      **Klart när:** vikten kommer ur `index.css` och en `h1` utan klasser renderar i
      briefens vikt — mätt i DOM:en, inte antaget.

      **`e2e/uppvarmning.spec.ts` är sviten första vakt som växlar en rad till uppvärmning.**
      Den var röd mot den gamla räkningen, kontrollerat genom att buggen återinfördes.

      💡 **Ett kvitto föll ut av testets egen konstruktion.** Första versionen band arkets
      lokator till `Justera set 1` och behöll den över växlingen till uppvärmning. Den föll på
      timeout — vilket i sig bevisade att rubriken byter namn i samma ögonblick som raden gör
      det. Omadresseringen står kvar i testet som ett påstående, inte som en omständlighet.

      ⏰ **KVAR, och det är Adams att avgöra om det ska bli en uppgift:** `radnamn` kallar
      **varje** uppvärmningsrad `uppvärmningen`. Har man två på samma övning heter de likadant,
      i både raden och arket. Det var sant före den här rättningen också — den ärvde
      tvetydigheten, den skapade den inte. Adam valde medvetet bort att numrera uppvärmningarna
      här, eftersom det hade ändrat radens egen etikett och alltså varit mer än buggen bad om.

      **Verifierat 2026-08-27:** **310 tester** i 24 filer, typecheck rent, lint 0 fel, bygget
      **642,04 kB** (gzip 193,33), **84 e2e-tester gröna**.

---

## Fas 11A — efterjustering 2026-08-01 (layoutbugg + rullhjul)

Adam stresstestade 11A på iPhone och hittade två fel. Båda var mina.

- [x] **11A.8 Layoutbuggen — setraden klipptes av på mobilskärm.** Repsens `+` hamnade
      utanför skärmen och ta-bort-krysset syntes inte alls i porträttläge.

      **Rotorsak:** raden hade åtta tryckytor (−/värde/+ för vikt, −/värde/+ för reps,
      bekräfta, ta bort). Det får inte plats på 375 px, och jag skrev själv i förra
      överlämningen att raden var trång — men shippade ändå. Det var fel; en känd risk som
      inte mäts är inte hanterad.

      **Fixen är inte mindre knappar utan färre.** Raden har nu **tre element**: setnummer,
      värde, bekräfta. Bara värdeknappen växer (`flex-1 min-w-0`), resten har fast bredd.
      Räknat på iPhone SE: 100 px fast, **249 px kvar** till värdeknappen — den kan inte
      klippas. `overflow-x-hidden` på skalet är ett skyddsnät så att ett framtida fel syns
      som avklippt innehåll i stället för att gömma sig bakom en sidledsscroll.
- [x] **11A.9 Rullhjul i stället för klumpiga steg.** Fasta 2,5 kg-steg är fel för hantlar,
      och sjutton tryck för att gå från 20 till 62,5 är inte ett gränssnitt.

      **`SetAdjustSheet`** — bottenark som öppnas genom att trycka på värdet i raden.
      Vikten har **ett hjul per siffra** (100-tal, 10-tal, 1-tal, halvkilo) precis som Adam
      bad om, så 20 → 62,5 är två drag. Entalshjulet ger 1 kg-finjustering för hantlar.
      ±1 och ±2,5 finns kvar för den som bara vill nudga.

      **Hjulen är byggda med `scroll-snap`, inte ett bibliotek.** Webbläsarens egen
      scrollning ger tröghet, studs och rätt känsla på iOS gratis — ett JS-drivet hjul
      känns alltid som en imitation och hade lagt hundratals kB på en redan stor bundle.

      Sifferaritmetiken ligger i `src/lib/digits.ts` med **10 egna tester**, eftersom det är
      precis den sortens kod som ser trivial ut och går sönder på 92,5 eller 0,5.

**Verifierat:** 234 tester, typecheck, lint och bygge gröna. Breddbudgeten är uträknad.
**Inte verifierat:** hur det ser ut och känns i Safari — det är Adams test.

- [x] **11A.10 KRITISK BUGG: fritext- och AI-set syntes aldrig i passvyn.**
      Rapporterad 2026-08-02. Adam skrev "samma som förra men 5 kg mer", AI:n räknade rätt
      till 95 kg, han tryckte spara — och inget set dök upp. Det såg ut som dataförlust.

      **Datan var aldrig borta.** Kontrollerat direkt i Postgres: `95.00 kg × 5 Bänkpress`
      låg där, synkad. Felet var att den var **osynlig**.

      **Rotorsak, och det är mitt fel från 11A:** efter ombyggnaden renderar passvyn bara
      *planen*, men fritext- och AI-vägen skriver rakt till `loggedSets` utan att lägga något
      i planen. Två parallella skrivvägar, bara en visningsväg. Osynlighet är värre än ett
      synligt fel — man loggar om samma set i tron att det inte gick igenom.

      **Fix:** `attachLoggedSetToPlan` kopplar ett redan loggat set till planen som en
      färdigbockad rad. **Planen är visningsmodellen; allt som loggas i ett pass ska finnas
      i den.** Tre regressionstester.
- [x] **11A.11 AI-set bokfördes som `local_parse`.** Hittad i samma spår. `handleParsedLog`
      hårdkodade källan, så varje AI-tolkat set räknades som lokalt tolkat — vilket gjorde
      hela träffsäkerhetsjämförelsen i 8.10 meningslös innan den ens använts.
- [x] **11A.12 Setraden byggd efter referensbilderna.** `docs/Reference-pics/`.

      Mina två tidigare försök klipptes av på mobilskärm. Referensappen löser det med en
      **tabell: fem smala kolumner och rubriker EN gång** — `Set | Förra | Kg | Reps | ✓`.

      Det är inte en detalj utan hela knepet: när kolumnen är namngiven i huvudet behöver
      cellen inte bära sin egen etikett. Mina versioner upprepade "kg" och "×" på varje rad
      och hade steppare inline — det var det som sprängde bredden.

      Spökdatan flyttade till **Förra-kolumnen**, precis som i referensen och som
      underlaget i `docs/research/` beskrev från början. `W` i orange markerar
      uppvärmningsset.

      **Breddbudget iPhone SE:** 317 px tillgängligt, 164 px fasta kolumner, **153 px kvar**
      till Förra-kolumnen som är den enda flexibla. Ingen kolumn kan tryckas utanför skärmen.
