# **Vad kommersiella gymappar låser bakom betalvägg — och vad av det som är värt att bygga för en enanvändarapp**

> **Om den här filen:** detta är den ena av **två oberoende undersökningar** av samma fråga. Den andra
> ligger i [`docs/research/betalfunktioner-i-gymappar.md`](./betalfunktioner-i-gymappar.md) och skrevs
> parallellt, utan att någon av författarna läste den andras material. Poängen är att de ska kunna
> jämföras: där de två filerna säger samma sak är slutsatsen robust, och där de går isär finns något
> att titta närmare på. Läs dem i valfri ordning, men läs båda innan något byggs.

---

## **1. Sammanfattning i ett stycke**

Nio appar undersöktes. Åtta av dem tar betalt, en (FitNotes) gör det inte alls. När man sorterar
betalfunktionerna efter vad de faktiskt kostar att driva faller de isär i två mycket olika högar. Den
lilla högen — molnsynk, videobibliotek, AI-anrop och licensierade coachprogram — speglar verklig
driftskostnad. Den stora högen gör det inte: **tak på antal rutiner, tak på antal egna övningar,
tidsfönster i grafer, viktskivekalkylatorer, uppvärmningskalkylatorer och kroppsmåttstyper kostar
ingenting att erbjuda och existerar uteslutande för att skapa ett skäl att betala.** Hevys egen
supportdokumentation bevisar det svart på vitt: när man nedgraderar från Pro *raderas ingenting* —
rutinerna finns kvar, historiken ligger kvar på servern, måtten går att läsa. Det enda som försvinner
är rätten att skapa fler och rätten att se det man redan äger.

För ett projekt utan monetisering att skydda betyder det att den stora högen är gratis att bygga, och
att den innehåller precis de funktioner användare oftast säger sig ha uppgraderat för. Prioriterings-
listan i §7 är resultatet.

---

## **2. Metod, källäge och datum**

**Alla prisuppgifter är hämtade 2026-08-18** och avser den **amerikanska App Store-/Play Store-
butiken i USD** om inget annat anges. Priser i Sverige avviker (moms tillkommer, och Apples
prisnivåer avrundas per valuta). Priser rör sig snabbt i den här kategorin — flera av apparna körde
kampanjer vid hämtningstillfället, vilket noteras där det gäller.

Undersökningen har hållit sig till primärkällor: apparnas egna pris- och hjälpsidor, App Store- och
Play Store-listningarnas *In-App Purchases*-sektioner (som är den enda plats där de faktiska
prispunkterna är verifierbara), samt officiell supportdokumentation. Sekundära "bästa träningsappen
2026"-bloggar har medvetet undvikits — de är i den här nischen nästan uteslutande affiliatedrivna och
kopierar varandras felaktigheter.

