# Överlämning (Senaste status)

**Datum:** 2026-08-19. Läs sektionen direkt nedan — den är nyast.
Sektionerna därefter är äldre och har varningsrutor som säger vad i dem som inte längre gäller.

---

## 🆕 2026-08-19 (kväll) — 11B.0g är STÄNGD. Allt förarbete i 11B är slut

### ✅ Pushat till och med `4118dcf`. Börja med `git pull`

Kontrollerat efter en färsk `fetch`: `git status -sb` svarar `## main...origin/main` utan
`ahead`, och `origin/main` står på `4118dcf`. **Fem commits gick upp den här sessionen.**

⏰ **En sista commit kan ligga opushad:** den med den här sektionen plus Adams setprecisering
i 11B.0f. Kolla `git status -sb` först.

Samtliga commits rör `docs/` — ingen `.ts`, `.tsx`, `package.json` eller migration.

### Börja här

**Nästa jobb är `11B.0f`: snittfunktionen i `src/db/history.ts`.** Det är **första gången på
tre sessioner som kod ska röras**, och två saker måste göras innan en rad skrivs:

1. **Kör om grindarna.** Se tabellen nedan — fyra är gröna och mätta i dag, men **e2e går
   inte att köra på hemdatorn** och det är inte åtgärdat.
2. **Läs `src/db/history.ts` och `repo.ts` FÖRST.** Regeln som 11B två gånger fått lära sig
   den hårda vägen: *läs koden innan du planerar, inte efter.* `getLastPerformance` finns
   redan och slår upp på `[exerciseId+performedAt]`.

`/tdd` är rätt verktyg här — se skilltabellen längst ned.

### ⛔ Grindarna — KÖRDA I DAG, och en är trasig av miljöskäl

| Grind | Utfall 2026-08-19 |
|---|---|
| `npm run test` | ✅ **274 tester i 22 filer**, alla gröna. 2,31 s |
| `npm run typecheck` | ✅ rent |
| `npm run lint` | ✅ **0 fel**, 3 kända `react-refresh`-varningar i `icons.tsx` |
| `npm run build` | ✅ **638,27 kB** (gzip 191,72), precache **651,41 KiB**, 9 entries |
| `npm run e2e` | ⛔ **60 failed — men inget test kördes** |

⛔ **E2E-felet är INTE en regression. Läs det här innan du felsöker något:**

> `browserType.launch: Executable doesn't exist at …/ms-playwright/webkit-2336/pw_run.sh`

`~/Library/Caches/ms-playwright/` **finns inte alls** på den här maskinen. Playwrights
webbläsarbinärer är aldrig installerade här. Alla tre projekten (`iphone-se`, `iphone-13`,
`iphone-15`) kör WebKit, så allt failar på samma rad utan att en enda assertion utvärderas.

**Åtgärd:** `npx playwright install webkit` (eller `install` för alla). **Inte gjort** — det
är en nedladdning på flera hundra MB och Adam hade inte tagit ställning när sessionen tog slut.

⚠️ **Följden för briefens historik: siffran "60 e2e" har aldrig gällt hemdatorn.** Den kommer
från 2026-08-14 och alltså från jobbdatorn. Det stod som en ärvd sanning i två överlämningar
utan att någon prövade den här. **Bygget är därmed grönt på fyra grindar, inte fem**, och det
ska inte skrivas som "grindarna gröna" förrän WebKit är installerat.

### Vad som avgjordes — 11B.0g är klar

Slutvillkoret var *"Adam har valt en variant per axel, och valet står i `DESIGN.md` med skäl"*.
Uppfyllt på båda. Mockupen ligger i `docs/mockups/11b-0g-pass.html`, fyra körbara rutor.

| Axel | Val | Skälet i korthet |
|---|---|---|
| Fritext-loggningen | **1A**, invikt genväg som fälls ut vid tryck | Ett armerat fält framme i varje pass är en stark signal för något Adam inte vet om han vill ha |
| Snittet | **2B**, under värdet, ingen egen kolumn | Ingen kolumnbredd betalas, och varje tal står under det det hör till |

**Skälen står i `DESIGN.md` §3.1 — läs dem där, inte här.**

**Två sidoeffekter av 2B som är lätta att missa:**

1. ✅ **Kolumnrubriksfrågan föll.** Briefen sa att `Snitt` skulle prövas mot `Normalt` och
   `Typiskt`. Med 2B finns ingen kolumn att namnge. En öppen fråga försvann utan att någon
   behövde svara på den.
2. ⚠️ **Men något måste ändå förklara talen första gången.** Utan rubrik är de små grå
   siffrorna inte självförklarande. **Olöst.**

### 🔄 Det viktigaste fyndet: snittet är TVÅ tal, och det stod fel i tre dokument

**Adam hittade felet i mockupen, och det pekade tillbaka på briefen.** Ordagrant:

> *"för att det ska make sense måste man visa snitt i vikt kopplat till reps och inte bara
> snitt i vikt. för om man tar ju mer reps på högre vikt osv."*

**Vikt och reps går inte att skilja åt.** Ett snitt som bara följer vikten kan **stiga för att
man kört färre reps** — det ser ut som framsteg utan att vara det, vilket är exakt den falska
signal som hela omskrivningen i `SPEC.md` §2 finns för att ta bort.

Rättat på tre ställen: `SPEC.md` §2 skrev *"en vikt"* och *"ett och samma tal"*;
`DESIGN.md` §3.1:s regeltabell saknade rad för vad som visas; och §3.1:s skiss ritade en
`Snitt`-kolumn som nu är borta.

⚠️ **`DESIGN.md` §3.1:s skiss sa `90×5` hela tiden.** Briefen hade rätt och mockupen ritade
fel. **Lärdomen är densamma som med `--text-title` i augusti: felet syntes först när briefen
byggdes mot.**

### Öppna beslut som nästa session stöter på

1. ⚠️ **Snittas vikt och reps var för sig kan resultatet bli ett set som aldrig utförts.**
   90×5, 85×8 och 92,5×4 ger `90×6`. Tre vägar med kostnader står i `TASKS.md` 11B.0f.
   **Adam informerad och införstådd — han hänvisade frågan dit med flit.** Avgörs när
   funktionen skrivs, inte innan.
2. **Passen har olika många set.** Adam preciserade skalan: han kör **sällan 5 set, oftast
   2–4**. Fällan är alltså mindre extrem än briefen antydde men **försvinner inte** — den
   flyttar ner till set 3 och 4.
3. **Vakt 5 i 12.20 mäter `FÖRRA`-kolumnen**, som inte längre finns. **Måste skrivas om i
   samma commit som 11B.0f**, annars är den grön mot något som inte existerar. Oförändrat
   sedan förra överlämningen.
4. **Chart.js** blir en fråga i runda 2. Kräver Adams ja enligt `CLAUDE.md` §7.3.
5. 💡 **Långtryck som visar en infobricka** om vad snittalen betyder — Adams förslag på den
   olösta förklaringsfrågan. **Förslag, inte beslut.** Noterat i `DESIGN.md` §3.1 att appen är
   en telefon-PWA, så det är `long-press` och inte hover, och att en osynlig gest har en egen
   kostnad.

### Strong är hämtad, och den gav inte det som förväntades

Sex App Store-bilder i `docs/Reference-pics/Strong iOS 1–6.jpg`, registrerade i
`docs/EXTERNT.md`. **Bild 1 är vår Pass-skärm byggd av någon annan.** Mätvärdena ur den
ligger i `DESIGN.md` §0.5 — det viktigaste är att spökdatakolumnen står tom i alla tre
raderna i Strongs **egen säljbild**, ligger på **1,6–1,7:1** i kontrast mot 13,4:1 för
viktvärdet bredvid, och kostar ~⅓ av radbredden. Det blev axel 2:s starkaste argument.

⛔ **Men hypotesen om varför Adam slutade höll inte.** Förra överlämningen antog att det
kanske var utseendet. Ombedd att peka svarade han *"inget riktigt speciellt"* — samtidigt som
han **fortfarande inte tycker att Strong är snyggt**. Motviljan är alltså **diffus, inte
lokaliserad**. Följden för arbetssättet: **leta inte efter den avgörande detaljen i bilderna.**

### ⚠️ En rättelse som gäller arbetssättet, inte koden

**Adam avbröt sessionen med:** *"känns som att du tar mina svar och förvränger dom. Behöver
inte överdriva så hårt alltid."*

Han hade rätt. *"Inget riktigt speciellt"* hade blivit *"utseendet är frikänt"*, och
*"tror jag tittade lite, minns inte exakt"* hade blivit *"kolumnen gjorde skadan"*. Båda
skrevs om, och rättelsen står som en synlig ruta i `DESIGN.md` §0.5 med hans invändning
citerad — inte som tyst omskrivning.

**Regeln som faller ut, och som är värd mer än något beslut i den här sessionen:** Adam svarar
ofta hedgat (*"tror"*, *"minns inte exakt"*, *"får se"*). **Hedgingen är data, inte artighet.**
Skriv in svaret med hedgingen kvar, och dra aldrig ett svagt svar till en stark slutsats för
att det gör dokumentet snyggare.

