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

## 🔥 Akut — drift och kostnad

- [ ] **A.1 Egress-gränsen är passerad, och siffrorna går inte ihop.** Adam 2026-08-09:
      **5,02 av 5 GB** på Free-planen denna cykel, med enskilda dygn **över 500 MB**.
      Databasen är 45 MB och appen har fyra användare.

      **Regeln för den här uppgiften: ta reda på vad som genererar trafiken innan något
      ändras.** Att optimera en synk som kanske inte är boven skulle dölja den verkliga
      orsaken och konsumera nästa cykels marginal med.

      **Hypotes 1 — det andra projektet. Pröva denna först, den är ett klick.** Organisationen
      `qfqgeranbxnftnnlkcfo` innehåller **två** projekt: `Gym-App` och `news-signal-engine`.
      Free-planens kvoter räknas **per organisation, inte per projekt**, så en nyhetsinsamlare
      som hämtar och lagrar artiklar kan äta upp hela taket utan att Gym-App rört en byte.
      **Kontroll:** dashboardens Usage-vy, uppdelad per projekt.

      **Hypotes 2 — trasiga hämtningsmarkörer** (Adams förslag): `lastPulledAt:*` fungerar inte
      och `pull.ts` hämtar hela tabeller vid varje synkrunda. `syncNow` triggas vid appstart,
      `focus`, `visibilitychange` och 2 s efter varje utkorgsskrivning — under ett pass blir
      det många rundor.

      **Men aritmetiken talar emot den för Gym-App:s del.** 45 MB är i praktiken en tom
      Postgres-instans; själva träningsdatan är 10 pass och 25 set, alltså kilobyte. Även en
      fullständigt trasig markör som hämtade om *allt* vid *varje* runda skulle flytta
      kilobyte per synk. 500 MB på ett dygn kräver storleksordningar fler anrop än fyra
      användare rimligen genererar. **Hypotesen ska ändå prövas** — den är billig att mäta och
      vore ett riktigt fel oavsett trafiken — men den förklarar sannolikt inte siffran.

      **Ordning:** Usage per projekt → Gym-App:s egen egress isolerad → först därefter
      `pull.ts`. Glöm inte Edge Functions och Realtime; egress är inte bara PostgREST.

      **Klart när:** trafiken är hänförd till en namngiven källa med en siffra intill. Inte
      en gissning, och ingen kodändring dessförinnan.

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

**Utöver uppgiftslistan:** `src/db/catalog.ts` — de 45 globala övningarna inbakade i bygget,
med **databasens riktiga id:n**. Hade klienten seedat med egna id:n hade synken i fas 7 sett
dem som nya rader och skapat 45 dubbletter. Katalogen är transkriberad för hand och verifieras
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

- [ ] **11B.0a Avgör informationsarkitekturen. `SPEC.md`, inte design.**
      I dag: Pass, Historik, Övning, Inställningar. Frågan som ska besvaras innan något
      ritas: **är fyra rutter den slutliga formen?** Kandidater att ta ställning till —
      statistik/volym per muskelgrupp, program och rutiner, kroppsvikt, profil.

      **Ett nej är ett lika giltigt svar som ett ja**, men det ska vara uttalat. Att upptäcka
      halvvägs genom designrundan att appen behöver en femte flik betyder att navigationen,
      typografin och tomma tillstånd designats mot fel form.
      **Klart när:** `SPEC.md` §2 listar varje skärm appen ska ha i v1, och Adam har godkänt.

- [ ] **11B.0b Designbriefen — `docs/DESIGN.md`. INGEN KOD FÖRRÄN GODKÄND.**
      Alla skärmar samtidigt, inklusive bottenark, timer och övningsväljaren.

      Arbetsordningen är hämtad från Chris Raroques flöde och står i
      `ai-workbench/tools/`: **referenser → prototyp → implementation.**
      1. Samla referenser (Mobbin, Boostcamp, RP Hypertrophy, Jeff Nippard) i
         `docs/Reference-pics/`.
      2. Skissa varje skärm mot referenserna. Figma om det behövs, annars bilder.
      3. Fastställ **tokens**: färg, typografi, spacing, radier, ikonuppsättning.
      4. Skriv `docs/DESIGN.md` med tokens plus en skiss per skärm.

      **Varför referensdrivet och inte fritt:** `11A.12` byggdes från referensbilder efter
      att mina två egna försök klipptes av på mobilskärm. Referensversionen håller. Det är
      inte en tillfällighet — en referens bär beslut någon redan testat mot riktiga
      användare, och den informationen finns inte i en beskrivning.
      **Klart när:** `docs/DESIGN.md` finns och Adam har godkänt den.

**11B.1–11B.9 nedan är implementation av briefen.** Ingen av dem är ett eget designbeslut
längre — värdena kommer från `DESIGN.md`. Motsäger en uppgift briefen är det briefen som
gäller, och uppgiften skrivs om.

