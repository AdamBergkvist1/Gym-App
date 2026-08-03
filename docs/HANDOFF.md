# Överlämning (Senaste status)

**Datum:** 2026-08-03

**Aktuellt läge:**
Fas 0–11A är klara. **Appen är deployad och används.** Kvar: fas 11B (designrundan),
uppgift 10.5 (städa dubbla Vercel-projekt) samt några småuppgifter.

> **Denna fil skrevs om 2026-08-03 efter en genomgång av dokumentation mot verklighet.**
> Se §0. Föregående version var daterad 2026-07-31, påstod att fas 10 var ogjord, och
> upprepade samma stycke tre gånger i rad.

---

## 0. Genomgången 2026-08-03 — vad som var fel

Adam bad om en kontroll av att repot och dokumentationen stämmer med verkligheten. Den
gjordes, och den hittade saker. **Alla punkter nedan är mätta, inte resonerade.**

### 0.1 Fas 10 var gjord men bokförd som ogjord

`TASKS.md` hade hela fas 10 obockad. Verkligheten: **30 deployments** på GitHub, senaste
från dagens commit. 10.1 och 10.2 var klara sedan tidigare.

**Hur 10.2 kunde verifieras utan tillgång till Vercels panel:** produktionsappen visar
synkstatus **"Inte inloggad"**. En lokal körning utan `.env` visar i stället **"Endast
lokalt"** och loggar *"Supabase är inte konfigurerat"*. Miljövariablerna finns alltså i
hostingen. (Det finns ingen `.env` lokalt — därför kör dev-servern helt utan Supabase.)

**Varför det spelade roll:** en plan som påstår att gjort arbete är ogjort får nästa
session att bygga om något som redan fungerar.

### 0.2 🚩 Två Vercel-projekt mot samma repo — ett serverar fel sida

| Projekt | Adress | Innehåll |
|---|---|---|
| `adam-gym-app` | **https://adam-gym-app.vercel.app** | ✅ Appen |
| `gym-app` | `gym-app-gold-psi-81.vercel.app` | ❌ `test/feedback-test.html` — larmtestet från fas 0 |

Fel adress stod som repots `homepageUrl` på GitHub. **Rättad 2026-08-03.**

**Varför det inte är kosmetiskt:** installeras PWA:n från fel adress hamnar larmtestet på
hemskärmen och det ser ut som att appen är trasig. Två produktionsadresser ger dessutom
**två servicearbetare och två separata IndexedDB-lagringar** — ett pass loggat i fel flik
hamnar i en databas man sedan inte hittar. Samma sorts tysta fel som 11A.10.

Åtgärd ligger som **uppgift 10.5** och kräver Adam, eftersom Vercels panel inte går att nå
härifrån.

### 0.3 Advisorns `rls_auto_enable` — nu mätt, inte antagen

Tidigare överlämningar avfärdade varningen som "medveten". Det räckte inte som underlag, så
den testades:

```
BLOCKERAT AV POSTGRES: trigger functions can only be called as triggers
```

Funktionen returnerar `event_trigger` och **går inte att anropa via RPC**, oavsett vilka
EXECUTE-rättigheter `anon` har. Resonemanget i migration `0002` var alltså korrekt hela
tiden — men det var ett resonemang, och nu är det en mätning. Varningen är en falsk positiv.

### 0.4 Migration 0003 ÄR körd i produktion

Föregående överlämning varnade i fetstil att den måste köras. Verifierat på två sätt:
`apply_mutations` innehåller `ai_parse_log`-grenen, och tabellen har **2 rader** — data har
alltså tagit sig hela vägen genom synkvägen. Varningen är inte längre aktuell och är borttagen.

`list_migrations` returnerar tom lista: migrationerna kördes manuellt i SQL-editorn, inte
via CLI:n. Det är inget fel, men det betyder att **migrationsfilerna i repot inte automatiskt
speglar databasen** — de måste jämföras för hand.

### 0.5 Siffror som var inaktuella

| Påstående | Verkligt värde |
|---|---|
| "234 tester" | **237** (18 filer), plus 12 Playwright |
| "614 kB precache" | **642,67 KiB precache**, bundle 631,54 kB rå / **189,86 kB gzip** |
| "5 high i npm audit" | **0 sårbarheter** |

---

## 1. Databasen — verifierad 2026-08-03

| Tabell | Rader | RLS |
|---|---|---|
| `profiles` | 2 | ✅ |
| `exercises` | 45 | ✅ |
| `workouts` | 6 | ✅ |
| `logged_sets` | 12 | ✅ |
| `sync_mutations` | 28 | ✅ |
| `ai_parse_log` | 2 | ✅ |

