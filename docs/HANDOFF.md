# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
Fas 0–7 och 9 är klara. **Appen är komplett för verklig användning**: logga, vila, synka,
och nu se historik och personbästa. Kvar: fas 4.13 (trimma parsern), fas 8 (LLM-coachen),
fas 10 (deploy) och fas 11 (designpolering).

---

## 1. Fas 9 — historik och progression

- Passlista med volym, setantal och längd. Pågående pass märks ut.
- Övningsvy på `/ovning/:id` med alla set över tid.
- e1RM enligt Epley som ren funktion.
- PB-kort och en handritad SVG-sparkline.

**Två beslut i matematiken som bär funktionen:**

**e1RM returnerar `null` över 15 reps** i stället för en siffra. Ett estimat räknat på 25
reps ser ut som data men är brus — och brus i en progressionsgraf är värre än en lucka,
eftersom luckan syns och bruset inte gör det. Ett singel returnerar sin egen vikt i stället
för att räknas upp av formeln.

**Tyngsta set och bästa e1RM visas som två skilda rekord.** De är inte samma sak: 90×3 är
tyngre på stången, men 80×8 är den starkare prestationen (e1RM 101,3 mot 99,0). Att slå ihop
dem hade dolt exakt den insikt e1RM finns för att ge.

---

## 2. Två åtaganden som nu står utskrivna

Efter ditt första riktiga pass, inskrivna så att de inte kan glömmas:

**`PLAN.md` §4.0 + uppgift 4.13 — grammatiken måste trimmas.** Parsern klarar `Bänk 90x5`
men inte `80x7 bänk`. Det är inte ett gränsfall utan så folk skriver mitt i ett set, och
varje sådan miss undergräver premissen att fritext ska vara snabbare än att fylla i fält.
Korpusen som ska klaras står i uppgiften, och den byggs testdrivet som resten av fas 4.
Regeln som inte får luckras upp: att stödja omvänd ordning får inte göra `20x30` mindre
tvetydig.

**Fas 8 inleds nu med en ruta som säger att den SKA byggas.** Målet är uttryckligen en
sömlös AI-coach-känsla. Den lokala grammatiken är **golvet** som gör att appen fungerar utan
nät — inte taket. Ny uppgift **8.0**: kontraktet mot `/ai/parse` ska utökas med historik,
för utan den blir fas 8 en andra parser i stället för en coach. Nu när fas 9 är klar finns
inget kvar som motiverar att vänta.

---

## 3. Vilotimern — frågan är AVGJORD

Full analys i `PLAN.md` §2.6.1. Slutsatsen: **notisen når inte fram i bakgrunden** — men
inte av det skäl någon av oss antog.

Mätdata: två larm på 180 s, appen stängd. `wasHidden: ja`, `firedOnResume: nej`, fel +11 s
och +20 s. Adam fick ingen notis förrän han öppnade appen, båda gångerna, medan han aktivt
väntade.

**Vad det betyder:** `wasHidden: ja` med bara 11–20 sekunders fel bevisar att sidans
JavaScript **körde i bakgrunden** — iOS strypte intervallet men frös det inte, och
`showNotification()` anropades och lyckades. Ändå syntes ingen notis. Alltså: iOS **skapade**
notisen men **presenterade** den inte förrän appen kom i förgrunden.

**Mätningen mätte fel sak.** Diagnostiken loggade när vi *anropade* `showNotification()`,
inte när iOS *visade* den. I fas 0-testet med 5 sekunders fördröjning sammanföll de två, så
felet syntes aldrig. `firedOnResume` kunde därför aldrig fånga det verkliga felläget — den
svarade `nej` på en fråga den inte mätte. Det var den mänskliga observationen som avgjorde.

Lärdomen är värd att behålla: **när en mätning och en användares upplevelse säger emot
varandra är det inte självklart att mätningen har rätt.** Kontrollera först att den mäter
det man tror.

