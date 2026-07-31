# Teknisk Plan

**Status:** Godkänd 2026-07-30 vad gäller de tre arkitekturbesluten (Vite-SPA, MCP utanför
inmatningsvägen, lokal parser före LLM). Tre odiskutabla krav tillagda samma dag: gratis-stack
(§7), testdriven parser (§4.3) och notis-före-ljud för vilotimern (§2.6).

Ingen kod är skriven. Inget Supabase-projekt är skapat. Nedbrytningen till uppgifter finns i
`docs/TASKS.md`.

Skrivet utifrån `docs/SPEC.md` och de två underlagen i `docs/research/`. Där jag avviker från
underlagen står det uttryckligen varför.

---

## 0. Sammanfattning av besluten

| Område | Beslut | Huvudskäl |
| :---- | :---- | :---- |
| Byggverktyg / ramverk | **Vite + React + TypeScript som ren SPA** — inte Next.js | All data är lokal och privat. Next.js serverdel ger inget här men gör offline-cachen betydligt svårare. |
| Lokal databas | **Dexie.js** ovanpå IndexedDB, `useLiveQuery` som enda "state manager" för data | Reaktiva queries ger Optimistic UI utan extra bibliotek. |
| Servicearbetare | **vite-plugin-pwa** (Workbox), precache av app-skalet | Ett statiskt bygge går att cacha fullständigt. Appen startar utan nät. |
| Styling | **Tailwind CSS**, endast mörkt tema | Snabbt att hålla konsekvent, inga runtime-kostnader. |
| Synk | **Egen utkorg (outbox) i Dexie**, inte PowerSync/ElectricSQL | En användare, nästan bara tillägg av rader, sällsynta konflikter. Färdig synkmotor kostar mer i komplexitet, leverantörsberoende **och pengar** än den ger. |
| Idempotens | **Klientgenererad UUIDv4 som primärnyckel** + kvitterande `sync_mutations`-tabell | Uppfyller `CLAUDE.md` regel 4 utan extra rundtur i normalfallet. |
| Backend | **Supabase Free Tier** (Postgres + Auth + Edge Functions) | Enligt SPEC. Edge Functions gör att vi slipper en andra leverantör för AI-anropet. |
| Hosting | **Vercel** (statiskt bygge) — beslutat 2026-07-30, inga alternativ övervägs | Ett statiskt SPA kostar ingenting att hosta. Adam har redan konto. |
| Fritextparsning | **Lokal grammatik, testdriven, skriven först.** LLM enbart som reserv. | Gymkällare har inget nät. En AI-only-inmatning är trasig exakt när appen behövs. |
| LLM-leverantör | **Groq primärt, Gemini som reserv** — båda gratisnivå, bakom ett leverantörsoberoende gränssnitt | Krav från beställaren. Groq för latens, Gemini för schemastyrd utdata. |
| MCP | **Separat spår, inte i inmatningsvägen** — samma verktygsimplementation exponerad två gånger | MCP:s värde är att *externa* klienter (Claude Desktop) når träningsloggen. Inne i vår egen backend anropar vi våra egna funktioner direkt. Dessutom saknar Supabase MCP-stöd autentisering i dag. |
| Vilotimerns larm | **Visuellt först, notis näst, vibration och ljud som bonus** | Telefonen ligger normalt på ljudlöst. Skärmen är ändå tänd via Wake Lock. |

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
   Supabase Free Tier ──────────────┼─┼───────────
   ┌────────────────────────────────▼─▼──────────┐
   │  Edge Function /ai/parse   │  PostgREST     │
   │   - verifierar JWT         │   - RLS på     │
   │   - äger LLM-nyckeln       │     varje rad  │
   │   - Groq → Gemini fallback │                │
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

**Inmatningsvägen (UI → Dexie) korsar aldrig nätverket.** Allt till höger om den streckade
gränsen är valfritt och asynkront.

---

## 2. Frontend

### 2.1 Vite + React som SPA, inte Next.js

- **Det finns ingen serverrendering att vinna.** Varje byte data i appen är privat
  träningsdata som bara finns hos den inloggade användaren. Inget att SEO-indexera, inget
  att förrendera.
- **App Router och offline-first drar åt olika håll.** Med RSC hämtar navigering en
  serverpayload som måste precachas och hållas i synk med rutterna. Ett statiskt
  SPA-bygge har i stället *ett* app-skal som Workbox precachar en gång; all navigering
  sker i klienten och kan aldrig misslyckas på grund av nät.
- **Vi behöver ändå en serverfunktion** — LLM-nyckeln får inte ligga i frontend
  (`CLAUDE.md`, regel 4). Den lägger vi i Supabase Edge Functions. Att dra in Next.js
  enbart som värd för en enda API-rutt är fel storlek på verktyg.
- **Gratis-stacken blir enklare.** Ett statiskt bygge har inga serverless-anrop, inga
  kallstarter och inga funktionsminuter att hålla reda på. Det ryms i vilken gratisnivå
  som helst, för alltid.

Kostnad för valet: publika sidor (delade rutiner, landningssida, SEO) får byggas separat
om de någonsin blir aktuella. Med SPEC:s "absolut inget onödigt fluff" är risken låg.

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
| Tester | **Vitest.** Parsern testdrivet (§4.3), synklogiken enhetstestad, ett Playwright-scenario för offline | Parsern och synken är de två delar där tyst fel gör verklig skada. |

### 2.3 PWA-lagret och de iOS-specifika fällorna

- `display: "standalone"` i `manifest.json`, `viewport-fit=cover`, och
  `env(safe-area-inset-*)` som padding på nav och flytande knappar.
