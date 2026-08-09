# Överlämning (Senaste status)

**Datum:** 2026-08-09 (sessionen avslutad)

---

## 🆕 2026-08-09, kväll — 13.1 klar, och tre granskningsrundor på samma diff

**13.1 är byggd, granskad, mergad, pushad och verifierad i skarpt läge.** `main` står på
`89df08d`. Migration `0004_import_flag.sql` är körd av Adam och kontrollerad utifrån.

### Vad som finns nu

`workouts.is_imported` (boolean, not null, default false) och `'import'` som fjärde värde på
`logged_sets.source`. Hela vägen: Dexie-typen, upp via `toWire`, ned via `wire`, skrivbar av
`apply_mutations`. `SET_SOURCES` i `src/db/types.ts` är enda källan för värdemängden på
klienten och speglar check-villkoret på servern — **de två måste ändras i samma commit.**

**Verifierat i databasen, inte antaget.** Adam körde verifieringsfrågan (den står i
`TASKS.md` 13.1) i SQL-editorn efter migrationen:

| Kontroll | Svar |
| :---- | :---- |
| `workouts.is_imported` | `boolean, nullable=NO, default=false` |
| Check-villkor på `source` | **exakt en rad**, innehåller `'import'::text` |
| `apply_mutations` skriver fältet | ✅ ja |

Att det blev **en** rad och inte två är den avgörande observationen: drop-mönstret träffade
0001:s gamla villkor, och inget förbjudande villkor lever kvar bredvid det nya.

### Tre commits, för att granskningen hittade riktiga fel två gånger

`5a6c25c` funktionen · `62fc67e` efter granskning ett · `89df08d` efter granskning två.

**Granskning ett** (körd inline, inte som två subagenter) missade det som granskning två —
samma skill körd som föreskrivet, med två kalla parallella agenter — hittade direkt:

1. **Självkontrollen i migrationen kunde bli grön av sin egen kommentar.**
   `pg_get_functiondef` bevarar kommentarer, och kroppen innehöll raden
   `-- NYTT I 0004: is_imported`. Sökningen efter `is_imported` hade passerat även om båda de
   riktiga raderna tagits bort. Kontrollen strippar nu radkommentarer och kräver två exakta
   kodfragment, ett per skrivväg.
2. **Självkontrollen kan ändå inte bevisa serverläge**, och kommentaren säger nu det. Allt
   den inspekterar skapas av satserna ovanför i samma transaktion. Den är ett skydd mot att
   *filen* skrivs fel. Beviset hämtas utifrån, efteråt — därav verifieringsfrågan.
3. **PLAN.md §3.1 hade inte uppdaterats** när schemat gjorde det. Regel 1, brutet av mig.

**Lärdomen, som gäller bredare:** en självkontroll som lever i samma transaktion som
ändringen den kontrollerar bevisar att filen är rätt skriven, inte att databasen är rätt
ställd. Vill man ha det senare måste man fråga utifrån, i en egen session.

### Ett fel jag gjorde och rättade inom samma commit

Vid avsmalningen av drop-mönstret skrev jag först `source\s+in\s*\(`. **Postgres lagrar inte
`in`-listan ordagrant** utan skriver om den till `CHECK ((source = ANY (ARRAY[...])))`.
Mönstret hade matchat noll villkor, släppt inget, och lagt det nya villkoret bredvid det
gamla — exakt den bugg blocket finns för att undvika. Mönstret täcker nu båda skrivsätten,
och självkontrollen frågar medvetet brett som ryggtäckning.

### Mätt vid överlämningen (§9-regeln)

| Mått | Värde |
| :---- | :---- |
| Tester | **255 gröna**, 21 filer |
| Bundle | **635,55 kB**, gzip **190,93 kB** |
| Precache | 9 poster, 648,36 KiB |
| Rader i `src/` (exkl. tester) | 6 819 |
| `main` | `89df08d`, pushad till `origin` |

### Kvar i fas 13

13.2 (dela `Chins`/`Pullups`, ta bort aliaset `räck`) är nästa, och är inte längre blockerad.
**A.1 (egress) är fortfarande outredd** — Adam kollar Usage-vyn per projekt själv, hypotesen
är att `news-signal-engine` i samma organisation drar trafiken.

---

## 🆕 2026-08-09 — Adams konto skapat, och en bugg som hittades på kuppen

**Fas 13 påbörjades i fel ände med flit:** 13.6 steg 1 (Adam registrerar sig) är oberoende av
kodändringarna och kunde göras direkt. Det avslöjade en bugg som blockerade hela importen, och
sessionen handlade om den. **13.0 är byggd, verifierad och mergad till `main`** (fem commits,
`e968cfd`–`e2f54c9`, fast-forward).

