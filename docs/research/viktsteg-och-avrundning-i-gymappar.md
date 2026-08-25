Arkitektur och UX-mönster för hantering av viktsteg och avrundning i träningsappar
Denna rapport utgör en djupgående, teknisk och användarupplevelsefokuserad (UX) branschanalys av hur etablerade träningsappar hanterar diskreta datamängder. Analysen fokuserar specifikt på viktsteg (increments), utrustningsdatabaser och algoritmer för avrundning. Den underliggande problematiken inom utveckling av mjukvara för styrketräning bottnar i en fundamental konflikt: diskrepansen mellan kontinuerliga matematiska värden (såsom glidande medelvärden, trendlinjer och procentuella uppskattningar av ett repetitionsmaximum, 1RM) och den fysiska verklighetens strikt diskreta utrustningssteg (exempelvis hantlar med ett kilos intervall eller skivstänger med tjugofem hektograms intervall). Denna utredning är strukturerad för att ge konkret och datadriven vägledning vid systemdesign och utveckling av en offline-first PWA-träningslogg, med särskilt fokus på att lösa de kognitiva och matematiska utmaningar som uppstår vid beräkning av referensvikter för användaren.

Inmatningssteg och gränssnittets plus/minus-knappar
Ett av de mest affärskritiska interaktionsmönstren i en träningsapplikation är hur användaren interagerar med gränssnittet för att snabbt och friktionsfritt justera arbetsvikten mellan set. Marknaden för träningsappar uppvisar en rad olika strategier för hur dessa viktsteg definieras, från globala konstanter i källkoden till utrustningsspecifika matriser och avancerade användardefinierade intervall.

I applikationen Strong hanteras inmatningssteget genom en noggrann separation mellan den globala utrustningsinventarien och den övningsspecifika progressionen. Enligt officiella supportartiklar från Strong använder appen som standard en ökning på fem pund (vilket översätts till 2,5 kilogram) för traditionella skivstångsövningar, vilket reflekterar den fysiska realiteten att den minsta standardviktskivan på majoriteten av kommersiella gym är 1,25 kilogram per sida. Den avgörande systemarkitektoniska detaljen här är att inställningen för detta steg bor lokalt på varje enskild övning i användarens databas. Användaren navigerar till denna inställning genom att trycka på "Start Workout", klicka på vikten för den specifika övningen och därefter skrolla ner till sektionen för "Progression settings". Ett kritiskt UX-beslut som Strong har fattat är att applikationen inte automatiskt härleder inmatningssteget från användarens virtuella utrustningsväska. Om en användare till exempel köper mikrovikter, såsom två skivor på ett pund vardera, och lägger till dessa i sin globala utrustningslista, måste användaren ändå manuellt gå in på övningen och ändra progressionssteget till två pund. Strong antar inte automatiskt ett nytt steg bara för att en ny viktskiva har gjorts tillgänglig, vilket ställer krav på användarens egen administration men förhindrar oönskade systembeteenden. Applikationen tillåter dock att man konfigurerar vilka viktskivor man faktiskt har tillgång till, vilket i sin tur påverkar appens kalkylatorer, men själva "steget" för progression och inmatning styrs uteslutande per övning. Det bör även noteras att den visuella funktionen för "Plate Calculator" ligger bakom en betalvägg och kräver Strong PRO. I forumdiskussioner framgår det också att Strongs gränssnitt på Apple Watch tidigare använde den digitala kronan för att öka vikten med jämna steg (exempelvis 0,5 kg), men att nyare uppdateringar har introducerat oregelbundna decimaler vilket skapat viss frustration bland användare, vilket understryker vikten av förutsägbara inmatningssteg i bärbara gränssnitt.   

FitNotes representerar en av de applikationer som erbjuder allra mest granulär och transparent kontroll för den avancerade användaren. I FitNotes är logiken kring inmatningssteg direkt bunden till övningens unika ID i databasen. Appen tillåter användaren att definiera ett specifikt "Weight Increment" (viktsteg) för varje enskild övning. Denna inställning modifieras genom att användaren navigerar till redigeringsvyn för övningen (Edit Exercise), där ett specifikt fält styr exakt vilket numeriskt värde plus- och minus-knapparna hoppar med vid interaktion. Denna arkitektur löser problemet med hantlar på ett mycket elegant sätt, eftersom användaren fritt kan ställa in ett steg på 1,0 kilogram för en isolationsövning som Hantelcurl, samtidigt som ett steg på 2,5 kilogram bibehålls för tunga basövningar som Knäböj eller Bänkpress. FitNotes tillåter också skapandet av helt anpassade viktskivor och unika skivstänger, vilket ger en fullständig flexibilitet.   

Hevy angriper problematiken från en något annorlunda vinkel genom att implementera specifik avrundning baserat på utrustningstyp i sina bakomliggande kalkylatorer, snarare än enbart på övningsnivå. I inställningarna för appens Warm-up Calculator, vilket är en funktion reserverad för premiumanvändare via Hevy PRO, kan användaren definiera variablerna "Plate rounding" och "Dumbbell rounding" som två helt separata entiteter. Denna inställningsmeny är lokaliserad under Profilfliken, vidare till Inställningar via kugghjulsikonen, in under "Workouts" och slutligen "Warm-up Calculator". Om en användare tränar på en anläggning där hantlarna endast ökar i steg om 2,5 kilogram, kan detta specifika värde väljas i en rullgardinsmeny för att tvinga algoritmen att anpassa sig. Utifrån det analyserade underlaget framgår det inte i detalj huruvida Hevy applicerar exakt detta värde på plus- och minus-knapparna i det vardagliga loggningsgränssnittet för alla övningar, men systemarkitekturen visar tydligt att logiken för att separera hantelsteg från skivstångssteg existerar i kodbasen och används för beräknade värden.   

Alpha Progression bygger sin kärna kring en mycket avancerad rekommendationsmotor för progression och erbjuder en exceptionellt flexibel lösning för utrustningsintervall. Under menysökvägen "Settings > Training > Weight options" ges användaren möjlighet att bygga helt egna, skräddarsydda viktintervaller. Detta är av särskilt intresse för användare med hemmasgym eller okonventionell utrustning. Det gör det möjligt att definiera asymmetriska eller ojämna hantelset. I en forumdiskussion beskrivs hur en användare med justerbara hantlar av märket PowerBlocks kan mata in specifika villkor i appen. Användaren kan definiera en regel som lyder "Från 5 till 25 med 5 kg intervall" och sedan kombinera detta med andra unika, icke-linjära steg. Applikationens rekommendationsmotor, liksom inmatningsknapparna, anpassar sig omedelbart till detta skräddarsydda utrustningsrutnät, vilket helt eliminerar risken att appen föreslår en vikt som rent fysiskt inte går att konfigurera.   

När det gäller applikationen Progression arbetar denna utifrån ett koncept som utvecklaren benämner "Dynamic double progression". I detta system ökas vikten baserat på en algoritm som utvärderar när användaren har uppnått sina målrepetitionerna ("increase weight by given amount when all sets hit target reps"). I forumdiskussioner klargörs att appen sätter upp mål för repetitionsintervall och RIR (Reps in Reserve) för varje set, och ordinerar vikter för att träffa dessa mål allteftersom den lär sig användarens kapacitet. De specifika mekanismerna för hur det grafiska gränssnittets manuella plus- och minus-knappar är konfigurerade saknas dock i den officiella dokumentationen och diskussionstrådarna.   

JEFIT använder ett liknande paradigm med ett AI-drivet system för progressiv överbelastning som syftar till att föreslå nästa arbetsvikt baserat på historisk data. Enligt appens uppdateringsloggar är systemet designat så att dessa viktförutsägelser uttryckligen "snappar till utrustningssteg" (snap to equipment increments) för att säkerställa renare loggning. Inställningen för standardrepetitionantal och initial startvikt kan redigeras genom ett enkelt UX-mönster där användaren sveper vänster på en specifik övningscell och trycker på redigeringsikonen. Detaljerad teknisk information om hur plus/minus-knapparnas algoritm interagerar med manuell inmatning förklaras inte djupare i källmaterialet, och det är värt att notera att de mer avancerade AI-kalkylatorerna är låsta bakom abonnemanget JEFIT Elite.   

MacroFactor är i dagsläget primärt en applikation för nutrition och kroppsviktshantering, men enligt omfattande forumdiskussioner och tillkännagivanden från utvecklarna planeras en dedikerad träningsmodul (MacroFactor Workouts) att lanseras i början av 2026. I dessa trådar har användare ställt explicita krav på förmågan att definiera exakt vilka inkrement som finns tillgängliga per maskin och övning (till exempel kabelmaskiner med 5 kg-steg kontra hantlar med 2 kg-steg). Utvecklarna har i respons indikerat att de ämnar implementera en funktionalitet för hur enkelt det är att lägga till vikt till ett set, definierat per övning, och refererar specifikt till hur konkurrenten FitNotes har löst denna utmaning. Detta bekräftar att den framtida branschstandarden rör sig mot övningsspecifika inkrementfält i databasen.   

Gällande applikationen Boostcamp måste det uttryckligen konstateras att det helt saknas information, omnämnanden eller teknisk dokumentation i det tillhandahållna forskningsunderlaget. Därmed kan ingen analys göras av deras hantering av inmatningssteg eller avrundning.

Sammanfattningsvis visar denna genomgång att marknadsstandarden för professionella träningsappar är att låta inmatningssteget styras på databasnivå per övning (vilket exemplifieras tydligast av FitNotes och Strong). Att binda en inställning globalt till enbart utrustningstyp är otillräckligt, eftersom en hantelövning för axlar kan kräva andra steg än en hantelövning för bröst, beroende på användarens styrkenivå och tillgång till utrustning. Att placera denna konfiguration direkt i redigeringsvyn för den specifika övningen är det mest vedertagna och intuitiva UX-mönstret.