- `100dvh` i stället för `100vh` på ytterbehållaren.
- Alla tryckytor minst 48×48 px.
- **Background Sync API finns inte i iOS Safari.** Underlaget nämner det som möjlig
  synkmekanism. Vi kan inte bygga på det. Synk sker i förgrunden: vid appstart, vid
  `online`-event, vid `visibilitychange` till synlig, och efter varje mutation. Stänger
  användaren appen med osynkade rader ligger de kvar i IndexedDB tills nästa gång. Det är
  acceptabelt just för att IndexedDB — inte molnet — är sanningen.
- **iOS rensar lagring för webbplatser som inte använts på sju dagar.** En PWA som lagts
  till på hemskärmen är undantagen; en flik i Safari är det inte. Vi anropar
  `navigator.storage.persist()` vid start och visar en engångsuppmaning om att lägga till
  appen på hemskärmen. **Att appen installeras på hemskärmen är dessutom en förutsättning
  för notiser på iOS** (§2.6) — de två skälen pekar åt samma håll.
- **Uppdateringar.** Ny servicearbetare får inte byta ut appen mitt i ett pass. Vi använder
  `prompt`-läge: ny version aktiveras när inget pass är aktivt, eller när användaren själv
  trycker på en diskret notis.

### 2.4 Lokal datamodell (Dexie)

Samma fält som Postgres-tabellerna i §3, plus två klientlokala tabeller. Klientgenererade
UUID:n gör att raden har samma id lokalt som i molnet — grunden för hela idempotensen.

| Store | Nycklar / index | Syfte |
| :---- | :---- | :---- |
| `exercises` | `id`, `normalized_name`, `*aliases` | Övningskatalog, global + egna. Söks av både UI och parsern. |
| `workouts` | `id`, `started_at`, `is_deleted` | Pass. |
| `logged_sets` | `id`, `workout_id`, `[exercise_id+performed_at]`, `performed_at` | Set. Sammansatt index driver spökdatan. |
| `outbox` | `++seq`, `status`, `mutation_id` | Kö av osända mutationer. `seq` ger FIFO. |
| `meta` | `key` | Synkmarkörer (`last_pulled_at` per tabell), aktivt pass, timerns sluttid. |

`personal_records` lagras inte. e1RM enligt Epley räknas i klienten vid behov — en
multiplikation per set. Att materialisera det innan vi mätt att det är långsamt vore att
bygga före mätning.

### 2.5 Synkmotorn

**Skrivning (klient → moln).** Varje mutation skriver i *en* Dexie-transaktion till både
entitetstabellen och `outbox`. Antingen syns setet lokalt och ligger i kön, eller inget av
det. En utkorgspost innehåller `mutation_id` (UUIDv4), operation, tabell, radens id,
payload, `created_at`, `attempts`, `last_error`.

En synkarbetare tömmer kön i ordning. Vid nätfel: exponentiell backoff, posten ligger kvar.
Vid permanent fel (4xx som inte är 401/409): posten markeras `failed` och **syns i UI som en
varning** — den får aldrig försvinna tyst.

**Läsning (moln → klient).** Vid appstart och när appen får fokus: hämta rader per tabell där
`updated_at > last_pulled_at`. RLS ser till att bara egna rader kommer med. En hämtad rad som
har en väntande utkorgspost skrivs *inte* över — lokalt vinner tills kön är tom.

**Konflikter.** Last-write-wins på `updated_at`. Det räcker eftersom en människa inte loggar
samma set från två enheter samtidigt. Raderingar är mjuka (`is_deleted = true`) så att de kan
propagera; hård radering sker bara när kontot tas bort.

**Gräns.** Får appen någon gång delade rutiner eller flera samtidiga skribenter per konto ska
vi byta till en riktig synkmotor i stället för att lappa ihop egen konfliktlösning. Det är
noterat som en gräns, inte som ett planerat steg — och det skulle kosta pengar, vilket §7
utesluter.

### 2.6 Vilotimern — mätt, inte antaget

**Mätning utförd 2026-07-30** på iPhone, iOS 18.7, Safari 26.5.2, installerad PWA på
hemskärmen, fysiska ljudomkopplaren i **tyst läge**, larm utlöst efter 5 sekunder med appen
lagd i bakgrunden. Detta är observerat utfall, inte en bedömning:

| Kanal | API-utfall | Observerat | Slutsats |
| :---- | :---- | :---- | :---- |
| **Notis** (`registration.showNotification()`) | `permission=granted`, inget fel | ✅ **Kom fram i bakgrunden** — med iOS eget systemljud *och* vibration, trots tyst läge | **Bärande kanal.** |
| **Visuell blink** | inget API inblandat | ❌ Bara när appen låg i förgrunden | Kompletterande, endast i förgrunden. |
| **Vibration** (`navigator.vibrate()`) | `'vibrate' in navigator === false` | ❌ Ingen effekt | **Struken.** API:et finns inte i iOS. |
| **Ljud** (Web Audio) | `state: running` → **`interrupted`** i bakgrunden | ❌ Bara i förgrunden | **Struken som larmkanal.** |

Tre saker att lyfta ur mätningen:

1. **Vibrationsfrågan är avgjord.** `'vibrate' in navigator` returnerar `false` på iOS 18.7.
   De motstridiga källorna hade fel; caniuse hade rätt. Allt arbete med `navigator.vibrate`
   är struket. Notisen ger ändå en vibration — via systemet, inte via oss.
2. **`AudioContext` gick till `interrupted`** när appen bakgrundades. Det är iOS som stänger
   ljudsessionen. Web Audio kan därför aldrig bära ett larm som ska höras när appen inte är
   framme, oavsett tyst läge. Ljudlarm är struket.
3. **Notisen bar både ljud och vibration gratis.** Genom att lämna över återkopplingen till
   operativsystemet får vi kanaler vi själva inte kan nå. Det är den enskilt viktigaste
   insikten i hela mätningen.

