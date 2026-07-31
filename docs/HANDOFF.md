# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
**Appen är funktionellt komplett för ett riktigt pass.** Logga med fritext, spökdata,
vilotimer med larm, och allt hamnar i Supabase. Fas 0–7 klara. Kvar: fas 8 (LLM-reserven),
9 (historik och PB), 10 (deploy), 11 (designpolering).

---

## 1. Synken är verifierad mot den riktiga databasen

Inte bara mot fejkade klienter. Kontrollerat direkt i Postgres:

| | |
| :---- | :---- |
| Pass | 2 |
| Set | 6 |
| Kvitton i `sync_mutations` | 9 |
| Användare | 1 |
| Dubbletter | 0 |
| Set med `source = 'local_parse'` | **6 av 6** |

Den sista raden är den intressanta: **parsern skrev varje set hela vägen** från fritext i
flygplansläge, via utkorgen, genom `apply_mutations`, till Postgres. Kontraktet håller, inte
bara logiken.

---

## 2. Fas 6 — vilotimern

Timern lagras som **sluttidpunkt**, aldrig som nedräknande räknare. Testat att kvarvarande
tid blir rätt även om alla intervall strypts i två minuter; med en räknare hade felet växt
med tiden.

Larmet följer mätningen från fas 0, inte antaganden: **visuellt i förgrunden** (grön yta,
inga behörigheter, kan inte tas ifrån oss av en iOS-uppdatering), **lokal notis i
bakgrunden** (kom fram med iOS eget ljud och vibration trots tyst läge). Vibration och
Web Audio är strukna sedan mätningen.

Wake Lock begärs vid start och **återbegärs vid `visibilitychange`** — låset släpps av
webbläsaren så fort appen tappar fokus.

### 6.6 byggdes trots att 0.8 aldrig kördes

Adam vaskade prerekvisitet med motiveringen att den riktiga timern får bli testet. Det är
rimligt — men bara om smällen går att se. Utan notisen finns dessutom ingenting att testa.

**Mätningen är därför inbyggd i stället för borttagen.** Varje larm loggar hur många sekunder
fel det gick, om appen var dold, och — viktigast — **om larmet utlöstes först när appen kom
tillbaka i förgrunden**. Sammanfattningen visas under Inställningar → Vilotimerns larm och
säger uttryckligen ifrån när underlaget är för tunt, i stället för att visa en siffra som ser
ut som ett resultat.

Det farliga felläget är inte tystnad utan **försening**: kommer notisen i samma sekund som
appen öppnas ser det ut att fungera.

---

## 3. Verifierat

- **116 tester gröna.** Typecheck, lint och produktionsbygge likaså.
- Synken mot riktig Supabase — se avsnitt 1.
- Tidigare: offlinestart och loggningsvägen på iPhone, databasisolering 11 av 11,
  katalogens id:n mot kontrollsummor, parsern 91,3 % grenäckning.

## 4. INTE verifierat

- **Timerns beteende i bakgrunden på riktig hårdvara.** Det är själva mätningen som nu
  pågår. Enhetstesterna bevisar tidsberäkningen, inte att iOS låter den köra.
- Notisbehörigheten behöver beviljas en gång under Inställningar innan bakgrundslarmet kan
  fungera.

## 5. Kända avvikelser

- **7.13:** `@supabase/supabase-js` tog bundlen från 237 till 575 kB (nu 605 kB precache).
  Behövs bara för synk, aldrig i loggningsvägen. Mät om det märks på riktig telefon innan
  refaktorering — 605 kB över hemnät är något annat än över 3G.
- `npm audit`: 5 high i `eslint → minimatch → brace-expansion`. DevDependency.
- `rls_auto_enable` och `auth_leaked_password_protection` i advisorn — båda medvetna.

---

## 6. Nästa steg

**Adam:** deploya, **tillåt notiser** under Inställningar, och träna. Titta i
Inställningar → Vilotimerns larm efter några pass. Står det att larmen kom "på återkomst"
har vi fått vårt svar — och då är rätt åtgärd att låta Wake Lock hålla skärmen tänd och
acceptera att appen ligger framme under vilan, inte att bygga Web Push.

**Claude:** min rekommendation är **fas 9 (historik och PB) före fas 8 (LLM-reserven)**.
Historiken gör appen bättre varje pass; LLM-reserven träder bara in när den lokala parsern
missar, och den missar sällan. Fas 9 ger dessutom e1RM, som fas 11 behöver för att kunna
markera personbästa.

Kvarvarande småuppgifter: **6.9** (justerbar vilotid per övning) och **7.13** (lata-ladda
supabase-js).