`apply_mutations` är SECURITY INVOKER och `anon` saknar EXECUTE — bara `authenticated` kan
köra den. Det är migration `0002` som håller.

---

## 2. Vilotimern — frågan är AVGJORD

Full analys i `PLAN.md` §2.6.1. Slutsatsen: **notisen når inte fram i bakgrunden** — men
inte av det skäl någon av oss antog.

Mätdata: två larm på 180 s, appen stängd. `wasHidden: ja`, `firedOnResume: nej`, fel +11 s
och +20 s. Adam fick ingen notis förrän han öppnade appen, båda gångerna.

**Vad det betyder:** `wasHidden: ja` med bara 11–20 sekunders fel bevisar att sidans
JavaScript **körde i bakgrunden** — iOS strypte intervallet men frös det inte, och
`showNotification()` anropades och lyckades. Ändå syntes ingen notis. Alltså: iOS **skapade**
notisen men **presenterade** den inte förrän appen kom i förgrunden.

**Mätningen mätte fel sak.** Diagnostiken loggade när vi *anropade* `showNotification()`,
inte när iOS *visade* den. `firedOnResume` svarade "nej" på en fråga den inte mätte. Det var
den mänskliga observationen som avgjorde.

**Lärdomen är värd att behålla:** när en mätning och en användares upplevelse säger emot
varandra är det inte självklart att mätningen har rätt. Kontrollera först att den mäter det
man tror. *(Samma lärdom gäller dokumentation — se §0.)*

**Följd:** Wake Lock bär vilan i dag.

> **NYTT 2026-08-03 — ntfy gör om förutsättningen.** Web Push avfärdades för att den kräver
> nät i det ögonblick larmet går. Adam har bekräftat att han **alltid har wifi eller mobilnät
> på gymmet**, vilket river den invändningen. ntfy stöder dessutom **fördröjd leverans
> server-side**: appen skickar begäran när setet loggas — då är den framme — och ntfy:s
> server levererar när vilan tar slut. Telefonens JavaScript behöver aldrig köra i bakgrunden.
> ntfy har en native iOS-app, så notisen presenteras som en riktig notis.
> **Adopterad, ej byggd.** Analys i `ai-workbench`.

---

## 3. Fas 8 — AI-reserven

Hela pipelinen är byggd och testad. Modellen får katalogen, senaste utförandet per övning,
typiskt viktspann, bästa e1RM och det pågående passets set. Payloaden är begränsad till de
12 senast tränade övningarna, med ett test som vaktar under 20 000 tecken.

**Valideringen behandlas som säkerhet, inte finputs.** Det farligaste felläget är ett
**påhittat övnings-id** som ser ut som ett UUID: utan kontrollen mot katalogen hade setet
skrivits mot en övning som inte finns, och främmandenyckeln hade fällt hela synkbatchen
långt senare med ett felmeddelande långt från orsaken. Förvalet är **låg konfidens**.

**AI:n träder in först när den lokala grammatiken sagt ifrån.** Aldrig i förväg, aldrig
medan man skriver, aldrig i bakgrunden.

**Att `ai_parse_log` har 2 rader tyder på att AI-vägen faktiskt körts skarpt.** Om Edge
Function-deployen och nycklarna är satta är inte verifierat härifrån — se §5.

---

## 4. Fas 11A — touch-först

Klar. Setraden är byggd som en tabell efter referensbilderna i `docs/Reference-pics/`:
`Set | Förra | Kg | Reps | ✓`, rubriker en gång. Rullhjul via `SetAdjustSheet` med ett hjul
per siffra. Breddbudget uträknad för iPhone SE: 317 px tillgängligt, 164 px fasta kolumner.

**Två buggar som kostade och som nu är mekaniskt bevakade:**
- **11A.8** setraden klipptes av på 375 px
- **11A.12** ombyggd efter referensbilderna

Playwright-vakten (`e2e/no-horizontal-overflow.spec.ts`) kör mot 375 och 390 px i WebKit.
**Vakten är bevisad:** ett injicerat 500 px-element fällde elementtestet på alla tre rutter
medan dokumenttestet förblev grönt — `overflow-x-hidden` i skalet döljer symptomet. Utan
den andra mätningen hade vakten varit grön genom precis de buggar den finns för.

---

## 5. Verifierat 2026-08-03

- **237 vitest-tester** i 18 filer, gröna. **12 Playwright-tester** gröna.
- Typecheck, lint och produktionsbygge gröna.
- `npm audit`: **0 sårbarheter**.
- Produktionsappen renderar (Pass, Historik, Inställningar) och når Supabase.
- Databasen: 6 tabeller, RLS på alla, radantal enligt §1.
- Migration 0003 aktiv i produktion.
- `rls_auto_enable` går inte att anropa via RPC.

## 6. INTE verifierat

