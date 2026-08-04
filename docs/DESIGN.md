# Designbrief — Gym-App

Det femte dokumentet (se `CLAUDE.md` §8). Skrivs som **första steg i fas 11B** och är en
förutsättning för den, inte en dokumentation av den i efterhand.

**Status:**

| Del | Innehåll | Läge |
|---|---|---|
| **§1** | Färgsystemet | ✅ **klar 2026-08-04** — väntar på godkännande |
| §2 | Typografi och rytm | ⬜ ej påbörjad |
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

*Ej påbörjad. Bygger på §1.*

## §3 Skärmskisser

*Blockerad: kräver referensmaterial. Se `HANDOFF.md` §8.*
