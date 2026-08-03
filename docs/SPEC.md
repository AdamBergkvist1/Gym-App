# Specifikation (SPEC): Gym-App

## 1. Syfte och Målgrupp
Appen är en PWA designad för erfarna lyftare. Målet är att erbjuda den snabbaste och mest friktionsfria loggningsupplevelsen på marknaden.

> **Precisering 2026-08-03 — måttstocken är "lika bra som de bästa", inte "snabbast till varje pris".**
>
> Formuleringen ovan lästes ett tag som att varje funktion måste motiveras mot friktion, och
> att varje ny skärm var en kostnad. Adam korrigerade det: appen behöver inte bli *snabbare*
> än Strong och Hevy — den behöver **fungera lika bra och pålitligt**, och därefter finjusteras
> med konkreta önskemål.
>
> **Följden är praktisk:** finns en funktion i de bästa apparna och saknas hos oss är det ett
> **hål**, inte en lyx. Friktion är fortfarande det som avgör *hur* något byggs — men inte
> längre ett argument för att låta bli att bygga det.

## 2. Kärnfunktioner (Användarupplevelse)
- **Fritextloggning via AI (MCP):** Användaren ska kunna skriva t.ex. "Bänkpress 90kg 5 reps, kändes lätt" i en inmatningsruta. AI:n parsar detta och strukturerar datan automatiskt.
- **Spökdata (Auto-fill):** Om användaren väljer att logga manuellt, ska inmatningsfälten (Vikt/Reps) vara ifyllda med transparent text baserat på *exakt* vad användaren lyfte under förra passet för den övningen.
- **Vilotimer:** Startar asynkront när ett set loggas. Appen använder Wake Lock API för att förhindra att skärmen släcks under passet, samt Web Audio API för larm.
- **Historik:** Visuell representation av tidigare pass och PB (Personbästa).

## 2b. Informationsarkitektur — appens skärmar

**Godkänd av Adam 2026-08-03.** Detta är formen fas 11B designar mot. Ändras den ska den
ändras HÄR först — en femte flik som upptäcks halvvägs in i designrundan betyder att
navigation, typografi och tomma tillstånd ritats mot fel form.

### Fyra flikar i bottennavigeringen

| Flik | Rutt | Innehåll |
|---|---|---|
| **Pass** | `/` | Loggningen. Appens hjälte, oförändrad i sin roll |
| **Historik** | `/historik` | Två segment: **Pass** och **Statistik** |
| **Övningar** | `/ovningar` | Katalogen: sök, personbästa per övning, hela historiken för en övning, lägg till egna |
| **Mer** | `/mer` | Inställningar, konto, export, diagnostik |

`/ovning/:id` är en **detaljvy, inte en flik** — nås från Historik, Statistik och Övningar.

### Var funktionerna bor, och varför

**Program (Push/Pull/Ben) är INTE en egen flik.** De ligger som startval överst i Pass när
inget pass pågår:

```
[  Starta tomt pass  ]   ← primär, störst
  Push · Pull · Ben      ← namngivna program
  Kopiera förra passet
```

Adam kör oftast PPL men inte alltid samma pass, och vill att förstavalet är att lägga in
övningar löpande själv. Därför är tomt pass den stora knappen: **programmen är genvägar, inte
en tvingande struktur.** Det avgör också datamodellen — program blir mallar som *fyller* ett
pass, aldrig något ett pass måste tillhöra.

**Statistik är ett segment inuti Historik, inte en egen flik.** De är båda "titta bakåt".
Innehåll: volym per muskelgrupp och vecka, e1RM-trender, personbästa.

**Övningar blev en egen flik** trots att den inte fanns i den ursprungliga formen. Skälet:
både Strong och Hevy har den, och utan den går en övnings historik bara att nå genom att
först hitta ett pass där övningen ingick. Det är ett hål enligt måttstocken i §1.

**Mer innehåller det som i dag saknas helt.** Nuvarande Inställningar är bara diagnostik och
säger själv att "enhet, vilotider och konto byggs senare". Det som ska in: enhet (kg/lb),
standardvilotid samt per övning, ansträngningsskala (RIR/RPE), export, konto. Diagnostiken
flyttas längst ned under en hopfälld rubrik — den är byggd för felsökning, inte dagligt bruk.

### Kravet på hur navigationen byggs

Flikarna är i dag hårdkodade i `AppShell.tsx` och rutterna separat i `App.tsx` — två ställen
som kan glida isär. De ska generas ur **en enda array**, så att lägga till eller ta bort en
flik är en rad. Billigt nu, dyrt senare.

---

## 3. Datamodell (Vad som sparas per set)
- **Övning:** (String) T.ex. Bänkpress.
- **Vikt & Reps:** (Number)
- **RIR/RPE:** (Number 1-10, Optional) Om det inte anges, lämnas det tomt. Användaren ska slippa logga detta om de inte orkar.
- **Vilotid:** (Number, Optional) Tid i sekunder.
- **Notering / Vibe:** (String, Optional) T.ex. "Ont i axeln".
- **Timestamp:** (Tz) Exakt tid för setet.

### 3b. Kroppsvikt — och var gränsen går

**Tillagd 2026-08-03.** Kroppsvikt sparas som en egen datapunkt (vikt + datum), med inmatning
och trend i Historik → Statistik.

Adams skäl: appen ska bli hans **allmänna träningsapp**, och ju mer data desto mer precisa
svar kan AI:n ge på hans frågor senare.

> **Gränsen ska stå utskriven, annars glider den.** `CLAUDE.md` säger att appen är strikt
> begränsad till träningsdata, ingen kost eller makros. Kroppsvikt är **kroppsdata**, inte
> kostdata, och ryms därför.
>
> **Vad som INTE ryms, och inte ska föreslås:** kalorier, makronutrienter, måltidsloggning,
> vattenintag, kosttillskott. Kroppsvikt är en mätpunkt om resultatet av träningen — kost är
> ett eget domänproblem med egna appar som gör det bättre.
>
> Övriga kroppsmått (midja, arm, bröst) är varken ja eller nej ännu. De hör till samma familj
> som kroppsvikt och kan läggas till med samma motivering — men de är inte beslutade, och ska
> tas som ett eget beslut när frågan faktiskt kommer.

## 4. UI / Designspråk och Inspiration
- **Vetenskapligt Datafokus (RP Hypertrophy / Dr. Mike Israetel):** Appen ska ta inspiration från RP Hypertrophy-appen gällande vetenskaplig loggning (fokus på RIR, ansträngning och progression). AI-chatten ska användas för att göra inmatningen av denna data snabbare och mindre tungrodd än i RP-appen.
- **Visuell stil (Jeff Nippard / Boostcamp):** Minimalistiskt, mörkt tema ("dark mode") med rena kontraster. Siffrorna och historiken står i centrum. Absolut inget onödigt fluff eller sociala flöden.
- **Tysta framgångar:** Inga blockernade pop-ups när ett set sparas. En diskret färgförändring eller en liten ikon räcker för att bekräfta att datan sparats ("Success State").
- **Offline-First:** Användargränssnittet måste uppdateras omedelbart (Optimistic UI) via lokal IndexedDB, oavsett nätverkets status. Skrivningar till databasen sker tyst i bakgrunden.
