# Designbrief — Gym-App

Det femte dokumentet (se `CLAUDE.md` §8). Skrivs som **första steg i fas 11B** och är en
förutsättning för den, inte en dokumentation av den i efterhand.

**Status — omprövad 2026-08-12 i grillningen inför 11B:**

| Del | Innehåll | Läge |
|---|---|---|
| **§0** | Utgångspunkter | 🔄 **två nya regler 2026-08-12** (levande brief, förbudslistan) |
| **§0.5** | Visuell karaktär | 🔴 **ÖPPNAD IGEN 2026-08-12** — byggd på svart bakgrund, temat vänt till ljust |
| **§1** | Färgsystemet | 🔴 **ÖPPNAD IGEN 2026-08-12** — alla värden mätta mot svart |
| **§2** | Typografi och rytm | ✅ klar 2026-08-04 — **överlever temabytet**, storlekar och rytm är färgoberoende |
| **§3** | Skärmskisser | 🟡 formen står, men layouten är **inte låst** — se §0 |

> **Varför §0.5 och §1 öppnades igen.** Adam 2026-08-12: *"vill ta det en vända till för det
> är fortf mörkt och var det bästa jag hittade då bland de alternativ som togs fram. Vill nog
> göra det korrekt och bättre en gång till."* Lime valdes 2026-08-05 mellan tre **mörka**
> alternativ, alltså det bästa i ett urval som inte innehöll det han egentligen ville ha.
> `SPEC.md` §4 är ändrad i samma veva: ljust tema är förval.
>
> **Vad som INTE rivs:** §2 i sin helhet, och den kod som byggts mot briefen (`cfb2ca2`
> tokens och datadriven navigation, `6d70223` setraden och justeringsarket). Setraden löste
> ett uppmätt problem — raden klipptes av på 375 px — och det problemet är oberoende av
> bakgrundsfärg.

> **Ingen kod skrivs mot denna fil förrän Adam godkänt respektive del.** `index.css` och
> komponenterna ändras i fas 11B steg 4, en skärm i taget.

---

## §0 Utgångspunkter

**Måttstocken är "lika bra som de bästa apparna", inte "snabbast till varje pris"**
(`SPEC.md` §1, preciserad 2026-08-03). Friktion avgör *hur* något byggs — den är inte längre
ett argument för att låta bli att bygga det.

**Bruksmiljön styr mer än estetiken.** Appen används stående, svettig, enhänt, mitt i ett set,
ibland i dålig belysning. Därav de befintliga reglerna som inte omförhandlas här: tryckytor
minst 48×48 px, setraden är största elementet på skärmen. ~~endast mörkt tema~~ — **struken
2026-08-12**, se `SPEC.md` §4. Ljust är förval.

**Referenser enligt SPEC §4:** RP Hypertrophy för datafokus, Jeff Nippard och Boostcamp för
estetik, Luna och Ellie av Chris Raroque för ljust tema och rörelse. Studerade öppna appar
listas i `EXTERNT.md`.

---

### §0.1 Briefen är levande, inte ett kontrakt

**Tillagd 2026-08-12 på Adams begäran.** Den här paragrafen handlar om hur dokumentet ska
användas över tid, och den saknades helt.

Adams egna ord, som är hela motivet: *"det är kanske bra om man inte fullbordar till en
specifik design för alltid utan mer eller mindre jobbar sig fram och börjar på något sätt som
ser bra ut och fungerar bra till att börja med, men vara öppna till att göra ändringar i
framtiden om man känner att det är mer lämpligt."*

**Regeln:** riktningen är fastställd, värdena är utbytbara. Att ett värde ändras om ett halvår
är förväntat och inte ett misslyckande. **Men den som ändrar ett värde skriver varför i samma
commit.** Skillnaden mellan en levande brief och en som tyst blivit osann är just den raden.

### §0.2 Metoden: låna, förstå, anpassa

Också tillagd 2026-08-12, och den formulerar arbetssättet som redan användes utan att stå
skrivet någonstans.

**Designen uppfinns inte, den lånas från appar som bevisligen fungerar.** Adam är inte
designer och ska inte behöva vara det. Därför är *"vad gör Hevy, Strava och Ellie, och varför"*
ett bättre underlag än *"vad tycker Adam om lila"*. Konkret innebär det att **varje val ska gå
att spåra till en namngiven referens med en skriven motivering** — en referensmapp utan
anteckningar är bara bilder.

Det är också vad som ersätter designskicklighet: valet står mellan färdiga alternativ som
bedöms på synintryck, inte mellan hexkoder i en textfil.

### §0.3 Förbudslistan — vad "AI-gjort" betyder konkret

Adams acceptanskriterium 2026-08-11 var *"vill även ta inspo för design från nätet och vad som
finns så det inte ser AI-gjort och alltför stereotypiskt ut"*. Ett kriterium som inte går att
underkänna är i praktiken ingen regel, så här är det som en lista. Preciserad av Adam
2026-08-12.

**Följande får inte förekomma:**

| Förbud | Varför |
|---|---|
| **Lila eller mörkblå gradient** | Standardvalet när en modell ombeds designa fritt |
| **Glasmorfism** (frostat glas, suddig genomskinlighet) | Samma sak, och den läser dåligt i solljus |
| **Emoji som ikoner** | Ritas av operativsystemet, ser olika ut per plattform, kan inte ärva vår färg. **Åtta i `src/ui/`, varav sju är åtgärdade 2026-08-14** — kvar är 🏋 i `ExerciseCard.tsx`, som väntar på accentbrickan i steg 4. Se 11B.0c och 12.28 |
| **Jämnt rundade kort överallt** | När allt har samma radie bär radien ingen information |
| **Centrerad hjältetext** | Marknadsföringsspråk i en app som ska loggas i |
| **Tankstreck (—) i apptexten** | Adam 2026-08-12: läser som AI-skriven text. Gäller **det appen skriver till användaren**, inte den här filen eller kodkommentarer |

Listan fångar reflexerna. Det som gör det verkliga arbetet är §0.2: att varje val härleds ur
en referens.

---

## §0.5 Visuell karaktär

> **Detta avsnitt borde ha skrivits FÖRE §1, och att det inte gjordes är briefens allvarligaste
> fel.** §1 och §2 definierar ett *system* — färgroller, typografisk skala, spacing — med
> uppmätta kontraster. Allt korrekt. Men ingenstans bestämdes hur appen ska **kännas**.
>
> Resultatet syntes så fort appen granskades: Adams omdöme var *"mörk, tråkig, billigt gjord,
> ingen modern fräsch känsla"*. Han hade rätt, och felet var inte hantverket utan att steget
> hoppades över. **Ett korrekt system utan karaktär ger ett korrekt tråkigt gränssnitt.**

### Vad referenserna visade

Fem appar i `docs/Reference-pics/`, valda av Adam: **Hevy, MacroFactor, Strava, Apple Watch,
Lifesum.**

**Apple Watch är den avgörande.** Den är mörk och ser dyr ut — vilket bevisar att mörkt tema
aldrig var problemet.

| Mekanism | Referenserna | Vi, före 2026-08-05 |
|---|---|---|
| **En bestämd accentfärg** | Hevy blå · Strava orange · Lifesum grön · Watch orange | **Ingen alls** |
| **Färg i små mättade former** | Apple Watch: färgad ikonruta per rad | Ingen |
| **Stor fet titel** | 30–34 px | 22 px |
| **Generösa radier** | 16–20 px | 8 px |
| Etikett + stort värde | Alla fem | ✅ fanns redan |

**Den avgörande insikten:** färgen bor i **små mättade former** — ikonrutor, chips, fyllda
bockar — inte i texten. Texten förblir vit. Det är därför Apple Watch kan vara nästan helt
svartvit och ändå kännas levande, medan vår app var enfärgat grå och kändes död.

### Luna och Ellie — hämtade och lästa 2026-08-14

De två referenserna som `SPEC.md` §4 pekade ut 2026-08-12 men som aldrig hämtades. Båda är
byggda av **Chris Raroque** (utgivare AloaLabs, LLC — samma säljarnamn på båda listningarna,
vilket är det som binder ihop dem). Tio skärmdumpar ligger i `docs/Reference-pics/` som
`Ellie iOS 1–5.jpg` och `Luna iOS 1–5.jpg`.

⚠️ **Vad de här bilderna INTE kan svara på.** Det är **App Store-marknadsföringsbilder**, inte
den körda appen: iscensatta, idealiserade, och de kan ligga efter aktuell version. Framför allt
— `SPEC.md` bad om Ellie för *"färg, form och **rörelse**"*, och **rörelse går inte att avgöra
ur stillbilder.** Två av tre levererade. Vill vi ha rörelsedelen är källan Raroques
YouTube-spellistor, där han bygger båda apparna på kamera. Det är inte gjort, och 11B.5
(rörelse) har inget stöd härifrån.