### 🚩 Buggen: lokal data tillhörde inget konto

Adam loggade in på sitt nya konto och såg **testkontots 10 pass och 21 set** ligga kvar som om
de var hans. Han ifrågasatte det mot mitt påstående att RLS skulle isolera datan.

**Han hade rätt, jag hade fel.** RLS isolerar servern korrekt — hans `user_id` hade 0 rader.
Men den lokala Dexie-basen hade **inget ägarbegrepp alls**, och den tittade jag aldrig på
innan jag uttalade mig.

**Varför det var allvarligt och inte bara skräpigt:** hämtade rader hamnar aldrig i utkorgen,
så ingenting hade läckt av sig självt. Men rör användaren en enda främmande rad skapas en
utkorgspost, och den skickas upp under den **nya** ägarens JWT. `apply_mutations` tar ägaren
ur token och hade skrivit den utan att knota — tyst, utan felkod.

**Åtgärden** är `meta['userId']` + `reconcileOwner()` i `src/sync/ownership.ts`, anropad från
`syncNow()` **före `pushOutbox`**. Den ordningen är hela säkerhetsegenskapen. Regeln står i
`PLAN.md` §2.4; den svåra biten är att tomt `userId` betyder två oförenliga saker, och att
hämtningsmarkören skiljer dem åt.

### Verifierat i skarpt läge, inte bara i vitest

Adam körde kedjan för hand mot riktig Supabase på `localhost:5173` med DevTools öppet:

| Steg | Observerat |
| :---- | :---- |
| Inloggad som `test1` | 10 pass, `lastPulledAt:workouts` = `2026-08-06T16:05:04` |
| Utloggad | Datan låg kvar — **som designat**, utloggning rör aldrig lokal data |
| Inloggad som Adam | Historik tom, `userId` omslaget, **markörerna för `workouts` och `logged_sets` borta** |
| `bänk 80x5` | Matchade Bänkpress — katalogen överlevde omseedningen i rensningstransaktionen |
| Serverkontroll (SQL) | Adams konto: exakt 1 rad, hans egen. test1: 10 pass / 25 set, **ingen `updated_at` från den dagen** |

Att markörerna försvann är den avgörande observationen: `resetPullCursors` anropas bara
inifrån `wipeForeignData`.

### Fel jag gjorde i den här sessionen

1. **"Ditt nya konto startar tomt — RLS isolerar."** Sagt om servern, men Adam frågade om
   appen. Jag hade inte läst den lokala lagringen innan jag svarade.
2. **Signatur 4 i testplanen var felformulerad.** Jag skrev att `lastPulledAt:exercises` skulle
   vara nyhämtad efter rensningen. Markören sätts till högsta `updated_at` bland **raderna**,
   inte till hämtningens klockslag — och den globala katalogen har inte ändrats sedan den
   seedades. Rensad eller ej ger därför **samma värde**, så signaturen bevisade ingenting.
   Adam upptäckte avvikelsen och begärde förklaringen. Rättelsen ligger i `TASKS.md` 13.0.
   **Lärdomen:** en markör som speglar *datans* ålder duger inte som kvitto på att en
   *händelse* inträffat.
3. **Skrev över `.claude/launch.json`** (bytte `gym-dev` → `gym-app`) helt i onödan. Återställd.

### 🔥 Ny akut uppgift: A.1 — egress-gränsen är passerad

Adam rapporterade **5,02 av 5 GB** på Free-planen, med dygn över 500 MB, mot en databas på
45 MB och fyra användare. **Ingen undersökning gjord — det var hans uttryckliga instruktion**,
och uppgiften säger att trafiken ska hänföras innan något ändras.

**Rangordnat i `TASKS.md` A.1:** organisationen `qfqgeranbxnftnnlkcfo` innehåller **två**
projekt (`Gym-App` och `news-signal-engine`) och Free-planens kvoter räknas **per
organisation**. Det ska uteslutas först — det är ett klick i Usage-vyn. Hypotesen om trasiga
hämtningsmarkörer prövas också, men aritmetiken talar emot den: appens faktiska data är
kilobyte, och 500 MB/dygn kräver storleksordningar fler anrop än fyra användare genererar.

### Mätt vid överlämningen (§9-regeln)

| Mått | Värde |
| :---- | :---- |
| Tester | **246 gröna**, 19 filer |
| Bundle | **635,47 kB**, gzip **190,88 kB** |
| Precache | 9 poster, 648,28 KiB |
| Rader i `src/` (exkl. tester) | 6 792 |
| `main` | `e2f54c9`, pushad till `origin` |

### Vad som INTE är gjort

