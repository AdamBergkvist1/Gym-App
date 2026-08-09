-- =====================================================================
-- Gym-App — 0004: importerade pass och set (uppgift 13.1)
--
-- BAKGRUND
-- Fas 13 för in Adams gamla pappersanteckningar i appen. Den datan är äkta,
-- men den är inte loggad i appen, och skillnaden måste synas i databasen av
-- två skäl som båda är beteenden, inte kosmetik:
--
--   1. Importerade PASS ska inte ligga i passlistan (13.3). Historiken är en
--      logg över vad som gjorts i appen; 2024 års anteckningar hör hemma i
--      graferna, inte i flödet.
--   2. Importerade SET får aldrig bli spökdata (13.4). Raden
--      "2024 vecka 14: Bänk 90 kg" var ett 1-repsmax. Utan skillnaden viskar
--      appen "sist tog du 90 kg × 1" varje gång bänkpress öppnas — ett rekord
--      är inte ett arbetsset.
--
-- Utan `is_imported` i `apply_mutations` går ett importerat pass inte att
-- synka tillbaka: fältet tappas tyst på vägen upp och passet dyker upp i
-- listan igen på nästa enhet.
--
-- Filen är idempotent och kan köras om.
-- =====================================================================


-- ---------- 1. workouts.is_imported ----------
-- Default false: alla befintliga rader är loggade i appen och alltså inte
-- importerade. `not null` gör att läsvägarna aldrig behöver hantera ett
-- tredje, odefinierat läge.
alter table public.workouts
  add column if not exists is_imported boolean not null default false;


