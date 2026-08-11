# Gym-App: AI-Orkestrerad Träningsloggbok (PWA)

## WHAT (Vad vi bygger)
En minimalistisk, offline-first Progressive Web App (PWA) för styrketräning. Kärnvärdet är total friktionsfri inmatning via AI-tolkning (fritext) och intelligent "spökdata". Appen använder Supabase som backend och är strikt begränsad till träningsdata (ingen kost/makros).

## WHY (Varför vi bygger det)
För att vanliga träningsappar har för hög kognitiv friktion. Användaren vill ha hastigheten från en anteckningsapp, men kraften från en strukturerad databas.

## HOW (Hur du (AI) måste arbeta)
YOU MUST följa dessa regler utan undantag:
1. **Spec-Driven Development:** Koda INGET förrän `docs/SPEC.md` och `docs/PLAN.md` är uppdaterade och godkända av användaren. Arbeta därefter strikt utifrån `TASKS.md`.
2. **Diagnos före fix:** Gissa ALDRIG varför en bugg uppstår. Begär konsol-output, loggar eller skärmdumpar innan du ändrar kod. Kan felet reproduceras i Playwright är det den vägen som gäller — inte att be Adam ladda om på telefonen.
3. **En ändring i taget:** Gör endast atomära commits. Blanda aldrig refaktorering med nya funktioner.
4. **Säkerhet (Kritisk):**
   - Supabase Row Level Security (RLS) MÅSTE vara aktiverat för alla tabeller.
   - API-nycklar får ALDRIG exponeras i frontend-koden.
   - Alla databasmutationer måste använda Idempotency-nycklar.
5. **Överlämning (åt båda hållen):**
   - **Vid start:** läs `docs/HANDOFF.md` (översta sektionen) och `docs/TASKS.md` innan du gör något annat. Ingen av dem laddas automatiskt — den här filen gör det, och därför står det här.
   - **Innan en session avslutas:** MÅSTE du uppdatera `docs/HANDOFF.md` med verifierbara fakta. Gissningar eller "bör fungera" är förbjudet. Kör `/handoff` — den är projektlokal och skriver till rätt fil.
6. **Kodändringar:** Ange ändringar som exakta Sök-Och-Ersätt-block. Inga radnummer.

---

# 7. SYSTEMREGLER: OPEN SOURCE FÖRST

## 7.1 Grundhållningen

**Leta alltid först. Bygg själv bara när du kan säga varför.**

Att söka efter befintliga lösningar är ett **standardsteg i varje ny funktion**, inte något
som sparas till de stora uppgifterna. Innan du skriver den första raden av något nytt: sök på
GitHub efter vad som redan finns, och redovisa vad du hittade — även när svaret blir "inget
som passar". Att inte ha letat är aldrig ett godtagbart skäl.

Målet är att **kopiera allt eller stora delar och sedan skriva om det så det passar oss.**
Det är inte fusk; det är det normala arbetssättet.

**Motvikten väger lika tungt.** Regeln gäller komplexa lösta problem — inte "skriv aldrig kod
själv". Vi bygger gärna eget när vi blir bättre än alternativet, men då ska det vara ett
grundat beslut, inte en känsla:

- En **plattformsprimitiv** (`scroll-snap`, `<dialog>`, CSS grid, IntersectionObserver) slår
  alltid ett bibliotek som gör samma sak.
- Om alternativet till 40 egna rader är 200 kB i bundlen är de 40 raderna rätt svar.
- Men **"jag kan nog bygga det bättre" är inget skäl förrän det jämförts mot något konkret.**
  Har du inte letat vet du inte, och då gäller sökregeln.

**Gratis > betalt.** Free tier och open source före prenumeration, alltid.

**Data slår kod.** Det mest värdefulla — och säkraste — man hämtar utifrån är ofta
datamängder: övningsdatabaser, ordlistor, ikonuppsättningar, färgskalor. Ingen körbar kod
betyder ingen supply-chain-risk. Leta där först.

**Fråga communityt.** Reddit, GitHub Issues och Stack Overflow visar vilka repos som faktiskt
används och var de går sönder — stjärnor säger inget om underhåll.

## 7.2 Vad du redovisar när du hittat kandidater

2–3 alternativ med **licens · senaste commit · stjärnor · gzipad storlek · antal transitiva
beroenden**. Därefter en rekommendation. Sedan väntar du på beslut.

## 7.2b Licensen avgör vad som får göras — läs den FÖRST

Licensen är inte en formalitet i slutet. Den avgör om koden över huvud taget får röras, och
ska redovisas **innan** något annat diskuteras.

| Licens | Vad vi får göra |
|---|---|
| **Unlicense, CC0, public domain** | Allt. Inga villkor |
| **MIT, ISC, BSD, Apache-2.0** | Kopiera fritt. **Kräver att upphovsrättsraden följer med** |
| **AGPL, GPL, LGPL** | ⛔ **KOPIERA ALDRIG KOD.** Läsa för idéer är fritt och lagligt |
| **Ingen licens / `NOASSERTION`** | ⛔ Behandla som "alla rättigheter förbehållna". Fråga Adam |

**Varför AGPL är förbjudet här:** det är copyleft med nätverksklausul. Kopieras AGPL-kod in i
appen måste **hela appen** släppas under AGPL — inte bara den kopierade delen, och inte bara
i dag utan för all framtid. Att repot redan är publikt är inte samma sak; AGPL hindrar oss
också från att någonsin stänga eller sälja appen.