- ~~**13.1–13.5 är orörda.**~~ **13.1 är klar 2026-08-09 (kvällen)** — se sessionen högst upp.
  `workouts.is_imported` finns nu i databasen, verifierad utifrån. **13.2–13.5 är orörda**
  och inte längre blockerade.
- **SQL-filen `scripts/import-adam.sql` är inte genererad.** Kräver 13.2.
- **A.1 är inte undersökt** — medvetet, se ovan.
- **Playwright-webbläsarna är inte installerade** på maskinen. Eget steg, Adams beslut.
- **`package-lock.json` ligger ändrad i arbetskopian.** Den fanns när sessionen började, är
  inte min, och lämnades orörd.

### Öppen fråga jag besvarade fel en gång — så här ligger den nu

E2E kan bevisa rensningsvägen **utan credentials** genom att seeda IndexedDB via
`page.evaluate()` och anropa `reconcileOwner` i riktig webbläsare — värdefullt just för att
enhetstesterna kör mot `fake-indexeddb`. Vad e2e **inte** kan utan en hemlighet är hela kedjan
*inloggning → session → synk → RLS*. Beslutet blev: e2e tar invarianten, autentiseringen
förblir manuell. Ett testkontos lösenord i CI vore en ny secret att förvalta för att slippa
ett tvåminuterssteg.

---

## 🆕 2026-08-07 — grillningssession om import av gamla anteckningar

**Ingen kod skrevs.** Sessionen var en grillning i fyra rundor, och resultatet är beslut i
`SPEC.md` §3c–3d, `PLAN.md` §3.5b och `TASKS.md` Fas 13 + 12.8–12.13. Underlaget var
`raw-notes.txt` (136 rader) och Adams förhandssvar i `docs/anteckningsformat.md`.

### Vad som avgjordes

**Importerade lyft bor i `logged_sets`, inte i en egen tabell.** Adam lutade först åt en egen
`historical_lifts`-tabell. Räkningen vände honom: den hade krävt migration, Dexie-tabell,
tre synkfiler — och att **tre av fem läsfunktioner i `history.ts`** slår ihop två källor för
all framtid. Vald lösning är `workouts.is_imported` + `source = 'import'` och **två filter**.
Priset är utskrivet i PLAN §3.5b: syntetiska pass som aldrig ägt rum.

**Årtalen gick att härleda, trots att Adam svarat "vet inte".** V-numren saknar år, men
`70 kg × 5` är omöjligt när 1RM är 70 kg (2021 v9) och rimligt när det är 85–90 (2022–24).
Veckorna löper 43 → 52 → 3 → 12, alltså över ett årsskifte. Slutsats: **v43 2023 – v20 2024**,
bekräftad av Adam. Detta är en **härledning, inte en verifierad uppgift** — den bygger på att
repprogressionen är monoton, vilket är sannolikt men inte bevisat.

### Fakta som verifierades i koden under sessionen

| Påstående | Var det står |
| :---- | :---- |
| Uppvärmningsset filtreras **redan** ur personbästa och graf | `history.ts:111`, `history.ts:131` |
| `getLastPerformance` är definierad **en** gång, har **tre** anropare | `repo.ts:317` |
| Synken hämtar från en hårdkodad lista: `workouts`, `logged_sets`, `exercises` | `pull.ts:38` |
| Egna övningar fungerar redan — `createExercise` är inkopplad | `TodayPage.tsx:253` |
| `matchExercise` returnerar `null` vid lika poäng, gissar aldrig | `matchExercise.ts:52` |
| `exercises` saknar `description`-kolumn | `0001_initial_schema.sql:96` |
| Aliaset `räck` sitter på `Chins` — Adam kände inte igen ordet | `catalog.ts:74` |
| Ingen tabell, uppgift eller UI för kroppsvikt finns, trots `SPEC.md` §3b | — |

### Två fel jag gjorde och rättade

1. **Greppet bakvänt.** Jag påstod först att "knogarna pekar bakåt" var underhandsgrepp
   (chins). Det är överhandsgrepp — pull ups. Adams anteckning var rätt hela tiden.
2. **`70 kg * 8` skulle räknas som rekord.** Jag rekommenderade att importera det. Adam var
   tydligare i runda 3: han underkände setet själv och är starkare i dag. Raden utelämnas.

### Vad som INTE är gjort

- **Adams konto finns inte i Supabase.** Bara två testkonton. Han måste registrera sig själv
  innan någon rad kan skrivas — `logged_sets.user_id` refererar `auth.users(id)`.
- **SQL-filen är inte genererad.** Väntar på kontot och på godkännande av dokumenten.
- **Ingen av uppgifterna i Fas 13 är påbörjad.** Inga tester körda, inget byggt.
- **Kroppsvikten är inte designad.** Egen grillningssession, uppgift 12.8.

