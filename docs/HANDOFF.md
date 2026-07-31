# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
**Appen går att logga pass i.** Fas 0–5 är klara så när som på två punkter (5.9 och 5.10).
Alla tre grindar är passerade. Nästa steg är Adams test på riktigt gym, och därefter fas 6
(vilotimern) eller fas 7 (synken).

---

## 1. Vad som finns nu

Ett pass kan startas, set kan loggas med fritext (`Bänk 90x5`) eller manuellt med spökdata,
raderas, och passet avslutas — allt mot IndexedDB, utan nät, utan konto. Varje mutation
lägger samtidigt en post i utkorgen, redo för synken i fas 7.

**81 tester gröna**, varav 22 nya mot en riktig IndexedDB via `fake-indexeddb`.

---

## 2. Två fel som bygget avslöjade

**`PLAN.md` §2.4 var fel om indexen.** Planen listade `isDeleted` som index på `workouts`.
IndexedDB accepterar bara number, string, Date, binärdata och arrayer som nycklar —
**booleaner är inte giltiga nycklar**. Hade det byggts som planerat hade indexet blivit tyst
trasigt. Raderade rader filtreras nu i minnet, vilket är gratis i den här storleksordningen.

**Katalogen måste ha databasens id:n, inte egna.** Klienten behöver övningarna lokalt redan
vid första start, i en källare, utan konto. Hade den seedat med nygenererade UUID:n hade
synken i fas 7 sett 45 nya rader och dubblerat hela katalogen — en tyst korruption som ingen
upptäcker förrän katalogen är full av dubbletter. `src/db/catalog.ts` innehåller därför de
riktiga id:na, hämtade ur Supabase, transkriberade för hand och **verifierade av
`catalog.test.ts` mot md5-kontrollsummor tagna ur databasen**. Ändras katalogen i en framtida
migration ska summorna uppdateras i samma commit — annars går testet sönder, vilket är exakt
vad det ska göra.

---

## 3. Designval värda att känna till

- **Spökdata är platshållartext, inte förifyllda värden.** Ett förifyllt fält som användaren
  aldrig rör blir loggat som om det vore inmatat. En platshållare måste bekräftas men räcker
  som minnesstöd, vilket är hela poängen.
- **Hög konfidens loggas direkt, låg konfidens frågar.** `Bänk 90x5` sparas tyst med en
  diskret grön ton på raden. `Bänk 5x5` visar ett redigerbart utkast med förklaringen varför.
- **Otolkad text försvinner aldrig.** Vid en miss står skälet på svenska och texten ligger
  kvar i fältet.
- **`setIndex` räknas per övning inom passet**, inte per pass — så att "set 2 av bänkpress"
  stämmer även när övningarna varvas.
- **`user_id` skickas aldrig i utkorgens payload.** Servern tar alltid ägaren ur JWT:n.
  Att skicka den skulle antyda att klienten bestämmer vem datan tillhör.

---

## 4. Verifierat

- 81 tester, typecheck, lint, produktionsbygge — alla gröna.
- **3.7 offlinestart verifierad på iPhone** i flygplansläge, installerad på hemskärmen.
  iOS systemruta om saknad dataåtkomst är väntad: servicearbetaren gör en uppdateringskoll
  vid start. Att appen ändå renderade är beviset.
- Grind 1, 2 och 3 passerade. Databasens isolering bevisad med 11 av 11 kontroller.
- Katalogens id:n verifierade mot databasens kontrollsummor.

## 5. INTE verifierat

- **5.10 — hela loggningsvägen offline på riktigt.** Testerna körs mot `fake-indexeddb` i
  Node, inte mot Safari på en iPhone. Det som återstår är Adams test.
- **0.8** — om en lokal notis håller i tre minuter. Blockerar 6.6. Adam har skjutit upp den
  till fas 6, vilket är rimligt.
- `apply_mutations` är fortfarande oprövad mot riktig trafik.

## 6. Kända avvikelser och beslut

- **2.20 struken.** Leaked Password Protection finns enligt Adams observation inte på Free
  Tier. Advisorn kommer fortsätta rapportera den — förväntat, inte förbisett.
- `rls_auto_enable` × 2 i advisorn — Supabases egen, falsk positiv.
- `npm audit`: 5 high i `eslint → minimatch → brace-expansion`. DevDependency, väntar på patch.
- `@types/node` tillagd i `tsconfig.types` för att katalogtestet använder `node:crypto`.
  Tradeoff: Node-globaler blir synliga för TypeScript även i appkoden. Vite skulle fånga ett
  faktiskt felaktigt Node-anrop vid bygget, men det är värt att veta.

---

## 7. Nästa steg

**Adam:** deploya och kör **5.10** — logga ett riktigt pass i flygplansläge, gärna 20+ set,
stäng appen, öppna igen och kontrollera att allt finns kvar. Det är första gången appen gör
något den är byggd för.

**Claude därefter, i den ordning du väljer:**
- **5.9** — skapa ny övning från en parsermiss. Liten, och gör fritextfältet komplett.
- **Fas 6** — vilotimern. Kräver 0.8 innan 6.6 (notisdelen), men 6.1–6.5 går att bygga nu.
- **Fas 7** — synken. Grind 2 är passerad, så den är fri. Störst arbete, men det är den som
  gör att datan överlever en trasig telefon.

Min rekommendation: **5.9 följt av fas 7.** Vilotimern är trevlig, men just nu finns
träningsdatan bara på en enhet — och det är den risken som växer för varje pass som loggas.