**Beslutad arkitektur:**

| Läge | Kanal |
| :---- | :---- |
| Appen i bakgrunden eller skärmen släckt | **Lokal notis** från servicearbetaren |
| Appen i förgrunden | **Visuell helskärmsförändring** (ingen notis — den vore störande när man redan tittar) |

> ⚠️ **Terminologi som spelar roll: detta är en *lokal notis*, inte Web Push.**
>
> Skillnaden är inte semantisk utan avgör om appen fungerar i ett gym.
>
> - **Lokal notis** — sidans egen JavaScript anropar `registration.showNotification()`.
>   Ingen server, inga VAPID-nycklar, ingen prenumeration, **inget nätverk**. Det är detta
>   som mättes och fungerade.
> - **Web Push** — en server skickar ett meddelande via Apples pushtjänst, servicearbetaren
>   tar emot ett `push`-event och visar notisen. Kräver **nätverk i det ögonblick larmet ska
>   gå**, plus en pushserver och nyckelhantering.
>
> Web Push vore fel val här: premissen för hela appen är att gymmet saknar nät. En vilotimer
> som kräver uppkoppling för att ringa är trasig precis där den behövs. Den lokala notisen
> har inget sådant beroende. Vi bygger aldrig Web Push i den här appen.

**Timern lagras som sluttidpunkt**, inte som en nedräknande räknare. Bakgrundade
`setInterval` strypes hårt av mobilwebbläsare; en räknare som tickar ner blir fel så snart
skärmen släcks. Vi lagrar `timer_ends_at` i `meta` och renderar `ends_at - Date.now()`.
Timern överlever både omladdning och bakgrundsläge.

**Wake Lock** begärs när timern startar och **återbegärs på `visibilitychange`** — låset
släpps av webbläsaren så fort appen tappar fokus, så ett enda anrop räcker inte.

> ⚠️ **En kvarvarande mätning innan fas 6 byggs: håller timern i tre minuter?**
>
> Mätningen ovan använde **5 sekunders** fördröjning. En vilotid är 2–5 minuter. Det som
> utlöste notisen var en `setTimeout` i sidans egen JavaScript — och iOS fryser bakgrundade
> webbsidors JavaScript efter en kort stund. Fem sekunder hann sannolikt inom nådatiden.
> Tre minuter kanske inte gör det.
>
> Misslyckas det ser man det inte som tystnad utan som att **notisen kommer i samma sekund
> som man öppnar appen igen** — vilket är värre än inget larm, eftersom det ser ut att
> fungera.
>
> `TimestampTrigger` / Notification Triggers API, som skulle lösa det genom att låta
> operativsystemet hålla i schemaläggningen, finns bara i Chromium och har aldrig
> implementerats i Safari. Vi har alltså ingen given reservplan, och det är just därför
> mätningen måste göras före bygget: **uppgift 0.8 i `TASKS.md`, med 3 minuters fördröjning.**
> Faller den ut negativt är svaret sannolikt att låta Wake Lock hålla skärmen tänd och
> acceptera att appen ska ligga framme under vilan — inte att bygga Web Push.

---

## 3. Supabase

### 3.1 Tabeller

Alla tabeller i `public`. Alla primärnycklar är `uuid` som **genereras av klienten**. Alla
tabeller med användardata har `user_id uuid not null references auth.users(id)`, `created_at`,
`updated_at` (satt av trigger) och `is_deleted boolean not null default false`.

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
| `user_id` | uuid not null | denormaliserad hit så RLS slipper join (se §3.3) |
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

Att notera i granskningen:

- SPEC beskriver **ett** valfritt ansträngningsfält (`RIR/RPE`). Jag har delat det i
  `effort_type` + `effort_value` så att en siffra aldrig blir tvetydig. UI:t visar bara den
  skala användaren valt i profilen.
- `weight_kg` är kanonisk. Ingen kolumn får någonsin innehålla en vikt utan känd enhet.
- `source` finns för att vi ska kunna *mäta* om parsade set skiljer sig från manuellt
  inmatade — till exempel oftare rättas i efterhand.

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
| `provider` | text null | `'groq'` / `'gemini'` när `parser = 'llm'` |
| `model` | text null | modellsträng |
| `parsed` | jsonb not null | vad parsern föreslog |
| `outcome` | text not null | `'accepted'`, `'edited'`, `'rejected'` |
| `corrected` | jsonb null | vad det blev efter rättning |
| `latency_ms` | integer null | |
| `created_at` | timestamptz not null | |

Utan den här tabellen kan vi aldrig svara på "hur ofta har parsern rätt?", och då kan vi
heller inte avgöra om LLM-anropet är värt sin latens. Den kostar en rad per fritextinmatning.

### 3.2 Index

Index är inte en optimering här utan en förutsättning — RLS-uttrycket utvärderas per rad, och
utan index på `user_id` blir varje query en sekventiell genomsökning.

| Index | Tabell | Varför |
| :---- | :---- | :---- |
| `(user_id)` | alla användartabeller | **Obligatoriskt** för att RLS ska vara snabbt. |
| `(user_id, updated_at)` | `workouts`, `logged_sets` | Synkens hämtningsmarkör. |
| `(user_id, exercise_id, performed_at desc)` | `logged_sets` | Spökdatan: "senaste setet för denna övning" ska vara ett indexuppslag. |
| `(workout_id)` | `logged_sets` | Ladda ett pass. |
| `(normalized_name)`, GIN på `(aliases)` | `exercises` | Parserns övningsmatchning. |

### 3.3 RLS-strategi

Grundregeln är enkel och absolut: **varje tabell i `public` har RLS aktiverat, utan undantag.**
En ny tabell utan policy är inte "öppen tills vidare" — den är otillgänglig, vilket är rätt
förvalt läge.