Branschpraxis för standardvärden (Defaults) och utrustning
När träningsapplikationer lanseras och skeppas med standardvärden (defaults) för utrustning är dessa konfigurationer utformade för att täcka uppemot nittio procent av alla kommersiella gym globalt. Målet från systemutvecklarnas sida är primärt att minimera friktion under "onboarding"-processen för nya användare, inte att presentera en teoretiskt perfekt eller komplett matematisk serie av alla världens tillverkade viktskivor.

Branschpraxis utgår fundamentalt från den standardiserade olympiska utrustningen, som dominerar den globala marknaden, samt de mest konventionella hantelseten. Data från framförallt FitNotes dokumentation och Strongs officiella supportartiklar visar på en oerhört stark konsensus kring vilka standardvärden som bör implementeras från fabrik.   

För att ge en exakt bild av hur dessa värden är strukturerade, redovisas nedan de konkreta konstanter som används som branschstandard.

Utrustningstyp	Metriska standardvärden (kg)	Imperiella standardvärden (lb)	Datakälla
Standard Skivstång (Barbell)	20,0 kg	45,0 lb	
Fullständig array av viktskivor (FitNotes)	50; 25; 20; 15; 10; 5; 2,5; 1,25; 1; 0,5; 0,25	100; 55; 45; 35; 25; 10; 5; 2,5; 1,25; 1; 0,5; 0,25	
Standardaktiverade viktskivor (Strong)	Endast 20; 10; 5; 2,5	Endast 45; 25; 10; 5; 2,5	
Typiska Hantelsteg (Dumbbell rounding)	2,5 kg (eller 1,0 kg vid lägre vikter)	5,0 lb (eller 2,5 lb)	
  
En djupare analys av dessa standardvärden avslöjar intressanta beslut kring användarpsykologi och fysisk säkerhet. Strong avråder till exempel uttryckligen sina användare från att aktivera vissa vanliga viktskivor, såsom 35 pund (eller dess metriska motsvarighet på 15 kg) i appens inställningar, även i de fall där användarens gym är utrustat med dessa. Anledningen till detta grundar sig i UX-friktion kombinerat med skadeprevention. Appens inbyggda kalkylatoralgoritm är programmerad att alltid välja och visualisera den tyngsta möjliga skivan för att minimera det totala antalet skivor på stången.   

Om en användare har 35-pundsskivan aktiverad och ska öka sin arbetsvikt från 135 pund (vilket utgörs av en 45-pundsskiva per sida) till 225 pund, kommer kalkylatorn att föreslå att användaren plockar av 45-pundsskivan och ersätter den med en kombination av en 55-pundsskiva och en 35-pundsskiva. Detta leder till onödig och tidskrävande "plate switching" (skivbyte). Enligt Strongs dokumentation är just hanteringen och tappandet av tunga viktskivor en av de vanligaste orsakerna till skador i gymmiljöer. Därför är den etablerade branschpraxisen att medvetet exkludera mellanvikter som 15 kg eller 35 lb från systemets standardaktivering. Genom att göra detta främjar appen en linjär och säker påbyggnad (exempelvis: behåll 20 kg-skivan på stången, lägg till en 10 kg-skiva, lägg sedan till en 5 kg-skiva) vilket drastiskt minskar hanteringstiden och risken för olyckor under vila.   

Avrundning av beräknade och härledda värden
Kärnfrågan kring hur digitala system avrundar härledda numeriska värden – såsom glidande medelvärden, trendlinjer, estimerat 1RM (One Rep Max) och föreslagna arbetsvikter – avslöjar en tydlig och systematisk gränsdragning mellan analytisk presentation och praktisk applikation. Det är fundamentalt viktigt för arkitekturen i en träningsapp att förstå denna gränsdragning.

Applikationer på marknaden hanterar avrundning strikt baserat på kontexten för det specifika värdet:

Den första kategorin utgörs av Analytiska värden, vilket inkluderar grafer, långsiktiga trender och teoretiskt estimerat 1RM. Dessa datapunkter presenteras ofta och medvetet med decimaler eftersom de representerar teoretiska matematiska koncept snarare än fysiska objekt. MacroFactor, som är marknadsledande inom trendanalys av kroppsvikt, visar trendvikter med hög precision (mer om detta i nästa kapitel). Ett estimerat 1RM är likaledes ett matematiskt härlett tal som inte under några omständigheter nödvändigtvis ska lyftas samma dag. Därför bibehåller det ofta sin exakta decimalform (exempelvis 104,3 kg) eller avrundas mjukt matematiskt till heltal, utan hänsyn till om vikten går att bygga med viktskivor eller inte.   

Den andra kategorin är Praktiska värden, vilket innefattar föreslagna arbetsvikter i ett program, utdata från en Warm-up Calculator eller rekommendationer från en Set Calculator. När applikationen föreslår vad användaren faktiskt ska lägga på skivstången just idag, gör mjukvaran en skarp åtskillnad mellan användarens historiska inmatning och appens egna beräkningar. För att förslaget ska vara handlingsbart måste systemet "snappa" (avrunda) de beräknade värdena till ett fast, fysiskt förankrat rutnät.

Flera konkreta exempel illustrerar denna logik för avrundning till rutnät:
I applikationen FitNotes finns funktionen "Set Calculator", vilken är ovärderlig för användare som följer procentbaserade träningsprogram såsom Jim Wendlers 5/3/1. I detta gränssnitt finns en explicit funktionsknapp benämnd "Round To Closest" (Avrunda till närmaste). När appen beräknar att 75 procent av användarens maxvikt är 86,25 kg, trycker användaren på denna knapp för att tvinga algoritmen att avrunda det matematiska värdet till närmaste 2,5, 5,0 eller 10,0 kg, vilket säkerställer att den resulterande vikten är lämplig och fysiskt möjlig att lasta på en olympisk skivstång.   

Hevy automatiserar denna process i sin uppvärmningskalkylator. Som tidigare analyserats har systemet två distinkta inställningar i bakgrunden: "Plate rounding" och "Dumbbell rounding". Procentberäkningen av uppvärmningsseten (till exempel 40 % av en tilltänkt arbetsvikt på 100 kg resulterar initialt i råvärdet 40 kg) avrundas automatiskt i bakgrunden baserat på dessa inställningar, innan de presenteras för användaren. Detta innebär att appens maskinella beräkning sömlöst omvandlas från en abstrakt rå decimal till en faktisk, "lyftbar" vikt.   

Ytterligare ett exempel återfinns i träningsloggen GymPsycho. Denna AI-drivna tracker deklarerar uttryckligen i sin dokumentation att den använder en algoritm baserad på "konservativ avrundning till tillgängliga gymskivor" ("conservative rounding to available gym plates") när den formulerar sina viktförslag inför nästa set.   

Den avgörande insikten för arkitekturen av en PWA är att det måste finnas en skarp systemarkitektonisk separation mellan databaslagret och presentationslagret. Indata (den vikt användaren faktiskt lyfte och manuellt loggade) måste lagras och hanteras som oförvanskad rådata. Det glidande snittet av de tre senaste träningspassen bör i appens backend och State Management hanteras med full flyttalsprecision (float). Men i presentationslagret – det vill säga den gråa referenstexten under inmatningsfältet som vägleder användaren – måste detta flyttal avrundas till det specifika viktsteg (increment) som är kopplat till den enskilda övningen i databasen.

För att lösa det specifika problemet som nämndes i bakgrunden: Att snittet för Hantelcurl under tre pass (8 kg, 9 kg, 10 kg) beräknas till exakt 9,0 kg är matematiskt korrekt. Om övningens "increment" i databasen är ställt på 1,0 kg, bör referensvärdet presenteras för användaren som 9 kg. Om samma snitt hade landat på 9,33 kg, avrundas det till 9 kg. Men om en användare utför Knäböj med ett snitt på 98,33 kg och övningens definierade increment är 2,5 kg, måste presentationslagret avrunda värdet till 97,5 kg. På så sätt harmoniserar matematiken alltid med den fysiska utrustningen.

MacroFactor och presentationen av glidande medelvärden (EWMA)
MacroFactor har revolutionerat den digitala marknaden för kost- och viktuppföljning genom att bygga sin varumärkesidentitet kring en deterministisk och utjämnande algoritm, formellt känd som EWMA (Exponentially Weighted Moving Average, eller Exponentiellt glidande medelvärde). Eftersom din PWA hämtar konceptuell inspiration från deras utjämnade trendlinjer, är en djupdykning i de underliggande matematiska och visuella mekanismerna nödvändig.   

Inom maskininlärning och dataanalys används EWMA för att spåra trender och släta ut kraftiga fluktuationer i tidsseriedata. Till skillnad från ett enkelt glidande medelvärde (SMA), som behandlar alla historiska datapunkter med exakt samma vikt, applicerar EWMA en "förfallofaktor" eller utjämningsfaktor (ofta betecknad med den grekiska bokstaven alpha, α). Denna faktor avgör hur mycket matematisk vikt som läggs vid de allra senaste observationerna jämfört med äldre data. I MacroFactors kontext innebär detta att algoritmen lägger oproportionerligt stor vikt vid användarens kroppsvikt från de senaste dagarna, samtidigt som den bevarar det historiska minnet från tidigare invägningar. Syftet är att systematiskt filtrera bort brus och kortsiktiga, icke-meningsfulla fluktuationer (vilka orsakas av faktorer som vätskeretention, variationer i glykogenlager eller matspjälkning) för att blottlägga den "sanna" trenden för vävnadsförändring. Analysen av dessa data spänner primärt över ett tidsfönster bestående av de senaste 21 dagarna. MacroFactor fyller även i eventuella luckor i dataserien (om användaren glömmer att väga sig en dag) genom en process de kallar "tweening", vilket skapar en blek interpolerad linje som sedan analyseras av huvudalgoritmen för att fastställa den djuplila trendlinjen.   

