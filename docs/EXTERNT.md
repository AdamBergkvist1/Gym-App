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

*(Inget ännu. Första posten blir Radix Colors i fas 11B.)*

| Vad | Källa | Licens | Våra filer | Datum |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Läst som inspiration — inget kopierat

### Liftosaur
- **Källa:** https://github.com/astashov/liftosaur
- **Licens:** **AGPL-3.0** ⛔ — kod får inte kopieras
- **Varför ändå:** tekniskt närmast oss av allt som finns. Det är en PWA med exakt samma
  iOS-problem vi brottats med (bakgrundstimers, notiser, Wake Lock), och utvecklaren har
  skrivit publikt om dem. Störst lärvärde av alla kandidater.
- **Vad vi tagit:** ingenting. Endast layout- och interaktionsmönster som idéunderlag till
  `DESIGN.md`.
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
