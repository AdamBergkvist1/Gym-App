# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
**Fas 1 är klar och verifierad.** Fas 2 är **skriven men inte körd** — migrationen ligger som
en fil och väntar på att Adam kör den i Supabase SQL Editor. Grind 2 gäller: ingen kod som
skriver till Supabase får byggas förrän 2.17 och 2.18 är gröna.

---

## 1. Vad som hände detta pass

**Fas 1 — projektuppsättning (uppgift 1.1–1.7, klar).**
Vite 7 + React 19 + TypeScript strikt + Tailwind v4 + Vitest + ESLint. Verifierat:
`npm run typecheck`, `npm run lint`, `npm test` (3 gröna) och `npm run build`
(194 kB / 61 kB gzip) går alla igenom.

Tre val som avviker från uppgiftstexten, med skäl:

1. **Scaffoldat manuellt, inte med `npm create vite@latest`.** Kommandot erbjuder sig att
   tömma katalogen när den inte är tom, och `docs/` och `test/` låg redan där. Risken var
   inte värd bekvämligheten.
2. **`passWithNoTests` är medvetet AV.** Med den påslagen hade en trasig testglob senare gett
   grön svit med noll tester — exakt det felläge projektet ska undvika. I stället skrevs
   `src/lib/id.ts` med tester direkt: klientgenererade UUID:n, som hela idempotensmodellen
   vilar på.
3. **Prettier utelämnad.** Ingen formateringskonflikt finns ännu, och en konfigurationsfil
   utan problem att lösa är bara underhåll. Läggs till om formateringsdiffar börjar störa.

**Fas 2 — migrationen skriven (uppgift 2.3–2.16).**
`supabase/migrations/0001_initial_schema.sql`, 716 rader, en fil att klistra in.

---

## 2. Fynd som ändrade migrationen

**Adams inställning "auto-expose AV" är rätt satt — och den kräver explicita GRANT.**
Verifierat mot Supabase dokumentation: med "default privileges for new entities" avstängt
blir nya tabeller i `public` **inte** automatiskt nåbara via Data API. Utan explicita
`grant`-satser svarar PostgREST med `42501 permission denied` på varje anrop. Migrationen
har därför ett eget GRANT-avsnitt. Utan det hade fas 7 gått rakt in i en vägg som ser ut
som ett RLS-fel men inte är det.

`anon` får ingenting alls, och avsnittet avslutas med ett explicit
`revoke all on all tables in schema public from anon`. Appen kräver inloggning, så en
oinloggad roll har inget legitimt ärende — och det ger ett lager utöver RLS: även en
felskriven policy kan inte utnyttjas utan behörighet.

**Två designval i schemat som är värda att känna till:**

- **Sammansatt främmandenyckel i stället för subquery i RLS.** `workouts` har
  `unique (id, user_id)`, och `logged_sets` har en FK på `(workout_id, user_id)`. Det
  garanterar att ett set och dess pass alltid tillhör samma användare — utan att någon policy
  behöver slå upp ägaren i en annan tabell, vilket hade körts per rad.
- **`normalized_name` är en genererad kolumn** (`lower(btrim(name))`). Den kan aldrig glida
  isär från `name`. **Normaliseringen i `src/parser/normalize.ts` måste matcha uttrycket
  exakt** — annars hittar parsern inte övningar som finns i katalogen. Det står som kommentar
  i SQL-filen.

---

## 3. Verifierat (bevis)

- **Fas 1-verktygskedjan** — typecheck, lint, 3 tester och produktionsbygge körda, alla gröna.
- **Migrationens yttre SQL** — parsad med PostgreSQL:s egen parser (`libpg-query`):
  **88 satser, inga syntaxfel.**
- **Supabase Data API-behörigheter** — verifierat mot deras dokumentation, se avsnitt 2.
- Tidigare verifierade fakta (fas 0-mätningen, MCP saknar auth på Edge Functions,
  `(select auth.uid())`-optimeringen, gratisnivåns gränser, publishable/secret-nycklarna)
  står kvar oförändrade i `PLAN.md`.

## 4. INTE verifierat

- **Migrationen är inte körd.** Ingen Docker finns i utvecklingsmiljön, så den kunde inte
  provköras mot en riktig Postgres. Den är dessutom beroende av `auth.users` och `auth.uid()`,
  som bara finns i Supabase.
- **PL/pgSQL-kropparna är inte parser-verifierade.** För den yttre parsern är en funktionskropp
  bara en stränglitteral. `apply_mutations`, `handle_new_user`, `set_updated_at`,
  `jsonb_to_text_array` och självkontrollblocket är granskade för hand, inte maskinellt.
  Ett fel där visar sig som ett tydligt felmeddelande vid `create function` — klistra in det
  så rättar jag.
- **`apply_mutations` är den del som mest sannolikt behöver revideras** när utkorgen byggs i
  fas 7. Den är `create or replace`, så det kostar ingenting.
- Om en lokal notis håller i tre minuter — **uppgift 0.8**, fortfarande öppen, blockerar
  endast uppgift 6.6.

## 5. Kända fel

- **`npm audit`: 5 high severity.** Alla är samma transitiva kedja:
  `eslint → @eslint/config-array → minimatch → brace-expansion` (DoS via obegränsad
  expansion). **Endast devDependency** — eslint följer aldrig med i produktionsbygget, så
  inget av detta når en användare. `npm audit fix --force` vill installera eslint 10, en
  brytande major. Bedömning: vänta tills eslint släpper en patch, eller tills vi ändå
  uppgraderar. Inte tyst ignorerat — noterat här så beslutet går att ompröva.
- Ingen Docker i utvecklingsmiljön, se avsnitt 4.

---

## 6. Nästa steg

**Adam kör migrationen.** Öppna `supabase/migrations/0001_initial_schema.sql`, markera allt,
klistra in i Supabase SQL Editor, kör.

Filen är idempotent — den går att köra om utan att något dubbleras. Den avslutas med ett
självkontrollblock som **kastar** om RLS saknas på någon tabell, om någon tabell saknar
policy, eller om övningskatalogen har färre än 30 rader. Vid framgång skriver den:

```
OK. RLS aktiverat och policyer på plats för 6 tabeller.
OK. Övningskatalogen innehåller 45 globala övningar.
```

Kommer något annat ut — klistra in det.

**Därefter, kvar i fas 2:**
- **2.17 Negativt åtkomsttest.** Två testanvändare; B ska få **noll rader, inte ett fel** när
  hen försöker läsa A:s set. Skrivs som ett körbart skript i `scripts/`.
- **2.18 `get_advisors` i security-läge** — ska komma tillbaka utan RLS-varningar.

🚧 **Grind 2 måste passeras innan fas 5 och 7 rör databasen.**

**Sedan fas 3** (PWA-skalet) eller **fas 4** (parsern, testdriven). Fas 4 är helt oberoende av
Supabase och kan köras parallellt med att grind 2 stängs.

**Uppgift 0.8** kan göras när som helst före fas 6. Instruktionen står kvar i föregående
handoff-version i git-historiken, och i `PLAN.md` §2.6.