### Fritexten är två funktioner, inte en — och det ändrar 11B

Adams distinktion, som briefen tidigare behandlat som ett element:

| | Vad det är | Adams hållning |
|---|---|---|
| **Passkommentar** | Fritext *om* passet, vid avslut | *"vi kan prova att ha den för oss ändå"* — ja, låg insats |
| **Fritext-loggning** | `bänk 80x8` → set via AI | *"vet inte om jag kommer använda … men får se"* — **osäker** |

⚠️ **Adam tror strukturerad inmatning kan vara effektivare för själva loggningen:** *"tror ändå
det är mer effektivt att söka på övningen klicka och skrolla."* Det är användarens omdöme om
appens uttalade kärnvärde i `CLAUDE.md`. **Skriv inte bort det.** Men blås inte upp det heller
— det är *"får se"*, inte avslag, och `SPEC.md` §2:s andra loggningsläge är redan svaret.

### Miljö

**macOS (hemdatorn)**, Darwin 24.6.0. `node` **v24.13.0**, `npm` **11.6.2** (11.19.0 finns).
**`gh` saknas** fortfarande. **Playwrights webbläsare saknas** — se grindtabellen.

⏰ **Något committar automatiskt i den här miljön.** Filer stagades, och commiten fanns redan
när stagingen skulle kontrolleras — författad som Adam, med fullständigt meddelande, utan att
`git commit` kördes. Innehållet var korrekt. **Anta inte att en commit du inte gjort är fel,
men verifiera alltid `git show --stat` innan du pushar.**

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/tdd`** | För **11B.0f**, och nu starkare än förut. Reglerna är fler sedan snittet blev två tal, och **vakt 5 ska bli röd på rätt rad innan den skrivs om**. Sabotaget är uppgiften, inte en efterkontroll |
| **`/code-review`** | Efter steg 4:s **första** skärm, inte efter hela ombyggnaden. Oförändrat i tre överlämningar |
| **`/wayfinder`** | Till **runda 2** (Statistik, Övningar, Mer). Inte till runda 1 — där finns ingen dimma kvar |
| **`/diagnosing-bugs`** | Bara om något faller. **E2E-felet är redan diagnosticerat** — det är en saknad webbläsarbinär, inte en bugg |

---

## 2026-08-19 — Grillningen inför steg 4 välte appens kärnvärde. 11B.0b är stängd

> **⚠️ Tre saker i sektionen nedan gäller inte längre.**
>
> **(1) "Nästa jobb är `11B.0g`" är utfört.** Uppgiften är **stängd** 2026-08-19 (kväll).
> Både axlarna är avgjorda — `1A` och `2B`. Se sektionen överst.
>
> **(2) Siffran "60 e2e" gäller INTE den här maskinen.** Den ärvdes från 2026-08-14 och kommer
> från jobbdatorn. På hemdatorn saknas Playwrights webbläsarbinärer helt, och alla 60 failar
> utan att köras. De övriga fyra grindarna är omkörda och gröna 2026-08-19. Se grindtabellen
> överst.
>
> **(3) Hypotesen att Strong övergavs för utseendets skull höll inte.** Se sektionen överst.
>
> Allt annat — spökdatabeslutet, betalväggsfynden, `SPEC.md` §2 — gäller oförändrat.

### ✅ Pushat. Börja med `git pull`

`43ff385..d109662` gick till `origin/main` vid sessionens slut, på Adams begäran. Kontrollerat
efter en färsk `fetch`: `git status -sb` svarar `## main...origin/main` utan `ahead`, och
`origin/main` står på `d109662`. **Allt nedan finns alltså på den andra maskinen.**

Samtliga commits rör bara `docs/`, så pullen kan inte krocka med kod du har lokalt.

> ✏️ **Den här rutan sa först "INTE PUSHAT".** Det stämde när den skrevs — Adam bad om pushen
> efteråt, i samma session. Rättad i egen commit i stället för genom `--amend`, så att
> historiken visar att överlämningen stämde vid varje tidpunkt.

### Börja här

**Nästa jobb är `11B.0g`: hämta Strong-bilderna, bygg sedan Pass-mockuperna.** Allt förarbete
i 11B är slut — 11B.0b stängdes den här sessionen.

Ordningen inom 0g spelar roll: **Strong hämtas först.** Den är mappens enda *negativa* referens
— den enda app Adam faktiskt använt och övergett — och hans omdöme är att det kanske är
utseendet snarare än funktionen han ogillar. Det går inte att pröva utan bilderna framme.

Mockupen ska variera **två axlar, en i taget** (metoden från 11B.0d): fritextens plats, och
snittkolumnens synlighet. Detaljerna står i `TASKS.md` 11B.0g.

⛔ **Varianterna ska härledas ur etablerade appar, inte ur egna idéer.** Adams uttryckliga krav
den här sessionen. Det är §0.2 med skärpta tänder, och det är ett acceptanskriterium.

### Det viktigaste: grillningen välte appens näst viktigaste funktion

**Detta är sessionens enda verkligt betydelsefulla resultat, och det hade inte hittats genom
att bygga.** `CLAUDE.md` säger att kärnvärdet är friktionsfri inmatning **och intelligent
spökdata**. `SPEC.md` §1 definierade spökdata som *exakt vad du lyfte förra passet*.

Adam, ombedd att beskriva varför han slutar använda loggningsappar:

> *"man vill bara köra på och göra sitt bästa utan att alltid tänka på att man ska vara bättre
> eller lika bra som senaste passet (iom att man ser vad man tog senaste)"*

**Appens näst viktigaste funktion var alltså hälften av hans motstånd mot att använda den.**
Vi stod i begrepp att bygga en snyggare version av precis det.

Beslutet och skälen ligger i **`SPEC.md` §2** och formen i **`DESIGN.md` §3.1** — läs dem, inte
den här filen. Kort: `FÖRRA` blir `SNITT`, ett medelvärde över de tre senaste passen **med den
övningen**, per setnummer, avrundat till 2,5 kg, med åtta veckors åldersgräns.

Tre saker om fyndet som är värda att bära med sig:

1. **Adams förslag var MacroFactors lösning, flyttad från kroppsvikt till styrka.** Han kände
   inte till kopplingen. MacroFactor är redan en av projektets fem referensappar, och bilderna
   låg i `docs/Reference-pics/`.
2. **Regeln stod redan i vår kod, fast bara för importerade set.** `repo.ts` i 13.4:
   *"spökdatan är ett minnesstöd om förra passet — inte ett rekord att matcha varje gång
   övningen öppnas."* Avsikten var rätt; utförandet gjorde minnesstödet till ett facit.
3. **Vi avviker medvetet från marknadens konsensus.** Båda betalväggsundersökningarna
   rekommenderar klassisk spökdata. Avvikelsen är utskriven i `SPEC.md` så att ingen ändrar
   tillbaka med researchen som skäl.

### Vad som gjordes — sex commits

| Commit | Vad |
|---|---|
| `5e17d2d` | **`SPEC.md`** — spökdatan görs om, andra loggningsläget blir ett uttalat mål |
| `29dbc01` | **`DESIGN.md`** — setraden, fritextens plats, långa horisonten, kroppsviktsprincipen, `--text-title`-rättelsen, Strong som negativ referens |
| `aaf2065` | **`TASKS.md`** — 11B.0f, 11B.0g, 11B.0h; runda 1 avgränsad till 4.1–4.3 |
| `9a6cf96` | Den oberoende betalväggssökningen, 797 rader |
| `766ecce` | **11B.0b stängd** — slutvillkoret begärde fel sorts omdöme |
| *(denna)* | Överlämningen |

Adams egna två commits (`7a625b9`, `43ff385`) lade in Gemini-rapporten. ⏰ **`43ff385` har ett
felaktigt meddelande** — *"Update print statement from 'Hello' to 'Goodbye'"* — som var
automatgenererat. Adam har sagt att det får stå. Sök alltså inte efter researchen på dess
commitmeddelande.

### Grindarna — INTE KÖRDA, och det är rätt

| Grind | Utfall |
|---|---|
| samtliga fem | **inte körda denna session** |

`git diff --stat 7f623f5..HEAD` visar **fem filer, alla under `docs/`**. Ingen `.ts`, `.tsx`,
`package.json` eller migration. Det finns inget för grindarna att pröva.

⚠️ **Siffrorna som gäller är ärvda, inte uppmätta i dag:** 274 tester i 22 filer, 60 e2e,
bygge 651,60 KiB, lint 0 fel med 3 kända `react-refresh`-varningar i `icons.tsx`. De kommer
från 2026-08-14. **Rör du kod härnäst — kör om dem först**, så att du vet att du står på grönt.

### Inte verifierat, och det ska inte antas

- **Ingenting av det ljusa temat finns i koden.** `src/index.css` har fortfarande lime
  `#bef264` och ren svart bakgrund från 5 augusti. Färgerna lever bara i `DESIGN.md`.
- **Ingen av de nya färgerna är sedd på en riktig skärm.** De är uppmätta, inte upplevda.
  Detta är ett av två kvarstående omdömen som är Adams — se 11B.0b:s nya slutvillkorsruta.
