# Överlämning (Senaste status)

**Datum:** 2026-07-30

**Aktuellt mål:**
Fas 0 är utförd och **grind 1 är öppnad**. Vilotimerns arkitektur vilar nu på mätdata i
stället för antaganden. Nästa steg är fas 1 (projektuppsättning) och fas 2 (Supabase), som
är oberoende av varandra och kan göras i valfri ordning.

---

## Mätresultat från fas 0 (2026-07-30)

iPhone, iOS 18.7, Safari 26.5.2, **installerad PWA på hemskärmen**, fysiska ljudomkopplaren i
**tyst läge**, larm utlöst efter 5 s med appen lagd i bakgrunden. Testsidan publicerad på
`https://gym-app-gold-psi-81.vercel.app/`.

| Kanal | API-utfall | Observerat |
| :---- | :---- | :---- |
| Notis | `permission=granted`, inget fel | ✅ Kom fram i bakgrunden, med systemets eget ljud och vibration trots tyst läge |
| Visuell blink | inget API | ❌ Endast i förgrunden |
| Vibration | `'vibrate' in navigator === false` | ❌ Ingen effekt |
| Ljud (Web Audio) | `running` → **`interrupted`** i bakgrunden | ❌ Endast i förgrunden |

**Vad mätningen avgjorde:**
- **Notisen är den bärande kanalen.** Genom att lämna över återkopplingen till iOS får vi
  ljud och vibration som vi själva inte kan nå.
- **Vibrationsfrågan är stängd.** De motstridiga källorna hade fel; caniuse hade rätt.
  Uppgift 6.7 struken.
- **Ljudlarm är stängt.** `AudioContext` går till `interrupted` när appen bakgrundas — ljud
  kan aldrig bära ett larm som ska höras när appen inte är framme. Uppgift 6.8 struken.
- Visuellt larm behålls, men **endast för förgrundsfallet**.

**En korrigering av slutsatsen som drogs av mätningen:** det som mättes var en **lokal notis**
(`registration.showNotification()` anropad från sidans egen JavaScript), **inte Web Push**.
Skillnaden avgör om appen fungerar i ett gym: Web Push kräver att en server når telefonen i
det ögonblick larmet ska gå, vilket förutsätter nät. Den lokala notisen har inget nätberoende
alls. **Web Push ska aldrig byggas i den här appen.** Detta står nu utskrivet i `PLAN.md` §2.6
så att det inte kan glida tillbaka.

**Kvarvarande mätning — uppgift 0.8, blockerar endast uppgift 6.6:** mätningen använde
5 sekunders fördröjning, men en vilotid är 2–5 minuter. Notisen utlöstes av en `setTimeout` i
sidans JavaScript, och iOS fryser bakgrundade webbsidors JavaScript efter en kort stund. Fem
sekunder hann sannolikt inom nådatiden; tre minuter kanske inte gör det. Misslyckas det syns
det inte som tystnad utan som att notisen kommer i samma sekund som appen öppnas igen — vilket
är värre än inget larm, eftersom det ser ut att fungera. `TimestampTrigger` finns inte i
Safari, så vi har ingen given reservplan. Testet: lägg till `180000` som fjärde alternativ i
fördröjningsväljaren, deploya om, lås telefonen i tre minuter.

---

**Vad som faktiskt har ändrats denna omgång:**
- `docs/PLAN.md` §2.6 — varningsrutan ersatt med mättabell och beslutad arkitektur. Ny
  utskriven skillnad mellan lokal notis och Web Push. Ny öppen fråga om 3-minutersgränsen.
- `docs/PLAN.md` §3.3 — nytt stycke om **publishable/secret**-nycklarna som ersätter
  `anon`/`service_role`. Vi bygger på den nya modellen från dag ett.
