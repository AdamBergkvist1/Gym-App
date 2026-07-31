# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
Fas 0–7 och 9 är klara. **Appen är komplett för verklig användning**: logga, vila, synka,
och nu se historik och personbästa. Kvar: fas 4.13 (trimma parsern), fas 8 (LLM-coachen),
fas 10 (deploy) och fas 11 (designpolering).

---

## 1. Fas 9 — historik och progression

- Passlista med volym, setantal och längd. Pågående pass märks ut.
- Övningsvy på `/ovning/:id` med alla set över tid.
- e1RM enligt Epley som ren funktion.
- PB-kort och en handritad SVG-sparkline.

**Två beslut i matematiken som bär funktionen:**

**e1RM returnerar `null` över 15 reps** i stället för en siffra. Ett estimat räknat på 25
reps ser ut som data men är brus — och brus i en progressionsgraf är värre än en lucka,
eftersom luckan syns och bruset inte gör det. Ett singel returnerar sin egen vikt i stället
för att räknas upp av formeln.

**Tyngsta set och bästa e1RM visas som två skilda rekord.** De är inte samma sak: 90×3 är
tyngre på stången, men 80×8 är den starkare prestationen (e1RM 101,3 mot 99,0). Att slå ihop
dem hade dolt exakt den insikt e1RM finns för att ge.

---

## 2. Två åtaganden som nu står utskrivna

Efter ditt första riktiga pass, inskrivna så att de inte kan glömmas:

**`PLAN.md` §4.0 + uppgift 4.13 — grammatiken måste trimmas.** Parsern klarar `Bänk 90x5`
men inte `80x7 bänk`. Det är inte ett gränsfall utan så folk skriver mitt i ett set, och
varje sådan miss undergräver premissen att fritext ska vara snabbare än att fylla i fält.
Korpusen som ska klaras står i uppgiften, och den byggs testdrivet som resten av fas 4.
Regeln som inte får luckras upp: att stödja omvänd ordning får inte göra `20x30` mindre
tvetydig.

**Fas 8 inleds nu med en ruta som säger att den SKA byggas.** Målet är uttryckligen en
sömlös AI-coach-känsla. Den lokala grammatiken är **golvet** som gör att appen fungerar utan
nät — inte taket. Ny uppgift **8.0**: kontraktet mot `/ai/parse` ska utökas med historik,
för utan den blir fas 8 en andra parser i stället för en coach. Nu när fas 9 är klar finns
inget kvar som motiverar att vänta.

---

## 3. Vilotimern — slutsatsen är inte given än

Mätdata 2026-07-31: två bakgrundslarm på 180 s vilotid, **+11 s och +20 s** försening.

**Din tolkning var att iOS fryser timern. Det stämmer möjligen inte.** En försening på
11–20 sekunder på en 180-sekunderstimer är *liten*. Hade iOS fryst timern helt vore
förseningen lika lång som tiden tills appen råkade öppnas — ofta minuter. 11–20 s tyder
snarare på att iOS **strypte** timern till att vakna med tiotals sekunders mellanrum, alltså
att notisen faktiskt gick i bakgrunden, bara något sen.

**Kolumnen "På återkomst" avgör:**
- `nej` → larmet fungerar. 20 sekunder sent är fullt användbart för en vilotimer, och ingen
  åtgärd behövs alls.
- `ja` → du har rätt, och rätt åtgärd är Wake Lock som håller skärmen tänd under vilan.
  Aldrig Web Push, som kräver nät.

Sammanfattningsraden skriver ut "iOS fryser timern" rakt ut i `ja`-fallet. Du citerade
förseningarna men inte den raden, vilket kan betyda att den inte stod där.

---

## 4. Verifierat

- **137 tester gröna.** Typecheck, lint och produktionsbygge likaså.
- Synken mot riktig Supabase: 2 pass, 6 set, 9 kvitton, noll dubbletter, alla set med
  `source = 'local_parse'`.
- Tidigare: offlinestart och loggning på iPhone, databasisolering 11 av 11, katalogens id:n
  mot kontrollsummor, parsern 91,3 % grenäckning.

## 5. INTE verifierat

- **Historikvyerna på riktig enhet.** Byggda och enhetstestade, men inte sedda i Safari.
- Timerns bakgrundsbeteende — se avsnitt 3.

## 6. Kända avvikelser

- **7.13:** bundlen är 614 kB precache, varav supabase-js är merparten. Behövs bara för
  synk, aldrig i loggningsvägen. Mät på riktig telefon innan refaktorering.
- `npm audit`: 5 high i `eslint → minimatch → brace-expansion`. DevDependency.
- Advisorn: `rls_auto_enable` och `auth_leaked_password_protection` — båda medvetna.

---

## 7. Nästa steg

**Du:** deploya och titta på historiken — datan du synkade upp finns nu i appen. Kolla också
"På återkomst"-kolumnen under Inställningar → Vilotimerns larm.

**Claude:** min rekommendation är **4.13 före fas 8**. Att trimma grammatiken är en dags
arbete och gör den vanligaste inmatningen bättre direkt för varje pass. Fas 8 är större, och
en LLM som får rätta efter en bättre grammatik behöver dessutom rätta färre saker — vilket
gör den både billigare och mer träffsäker.

Kvarvarande småuppgifter: **6.9** (justerbar vilotid per övning), **7.13** (lata-ladda
supabase-js), **fas 10** (deploy-automatik).
