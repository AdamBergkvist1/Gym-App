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

- [ ] **0.8 Mät om en lokal notis håller i TRE MINUTER.** Den enda kvarvarande obesvarade
      frågan, och den är inte kosmetisk: mätningen ovan använde 5 sekunder, men en vilotid är
      2–5 minuter. Notisen utlöstes av en `setTimeout` i sidans egen JavaScript, och iOS fryser
      bakgrundade webbsidors JavaScript efter en kort stund. Fem sekunder hann sannolikt inom
      nådatiden; tre minuter kanske inte gör det.
      **Så här:** lägg till `180000` som ett fjärde alternativ i fördröjningsväljaren i
      `test/feedback-test.html` (raden med `data-ms="10000"`), deploya om, tryck Notis, lås
      telefonen och lägg undan den i tre minuter.
      **Klart när:** det står i `PLAN.md` §2.6 om notisen kom **vid rätt tidpunkt** eller
      **först när appen öppnades igen**. Det senare räknas som ett misslyckande — ett larm
      som kommer när man redan tittar är värre än inget larm, eftersom det ser ut att fungera.
      **Blockerar uppgift 6.6.** Inget annat.

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
- [ ] **5.9 "Skapa ny övning" från en parsermiss.** Inte byggd. I dag säger appen "känner
      inte igen övningen" men erbjuder ingen väg vidare. Kräver `exercises`-grenen i utkorgen
      (som `apply_mutations` redan stöder).
      **Klart när:** okänt övningsnamn kan bli en egen övning på två tryck.
- [ ] **5.10 Verifiera hela loggningsvägen offline.** Flygplansläge, logga ett helt pass.
      **Klart när:** 25 set kan loggas utan nät, och finns kvar efter omstart av appen.

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

- [ ] **6.1 Lagra timern som sluttidpunkt.** `timer_ends_at` i `meta`.
      **Klart när:** enhetstest visar att kvarvarande tid räknas som `ends_at - now`.
- [ ] **6.2 Starta timern automatiskt när ett set loggas.**
      **Klart när:** timern startar utan extra tryck.
- [ ] **6.3 Rendera nedräkningen.** **Klart när:** siffran stämmer efter att appen varit i
      bakgrunden i två minuter.
- [ ] **6.4 Visuellt larm — endast förgrund.** Helskärmsbyte av bakgrundsfärg vid noll.
      **Klart när:** det syns tydligt utan ljud och utan behörigheter.
- [ ] **6.5 Wake Lock.** Begär vid timerstart, **återbegär vid `visibilitychange`**.
      **Klart när:** skärmen är tänd efter tre minuters vila utan att någon rört telefonen.
- [ ] **6.6 Lokal notis — bärande kanal i bakgrunden.** `registration.showNotification()`,
      **inte Web Push** (se `PLAN.md` §2.6 — Web Push kräver nät och är därför fel i ett gym).
      Behörighet begärs vid en explicit användargest, inte vid appstart. Notis visas **bara**
      när `document.hidden` är sant; ligger appen framme räcker det visuella larmet.
      **Kräver att uppgift 0.8 är utförd.**
      **Klart när:** notisen kommer efter en riktig vilotid med telefonen låst och undanlagd.
- [x] ~~**6.7 Vibration.**~~ **Struken 2026-07-30.** `'vibrate' in navigator === false` på
      iOS 18.7. Notisen ger ändå vibration — via systemet, inte via oss.
- [x] ~~**6.8 Ljudlarm via Web Audio.**~~ **Struken 2026-07-30.** `AudioContext` går till
      `interrupted` när appen bakgrundas; ljud kan aldrig bära larmet. Notisen ger systemets
      eget ljud.
- [ ] **6.9 Justerbar vilotid.** Per övning, sparad i `meta`.
      **Klart när:** vald tid används vid nästa set av samma övning.

---

## Fas 7 — Synk

- [ ] **7.1 Bygg Supabase-klienten.** Publishable-nyckel från env. **Klart när:** klienten
      instansieras utan att blockera appstart om nätet saknas.
- [ ] **7.2 Bygg inloggning (e-post + lösenord).**
      **Klart när:** inloggning fungerar och `user_id` cachas lokalt.
- [ ] **7.3 Verifiera att utgången token inte blockerar loggning.** Manipulera token till
      utgången, starta appen. **Klart när:** hela loggningsvägen fungerar ändå.
- [ ] **7.4 Bygg utkorgens läsare.** FIFO på `seq`, plockar nästa `pending`.
      **Klart när:** enhetstest visar rätt ordning.
- [ ] **7.5 Bygg sändaren mot `apply_mutations`.** Batchar upp till N poster.
      **Klart när:** ett offline-loggat pass hamnar i Postgres vid återansluten nät.
- [ ] **7.6 Bygg backoff och felhantering.** Nätfel → försök igen. Permanent 4xx → `failed`.
      **Klart när:** enhetstest täcker båda vägarna.
- [ ] **7.7 Bygg synkindikatorn i UI.** Tre lägen: i synk, köar, **fel**. Felläget är synligt
      och beskriver vad som inte gick fram. **Klart när:** en `failed`-post syns för användaren.
- [ ] **7.8 Bygg hämtningen (moln → klient).** `updated_at > last_pulled_at` per tabell.
      **Klart när:** ändring gjord i Supabase Studio dyker upp i appen efter omstart.
- [ ] **7.9 Skydda mot överskrivning.** En hämtad rad med väntande utkorgspost skrivs inte över.
      **Klart när:** enhetstest bevisar det.
- [ ] **7.10 Bygg mjuk radering.** `is_deleted` i stället för `delete`.
      **Klart när:** raderat set försvinner i UI och propagerar till molnet.
- [ ] **7.11 Testa idempotensen på riktigt.** Bryt nätet mitt i en sändning, återanslut.
      **Klart när:** inga dubbletter i `logged_sets`.

---

## Fas 8 — LLM-reserven

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

- [ ] **9.1 Bygg passhistoriken.** Lista med datum, övningar, totalvolym.
      **Klart när:** listan renderas från Dexie.
- [ ] **9.2 Bygg övningsvyn.** Alla set för en övning över tid.
      **Klart när:** vyn öppnas från både historik och aktivt pass.
- [ ] **9.3 Implementera e1RM (Epley) som ren funktion + enhetstest.**
      **Klart när:** testerna är gröna för kända värden.
- [ ] **9.4 Bygg PB-vyn.** Tyngsta set, högsta e1RM, per övning.
      **Klart när:** värdena stämmer mot handräknat testdata.
- [ ] **9.5 Bygg SVG-sparkline för e1RM över tid.** Inget bibliotek.
      **Klart när:** grafen renderas för en övning med ≥ 5 set.

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

## Fas 11 — Backlog (efter v1)

- [ ] **11.1 Export till JSON och CSV.**
- [ ] **11.2 Rutiner och mallar** (`routines`, `routine_exercises` — additivt).
- [ ] **11.3 Volym per muskelgrupp och vecka.**
- [ ] **11.4 MCP-server (spår 2)** — när Supabase stöder autentiserad MCP.
- [ ] **11.5 Superset och dropset.**
- [ ] **11.6 Jämför Groq mot Gemini på samma indata** med `ai_parse_log` som underlag.
