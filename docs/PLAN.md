# Teknisk Plan

**Status:** Förslag. Ingen kod är skriven. Ingen migration är körd. Inget Supabase-projekt
är skapat. Detta dokument ska granskas och godkännas av människa innan `TASKS.md` fylls
i och kodning påbörjas (`CLAUDE.md`, regel 1).

Skrivet utifrån `docs/SPEC.md` och de två underlagen i `docs/research/`. Där jag avviker
från underlagen står det uttryckligen varför.

---

## 0. Sammanfattning av besluten

| Område | Förslag | Huvudskäl |
| :---- | :---- | :---- |
| Byggverktyg / ramverk | **Vite + React + TypeScript som ren SPA** — inte Next.js | All data är lokal och privat. Next.js serverdel ger inget här men gör offline-cachen betydligt svårare. |
| Lokal databas | **Dexie.js** ovanpå IndexedDB, `useLiveQuery` som enda "state manager" för data | Enligt underlaget. Reaktiva queries ger Optimistic UI utan extra bibliotek. |
| Servicearbetare | **vite-plugin-pwa** (Workbox), precache av app-skalet | Ett statiskt bygge går att cacha fullständigt. Appen startar utan nät. |
| Styling | **Tailwind CSS**, endast mörkt tema | Snabbt att hålla konsekvent, inga runtime-kostnader. |
| Synk | **Egen utkorg (outbox) i Dexie**, inte PowerSync/ElectricSQL | En användare, nästan bara tillägg av rader, sällsynta konflikter. Färdig synkmotor kostar mer i komplexitet och leverantörsberoende än den ger. |
| Idempotens | **Klientgenererad UUIDv4 som primärnyckel** + kvitterande `sync_mutations`-tabell | Uppfyller `CLAUDE.md` regel 4 utan extra rundtur i normalfallet. |
| Backend | **Supabase (Postgres + Auth + Edge Functions)** | Enligt SPEC. Edge Functions gör att vi slipper en andra leverantör för AI-anropet. |
| AI-parsning (drift) | **Lokal grammatikparser först, LLM som reserv** via autentiserad Edge Function | Gymkällare har inget nät. En AI-only-inmatning är trasig exakt när appen behövs. |
| MCP | **Separat spår, inte i inmatningsvägen** — samma verktygsimplementation exponerad två gånger | MCP:s värde är att *externa* klienter (Claude Desktop) når träningsloggen. Inne i vår egen backend anropar vi våra egna funktioner direkt. |

Två av dessa avviker från vad man kan läsa in i SPEC och underlagen. De är motiverade i
avsnitt 2.1 respektive 4.2 och är de två punkter jag främst vill ha ett ja eller nej på.

---

## 1. Systemöversikt

```
   iPhone / webbläsare
   ┌─────────────────────────────────────────────┐
   │  PWA (statiskt bygge, Vite + React)         │
   │                                             │
   │  UI ──useLiveQuery──▶ Dexie / IndexedDB     │  ← sanningen under passet
   │   │                      │                  │
   │   │                      └── outbox-tabell  │
   │   │                             │           │
   │   └── fritextfält                │          │
   │        ├─ lokal grammatik (0 ms, offline)   │
   │        └─ fallback: /ai/parse ──┐│          │
   └────────────────────────────────┬┴┼──────────┘
                                    │ │
                     (bara när nät finns)
                                    │ │
   Supabase ────────────────────────┼─┼───────────
   ┌────────────────────────────────▼─▼──────────┐
   │  Edge Function /ai/parse   │  PostgREST     │
   │   - verifierar JWT         │   - RLS på     │
   │   - äger LLM-nyckeln       │     varje rad  │
   │   - anropar gym-tools ──┐  │                │
   │                         ▼  ▼                │
   │              Postgres (workouts, sets, ...) │
   └─────────────────────────────────────────────┘
                             ▲
   ┌─────────────────────────┴───────────────────┐
   │  Edge Function /mcp  (spår 2, senare)       │
   │   samma gym-tools, MCP-transport            │
   │   ← Claude Desktop / Claude Code            │
   └─────────────────────────────────────────────┘
```

Poängen med bilden: **inmatningsvägen (UI → Dexie) korsar aldrig nätverket.** Allt till
höger om den streckade gränsen är valfritt och asynkront.

---