- **Snittfunktionen finns inte.** 11B.0f är en beskrivning, ingen kod.
- ⚠️ **Vakt 5 i 12.20 mäter `FÖRRA`-kolumnen.** Den kolumnen ska bort. Vakten **måste skrivas
  om i samma commit som 11B.0f**, annars är den grön mot något som inte existerar.
- **Steg 4.1 är till hälften redan gjord**, vilket ingen visste när rundan planerades.
  `src/ui/nav.ts` säger i sin egen doc-kommentar att den *är* steg 4.1. Detta är **andra
  gången** 11B visat sig vara halvbyggt medan dokumenten beskrev den som ostartad.
  **Regeln som faller ut: läs koden innan du planerar en fas, inte efter.**

### Öppna beslut som nästa session stöter på

1. **Passen har olika många set.** Set 5 kan ha ett enda underlag när set 1 har tre. Vad
   snittkolumnen då visar är **inte avgjort** — avgörs när 11B.0f skrivs, och ska inte antas.
2. **Kolumnrubriken `Snitt` är ett förslag.** Prövas mot `Normalt` och `Typiskt` i mockupen.
   MacroFactor kallar sin motsvarighet `Trend`.
3. **Chart.js** kommer att bli en riktig fråga i runda 2. `Sparkline.tsx` har redan ett skrivet
   beslut med utlösare: *"blir graferna fler och mer krävande är det då ett bibliotek ska
   övervägas"*. Statistik är det fallet. **Kräver Adams ja** enligt `CLAUDE.md` §7.3.

### Två undersökningar av betalväggar, och vad de gav

Båda ligger i `docs/research/` och är körda **oberoende av varandra** med flit — Adams via
Gemini Deep Research, min via `/research` utan att läsa hans. Detaljerna står i `TASKS.md`
11B.0h, inte här.

**Det de båda landar på:** betalväggarna speglar nästan aldrig driftskostnad, och den mest
låsta funktionen i hela kategorin är **full grafhistorik** — sex av nio appar. Det är tredje
oberoende källan som pekar på att den långa tidshorisonten är det som betyder något, efter
Adams platå-erfarenhet och Geminis rapport. **Det konkurrenterna tar mest betalt för har Adam
redan gratis, med fem års data i.**

⚠️ **Liftosaur är AGPL-3.0.** Inga kodrader därifrån, någonsin. Läsa för idéer är fritt, men då
krävs en rad i `docs/EXTERNT.md`. Inget är hämtat, så ingen registerrad krävs i dag.

### Om arbetssättet — två saker som fungerade

**Att läsa koden före grillningen betalade sig omedelbart.** Femton fynd kom ur den
genomgången, varav briefens självmotsägelse om `--text-title` (22 mot 30 px) och att fritexten
— halva appens kärnvärde — är ritad med streckad kant som något valfritt. **Inget av det
syntes i dokumenten.**

**Tekniska frågor gick inte till Adam.** Fortsatt rätt: han svarade på det som rörde hans data,
hans tid och hans prioritering, och den mest värdefulla frågan i hela grillningen var *"vilka
loggningsappar har du använt och vad fick dig att sluta?"* — den enda där han var primärkällan.

⚠️ **En sak att inte upprepa:** slutvillkoret för 11B.0b krävde att Adam läste 1300 rader.
Det motsade briefens egen §0.2 om att han inte är designer och inte ska behöva vara det.
**Skriv aldrig ett slutvillkor som begär fel sorts omdöme av honom.**

### Miljö

Sessionen kördes på **macOS (hemdatorn)**, Darwin 24.6.0. `node --version` → **v24.13.0**,
`npm` → **11.6.2**. **`gh` saknas** (`command not found`) — det spelade ingen roll här eftersom
inget hämtades från GitHub, men `CLAUDE.md` §7.3 steg 1 förutsätter den.

Hela stycket om portabel Node i äldre sektioner gäller **bara jobbdatorn**. Kör
`node --version` först.

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/prototype`** eller körbara HTML-mockuper | För 11B.0g. Projektets egen mockupmetod har gett sex lyckade beslutsomgångar — den är beprövad här och `/prototype` bygger i riktig kod, vilket är en annan fråga. Välj metod medvetet |
| **`/tdd`** | För **11B.0f**. Sex regler som ska bli tester, och vakt 5 ska bli röd på rätt rad innan den skrivs om. Sabotaget är uppgiften, inte en efterkontroll |
| **`/code-review`** | Efter steg 4:s **första** skärm, inte efter hela ombyggnaden. Stod redan i förra överlämningen och gäller oförändrat |
| **`/wayfinder`** | Till **runda 2** (Statistik, Övningar, Mer). Den är byggd för arbete som är för stort för en session och inneslutet i dimma, och det är precis vad tre obyggda sidor med oskriven beräkningslogik är. **Inte** för runda 1 — där finns ingen dimma kvar |
| **`/diagnosing-bugs`** | Bara om något faller. Begär utskriften först — gissa inte |

---

## 2026-08-14 — Designrundans förarbete är slut. Färgen avgjord, ikonerna borta — DELVIS ÖVERSPELAD

> **⚠️ Fyra saker i sektionen nedan gäller inte längre.**
>
> **(1) "Nästa jobb är 11B.0b steg 1: Luna och Ellie" är utfört** 2026-08-14 (`7f623f5`).
> Tio App Store-bilder ligger i `docs/Reference-pics/` med anteckningar i `DESIGN.md` §0.5.
>
> **(2) Den rekommenderade `/grill-me` före steg 4 ÄR KÖRD** 2026-08-18, och den välte mer än
> väntat — spökdatan är omgjord och `SPEC.md` §2 är omskriven. Se sektionen överst.
>
> **(3) "`11B.0b` kan inte kryssas i än" gäller inte.** Uppgiften är **stängd** 2026-08-19,
> efter att slutvillkoret formulerats om. Det krävde att Adam läste 1300 rader, vilket motsade
> briefens egen §0.2.
>
> **(4) Rekommendationen om `11B.0c`:s motstridiga slutvillkor är utförd** (`53c87a8`).
>
> **(5) Pushstatusen stämmer fortfarande, men gäller andra commits.** *"✅ Pushat"* var sant
> när det skrevs, och är sant igen: sex nyare commits gick till `origin/main` 2026-08-19.
> `HEAD` = `origin/main` = `d109662`. Se sektionen överst.
>
> Allt annat — färgbeslutet, mätningarna, lärdomen om inventeringar, Node-stycket — gäller
> oförändrat.

### ✅ Pushat. Börja med `git pull`

Sex commits gick till `origin/main` vid sessionens slut. **Allt nedan finns på den andra
maskinen.** Fyra av dem rör bara `docs/`, två rör `src/`.

### Börja här

**Nästa jobb är `11B.0b` steg 1: referenserna Luna och Ellie.** Adam pekade ut det själv, och
det stämmer — det är den sista öppna resten i 11B.0b som inte är blockerad av något annat.

De står i `SPEC.md` §4, tillagda 2026-08-12, och är **Chris Raroques appar**:
- **Luna** (budgetapp) — för *täta sifferrader på liten skärm*. Den uppfyller dessutom
  11B.0b:s krav på minst en referens **utanför träningsappsgenren**.
- **Ellie** (dagsplanerare) — för *färg, form och rörelse i ljust tema*.

Ellie är den mer akuta av de två: hela paletten byttes till ljust 2026-08-12 och samtliga
nio befintliga referensbilder i `docs/Reference-pics/` samlades **före** det bytet.

⚠️ **En referensmapp utan anteckningar är bara bilder.** 11B.0b säger det uttryckligen: skriv
ner **vad** i varje referens som ska tas efter och **varför**. Det är kravet som gör steg 1
klart, inte att filerna finns.

**Därefter är steg 4 — själva ombyggnaden — nästa riktiga jobb**, och det är stort. Allt
förarbete utom Luna/Ellie är nu gjort.

### Vad som gjordes

Fem commits, i ordning. Ingen av dem är en gissning — grindarna kördes.

| Commit | Vad |
|---|---|
| `888005a` | **12.22 KLAR.** Tankstrecken ur apptexten, 13 strängar |
| `c11a5e6` | **11B.0b steg 3:** semantiken uppmätt mot ljust papper. Tre fel funna |
| `b7ba2cd` | `TASKS.md`: kryssa i 11B.0d, klar sedan 12 augusti men otickad |
| `10e38a2` | **11B.0b steg 3:** väg C vald av Adam. Valet flyttade kravet till kanten |
| `919173e` | **12.28 KLAR.** `IkonTangentbord` ersätter den åttonde emojin |

Detaljerna står i `docs/TASKS.md` och `docs/DESIGN.md` §1b. Upprepas inte här.

### Grindarna — körda efter den sista kodändringen

| Grind | Resultat |
|---|---|
| typecheck | ren |
| lint | 0 fel, 3 kända `react-refresh`-varningar i `icons.tsx` |
| test | **274** i 22 filer |
| build | klart, precache **651,60 KiB** |
| e2e | **60 passed** på 1,2 min |

Dessutom verifierad i appen med `npm run shots -- --15`: tangentbordsikonen renderar som SVG
och ärver textens färg. **Inte bara grönt i tester.**

### Det som faktiskt var värt något

**Tre inventeringar i rad har haft samma fel, och det är ett mönster värt att bära med sig:**
*en inventering ärver sin sökväg, och sökvägen är nästan alltid snävare än problemet.*

1. **12.22** listade 14 strängar. Rad 1 var en JSX-kommentar — inventeringen spårade varje
   träff till rätt fil och rad men läste aldrig **omgivande** rader. Rätt antal: 13.
2. **12.22** påstod att ingen sträng var en knappetikett. `TodayPage.tsx:268` är en. Ingen
   skada, men slutsatsen att 11B.0e:s selektorval "inte byggde in en brytpunkt" var sann av
   tur, inte av konstruktion.
3. **12.28** räknade emoji i `src/ui/`. Tre till renderas från `src/timer/diagnostics.ts`.
   Användaren ser ingen skillnad på var i filträdet en glyf bor. Blev **12.34**.

**Skriv nästa inventering mot hela `src/`, och läs träffen i sitt sammanhang.**

### Färgbeslutet, och en rättelse jag gjorde på mig själv

`DESIGN.md` §0.5 påstod att semantiken *"står kvar oförändrad från §1"*. §1:s värden är Radix
**mörka** skalor. Mot papperet `#F0EBE1` mäter de **1,29–1,77:1**. Gult låg på 1,29:1 och var
i praktiken osynligt.

