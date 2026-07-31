-- =====================================================================
-- Gym-App — initialt schema
-- Motsvarar uppgift 2.3–2.16 i docs/TASKS.md
--
-- KÖRS SOM EN FIL i Supabase SQL Editor. Markera allt, klistra in, kör.
--
-- Filen är idempotent: den går att köra om utan att något går sönder eller
-- dubbleras. Alla CREATE använder IF NOT EXISTS, alla policyer droppas innan
-- de skapas, och seeddatan har ON CONFLICT DO NOTHING.
--
-- VIKTIGT om GRANTs (avsnitt 5): projektet har "default privileges for new
-- entities" AVSTÄNGT, vilket är det säkra läget. Nya tabeller i public blir
-- därmed INTE automatiskt nåbara via Data API. Utan de explicita GRANT-satserna
-- nedan svarar PostgREST med 42501 "permission denied" på varje anrop.
-- =====================================================================


-- =====================================================================
-- 1. Hjälpfunktioner
-- =====================================================================

-- Sätter updated_at vid varje UPDATE. Klienten ska aldrig skicka fältet
-- själv — synkens hämtningsmarkör förlitar sig på att det är serverns tid.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Konverterar en jsonb-array till text[]. Returnerar tom array för null, för
-- icke-arrayer och för avsaknad nyckel — i stället för att kasta mitt i en
-- batch. Används av apply_mutations för aliases och secondary_muscles.
create or replace function public.jsonb_to_text_array(j jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when j is null or jsonb_typeof(j) <> 'array' then '{}'::text[]
    else coalesce(
      (select array_agg(t.v) from jsonb_array_elements_text(j) as t(v)),
      '{}'::text[]
    )
  end
$$;

-- Skapar en profilrad när en användare registrerar sig.
-- SECURITY DEFINER krävs: triggern körs i auth-kontext och måste få skriva
-- till public.profiles. search_path sätts till tomt för att förhindra att en
-- manipulerad sökväg kapar funktionen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;


-- =====================================================================
-- 2. Tabeller
-- =====================================================================

-- ---------- 2.3 profiles ----------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text,
  unit_preference       text not null default 'kg'
                          check (unit_preference in ('kg', 'lb')),
  default_effort_scale  text not null default 'rir'
                          check (default_effort_scale in ('rir', 'rpe')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- 2.4 exercises ----------
-- En tabell för både global katalog och egna övningar.
-- owner_id IS NULL  = global katalogövning: läsbar för alla, skrivbar för ingen.
-- owner_id = user   = användarens egen övning.
create table if not exists public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid references auth.users(id) on delete cascade,
  name               text not null,
  -- Genererad kolumn: kan aldrig glida isär från name. Normaliseringen i
  -- src/parser/normalize.ts MÅSTE matcha detta uttryck exakt (gemener + trim),
  -- annars hittar parsern inte övningar som finns.
  normalized_name    text generated always as (lower(btrim(name))) stored,
  aliases            text[] not null default '{}',
  primary_muscle     text not null,
  secondary_muscles  text[] not null default '{}',
  equipment          text,
  is_archived        boolean not null default false,
  is_deleted         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();


-- ---------- 2.5 workouts ----------
create table if not exists public.workouts (
  id          uuid primary key,               -- genereras av klienten
  user_id     uuid not null references auth.users(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,                    -- null = pågående pass
  title       text,
  note        text,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Behövs för den sammansatta främmandenyckeln från logged_sets. Se 2.6.
  constraint workouts_id_user_key unique (id, user_id),
  constraint workouts_time_order check (ended_at is null or ended_at >= started_at)
);

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();


-- ---------- 2.6 logged_sets ----------
create table if not exists public.logged_sets (
  id            uuid primary key,             -- genereras av klienten
  user_id       uuid not null references auth.users(id) on delete cascade,
  workout_id    uuid not null,
  -- restrict, inte cascade: en övning som har loggade set får inte kunna
  -- raderas bort under fötterna på historiken. UI:t arkiverar i stället
  -- (is_archived), vilket döljer den utan att röra datan.
  exercise_id   uuid not null references public.exercises(id) on delete restrict,
  set_index     smallint not null check (set_index >= 0),
  -- ALLTID kg i databasen. Konvertering till lb sker i UI:t.
  -- Ingen kolumn får någonsin innehålla en vikt utan känd enhet.
  weight_kg     numeric(6,2) not null check (weight_kg >= 0),
  reps          smallint not null check (reps > 0),
  effort_type   text check (effort_type in ('rir', 'rpe')),
  effort_value  numeric(3,1) check (effort_value >= 0 and effort_value <= 10),
  rest_seconds  integer check (rest_seconds >= 0),
  note          text,
  is_warmup     boolean not null default false,
  performed_at  timestamptz not null,
  source        text not null default 'manual'
                  check (source in ('manual', 'local_parse', 'ai_parse')),
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Sammansatt främmandenyckel i stället för en subquery i RLS-policyn.
  -- Garanterar att ett set och dess pass tillhör SAMMA användare, alltid,
  -- oavsett hur raden kom in — och kostar noll i policyutvärdering.
  -- Det är därför workouts har en unique (id, user_id) ovanför.
  constraint logged_sets_workout_fk
    foreign key (workout_id, user_id)
    references public.workouts (id, user_id) on delete cascade,

  -- Ansträngning är ETT fält, inte två (beslut 2026-07-30). Antingen finns
  -- både skala och värde, eller ingetdera. En siffra utan skala är tvetydig.
  constraint logged_sets_effort_pair check (
    (effort_type is null and effort_value is null)
    or (effort_type is not null and effort_value is not null)
  )
);

drop trigger if exists logged_sets_set_updated_at on public.logged_sets;
create trigger logged_sets_set_updated_at
  before update on public.logged_sets
  for each row execute function public.set_updated_at();


-- ---------- 2.7 sync_mutations ----------
-- Kvittensbok för idempotens. En rad per mutation som applicerats.
create table if not exists public.sync_mutations (
  mutation_id  uuid primary key,              -- genereras av klienten
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null,
  applied_at   timestamptz not null default now()
);


-- ---------- 2.7 ai_parse_log ----------
-- Utvärderingsdata. Utan den kan vi aldrig svara på hur ofta parsern har rätt,
-- och då kan vi heller inte försvara LLM-anropets latens eller välja modell.
create table if not exists public.ai_parse_log (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  raw_text    text not null,
  parser      text not null check (parser in ('local', 'llm')),
  provider    text,
  model       text,
  parsed      jsonb not null,
  outcome     text not null check (outcome in ('accepted', 'edited', 'rejected')),
  corrected   jsonb,
  latency_ms  integer,
  created_at  timestamptz not null default now()
);


-- =====================================================================
-- 3. Index (uppgift 2.9)
--
-- Index på user_id är INTE en optimering här utan en förutsättning:
-- RLS-uttrycket utvärderas per rad, och utan index blir varje fråga en
-- sekventiell genomsökning av hela tabellen.
-- =====================================================================

create index if not exists profiles_updated_at_idx
  on public.profiles (updated_at);

-- Parserns övningsmatchning
create unique index if not exists exercises_global_name_key
  on public.exercises (normalized_name) where owner_id is null;
create unique index if not exists exercises_owner_name_key
  on public.exercises (owner_id, normalized_name) where owner_id is not null;
create index if not exists exercises_aliases_gin
  on public.exercises using gin (aliases);
create index if not exists exercises_owner_idx
  on public.exercises (owner_id);

-- Synkens hämtningsmarkör: updated_at > last_pulled_at, per användare
create index if not exists workouts_user_updated_idx
  on public.workouts (user_id, updated_at);
create index if not exists workouts_user_started_idx
  on public.workouts (user_id, started_at desc);

create index if not exists logged_sets_user_updated_idx
  on public.logged_sets (user_id, updated_at);
-- Spökdatan: "senaste setet för denna övning" ska vara ett indexuppslag,
-- inte en sortering av hela historiken.
create index if not exists logged_sets_ghost_idx
  on public.logged_sets (user_id, exercise_id, performed_at desc);
create index if not exists logged_sets_workout_idx
  on public.logged_sets (workout_id);

create index if not exists sync_mutations_user_idx
  on public.sync_mutations (user_id);
create index if not exists ai_parse_log_user_created_idx
  on public.ai_parse_log (user_id, created_at desc);


-- =====================================================================
-- 4. Behörigheter (GRANT)
--
-- Läs kommentaren högst upp i filen. Med "default privileges for new
-- entities" avstängt måste varje tabell explicit göras nåbar.
--
-- anon får INGENTING. Appen kräver inloggning, så en oinloggad roll har
-- inget legitimt ärende till någon tabell. Det är ett extra lager utöver RLS:
-- även om en policy skulle vara felskriven finns ingen behörighet att utnyttja.
-- =====================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles       to authenticated;
grant select, insert, update, delete on public.exercises      to authenticated;
grant select, insert, update, delete on public.workouts       to authenticated;
grant select, insert, update, delete on public.logged_sets    to authenticated;
grant select, insert                 on public.sync_mutations to authenticated;
grant select, insert, update         on public.ai_parse_log   to authenticated;

-- Explicit återkallande. Ingen anonym åtkomst till någonting.
revoke all on all tables in schema public from anon;


-- =====================================================================
-- 5. Row Level Security (uppgift 2.10–2.14)
--
-- Två regler genom hela avsnittet:
--
--   1. Uttrycket är (select auth.uid()), inte auth.uid(). Med select-
--      omslutningen utvärderar Postgres funktionen EN gång per fråga i stället
--      för en gång per rad. Det är den enskilt största prestandaposten vid
--      sidan av indexet.
--   2. Ingen policy innehåller en join eller subquery mot en annan tabell.
--      Därför bär logged_sets en egen user_id, och ägarsambandet med passet
--      garanteras i stället av den sammansatta främmandenyckeln i avsnitt 2.
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.exercises      enable row level security;
alter table public.workouts       enable row level security;
alter table public.logged_sets    enable row level security;
alter table public.sync_mutations enable row level security;
alter table public.ai_parse_log   enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Ingen DELETE-policy på profiles. Profilen följer kontot och raderas via
-- cascade från auth.users. Det är avsiktligt, inte en glömska.

-- ---------- exercises ----------
-- Globala övningar (owner_id is null) är läsbara för alla inloggade men
-- skrivbara för ingen — utan att vi behöver en separat tabell för dem.
-- Katalogen underhålls via migrationer.
drop policy if exists "exercises_select_global_or_own" on public.exercises;
create policy "exercises_select_global_or_own" on public.exercises
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------- workouts ----------
drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own" on public.workouts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own" on public.workouts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own" on public.workouts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own" on public.workouts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- logged_sets ----------
drop policy if exists "logged_sets_select_own" on public.logged_sets;
create policy "logged_sets_select_own" on public.logged_sets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "logged_sets_insert_own" on public.logged_sets;
create policy "logged_sets_insert_own" on public.logged_sets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "logged_sets_update_own" on public.logged_sets;
create policy "logged_sets_update_own" on public.logged_sets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "logged_sets_delete_own" on public.logged_sets;
create policy "logged_sets_delete_own" on public.logged_sets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- sync_mutations ----------
-- Kvittensboken ska aldrig ändras eller raderas av klienten. Att kunna radera
-- ett kvitto vore att kunna kringgå idempotensen.
drop policy if exists "sync_mutations_select_own" on public.sync_mutations;
create policy "sync_mutations_select_own" on public.sync_mutations
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "sync_mutations_insert_own" on public.sync_mutations;
create policy "sync_mutations_insert_own" on public.sync_mutations
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ---------- ai_parse_log ----------
drop policy if exists "ai_parse_log_select_own" on public.ai_parse_log;
create policy "ai_parse_log_select_own" on public.ai_parse_log
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "ai_parse_log_insert_own" on public.ai_parse_log;
create policy "ai_parse_log_insert_own" on public.ai_parse_log
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "ai_parse_log_update_own" on public.ai_parse_log;
create policy "ai_parse_log_update_own" on public.ai_parse_log
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- =====================================================================
-- 6. apply_mutations (uppgift 2.15)
--
-- Tar emot en batch mutationer och applicerar dem i EN transaktion.
-- Ger tre saker på en gång: uttrycklig idempotensnyckel enligt CLAUDE.md
-- regel 4, atomär batch (ett pass hamnar aldrig halvt i molnet), och färre
-- rundturer — vilket också sparar på gratisnivåns anropskvot.
--
-- SECURITY INVOKER är avsiktligt: funktionen körs med anroparens rättigheter,
-- så RLS gäller fullt ut även härinne. En bugg i funktionen kan i värsta fall
-- röra den inloggade användarens egna rader, aldrig någon annans.
--
-- user_id tas ALLTID från JWT:n, aldrig från payloaden. Klienten kan inte
-- skriva en rad åt någon annan ens om den försöker.
--
-- Förväntad form:
--   [ { "mutation_id": "<uuid>",
--       "table": "workouts" | "logged_sets" | "exercises",
--       "payload": { ...radens fält... } }, ... ]
--
-- TVÅ KRAV PÅ KLIENTEN som fas 7 måste uppfylla:
--   1. Batchen måste vara ORDNAD. Ett pass före sina set, en egen övning före
--      de set som pekar på den — annars fäller främmandenyckeln hela batchen.
--      Utkorgens FIFO på `seq` ger detta gratis så länge mutationerna köas i
--      den ordning de skapades.
--   2. Hela batchen är atomär. Ett fel i en mutation rullar tillbaka ALLA i
--      samma anrop. Det är avsiktligt — ett halvt pass i molnet vore värre.
--
-- OBS: detta är den del av schemat som mest sannolikt behöver revideras när
-- utkorgen byggs i fas 7. Den är CREATE OR REPLACE, så det kostar ingenting.
-- =====================================================================

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

  -- Explicit null-kontroll före typkontrollen. jsonb_typeof(null) ger null,
  -- och null <> 'array' är null — villkoret hade alltså inte utlöst, och en
  -- null-batch hade tyst returnerat "0 applicerade" som om allt gått bra.
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

    -- Idempotensspärren. Är nyckeln redan känd har mutationen redan
    -- applicerats och vi rör ingenting.
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
          (id, user_id, started_at, ended_at, title, note, is_deleted)
        values (
          (p->>'id')::uuid,
          uid,                                   -- aldrig från payloaden
          (p->>'started_at')::timestamptz,
          (p->>'ended_at')::timestamptz,
          p->>'title',
          p->>'note',
          coalesce((p->>'is_deleted')::boolean, false)
        )
        on conflict (id) do update set
          started_at = excluded.started_at,
          ended_at   = excluded.ended_at,
          title      = excluded.title,
          note       = excluded.note,
          is_deleted = excluded.is_deleted;

      when 'logged_sets' then
        insert into public.logged_sets
          (id, user_id, workout_id, exercise_id, set_index, weight_kg, reps,
           effort_type, effort_value, rest_seconds, note, is_warmup,
           performed_at, source, is_deleted)
        values (
          (p->>'id')::uuid,
          uid,
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
        -- Endast egna övningar. owner_id sätts från JWT:n, så en klient kan
        -- aldrig skapa eller ändra en global katalogövning den här vägen.
        insert into public.exercises
          (id, owner_id, name, aliases, primary_muscle, secondary_muscles,
           equipment, is_archived, is_deleted)
        values (
          (p->>'id')::uuid,
          uid,
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


-- =====================================================================
-- 7. Seed: global övningskatalog (uppgift 2.16)
--
-- Aliasen är inte dekoration — de är det parsern i fas 4 matchar mot.
-- Varje rad har därför fullt namn, vardagligt kortnamn och engelsk
-- motsvarighet. Saknas ett alias kommer parsern att svara "okänd övning"
-- på något som användaren tycker är självklart.
-- =====================================================================

insert into public.exercises (owner_id, name, aliases, primary_muscle, equipment)
select null, v.name, v.aliases, v.muscle, v.equipment
from (values
  -- Bröst
  ('Bänkpress',              array['bänk','bänkpress','bench','bench press','bp'],                 'bröst',        'skivstång'),
  ('Lutande bänkpress',      array['lutande bänk','snedbänk','incline','incline bench'],           'bröst',        'skivstång'),
  ('Hantelpress',            array['hantelpress','hantelbänk','dumbbell press','db press'],        'bröst',        'hantlar'),
  ('Hantelflyes',            array['flyes','fly','hantelflyes','dumbbell fly'],                    'bröst',        'hantlar'),
  ('Dips',                   array['dips','dip','bröstdips'],                                      'bröst',        'kroppsvikt'),
  ('Kabelcross',             array['kabelcross','crossover','cable crossover','kabelflyes'],       'bröst',        'kabel'),

  -- Rygg
  ('Marklyft',               array['mark','marklyft','deadlift','dl'],                             'rygg',         'skivstång'),
  ('Rumänsk marklyft',       array['rumänska','rdl','romanian deadlift','raka marklyft'],          'baksida lår',  'skivstång'),
  ('Chins',                  array['chins','chin','pullup','pull-up','pullups','räck'],            'rygg',         'kroppsvikt'),
  ('Latsdrag',               array['lats','latsdrag','lat pulldown','pulldown'],                   'rygg',         'kabel'),
  ('Skivstångsrodd',         array['rodd','stångrodd','barbell row','bent over row'],              'rygg',         'skivstång'),
  ('Hantelrodd',             array['hantelrodd','enarmsrodd','dumbbell row','db row'],             'rygg',         'hantlar'),
  ('Sittande kabelrodd',     array['kabelrodd','sittande rodd','seated row','cable row'],          'rygg',         'kabel'),
  ('T-bar rodd',             array['tbar','t-bar','t-bar row','tbar rodd'],                        'rygg',         'skivstång'),
  ('Pullover',               array['pullover','dumbbell pullover'],                                'rygg',         'hantlar'),

  -- Ben
  ('Knäböj',                 array['böj','knäböj','benböj','squat','back squat'],                  'framsida lår', 'skivstång'),
  ('Frontböj',               array['frontböj','framböj','front squat'],                            'framsida lår', 'skivstång'),
  ('Benpress',               array['benpress','leg press','lp'],                                   'framsida lår', 'maskin'),
  ('Utfall',                 array['utfall','lunges','lunge'],                                     'framsida lår', 'hantlar'),
  ('Bulgarsk split squat',   array['bulgarska','bulgarian split squat','split squat'],             'framsida lår', 'hantlar'),
  ('Benspark',               array['benspark','leg extension','extension'],                        'framsida lår', 'maskin'),
  ('Lårcurl',                array['lårcurl','leg curl','hamstringcurl','liggande lårcurl'],       'baksida lår',  'maskin'),
  ('Höftlyft',               array['höftlyft','hip thrust','thrust'],                              'säte',         'skivstång'),
  ('Vadpress',               array['vader','vadpress','calf raise','tåhävningar'],                 'vader',        'maskin'),
  ('Goodmorning',            array['goodmorning','good morning'],                                  'baksida lår',  'skivstång'),
  ('Hacklyft',               array['hacklyft','hack squat'],                                       'framsida lår', 'maskin'),

  -- Axlar
  ('Militärpress',           array['militärpress','ohp','overhead press','stångpress'],            'axlar',        'skivstång'),
  ('Axelpress med hantlar',  array['axelpress','shoulder press','dumbbell shoulder press'],        'axlar',        'hantlar'),
  ('Sidolyft',               array['sidolyft','lateral raise','laterals','side raise'],            'axlar',        'hantlar'),
  ('Framåtlyft',             array['framåtlyft','front raise'],                                    'axlar',        'hantlar'),
  ('Face pull',              array['face pull','facepull','ansiktsdrag'],                          'axlar',        'kabel'),
  ('Omvänd flyes',           array['omvänd flyes','reverse fly','rear delt fly','bakre axlar'],    'axlar',        'hantlar'),
  ('Shrugs',                 array['shrugs','shrug','axelryckningar'],                             'rygg',         'hantlar'),

  -- Armar
  ('Bicepscurl',             array['curl','bicepscurl','stångcurl','barbell curl'],                'biceps',       'skivstång'),
  ('Hantelcurl',             array['hantelcurl','dumbbell curl','db curl'],                        'biceps',       'hantlar'),
  ('Hammercurl',             array['hammer','hammercurl','hammer curl'],                           'biceps',       'hantlar'),
  ('Scottcurl',              array['scottcurl','preacher curl','preacher'],                        'biceps',       'skivstång'),
  ('Tricepspress',           array['tricepspress','pushdown','triceps pushdown','tricepsrep'],     'triceps',      'kabel'),
  ('Fransk press',           array['fransk press','skullcrusher','skull crusher'],                 'triceps',      'skivstång'),
  ('Tricepsdips',            array['tricepsdips','bench dip','bänkdips'],                          'triceps',      'kroppsvikt'),
  ('Överhandscurl',          array['överhandscurl','reverse curl'],                                'biceps',       'skivstång'),

  -- Mage
  ('Plankan',                array['planka','plankan','plank'],                                    'mage',         'kroppsvikt'),
  ('Hängande benlyft',       array['benlyft','hängande benlyft','hanging leg raise'],              'mage',         'kroppsvikt'),
  ('Situps',                 array['situps','sit-up','magböj','crunches'],                         'mage',         'kroppsvikt'),
  ('Kabelcrunch',            array['kabelcrunch','cable crunch'],                                  'mage',         'kabel')
) as v(name, aliases, muscle, equipment)
on conflict (normalized_name) where owner_id is null do nothing;


-- =====================================================================
-- 8. Självkontroll
--
-- Varje mätning som kan bli tom ska säga ifrån när den blir det. En
-- migration som "gick igenom" utan att ha skapat något ser likadan ut som
-- en som lyckades — därför avslutar vi med kontroller som KASTAR vid fel
-- i stället för att bara skriva ut siffror.
-- =====================================================================

do $$
declare
  t            text;
  utan_rls     text[] := '{}';
  utan_policy  text[] := '{}';
  antal_ovn    integer;
begin
  foreach t in array array[
    'profiles', 'exercises', 'workouts', 'logged_sets',
    'sync_mutations', 'ai_parse_log'
  ] loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relrowsecurity
    ) then
      utan_rls := utan_rls || t;
    end if;

    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = t
    ) then
      utan_policy := utan_policy || t;
    end if;
  end loop;

  if array_length(utan_rls, 1) > 0 then
    raise exception 'RLS SAKNAS på: %', array_to_string(utan_rls, ', ');
  end if;

  if array_length(utan_policy, 1) > 0 then
    raise exception 'POLICY SAKNAS på: %', array_to_string(utan_policy, ', ');
  end if;

  select count(*) into antal_ovn from public.exercises where owner_id is null;
  if antal_ovn < 30 then
    raise exception 'Övningskatalogen har bara % rader, förväntade minst 30', antal_ovn;
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. RLS aktiverat och policyer på plats för 6 tabeller.';
  raise notice 'OK. Övningskatalogen innehåller % globala övningar.', antal_ovn;
  raise notice '--------------------------------------------------';
end;
$$;