**Följd för arkitekturen:** Wake Lock är inte en bekvämlighet utan bärande. Vilan förutsätter
att appen ligger framme med tänd skärm, vilket den gör — låset begärs vid timerstart och
återbegärs vid `visibilitychange`. Web Push byggs inte: den kräver nät i det ögonblick
larmet ska gå, alltså precis vad ett gym saknar. Notisen behålls ändå, eftersom den kommer
fram när man återvänder till appen och skadar ingenting.

---

## 4. Verifierat

- **137 tester gröna.** Typecheck, lint och produktionsbygge likaså.
- Synken mot riktig Supabase: 2 pass, 6 set, 9 kvitton, noll dubbletter, alla set med
  `source = 'local_parse'`.
- Tidigare: offlinestart och loggning på iPhone, databasisolering 11 av 11, katalogens id:n
  mot kontrollsummor, parsern 91,3 % grenäckning.

## 5. INTE verifierat

- **Historikvyerna på riktig enhet.** Byggda och enhetstestade, men inte sedda i Safari.
  Det är det första att titta på nästa gång.
- **Wake Lock på riktig hårdvara.** Nu när den bär larmet är det värt att bekräfta att
  skärmen faktiskt håller sig tänd genom en hel 180-sekundersvila.
- Diagnostikens `firedOnResume` är opålitlig — se avsnitt 3. Den är kvar men ska inte
  litas på; timerns bakgrundsfråga är ändå avgjord.

## 6. Kända avvikelser

- **7.13:** bundlen är 614 kB precache, varav supabase-js är merparten. Behövs bara för
  synk, aldrig i loggningsvägen. Mät på riktig telefon innan refaktorering.
- `npm audit`: 5 high i `eslint → minimatch → brace-expansion`. DevDependency.
- Advisorn: `rls_auto_enable` och `auth_leaked_password_protection` — båda medvetna.

---

## 6b. Fas 8 — AI-reserven (2026-08-01)

Hela pipelinen är byggd och testad. **Den har aldrig pratat med en riktig modell** — det
kräver nycklar och en deploy, se avsnitt 7.

**8.0 byggdes först, och det är avsiktligt.** Modellen får hela katalogen, senaste
utförandet per övning, typiskt viktspann, bästa e1RM och det pågående passets set. Det är
detta som skiljer en coach från en andra parser: *"samma som förra gången"* har något att
syfta på, *"en till"* vet vad som just loggades, och ett värde långt utanför det typiska går
att känna igen. Payloaden är begränsad till de 12 senast tränade övningarna, med ett test
som vaktar att den håller sig under 20 000 tecken — den går i varje anrop.

**Valideringen behandlas som säkerhet, inte finputs.** Modellen föreslår; `validate.ts`
avgör vad som får bli data. Det farligaste felläget är ett **påhittat övnings-id** som ser
ut som ett UUID: utan kontrollen mot katalogen hade setet skrivits mot en övning som inte
finns, och främmandenyckeln hade fällt hela synkbatchen långt senare med ett felmeddelande
långt från orsaken. Förvalet är **låg konfidens** — allt modellen härlett ur historiken
bekräftas av en människa innan det sparas.

**AI:n träder in först när den lokala grammatiken sagt ifrån.** Aldrig i förväg, aldrig
medan man skriver, aldrig i bakgrunden. Offline nämns den inte ens — texten ligger kvar.

## 6c. Fas 11 omstrukturerad — och det är en korrigering, inte ett tillägg

Adam invände 2026-08-01 att appen riskerar att bli förälskad i sin egen textparser. Han har
rätt, och Fas 11 var för smalt formulerad för att fånga det.

**Som appen ser ut i dag är fritexten hjälten** och manuell inmatning ligger hopfälld bakom
en länk, med en rå `<select>` av 45 övningar. I Strong och Hevy sker uppskattningsvis 90 %
av loggningen genom att trycka och bekräfta — särskilt när man bygger vidare på ett tidigare
pass. Vår informationsarkitektur är alltså tvärtemot branschens, och tvärtemot hur folk
faktiskt loggar.