---

## 🆕 2026-08-04 — designrundan påbörjad, och appen sågs för första gången

### Steg 4.1 klart: CI, tokens, en källa för navigationen

**CI saknades helt.** Vercel bygger med `tsc --noEmit && vite build`, så typfel har alltid
stoppat en deploy — men **tester och lint kördes ingenstans**. 238 gröna tester som ingenting
tvingar fram är inte ett skyddsnät utan en vana. `.github/workflows/ci.yml` kör nu lint,
typecheck, enhetstester och E2E vid varje push och PR.

**Tokens ur `DESIGN.md` §1–2** i `index.css`. Kostade **0,1 kB gzip** — beviset för att
"kopiera värden, inte kod" var rätt. `tabular-nums` ligger nu på `body`, så 11B.2 är omöjlig
att bryta i stället för något man ska minnas.

**Navigationen har en källa** (`src/ui/nav.ts`). Flikar och rutter stod på två ställen; nu
genereras båda ur en array. Att lägga till Övningar och Mer blir en rad var.

### 🚩 Appen granskades visuellt för första gången — och det ändrade allt

Adam påpekade att jag designat mot en textbrief utan att titta på appen. Han hade rätt. Den
inbyggda webbläsarpanelen kan inte fotograferas när panelen är dold, så
**`npm run shots`** byggdes: Playwright startar vite, klickar sig fram till ett verkligt
tillstånd och sparar sju PNG i WebKit. Fungerar headless, alltid.

**Fem minuters tittande gav tre fel som briefen missade helt:**

| Fel | Detalj |
|---|---|
| **Justeringsarket var 793 px på en 667 px skärm** | Headern med det sammansatta värdet låg **113 px utanför skärmen**. Man ändrade vikt med fyra hjul som visade `0 0 0 0` utan att se resultatet |
| **`0` renderades som ett värde** | `plan.ts` skapar tomma rader med vikt 0 och menar *"måste fyllas i"*. Raden påstod `0 kg` |
| **Bekräfta-knappen var 40×36 px** | Via `min-h-0`, under projektets egen 48-regel — på appens mest tryckta kontroll |

**Adams omdöme att rullhjulen "inte blev fantastiska" var alltså rätt av fel skäl.** Felet
satt inte i hjulen: siffran fanns, den låg utanför skärmen. Rotorsak: fem synliga rader per
hjul, valt utan att någon mätte mot den minsta skärmen. Nu tre.

### Steg 4.2 del 1 klart

Setvärden 16 → 24 px. Bekräfta-knappen 48×48. `FÖRRA` visar ingenting i stället för ett
streck. Uppvärmning märks neutralt (kategori, inte varning). Justeringsarket visar värdet i
32 px överst. Egen växlare i stället för systemets vita kryssruta.

**Ny vakt `e2e/bottenark.spec.ts` — och den fick skrivas två gånger.** Första versionen mätte
att arket inte hamnar utanför skärmen, men `max-h` gör det omöjligt även när innehållet är
för stort. Den var grön också med det gamla hjulet: **den mätte skyddsnätet, inte problemet.**
Andra versionen mäter att innehållet ryms *utan scroll* och fällde både det gamla hjulet och
min egen första fix. Arket fick trimmas i tre omgångar.

### iPhone 15 tillagd i testmatrisen

Adam frågade om layouten anpassas för enbart en telefon. **Nej — den är responsiv**
(`max-w-lg` centrerat). SE testas för att den är *smalast*. Men hans faktiska telefon saknades
och är nu med: **375 (SE) · 390 (13) · 393 (15)**, 30 E2E gröna.

### Rättelse i briefen: tomma tillstånd är flöde, inte polering

`DESIGN.md` sa att tomma tillstånd "skissas när skärmarna byggs". **De tre fel som hittades
var alla tomma tillstånd.** Rättat — de ska undersökas före, inte skissas efter.

### Kvar av steg 4.2

Sammanfattningsraden `Set · Volym · Övningar`, vilotimern som chip i flödet, PB-chip, och
**startskärmen** som fortfarande är en rubrik och en knapp på 550 px svart.

---

**Aktuellt läge:**
Fas 0–11A är klara. **Appen är deployad och används.** Kvar: fas 11B (designrundan),
uppgift 10.5 (städa dubbla Vercel-projekt) samt några småuppgifter.

> **Denna fil skrevs om 2026-08-03 efter en genomgång av dokumentation mot verklighet.**
> Se §0. Föregående version var daterad 2026-07-31, påstod att fas 10 var ogjord, och
> upprepade samma stycke tre gånger i rad.

---

## 0. Genomgången 2026-08-03 — vad som var fel