När det gäller själva presentationen av dessa siffror i användargränssnittet skiljer sig MacroFactor avsevärt från hur träningsappar hanterar skivstänger:
För det första visar MacroFactor uttryckligen decimaler. Applikationen stödjer naturligt inmatning av data med kommatecken (exempelvis 82,5 kg) för att spegla digitala personvågar. När användaren studerar trendens utveckling över olika tidsramar, exempelvis en historisk 20-dagarsförändring, redovisas denna delta-siffra ibland med upp till två decimalers precision (exempelvis en ökning på 0,14 kg). Denna höga grad av precision tjänar ett analytiskt syfte. Dock har utvecklarna i nyare uppdateringar aktivt valt att kalibrera instrumentpanelen (dashboard) för att kunna visa de övergripande trendsiffrorna avrundade till en enda decimal. Detta är ett medvetet UX-beslut avsett att minska den visuella och kognitiva belastningen för användaren när de snabbt ska avläsa sin status.   

För det andra, och av yttersta vikt för din app-design: Avrundar MacroFactor sin trendvikt till något "användbart" steg, såsom ett 2,5 kg-intervall? Svaret är absolut nej. Orsaken till detta är förankrad i grundläggande biologi och fysik. Kroppsvikt är per definition en kontinuerlig variabel. Det existerar inga fysiska eller biologiska begränsningar som hindrar en människa från att väga exakt 82,34 kg. Algoritmen behöver därför aldrig "snappa" värdet till ett konstgjort raster.   

Den strategiska slutsatsen för din PWA är att det vore ett gravt UX-misstag att kopiera MacroFactors EWMA-presentation rakt av och applicera den på skivstångsövningar. Viktskivor och hantlar utgör en diskret variabel som styrs av tillverkningsindustrins standarder. Om din algoritm kalkylerar och presenterar ett snitt på "34,7 kg" som en rekommendation för nästa set i Bänkpress, uppstår omedelbart en kognitiv dissonans hos användaren. Den spontana reaktionen blir ofrånkomligen: "Hur exakt lastar jag 34,7 kg på en stång?" Ett glidande snitt i kontexten av en träningsapp är endast ett värdefullt och användbart riktmärke om det omedelbart kan omsättas till fysisk handling på gymgolvet. Detta kräver obönhörligen att det bakomliggande kontinuerliga värdet avrundas till närmaste definierade utrustningssteg (increment) innan det presenteras för slutanvändaren.

Konceptet "Snappa till faktiskt använd historisk vikt"
En innovativ frågeställning är huruvida någon applikation löser problemet med udda utrustningssteg (där ett snitt på 9 kg avrundas till 10 kg trots att 10 kg kanske aldrig har lyfts och hanteln inte ens existerar på gymmet) genom att avrunda beräknade värden exklusivt till den närmaste historiskt loggade vikten för just den övningen, istället för att tvinga in värdet i ett fast, hårdkodat rutnät. Teoretiskt sett skulle detta kunna eliminera behovet av en komplex utrustningsdatabas.

Svaret på denna fråga är nekande. Det finns inga belägg i det omfattande och djuplodande forskningsunderlaget för att någon av de stora aktörerna på marknaden (inklusive Strong, Hevy, FitNotes, JEFIT, Progression, eller Alpha Progression) explicit implementerar en beräkningsalgoritm som matematiskt avrundar föreslagna framtida arbetsvikter enbart baserat på historiskt plockade datapunkter från användarens egen logg.

Verkligheten är att marknadsledare som Hevy och Strong går en helt annan, mer transparent väg. De väljer att i användargränssnittet presentera användarens historiska rådata exakt som den loggades, och placerar denna information ("Previous Workout Values", exempelvis i formatet 45 kg x 9) i omedelbar anslutning till inmatningsfältet. Detta fungerar som en passiv visuell referens. Användaren kan sedan aktivt klicka på detta referensvärde för att automatiskt fylla i fältet. Emellertid, när det gäller apparnas faktiska systemdrivna kalkylatorer (för att beräkna procentuella program eller generera en specifik uppvärmningsstege), snappar algoritmerna alltid till ett teoretiskt rutnät (såsom Hevys "plate rounding"-funktion) och inte till användarens historik. Även AI-drivna applikationer som GymPsycho stipulerar att de använder "konservativ avrundning till tillgängliga gymskivor", vilket bevisar att de bygger sin logik på utrustningens fysiska existens, inte på den historiska loggens innehåll.   

Varför undviker hela branschen att snappa till historik? En djupgående systemarkitektonisk analys identifierar tre fundamentala problem som gör denna approach orimlig inom styrketräningens domän:

Den inbyggda konflikten med progressiv överbelastning: Det vetenskapliga och praktiska syftet med progressiv överbelastning är att systematiskt utmana nervsystemet och muskulaturen genom att få användaren att lyfta en vikt de aldrig har lyft förut. Antag att en användare under det senaste året historiskt har loggat 8 kg, 9 kg och 10 kg i Hantelcurl. Om systemets algoritm nu förutspår att användaren genom anpassning har kapacitet för 11 kg, skulle en funktion som är låst till att "snappa till historisk vikt" tvinga ner det föreslagna värdet till 10 kg (eftersom detta är den närmaste vikten som existerar i historiken). Systemet skulle därmed aktivt blockera progression och sabotera användarens utveckling.   

Kallstartsproblemet (Cold Start Problem): När en användare lägger till en helt ny övning i sin rutin, eller när appen laddas ner för allra första gången, existerar ingen historisk data att referera till. Detta tvingar ofrånkomligen applikationens arkitektur att ändå implementera en reservlösning (fallback) baserad på ett fast, hårdkodat steg.

Kontextuella byten och utrustningsvariationer (Sparsity of data): Tränande individer är ofta rörliga och byter regelbundet mellan olika gym. På ett hotellgym i USA kanske användaren tränar med hantlar kalibrerade i pund (vilket resulterar i loggade vikter som 20, 25, 30 lb). Väl hemma i Europa byter de till ett gym med metriska hantlar (vilket borde generera 10, 12.5, 15 kg). Om algoritmen tvingas snappa till den imperiala historiken, kommer den att börja föreslå matematiska konverteringar från historiken som överhuvudtaget inte existerar i racken på det nya metriska gymmet.

Strategisk rekommendation för din PWA: Istället för att bygga komplexa och resurskrävande databasfrågor som letar efter tidigare använda vikter och fastnar i ovan nämnda fällor, är den branschstandardiserade och mest robusta lösningen att applicera den modell som FitNotes och Strong använder. Systemarkitekturen bör låta varje enskild övning i din underliggande databas ha ett specifikt, redigerbart increment-värde. En övning som Hantelcurl tilldelas ett increment på 1,0 (eller 2,5, beroende på lokal standard), medan en klassisk Bänkpress tilldelas ett increment på 2,5. Det beräknade flyttalssnittet (float) avrundas sedan rent matematiskt till den närmaste multipeln av detta övningsspecifika increment-värde innan det renderas i UI:t. Denna lösning är deterministisk, kräver minimal datakraft för en offline-first PWA, och eliminerar helt behovet av komplicerade utrustningsdatabaser, samtidigt som den tillåter obegränsad framtida progression.

Fasta viktstackar, kabelmaskiner och irreguljära intervall
Ett genuint och notoriskt svårt problem för utvecklare av träningsappar är hanteringen av kabelmaskiner och inbyggda viktmagasin (weight stacks). Dessa maskiner tillverkas av ett myller av olika märken – såsom Life Fitness, Matrix, Technogym, Nautilus – och har fasta, tillverkarsspecifika viktsteg som ytterst sällan följer standardiserade olympiska intervaller. Det är mycket vanligt att stöta på viktmagasin som ökar i steg om 5, 5,5, 7 eller 10 kilogram, och ibland är magasinen endast märkta med indexnummer från 1 till 20, helt utan konkret viktangivelse.   

De allra flesta träningsapplikationer undviker helt enkelt att bygga inbyggda kalkylatorer eller logik för kabelmaskiner. Funktioner som "Plate Calculators", vilka hyllas som centrala verktyg i appar som Strong och FitNotes, är uttryckligen konstruerade för bilateral friviktsutrustning (Barbells och EZ-bars). När en användare i dessa appar väljer en övning som är kategoriserad som "Maskin", inaktiveras ofta skivstångskalkylatorn per automatik, eftersom dess bakomliggande algoritm saknar all form av funktionell bäring på ett inkapslat viktmagasin.   

Den enda applikationen i det granskade forskningsunderlaget som adresserar ojämna viktmagasin och kabelstackar på ett systematiskt, om än komplext, sätt är Alpha Progression. Som tidigare berörts tillåter Alpha Progression inte enbart att användaren aktiverar eller inaktiverar standardiserade viktskivor, utan appen erbjuder möjligheten att definiera helt asymmetriska eller irreguljära viktintervaller via den avancerade inställningsmenyn "Weight options".   

Detta UX-mönster gör det möjligt för en användare med tillgång till en udda kabelstack att ställa in exakta och icke-linjära definitionsmängder.
Exempel: Användaren kan skapa en regel i appen som dikterar "Från 7.5 till 17.5 med 10kg intervall". Detta tvingar mjukvaran att förstå att utrustningen endast kan acceptera värdena 7,5 och 17,5, och inget däremellan. Även om den specifika forumdiskussionen där denna funktion debatterades gällde justerbara hantlar av märket PowerBlocks (vilka är kända för sina högst irreguljära viktintervall), är den underliggande logiken direkt applicerbar på kabelmaskiner. Ofta ökar maskinens fysiska block i jämna pund, men klistermärket på maskinen i ett europeiskt gym försöker presentera detta i kilon med märkliga och ojämna decimaler.   