-- ---------- 2. logged_sets.source utökas med 'import' ----------
-- Ett check-villkor går inte att ändra på plats, så det måste släppas och
-- läggas till igen. Villkoret skrevs inline i 0001 och har därför ett namn
-- som Postgres hittade på.
--
-- Namnet GISSAS INTE. Ett `drop constraint if exists logged_sets_source_check`
-- vore tyst verkningslöst om Postgres döpt villkoret till något annat, och då
-- hade det gamla villkoret legat kvar BREDVID det nya och fortsatt förbjuda
-- 'import' — medan självkontrollen längst ned hittade sitt nya villkor och
-- rapporterade OK. Vi släpper i stället utifrån vad villkoret GÖR.
--
-- Mönstret är avsiktligt smalare än "nämner source". Ett framtida sammansatt
-- villkor som råkar nämna source — säg en regel om att importerade set inte
-- får ha rest_seconds — skulle annars släppas här och aldrig återskapas,
-- eftersom vi bara lägger tillbaka ett villkor.
--
-- OBS hur Postgres LAGRAR villkoret. `check (source in ('a','b'))` skrivs om
-- till `CHECK ((source = ANY (ARRAY['a'::text, 'b'::text])))`. Ett mönster som
-- letar efter 'source in (' matchar därför ingenting alls, släpper inget, och
-- lägger sedan sitt nya villkor BREDVID det gamla — precis den bugg det här
-- blocket finns för att undvika. Mönstret nedan täcker båda skrivsätten.
--
-- Ryggtäckningen är självkontrollen längst ned: den frågar brett, på varje
-- villkor som nämner source över huvud taget. Missar mönstret här något
-- avbryter den körningen i stället för att låta två villkor leva sida vid sida.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.logged_sets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* 'source\s*(=\s*any|in)\s*\('
  loop
    execute format('alter table public.logged_sets drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.logged_sets
  add constraint logged_sets_source_check
  check (source in ('manual', 'local_parse', 'ai_parse', 'import'));


-- ---------- 3. apply_mutations måste kunna skriva fältet ----------
-- Hela funktionen upprepas: plpgsql går inte att lappa i delar, och en
-- create or replace ersätter kroppen i sin helhet. Enda skillnaden mot 0003
-- är is_imported i workouts-grenen — märkt NYTT I 0004 nedan.
create or replace function public.apply_mutations(batch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid      uuid := (select auth.uid());
  m        jsonb;
  p        jsonb;
  applied  integer := 0;
  skipped  integer := 0;
begin
  if uid is null then
    raise exception 'apply_mutations kräver en inloggad användare';
  end if;

  if batch is null then
    raise exception 'apply_mutations anropades utan batch';
  end if;

  if jsonb_typeof(batch) <> 'array' then
    raise exception 'batch måste vara en JSON-array, fick %', jsonb_typeof(batch);
  end if;

  for m in select * from jsonb_array_elements(batch) loop
    if m->>'mutation_id' is null then
      raise exception 'mutation saknar mutation_id: %', m;
    end if;

    insert into public.sync_mutations (mutation_id, user_id, kind)
    values ((m->>'mutation_id')::uuid, uid, coalesce(m->>'table', 'okänd'))
    on conflict (mutation_id) do nothing;

    if not found then
      skipped := skipped + 1;
      continue;
    end if;

    p := m->'payload';
    if p is null or jsonb_typeof(p) <> 'object' then
      raise exception 'mutation % saknar giltig payload', m->>'mutation_id';
    end if;

    case m->>'table'

      when 'workouts' then
        insert into public.workouts
          -- NYTT I 0004: is_imported
          (id, user_id, started_at, ended_at, title, note, is_imported, is_deleted)
        values (
          (p->>'id')::uuid, uid,
          (p->>'started_at')::timestamptz,
          (p->>'ended_at')::timestamptz,
          p->>'title', p->>'note',
          -- coalesce, inte ::boolean rakt av: en klient som ännu inte känner
          -- till fältet skickar det inte, och ett sådant pass är per
          -- definition loggat i appen.
          coalesce((p->>'is_imported')::boolean, false),
          coalesce((p->>'is_deleted')::boolean, false)
        )
        on conflict (id) do update set
          started_at  = excluded.started_at,
          ended_at    = excluded.ended_at,
          title       = excluded.title,
          note        = excluded.note,
          is_imported = excluded.is_imported,   -- NYTT I 0004
          is_deleted  = excluded.is_deleted;

      when 'logged_sets' then
        insert into public.logged_sets
          (id, user_id, workout_id, exercise_id, set_index, weight_kg, reps,
           effort_type, effort_value, rest_seconds, note, is_warmup,
           performed_at, source, is_deleted)
        values (
          (p->>'id')::uuid, uid,
          (p->>'workout_id')::uuid,
          (p->>'exercise_id')::uuid,
          (p->>'set_index')::smallint,
          (p->>'weight_kg')::numeric,
          (p->>'reps')::smallint,
          p->>'effort_type',
          (p->>'effort_value')::numeric,
          (p->>'rest_seconds')::integer,
          p->>'note',
          coalesce((p->>'is_warmup')::boolean, false),
          (p->>'performed_at')::timestamptz,
          coalesce(p->>'source', 'manual'),
          coalesce((p->>'is_deleted')::boolean, false)
        )
        on conflict (id) do update set
          workout_id   = excluded.workout_id,
          exercise_id  = excluded.exercise_id,
          set_index    = excluded.set_index,
          weight_kg    = excluded.weight_kg,
          reps         = excluded.reps,
          effort_type  = excluded.effort_type,
          effort_value = excluded.effort_value,
          rest_seconds = excluded.rest_seconds,
          note         = excluded.note,
          is_warmup    = excluded.is_warmup,
          performed_at = excluded.performed_at,
          source       = excluded.source,
          is_deleted   = excluded.is_deleted;

      when 'exercises' then
        insert into public.exercises
          (id, owner_id, name, aliases, primary_muscle, secondary_muscles,
           equipment, is_archived, is_deleted)
        values (
          (p->>'id')::uuid, uid,
          p->>'name',
          public.jsonb_to_text_array(p->'aliases'),
          coalesce(p->>'primary_muscle', 'övrigt'),
          public.jsonb_to_text_array(p->'secondary_muscles'),
          p->>'equipment',
          coalesce((p->>'is_archived')::boolean, false),
          coalesce((p->>'is_deleted')::boolean, false)
        )
        on conflict (id) do update set
          name              = excluded.name,
          aliases           = excluded.aliases,
          primary_muscle    = excluded.primary_muscle,
          secondary_muscles = excluded.secondary_muscles,
          equipment         = excluded.equipment,
          is_archived       = excluded.is_archived,
          is_deleted        = excluded.is_deleted;

      -- Telemetri för fritextparsningen (0003). `user_id` tas som alltid ur
      -- JWT:n, aldrig ur payloaden — även en loggrad tillhör en bestämd
      -- användare.
      when 'ai_parse_log' then
        insert into public.ai_parse_log
          (id, user_id, raw_text, parser, provider, model, parsed, outcome,
           corrected, latency_ms)
        values (
          (p->>'id')::uuid, uid,
          p->>'raw_text',
          coalesce(p->>'parser', 'local'),
          p->>'provider',
          p->>'model',
          coalesce(p->'parsed', '[]'::jsonb),
          coalesce(p->>'outcome', 'rejected'),
          p->'corrected',
          (p->>'latency_ms')::integer
        )
        -- Utfallet uppdateras när användaren bestämt sig, så raden skickas två
        -- gånger: en gång vid försöket och en gång med sitt slutliga utfall.
        on conflict (id) do update set
          outcome    = excluded.outcome,
          corrected  = excluded.corrected,
          latency_ms = excluded.latency_ms,
          provider   = excluded.provider,
          model      = excluded.model;

      else
        raise exception 'okänd tabell i mutation: %', coalesce(m->>'table', '(null)');
    end case;

    applied := applied + 1;
  end loop;

  return jsonb_build_object('applied', applied, 'skipped', skipped);
end;
$$;

revoke all on function public.apply_mutations(jsonb) from public, anon;
grant execute on function public.apply_mutations(jsonb) to authenticated;


-- ---------- Självkontroll ----------
-- VAD DEN HÄR KONTROLLEN ÄR, OCH VAD DEN INTE ÄR.
--
-- Den är ett skydd mot att FILEN skrivs fel — att någon redigerar
-- apply_mutations och tappar is_imported, eller stavar ett fältnamn galet.
-- Den kan i praktiken inte bli röd av att databasen är i fel läge, eftersom
-- allt den inspekterar skapades av satserna ovanför i samma transaktion: hade
-- `add constraint` fallerat vore körningen redan avbruten, och
-- `create or replace function` gör per definition kroppen till det som står i
-- filen. Att den säger OK är alltså inte ett bevis på serverläge.
--
-- Vill man ha det beviset frågar man databasen utifrån efteråt, i en egen
-- session. Frågan står i `docs/TASKS.md` under 13.1.
--
-- En kontroll får heller aldrig kunna bli grön av sin egen kommentar. Första
-- utkastet sökte efter strängen 'is_imported' i funktionsdefinitionen — och
-- kroppen innehåller raden '-- NYTT I 0004: is_imported'. Den hade passerat
-- även om båda de riktiga raderna tagits bort. Därför strippas radkommentarerna
-- först, och därefter krävs två EXAKTA kodfragment, ett per skrivväg.
-- Matchningen är teckenexakt: ändrad indentering eller versalt COALESCE gör den
-- röd utan att något gått sönder. Det är avsiktligt — en falsk röd kostar en
-- minut, en falsk grön kostar en tyst trasig synk.
do $$
declare
  kropp text;
  kod   text;
begin
  -- Typen och not null prövas, inte bara namnet. En kolumn som redan fanns
  -- sedan tidigare med fel typ hade annars godkänts av `add column if not
  -- exists` (som inte gör något) och av en kontroll som bara frågar på namnet.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workouts'
      and column_name = 'is_imported'
      and data_type = 'boolean'
      and is_nullable = 'NO'
      -- Tolerant på formen, sträng på innebörden: Postgres kan rendera
      -- defaulten som `false` eller `false::boolean` beroende på version, och
      -- en falsk röd här hade avbrutit hela migrationen i onödan.
      and column_default ilike '%false%'
  ) then
    raise exception 'workouts.is_imported saknas eller har fel typ/default: %',
      coalesce((
        select format('typ=%s nullable=%s default=%s', data_type, is_nullable, column_default)
        from information_schema.columns
        where table_schema = 'public' and table_name = 'workouts'
          and column_name = 'is_imported'
      ), 'kolumnen finns inte');
  end if;

  -- Två frågor, inte en. Att inget villkor förbjuder import är sant också när
  -- det inte finns NÅGOT villkor alls — och en source-kolumn utan check vore
  -- en tyst uppluckring, inte ett godkänt resultat.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.logged_sets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source%'
      and pg_get_constraintdef(oid) ilike '%import%'
  ) then
    raise exception 'logged_sets saknar ett check-villkor på source som tillåter import';
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.logged_sets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source%'
      and pg_get_constraintdef(oid) not ilike '%import%'
  ) then
    raise exception 'ett äldre check-villkor på logged_sets.source förbjuder fortfarande import';
  end if;

  select pg_get_functiondef(p.oid) into kropp
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'apply_mutations';

  if kropp is null then
    raise exception 'apply_mutations finns inte';
  end if;

  -- Bort med varje radkommentar. Kvar blir bara kod.
  kod := regexp_replace(kropp, '--[^\n]*', '', 'g');

  if position('coalesce((p->>''is_imported'')::boolean, false)' in kod) = 0 then
    raise exception 'apply_mutations INSERTar inte is_imported';
  end if;

  if position('is_imported = excluded.is_imported' in kod) = 0 then
    raise exception 'apply_mutations UPPDATERAR inte is_imported vid konflikt';
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. Importerade pass och set kan nu synkas.';
  raise notice '--------------------------------------------------';
end;
$$;