Två fynd som inte var uppenbara:

- **Radix ljusa steg 11 räcker inte hos oss.** Det är konstruerat för 4,5:1 mot **vitt**;
  vårt papper är mörkare och äter marginalen. Alla tre landar på 3,88–4,39:1. **En kopierad
  palett ärver sitt underlag** — att en skala är "tillgänglighetsgodkänd" säger ingenting
  förrän den mätts mot den bakgrund vi faktiskt använder.
- **Adam valde väg C, och valet ändrade kraven.** Under de andra vägarna bar texten
  betydelsen och kanten var dekorativ. Under C bär kanten den, och då gäller WCAG 1.4.11:
  3:1. Radix steg 8 klarar det inte för någon roll. Detta mättes **efter** beslutet och
  ändrade värdena — kanterna flyttades till steg 10 och 11.

⚠️ **Klargult kan inte bära betydelse mot vitt.** Amber steg 8, 9 och 10 mäter 1,58–2,20:1.
Exakt ett värde duger, steg 11 `#ab6400`, och det är mörk ockra. Kulören lever därför i
**ytan**, inte i kanten. Följd: `warn` får aldrig fylld yta med vit glyf.

**Min egen mockup hade felet den varnade för.** C-kolumnens gula stapel ritades i `#ffc53d`,
1,58:1. Rättad, med felet utskrivet i filen — ett beslutsunderlag som tyst korrigeras är inte
längre ett underlag.

### Adam ifrågasatte kontrastkravet, och han hade rätt

Ordagrant: *"känns lite som att det är ni Claude som har satt vissa principer nu"*.

**Det stämmer.** WCAG AA kom in i `34dc43d`, en planeringscommit från agentsidan, och står i
`PLAN.md` och 11B.7 — aldrig i något Adam bett om. Det han skrev i `SPEC.md` §4 är
*"Minimalistiskt, rena kontraster"*. Steget därifrån till "4,5:1 enligt WCAG AA" togs av en
agent utan att fråga.

**Regeln behålls, men vet varför:** skälet är Adams användning (svettiga ögon, gymbelysning,
telefon som sänker ljusstyrkan i värme), och 4,5:1 är bara ett mätbart ombud för det. Kravet
band dessutom nästan ingenting — väg C landar på 15–16:1 för text. Det enda standarden dödade
var klargula linjer mot vitt, som är svåra att se på riktigt och inte bara på pappret.

**Om den någon gång kostar något Adam bryr sig om: lätta på den. Det är hans app.**

### Öppet, och som kräver ett beslut

⚠️ **`11B.0c` har två slutvillkor som motsäger varandra.** Uppgiften säger på ett ställe att
*"det som gör 0c klar är ikonfilerna, registerposten och att de sju glyferna ovan är borta"* —
allt det är uppfyllt. Men det formella **"Klart när"** säger *"noll emoji återstår i
`src/ui/`"*, och 🏋 i `ExerciseCard.tsx` står kvar. Den är **medvetet** uppskjuten: den ska
inte ersättas av en ikon utan raderas med hela rutan när B4:s accentbricka byggs i steg 4.

**Rekommendation:** skriv om "Klart när" så att 🏋 uttryckligen undantas och pekas till steg 4,
och kryssa i 0c. Uppgiften är i praktiken färdig och blockerar inget. **Gjordes inte här** —
att ändra ett slutvillkor är ett beslut, inte bokföring, och det hörde inte till någon av
sessionens commits.

**`11B.0b` kan inte kryssas i än:** steg 1 saknar Luna och Ellie, och steg 3:s ikondel pekar
på 0c ovan.

### Inte verifierat

- **Ingenting av det ljusa temat finns i koden.** `src/index.css` är fortfarande hela det
  mörka temat från 5 augusti. Färgerna lever bara i `DESIGN.md` tills steg 4 körs.
  Skärmdumpen i sessionen visar mörkt tema med lime — det är väntat, inte en bugg.
- **Ingen av de nya färgerna är sedd på en riktig skärm.** De är uppmätta, inte upplevda.
  Mockupen är ritad på en datorskärm, inte i gymbelysning.
- **12.34 är inte påbörjad.** Fixen kräver att `summarise()` returnerar ett läge i stället för
  en färdig mening, alltså en gränssnittsändring mellan logik och vy.

### Miljö

**Node finns inte installerat på jobbdatorn** men den portabla från en tidigare session låg
kvar och användes: `…\07443bf8-…\scratchpad\node-v22.23.2-win-x64`. **Ingen nedladdning
behövdes.** Skrapkataloger städas, så nästa session kan behöva hämta om den — se
`jobbdatorn-klarar-alla-grindar` i minnet för hur.

⚠️ **`preview_start` fungerar inte här** — `npm` ligger inte på förhandsvisningens PATH när
Node är portabel. Använd `npm run shots` i stället; det är projektets eget verktyg och
fungerade utan problem.

**e2e är 60 tester, inte 36.** Sviten växte med 12.20. Minnesanteckningen säger 36 och är
gammal på den punkten.

### Föreslagna skills för nästa session

- **`/research`** för Luna och Ellie. Referensinsamling är att leta upp och läsa primärkällor
  (Raroques videor och skärmbilder), vilket är precis vad den är till för. Resultatet ska bli
  anteckningar om *vad och varför*, inte bara filer.
- **`/grill-me`** innan steg 4 startar. Det är den största kodändringen i projektet, och 11B
  har redan visat sig vara halvbyggt en gång när ingen grillade först.
- **`/code-review`** efter steg 4:s första skärm — inte efter hela ombyggnaden.

---

## 2026-08-13 (natt) — 12.32 KLAR. Sökningen hittade något, tvärtemot vad den gissade — DELVIS ÖVERSPELAD

> ⚠️ **ÖVERSPELAT: kandidatlistan under "Börja här" och antalet strängar i 12.22.**
> 12.22 är **gjord** 2026-08-14, och sektionen ovanför beskriver den som nästa jobb.
> Dessutom sa den *"14 strängar listade"* — **rätt antal är 13.** Rad 1 i inventeringens
> tabell var en JSX-kommentar, inte renderad text. Se sektionen överst.
> **Substansen om 12.32 och 12.33 står kvar oförändrad.**

### ✅ Pushat. Börja med `git pull`

`25e88e9..33aace6` gick till `origin/main` vid sessionens slut, och `git status -sb` svarade
`## main...origin/main` utan `ahead`. **Allt nedan finns alltså på den andra maskinen** —
hämta det med `git pull` innan du gör något annat.

Båda commitsen rör bara `docs/`, så pullen kan inte krocka med kod du har lokalt.

### Börja här

Kort session (~1 h), och den gjorde **en** sak: `docs/TASKS.md` 12.32. Ingen kod ändrades.

Kandidater härnäst, i den ordning jag skulle ta dem:

1. **12.22 textstädningen** — fortfarande det bästa korta jobbet. Inventeringen är stängd:
   14 strängar listade med fil, rad och renderingsväg, och de två testerna som låser texten
   är utpekade. Mekaniskt arbete med känd botten.
2. **12.33** (ny, se nedan) — härdning av `fångaKonsolfel`. Liten diff, men **den ändrar
   vakt 6 och kräver sabotageprövning om**. Inte en svans på en kort session.
3. **12.31** — ren omdöpning av `IMPORTERAT_SET`, en fil.
4. **Vakt B** — egen session.

### Vad som gjordes

**12.32 var §7.1-sökningen som aldrig gjordes före `e2e/hjalpare.ts`.** Resultatet står i
`docs/EXTERNT.md` under *Övervägt och uppskjutet* → *"Hjälpare för e2e-sviten"*, med tabell
över fyra kandidater. Läs den, inte den här filen, för detaljerna. **Inget infört, noll nya
poster i `package.json`.**

| Commit | Vad |
|---|---|
| `a6b1da9` | 12.32 stängd, 12.33 utbruten. `EXTERNT.md` + `TASKS.md`, 98 tillagda rader |

