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
- [ ] **0.3 Publicera testsidan på en HTTPS-adress.** Notis-API och installerbarhet kräver
      HTTPS. `npx vercel --prod` från `test/`-mappen, som eget throwaway-projekt.
      **Klart när:** sidan nås via `https://` från telefonen.
- [ ] **0.4 Mät i Safari-flik, ljudet PÅ.** Kör alla fyra knapparna. Anteckna utfall per knapp.
      **Klart när:** resultatet står nedskrivet i 0.7.
- [ ] **0.5 Mät i Safari-flik, ljudet AV (fysiska omkopplaren i tyst läge).** Samma fyra.
      **Klart när:** resultatet står nedskrivet i 0.7.
- [ ] **0.6 Mät som installerad PWA på hemskärmen, ljudet AV.** Samma fyra, plus att
      notisbehörighet faktiskt går att bevilja. **Detta är det scenario appen kommer köras i.**
      **Klart när:** resultatet står nedskrivet i 0.7.
- [ ] **0.7 Skriv in mätresultatet i `docs/PLAN.md` §2.6.** Ersätt varningsrutan med en tabell
      över vad som faktiskt fungerade i vilket läge. Inga "borde" — bara observerat utfall.
      **Klart när:** planen innehåller mätdata i stället för öppna frågor, och `docs/HANDOFF.md`
      är uppdaterad.

🚧 **GRIND 1:** Fas 6 (vilotimern) får inte påbörjas innan 0.7 är klar.

---

## Fas 1 — Projektuppsättning

- [ ] **1.1 Initiera Vite-projekt.** `npm create vite@latest` med mallen `react-ts` i repots
      rot. **Klart när:** `npm run dev` visar startsidan.
- [ ] **1.2 Lägg till Tailwind CSS.** Konfigurera för mörkt tema som enda tema.
      **Klart när:** en `bg-neutral-950 text-neutral-100`-klass slår igenom.
- [ ] **1.3 Konfigurera TypeScript strikt.** `strict: true`, `noUncheckedIndexedAccess: true`.
      **Klart när:** `npm run typecheck` finns som script och går igenom.
- [ ] **1.4 Lägg till Vitest.** **Klart när:** `npm test` kör och rapporterar 0 tester.
- [ ] **1.5 Lägg till ESLint + Prettier.** **Klart när:** `npm run lint` går igenom.
- [ ] **1.6 Skapa `.env.example`** med `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`.
      **Innehåller inga värden.** **Klart när:** filen finns och `.env` är i `.gitignore`.
- [ ] **1.7 Definiera mappstrukturen** (`src/db/`, `src/parser/`, `src/sync/`, `src/ui/`,
      `src/timer/`, `src/lib/`) med en tom `index.ts` i varje.
      **Klart när:** strukturen finns och är committad.

---

## Fas 2 — Supabase: schema och RLS

- [ ] **2.1 Skapa Supabase-projekt på Free Tier.** Egen organisation, **inte** delad med
      `news-signal-engine`. **Klart när:** projekt-URL och anon-nyckel finns i lokal `.env`.
- [ ] **2.2 Installera Supabase CLI och `supabase init`.**
      **Klart när:** `supabase/config.toml` finns i repot.
- [ ] **2.3 Migration: `profiles`.** Tabell enligt planen §3.1 + trigger som skapar rad vid ny
      `auth.users`. **Klart när:** migrationen kör rent mot en tom databas.
- [ ] **2.4 Migration: `exercises`.** Tabell enligt §3.1 inklusive `owner_id` nullable.
      **Klart när:** migrationen kör rent.
- [ ] **2.5 Migration: `workouts`.** **Klart när:** migrationen kör rent.
- [ ] **2.6 Migration: `logged_sets`.** Inklusive `user_id` denormaliserad och
      främmandenycklar. **Klart när:** migrationen kör rent.
- [ ] **2.7 Migration: `sync_mutations` och `ai_parse_log`.**
      **Klart när:** migrationen kör rent.
- [ ] **2.8 Migration: `updated_at`-trigger** på alla tabeller med det fältet.
      **Klart när:** en `update` bumpar `updated_at` utan att klienten skickar det.
- [ ] **2.9 Migration: samtliga index enligt §3.2.**
      **Klart när:** `\di` visar alla fem indexgrupperna.
- [ ] **2.10 Migration: aktivera RLS på alla tabeller.** Enbart `enable row level security`,
      inga policyer ännu. **Klart när:** ett `select` som anon returnerar noll rader.
- [ ] **2.11 Migration: RLS-policyer för `workouts`.** Fyra separata policyer (SELECT/INSERT/
      UPDATE/DELETE) med `(select auth.uid()) = user_id`. **Klart när:** migrationen kör rent.
- [ ] **2.12 Migration: RLS-policyer för `logged_sets`.** Fyra policyer. `WITH CHECK` på INSERT
      verifierar dessutom att `workout_id` pekar på ett pass som ägs av samma användare.
      **Klart när:** migrationen kör rent.