Adam bad om en kontroll av att repot och dokumentationen stämmer med verkligheten. Den
gjordes, och den hittade saker. **Alla punkter nedan är mätta, inte resonerade.**

### 0.1 Fas 10 var gjord men bokförd som ogjord

`TASKS.md` hade hela fas 10 obockad. Verkligheten: **30 deployments** på GitHub, senaste
från dagens commit. 10.1 och 10.2 var klara sedan tidigare.

**Hur 10.2 kunde verifieras utan tillgång till Vercels panel:** produktionsappen visar
synkstatus **"Inte inloggad"**. En lokal körning utan `.env` visar i stället **"Endast
lokalt"** och loggar *"Supabase är inte konfigurerat"*. Miljövariablerna finns alltså i
hostingen. (Det finns ingen `.env` lokalt — därför kör dev-servern helt utan Supabase.)

**Varför det spelade roll:** en plan som påstår att gjort arbete är ogjort får nästa
session att bygga om något som redan fungerar.

### 0.2 🚩 Två Vercel-projekt mot samma repo — ett serverar fel sida

| Projekt | Adress | Innehåll |
|---|---|---|
| `adam-gym-app` | **https://adam-gym-app.vercel.app** | ✅ Appen |
| `gym-app` | `gym-app-gold-psi-81.vercel.app` | ❌ `test/feedback-test.html` — larmtestet från fas 0 |

Fel adress stod som repots `homepageUrl` på GitHub. **Rättad 2026-08-03.**

**Varför det inte är kosmetiskt:** installeras PWA:n från fel adress hamnar larmtestet på
hemskärmen och det ser ut som att appen är trasig. Två produktionsadresser ger dessutom
**två servicearbetare och två separata IndexedDB-lagringar** — ett pass loggat i fel flik
hamnar i en databas man sedan inte hittar. Samma sorts tysta fel som 11A.10.

Åtgärd ligger som **uppgift 10.5** och kräver Adam, eftersom Vercels panel inte går att nå
härifrån.

### 0.3 Advisorns `rls_auto_enable` — nu mätt, inte antagen

Tidigare överlämningar avfärdade varningen som "medveten". Det räckte inte som underlag, så
den testades:

```
BLOCKERAT AV POSTGRES: trigger functions can only be called as triggers
```

Funktionen returnerar `event_trigger` och **går inte att anropa via RPC**, oavsett vilka
EXECUTE-rättigheter `anon` har. Resonemanget i migration `0002` var alltså korrekt hela
tiden — men det var ett resonemang, och nu är det en mätning. Varningen är en falsk positiv.

### 0.4 Migration 0003 ÄR körd i produktion

Föregående överlämning varnade i fetstil att den måste köras. Verifierat på två sätt:
`apply_mutations` innehåller `ai_parse_log`-grenen, och tabellen har **2 rader** — data har
alltså tagit sig hela vägen genom synkvägen. Varningen är inte längre aktuell och är borttagen.

`list_migrations` returnerar tom lista: migrationerna kördes manuellt i SQL-editorn, inte
via CLI:n. Det är inget fel, men det betyder att **migrationsfilerna i repot inte automatiskt
speglar databasen** — de måste jämföras för hand.

### 0.5 Siffror som var inaktuella

| Påstående | Verkligt värde |
|---|---|
| "234 tester" | **237** (18 filer), plus 12 Playwright |
| "614 kB precache" | **642,67 KiB precache**, bundle 631,54 kB rå / **189,86 kB gzip** |
| "5 high i npm audit" | **0 sårbarheter** |

---

## 1. Databasen — verifierad 2026-08-03

| Tabell | Rader | RLS |
|---|---|---|
| `profiles` | 2 | ✅ |
| `exercises` | 45 | ✅ |
| `workouts` | 6 | ✅ |
| `logged_sets` | 12 | ✅ |
| `sync_mutations` | 28 | ✅ |
| `ai_parse_log` | 2 | ✅ |

`apply_mutations` är SECURITY INVOKER och `anon` saknar EXECUTE — bara `authenticated` kan
köra den. Det är migration `0002` som håller.

---

## 2. Vilotimern — frågan är AVGJORD

Full analys i `PLAN.md` §2.6.1. Slutsatsen: **notisen når inte fram i bakgrunden** — men
inte av det skäl någon av oss antog.

Mätdata: två larm på 180 s, appen stängd. `wasHidden: ja`, `firedOnResume: nej`, fel +11 s
och +20 s. Adam fick ingen notis förrän han öppnade appen, båda gångerna.