## 2. Frontend

### 2.1 Vite + React som SPA, inte Next.js

Prompten nämnde Next.js som exempel. Jag föreslår att vi väljer bort det, och skälet är
inte smak:

- **Det finns ingen serverrendering att vinna.** Varje byte data i appen är privat
  träningsdata som bara finns hos den inloggade användaren. Det finns inget att
  SEO-indexera och inget att förrendera. Next.js främsta värde är därmed borta.
- **App Router och offline-first drar åt olika håll.** Med RSC hämtar navigering en
  serverpayload. För att det ska fungera i en gymkällare måste varje sådan payload
  precachas och hållas i synk med rutterna. Ett statiskt SPA-bygge har i stället *ett*
  app-skal som Workbox precachar en gång; all navigering sker i klienten och kan aldrig
  misslyckas på grund av nät.
- **Vi behöver ändå en serverfunktion** — LLM-nyckeln får inte ligga i frontend
  (`CLAUDE.md`, regel 4). Den funktionen lägger vi i Supabase Edge Functions, som vi
  redan har. Att dra in Next.js enbart som värd för en enda API-rutt är fel storlek på
  verktyg.

Kostnaden för valet: om projektet senare vill ha publika sidor (delade rutiner, landningssida,
SEO) får de byggas separat. Med tanke på SPEC:s "absolut inget onödigt fluff eller sociala
flöden" bedömer jag den risken som låg. **Detta är beslutspunkt 1.**

### 2.2 Övriga frontendval

| Behov | Val | Kommentar |
| :---- | :---- | :---- |
| Routing | React Router (deklarativt läge) | Inga loaders — data kommer från Dexie, inte från rutten. |
| Datastate | `useLiveQuery` (dexie-react-hooks) | Komponenter prenumererar direkt på IndexedDB. Ingen Redux, ingen React Query. |
| Övrigt UI-state | React `useState` + en liten Zustand-store för pågående pass och timer | Litet och avgränsat. |
| Formulär | Inga formulärbibliotek. Rena `<input>` med `inputmode="decimal"` | Enligt underlagets ergonomikrav. |
| Styling | Tailwind CSS, `dark`-först, CSS-variabler för färgskala | |
| Grafer | **Inget grafbibliotek i v1.** Handritad SVG-sparkline | Recharts/uPlot är hundratals kB för två vyer. Läggs till om mätning visar att det behövs. |
| Ikoner | Inline SVG | Undviker ett paket för sex ikoner. |
| Tester | Vitest för parser och synklogik; Playwright för ett offline-scenario | Parsern och synken är de två delar där tyst fel gör verklig skada. |

### 2.3 PWA-lagret och de iOS-specifika fällorna

Från underlaget, plus tre punkter underlaget inte tar upp:

- `display: "standalone"` i `manifest.json`, `viewport-fit=cover`, och
  `env(safe-area-inset-*)` som padding på nav och flytande knappar.
- `100dvh` i stället för `100vh` på ytterbehållaren.
- Alla tryckytor minst 48×48 px.
- **Background Sync API finns inte i iOS Safari.** Underlaget nämner det som en möjlig
  synkmekanism. Vi kan inte bygga på det. Synk sker i förgrunden: vid appstart, vid
  `online`-event, vid `visibilitychange` till synlig, och efter varje mutation. Om
  användaren stänger appen med osynkade rader ligger de kvar i IndexedDB tills nästa gång.
  Det är acceptabelt just för att IndexedDB — inte molnet — är sanningen.
- **iOS rensar lagring för webbplatser som inte använts på sju dagar.** En PWA som lagts
  till på hemskärmen är undantagen, men en flik i Safari är det inte. Vi anropar
  `navigator.storage.persist()` vid start och visar en engångsuppmaning om att lägga till
  appen på hemskärmen. Osynkad data ska dessutom aldrig få ligga kvar länge — utkorgen
  töms vid varje tillfälle appen är i förgrunden med nät.
- **Uppdateringar.** Ny servicearbetare får inte byta ut appen mitt i ett pass. Vi använder
  `prompt`-läge: ny version aktiveras först när inget pass är aktivt, eller när användaren
  själv trycker på en diskret notis.

### 2.4 Lokal datamodell (Dexie)

