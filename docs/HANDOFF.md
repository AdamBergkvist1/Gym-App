# Överlämning (Senaste status)

**Datum:** 2026-07-31

**Aktuellt läge:**
Synkmotorn är byggd och testad — men **inte kopplad till din riktiga databas än**, eftersom
miljövariablerna saknas. Det är det enda som står mellan dig och att träningsdatan hamnar i
säkert förvar. Instruktionen finns i avsnitt 5.

Fas 0–5 och 7 är klara. Fas 6 (vilotimern) och 8 (LLM-reserven) återstår.

---

## 1. Vad som byggdes detta pass

**5.9 — skapa övning från en parsermiss.** Skriver du `Nackpress 60x8` och övningen inte
finns, erbjuder appen nu att skapa den. Parsern lämnar tillbaka `attemptedName` som eget
fält; att plocka namnet ur prosahinten hade fungerat tills någon skrev om formuleringen.

**Fas 7 — synkmotorn.** Utkorgssändare mot `apply_mutations`, markörbaserad hämtning,
inloggning och synkindikator. 16 nya tester, 103 totalt.

**`PLAN.md` §8 + `TASKS.md` fas 11 — designpolering.** På din begäran. Fasen ligger efter
fas 9 med flit: poleras det innan historikvyn och timern finns sätts designspråket av den vy
som råkade byggas först i stället för av helheten. Nio konkreta punkter, plus en lista över
vad fasen INTE ska omfatta — designfaser är notoriskt lätta att låta svälla.

---

## 2. Tre beslut i synken som är värda att förstå

**En misslyckad post hoppas aldrig över.** Posterna bakom kan bero på den — ett set kan inte
skickas innan sitt pass finns. En kö som glatt fortsätter förbi ett fel skapar hål i molndatan
som ingen upptäcker. Kön stoppas i stället och felet syns.

**En trasig batch körs om en post i taget.** `apply_mutations` är atomär, så ett fel fäller
hela batchen — och då vet man bara att "en av 50 rader är fel", vilket inte går att felsöka.
Isoleringen kostar några extra anrop i det sällsynta felfallet och sparar en kväll.

**Hämtningsmarkören flyttas inte när ingenting hämtades.** En tom sida får inte råka hoppa
förbi rader som landar en millisekund senare.

Dessutom: **7.3 håller genom konstruktion, inte genom en kontroll.** Kravet att en utgången
token inte får blockera loggningen är uppfyllt för att beroendet inte finns — `TodayPage`
importerar `db/repo`, aldrig `sync/`. Det finns ingen kodväg från loggning till session att
råka bryta.

---

## 3. Verifierat

- **103 tester gröna.** 16 av dem mot synken, med fejkade klienter: FIFO-ordning,
  övergående kontra permanenta fel, isolering av trasig post, att en misslyckad post inte
  hoppas över, idempotens vid omsändning, och att lokalt vinner över hämtat.
- Typecheck, lint och produktionsbygge gröna.
- Tidigare: offlinestart och hela loggningsvägen verifierade på iPhone, databasens isolering
  bevisad med 11 av 11 kontroller.

## 4. INTE verifierat — läs detta

**Synken har aldrig pratat med din riktiga Supabase.** Alla 16 tester går mot fejkade
klienter. Det bevisar **logiken** men säger ingenting om **kontraktet** mot den riktiga
`apply_mutations` — fältnamn, typer, hur PostgREST formulerar sina fel. Det är uppgift 7.12
och kräver dig.

Övrigt oprövat: uppgift **0.8** (om en lokal notis håller i tre minuter, blockerar 6.6).

## 5. Vad du behöver göra — enda som blockerar

Synken är avstängd tills miljövariablerna finns. Utan dem loggar appen som vanligt, helt
lokalt, och visar "Endast lokalt" som synkstatus.

**Lokalt:** skapa `.env` i reporoten (den är gitignorerad):

```
VITE_SUPABASE_URL=https://oyccchcleypfuyuqmueq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**I Vercel:** samma två variabler under Settings → Environment Variables, sedan en ny deploy.
Variabler med `VITE_`-prefix bakas in vid bygget — en befintlig deploy plockar inte upp dem.

> Endast **publishable**-nyckeln. Secret-nyckeln kringgår RLS helt och får aldrig i en
> `VITE_`-variabel, eftersom allt med det prefixet hamnar i det publika bygget.

**Sedan, uppgift 7.12:** logga in under Inställningar, logga ett pass i flygplansläge, slå på
nätet och kontrollera att passet dyker upp i Supabase Table Editor. Ändra sedan något direkt
i Table Editor och se att det kommer ner i appen.

## 6. Kända avvikelser

- **7.13, mätt inte åtgärdat:** `@supabase/supabase-js` tog huvudbundlen från **237 kB till
  575 kB**. Biblioteket behövs bara för synk, aldrig i loggningsvägen, så det borde inte
  ligga i det som precachas för offlinestart. Att lata-ladda det gör `getSupabase()` asynkron
  och ripplar genom fyra moduler — **mät om det märks på riktig telefon först**.
- `npm audit`: 5 high i `eslint → minimatch → brace-expansion`. DevDependency, väntar på patch.
- `rls_auto_enable` och `auth_leaked_password_protection` i advisorn — båda medvetna.

---

## 7. Nästa steg

1. **Du:** miljövariabler + 7.12. Det är först då datan faktiskt är i säkert förvar.
2. **Claude:** **fas 6, vilotimern.** 6.1–6.5 går att bygga nu; 6.6 (notisen) väntar på 0.8.
3. Därefter fas 8 (LLM-reserven) eller fas 9 (historik och PB).

Fas 9 före fas 8 är förmodligen rätt: historiken gör appen mer användbar för dig varje pass,
medan LLM-reserven bara träder in när den lokala parsern missar — och den missar sällan.