#### Ellie — vad som ska tas efter, och varför

**`Ellie iOS 3.jpg` är den viktigaste bilden i hela mappen.** Den är **väg C, i produktion,
oberoende av oss.** Timebox-blocken bär betydelse med *tonad yta + tjock färgad vänsterkant +
text i samma kulör*. Exakt den modell Adam valde 2026-08-14, byggd av någon annan som kom fram
till den utan att ha läst vår brief.

Tre saker i den bilden är belägg, inte tycke:

1. **Det gula blocket har mörk ockratext på blek gul yta.** Aldrig klargul linje, aldrig gul
   text. Det är **ordagrant §1b:s slutsats** — *"klargult kan inte bära betydelse"*, *"kulören
   lever i ytan, inte i kanten"*. En utgiven app har alltså träffat samma vägg och valt samma
   utväg. Det gör begränsningen till en egenskap hos gult, inte till vår pedanteri.
2. **Den färgade vänsterkanten är B4:s accentbricka.** En färgad stapel som bär identitet
   **utan symbol i sig** — precis det B4 gör och det som gör att 🏋 kan raderas i steg 4 utan
   att ersättas. Formen är därmed prövad i produktion, inte bara i vår mockup.
3. **De tonade blocken ligger alltid på en vit/nästan vit yta, aldrig direkt på bakgrunden.**
   Samma som §1b fynd 3. Ta med den regeln oförändrad.

Ur `Ellie iOS 1.jpg` (dagslistan):

| Ta efter | Varför |
|---|---|
| Varm off-white botten, **rent vita kort** med tunn ljus kant + mycket mjuk skugga | Samma struktur som vårt papper `#F0EBE1` + vita kort. Bekräftar att separationen behöver både kant och skugga — §1b mätte korten till 1,188:1, vilket är för lite på egen hand |
| Kategorifärg som en **liten prick**, inte en fyllning | Håller §0.5:s regel om små mättade former. Färgen syns utan att någon yta domineras |
| Bock: **fylld grön ruta med vit glyf** när klar, **enbart konturruta** när tom | Direkt användbar för setbekräftelsen i `SetRow`. Notera att detta är tillåtet för `ok` men **förbjudet för `warn`** — vitt på gult mäter 1,58:1 |
| Datumraden med **vald dag som fylld svart cirkel**, inte accentfärgad | Markeringen är neutral, så accenten förblir osparad och de semantiska färgerna behåller sin betydelse. Värt att ta rakt av till Historik |

⛔ **Vad som INTE ska tas från Ellie: densiteten.** Ett kort per uppgift med den paddningen ger
~5 rader per skärm. Vi ska klara **25 set** (11B.9). Ellie är referens för färg och form —
aldrig för täthet. Att `SPEC.md` delade upp rollerna mellan de två apparna var alltså rätt.

`Ellie iOS 4.jpg` (bottenark över nedtonad bakgrund, sekundärval som blekt fyllda chips) är
underlag för vår `SetAdjustSheet`. `Ellie iOS 5.jpg` visar webbappen, där samma språk pressas
tätare: tidsuppskattning i en liten grå pill, metaraden högerställd.

#### Luna — vad som ska tas efter, och varför

`Luna iOS 1.jpg` är svaret på **täta sifferrader**, och den gör fyra saker vi ska kopiera:

1. **Bara ett tal per rad är färgat** — det som kräver ett beslut. Det andra talet är vanligt
   svart. Färgas varje siffra läses ingen av dem. Det här är den enskilt viktigaste
   densitetslärdomen och den motsäger frestelsen att färgkoda allt.
2. **Det färgade talet ligger i en tonad pill**, blek grön/blek amber/blek röd med **mörk text
   i samma kulör**. Väg C igen, och amber-pillen har mörk ockratext precis som Ellies gula
   block. **Två oberoende appar, samma lösning på gult.**
3. **Raderna är helt platta — inga avdelare mellan dem.** Separationen görs av radhöjd och
   högerställning ensamt. Avdelare kostar pixlar och lägger till brus; det är så man får plats
   med fler rader utan att det ser packat ut. Rakt in i 11B.9.
4. **Grupphuvudet namnger kolumnerna** i en egen kontur-ruta, tvåradigt: grå etikett över
   mörkt värde (`Weekly` / `6 days left` · `Budgeted` / `$360` · `Left` / `$347`). Samma grepp
   som `SetRow` redan använder enligt §2 — men Luna visar att det skalar till tre kolumner.

Ur `Luna iOS 2.jpg`: **beloppet är högerställt och grått, inte svart.** Titeln bär raden,
siffran slås upp först när man vill ha den. Ett billigt sätt att lugna en lång lista.
Datumrubriker (`Today`, `Yesterday`) står som fet mörk text utan behållare.

⛔ **Vad som INTE ska tas från Luna: emoji i färgade cirklar som kategoriikoner.** Det är
ordagrant §0.3:s förbudslista, och det är precis vad 11B.0c nyss tog bort. Luna kommer undan
med det för att appen är medvetet leksaksaktig; vår karaktär är Bläck, återhållsam. Lunas
violetta accent är av samma skäl för hög för oss.

`Luna iOS 3.jpg` (stor siffra + liten etikett + tunn förloppslinje) är underlag för timern och
passvolymen. `Luna iOS 4.jpg` visar valt tillstånd som **blek fyllning + hel färgad kant** —
användbart under väg C, där kanten bär betydelsen. `Luna iOS 5.jpg` har inget designvärde
(hundbilder) men är **primärkällans kvitto** på att Chris Raroque är utvecklaren, vilket är
påståendet `SPEC.md` §4 vilar på.

#### Sammanfattning: vad de två faktiskt tillförde

**Ellie bekräftade ett beslut vi redan fattat.** Den ändrar ingenting i §1b — den gör tvärtom
väg C och B4 mindre riskabla, eftersom båda nu är sedda i en utgiven app. Värdet ligger i att
vi slipper vara först.

**Luna tillförde något nytt.** De platta raderna utan avdelare och regeln *"bara ett tal per
rad får vara färgat"* stod ingenstans i briefen före i dag, och båda går direkt in i 11B.9.

**Kravet på en referens utanför träningsappsgenren är därmed uppfyllt** — Luna är en
budgetapp, Ellie en dagsplanerare. Ingen av dem har med styrketräning att göra, vilket var
hela poängen: briefen ska inte medelvärda Hevy och Boostcamp.

### Strong — hämtad och läst 2026-08-19

Mappens **enda negativa referens**, och den sista som saknades. Sex App Store-bilder ligger som
`Strong iOS 1–6.jpg`, hämtade från Apples publika lookup-API (app-id `464254577`, utgivare
**Strong Fitness PTE Limited**, version 6.5.0 släppt 2026-08-12).

⏰ **Bilderna är äldre än appen de säljer.** De är 1242×2208 px — 5,5-tumsformatet från
iPhone 8 Plus — och statusraden visar `Carrier` och prickar i stället för staplar, alltså
iOS 10-tidens utseende. Marknadsbilderna har inte följt med appens utveckling. **De visar
sannolikt en äldre Strong än den Adam använde och övergav**, och det är en verklig svaghet
hos just den här referensen. Samma reservation som för Ellie och Luna gäller dessutom: det är
iscensatta säljbilder, inte den körda appen.

**Bild 1 är den enda som betyder något för 11B.0g.** Den visar Pass-skärmen mitt i ett pass —
exakt vår skärm, byggd av någon annan. Bilderna 2–6 (övningsdetalj, viktskivekalkylator,
vilotimer, profil, hemskärmswidget) är sidoskärmar.

#### Fynd 1 — spökdatakolumnen är tom i Strongs egen säljbild

Setraden är `Set · Previous · kg · Reps · ✓`. I alla tre setraderna står **`No Previous`**.

Detta är bilden Strong själva valt för att sälja appen, och kolumnen har ingenting att visa i
någon rad. Man kan invända att det är en tom demodatabas — men det är just poängen: **de har
byggt säljbilden utan att bry sig om att fylla kolumnen.** Den bär inte tillräckligt mycket
värde för att iscensättas.

#### Fynd 2 — och den är i praktiken oläslig. Uppmätt

| Element | Färg | Bakgrund | Kontrast |
|---|---|---|---|
| `No Previous`, bekräftad rad | `#B2C1BA` | `#EAFAF0` | **1,73:1** |
| `No Previous`, obekräftad rad | `#C5C5C5` | `#F6F6F6` | **1,60:1** |
| `85` i `kg`-kolumnen, samma rad | `#1F2C2B` | `#EAFAF0` | **13,37:1** |

