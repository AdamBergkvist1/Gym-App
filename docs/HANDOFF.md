# Överlämning (Senaste status)

**Datum:** 2026-08-12. Läs sektionen direkt nedan — den är nyast. Sektionerna därefter är från
2026-08-11 (tre sessioner samma dag) och har varningsrutor som säger vad i dem som inte längre
gäller.

---

## 🆕 2026-08-12 — Grillning inför 11B. Temat vänt till ljust, och 11B visade sig vara halvbyggt

### Börja här

**11B.0d är KLAR.** Designen är vald, mätt och inskriven. Nästa arbete i ordning:

1. **Hämta Fraunces som fil** enligt `CLAUDE.md` §7.3 och registrera i `docs/EXTERNT.md`.
   Mockuperna laddar den från Google Fonts, vilket duger för ett val men **inte för appen**:
   ett externt anrop vid varje sidladdning motsäger offline-first. Detta blockerar
   implementationen, eftersom rubrikerna är Fraunces.
2. **11B.0c ikonpaketet** — uppgiften krympte till omkring tio ikoner, se nedan.
3. **11B.0e testsömmarna**, innan skärmarna byggs.
4. Först därefter `/implement` mot `DESIGN.md` §3, i ordningen som står i
   "Implementationsordning för steg 4": tokens, Pass, Historik, Statistik, Övningar, Mer.

### Designen som gäller, i en tabell

| | |
| :--- | :--- |
| **Papper** | `#F0EBE1` |
| **Kort** | `#FFFFFF`, radie 18 px, skugga, indraget 16 px |
| **Accent** | `#2B4570` marinblå |
| **Rubriker** | Fraunces (OFL) |
| **Siffror** | systemets typsnitt, **inte** Fraunces |
| **Form** | B4 "Blad, indraget" — accentbricka 10 × 34 px, ingen ikonruta |

### Sex omgångar, fem mockupfiler, alla committade

`11b-riktningar` → `11b-riktning-d` → `11b-papper-och-accent` → `11b-slutlig-fargvanda`
→ `11b-form` → `11b-form-blandningar`. Alla ligger i `docs/mockups/` så att varje beslut går
att granska i efterhand. Det gick **inte** för lime-valet i augusti, vars mockuper är borta.

**Metoden som fungerade:** variera en axel i taget. När Adam gillade två olika former visade
det sig att de skiljde sig på **fyra oberoende axlar** (yta, bredd, rubrikens plats, markör).
Att blanda dem på känsla hade gett fyra ungefärliga mellanlägen där ingen efteråt kunde säga
vad som gillades. Varierade en i taget blev valet entydigt.

### Tre fynd som kom ur mätning, inte ur tycke

1. **Separationen 1,01:1.** Kombinationen Adam valde hade i praktiken ingen skillnad mellan
   kort och papper; korten syntes bara via skuggan. Det förklarade hans *"kanske är lite
   tråkigt"* bättre än accentfärgen gjorde. Papperet fördjupades till `#F0EBE1` och korten
   blev rent vita, vilket gav 1,19:1 — exakt samma värde som den varmare kombination han
   först drogs till. Djupare papper förkastades: vid `#ECE6DA` faller sekundärtexten till
   4,37:1 och klarar inte AA.
2. **Fraunces saknar tabulära siffror.** Mockupen testade det själv genom att jämföra bredden
   på "111" och "000". Därför sätter Fraunces **bara rubriker**. Det är ett krav ur 11B.2, inte
   en smakfråga, och det är hela skälet till uppdelningen mellan rubrik- och sifferfont.
3. **Riktning A föll på AA** i första omgången (sekundärtext 3,88:1 mot kravet 4,5) och
   mörkades till `#756C5F` innan den skickades. En riktning som faller på projektets eget krav
   ska inte ställas som ett val.

### Ikonrutan är struken, och det motsäger §0.5 med flit

`DESIGN.md` §0.5 kallade ikonrutan *"den enskilt viktigaste ändringen"*. Den raden var rätt när
den skrevs för **svart** bakgrund, där en färgad kvadrat per rad var det enda som räddade
skärmen från att vara svartvit. Ljust tema löser det annorlunda, och Adam pekade ut ikonrutan
som en del av det han kallade basic.

**Följden är att 11B.0c krympte betydligt:** ingen övningsspecifik ikonuppsättning behövs, och
det var den svåra delen. Kvar är omkring tio ikoner (fyra flikar, bock, plus, tillbakapil,
menypunkter). Formen på dem är redan prövad i mockuperna.

**Arbetsträdet var rent vid sessionens slut.** Grindarna kördes **på jobbdatorn** och alla fem
var gröna: **274 tester, 30 e2e (WebKit), typecheck, lint, bygge**. Inte antaget.

