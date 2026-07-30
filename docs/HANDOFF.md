# Överlämning (Senaste status)

**Datum:** 2026-07-30 (kvällspass avslutat)

**Aktuellt läge:**
SDD-fas 2 (teknisk plan) och 3 (nedbrytning) är klara och godkända. **Fas 0 i `TASKS.md` är
utförd och grind 1 är öppnad.** Vilotimerns arkitektur vilar nu på mätdata från riktig
hårdvara, inte på antaganden. Ingen appkod finns ännu — nästa pass börjar med fas 1.

---

## 1. Vad som är beslutat (allt, samlat)

| Beslut | Datum | Var det står |
| :---- | :---- | :---- |
| Vite + React SPA, **inte** Next.js | 2026-07-30 | `PLAN.md` §2.1 |
| Dexie/IndexedDB som sanning, egen utkorg för synk | 2026-07-30 | §2.4–2.5 |
| **Vercel som enda hosting** — Netlify struket | 2026-07-30 | §7.1 |
| Hela lösningen inom gratisnivåer | 2026-07-30 | §7 |
| Lokal grammatikparser före LLM, **testdriven** | 2026-07-30 | §4.3 |
| Groq primärt, Gemini reserv, **egna nycklar** skilda från `news-signal-engine` | 2026-07-30 | §4.5 |
| MCP utanför inmatningsvägen (spår 2) | 2026-07-30 | §4.2 |
| **Lokal notis som bärande larmkanal** — efter mätning | 2026-07-30 | §2.6 |
| `effort` som **ett** fält: `effort_type` + `effort_value` | 2026-07-30 | §3.1, uppgift 2.6 |
| Övningskatalogen genereras av Claude, 30–50 övningar med alias | 2026-07-30 | uppgift 2.16 |
| Publishable/secret-nycklar från dag ett, inte legacy `anon`/`service_role` | 2026-07-30 | §3.3 |

**Kvarvarande öppen fråga i hela planen: exakt en.** Se avsnitt 3.

---

## 2. Fas 0 — mätresultat (bevis)

iPhone, **iOS 18.7**, Safari 26.5.2, **installerad PWA på hemskärmen**, fysiska
ljudomkopplaren i **tyst läge**, larm utlöst efter 5 s med appen lagd i bakgrunden.
Testsidan: `https://gym-app-gold-psi-81.vercel.app/`

| Kanal | API-utfall | Observerat |
| :---- | :---- | :---- |
| **Notis** | `permission=granted`, `showNotification()` utan fel | ✅ **Kom fram i bakgrunden**, med iOS eget ljud och vibration trots tyst läge |
| Visuell blink | inget API inblandat | ❌ Endast i förgrunden |
| Vibration | `'vibrate' in navigator === false` | ❌ Ingen effekt |
| Ljud (Web Audio) | `running` → **`interrupted`** i bakgrunden | ❌ Endast i förgrunden |

**Vad det avgjorde:**

- **Notisen bär larmet.** Genom att lämna över återkopplingen till operativsystemet får vi
  ljud och vibration som webbplattformen inte ger oss direkt. Det är passets viktigaste insikt.
- **Vibrationsfrågan är stängd.** De motstridiga källorna hade fel, caniuse hade rätt.
  Uppgift 6.7 struken.
- **Ljudlarm är stängt.** `AudioContext` går till `interrupted` när appen bakgrundas. Ljud
  kan aldrig bära ett larm som ska höras när appen inte är framme. Uppgift 6.8 struken.
- Visuellt larm behålls — men **bara för förgrundsfallet**. Ligger appen framme vore en notis
  bara störande.

> **Terminologin är inte utbytbar: det är en LOKAL NOTIS, inte Web Push.**
>
> - **Lokal notis** = sidans egen JavaScript anropar `registration.showNotification()`. Ingen
>   server, inga VAPID-nycklar, ingen prenumeration, **inget nätverk**. Detta är vad som mättes.
> - **Web Push** = en server skickar via Apples pushtjänst till servicearbetarens `push`-event.
>   Kräver **nät i det ögonblick larmet ska gå**.
>
> Web Push vore fel i den här appen: premissen är att gymmet saknar täckning. En vilotimer som
> behöver uppkoppling för att ringa är trasig precis där den behövs. **Web Push ska aldrig
> byggas här.**

---

## 3. Den enda öppna frågan: uppgift 0.8

**Håller en lokal notis i tre minuter med appen i bakgrunden?**

Mätningen ovan använde **5 sekunders** fördröjning. En vilotid är 2–5 minuter. Notisen
utlöstes av en `setTimeout` i sidans egen JavaScript, och iOS fryser bakgrundade webbsidors
JavaScript efter en kort stund. Fem sekunder hann sannolikt inom nådatiden. Tre minuter
kanske inte gör det.

**Felläget är lömskt:** misslyckas det märks det inte som tystnad, utan som att notisen kommer
i samma sekund som appen öppnas igen. Det ser ut att fungera. `TimestampTrigger` /
Notification Triggers API, som skulle låta operativsystemet hålla i schemaläggningen, finns
bara i Chromium och har aldrig implementerats i Safari — vi har alltså ingen given reservplan.