- [ ] **2.13 Migration: RLS-policyer för `exercises`.** SELECT tillåter `owner_id is null OR
      owner_id = (select auth.uid())`. Skrivoperationer kräver `owner_id = (select
      auth.uid())`. **Klart när:** global katalograd går att läsa men inte ändra.
- [ ] **2.14 Migration: RLS-policyer för `profiles`, `sync_mutations`, `ai_parse_log`.**
      **Klart när:** migrationen kör rent.
- [ ] **2.15 Migration: funktionen `apply_mutations(batch jsonb)`.** `SECURITY INVOKER`. Hoppar
      över `mutation_id` som redan finns i `sync_mutations`. Allt i en transaktion.
      **Klart när:** samma batch körd två gånger ger samma radantal som en gång.
- [ ] **2.16 Seed: global övningskatalog.** 30–50 vanliga övningar med `aliases` ifyllda
      (svenska + engelska + kortformer). `owner_id = null`.
      **Klart när:** `select count(*) from exercises where owner_id is null` ≥ 30.
- [ ] **2.17 Negativt åtkomsttest.** Skapa två testanvändare. Användare B försöker läsa A:s
      `logged_sets` via PostgREST. **Klart när:** B får **noll rader, inte ett felmeddelande** —
      och testet är sparat som ett körbart skript i `scripts/`.
- [ ] **2.18 Kör `get_advisors` i security-läge.**
      **Klart när:** rapporten kommer tillbaka utan RLS-varningar.

🚧 **GRIND 2:** Ingen kod som skriver till Supabase får skrivas innan 2.17 och 2.18 är gröna.

---

## Fas 3 — PWA-skalet

- [ ] **3.1 Lägg till `vite-plugin-pwa`** med `registerType: 'prompt'`.
      **Klart när:** ett produktionsbygge genererar en servicearbetare.
- [ ] **3.2 Skriv `manifest.json`.** `display: standalone`, namn, ikoner (192/512 px), mörk
      temafärg. **Klart när:** Lighthouse rapporterar appen som installerbar.
- [ ] **3.3 Lägg till `viewport-fit=cover`** i `index.html` och en global CSS-regel som
      applicerar `env(safe-area-inset-*)` som padding. **Klart när:** inget UI hamnar bakom
      hemindikatorn på iPhone.
- [ ] **3.4 Sätt `100dvh` på ytterbehållaren.** **Klart när:** ingen "chin gap" i standalone.
- [ ] **3.5 Anropa `navigator.storage.persist()` vid appstart** och logga utfallet.
      **Klart när:** utfallet syns i en debugvy.
- [ ] **3.6 Bygg uppdateringsnotisen.** Diskret rad när ny servicearbetare väntar; aktiveras
      bara när inget pass är aktivt. **Klart när:** en ny deploy inte byter app mitt i ett pass.
- [ ] **3.7 Verifiera offlinestart.** Bygg, installera, slå på flygplansläge, starta appen.
      **Klart när:** appen startar och renderar utan nät.

---

## Fas 4 — Den lokala parsern (testdriven)

**Reglerna för denna fas:** testfilen skrivs och committas *före* implementationsfilen. Varje
testfall ska vara rött innan det blir grönt. Ingen implementationskod committas i samma commit
som sina tester.

- [ ] **4.1 Definiera typerna.** `src/parser/types.ts`: `ParsedSet`, `ParseResult`
      (`{ sets, unresolved, confidence }`), `Unresolved` (med `reason`).
      **Klart när:** typerna kompilerar och ingen använder `any`.
- [ ] **4.2 Skriv testerna för normalisering.** `src/parser/normalize.test.ts`: gemener,
      trimning, `92,5` → `92.5`, `×`/`*`/`x` → gemensam separator.
      **Klart när:** testerna finns och **misslyckas**.
- [ ] **4.3 Implementera normaliseringen.** **Klart när:** 4.2 är grön.
- [ ] **4.4 Skriv testerna för övningsmatchning.** `src/parser/matchExercise.test.ts` mot en
      fejkad katalog: exakt namn, alias, gemener, engelskt alias, okänd övning → `null`, två
      lika bra träffar → `null` (aldrig gissa).
      **Klart när:** testerna finns och **misslyckas**.
- [ ] **4.5 Implementera övningsmatchningen.** Fuzzy med tröskel. **Klart när:** 4.4 är grön.
- [ ] **4.6 Skriv testerna för hela grammatiken — positiva fall.** `src/parser/parse.test.ts`.
      **Exakt de 16 raderna i planens tabell "Testkorpus"** i §4.3, en `it()` per rad.
      **Klart när:** 16 tester finns och **misslyckas**.
- [ ] **4.7 Skriv testerna för avvisning.** Samma fil. **Exakt de 6 raderna i planens tabell
      "Måste avvisas"**. Varje ska ge `unresolved` med en `reason`, aldrig ett set.
      **Klart när:** 6 tester finns och **misslyckas**.
- [ ] **4.8 Skriv testerna för enhetsregeln.** Tal utan enhet tolkas enligt
      `unit_preference`; `lb`-profil ger `weight_kg` konverterat. Ingen tolkning utan känd
      enhet. **Klart när:** testerna finns och **misslyckas**.