**Gränsen som gäller:** layout, informationsarkitektur och interaktionsmönster är **inte**
upphovsrättsskyddade. Att studera en AGPL-app och bygga något liknande själv är lagligt och
uppmuntras. Det är att kopiera **kodrader** som utlöser villkoret.

## 7.2c Härkomstregistret — `docs/EXTERNT.md`

**Allt vi hämtar utifrån ska stå i `docs/EXTERNT.md`**: vad, varifrån, vilken licens, vilka
filer hos oss det berör, och om det är kopierat eller bara läst som inspiration.

Registret är inte byråkrati. Utan det går det inte att svara på frågan *"får vi göra det här
med koden?"* om ett halvår, och då blir svaret i praktiken nej — eller värre, ett ja som ingen
kan belägga. För MIT-licenserad kod är registret dessutom det som **uppfyller** licensvillkoret
om attribution.

**Ingen extern kod eller data committas utan en rad i registret i samma commit.**

## 7.3 Att införliva extern kod

Den verkliga supply-chain-risken sitter i `npm install` — postinstall-skript kör godtycklig
kod på maskinen innan en enda rad hunnit läsas. Att *läsa* främmande filer är ofarligt.
Flödet utgår från det:

1. **Läs på GitHub först** med `gh`. Avgör passform innan något laddas ner.
2. **Klona till `temp-sandbox/`** (gitignorerad). Aldrig direkt i `src/`.
3. **`npm install` i sandlådan sker ALLTID med `--ignore-scripts`.**
4. **Kopiera källkod hellre än att lägga till ett beroende.** En komponent som klistras in och
   läses igenom är granskad på riktigt. Ett beroende är det inte.
5. **Cherry-picken ska vara liten nog att varje rad hinner läsas.** Går det inte är den för
   stor — det är den enda säkerhetsgaranti som betyder något. En LLM-svepning över tiotusen
   rader främmande kod ger falsk trygghet, vilket är sämre än ingen.
6. **Skriv om till vår standard:** TypeScript-typer, Tailwind, våra namn. Notera **ursprung
   och licens i en kommentar överst i filen**.
7. **Verifiera:** `npm run test && npm run typecheck && npm run lint && npm run build`.
   Ta sedan bort sandlådan.

**Nya poster i `package.json` kräver Adams uttryckliga ja.** Bundlen är redan 614 kB och
uppgift 7.13 är fortfarande öppen.

## 7.4 Att hålla oss uppdaterade

Ingen daglig scanning av GitHub trending — det är brus för det här projektet. Det som bevakas
är **releaser och säkerhetsrådgivningar för de beroenden vi faktiskt kör**
(`vite-plugin-pwa`, `dexie`, `supabase-js`, `react-router`, `vite`, `tailwindcss`).
Riktad sökning vid funktionsstart, inte crawl.

---

# 8. PROJEKTETS FEM DOKUMENT

Ingen kod skrivs utan att rätt dokument är uppdaterat först (se regel 1).

| Dokument | Fil | Innehåll |
|---|---|---|
| Produktkrav (PRD) | `docs/SPEC.md` | Vad appen är, kärnfunktioner, datamodell |
| Teknisk design (TDD) | `docs/PLAN.md` | Stack, arkitektur, API:er, avgjorda frågor |
| Appflöde | `docs/PLAN.md` §2 | Skärmar, användarresor, vad varje knapp gör |
| Designbrief | `docs/DESIGN.md` | Färg, typografi, komponenter, tokens |
| Databasschema | `supabase/migrations/` | Tabeller, fält, relationer, RLS |
| Utvecklingsplan | `docs/TASKS.md` | Små testbara uppgifter i rätt ordning, med acceptanskriterier |

`docs/DESIGN.md` skrivs som **första steg i fas 11B** och är en förutsättning för den fasen —
inte en dokumentation av den i efterhand.

---

# 9. Agent skills

Konfiguration för de installerade skills:arna (`/to-tickets`, `/triage`, `/to-spec`,
`/wayfinder`, `/domain-modeling` m.fl.). De läser `docs/agents/` — inte den här sektionen.
Sektionen finns för att du ska se var sakerna bor utan att öppna fyra filer.

Detta är **konfiguration, inte ett sjätte dokument**. §8 står oförändrad.

## Issue tracker

Issues bor som markdown-filer under `.scratch/<feature>/` — en gitignorerad, slängbar
arbetsyta. `docs/TASKS.md` är fortfarande färdplanen och sanningskällan enligt regel 1;
det som överlever i `.scratch/` promoveras tillbaka dit i samma commit som koden.
`docs/TASKS.md` ska **inte** byggas om till ett ticketregister.
Se `docs/agents/issue-tracker.md`.

## Triage labels

De fem standardrollerna med oförändrade namn (`needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`). Eftersom issues är filer är etiketten en
`Status:`-rad överst i filen. Se `docs/agents/triage-labels.md`.

## Domain docs

Single-context: en `CONTEXT.md` och en `docs/adr/` i roten. **Ingen av dem finns ännu, och
ingen ska skapas i förväg** — de växer fram när `/domain-modeling` faktiskt avgör ett begrepp
eller ett beslut. Se `docs/agents/domain.md`.
