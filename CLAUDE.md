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