### Det största fyndet: 11B var inte ostartad

Grillningen inleddes mot `TASKS.md`, som beskrev 11B.0a och 11B.0b som ofattade beslut. **Båda
var i praktiken redan gjorda**, och det kostade en halv session att upptäcka:

- `SPEC.md` **§2b** — informationsarkitekturen, godkänd av Adam **2026-08-03**. Fyra flikar.
- `docs/DESIGN.md` — **702 rader**: färgsystem med uppmätta kontraster, typografi, rytm och
  skärmskisser för alla fyra flikarna. Skriven 4–5 augusti.
- `docs/Reference-pics/` — nio referensbilder.
- `docs/research/Analys av Träningsappar för PWA.md` — 60 kB, med källhänvisad forskning.
- **Två commits av implementationen**: `cfb2ca2` (tokens, datadriven navigation) och `6d70223`
  (setraden, justeringsarket).

**Lärdomen, och den är dyrare än den låter:** ett dokument som beskriver ett halvfärdigt arbete
som ostartat får nästa session att ställa fel frågor. `TASKS.md` 11B har nu en varningsruta
överst som säger hur det faktiskt ligger till.

### Beslut som ändrar tidigare beslut

**Ljust tema är förval. `SPEC.md` §4 ändrad.** Adam: *"jag vill inte bara ha mörk design…
tycker vi kan börja med att designa ljusare."* Detta **öppnar `DESIGN.md` §0.5 och §1 på nytt** —
alla färgvärden där är mätta mot ren svart. Lime `#bef264` överlever inte: 16,07:1 mot svart
blir ~1,3:1 mot vitt.

**Varför omvalet är rimligt och inte velighet:** lime valdes 2026-08-05 mellan tre **mörka**
alternativ. Det var bästa valet i ett urval som inte innehöll det Adam egentligen ville ha.

**Mätning som gjorde beslutet billigt:** `src/ui/` innehåller **noll hårdkodade hexvärden och
noll Tailwind-gråskalor**. Varje färg går redan genom ett semantiskt token, så temabytet är en
värdeuppsättning i `index.css` och kräver **inga komponentändringar**. Verifierat, inte gissat.

**Vad som INTE rivs:** `DESIGN.md` §2 (typografi och rytm är färgoberoende) och all befintlig
kod. Setraden löste ett uppmätt problem — avklippning på 375 px — som är oberoende av
bakgrundsfärg.

### Tre nya uppgifter

| | |
| :--- | :--- |
| **11B.0c** | Ikonpaket ersätter emoji. **Sex förekomster mätta**, värst 🏋 i `ExerciseCard.tsx:65`. Lucide, Tabler och Phosphor licenskontrollerade och alla tre klara |
| **11B.0d** | Välj ljus karaktärsriktning i **två steg**: tre karaktärer på identisk layout, sedan två layouter i den vunna karaktären |
| **11B.0e** | Testsömmar bestäms före skärmbygget. Lånat från `/to-spec`, hör ihop med 12.20 |

**11B.5 omskriven:** 150 ms-regeln kom från en ensam mening i `PLAN.md` om **setraden** och
generaliserades felaktigt till hela appen. Nu: snabbt i Pass, uttrycksfullare i Historik och
Övningar. ⚠️ Haptik saknar troligen stöd i iOS Safari — **ska verifieras, inte antas**.

### Om Lucides licens, som såg ut som ett stopp

GitHubs API rapporterar `NOASSERTION`, vilket enligt `CLAUDE.md` §7.2b betyder "behandla som
alla rättigheter förbehållna". **Licensfilen lästes i stället för att lita på detektorn:** den
innehåller två licenser, ISC för Lucides egna ikoner och MIT för Feather-ärvda. Båda fria.
Detektorn klarar bara inte två licenser i en fil. **Gör om den kontrollen så här nästa gång** —
`NOASSERTION` är ofta ett detektorfel, men det får aldrig antas utan att filen lästs.

### Miljön på jobbdatorn — och en sak som fortfarande inte fungerar

Node saknades helt. Installerat 2026-08-12 med `winget install OpenJS.NodeJS.LTS --scope user`,
**utan administratörsrättigheter**: Node **24.19.0**, npm **11.17.0**, från den officiella
zippen på nodejs.org med verifierad hash. Playwright **WebKit 26.5** nedladdad separat
(konfigurationen kör WebKit, inte Chromium, eftersom appen används i iOS Safari).

⚠️ **`preview_start` (Browser-panelen) fungerar inte förrän Claude Code startats om.** PATH är
permanent uppdaterad i användarmiljön, men den körande processen ärvde sin miljö innan
ändringen. Playwright fungerar däremot, eftersom den startar sin egen dev-server.
**Ingen maskinsökväg hårdkodades i `.claude/launch.json`** — den är spårad i git och skulle gå
sönder på hemmadatorn.

