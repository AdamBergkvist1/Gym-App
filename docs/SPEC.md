# Specifikation (SPEC): Gym-App

## 1. Syfte och Målgrupp
Appen är en PWA designad för erfarna lyftare. Målet är att erbjuda den snabbaste och mest friktionsfria loggningsupplevelsen på marknaden. 

## 2. Kärnfunktioner (Användarupplevelse)
- **Fritextloggning via AI (MCP):** Användaren ska kunna skriva t.ex. "Bänkpress 90kg 5 reps, kändes lätt" i en inmatningsruta. AI:n parsar detta och strukturerar datan automatiskt.
- **Spökdata (Auto-fill):** Om användaren väljer att logga manuellt, ska inmatningsfälten (Vikt/Reps) vara ifyllda med transparent text baserat på *exakt* vad användaren lyfte under förra passet för den övningen.
- **Vilotimer:** Startar asynkront när ett set loggas. Appen använder Wake Lock API för att förhindra att skärmen släcks under passet, samt Web Audio API för larm.
- **Historik:** Visuell representation av tidigare pass och PB (Personbästa).

## 3. Datamodell (Vad som sparas per set)
- **Övning:** (String) T.ex. Bänkpress.
- **Vikt & Reps:** (Number)
- **RIR/RPE:** (Number 1-10, Optional) Om det inte anges, lämnas det tomt. Användaren ska slippa logga detta om de inte orkar.
- **Vilotid:** (Number, Optional) Tid i sekunder.
- **Notering / Vibe:** (String, Optional) T.ex. "Ont i axeln".
- **Timestamp:** (Tz) Exakt tid för setet.

## 4. UI / Designspråk
- **Minimalistiskt och mörkt:** Tänk Jeff Nippard / Macrostax. Inget onödigt fluff.
- **Tysta framgångar:** Inga stora pop-ups när ett set sparas. En diskret färgförändring eller ikon räcker för att bekräfta ("Success State").
- **Offline-First:** Användargränssnittet måste uppdateras omedelbart (Optimistic UI) via IndexedDB, oavsett nätverkets status. Nätverksanrop sker i bakgrunden.