Att erbjuda användaren möjligheten att själv definiera maskinens exakta stack är en funktionell lyx för inbitna "power users". Majoriteten av apparna på marknaden väljer istället den minsta motståndets väg: de tillåter en helt fri inmatning av text eller nummer i viktfältet, och förlitar sig helt på att användaren själv har kognitiv förmåga att läsa av och mata in den siffra som står tryckt på viktmagasinet, utan att applikationens frontend försöker tvinga in siffran i ett validerat virtuellt viktmagasin.

Öppna datamängder för övnings- och utrustningsdata
Att från grunden utveckla en robust träningsapplikation kräver ofta en initial databas av övningar (så kallad seed data) för att undvika att produkten ekar tom vid lansering. Din specifika förfrågan rör tillgången till databaser med fria och permissiva licenser som inkluderar ett dedikerat utrustningsfält (equipment), ur vilket man programmatiskt kan härleda och populera ett rimligt startvärde för viktsteget (till exempel en logik som säger att om fältet innehåller "Dumbbell" ges övningen 1,0 kg som standardsteg, och om det innehåller "Barbell" ges 2,5 kg).

I forskningsunderlaget framträder tre prominenta kandidater, var och en med specifika licensmodeller och strukturer, som väl uppfyller dina arkitektoniska krav.

1. free-exercise-db (skapad av yuhonas)
Denna databas, som hostas öppet på GitHub, framstår som det mest attraktiva valet för kommersiell mjukvaruutveckling på grund av dess extremt permissiva natur.

Källa & Länk: GitHub: yuhonas/free-exercise-db.   

Licens: Repositoriet distribueras under "The Unlicense", vilket i praktiken innebär att databasen befinner sig i Public Domain (det vill säga, den är ekvivalent med CC0) och författaren avsäger sig alla upphovsrättsliga anspråk. Det bör dock noteras att en dispyt i forumdiskussioner har lyft frågor kring upphovsrätten för de tillhörande demonstrationsbilderna (vissa användare misstänker att bilderna har skrapats från tjänsten ExRx, vilket skulle bryta mot deras kommersiella förbud). Trots detta råder det enighet om att själva JSON-datan, övningsbeskrivningarna och databasschemat är fritt att nyttja.   

Innehåll & Struktur: Repositoriet hyser över 800 strukturerade övningar formaterade i ren JSON.   

Utrustningsfält: Databasens schema (schema.json) innehåller bekräftat ett specifikt fält för equipment (med fördefinierade strängvärden som "barbell", "dumbbell", "body weight", "cable").   

Strategisk applicering: Denna databas erbjuder utmärkt potential. Som utvecklare kan du enkelt extrahera arrayen av JSON-objekt och applicera en funktion som itererar över datauppsättningen och automatiskt mappar attributet equipment: "dumbbell" till din interna variabel increment: 1.0, och equipment: "barbell" till increment: 2.5 innan du bygger din initiala state för PWA:n.

2. wger (Workout Manager REST API)
Ett massivt och väletablerat open source-projekt som ofta används som backend för träningsprojekt.

Källa & Länk: wger.de / GitHub: wger-project/wger.   

Licens: Det är här av yttersta vikt att skilja på koden och datan. Applikationens backend-kod är licensierad under den virala och stränga licensen AGPL-3.0 (Affero General Public License). Men den initiala övningsdatan (texter och variabler) är licensierad under Creative Commons Attribution Share-Alike 3.0 (CC-BY-SA 3.0). Detta innebär att du är fri att använda datan i din egen app, men du måste ge lämpligt erkännande (attribution) och eventuella ändringar av datan måste distribueras under samma licens.   

Innehåll & Struktur: Innehåller omkring 845 unika övningar, och en stor fördel är att databasen stödjer ett 30-tal olika språk, vilket möjliggör lokaliserade applikationer från start.   

Utrustningsfält: API:et är högstrukturerat och returnerar databasnormaliserade equipment-ID:n som enkelt kan parsas och filtreras.   

3. exercises-dataset (skapad av hasaneyldrm)
Ett mindre och mer kurerat repositorium riktat mot utvecklare och forskare.

Källa & Länk: GitHub: hasaneyldrm/exercises-dataset.   

Licens: Licensierad under den kommersiellt mycket vänliga MIT-licensen.   

Innehåll & Struktur: Innehåller strukturerad data som täcker muskelgrupper, rörelsekategorier och utrustning.

Utrustningsfält: Exemplen i dokumentationen visar tydligt att systemet nyttjar attribut som Equipment: Barbell och Equipment: Dumbbell.   

Av dessa tre alternativ är free-exercise-db (förutsatt att du skippar bildmaterialet för att undvika legal friktion) det mest pragmatiska valet för att extrahera utrustningskategorier i syfte att bygga ett standard-increment per övning i en offline-first PWA, eftersom Public Domain-statusen helt tar bort kraven på licenserkännande i din app.

Hantering av enhetskonvertering (Metriskt mot Imperiellt)
I den internationella sfären för fysisk träning är hanteringen av enheter ett av de mest problematiska och frustrerande områdena inom app-design. Att konvertera matematisk data mellan kilogram (metriskt) och pund (imperiellt) genererar sällan jämna och logiska siffror, eftersom omvandlingsfaktorn är komplex (1 kg = 2,20462 lb). Resultatet av direkta matematiska konverteringar är att siffrorna, när de presenteras för användaren, sällan går att applicera på riktig gymutrustning, vilket resulterar i "fula" och oanvändbara värden (exempelvis att en standardökning på 2,5 kg transformeras till det obrukbara värdet 5,51 lb).

Hur undviker då de marknadsledande applikationerna denna visuela och praktiska katastrof? Datamängden påvisar existensen av två dominerande, och fundamentalt olika, strategier: Hård avrundning till utrustningsrutnät och Isolering per övning (Hybridläge).

Strategi 1: Hård, destruktiv avrundning till användbar vikt (Strong)
Applikationen Strong angriper problemet genom en extremt normativ och strukturell intervention i databasen. När en användare i appens inställningar väljer att byta den globala enheten från kilon till pund, genomförs inte enbart en ytlig och matematisk presentationskonvertering på skärmen. Istället exekveras en algoritmiskt tvingad avrundning till utrustningens fysiska verklighet, vilket permanent förändrar siffrorna.
Mjukvaran konverterar medvetet och konsekvent alla historiska och framtida vikter till "värden som du faktiskt kan lasta på stången med din utrustning".   

Detta beteende förklaras i detalj via ett explicit exempel från Strongs egen officiella dokumentation:
Låt oss anta att en övningsvikt i användarens logg är registrerad som 60 kg. En exakt matematisk konvertering ger värdet 132,28 lb. Men, när användaren ändrar enhet från kg till lb, ignorerar Strong den exakta matematiken och konverterar istället 60 kg till 130 lb. Den logiska orsaken till detta är rent pragmatisk: 130 lb är en vikt som enkelt och felfritt kan konstrueras och lyftas med standardutrustning i ett imperialt gym (en 45 lb stång, plus en 35 lb-kombination i form av 25+10 eller 35-skivor per sida), till skillnad från 132,28 lb som är en fysisk omöjlighet.
Den oundvikliga konsekvensen av denna logik är att appen rutinmässigt och konsekvent rundar nedåt till närmaste användbara vikt. Strong försvarar detta destruktiva (ur datasynpunkt) UX-beslut genom att argumentera för att progressiv överbelastning är en långsiktig process. De hävdar att det för användaren är acceptabelt att tvingas upprepa samma teoretiska vikt en gång i samband med ett enhetsbyte, om detta innebär att den totala databasens integritet skyddas från meningslösa decimaler och ohanterliga siffror. Denna aggressiva avrundningsmekanism appliceras systematiskt över hela applikationen, och förvandlar även den virtuella olympiska skivstången och de minsta viktskivorna till sina närmaste praktiska motsvarigheter (till exempel tvingas en 2,5 kg-skiva i appens kalkylator att mutera och antas representera en 5 lb-skiva, trots felmarginalen).   

Strategi 2: Isolering per övning och Hybridläge (Hevy & FitNotes)
Den andra marknadsdominanta strategin väljer att helt kringgå det smärtsamma konverteringsproblemet genom att tillåta och omfamna hybrida träningsmiljöer. Denna ansats är särskilt kritisk i Europa, där det är en norm att kommersiella gym är utrustade med fria vikter formgjutna i kilogram, medan kabelmaskiner och maskinparker, vilka ofta importeras från nordamerikanska tillverkare (som Life Fitness eller Cybex), uteslutande är märkta i pund. Att tvinga en användare i en sådan miljö att välja en global enhet skapar oundvikligen friktion.   

Hevy och FitNotes hanterar detta genom att kapsla in enhetsvalet på per-set eller per-övningsnivå.
I Hevy tillåts enheterna att mixas fritt under passets gång. Användaren har friheten att logga Knäböj med stång i KG, och tre minuter senare logga maskinbröstpress i LBS i exakt samma träningspass. Detta möjliggörs ur ett gränssnittsperspektiv genom en diskret men tillgänglig "Unit toggle"-knapp placerad direkt ovanför namnet på övningen i det aktiva passets vy. Genom denna lösning behöver den underliggande databasens rådata aldrig någonsin konverteras globalt; den förblir i sitt ursprungliga tillstånd och speglar exakt det fysiska objekt användaren interagerade med.
FitNotes erbjuder exakt samma tekniska arkitektur och marknadsför den funktionen explicit som möjligheten att "Mix pounds (lbs) and Metric (kg) weights, or a combination of both". Det ska noteras att även Strong på senare tid har implementerat stöd för denna typ av hybridinmatning, men FitNotes och Hevy är mer explicita och integrerade i sitt UX-flöde gällande smidigheten att låta rådatan existera orörd i den enhet den de facto lyftes.   