Samma fält som Postgres-tabellerna i avsnitt 3, plus två klientlokala tabeller.
Klientgenererade UUID:n gör att raden har samma id lokalt som i molnet — det är
grunden för hela idempotensen.

| Store | Nycklar / index | Syfte |
| :---- | :---- | :---- |
| `exercises` | `id`, `normalized_name`, `*aliases` | Övningskatalog, global + egna. Söks av både UI och parsern. |
| `workouts` | `id`, `started_at`, `is_deleted` | Pass. |
| `logged_sets` | `id`, `workout_id`, `[exercise_id+performed_at]`, `performed_at` | Set. Sammansatt index driver spökdatan. |
| `outbox` | `++seq`, `status`, `mutation_id` | Kö av osända mutationer. `seq` ger FIFO. |
| `meta` | `key` | Synkmarkörer (`last_pulled_at` per tabell), aktivt pass, timerns sluttid. |

`personal_records` lagras inte. e1RM enligt Epley räknas i klienten vid behov — det är en
multiplikation per set, och att materialisera det innan vi mätt att det är långsamt vore
att bygga före mätning.

### 2.5 Synkmotorn

**Skrivning (klient → moln).** Varje mutation skriver i *en* Dexie-transaktion till både
entitetstabellen och `outbox`. Antingen syns setet lokalt och ligger i kön, eller inget av
det. En utkorgspost innehåller `mutation_id` (UUIDv4), operation, tabell, radens id,
payload, `created_at`, `attempts`, `last_error`.

En synkarbetare tömmer kön i ordning. Vid nätfel: exponentiell backoff, posten ligger kvar.
Vid permanent fel (4xx som inte är 401/409): posten markeras `failed` och **syns i UI som
en varning** — den får aldrig försvinna tyst. Det följer principen om att luckor ska vara
synliga.

**Läsning (moln → klient).** Vid appstart och när appen får fokus: hämta rader per tabell
där `updated_at > last_pulled_at`. RLS ser till att bara egna rader kommer med. En hämtad
rad som har en väntande utkorgspost skrivs *inte* över — lokalt vinner tills kön är tom.

**Konflikter.** Last-write-wins på `updated_at`. Det räcker eftersom en människa inte
loggar samma set från två enheter samtidigt. Raderingar är mjuka (`is_deleted = true`) så
att de kan propagera; hård radering sker bara när kontot tas bort.

**När räcker inte detta?** Om appen någon gång får delade rutiner eller flera samtidiga
skribenter per konto ska vi byta till PowerSync i stället för att lappa ihop egen
konfliktlösning. Det är noterat som en gräns, inte som ett planerat steg.

### 2.6 Vilotimer, Wake Lock och ljud

- **Timern lagras som sluttidpunkt**, inte som en nedräknande räknare. Bakgrundade
  `setInterval` strypes hårt av mobilwebbläsare; en räknare som tickar ner blir fel så
  snart skärmen släcks. Vi lagrar `timer_ends_at` i `meta` och renderar
  `ends_at - Date.now()`. Timern överlever både omladdning och bakgrundsläge.
- **Wake Lock** begärs när timern startar och **återbegärs på `visibilitychange`** —
  låset släpps av webbläsaren så fort appen tappar fokus, så ett enda anrop räcker inte.
- **Ljud via Web Audio API**, med `AudioContext` upplåst av användarens första
  interaktion (tryck på "Starta pass") och explicit `suspend()` / `resume()` vid
  `visibilitychange`.

> ⚠️ **Underlaget hävdar att Web Audio tar sig förbi iOS tysta läge. Det påståendet ska
> mätas, inte antas.** Beteendet har ändrats mellan iOS-versioner och är inte något vi
> ska bygga en kärnfunktion på baserat på en beskrivning. Innan timern byggs: en tio
> raders testsida på Adams egen telefon, med fysiska ljudknappen i tyst läge, både i
> Safari-flik och i standalone-läge. Om ljudet inte hörs behöver vi en synlig reserv
> (helskärmsblink + `navigator.vibrate`) och ska säga det rakt ut i UI:t i stället för
> att låta larmet tyst utebli. **Detta är beslutspunkt 3** — den är billig att avgöra
> och bör göras före allt annat timerarbete.

---

## 3. Supabase

### 3.1 Tabeller

