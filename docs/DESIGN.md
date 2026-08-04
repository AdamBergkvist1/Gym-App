# Designbrief — Gym-App

Det femte dokumentet (se `CLAUDE.md` §8). Skrivs som **första steg i fas 11B** och är en
förutsättning för den, inte en dokumentation av den i efterhand.

**Status:**

| Del | Innehåll | Läge |
|---|---|---|
| **§1** | Färgsystemet | ✅ **klar 2026-08-04** — väntar på godkännande |
| **§2** | Typografi och rytm | ✅ **klar 2026-08-04** — väntar på godkännande |
| **§3** | Skärmskisser | ✅ **klar 2026-08-04** — väntar på godkännande |

> **Ingen kod skrivs mot denna fil förrän Adam godkänt respektive del.** `index.css` och
> komponenterna ändras i fas 11B steg 4, en skärm i taget.

---

## §0 Utgångspunkter

**Måttstocken är "lika bra som de bästa apparna", inte "snabbast till varje pris"**
(`SPEC.md` §1, preciserad 2026-08-03). Friktion avgör *hur* något byggs — den är inte längre
ett argument för att låta bli att bygga det.

**Bruksmiljön styr mer än estetiken.** Appen används stående, svettig, enhänt, mitt i ett set,
ibland i dålig belysning. Därav de befintliga reglerna som inte omförhandlas här: endast mörkt
tema, tryckytor minst 48×48 px, setraden är största elementet på skärmen.

**Referenser enligt SPEC §4:** RP Hypertrophy för datafokus, Jeff Nippard och Boostcamp för
estetik. Studerade öppna appar listas i `EXTERNT.md`.

---

## §1 Färgsystemet

### Källa och licens