### Avslutat i samma session

**A.1 (egressen) är stängd.** Usage-vyn per projekt 2026-08-10: Gym-App **0,001 GB**,
`news-signal-engine` **5,39 GB**. Free-planen räknar per organisation, inte per projekt. Adam
har åtgärdat i NSE-repot; **kvoten resetas 17 augusti 2026**. Markörfrågan lever vidare som
**12.21**, inte som kostnadsmisstanke utan som en obevisad funktion.

**13.6 är KLAR i databasen, verifierat 2026-08-12.** Kontrollfrågan svarade exakt
`pass 19, antal_set 22`, kurvan `70 → 75 → 80 → 85 → 90 → 95`. 95 kg-raden stämmer i varje
fält: `reps 1`, `set_index 0`, `is_warmup false`, `source 'import'`, passet `is_imported`.

> ⚠️ **Den här överlämningen påstod först motsatsen.** Både kvällssektionen 2026-08-11 och den
> första versionen av den här sektionen sa att Adam inte kört om filen med 95 kg-tillägget.
> Databasen säger att den är körd. **Fråga databasen innan du påstår något om dess innehåll**,
> även när ett handoff-dokument säger annat. Det är samma sorts fel som fick 11B att se
> ostartad ut.

Notistexten kontrollerades genom att **köra den riktiga funktionen** mot de 12 datum som
faktiskt ligger i databasen, i ett tillfälligt test som raderades efteråt. Utfall:
*"12 punkter före januari 2026 är importerade från gamla anteckningar — datumen är uppskattade."*

**Kvar av 13.6, och bara detta:** Adam öppnar appen på telefonen och ser 95 kg plus notisraden.
Servern är bevisad; synken till hans specifika telefon går inte att verifiera utan hans inloggning.

**Fyndet på köpet:** notistexten innehåller ett **tankstreck**, vilket `DESIGN.md` §0.3
förbjuder i apptext. Upplagt som **12.22**.

### Två saker att göra annorlunda

1. **Läs `SPEC.md` och `DESIGN.md` innan du grillar om något de redan avgjort.** Jag ställde sex
   frågor varav två var besvarade sedan en vecka.
