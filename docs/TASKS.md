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

- [ ] **4.13 TRIMMA GRAMMATIKEN FÖR GYM-SLANG.** Upptäckt 2026-07-31 vid Adams första
      riktiga pass: parsern klarar `Bänk 90x5` men **inte `80x7 bänk`**. Det är inte ett
      gränsfall — det är så folk skriver mitt i ett set. Varje sådan miss undergräver hela
      premissen att fritext ska vara snabbare än att fylla i fält.

      **Testdrivet som fas 4 i övrigt:** korpusen nedan skrivs som röda tester först.

      | Indata | Vad som saknas i dag |
      | :---- | :---- |
      | `80x7 bänk` | vikt/reps **före** övningen |
      | `bänk 90 5` | fungerar redan — regressionsvakt |
      | `90kg 5r bänkpress` | omvänd ordning med enheter |
      | `bänk 90x5x3` | i dag `ambiguous_numbers`; borde bli 3 set à 90×5 |
      | `3x8 bänk 60` | set×reps-notation följt av vikt |
      | `bänk 90x5 90x5` | två set på en rad |
      | `bp 100x3` | kortalias fungerar redan — regressionsvakt |

      **Regeln som inte får luckras upp:** hellre `unresolved` än en gissning. Att stödja
      omvänd ordning får inte göra `20x30` mindre tvetydig — den ska fortfarande be om
      bekräftelse. Konfidensregeln i §4.9 gäller oförändrat.
      **Klart när:** hela korpusen är grön och de 6 avvisningsfallen från 4.7 fortfarande
      avvisas.

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

- [ ] **8.0 Utöka `/ai/parse`-kontraktet med historik.** Beslutat 2026-07-31. Utan detta blir
      fas 8 en andra parser i stället för en coach.
      Kontraktet i `PLAN.md` §4.4 utökas med: senaste utförandet per övning i passet,
      användarens vanliga viktspann per övning, och pågående passets set.
      **Klart när:** funktionen kan besvara "samma som förra gången" och flagga ett värde som
      avviker kraftigt från historiken.
- [ ] **8.1 Skapa Groq-konto med EGEN organisation/nyckel**, skild från `news-signal-engine`.
      **Klart när:** nyckeln är satt som secret i Supabase, inte i repot.
- [ ] **8.2 Skapa Gemini-nyckel, likaså separat.**
      **Klart när:** nyckeln är satt som secret i Supabase.
- [ ] **8.3 Definiera JSON-schemat för parsersvaret.** Delas mellan klient och funktion.
      **Klart när:** schemat validerar de förväntade utdata från fas 4:s testkorpus.
- [ ] **8.4 Skapa Edge Function `ai-parse`.** Förstahandsval: `@supabase/server`-SDK:n med
      `withSupabase({ auth: 'user' })`, som ger en färdig klient scopead till anroparens RLS.
      Kräver `verify_jwt = false` i `config.toml` — auktoriseringen sker i SDK:n i stället.
      **Klart när:** anrop utan giltig session avvisas, och ett anrop med session bara ser
      egna rader.
- [ ] **8.5 Bygg leverantörsgränssnittet `parseWithLLM`.** En implementation per leverantör,
      vald via miljövariabel. **Klart när:** byte av leverantör är en env-ändring.
- [ ] **8.6 Implementera Groq-vägen.** **Klart när:** en fritextrad som fas 4:s parser missar
      returnerar giltig JSON mot schemat.
- [ ] **8.7 Implementera Gemini-vägen som fallback.** Utlöses vid kvotfel eller timeout.
      **Klart när:** ett simulerat Groq-fel går vidare till Gemini.
- [ ] **8.8 Bygg timeout och degradering.** 4 s. Vid timeout → `unresolved`, aldrig tomt
      lyckat svar. **Klart när:** simulerad timeout ger `unresolved` och UI:t erbjuder manuell
      inmatning.
- [ ] **8.9 Validera modellens utdata mot schemat i klienten** innan något skrivs till Dexie.
      **Klart när:** ett medvetet trasigt svar behandlas som `unresolved`.
- [ ] **8.10 Skriv till `ai_parse_log`.** Inklusive `provider`, `latency_ms` och `outcome`.
      **Klart när:** en rad skapas per fritextinmatning, både för `local` och `llm`.