Alla tabeller i `public`. Alla primärnycklar är `uuid` som **genereras av klienten**.
Alla tabeller med användardata har `user_id uuid not null references auth.users(id)`,
`created_at`, `updated_at` (satt av trigger) och `is_deleted boolean not null default false`.

**`profiles`**

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `id` | uuid PK | = `auth.users.id` |
| `display_name` | text null | |
| `unit_preference` | text not null default `'kg'` | `'kg'` eller `'lb'`, endast visning |
| `default_effort_scale` | text not null default `'rir'` | `'rir'` eller `'rpe'` |

**`exercises`** — en tabell för både global katalog och egna övningar.

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `id` | uuid PK | |
| `owner_id` | uuid **null** | `null` = global katalogövning, läsbar för alla, skrivbar för ingen |
| `name` | text not null | "Bänkpress" |
| `normalized_name` | text not null | gemener, utan diakriter — för dublettkontroll |
| `aliases` | text[] not null default `'{}'` | "bänk", "bench", "bp" — driver parsningen |
| `primary_muscle` | text not null | |
| `secondary_muscles` | text[] not null default `'{}'` | |
| `equipment` | text null | |
| `is_archived` | boolean not null default false | |

**`workouts`**

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `id` | uuid PK | klientgenererad |
| `user_id` | uuid not null | |
| `started_at` | timestamptz not null | |
| `ended_at` | timestamptz null | null = pågående |
| `title` | text null | |
| `note` | text null | |

**`logged_sets`** — kärntabellen.

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `id` | uuid PK | klientgenererad |
| `user_id` | uuid not null | denormaliserad hit så RLS slipper join (se 3.3) |
| `workout_id` | uuid not null → `workouts(id)` | |
| `exercise_id` | uuid not null → `exercises(id)` | |
| `set_index` | smallint not null | ordning inom övningen i passet |
| `weight_kg` | numeric(6,2) not null | **alltid kg i databasen**, konvertering sker i UI |
| `reps` | smallint not null | |
| `effort_type` | text null | `'rir'` eller `'rpe'` |
| `effort_value` | numeric(3,1) null | 1–10, valfri enligt SPEC |
| `rest_seconds` | integer null | |
| `note` | text null | "Ont i axeln" |
| `is_warmup` | boolean not null default false | |
| `performed_at` | timestamptz not null | exakt tid för setet |
| `source` | text not null default `'manual'` | `'manual'`, `'local_parse'`, `'ai_parse'` |

Två saker att notera i granskningen:

- SPEC beskriver **ett** valfritt ansträngningsfält (`RIR/RPE`). Jag har delat det i
  `effort_type` + `effort_value` i stället för två separata kolumner, så att en siffra
  aldrig blir tvetydig. UI:t visar bara den skala användaren valt i profilen.
- `weight_kg` är kanonisk. Ingen kolumn får någonsin innehålla en vikt utan känd enhet.
- `source` finns för att vi ska kunna *mäta* om AI-parsade set skiljer sig från
  manuellt inmatade (till exempel oftare rättas i efterhand).

**`sync_mutations`** — kvittensbok för idempotens.

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `mutation_id` | uuid PK | genereras av klienten per mutation |
| `user_id` | uuid not null | |
| `kind` | text not null | |
| `applied_at` | timestamptz not null default now() | |

**`ai_parse_log`** — utvärderingsdata för fritextparsningen.

| Kolumn | Typ | Not |
| :---- | :---- | :---- |
| `id` | uuid PK | |
| `user_id` | uuid not null | |
| `raw_text` | text not null | vad användaren skrev |
| `parser` | text not null | `'local'` eller `'llm'` |
| `model` | text null | modellsträng när `parser = 'llm'` |
| `parsed` | jsonb not null | vad parsern föreslog |
| `outcome` | text not null | `'accepted'`, `'edited'`, `'rejected'` |
| `corrected` | jsonb null | vad det blev efter rättning |
| `latency_ms` | integer null | |
| `created_at` | timestamptz not null | |

Utan den här tabellen kan vi aldrig svara på "hur ofta har AI:n rätt?", och då kan vi
heller inte avgöra om LLM-anropet är värt sin latens och kostnad. Den kostar en rad per
fritextinmatning.

### 3.2 Index

Index är inte en optimering här utan en förutsättning — RLS-uttrycket utvärderas per rad,
och utan index på `user_id` blir varje query en sekventiell genomsökning.