**Vad det betyder:** `wasHidden: ja` med bara 11–20 sekunders fel bevisar att sidans
JavaScript **körde i bakgrunden** — iOS strypte intervallet men frös det inte, och
`showNotification()` anropades och lyckades. Ändå syntes ingen notis. Alltså: iOS **skapade**
notisen men **presenterade** den inte förrän appen kom i förgrunden.

**Mätningen mätte fel sak.** Diagnostiken loggade när vi *anropade* `showNotification()`,
inte när iOS *visade* den. `firedOnResume` svarade "nej" på en fråga den inte mätte. Det var
den mänskliga observationen som avgjorde.

**Lärdomen är värd att behålla:** när en mätning och en användares upplevelse säger emot
varandra är det inte självklart att mätningen har rätt. Kontrollera först att den mäter det
man tror. *(Samma lärdom gäller dokumentation — se §0.)*

**Följd:** Wake Lock bär vilan i dag.

> **NYTT 2026-08-03 — ntfy gör om förutsättningen.** Web Push avfärdades för att den kräver
> nät i det ögonblick larmet går. Adam har bekräftat att han **alltid har wifi eller mobilnät
> på gymmet**, vilket river den invändningen. ntfy stöder dessutom **fördröjd leverans
> server-side**: appen skickar begäran när setet loggas — då är den framme — och ntfy:s
> server levererar när vilan tar slut. Telefonens JavaScript behöver aldrig köra i bakgrunden.
> ntfy har en native iOS-app, så notisen presenteras som en riktig notis.
> **Adopterad, ej byggd.** Analys i `ai-workbench`.

---

## 3. Fas 8 — AI-reserven

Hela pipelinen är byggd och testad. Modellen får katalogen, senaste utförandet per övning,
typiskt viktspann, bästa e1RM och det pågående passets set. Payloaden är begränsad till de
12 senast tränade övningarna, med ett test som vaktar under 20 000 tecken.

**Valideringen behandlas som säkerhet, inte finputs.** Det farligaste felläget är ett
**påhittat övnings-id** som ser ut som ett UUID: utan kontrollen mot katalogen hade setet
skrivits mot en övning som inte finns, och främmandenyckeln hade fällt hela synkbatchen
långt senare med ett felmeddelande långt från orsaken. Förvalet är **låg konfidens**.

**AI:n träder in först när den lokala grammatiken sagt ifrån.** Aldrig i förväg, aldrig
medan man skriver, aldrig i bakgrunden.

**Att `ai_parse_log` har 2 rader tyder på att AI-vägen faktiskt körts skarpt.** Om Edge
Function-deployen och nycklarna är satta är inte verifierat härifrån — se §5.

---

## 4. Fas 11A — touch-först

Klar. Setraden är byggd som en tabell efter referensbilderna i `docs/Reference-pics/`:
`Set | Förra | Kg | Reps | ✓`, rubriker en gång. Rullhjul via `SetAdjustSheet` med ett hjul
per siffra. Breddbudget uträknad för iPhone SE: 317 px tillgängligt, 164 px fasta kolumner.

**Två buggar som kostade och som nu är mekaniskt bevakade:**
- **11A.8** setraden klipptes av på 375 px
- **11A.12** ombyggd efter referensbilderna

Playwright-vakten (`e2e/no-horizontal-overflow.spec.ts`) kör mot 375 och 390 px i WebKit.
**Vakten är bevisad:** ett injicerat 500 px-element fällde elementtestet på alla tre rutter
medan dokumenttestet förblev grönt — `overflow-x-hidden` i skalet döljer symptomet. Utan
den andra mätningen hade vakten varit grön genom precis de buggar den finns för.

---

## 5. Verifierat 2026-08-03

- **238 vitest-tester** i 18 filer, gröna. **30 Playwright-tester** på tre skärmbredder. Allt mätt med `npm run status -- --full`, 2026-08-04.
- Typecheck, lint och produktionsbygge gröna.
- `npm audit`: **0 sårbarheter**.
- Produktionsappen renderar (Pass, Historik, Inställningar) och når Supabase.
- Databasen: 6 tabeller, RLS på alla, radantal enligt §1.
- Migration 0003 aktiv i produktion.
- `rls_auto_enable` går inte att anropa via RPC.

## 6. INTE verifierat

- **Historikvyerna och 11A på riktig enhet.** Byggda, enhetstestade och Playwright-testade,
  men inte sedda i Safari på Adams telefon. Playwright är WebKit men inte iOS Safari —
  safe-area, 100vh, scroll-snap-tröghet och standalone-läget beter sig annorlunda.