WCAG kräver 4,5:1 för brödtext och 3:1 för stor text. Spökdatan ligger på **under hälften av
det lägre kravet**, medan viktvärdet bredvid ligger på 13:1. Skillnaden är åtta gånger, i
samma rad — den är alltså medveten, inte ett slarv.

> **Metodnot:** värdena är mörkaste pixel i textytan, mätt mot radens bakgrund. Kantutjämning
> kan bara göra pixlar ljusare, aldrig mörkare, så **de uppmätta talen är tak** — den
> upplevda kontrasten är lika låg eller lägre, aldrig högre.

#### Fynd 3 — den kostar ungefär en tredjedel av radbredden

Setraden är 903 px bred av skärmens 1242. `Previous`-kolumnens utrymme är omkring **310 px,
drygt en tredjedel**, medan `kg` och `Reps` får ~165 px vardera. Texten `No Previous` mäter
224 px. Kolumngränser är inte utritade, så utrymmet är räknat ur mellanrummen och är därför
ungefärligt — men storleksordningen är entydig.

**Det här är axel 2:s argument, hämtat ur en app i produktion:** en alltid synlig spökdatakolumn
betalar en tredjedel av setradens bredd och lägger sig på 1,7:1 i kontrast, för något som ofta
inte finns.

⚠️ **Dra inte slutsatsen längre än den räcker.** Att Strong tonar ner kolumnen visar att *de*
värderat den lågt visuellt. Det säger ingenting om huruvida `SNITT` är rätt — Adams invändning
mot spökdata i `SPEC.md` §2 var psykologisk, inte visuell. De två fynden pekar åt samma håll av
olika skäl, och det är värt att hålla isär.

#### Fynd 4 — `Previous` har ingen inmatningsform, och det är avsiktligt

I den obekräftade raden får `Set`, `kg`, `Reps` och bocken **var sitt ljusgrått rundat fält** —
synliga tryckytor. `Previous` är naken text på vit botten, utan fält.

Kolumnen är alltså redan visuellt klassad som *läsbart, inte rörbart*. **Det stödjer att vår
`SNITT` ritas som ren text utan fältram**, och att den inte ska se ut som något man kan fylla i.

#### Fynd 5 — fritexten ligger överst, alltid synlig, utan ram

Under passets titel och tid, **ovanför första övningen**, står passanteckningen som vanlig
brödtext: *"Felt super successful with this workout. Having a good night's rest definitely
helped!"* Ingen ram, ingen etikett, ingen "lägg till anteckning"-knapp. Den syns i bild 1 och
igen i bild 3, alltså på samma plats i två olika skärmlägen.

**Detta är axel 1:s "alltid synligt fält överst", härlett ur en etablerad app** — vilket är vad
11B.0g kräver.

⚠️ **Men det är inte samma sak som vår fritext.** Hos Strong är detta en *anteckning om passet*,
skriven efteråt och läst av människan. Vår fritext är **inmatning** som tolkas av AI och blir
set. Strong visar var den kan ligga, inte hur den ska bete sig när man skriver i den.

#### Fynd 6 — bekräftade set delar ett enda grönt band

Set 1 och 2 ligger i **en sammanhängande grön yta** (`#EAFAF0`, y 1680–1887 i bilden), utan
avdelare mellan raderna och kant till kant utan radie. Bocken är `#30CD6C` i fylld rundad ruta;
den obekräftade radens bock är en tunn linje utan ruta.

Det är **Lunas "platta rader utan avdelare" en gång till, oberoende bekräftat** — nu i en
träningsapp i stället för en budgetapp.

#### Fynd 7 — betalväggen syns i säljbilderna, och det är grafhistoriken

Bild 2 har ett **hänglås** på övningsdetaljen, vars flikar är `About · History · Charts ·
Records`. Bild 5 har en **gul nyckelikon** på grafen *Squat — Best Set*.

**Det som är låst är alltså graferna och rekorden.** Det är exakt vad båda undersökningarna i
11B.0h landade på, och nu ett tredje oberoende belägg — den här gången ur konkurrentens egen
marknadsföring i stället för ur en rapport.

#### Vad bilderna INTE kan svara på — och varför Strong ändå hämtades

**Sex säljbilder kan visa hur Strong ser ut. De kan inte visa varför Adam slutade.** Det är
hela skälet till att appen är med i mappen, och den delen är hans att svara på — de nio andra
referenserna visar appar som ser bra ut, ingen visar vad som fick honom att sluta.

#### Adams svar 2026-08-19

> ✏️ **Rättat samma dag, efter Adams invändning:** *"känns som att du tar mina svar och
> förvränger dom. Behöver inte överdriva så hårt alltid."* Första versionen av det här stycket
> skrev att utseendet var frikänt och att `Previous`-kolumnen *"gjorde skadan"*. Ingetdera
> följer av svaren. Stycket står nu som svaren gavs.

| Fråga | Svar |
|---|---|
| Tittade du på `Previous`-kolumnen? | *"Tror jag tittade lite … minns inte exakt"* |
| Något att peka på i bilden? | *"Inget riktigt speciellt"* — men *"tycker fortf inte strong interfacet är så snyggt"* |
| Känner du igen versionen? | *"Ja lite ja det gör jag"* |
| Skrev du fritext i Strong? | *"Jag skrev sällan saker i strong vad jag minns"* |

**Utseendet är inte frikänt.** Adam tycker fortfarande inte att Strong är snyggt. Han kunde
bara inte peka ut ett *enskilt element* som orsak, vilket är något annat. Motviljan är alltså
**diffus snarare än lokaliserad**.

Det är i sig användbart för hur referensen ska brukas: **Strong ger oss ingen lista på detaljer
att undvika, utan en helhet att inte hamna i.** Att leta efter den avgörande detaljen i
bilderna är därför fel arbete.

**`Previous`: underlaget är för tunt för att avgöra något.** *"Tror … minns inte exakt"*, plus
Adams eget tillägg *"behöver inte ta mig så hårt på orden."* Det enda som kan sägas är att han
inte beskrev kolumnen som osynlig. **Axel 2 avgörs i mockupen, inte här.**

**Titeln får tas bort under pass.** *"Det spelar inte så mycket roll att det står så, kan ta
bort det från skärmen när man tränar."* Frigör översta raden, som axel 1 konkurrerar om.

#### Fritexten är två funktioner, inte en — Adams distinktion 2026-08-19

Kom ur den omställda frågan. **Briefen har hittills behandlat detta som ett element. Adam
skiljer på två:**

| | Vad det är | Adams hållning |
|---|---|---|
| **Passkommentar** | Fritext *om* passet, skriven när man avslutar | *"vi kan prova att ha den för oss ändå … kommentera något när man känner för det när man avslutar passet"* — **ja, men lågt insatsvärde** |
| **Fritext-loggning** | `bänk 80x8` tolkas av AI och blir set | *"vet inte om jag kommer använda fritext alternativet så mycket men får se"* — **osäker** |

*"Men det är skillnad på det och att skriva 'bänk 80x8' för att logga ett set."*

⚠️ **Adam tror att strukturerad inmatning kan vara effektivare för själva loggningen:**
*"tror ändå det är mer effektivt att söka på övningen klicka och skrolla osv för att lägga
till hur många set och vikt."*

Det är användarens omdöme om appens uttalade kärnvärde, och det ska stå kvar oavsett vad som
byggs. **Men det ska inte heller blåsas upp:** han säger *"får se"* och *"kanske går att
utveckla mer sen"* — osäkerhet, inte avslag. `SPEC.md` §2 har redan ett **andra
loggningsläge** som mål, vilket är precis det han efterfrågar. Ingen kursändring behövs; det
som ändras är att det andra läget inte längre är sekundärt av artighet.

**Följden för axel 1:** placeringen överst — den Strong visar och den `DESIGN.md` §3.1 utgår
från — gäller **passkommentaren**. Fritext-loggningen är en annan sak, används mitt i passet
och behöver inte samma yta. **Mockupen ska pröva dem som två element, inte ett.**

### ✅ BESLUTET SOM GÄLLER: Bläck, valt av Adam 2026-08-12

**Ljust tema. Papper `#F0EBE1`, accent marinblå `#2B4570`, Fraunces i rubriker.**
Valt ur `docs/mockups/11b-slutlig-fargvanda.html` efter fyra omgångar. Allt nedanför denna
rubrik som handlar om lime och svart bakgrund är **överspelat** och står kvar enbart som
historik.

**Adams förbehåll, ordagrant:** *"Kanske är lite tråkigt me bläck men det ser typ ändå bäst
ut."* Det förbehållet togs på allvar och ledde till ett fynd, se nästa stycke.