Slutsatser och Strategiska Rekommendationer för Systemarkitektur
Baserat på den omfattande och djupgående analysen av hur marknadens ledande aktörer hanterar logistiken kring viktsteg, avrundningsalgoritmer och UX, kan följande strategiska rekommendationer fastställas för arkitekturen och databasdesignen av en modern, offline-first PWA-träningslogg:

1. Strikt separation mellan lagrad rådata och presentationsdata
Beräkningar, såsom det glidande snittet av de tre senaste träningspassen för en övning, måste exekveras och lagras i applikationens backend eller lokala state management som ett oförvanskat flyttalsvärde (float) med full matematisk precision (till exempel 9,166 kg). Denna separation säkerställer att inga dataförluster sker över tid och garanterar matematisk validitet när användaren samlar data över flera år.

2. Databasdriven konfiguration av increment-fält
Varje övningsobjekt i din databas måste utrustas med en egenskap för increment. Genom att integrera en öppen databas (exempelvis den permissiva JSON-filen från free-exercise-db) kan systemet iterera över datamängden vid initialisering (seeding). All utrustning som identifieras som dumbbell tilldelas per automatik increment: 1.0 (eller 2,5 beroende på din målgrupp). Övningar identifierade med barbell tilldelas increment: 2.5. Detta minimerar initial administration för slutanvändaren.

3. Dynamisk presentationslogik för gränssnittets referensvärden
När UI-komponenten i PWA:n ska rendera det lilla gråa referensvärdet under själva inmatningsfältet, måste en dedikerad avrundningsfunktion anropas. Funktionen tar det exakta flyttalet (9,166 kg) och tvingar en avrundning (snapping) till den specifika övningens increment-värde innan rendering sker. Om increment är 1,0 (hantelcurl), visar skärmen omedelbart "9 kg". Detta åtgärdar exakt det UX-problem du beskriver i din ursprungliga kravställning, och emulerar de professionella lösningar som ses i FitNotes ("Round To Closest") och Hevy ("Plate Rounding").

4. Avstå från att "snappa" enbart till historiska datapunkter
Ett designmönster där appen begränsar framtida viktförslag genom att endast snappa till vikter som historiskt har loggats av användaren måste förkastas. Träningsapplikationer har ett pedagogiskt och biomekaniskt ansvar att facilitera och uppmuntra progressiv överbelastning. Att binda maskinella beräkningar och förslag enbart till det förflutnas historiska begränsningar saboterar systemets övergripande syfte att vägleda användaren mot nya fysiologiska anpassningar och personbästan.

5. Designa för användaröverstyrning och autonomi
Även om systemet är förkonfigurerat för maximal friktionsfrihet, måste en väg för manuell korrigering finnas. Användargränssnittet bör innehålla en tydlig vy (t.ex. "Redigera övning") där individen när som helst kan överstyra och manuellt modifiera increment-variabeln. Om en användare med ett seriöst hemmagym har investerat i asymmetriska hantlar eller mikroviktsplattor, måste de ges autonomin att ändra sitt increment från standardvärdet 2,5 kg till 1,0 kg, eller från 5 lb till 1 lb. Denna arkitektur, inspirerad av FitNotes och Strong, garanterar att systemet förblir skalbart, relevant och tillförlitligt för tränande individer på alla nivåer, oberoende av vilken hårdvara de fysiskt har tillgång till.


support.stronglifts.com
Progression Settings: Increments, Deload, Frequency - Stronglifts
Öppnas i ett nytt fönster

support.stronglifts.com
Stronglifts Plate Calculator + Setting Your Plates
Öppnas i ett nytt fönster

help.strongapp.io
About Plate Calculator - Strong Help Center
Öppnas i ett nytt fönster

reddit.com
Strong App users, can you only increment the weight by 1KG. In
Öppnas i ett nytt fönster

reddit.com
Review of the New Strong App Update After Months of Use - Reddit
Öppnas i ett nytt fönster

fitnotesapp.com
Workout Tracking - FitNotes
Öppnas i ett nytt fönster

fitnotesapp.com
Workout Tools - FitNotes
Öppnas i ett nytt fönster

help.hevyapp.com
Workout Settings Preferences: Timer/ Warm up calculator
Öppnas i ett nytt fönster

hevyapp.com
How to Use Our Warm-up Sets Calculator - Hevy app
Öppnas i ett nytt fönster

help.hevyapp.com
How to Use the Warm Up Calculator for Percentage-Based Warm
Öppnas i ett nytt fönster

hevyapp.com
Explore 12 Workout Settings for Better Training - Hevy App
Öppnas i ett nytt fönster

reddit.com
Mixed db/kg and specific weights : r/alphaprogression - Reddit
Öppnas i ett nytt fönster

reddit.com
Overall impressions of the app : r/alphaprogression - Reddit
Öppnas i ett nytt fönster

reddit.com
Workout App with Progressive Overload? : r/naturalbodybuilding
Öppnas i ett nytt fönster

reddit.com
Alpha Progression Gym Workouts - Reddit
Öppnas i ett nytt fönster

reddit.com
Progression for the workout app : r/MacroFactor - Reddit
Öppnas i ett nytt fönster

play.google.com
JEFIT-Gym Workout Tracker – Apps on Google Play
Öppnas i ett nytt fönster

jefit.com
My Custom Routine - JEFIT
Öppnas i ett nytt fönster

reddit.com
MacroFactor Workouts: Coming Jan. 2026 - Reddit
Öppnas i ett nytt fönster

apps.apple.com
Macro Me: AI Calorie Tracker - App Store - Apple
Öppnas i ett nytt fönster

reddit.com
Analysing progress on a bulk : r/MacroFactor - Reddit
Öppnas i ett nytt fönster

gympsycho.com
GymPsycho vs Strong App — Comparison 2026
Öppnas i ett nytt fönster

medium.com
Exponential Weighted Moving Average (EWMA) in Deep Learning
Öppnas i ett nytt fönster

reddit.com
Algorithm: MacroFactor vs. Google Sheets - Reddit
Öppnas i ett nytt fönster

reddit.com
Weight trend in MacroFactor seems to track too far off actual weight
Öppnas i ett nytt fönster

reddit.com
Release 4.0.0: Customizable Dashboard, Step Tracking, and More
Öppnas i ett nytt fönster

hevyapp.com
Previous Workout Values to Monitor Your Training - Hevy App
Öppnas i ett nytt fönster

jefit.com
Best Progressive Overload Apps For Strength Training - JEFIT
Öppnas i ett nytt fönster

escapefitness.com
Stack Cable Column - Octagon Frame Range - Escape Fitness
Öppnas i ett nytt fönster

nohrd.com
NOHRD Walls - Exercise Walls
Öppnas i ett nytt fönster

github.com
GitHub - yuhonas/free-exercise-db
Öppnas i ett nytt fönster

github.com
images has copyright? · Issue #13 · yuhonas/free-exercise-db - GitHub
Öppnas i ett nytt fönster

github.com
xze3n/ExerciseGifDownloader: Script for scraping an Open ... - GitHub
Öppnas i ett nytt fönster

apify.com
wger Exercise Database Scraper - Fitness Data API - Apify
Öppnas i ett nytt fönster

github.com
GitHub - wger-project/wger: Self hosted FLOSS fitness/workout
Öppnas i ett nytt fönster

wger.readthedocs.io
Welcome to the wger 2.6 documentation — wger project 2.6 alpha
Öppnas i ett nytt fönster

wger.readthedocs.io
wger Workout Manager 2.0 alpha documentation
Öppnas i ett nytt fönster

apify.com
Wger Exercise Database Scraper - Apify
Öppnas i ett nytt fönster

public-api.org
Wger API - Documentation, Review & Integration Guide
Öppnas i ett nytt fönster

github.com
hasaneyldrm/exercises-dataset - GitHub
Öppnas i ett nytt fönster

support.stronglifts.com
How to Set Your Weight Unit - Stronglifts
Öppnas i ett nytt fönster

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store
Öppnas i ett nytt fönster

hevyapp.com
How to change units per-exercise? - Hevy App
Öppnas i ett nytt fönster

reddit.com
Does this or any app let you switch from pounds to kg in real time?
Öppnas i ett nytt fönster

apps.apple.com
Appen FitNotes 2 - Gym Workout Log - App Store
Öppnas i ett nytt fönster

apps.apple.com
FitNotes 2 - Gym Workout Log - App Store - Apple
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster
Öppnas i ett nytt fönster

Tankar från gemini:
Strukturerar efterforskningen
Jag påbörjar nu en systematisk kartläggning av hur etablerade träningsappar hanterar viktsteg, avrundning av beräknade värden samt anpassningar för olika utrustningstyper. Planen är att undersöka dokumentation, ändringsloggar och användarforum för apparna Strong, Hevy, MacroFactor, JEFIT, Boostcamp, Progression och FitNotes.
Identifiering av viktiga problemområden
Analysen fokuserar på kärnfrågan kring hur härledda siffror som snittvärden och beräknade arbetsvikter avrundas i gränssnittet, samt om det finns mekanismer för att snappa mot historiskt loggade vikter. Vidare undersöks hantering av anpassade kabelstackar, enhetskonvertering och tillgången till öppna övningsdatabaser med utrustningsattribut.
Inledning av informationsinsamling
Jag startar sökningar riktade mot officiella supportsidor och forumtrådar för att samla in konkreta data om standardsteg för plus- och minusknappar samt inställningsmöjligheter per apparat och utrustningstyp.


support.stronglifts.com
Stronglifts Plate Calculator + Setting Your Plates

help.strongapp.io
About Plate Calculator - Strong Help Center

support.stronglifts.com
Progression Settings: Increments, Deload, Frequency - Stronglifts

youtube.com
Strong Workout App | How to use Warmup & Plate Calculators?

help.strongapp.io
About Warm-up Calculator - Strong Help Center

play.google.com
Strong Workout Tracker Gym Log - Apps on Google Play