Fem beslut utöver det:

1. **En policy per operation, inte `FOR ALL`.** Separata policyer för `SELECT`, `INSERT`,
   `UPDATE`, `DELETE` gör att `WITH CHECK` blir explicit på skrivningarna. `USING` avgör vilka
   rader som får läsas eller ändras; `WITH CHECK` hindrar att en inloggad användare skriver en
   rad märkt med någon annans `user_id`.

2. **Uttrycket är `(select auth.uid()) = user_id`, inte `auth.uid() = user_id`.** Skillnaden
   är inte kosmetisk: med `select`-omslutningen utvärderar Postgres funktionen *en gång* per
   query i stället för en gång per rad. Det är Supabase egen rekommendation och den enskilt
   största RLS-prestandaposten vid sidan av indexet.

3. **Ingen policy får innehålla en join.** Därför bär `logged_sets` en egen `user_id` trots att
   den kunde härledas via `workout_id`. En policy som slår upp ägaren via passtabellen skulle
   köras per rad. Denormaliseringen är avsiktlig, och `WITH CHECK` på insert ska dessutom
   verifiera att passet med det `workout_id` tillhör samma användare.

4. **`exercises` är specialfallet.** `SELECT` tillåts när `owner_id is null` (globala
   katalogen) eller `owner_id = (select auth.uid())`. `INSERT`, `UPDATE` och `DELETE` kräver
   `owner_id = (select auth.uid())` — vilket gör den globala katalogen skrivskyddad för alla
   appanvändare utan att vi behöver en separat tabell. Katalogen underhålls via migrationer.

5. **Hemliga nyckeln finns bara i migrationer, aldrig i en funktion som svarar på
   användartrafik.** Edge Function `/ai/parse` skapar sin Supabase-klient med **anroparens
   JWT**. Det betyder att RLS gäller även inuti serverfunktionen: en bugg i funktionen kan i
   värsta fall röra den inloggade användarens egna rader, aldrig någon annans. En funktion som
   kör med den hemliga nyckeln har ingen sådan spärr, och det är precis den genvägen som gör
   serverlösa backends osäkra.

**Nycklar: nya modellen från dag ett.** Supabase har ersatt `anon` och `service_role` med
**publishable** (`sb_publishable_…`) och **secret** (`sb_secret_…`). De gamla fungerar till
utgången av 2026, men eftersom vi startar från noll finns ingen anledning att bygga på något
som ska bytas ut inom ett år. Kartläggningen:

| Gammalt | Nytt | Var den får finnas |
| :---- | :---- | :---- |
| `anon` | **publishable** | Frontend, publik källkod. Låg behörighet, RLS gäller. |
| `service_role` | **secret** | Enbart migrationer och skript vi kör själva. **Kringgår RLS helt.** |

Två praktiska följder att känna till innan Edge Functions byggs: de nya nycklarna är inte
JWT:er, så de ska skickas i `apikey`-headern (inte `Authorization: Bearer`), och plattformens
inbyggda `verify_jwt` förstår dem inte — funktionen sätter `verify_jwt = false` och auktoriserar
i egen kod. Supabase rekommenderar `@supabase/server`-SDK:n med `withSupabase({ auth: 'user' })`
för nya funktioner, vilket ger exakt det vi vill ha i punkt 5: en färdig klient som är scopead
till anroparens RLS. Det är förstahandsvalet i uppgift 8.4.

**Radering.** UI:t raderar aldrig hårt; det sätter `is_deleted`. `DELETE`-policyerna finns ändå
definierade (annars vore hård radering omöjlig även för legitima fall), men används inte i
normalflödet. Kontoradering hanteras med `on delete cascade` från `auth.users`.

**Verifiering.** Innan lansering körs Supabase `get_advisors` (security-läget) och ska komma
tillbaka utan RLS-varningar. Dessutom ett negativt test: en andra användare försöker läsa den
förstas set via PostgREST och ska få **noll rader, inte ett fel** — vi ska se att filtret
biter, inte bara att API:t klagar.

### 3.4 Autentisering — och vad som händer offline

Supabase Auth med e-post + lösenord. Magiclink väljs bort: den kräver nät och en mejlklient
exakt när användaren står vid en skivstång.

Den viktiga designregeln: **inloggnings-UI får aldrig blockera loggnings-UI.** JWT:n går ut
efter en timme och kan bara förnyas med nät. En app som visar inloggningsskärm när token gått
ut är obrukbar i en källare. Därför:

- `user_id` cachas lokalt vid första lyckade inloggningen.
- Appen startar och fungerar fullt ut mot Dexie oavsett tokenstatus.
- En utgången token påverkar bara synkarbetaren, som väntar och försöker igen.
- Utloggning är en explicit handling som varnar om utkorgen inte är tom.

### 3.5 Idempotens från klient till databas

`CLAUDE.md` regel 4 kräver idempotensnycklar på alla mutationer. Två lager:

**Lager 1 — strukturell idempotens.** Eftersom primärnycklarna är klientgenererade UUID:n blir
varje insert en upsert med konflikt på `id`. Skickas samma set två gånger för att svaret
tappades bort blir den andra skrivningen en no-op i stället för en dublett. Detta täcker
normalfallet helt.

**Lager 2 — kvittensbok.** En Postgres-funktion `apply_mutations(batch jsonb)`, deklarerad
`SECURITY INVOKER` så att RLS fortsätter gälla, tar emot en batch mutationer i *en* transaktion.
Varje mutation bär sitt `mutation_id`; funktionen hoppar över de som redan finns i
`sync_mutations` och lägger in resten. Det ger tre saker på en gång: uttrycklig idempotensnyckel
enligt regeln, atomär batch (ett pass hamnar aldrig halvt i molnet), och färre rundturer — vilket
också sparar på gratisnivåns anropskvot.