#### Papperet fördjupades efter en mätning, inte efter en smakåsikt

Kombinationen som valdes hade papper `#FCFAF7` och svagt tonade kort. **Separationen mellan
kort och papper mättes till 1,01:1**, alltså i praktiken ingen alls: korten syntes bara tack
vare sin skugga. Det är en mätbar orsak till att skärmen läste som platt, och den förklarar
Adams "lite tråkigt" bättre än accentfärgen gör.

**Åtgärd:** korten blev **rent vita** och papperet fördjupades till `#F0EBE1`.
Separationen steg till **1,19:1**, vilket är exakt samma värde som den varmare kombinationen
"Bränd" hade. Den accenttoning Adam bad om flyttades till de **sekundära** ytorna, alltså
mätrutor, genväg och PB-chip, där den inte äter upp kortens separation.

Djupare papper prövades och förkastades på mätning, inte på tycke: vid `#ECE6DA` faller
sekundärtexten till 4,37:1 och klarar inte AA.

#### Tokens — alla uppmätta 2026-08-12 mot ljus botten

| Token | Värde | Kontrast | Roll |
|---|---|---|---|
| `--color-bg` | **`#F0EBE1`** | — | Papperet |
| `--color-surface` | **`#FFFFFF`** | 1,19:1 mot bg | Kort. Rent vitt för separationens skull |
| `--color-fg` | `#1C1917` | **16,0:1** | Text |
| `--color-dim` | `#6F6960` | **4,57:1** | Sekundär text. Golvet, tål ingen ljusare botten |
| `--color-line` | `#F0ECE5` | — | Dekorativ linje |
| `--color-line-strong` | `#C4BCB0` | — | Kant som bär betydelse |
| **`--color-accent`** | **`#2B4570`** | **8,08:1** mot bg | Appens färg |
| `--color-accent-text` | `#263C63` | **10,5:1** mot kort | Länkfärg |
| `--color-ok` | `#2F7A55` | ⚠️ se not | Sparat. Betydelsen är upptagen |

> ⚠️ **`--color-ok` bar ett missvisande mätvärde.** Här stod *"5,2:1 mot vit bock"*. Det är
> sant men mäter **en vit bock ovanpå fyllningen** — inte färgen som text. Som text mäter
> `#2F7A55` **4,38:1 mot papperet**, alltså under AA. Uppmätt 2026-08-14. Ersätts i §1b.

**Sekundära ytor tonas i accenten, och andelen är regeln:** kort 0 %, mätrutor och chips
5,5 %, genvägen 8,5 %, PB-chipet 15 %. Tonerna **räknas fram ur accenten** i stället för att
handplockas, så de kan aldrig glida isär från den om accenten justeras.

#### Typsnitt: Fraunces i rubriker, systemets i allt annat

**Fraunces** (OFL) sätter sidrubriker. **Systemets typsnitt sätter alla siffror**, och det är
inte en kompromiss utan ett krav: sidan mätte Fraunces och den **saknar tabulära siffror**,
alltså skulle tal hoppa i sidled när de ändras, vilket 11B.2 förbjuder. Familjen Grotesk och
Bricolage Grotesque klarade båda testet men valdes bort.

**✅ Klart 2026-08-12 — teckensnittet ligger i repot.**
`src/assets/fonts/fraunces-var-latin.woff2`, 65,7 kB, latinsk delmängd, axlarna `opsz` 9–144
och `wght` 400–700 (`SOFT` och `WONK` på förval, precis som i mockuperna). Licenstexten ligger
bredvid som `OFL.txt` eftersom OFL kräver att den följer med fontfilen, och posten står i
`docs/EXTERNT.md`. **Kvar till steg 4:** `@font-face` i `src/index.css` och tokenet som pekar
rubrikerna hit.

---

### ~~Beslutet: lime, vald av Adam 2026-08-05~~ (ÖVERSPELAT, se ovan)

Tre riktningar togs fram som körbara mockuper och jämfördes visuellt sida vid sida —
inte som hexkoder i text. Adam valde **lime**.

**Varför inte grönt, gult eller rött som accent:** de är **upptagna av betydelser** — sparat,
uppmärksamhet, fel. En accentfärg som krockar med en semantisk färg gör båda otydliga. Lime
ligger tillräckligt långt från vårt gröna `#3dd68c` för att inte förväxlas, och läser som
"gym" snarare än "wellness".

### Karaktärstokens — alla uppmätta 2026-08-05

| Token | Värde | Kontrast mot bg | Roll |
|---|---|---|---|
| `--color-bg` | **`#000000`** | — | Ren svart. **Ändrad från `#0a0a0a`** |
| `--color-surface` | `#16161a` | 1,16:1 | Kort |
| `--color-fg` | `#f5f5f7` | **19,29:1** | Text |
| `--color-dim` | `#8e8e96` | **6,46:1** | Sekundär text |
| `--color-line` | `#2a2a30` | 1,47:1 | Dekorativ kant |
| `--color-line-strong` | `#606068` | **3,37:1** | Kant som bär betydelse |
| **`--color-accent`** | **`#bef264`** | **16,07:1** | Appens färg |
| `--color-accent-soft` | `#1e2610` | — | Yta bakom accentmarkerat |

Svart text på limeknapp: **16,07:1**. Fyllda accentknappar fungerar utan undantag.

**Varför ren svart och inte `#0a0a0a`:** kortsteget går från 1,104:1 till 1,164:1. Marginellt
i siffror — men tillsammans med 16 px radie och en synlig kant är det skillnaden mellan att
kort *finns* och att de flyter ihop med bakgrunden. På OLED ger ren svart dessutom släckta
pixlar, vilket både ser djupare ut och drar mindre ström under ett långt pass.

**Följd:** PWA-manifestets `theme_color` och `background_color` måste ändras i samma commit,
annars blir startskärmen och statusraden en annan svärta än appen.

### Formspråk — UPPDATERAT 2026-08-12 efter formvalet

- **Radie 18 px** på övningsytor och ark (`--radius-card`). Knappar och chips: pillerform.
  Höjt från 16 px i formvalet.
- **Accentbricka per övning:** 10 × 34 px, radie 5 px, fylld med accentfärgen, till vänster om
  övningsnamnet.
- **Navigeringen flyter:** pillerformad, indragen från kanterna, med accentfylld markering av
  aktiv flik. Inte en fastsittande list över hela bredden.
- **Timer och PB som chips** överst i passet, inte som lager över innehållet.

> ### 🔄 Ikonrutan är struken. Detta motsäger raden som stod här tidigare
>
> Här stod: *"Ikonruta per övning: 36 × 36 px, radie 10 px, fylld med accentfärgen. Detta är den
> enskilt viktigaste ändringen — den ger färg åt en skärm som annars är svartvit."*
>
> **Den raden var rätt när den skrevs och fel nu.** Den skrevs 2026-08-05 för en app med **svart**
> bakgrund, där en färgad kvadrat per rad var det enda som räddade skärmen från att vara helt
> svartvit. Ljust tema löser det problemet på annat sätt, och Adam pekade i formvalet ut ikonrutan
> som en del av det han kallade basic: *"Kort med rundade hörn och en ikonruta till vänster är ett
> mönster nästan varje modern app använder."*
>
> **Ersättaren gör samma jobb billigare.** Accentbrickan är en smal fylld stapel i stället för en
> kvadrat med en symbol i. Den ger färg åt raden, markerar var en övning börjar, och kräver
> **ingen ikon per övning** — vilket den gamla lösningen gjorde, och som ingen någonsin löst
> (🏋 användes för samtliga övningar).
>
> **Följd för uppgift 11B.0c:** ikonbehovet krymper. Kvar är navigeringens fyra flikar, bocken,
> plus, tillbakapil och menypunkterna, alltså omkring tio ikoner totalt. Ingen övningsspecifik
> ikonuppsättning behövs, och det var den svåra delen.

### Vad som INTE ändras

> ### ⛔ FELAKTIGT. Rättat 2026-08-14 — se §1b
>
> Här stod: *"Semantikens färger (`ok`, `warn`, `err`, `pb`) står kvar oförändrade från §1 —
> de är mätta, godkända och betyder något."*
>
> **De är mätta mot `#0a0a0a`.** §1:s värden är Radix **mörka** skalor. Mot papperet
> `#F0EBE1` mäter de **1,29:1 till 1,77:1** — `--color-warn-text` (`#ffca16`) hamnar på
> 1,29:1 och är i praktiken osynligt. Påståendet är alltså inte en avrundning åt fel håll,
> det är fel.
>
> **Varför felet var lätt att göra:** meningen skrevs samma dag som temabytet, och den är
> sann om *betydelserna*. Grön betyder fortfarande sparat. Det är **värdena** som inte
> överlever ett bakgrundsbyte, och de två sakerna låg i samma mening.
>
> Semantiken görs om i **§1b**. Betydelserna därifrån och från §1 står kvar oförändrade.