- **Historikvyerna och 11A på riktig enhet.** Byggda, enhetstestade och Playwright-testade,
  men inte sedda i Safari på Adams telefon. Playwright är WebKit men inte iOS Safari —
  safe-area, 100vh, scroll-snap-tröghet och standalone-läget beter sig annorlunda.
- **Wake Lock på riktig hårdvara** genom en hel 180-sekundersvila.
- **AI-nycklarna — mätt 2026-08-03, och läget är accepterat.** `ai_parse_log` visar att bara
  **groq** någonsin kört (en gång, 2026-08-02). Gemini har aldrig svarat, alltså saknas den
  nyckeln och **reserven finns inte**. Groq-nyckeln delas med `news-signal-engine`, vilket
  betyder att kvoten kan tömmas åt båda hållen.

  **Uppskjutet med flit** — AI-vägen har körts en enda gång, så risken är i praktiken noll och
  skalar med användning, inte med tid. Villkor och detaljer i `TASKS.md` 8.1–8.2.
  **Föreslå inte fixen igen förrän villkoret är uppfyllt.**

  *(Edge Function-deployen är däremot verifierad: `ai-parse` är **version 2, ACTIVE**,
  uppdaterad 2026-08-03, med `verify_jwt: true` — Supabase avvisar oautentiserade anrop
  innan funktionen ens startar, utöver kontrollen i koden.)*
- **Om 10.3 är gjord** — om appen ligger på Adams hemskärm, och i så fall från vilken av de
  två adresserna. Detta är viktigt: se §0.2.

## 7. Kända avvikelser

- **7.13 bundle.** 631,54 kB rå, **189,86 kB gzip**, 642,67 KiB precache. Supabase-js är
  merparten och behövs bara för synk, aldrig i loggningsvägen. *Notera att tidigare
  överlämningar angav siffran okomprimerad, vilket överdriver problemet — 190 kB över nätet,
  en gång, för en offline-first app är inte akut.*
- **`auth_leaked_password_protection` går INTE att slå på.** Kontrollerat i panelen
  2026-08-03: funktionen är märkt *"Only available on Pro plan and above"*. Tidigare
  överlämning påstod att den "kostar ingenting" — det var fel. Vi kör free tier, och regel 2
  säger gratis före betalt.

  **Advisorns varning kommer alltså stå kvar, och det är ett beslut — inte en försummelse.**
  Kompenserat med gratis åtgärder i stället:
  - `Allow new users to sign up` **avstängd**. Appen har en användare och kontot finns redan.
    Ingen dörr att gissa lösenord mot slår varje lösenordspolicy.
  - `Allow anonymous sign-ins` avstängd.
  - Minsta lösenordslängd höjd 6 → 12. **Teckenklasskrav lämnas medvetet av** — de ger i
    praktiken `Passord1!`, ett mönster angripare räknar med. NIST tog bort dem av det skälet.
    Längd slår sammansättning.
  - `Secure email change`, `Secure password change` och `Require current password` påslagna.
    Den första är den viktigaste: utan den kan en kapad session byta e-post till angriparens
    och ta över kontot permanent.
  - Email-OTP:ns livslängd sänkt 3600 → 900 s.
- **Migrationsfilerna speglas inte automatiskt av databasen** — se §0.4.

---

## 8. Nästa steg

**Adam:**
1. **Ta bort fel Vercel-projekt** (uppgift 10.5). Identifiera efter innehåll, inte namn:
   det som visar *"Gym-App — Återkopplingstest"* ska bort.
2. **Installera appen på hemskärmen från `https://adam-gym-app.vercel.app`** (10.3).
3. Slå på leaked password protection i Supabase-panelen.

**Claude:**
1. **Kodgranskning** — `/code-review` och `/security-review` över hela repot. Var ännu inte
   gjord när denna fil skrevs.
2. **Fas 11B — designrundan.** Börjar med **11B.0a** (informationsarkitektur, hör hemma i
   `SPEC.md`) och **11B.0b** (`docs/DESIGN.md`). Ingen kod förrän briefen är godkänd.

**Kvarvarande småuppgifter:** 6.9 (sparad vilotid per övning), 7.13 (lata-ladda supabase-js),
12.7 (personligt anpassat 1RM i stället för Epley), ntfy för vilotimern.

---

## 9. Regel som föll ut av genomgången

**Dokumentation ska verifieras, inte minnas.** Felen i §0 uppstod inte för att någon
glömde — de uppstod för att påståendena skrevs från *avsikt* och aldrig kontrollerades mot
*verklighet*. Nästa session ser bara den här filen, och tror på den.

Konkret följd: siffror i denna fil (tester, bundle, radantal, deployments) ska mätas om vid
varje överlämning, inte kopieras från föregående version.