### 3.6 Medvetet utelämnat i v1

Skrivs ut för att det ska vara ett beslut och inte en glömska:

- **Rutiner och mallar.** Underlaget listar "starta från historisk mall" som måste-ha, men
  SPEC:s kärnfunktioner gör det inte. Schemat är utformat så att `routines` och
  `routine_exercises` kan läggas till additivt utan att röra `logged_sets`.
- **Superset, dropset, AMRAP.** `set_index` + `is_warmup` räcker för v1.
- **Volymdiagram per muskelgrupp.** Datan finns (`primary_muscle`), vyn byggs senare.
- **Apple Watch.** Utanför vad en PWA kan.
- **Export (JSON/CSV).** Bör med i v1.1 — underlaget har rätt i att datafrihet spelar roll för
  målgruppen, men det blockerar inte första versionen.

---

## 4. Fritextinmatning: parser och AI

### 4.1 Tre lager

| Lager | Kör var | Ser LLM-nyckeln? | Ansvar |
| :---- | :---- | :---- | :---- |
| **Klient** | PWA | Nej, aldrig | Lokal grammatik; skickar fritext + kontext vid miss; renderar förslag som redigerbara fält |
| **Värd** | Supabase Edge Function `/ai/parse` | Ja (miljövariabel) | Verifierar JWT, kör LLM-anropet, returnerar strukturerad JSON |
| **Verktyg** | Delad modul `gym-tools` | — | `find_exercise`, `get_last_performance`, `create_exercise`, `get_history` |

Verktygen **implementeras en gång och monteras två gånger** — som verktygsdefinitioner i
parsningsfunktionen, och som MCP-verktyg i MCP-servern (§4.6). Det är vad som gör MCP-spåret
billigt i stället för att vara ett parallellt system.

### 4.2 Varför MCP inte ligger i inmatningsvägen

MCP är ett protokoll för att låta *en modell eller agent* nå verktyg över en standardiserad
transport. Dess värde är interoperabilitet: att Claude Desktop, Claude Code eller en annan
klient kan prata med din data utan att du bygger en integration per klient.

Inne i vår egen Edge Function finns ingen sådan gräns att överbrygga. Att låta funktionen tala
MCP med sig själv innebär en JSON-RPC-rundtur, en transport och en sessionshantering extra i
den mest latenskänsliga vägen i hela appen.

Det finns dessutom ett hårt hinder, verifierat mot Supabase egen dokumentation: **MCP-servrar
på Edge Functions stöder ännu inte autentisering.** Den officiella guiden deployar med
`--no-verify-jwt` och noterar uttryckligen att auth-stöd är på väg. En MCP-server som bär
användarens träningsdata får inte vara oautentiserad.

- **Spår 1 (v1, drift):** `/ai/parse` anropar modellen direkt. Ingen MCP i hot path.
- **Spår 2 (senare):** fristående MCP-server som exponerar *samma* `gym-tools`, för användning
  från Claude Desktop. Byggs när Supabase stöder autentiserad MCP.

### 4.3 Den lokala parsern — testdriven, skriven först

**Detta är projektets mest kritiska enskilda komponent.** Den körs på varje inmatning, den
körs offline, och den skriver till databasen. En tyst feltolkning här förstör insamlad
träningsdata på ett sätt som inte går att upptäcka i efterhand.

Därför gäller: **testerna skrivs före implementationen.** Ingen parserkod committas utan att
en motsvarande testfil finns och är röd innan den blir grön. Uppgifterna i `TASKS.md` är
ordnade så att detta är mekaniskt omöjligt att hoppa över.

**Grammatikens form:**

```
<övning> <vikt>[enhet] [x|*|×] <reps>[r|reps] [@ <tal>[rir|rpe]] [, <fritext>]
```

**Testkorpus — måste tolkas felfritt.** Alla ska ge `Bänkpress, 90 kg, 5 reps` om inget annat
anges:

| Indata | Förväntat |
| :---- | :---- |
| `Bänkpress 90x5` | grundfallet |
| `Bänk 90 kg 5 reps` | alias + utskrivna enheter |
| `bänk 90kg x 5` | gemener, hopskriven enhet |
| `BÄNKPRESS 90 X 5` | versaler |
| `Bänkpress 90*5` | asterisk som separator |
| `Bänkpress 90×5` | unicode-multiplikationstecken |
| `Bänk 92,5x5` | **svenskt decimalkomma** → 92.5 kg |
| `Bänk 92.5x5` | punkt → 92.5 kg |
| `Bänk 90x5 @8` | + effort 8 (skala från profilen) |
| `Bänk 90x5 rir 2` | + effort_type `rir`, värde 2 |
| `Bänk 90x5 @8 rpe` | + effort_type `rpe`, värde 8 |
| `Bänk 90x5, kändes lätt` | + note "kändes lätt" |
| `Bänk 90x5, ont i axeln` | + note "ont i axeln" |
| `bench 90x5` | engelskt alias |
| `Bänkpress 90 5` | två bara tal, ingen separator |
| `  Bänk   90x5  ` | extra blanksteg |

**Måste avvisas (returnera `unresolved`, aldrig gissa):**

| Indata | Varför |
| :---- | :---- |
| `Bänkpress` | ingen vikt, inga reps |
| `90x5` | ingen övning |
| `Bänk 90` | reps saknas |
| `Blaha 90x5` | okänd övning → erbjud att skapa, skriv inget |
| `Bänk 90x5x3` | tvetydigt (tre set? tre reps?) |
| `` (tom sträng) | |

**Två regler som är viktigare än de ser ut:**

1. **Enhet gissas aldrig.** Ett tal utan enhetssuffix tolkas enligt profilens
   `unit_preference`. Det är ett *beslut*, inte en gissning, och det ska framgå i UI:t vilken
   enhet som användes.