2. **`/to-spec` och `/implement` har `disable-model-invocation: true`** — precis som `/handoff`.
   Adam måste skriva dem själv. Alla 25 skills ligger i `C:\Users\w961abg\.claude\skills\`.

### Varför `/to-spec` inte används för 11B

Den publicerar specen som ett issue i `.scratch/`, som är **gitignorerad och slängbar**.
Besluten hör hemma i `SPEC.md`, `DESIGN.md` och `TASKS.md` enligt regel 1. En tredje kopia i den
enda mapp som inte överlever löser inte det problem specen finns för. **Sömskissen** är däremot
värd att låna, och den blev 11B.0e.

---

## 🆕 2026-08-11 (tredje sessionen) — Fas 13 klar utom bekräftelsen i appen

### Börja här

Två saker väntar, i den ordningen:

1. **Bekräfta 13.6 i appen.** Adam har kört `scripts/import-adam.sql` en gång (21 set), men
   **inte** den utökade versionen med bänk 95 kg. Be honom köra om filen och kontrollera i
   appen. Först då bockas 13.6 av. Detaljerna står under "Vad som återstår i 13.6".
2. **Grillning inför 11B.** Adams begäran: *"där behövs en stor grill me tror jag"*. Den ska
   köras **före** referensinsamlingen, inte efter, eftersom den avgör vad referenserna ska
   leta efter. 11B.0a (informationsarkitekturen) hör till samma grillning.

Arbetsträdet är rent. Grindarna: **274 tester, 30 e2e, typecheck, lint, bygge** — alla
körda och gröna i den här sessionen, inte antagna.

### Sex commits

| Commit | |
| :---- | :---- |
| `3ca313e` | **13.3** — importerade pass filtreras ur passlistan |
| `7e28633` | **13.4** — importerade set blir aldrig spökdata |
| `7b99ff0` | **13.5** — textraden om uppskattade datum, `lib/importNotice.ts` |
| `de5c14b` | **13.6 steg 2** — `scripts/import-adam.sql`, plus 12.20 och skärpt 11B.0b |
| `c15f4c2` | 12.20 — förbehållet om webbläsarkörning |
| `2e08456` | **13.6** — bänk 95 kg december 2025 tillagd |

Uppgiftsdetaljerna står i `docs/TASKS.md` under respektive nummer och upprepas inte här.

### Metoden som är värd att återanvända: torrkörning mot riktig databas

`scripts/import-adam.sql` provkördes mot **produktionsdatabasen** inuti
`begin … rollback` via Supabase-MCP:n, innan Adam sett filen. Det bevisade syntax,
främmandenycklar, check-villkor och självkontrollen — utan att en enda rad skrevs.
Kontrollfrågan efteråt visade att kontot fortfarande hade 1 pass och 1 set, alltså bara
hans egen användning.

Rollbacken verifierades separat först (`begin; create table _probe; rollback;` följt av en
fråga på att tabellen är borta) i stället för att antas. Gör om det i den ordningen om
MCP-uppsättningen ändras — att rollback fungerar är en förutsättning, inte en detalj.

### Vad som återstår i 13.6

Filen innehåller nu **19 pass och 22 set**. Adam har kört versionen med 18 pass och 21 set
och verifierat den med egen SQL-fråga: `pass 18, antal_set 21, bank_1rm 70 → 75 → 80 → 85 → 90`.

Det 22:a setet — **bänk 95 kg, december 2025** — kom muntligt vid genomläsningen och står
**inte** i `raw-notes.txt`. Två antaganden ligger i filens avsnitt 3b och är inte bekräftade
av Adam: att det var **ett rep**, och att det ska märkas `source = 'import'`. Han har sett
båda skrivas ut men inte uttryckligen sagt ja till dem — fråga om det är fel innan något
byggs vidare på kurvan.

Kvar: kör om filen (idempotent, de 21 första rörs inte), kontrollfrågan ska svara
`pass 19, antal_set 22, 70 → 75 → 80 → 85 → 90 → 95`, och i appen ska Bänkpress visa
tyngsta set **95 kg** och raden *"12 punkter före januari 2026 är importerade…"*.

### Verifierat i webbläsare, inte bara av grindarna

Alla tre filtren kördes mot dev-servern med seedad IndexedDB (sju importerade bänkset plus
ett riktigt), och seedraderna raderades efteråt — verifierat att noll `demo-*`-nycklar fanns
kvar. De gick aldrig via utkorgen, så ingenting synkades upp.

- Övningssidan visade importnotisen ovanför grafen.
- Historiken visade `2 pass` — de sju importerade syntes inte.
- `FÖRRA`-kolumnen för Bänkpress var tom trots ett importerat 90 × 1 i databasen.

**Detta är tredje sessionen i rad där en webbläsare fått startas för hand** för att bevisa
något ett test borde bevisat. Det är därför 12.20 finns.

### Dokumentändringar som inte är kod

- **`SPEC.md` §3c rättad två gånger**: 17 → 18 pass (vecka 12 2024 är två tillfällen, inte
  ett), sedan 18 → 19 när 95 kg-raden lades till. Antalet set gick 21 → 22. Siffran 17 var
  aldrig fel *räknat på veckor* — den räknade bara inte undantaget som redan stod i 13.6.
- **`TASKS.md` 12.20** — ny uppgift: e2e-täckning för `ui/`. Innehåller resonemanget om
  varför e2e och inte komponenttester (nya beroenden kräver Adams ja, och `useLiveQuery` mot
  Dexie gör jsdom-tester till mätningar av en attrapp). Adams förbehåll står inskrivet: e2e
  ska **inte** ersätta att köra appen i webbläsaren under byggandet.
- **`TASKS.md` 11B.0b skärpt** med Adams krav: designen får inte se AI-gjord ut, och minst
  en referens ska ligga utanför träningsappsgenren.

### Två saker att göra annorlunda

1. **Sätt aldrig ```bash runt SQL.** Appen lägger en Run-knapp på shell-block. Adam klistrade
   in `echo "Kör i Supabase SQL-editorn"` i SQL-editorn och fick ett syntaxfel — rimligt, det
   såg ut som ett kommando han skulle köra. Instruktioner om *var* något ska köras hör i
   brödtexten, inte i ett kodblock med fel språkmärkning.
2. **`/handoff` går inte att anropa som agent.** Skillen är `disable-model-invocation`. Be
   Adam skriva den; försök inte återskapa den för hand.

### Föreslagna skills för nästa session

- **`/grilling`** — inför 11B. Det är den uttryckliga beställningen, och 11B.0a hör till
  samma runda.
- **`/tdd`** för 12.20 om den tas: acceptanskriteriet är formulerat som ett test som ska bli
  rött av en avsiktligt trasig `ExercisePage`.
- **Undvik** `/setup-ts-deep-modules` (avförd i `docs/adr/0001`) och
  `/improve-codebase-architecture` (kördes 2026-08-11 förmiddag, rapporten uttömd).

---

## 🕐 2026-08-11 (kväll) — strukturfrågan AVGJORD, omstruktureringen struken