### Det som faktiskt var värt något

Uppgiften förutspådde sitt eget svar: *"slutsatsen blir med all sannolikhet inget som
passar"*. **På sådden stämde det. På konsolfelsfångsten gjorde det inte det.**

`fångaKonsolfel` (`e2e/hjalpare.ts:316`) bygger för hand det Playwright har inbyggt sedan
**1.56**: `page.consoleMessages()` och `page.pageErrors()`. **Verifierat i typerna för den
version vi faktiskt kör** — `node_modules/playwright-core` är `1.62.1`, och metoderna står i
`types/types.d.ts:2361` respektive `:3933`. Inte hämtat ur en dokumentationssida.

Vinsten är inte färre rader. De inbyggda är **retroaktiva** (upp till 200 senaste), så
hjälparens dokumenterade fälla — *"MÅSTE ANROPAS FÖRE FÖRSTA `goto`"* — upphör att finnas.
Utbrutet till **12.33** i stället för att fixas direkt, eftersom det ändrar en vakt.

⚠️ **Lärdomen är metodmässig och gäller nästa gång §7.1 känns som en formalitet:** en sökning
vars svar man tror sig veta är precis den som inte blir gjord. Den här kostade ~30 minuter och
hittade en plattformsprimitiv vi redan betalade för. **Att gissa rätt är inte samma sak som
att ha letat.**

### Licensfyndet, som är värt att minnas som mönster

`playwright-indexeddb` deklarerar `MIT` i sin `package.json` — men repot
`vrknetha/playwright-indexeddb` har **ingen `LICENSE`-fil** (`gh api …/license` ger 404), och
npm-posten saknar `repository`-fält, så kopplingen mellan paketet och repot vilar bara på
namnet. §7.2b gör det till *alla rättigheter förbehållna*.

**Ett `license`-fält i `package.json` är inte en licens.** Det är en rad vem som helst kan
fylla i; en licens är en text med en upphovsrättsinnehavare. Registret har redan rätt vana
inskriven på två ställen (*"licens verifierad direkt mot repot, inte ur sökträffar"*) — det
här är fallet som visar varför den vanan finns.

### Grindarna — INTE KÖRDA, och det är avsiktligt

| Grind | Utfall |
|---|---|
| samtliga fem | **inte körda denna session** |

Ändringen rör **bara `docs/`**. Ingen `.ts`, `.tsx`, `package.json` eller migration. Det finns
alltså inget för grindarna att pröva som de inte redan prövade i `25e88e9`.

⚠️ **Siffrorna som gäller är fortfarande sektionen nedanför:** 274 tester, 60 e2e, bygge
651,20 KiB. **De är ärvda, inte uppmätta i dag.** Rör du kod härnäst — kör om dem först, så
att du vet att du står på grönt innan du börjar.

### Om maskinen

Sessionen kördes på **hemdatorn**. `node --version` → **v24.16.0**, `npm` → **11.13.0**.
Hela stycket om portabel Node i sektionen nedan är alltså irrelevant här — men det gäller
fortfarande jobbdatorn, så det står kvar oförändrat. **Kör `node --version` först, som
sektionen nedan redan säger.**

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/handoff`** | Vid nästa sessionsslut. Den här filen är projektets minne |
| **`/tdd`** | Om **12.33** tas. Vakt 6 ska bli röd på rätt rad innan den blir grön — sabotaget är själva uppgiften, inte en efterkontroll |
| **`/code-review`** | Om **12.22** tas. 14 strängar över 9 filer är precis den sortens spridd ändring där en axel missar en förekomst |
| **`/diagnosing-bugs`** | Bara om något faller. Begär utskriften först — gissa inte |

⚠️ **`/research` behövdes inte och togs medvetet inte in.** 12.32 var riktad mot tre
konkreta kandidatklasser, och passformsbedömningen krävde att `hjalpare.ts` låg framme.
Ett separat forskningsdokument hade dessutom dubblerat `EXTERNT.md`, som redan **är**
registret för just den frågan. Nästa gång §7.1-sökningen är bred snarare än riktad är
avvägningen den omvända.

---

## 2026-08-13 (kväll) — 12.20 KLAR. Alla sex vakterna byggda, granskade och sabotageprövade — DELVIS ÖVERSPELAD

> **⚠️ Två saker i sektionen nedan gäller inte längre.**
>
> **(1) Pushstatusen.** Raden *"✅ Pushat till `origin/main` vid sessionens slut"* stämde när
> den skrevs. **En nyare commit (`a6b1da9`) ligger osänd** — se sektionen överst.
>
> **(2) Kandidatlistan under "Börja här".** Punkt 3 pekar ut *"12.30–12.32"* som öppna.
> **12.32 är stängd** sedan 2026-08-13 (natt). 12.30 och 12.31 är fortfarande öppna, och en
> **ny 12.33** har tillkommit ur 12.32:s sökning.
>
> Allt annat i sektionen — grindsiffrorna, lärdomen om sabotage, Node-stycket — gäller
> oförändrat.

### Börja här

**12.20 är stängd.** Nästa uppgift är inte given av den här sessionen — välj ur `docs/TASKS.md`.
Naturliga kandidater i tur och ordning:

1. **12.22 textstädningen.** Den var uttryckligen inbokad *efter* 12.20, och ordningen är nu
   uppfylld. Inventeringen är redan gjord; kvar är ren redigering av 14 strängar.
2. **Vakt B** (skärmen renderar och får plats) — beslut 8 och 9 i 11B.0e, alltså nästa steg i
   den plan 12.20 tillhörde.
3. **12.30–12.32**, de tre fynden den här sessionens granskning bröt ut. Alla låg prioritet.

### Vad som gjordes

Vakt 4 (passlistan, 13.3) och vakt 5 (`FÖRRA`-kolumnen, 13.4) byggdes, och därefter kördes den
`/code-review` av **alla sex** vakterna som Adam begärde. Detaljerna per vakt står i
`docs/TASKS.md` under 12.20 — läs den, inte den här filen.

| Commit | Vad |
|---|---|
| `13d383a` | Selektorfästen i `SetRow` och `ExerciseCard` |
| `3ee4e26` | `hämtaÖvningar` och `seedaPassRått` i hjälparen |
| `822e444` | **12.20 vakt 4** |
| `590f189` | **12.20 vakt 5** (5a och 5b) |
| `69aacb9` | `HistoryPage`: namn på de två listorna |
| `622f1be` | **Åtgärder ur granskningen** |
| `3715fc1` | `TASKS.md`: 12.20 stängd, tre fynd utbrutna |
| `c72c8bc` | Eftervillkor assertade i `startaPass` och reps-förvalet |

✅ **Pushat till `origin/main` vid sessionens slut**, efter att Adam bett om en genomgång först.
Genomgången gjordes, två eftervillkor stramades åt som följd (`c72c8bc`), och alla fem
grindarna kördes om gröna innan push.

### Grindarna — siffror från körningar

| Grind | Utfall |
|---|---|
| `typecheck` | ren |
| `lint` | **0 fel**, 3 kända `react-refresh`-varningar i `icons.tsx` |
| `test` | **274 passed** i 22 filer |
| `e2e` | **60 passed** (51 vid sessionens början) |
| `build` | 9 poster, 651,20 KiB |

### Lärdomen: sabotaget hittade ett fel i vakten, inte i koden

Den viktigaste behållningen den här gången kom inte ur granskningen utan ur **sabotageprövningen
av vakt 4** — och den prövade vakten, inte appen.

Vakten föll som väntat, men **på sitt ankare i stället för på sin negation**. Skälet:
Playwrights `hasText` matchar **delsträngar**, och `180 kg` innehåller `80 kg`. Ankaret träffade
två rader och dog på strict mode. Att bara byta siffror hade lämnat fällan kvar åt nästa person
som rör talen, så negationen räknar nu **rader i passlistan**. Ett antal är en identitet; en
delsträng är en gissning.

Samma sak i mindre skala i vakt 5b: den blev röd av sabotage, men i **uppsättningen** — det
importerade setet fanns redan när pass 1 skapades, så planen förifylldes och hjälparen dog innan
påståendet mättes. Sådden flyttades efter det app-loggade setet.

⚠️ **Regeln som faller ut:** *att en vakt blir röd räcker inte — den ska bli röd på rätt rad.*
Läs felmeddelandet under sabotaget. Pekar det på en hjälpare eller på uppsättningen är
påståendet fortfarande oprövat, och du vet mindre än du tror.

### Vad granskningen hittade

Båda axlarna kördes mot fixpunkt `b7cb126`, och **båda flaggade oberoende av varandra samma
svaghet i vakt 4:s ankare** — det starkaste skäl som finns att tro på ett fynd. Det tyngsta
fyndet var dock spec-axelns: **vakt 4 bröt mot beslut 6** genom att seeda det vanliga passet
rått, så `isImported: false` kom ur testets egen fixtur i stället för ur `startWorkout`. Vakten
mätte sig själv. Åtgärdat — passet skapas nu genom appen.

Standards-axeln påstod dessutom att sabotageprövningen för vakt 4 och 5 *saknades*. Det var
felformulerat: den var gjord, men bara redovisad i commitmeddelanden. Numera står den i
`TASKS.md`.

### Ett dokumentfel som hade lurat nästa session

`TASKS.md` påstod att *"vakt 4 och 5 går via `workouts` och kräver ett riktigt seedat pass"*.
Halva påståendet var fel: `getLastPerformance` läser **bara** `loggedSets`. Rättat, med skälet
utskrivet — ett dokument som anger fel grund får nästa agent att tro att kravet är uppfyllt av
fel anledning, och då försvinner det verkliga kravet ur synfältet.

### Om arbetssättet

⚠️ **KOLLA VILKEN MASKIN DU SITTER PÅ INNAN DU GÖR NÅGOT AV DETTA.** Sessionen 2026-08-13
avslutades på jobbdatorn, och nästa var planerad till hemdatorn. Råden nedan gäller **bara den
maskin som saknar Node** — kör `node --version` först. Svarar den med ett versionsnummer är hela
stycket irrelevant, och att följa det ändå är bortkastade minuter.

**På en maskin utan Node hämtas den portabelt** (~2 min): zip från
`nodejs.org/dist/latest-v22.x/`, SHA256 mot `SHASUMS256.txt`, uppackning i skrapkatalogen,
`$env:PATH` satt i *varje* anrop eftersom den inte överlever mellan PowerShell-anrop. Gjordes
igen i dag och stämde. Inget lämnas kvar på arbetsgivarens maskin, vilket är hela poängen där.
**På hemdatorn görs ingenting av detta** — där är `npm run …` bara att köra.

⚠️ **PowerShell-fällan som kostade två omtag:** en here-string (`@'…'@`) med **dubbla
citattecken** i texten bröts sönder och `git commit` tolkade orden som sökvägar. Undvik `"` helt
i commitmeddelanden. Gäller PowerShell, alltså båda Windows-maskinerna — inte ett Bash-skal.

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/code-review`** | Fungerade bevisligen igen. Kör den på varje omgång vakter — två axlar som oberoende pekar på samma rad är den billigaste sanning som finns |
| **`/tdd`** | Om vakt B tas härnäst. Sömmarna är beslutade i 11B.0e beslut 8 |
| **`/diagnosing-bugs`** | Bara om något faller. Begär utskriften först — gissa inte |

---

## 2026-08-13 — Jobbdatorn duger. Övningssidan färdigbevakad, fyra av sex vakter klara — DELVIS ÖVERSPELAD

> **⚠️ Två saker i sektionen nedan gäller inte längre.**
>
> **(1) "Nästa uppgift är vakt 4 och 5" är avklarat.** Båda är byggda, granskade och
> sabotageprövade. 12.20 är stängd. Se sektionen överst.
>
> **(2) Den begärda `/code-review` av alla sex vakterna är GJORD.** Sektionen nedan säger att
> den *"inte är gjord ännu och ska inte glömmas"* — den kördes 2026-08-13 (kväll) mot fixpunkt
> `b7cb126`, och dess fynd är åtgärdade eller utbrutna till 12.30–12.32.
>
> **(3) Pushstatusen nedan gäller inte längre.** Den säger att allt är pushat, vilket stämde när
> den skrevs. Sju nyare commits ligger osända — se sektionen överst.

### Börja här

**Nästa uppgift är vakt 4 och 5 i 12.20.** Statustabellen med alla sex vakterna ligger i
`docs/TASKS.md` under 12.20 — läs den, inte den här filen, för detaljerna.

⚠️ **Adam har begärt en `/code-review` av alla sex vakterna när de är skrivna.** Den är alltså
inte gjord ännu och ska inte glömmas. Vakt 1–3 och 6 har redan granskats en gång var (se
nedan), men helheten är inte sedd.

### Det viktigaste resultatet: jobbdatorn kan köra allt

Förra sektionens råd — *"12.20 hör hemma i en hemmasession"* — var fel, och det kostade
troligen en dags planering. **Alla fem grindarna kördes gröna på jobbdatorn**, e2e inräknat.

Skälet är att allt tungt redan låg på maskinen: `node_modules` komplett (18 230 filer, 0,2 GB,
93 verktyg i `.bin`) och Playwrights WebKit-binär cachad i `%LOCALAPPDATA%\ms-playwright`.
**Det enda som saknades var Node-körningen.**

Så här hämtas den — Adam godkände tillvägagångssättet, ingen installation, inget
administratörskonto:

1. Hämta `node-vXX-win-x64.zip` från `https://nodejs.org/dist/latest-v22.x/` (~34 MB).
2. **Verifiera SHA256 mot `SHASUMS256.txt` i samma katalog.** Gjordes 2026-08-13 och stämde.
3. Packa upp i skrapkatalogen, lägg `...\node-vXX-win-x64` först i `$env:PATH`.
4. **`$env:PATH` överlever inte mellan PowerShell-anrop** — sätt den i *varje* kommando.