2. **Vikt/reps-ordningen valideras.** Konventionen är vikt först. Men `20x30` (lätt hantel,
   många reps) och `100x10` ser likadana ut för en parser. Regeln: när ingen enhet anges och
   andra talet är större än 30, eller första talet mindre än 20, sätts låg konfidens och
   fältet markeras för bekräftelse i UI. Bättre att fråga en gång än att logga ett omvänt set.

**Övningsmatchning** sker mot `exercises.aliases` + `normalized_name` med normalisering
(gemener, å/ä/ö bevarade men diakriter i övrigt strippade) och fuzzy-matchning med tröskel.
Under tröskeln → `unresolved` + erbjudande att skapa ny övning. Aldrig automatiskt val bland
flera lika bra träffar.

**Ordning i klienten:**

1. Lokal grammatik (deterministisk, ~0 ms, offline).
2. Träffar den inte, och nät finns: anropa `/ai/parse`.
3. Träffar den inte, och nät saknas: spara råtexten som ett **synligt otolkat utkast** kopplat
   till passet, och erbjud tolkning när nät finns igen. Texten går aldrig förlorad och blir
   aldrig tyst fel-tolkad.

### 4.4 Edge Function `/ai/parse`

**Kontrakt in:** `{ raw_text, workout_id, recent_exercise_ids[], unit_preference, client_time }`
**Kontrakt ut:** `{ sets: [...], unresolved: [...], confidence, parse_log_id }`

Kraven:

- Verifierar JWT. Anonyma anrop avvisas.
- Bygger Supabase-klienten med **anroparens** token (§3.3), aldrig med den hemliga nyckeln.
- **`user_id` kommer alltid från JWT:n, aldrig från modellens utdata.** Modellen får inte ens
  ett fält att fylla i. Det är den enda spärren som håller om en prompt någon gång blir
  manipulerad.
- Strukturerat utdata mot ett JSON-schema — inga fritextsvar att regex-parsa.
- Timeout ~4 s. Vid timeout eller fel: svara med `unresolved` och låt klienten falla tillbaka
  på manuell inmatning. **Aldrig ett tomt lyckat svar.**
- Skriver en rad i `ai_parse_log`.
- **Ringer aldrig ett LLM-anrop utan att en användare bett om det** — inga bakgrundsjobb, inga
  uppvärmningar, ingen förhandsparsning medan användaren skriver.

### 4.5 LLM-leverantör: Groq primärt, Gemini som reserv

Krav från beställaren: gratisnivå. Båda uppfyller det.

| | Groq | Gemini |
| :---- | :---- | :---- |
| Roll | Primär | Reserv när Groq svarar med kvotfel eller timeout |
| Motiv | Latens — svarstiden är den avgörande egenskapen mitt i ett pass | Schemastyrd utdata (`responseSchema`) och en separat kvot att falla tillbaka på |
| Kostnad | Gratisnivå | Gratisnivå |

Funktionen skrivs mot ett **leverantörsoberoende gränssnitt** (`parseWithLLM(text, ctx)`) med
en implementation per leverantör, valda via miljövariabel. Att byta leverantör ska vara en
konfigurationsändring, inte en omskrivning. `ai_parse_log.provider` gör att vi i efterhand kan
jämföra träffsäkerhet mellan dem på exakt samma indata.

> ⚠️ **Kvotkollision med `news-signal-engine` — läs detta innan någon nyckel skapas.**
>
> Signalmotorprojektet använder redan både Groq och Gemini, och där finns en dokumenterad
> incident: ett testanrop tömde dygnskvoten och slog ut 22 % av en handelsdags signaler.
> Delar Gym-App organisation eller nyckel med det projektet kan en fritextinmatning på gymmet
> tysta produktionssignaler — eller tvärtom, en handelsdag kan göra fritextfältet obrukbart.
>
> **Gym-App ska ha egna API-nycklar i en egen organisation/projekt hos båda leverantörerna.**
> Det är gratis att skapa och eliminerar hela klassen av fel. Nycklarna finns bara som
> miljövariabler i Supabase Edge Functions — aldrig i klienten, aldrig i git, aldrig i
> `.env.example`.

Exakta modellnamn och aktuella kvotgränser fastställs vid implementationen, inte här — de
ändras oftare än det här dokumentet uppdateras. Adam har redan mätvärden från
`news-signal-engine` för både Groq och Gemini (och Mistral) att utgå från.

### 4.6 MCP-servern (spår 2)

När den byggs: en Edge Function `/mcp` med Streamable HTTP-transport, samma `gym-tools`-modul,
autentisering via OAuth/JWT när Supabase stöder det. Verktygsytan blir läsdominerad —
`get_history`, `get_personal_records`, `get_volume_by_muscle`, `find_exercise` — eftersom
värdet ligger i analys från skrivbordet, inte i loggning. Eventuella skrivverktyg ska kräva
samma `user_id`-från-token-regel som i §4.4.

### 4.7 Säkerhetsgränser i AI-vägen

- LLM-nyckeln finns bara som miljövariabel i Edge Function.
- Modellen är aldrig auktoritet över vem datan tillhör.
- Modellens utdata valideras mot schema *innan* det når Dexie. Ett svar som inte validerar
  behandlas som `unresolved`.
- Fritexten är användarens egen, så promptinjektionsrisken är låg — men verktygen skrivs som
  om den vore fientlig, eftersom MCP-spåret senare öppnar samma verktyg för externa klienter.

---

## 5. Risker och kvarvarande frågor

Beslutade 2026-07-30: Vite-SPA (§2.1), MCP utanför inmatningsvägen (§4.2), lokal parser före
LLM (§4.3), gratis-stack (§7), Vercel som enda hosting (§7.1), och — efter mätning — **lokal
notis som bärande larmkanal** (§2.6).