Accenten är ett **tillägg**, inte en omskrivning.

Typografin från §2 står kvar, med ett undantag: **sidrubriken går från 22 till 30 px.**
Referenserna är samstämmiga och 22 px läser som en underrubrik.

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

## §1b Semantiken mot ljust papper

> **§1 ovan gäller fortfarande för allt utom värdena.** Betydelserna — grön = sparat, gul =
> kräver ett beslut, röd = fel eller destruktivt, PB alltid med utskriven etikett — är
> oförändrade. Det som görs om här är hexvärdena, eftersom de var mätta mot svart.

**Uppmätt 2026-08-14** med WCAG:s luminansformel mot papperet `#F0EBE1` och korten
`#FFFFFF`. Papperet är det svårare underlaget och styr därför alla domar nedan.
Beslutsunderlaget ligger som körbar mockup i `docs/mockups/11b-semantiska-farger.html`.

**Mätmetoden är verifierad mot briefens egna publicerade tal** innan den användes på nya
värden: kort/papper 1,188:1 (§0.5 anger 1,19), `--color-dim` 4,57:1, `--color-accent`
8,08:1. Alla tre stämmer.

### Fynd 1 — de mörka värdena är obrukbara, inte bara suboptimala

| Token | Värde | Mot papper | Mot kort |
|---|---|---|---|
| `--color-ok-text` | `#3dd68c` | **1,58:1** | 1,88:1 |
| `--color-warn-text` | `#ffca16` | **1,29:1** | 1,53:1 |
| `--color-err-text` | `#ff9592` | **1,77:1** | 2,11:1 |
| `--color-pb-text` | `#b1f1cb` | **1,08:1** | 1,29:1 |

Kravet är 4,5:1. Detta är inte en justering utan en omskrivning.

### Fynd 2 — §1:s stegregel går inte att följa på ljust

§1 säger: *"Färgad text använder ALLTID steg 11."* **Den regeln fungerar inte här.**

| Roll | Radix ljust steg 11 | Mot papper | Mot kort |
|---|---|---|---|
| Sparat | `#218358` | **3,97:1** ⛔ | 4,72:1 ✓ |
| Uppmärksamhet | `#ab6400` | **3,88:1** ⛔ | 4,61:1 ✓ |
| Fel | `#ce2c31` | **4,39:1** ⛔ | 5,21:1 ✓ |

**Orsaken är konstruktionen, inte ett olyckligt val.** Radix ljusa skalor är byggda så att
steg 11 nätt och jämnt når 4,5:1 mot **vitt**. Vårt papper är mörkare än vitt, och äter upp
marginalen. Att steget klarar sig på korten men inte på papperet är alltså väntat så snart
man vet varför — och det är precis den sortens sak som en obruten kedja av kopierade
hexvärden döljer.

**Följd:** stegregeln ersätts av ett **kontrastmål**. Vilket mål är det som återstår att
välja, se nedan.

### Fynd 3 — tonade ytor försvinner på papperet

| Radix steg 3 | Mot papper |
|---|---|
| `#e6f6eb` (grön) | 1,061:1 |
| `#fff7c2` (gul) | 1,094:1 |
| `#feebec` (röd) | 1,036:1 |

Steget mellan kort och papper är 1,188:1. **De diskreta ytorna har alltså mindre separation
mot papperet än ett vanligt vitt kort har.** En varningsruta lagd direkt på bakgrunden blir
osynlig.

**Regel, och den gäller oavsett vilken väg som väljs nedan:** en tonad semantisk yta ligger
**alltid ovanpå ett vitt kort**, aldrig direkt på papperet. Skrivs som en regel just för att
den annars kommer att brytas av misstag — den är osynlig i koden och syns bara på skärmen.

### ✅ BESLUTET SOM GÄLLER: väg C, vald av Adam 2026-08-14

**Betydelsen bärs av yta och kant. Texten är nästan svart överallt.**
Det är så ljusa designsystem gör, och det är enda sättet gult kan läsa som gult — se
fynd 4 nedan för varför de andra vägarna inte kunde ge det.

**Följden för §1:s regler, skriven rakt ut:** regeln *"färgad text använder ALLTID steg 11"*
**upphör**. Färgad text blir ett undantag i stället för mönstret, och när den används har den
egna uppmätta värden (se tokenblocket). **Betydelserna är oförändrade** — grön = sparat,
gul = kräver ett beslut, röd = fel, PB alltid med utskriven etikett.

### Fynd 4 — valet av C flyttade kravet från texten till kanten

Detta mättes **efter** beslutet, och det ändrade värdena. Under väg B bar texten betydelsen
och kanten var dekorativ, alltså räckte 1,5:1. **Under C är kanten det som identifierar
rutan**, och då gäller WCAG 1.4.11: **3:1 mot kortet.**

| Roll | Steg 8 | Steg 9 | Steg 10 | Steg 11 | Vald kant |
|---|---|---|---|---|---|
| Sparat | 2,40 ⛔ | 3,16 ✓ | **3,55 ✓** | 4,72 ✓ | `#2b9a66` (steg 10) |
| Uppmärksamhet | 2,20 ⛔ | 1,58 ⛔ | 1,71 ⛔ | **4,61 ✓** | `#ab6400` (steg 11) |
| Fel | 2,39 ⛔ | 3,91 ✓ | **4,37 ✓** | 5,21 ✓ | `#dc3e42` (steg 10) |

⚠️ **Klargult kan inte bära betydelse mot vitt.** Amber steg 8, 9 och 10 mäter 1,58–2,20:1 —
alla under kravet. Det finns **exakt ett** användbart värde, steg 11 `#ab6400`, och det är
mörk ockra snarare än gult. **Kulören lever därför i ytan** (`#fff7c2`, blekgul), inte i
kanten. Det är inte en kompromiss utan konsekvensen av att gult är en ljus kulör: en gul yta
kan vara gul, en gul linje mot vitt kan inte samtidigt vara gul och synlig.

**Detta är också skälet att `warn` aldrig får en fylld yta med vit glyf ovanpå:** vitt på
`#ffc53d` mäter **1,58:1**. Grön (3,16:1) och röd (3,91:1) klarar det, gul gör det inte.

> ℹ️ **Mockupen visade först fel här.** `docs/mockups/11b-semantiska-farger.html` ritade
> C-kolumnens gula stapel i `#ffc53d`. Det dög för att *jämföra vägar*, men inte som
> beslutad token. Filen är rättad i samma commit, med felet utskrivet i den — ett
> beslutsunderlag som tyst korrigeras är inte längre ett underlag.

### Tokens — väg C. Detta är det som gäller

```css
@theme {
  /* Semantik mot ljust papper. Väg C, vald 2026-08-14.
   * Betydelsen bärs av YTA + KANT. Texten är --color-fg.
   * Radix Colors (MIT), ljusa skalor. Uppmätt mot #FFFFFF (kort).
   *
   * ⚠️ TONADE YTOR LIGGER ALLTID PÅ ETT VITT KORT, aldrig direkt på
   * papperet — se fynd 3. Mot papperet mäter de 1,04–1,09:1 och
   * försvinner, vilket är MINDRE än kortets egen 1,188:1. */

  /* Ytor. Svart text på dem: 15,25–16,10:1 */
  --color-ok-bg: #e6f6eb;
  --color-warn-bg: #fff7c2;
  --color-err-bg: #feebec;

  /* Kanter som BÄR betydelsen. Alla ≥3:1 mot kortet (WCAG 1.4.11) */
  --color-ok-line: #2b9a66;    /* 3,55:1 */
  --color-warn-line: #ab6400;  /* 4,61:1 — enda gula värdet som klarar kravet */
  --color-err-line: #dc3e42;   /* 4,37:1 */

  /* Fyllda ytor med vit glyf ovanpå. Form, krav 3:1 */
  --color-ok-solid: #30a46c;   /* vit bock: 3,16:1 */
  --color-err-solid: #e5484d;  /* vit glyf: 3,91:1 */
  /* warn har AVSIKTLIGT ingen solid: vitt på #ffc53d är 1,58:1 */

  /* UNDANTAG — färgad text utan yta bakom sig, t.ex. en naken
   * "Ta bort"-knapp. Ska vara sällsynt; mönstret är svart text på tonad
   * yta. Framräknade ur steg 11→12 tills 5,5:1 nås mot PAPPERET, som är
   * det svårare underlaget. */
  --color-ok-text: #1e6a49;    /* 5,50:1 papper · 6,54:1 kort */
  --color-warn-text: #87510d;  /* 5,50:1 papper · 6,54:1 kort */
  --color-err-text: #b2262d;   /* 5,51:1 papper · 6,55:1 kort */

  /* Personbästa. Färgen bär aldrig budskapet ensam — utskriven
   * PB-etikett följer alltid med, oförändrat från §1. */
  --color-pb-bg: #e6f6eb;
  --color-pb-line: #2b9a66;
}
```

