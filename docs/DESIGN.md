# Designbrief — Gym-App

Det femte dokumentet (se `CLAUDE.md` §8). Skrivs som **första steg i fas 11B** och är en
förutsättning för den, inte en dokumentation av den i efterhand.

**Status:**

| Del | Innehåll | Läge |
|---|---|---|
| **§1** | Färgsystemet | ✅ **klar 2026-08-04** — väntar på godkännande |
| **§2** | Typografi och rytm | ✅ **klar 2026-08-04** — väntar på godkännande |
| §3 | Skärmskisser | ⬜ blockerad — kräver referensmaterial |

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

**Gul = titta på den här innan du går vidare.** Låg konfidens från AI:n, ett värde långt
utanför det typiska, ett uppvärmningsset.

> ⚠️ **Öppen fråga till §3.** Gul bär i dag två helt olika betydelser: *"osäkert, bekräfta"*
> och *"uppvärmning"* (`W` i orange enligt 11A.12). Uppvärmning är en **kategori**, inte en
> varning — att märka den med varningsfärg säger åt ögat att något är fel när inget är fel.
> Löses i skärmskisserna, inte här: sannolikt får uppvärmning en neutral markör och gul
> reserveras för det som verkligen kräver ett beslut.

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

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}

body { font-variant-numeric: tabular-nums; }
```

**Klart när** (11B.1): ingen komponent sätter egen textstorlek — all typografi kommer från
token.

## §3 Skärmskisser

*Blockerad: kräver referensmaterial. Se `HANDOFF.md` §8.*