- **Wake Lock på riktig hårdvara** genom en hel 180-sekundersvila.
- **AI-nycklarna — mätt 2026-08-03, och läget är accepterat.** `ai_parse_log` visar att bara
  **groq** någonsin kört (en gång, 2026-08-02). Gemini har aldrig svarat, alltså saknas den
  nyckeln och **reserven finns inte**. Groq-nyckeln delas med `news-signal-engine`, vilket
  betyder att kvoten kan tömmas åt båda hållen.

  **Uppskjutet med flit** — AI-vägen har körts en enda gång, så risken är i praktiken noll och
  skalar med användning, inte med tid. Villkor och detaljer i `TASKS.md` 8.1–8.2.
  **Föreslå inte fixen igen förrän villkoret är uppfyllt.**

  *(Edge Function-deployen är däremot verifierad: `ai-parse` är **version 2, ACTIVE**,
  uppdaterad 2026-08-03, med `verify_jwt: true` — Supabase avvisar oautentiserade anrop
  innan funktionen ens startar, utöver kontrollen i koden.)*
- **Om 10.3 är gjord** — om appen ligger på Adams hemskärm, och i så fall från vilken av de
  två adresserna. Detta är viktigt: se §0.2.

## 7. Kända avvikelser

- **7.13 bundle.** 631,54 kB rå, **189,86 kB gzip**, 642,67 KiB precache. Supabase-js är
  merparten och behövs bara för synk, aldrig i loggningsvägen. *Notera att tidigare
  överlämningar angav siffran okomprimerad, vilket överdriver problemet — 190 kB över nätet,
  en gång, för en offline-first app är inte akut.*
- **`auth_leaked_password_protection` går INTE att slå på.** Kontrollerat i panelen
  2026-08-03: funktionen är märkt *"Only available on Pro plan and above"*. Tidigare
  överlämning påstod att den "kostar ingenting" — det var fel. Vi kör free tier, och regel 2
  säger gratis före betalt.

  **Advisorns varning kommer alltså stå kvar, och det är ett beslut — inte en försummelse.**
  Kompenserat med gratis åtgärder i stället:
  - `Allow new users to sign up` **avstängd**. Appen har en användare och kontot finns redan.
    Ingen dörr att gissa lösenord mot slår varje lösenordspolicy.
  - `Allow anonymous sign-ins` avstängd.
  - Minsta lösenordslängd höjd 6 → 12. **Teckenklasskrav lämnas medvetet av** — de ger i
    praktiken `Passord1!`, ett mönster angripare räknar med. NIST tog bort dem av det skälet.
    Längd slår sammansättning.
  - `Secure email change`, `Secure password change` och `Require current password` påslagna.
    Den första är den viktigaste: utan den kan en kapad session byta e-post till angriparens
    och ta över kontot permanent.
  - Email-OTP:ns livslängd sänkt 3600 → 900 s.
- **Migrationsfilerna speglas inte automatiskt av databasen** — se §0.4.

---

## 7b. Designrundan är förberedd — steg 1 och 2 klara

**Fas 11B kördes inte igång i dag. Den förbereddes**, och två av fyra steg är avklarade.

### Steg 1 klart: informationsarkitekturen är LÅST

`SPEC.md` §2b, godkänd av Adam. **Fyra flikar:** Pass, Historik (med Statistik som segment),
Övningar, Mer. Program (Push/Pull/Ben) blev startval i Pass, inte en flik. Kroppsvikt tillagd
i `SPEC.md` §3b med gränsen utskriven: kroppsdata ja, kost och makros nej.

**Adam preciserade också §1, och det ändrade rådgivningen.** Måttstocken är *"lika bra som de
bästa apparna"*, inte *"snabbast till varje pris"*. Följden: saknas något Strong och Hevy har
är det ett **hål**, inte en lyx. Det är därför Övningar blev en egen flik trots att den inte
fanns i den ursprungliga formen.

### Steg 2 klart: open source-sökningen, och den hittade en licensfälla

**Liftosaur och wger — de två närmaste förebilderna — är båda AGPL-3.0.** Kopieras kod
därifrån måste hela appen släppas under AGPL, för all framtid. Gränsen som gäller står i
`CLAUDE.md` §7.2b: layout och interaktionsmönster är inte upphovsrättsskyddade, **kodrader
är det.** Läsa ja, kopiera aldrig.

**Beslut, alla godkända:**
1. **Tokens: `radix-ui/colors`** (MIT). Valt för att 11B.7 kräver WCAG AA mot mörk botten och
   Radix skalor har garanterade kontraststeg. Open Props valdes bort — Tailwind 4 ger redan
   spacing och typografi.
2. **Layout: läs `workout-cool` (MIT) och `liftosaur` (AGPL), kopiera inget.**
3. **`free-exercise-db` uppskjuten.** 873 övningar, Unlicense, 978 kB. Skälet är INTE
   storleken utan att katalogens id:n är checksummade mot Supabase — en utökning är en
   datamigration, inte ett designbeslut. Villkor: när Adam saknar en övning han vill logga.

