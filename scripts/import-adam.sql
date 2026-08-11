-- =====================================================================
-- Gym-App — engångsimport av Adams gamla anteckningar (uppgift 13.6)
--
-- KÖRS EN GÅNG, för hand, i Supabase SQL-editorn. Filen är ingen migration
-- och hör inte till kedjan i `supabase/migrations/` — den skriver data för
-- EN användare och ska aldrig köras på någon annans databas.
--
-- KÄLLA:  `raw-notes.txt` rad 102–136 (lyften). Kroppsviktsloggarna på rad
--         2–101 importeras INTE — de är ett eget spår (SPEC §3b, uppgift 12.8).
-- MOTTAGARE: adambergkvist16@gmail.com, user_id nedan. Hämtat ur auth.users
--         2026-08-11, inte antaget.
--
-- INNEHÅLL: 1 egen övning, 18 syntetiska pass, 21 set.
--
--         Passantalet är 18, inte 17 som det står i SPEC §3c. Skillnaden är
--         vecka 12 2024: de två `70kg * 4 V 12` / `70kg * 5 V 12`-raderna är
--         två olika tillfällen (Adams eget svar, `docs/anteckningsformat.md`
--         fråga 13), och två tillfällen är två pass. Siffran 17 kommer från
--         regeln "ett pass per vecka" innan det undantaget skrevs.
--
-- IDEMPOTENS: varje rad har ett FAST uuid och varje insert slutar med
--         `on conflict (id) do nothing`. Rå SQL går utanför `apply_mutations`
--         och dess `sync_mutations`-nyckel, så idempotensen (CLAUDE.md regel 4)
--         måste bo i filen själv. Kör den två gånger och andra körningen
--         skriver noll rader.
--
-- SÅ HÄR LÄSER DU IGENOM DEN: varje set har källraden ur `raw-notes.txt` i
--         kommentaren ovanför sig, ordagrant. Stämmer inte tolkningen — säg
--         till innan du kör, inte efter.
--
-- ÅNGRA: se sista blocket, utkommenterat.
-- =====================================================================


-- ---------- Årtalen: en härledning, inte en uppgift ----------
-- V-numren i anteckningarna saknar år, och Adam svarade "vet inte" (fråga 12).
-- Åren nedan är HÄRLEDDA i grillningen 2026-08-07 och bekräftade av honom:
--
--   * `70 kg × 5` är omöjligt när 1RM är 70 kg (2021 v9) och rimligt när det
--     är 85–90 kg (2022–2024).
--   * Veckorna löper 41 → 52 → 3 → 12 → 20, alltså över ETT årsskifte.
--   * Slutsats: v41 2023 – v20 2024.
--
-- Härledningen bygger på att progressionen är monoton. Det är sannolikt men
-- inte bevisat. Ordningen mellan punkterna är tillförlitlig; den exakta dagen
-- är det inte — därför textraden i appen (uppgift 13.5).
--
-- DAGEN i veckan är veckans MÅNDAG, klockan 12 UTC. Undantaget är vecka 12
-- 2024 där de två bänkraderna lagts på måndag respektive torsdag, eftersom de
-- var två tillfällen. Tiden på dygnet är påhittad och betyder ingenting.


-- ---------- Utelämnat med flit ----------
--   `70 kg * 8 V 3`            Adam underkände setet själv: "studsade lite
--                              mycket på bröstet kanske". Ligger kvar i
--                              raw-notes.txt om han ändrar sig.
--   `Höj till 100 kg nästa`    En plan, inte ett utfört set.
--   `Vikt innan kreatin ...`   Minnesanteckning.
--   Kroppsvikterna             Eget spår, uppgift 12.8.