Skrapkatalogen städas, så nedladdningen görs om varje ny session (~2 min). Inget lämnas kvar
i Windows, vilket var hela poängen på en arbetsgivares maskin.

### Vad som gjordes — tio commits, INGEN pushad

✅ **Allt är pushat.** `HEAD` = `origin/main` = `61459b9`, kontrollerat efter en färsk `fetch`
vid sessionens slut. Arbetsträdet rent.

Tabellen nedan listar de tio commits som utgör själva arbetet. Därefter följde fyra
dokumentcommits: `836371a` (granskningen noterad), `1b7b09a` (den här överlämningen) och
`c341080` + `61459b9` (städning av kvarlämnade 🆕-markörer i den här filen).

| Commit | Vad |
|---|---|
| `709293f` | 12.22-inventeringen stängd, 14 strängar avgjorda |
| `4a68210` | Granskningsfynden ur `7bd43b5`/`05c21b7` som 12.25–12.29 |
| `20fef91` | **12.25 löst** |
| `b2ba6cd` | `e2e/hjalpare.ts` utbruten (ren refaktorering) |
| `1b7cd54` | 12.20 vakt 1 och 3, `role="note"` |
| `a211815` | Tre hål ur andra granskningen + **12.27 löst** |
| `f247a91` | **12.26 löst** |
| `a6697dd` | `TASKS.md`/`HANDOFF.md` synkade med koden |
| `5e2eb3d` | 12.20 **vakt 2** |
| `4b59905` | 12.20 **vakt 6**. Övningssidan färdigbevakad |

### Grindarna — siffror från körningar, inte uppskattningar

| Grind | Utfall vid sessionens slut |
|---|---|
| `typecheck` | ren |
| `lint` | **0 fel**, 3 kända `react-refresh`-varningar i `icons.tsx` |
| `test` | **274 passed** i 22 filer |
| `build` | klart, precache 9 poster, 651,07 KiB |
| `e2e` | **51 passed** (36 vid sessionens start) |

### Lärdomen som återkom tre gånger: gröna tester som inte mäter något

Det här är sessionens viktigaste tekniska fynd, och det dök upp i tre skilda skepnader:

1. **`test.fail()` täckte hela testkroppen**, alltså även uppsättningen (12.25).
2. **Vakt 3b var ankrad i fel query.** Sidan har två oberoende `useLiveQuery` — rubriken ur
   `db.exercises.get`, notisen ur `getExerciseHistory` med startvärde `[]`. Rubriken bevisade
   ingenting om historikfrågan.
3. **Vakt 6 behövde två lyssnare.** Ett okastat undantag dök upp **bara** som `pageerror`,
   aldrig som `console.error`.

⚠️ **Motmedlet är obligatoriskt för vakt 4 och 5:** skriv vakten, sabba sedan koden med flit
och **kontrollera att den blir röd**. Varje vakt hittills är prövad så, och sabotagen står
listade per vakt i `TASKS.md`. En vakt som ser grön ut utan att kunna larma är värre än ingen.

### Två fällor som väntar på vakt 4 och 5

1. **`IMPORTERAT_SET` duger inte.** Dess `workoutId` pekar på ett pass som aldrig skapas.
   Ofarligt för `getExerciseHistory`, som aldrig slår upp passet — men vakt 4 (13.3,
   `listWorkoutSummaries`) och vakt 5 (13.4, `getLastPerformance`) går via `workouts` och
   kräver ett **riktigt seedat pass**. Villkoret står i `e2e/hjalpare.ts` (12.27).
2. **Blandfallet är oprövat.** Beslut 6 i 11B.0e kräver att det vanliga setet skapas **genom
   appen, som en riktig användare**. Ingen vakt gör det ännu. Det avgörs i vakt 5.

### Om arbetssättet

**Två `/code-review` kördes, och båda hittade verkliga fel** — den andra hittade ett fel jag
själv infört samma dag (returvärdet från `seedaRått` kastades bort i test 2, timmar efter att
jag lagat exakt samma sak i test 1). Granskningen är inte en formalitet i det här projektet.