> **⚠️ Endast stycket "Börja här om du ska jobba vidare" är överspelat.** 13.3–13.5 är
> gjorda; nästa uppgift är inte 13.3. **Allt annat i sektionen gäller oförändrat** — ADR 0001,
> beroendegrafen, de två buggarna och luckorna i `ui/`. Rubriken är därför medvetet inte
> märkt `DELVIS ÖVERSPELAD`: substansen står kvar, det är bara vägvisningen som är gammal.

### Börja här om du ska jobba vidare

Nästa uppgift är **13.3** i `docs/TASKS.md` (rad ~1153). Den och 13.4/13.5 är små filter i
befintliga filer. Inget hindrar dem, och ingenting behöver läsas om struktur först — den
frågan är stängd, se nedan.

Arbetsträdet är rent, alla grindar gröna: **264 tester, 30 e2e**, typecheck, lint, bygge.

### Sex commits den här sessionen

| Commit | |
| :---- | :---- |
| `4c61b2e` | `/setup-matt-pocock-skills` — `docs/agents/`, `CLAUDE.md` §9, `.scratch/` gitignorerad |
| `8e89d73` | **12.13 avgjord** + `docs/adr/0001-ingen-omstrukturering-av-src.md` |
| `f160b33` | **12.17** — de sex tomma `index.ts` raderade |
| `64798d3` | **12.16** — historiken räknade uppvärmningsset som volym |
| `6c2cdc7` | **12.18** — volymen visar halvkilot |
| `52a9014` | **12.19** — `formatWeight` dedupad |

### 🔴 Det viktigaste: omstruktureringen är AVFÖRD, inte uppskjuten

Förmiddagens sektion nedan planerade `/setup-ts-deep-modules` som steg 3 efter 13.3–13.5.
**Det steget finns inte längre.** 12.13 mätte klart och svaret blev att strukturen inte är
rörig — den var omappad.

Beroendegrafen över `src/` är **acyklisk och skiktad i fem nivåer**:

```
nivå 0 (löv)  lib, parser      importerar ingenting utanför sig själva
nivå 1        db               → parser, lib
nivå 2        sync, timer      → db, parser
nivå 3        ai               → sync, db, parser, lib
nivå 4        ui               → alla ovan
```

Verifierat genom uttömmande sökning: inga bakåtkanter existerar. Varje funktion i `db/` tar
dessutom `database: GymDatabase = db` som sista parameter — ett konsekvent genomfört seam som
gör hela datalagret testbart utan mockning.

**Läs `docs/adr/0001-ingen-omstrukturering-av-src.md` innan du ens överväger att flytta en
fil.** Förslaget har kommit upp fyra gånger; ADR:n finns för att det inte ska bli en femte.
Den skriver också ut vad som *skulle* ändra beslutet: en cykel i grafen, eller en mapp som
växer till två ansvarsområden.

De sex tomma `index.ts` raderades (12.17) i stället för att fyllas. Att fylla dem hade byggt
barrelfiler som re-exporterar hela mappar — precis det `/setup-ts-deep-modules` själv avråder
från — och skapat ett seam som ingenting varierar över.

### Två buggar som kartläggningen hittade, båda åtgärdade

**12.16 — volymen räknades på två sätt.** `listWorkoutSummaries` summerade alla set medan
`summarizeWorkout` filtrerade bort uppvärmning, så samma pass fick olika volym på startskärmen
och i historiken. Testet skrevs först och var rött med **1350 mot 950** — differensen 400 var
exakt uppvärmningssetets 40×10. `history.ts` filtrerar nu `!s.isWarmup`. `setCount` räknar
fortfarande alla set; de gjordes.

**12.18 — volymen avrundades bort halvkilot.** Adams beslut: decimal ska visas, man lägger på
2,5 kg-skivor. Krävde tre ändringar, inte en — avrundningen skedde i `history.ts` *och* i
`TodayPage`s egna `formatVolym`, så båda skärmarna visade 463 där sanningen var 462,5. Nu
delar båda sidorna `formatVolume` i `lib/steps.ts`.

**Verifierat i WebKit på 393 px, inte bara av grindarna:** ett riktigt 92,5-set loggat via
fritexten ger `462,5` på Idag och `1 set · 462,5 kg` i Historik.

### ⚠️ Kvarstående luckor — läs innan du utökar `ui/`

**`ui/` är 21 källfiler och 0 testfiler.** Det var kandidat 3 i strukturgenomgången, graderad
`Worth exploring` eftersom den aldrig mättes mot vad de två e2e-specarna faktiskt täcker.
Sessionen gav den mer tyngd: två gånger fick en webbläsare startas för att bevisa saker ett
test borde bevisat. `ExercisePage` har varken enhetstest eller e2e — typecheck och bygge hade
passerat även om sidan slutat rendera.