Skalorna kommer från **[radix-ui/colors](https://github.com/radix-ui/colors)** (MIT).
Registrerat i `docs/EXTERNT.md`. Vi kopierar **värden**, inte kod — inget npm-beroende
tillkommer, och bundlen växer inte.

**Varför Radix och inte Tailwinds förval:** uppgift 11B.7 kräver att färgbetydelserna klarar
**WCAG AA mot mörk botten**. Radix skalor är konstruerade så att varje steg har en definierad
roll och ett förutsägbart kontrastförhållande. Tailwinds palett är vald för att se bra ut, inte
för att garantera kontrast — och den garantin är hela poängen här.

### Stegmodellen

Radix skala har tolv steg med fasta roller. Vi använder fyra:

| Steg | Roll | Vår användning |
|---|---|---|
| **3** | Diskret bakgrund | Färgad yta bakom en markerad rad |
| **8** | Tydlig kant | Ram som bär betydelse |
| **9** | Solid fyllning | Ifylld knapp, bock, prick |
| **11** | Text på mörk botten | All färgad text |

**Regeln som följer:** färgad text använder alltid steg **11**, aldrig steg 9. Steg 9 är gjord
för att vara en yta med vit text ovanpå, inte för att vara text själv.

### Neutralerna — behålls, nu med mätvärden

Bakgrunden `#0a0a0a` ändras **inte**: den ligger i PWA-manifestet som `theme_color` och
`background_color`, så ett byte ändrar även startskärm och statusrad på iOS.

| Token | Värde | Kontrast mot bg | Dom |
|---|---|---|---|
| `--color-fg` | `#ededed` | **16,91:1** | AA ✓ |
| `--color-dim` | `#8a8a8a` | **5,73:1** | AA ✓ |
| `--color-surface` | `#171717` | 1,10:1 | yta, ej text |
| `--color-line` | `#2e2e2e` | 1,46:1 | se nedan |

**`--color-line` är den enda som behöver ett beslut.** WCAG 1.4.11 kräver 3:1 för kanter som
behövs för att *identifiera* en komponent. Våra kortramar är dekorativa — kortet har redan en
egen yta — så 1,46:1 är godtagbart där. Men en **kant som bär betydelse** (en obekräftad
setrads tryckyta) måste nå 3:1.

**Tillägg:** `--color-line-strong: #606060` (Radix `gray8`, **3,15:1**). Används där kanten är
det enda som visar att något går att trycka på.

### De semantiska färgerna — alla värden uppmätta

Mätt med WCAG:s relativa luminansformel mot `#0a0a0a`, 2026-08-04.

| Betydelse | Roll | Radix | Värde | Kontrast | Dom |
|---|---|---|---|---|---|
| **Sparat** | text | `green11` | `#3dd68c` | **10,55:1** | AA ✓ |
| | fyllning | `green9` | `#30a46c` | 6,27:1 | AA ✓ |
| | kant | `green8` | `#2f7c57` | 3,90:1 | ≥3:1 ✓ |
| | yta | `green3` | `#132d21` | 1,34:1 | bakgrund |
| **Uppmärksamhet** | text | `amber11` | `#ffca16` | **12,93:1** | AA ✓ |
| | fyllning | `amber9` | `#ffc53d` | 12,54:1 | AA ✓ |
| | kant | `amber8` | `#8f6424` | 3,79:1 | ≥3:1 ✓ |
| | yta | `amber3` | `#302008` | 1,26:1 | bakgrund |
| **Fel / destruktivt** | text | `red11` | `#ff9592` | **9,40:1** | AA ✓ |
| | fyllning | `red9` | `#e5484d` | 5,06:1 | AA ✓ |
| | kant | `red8` | `#b54548` | 3,69:1 | ≥3:1 ✓ |
| | yta | `red3` | `#3b1219` | 1,21:1 | bakgrund |

**Varje textfärg ligger över 9:1.** Kravet var 4,5:1. Marginalen är avsiktlig: skärmen läses
med svettiga ögon i dålig belysning, och telefoner sänker ljusstyrkan automatiskt i värme.

### Vad varje färg betyder — och vad den inte får betyda

**Grön = det är sparat.** Bara det. Ett bekräftat set, en synkad rad, en grön prick i
synkstatusen. **Grön får aldrig betyda "bra" i värderande mening** — ett tungt set är inte
grönare än ett lätt. Loggen är en logg, inte en domare.

**Gul = titta på den här innan du går vidare.** Låg konfidens från AI:n, eller ett värde långt
utanför det typiska. **Inget annat.**

> ✅ **Löst i §3.** Frågan var öppen när §1 skrevs: gul bar två skilda betydelser, *"osäkert,
> bekräfta"* och *"uppvärmning"* (`W` i orange enligt 11A.12). Uppvärmning är en **kategori**,
> inte en varning — att märka den med varningsfärg säger åt ögat att något är fel när inget är
> fel.
>
> Svaret kom från Liftosaur, som märker uppvärmning med **ordet "Warmup"** i stället för med
> färg. Hos oss blir `W` neutral (`--color-dim`), `F` röd, arbetsset vanlig text. **Gul
> betyder därefter en enda sak** — och betyder därmed något.

**Röd = något gick fel, eller något kommer försvinna.** Misslyckad synk, permanent fel i
utkorgen, ta bort-knappar. Röd ska vara sällsynt; används den för ofta slutar den betyda något.

**Personbästa (11B.8)** använder `green12` (`#b1f1cb`, 15,38:1) på `green3`-yta, **plus en
utskriven `PB`-etikett**. Färgen ensam får inte bära budskapet — den delar kulör med "sparat",
och en användare som är färgblind eller stressad ska kunna läsa sig till det.

### Vad detta ersätter

I dag finns **19 hårdkodade Tailwind-klasser** utan system: `text-amber-400` (9 gånger),
`text-emerald-500`, `bg-emerald-500`, `border-amber-700/60`, `bg-amber-950/30` och några till.
De ersätts av tokens i fas 11B steg 4.

**Klart när:** ingen komponent innehåller en färgklass med siffra. Färg sätts bara via token.

### Tokens att lägga i `index.css`

```css
@theme {
  /* Neutraler — oförändrade utom line-strong */
  --color-bg: #0a0a0a;
  --color-surface: #171717;
  --color-line: #2e2e2e;
  --color-line-strong: #606060;  /* NY — kanter som bär betydelse, 3,15:1 */
  --color-fg: #ededed;
  --color-dim: #8a8a8a;

  /* Sparat (Radix greenDark) */
  --color-ok-text: #3dd68c;
  --color-ok-solid: #30a46c;
  --color-ok-line: #2f7c57;
  --color-ok-bg: #132d21;

  /* Uppmärksamhet (Radix amberDark) */
  --color-warn-text: #ffca16;
  --color-warn-solid: #ffc53d;
  --color-warn-line: #8f6424;
  --color-warn-bg: #302008;

  /* Fel och destruktivt (Radix redDark) */
  --color-err-text: #ff9592;
  --color-err-solid: #e5484d;
  --color-err-line: #b54548;
  --color-err-bg: #3b1219;

  /* Personbästa */
  --color-pb-text: #b1f1cb;
  --color-pb-bg: #132d21;
}
```

**Namnen är avsiktligt betydelsebaserade, inte kulörbaserade.** `--color-ok-text` och inte
`--color-green-11`: skulle vi någon gång byta kulör för "sparat" ska bara den här filen
ändras, inte varje komponent som råkade heta grönt.

---

## §2 Typografi och rytm

Täcker uppgift **11B.1** (skala), **11B.2** (`tabular-nums`), **11B.3** (vertikal rytm) och
underlaget till **11B.9** (densitet).

### Vad mätningen visade

Räknat över `src/` 2026-08-04:

| Fynd | Siffra | Vad det betyder |
|---|---|---|
| `text-sm` + `text-xs` | **93 av 118** | 79 % av all text är liten. Appen är en vägg av småtext |
| `font-semibold` | **33** mot 3 `font-normal` | Halvfet är i praktiken förvalet — och då skiljer vikt ingenting |
| Setvärde | `text-base` = **16 px** | |
| Vilotimer | `text-4xl` = **36 px** | |

> 🚩 **Målet i 11B.1 är inverterat i dag.** Setraden ska vara största elementet, men timern är
> **2,25 gånger större** än setvärdena. Det är inte en detalj — det är hela hierarkin bakåt.

**Två fynd till, som inte hörde till uppgiften men föll ut ur mätningen:**

**1. Tryckytorna i setraden bryter mot projektets egen regel.** `index.css` sätter
`min-height: 48px` på alla knappar med motiveringen i `PLAN.md` §2.3: under hård ansträngning
minskar finmotoriken och händerna är svettiga. Men `SetRow` använder `min-h-0` för att kringgå
den:

| Element | I dag | Regel |
|---|---|---|
| Bekräfta ✓ | **40 × 36 px** (`h-9 w-9`) | 48 × 48 |
| Värdecell (kg, reps) | 52 × **44 px** (`h-11`) | 48 |

Bekräfta-knappen är **appens mest tryckta kontroll**. Att just den är minst är fel väg.

**2. `TASKS.md` 11B.2 är inaktuell.** Den säger att `tabular-nums` "saknas i historik och
timer". Mätningen visar att både `HistoryPage`, `ExercisePage` och `RestTimer` redan har det.
Uppgiften kvarstår men handlar om att göra det strukturellt, inte om att lägga till det.

### Typsnitt — systemstacken behålls, och det är ett beslut

Ingen egen webbfont. Skälen:

- **Noll nedladdning.** Allt som precachas hämtas en gång i en gymkällare. En webbfont kostar
  15–40 kB för noll funktion.
- **Ingen FOUT.** Text ritas i första bildrutan, alltid.
- **iOS ger SF Pro**, som har äkta tabulärsiffror. Det är precis vad en logg full av siffror
  behöver, gratis.

`font-mono` finns på ett ställe (`SettingsPage`, diagnostikvärden) och får vara kvar — det är
maskindata, inte innehåll.

### Skalan

Sju steg, namngivna efter **roll** och inte storlek — samma princip som färgtokens.

| Token | rem | px | Vikt | Används till |
|---|---|---|---|---|
| `--text-set` | 1.5 | **24** | 600 | Vikt och reps i setraden |
| `--text-timer` | 2 | 32 | 600 | Vilotimern medan den går |
| `--text-title` | 1.375 | 22 | 600 | Sidrubrik (`h1`) |
| `--text-exercise` | 1.0625 | 17 | 600 | Övningsnamn på kortet |
| `--text-body` | 0.9375 | 15 | 400 | Brödtext, standard |
| `--text-meta` | 0.8125 | 13 | 400 | Spökdata, tider, metadata |
| `--text-label` | 0.6875 | 11 | 600 | Kolumnrubriker, versaler |

**Setvärdet går från 16 → 24 px.** Det är den enda ändring som faktiskt löser 11B.1.

> ❓ **Beslut jag vill ha ditt ja på:** timern blir 32 px, alltså fortfarande större än
> setraden. Bokstavligt läst bryter det mot 11B.1.
>
> **Mitt skäl:** de två konkurrerar aldrig om uppmärksamheten. Timern läses **på avstånd**,
> med telefonen liggande på en bänk medan du vilar. Setraden läses **i handen** när du loggar.
> Att krympa timern under setraden hade gjort den sämre på sitt enda jobb för att uppfylla en
> regel bokstavligt.
>
> Jag föreslår att 11B.1 formuleras om till: *"setraden är största elementet i passets
> beständiga innehåll"*. Timern är ett tillfälligt tillstånd, inte innehåll.

**Vikt bär betydelse igen.** 600 reserveras för siffror som räknas, rubriker och övningsnamn.
Allt annat är 400. I dag är 33 av 37 viktklasser halvfeta, vilket betyder att halvfet inte
säger något alls.

### `tabular-nums` blir strukturellt, inte ihågkommet

```css
body { font-variant-numeric: tabular-nums; }
```

**På `body`, inte per komponent.** 11B.2 har hittills varit en regel man måste komma ihåg 40
gånger — och den glöms. Som förval blir den omöjlig att bryta.

Priset är att siffror i löptext blir marginellt bredare. I en app som nästan uteslutande
består av siffror är det rätt sida att fela på.

### Vertikal rytm

Basenhet **4 px**. Tillåtna värden: **4, 8, 12, 16, 24, 32**. Inget annat.

| Avstånd | Värde | Var |
|---|---|---|
| Inuti en rad | 4 | Mellan kolumner i setraden |
| Mellan rader | 8 | Setrader i ett övningskort |
| Mellan kort | 12 | Övningskort i passvyn |
| Mellan sektioner | 24 | Rubrik till innehåll |
| Sidmarginal topp | 32 | Under statusraden |

I dag används 20+ olika värden utan regel — `px-3`, `mt-2`, `px-4`, `gap-2`, `p-3`, `mt-1`
och så vidare. Värdena är i sig inte fel; det som saknas är vilket som gäller när.

### Tryckytor — rättning

| Element | I dag | Ska bli | Kostnad |
|---|---|---|---|
| Bekräfta ✓ | 40 × 36 | **48 × 48** | 8 px bredd |
| Värdecell | 52 × 44 | 52 × **48** | 0 px bredd |

Bredden tas från `Förra`-kolumnen, som är den enda flexibla (`1fr`).
**`min-h-0` får inte längre användas för att kringgå 48 px-regeln.**

> ⚠️ **Måste verifieras, inte antas.** Setradens rutnät är
> `grid-cols-[1.75rem_1fr_3.25rem_2.75rem_2.5rem]` med `gap-1` och `px-2` — 164 px fasta
> kolumner plus 16 px mellanrum plus 16 px padding. Att öka ✓ till 48 px tar 8 px från
> `Förra`. **Playwright-vakten mäter detta på 375 px i steg 4** innan det anses klart. Samma
> fel som 11A.8 får inte upprepas: en känd risk som inte mäts är inte hanterad.

### Densitet — 11B.9

Kravet: ett pass med 25 set ska gå att överblicka. Med 48 px per rad blir det ~1 200 px, alltså
knappt två skärmar.

**Förslag: bekräftade rader krymper.** Ett avbockat set behöver inte samma tryckyta som ett
som väntar — det ska gå att *läsa*, inte att *träffa*.

| Tillstånd | Höjd | Motiv |
|---|---|---|
| Väntar | **48 px** | Ska träffas med svettiga fingrar |
| Bekräftat | **40 px** | Ska läsas. Ångra sker genom att trycka på hela raden |

Ångra-ytan blir 40 px hög men **hela radens bredd**, alltså långt större än 48×48 px i area.
48 px-regeln finns för små, isolerade mål — inte för fullbreddsrader.

Ett pass med 25 mestadels avbockade set går från ~1 200 till ~1 000 px. Ingen dramatik, men
det är den enda densitetsvinst som inte kostar träffsäkerhet.

### Tokens att lägga i `index.css`

```css
@theme {
  --text-set: 1.5rem;        /* 24px */
  --text-timer: 2rem;        /* 32px */
  --text-title: 1.375rem;    /* 22px */
  --text-exercise: 1.0625rem;/* 17px */
  --text-body: 0.9375rem;    /* 15px */
  --text-meta: 0.8125rem;    /* 13px */
  --text-label: 0.6875rem;   /* 11px */

  /* INGA egna spacing-tokens — se rättelsen nedan */
}

body { font-variant-numeric: tabular-nums; }
```

**Klart när** (11B.1): ingen komponent sätter egen textstorlek — all typografi kommer från
token.

> ✏️ **Rättat 2026-08-04 under implementationen.** Briefen föreslog egna spacing-tokens
> (`--space-1` … `--space-8`). Det visade sig vara fel: **Tailwind 4:s egen skala ger redan
> exakt de värden vi kräver** — `p-1`=4, `p-2`=8, `p-3`=12, `p-4`=16, `p-6`=24, `p-8`=32.
>
> Egna tokens hade bara varit en andra uppsättning namn för samma tal, och två sanningar är
> värre än en. **Det som behövdes var en regel om vilka värden som får användas, inte nya
> variabler.**

## §3 Skärmskisser

Formen är låst i `SPEC.md` §2b: fyra flikar — **Pass, Historik, Övningar, Mer**.

### Referenserna och vad var och en bidrog med

| Källa | Bidrag |
|---|---|
| `Reference-pics/Skärmbild …104637` (Hevy) | Setradens tabell `Set·Prev·KG·Reps·✓`, grön bakgrund på bekräftad rad, **PB-chip inline**, vilotimern som liten chip mellan övningar |
| `Reference-pics/Skärmbild …104719` | **Sammanfattningsrad `Tid · Volym · Set`** överst i passet |
| `Reference-pics/image8.webp`, `image16.webp` (MacroFactor) | Mörkt kortspråk, **stor siffra + liten etikett**, segmenterad tidsperiod `1V·1M·3M·1Å·Allt`, **trendlinje med osäkerhetsband** |
| liftosaur.com (läst 2026-08-04, AGPL — inget kopierat) | Uppvärmning märks med **ordet "Warmup"**, inte med färg |

### ✅ Den öppna frågan från §1 är löst

Gul bar två betydelser: *"osäkert, bekräfta"* och *"uppvärmning"*. Liftosaur visar vägen ut —
**uppvärmning är en kategori och märks med tecken, inte med varningsfärg.**

| Markör | Betydelse | Utseende |
|---|---|---|
| `W` | Uppvärmning | `--color-dim`, **neutral** |
| `F` | Failure / till utmattning | `--color-err-text` |
| `1, 2, 3…` | Arbetsset | `--color-fg` |

**Gul reserveras helt för det som kräver ett beslut av dig:** låg konfidens från AI:n, ett
värde långt utanför det typiska. Efter detta betyder gul en enda sak, och då betyder den
något.

### Genomgående mönster

**Kortet.** `--color-surface`, radie 12 px, `--color-line` som ram, `--space-3` inuti,
`--space-3` mellan kort. Ingen skugga — skuggor på nästan svart är brus.

**Sidrubrik.** `--text-title`, och till höger på samma rad en sammanfattning i
`--text-meta`. Rubriken tar aldrig en egen rad för sig själv; skärmhöjd är dyrare än luft.

**Segmenterad kontroll.** Piller, hela bredden, aktivt segment `--color-fg` på
`--color-surface`. Används för Historik och för tidsperiod i Statistik.

**Stor siffra + liten etikett.** Värdet i `--text-set` eller större, etiketten under i
`--text-label` versaler `--color-dim`. Kommer från MacroFactor och är rätt för en app där
siffran *är* innehållet.

---

### 3.1 Pass

**Utan pågående pass** — programmen är genvägar, tomt pass är förstavalet (`SPEC.md` §2b):

```
┌──────────────────────────────────┐
│ Pass                             │  --text-title
│                                  │
│ ┌──────────────────────────────┐ │
│ │      Starta tomt pass        │ │  fylld, --color-fg, 56 px
│ └──────────────────────────────┘ │
│                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐   │  program, 48 px
│  │ Push  │ │ Pull  │ │  Ben  │   │  kantade
│  └───────┘ └───────┘ └───────┘   │
│                                  │
│  Kopiera förra passet         →  │  --text-body
│  Bröst · 5 övningar · tisdag     │  --text-meta, --color-dim
└──────────────────────────────────┘
```

Raden under "Kopiera förra passet" är ny och löser ett verkligt problem: i dag vet man inte
vad man kopierar förrän efteråt.

**Med pågående pass:**

```
┌──────────────────────────────────┐
│ Pass                   42 min  ⏱ │
│  12          4 850        3      │  --text-set
│  SET         VOLYM KG     ÖVN    │  --text-label
├──────────────────────────────────┤
│ ⌨ Skriv i stället — "Bänk 90x5"  │  hopfälld genväg
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Bänkpress               ⋯    │ │  --text-exercise
│ │ Set  Förra   Kg   Reps   ✓   │ │  --text-label, EN gång
│ │  W   60×10   60    10    ✓   │ │  bekräftad: --color-ok-bg
│ │  1   90×5    90     5    ✓   │ │  40 px
│ │  2   90×5    90     5    ☐   │ │  48 px, väntar
│ │  +  Lägg till set             │ │
│ └──────────────────────────────┘ │
│                                  │
│  ⏱ 1:12        🏆 PB +2,5 kg     │  timer + PB, chips
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Latsdrag                ⋯    │ │
│ └──────────────────────────────┘ │
│                                  │
│  + Lägg till övning              │
│  ✓ Avsluta pass                  │
└──────────────────────────────────┘
```

**Tre beslut i den här skissen:**

**Sammanfattningsraden är ny** (`Set · Volym · Övningar`). Från referens 104719. I dag står
bara "0 min · 0 set" i en liten rad — volym är appens bästa mått på ett pass och saknas.

**Vilotimern är en chip i flödet, inte ett banderoll-lager.** Hevy gör så, och det löser ett
problem vi har: timern får inte skymma setraden man just loggat. **Men den ska vara 32 px
enligt §2** — den är alltså en *stor* chip, inte en liten. Läsbar från en bänk, utan att äta
en hel rad.

**PB-chip bredvid timern** (11B.8). `--color-pb-text` på `--color-pb-bg`, med trofé och
utskriven differens. Dyker upp i samma ögonblick setet bockas av — den starkaste
återkopplingen appen kan ge, och den kostar nästan ingenting eftersom e1RM redan finns.

---

### 3.2 Historik

```
┌──────────────────────────────────┐
│ Historik                         │
│ ┌────────────┬─────────────────┐ │
│ │   Pass     │    Statistik    │ │  segmenterad
│ └────────────┴─────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Tisdag 2 aug          58 min │ │
│ │ Bröst och triceps            │ │  --text-meta
│ │ 18 set · 5 210 kg · 5 övn    │ │  --color-dim
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Statistik-segmentet:**

```
┌──────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬────┐            │
│ │1V│1M│3M│6M│1Å│Allt│            │  tidsperiod
│ └──┴──┴──┴──┴──┴────┘            │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Volym per muskelgrupp        │ │
│ │  Bröst   ████████████  8 set │ │
│ │  Rygg    ██████████   7 set  │ │
│ │  Ben     ████          3 set │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Bänkpress                    │ │
│ │  102,5        +4,2%          │ │  --text-set
│ │  BÄSTA e1RM   8 VECKOR       │ │  --text-label
│ │   ╱╲    ▁▂▃▄▅▆              │ │  linje + osäkerhetsband
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Kroppsvikt          + Väg in │ │
│ │  82,4 kg      −0,6 kg        │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

> 💡 **Osäkerhetsbandet är inte dekoration.** MacroFactor ritar sin viktkurva med ett skuggat
> band runt linjen. För oss är det ovanligt välmotiverat: `TASKS.md` 12.7 slår fast att Epley
> är en **populationsformel** vars fel är *konsekvent åt samma håll* för en given person.
> e1RM är alltså ett estimat som ser ut som ett mätvärde — och ett band gör osäkerheten
> synlig i stället för att en exakt siffra ljuger med två decimaler.
>
> Detta är ett **förslag**, inte ett beslut: bandets bredd måste ha en grund innan det ritas,
> annars är det bara dekoration som låtsas vara statistik. Avgörs i 12.7.

---

### 3.3 Övningar

```
┌──────────────────────────────────┐
│ Övningar                    + Ny │
│ ┌──────────────────────────────┐ │
│ │ 🔍 Sök övning eller alias    │ │  48 px
│ └──────────────────────────────┘ │
│                                  │
│ SENAST ANVÄNDA                   │  --text-label
│  Bänkpress          102,5 kg  →  │
│  Latsdrag            75,0 kg  →  │
│                                  │
│ BRÖST                            │
│  Hantelpress         40,0 kg  →  │
│  Flyes                    –   →  │
└──────────────────────────────────┘
```

Siffran till höger är **personbästa i e1RM**, inte senaste vikt — det är det värde som gör
listan värd att bläddra i. `–` när underlag saknas, aldrig en nolla: en nolla ser ut som ett
resultat.

Strukturen ärvs från `ExercisePicker` (11A.4) som redan har sök, senast använda överst och
gruppering per muskelgrupp. **Fliken är samma komponent i en annan ram**, inte en ny.

---

### 3.4 Mer

```
┌──────────────────────────────────┐
│ Mer                              │
│ TRÄNING                          │
│  Enhet                     kg  → │
│  Standardvilotid          180 s → │
│  Ansträngningsskala       RIR  → │
│ KONTO                            │
│  adam@…              Synkad ● → │
│  Exportera data               →  │
│ APPEN                            │
│  Version              2026.08.04 │
│  ▸ Diagnostik                    │  hopfälld
└──────────────────────────────────┘
```

Diagnostiken (parsningsstatistik, timerdiagnostik, lagring) hamnar **hopfälld längst ned**.
Den är byggd för felsökning, inte dagligt bruk — i dag är den allt som finns.

---

### 3.5 Bottenark

`SetAdjustSheet` och `ExercisePicker` behåller sin struktur från 11A. Det som ändras är
tokens: `--color-surface`, `--space-*`, `--text-set` på hjulens siffror.

**Rullhjulen rörs inte i övrigt.** De är byggda på `scroll-snap` med egen sifferaritmetik och
10 tester (`src/lib/digits.ts`). Adam har sagt att de inte blev fantastiska, och en egen
utvärdering mot alternativ ligger som ett separat spår — **inte som en del av designrundan.**
Att bygga om dem här hade blandat två frågor.

---

### Vad som INTE ingår i §3

- **Ikonuppsättning.** Vi använder unicode och emoji i dag. Ett ikonbibliotek är ett eget
  beslut med egen storleks- och licensfråga, och det finns inget i 11B som kräver det.
- **Animationer** (11B.5) — hör till implementationen, inte till formen.
- **Densitet** (11B.9) — hör till implementationen.

> 🚩 **RÄTTAT 2026-08-04.** Här stod tidigare att **tomma tillstånd** (11B.6) "skissas när
> skärmarna byggs, i sitt sammanhang" — alltså behandlade som polering. **Det var för svagt,
> och det kostade oss samma dag.**
>
> De tre fel som hittades vid den första visuella granskningen var **alla tomma tillstånd**:
> startskärmen är en rubrik och en knapp på 550 px svart; en övning utan historik ger tre
> rader `0 kg × 8`; justeringsarket sköt värdet utanför skärmen.
>
> Cole Caccamise formulerar varför: *"vad riktiga appar gör i de delar av flödet man inte
> tänker på först — tomma tillstånd, laddningstillstånd, feltillstånd, och alla de små
> besluten som får en app att kännas färdig."*
>
> **Tomma tillstånd är inte polering. De är en del av flödet, och ska undersökas före — inte
> skissas efter.** Se `ai-workbench/tools/mobbin.md`.

### Implementationsordning för steg 4

En skärm per branch och PR, i den här ordningen — mest använd först, så att fel upptäcks där
de märks mest:

1. **Tokens i `index.css`** (§1 + §2). Ingen visuell ändring i sig, men allt annat bygger på den
2. **Pass** — setraden, sammanfattningsraden, timer- och PB-chip
3. **Historik** — passlistan och segmentkontrollen
4. **Statistik** — nytt segment
5. **Övningar** — ny flik
6. **Mer** — omstrukturering av Inställningar

**Navigationen görs datadriven i steg 1**, enligt `SPEC.md` §2b — annars måste `AppShell` och
`App.tsx` röras vid varje efterföljande steg.