- [ ] **4.9 Skriv testerna för vikt/reps-konfidens.** `20x30` och `Bänk 5x5` ska ge låg
      konfidens och kräva bekräftelse; `Bänk 90x5` ska ge hög.
      **Klart när:** testerna finns och **misslyckas**.
- [ ] **4.10 Implementera parsern.** **Klart när:** samtliga tester i 4.6–4.9 är gröna och
      inget testfall har ändrats för att passa implementationen.
- [ ] **4.11 Lägg till egenskapstest (fuzz).** Slumpade strängar in — parsern får aldrig kasta
      undantag, bara returnera `unresolved`.
      **Klart när:** 1 000 slumpade indata ger noll undantag.
- [ ] **4.12 Mät täckningen på `src/parser/`.**
      **Klart när:** grenäckning ≥ 90 % och siffran är noterad i `HANDOFF.md`.

🚧 **GRIND 3:** Inget UI får anropa parsern innan 4.10 och 4.12 är klara.

---

## Fas 5 — Lokalt datalager och loggning

- [ ] **5.1 Definiera Dexie-schemat.** `src/db/schema.ts` med de fem stores i planen §2.4.
      **Klart när:** databasen öppnas i webbläsaren och stores syns i devtools.
- [ ] **5.2 Skriv `createWorkout()` och `endWorkout()`.** Klientgenererat UUID.
      **Klart när:** enhetstest visar att ett pass skapas och avslutas.
- [ ] **5.3 Skriv `logSet()`.** Skriver till `logged_sets` **och** `outbox` i en transaktion.
      **Klart när:** enhetstest visar att båda skrivs, eller ingen vid fel.
- [ ] **5.4 Skriv `getLastPerformance(exerciseId)`.** Använder det sammansatta indexet.
      **Klart när:** enhetstest returnerar senaste setet för rätt övning.
- [ ] **5.5 Bygg vyn "Aktivt pass".** Lista över loggade set, knapp för nytt set.
      **Klart när:** `useLiveQuery` uppdaterar listan utan omladdning.
- [ ] **5.6 Bygg setinmatningen med spökdata.** Vikt- och repsfält förifyllda som transparent
      platshållartext från 5.4. `inputmode="decimal"`, tryckytor ≥ 48 px.
      **Klart när:** förra passets siffror syns som grå text i tomma fält.
- [ ] **5.7 Bygg "tyst framgång".** Ingen popup vid sparat set — diskret färgändring enligt
      SPEC. **Klart när:** ett set kan loggas utan att något blockerar skärmen.
- [ ] **5.8 Koppla in fritextfältet mot parsern.** Träff → förifyllda redigerbara fält. Miss →
      synligt otolkat utkast. **Klart när:** `Bänk 90x5` ger ett redigerbart setförslag offline.
- [ ] **5.9 Bygg "skapa ny övning" från en parsermiss.**
      **Klart när:** okänt övningsnamn kan bli en egen övning på två tryck.
- [ ] **5.10 Verifiera hela loggningsvägen offline.** Flygplansläge, logga ett helt pass.
      **Klart när:** 25 set kan loggas utan nät, och finns kvar efter omstart av appen.

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
- [ ] **6.4 Nivå 1 — visuellt larm.** Helskärmsbyte av bakgrundsfärg vid noll.
      **Klart när:** det syns tydligt utan ljud och utan behörigheter.
- [ ] **6.5 Wake Lock.** Begär vid timerstart, **återbegär vid `visibilitychange`**.
      **Klart när:** skärmen är tänd efter tre minuters vila utan att någon rört telefonen.
- [ ] **6.6 Nivå 2 — lokal notis**, om fas 0 visade att den fungerar. Behörighet begärs vid en
      explicit användargest, inte vid appstart.
      **Klart när:** notisen syns med appen i bakgrunden — eller uppgiften är struken med
      hänvisning till mätresultatet.
- [ ] **6.7 Nivå 3 — vibration**, om fas 0 visade att den fungerar.
      **Klart när:** telefonen vibrerar — eller uppgiften är struken med hänvisning till
      mätresultatet.
- [ ] **6.8 Nivå 4 — ljud**, om fas 0 visade att det hörs i tyst läge. `AudioContext` låses upp
      vid "Starta pass"; `suspend()`/`resume()` vid `visibilitychange`.
      **Klart när:** larmet hörs — eller uppgiften är struken med hänvisning till mätresultatet.
- [ ] **6.9 Justerbar vilotid.** Per övning, sparad i `meta`.
      **Klart när:** vald tid används vid nästa set av samma övning.

---

## Fas 7 — Synk

- [ ] **7.1 Bygg Supabase-klienten.** Anon-nyckel från env. **Klart när:** klienten
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
- [ ] **8.4 Skapa Edge Function `ai-parse`.** JWT-verifiering, Supabase-klient byggd med
      **anroparens** token. **Klart när:** anrop utan token avvisas med 401.
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