- [ ] **8.11 Fånga `outcome` i UI.** Sparar användaren förslaget orört → `accepted`; ändrar
      hen ett fält → `edited`; slänger hen det → `rejected`.
      **Klart när:** alla tre utfallen går att framkalla manuellt.

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

- [ ] **10.1 Koppla repot till Vercel.** Ramverksförval: Vite. Byggkommando `npm run build`,
      utdatakatalog `dist`. **Klart när:** push till `main` bygger automatiskt.
- [ ] **10.2 Sätt miljövariabler i hostingen.**
      **Klart när:** produktionsbygget når Supabase.
- [ ] **10.3 Installera appen på Adams telefon från produktions-URL:en.**
      **Klart när:** appen ligger på hemskärmen.
- [ ] **10.4 Kör ett helt riktigt pass i gymmet.** Utan nät.
      **Klart när:** passet är loggat och synkat efteråt, och erfarenheterna står i `HANDOFF.md`.

---

## Fas 11 — Designpolering (UX/UI)

Efterfrågad av Adam 2026-07-31 efter att ha använt appen på riktigt: den fungerar men är
"basic och rätt ful". Det är väntat — UI:t har byggts råt med flit. Men det ska vara ett
beslut, inte något som glöms bort, och det ska göras **samlat**. Görs det styckvis blir
resultatet ojämnt, och ojämnt är värre än rått.

Fullständigt resonemang inklusive vad fasen INTE ska omfatta: `PLAN.md` §8.
Referens enligt SPEC: RP Hypertrophy för datafokus, Jeff Nippard och Boostcamp för estetik.

**Ligger efter fas 9 med flit.** Att polera innan historikvyn och timern finns betyder att
designspråket sätts av den vy som råkade byggas först, i stället för av helheten.

- [ ] **11.1 Typografisk skala.** I dag används Tailwinds förval rakt av. Setraden ska vara
      största elementet på skärmen; allt annat underordnar sig den.
      **Klart när:** skalan är definierad i `index.css` och ingen komponent sätter egen storlek.
- [ ] **11.2 `tabular-nums` överallt där siffror ändras.** Finns på setraden, saknas i
      historik och timer. Siffror som hoppar i sidled är svårlästa och känns billiga.
- [ ] **11.3 Vertikal rytm.** Avstånden är i dag valda per komponent. Ska följa en skala.
- [ ] **11.4 Tryckåterkoppling.** Ingen knapp har `:active`-tillstånd. Med svettiga fingrar
      är omedelbar kvittens skillnaden mellan att lita på appen och att trycka igen.
      **Klart när:** varje tryckyta svarar synligt inom en bildruta.
- [ ] **11.5 Rörelse med måtta.** Setraden dyker upp abrupt. En kort inanimation gör att ögat
      hittar den nya raden. **Klart när:** inget övergångsförlopp överstiger ~150 ms.
- [ ] **11.6 Tomma tillstånd.** Första passet är enda tillfället att lära ut fritextsyntaxen,
      och det tillfället används inte i dag.
- [ ] **11.7 Färgsemantik som system.** Grönt = sparat, gult = tvetydigt är i dag enstaka val.
      **Klart när:** betydelserna är definierade och kontrasterna klarar WCAG AA mot mörk botten.
- [ ] **11.8 Personbästa markeras när det slås.** Den starkaste återkopplingen en träningsapp
      kan ge, och nästan gratis när e1RM från fas 9 finns.
- [ ] **11.9 Densitet.** Ett pass med 25 set ska gå att överblicka. Nuvarande radhöjd är vald
      för träffsäkerhet, inte för överblick — de två målen ska vägas mot varandra.

---

## Fas 12 — Backlog (efter v1)

- [ ] **12.1 Export till JSON och CSV.**
- [ ] **12.2 Rutiner och mallar** (`routines`, `routine_exercises` — additivt).
- [ ] **12.3 Volym per muskelgrupp och vecka.**
- [ ] **12.4 MCP-server (spår 2)** — när Supabase stöder autentiserad MCP.
- [ ] **12.5 Superset och dropset.**
- [ ] **12.6 Jämför Groq mot Gemini på samma indata** med `ai_parse_log` som underlag.