Två frågor som stod öppna avgjordes 2026-07-30 och är inte längre öppna:

- **`effort` blir ett fält**, `effort_type` (`'rir'` / `'rpe'`) + `effort_value`, inte två
  separata kolumner. En siffra ska aldrig kunna vara tvetydig om vilken skala den tillhör.
- **Övningskatalogen genereras som del av uppgift 2.16**: 30–50 grundövningar med svenska och
  engelska alias, `owner_id = null`.

| # | Kvarvarande fråga | Behöver avgöras |
| :---- | :---- | :---- |
| 1 | Håller en lokal notis i **tre minuter** med appen i bakgrunden? (§2.6) | **Uppgift 0.8 — blockerar endast uppgift 6.6** |

Det är den enda öppna frågan i hela planen.
| ~~4~~ | ~~Vercel eller Netlify?~~ **Avgjort 2026-07-30: Vercel.** | — |

Risker utan åtgärd, men som ska vara sagda:

- **iOS är plattformens svagaste punkt.** Wake Lock, ljud i tyst läge, vibration,
  lagringsrensning och standalone-lägets egenheter har alla ändrats mellan iOS-versioner och
  kan ändras igen. Vi kan mildra, inte eliminera. Design­valet i §2.6 — att lägga funktionen
  på det visuella lagret som inte kan tas ifrån oss — är just den mildringen.
- **Underlaget i `docs/research/` är skrivet utan tillgång till kod eller körande system.**
  Koncepten håller; enskilda tekniska påståenden ska verifieras innan de blir arkitektur.
  Två har redan visat sig behöva det (Background Sync på iOS, ljud i tyst läge).

---

## 6. Ordning

Detaljerad nedbrytning finns i `docs/TASKS.md`. Principerna bakom ordningen:

1. **Mätningar först.** Fas 0 avgör hur vilotimern får byggas.
2. **Parsern testdrivet, före allt som skriver data.**
3. **Appen ska vara användbar på gymmet innan någon synk eller AI finns.** Efter fas 6 kan
   Adam logga ett helt pass offline. Allt därefter är förbättringar.
4. **Nätet rörs sist.** Synk (fas 7) och LLM (fas 8) läggs ovanpå något som redan fungerar
   utan dem.

---

## 7. Gratis-stack: ramar och vad som händer när de nås

**Hårt krav: hela lösningen ska rymmas inom gratisnivåer.** Det är inte bara en budgetfråga —
det utesluter en hel klass av lösningar (PowerSync, hostade synkmotorer, Pro-planen) och det
ska därför stå skrivet var gränserna går.

### 7.1 Hosting

**Vercel Hobby.** Beslutat 2026-07-30 — Adam har redan konto, och andra leverantörer övervägs
inte. Eftersom frontenden är ett statiskt bygge utan serverside-körning finns här ingen
praktisk gräns att slå i: ingen funktionskörning, inga kallstarter, inga byggminuter av
betydelse för ett projekt med en utvecklare.

Notera att Hobby-planen är för icke-kommersiell användning. Ett personligt träningsprojekt
ligger tryggt inom det; skulle appen någon gång ta betalt byter förutsättningarna.

### 7.2 Supabase Free Tier — verifierade gränser

Hämtat från Supabase egen dokumentation:

| Gräns | Värde | Vad som händer när den nås |
| :---- | :---- | :---- |
| Databasstorlek | **500 MB** | Projektet går i **read-only** — inserts och deletes vägras |
| Diskutrymme | 1 GB | (read-only utlöses av 500 MB-gränsen, inte disken) |
| Egress (bandbredd) | **5 GB/mån** enligt kvottabellen | Storage-guiden anger 5 GB cachad + 5 GB ocachad. Oavsett vilken siffra som gäller är det inte den bindande gränsen här. |
| Edge Function-anrop | **500 000/mån** | Vi anropar bara vid fritextmissar — se §4.3 |
| Aktiva användare | 50 000 MAU | Irrelevant för en användare |
| Antal gratisprojekt | **2 totalt**, räknat över alla organisationer där du är ägare eller admin | Pausade projekt räknas inte. Se §7.4 |
| Inaktivitet | **7 dagar med för låg databasaktivitet → projektet pausas** | Varningsmejl ~1 vecka innan. Återstartas med ett klick i dashboarden inom 90 dagar. |
| Förbrukat från start | ~40–60 MB av 500 MB | Nytt projekt innehåller redan tillägg och systemscheman |

### 7.3 Ryms appen? Räkning, inte känsla

Ett `logged_sets`-rad är i storleksordningen 200 byte data plus radhuvud, och med de fem
indexen i §3.2 kan man räkna med ~400–500 byte per set totalt.

Vid 4 pass i veckan och 25 set per pass: ~5 200 set per år ≈ **2,5 MB per år**.
`ai_parse_log` är den enda tabell som växer snabbare per rad (råtext + jsonb, ~1 kB), men bara
vid fritextinmatning — i storleksordningen någon MB per år.

**Slutsats: 500 MB räcker i årtionden.** Databasstorleken är inte den bindande gränsen för det
här projektet. Det behöver sägas rakt ut, så att ingen designar bort funktionalitet av rädsla
för en gräns som ligger tre tiopotenser bort.

### 7.4 Den enda gratisnivå-risken som är verklig: pausningen

Sju dagars låg aktivitet pausar projektet. Två saker gör detta hanterbart, och ett gör det
nästan ointressant:

- **Appen fortsätter fungera helt normalt medan projektet är pausat.** IndexedDB är sanningen;
  utkorgen köar och töms när projektet är uppe igen. Detta är den direkta utdelningen av
  offline-first-arkitekturen, och det är värt att notera att designvalet råkar lösa ett
  affärsmodellsproblem.