| Index | Tabell | Varför |
| :---- | :---- | :---- |
| `(user_id)` | alla användartabeller | **Obligatoriskt** för att RLS ska vara snabbt. |
| `(user_id, updated_at)` | `workouts`, `logged_sets` | Synkens hämtningsmarkör. |
| `(user_id, exercise_id, performed_at desc)` | `logged_sets` | Spökdatan: "senaste setet för denna övning" ska vara ett indexuppslag. |
| `(workout_id)` | `logged_sets` | Ladda ett pass. |
| `(normalized_name)`, GIN på `(aliases)` | `exercises` | Parserns övningsmatchning. |

### 3.3 RLS-strategi

Grundregeln är enkel och absolut: **varje tabell i `public` har RLS aktiverat, utan
undantag.** En ny tabell utan policy är inte "öppen tills vidare" — den är otillgänglig,
vilket är rätt förvalt läge.

Fem beslut utöver det:

1. **En policy per operation, inte `FOR ALL`.** Separata policyer för `SELECT`, `INSERT`,
   `UPDATE`, `DELETE` gör att `WITH CHECK` blir explicit på skrivningarna. `USING` avgör
   vilka rader som får läsas eller ändras; `WITH CHECK` hindrar att en inloggad användare
   skriver en rad märkt med någon annans `user_id`.

2. **Uttrycket är `(select auth.uid()) = user_id`, inte `auth.uid() = user_id`.**
   Skillnaden är inte kosmetisk: med `select`-omslutningen utvärderar Postgres funktionen
   *en gång* per query i stället för en gång per rad. Det är Supabase egen rekommendation
   och den enskilt största RLS-prestandaposten vid sidan av indexet.

3. **Ingen policy får innehålla en join.** Därför bär `logged_sets` en egen `user_id` trots
   att den kunde härledas via `workout_id`. En policy som slår upp ägaren via passtabellen
   skulle köras per rad. Denormaliseringen är avsiktlig, och `WITH CHECK` på insert ska
   dessutom verifiera att passet med det `workout_id` tillhör samma användare.

4. **`exercises` är specialfallet.** `SELECT` tillåts när `owner_id is null` (den globala
   katalogen) eller `owner_id = (select auth.uid())`. `INSERT`, `UPDATE` och `DELETE`
   kräver `owner_id = (select auth.uid())` — vilket gör den globala katalogen skrivskyddad
   för alla appanvändare utan att vi behöver en separat tabell. Katalogen underhålls via
   migrationer.

5. **`service_role`-nyckeln finns bara i migrationer, aldrig i en funktion som svarar på
   användartrafik.** Edge Function `/ai/parse` skapar sin Supabase-klient med **anroparens
   JWT**, vidarebefordrad från `Authorization`-headern. Det betyder att RLS gäller även
   inuti serverfunktionen: en bugg i funktionen kan i värsta fall röra den inloggade
   användarens egna rader, aldrig någon annans. En funktion som kör som `service_role` har
   ingen sådan spärr, och det är precis den genvägen som gör serverlösa backends osäkra.

**Radering.** UI:t raderar aldrig hårt; det sätter `is_deleted`. `DELETE`-policyerna finns
ändå definierade (annars vore hård radering omöjlig även för legitima fall), men används
inte i normalflödet. Kontoradering hanteras med `on delete cascade` från `auth.users`.

**Verifiering.** Innan lansering körs Supabase `get_advisors` (security-läget) och ska
komma tillbaka utan RLS-varningar. Dessutom ett negativt test: en andra användare försöker
läsa den förstas set via PostgREST och ska få noll rader, inte ett fel — vi ska se att
filtret biter, inte bara att API:t klagar.

### 3.4 Autentisering — och vad som händer offline

Supabase Auth med e-post + lösenord. Magiclink väljs bort: den kräver nät och en
mejlklient exakt när användaren står vid en skivstång.

Den viktiga designregeln: **inloggnings-UI får aldrig blockera loggnings-UI.** JWT:n går
ut efter en timme och kan bara förnyas med nät. En app som visar inloggningsskärm när
token gått ut är obrukbar i en källare. Därför:

- `user_id` cachas lokalt vid första lyckade inloggningen.
- Appen startar och fungerar fullt ut mot Dexie oavsett tokenstatus.
- En utgången token påverkar bara synkarbetaren, som väntar och försöker igen.
- Utloggning är en explicit handling som varnar om utkorgen inte är tom.