**Så gör du testet, Adam:**

1. I `test/feedback-test.html`, sök (Ctrl+F) efter `data-ms="10000"`.
2. Lägg till en fjärde knapp efter den raden:
   `<button type="button" data-ms="180000" aria-pressed="false">3 min</button>`
3. Deploya om (`npx vercel --prod` från `test/`, eller push så bygger Vercel om).
4. Öppna den **installerade appen** på hemskärmen, välj **3 min**, tryck **Notis**, lås
   telefonen och lägg undan den.
5. Notera: kom notisen **efter tre minuter**, eller **först när du öppnade appen igen**?

**Blockerar endast uppgift 6.6.** Fas 1–5 och 7–9 kan byggas oberoende av svaret. Faller det
ut negativt är svaret sannolikt att låta Wake Lock hålla skärmen tänd och acceptera att appen
ligger framme under vilan — inte att bygga Web Push.

---

## 4. Vad som faktiskt finns i repot

- `docs/SPEC.md`, `CLAUDE.md` — orörda sedan Adam skrev dem.
- `docs/PLAN.md` — fullständig teknisk plan, godkänd.
- `docs/TASKS.md` — 12 faser, ~100 uppgifter, tre grindar. Fas 0 avbockad, grind 1 öppen.
- `docs/research/` — orört underlag.
- `test/` — åtta filer. Diagnostikverktyg, **inte** appen. Delar ingen kod med det som ska
  byggas och kan raderas när uppgift 0.8 är gjord.
- **Ingen appkod. Ingen `package.json`. Inget Supabase-projekt.**

---

## 5. Verifierade fakta (bevis, inte antaganden)

- **Fas 0-mätningen** ovan — riktig hårdvara, rådata inklistrad av Adam.
- **MCP på Supabase Edge Functions saknar autentiseringsstöd.** Supabase egen guide "Deploy
  MCP servers" täcker uttryckligen bara oautentiserade servrar och deployar med
  `--no-verify-jwt`. Grunden för att MCP ligger i spår 2.
- **RLS-prestanda.** `(select auth.uid())` utvärderas en gång per query i stället för en gång
  per rad. Index på filterkolumnen och joins-fria policyer är de andra avgörande posterna.
- **Supabase gratisnivå.** Read-only vid 500 MB databasstorlek (disken är 1 GB), 5 GB egress,
  500 000 Edge Function-anrop/mån, 50 000 MAU, **två aktiva gratisprojekt totalt** räknat över
  alla organisationer där man är ägare eller admin (pausade räknas inte), pausning efter
  7 dagars låg aktivitet med varningsmejl ~1 vecka innan och 90 dagars återstartsfönster.
- **Nyckelmodellen.** `anon` → publishable (`sb_publishable_…`), `service_role` → secret
  (`sb_secret_…`). Legacy fungerar till utgången av 2026. De nya är inte JWT:er och skickas i
  `apikey`-headern; Edge Functions behöver `verify_jwt = false` plus egen auktorisering, eller
  `@supabase/server`-SDK:n med `withSupabase({ auth: 'user' })`.

## 6. Vad som INTE är verifierat

- **Om en lokal notis håller i tre minuter.** Uppgift 0.8.
- Om notisen fortsätter komma fram med Fokus-lägen aktiva. Mätningen gjordes i normalläge.
- Storleksräkningen i `PLAN.md` §7.3 (~2,5 MB/år) är en uppskattning från antagna radstorlekar.
  Slutsatsen tål stor felmarginal, men siffran är inte mätt.
- Exakta kvotgränser hos Groq och Gemini. Fastställs i uppgift 8.1–8.2.
- Ingenting i `src/` existerar, så ingenting där är kompilerat eller testat.

---

## 7. Nästa pass

**Claude börjar med fas 1** (uppgift 1.1–1.7): Vite, Tailwind, strikt TypeScript, Vitest,
ESLint, `.env.example`, mappstruktur. Ingen appfunktionalitet, inga beslut — ren
verktygsuppsättning.

**Adam sätter upp Supabase parallellt** (uppgift 2.1). Faserna är oberoende.

1. Skapa projektet i en **egen organisation**, skild från `news-signal-engine`.
2. **Kontrollera först hur många gratisprojekt du redan har** — taket är två totalt över alla
   organisationer där du är ägare eller admin.
3. Välj region i Europa. Latensen mot Postgres syns i synken.
4. **Settings → API Keys** → skapa `sb_publishable_…` och `sb_secret_…`.
5. Spara **databaslösenordet** och **secret-nyckeln** i lösenordshanteraren.

> **Adam behöver inte skicka någon nyckel till Claude.** Migrationerna skrivs som SQL-filer i
> repot och körs av Adam med Supabase CLI. Secret-nyckeln och databaslösenordet ska aldrig i
> chatt, git eller `.env.example`.

**Grind 2 gäller fortfarande:** ingen kod som skriver till Supabase får skrivas förrän det
negativa åtkomsttestet (2.17) och `get_advisors` utan RLS-varningar (2.18) är gröna.

**Groq- och Gemini-nycklar skapas inte än.** Det är fas 8. Oanvända nycklar är bara risk.