**Tekniska frågor ska inte gå till Adam.** Han sa igen att det blir för tekniskt. Två frågor
lades fram som hans beslut och var det inte — de avgjordes och redovisades i stället, vilket
fungerade. Frågor går till honom bara när de rör hans data, hans tid eller hans prioritering.
Beslutet att packa upp Node på arbetsgivarens maskin var en sådan, och den frågan var rätt.

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/tdd`** | För vakt 4 och 5. Sömmarna är beslutade i 11B.0e, och slingan sitter — röd först, sedan minsta möjliga kod, sedan sabotage |
| **`/code-review`** | **Begärd av Adam när alla sex vakterna är skrivna.** Fixpunkt `b7cb126` täcker hela arbetet |
| **`/diagnosing-bugs`** | Bara om något faller. Begär utskriften först — gissa inte |

---

## 2026-08-12 (kväll) — Grindarna gröna. 11B.0e avgjord och sådden bevisad — DELVIS ÖVERSPELAD

> **⚠️ Två saker i sektionen nedan gäller inte längre.**
>
> **(1) Hela stycket "Börja här — och läs detta först om du sitter på jobbdatorn" är
> motbevisat.** Påståendet *"Går inte att göra där"* och rådet *"12.20 hör hemma i en
> hemmasession"* byggde på en halv undersökning: verktygen saknades, men **beroendena och
> Playwrights webbläsarbinär låg redan på disk**. Hela 12.20:s första fyra vakter byggdes på
> jobbdatorn 2026-08-13 med alla fem grindarna gröna. Se sektionen överst.
>
> **(2) Test 2 i `sadd-provning.spec.ts` använder inte längre `test.fail()`** — se den
> flaggade rutan längre ner i sektionen, och uppgift 12.25.

### Börja här — och läs detta först om du sitter på jobbdatorn

**Nästa uppgift är 12.20: de sex vakterna.** Den kräver att `npm run e2e` körs.
**Jobbdatorn saknar Node, npm, Python och `gh`** — verifierat i förra sessionen. **Går inte att
göra där.** Skriver du testkod på jobbet blir den overifierad, vilket är exakt det
`CLAUDE.md` regel 5 förbjuder att kalla klart.

**Det som DÄREMOT går på jobbdatorn:** läsa och skriva dokument, planera vakternas påståenden,
granska `e2e/sadd-provning.spec.ts` för hand, eller ta 12.22 (textstädningen) som ren
redigering — men den kan inte heller stängas utan grindkörning.

⏰ **Ärligast:** 12.20 hör hemma i en hemmasession. Blir det jobbdatorn imorgon, välj
dokumentarbete och lämna kodningen.

### Vad som gjordes — tre commits, alla pushade till `origin/main`

| Commit | Vad |
|---|---|
| `d9ca9d4` | 11B.0e avgjord. 12.20:s falska skäl utbytt, 12.22:s omfång rättat |
| `afad59a` | 12.23 och 12.24 — två hål grillningen blottade |
| `05c21b7` | Såddprövningen körd. `e2e/sadd-provning.spec.ts` |

Arbetsträdet var rent vid sessionens slut. `HEAD` = `origin/main` = `05c21b7`, kontrollerat
efter en färsk `fetch`.

### Grindarna kördes, och de förra sessionens risk höll

Förra sektionen sa *"inget i den här sessionen är verifierat av dem"*. **Nu är det gjort.**

| Grind | Vid sessionens start | Vid sessionens slut |
|---|---|---|
| `test` | 274 tester, 22 filer ✅ | oförändrat |
| `typecheck` | ren ✅ | ren ✅ |
| `lint` | **0 fel**, 3 varningar | oförändrat |
| `build` | ✓ 6,68 s | ej omkörd (inga src-ändringar) |
| `e2e` | 30 passed ✅ | **36 passed** ✅ |

**Risken som pekades ut höll.** `src/ui/icons.tsx` gick genom `tsc` utan anmärkning. Kvar är
tre `react-refresh/only-export-components`-**varningar** (rad 90, 101, 128) — de rör HMR, inte
körkod, och lint går grönt.

⚠️ **Fraunces är i repot men INTE inkopplad.** Ingen `@font-face` i `src/index.css` och
typsnittet syns inte i `dist/`. Det är väntat — det hör till steg 4 — men förra sektionen kan
läsas som att det vore gjort. Det är det inte.

### 11B.0e är AVGJORD. Hela beslutet står i `TASKS.md`, inte här

Grillad i fyra rundor, godkänd av Adam. **Läs 11B.0e i `docs/TASKS.md`** — beslutstabellen med
nio rader ligger där. Sammanfattat: två vakter (layout respektive data), e2e som fordon för
båda, 12.20 skrivs **före** ombyggnaden, alla sex vakterna, `role` + tillgängligt namn som
selektorer.

**Grillningen välte tre påståenden. Alla tre är rättade i `TASKS.md`:**

1. **Vägskälet var inget vägskäl.** `repo.ts:156` hårdkodar `isImported: false`, och `true` kan
   bara komma in via synken (`wire.ts:37`). Ett importerat set går alltså **inte** att skapa
   genom att klicka i appen. Alternativet "seeda genom UI:t" existerade aldrig för punkt 3–5.
2. **12.20:s bärande skäl mot komponenttester var falskt.** `fake-indexeddb` importeras av nio
   testfiler och kör riktig Dexie i node — ett komponenttest hade inte mätt någon attrapp.
   Slutsatsen (e2e) står kvar men på ett annat skäl: layout kräver riktig renderingsmotor.
3. **12.22 är fyra gånger större än den påstod.** Minst sju strängar till, alla brödtext.

### Såddprövningen: metoden håller, och risken var verklig

`e2e/sadd-provning.spec.ts`, båda påståendena mätta:

| | Utfall |
|---|---|
| Sådd rått i IndexedDB → **färsk navigering** → sidan visar raden | ✅ grönt på alla tre bredder, ~4–5 s |
| Sådd medan sidan **redan är öppen** | ❌ når aldrig fram |

**Fallbacken behövs inte.** Inget såddinsläpp, ingen byggflagga, noll ny kod i appen.

⚠️ **Regeln som måste följa med till 12.20:** varje test **måste** seeda först och navigera
sedan. `useLiveQuery` ser bara skrivningar genom Dexies eget API. Hoppas det över står sidan
tom, och felet läser som en trasig läsväg i stället för en utebliven uppdatering.

⚠️ **ÖVERSPELAT 2026-08-13 (uppgift 12.25). `test.fail()` finns inte längre i filen.**
Larmet gäller fortfarande men bärs av ett vänt påstående i ett vanligt grönt test.
`test.fail()` täckte hela testkroppen, alltså även uppsättningen: gick uppsättningen sönder
rapporterades testet ändå som förväntat rött, alltså grönt i sviten. Se 12.25 i `TASKS.md`.

Test 2 ligger kvar som `test.fail()` i stället för att raderas — påståendet är en mätning av
systemets beteende, och börjar det plötsligt lyckas blir körningen röd.

**Hjälparna `hämtaÖvning` och `seedaRått` finns redan i filen.** 12.20 börjar inte från noll.

### Två saker om arbetssättet som nästa session bör veta

- **`/handoff` anropades inte som skill.** Den projektlokala i `.claude/skills/handoff/` lästes
  och följdes för hand, eftersom förra sessionen dokumenterade att den **globala** fyrade i
  stället. Orsaken är fortfarande outredd. ⏰ Står kvar som öppen fråga.
- **Adam sa tre gånger att han inte kan bedöma teknisk struktur.** Grillningen ställdes om efter
  det: tekniska val avgjordes av mig och redovisades, och bara det som var genuint hans — hans
  data, hans tid, hans prioritering — gick till honom som frågor. **Det fungerade bättre.** Två
  av hans inlägg ändrade designen: frågan *"finns det några nackdelar"* tvingade fram
  `useLiveQuery`-risken, och *"testerna får inte ge felaktiga svar"* är skälet till att bara det
  importerade setet seedas rått.

  Han påpekade också, med rätta, att **haken borde ha stått i förslaget från början** i stället
  för att grävas fram när han frågade. Lägg fram alternativ med sina nackdelar redan mätta.

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/tdd`** | För 12.20. Sömmarna är nu överenskomna och godkända, vilket var villkoret 11B.0e satte. Först nu är den rätt verktyg |
| **`/code-review`** | `7bd43b5` (ikonerna) är fortfarande ogranskad, och grindarna är nu gröna på den. Lägg `05c21b7` till samma granskning |
| **`/diagnosing-bugs`** | Bara om något faller. Begär utskriften först — gissa inte |

---

## 2026-08-12 (eftermiddag) — Fraunces och ikonerna i hus. Grindarna kunde INTE köras — DELVIS ÖVERSPELAD

> **⚠️ Tre saker i sektionen nedan gäller inte längre.** **(1)** *"Kör grindarna först. Inget i
> den här sessionen är verifierat av dem"* — grindarna är körda 2026-08-12 (kväll) och alla var
> gröna; risken i `src/ui/icons.tsx` höll. **(2)** *"Nästa uppgift: 11B.0e, och den är ett
> riktigt vägskäl nu"* — 11B.0e är **avgjord**, och vägskälet visade sig ha ett ben som inte
> ledde någonstans (`repo.ts:156`). **(3)** Uppmaningen att ta om sömvalet från början är
> utförd. Resten av sektionen — mätningarna av Fraunces, ikonbytet, de tre rättelserna —
> gäller oförändrat.