**Nytt krav som föll ut:** `docs/EXTERNT.md` — härkomstregistret. Allt vi hämtar utifrån ska
stå där med licens och status (kopierat / läst / övervägt), i samma commit. Registret öppnar
med en tom Kopierat-tabell, vilket är korrekt: hittills är noll rader kod kopierade.

### Kvar av steg 3 — nästa sessions arbete

`docs/DESIGN.md` delas i tre granskningsbara bitar:

- **3a Färgsystemet.** Radix-skalor → semantiska tokens, **med uppmätta kontrastvärden** så
  att WCAG AA är bevisat och inte påstått. Fristående, kräver inget från Adam. **Börja här.**
- **3b Typografi och rytm.** Setraden störst, `tabular-nums` överallt, vertikal rytm.
- **3c Skärmskisser.** En per skärm. **Kräver referensmaterial** — se öppen fråga i §8.

### Steg 4: implementation, en skärm i taget

Varje skärm blir en egen branch och PR med Playwright-skärmdumpar innan merge. Adams uttryckliga
önskemål: hellre en sak i taget än allt på en gång. Flödet i ord finns i
`ai-workbench/workflows/pr-review-loop.md` — Adam skriver vad han vill ha, inte kommandon.

**Åtagande från 11B:** navigationen ska genereras ur **en array**, inte hårdkodas på två
ställen som i dag (`AppShell.tsx` + `App.tsx`). Att lägga till eller ta bort en flik ska vara
en rad. Adams begäran, och billigt nu men dyrt senare.

---

## 8. Nästa steg

### ❓ ÖPPEN FRÅGA — svara innan 3c kan börja

**Hur ska referensmaterialet till skärmskisserna samlas in?** Rekommendationen var *båda, i
den ordningen*: Claude browsar `liftosaur.com` och workout-cools demo och tar fram ett
underlag, Adam kompletterar med egna skärmdumpar i `docs/Reference-pics/` på det han vill ha
annorlunda. Då finns något konkret att reagera på i stället för att beställa i blindo.

**Skälet att inte hoppa över Adams bilder:** `11A.12` byggdes från hans referensbilder efter
att två av mina egna försök klippts av på mobilskärm. Referensversionen håller. Det var inte
en tillfällighet.

### Nästa session — börja här

**Detta stycke skrevs 2026-08-07 och gäller designrundan (11B).** Sessionen 2026-08-09 lade
två saker framför den — se den sessionen högst upp:

1. **A.1 — egress.** Free-planens tak är passerat. Usage-vyn per projekt först, ingen kod.
2. ~~**13.1 — `workouts.is_imported`.**~~ **Klar 2026-08-09 (kvällen).** Nästa i fasen är
   **13.2** — dela `Chins`/`Pullups` och ta bort aliaset `räck`.

Därefter, om designrundan tas upp igen:

1. **3a — färgsystemet.** Fristående, kräver inget från Adam. Enda naturliga startpunkten.
2. Ställ referensfrågan ovan, så att 3c kan planeras parallellt.

**Adam, när det passar (inget brådskar):**
- Kontrollera att hemskärmsikonen öppnar Pass-vyn. Installerades appen från det raderade
  Vercel-projektet är genvägen död — lägg i så fall till den på nytt från
  `https://adam-gym-app.vercel.app`.
- ~~**Bestäm om testdatan ska följa med.**~~ **BESVARAD 2026-08-09.** Adam skapade sitt konto
  och lät testdatan vara. Två rättelser till hur frågan var ställd: siffran var fel — `test1`
  har **10 pass och 25 set** (21 icke-raderade), inte 6 och 12 — och påståendet att datan
  "inte följer med" gällde bara servern. **Lokalt följde den med**, vilket var buggen som
  13.0 löste. Se sessionen 2026-08-09 högst upp.

**Kvarvarande småuppgifter:** 6.9 (sparad vilotid per övning), 7.13 (lata-ladda supabase-js),
12.7 (personligt anpassat 1RM i stället för Epley), ntfy för vilotimern (adopterad, ej byggd),
8.1–8.2 (AI-nycklarna — **uppskjutna med flit, se §7**).

---

## 9. Regel som föll ut av genomgången

**Dokumentation ska verifieras, inte minnas.** Felen i §0 uppstod inte för att någon
glömde — de uppstod för att påståendena skrevs från *avsikt* och aldrig kontrollerades mot
*verklighet*. Nästa session ser bara den här filen, och tror på den.

Konkret följd: siffror i denna fil (tester, bundle, radantal, deployments) ska mätas om vid
varje överlämning, inte kopieras från föregående version.