Fas 11 är därför delad: **11A är det touch-baserade gränssnittet (strukturellt)** och
**11B är den visuella poleringen** som redan var planerad. 11A först, och den är sannolikt
viktigare för hur appen upplevs än allt annat som återstår.

**En tidigare avgränsning föll med detta:** `PLAN.md` §3.6 sköt upp rutiner och mallar till
efter v1. Det håller inte längre — "bygga vidare på ett tidigare pass" är kärnan i det Adam
beskriver, och SPEC kräver redan att man ska kunna kopiera en historisk mall på två klick.
Mallarna är uppflyttade till 11A.6.

🚩 **Acceptanskriterium för 11A:** ett normalt upprepat pass ska gå att logga **utan att
tangentbordet öppnas en enda gång**, och med färre tryck än i Hevy.

## 6d. Telemetrin (8.10–8.11)

En rad per fritextinmatning, för både lokal grammatik och AI. Går via utkorgen som all annan
data — de flesta inmatningar sker utan nät, och telemetri som bara skrevs online hade
systematiskt missat de intressantaste fallen.

**Förvalet är `rejected`.** En rad som aldrig ledde till ett sparat set är inte accepterad,
och att anta motsatsen hade gjort statistiken systematiskt för snäll. Vid `edited` sparas
**vad det rätta värdet blev** — utan det går felen att räkna men inte att analysera.

Panelen under Inställningar vägrar visa en procentsats under fem försök. Fyra av fyra är
100 %, och en siffra som ser ut som ett resultat utan att vara det är värre än ingen siffra.

> ⚠️ **Migration 0003 MÅSTE köras innan appen används med denna version.** Den lägger till
> `ai_parse_log`-grenen i `apply_mutations`. Utan den avvisas mutationen som "okänd tabell",
> och eftersom utkorgen stannar vid permanenta fel — med flit — **fastnar hela synken**.

## 7. Nästa steg

**Du:** deploya och titta på historiken — datan du synkade upp finns nu i appen. Timerfrågan
är avklarad, inget mer att mäta där.

**Du måste sätta nycklarna och deploya innan AI-vägen kan testas.** Det kräver Supabase CLI
— Edge Functions går inte att deploya från webbeditorn (uppgift 2.2, som varit uppskjuten
till precis nu).

```
npm i -g supabase
supabase login
supabase link --project-ref oyccchcleypfuyuqmueq
supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
supabase functions deploy ai-parse
```

> **Egna nycklar i en egen organisation**, skilda från `news-signal-engine`. Signalmotorn
> har en dokumenterad incident där ett testanrop tömde dygnskvoten och slog ut 22 % av en
> handelsdags signaler. Delas kontot kan en fritextmiss på gymmet tysta produktionssignaler.

Testa sedan med något den lokala grammatiken omöjligt kan klara:
`samma som förra gången men två kilo tyngre`, `en till på samma`, `tre set bänk som sist`.

**Claude därefter: fas 11A — det touch-baserade gränssnittet.** Se avsnitt 6c. Det är den
enskilt största kvarvarande skillnaden mot en app man vill använda varje pass.

Kvarvarande småuppgifter: **6.9** (justerbar vilotid per övning), **7.13** (lata-ladda
supabase-js), **12.7** (personligt anpassat 1RM i stället för Epley).

Kvarvarande småuppgifter: **6.9** (justerbar vilotid per övning — knapparna ±30 s finns, men
inte sparad tid per övning), **7.13** (lata-ladda supabase-js), **fas 10** (deploy-automatik),
**fas 11** (designpoleringen).

Kvarvarande småuppgifter: **6.9** (justerbar vilotid per övning), **7.13** (lata-ladda
supabase-js), **fas 10** (deploy-automatik).