**`npm run shots` loggar inga set**, så den fotograferar bara tomma tillstånd. Verifieringen
ovan gjordes med engångsskript som startade dev-servern, loggade via fritextfältet och
raderades efteråt. Att låta `shots` logga ett 92,5-set och besöka övningssidan är en liten
uppgift som ingen lagt upp än.

### Verktygslådan som tillkom

`docs/agents/` finns nu — `issue-tracker.md` (issues bor i `.scratch/<feature>/`, gitignorerad;
`docs/TASKS.md` förblir färdplanen och ska **inte** byggas om till ett ticketregister),
`triage-labels.md` och `domain.md`. `CLAUDE.md` §9 pekar på dem.

`docs/adr/` finns med sin första post. `CONTEXT.md` finns fortfarande **inte**, och ska inte
skapas i förväg — den växer fram när `/domain-modeling` faktiskt avgör ett begrepp.

### Föreslagna skills för nästa session

- **`/tdd`** för 13.3 och 13.4 — bådas "Klart när" är formulerade som testfall redan.
- **`/code-review`** innan 13.5 committas; den läser nu `docs/agents/` på riktigt.
- **Undvik** `/setup-ts-deep-modules` och `/improve-codebase-architecture` — den första är
  avförd i ADR 0001, den andra kördes just och rapporten är uttömd.

---

## 🕐 2026-08-11 (förmiddag) — DELVIS ÖVERSPELAD: strukturfrågan är MÄTT, och en ordning är beslutad

> **⚠️ Läs sektionen ovan i stället.** Mätningen här stämmer (sex tomma `index.ts`, noll
> importer via entry points), men **slutsatsen och den beslutade ordningen gäller inte
> längre**. Steg 3 — `/setup-ts-deep-modules` — är avfört i `docs/adr/0001`, och den öppna
> frågan om `src/packages/`-formen längst ned i sektionen är därmed inte längre öppen.
> Behållen som record över hur beslutet växte fram.

**Ingen kod ändrades i den här delen av sessionen.** Det som finns är en mätning och ett
beslut om ordningsföljd. Läs det innan du börjar på något av 13.3–13.5.

### Frågan Adam ställde

Om repot borde struktureras om så att Matt Pococks skills fungerar som de är tänkta — och om
det i så fall ska göras **nu** eller **efter fas 13**. Hans egen misstanke: *"en del filer och
upplägget i kodbasen är inte byggt på det sättet."*

### Svaret: han har rätt, men gapet är EN sak

Alla sex modulerna under `src/` har en `index.ts`. **Alla sex är tomma:**

```
src/db/index.ts  →  // Dexie-schema och dataåtkomst. Byggs i fas 5.
                    export {};
```

De skrevs i fas 1 som platshållare och fylldes aldrig i. Samtidigt går **minst 66
korsmodulära importer rakt in i implementationsfiler** — `../db/db` 14 gånger, `../db/repo`
9, `../parser/types` 9. Antal importer via en entry point: **noll**.

Kommandot som ger siffran igen:

```bash
grep -rhoE "from '\.\./(ai|db|lib|parser|sync|timer|ui)/[a-zA-Z]+'" src --include=*.ts --include=*.tsx | sort | uniq -c | sort -rn
```

**Slutsatsen är inte att koden är dålig.** Den är att **ingen modul har ett gränssnitt**, och
det är precis den axeln `codebase-design` och `setup-ts-deep-modules` arbetar på. Skillsen
hittar inget att hålla i, eftersom det inte finns någon deklarerad yta att hålla i.

**Ett andra, mycket billigare gap:** `docs/agents/` saknas helt. Det märktes redan under den
här sessionen — `/code-review` sa själv att `docs/agents/issue-tracker.md` fattades, och
spec-agenten fick i stället pekas på `TASKS.md` för hand. Den fungerade, men sämre.

### Beslutad ordning — tre delar, inte två

Frågan "nu eller efter 13.xx" har olika svar för olika delar, eftersom de kostar olika mycket.

| # | Vad | När | Rör kod? |
| :---- | :---- | :---- | :---- |
| 1 | `/setup-matt-pocock-skills` — `docs/agents/`, `CONTEXT.md`, `docs/adr/`, `## Agent skills` i `CLAUDE.md` | **nu** | nej |
| 2 | **12.13** orienteringskartan över `src/` | **nu** | nej |
| 3 | `/setup-ts-deep-modules` — entry points, dependency-cruiser | **efter 13.3–13.5** | varje fil |
| — | 13.3, 13.4, 13.5 | före 3 | små filter i befintliga filer |
| — | 13.6 | när som helst | nej, engångsjobb |

