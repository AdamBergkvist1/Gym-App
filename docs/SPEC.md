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

**Godkänd av Adam 2026-08-03. Omprövad och bekräftad oförändrad 2026-08-12** i grillningen
inför 11B, efter att Adam läst hela tabellen igen. Detta är formen fas 11B designar mot.
Ändras den ska den ändras HÄR först — en femte flik som upptäcks halvvägs in i designrundan
betyder att navigation, typografi och tomma tillstånd ritats mot fel form.

> Bekräftelsen kom med ett förbehåll som är värt att skriva ut: *"öppen för att ändringar för
> att finjustera sen i framtiden om man känner för det."* Det är inte samma sak som att formen
> är oavgjord. Fyra flikar gäller tills något annat beslutas här.

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

**Innehållet avgjort 2026-08-12** (tidigare stod här bara en uppräkning, vilket inte var ett
beslut). Tre delar, i prioritetsordning, och de två första svarar på olika frågor:

1. **Set per muskelgrupp och vecka, med undertränade grupper synliga.** Svarar på Adams
   fråga *"om man missar något"*. Måttet är **antal arbetsset**, inte kilo, och veckan är
   inte godtycklig: `docs/research/` §3 refererar Schoenfeld m.fl. 2019, som visade ett
   dos-responsförhållande mellan volym och hypertrofi, och konsensus är att arbetsset per
   muskelgrupp och vecka är den primära drivkraften. Hevy bygger sin vy på just det.
   **Byggbart i dag:** `primaryMuscle` finns på varje övning i `src/db/catalog.ts` och
   `primary_muscle`/`secondary_muscles` i schemat sedan migration `0001`. Inget saknas.
2. **Volymkurva (reps × vikt) med justerbart tidsfönster.** Svarar på "hur mycket jobb gjorde
   jag". Adam 2026-08-12: *"kanske något längre än bara senaste veckan, eller att man kan
   anpassa så man kan se volym under kortare och längre tid."* Beräkningen finns redan, med
   uppvärmningsset borträknade (12.16) och halvkilot bevarat (12.18) — det som saknas är
   fönstervalet.
3. **e1RM-trend per övning och personbästa.** Det är den delen som är rolig att titta på nu
   när fem års bänkhistorik importerats: kurvan 70 → 95 kg.

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

### 3c. Import av gamla anteckningar

**Tillagd 2026-08-07 efter en grillningssession.** Adam har fyra års träningsanteckningar i
en anteckningsapp (`raw-notes.txt`). De ska in i appen så att hans progression syns i grafen
och hans personbästa är sanna från början, i stället för att börja om från noll.

**Detta är två skilda saker, och de ska inte blandas ihop:**

**1. Engångsimporten av Adams egen data (nu).** Ingen kod i appen. En genererad SQL-fil som
Adam läser igenom och kör i Supabase SQL-editorn, precis som han redan kör migrationer.
Konfliktlösningen — vilket år en `V 47`-rad hör till, vad "första steget upp" betyder — sker
i samtal, inte i ett gränssnitt. **22 set fördelade på 19 pass, vecka 9 2021 till december 2025.**

> **Rättad 2026-08-11 från 17 till 18 pass.** Siffran 17 kom ur regeln *ett pass per vecka*
> och räknar de 17 veckor som har data. Vecka 12 2024 innehåller två tillfällen, inte ett
> (Adams eget svar i `docs/anteckningsformat.md` fråga 13), och två tillfällen är två pass.
> Verifierat mot den genererade `scripts/import-adam.sql`.
>
> **Utökad samma dag till 19 pass och 22 set.** 21 av seten kommer ur `raw-notes.txt`. Det
> 22:a — bänk 95 kg, december 2025 — kom muntligt från Adam när han läst igenom filen, och
> hör hit trots att det inte står i anteckningarna: det kom inte in genom appen och datumet
> är uppskattat, vilket är hela definitionen av ett importerat set (§3d). Utan det slutar
> bänkkurvan på 90 kg 2024 fast han är starkare i dag.
>
> **Att kanalen är "Adam minns" och inte "Adam skrev ned" är värt att notera**, inte dölja.
> Ett minne är svagare underlag än en anteckning, och den som läser kurvan om två år ska
> kunna se skillnaden. Den står i `scripts/import-adam.sql` §3b och i setets anteckning.

**2. Ett importflöde i appen (backlog, Fas 12).** Nya användare klistrar in sina egna
anteckningar och en AI tolkar dem, med återkoppling till användaren när något är otydligt.
Det är onboarding-värde för andra, inte för Adam — han har redan sin data. **Låg prioritet:
appen ska vara användbar först.**

**Vad importen aldrig får göra:**

- **Aldrig bli spökdata.** Ett importerat 1-repsmax på 90 kg får inte föreslås som "sist tog
  du" nästa gång bänkpress öppnas. Ett rekord är inte ett arbetsset.
- **Aldrig synas som ett riktigt pass.** De importerade passen är behållare, inte träningar
  som ägt rum. De hör inte hemma i passlistan.