### Börja här

**Kör grindarna först. Inget i den här sessionen är verifierat av dem.**

```
git pull && npm run test && npm run typecheck && npm run lint && npm run build && npm run e2e
```

Sessionen kördes på **jobbdatorn, som saknar Node, npm, Python och `gh`** — verifierat, inte
antaget: `node --version` ger "not recognized", och `node.exe` finns inte under
användarprofilen. Adam fortsätter hemma. Fyra commits är pushade till `origin/main`
(`b47c89d`, `08e8f42`, `7bd43b5`, `e2554b2`) och arbetsträdet var rent vid sessionens slut.

**Riskerna sitter i `7bd43b5`**, den enda commiten med riktig komponentkod. Faller något är
det troligast typerna i `src/ui/icons.tsx`, som aldrig gått genom `tsc`.

### Vad som gjordes — detaljerna bor i commit-meddelandena, inte här

| Commit | Vad |
|---|---|
| `b47c89d` | Fraunces som fil, OFL-1.1, registrerad i `EXTERNT.md` |
| `08e8f42` | Ikonjämförelsen `docs/mockups/11b-ikoner.html` + rättad kartläggning |
| `7bd43b5` | **Tabler valt av Adam.** Nio ikoner i `src/ui/icons.tsx`, sex glyfer ersatta |
| `e2554b2` | 12.20: två påståenden rättade mot repot |

**Fas 11B:s två första blockerare är därmed borta.** Fraunces ligger i
`src/assets/fonts/fraunces-var-latin.woff2` (67 304 byte, latin, axlarna `opsz` 9–144 och
`wght` 400–700) med `OFL.txt` bredvid sig, eftersom OFL kräver att licenstexten följer med
fontfilen och inte bara med registerposten.

### Vad som är verifierat, och exakt hur

- **Fraunces mättes i webbläsaren på vår egen fil**, inte på mockupens Google-kopia: `wght`
  lever (400 → 354,08 px, 700 → 382,03 px), `opsz` lever (9 → 381,84 px, 144 → 316,19 px), och
  `"111"` mäter 64,88 px mot `"000"` 95,55 px. Det sista **bekräftar 11B.2-fyndet på den fil
  som ska användas**: Fraunces saknar tabulära siffror och sätter därför bara rubriker.
- **Ikonbytet är INTE verifierat av grindarna.** Kontrollerat för hand i stället: det finns
  **noll komponenttester** (samtliga `*.test.ts` ligger i `db`, `lib`, `parser`, `sync`, `ai`,
  `timer`), och båda e2e-specarna väljer på roll och tillgängligt namn — inte på `✓`, `←`, `→`
  eller `⋯`. Det är ett argument för att de håller, **inte ett bevis**. De har inte körts.

### Tre rättelser, och den mellersta är den lärorika

1. **"Tabler ritar tyngre" var fel.** Påståendet byggde på **filstorlek** och presenterades som
   en mätning. Uppmätt med `getTotalLength()` över varje geometri, vid identisk
   `stroke-width="2"`, drar Tabler **441 enheter mot Lucides 470** — alltså 6 % *mindre* linje.
   Skillnaden i filstorlek kommer från metadatakommentaren överst i Tablers filer och den
   radbrutna attributformateringen. **Proxymått är inte mätningar.**
2. **12.20 påstod att `jsdom` saknades.** Det ligger redan i `package.json` (`^28.0.0`) och
   används av ingenting — `vite.config.ts:63` sätter `environment: 'node'` och ingen fil
   åsidosätter det. ⏰ **Oanvänt beroende, värt en egen städuppgift.**
3. **12.20 påstod att sådd via `page.evaluate()` var ett bevisat mönster.** Alla fyra
   `evaluate()`-anropen i `e2e/` är avläsningar — mått, scroll, overflow. `bottenark` såddar
   genom att **klicka sig genom UI:t**. 13.5 var en handpåläggning mot dev-servern.

### Nästa uppgift: 11B.0e, och den är ett riktigt vägskäl nu

Rättelse 3 ändrade uppgiften. Valet står mellan att **seeda genom UI:t**, som `bottenark`
redan gör och som kräver noll nya sömmar, och att **bygga ett såddinsläpp** — vilket är en
skrivväg rakt in i användarens databas och måste gränsas av en byggflagga, annars följer den
med produktionsbundlen (`CLAUDE.md` regel 4).

**Ett förslag lades fram och ska inte behandlas som avgjort.** Det argumenterade för ett
såddinsläpp som "enda söm", på en premiss som visade sig oriktig, och avfärdade `data-testid`
utan att nämna motargumentet: våra tillgängliga namn **är** svensk apptext, och **12.22 är en
öppen uppgift som ska ändra apptext**. Textkopplade selektorer har alltså en inbokad
brytpunkt. Ta om beslutet från början.

⏰ **Gör det inte i en tjugominuterslucka.** Det formar hela steg 4, och projektets dyraste
misstag — lime — var ett grundbeslut fattat snabbt.

### Två saker om verktygen som nästa session bör veta

- **`/handoff` fyrade av den globala skillen**, inte projektets: basmappen blev
  `~\.claude\skills\handoff`, vars text säger "spara i OS:ets temp-katalog". Det är exakt den
  mening projektkopian i `.claude/skills/handoff/` bytte ut. Den här filen skrevs enligt
  **projektets** version, eftersom `CLAUDE.md` regel 5 går före. ⏰ Värt att reda ut varför
  den projektlokala inte vann.
- **Webbläsarpanelen fungerar utan dev-server.** `preview_start` med en `file://`-adress
  renderar en fristående HTML-fil, och skript körs. Det var så både typsnittet och
  linjelängderna mättes utan Node. Beskärande `zoom` stöds däremot inte.

### Suggested skills

| Skill | När, och varför just den |
|---|---|
| **`/grilling`** | **Före** 11B.0e. Sömvalet är ett grundbeslut med ett äkta vägskäl och ett förslag som redan visat sig vila på fel premiss. Det ska motsägas innan något skrivs, inte efteråt |
| **`/code-review`** | Efter att grindarna körts grönt på `7bd43b5`. Den enda commiten med komponentkod, och den är oreviderad |
| **`/diagnosing-bugs`** | Bara om grindarna faller. Begär utskriften först — gissa inte |
| **`/tdd`** | Efter att 0e:s sömmar är beslutade och godkända, inte före. Utan överenskomna sömmar blir varje test en granskningsanmärkning |

---

## 2026-08-12 (förmiddag) — Grillning inför 11B. Temat vänt till ljust, och 11B visade sig vara halvbyggt — DELVIS ÖVERSPELAD

> **⚠️ Punkt 1 och 2 i "Börja här" nedan är utförda 2026-08-12 (eftermiddag).** Fraunces är
> hämtad som fil och ikonpaketet är valt och inkopplat — se sektionen överst. Punkt 3 (11B.0e)
> och punkt 4 (`/implement`) står kvar, men **11B.0e:s förutsättningar har ändrats**: två av
> premisserna i uppgift 12.20 var felaktiga och är rättade. Resten av sektionen — designen,
> mätningarna, de sex omgångarna — gäller oförändrat.

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

⚠️ **`preview_start` (Browser-panelen) fungerar fortfarande inte, och att starta om appen
hjälper inte.** Detta testades 2026-08-12 kl 14: PATH ligger rätt i användarens registry, men
processens egen PATH saknar den. **Orsaken är att Windows inte uppdaterar miljön i redan
körande processer, och det gäller även Utforskaren** — som är den som startar appen. Appen
ärver alltså en miljö från före Node-installationen hur många gånger den än startas om.

**Det som faktiskt löser det:** logga ut och in igen, starta om datorn, eller starta om
Utforskaren via Aktivitetshanteraren. Först därefter hjälper en omstart av Claude Code.

**Övervägt och medvetet valt bort:** att skriva PATH i `.claude/settings.local.json` (som är
maskinlokal och gitignorerad). Om variabelinterpolationen inte stöds skulle PATH **ersättas**
i stället för utökas, vilket slår ut git och PowerShell mitt i arbetet. Inte värt risken.

**Ingen maskinsökväg hårdkodades i `.claude/launch.json`** — den är spårad i git och skulle gå
sönder på hemmadatorn.

**Under tiden:** prefixa `$env:PATH` med Node-katalogen i varje PowerShell-anrop. Playwright,
testerna, lint och bygget fungerar då utan problem. Det är bara Browser-panelens egen
serverstart som inte går.

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

**Bekräftat i appen av Adam samma dag: 95 kg syns, och notisraden står ovanför grafen.**
Hela kedjan är därmed bevisad — SQL-filen, databasen, synken och gränssnittet.
**Fas 13 är avslutad i sin helhet.**

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

## 2026-08-11 (tredje sessionen) — Fas 13 klar utom bekräftelsen i appen

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

## 2026-08-10 — 13.2 klar och verifierad i skarpt läge

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

## 2026-08-09, kväll — 13.1 klar, och tre granskningsrundor på samma diff

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

## 2026-08-09 — Adams konto skapat, och en bugg som hittades på kuppen

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

## 2026-08-04 — designrundan påbörjad, och appen sågs för första gången

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
