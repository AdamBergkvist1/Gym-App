# Överlämning: startskärmen och den öppna designfrågan

**Skriven 2026-08-05.** Skriven för att kunna läsas av någon **utan tillgång till samtalet
som föregick den**. Allt som behövs för att fortsätta står här eller i filerna den pekar på.

**Projektet:** Gym-App, offline-first träningslogg som PWA. Repo `AdamBergkvist1/Gym-App`.
Produktion: https://adam-gym-app.vercel.app

**Läs först:** `CLAUDE.md` (arbetsregler), `docs/DESIGN.md` (designbriefen), `docs/HANDOFF.md`
(projektets allmänna status). Kör `npm run status` för mätta siffror i stället för att lita
på den här filens.

---

## 1. Vad som är gjort och mergat

Fas 11B är designrundan. Briefen `docs/DESIGN.md` är komplett och godkänd av Adam:
**§0.5 visuell karaktär · §1 färgsystemet · §2 typografi och rytm · §3 skärmskisser.**

Fem PR:er är mergade till `main`:

| PR | Vad |
|---|---|
| **#1** | CI (`.github/workflows/ci.yml`), designtokens i `src/index.css`, navigationen datadriven via `src/ui/nav.ts` |
| **#2** | Setraden: 24 px värden, 48×48 bekräfta-knapp. Justeringsarket: sammansatt värde, tre hjulrader i stället för fem |
| **#3** | Deterministisk setordning — `logSet` garanterar strikt växande tidsstämplar |
| **#4** | Sammanfattningsraden `Set · Volym · Övningar`, förhandsvisning på "Kopiera förra passet" |
| **#5** | **Visuell karaktär:** accentfärg lime `#bef264`, ren svart bakgrund, radie 16 px, flytande pillernavigering, accentfylld ikonruta per övning |

**Uppgift 11B.7 är uppfylld:** noll hårdkodade färgklasser i `src/`. All färg via token.

### Verktyg som tillkommit och som du ska använda

| Kommando | Gör |
|---|---|
| `npm run status` | Mäter projektets tillstånd: git, tester, bundle, uppgifter, produktion vs HEAD |
| **`npm run shots`** | **Playwright-skärmdumpar headless** av sju vyer i iPhone-viewport. Bilderna hamnar i `skarmdumpar/` (gitignorerad) |
| `npm run e2e` | 30 E2E-tester på tre skärmbredder: 375 (SE), 390 (13), 393 (15) |

> ⚠️ **`npm run shots` är inte valfritt.** Regeln står i
> `ai-workbench/rules/se-appen-sjalv.md`: kör den och **titta på bilderna** före och efter
> varje designändring. Den inbyggda webbläsarpanelen kan inte fotograferas när den är dold,
> vilket ledde till att designarbetet gjordes mot en textbrief i flera dagar — och tre fel
> som briefen missat hittades på fem minuter när appen först granskades visuellt.

---

## 2. 🔴 ÖPPEN FRÅGA: bakgrundsfärgen — och om temat alls ska vara mörkt

**Detta blockerar allt vidare visuellt arbete. Fråga Adam innan du bygger.**

### 2a. Den lilla frågan: vilken svärta

Tre alternativ togs fram som mockup och visades sida vid sida
(`skarmdumpar/startskarm-forslag.png`, regenereras med skriptet i §3):

| Alt | Bakgrund | Yta | Karaktär |
|---|---|---|---|
| **A** | `#000000` | `#16161a` | **Nuvarande i koden.** Djupast kontrast, släckta OLED-pixlar. Men hårda kortkanter, och kan läsa som en tom skärm |
| **B** | `#0b0b0e` | `#1a1a20` | Korten smälter mjukare, ytan känns som ett material. Behåller nästan allt djup |
| **C** | `#121216` | `#1e1e25` | Mjukast, mest "app". Men mindre kortsteg och mindre OLED-svärta |

**Rekommendation vid mörkt tema: B.** Adam invände mot ren svart, och invändningen är
rimlig — A gör att kort svävar i tomrum i stället för att vila på något.

### 2b. 🚩 Den stora frågan: Adam vill utforska LJUST tema

**Adams ord 2026-08-05:** *"Jag vill nödvändigtvis inte ens ha mörk bakgrund. Om jag får
välja bland dessa spelar det typ ingen roll, de är samma stil allihopa. Vill utforska ljusare
alternativ också senare."*

**Det är inte en färgjustering — det motsäger tre dokument:**

| Fil | Vad som står |
|---|---|
| `docs/SPEC.md` §4 | *"Minimalistiskt, mörkt tema (dark mode) med rena kontraster"* |
| `docs/PLAN.md` §2.2, rad 22 | *"Tailwind CSS, **endast mörkt tema**"* |
| `docs/PLAN.md` rad 926 | *"**Ingen ljus variant.** Mörkt tema är enda temat"* |
| `src/index.css` rad 3 | Samma, som kommentar |

**Enligt `CLAUDE.md` regel 1 får ingen kod skrivas förrän `SPEC.md` och `PLAN.md` är
uppdaterade och godkända.** Ett ljust tema kräver alltså ett SPEC-beslut först, inte en
CSS-ändring.

**Vad ett ljust tema faktiskt kostar, så beslutet blir informerat:**

- Alla semantiska färger i `DESIGN.md` §1 är Radix **mörka** skalor, uppmätta mot mörk botten.
  De blir oläsliga på ljus bakgrund och måste bytas mot Radix ljusa skalor och mätas om.