reddit.com
Can I customize weight plate settings? : r/strongapp - Reddit

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store

hindustantimes.com
‘Stop messing around with diets, programs, and supplements’: Fitness coach shares 6 habits to lose weight effectively

hindustantimes.com
Eating well but still struggling to gain weight? Doctor reveals when persistent low body weight signals underlying issue

reddit.com
6.0 auto populates lbs and reps : r/strongapp - Reddit

hevyapp.com
How to Use the Built-in Weight Plate Calculator - Hevy App

hevyapp.com
Workout Set Types: Definition, Purpose, and Use - Hevy App

fitnotesapp.com
Settings - FitNotes
Analyserar grundläggande viktsteg och plattkalkylatorer
Jag har påbörjat kartläggningen av hur etablerade appar hanterar viktsteg och beräkningar. Genomgången visar att appar som Strong och Stronglifts primärt förlitar sig på fasta standardsteg i kombination med anpassningsbara plattkalkylatorer. Hos vissa system styrs viktökningen av schemalagda progressioner snarare än automatiska anpassningar efter utrustningstyp, där 2,5 kg eller 5 lbs är den dominerande standarden för skivstänger.
Strukturerar efterforskningen kring avrundningslogik
För att besvara kärnfrågan kring avrundning av härledda värden (som snittvikter och estimerat 1RM) samt hantering av kabelstackar och enhetskonvertering har jag brutit ned undersökningen i åtta målinriktade delområden. Fokus ligger på att identifiera om appar visar exakta råvärden med decimaler eller om de tvingar beräkningar till användbara rutnät.
Nästa steg i informationsinsamlingen
Jag går nu vidare med riktade sökningar efter officiell dokumentation, supportartiklar och forumtrådar för MacroFactor, Hevy, FitNotes, JEFIT, Boostcamp och Progression. Målet är att fastställa exakt hur MacroFactor presenterar sina trendkurvor, om det finns öppna övningsdatabaser med utrustningsfält, samt om någon app avrundar förslag baserat på användarens historiskt loggade vikter.


hevyapp.com
Warm Up Sets Explained: Best Strategies for Lifters - Hevy App

hevyapp.com
How to Use Hevy: Log Workouts, Track Progress & Socialize

hevyapp.com
Upper Body Workouts for Beginner (+3 and 4-Day Splits) - Hevy app

hevyapp.com
How Many Sets Per Muscle Group For Optimal Growth? - Hevy App

hevyapp.com
21 Pull Up Variations: Beginner, Intermediate & Advanced Options

hindustantimes.com
‘Stop messing around with diets, programs, and supplements’: Fitness coach shares 6 habits to lose weight effectively

hevyapp.com
What Is a Drop Set and When Should You Actually Use One

reddit.com
Question about setting up routines : r/Hevy - Reddit

youtube.com
How To Use Hevy Workout App | Full Tutorial - YouTube

reddit.com
Setting up the app with different exercise options for the same

apps.apple.com
Macro Me: AI Calorie Tracker - App Store - Apple

reddit.com
Analysing progress on a bulk : r/MacroFactor - Reddit

thebodybuildingdietitians.com
Why Your Tracking App's Calorie and Macro Totals Don't Line Up

reddit.com
Release 4.0.0: Customizable Dashboard, Step Tracking, and More

nutrola.app
Calorie Tracker Comparison Chart 2026 — 10 Apps Compared

apps.apple.com
Appen Tracked: Workout & Nutrition - App Store
Observationer kring viktavrundning och trender
Vid granskning av hur beräknade värden presenteras framgår det att appar som MacroFactor nyttjar utjämnade kurvor för trendvikt där avrundning görs till en decimal för att undvika överdriven precision. Samtidigt visar analysen av träningsappar att uppvärmningskalkylatorer och procentbaserade beräkningar ofta nyttjar fasta regler kring avrundning för att passa standardutrustning, snarare än dynamiska anpassningar per övning.
Klargörande av luckor kring viktsteg
Det råder fortfarande behov av att klarlägga de exakta standardinställningarna för inmatningssteg i kilo och pund för respektive utrustningskategori (skivstång, hantlar, kabelmaskiner). Dessutom undersöks om det finns etablerad praxis att snappa beräknade vikter till användarens faktiska historiska loggar för att lösa avrundningsproblematik på hantlar.
Kommande sökningar och djupdykning
Jag går nu vidare med riktade sökningar efter specifika appinställningar för inmatningssteg i Strong, Hevy, FitNotes, JEFIT, Boostcamp och Progression, samt undersöker licenser för öppna övningsdatabaser på GitHub.


support.stronglifts.com
How to Set Your Weight Unit - Stronglifts

support.stronglifts.com
Stronglifts Plate Calculator + Setting Your Plates

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store

help.fitbod.me
My Plan - Fitbod's Help Center

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store

strive-workout.com
Bench Press Strength Standards by Age and Weight

help.strongapp.io
About Plate Calculator - Strong Help Center

reddit.com
weight per side : r/strongapp - Reddit

trainerroad.com
Strength Training Benchmarks for Cyclists | TrainerRoad Blog

hevyapp.com
Workout Set Types: Definition, Purpose, and Use - Hevy App

hevyapp.com
How to Use Our Warm-up Sets Calculator - Hevy app

hevyapp.com
How to Write Sets and Reps When Building Workouts - Hevy App

hevyapp.com
Hevy Trainer: Adaptive Strength Programming System - Hevy app

hevyapp.com
Previous Workout Values to Monitor Your Training - Hevy App

hevyapp.com
Explore 12 Workout Settings for Better Training - Hevy App

hevyapp.com
How to change units per-exercise? - Hevy App

hevyapp.com
Gym Performance Tracking (Tools, Graphs & Statistics) - Hevy App

getfitnotes.com
Body Tracker | FitNotes iOS Help

fitnotesapp.com
Workout Tools - FitNotes

