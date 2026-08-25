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
- **Spökdata (Auto-fill) — OMSKRIVEN 2026-08-18. Se rutan nedan, den ändrar vad spökdata är.**
  Inmatningsfälten (Vikt/Reps) är förifyllda så att ett vanligt set kan loggas med ett enda
  tryck. Värdet är **inte längre exakt vad som lyftes förra passet** utan ett snitt över de tre
  senaste passen med samma övning.
- **Vilotimer:** Startar asynkront när ett set loggas. Appen använder Wake Lock API för att förhindra att skärmen släcks under passet, samt Web Audio API för larm.
- **Historik:** Visuell representation av tidigare pass och PB (Personbästa).

> ### ⚠️ Spökdatan gjordes om 2026-08-18, och skälet är Adams eget
>
> Här stod att fälten fylls med *"exakt vad användaren lyfte under förra passet"*. Den raden
> beskrev appens näst viktigaste funktion, och den var samtidigt hälften av skälet att Adam
> slutar använda loggningsappar. Ordagrant, i grillningen inför steg 4:
>
> > *"man vill bara köra på och göra sitt bästa utan att alltid tänka på att man ska vara
> > bättre eller lika bra som senaste passet (iom att man ser vad man tog senaste)"*
>
> **Två saker låg i samma mening och måste skiljas åt:**
>
> | | Vad den gör | Domen |
> |---|---|---|
> | **Förifyllning i fältet** | Sparar knapptryck. Ett vanligt set loggas med ett tryck | Behålls — det är hela friktionsvinsten |
> | **Siffran som visas bredvid** | Ett facit du mäts mot vid varje set | Görs om |
>
> **Vad som gäller nu.** Värdet är **snittet av de tre senaste passen med samma övning**, per
> setnummer, avrundat till en vikt som går att lägga på stången. Samma värde används
> både som förifyllning och som visad referens — annars vore facit tillbaka i fältet.
>
> > ### 🔄 Snittet är TVÅ tal, inte ett. Preciserat av Adam 2026-08-19
> >
> > Stycket ovan skrev *"en vikt"* och *"ett och samma tal"*. **Det räcker inte, och skälet är
> > Adams:**
> >
> > > *"för att det ska make sense måste man visa snitt i vikt kopplat till reps och inte bara
> > > snitt i vikt. för om man tar ju mer reps på högre vikt osv."*
> >
> > **Vikt och reps går inte att skilja åt.** 90 kg säger ingenting utan hur många reps det var
> > på. Ett snitt som bara följer vikten kan **stiga för att du kört färre reps** — det ser ut
> > som framsteg utan att vara det, vilket är precis den falska signal hela omskrivningen finns
> > för att ta bort.
> >
> > **Vad som visas:** snittvikten **och** snittrepsen på den vikten, för de senaste passen med
> > övningen. Alltså `90×5`, inte `90`. `DESIGN.md` §3.1:s skiss sa detta redan; det var
> > `SPEC.md` som var otydlig.
> >
> > ✅ **Följdfrågan är AVGJORD 2026-08-25 av Adam: snittad vikt, verkliga reps.**
> >
> > Frågan stod öppen här med flit: snittas vikt och reps var för sig kan resultatet bli en
> > kombination som aldrig utförts — 90×5, 85×8 och 92,5×4 ger `90×6`, ett set som inte hänt.
> >
> > **Regeln som gäller:** vikten snittas och avrundas till 2,5 kg. **Repsen snittas inte** —
> > de tas från det set vars vikt ligger närmast snittvikten. Exemplet ger `90×5`, ett set som
> > faktiskt utförts.
> >
> > ⚠️ **Skälet är inte att ett påhittat par känns fel — det är att felet lutar åt ett håll.**
> > Vikt och reps byter av varandra: kör man tyngre blir det färre reps. Snittas de var för sig
> > hamnar paret därför **alltid ovanför** den verkliga kurvan, aldrig under. Mätt på briefens
> > eget exempel: `90×6` är i e1RM **108**, mot de faktiska setens **105,0 / 107,7 / 104,8** —
> > tyngre än vartenda set som utfördes. **Det är den för höga referensen den här rutan finns
> > för att ta bort, tillbaka genom bakdörren.** Ett för lågt tal hade varit ofarligt; ett för
> > högt är exakt skadan.
> >
> > Talet är fortfarande ett typvärde och inte ett facit. Att det nu råkar vara ett verkligt
> > set är en följd av regeln, inte ett krav på den.
>
> > ### 🔄 Avrundningen är INTE 2,5 kg överallt. Avgjort 2026-08-25
> >
> > Här stod *"en vikt som går att lägga på stången"*, och koden avrundade allt till 2,5 kg.
> > **Det är fel för allt som inte är en skivstång.** Adam: *"vissa övningar som hantelcurl kör
> > man ju enkilos grejer ibland."* Hantelcurl på 8, 9 och 10 kg ger snittet 9 — avrundat till
> > 2,5-rutnätet blir det **10**, en vikt han kanske aldrig lyft.
> >
> > **Regeln som gäller:** viktsteget härleds ur övningens `equipment`.
> >
> > | Utrustning | Steg | Varför |
> > |---|---|---|
> > | `skivstång` | **2,5 kg** | 1,25-skivor finns på varje gym. Garanterat |
> > | `hantlar`, `kabel`, `maskin`, `kroppsvikt` | **1 kg** | Varierar mellan gym. Inget att garantera |
> >
> > **Principen bakom, och den är viktigare än talen: avrunda bara så grovt som utrustningen är
> > garanterad att vara.** Asymmetrin är avsiktlig. Avrundas hantlar till 1 kg på ett gym med
> > tvåkilossteg blir talet på sin höjd 1 kg fel, och ett tryck på `+1` rättar det. Avrundas de
> > till 2 kg på ett gym med enkilossteg **förstörs precision användaren faktiskt använde** —
> > 9 blir 8 eller 10, och det verkliga normalläget går inte längre att se. **Ett för fint steg
> > är återställbart. Ett för grovt är det inte.**
> >
> > ⚠️ **Adam tränar på olika gym**, och det är skälet att regeln formulerades som en princip i
> > stället för som en tabell över hans utrustning. Frågan *"vilka steg har ditt gym?"* har
> > inget svar, och en lösning som kräver ett är fel lösning.
> >
> > **Marknaden gör detta per övning, inte per utrustning** — FitNotes har ett redigerbart
> > `Weight Increment` per övnings-id, Strong har det under *Progression settings*, och
> > MacroFactors utvecklare har sagt att deras kommande träningsmodul följer FitNotes. Se
> > `docs/research/viktsteg-och-avrundning-i-gymappar.md`. **Vi börjar med att härleda ur
> > `equipment`** eftersom katalogen redan bär det fältet på alla 46 övningar — noll
> > schemaändring, noll migration. Ett redigerbart fält per övning läggs till **om** ett
> > standardvärde visar sig skava, inte innan. Adams beslut 2026-08-25.
>
> **"De tre senaste passen med den övningen"**, inte de tre senaste passen. Kör man bänk på
> måndagen och ben tisdag till torsdag innehåller de tre senaste passen noll bänkset.
> Preciserat av Adam, och formuleringen står här just för att den lösa varianten blir fel
> implementerad.
>
> **Per setnummer**, eftersom man blir svagare för varje set i rad. Set 3 jämförs med set 3.
>
> **Åldersgräns åtta veckor.** Är det senaste passet med övningen äldre än så visas inget
> snitt, utan när övningen senast tränades. Skälet är Adams eget bruksmönster: han tar paus
> när utvecklingen står stilla och återkommer senare. Utan gränsen presenteras ett två år
> gammalt snitt som "ditt normalläge", vilket är exakt den jämförelse regeln ska ta bort.
>
> **Varför ett snitt och inte senaste passet:** en enskild mätning är brus. MacroFactor —
> redan en av projektets fem referensappar — löste samma problem för kroppsvikt genom att
> visa en utjämnad trend i stället för dagsvikten. Adam föreslog samma sak för styrka utan
> att känna till kopplingen.
>
> **Regeln fanns redan i koden, fast bara för importerade set.** `repo.ts` skriver i 13.4:
> *"spökdatan är ett minnesstöd om förra passet — inte ett rekord att matcha varje gång
> övningen öppnas."* Avsikten var alltså rätt sedan tidigare; det var utförandet som gjorde
> minnesstödet till ett facit.
>
> ⚠️ **Detta motsäger marknadens konsensus med flit.** `docs/research/betalfunktioner-i-gymappar.md`
> rekommenderar klassisk spökdata, och det är vad Strong och Hevy gör. Vi avviker medvetet, på
> Adams egen erfarenhet. Ändras det tillbaka någon gång ska det vara efter ett beslut, inte
> för att någon läste researchen och trodde att briefen var omodern.

> ### 🔄 Ett andra, lösare loggningsläge är ett uttalat mål. Tillagt 2026-08-18
>
> **§2b nedan är öppen på den här punkten.** Adam i grillningen inför steg 4: det tar tid från
> passet att logga varje set, och han vill kunna *"logga mer allmänt hur det går i passen"*
> eller bara sina PB under perioder när han inte orkar mer.
>
> **Vad som är avgjort:** att ett sådant läge ska finnas. **Vad som inte är avgjort:** vad det
> innehåller. Adam själv: *"vet egentligen inte exakt om det behöver vara så stor skillnad på
> lägena."* Det avgörs i en egen runda, inte i designrundan.
>
> Raden står här för att nästa person inte ska läsa §2b som slutgiltig. Formen är fyra flikar
> — men den är ritad för ett enda loggningsläge, och det kommer att behöva prövas om.

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
