# Överlämning (Senaste status)

**Datum:** 2026-07-30

**Aktuellt mål:**
Fas 2 (teknisk plan) och fas 3 (algoritmisk nedbrytning) i SDD är klara. Planen är godkänd.
Nästa handling är **fas 0 i `docs/TASKS.md`** — mätningen av återkopplingskanaler på iOS.
Ingen produktionskod får skrivas före den, eftersom den avgör hur vilotimern byggs.

**Vad som faktiskt har ändrats:**
- `docs/PLAN.md` — skriven, därefter omskriven med tre tillagda krav: gratis-stack (nytt §7),
  testdriven parser med explicit testkorpus (§4.3), och omvänd larmordning för vilotimern
  där visuellt går före ljud (§2.6). LLM-avsnittet (§4.5) bytt från Claude till Groq primärt
  med Gemini som reserv.
- `docs/TASKS.md` — skriven från grunden. 12 faser, 101 uppgifter, tre grindar. Varje uppgift
  har ett "Klart när"-villkor.
- `docs/HANDOFF.md` — denna fil.
- Fortfarande **ingen kod**, inget Supabase-projekt, inga beroenden installerade.
  `docs/SPEC.md` och `CLAUDE.md` är orörda.

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
- Inga fel i övrigt, eftersom ingenting har byggts eller körts.

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
- Ingenting är kompilerat, kört eller testat.

**Öppna beslut som väntar på Adam:**
1. Ska `effort` vara ett fält (`type` + `value`) eller två kolumner? (`PLAN.md` §3.1) —
   före uppgift 2.6.
2. Vem fyller den globala övningskatalogen och hur stor ska den vara? — före uppgift 2.16.
3. Vercel eller Netlify? — före fas 10.

**Nästa steg:**
1. **Kör fas 0 i `docs/TASKS.md`** (uppgift 0.1–0.7). Testsidan är fristående HTML utan
   byggkedja; den kan skrivas direkt. Resultatet skrivs in i `PLAN.md` §2.6.
2. Därefter fas 1 (projektuppsättning) och fas 2 (databas). Grind 2 måste passeras — negativt
   åtkomsttest och `get_advisors` utan RLS-varningar — innan någon kod skriver till Supabase.
3. Fas 4 (parsern) är testdriven. Testfilen committas före implementationsfilen, aldrig i
   samma commit.
