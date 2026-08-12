# Härkomstregistret — extern kod och data

**Allt vi hämtat utifrån står här.** Vad, varifrån, vilken licens, vilka av våra filer det
berör, och om det är **kopierat** eller bara **läst som inspiration**.

Regeln står i `CLAUDE.md` §7.2c: ingen extern kod eller data committas utan en rad här, i
samma commit.

> **Varför registret finns.** Om ett halvår går det inte att svara på *"får vi göra det här
> med koden?"* utan det — och då blir svaret i praktiken nej, eller värre, ett ja som ingen
> kan belägga. För MIT-licenserad kod är den här filen dessutom det som **uppfyller**
> licensens attributionskrav.

---

## Statusförklaring

| Status | Betyder |
|---|---|
| **Kopierat** | Kod eller data ligger i vårt repo. Licensvillkoren gäller oss |
| **Läst** | Vi har studerat det men kopierat ingenting. Inga villkor gäller |
| **Övervägt** | Utrett och valt bort, eller uppskjutet. Här för att slippa utreda igen |

---

## Kopierat

| Vad | Källa | Licens | Våra filer | Datum |
|---|---|---|---|---|
| Färgvärden ur `grayDark`, `greenDark`, `amberDark`, `redDark` | [radix-ui/colors](https://github.com/radix-ui/colors) | **MIT** | `docs/DESIGN.md` §1 → `src/index.css` (fas 11B steg 4) | 2026-08-04 |
| `handoff`-skillen, i praktiken ordagrant | [mattpocock/skills](https://github.com/mattpocock/skills) | **MIT** | `.claude/skills/handoff/SKILL.md` | 2026-08-11 |
| Fraunces, variabel woff2 (latin) + licenstexten | [undercasetype/Fraunces](https://github.com/undercasetype/Fraunces) | **OFL-1.1** | `src/assets/fonts/fraunces-var-latin.woff2`, `src/assets/fonts/OFL.txt` → `src/index.css` (fas 11B steg 4) | 2026-08-12 |
| 12 ikon-SVG:er, **bara** i beslutsmockupen | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | **ISC** + **MIT** | `docs/mockups/11b-ikoner.html` | 2026-08-12 |
| 9 ikoners `d`-strängar. **Valt paket** | [tabler/tabler-icons](https://github.com/tabler/tabler-icons) | **MIT** | `src/ui/icons.tsx`, `docs/mockups/11b-ikoner.html` | 2026-08-12 |

### mattpocock/skills — `handoff`

- **Licens verifierad direkt mot repot**, inte ur sökträffar: `gh api repos/mattpocock/skills`
  ger `MIT`, och `LICENSE` lyder *"Copyright (c) 2026 Matt Pocock"*. Repot hade 213 621
  stjärnor och senaste push 2026-08-07 när kopian togs.
- **Vad som kopierats:** hela `skills/productivity/handoff/SKILL.md`. Originalets brödtext står
  kvar ordagrant med **ett** undantag — meningen *"Save to the temporary directory of the
  user's OS - not the current workspace"* är ersatt av en instruktion att skriva till
  `docs/HANDOFF.md`. Därutöver är två svenska stycken tillagda om var filen ska ligga och vad
  som räknas som verifierbart.
- **Varför avvikelsen behövs:** originalet är byggt som en flyktig stafettpinne mellan två
  agenter i vilket repo som helst. `CLAUDE.md` regel 5 kräver motsatsen — ett versionerat
  register som överlever `git clone`. Innehållsdisciplinen i skillen (peka på artefakter i
  stället för att upprepa dem, föreslå skills, redigera bort hemligheter) är däremot precis
  vad vi vill ha och är oförändrad.
- **Varför en projektlokal kopia och inte en ändring i `~/.claude/skills/`:** den senare hade
  ändrat beteendet för alla andra repon på maskinen. Kopian gäller bara det här projektet.
- **MIT-attribution:** upphovsrättsraden står i filhuvudet på `SKILL.md` *och* här. För
  kopierad **kod** — till skillnad från de kopierade färgvärdena ovan — hör den hemma på båda
  ställena.
- **Avsiktligt minimal diff.** Ju närmare originalet kopian ligger, desto lättare är den att
  synka om när uppströms ändras. Motstå frestelsen att skriva om den.

### Radix Colors — detaljer

- **Vad som kopierats:** enskilda hexvärden ur fyra mörka skalor. Steg 3, 8, 9 och 11 ur
  green, amber och red, samt `gray8` som `--color-line-strong`.
- **Vad som INTE kopierats:** ingen kod, inget npm-paket, ingen CSS-fil. **Bundlen växer
  inte.** Detta är "data slår kod" ur `CLAUDE.md` §7.1 i praktiken.
- **Varför just Radix:** uppgift 11B.7 kräver WCAG AA mot mörk botten. Radix skalor är
  konstruerade med definierade roller och förutsägbar kontrast per steg. Tailwinds palett är
  vald för utseende, inte för garanterad kontrast.
- **Verifierat 2026-08-04:** samtliga textfärger uppmätta mot `#0a0a0a` med WCAG:s
  luminansformel. Lägsta värde 9,40:1 mot kravet 4,5:1. Tabellen finns i `DESIGN.md` §1.

> **MIT-attribution.** Licensen kräver att upphovsrättsraden följer med. För kopierade
> *värden* i en egen fil är den här posten det som uppfyller villkoret — det är därför
> registret finns. Skulle vi någon gång kopiera Radix **kod** ska licenstexten in i
> filhuvudet också.

### Fraunces — rubriktypsnittet

- **Licens verifierad direkt mot repot**, inte ur sökträffar: GitHubs API för
  `undercasetype/Fraunces` ger `OFL-1.1`, och `OFL.txt` inleds *"Copyright 2018 The Fraunces
  Project Authors"*. Repot hade 750 stjärnor och senaste push 2026-02-11 när kopian togs.
- **Ingen Reserved Font Name.** Upphovsrättsraden saknar tillägget *"with Reserved Font Name"*,
  vilket är den enda OFL-klausul som hade kunnat hindra oss från att subsätta filen och ändå
  kalla den Fraunces. Vi får alltså både subsätta och behålla namnet.
- **OFL-attribution ligger i två lager, och båda behövs.** Licensen kräver att licenstexten
  **följer med själva fontfilen** — därför ligger `OFL.txt` bredvid `.woff2`-filen och inte
  bara här. Registret ensamt räcker för kopierade *värden* (Radix ovan), men inte för en
  binär fontfil som distribueras med appen.
- **Vad som hämtats:** den latinska delmängden av den variabla woff2:an som Google Fonts
  bygger och serverar (`v38`), samt `OFL.txt` från originalrepot. **67 304 byte** (65,7 kB),
  `sha256 7234ed86…56e0d783`.
- **Axlar: `opsz` 9–144 och `wght` 400–700. `SOFT` och `WONK` står kvar på sina förvalsvärden.**
  Det är exakt vad mockuperna i `docs/mockups/` laddade, alltså är det Adam faktiskt godkände
  som också hamnar i appen. Att öppna WONK-axeln vore ett nytt designbeslut, inte en teknikalitet.
- **Delmängd: bara `latin`.** Den täcker U+0000–00FF, alltså å ä ö Å Ä Ö. `latin-ext` och
  `vietnamese` laddades avsiktligt inte ned — de hade tredubblat filen utan att lägga till ett
  enda tecken vi skriver.
- **Varför fil och inte `<link>` mot Google Fonts:** mockuperna hämtar den över nätet, vilket
  duger för att välja men inte för appen. Ett externt anrop vid varje sidladdning motsäger
  offline-first, och `vite.config.ts` precachar redan `woff2` via `globPatterns`.

**Verifierat 2026-08-12 i webbläsaren, på vår egen fil** — inte på mockupens Google-kopia.
Filen bäddades in som data-URI i en testsida så att den lästes på riktigt:

| Kontroll | Utfall |
|---|---|
| Fonten laddas och används | ja |
| `wght`-axeln lever | 400 → 354,08 px, 700 → 382,03 px |
| `opsz`-axeln lever | opsz 9 → 381,84 px, opsz 144 → 316,19 px |
| Saknar tabulära siffror | `"111"` 64,88 px mot `"000"` 95,55 px |

Den sista raden är inte ett fel utan **bekräftar 11B.2-fyndet på den fil vi faktiskt ska
använda**: siffrorna hoppar i sidled, och därför sätter Fraunces bara rubriker medan systemets
typsnitt sätter alla tal.

⚠️ **Grindarna kördes inte.** Maskinen saknar Node, npm och Python, så
`npm run test/typecheck/lint/build` ur §7.3 steg 7 gick inte att köra. Ändringen lägger till
två filer som ännu **inte importeras av någon kod**, så det finns inget att bryta — men
`@font-face` i `src/index.css` (fas 11B steg 4) måste köras mot grindarna på jobbdatorn.

### Ikonerna — Tabler valt av Adam 2026-08-12

- **Licensen läst i filen, inte ur sökträffar:** Tablers `LICENSE` är en enda MIT,
  *Copyright (c) 2020-2026 Paweł Kuna*. Raden står i filhuvudet på `src/ui/icons.tsx` **och**
  här. För kopierad **kod** hör den hemma på båda ställena — till skillnad från Radix färgvärden
  ovan, där registret ensamt räcker.
- **Vad som kopierats: nio `d`-strängar.** `check`, `plus`, `arrow-left`, `arrow-right`,
  `dots`, `barbell`, `history`, `list`, `stopwatch`. Ingen SVG-fil, inget npm-paket, ingen
  byggkedja. **Bundlen växer med under 2 kB.**
- **Vad som INTE kopierats:** ramen runt strecken — `viewBox`, `stroke-width`, ändavslut,
  `aria-hidden` och TypeScript-typerna — är vår, skriven enligt §7.3 steg 6.
- **Varför JSX och inte `.svg`-filer:** att importera SVG som komponenter kräver
  `vite-plugin-svgr`, och 11B.0c förbjuder nya poster i `package.json`. De två
  acceptanskriterierna stod alltså mot varandra; det som väger tyngst är noll nya beroenden.
- **Noll nya poster i `package.json`.** "Data slår kod" ur §7.1, samma linje som Radix.

**Lucide ligger kvar i mockupen och ska inte städas bort.** `docs/mockups/11b-ikoner.html` bär
båda paketens SVG-kod, för att beslutet ska gå att granska i efterhand. Det var precis det som
inte gick för lime-valet. Lucides villkor gäller alltså fortfarande oss, och de är två licenser:
ISC (*Copyright (c) 2026 Lucide Icons and Contributors*) för dess egna ikoner, MIT
(*Copyright (c) 2013-present Cole Bemis*) för de Feather-ärvda.

**Ett mätfel som rättades samma dag, och det är värt att minnas metodmässigt.** Mockupen
påstod först att *"Tabler ritar tyngre"*. Det byggde på **filstorlek**, som inte säger något om
hur mycket bläck en ikon lägger på skärmen. Uppmätt med `getTotalLength()` över varje geometri,
vid identisk `stroke-width="2"`, drar Tabler **441 enheter mot Lucides 470** — alltså 6 %
*mindre* linje. Storleksskillnaden i filerna kommer från metadatakommentaren överst och den
radbrutna attributformateringen. **Proxymått är inte mätningar.**

---

## Läst som inspiration — inget kopierat

### Liftosaur
- **Källa:** https://github.com/astashov/liftosaur
- **Licens:** **AGPL-3.0** ⛔ — kod får inte kopieras
- **Varför ändå:** tekniskt närmast oss av allt som finns. Det är en PWA med exakt samma
  iOS-problem vi brottats med (bakgrundstimers, notiser, Wake Lock), och utvecklaren har
  skrivit publikt om dem. Störst lärvärde av alla kandidater.
- **Vad vi tagit:** ingenting. Läst 2026-08-04 som idéunderlag till `DESIGN.md` §3. Det som
  påverkade oss var ett *mönster*, inte kod: Liftosaur märker uppvärmningsset med ordet
  "Warmup" i stället för med färg, vilket löste vår öppna fråga om att gul bar två betydelser.
- **Gränsen:** layout och informationsarkitektur är inte upphovsrättsskyddat. Kodrader är det.

### workout-cool
- **Källa:** https://github.com/Snouzy/workout-cool
- **Licens:** MIT — kopiering vore tillåten med attribution
- **Varför vi ändå inte kopierar:** fel stack. Next.js med server-rendering, Prisma direkt mot
  Postgres, Radix som komponentbibliotek, 82 beroenden. Att plocka en komponent därifrån drar
  in mönster som inte passar en Vite-SPA med Dexie och Supabase.
- **Vad vi tagit:** ingenting. Används som **visuell referens** — den mest stjärnmärkta
  öppna träningsappen som finns (8 251 ⭐).
- **Om något härifrån kopieras senare:** flytta posten till *Kopierat* och lägg in
  MIT-attributionen i filhuvudet.

### wger
- **Källa:** https://github.com/wger-project/wger
- **Licens:** **AGPL-3.0** ⛔
- **Vad vi tagit:** ingenting. Störst av de öppna träningsapparna (6 586 ⭐) men Python/Django
  och en helt annan produktform.

---

## Övervägt och uppskjutet

### free-exercise-db — 873 övningar
- **Källa:** https://github.com/yuhonas/free-exercise-db
- **Licens:** **Unlicense** — public domain, inga villkor alls. Den mest tillåtande som finns.
- **Mätt 2026-08-03:** 873 övningar, 17 muskelgrupper, 12 utrustningstyper, samtliga med
  bilder och instruktioner. `dist/exercises.json` är **978 kB**.
- **Status:** **uppskjuten.** Hör inte hemma i designrundan.

**Varför uppskjuten — och det är inte storleken:**

Vår katalog har redan `primaryMuscle`, `equipment` **och svenska alias**. Aliasen är det
svåra och värdefulla; `free-exercise-db` ger bredd på engelska utan dem, så varje importerad
övning kräver manuellt översättningsarbete.

Den hårda spärren är dock en annan: **katalogens id:n är hårdkodade och checksummade mot
Supabase** (`src/db/catalog.ts`). En ändring utan uppdaterad checksumma gör repo och databas
oense. Att utöka katalogen är alltså en **datamigration**, inte ett designbeslut.

Storleken är däremot lätt att lösa när det väl görs: filtrera till ett urval vid bygget,
eller ladda vid behov i stället för att precacha. Adam har bedömt att 978 kB troligen är
acceptabelt.

⏰ **Villkor för att ta upp igen:** när Adam faktiskt saknar en övning han vill logga.

### Open Props
- **Källa:** https://github.com/argyleink/open-props
- **Licens:** MIT
- **Status:** **valdes bort** till förmån för Radix Colors. Bredare (spacing, typografi,
  skuggor) men Tailwind 4 ger oss redan det. Radix löser det vi faktiskt saknar: garanterade
  kontraststeg.