### 3.5 Idempotens från klient till databas

`CLAUDE.md` regel 4 kräver idempotensnycklar på alla mutationer. Så här uppfylls det i
två lager:

**Lager 1 — strukturell idempotens.** Eftersom primärnycklarna är klientgenererade
UUID:n blir varje insert en upsert med konflikt på `id`. Skickas samma set två gånger
för att svaret tappades bort blir den andra skrivningen en no-op i stället för en dublett.
Detta täcker normalfallet helt.

**Lager 2 — kvittensbok.** En Postgres-funktion `apply_mutations(batch jsonb)`, deklarerad
`SECURITY INVOKER` så att RLS fortsätter gälla, tar emot en batch mutationer i *en*
transaktion. Varje mutation bär sitt `mutation_id`; funktionen hoppar över de som redan
finns i `sync_mutations` och lägger in resten. Det ger tre saker på en gång: uttrycklig
idempotensnyckel enligt regeln, atomär batch (ett pass hamnar aldrig halvt i molnet), och
färre rundturer.

### 3.6 Medvetet utelämnat i v1

Skrivs ut för att det ska vara ett beslut och inte en glömska:

- **Rutiner och mallar.** Underlaget listar "starta från historisk mall" som måste-ha, men
  SPEC:s kärnfunktioner gör det inte. Schemat är utformat så att `routines` och
  `routine_exercises` kan läggas till additivt utan att röra `logged_sets`.
- **Superset, dropset, AMRAP.** `set_index` + `is_warmup` räcker för v1.
- **Volymdiagram per muskelgrupp.** Datan finns (`primary_muscle`), vyn byggs senare.
- **Apple Watch.** Utanför vad en PWA kan.
- **Export (JSON/CSV).** Bör med i v1.1 — underlaget har rätt i att datafrihet spelar roll
  för målgruppen, men det blockerar inte första versionen.

---

## 4. AI-chatten och MCP

### 4.1 Tre lager

| Lager | Kör var | Ser LLM-nyckeln? | Ansvar |
| :---- | :---- | :---- | :---- |
| **Klient** | PWA | Nej, aldrig | Lokal parsning; skickar fritext + kontext; renderar förslag som redigerbara fält |
| **Värd** | Supabase Edge Function `/ai/parse` | Ja (miljövariabel) | Verifierar JWT, kör LLM-anropet, exekverar verktyg, returnerar strukturerad JSON |
| **Verktyg** | Delad modul `gym-tools` | — | `find_exercise`, `get_last_performance`, `create_exercise`, `get_history` |

Nyckelbeslutet är att **verktygen implementeras en gång och monteras två gånger** — som
verktygsdefinitioner i parsningsfunktionen, och som MCP-verktyg i MCP-servern (4.5). Det
är vad som gör MCP-spåret billigt i stället för att vara ett parallellt system.

### 4.2 Varför MCP inte ligger i inmatningsvägen

MCP är ett protokoll för att låta *en modell eller agent* nå verktyg över en
standardiserad transport. Dess värde är interoperabilitet: att Claude Desktop, Claude Code
eller en annan klient kan prata med din data utan att du bygger en integration per klient.

Inne i vår egen Edge Function finns ingen sådan gräns att överbrygga. Att låta funktionen
tala MCP med sig själv innebär en JSON-RPC-rundtur, en transport och en sessionshantering
extra i den absolut mest latenskänsliga vägen i hela appen — mellan att användaren skrivit
"bänk 90x5" och att raden syns.

Det finns dessutom ett hårt hinder just nu, som jag verifierat mot Supabase egen
dokumentation: **MCP-servrar på Edge Functions stöder ännu inte autentisering.** Den
officiella guiden deployar med `--no-verify-jwt` och noterar uttryckligen att auth-stöd är
på väg. En MCP-server som bär användarens träningsdata får inte vara oautentiserad. Det
avgör frågan för v1.

Rekommendationen är därför tvåspårig:

- **Spår 1 (v1, drift):** `/ai/parse` anropar modellen direkt med verktygsdefinitioner.
  Ingen MCP i hot path.