- `docs/PLAN.md` §7.2 — egress rättad från 10 GB till **5 GB** enligt kvottabellen (de två
  Supabase-sidorna anger olika; kvottabellen är den som gäller för fakturering). Tillagt:
  500 000 Edge Function-anrop/mån, 50 000 MAU, och **två gratisprojekt totalt**.
- `docs/TASKS.md` — 0.1–0.7 avbockade, **grind 1 öppnad**, 0.8 tillagd, 6.7 och 6.8 strukna
  med hänvisning till mätningen, 6.6 omskriven till lokal notis med förgrundsvillkor.
  Nyckelnamn uppdaterade i 1.6, 2.1, 7.1 och 8.4.
- Ingen kod ändrad. `test/` orörd sedan förra commiten.

**Vad som faktiskt har verifierats (Bevis):**
- *Fas 0-mätningen ovan* — utförd på riktig hårdvara, rådata inklistrad av Adam.
- *Supabase gratisnivå.* Verifierat mot Supabase dokumentation: read-only vid 500 MB
  databasstorlek, 5 GB egress, 500 000 Edge Function-anrop, 50 000 MAU, **två aktiva
  gratisprojekt totalt räknat över alla organisationer där man är ägare eller admin**
  (pausade projekt räknas inte), pausning efter 7 dagars låg aktivitet.
- *Nyckelmodellen.* Verifierat mot Supabase migreringsguide: `anon` → publishable
  (`sb_publishable_…`), `service_role` → secret (`sb_secret_…`). Legacy-nycklarna fungerar
  till utgången av 2026. De nya är inte JWT:er och skickas i `apikey`-headern; Edge Functions
  behöver `verify_jwt = false` och egen auktorisering, eller `@supabase/server`-SDK:n med
  `withSupabase({ auth: 'user' })`.
- *MCP på Edge Functions saknar autentiseringsstöd* — se tidigare handoff, oförändrat.
- *RLS: `(select auth.uid())` utvärderas en gång per query* — oförändrat.

**Kända fel / Misslyckade försök:**
- `gh` finns inte i PATH i den här miljön. `git clone` över HTTPS fungerade.
- Testsidan gick inte att rendera i den här miljöns webbläsarpanel (localhost blockeras,
  `file://` visas som stillbild). Verifieringen före publicering var därför syntaktisk.
  Den blev i praktiken verifierad av att mätningen gick att genomföra.

**Vad som INTE är verifierat (och inte får antas):**
- **Om en lokal notis håller i tre minuter.** Uppgift 0.8. Enda kvarvarande blockeraren för 6.6.
- Att notisen fortsätter komma fram med Fokus-lägen aktiva. Mätningen gjordes i normalläge.
- Storleksräkningen i §7.3 (~2,5 MB/år) är en uppskattning, inte en mätning.
- Exakta kvotgränser hos Groq och Gemini. Fastställs i uppgift 8.1–8.2.
- Ingen appkod finns, inget Supabase-projekt är skapat.

**Öppna beslut som väntar på Adam:**
1. `effort` som ett fält (`effort_type` + `effort_value`) eller två kolumner? Planen använder
   ett fält — säg till före uppgift 2.6 om du vill ha det annorlunda.
2. Övningskatalogen: jag genererar 30–50 övningar med svenska och engelska alias inför
   uppgift 2.16 om inget annat sägs.

**Nästa steg:**
1. **Fas 1** (uppgift 1.1–1.7): Vite, Tailwind, TypeScript, Vitest, mappstruktur. Ren
   verktygsuppsättning, cirka 20 minuter, inga beslut.
2. **Fas 2** (uppgift 2.1–2.18): Supabase-projekt, migrationer, RLS. Kräver att Adam skapar
   projektet och kör `supabase login`. Grind 2 — negativt åtkomsttest och `get_advisors` utan
   RLS-varningar — måste passeras innan någon kod skriver till databasen.
3. **Uppgift 0.8** kan göras när som helst före fas 6. Den blockerar ingenting annat.