floopfloop.com
Build a Workout & Strength Tracker with AI (Strong / Hevy Alternative

apps.apple.com
Appen FitNotes 2 - Gym Workout Log - App Store

apps.apple.com
FitNotes 2 - Gym Workout Log - App Store - Apple

reddit.com
MacroFactor Workouts: Coming Jan. 2026 - Reddit

play.google.com
Intensity Legacy - Apps on Google Play

getfitnotes.com
FitNotes iOS

strong-workout-tracker-gym-log-ios.soft112.com
Strong Workout Tracker Gym Log 6.4.3 Free Download

get-strong.app
Your weight goes up automatically - Progression Workout Tracker

help.macrofactorapp.com
Understanding and Using Smart Progressions | MacroFactor

support.stronglifts.com
Progression Settings: Increments, Deload, Frequency - Stronglifts

apps.apple.com
Gym Workout Alpha Progression - App Store - Apple

apps.apple.com
Progression Workout Tracker - App Store

alphaprogression.com
Alpha Progression · Gym Tracker & Workout Planner

setgraph.app
Double Progression: The Smarter Way to Add Reps and Weight

play.google.com
Progression - Gym Workout Log - Apps on Google Play

reddit.com
Progression for the workout app : r/MacroFactor - Reddit

reddit.com
Workout App with Progressive Overload? : r/naturalbodybuilding

jefit.com
My Custom Routine - JEFIT

reddit.com
Second decimal on weight gain/loss range : r/MacroFactor - Reddit
Förjupning i appspecifika inställningar för viktsteg
Jag har kartlagt hur viktsteg hanteras i gränssnitten hos Hevy och Strong. I Hevy finns en dedikerad uppvärmningskalkylator där avrundningssteg för både skivstänger och hantlar kan konfigureras separat i inställningarna (exempelvis 2,5 kg för hantlar). Strong och Stronglifts använder istället globala eller övningsspecifika progressionsinställningar där viktökningar ställs in i fasta steg, och stöder även konfiguration för att räkna hantelvikter dubbelt eller per sida.
Klargörande av enhetskonvertering och plattavrundning
För att lösa problematiken med fula omräkningar vid byte mellan kilogram och pounds visar dokumentationen att system som Stronglifts avrundar konverterade värden till närmaste användbara vikt (exempelvis avrundas 60 kg till 130 lb istället för det exakta värdet 132,28 lb). Detta förhindrar udda decimaler på skärmen och anpassar vikten till tillgängliga skivstångsplattor.
Nästa sökningar i efterforskningen
Jag går nu vidare med riktade undersökningar för att hitta exakta uppgifter om hur FitNotes, Progression, JEFIT och Boostcamp hanterar inmatningssteg och beräknade 1RM-värden. Samtidigt undersöker jag MacroFactors exakta presentation av trenddecimaler samt söker efter öppna övningsdatabaser med MIT- eller CC0-licens på GitHub.
Funktionsöversikt för plattkalkylatorer och progression
Analysen visar att verktyg som FitNotes använder anpassningsbara plattkalkylatorer med standardiserade uppsättningar av viktskivor (t.ex. 0.25 kg upp till 50 kg respektive 0.25 lbs till 100 lbs), där beräknade procentvärden kan avrundas till valbara steg som 2.5 eller 5.0. Appar som Progression tillåter specifika progressionssteg per övning, medan MacroFactor Workouts kombinerar smart progression med mål för reps och RIR per set.
Precisionsskillnader i inmatning och visualisering
Klargörandet visar en tydlig uppdelning mellan hur appar hanterar inmatningssteg och beräknade trender. Medan inmatningsfälten styrs av antingen globala eller övningsspecifika steg, nyttjar trendberäkningar som MacroFactors kroppsviktkurva en avrundning till en decimal i sitt gränssnitt för att ge en jämn presentation utan överdriven precision.
Vidare undersökningar av appinställningar
Jag går nu vidare med att söka efter specifika detaljer kring standardvärden för plus/minus-knappar i Strong, Hevy, Boostcamp och JEFIT. Fokus ligger på att undersöka var inställningarna placerats i respektive gränssnitt samt hur kabelstackar och enhetskonvertering hanteras tekniskt.


agehasnolimits.com
Dumbbell Workout for Women Over 50: Strength at Home

jefit.com
Best Progressive Overload Apps For Strength Training - JEFIT

reddit.com
How do you know how much weight to lift or in other words, track

medium.com
Two Day At-Home Minimal Equipment or Bodyweight Split for Women

youtube.com
How To Change Reset Timer Increment On The Strong App - YouTube

reddit.com
Strong App users, can you only increment the weight by 1KG. In

reddit.com
Does anyone else hate doing "Gym Math" mid-workout? - Reddit

jotform.com
The 5 best apps for workout tracking in 2026 | Jotform Blog

hevyapp.com
How to Use Our Warm-up Sets Calculator - Hevy app

help.hevyapp.com
How to Use the Warm Up Calculator for Percentage-Based Warm

help.hevyapp.com
Workout Settings Preferences: Timer/ Warm up calculator

hevyapp.com
Explore 12 Workout Settings for Better Training - Hevy App

reddit.com
Periodize update since April + what's coming next : r/Hevy - Reddit

apps.apple.com
VOROM - Gym Workout Tracker - App Store - Apple

reddit.com
What's your favorite feature of Hevy? - Reddit

reddit.com
Weight increment setting on Apple Watch : r/Hevy - Reddit
Fördjupad kartläggning av viktsteg och inställningar
Analysen visar att appar som Strong och Hevy nyttjar fasta standardsteg på 2,5 kg / 5 lbs för skivstänger i sina grundinställningar, men erbjuder anpassningsbar avrundning för uppvärmning och plattberäkning. I Hevy hittas dessa preferenser under inställningarna för uppvärmningskalkylatorn, där separata avrundningsregler kan definieras för både skivstänger och hantlar.
Identifikation av återstående databehov för specifika appar
Det återstår att klarlägga de exakta inmatningsstegen för knappkontroller och standardvärden per utrustningstyp i FitNotes, Progression, JEFIT och Boostcamp. Särskilt behöver inställningarnas placering i gränssnittet samt huruvida steglängden ändras dynamiskt beroende på om övningen använder hantlar, kabelmaskin eller skivstång dokumenteras i detalj.
Kommande sökningar och granskning
Jag går nu vidare med riktade sökningar i användarmanualer och forumtrådar för FitNotes, Progression, JEFIT och Boostcamp gällande deras specifikationssteg för plus- och minusknappar. Samtidigt påbörjas undersökningen av öppna övningsdatabaser på GitHub samt kartläggning av hur beräknade värden som 1RM och trendvikter avrundas i gränssnitten.


support.stronglifts.com
Progression Settings: Increments, Deload, Frequency - Stronglifts

help.strongapp.io
About Plate Calculator - Strong Help Center

reddit.com
weight per side : r/strongapp - Reddit

reddit.com
Review of the New Strong App Update After Months of Use - Reddit

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store

help.strongapp.io
Perform a Workout with Strong for Apple Watch (Overview)

hindustantimes.com
‘Stop messing around with diets, programs, and supplements’: Fitness coach shares 6 habits to lose weight effectively

apps.apple.com
Appen Strong Workout Tracker Gym Log - App Store

youtube.com
How to Use the Strong Workout App (EP22 - YouTube

reddit.com
Does this or any app let you switch from pounds to kg in real time?

reddit.com
How do you change default barbell? : r/strongapp - Reddit

hevyapp.com
How to Use Our Warm-up Sets Calculator - Hevy app

hevyapp.com
Explore the Exercise Programming Options - Hevy App

hevyapp.com
How to Write Sets and Reps When Building Workouts - Hevy App

help.hevyapp.com
How to Use the Warm Up Calculator for Percentage-Based Warm

hevyapp.com
How to Log & Track Workouts Easier and Faster - Hevy App

hevycoach.com
The Ultimate Workout Builder - Hevy Coach

help.hevyapp.com
Build a Workout Program: Create & Organize Routines

hevyapp.com
How to Use Hevy: Log Workouts, Track Progress & Socialize

reddit.com
On weight for dumbbell workouts, do you use total weight or ... - Reddit

jefit.com
Master Your Strength Training Volume - JEFIT

jefit.com
A Simple Guide to Progressive Overload Training (With Examples)

jefit.com
Workout Routines for the Gym – Your Guide to Smart Training - JEFIT
Avrundning av beräknade värden kontra råvärden
Jag ser en klar uppdelning i hur appar hanterar beräknade siffror. När det gäller teoretiska mätvärden som uppskattat 1RM visar de flesta appar (som Strong och Hevy) exakta råvärden med decimaler. När det däremot handlar om rekommenderade arbetsvikter eller uppvärmningsset tvingas beräkningarna nästan alltid till ett praktiskt rutnät (t.ex. närmaste 2,5 kg eller 5 lbs) via kalkylatorinställningar. MacroFactor skiljer sig genom att visa trendvikten för kroppsvikt med 1 decimal utan att avrunda till några fysiska skivstångssteg, eftersom det är ett glidande medelvärde.
Historisk avrundning och anpassade kabelstackar
Ett intressant spår jag utforskar är om det finns appar som avrundar förslag till vikter användaren faktiskt loggat tidigare för samma övning, snarare än till ett teoretiskt rutnät. Det verkar saknas som standardfunktion i större appar, troligen på grund av komplexiteten när en användare byter gym eller utrustning. När det gäller kabelmaskiner förlitar sig de flesta appar på fasta standardsteg eller generella uppvärmningsinställningar, vilket skapar utmaningar för maskiner med udda viktsteg.
Kommande djupdykning i öppna data och licenser
Jag undersöker nu öppna övningsdatabaser på kodplattformar som GitHub (exempelvis free-exercise-db och wger) för att se hur utrustningsfält är strukturerade och vilka licenser (MIT, CC0 eller AGPL) de använder. Samtidigt gör jag riktade sökningar på hur apputvecklare hanterar enhetskonvertering för att undvika fula omräkningsdecimaler vid växling mellan kilogram och pund.


github.com
xze3n/ExerciseGifDownloader: Script for scraping an Open ... - GitHub

github.com
GitHub - yuhonas/free-exercise-db

github.com
arhxam/free-exercise-db-with-videos: Free open-source ... - GitHub

github.com
hasaneyldrm/exercises-dataset - GitHub

github.com
gregqualls/exerfily: A full-stack web application for building ... - GitHub

github.com
wrkout/exercises.json - GitHub

github.com
Snouzy/workout-cool: Modern open-source fitness ... - GitHub

github.com
NgoQuocBao1010/Exercise-Correction: Make use of the ... - GitHub

github.com
Dieterbe/awesome-health-fitness-oss: overview of ... - GitHub

reddit.com
I built a self-hosted, open-source gym tracker — is this useful to

apps.apple.com
AI Workout Tracker - Liftr - App Store - Apple

play.google.com
JEFIT-Gym Workout Tracker – Apps on Google Play
Nya fynd kring öppna databaser och historisk avrundning
Jag har identifierat flera öppna övningsdatabaser under Public Domain (Unlicense) och MIT-licenser på GitHub, däribland yuhonas/free-exercise-db och wrkout/exercises.json. Dessa innehåller över 800 till 1300 övningar med explikata utrustningsfält som skivstång, hantel, kabel och kroppsvikt. Vidare visar ändringsloggar för appar som JEFIT att de har börjat introducera funktioner där förutsagda vikter snappar till utrustningssteg för att underlätta loggning, även om praxisen att avrunda helt mot användarens egna historiska loggar förblir ovanlig.
Upplösning av motstridiga avrundningsprinciper
Analysen klargör en fundamental åtskillnad i hur appar hanterar beräknade siffror. Rent analytiska mätvärden (som teoretiskt 1RM eller session volym) presenteras nästan alltid som exakta råvärden med en eller två decimaler utan avrundning. Preskriberade vikter och progressionsförslag (såsom uppvärmningsset eller 5/3/1-program) tvingas däremot genom ett avrundningsfilter som anpassats till tillgängliga viktskivor eller fasta rutnät.
Fördjupning i specifik app-dokumentation och konverteringslogik
Jag fortsätter nu efterforskningarna genom att granska officiell dokumentation och supportartiklar för MacroFactor, Stronglifts och Alpha Progression. Målet är att fastställa de exakta mekanismerna för hur enhetskonverteringar mellan kilogram och pund avrundas utan att ge fula decimaler, samt dokumentera hur anpassade kabelstackar och viktsteg ställs in i specialiserade appar.


support.stronglifts.com
How to Set Your Weight Unit - Stronglifts

fitnotesapp.com
Workout Tools - FitNotes

fitnotesapp.com
Workout Tracking - FitNotes

fitnotesapp.com
Help Overview - FitNotes

apps.apple.com
Appen GymPsycho: Workout Log Tracker - App Store

reddit.com
Spicy! : r/MacroFactor - Reddit

reddit.com
Overall impressions of the app : r/alphaprogression - Reddit

reddit.com
Mixed db/kg and specific weights : r/alphaprogression - Reddit

alphaprogression.com
The key to success: Why documenting your training progression is

gympsycho.com
GymPsycho vs Strong App — Comparison 2026

alphaprogression.com
Periodize your training - train effectively over the long term
Avrundningsstrategier och enhetskonvertering
Genomgången av dokumentationen för Stronglifts visar en specifik strategi för enhetskonvertering mellan kilogram och pounds. När en användare byter enhet räknar systemet inte bara om värdet med en matematisk faktor, utan avrundar direkt nedåt till närmaste viktnivå som faktiskt går att lägga på stången med standardplattor (exempelvis konverteras 60 kg till 130 lb istället för det matematiskt exakta 132,28 lb). Detta förhindrar udda decimaler i användargränssnittet och säkerställer att användaren kan lasta stången med tillgänglig utrustning.
Konfiguration av oregelbundna viktsteg
Kartläggningen av mer specialiserade appar som Alpha Progression visar att vissa system tillåter mycket detaljerade inställningar för utrustningssteg under övnings- eller träningsinställningar. Utvecklarna tillåter användare att definiera anpassade intervall för specifika utrustningstyper (t.ex. ställbara hantlar med oregelbundna sekvenser), vilket eliminerar behovet av kontinuerliga manuella uträkningar. Samtidigt har verktyg som FitNotes anpassningsbara skivkalkylatorer där beräknade procentvärden kan tvingas till valfria avrundningssteg.
Fördjupad analys av algoritmer och databaser
Jag går nu vidare med riktade undersökningar för att analyserar den matematiska modellen bakom MacroFactors trendutjämning (exponentiellt viktade glidande medelvärden) samt för att granska licensvillkor och datastrukturer i öppna övningsdatabaser på GitHub. Samtidigt undersöks hanteringen av kabelstackar med udda viktsteg i ytterligare träningsapplikationer.


medium.com
Exponential Weighted Moving Average (EWMA) in Deep Learning

reddit.com
Algorithm: MacroFactor vs. Google Sheets - Reddit

emerald.com
risk in agricultural lending, the effects of commodity price volatility

soderbergpartners.se
Artificial neural networks for financial time series prediction and

macrosynergy.com
Macro scorecards for local-currency EM bonds - Macrosynergy

reddit.com
Weight trend in MacroFactor seems to track too far off actual weight

arxiv.org
Time Series Foundation Models for Multivariate Financial ... - arXiv

researchgate.net
(PDF) Time Series Foundation Models for Multivariate Financial

reddit.com
Some questions about the MF strategy and check in : r/MacroFactor

theses.gla.ac.uk
Essays on the Term Structure of Interest Rates - University of Glasgow

escapefitness.com
Stack Cable Column - Octagon Frame Range - Escape Fitness

nohrd.com
NOHRD Walls - Exercise Walls
Matematiken bakom MacroFactors trendberäkning
Genom att fördjupa mig i tekniska analyser av MacroFactor har jag kartlagt att deras vikt-trend använder en exponentiellt viktad glidande medelvärdesalgoritm (EWMA) med ett fönster baserat primärt på de senaste 21 dagarna. Denna metodik fokuserar på att filtrera bort dagliga vätskerelaterade viktfluktuationer. Siffran visas konsekvent med en decimal i gränssnittet utan att avrundas till fysiska rutnät, eftersom syftet är att beräkna energiförbrukning snarare än att spegla fysiska viktskivor.
Struktur i öppna övningsdatabaser
Jag har granskat datastrukturen i öppna repositories på GitHub (såsom free-exercise-db och exercises.json) samt wger:s API. Dessa datamängder källsorterar övningar med explicita utrustningskategorier såsom skivstång, hantlar, kabel, maskin och kroppsvikt under öppna licenser (MIT och Unlicense). Detta bekräftar att branschpraxis för utrustningsbaserad logik ofta bygger på att kategorisera övningen via dessa fasta fält för att styra standardsteg.
Fortsatt kartläggning av specifik utrustningskonfiguration
Jag går nu vidare med riktade undersökningar av hur mer avancerade appar, till exempel Alpha Progression och specialiserade verktyg, hanterar anpassningsbara viktsteg för udda kabelstackar samt detaljerna kring hur enhetskonvertering genomförs utan decimalfel i användargränssnittet.


github.com
anexinwilson/fit-spark: Next.js AI SaaS workout platform ... - GitHub

github.com
GitHub - yuhonas/free-exercise-db

reddit.com
Open Public Domain Exercise Dataset in JSON format, over 800+

converter.brightcoding.dev
Stop Paying for Exercise APIs! Use free-exercise-db Instead

reddit.com
Open Public Domain Exercise Dataset in JSON format, over 800+

github.com
Issue #9 · yuhonas/free-exercise-db - Translations - GitHub

reddit.com
a real exercise API + MCP for vibe-coded workout apps : r/vibecoding

reddit.com
Öppen Public Domain träningsdataset i JSON-format, över ... - Reddit

github.com
images has copyright? · Issue #13 · yuhonas/free-exercise-db - GitHub

news.ycombinator.com
Show HN: Workout.cool – Open-source fitness coaching platform

ai-calorie-tracker.com
MacroFactor Review 2026: Best for Bulk and Cut Cycles

dwght.com
MacroFactor - Data Driven and Mentally Freeing | DWGHT

reddit.com
Weight trend in MacroFactor seems to track too far off actual weight

ftp.pluspetrol.net
MUSCLE GAIN SETUP GUIDE ROADMAP - ftp.pluspetrol.net

reddit.com
I really don't get the trend weight. If it's an average shouldn't the

getkinra.app
How Kinra learns your metabolism

apps.apple.com
Appen Tracked: Workout & Nutrition - App Store

reddit.com
MacroFactor vs HappyScale weight trend comparison anyone?

witsandweights.com
Ep 78: Stress-Free Macro Tracking, Nerding Out on Metabolism, and

reddit.com
What is the formula behind the pink trend weight line? Is it ... - Reddit

reddit.com
Alpha Progression Gym Workouts - Reddit

apps.apple.com
Gym Workout Alpha Progression - App Store - Apple
Algoritmer för trendutjämning i MacroFactor
Genomgången av MacroFactors beräknandemodell visar att deras trendvikt för kroppsvikt bygger på ett tidsmedvetet exponentiellt glidande medelvärde (EMA). Systemet fyller först i saknade mätpunkter (så kallad interpolated weight) innan utjämningen tillämpas. I gränssnittet visas resultatet alltid med exakt en decimal utan avrundning till rutnät eller fysiska skivstångssteg, vilket illustrerar att rent analytiska trender separeras helt från fysiska inmatningskrav.
Struktur och licensiering i öppna övningsdatabaser
Kartläggningen av öppna datamängder bekräftar att projekt som yuhonas/free-exercise-db (licensierad under Public Domain / Unlicense) och wrkout/exercises.json (MIT-licens) tillhandahåller strukturerad JSON-data där varje övning har ett explicit utrustningsattribut (såsom barbell, dumbbell, cable eller bodyweight). Detta fält möjliggör dynamisk härledning av rimliga viktsteg i tredjepartsapplikationer.
Riktade dokumentationssökningar för appspecifik logik
Jag går nu vidare med att granska officiella supportsidor och hjälpartiklar för Hevy, Strong, FitNotes och JEFIT. Målet är att verifiera de exakta menypaceringarna för inställningar av avrundningssteg samt dokumentera hur kalkylatorer för procent och setberäkningar hanterar avrundning till närmaste tillgängliga vikt.


help.hevyapp.com
Workout Settings Preferences: Timer/ Warm up calculator

help.hevyapp.com
How to Use the Warm Up Calculator for Percentage-Based Warm

apify.com
wger Exercise Database Scraper - Fitness Data API - Apify

public-api.org
Wger API - Documentation, Review & Integration Guide

apify.com
Wger Exercise Database Scraper - Apify

wger.readthedocs.io
Welcome to the wger 2.6 documentation — wger project 2.6 alpha

wger.readthedocs.io
wger Workout Manager 2.0 alpha documentation

github.com
GitHub - andela/vulcans-wger: Self hosted FLOSS fitness/workout

pypi.org
wger - PyPI

github.com
GitHub - wger-project/wger: Self hosted FLOSS fitness/workout

workoutxapp.com
Exercise GIF API licensing: what you can actually ship - WorkoutX

opendata.stackexchange.com
Fitness Exercise Database / API - Open Data Stack Exchange

fitnotesapp.com
Workout Tools - FitNotes

getfitnotes.com
Percentages Calculator | FitNotes iOS Help

getfitnotes.com
Workout Sets | FitNotes iOS Help

reddit.com
[Feature Request] Save a Training Max for an exercise/routine - Reddit

fitnotesapp.com
Progress Tracking - FitNotes

fitnotesapp.com
Workout Tracking - FitNotes
Slutsatser kring branschpraxis och historisk avrundning
Syntesen av alla efterforskningar visar en tydlig branschstandard: teoretiska mätvärden som estimerat 1RM redovisas med decimaler utan avrundning, medan preskriberade eller beräknade arbetsvikter avrundas till fysiskt lastbara steg. Att snappa beräknade förslag till enskilda användares historiskt loggade vikter saknas nästan helt som standardfunktion i marknadens appar. Orsakerna bedöms främst vara problem med startdata vid nya övningar, ökad komplexitet vid byte av gymutrustning samt att linjära progressionsmodeller kräver förutsägbara och fasta steg.
Sammanställning av utrustningsdatabaser och inställningslogik
Jag har kartlagt att öppna övningsdatabaser som free-exercise-db och exercises.json på GitHub erbjuder public domain- och MIT-licenser med strukturerade utrustningsfält. Detta möjliggör automatisk härledning av utrustningstyper. Vidare har appar som FitNotes och Progression övningsspecifika viktstegsinställningar, medan appar som Hevy tillåter separata avrundningsregler för skivstänger och hantlar i sina kalkylatorinställningar.
Färdigställande av den samlade rapporten
Med all nödvändig fakta insamlad och verifierad mot alla åtta efterfrågade områden avslutar jag nu efterforskningen. Jag sammanställer den slutgiltiga och detaljerade rapporten på svenska med källhänvisningar och tydlig uppdelning av funktioner bakom betalvägg.
Den första undersökningen har gett mycket information. Jag sorterar och organiserar den. Detta kommer att säkerställa att helheten flyter bra och täcker alla viktiga punkter du bad om.
Nu är det dags! Jag knyter ihop säcken. Skriver ner mina sista tankar, putsar på allt och ser till att jag ger dig mitt allra bästa arbete.