- [ ] **11B.1 Typografisk skala.** I dag används Tailwinds förval rakt av. Setraden ska vara
      största elementet på skärmen; allt annat underordnar sig den.
      **Klart när:** skalan är definierad i `index.css` och ingen komponent sätter egen storlek.
- [ ] **11B.2 `tabular-nums` överallt där siffror ändras.** Finns på setraden, saknas i
      historik och timer. Siffror som hoppar i sidled är svårlästa och känns billiga.
- [ ] **11B.3 Vertikal rytm.** Avstånden är i dag valda per komponent. Ska följa en skala.
- [ ] **11B.4 Tryckåterkoppling.** Ingen knapp har `:active`-tillstånd. Med svettiga fingrar
      är omedelbar kvittens skillnaden mellan att lita på appen och att trycka igen.
      **Klart när:** varje tryckyta svarar synligt inom en bildruta.
- [ ] **11B.5 Rörelse med måtta.** Setraden dyker upp abrupt. En kort inanimation gör att ögat
      hittar den nya raden. **Klart när:** inget övergångsförlopp överstiger ~150 ms.
- [ ] **11B.6 Tomma tillstånd.** Första passet är enda tillfället att lära ut fritextsyntaxen,
      och det tillfället används inte i dag.
- [ ] **11B.7 Färgsemantik som system.** Grönt = sparat, gult = tvetydigt är i dag enstaka val.
      **Klart när:** betydelserna är definierade och kontrasterna klarar WCAG AA mot mörk botten.
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

- [ ] **13.1 Migration: `workouts.is_imported` + `source = 'import'`.** En boolean med
      `default false`, och `logged_sets.source`-villkoret utökat med `'import'`. Speglas i
      `src/db/types.ts` och `toWire.ts`. `apply_mutations` i migration 0003 måste kunna
      skriva fältet, annars går ett importerat pass inte att synka tillbaka.
      **Klart när:** ett pass med `is_imported = true` kan skrivas, synkas ned och läsas.

- [ ] **13.2 Katalogen: dela `Chins` och `Pullups`.** Knogar bakåt (mot rumpan) = överhand =
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

- [ ] **13.3 Filter: importerade pass syns inte i passlistan.** `listWorkoutSummaries` i
      `src/db/history.ts` filtrerar bort pass med `isImported`.
      **Klart när:** ett test visar att ett importerat pass finns i databasen men inte i
      listan, medan ett vanligt pass i samma test gör det.

- [ ] **13.4 Filter: importerade set blir aldrig spökdata.** `getLastPerformance` i
      `src/db/repo.ts` hoppar över set med `source === 'import'`.

      **Varför det spelar roll:** raden `2024 vecka 14: Bänk: 90 kg` var ett 1-repsmax. Utan
      filtret viskar appen "sist tog du 90 kg × 1" varje gång bänkpress öppnas. Ett rekord är
      inte ett arbetsset, och spökdatan är ett minnesstöd — inte en utmaning.
      **Klart när:** ett test där enda tidigare setet är importerat ger `null` från
      `getLastPerformance`. Funktionen har tre anropare och alla tre ärver filtret.

- [ ] **13.5 Textrad om uppskattade datum ovanför övningsgrafen.** *"7 punkter före maj 2024
      är importerade från gamla anteckningar — datumen är uppskattade."* Visas bara när
      övningen faktiskt har importerade set.

      Medvetet **inte** en visuell markering i grafen (ihåliga prickar e.d.): det vore att
      införa ett nytt visuellt språk innan designbriefen i 11B är klar. Meningen är sann,
      syns, och kostar ingenting att ta bort när riktig design kommer.

- [ ] **13.6 ENGÅNGS: Adams konto och SQL-filen.** Lämnar inga spår i kodbasen.

      **Ordning:** 1) Adam registrerar sig i appen med sin riktiga e-post — det måste han göra
      själv, konton och lösenord är inget jag rör. 2) Jag genererar `scripts/import-adam.sql`
      med hans `user_id` inlagt. 3) Han läser igenom den — 21 set, 17 pass, läsbart i klartext.
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

- [ ] **12.13 Genomgång av kodbasens struktur.** Adam 2026-08-07: *"I felt that the codebase
      was kind of messy. I don't know where things are and how they should work."*

      **Det är inte nödvändigtvis sant att den är rörig** — det kan lika gärna vara att den
      växt utan att någon skrivit en karta. Uppgiften är därför att **först ta reda på vilket
      det är**, inte att börja flytta filer. En orienteringskarta över `src/` (vad varje mapp
      ansvarar för och vad som anropar vad) kan visa sig vara hela åtgärden.

- [ ] **12.14 `META_CATALOG_VERSION` är död kod.** Konstanten `catalogChecksum` deklareras i
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