**En begränsning som måste redovisas:** Reddit är blockerat i den här körmiljön, både för
hämtningsverktyget och för webbläsaren. Uppdraget bad uttryckligen om Reddit-röster, och de saknas
därför här. Som ersättning har användarrösterna hämtats från källor som är **minst lika primära**:
verifierade recensioner i App Store och Google Play (Google märker dem uttryckligen "Ratings and
reviews are verified"), samt Jefits egen Q&A-plattform där användare svarar varandra. Där en
Reddit-tråd ändå är relevant anges dess URL så att den kan öppnas manuellt, men **inget innehåll
citeras från trådar som inte gick att läsa.** Om den parallella undersökningen kom åt Reddit är dess
användarröster ett komplement snarare än en dubblett av dessa.

En observation om recensionskällorna: **App Store och Play Store ger systematiskt olika bild.**
Strong har 4,9 på App Store men 4,3 på Google Play; Jefit har 4,8 respektive 4,2. Play-recensionerna
är påtagligt mer kritiska mot betalväggar, och det är där de mest användbara citaten finns.

---

## **3. Den avgörande skillnaden: artificiell gräns kontra verklig driftskostnad**

Detta är hela poängen med undersökningen, så det är värt att definiera skarpt innan apparna gås
igenom en och en.

En **verklig driftskostnad** är något som blir dyrare för leverantören ju mer användaren använder
det. Molnsynk kostar lagring och bandbredd per pass. Ett videobibliotek kostar CDN-trafik per
uppspelning. Ett AI-anrop kostar per token. Licensierade coachprogram kostar royalty per abonnent.
Den som låser sådant bakom en betalvägg gör en företagsekonomiskt begriplig sak.

En **artificiell gräns** kostar leverantören ingenting alls. Det femte träningsprogrammet tar inte
mer serverplats än det tredje. Den tolfte månadens graf ritas ur data som redan är lagrad. En
viktskivekalkylator är ren aritmetik som körs på telefonen. Den som låser sådant har inte skyddat en
kostnad — den har konstruerat en olägenhet och sedan sålt lindringen.

Det finns ett test som avgör vilken sort man har framför sig, och Hevy råkar ha dokumenterat sitt
eget svar. I supportartikeln om vad som händer vid nedgradering från Pro till gratis står, om
grafhistoriken:

> "That workout history will still be stored on our servers though, so if you resubscribe, that
> information will be available again immediately."
>
> — [Hevy Help Centre, *What will happen to my account if I switch from Pro to the free version?*](https://help.hevyapp.com/hc/en-us/articles/38279350428695-What-will-happen-to-my-account-if-I-switch-from-Pro-to-the-free-version) (hämtad 2026-08-18)

Datan lagras oavsett. Kostnaden uppstår oavsett. Det som säljs är **rätten att titta på sin egen
redan lagrade data.** Samma artikel säger detsamma om rutinerna ("you will not lose the routines you
created above the original 4 free routines") och om kroppsmåtten ("You will still be able to see all
of the historic measurements for these areas, you just will not be able to add new measurements").

Det är den skarpaste möjliga illustrationen av skillnaden, och den kommer från leverantören själv.

**Konsekvensen för oss:** varje artificiell gräns i tabellerna nedan är en funktion vi kan bygga
gratis. Varje verklig driftskostnad måste vägas mot vad den faktiskt kostar oss — och för en
offline-först PWA med lokal lagring är svaret ofta "ingenting", eftersom kostnaden hos de
kommersiella apparna uppstår av att de kör en server åt miljoner användare, inte av funktionen i sig.

---

## **4. App för app**

### **4.1 Strong**

Strong är den app som oftast beskrivs som guldstandarden för friktionsfri loggning, och den har den
mest välkända artificiella gränsen i hela kategorin: **tre rutiner.**

Den officiella PRO-listan är kort och står i deras hjälpcenter:

> "Unlimited Workout Templates · Record Body Part Measurements · Access to all Charts · Plate
> Calculator · Warm Up Calculator · Custom Icons (iPhone) and Themes · More Future Features"
>
> — [Strong Help Center, *What is Strong PRO?*](https://help.strongapp.io/article/132-strong-pro)

Notera vad som **inte** står där: molnsynk, kontot, loggningen och CSV-exporten. Strong är
uttryckliga med att gratisanvändare aldrig stängs ute — *"You will never be 'locked out', and you
will ALWAYS be able to use the free version of Strong to track your workouts"* (samma källa). Och
[hjälpartikeln om dataexport](https://help.strongapp.io/article/235-export-workout-data) beskriver
CSV-export utan att nämna PRO någonstans, och exporten står inte på PRO-listan ovan — så den bör
betraktas som gratis. Det är ovanligt hederligt, och det gör kontrasten mot resten av listan
tydligare: **allt som ligger bakom Strongs betalvägg är antingen ett räknetal eller en siffergräns.**

| | **Gratis** | **Strong PRO** | **Bedömning** |
|---|---|---|---|
| Loggning av pass | Obegränsat | — | — |
| Egna rutiner/mallar | **Max 3** | Obegränsat | 🔴 Artificiell |
| Egna övningar | Ja | Ja | — |
| CSV-export | Ja (ej PRO-listad) | Ja | 🟢 Gratis hos dem också |
| Diagram/grafer | Delvis | **"Access to all Charts"** | 🔴 Artificiell |
| Kroppsmått | Nej | Ja | 🔴 Artificiell |
| Plate Calculator | Nej | Ja | 🔴 Artificiell (ren aritmetik) |
| Warm Up Calculator | Nej | Ja | 🔴 Artificiell (ren aritmetik) |
| Ikoner och teman | Nej | Ja | ⚫ Rent kosmetiskt säljargument |
| Molnkonto och synk | Ja | Ja | 🟢 Gratis trots verklig kostnad |

**Pris (US App Store, 2026-08-18):** Strong PRO 1 månad **4,99 USD**; 6 månader **19,99 USD**;
1 år **23,99–29,99 USD** (två prispunkter listade, sannolikt kampanj mot ordinarie); *Forever*
**79,99–99,99 USD**.
Källa: [App Store — Strong Workout Tracker & Gym Log](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577)

**Betyg:** 4,9 med 108 000+ recensioner på App Store; **4,3 med 42 700 recensioner** och 1 M+
nedladdningar på [Google Play](https://play.google.com/store/apps/details?id=io.strongapp.strong).
Glappet på 0,6 stjärnor mellan butikerna är i sig ett datapunkt om hur rutin-taket tas emot.

---

### **4.2 Hevy**

Hevy är den bäst dokumenterade av alla nio — deras hjälpcenter publicerar en fullständig
jämförelsetabell, vilket är sällsynt. Den återges här ordagrant:

> | Features | Free Version | Pro Version |
> |---|---|---|
> | Routine limit | Limit of 4 | Unlimited |
> | Data history | 3 months | All time |
> | Custom exercises | Limit of 7 | Unlimited |
> | Advanced tracking | — | Muscle distribution (body and chart) · Main exercises · Leaderboard Exercises · Monthly Report |
> | | All stats as free | Set count per muscle group |
> | Warm up Calculator | Unavailable | Available |
>
> — [Hevy Help Centre, *Hevy Pro Subscription: How to get Pro and What Does It Include?*](https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include)

Nedgraderingsartikeln lägger till en detalj som inte syns i tabellen: **på gratisnivån går det bara
att registrera kroppsvikt och midjemått.** Alla andra mått (kroppsfett, nacke, biceps och så vidare)
kräver Pro.

| | **Gratis** | **Hevy Pro** | **Bedömning** |
|---|---|---|---|
| Rutiner | **Max 4** | Obegränsat | 🔴 Artificiell — data raderas inte vid nedgradering |
| Egna övningar | **Max 7** | Obegränsat | 🔴 Artificiell |
| Grafhistorik | **30 dagar / 3 månader** | 1 år / all tid | 🔴 Artificiell — datan ligger kvar på servern |
| Kroppsmått | Endast vikt + midja | Alla mått | 🔴 Artificiell |
| Set per muskelgrupp | Nej | Ja | 🔴 Artificiell (en `GROUP BY`) |
| Muscle distribution | Nej | Ja | 🔴 Artificiell |
| Monthly Report | Nej | Ja | ⚫ Retentionsmekanik |
| Leaderboard Exercises | Nej | Ja | ⚫ Socialt — utanför vår omfattning |
| Warm Up Calculator | Nej | Ja | 🔴 Artificiell (ren aritmetik) |
| Molnsynk, webbgränssnitt | Ja | Ja | 🟡 Verklig kostnad, ändå gratis |
| Övningsvideor | Ja | Ja | 🟡 Verklig kostnad, ändå gratis |

**Pris (US App Store, 2026-08-18):** Hevy Pro månadsvis **2,99 USD** (en andra prispunkt på 3,99 USD
finns listad); årsvis **23,99 USD**; **lifetime 74,99 USD**.
Källa: [App Store — Hevy](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350).
Hevy körde vid hämtningstillfället även [50 % rabatt på första året](https://help.hevyapp.com/hc/en-us/articles/38223834432279-Hevy-50-OFF-Annual-Pro-Subscription-How-It-Works).

**Betyg:** 4,9 med 87 000 recensioner på App Store; **4,8 med 254 000 recensioner** och 5 M+
nedladdningar på [Google Play](https://play.google.com/store/apps/details?id=com.hevy).

En sak till, som inte är en betalvägg men som är intressant teknisk kontext: Hevy har ett **tak på
150 set per pass och per rutin** som gäller alla användare oavsett betalning, enligt hjälpartikeln
*"Hevy Set Limit Explained: Why Workouts and Routines Have a 150-Set Cap"*. Det är ett exempel på en
gräns som faktiskt speglar en teknisk verklighet snarare än en säljstrategi — den går inte att köpa
bort.

---

### **4.3 Jefit**

Jefit är den enda av de nio som **visar annonser** i gratisversionen, och den enda där en betydande
del av betalväggen handlar om att slippa appens eget beteende snarare än att få nya funktioner.

Enligt deras egen [Elite-sida](https://www.jefit.com/elite) består gratisnivån ("Basic") av fria och
egna rutiner, 1 400+ övningar med instruktioner, loggning och historik samt community-åtkomst. Elite
lägger till *"Professionally designed workout plans · Advanced analytics and tracking · Watch app
support · Video exercise demonstrations · Ad-free experience"*. Deras
[FAQ](https://www.jefit.com/support/faq) preciserar att *"Elite provides premium routines and
exercises not available to free users"*, att fullständig analys ingår i Elite, samt att
*Instant Workout* är begränsat i antal för gratisanvändare men obegränsat för Elite.

| | **Gratis (Basic)** | **Elite** | **Bedömning** |
|---|---|---|---|
| Loggning och historik | Ja | Ja | — |
| Övningsbibliotek (1 400+) | Ja, med instruktioner | + HD-videodemonstrationer | 🟡 Verklig kostnad (CDN) |
| Egna övningar | Begränsat | Obegränsat | 🔴 Artificiell |
| Analytics | Grundläggande | Fullständig | 🔴 Artificiell |
| Apple Watch-app | **Nej** | Ja | 🔴 Artificiell — klientkod, ingen driftskostnad |
| Instant Workout | Begränsat antal | Obegränsat | 🟡 Delvis verklig (AI-generering) |
| Adaptive Plans / AI-progression | Nej | Ja | 🟡 Verklig kostnad om det är LLM-baserat |
| Annonser | **Ja** | Nej | ⚫ Gäller inte oss |
| Färdiga premiumprogram | Nej | Ja | ⚫ Licensierat innehåll — irrelevant |

**Pris (2026-08-18):** Elite **12,99 USD/månad**; **69,99 USD/år**, med första året till
**52,49 USD** (60 % introduktionsrabatt) enligt [jefit.com/elite](https://www.jefit.com/elite).
App Store-listningen bekräftar 12,99 USD/månad och 69,99 USD/år, och visar dessutom äldre
prispunkter på 6,99 och 39,99 USD för befintliga kunder.
Källa: [App Store — JEFIT](https://apps.apple.com/us/app/jefit-gym-workout-plan-log/id449810000)

**Betyg:** 4,8 med 47 000 recensioner på App Store; **4,2 med 89 700 recensioner** och 5 M+
nedladdningar på [Google Play](https://play.google.com/store/apps/details?id=je.fit) — det lägsta
Play-betyget i hela urvalet.

Att låsa **klockappen** bakom Elite är den mest svårförsvarade posten i hela undersökningen. En
watchOS-app kostar ingenting per användare att driva; den är kompilerad klientkod som redan ligger i
paketet.

---

### **4.4 FitNotes — referenspunkten utan betalvägg**

FitNotes är undersökningens viktigaste kontrollgrupp, eftersom den **inte har någon betalvägg alls.**
Play Store-listningen säger det rakt ut:

> "A clean, simple, powerful workout tracker. Free to use, and no ads - ever."
>
> — [Google Play, FitNotes — Gym Workout Log](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes) (hämtad 2026-08-18)

Vad som ingår gratis är avgörande för argumentet i §3, eftersom flera av posterna ligger bakom
betalvägg hos tre eller fyra av konkurrenterna:

- **"Create as many routines as you want"** — inget tak, till skillnad från Strong (3) och Hevy (4).
- **CSV-export** av hela träningsloggen.
- **Backup/restore** till enhetens lagring, Dropbox eller Google Drive — användaren äger sin fil.
- Vilotimer med ljud och vibration, kommentarer på enskilda set, egna kategorier och övningar.
- En kalender med filtrering som är mer kapabel än de flesta betalfunktioner i urvalet: *"Highlight
  days where I did bench press and lifted more than 80kg for at least 5 reps"*.

Datasäkerhetsdeklarationen anger **"No data shared with third parties"** och **"No data collected"**.
Appen har alltså ingen server, och därmed ingen driftskostnad att täcka — vilket är exakt varför den
kan ge bort allt.

**Pris:** 0. Inga köp i appen, inga annonser.
**Betyg:** **4,8 med 31 400 recensioner** och 1 M+ nedladdningar. Senast uppdaterad 2025-10-24.

Att en app helt utan intäkter håller samma betyg som Hevy (4,8) och högre än Strong (4,3) på samma
plattform är det starkaste enskilda beviset för att betalväggarna i den här kategorin inte finansierar
kvalitet — de finansierar servrar, och den som inte behöver servrar behöver dem inte.

En användarröst som råkar bekräfta värdet av just en av de mest paywallade funktionerna:

> "This is seriously the best app for workout tracking. It's simple and intuitive to use, the UI is
> straightforward and there's no gimmicks. […] Also love the feature of counting the barbell weight,
> it's helpful when you're doing compound exercises with barbell"
>
> — Manomay Shravage, 2025-04-27, [Google Play](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes)

Det som beskrivs är en viktskivekalkylator. Strong, Alpha Progression och StrongLifts tar alla betalt
för den.

---

### **4.5 Boostcamp**

Boostcamp är det tydligaste exemplet på en betalvägg som **delvis** speglar verklig kostnad, eftersom
en del av det som säljs är licensierat innehåll från namngivna coacher. Deras egen jämförelse:

| Funktion | Gratis | Pro |
|---|:---:|:---:|
| 11 000+ träningsprogram | ✓ | ✓ |
| Merparten av 130+ coachprogram | ✓ | ✓ |
| Fullständig passloggning | ✓ | ✓ |
| RPE- och RIR-loggning | ✓ | ✓ |
| Veckorapporter och "Year-end Wrapped" | ✓ | ✓ |
| Egen programbyggare | ✓ | ✓ |
| 20+ exklusiva coachprogram | | ✓ |
| Strength Score (0–100) | | ✓ |
| Volymvärmekarta per muskel | | ✓ |
| Personaliserade program | | ✓ |
| Avancerad övningsanalys | | ✓ |

— [boostcamp.app/pro](https://www.boostcamp.app/pro) (hämtad 2026-08-18)

**Bedömning:** de exklusiva coachprogrammen är ⚫ **irrelevanta för oss** (licensierat innehåll som en
enanvändare med eget program inte behöver). *Strength Score* är ⚫ **ett fåfängemått** — en
sammanvägning av knäböj, bänk, mark, press och rodd till en enda 0–100-siffra, vilket är
gamification snarare än information. **Volymvärmekartan per muskel** och **avancerad övningsanalys**
är däremot 🔴 **artificiella** och återkommer hos Hevy och Jefit, vilket gör dem intressanta.

Det anmärkningsvärda med Boostcamp är hur mycket som är gratis: **RPE- och RIR-loggning samt en
fullständig egen programbyggare kostar ingenting**, medan Alpha Progression tar 79,99 USD om året för
RIR-hantering.

**Pris (2026-08-18):** **59,99 USD/år** (motsvarande 4,99 USD/månad vid årsbetalning) med 7 dagars
gratis provperiod, eller **14,99 USD/månad** utan provperiod ([boostcamp.app/pro](https://www.boostcamp.app/pro)).
App Store-listningen visar prispunkterna 11,99 / 14,99 / 48,99 / 59,99 / 69,99 / 79,99 USD, vilket
tyder på flera parallella kampanjer.
Källa: [App Store — Boostcamp](https://apps.apple.com/us/app/boostcamp-workout-programs/id1529354455)

**Betyg:** 4,8 med 9 800+ recensioner på App Store.

---

### **4.6 Alpha Progression**

Alpha Progression har urvalets mest aggressiva betalvägg mätt i *andel av produkten*, eftersom hela
appens existensberättigande — progressionsmotorn — ligger bakom den. Från deras egen prissida:

**Gratis ("Basic access"):** *"Plans from scratch · Unlimited workouts · 795 exercises with video ·
Body measurements"*, uttryckligen **utan** plangenerator, rekommendationer, diagram eller verktyg.

**Pro:** *"Everything in free"* plus *"Custom plan generator · Progression recommendations · Charts ·
Multiple gyms · RIR, periodization, deloads · Plate calculator · Warmup calculator · Custom exercise
images · Exercise evaluations"*
— [alphaprogression.com/en/pricing](https://www.alphaprogression.com/en/pricing)

| | **Gratis** | **Pro** | **Bedömning** |
|---|---|---|---|
| Loggning | Obegränsat | Obegränsat | 🟢 Inget tak — ovanligt |
| Övningsbibliotek med video | 795 st, gratis | Samma | 🟡 Verklig kostnad, ändå gratis |
| Kroppsmått | Ja | Ja | 🟢 Gratis (jfr Strong och Hevy) |
| Progressionsrekommendationer | Nej | **Ja** | 🟡 Verklig utvecklingskostnad, noll driftskostnad |
| RIR, periodisering, deloads | Nej | Ja | 🔴 Artificiell — lokal logik |
| Diagram | Nej | Ja | 🔴 Artificiell |
| Plangenerator | Nej | Ja | 🟡 Gränsfall |
| Flera gym (olika utrustning) | Nej | Ja | 🔴 Artificiell — men genuint användbar |
| Plate + Warmup calculator | Nej | Ja | 🔴 Artificiell (ren aritmetik) |

**Pris (2026-08-18):** **12,99 USD/månad** eller **79,99 USD/år** ("save 50 %"), med 14 dagars gratis
provperiod. Ingen lifetime-variant.
Källor: [alphaprogression.com/en/subscribe](https://www.alphaprogression.com/en/subscribe) och
[App Store](https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793)

**Betyg:** 4,9 med 2 100+ recensioner på App Store; **4,7 med 20 800 recensioner** och 1 M+
nedladdningar på [Google Play](https://play.google.com/store/apps/details?id=com.alphaprogression.alphaprogression).

Två saker sticker ut. För det första: **övningsvideorna är gratis här men kostar pengar hos Jefit**,
vilket visar att även "verklig driftskostnad" är ett förhandlingsbart påstående. För det andra:
**"Multiple gyms"** — möjligheten att ha olika utrustningsprofiler för olika gym — är en genuint
smart funktion som inte återfinns hos någon annan i urvalet, och den är helt artificiellt låst.

---

### **4.7 Progression**

Progression (utvecklad av Zoltan Demant i Bjuv, Sverige) har urvalets renaste och mest oblyga
artificiella betalvägg. Från App Store-beskrivningen:

**Gratis:** *"The core features are free for you – just get started."* — *"Build your own training
plan – or pick a program · Log every set in seconds · Get automatic suggestions for when to increase
the weight · Templates for recurring workouts · Built-in rest timer · Full training history &
personal records"*

**PRO:** *"Unlimited training plans & workouts"* och *"All long-term charts & statistics"*
— [App Store — Progression Workout Tracker](https://apps.apple.com/us/app/progression-workout-tracker/id1090687896)

Det är hela betalväggen. **Två poster, båda rena siffergränser.** Det som här är gratis och kostar
pengar hos konkurrenterna är dessutom påfallande: automatiska viktökningsförslag (Alpha Progression
tar 79,99 USD/år för motsvarande), viktskivekalkylator, superset, set-taggning för dropsets och
negativa, 1RM-estimat, samt CSV-export — allt listat som gratisfunktioner i
[Play Store-beskrivningen](https://play.google.com/store/apps/details?id=workout.progression.lite).

| | **Gratis** | **PRO** | **Bedömning** |
|---|---|---|---|
| Träningsplaner och pass | Begränsat antal | Obegränsat | 🔴 Artificiell |
| Långtidsgrafer och statistik | Nej | Ja | 🔴 Artificiell |
| Automatiska viktökningsförslag | **Ja** | Ja | 🟢 Gratis — jfr Alpha Progression |
| Plate calculator, superset, 1RM | **Ja** | Ja | 🟢 Gratis — jfr Strong |
| CSV-export, offline-läge | **Ja** | Ja | 🟢 Gratis |
| Annonser | Inga | Inga | 🟢 *"Zero ads and zero interruptions"* |

**Pris (US App Store, 2026-08-18):** fyra PRO-prispunkter listade — **6,99 / 12,99 / 79,99 /
99,99 USD**. Namngivningen i listningen skiljer dem inte åt, men mönstret (två låga, två höga) tyder
på månad/år respektive två lifetime-nivåer eller kampanjpriser.

**Betyg:** 4,5 med 159 recensioner på App Store; **4,5 med 3 920 recensioner** på Google Play,
senast uppdaterad 2026-06-16, cirka 500 000 användare enligt beskrivningen.

---

### **4.8 Liftosaur**

Liftosaur är den enda i urvalet som är **öppen källkod**, och det medför en varning som måste stå
tydligt:

> ⛔ **Liftosaur är licensierad under AGPL-3.0**
> ([github.com/astashov/liftosaur](https://github.com/astashov/liftosaur)).
> Enligt `CLAUDE.md` §7.2b får **inga kodrader någonsin kopieras** därifrån. Kopieras AGPL-kod in
> skulle hela vår app tvingas släppas under AGPL för all framtid. Att **läsa** koden för att förstå
> idéer, att studera Liftoscripts syntax och att bygga något liknande själv är däremot fritt och
> lagligt — layout, informationsarkitektur och interaktionsmönster är inte upphovsrättsskyddade.
> Om något härifrån någonsin påverkar vår design ska det in i `docs/EXTERNT.md` som "läst som
> inspiration, ej kopierat".

Liftosaur publicerar **ingen officiell jämförelsetabell** mellan gratis och premium — deras
[dokumentation](https://www.liftosaur.com/docs/) täcker Liftoscript, REST API och MCP Server utan att
nämna prisnivåer alls. Fördelningen går därför bara att belägga via användarrecensioner på deras egen
App Store-sida, och redovisas här med den reservationen.

Den mest konkreta uppgiften kommer från en recension citerad på liftosaur.com: *"The paid version
let's you see graphs"*, med tillägget att man kan *"export your data to make your own graphs for
free"*. Det innebär att **grafer är den huvudsakliga betalfunktionen** — samma mönster som hos Hevy,
Strong, Progression och Alpha Progression — medan **Liftoscript, de färdiga programmen, loggningen
och offline-läget är gratis.** Det är en anmärkningsvärd prioritering: appens svåraste och mest
originella del (ett domänspecifikt språk för progressionslogik) ges bort, medan `SELECT ... GROUP BY`
säljs.

**Pris (US App Store, 2026-08-18):** månadsvis **4,99 USD**; årsvis **39,99 USD**; **lifetime
99,99 USD**.
Källa: [App Store — Liftosaur: Scriptable Workouts](https://apps.apple.com/us/app/liftosaur-scriptable-workouts/id1661880849)

**Betyg:** 4,9 med 375 recensioner på App Store.

---

### **4.9 StrongLifts 5x5 — undersökningens varnande exempel**

StrongLifts är den enda appen i urvalet där **kärnfunktionen kräver betalning.** App Store-
beskrivningen är otvetydig:

> "Stronglifts is free to download, but requires a subscription to use."
>
> — [App Store — Stronglifts 5x5 Workout Plan](https://apps.apple.com/us/app/stronglifts-5x5-workout-plan/id488580022) (hämtad 2026-08-18)

**Pris (US App Store, 2026-08-18):** Pro Weekly **4,99 USD**; Monthly **11,99 USD**; Quarterly
**29,99 USD**; Yearly **59,99 USD** (7 dagars gratis provperiod); **Lifetime 199,99 USD** — urvalets
i särklass dyraste engångsköp.

**Betyg:** 4,9 med 77 000 recensioner på App Store; **4,4 med 101 000 recensioner** och 1 M+
nedladdningar på [Google Play](https://play.google.com/store/apps/details?id=com.stronglifts.app).

Det som gör StrongLifts intressant är inte prissättningen utan **vad som hänt med befintliga
användare**, och det behandlas i §6.

---

## **5. Överlappet: vad ligger bakom betalvägg hos flera appar samtidigt?**

Detta är den fråga uppdraget kallade viktigast, eftersom överlapp indikerar verklig efterfrågan
snarare än en enskild produktchefs infall. Tabellen räknar bara appar där posten är *belagd* med
primärkälla.

| Funktion | Antal appar med betalvägg | Vilka | Gratis hos | Karaktär |
|---|:---:|---|---|---|
| **Långtidshistorik i grafer/statistik** | **6** | Strong, Hevy, Jefit, Alpha Progression, Progression, Liftosaur | FitNotes, Boostcamp (delvis) | 🔴 Artificiell |
| **Tak på antal rutiner/mallar** | **4** | Strong (3), Hevy (4), Jefit, Progression | FitNotes, Alpha Progression, Boostcamp | 🔴 Artificiell |
| **Warm-up calculator** | **3** | Strong, Hevy, Alpha Progression | Progression, FitNotes | 🔴 Artificiell |
| **Plate calculator** | **3** | Strong, Alpha Progression, StrongLifts | Hevy, Progression, FitNotes | 🔴 Artificiell |
| **Volym per muskelgrupp** | **3** | Hevy, Boostcamp, Jefit | — | 🔴 Artificiell |
| **Tak på antal egna övningar** | **2** | Hevy (7), Jefit | Strong, FitNotes, Progression | 🔴 Artificiell |
| **Kroppsmått utöver vikt** | **2** | Strong, Hevy | Alpha Progression, FitNotes | 🔴 Artificiell |
| **Progressionsrekommendationer / autoreglering** | **3** | Alpha Progression, Jefit, Boostcamp | **Progression** | 🟡 Blandad |
| **HD-videodemonstrationer** | **1** | Jefit | Alpha Progression, Hevy, Strong | 🟡 Verklig (CDN) |
| **Licensierade coachprogram** | **2** | Boostcamp, Jefit | — | ⚫ Irrelevant |
| **Annonsfritt läge** | **1** | Jefit | alla andra | ⚫ Irrelevant |
| **Apple Watch-app** | **1** | Jefit | Strong, Hevy, StrongLifts | 🔴 Artificiell |

**Tre slutsatser ur tabellen.**

För det första: **det mest paywallade i hela kategorin är att få se sin egen historik över tid.** Sex
av nio appar tar betalt för det, och ingen av dem tar betalt för att *lagra* den. Det gör
långtidsgrafer till den funktion marknaden mest samstämmigt bedömer som värdefull — och samtidigt den
som är billigast för oss att bygga, eftersom vi redan har datan lokalt.

För det andra: **varenda post i den övre halvan av tabellen är röd.** Överlappet mellan apparna
handlar nästan uteslutande om artificiella gränser. Det som faktiskt kostar pengar att driva (video,
licenser) låses av *en* app vardera, medan det som är gratis att erbjuda låses av tre till sex. Det
är motsatsen till vad man skulle förvänta sig om betalväggarna speglade kostnad.

För det tredje: **för varje enskild betalfunktion finns minst en app som ger bort den.** Ingen post i
tabellen är låst överallt. Det är det starkaste möjliga beviset för att inget av detta är tekniskt
svårt eller dyrt — det är prissättningsstrategi, och strategierna är oense.

---

## **6. Användarrösterna**

### **6.1 Vad användare säger att de faktiskt saknade eller uppgraderade för**

**Rutin-taket är den överlägset mest omtalade betalväggen.** Den nämns i recensioner för både Strong
och Hevy, och den nämns med irritation:

> "My biggest complaint is that I can only create three routines without upgrading"
>
> — recension "Great for logging gym workouts", 2020-06-03, [App Store — Strong](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?see-all=reviews)

> "since the free version is limited to three routines it is useless for free users. Don't bother if
> you are looking for a free app, there are better options out there."
>
> — verifierad Play-recension, 2020-02-16, [Google Play — Strong](https://play.google.com/store/apps/details?id=io.strongapp.strong)

Den recensionen fick ett direkt svar från utvecklaren, som är värt att citera eftersom det visar hur
företaget själv ser på gränsen:

> "We believe that the Strong app offers great value for the money, with multiple subscription
> options available, including the annual at 50% of the monthly rate. You can also stick with the
> free version of the app!"
>
> — Strong Fitness PTE. LTD., svar 2020-02-16, samma sida

Hos Hevy formuleras samma sak, men från andra hållet — av en användare som konstaterar att taket i
princip **är** hela produktskillnaden:

> "The free version is essentially the same as the Pro version. The main difference is that Free
> allows you to create and track three or four routines, whereas for $30 a year, you can have
> unlimited routines. Either way, it awesome. Highly recommended."
>
> — Christopher Davis, 2026-02-21, [Google Play — Hevy](https://play.google.com/store/apps/details?id=com.hevy)

Det är ett ovanligt tydligt vittnesmål: 60 personer markerade det som hjälpsamt, och innebörden är
att Hevy Pro säljer en siffra.

**Progressionsrekommendationer är det användare betalar för när de betalar för funktionalitet.**
Alpha Progressions recensioner handlar nästan uteslutande om algoritmen, inte om loggningen:

> "an app to plan the progression for me to make sure that my programming was good"
>
> — recension "Best fitness app that I've tried", 2023-02-04, [App Store — Alpha Progression](https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793?see-all=reviews)

> "the periodization baked into the targeting algorithm is designed to have you hitting mini PRs"
>
> — recension "Great app for long time lifters", 2024-07-10, samma sida

> "I especially love that it helps me build and adjust my workouts as I improve, so I can keep
> challenging myself instead of feeling stuck."
>
> — Miranda Dalrymple, 2026-08-10, [Google Play — Alpha Progression](https://play.google.com/store/apps/details?id=com.alphaprogression.alphaprogression)

Samma efterfrågan syns som ett **saknat** önskemål hos Hevy, där en användare beskriver exakt vad
Alpha Progression tar betalt för:

> "to add suggested weight increases based on previous workout on each exercise, viewable on the
> workout itself after you've started."
>
> — Khalil, 2026-04-14, [Google Play — Hevy](https://play.google.com/store/apps/details?id=com.hevy)

Samma recension efterfrågar också något som ligger nära projektets kärnidé om spökdata:

> "on watch after I've started a workout, to allow you to see what you done the last two sessions on
> each exercise"

**Livstidsköp framför prenumeration är ett återkommande, starkt uttryckt önskemål.** Det är strikt
taget inte en funktion, men det säger något om hur användare värderar äganderätt:

> "I bought the lifetime membership (PLEASE don't ever remove this option, its value is
> unbelievable)."
>
> — 69burner69, 2024-12-23, [App Store — Hevy](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350?see-all=reviews)

> "One workout and already bought a lifetime subscription… having the ability to purchase a lifetime
> subscription is amazing - other apps forcing you into monthly charges is ridiculous and I will
> always support a dev who makes open source software."
>
> — tr0njavolta, 2025-12-05, [App Store — Liftosaur](https://apps.apple.com/us/app/liftosaur-scriptable-workouts/id1661880849?see-all=reviews)

> "It's one of the few apps that includes a lifetime purchase model in an era defined by subscription
> models."
>
> — Icarian909, 2025-11-05, samma sida

**Jefits användare uppgraderar för att slippa annonser och för att skapa fler egna övningar** — båda
artificiella. Från Jefits egen Q&A-plattform, på frågan "Has anyone found Elite to be worth the
cost?":

> "I like the added features. Also I like to think that by paying once in a while (you gotta use
> those iron points!) I contribute to ongoing improvements. Oh and I absolutely hate intrusive
> advertisements."
>
> — pseb, [Jefit Q&A](https://www.jefit.com/q&a/137713447/gymdad1963/has-anyone-found-elite-to-be-worth-the-cost)

> "I like being able to create unlimited custom exercises and workouts, but I've been riding on my
> iron points for awhile."
>
> — amgym19, samma tråd

---

### **6.2 Vad som beskrivs som besvikelser eller "inte värt pengarna"**

Här är StrongLifts undersökningens tydligaste fall, och recensionerna är färska (2026):

> "Update: I can no longer access any of the app, including my history and data, unless I pay $12 a
> month subscription. I used this app for years and now all my progress is locked behind a paywall
> and my past 'lifetime' purchase is gone."
>
> — Justin Laughlin, 2026-06-21, [Google Play — StrongLifts](https://play.google.com/store/apps/details?id=com.stronglifts.app) (19 markerade som hjälpsam)

> "after the most recent update I've lost access to any of the premium features that I paid for in
> 2017, same as with lots of other reviews recently. I will be switching to another app as soon as I
> get my data out. Very disappointed that stronglifts don't seem to care about their long term users"
>
> — David Redgrave, 2026-07-29, samma sida

> "Used to be 5 star review. But the constant ads to upgrade have brought it down. I bought a
> lifetime pass, but I still receive a pop-up that I can't close out of after every workout. […] an
> uncloseable, multi-page pop-up during typical use for a program that I already paid for? c'mon…"
>
> — Tyler Jordan, 2026-08-05, samma sida

Det är tre oberoende användare, inom tio veckor, som beskriver samma sak: **att ha betalat och ändå
förlora åtkomsten till sin egen träningshistorik.** För det här projektet är det den enskilt
viktigaste observationen i hela undersökningen, och den handlar inte om en funktion utan om en
arkitekturprincip — se §7.

Jefits uppsäljning beskrivs på motsvarande sätt som en försämring av produkten:

> "The app is great and has been for a long time, which is why I bought it, albeit over 6 years ago.
> I am so frustrated to get ads and pop ups all the time trying to get me to sign up for the
> subscription service. I don't need it or want it, I just want access to the basic features I paid
> for without the frustrating pop ups all the time."
>
> — Graham Keating, 2025-01-13, [Google Play — Jefit](https://play.google.com/store/apps/details?id=je.fit)

> "More and more pop up prompts are added each time, asking you to make more and more decisions
> before you can actually get to the reason you opened the app"
>
> — cubano americano, 2020-10-26, [App Store — Jefit](https://apps.apple.com/us/app/jefit-gym-workout-plan-log/id449810000?see-all=reviews)

Och hos Strong finns en användare som avstår från att betala för att prispaketeringen inte matchar
behovet — inte för att funktionerna saknar värde:

> "So far I wont start the subscription unless they add these features that are important to me"
>
> — Roland 1220, 2019-07-01, [App Store — Strong](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?see-all=reviews)

En Hevy-användare formulerar samma mekanism, och nämner då en funktion som ingen av de nio apparna
säljer:

> "It hasn't drawn me enough to upgrade to Pro […] What would take me across the line is having Apple
> shortcuts and api integration."
>
> — HappytoBow, 2023-09-09, [App Store — Hevy](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350?see-all=reviews)

**Det som är påfallande frånvarande i recensionerna** är minst lika informativt: ingen enda recension
i det granskade materialet nämner *Monthly Report*, *Year in Review*, *Strength Score*, teman eller
ikoner som skäl att betala. De funktionerna existerar i marknadsföringsmaterialet men inte i
användarnas motiv.

---

## **7. Prioriteringslista — den enda listan som ska styra vad vi bygger**

Kriteriet för att stå här: funktionen ligger bakom betalvägg hos **flera** appar (§5) **och** nämns
positivt av användare (§6). Poster som bara uppfyller ett av kraven står inte med.

### **Nivå 1 — bygg först**

**1. Inga tak. Någonstans.**
Obegränsat antal rutiner, mallar, egna övningar och pass. Detta är den mest paywallade posten i
kategorin efter grafhistorik (fyra appar), den mest omtalade i recensioner, och den enda där
gratisappen FitNotes uttryckligen gör en poäng av motsatsen (*"Create as many routines as you want"*).
För oss är kostnaden noll — det är rader i IndexedDB. **Bygg aldrig in en räknare som kan bli ett
tak.**

**2. Fullständig historik i grafer, från första passet till i dag.**
Sex av nio appar tar betalt för detta, ingen tar betalt för att lagra det. Hevys eget medgivande om
att datan ligger kvar på servern gör klassificeringen odiskutabel. För en offline-först PWA med all
data lokalt är tidsfönstret en parameter i en query. Estimerat 1RM över tid, volym över tid, och
utveckling per övning — utan tidsgräns.

**3. Träningshistoriken ska aldrig kunna bli oåtkomlig.**
Detta är inte en funktion utan en princip, och den kommer direkt ur StrongLifts-recensionerna i §6.2.
Konkret för oss: appen måste fungera fullt ut mot lokal data även när Supabase är nere, kontot är
utgånget eller nätet är borta, och det måste finnas en **export till en fil användaren äger** — CSV
eller JSON, i appen, utan serverberoende. FitNotes backup till Dropbox/Google Drive och Strongs
kostnadsfria CSV-export är förlagorna. Detta är projektets skarpaste konkurrensfördel mot samtliga
nio appar och kostar en eftermiddags arbete.

**4. Viktskivekalkylator och uppvärmningskalkylator.**
Tillsammans sex betalväggar (tre vardera). Ren aritmetik, körs lokalt, ingen driftskostnad någonstans
i kedjan. Den enda FitNotes-recensionen som nämner en enskild funktion vid namn nämner just
viktskivekalkylatorn. Detta är den billigaste posten på hela listan i förhållande till hur ofta den
säljs.

### **Nivå 2 — bygg när grunden står**

**5. Volym per muskelgrupp och per vecka.**
Tre betalväggar (Hevy, Boostcamp, Jefit). Kräver att övningar är taggade med muskelgrupp, vilket är
ett datamodellsbeslut som bör fattas tidigt även om visualiseringen kommer senare. Boostcamps
värmekarta och Hevys "set count per muscle group" är samma sak i olika förpackning.

**6. Progressionsförslag — nästa vikt och reps, per övning, baserat på historiken.**
Tre betalväggar, och den funktion användare uttrycker starkast *positivt* värde kring (§6.1). Det
avgörande argumentet för att bygga den: **Progression ger bort den gratis** (*"Get automatic
suggestions for when to increase the weight"*) medan Alpha Progression tar 79,99 USD om året. Det
bevisar att en användbar version inte kräver vare sig serverberoende eller AI-anrop — enkel linjär
progression med RIR-justering räcker långt. Börja enkelt; komplexiteten hos Alpha Progression är en
produktdifferentiering, inte ett tekniskt krav.

**7. Utrustningsprofiler per gym.**
Alpha Progressions *"Multiple gyms"* är den mest underskattade posten i undersökningen — den finns
bara hos en app, den är låst där, och den löser ett verkligt problem (vilka viktskivor och hantlar
som faktiskt finns påverkar både kalkylatorn och progressionsförslaget). Låg prioritet just för att
överlappet saknas, men värd att komma ihåg.

### **Nivå 3 — bygg om det blir lust över**

**8. Kroppsmått utöver vikt.** Två betalväggar (Strong, Hevy). Nämns inte i någon granskad
användarröst som skäl att uppgradera. Bygg bara om det är billigt.

**9. RIR/RPE-loggning.** Gratis hos Boostcamp, betalt hos Alpha Progression. Svagt överlapp, men
förutsättning för punkt 6 om progressionsförslagen ska bli mer än linjära.

---

## **8. Vad vi INTE ska bygga — låst enbart av säljskäl**

Denna lista finns för att den är lika styrande som §7. Att en kommersiell app tar betalt för något
betyder inte att det är värdefullt; ibland betyder det bara att det var lätt att låsa.

| Funktion | Vem låser den | Varför den inte ska byggas här |
|---|---|---|
| **Teman och egna appikoner** | Strong PRO | Rent kosmetisk uppsäljning. Nämns inte i en enda granskad recension som skäl att betala. |
| **Annonsfritt läge** | Jefit Elite | Vi har inga annonser. Funktionen är att ta bort något vi aldrig lägger till. |
| **Leaderboards, socialt flöde, profiler** | Hevy Pro (*Leaderboard Exercises*) | Utanför projektets omfattning per uppdraget. En enanvändarapp har ingen topplista. |
| **Licensierade coachprogram** | Boostcamp Pro (20+), Jefit Elite | Den enda posten med genuint hög kostnad — och den mest irrelevanta. Adam skriver sitt eget program. |
| **Strength Score (0–100)** | Boostcamp Pro | Sammanvägning av fem lyft till en siffra. Döljer information i stället för att visa den. Fåfängemått. |
| **Monthly Report / Year in Review / Wrapped** | Hevy Pro, Boostcamp (gratis) | Retentionsmekanik byggd för att dra tillbaka användare till en app de slutat öppna. Vi har inget churn-problem. |
| **Gamification, awards, iron points** | Alpha Progression, Jefit | Motiverar via appen i stället för via träningen. Låg halveringstid. |
| **HD-videobibliotek för övningar** | Jefit Elite | Verklig lagrings- och bandbreddskostnad, försumbart värde för en användare som kan sina egna lyft. Alpha Progression ger bort 795 videor, vilket visar att priset inte är principiellt — men behovet finns ändå inte här. |
| **Molnsynk som säljbar funktion** | Liftosaur premium | Verklig kostnad hos dem, redan löst hos oss via Supabase. Ska aldrig bli en nivå. |
| **Plangenerator / "personaliserade program"** | Alpha Progression, Boostcamp, Jefit | Genererar ett program åt någon som inte har ett. Adam har ett. Skiljer sig från punkt 6, som förbättrar ett befintligt program. |
| **Varje form av tak, kvot eller tidsfönster** | Samtliga utom FitNotes och Boostcamp | Existerar uteslutande för att sälja lindringen. Att bygga in ett vore att bygga in ett säljargument i en app som inget säljer. |

---

## **9. Två efterföljande anteckningar**

**Om `docs/EXTERNT.md`:** ingenting har hämtats eller kopierats i den här undersökningen — den består
av observationer och citat, inte av kod eller datamängder. Ingen registerrad krävs därför i nuläget.
**Men:** om Liftosaurs Liftoscript-idéer någon gång påverkar vår design ska det in i registret som
"läst som inspiration, ej kopierat", och AGPL-varningen i §4.8 ska följa med raden. Detsamma gäller
om någon övningsdatabas hämtas från något av de undersökta projekten.

**Om nästa steg:** jämför den här filen mot
[`docs/research/betalfunktioner-i-gymappar.md`](./betalfunktioner-i-gymappar.md) innan §7 omsätts i
`docs/TASKS.md`. Där båda undersökningarna landar på samma funktion är beslutet redan fattat. Där de
går isär är det värt att titta på källorna innan något byggs — särskilt om den andra filen kom åt
Reddit, som saknas här.

---

## **10. Källförteckning**

Samtliga hämtade 2026-08-18.

**Officiella pris- och funktionssidor**
- [Strong Help Center — What is Strong PRO?](https://help.strongapp.io/article/132-strong-pro)
- [Strong Help Center — Can I export my workout data?](https://help.strongapp.io/article/235-export-workout-data)
- [Hevy Help Centre — Hevy Pro Subscription: How to get Pro and What Does It Include?](https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include)
- [Hevy Help Centre — What will happen to my account if I switch from Pro to the free version?](https://help.hevyapp.com/hc/en-us/articles/38279350428695-What-will-happen-to-my-account-if-I-switch-from-Pro-to-the-free-version)
- [Jefit — Elite Membership Plans](https://www.jefit.com/elite)
- [Jefit — FAQ](https://www.jefit.com/support/faq)
- [Boostcamp Pro](https://www.boostcamp.app/pro)
- [Alpha Progression — Pricing](https://www.alphaprogression.com/en/pricing)
- [Alpha Progression — Subscribe](https://www.alphaprogression.com/en/subscribe)
- [Liftosaur — Docs](https://www.liftosaur.com/docs/) · [Liftosaur på GitHub (AGPL-3.0)](https://github.com/astashov/liftosaur)

**Butikslistningar (prispunkter, betyg, beskrivningar)**
- [App Store — Strong Workout Tracker & Gym Log](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577)
- [App Store — Hevy](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350)
- [App Store — JEFIT](https://apps.apple.com/us/app/jefit-gym-workout-plan-log/id449810000)
- [App Store — Boostcamp](https://apps.apple.com/us/app/boostcamp-workout-programs/id1529354455)
- [App Store — Gym Workout Alpha Progression](https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793)
- [App Store — Progression Workout Tracker](https://apps.apple.com/us/app/progression-workout-tracker/id1090687896)
- [App Store — Liftosaur: Scriptable Workouts](https://apps.apple.com/us/app/liftosaur-scriptable-workouts/id1661880849)
- [App Store — Stronglifts 5x5 Workout Plan](https://apps.apple.com/us/app/stronglifts-5x5-workout-plan/id488580022)
- [Google Play — Strong](https://play.google.com/store/apps/details?id=io.strongapp.strong)
- [Google Play — Hevy](https://play.google.com/store/apps/details?id=com.hevy)
- [Google Play — JEFIT](https://play.google.com/store/apps/details?id=je.fit)
- [Google Play — FitNotes](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes)
- [Google Play — Alpha Progression](https://play.google.com/store/apps/details?id=com.alphaprogression.alphaprogression)
- [Google Play — Progression](https://play.google.com/store/apps/details?id=workout.progression.lite)
- [Google Play — Stronglifts 5x5](https://play.google.com/store/apps/details?id=com.stronglifts.app)

**Användargenererade källor**
- Verifierade recensioner på ovanstående Google Play-sidor (Google märker dem "Ratings and reviews are verified")
- App Store-recensionssidor (`?see-all=reviews`) för Strong, Hevy, JEFIT, Alpha Progression, Liftosaur och Stronglifts
- [Jefit Q&A — "Has anyone found Elite to be worth the cost?"](https://www.jefit.com/q&a/137713447/gymdad1963/has-anyone-found-elite-to-be-worth-the-cost)

**Ej åtkomliga i miljön** (noterade för fullständighet, inget citerat därifrån)
- reddit.com — blockerat för både hämtningsverktyg och webbläsare. Relevanta trådar som identifierades
  men inte kunde läsas: [r/Hevy — "Anyone have Hevy PRO? Is it worth it to you?"](https://www.reddit.com/r/Hevy/comments/10z4krg/anyone_have_hevy_pro_is_it_worth_it_to_you/) ·
  [r/Stronglifts5x5 — "Can anyone fill me in on what happened with the Stronglifts app"](https://www.reddit.com/r/Stronglifts5x5/comments/q14oyy/can_anyone_fill_me_in_on_what_happened_with_the/) ·
  [r/Fitness — "Is anyone using JeFit Elite?"](https://www.reddit.com/r/Fitness/comments/59iobh/is_anyone_using_jefit_elite_are_the_exclusive/)