- **Aldrig låta ett uppskattat datum se exakt ut.** Sju av punkterna har datum vi räknat oss
  fram till, inte datum som stod någonstans. Det ska framgå där de visas.

**Vad som medvetet inte importeras:** planer om framtida lyft (`Höj till 100 kg nästa`), set
som Adam själv underkänt, lösryckta minnesanteckningar — och kroppsvikten, som är ett eget
spår (se 3b) och kräver en funktion som ännu inte finns.

---

## 3d. Ordlista

Begrepp som betyder något bestämt i det här projektet. Allmänna programmeringsbegrepp hör
inte hit — bara ord där appen har en egen, precis innebörd.

**Set:**
Ett utfört arbetsset: en övning, en vikt, ett antal repetitioner, vid en tidpunkt.
_Undvik:_ lyft, rep-serie.

**Pass:**
En sammanhängande träning med en starttid. Alla set hör till exakt ett pass.
_Undvik:_ workout, session, träning.

**Spökdata:**
Vad som lyftes senast i en övning, visat som grå platshållartext vid inmatning. Ett
minnesstöd, aldrig ett ifyllt värde och aldrig ett förslag på vad du *borde* göra.
_Undvik:_ autofyll, förslag, ghost.

**Importerat set:**
Ett set som kommer från Adams gamla anteckningar i stället för från appen. Räknas i
personbästa, grafer och statistik — men aldrig som spökdata.
_Undvik:_ historiskt lyft, gammal data.

**Syntetiskt pass:**
Ett pass som aldrig ägt rum, skapat enbart för att importerade set måste tillhöra ett pass.
Märkt i databasen och bortfiltrerat ur passlistan.
_Undvik:_ fejkpass, platshållarpass.

**Uppskattat datum:**
En tidpunkt vi räknat oss fram till i stället för läst någonstans. Alla V-nummer utan år är
uppskattade. Ordningen mellan punkterna är tillförlitlig; den exakta dagen är det inte.
_Undvik:_ gissat datum, ungefärligt datum.

**Variant:**
En övning som skiljer sig från en annan på ett sätt som påverkar hur tungt den är —
handgrepp, lutning, gummiband. **En variant är en egen övning i katalogen**, inte ett
attribut på setet. Pull ups och chins är två övningar, inte en med två grepp.
_Undvik:_ version, utförande.

## 4. UI / Designspråk och Inspiration
- **Vetenskapligt Datafokus (RP Hypertrophy / Dr. Mike Israetel):** Appen ska ta inspiration från RP Hypertrophy-appen gällande vetenskaplig loggning (fokus på RIR, ansträngning och progression). AI-chatten ska användas för att göra inmatningen av denna data snabbare och mindre tungrodd än i RP-appen.
- **Visuell stil:** Minimalistiskt, rena kontraster. Siffrorna och historiken står i centrum. Absolut inget onödigt fluff eller sociala flöden.
- **Tema — ÄNDRAT 2026-08-12. Ljust är förval, inte mörkt.** Här stod tidigare "mörkt tema (dark mode)" som en egenskap hos appen, och `DESIGN.md` byggde hela sin palett på ren svart utifrån den raden. Adam vände det i grillningen inför 11B: *"jag vill inte bara ha mörk design. Egentligen vill jag ha alternativ mellan ljusare och mörkare mode. Men tycker vi kan börja med att designa ljusare."*

      **Vad som gäller:** ljust tema byggs först och är förval. Mörkt definieras som en andra
      värdeuppsättning bakom **samma semantiska tokennamn**, mäts mot WCAG AA, men byggs inte
      förrän Adam säger till. Att det är möjligt utan att röra komponenterna är verifierat och
      inte antaget: `src/ui/` innehåller **noll hårdkodade hexvärden och noll Tailwind-gråskalor**
      (mätt 2026-08-12), så varje färg går redan genom ett token.

      **Detta upphäver `DESIGN.md` §0:s rad om "endast mörkt tema"** och öppnar §0.5 och §1 på nytt.
      Lime `#bef264` överlever inte bytet: 16,07:1 mot svart blir ~1,3:1 mot vitt.
- **Referenser (utökade 2026-08-12):** RP Hypertrophy för datafokus. Jeff Nippard och Boostcamp för estetik. Tillagda: **Luna** (budgetapp) och **Ellie** (dagsplanerare) av Chris Raroque — Luna för täta sifferrader på liten skärm, vilket uppfyller kravet i 11B.0b på minst en referens utanför träningsappsgenren, och Ellie för färg, form och rörelse i ljust tema.
- **Tysta framgångar:** Inga blockernade pop-ups när ett set sparas. En diskret färgförändring eller en liten ikon räcker för att bekräfta att datan sparats ("Success State").
- **Offline-First:** Användargränssnittet måste uppdateras omedelbart (Optimistic UI) via lokal IndexedDB, oavsett nätverkets status. Skrivningar till databasen sker tyst i bakgrunden.
