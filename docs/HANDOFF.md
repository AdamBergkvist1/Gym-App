# Överlämning (Senaste status)

**Datum:** 2026-07-30

**Aktuellt mål:**
Fas 2 i SDD — läsa `docs/SPEC.md` och producera ett tekniskt förslag i `docs/PLAN.md`.
Klart. Planen väntar nu på mänskligt godkännande innan `TASKS.md` fylls i och kodning
påbörjas (`CLAUDE.md`, regel 1).

**Vad som faktiskt har ändrats:**
- `docs/PLAN.md` — skriven från grunden. Innehåller frontend-stack, Supabase-schema med
  RLS-strategi, AI/MCP-arkitektur, risklista och föreslagen arbetsordning.
- `docs/HANDOFF.md` — denna fil.
- Inget annat. Ingen kod, ingen migration, inget Supabase-projekt, inga beroenden
  installerade. `docs/SPEC.md`, `docs/TASKS.md` och `CLAUDE.md` är orörda.
- Repot är klonat lokalt till `C:\Users\adamb\Gym-App` (Windows). Ändringarna är
  **inte** committade och **inte** pushade.

**Vad som faktiskt har verifierats (Bevis):**
- *MCP på Supabase Edge Functions saknar autentiseringsstöd i dag.* Verifierat mot
  Supabase officiella dokumentation via deras dokumentations-API. Guiden "Deploy MCP
  servers" inleds med noteringen att den bara täcker MCP-servrar som inte kräver
  autentisering och att auth-stöd är på väg; både lokal körning och deploy sker med
  `--no-verify-jwt`. Detta är grunden för att planen lägger MCP i ett separat spår
  utanför inmatningsvägen.
- *RLS-detaljerna i planen.* Verifierat mot Supabase RLS-dokumentation: rekommendationen
  att omsluta anropet som `(select auth.uid())` för att uttrycket ska utvärderas en gång
  per query i stället för en gång per rad, samt att index på filterkolumnen och undvikande
  av joins i policyn är de avgörande prestandaposterna.
- *Modell-ID:n och prisnivåer i avsnitt 4.4.* Hämtade från Anthropics aktuella
  modellreferens, inte ur minnet: `claude-opus-5` 5 USD in / 25 USD ut per miljon tokens
  och lägsta cachebara prefix 512 tokens; `claude-haiku-4-5` 1 USD / 5 USD.

**Kända fel / Misslyckade försök:**
- `gh` finns inte i PATH i den här miljön. Klonade med `git clone` över HTTPS i stället.
  Repot är publikt så det fungerade utan autentisering.
- Inga fel i övrigt, eftersom ingenting har byggts eller körts.

**Vad som INTE är verifierat (och inte får antas):**
- Räkneexemplet för kostnad per parsningsanrop i avsnitt 4.4 är en uppskattning från
  antagna tokenmängder. Det är inte mätt.
- Påståendet i `docs/research/` om att Web Audio API tar sig förbi iOS tysta läge är
  **inte** verifierat. Planen behandlar det som en öppen fråga som ska mätas på riktig
  hårdvara innan vilotimern byggs.
- Ingenting i planen är kompilerat, kört eller testat. Den är ett förslag.

**Nästa steg:**
1. Läs `docs/PLAN.md` och ta ställning till de tre beslutspunkterna:
   - **1:** Vite-SPA i stället för Next.js (avsnitt 2.1)
   - **2:** MCP utanför inmatningsvägen i v1 (avsnitt 4.2)
   - **3:** Mät om Web Audio hörs genom iOS tysta läge på din telefon (avsnitt 2.6)
   Fråga 3 kräver ingen åsikt, bara ett test — och den bör göras först, eftersom svaret
   avgör hur vilotimern kan byggas.
2. Ta även ställning till de mindre frågorna 4–6 i avsnitt 5.
3. Först efter godkännande: fyll `docs/TASKS.md` utifrån ordningen i avsnitt 6.
4. Committa och pusha `docs/PLAN.md` och `docs/HANDOFF.md`.
