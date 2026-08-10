-- =====================================================================
-- Gym-App — 0005: Chins och Pullups blir två övningar (uppgift 13.2)
--
-- BAKGRUND
-- Knogar bakåt, mot rumpan = överhandsgrepp = Pullups.
-- Knogar framåt, dit ögonen tittar = underhandsgrepp = Chins.
--
-- Katalogen hade dem som EN övning med alias för båda. Det är fel enligt
-- SPEC §5 ("Variant"): en variant som påverkar hur tungt något är är en egen
-- övning, inte ett attribut på setet. Slås de ihop går progressionen inte att
-- läsa — underhandsgrepp är starkare, så en graf över "Chins" beskriver vilket
-- grepp som råkade användas snarare än om man blivit starkare. Adam svarade
-- själv på frågan i `docs/anteckningsformat.md` nr 10: greppet spelar roll.
--
-- TRE SAKER SOM MÅSTE HÅLLAS I TAKT MED `src/db/catalog.ts`
--   1. Chins BEHÅLLER sitt id. Redan loggade set pekar på det, och ett byte
--      hade brutit främmandenyckeln eller — värre — tyst flyttat historik.
--   2. Pullups id:t står SKRIVET här, det genereras inte. Klienten bakar in
--      katalogen med hårdkodade id:n; ett `gen_random_uuid()` här hade gett
--      servern ett annat id än klienten, och synken hade sett två övningar.
--   3. Aliaset `räck` tas bort helt. Det betydde båda greppen, och Adam —
--      svensk och tränande — kände inte igen ordet. `matchExercise` är byggd
--      för att aldrig gissa; ett alias som pekar på två övningar gör den
--      tvetydig med flit.
--
-- 🚩 ORDNINGEN ÄR INTE VALFRI: DEN HÄR FILEN FÖRE DEPLOY.
-- Klienten seedar sin katalog ur bygget, så ett bygge med Pullups i
-- `catalog.ts` ger övningen i väljaren även om servern saknar raden. Loggas
-- ett set på den innan migrationen är körd fäller `logged_sets.exercise_id`
-- sin främmandenyckel, och `push.ts` behandlar det som ett permanent fel:
-- posten markeras `failed` och HELA utkorgen blockeras tills migrationen körts
-- och någon tryckt på försök-igen. Ingenting går förlorat, men allt som loggas
-- därefter stannar på telefonen.
--
-- ⚠️ FILEN GÄLLER DET SKARPA PROJEKTET, INTE EN FÄRSK DATABAS.
-- `0001` seedar katalogen UTAN id:n (`gen_random_uuid()`), så en nyuppsatt
-- databas får 45 andra uuid:n än de `catalog.ts` bakar in. Då hittar `update`
-- nedan ingen Chins och kontrollsummorna kan omöjligt stämma — filen avbryter,
-- vilket är rätt utfall men inte en körbar uppsättningsväg. Att repot och en
-- färsk databas inte kan mötas är ett äldre problem än den här uppgiften
-- (det bor i `0001`:s seed) och löses inte här.
--
-- Filen är idempotent och kan köras om.
-- =====================================================================


-- ALLT LIGGER I ETT ENDA `do`-BLOCK, OCH DET ÄR AVSIKTLIGT.
-- Ett do-block är EN sats. Kastar det avbryts hela satsen och varenda skrivning
-- den hunnit göra rullas tillbaka — oavsett om filen körs i SQL-editorn (som
-- lindar in allt i en transaktion) eller via psql i autocommit (som inte gör
-- det). Med satserna löst efter varandra, som i 0004, hade en röd självkontroll
-- i autocommit lämnat Pullups inlagd men Chins orörd: ett halvt utfört
-- kataloggrepp, vilket är värre än inget.
do $$
declare
  antal        integer;
  id_summa     text;
  namn_summa   text;
  alias_summa  text;
  rack_kvar    integer;
