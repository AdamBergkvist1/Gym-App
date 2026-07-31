# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
**Grind 1, 2 och 3 är alla passerade.** Fas 0, 1, 2, 3 och 4 är klara. Databasen är bevisat
isolerad, parsern är testad, och PWA-skalet står. Nästa naturliga steg är **fas 5** —
loggningsvägen mot Dexie, som är det första som ger appen ett faktiskt värde.

---

## 1. Grind 2 — stängd, med bevis

| Uppgift | Utfall |
| :---- | :---- |
| 2.17 negativt åtkomsttest | **11 av 11 kontroller godkända** med två riktiga auth-användare |
| 2.18 `get_advisors` | Kört. Hittade fyra varningar → 0002 |
| 2.19 `0002`-migrationen | Kört och verifierad mot `pg_proc` |
| Policygranskning | Alla 20 policyer lästa ur `pg_policies`: scopade `to authenticated`, `(select auth.uid())`-formen, ingen `using (true)` |

Efter 0002 har `handle_new_user` och `set_updated_at` bara `postgres=X/postgres`, och
`jsonb_to_text_array` behöll `authenticated=X/postgres` — den raden är den enda i 0002 som
hade brutit något om den utelämnats, eftersom `apply_mutations` är SECURITY INVOKER.

**Kvarvarande advisorvarningar, med avsikt:**
- `rls_auto_enable` × 2 — Supabases egen funktion, returnerar `event_trigger` och går inte
  att anropa via RPC. Falsk positiv. Plattformsägda objekt lämnas orörda.
- **`auth_leaked_password_protection` — NY, och värd att åtgärda.** Uppgift 2.20. Varningen
  dök upp först när auth-användarna skapades, eftersom lintet slår till när Auth används.
  Supabase kan kontrollera lösenord mot HaveIBeenPwned. Planen bygger på e-post + lösenord,
  så det är en relevant och gratis skärpning. Dashboard → Authentication → Password
  protection.

---

## 2. Fas 3 — PWA-skalet

Klart utom slutverifieringen. Vad som finns:

- `vite-plugin-pwa` i **prompt-läge**, 9 precachade poster, inga dubbletter.
- Genererat manifest: standalone, portrait, mörka färger, ikoner i 192/512 plus en
  **maskable**-variant skalad till 62 % så att motivet överlever beskärning till cirkel.
- `react-router` med tre rutter — Pass, Historik, Inställningar — och ett appskal med
  bottennavigering som är padd­ad med `env(safe-area-inset-bottom)`.
- `navigator.storage.persist()` vid start, med utfallet synligt under Inställningar.
- Uppdateringsnotis: diskret rad, ingen blockerande dialog.

**Tre beslut som bär vikt och därför har kommentarer i koden:**

1. **Ingen `runtimeCaching` alls.** Supabase-anrop får aldrig cachas av servicearbetaren.
   Synken (fas 7) äger sin egen köhantering, och en cachad databasrespons skulle visa gammal
   data som om den vore färsk — precis den sortens tysta fel projektet är byggt för att undvika.
2. **Ikonansvaret är uppdelat** mellan plugin-et och `includeAssets`, och png saknas i
   `globPatterns`. Med båda vägarna hamnade varje ikon **två gånger** i precache-manifestet.
   Det gick bra så länge revisionerna var identiska — men två poster för samma URL med olika
   revision får workbox att faila vid install, och då startar appen inte offline alls.
   Upptäckt genom att inspektera det genererade `sw.js`, inte genom att anta.
3. **"Byt aldrig app mitt i ett pass" är löst strukturellt.** Prompt-läget aktiverar aldrig
   en ny servicearbetare utan ett knapptryck. Det finns därför ingen kodväg som kan göra det,
   och inget passtillstånd att hålla reda på.

---

## 3. Verifierat (bevis)

- **Fas 3:** produktionsbygge genererar `dist/sw.js`; precache-manifestet inspekterat post
  för post — app-skalet finns med, `navigateFallback` pekar på `index.html`, noll dubbletter.
- **Fas 4:** 59 tester gröna. Röd→grön syns som två commits (`361dd9a` → `5759769`).
  Grenäckning `src/parser/` 91,3 %.
- **Databasen:** se avsnitt 1. Allt läst direkt ur det körande projektet.
- **Verktygskedjan:** `npm run typecheck`, `npm run lint`, `npm test` gröna. Bygge
  237 kB JS / 76 kB gzip.

## 4. INTE verifierat

- **3.7 offlinestart.** Förutsättningarna är på plats och inspekterade, men appen har inte
  startats utan nät. Det är ett test på enhet, inte i en byggkedja.
- **0.8** — om en lokal notis håller i tre minuter. Blockerar endast 6.6.
- `apply_mutations` är oprövad mot riktig trafik. Revideras sannolikt i fas 7.
- PL/pgSQL-kropparna i migrationerna är granskade för hand, inte maskinellt. Båda filerna är
  dock körda skarpt utan fel, vilket i praktiken täcker det.

## 5. Kända fel

- `npm audit`: 5 high i kedjan `eslint → minimatch → brace-expansion`. Beslut 2026-07-31:
  vi väntar på patchen. DevDependency, når aldrig produktionsbygget.
- Gym-App ligger i samma Supabase-organisation som `news-signal-engine`. Fair Use-
  restriktioner gäller organisationen. Noterat, inte ett problem i dagens storlek.

---

## 6. Nästa steg

**Adam, tre saker — alla små:**

1. **Slå på Leaked Password Protection** (uppgift 2.20). En toggle.
2. **Deploya och verifiera offlinestart** (3.7): installera på hemskärmen, flygplansläge,
   starta appen. Nu finns det äntligen något att titta på.
3. **Uppgift 0.8** när det passar — tremminuterstestet för notisen. Blockerar bara 6.6.

**Claude tar sedan fas 5** (uppgift 5.1–5.10): Dexie-schemat, `logSet()` med utkorgspost i
samma transaktion, spökdata via det sammansatta indexet, vyn för aktivt pass, och
inkopplingen av parsern som redan är klar. Efter fas 5 går det att logga ett helt pass
offline — och då är appen för första gången användbar på ett gym.