- **Spår 2 (v1.5, integration):** en fristående MCP-server som exponerar *samma*
  `gym-tools`, för Adams egen användning från Claude Desktop ("visa min bänkpresstrend
  senaste halvåret"). Byggs när Supabase stöder autentiserad MCP, eller mot en egen
  OAuth-lösning om vi vill tidigare.

**Detta är beslutspunkt 2.** Om du hellre vill ha MCP i inmatningsvägen från dag ett går
det att göra — men det ska då vara ett medvetet val av arkitektonisk enhetlighet framför
latens, och auth-hindret måste lösas först.

### 4.3 Lokal grammatik före LLM

Detta är den enskilt viktigaste ändringen jag föreslår mot SPEC.

SPEC beskriver fritextloggning via AI som en kärnfunktion. Men ett AI-anrop kräver nät, och
premissen för hela appen är att gym saknar nät. Bygger vi fritextfältet som "skicka till
LLM" är den mest framhävda funktionen trasig exakt i den miljö appen är gjord för.

Föreslagen ordning i klienten:

1. **Lokal grammatik** (deterministisk, ~0 ms, fungerar offline). Täcker den form nästan
   all faktisk inmatning har:
   `<övning> <vikt>[kg|k] x|* <reps>[r|reps] [@ <tal>[rir|rpe]] [, <fritext som blir note>]`
   Övningsnamnet matchas mot `exercises.aliases` + `normalized_name` med fuzzy-matchning.
   Vikt utan enhet tolkas enligt profilens `unit_preference` — aldrig gissat.
2. **Träffar grammatiken inte**, och nät finns: anropa `/ai/parse`.
3. **Träffar grammatiken inte, och nät saknas:** spara råtexten som ett utkast kopplat till
   passet, markerat i UI som otolkat, och erbjud tolkning när nät finns igen. Texten går
   aldrig förlorad och blir aldrig tyst fel-tolkad.

Effekten är att LLM:en får hantera det den är bra på — "bänk kändes tungt idag, körde 90
fem gånger och sen två set till på 85" — medan normalfallet är omedelbart, gratis och
offline. Det gör också modellvalet i 4.4 till en kvalitetsfråga snarare än en kostnadsfråga.

### 4.4 Edge Function `/ai/parse`

**Kontrakt in:** `{ raw_text, workout_id, recent_exercise_ids[], unit_preference, client_time }`
**Kontrakt ut:** `{ sets: [...], unresolved: [...], confidence, parse_log_id }`

Kraven:

- Verifierar JWT. Anonyma anrop avvisas.
- Bygger Supabase-klienten med **anroparens** token (se 3.3), inte `service_role`.
- **`user_id` kommer alltid från JWT:n, aldrig från modellens verktygsargument.** Modellen
  får inte ens ett fält att fylla i. Det är den enda spärren som håller om en prompt någon
  gång blir manipulerad.
- Strukturerat utdata mot ett schema — inga fritextsvar att regex-parsa.
- Timeout ~4 s. Vid timeout eller fel: svara med `unresolved` och låt klienten falla
  tillbaka på manuell inmatning. Aldrig ett tomt lyckat svar.
- Skriver en rad i `ai_parse_log`.
- **Ringer aldrig ett LLM-anrop utan att en användare bett om det** — inga bakgrundsjobb,
  inga uppvärmningar.

**Modellval.** Förslag: `claude-opus-5` med `output_config: { effort: "low" }` och
`thinking: { type: "disabled" }`. Uppgiften är extraktion mot ett fast schema — låg effort
räcker och håller latensen nere. Systemprompt + verktygsdefinitioner läggs i en cachad
prefix; det lönar sig här eftersom modellens lägsta cachebara prefix är 512 tokens, vilket
en systemprompt med övningskatalogutdrag passerar.

Räkneexempel, **att verifiera genom mätning, inte att lita på**: vid ~1 000 tokens in och
~150 ut landar ett parsningsanrop kring 5–9 öre. Med grammatiken enligt 4.3 som fångar
merparten går bara en bråkdel av inmatningarna till modellen, vilket sannolikt betyder
tiotals kronor per år snarare än per månad. `claude-haiku-4-5` är ungefär en femtedel så
dyrt och skulle sänka latensen ytterligare — **det är ditt val, inte mitt, och bör tas
efter att `ai_parse_log` visat hur ofta modellen faktiskt anropas och hur ofta den har
rätt.** Bygg med opus-5, mät, byt om siffrorna säger det.

### 4.5 MCP-servern (spår 2)

När den byggs: en Edge Function `/mcp` med Streamable HTTP-transport, samma
`gym-tools`-modul, autentisering via OAuth/JWT när Supabase stöder det. Verktygsytan blir
läsdominerad — `get_history`, `get_personal_records`, `get_volume_by_muscle`,
`find_exercise` — eftersom värdet ligger i analys från skrivbordet, inte i loggning.
Eventuella skrivverktyg ska kräva samma `user_id`-från-token-regel som i 4.4.

### 4.6 Säkerhetsgränser i AI-vägen

- LLM-nyckeln finns bara som miljövariabel i Edge Function. Aldrig i klienten, aldrig i
  git, aldrig i `.env.example`.
- Modellen är aldrig auktoritet över vem datan tillhör.
- Modellens utdata valideras mot schema *innan* det når Dexie. Ett svar som inte validerar
  behandlas som `unresolved`.
- Fritexten är användarens egen, så promptinjektionsrisken är låg — men verktygen ska ändå
  vara skrivna som om den vore fientlig, eftersom MCP-spåret senare öppnar samma verktyg
  för externa klienter.

### 4.7 Att mäta att parsningen faktiskt fungerar

`ai_parse_log` med `outcome` gör tre frågor besvarbara efter några veckors användning:
hur ofta grammatiken räcker, hur ofta LLM:en behövs, och hur ofta någondera har fel. Utan
det blir "AI:n parsar det automatiskt" en känsla i stället för ett mätvärde — och då kan
vi varken försvara latensen eller motivera modellvalet.

---

## 5. Risker och öppna frågor

| # | Fråga | Behöver avgöras |
| :---- | :---- | :---- |
| 1 | **Vite-SPA i stället för Next.js** (2.1) | Före första kodraden |
| 2 | **MCP utanför inmatningsvägen i v1** (4.2) | Före AI-arbetet påbörjas |
| 3 | **Hörs Web Audio genom iOS tysta läge på din telefon?** (2.6) | Före timerarbetet — mätning, inte diskussion |
| 4 | Ska `effort` vara ett fält (`type` + `value`) eller två kolumner? (3.1) | Före migrationen |
| 5 | Vem fyller den globala övningskatalogen, och hur stor ska den vara i v1? | Före migrationen |
| 6 | Vilken domän/hosting? Statiskt bygge kan ligga på Cloudflare Pages, Netlify eller Vercel — påverkar inget i planen | Före deploy |

Risker jag inte har någon åtgärd för, men som ska vara sagda:

- **iOS är plattformens svagaste punkt.** Wake Lock, ljud i tyst läge, lagringsrensning och
  standalone-lägets egenheter är alla saker som har ändrats mellan iOS-versioner och kan
  ändras igen. Vi kan mildra, inte eliminera.
- **Underlaget i `docs/research/` är skrivet utan tillgång till kod eller körande system.**
  Koncepten håller; enskilda tekniska påståenden (som ljudet i tyst läge) ska verifieras
  innan de blir arkitektur.

---

## 6. Föreslagen ordning (underlag till `TASKS.md`)

Fylls i efter godkännande. Skissad ordning, med mätningarna först:

1. Mät ljud i tyst läge på iOS (fråga 3). Ren HTML-fil, inget ramverk.
2. Supabase-projekt + första migrationen: tabeller, index, RLS-policyer. Verifiera med
   `get_advisors` och ett negativt åtkomsttest.
3. Skelett-PWA: Vite + React + Tailwind + Dexie + manifest + servicearbetare. Installerbar,
   startar offline, ingen funktion ännu.
4. Loggningsvägen manuellt: pass, set, spökdata. Enbart Dexie, ingen synk.
5. Vilotimer med Wake Lock och ljud enligt utfallet av steg 1.
6. Utkorg + synkarbetare + `apply_mutations`. Först nu rör appen nätet.
7. Lokal grammatikparser + `ai_parse_log`.
8. Edge Function `/ai/parse` som reserv.
9. Historik, PB och e1RM-graf.
10. Export (JSON/CSV).
11. MCP-server, spår 2.

Ordningen är vald så att appen är användbar på gymmet efter steg 5 — före all synk och all
AI.