-- =====================================================================
-- 1. Egen övning: Hacklyft (med gummiband)
-- =====================================================================
-- Bandet gjorde lyftet LÄTTARE i botten ("det gjorde det lättare när man var
-- längst ner", fråga 5). Den får därför inte slås ihop med vanligt Hacklyft
-- (da36f46c-…) — 40 kg med band och 40 kg utan är inte samma prestation.
-- Det följer regeln i SPEC §3d: en variant är en egen övning i katalogen.
--
-- owner_id sätts explicit här. Det är enda stället i projektet där klienten
-- inte får bestämma ägare — men det här ÄR inte klienten, det är du i
-- SQL-editorn, och raden måste tillhöra dig för att RLS ska släppa fram den.
insert into public.exercises
  (id, owner_id, name, aliases, primary_muscle, secondary_muscles, equipment,
   is_archived, is_deleted)
values (
  '21434156-3529-482d-a618-5a5aae7e750c',
  '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e',
  'Hacklyft (med gummiband)',
  '{"hacklyft (med gummiband)","hacksquat med band"}',
  'framsida lår',
  '{"rumpa","baksida lår"}',
  'maskin',
  false, false
)
on conflict (id) do nothing;


-- =====================================================================
-- 2. De 18 syntetiska passen
-- =====================================================================
-- Ett syntetiskt pass är en behållare, inte en träning som ägt rum (SPEC §3d).
-- `is_imported = true` håller dem ute ur passlistan (uppgift 13.3).
--
-- `ended_at = started_at` betyder INTE ett pass som tog noll minuter. Det
-- betyder att längden inte är känd, och noll är det enda värde som inte
-- påstår något. Ett påhittat "45 min" hade sett ut som data.
insert into public.workouts
  (id, user_id, started_at, ended_at, title, note, is_imported, is_deleted)
values
  ('4c4d7f38-1cfa-4e72-8132-fd22ad5fd71e', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2021-03-01 12:00:00+00', '2021-03-01 12:00:00+00', null, 'Importerat: vecka 9 2021. Uppskattat datum.',  true, false),
  ('53496c0e-21b1-4994-aa9c-7ce201838e36', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2021-03-08 12:00:00+00', '2021-03-08 12:00:00+00', null, 'Importerat: vecka 10 2021. Uppskattat datum.', true, false),
  ('1412890a-9cf3-47db-8959-dba71b4bd0a5', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2021-04-05 12:00:00+00', '2021-04-05 12:10:00+00', null, 'Importerat: vecka 14 2021. Uppskattat datum.', true, false),
  ('8484e247-0776-48dd-a261-7eb4b7c3aece', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2021-06-14 12:00:00+00', '2021-06-14 12:00:00+00', null, 'Importerat: vecka 24 2021. Uppskattat datum.', true, false),
  ('b22841fb-5242-4204-a699-06ea14791903', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2022-03-28 12:00:00+00', '2022-03-28 12:00:00+00', null, 'Importerat: vecka 13 2022. Uppskattat datum.', true, false),
  ('896e988f-2d1d-4a9a-9b9e-a5ed5a42830c', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-10-09 12:00:00+00', '2023-10-09 12:00:00+00', null, 'Importerat: vecka 41 2023. Uppskattat datum och år.', true, false),
  ('7ea05bf7-fbb3-42db-9c12-db5ccb9abecf', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-10-23 12:00:00+00', '2023-10-23 12:00:00+00', null, 'Importerat: vecka 43 2023. Uppskattat datum och år.', true, false),
  ('4b43b04f-71b4-4b09-aa39-19efb36cc131', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-11-20 12:00:00+00', '2023-11-20 12:00:00+00', null, 'Importerat: vecka 47 2023. Uppskattat datum och år.', true, false),
  ('c313accb-2ebd-43a2-a48c-2296185e87b0', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-11-27 12:00:00+00', '2023-11-27 12:00:00+00', null, 'Importerat: vecka 48 2023. Uppskattat datum och år.', true, false),
  ('e9949f3f-ebc3-4639-a147-e4ede2c3e5fd', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-12-11 12:00:00+00', '2023-12-11 12:00:00+00', null, 'Importerat: vecka 50 2023. Uppskattat datum och år.', true, false),
  ('46638ddb-80e2-4eea-a874-7f6f696524af', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-12-18 12:00:00+00', '2023-12-18 12:00:00+00', null, 'Importerat: vecka 51 2023. Uppskattat datum och år.', true, false),
  ('2272b0bc-280d-4bb2-8bac-e12d0ab327a8', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2023-12-25 12:00:00+00', '2023-12-25 12:10:00+00', null, 'Importerat: vecka 52 2023. Uppskattat datum och år.', true, false),
  ('5b25c7bd-0cfb-4731-9105-1bd87188dc44', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-02-12 12:00:00+00', '2024-02-12 12:00:00+00', null, 'Importerat: vecka 7 2024. Uppskattat datum och år.',  true, false),
  ('07a6f2c8-af46-416c-97af-a52ae9bea5c9', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-03-18 12:00:00+00', '2024-03-18 12:00:00+00', null, 'Importerat: vecka 12 2024, måndag. Uppskattat datum och år.',  true, false),
  ('1b1d74d0-18d2-4e93-99f7-b00db1023d36', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-03-21 12:00:00+00', '2024-03-21 12:00:00+00', null, 'Importerat: vecka 12 2024, torsdag. Uppskattat datum och år.', true, false),
  ('d352ac10-f607-411f-b4a8-c51874dc1d8b', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-04-01 12:00:00+00', '2024-04-01 12:10:00+00', null, 'Importerat: vecka 14 2024. Uppskattat datum.', true, false),
  ('127a844b-2f65-4169-bc06-587b154cd5c3', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-04-08 12:00:00+00', '2024-04-08 12:00:00+00', null, 'Importerat: vecka 15 2024. Uppskattat datum och år.', true, false),
  ('e4ced758-58bc-4c7b-8042-a4d5de2f593d', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2024-05-13 12:00:00+00', '2024-05-13 12:00:00+00', null, 'Importerat: vecka 20 2024. Uppskattat datum och år.', true, false)
on conflict (id) do nothing;


-- =====================================================================
-- 3. De 21 seten
-- =====================================================================
-- `source = 'import'` gör två saker: seten räknas i personbästa och grafer,
-- men blir aldrig spökdata (uppgift 13.4). `is_warmup` är false rakt igenom —
-- inget av seten var uppvärmning, och att märka ett som det för att slippa
-- det i personbästa vore en osanning i databasen.
--
-- Övnings-id:n (kontrollerade mot public.exercises 2026-08-11):
--   Bänkpress                 38433903-c5f6-41e4-b2e8-4f0587b6d0cf
--   Knäböj                    1c9ac04d-9226-42d1-a47e-ca9b27530e0b
--   Lutande bänkpress         63deb238-6d64-427c-98f9-31b6e901a58d
--   Pullups                   6b0a5be9-a1db-4373-84cc-5eab1fb0688a
--   Hacklyft (med gummiband)  21434156-3529-482d-a618-5a5aae7e750c  (skapas ovan)
insert into public.logged_sets
  (id, user_id, workout_id, exercise_id, set_index, weight_kg, reps,
   effort_type, effort_value, rest_seconds, note, is_warmup, performed_at,
   source, is_deleted)
values

  -- `2021 Vecka 9: Bänk: 70kg` — 1-repsmax, inget repsantal skrevs (fråga 14).
  ('6565c5aa-5c29-4f83-9214-1134aa3777ad', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '4c4d7f38-1cfa-4e72-8132-fd22ad5fd71e',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 1, null, null, null,
   'Nytt personbästa i bänk. 1-repsmax.', false, '2021-03-01 12:00:00+00', 'import', false),

  -- `2021 Vecka 10: pull ups (knogarna pekar bakåt) 10 riktiga nästan 11`
  -- Knogarna bakåt = överhandsgrepp = Pullups, inte Chins (uppgift 13.2).
  -- "nästan 11" räknas inte — 10 är vad som gjordes (fråga 10).
  -- 0 kg är appens konvention för kroppsviktsövningar.
  ('d784d709-af87-4097-b7e4-19d20fbcc49d', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '53496c0e-21b1-4994-aa9c-7ce201838e36',
   '6b0a5be9-a1db-4373-84cc-5eab1fb0688a', 0, 0.00, 10, null, null, null,
   'Knogarna pekar bakåt (överhandsgrepp). "10 riktiga, nästan 11".', false, '2021-03-08 12:00:00+00', 'import', false),

  -- `2021 Vecka 14: Bänk: 75 kg` — 1-repsmax.
  ('b54f3719-bcee-419c-b960-ba90245513f2', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '1412890a-9cf3-47db-8959-dba71b4bd0a5',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 75.00, 1, null, null, null,
   'Nytt personbästa i bänk. 1-repsmax.', false, '2021-04-05 12:00:00+00', 'import', false),

  -- `2021 Vecka 14: Squats: 115` — samma vecka som raden ovan, alltså samma
  -- pass. 115 kg × 1: "det var när jag testade 1 rep max" (fråga 11).
  ('21617994-ba4b-4b8d-8b78-16e921e394b0', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '1412890a-9cf3-47db-8959-dba71b4bd0a5',
   '1c9ac04d-9226-42d1-a47e-ca9b27530e0b', 1, 115.00, 1, null, null, null,
   '1-repsmax.', false, '2021-04-05 12:10:00+00', 'import', false),

  -- `2021 Vecka 24: Bänk: 80kg` — 1-repsmax.
  ('1fbe528b-c9fa-43a8-939d-4f4944db1e9e', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '8484e247-0776-48dd-a261-7eb4b7c3aece',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 80.00, 1, null, null, null,
   'Nytt personbästa i bänk. 1-repsmax.', false, '2021-06-14 12:00:00+00', 'import', false),

  -- `2022 vecka 13: Bänk: 85` — 1-repsmax.
  ('137dd4e8-4735-4db6-91d5-e3370cf296af', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'b22841fb-5242-4204-a699-06ea14791903',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 85.00, 1, null, null, null,
   'Nytt personbästa i bänk. 1-repsmax.', false, '2022-03-28 12:00:00+00', 'import', false),

  -- `Sne bänk (första steget upp): 60 kg * 8. V 41`
  -- "Första steget upp" ≈ 15°. Graden går inte att lagra ännu (uppgift 12.10),
  -- så den står i anteckningen i stället för att tyst försvinna.
  ('713bc022-cf48-449c-81e0-1b5ba0333727', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '896e988f-2d1d-4a9a-9b9e-a5ed5a42830c',
   '63deb238-6d64-427c-98f9-31b6e901a58d', 0, 60.00, 8, null, null, null,
   '"Första steget upp" — cirka 15 grader.', false, '2023-10-09 12:00:00+00', 'import', false),

  -- `Bänkpress: 70 kg * 4. V 43`
  ('9e683712-cdde-43ce-96f3-45056a74d81d', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '7ea05bf7-fbb3-42db-9c12-db5ccb9abecf',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 4, null, null, null,
   null, false, '2023-10-23 12:00:00+00', 'import', false),

  -- `Bänkpress: 70 kg * 5. V 47`
  ('8c480eed-415f-48fe-b2c5-9d5ab825f62f', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '4b43b04f-71b4-4b09-aa39-19efb36cc131',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 5, null, null, null,
   null, false, '2023-11-20 12:00:00+00', 'import', false),

  -- `Squat: 90 kg * 8. V 48 (ganska lätt, skulle kunna gjort typ 2 mer)`
  ('1c8fe936-f6ae-42dc-9b9f-9d93ff77778c', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'c313accb-2ebd-43a2-a48c-2296185e87b0',
   '1c9ac04d-9226-42d1-a47e-ca9b27530e0b', 0, 90.00, 8, null, null, null,
   'Ganska lätt, skulle kunna gjort typ 2 mer.', false, '2023-11-27 12:00:00+00', 'import', false),

  -- `Hacksquat: 40 kg + lila gummiband * 10. V 50`
  ('2e2c5e9b-75a4-48e5-9e9a-909477877e72', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'e9949f3f-ebc3-4639-a147-e4ede2c3e5fd',
   '21434156-3529-482d-a618-5a5aae7e750c', 0, 40.00, 10, null, null, null,
   'Lila gummiband.', false, '2023-12-11 12:00:00+00', 'import', false),

  -- `Bänkpress: 70 kg * 5 V 51`
  ('dacfa876-29e3-4082-aeaa-415fcd02d32b', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '46638ddb-80e2-4eea-a874-7f6f696524af',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 5, null, null, null,
   null, false, '2023-12-18 12:00:00+00', 'import', false),

  -- `Bänkpress: 70 kg * 5 V 52 (hade en del energi kvar, 6 nästa gång)`
  ('9877e205-0e47-46c4-babd-f6bae20effbd', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2272b0bc-280d-4bb2-8bac-e12d0ab327a8',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 5, null, null, null,
   'Hade en del energi kvar, 6 nästa gång.', false, '2023-12-25 12:00:00+00', 'import', false),

  -- `Squat: 90 kg * 12 V 52` — samma vecka som bänken ovan, alltså samma pass.
  ('52c03138-15cf-4a10-aef1-15bb6f062c08', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '2272b0bc-280d-4bb2-8bac-e12d0ab327a8',
   '1c9ac04d-9226-42d1-a47e-ca9b27530e0b', 1, 90.00, 12, null, null, null,
   null, false, '2023-12-25 12:10:00+00', 'import', false),

  -- `Hacksquat: 40 kg + lila gummiband * 12. V 7`
  ('7b67f179-3fab-4d2b-a1d5-ef050a25cc7c', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '5b25c7bd-0cfb-4731-9105-1bd87188dc44',
   '21434156-3529-482d-a618-5a5aae7e750c', 0, 40.00, 12, null, null, null,
   'Lila gummiband.', false, '2024-02-12 12:00:00+00', 'import', false),

  -- `70kg * 4 V 12 (inte gymmat på 3-4 veckor. Skulle kanske orkar en till)`
  ('a5aa0879-12ee-49a3-af9c-9f84295646ff', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '07a6f2c8-af46-416c-97af-a52ae9bea5c9',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 4, null, null, null,
   'Inte gymmat på 3–4 veckor. Skulle kanske orkat en till.', false, '2024-03-18 12:00:00+00', 'import', false),

  -- `70kg * 5 V 12` — samma vecka, men ett ANNAT tillfälle (fråga 13), därför
  -- ett eget pass och inte ett andra set i passet ovan.
  ('f5cd7ecb-3f19-41fb-9e26-a366f7103b88', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '1b1d74d0-18d2-4e93-99f7-b00db1023d36',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 0, 70.00, 5, null, null, null,
   null, false, '2024-03-21 12:00:00+00', 'import', false),

  -- `Hacksquat: 40 kg + lila gummiband * 12. V 14`
  ('e6559a40-c5fb-404c-b473-25a330a7f6f0', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'd352ac10-f607-411f-b4a8-c51874dc1d8b',
   '21434156-3529-482d-a618-5a5aae7e750c', 0, 40.00, 12, null, null, null,
   'Lila gummiband.', false, '2024-04-01 12:00:00+00', 'import', false),

  -- `2024 vecka 14: Bänk: 90 kg` — 1-repsmax, samma vecka som hacklyftet ovan.
  -- Det är DEN HÄR raden som filtret i 13.4 finns för: utan det hade appen
  -- viskat "sist tog du 90 kg × 1" varje gång bänkpress öppnades.
  ('9d3f52f4-af50-45bd-b9fc-879a77fc51e4', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'd352ac10-f607-411f-b4a8-c51874dc1d8b',
   '38433903-c5f6-41e4-b2e8-4f0587b6d0cf', 1, 90.00, 1, null, null, null,
   'Nytt personbästa i bänk. 1-repsmax.', false, '2024-04-01 12:10:00+00', 'import', false),

  -- `Squat: 90 kg * 12 V 15`
  ('73f95208-dfe5-4760-a332-14f0c0fcf5dc', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', '127a844b-2f65-4169-bc06-587b154cd5c3',
   '1c9ac04d-9226-42d1-a47e-ca9b27530e0b', 0, 90.00, 12, null, null, null,
   null, false, '2024-04-08 12:00:00+00', 'import', false),

  -- `Hacksquat: 40 kg  * lila gummiband * 12. V 20`
  -- `*` i stället för `+` är ingen skillnad, samma sak (fråga 4).
  ('8887ca8d-852c-444b-b410-3abe6ecef9f2', '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e', 'e4ced758-58bc-4c7b-8042-a4d5de2f593d',
   '21434156-3529-482d-a618-5a5aae7e750c', 0, 40.00, 12, null, null, null,
   'Lila gummiband.', false, '2024-05-13 12:00:00+00', 'import', false)

on conflict (id) do nothing;


-- =====================================================================
-- 4. Självkontroll
-- =====================================================================
-- Vad den bevisar: att raderna FINNS, i rätt antal, med rätt flaggor, och att
-- bänkkurvan ser ut som den ska. Vad den INTE bevisar: att årtalen stämmer —
-- det är en härledning och ingen fråga till databasen kan avgöra den.
--
-- Kontrollen är formulerad så att den blir röd även vid en delvis körning.
do $$
declare
  adam       constant uuid := '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e';
  antal_pass integer;
  antal_set  integer;
  kurva      text;
begin
  select count(*) into antal_pass
  from public.workouts
  where user_id = adam and is_imported and not is_deleted;

  if antal_pass <> 18 then
    raise exception 'förväntade 18 importerade pass, hittade %', antal_pass;
  end if;

  select count(*) into antal_set
  from public.logged_sets
  where user_id = adam and source = 'import' and not is_deleted;

  if antal_set <> 21 then
    raise exception 'förväntade 21 importerade set, hittade %', antal_set;
  end if;

  -- Acceptanskriteriet i uppgift 13.6, frågat rakt av: bänkens 1-repsmax
  -- ska stiga 70 → 75 → 80 → 85 → 90.
  select string_agg(weight_kg::numeric(6,0)::text, ' → ' order by performed_at)
    into kurva
  from public.logged_sets
  where user_id = adam
    and source = 'import'
    and exercise_id = '38433903-c5f6-41e4-b2e8-4f0587b6d0cf'
    and reps = 1
    and not is_deleted;

  if kurva <> '70 → 75 → 80 → 85 → 90' then
    raise exception 'bänkkurvan blev "%", förväntade "70 → 75 → 80 → 85 → 90"', kurva;
  end if;

  raise notice '--------------------------------------------------';
  raise notice 'OK. % pass, % set. Bänk 1RM: %', antal_pass, antal_set, kurva;
  raise notice 'Öppna appen och synka. Passen syns INTE i passlistan —';
  raise notice 'det är meningen (uppgift 13.3).';
  raise notice '--------------------------------------------------';
end;
$$;


-- =====================================================================
-- 5. Ångra — kör bara om importen ska bort
-- =====================================================================
-- Ordningen är inte valfri: set först, sedan pass, sedan övningen. Den
-- sammansatta främmandenyckeln och `on delete restrict` på exercise_id
-- stoppar annars raderingen halvvägs.
--
-- delete from public.logged_sets
--  where user_id = '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e' and source = 'import';
--
-- delete from public.workouts
--  where user_id = '59d8634e-f2f3-4fc7-bc8d-d0c4b621af2e' and is_imported;
--
-- delete from public.exercises
--  where id = '21434156-3529-482d-a618-5a5aae7e750c';
--
-- Den lokala kopian i telefonen försvinner INTE av detta — synken hämtar
-- ändringar, inte raderingar av rader som aldrig fått is_deleted. Rensa
-- appdatan från Inställningar efteråt.