**Vad som försvann jämfört med §1:** `--color-pb-text` finns inte längre som egen token. PB
är svart text på tonad yta med kant, precis som allt annat semantiskt, plus etiketten. En
egen textfärg för PB fanns bara för att bära budskapet med kulör — vilket §1 själv förbjöd i
samma stycke.

### De tre vägar som jämfördes

Behålls som historik. **C valdes.**

Kontrasterna är mätta och avgjorda. Kvar är ett val som inte är tekniskt, och som därför är
Adams: **hur mycket kulör som får offras för läsbarhet.** Alla tre klarar AA.

| Väg | Lägsta på papper | Gult läser som gult? | Vad det kostar |
|---|---|---|---|
| **A** — steg 12 som text | 9,57:1 | ⛔ Nej, blir brunt | Mättnaden faller 100 % → 57 % |
| **B** — framräknad 5,5:1 | 5,50:1 | Delvis, ockra | §1:s marginalprincip (9:1) överges |
| **C** — betydelsen i ytan | ~15,8:1 | ✅ Ja | Färgad text upphör som mönster |

**Rekommendationen var B. Adam valde C**, och han hade rätt: B var det säkra valet, inte
det bästa. Skälet mot C var att den är den största regeländringen och inte borde tas i
samma svep som ett bakgrundsbyte — men det är ett argument om *tajmning*, och regeländringen
måste ändå göras någon gång. **Gult som läsbar textfärg finns inte på ljus botten.**
B hade gett ockra och kallat det gult; C ger en gul yta som faktiskt är gul.

**Tonerna räknas fram, de handplockas inte:** de framräknade värdena lever kvar som
undantagstokens i C:s tokenblock. Varje sådant värde är steg 11 blandat mot steg 12 i sRGB
tills 5,5:1 nås mot papperet. Samma princip som §0.5:s accenttoner, och av samma skäl —
handplockade värden glider isär när något justeras.

⚠️ **`--color-ok-solid` bär vit bock på 3,16:1.** Det klarar 3:1 för grafiska objekt
(WCAG 1.4.11) men **inte** 4,5:1 som text. Bocken är en form, inte text, så det är
godtagbart — men byts den mot en siffra eller bokstav gäller inte längre domen.
Noterat här för att den sortens byte annars sker utan att någon mäter om.

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
| `--text-title` | 1.875 | **30** | 600 | Sidrubrik (`h1`). Rättad 2026-08-18, se noten |
| `--text-exercise` | 1.0625 | 17 | 600 | Övningsnamn på kortet |
| `--text-body` | 0.9375 | 15 | 400 | Brödtext, standard |
| `--text-meta` | 0.8125 | 13 | 400 | Spökdata, tider, metadata |
| `--text-label` | 0.6875 | 11 | 600 | Kolumnrubriker, versaler |

**Setvärdet går från 16 → 24 px.** Det är den enda ändring som faktiskt löser 11B.1.

> ✏️ **Rättat 2026-08-18: `--text-title` stod som 22 px och var fel.** §0.5 säger *"sidrubriken
> går från 22 till 30 px"* med motiveringen att referenserna ligger på 30–34 och att 22 läser
> som en underrubrik, och `src/index.css` har haft 1.875rem sedan 2026-08-05. **Två av tre
> ställen sa alltså 30, och tabellen här sa 22.**
>
> Värt att notera *hur* felet hittades: inte genom att läsa briefen, utan genom att jämföra
> den mot koden inför steg 4. **En brief som aldrig byggs mot är en brief vars motsägelser
> ingen upptäcker.**

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
| `Reference-pics/Ellie iOS 1–5.jpg` (Raroque, 2026-08-14) | **Väg C i produktion:** tonad yta + färgad vänsterkant + text i samma kulör. **Vänsterkanten = B4:s accentbricka.** Fylld grön bock vs tom konturruta. Vald dag som **fylld svart** cirkel, inte accentfärgad |
| `Reference-pics/Luna iOS 1–5.jpg` (Raroque, 2026-08-14) | **Täta sifferrader:** platta rader **utan avdelare**, högerställda tabulära tal, **bara ett tal per rad färgat** (det som kräver beslut), tonad pill som semantikbärare, tvåradigt grupphuvud som namnger kolumnerna |
| `Reference-pics/Strong iOS 1–6.jpg` (hämtad 2026-08-19) | **Negativ referens, och mappens enda** — den enda app Adam faktiskt använt och övergett. **Bild 1 är vår Pass-skärm byggd av någon annan:** setraden `Set·Previous·kg·Reps·✓` med spökdatan **tom i alla tre raderna** och uppmätt till **1,6–1,7:1** i kontrast mot 13:1 för viktvärdet bredvid; kolumnen kostar ~⅓ av radbredden och saknar inmatningsfält medan alla andra kolumner har det. **Fritexten ligger överst, alltid synlig, utan ram.** Bekräftade set delar ett grönt band utan avdelare — Lunas platta rader, oberoende bekräftat. Hänglås på `Charts`/`Records` bekräftar 11B.0h. **Adam tycker fortfarande inte att Strong är snyggt, men kunde inte peka ut ett enskilt element** — motviljan är diffus, så referensen ger en helhet att undvika, inte en lista på detaljer. Se §0.5 |

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

### ✅ FORMEN: B4 "Blad, indraget", vald av Adam 2026-08-12

Vald ur `docs/mockups/11b-form-blandningar.html` efter två omgångar. Först tre former (Kort,
Papper, Blad), där Adam valde Blad men också gillade Papper. Sedan fyra blandningar av de två.

**Varför blandningarna blev fyra och inte två.** Papper och Blad skiljer sig på **fyra
oberoende axlar**, inte på en. Att blanda dem på känsla hade gett fyra ungefärliga mellanlägen
där det efteråt vore omöjligt att veta vad som gillades. Axlarna varierades därför en i taget:

| Axel | Papper | Blad | **B4, valt** |
|---|---|---|---|
| Yta | bara papper | vitt blad | **vitt blad** |
| Bredd | marginaler | kant till kant | **indraget** |
| Rubrik | på papperet | inuti ytan | **inuti ytan** |
| Markör | ingen | accentstreck | **accentbricka** |

**Vad B4 är.** Övningen är en vit yta med 18 px radie, indragen 16 px från skärmkanterna.
Överst i ytan ligger övningsnamnet i Fraunces med en metarad under (utrustning, antal set,
volym), och till vänster om namnet en **accentbricka** på 10 × 34 px. Setraderna följer
därunder, bekräftade set får `--color-ok-bg`, och "Lägg till set" avslutar ytan under en
hårfin linje.

**Vad som lånades från vardera.** Från Blad: accenten som markör i stället för som ikonruta.
Från Papper: att rubrik och metarad hör ihop och ligger tillsammans överst.

**Metaraden är ny och kompenserar något konkret.** När ikonrutan försvann tappade raden sin
enda visuella hållpunkt utöver namnet. Metaraden ger tillbaka den informationen i text
(`Skivstång · 3 set · 1 385 kg`) i stället för i en symbol, vilket dessutom säger mer.

**Den ärliga invändningen, som står kvar:** B4 ligger närmast det mönster Adam själv kallade
basic. Skillnaden mot ett vanligt kort är brickan i stället för ikonrutan, och rubriken i
Fraunces. Om appen fortfarande känns generisk när den byggts är det **B3 Kantlöst papper** som
är nästa sak att prova, inte en ny accentfärg. Mockupen ligger kvar för det ändamålet.

---

### Genomgående mönster

> **⚠️ Stycket om kortet nedan är skrivet för mörkt tema och är delvis överspelat.**
> Radie 12 px gäller inte (18 px), och ramen `--color-line` ersätts av skugga: på ljus botten
> är skuggor inte brus utan det som får ytan att lyfta. Separationen mellan yta och papper är
> bara 1,19:1, så skuggan bär avgränsningen. Se §0.5.

**Kortet.** ~~`--color-surface`, radie 12 px, `--color-line` som ram, `--space-3` inuti,
`--space-3` mellan kort. Ingen skugga — skuggor på nästan svart är brus.~~
**Gäller nu:** `--color-surface` (rent vitt), radie 18 px, ingen ram, skugga
`0 1px 2px rgba(60,45,25,.06), 0 6px 18px rgba(60,45,25,.085)`, indragen 16 px från kanterna.

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

