# Överlämning (Senaste status)

**Datum:** 2026-07-30

**Aktuellt mål:**
Fas 2 (teknisk plan) och fas 3 (algoritmisk nedbrytning) i SDD är klara. Planen är godkänd.
Uppgift 0.1 och 0.2 är byggda. **Nästa handling är uppgift 0.3–0.6: Adam publicerar
testmappen på Vercel och kör mätningen på sin telefon.** Ingen produktionskod får skrivas
före det, eftersom mätningen avgör hur vilotimern byggs.

**Vad som faktiskt har ändrats:**
- `docs/PLAN.md` — skriven, därefter omskriven med tre tillagda krav: gratis-stack (nytt §7),
  testdriven parser med explicit testkorpus (§4.3), och omvänd larmordning för vilotimern
  där visuellt går före ljud (§2.6). LLM-avsnittet (§4.5) bytt från Claude till Groq primärt
  med Gemini som reserv. Hosting låst till Vercel; Netlify struket.
- `docs/TASKS.md` — skriven från grunden. 12 faser, 101 uppgifter, tre grindar. Varje uppgift
  har ett "Klart när"-villkor. 0.1 och 0.2 avbockade.
- **`test/` — första koden i projektet.** Åtta filer, fristående från allt annat:
  `feedback-test.html` (testsidan), `sw.js`, `manifest.json`, `vercel.json`,
  `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `make-icons.mjs`.
  Detta är ett diagnostikverktyg, inte appen. Det delar ingen kod med det som ska byggas
  och kan raderas när fas 0 är avslutad.
- `docs/HANDOFF.md` — denna fil.
- Inget Supabase-projekt, inga beroenden installerade, ingen `package.json`.
  `docs/SPEC.md` och `CLAUDE.md` är orörda.

**Tre saker i testsidan som inte stod i uppgiftsbeskrivningen, och varför:**
1. **`sw.js` lades till.** På iOS finns inte `new Notification()`. Enda fungerande vägen är
   `ServiceWorkerRegistration.showNotification()`, vilket kräver en registrerad
   servicearbetare. Utan den hade testet gett ett nej som berodde på fel sak.
2. **Ja/Nej-fråga per kanal.** `navigator.vibrate()` som returnerar `true` betyder bara att
   anropet accepterades — inte att telefonen skakade. Den mänskliga observationen är den
   enda riktiga mätpunkten, så den samlas in strukturerat och hamnar i den kopierbara
   sammanfattningen.
3. **Fördröjningsväljare (direkt / 5 s / 10 s).** Ett larm som bara fungerar när man tittar
   på skärmen är värdelöst för en vilotimer. Fördröjningen gör att larmet kan testas med
   telefonen nedlagd eller med en annan app i förgrunden, vilket är det verkliga scenariot.

**Vad som faktiskt har verifierats (Bevis):**
- *MCP på Supabase Edge Functions saknar autentiseringsstöd i dag.* Verifierat mot Supabase
  dokumentation via deras dokumentations-API. Guiden "Deploy MCP servers" inleds med
  noteringen att den bara täcker MCP-servrar utan autentisering och att auth-stöd är på väg;
  både lokal körning och deploy sker med `--no-verify-jwt`. Grunden för att MCP ligger i ett
  separat spår.
- *RLS-detaljerna.* Verifierat mot Supabase RLS-dokumentation: `(select auth.uid())` gör att
  uttrycket utvärderas en gång per query i stället för en gång per rad; index på
  filterkolumnen och undvikande av joins i policyn är de avgörande posterna.
- *Supabase Free Tier-gränser (§7.2).* Verifierat mot Supabase dokumentation: read-only vid
  **500 MB databasstorlek** (inte disk — disken är 1 GB), **10 GB bandbredd/mån** (5 cachad +
  5 ocachad), **pausning efter 7 dagars låg databasaktivitet** med varningsmejl ~1 vecka innan
  och 90 dagars fönster att återstarta, samt att ett nytt projekt förbrukar ~40–60 MB från
  start.
- *Notiser på iOS kräver installerad PWA.* Verifierat mot flera oberoende leverantörskällor
  och Apples utvecklarforum: notiser är bara tillgängliga för PWA:er installerade från Safari
  till hemskärmen, kräver `manifest.json`, och behörighetsdialogen kräver en explicit
  användargest. Därför mäter fas 0 både i Safari-flik och som installerad app.

**Kända fel / Misslyckade försök:**
- `gh` finns inte i PATH i den här miljön. Klonade med `git clone` över HTTPS. Repot är
  publikt så det fungerade utan autentisering.
- Två stavfel ("Klart når") i `TASKS.md` rättade före commit.
- Testsidan gick **inte** att rendera i den här miljöns webbläsarpanel: localhost blockeras av
  policy, och `file://` visas bara som statisk ögonblicksbild. Verifieringen nedan är därför
  syntaktisk, inte visuell.

**Vad som INTE är verifierat (och inte får antas):**
- **Vibration på iOS är en öppen fråga, och källorna är motstridiga.** En rapport i MDN:s
  kompatibilitetsdatabas från mars 2026 hävdar att `navigator.vibrate` numera fungerar i iOS
  Safari; caniuse och senare sammanställningar anger att den inte stöds. Jag har inte valt
  sida. Fas 0 avgör.
- Ljud genom iOS tysta läge är oprövat. Underlagets påstående är inte verifierat.
- Storleksräkningen i §7.3 (~2,5 MB/år) bygger på uppskattade radstorlekar, inte på mätning.
  Slutsatsen — att 500 MB inte är den bindande gränsen — tål stor felmarginal, men siffran är
  en uppskattning.
- Exakta kvotgränser hos Groq och Gemini är inte kontrollerade. De ändras ofta och fastställs
  vid implementationen (uppgift 8.1–8.2).
- **Testsidan är syntaxkontrollerad men inte körd i en riktig webbläsare.** `node --check` på
  den inbäddade JavaScripten och på `sw.js` går igenom, `manifest.json` och `vercel.json`
  parsar som giltig JSON, och de tre PNG-ikonerna är verifierade som giltiga bilder som
  renderar rätt motiv. Att knapparna faktiskt gör det de ska är däremot **inte** observerat —
  det avgörs första gången sidan öppnas på telefonen. Går något sönder där är det en bugg i
  testverktyget, inte ett mätresultat.

**Öppna beslut som väntar på Adam:**
1. Ska `effort` vara ett fält (`type` + `value`) eller två kolumner? (`PLAN.md` §3.1) —
   före uppgift 2.6.
2. Vem fyller den globala övningskatalogen och hur stor ska den vara? — före uppgift 2.16.
3. ~~Vercel eller Netlify?~~ **Avgjort 2026-07-30: Vercel.** Netlify struket ur planen.

**Nästa steg:**
1. **Adam publicerar `test/` på Vercel** (uppgift 0.3): `npx vercel --prod` från `test/`-mappen,
   som eget throwaway-projekt skilt från det kommande `gym-app`. Kör därefter mätningen i tre
   lägen (0.4–0.6) och klistra in den kopierade sammanfattningen. Resultatet skrivs in i
   `PLAN.md` §2.6 (0.7), varefter grind 1 är passerad.
2. Därefter fas 1 (projektuppsättning) och fas 2 (databas). Grind 2 måste passeras — negativt
   åtkomsttest och `get_advisors` utan RLS-varningar — innan någon kod skriver till Supabase.
3. Fas 4 (parsern) är testdriven. Testfilen committas före implementationsfilen, aldrig i
   samma commit.
