-- =====================================================================
-- Gym-App — 0003: låt apply_mutations ta emot ai_parse_log
--
-- BAKGRUND
-- Telemetrin för fritextparsningen (uppgift 8.10) måste gå samma väg som all
-- annan data: lokalt först, sedan via utkorgen. De flesta inmatningar sker i
-- en gymkällare utan nät, och en telemetrirad som bara skrevs online hade
-- systematiskt missat exakt de fall som är intressantast att mäta.
--
-- Utan denna migration avvisar apply_mutations grenen med "okänd tabell", och
-- hela synkbatchen fastnar — utkorgen stannar ju vid ett permanent fel, med
-- flit. Migrationen måste alltså köras INNAN en klient med 8.10 används.
--
-- Filen är idempotent och kan köras om.
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
          (id, user_id, started_at, ended_at, title, note, is_deleted)
        values (
          (p->>'id')::uuid, uid,
          (p->>'started_at')::timestamptz,
          (p->>'ended_at')::timestamptz,
          p->>'title', p->>'note',
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

      -- NYTT I 0003 --------------------------------------------------------
      -- Telemetri för fritextparsningen. `user_id` tas som alltid ur JWT:n,
      -- aldrig ur payloaden — även en loggrad tillhör en bestämd användare.
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
do $$
declare
  kropp text;
begin
  select pg_get_functiondef(p.oid) into kropp
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'apply_mutations';

  if kropp is null or position('ai_parse_log' in kropp) = 0 then
    raise exception 'apply_mutations saknar grenen för ai_parse_log';
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. apply_mutations tar nu emot ai_parse_log.';
  raise notice '--------------------------------------------------';
end;
$$;