**Med pågående pass. UPPDATERAD 2026-08-12 till B4** — skissen nedan visade tidigare ikonrutan
och en enkel kortrubrik. Så ser formen inte ut längre:

```
┌──────────────────────────────────┐
│ Pass                     42 min  │  Fraunces 32 px
│ ┌──────────────────────────────┐ │
│ │   12   │  4 850  │     3     │ │  en yta, tre fält, hårfina
│ │  SET   │VOLYM KG │    ÖVN    │ │  linjer emellan
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │  fritext, ALLTID synlig
│ │ ⌨  Bänk 90x5                 │ │  prövas mot hopfälld i mockup
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │  vit yta, radie 18,
│ │ ▍ Bänkpress             ⋯    │ │  indragen 16 px
│ │ ▍ Skivstång · 3 set · 1385kg │ │  ▍ = accentbricka 10×34
│ │   Set        Kg   Reps    ✓  │ │  metarad --text-meta
│ │    1      92,5      5     ●  │ │  klar: --color-ok-bg
│ │             90      5        │ │  snittet: --text-meta,
│ │    2        90      5     ●  │ │  --color-dim, UNDER värdet
│ │             90      5        │ │  (2B, valt 2026-08-19)
│ │    3        90      5     ○  │ │  48 px, väntar
│ │           87,5      6        │ │  reps rör sig oberoende
│ │ ─────────────────────────────│ │  hårfin linje
│ │   + Lägg till set            │ │
│ └──────────────────────────────┘ │
│  ⏱ 1:12        PB +2,5 kg        │  chips
│ ┌──────────────────────────────┐ │
│ │ ▍ Latsdrag              ⋯    │ │
│ │ ▍ Kabel · inga set än        │ │
│ └──────────────────────────────┘ │
│  + Lägg till övning              │
│  ✓ Avsluta pass                  │  fylld accent
└──────────────────────────────────┘
```

**Tre ändringar mot den gamla skissen.** Sammanfattningen blev **en** yta med tre fält i
stället för tre fristående, vilket ger färre kanter på en skärm som redan har många.
Ikonrutan är utbytt mot accentbrickan. Övningen fick en **metarad** som bär den information
ikonrutan aldrig bar.

<details>
<summary>Den gamla skissen, för jämförelse</summary>

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
</details>

### 🔄 `FÖRRA` blir `SNITT`. Avgjort 2026-08-18, och det är rundans tyngsta ändring

**Kolumnen visade "exakt vad du lyfte förra passet". Den visar nu ett snitt över de tre
senaste passen med samma övning.** Hela beslutet med skäl ligger i `SPEC.md` §2 — läs det,
inte det här stycket, för *varför*. Här står bara vad det betyder för formen.

| Regel | Värde |
|---|---|
| Underlag | De tre senaste passen **med den övningen**, inte de tre senaste passen |
| Gruppering | Per **setnummer**. Set 3 jämförs med set 3 — man blir svagare för varje set i rad |
| **Vad som visas** | **Två tal: en vikt OCH ett repsantal.** `90×5`, aldrig bara `90`. Se rutan under tabellen |
| **Hur talen kopplas** | **Vikten snittas. Repsen gör det inte** — de tas från det set vars vikt ligger närmast snittvikten. Avgjort 2026-08-25, se rutan |
| Avrundning | Vikt: närmaste **2,5 kg** — ett snitt som inte går att lägga på stången är oanvändbart. Reps: hela reps, och de är redan hela |
| Åldersgräns | **8 veckor.** Äldre än så: inget snitt, utan *"senast tränad i oktober 2024"* |
| Filter | Ärver 13.4: hoppar över raderade, uppvärmningsset **och importerade** |
| Typografi | `--text-meta`, `--color-dim`. **Aldrig samma storlek som det du skriver in** |

### ✅ Hur vikten och repsen kopplas. Avgjort av Adam 2026-08-25

**Vikten snittas och avrundas till 2,5 kg. Repsen tas från det set vars vikt ligger närmast
snittvikten.** Underlaget 90×5, 85×8 och 92,5×4 ger `90×5` — ett set som faktiskt utförts.

Tre vägar vägdes (de står i `TASKS.md` 11B.0f). Den som föll bort var att snitta båda talen
var för sig, och skälet är mätt, inte tyckt:

⚠️ **Snittas vikt och reps var för sig lutar felet alltid åt samma håll — uppåt.** Vikt och
reps byter av varandra, så medelpunkten hamnar ovanför den verkliga kurvan. Samma underlag ger
då `90×6`, vilket i e1RM är **108** mot de faktiska setens **105,0 / 107,7 / 104,8** — tyngre
än vartenda set som utfördes. **Ett för lågt referensvärde vore ofarligt. Ett för högt är
precis den skada `SPEC.md` §2 finns för att ta bort.**

**Vad regeln kostar:** repsen är inte ett snitt, så de hoppar mellan hela tal när underlaget
skiftar. Det är avsiktligt — talet ska viska att *ungefär så här brukar det se ut*, inte
låtsas om en precision som inte finns.

**Typografin är inte en detalj, den är hela poängen.** Mönstret är MacroFactors `av`-konstruktion:
`2108` stort, `of 2643` litet och grått under. Referensvärdet finns, men det viskar. Skälet att
gömma kolumnen bakom ett tryck — vilket övervägdes — föll på att ett snitt inte skriker på samma
sätt som en toppdag gör. **Att både jämna ut värdet och gömma det vore att lösa samma problem
två gånger, och då syns aldrig det värde som efterfrågades.**

⚠️ **Färre än tre pass: visa snittet ändå, märkt med hur många pass det bygger på.** Det är det
tillstånd som kommer att synas *mest*, eftersom appen tas i bruk från nästan noll. `–` reserveras
för när underlag saknas helt — samma regel som §3.3 redan har: *"aldrig en nolla: en nolla ser ut
som ett resultat."*

### ✅ FORMEN: 2B "under värdet", vald av Adam 2026-08-19

**Vald ur `docs/mockups/11b-0g-pass.html`, rad 2.** Snittet får **ingen egen kolumn**. Varje
talkolumn bär sitt eget snitt under sig i `--text-meta`/`--color-dim`: **snittvikten under
vikten, snittrepsen under repsen.**

Det är MacroFactors konstruktion — `2108` stort, `of 2643` litet och grått under — som §3.1
redan pekade ut som mönstret. Nu är den vald, inte bara citerad.

| Vad valet ger | Varför det vägde |
|---|---|
| **Ingen kolumnbredd betalas** | Strong-mätningen: där kostade spökdatakolumnen ~⅓ av setradens bredd och stod ändå tom i alla tre raderna |
| **Varje tal står under det det hör till** | Man behöver aldrig fråga sig vilket tal som är vilket. Det var Adams eget skäl att välja 2B när snittet blev två tal |
| **Talet viskar** | Uppfyller regeln i tabellen ovan: aldrig samma storlek som det du skriver in |

**Vad valet kostar, och det ska stå kvar:** kopplingen *90 kg hörde ihop med 5 reps* är
svagare när talen står isär än i 2A:s sammanhållna `90×5`. Det var 2A:s enda verkliga
fördel, och den offrades medvetet.

✅ **Kolumnrubriken är därmed inte längre en öppen fråga.** Här stod att `Snitt` skulle prövas
mot `Normalt` och `Typiskt`, med MacroFactors `Trend` som jämförelse. **Med 2B finns ingen
kolumn att namnge**, och frågan faller.

⚠️ **Men något måste förklara talen första gången.** Utan rubrik är det inte självklart vad
de små grå siffrorna är. Det är **inte löst** och hör till 11B.0f eller den skärm som byggs
i steg 4 — inte hit.

---

### 🔄 Fritextinmatningen flyttas upp och blir en riktig kontroll. 2026-08-18

**Skissen ovan saknade den helt, och det var ett fel.** `CLAUDE.md` kallar fritextinmatningen
för halva appens kärnvärde — *"total friktionsfri inmatning via AI-tolkning"* — och Adam anger
tidsåtgången som ett av två skäl att sluta logga. Ändå ritades den bort ur B4-skissen, och i
koden är den en knapp med **streckad kant och dimmad text** (`TodayPage.tsx`), alltså
formspråket för något valfritt.

**Det som ska prövas i mockupen:** alltid synligt fält överst i passet, mot hopfälld genväg
ritad som en riktig kontroll i stället för en streckad ruta. Argumentet för det alltid synliga
är att en funktion man måste öppna kostar ett tryck varje gång — och det är just de trycken
som är hela poängen med den.

**Vad som INTE prövas:** fritext som primär inmatningsväg med setraderna som resultat. Ingen
etablerad app gör så, och §0.2 säger att designen lånas från appar som bevisligen fungerar.