- `--color-accent: #bef264` (lime) har **1,3:1 mot vitt** — helt oanvändbar som text eller
  fylld knapp med svart text i ljust tema. Accenten skulle behöva bytas.
- PWA-manifestets `theme_color` och `background_color` styr startskärm och statusrad.
- **Två teman är dubbelt underhåll**, och `PLAN.md` valde bort det medvetet.

**Rimligt mellanläge att föreslå Adam:** utforska ljust tema som **mockup först**
(`skarmdumpar/`-flödet, ingen kod), och fatta SPEC-beslutet på en bild i stället för på en
princip. Det är samma metod som avgjorde accentfärgen och den fungerade.

---

## 3. Nästa steg, exakt

**Startskärmen är omdesignad som mockup men INTE byggd i koden.** Förslaget finns i
`skarmdumpar/startskarm-forslag.png`. Källan till mockupen ligger i sessionens scratchpad och
är **inte** versionerad — bygg om den från `DESIGN.md` §3.1 om den behövs igen.

### Vad mockupen innehåller som koden saknar

1. **Veckorad** överst: `3 pass i veckan · 14 200 volym kg · 48 set`
2. **Programchips**: Push · Pull · Ben — startval, aldrig byggda trots `SPEC.md` §2b
3. **"Kopiera förra passet" som kort** med ikonruta och pil, i stället för en knapp
4. **Startknappen fylld i accentfärg**
5. Datumrad i versaler ovanför rubriken

### Filer det rör

| Fil | Ändring |
|---|---|
| `src/ui/pages/TodayPage.tsx` | Grenen `if (workout === null)`, ca rad 138–195. Det är hela startskärmen |
| `src/db/repo.ts` | Ny hjälpare för veckostatistik. `summarizeWorkout` finns redan och är mönstret att följa |
| `src/db/repo.test.ts` | Test för veckohjälparen |
| `src/index.css` | **Endast om bakgrundsfrågan i §2 är besvarad** |
| `vite.config.ts`, `index.html` | `theme_color` och `background_color` — **måste ändras i samma commit som bakgrunden**, annars får startskärmen en annan svärta än appen |

### Arbetsordning

1. **Fråga Adam om §2 först.** Bygg inte startskärmen i ren svart om bakgrunden ändå ska bytas.
2. Egen branch, egen PR. Adam vill ha **en avgränsad del i taget** — inte flera skärmar i
   samma PR.
3. `npm run shots` före och efter. Titta på bilderna.
4. Skicka bilderna till Adam innan merge.

---

## 4. Vad som medvetet INTE är byggt

Alla punkter nedan är **beslut, inte glömska.** Bygg dem inte oombedd.

### Kvar i passvyn — Adam har sett dem och prioriterat ned dem

- **`FÖRRA`-kolumnen visar ingenting** när historik saknas, men äter fortfarande ~133 px
- **Fritextrutan** är prickad och grå; ser bortglömd ut snarare än inbjudande
- **`+ Lägg till set`** är gråare än innehållet
- **Timer- och PB-chips** finns i mockupen från `DESIGN.md` §3.1 men inte i koden.
  `epley1RM` finns i `src/lib/oneRepMax.ts`, så PB är mest plumbing

### Hela skärmar som inte finns

`SPEC.md` §2b låser fyra flikar. **Två av dem existerar inte:**

- **Övningar** — katalog med sök och personbästa per övning
- **Mer** — inställningar, konto, export. Nuvarande "Inställningar" är enbart diagnostik
- **Statistik** — segment inuti Historik. Ej byggt

Att lägga till en flik är **en rad i `src/ui/nav.ts`** — navigationen är datadriven sedan PR #1.

### Uppskjutet med villkor, dokumenterat på annat håll

| Vad | Villkor | Var |
|---|---|---|
| AI-nycklar i egen organisation (8.1–8.2) | När AI-vägen används mer än enstaka gånger | `TASKS.md` |
| `free-exercise-db`, 873 övningar | När Adam saknar en övning han vill logga | `docs/EXTERNT.md` |
| ntfy för vilotimern | Efter fas 11B | `ai-workbench/tools/ntfy.md` |
| Osäkerhetsband på e1RM-kurvan | Kräver statistisk grund, avgörs i 12.7 | `DESIGN.md` §3.2 |
| Sentry / felloggning | Byggs på befintlig utkorg i stället | `ai-workbench/tools/sentry.md` |

### Aldrig gjort, och det är den största luckan

**Uppgift 10.4 — ett riktigt pass i gymmet — har aldrig körts.** Databasen innehåller bara
testdata från två testkonton; Adam har inte skapat sitt riktiga konto.

Mönstret är värt att ta på allvar: **varje gång appen faktiskt använts har ett strukturellt
fel dykt upp** (parsern klarade inte `80x7 bänk`, setraden klipptes av på 375 px, fritext-set
var osynliga). Adam har sagt att appen ännu är för ologisk att använda i gymmet — vilket är
ett rimligt skäl att vänta, men inte ett skäl att glömma.

---

## 5. Arbetssättet som gäller

- **Mät, gissa inte.** Kör `npm run status` och `npm run shots` i stället för att lita på vad
  dokument påstår. Flera fel har hittats just så.
- **Verifiera testet mot buggen.** Ett test som aldrig varit rött bevisar ingenting. Koppla
  ur fixen och se att det faller — det har fångat två otillräckliga vakter.
- **En avgränsad del per PR.** Adams uttryckliga önskemål.
- **Adam bedömer utseendet.** Skicka skärmdumpar och vänta på svar innan merge.
