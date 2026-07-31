# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
Migrationen är körd, **fas 4 (parsern) är klar och grind 3 öppen**. Kvar innan grind 2
stänger: två saker som bara Adam kan göra — köra 0002 och köra det negativa åtkomsttestet.

---

## 1. Vad som hände detta pass

- **Fas 1** klar och verifierad (Vite 7, React 19, strikt TS, Tailwind 4, Vitest, ESLint).
- **Migrationen 0001 körd av Adam** utan fel. Projekt `Gym-App`, ref `oyccchcleypfuyuqmueq`,
  eu-north-1, Postgres 17.6.
- **Uppgift 2.18 körd** — och rapporten kom **inte** tillbaka ren. Se avsnitt 2.
- **Fas 4 klar**: 59 tester gröna, 91,3 % grenäckning på `src/parser/`.

---

## 2. Fyndet: advisorn hittade ett hål jag själv införde

`get_advisors` gav fyra varningar av typen "SECURITY DEFINER-funktion körbar av
anon/authenticated".

**Rotorsak:** Postgres ger `EXECUTE` på nya funktioner till `PUBLIC` som standard. Det är
alltså inte Supabase som öppnar dem. I 0001 revokerade jag detta för `apply_mutations` men
glömde `handle_new_user`, `set_updated_at` och `jsonb_to_text_array`.

**Storleken på felet, ärligt:** den praktiska risken var **låg**. Triggerfunktioner
returnerar `trigger` och kan inte anropas via RPC över huvud taget. Det var ett onödigt
beviljande, inte en öppen dörr. Men en advisor-rapport som innehåller brus man vant sig vid
att ignorera är värdelös, och stängningen kostar ingenting.

**Åtgärd:** `supabase/migrations/0002_revoke_function_execute.sql`. Den innehåller en rad som
inte får utelämnas: `grant execute on function jsonb_to_text_array to authenticated`.
`apply_mutations` är SECURITY INVOKER och körs med anroparens rättigheter — utan den raden
slutar varje synkbatch som innehåller en egen övning att fungera.

**`rls_auto_enable` lämnas orörd.** Den är Supabases egen, skapad av Adams Auto-RLS-
inställning, och returnerar `event_trigger` — den går inte att anropa via RPC.
Advisorvarningen för den är en falsk positiv. Att revokera på plattformsägda objekt riskerar
att gå sönder vid nästa uppdatering utan att vinna något.

### Vad som mättes i stället för antogs

Frågan "slutar triggrarna fungera om `authenticated` tappar EXECUTE?" avgjordes i en
transaktion som rullades tillbaka, med rollen satt till `authenticated`: `updated_at`
bumpades korrekt **både med och utan** revoke. Postgres kontrollerar EXECUTE när en trigger
*skapas*, inte varje gång den avfyras.

Första mätförsöket gav fel svar (`bumpad = false`) och såg ut att bevisa motsatsen.
Orsaken visade sig vara **Adams Auto-RLS**, som slog på RLS på testtabellerna i samma sekund
de skapades — `authenticated` såg noll rader, så `insert ... select` skrev ingenting. Att
Auto-RLS fungerar är alltså verifierat i förbifarten. Ett artefaktfel som nästan blev en
felaktig slutsats.

---

## 3. Varför grind 2 fortfarande är stängd

Adam läste "Success. No rows returned" som att allt var godkänt. Migrationens
självkontrollblock verifierar tre saker: att RLS är **påslaget**, att varje tabell **har**
minst en policy, och att katalogen har ≥30 rader. Det kan **inte** se om policyerna är
**rätta** — en policy med `using (true)` hade räknats som godkänd.

**Verifierat genom läsning (inga skrivningar):** samtliga 20 policyer är scopade
`to authenticated` och använder `(select auth.uid())`-formen. Ingen `using (true)` någonstans.
Det är en granskning av definitionerna, inte ett bevis för körningsbeteendet.

**Beviset är 2.17**, som mäter det enda som betyder något: att användare B faktiskt får noll
rader. Skriptet finns, testet är inte kört.

---

## 4. Verifierat (bevis)

- **Fas 1:** typecheck, lint, build — gröna.
- **Fas 4:** 59 tester gröna. Röd→grön-övergången är två separata commits (`361dd9a` röd,
  `5759769` grön), så TDD-ordningen går att granska i historiken. Täckning `src/parser/`
  91,3 % grenar / 99 % satser.
- **Migrationerna:** parsade med PostgreSQL:s egen parser (`libpg-query`) — 0001 88 satser,
  0002 5 satser, inga syntaxfel. 0001 dessutom körd skarpt av Adam.
- **Policydefinitionerna:** lästa direkt ur `pg_policies` i det körande projektet.
- **Triggerbeteendet efter revoke:** mätt i återrullad transaktion, se avsnitt 2.

## 5. INTE verifierat

- **2.17 är inte kört.** Kräver två testanvändare.
- **0002 är inte kört.** Skriven och parsad, inte applicerad.
- **PL/pgSQL-kropparna i 0002** är granskade för hand, inte maskinellt — samma begränsning
  som för 0001 (den yttre parsern ser en funktionskropp som en stränglitteral).
- **Uppgift 0.8** — om en lokal notis håller i tre minuter. Blockerar endast 6.6.
- `apply_mutations` är fortfarande oprövad mot riktig trafik. Den revideras sannolikt i fas 7.

## 6. Kända fel

- `npm audit`: 5 high, alla i kedjan `eslint → minimatch → brace-expansion`. **Beslut taget
  2026-07-31: vi väntar på patchen.** Endast devDependency, når aldrig ett produktionsbygge.
- Gym-App ligger i **samma Supabase-organisation** som `news-signal-engine`. Ingen åtgärd,
  men Fair Use-restriktioner gäller organisationen, inte projektet.

---

## 7. Nästa steg

**Adam, två saker:**

1. **Kör `supabase/migrations/0002_revoke_function_execute.sql`** i SQL Editor. Den ska
   skriva `OK. Inga av våra funktioner är öppna för PUBLIC.`
2. **Kör det negativa åtkomsttestet (2.17).** Skapa först två testanvändare i Dashboard →
   Authentication → Users → Add user, med *Auto Confirm User* ikryssat. Kör sedan:

   ```
   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... \
   TEST_A_EMAIL=... TEST_A_PASSWORD=... \
   TEST_B_EMAIL=... TEST_B_PASSWORD=... \
   node scripts/rls-negative-test.mjs
   ```

   Skriptet gör 10 kontroller och ska sluta med `GODKÄNT: 10 av 10 kontroller`. Blir något
   underkänt är grind 2 kvar stängd och skriptet säger vad som gick fel.

**Därefter kan Claude ta:**
- **Fas 3** (PWA-skalet) — oberoende av Supabase, kan göras när som helst.
- **Fas 5** (loggning mot Dexie) — kräver inte heller Supabase, bara grind 3 som nu är öppen.
- **Fas 7** (synk) kräver att grind 2 är stängd.