- **Normal användning håller projektet vaket.** Varje appstart med nät gör en synkhämtning.
  Supabase anger att "några få användarförfrågningar per dag" räcker.
- **Semester och skador är det som utlöser det.** Åtgärd: ingen. Ett klick på "Resume project"
  när man är tillbaka, och osynkade pass går upp automatiskt. Vi bygger ingen keep-alive-cron
  för det här — det vore att lägga till rörliga delar för att lösa ett engångsklick.

Det som *ska* finnas är att appen **visar tydligt** när synken inte gått fram, i stället för
att låtsas vara i synk. Det är samma princip som i §2.5: fel ska synas.

### 7.5 LLM-anrop

Se §4.5. Både Groq och Gemini har gratisnivåer som med god marginal rymmer en enskild
användares fritextinmatningar — särskilt eftersom den lokala grammatiken (§4.3) fångar
merparten och LLM:en bara ser det den inte klarar. **Egna nycklar, egen organisation, skilda
från `news-signal-engine`.**

### 7.6 Vad som är uteslutet av kravet

Skrivs ut så att det inte behöver diskuteras igen:

- PowerSync, ElectricSQL och andra hostade synkmotorer.
- Supabase Pro (och därmed: garanterat ingen pausning, dagliga backuper, punkt-i-tid-återställning).
- Betald LLM-inferens.
- Push-notiser via en betald leverantör. Lokala notiser från servicearbetaren räcker (§2.6).

**Konsekvens att vara medveten om:** på gratisnivån finns inga automatiska dagliga backuper.
Datan finns dock i två kopior — IndexedDB på telefonen och Postgres i molnet — och
export-funktionen (§3.6, v1.1) är den tredje. Det är rimligt för ett personligt projekt, men
det är ett medvetet risktagande och inte en försummelse.

---

## 8. Designspråket — en egen fas, inte en efterhandsputs

Fram till och med fas 9 byggs UI:t medvetet råt: rätt struktur, rätt tryckytor, rätt
informationshierarki — men ingen polering. Det är ett val, inte en försummelse. Att finputsa
en vy som fortfarande kan komma att byggas om är bortkastat arbete.

Men det får inte stanna där. SPEC pekar ut ett tydligt designspråk: vetenskapligt datafokus
från RP Hypertrophy, minimalistisk mörk estetik från Jeff Nippard och Boostcamp, siffrorna i
centrum, inget fluff. Skillnaden mellan en app som gör rätt saker och en man vill öppna sitt
femtionde pass ligger nästan helt i detaljer som är osynliga var för sig.

**Det här är därför en egen fas — fas 11 i `TASKS.md` — och inte något som smygs in
undan för undan.** Görs det styckvis blir resultatet ojämnt, och ojämnt är värre än rått.

### 8.1 När den ska göras

**Efter fas 9**, när alla ytor finns. Att polera innan historikvyn och timern existerar
betyder att man designar hälften av appen två gånger — och att designspråket sätts av den
första vyn som råkade bli byggd i stället för av helheten.

Undantaget är sådant som är billigare att göra rätt direkt än att rätta senare: tryckytor,
`inputMode`, safe-area och tabellsiffror. Det ligger redan inne.

### 8.2 Vad fasen faktiskt ska omfatta

Formulerat som krav, inte som smak, så att det går att avgöra när det är klart:

- **Typografisk skala.** I dag används Tailwinds förval rakt av. En app där siffrorna är
  huvudpersonen behöver en egen skala där setraden är största elementet på skärmen och
  allt annat underordnar sig den.
- **Tabellsiffror överallt.** `tabular-nums` finns på setraden men inte i historiken eller
  timern. Siffror som hoppar i sidled när de ändras känns billigt och gör dem svårlästa.
- **Vertikal rytm.** Avstånden är i dag valda per komponent. De ska följa en gemensam skala.
- **Tryckåterkoppling.** Ingen knapp har i dag ett `:active`-tillstånd. Under hård
  ansträngning, med svettiga fingrar, är omedelbar visuell kvittens på ett tryck skillnaden
  mellan att lita på appen och att trycka igen.
- **Rörelse med måtta.** Setraden dyker upp abrupt. En kort inanimation gör att ögat hittar
  den nya raden utan att leta. Allt över ~150 ms känns långsamt mitt i ett pass.
- **Tomma tillstånd.** "Inga set ännu" är i dag en grå rad. Första passet är det enda
  tillfället att förklara fritextsyntaxen, och det tillfället används inte.
- **Färgsemantik.** Grönt används för sparat, gult för tvetydigt. Det behöver bli ett system
  med definierade betydelser, inte enstaka val — och kontrasterna ska klara WCAG AA mot den
  mörka bakgrunden.
- **Personbästa ska synas.** Ett set som slår ett PB ska markeras i samma ögonblick det
  loggas. Det är den enskilt starkaste återkopplingen en träningsapp kan ge, och den kostar
  nästan ingenting när e1RM-funktionen från fas 9 redan finns.
- **Densitet.** Ett pass med 25 set ska gå att överblicka utan att skrolla sönder tummen.
  Nuvarande radhöjd är vald för att vara lätt att träffa, inte för att rymma ett helt pass.

### 8.3 Vad fasen INTE ska omfatta

Skrivs ut, eftersom designfaser är notoriskt lätta att låta svälla:

- Inga nya funktioner. Ändras beteendet är det en annan uppgift.
- Inget designsystem-bibliotek. Appen har ett tiotal komponenter; ett ramverk för det vore
  mer kod att underhålla än det ersätter.
- Ingen ljus variant. Mörkt tema är enda temat (§2.2).
- Ingen animationsmotor. CSS-transitioner räcker.
