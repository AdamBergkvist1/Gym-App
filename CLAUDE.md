# Gym-App: AI-Orkestrerad Träningsloggbok (PWA)

## WHAT (Vad vi bygger)
En minimalistisk, offline-first Progressive Web App (PWA) för styrketräning. Kärnvärdet är total friktionsfri inmatning via AI-tolkning (fritext) och intelligent "spökdata". Appen använder Supabase som backend och är strikt begränsad till träningsdata (ingen kost/makros).

## WHY (Varför vi bygger det)
För att vanliga träningsappar har för hög kognitiv friktion. Användaren vill ha hastigheten från en anteckningsapp, men kraften från en strukturerad databas. 

## HOW (Hur du (AI) måste arbeta)
YOU MUST följa dessa regler utan undantag:
1. **Spec-Driven Development:** Koda INGET förrän `docs/SPEC.md` och `docs/PLAN.md` är uppdaterade och godkända av användaren. Arbeta därefter strikt utifrån `TASKS.md`.
2. **Diagnos före fix:** Gissa ALDRIG varför en bugg uppstår. Begär konsol-output, loggar eller skärmdumpar innan du ändrar kod.
3. **En ändring i taget:** Gör endast atomära commits. Blanda aldrig refaktorering med nya funktioner.
4. **Säkerhet (Kritisk):** - Supabase Row Level Security (RLS) MÅSTE vara aktiverat för alla tabeller.
   - API-nycklar får ALDRIG exponeras i frontend-koden.
   - Alla databasmutationer måste använda Idempotency-nycklar.
5. **Överlämning:** Innan en session avslutas MÅSTE du uppdatera `HANDOFF.md` med verifierbara fakta. Gissningar eller "bör fungera" är förbjudet.
6. **Kodändringar:** Ange ändringar som exakta Sök-Och-Ersätt-block. Inga radnummer.

# 🛠️ SYSTEMREGLER FÖR UTVECKLING OCH OPEN SOURCE
Du är en expertutvecklare och AI-assistent (Claude Code). För att maximera effektiviteten och bygga säkert, ska du ALDRIG frångå följande principer i detta projekt:

## 3 HÅRDA GRUNDREGLER
1. **Bygg inte det som redan är byggt:** Slösa aldrig tid på att bygga komplexa funktioner från grunden om det finns färdiga, robusta open source-lösningar. De är antagligen byggda bättre och säkrare än vad vi kan göra på kort tid.
2. **Gratis > Betalt:** Prioritera ALLTID gratis open source-lösningar över betaltjänster och prenumerationer.
3. **Fråga communityt först:** Innan vi uppfinner hjulet på nytt, sök igenom communities (Reddit, GitHub, StackOverflow) för att se hur andra har löst problemet och vilka repos som rekommenderas just nu.

## ARBETSFLÖDE FÖR ATT INTEGRERA EXTERNA REPOS
När vi identifierar ett externt repo (t.ex. från GitHub) som kan lösa ett problem för oss, MÅSTE du följa exakt denna process för att bibehålla säkerhet och kodkvalitet:

1. **Inspektion via MCP:** Använd GitHub CLI (via din MCP-koppling) för att läsa och analysera repot direkt. Du ska förstå kodbasen och avgöra om den passar vår stack *innan* vi laddar ner något lokalt.
2. **Sandlådan (Sandbox):** Om repot verkar bra, klona det först till en isolerad mapp/sandlåda i projektet (t.ex. en `/temp-sandbox`-mapp) – aldrig direkt in i vår produktionskod.
3. **Säkerhetssweep #1:** Kör en strikt säkerhetsgranskning av koden i sandlådan. Leta efter skadlig kod, utdaterade beroenden, dataläckor eller opålitlig logik.
4. **Cherry-Picking:** Om koden godkänns säkerhetsmässigt ska du inte dra in hela repot blind. Välj ("cherry-picka") endast ut de specifika filer, komponenter eller den logik vi faktiskt behöver för vår setup.
5. **Integration:** Implementera de utvalda delarna i vårt huvudprojekt. Skriv om dem så att de matchar vår kodstandard (t.ex. TypeScript-typer, Tailwind-klasser) om det behövs.
6. **Säkerhetssweep #2:** När koden är integrerad, gör en slutgiltig verifiering av hela vår setup för att säkerställa att inget i vårt befintliga dataflöde gick sönder. Ta sedan bort sandlådan.
