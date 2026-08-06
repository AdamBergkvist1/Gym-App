# Anteckningsformat — svara innan grillningen

*Fyll i svaren under varje fråga. Spara sedan filen som `docs/anteckningsformat.md` i Gym-App-repot och nämn den när du kör `/grill-with-docs`.*

*Frågorna är hämtade ur dina faktiska anteckningar — varje exempel står ordagrant som du skrev det. Vet du inte, skriv "vet inte" så tar grillningen den.*

---

## A. Notation

**1.** `Bänkpress: 70 kg * 5. V 47`
Betyder det ett set på 5 reps med 70 kg? Eller är det ditt bästa set den veckan, av flera du gjorde?

Svar: Det var när ag skulle utvecklas varje vecka och logga vad jag gjorde för skolan. Länge sedan. Minnns inte vad det var exakt men tror det var mitt bästa den veckan.

**2.** Ibland skriver du `70 kg`, ibland `70kg`. Betyder mellanslaget något, eller är det samma sak?

Svar: Samma sak

**3.** `V 47` = vecka 47. Stämmer det, alltid?

Svar: Ja. Kanske skulle behöva lägga till år, minns inte vilket år det var. Kanske går att lägga in automatisk sådan funktion när passen väl loggas i appen sen.

**4.** `Hacksquat: 40 kg + lila gummiband * 10. V 50` — men en rad längre ner står `40 kg * lila gummiband * 12. V 20`.
Är den andra ett skrivfel där `+` blev `*`, eller betyder tecknet något annat där?

Svar: inget speciellt, + och * i det fallet är samma sak.

**5.** Gummibandet — gör det övningen lättare eller tyngre?
Och: ska `40 kg + band` jämföras med `40 kg` utan band som samma övning, eller ska de hållas isär?

Svar: Just den haqsquaten är borta på gymmet men det gjorde det lättar när man var längst ner. Borde kanske hållas i sär.

**6.** `Sne bänk (första steget upp): 60 kg * 8`
Är lutningen en del av övningens identitet? Alltså: är "sne bänk steg 1" och "sne bänk steg 2" två olika övningar i statistiken, eller samma?

Svar: Alltså man borde nog egentligen ha alternativ med sne bänk i olika grader typ, 15, 30, 45 grader osv. Vet inte vad standarden är för sne bänk om man bara säger så.

---

## B. Vad som räknas

**7.** `70 kg * 8 V 3 (Vetefan hur jag lyckades med det, studsade lite mycket på bröstet kanske)`
Ska ett set du själv tvivlar på räknas som ett giltigt rekord?

Svar: nej kanske inte, om jag skriver att jag tvekar så nog inte

**8.** `Höj till 100 kg nästa och reppa`
Det är en plan, inte ett utfört set. Ska sådana rader ignoreras helt?

Svar: ja

**9.** Parenteserna innehåller olika saker — hur det kändes, varför det gick dåligt, planer framåt.
Ska texten sparas som en anteckning på setet, eller kastas bort?

Svar: kanske som en anteckning. men tänker ändå att vi ska bygga in funktioner i appen där man kan logga extra saker om man vill för en övning eller set under ett pass eller så.

**10.** `2021 Vecka 10: pull ups (knogarna pekar bakåt) 10 riktiga nästan 11`
Vad ska "10 riktiga nästan 11" bli? Och är greppet en del av övningens identitet?

Svar: ja knogar bak eller fram på pulls ups spelar roll. Det borde räknas som 10

**11.** `2021 Vecka 14: Squats: 115`
Ingen enhet, inga reps. Vad ska antas — kg, och ett okänt antal reps? Eller ska raden hoppas över?

Svar: Det ska vara  115 kg. Det var när jag testade 1 rep max. Så det var 1 rep. Om något sådant skrivs så kanske en följd fråga eller alternativ att välja.

---

## C. Tid och årtal

**12.** `70 kg * 5 V 52` följs av `70 kg * 8 V 3`. Årtalen står inte ut någonstans.
Hur ska programmet lista ut vilket år varje V-nummer hör till?

Svar: Vet inte går inte att se då det är mina gamla anteckningar. Som sagt får vi bygga funktion i appen så det loggas automatiskt när man kör passen i appen, borde gå tror jag. Liksom när passet lades till i supabase.

**13.** `70kg * 4 V 12` och `70kg * 5 V 12` — två rader, samma vecka.
Samma pass med två set, eller två olika tillfällen?

Svar: Två olika tillfällen tror jag,minns inte.

**14.** De äldsta raderna har formatet `2021 Vecka 9: Bänk: 70kg` i stället för `V 9`.
Samma sak fast med årtal utskrivet? Och varför saknas reps där — glömde du, eller betyder det något?

Svar: tror det var 1 rep max, och typ att jag skrev upp när jag tog nytt person bästa i bänk.

---

## D. Omfattning

**15.** Ska de dagliga kroppsviktsloggarna parsas i den här omgången, eller bara lyften?

Svar: mm asså det var när jag deffade för att hålla koll på att jag gick ner i vikt. Borde inte sparas för pass utan isf som historik för kontot och personen alltså mig då. för att se utveckling genom tiden kanske.

**16.** `Vikt innan kreatin laddning: 74,4 kg` ligger mitt bland lyften.
Vad ska hända med rader som varken är ett lyft eller hör till en viktlogg?

Svar: kan radera denna, var bara för att minnas då.

---

## E. Vad du vill ha ut

**17.** När parsern är klar — vad ska du kunna se i appen som du inte kan se nu? Skriv en mening.

Svar: Är för kort för att kunna beskriva med en mening. har kört ett gympass idag och testade appen och skrev ner lite saker jag ville ändra / saknade.

**18.** Vad händer när en rad inte går att tolka? Ska den hoppas över tyst, visas som en varning, eller stoppa importen?

Svar: Inte hoppas över tyst. Isf visa en varning, be om kompletterande information eller liknande.