### ✅ FORMEN: 1A "invikt genväg", vald av Adam 2026-08-19

**Vald ur `docs/mockups/11b-0g-pass.html`, rad 1.** Fritext-loggningen ligger som en **invikt
genväg** överst i passet, ritad som en riktig kontroll — och fälls ut till ett fullt fält när
man trycker.

> ✏️ **Frågan var först fel ställd, och det ska stå här.** Mockupen beskrev 1A som *"kostar ett
> tryck"* och 1B som *"alltid synligt"*, som om den ena raden inte syntes. **Båda syns och båda
> tar en rad.** Adam läste om det rätt: *"menar du att 1A blir som 1B efter det att man har
> tryckt på den … så du undrar vilken jag vill ha från början liksom."* Det som skiljer är
> radens **vilotillstånd**, ingenting annat.

| Vilotillstånd | Vad raden signalerar innan du rört den |
|---|---|
| **1A, valt** | En genväg: *"här kan du skriva"*. Fälls ut vid tryck |
| 1B | Ett armerat fält: markör, platshållare och en `Tolka`-knapp, hela tiden |

**Adams skäl:** *"kanske 1A så att den är något invikt till en början."* Det rimmar med hans
egen osäkerhet om hur mycket fritext-loggningen kommer användas (§0.5) — ett armerat fält som
står framme i varje pass är en stark signal för en funktion han ännu inte vet om han vill ha.

⚠️ **Stycket ovan argumenterade för motsatsen, och det står kvar med flit.** *"En funktion man
måste öppna kostar ett tryck varje gång — och det är just de trycken som är hela poängen med
den."* Argumentet är fortfarande giltigt; det förlorade mot användarens egen bedömning av sitt
bruk. **Visar det sig att fritexten används mer än Adam trodde, är 1B det första att pröva om**
— inte något nytt.

⛔ **Detta gäller fritext-loggningen, inte passkommentaren.** De är två funktioner (§0.5).
Passkommentaren ligger vid `Avsluta pass` och berörs inte av valet.

### 💡 Förslag, inte beslut: långtryck förklarar de små talen

**Den öppna frågan från 2B är hur snittalen förklaras första gången.** Adam 2026-08-19:

> *"man kanske kan göra funktion sen om man typ håller över något i en liten stund så kommer
> en info bricka om vad siffran innebär och sånt … sånt är rätt vanligt i många appar."*

Det passar ovanligt väl, av samma skäl som 2B vann: **det kostar noll permanent yta.** Att
lägga en rubrik eller en förklarande rad i setraden hade tagit tillbaka just det utrymme 2B
sparade.

⚠️ **En sak att inte kopiera rakt av: appen är en telefon-PWA, så det finns ingen hover.**
Motsvarigheten är **långtryck** (`long-press`), och den har en egen kostnad — den är osynlig
tills man råkar hitta den, och den krockar med systemets egen textmarkering om den byggs slarvigt.

**Inget är avgjort här.** Förslaget hör till 11B.0f eller steg 4 och står nedskrivet så att
frågan inte återuppfinns.

---

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

> ### 🔑 Den långa horisonten är Statistiks bärande krav. Tillagt 2026-08-18
>
> Detta är det starkaste kravet vi har på den här skärmen, och det kommer inte ur designtycke
> utan ur skälet Adam slutade använda Strong:
>
> > *"när man skriver in samma siffror pass efter pass, ibland ner ibland upp, så kändes det
> > bara tråkigt… ibland ser man inte utveckling på ett tag och då kanske man vill ta en paus
> > från appen. Sen komma tillbaka senare och se att man gjort progress."*
>
> **Under en platå säger den korta horisonten "ingenting händer" vid varje enskilt tillfälle.**
> Det är sant per pass och falskt per år. Statistik är den enda skärm som kan visa det andra,
> och den ska därför byggas mot **år, inte veckor** — tidsfönstret `1V·1M·3M·6M·1Å·Allt` finns
> redan i skissen, men förvalet ska ligga långt ut, inte kort.
>
> Adams data ligger dessutom precis där: bänkkurvan 70 → 95 kg över fem år finns i appen sedan
> fas 13, och `getExerciseHistory` filtrerar **inte** bort importerade set. Den långa vyn
> fungerar redan i dag — den bor bara på `/ovning/:id`, en detaljvy man måste leta sig till.
>
> ⚠️ **Tre oberoende källor pekar åt samma håll**, vilket är ovanligt nog att skrivas ut:
> Adams egen erfarenhet, och båda betalväggsundersökningarna i `docs/research/`. Hevy låser
> grafhistorik till tre månader, och full historik är den **mest paywallade funktionen i hela
> kategorin** — sex av nio appar. En användare kallar flera års progression *"den ultimata
> belöningen för att logga noggrant"*. Det som konkurrenterna tar mest betalt för är alltså
> gratis för oss, och det råkar vara samma sak som Adam saknade.

> ### ⛔ Kroppsviktskortet i skissen ovan får ritas, men inte byggas. 2026-08-18
>
> **Kroppsvikt finns ingenstans i koden.** Ingen tabell, ingen migration, ingen repo-funktion,
> inget i synken — genomsökt 2026-08-18. Ändå ritar skissen kortet, och `SPEC.md` §3b kräver
> funktionen.
>
> **Principen som gäller, och som är generell:**
>
> | | Exempel | Hör hemma i designrundan? |
> |---|---|---|
> | **Ny datapunkt** | Kroppsvikt — kräver tabell, migration, RLS, synkväg | ⛔ Nej. Egen uppgift |
> | **Härledning ur befintlig data** | Snittet i setraden, `epley1RM`, `volumeKg` | ✅ Ja. Ren funktion med enhetstester |
>
> **Skissen får ligga före backenden** — det var Adams poäng, och den är god: att se skärmen
> är hur man vet vad backenden ska bära. Men skissen är då ett *underlag för en kommande
> uppgift*, inte något som byggs i steg 4.
>
> Regeln står här för att den annars bryts av misstag. En skärmskiss ser alltid ut som design,
> även när den i själva verket beställer en databastabell.

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

> ### 🔄 Steg 4 delas i två rundor. Avgjort 2026-08-18
>
> **De sex delstegen är inte lika stora, och att räkna upp dem i en lista dolde det.**
> 4.1–4.3 är omskrivning av kod som finns. 4.4–4.6 är **tre nya sidor**, varav Statistik
> dessutom kräver beräkningar som inte är skrivna: aggregering av set per muskelgrupp och
> vecka finns inte som funktion, och inte heller volymkurvans tidsfönster. `primaryMuscle`
> finns på varje övning i katalogen, så *datan* finns — men inget som summerar den.
>
> | Runda | Delsteg | Karaktär |
> |---|---|---|
> | **1** | 4.1 tokens · 4.2 Pass · 4.3 Historik | Omskrivning. Besluten är fattade och uppmätta |
> | **2** | 4.4 Statistik · 4.5 Övningar · 4.6 Mer | Ny funktionalitet. **Egen grillning krävs**, troligen `/wayfinder` |
>
> ⚠️ **Steg 4.1 var redan till hälften gjord när rundan planerades**, vilket ingen visste.
> `src/ui/nav.ts` säger i sin egen doc-kommentar att den *är* steg 4.1, den datadrivna
> navigationen är byggd, `AppShell` har den flytande pillernavigeringen, och hela §2:s
> typografiblock plus `tabular-nums` ligger i `index.css` sedan `cfb2ca2` — **allt byggt mot
> mörkt tema.** Det som faktiskt återstår i 4.1 är färgvärdena, §1b:s semantik, `@font-face`
> för Fraunces och radien 16 → 18 px.
>
> **Det är andra gången 11B visar sig vara halvbyggt medan dokumenten beskrev den som
> ostartad.** Första gången kostade en halv grillningssession (se rutan i `TASKS.md` 11B).
> Regeln som faller ut: **läs koden innan du planerar en fas, inte efter.**
>
> **Vad som medvetet lämnas utanför runda 1:**
> - **Rörelse (11B.5).** Referensstöd saknas — `SPEC.md` §4 bad om Ellie för rörelse, men bara
>   stillbilder hämtades. Uppgiften står kvar; den är dessutom lättast att lägga till i
>   efterhand eftersom animationer inte ändrar någon struktur.
> - **Rullhjulen** (`ScrollPicker`). Adam 2026-08-18: mönstret är rätt, utförandet ska bli
>   bättre. Båda betalväggsundersökningarna rekommenderar rullhjul framför tangentbord. Det
>   utvärderas i ett eget spår enligt §3.5 — att bygga om dem här hade blandat två frågor.