begin

  -- ---------- 1. Chins blir underhandsgrepp ----------
  -- Uppdateras på id, inte på namn: namnet är det enda som skulle kunna ha
  -- ändrats av misstag, och då ska raden inte hittas.
  --
  -- `is_archived`/`is_deleted` nollställs trots att de inte är själva ärendet.
  -- `ensureCatalog` i klienten skriver alltid false för katalograder, så en
  -- arkiverad Chins på servern hade betytt att klient och server visar olika
  -- katalog utan att någon kontrollsumma märkte det — summorna täcker id, namn
  -- och alias, inte flaggorna.
  update public.exercises
  set aliases     = array['chins', 'chin', 'underhandsgrepp'],
      is_archived = false,
      is_deleted  = false
  where id = '9f99d443-53a1-47dd-9509-5bf46fa1322b'
    and owner_id is null;

  -- ---------- 2. Pullups tillkommer ----------
  -- `on conflict (id) do update` gör satsen körbar om. Krockar namnet i stället
  -- för id:t — någon har lagt in en global 'Pullups' med annat id — fäller det
  -- unika indexet exercises_global_name_key körningen med ett tydligt fel. Det
  -- är rätt utfall: två globala rader med samma namn är precis den dubblett
  -- katalogens hårdkodade id:n finns för att förhindra.
  insert into public.exercises (id, owner_id, name, aliases, primary_muscle, equipment)
  values (
    '6b0a5be9-a1db-4373-84cc-5eab1fb0688a',
    null,
    'Pullups',
    array['pullup', 'pull-up', 'pullups', 'överhandsgrepp'],
    'rygg',
    'kroppsvikt'
  )
  on conflict (id) do update set
    name           = excluded.name,
    aliases        = excluded.aliases,
    primary_muscle = excluded.primary_muscle,
    equipment      = excluded.equipment,
    is_archived    = false,
    is_deleted     = false;


  -- ---------- 3. Självkontroll ----------
  -- TILL SKILLNAD FRÅN 0004:s KONTROLL BEVISAR DEN HÄR FAKTISKT SERVERLÄGET.
  --
  -- Kontrollsummorna räknas över HELA den globala katalogen — 44 rader som den
  -- här filen inte rör och som fanns före transaktionen. Stämmer de vet vi inte
  -- bara att filen gjorde det den säger, utan att repot och databasen är
  -- överens om varenda rad. Skiljer de sig avbryts körningen, och det är rätt:
  -- `src/db/catalog.ts` har hårdkodade id:n just för att en glidning annars
  -- blir 46 dubbletter som ingen upptäcker förrän katalogen är obrukbar.
  --
  -- ALIASSUMMAN FINNS FÖR ATT DET ÄR ALIASEN UPPGIFTEN HANDLAR OM. Id och namn
  -- kan stämma perfekt medan en enda alias-rad glidit isär — och parsern är det
  -- enda som märker, tyst, genom att sluta hitta en övning som finns.
  -- Separatorn är `|` och inte `aliases::text`: Postgres citerar arrayer efter
  -- egna regler som JavaScript inte delar, så `{a,b}` mot `["a","b"]` hade
  -- jämfört formatering i stället för innehåll.
  --
  -- `collate "C"` är inte pynt. JavaScript-testet i `catalog.test.ts` sorterar
  -- teckenvis; Postgres standardkollation kan behandla bindestreck som osynliga.
  -- Två sorteringsordningar över samma 46 rader ger två olika md5, och felet
  -- hade sett ut som en trasig katalog i stället för en trasig jämförelse.
  select count(*),
         md5(string_agg(id::text, ',' order by id::text collate "C")),
         md5(string_agg(name,     ',' order by id::text collate "C")),
         md5(string_agg(array_to_string(aliases, '|'), ',' order by id::text collate "C"))
    into antal, id_summa, namn_summa, alias_summa
  from public.exercises
  where owner_id is null;

  if antal <> 46 then
    raise exception 'global katalog har % rader, väntade 46', antal;
  end if;

  if not exists (
    select 1 from public.exercises
    where id = '9f99d443-53a1-47dd-9509-5bf46fa1322b'
      and owner_id is null
      and name = 'Chins'
      and aliases = array['chins', 'chin', 'underhandsgrepp']
      and not is_deleted
      and not is_archived
  ) then
    raise exception 'Chins har fel namn, alias eller flaggor: %',
      coalesce((
        select format('namn=%s alias=%s raderad=%s arkiverad=%s',
                      name, aliases::text, is_deleted, is_archived)
        from public.exercises where id = '9f99d443-53a1-47dd-9509-5bf46fa1322b'
      ), 'raden finns inte');
  end if;

  if not exists (
    select 1 from public.exercises
    where id = '6b0a5be9-a1db-4373-84cc-5eab1fb0688a'
      and owner_id is null
      and name = 'Pullups'
      and aliases = array['pullup', 'pull-up', 'pullups', 'överhandsgrepp']
      and not is_deleted
      and not is_archived
  ) then
    raise exception 'Pullups saknas eller har fel innehåll: %',
      coalesce((
        select format('namn=%s alias=%s raderad=%s arkiverad=%s',
                      name, aliases::text, is_deleted, is_archived)
        from public.exercises where id = '6b0a5be9-a1db-4373-84cc-5eab1fb0688a'
      ), 'raden finns inte');
  end if;

  -- Frågan ställs mot HELA katalogen, inte mot de två rader vi rörde. Ligger
  -- ordet kvar någon annanstans är det fortfarande tvetydigt.
  select count(*) into rack_kvar
  from public.exercises
  where owner_id is null and 'räck' = any (aliases);

  if rack_kvar > 0 then
    raise exception 'aliaset räck lever kvar på % global rad(er)', rack_kvar;
  end if;

  -- Summorna sist: de täcker allt ovanstående och mer, men ett fel i dem säger
  -- inte VAD som skiljer. Kontrollerna före ger det svaret när de kan.
  if id_summa <> 'b4f02d6be5845b47bd3c041257481d2b' then
    raise exception 'id-kontrollsumman är %, väntade b4f02d6be5845b47bd3c041257481d2b — repot och databasen är inte överens', id_summa;
  end if;

  if namn_summa <> '0bdc52d276994df582e7e868568b9b7d' then
    raise exception 'namn-kontrollsumman är %, väntade 0bdc52d276994df582e7e868568b9b7d — repot och databasen är inte överens', namn_summa;
  end if;

  if alias_summa <> 'ce2e0ee411574e4a14111d3131b8be0a' then
    raise exception 'alias-kontrollsumman är %, väntade ce2e0ee411574e4a14111d3131b8be0a — repot och databasen är inte överens', alias_summa;
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. 46 globala övningar. Chins = underhand, Pullups = överhand.';
  raise notice 'Id, namn OCH alias matchar src/db/catalog.ts.';
  raise notice '--------------------------------------------------';
end;
$$;
