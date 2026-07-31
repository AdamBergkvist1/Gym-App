-- =====================================================================
-- Gym-App — 0002: dra tillbaka EXECUTE på hjälpfunktionerna
--
-- BAKGRUND
-- get_advisors (uppgift 2.18) hittade fyra varningar efter 0001. Rotorsaken
-- är en Postgres-standard som är lätt att missa:
--
--     EXECUTE på nya funktioner ges till PUBLIC by default.
--
-- Det är alltså inte Supabase som öppnar dem, utan Postgres själv. I 0001
-- revokerade jag detta för apply_mutations men glömde de tre övriga.
--
-- RISKBEDÖMNING — var ärlig om storleken:
-- Den praktiska risken var LÅG. handle_new_user och set_updated_at returnerar
-- `trigger` och kan inte anropas via RPC över huvud taget; Postgres vägrar
-- köra triggerfunktioner utanför triggerkontext. Det här är alltså ett
-- onödigt bevljande, inte en öppen dörr. Men det kostar ingenting att stänga,
-- och en advisor-rapport som ska gå att lita på får inte innehålla brus man
-- vant sig vid att ignorera.
--
-- VERIFIERAT INNAN DENNA FIL SKREVS
-- Frågan "slutar triggrarna fungera om authenticated tappar EXECUTE?" mättes
-- i en transaktion som rullades tillbaka, med rollen satt till authenticated:
-- updated_at bumpades korrekt BÅDE med och utan revoke. Postgres kontrollerar
-- EXECUTE när triggern SKAPAS, inte varje gång den avfyras.
-- =====================================================================


-- ---------- Triggerfunktioner: ingen ska kunna anropa dem alls ----------
-- Triggrarna fortsätter fungera. Se den verifierade mätningen ovan.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at()  from public, anon, authenticated;


-- ---------- jsonb_to_text_array: authenticated MÅSTE behålla EXECUTE ----------
-- Detta är den enda raden i filen som kan gå sönder om den utelämnas.
-- apply_mutations är SECURITY INVOKER och körs alltså med anroparens
-- rättigheter. Tappar authenticated EXECUTE här slutar varje synkbatch som
-- innehåller en egen övning att fungera, med "permission denied for function".
revoke all on function public.jsonb_to_text_array(jsonb) from public, anon;
grant execute on function public.jsonb_to_text_array(jsonb) to authenticated;


-- ---------- public.rls_auto_enable() lämnas orörd ----------
-- Den funktionen är INTE vår. Den skapas av Supabase när "Auto-RLS" är
-- påslaget och returnerar `event_trigger`, vilket betyder att den inte går
-- att anropa via RPC — pg_event_trigger_ddl_commands() kastar utanför
-- triggerkontext. Advisorns varning för den är därför en falsk positiv i
-- praktiken. Att revokera på plattformsägda objekt riskerar att gå sönder
-- vid nästa plattformsuppdatering utan att vinna något.
--
-- Att den fungerar är dessutom verifierat i förbifarten: två testtabeller
-- som skapades under mätningen fick RLS påslaget automatiskt.


-- ---------- Självkontroll ----------
do $$
declare
  oppna text[] := '{}';
  r     record;
begin
  for r in
    select p.proname, p.proacl
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('handle_new_user', 'set_updated_at',
                        'jsonb_to_text_array', 'apply_mutations')
  loop
    -- proacl IS NULL betyder "standardrättigheter", och standarden för
    -- funktioner är att PUBLIC har EXECUTE. En aclitem för PUBLIC har tom
    -- mottagare och renderas därför som '=X/postgres' — alltså inledande '='.
    if r.proacl is null then
      oppna := oppna || r.proname::text;
    elsif exists (
      select 1 from unnest(r.proacl) a where a::text like '=%'
    ) then
      oppna := oppna || r.proname::text;
    end if;
  end loop;

  if array_length(oppna, 1) > 0 then
    raise exception 'PUBLIC har fortfarande EXECUTE på: %',
      array_to_string(oppna, ', ');
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. Inga av våra funktioner är öppna för PUBLIC.';
  raise notice 'Kör get_advisors igen — kvar ska bara rls_auto_enable vara.';
  raise notice '--------------------------------------------------';
end;
$$;