**Varför omstruktureringen ligger efter och inte före**, i fallande styrka:

1. **`CLAUDE.md` regel 3 svarar på frågan:** *"En ändring i taget. Blanda aldrig refaktorering
   med nya funktioner."*
2. **13.3 och 13.4 ändrar `history.ts` och `repo.ts`** — två av filerna en omstrukturering
   flyttar. Görs de samtidigt blir varje konflikt tvetydig: var det filtret eller flytten?
3. **259 tester och 30 E2E är skyddsnätet** som gör en mekanisk omflyttning trygg, och nätet
   är starkast när inget annat rör sig samtidigt.

Motargumentet — att det går smidigare framöver om strukturen fixas först — väger lätt här:
13.3 och 13.4 är några rader var i befintliga filer, så friktionen som sparas är nära noll
medan risken som läggs till är verklig.

**12.13 är förutsättningen för steg 3 och inte bara trevlig.** Uppgiften säger själv *"först
ta reda på vilket det är, inte att börja flytta filer"* — och man kan inte avgöra vad en entry
point ska exponera utan att veta vad modulen ansvarar för.

### 🔴 Öppen fråga som måste besvaras i steg 3, inte före

`setup-ts-deep-modules` förväntar sig formen `src/packages/<namn>/` med implementationen i
`lib/` och testerna i `tests/`. Vårt `src/db/`, `src/parser/` osv. är **samma idé men platt**,
och testerna ligger bredvid koden i stället för i en undermapp.

Två vägar, och valet är inte självklart:

- **Anpassa konfigurationen till vår form** — mindre rörelse, men vi avviker från skillens
  förval och får underhålla avvikelsen.
- **Flytta till deras form** — allt hamnar där skillsen förväntar sig, men det är en stor
  mekanisk flytt av varje fil och varje test.

Ta inte det beslutet i förbifarten när steg 3 börjar. Det hör hemma efter att kartan i 12.13
finns.

---

## 🆕 2026-08-10 — 13.2 klar och verifierad i skarpt läge

**Migration `0005_chins_pullups.sql` är körd av Adam och kontrollerad utifrån.** Katalogen har
46 rader, Pullups finns, Chins har kvar sitt id och `räck` är borta ur hela katalogen. Alla
tre kontrollsummorna matchar `src/db/catalog.ts`.

Filen är avsiktligt ett enda `do`-block, så den kunde inte lämna ett halvt utfört tillstånd:
hade självkontrollen gått röd hade både Chins-uppdateringen och Pullups-raden rullats tillbaka.

### Vad 13.2 gjorde

Knogar bakåt = överhandsgrepp = **Pullups** (ny post,
`6b0a5be9-a1db-4373-84cc-5eab1fb0688a`). Knogar framåt = underhandsgrepp = **Chins**, som
behåller sitt id `9f99d443-…` eftersom redan loggade set pekar på det. Aliaset `räck` är
borta ur hela katalogen.

Id:t för Pullups står **skrivet** i migrationen, inte genererat. Ett `gen_random_uuid()` hade
gett servern ett annat id än det klienten bakar in, och synken hade sett två övningar med
samma namn.

### Mätt mot produktionen — före och efter

| Mätning | Före (läsande) | Efter migrationen |
| :---- | :---- | :---- |
| Globala rader | **45** | **46** |
| Id-summa | `4e361bd2…` — exakt vad repot påstod | `b4f02d6be…` ✅ |
| Namn-summa | — | `0bdc52d27…` ✅ |
| Alias-summa | — | `ce2e0ee41…` ✅ |
| `räck` | låg på **1** rad | **0 rader** |
| Pullups | fanns inte, inget namn krockade | `6b0a5be9-…`, rätt alias |
| Chins id | `9f99d443-…` | `9f99d443-…` **oförändrat** |
| Arkiverade/raderade globala rader | 0 | 0 |

**Verifieringen kördes i en egen session**, inte som migrationens självkontroll. Skillnaden är
hela poängen: självkontrollen inspekterar tillstånd som dess egna satser just skapat, så den
bevisar att filen är rätt skriven — inte att servern hamnat rätt.

**En rättelse till mitt eget skäl.** Jag skrev att Chins måste behålla sitt id för att "redan
loggade set pekar på det". Mätt i efterhand: **noll** set pekar på Chins i dag. Beslutet är
ändå rätt — importen i 13.6 skapar historiska Chins-set, och ett id-byte hade då träffat data
som fanns. Men skälet var hypotetiskt när det skrevs, och det ska stå som det var.

### En tredje kontrollsumma tillkom, och den är poängen

Granskningen påpekade att id- och namnsummorna inte hade märkt om en **alias**-array glidit
isär mellan repo och databas — vilket är exakt vad 13.2 handlar om, och det enda som annars
märker det är parsern, tyst, genom att sluta hitta en övning som finns.
`CATALOG_ALIAS_CHECKSUM` kontrolleras nu av både testet och 0005.

**Den är prövad mot buggen:** byter man plats på `chins` och `chin` blir alias-testet rött
medan id, namn och antal förblir gröna. Ett test som aldrig varit rött bevisar ingenting.

### Känd begränsning, äldre än uppgiften

0005 gäller det **skarpa** projektet, inte en färsk databas. `0001` seedar katalogen utan
id:n, så en nyuppsatt databas får andra uuid:n än `catalog.ts` bakar in — då hittar `update`
ingen Chins och summorna kan omöjligt stämma. Filen avbryter, vilket är rätt utfall men inte
en körbar uppsättningsväg. Problemet bor i `0001`:s seed och **ligger som uppgift 12.15**.

Adam kallade det ett riktigt hinder, och det stämmer: utan det finns ingen väg till en ren
databas — inget lokalt Postgres-läge, ingen Supabase-branch att pröva en migration på innan
den körs skarpt, ingen återuppsättning. Det är hela skälet till att 0004 och 0005 måste bära
så tunga självkontroller.

### Mätt vid överlämningen (§9-regeln)

| Mått | Värde |
| :---- | :---- |
| Tester | **259 gröna**, 21 filer, plus **30 Playwright** på tre skärmbredder |
| Bundle | **635,85 kB**, gzip **191,02 kB** |
| Precache | 9 poster, 648,69 KiB |
| Rader i `src/` (exkl. tester) | 6 990 |
| `main` | pushad till `origin` |
| Migration i databasen | `0005` körd och verifierad utifrån |

### Kvar i fas 13

**13.3** (filtrera importerade pass ur passlistan) och **13.4** (importerade set blir aldrig
spökdata) är nästa. Båda är rena klientfilter och kräver ingen migration. Därefter **13.5**
(textraden om uppskattade datum) och **13.6** (engångsimporten), som nu är obockad-blockerad
av ingenting — Pullups id `6b0a5be9-…` finns i databasen och kan refereras av
`scripts/import-adam.sql`. **A.1 (egress) är fortfarande outredd.**

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

~~13.2 (dela `Chins`/`Pullups`, ta bort aliaset `räck`) är nästa~~ — **klar 2026-08-10 i
koden och verifierad i skarpt läge, migration 0005 körd.** Se sessionen högst upp.
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
  `workouts.is_imported` finns nu i databasen, verifierad utifrån. ~~**13.2–13.5 är orörda**~~
  **13.2 är klar och verifierad 2026-08-10; 13.3–13.5 är orörda** och inte längre blockerade.
- **SQL-filen `scripts/import-adam.sql` är inte genererad.** Krävde 13.2, som nu är klar —
  Pullups id `6b0a5be9-a1db-4373-84cc-5eab1fb0688a` finns i databasen och kan refereras.
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

## 🕐 2026-08-07 — DELVIS ÖVERSPELAD: grillningssession om import av gamla anteckningar

> **⚠️ Besluten gäller, men "Vad som INTE är gjort" längst ned är felaktig i sin helhet.**
> Adams konto finns i `auth.users` sedan 2026-08-09, SQL-filen är genererad och körd, och
> Fas 13 är klar utom bekräftelsen i appen. Härledningen av årtalen (v41 2023 – v20 2024)
> står kvar och är fortfarande en härledning, inte en mätning. Antalet pass har dessutom
> gått från 17 till 19 sedan dess — se den översta sektionen.

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
| ~~Aliaset `räck` sitter på `Chins`~~ — **borttaget 2026-08-10 i 13.2** | `catalog.ts` |
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

> ⚠️ **Detta stycke är överspelat. Den gällande ordningen står i sessionen 2026-08-11 högst
> upp** — `/setup-matt-pocock-skills`, sedan 12.13, sedan 13.3–13.5, sedan omstruktureringen.
> Stycket står kvar för att visa hur prioriteringen har flyttat sig.

**Detta stycke skrevs 2026-08-07 och gäller designrundan (11B).** Sessionen 2026-08-09 lade
två saker framför den — se den sessionen högst upp:

1. **A.1 — egress.** Free-planens tak är passerat. Usage-vyn per projekt först, ingen kod.
2. ~~**13.1 — `workouts.is_imported`.**~~ **Klar 2026-08-09 (kvällen).**
   ~~Nästa i fasen är **13.2**~~ — **även 13.2 är klar och verifierad 2026-08-10**, migration
   0005 körd. Nästa är **13.3** och **13.4**, de två filtren. Båda är rena klientfilter och
   kräver ingen migration.

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
