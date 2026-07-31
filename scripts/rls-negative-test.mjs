#!/usr/bin/env node
/**
 * Uppgift 2.17 — negativt åtkomsttest.
 *
 * Migrationens självkontroll svarar bara på om RLS är PÅSLAGET och om det
 * FINNS policyer. Den kan inte se om policyerna är rätt: en policy med
 * `using (true)` hade räknats som godkänd. Det här skriptet mäter det som
 * faktiskt betyder något — att användare B inte kommer åt A:s data.
 *
 * Kör mot rå REST i stället för supabase-js, eftersom det är den ytan en
 * angripare faktiskt har. Inga beroenden.
 *
 * FÖRUTSÄTTNING: två testanvändare måste finnas. Skapa dem i Supabase
 * Dashboard under Authentication > Users > Add user, med "Auto Confirm User"
 * ikryssat. Använd slasktratt-adresser, inte din riktiga.
 *
 * KÖR:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
 *   TEST_A_EMAIL=a@example.com TEST_A_PASSWORD=... \
 *   TEST_B_EMAIL=b@example.com TEST_B_PASSWORD=... \
 *   node scripts/rls-negative-test.mjs
 *
 * Avslutar med kod 1 och skriver varför om något inte stämmer.
 */

const env = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`SAKNAS: miljövariabeln ${name} är inte satt.`);
    process.exit(1);
  }
  return v;
};

const URL_BASE = env('SUPABASE_URL').replace(/\/$/, '');
const APIKEY = env('SUPABASE_PUBLISHABLE_KEY');

let failures = 0;
const results = [];

function check(namn, ok, detalj) {
  results.push({ namn, ok, detalj });
  if (!ok) failures++;
  console.log(`${ok ? '  OK  ' : ' FEL  '} ${namn}${detalj ? ` — ${detalj}` : ''}`);
}

async function signIn(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: APIKEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    console.error(`Inloggning misslyckades för ${email}: ${res.status} ${JSON.stringify(body)}`);
    console.error('Finns användaren, och är den bekräftad (Auto Confirm)?');
    process.exit(1);
  }
  return { token: body.access_token, userId: body.user.id };
}

function rest(path, token, init = {}) {
  return fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: APIKEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
}

const uuid = () => crypto.randomUUID();

// ---------------------------------------------------------------- kör

console.log('\n=== 2.17 Negativt åtkomsttest ===\n');

const A = await signIn(env('TEST_A_EMAIL'), env('TEST_A_PASSWORD'));
const B = await signIn(env('TEST_B_EMAIL'), env('TEST_B_PASSWORD'));

if (A.userId === B.userId) {
  console.error('TEST_A och TEST_B är samma användare. Testet vore meningslöst.');
  process.exit(1);
}
console.log(`A = ${A.userId}\nB = ${B.userId}\n`);

// Hämta en global övning att peka på.
const exRes = await rest('exercises?select=id,name&owner_id=is.null&limit=1', A.token);
const exercises = await exRes.json();
if (!Array.isArray(exercises) || exercises.length === 0) {
  console.error('Hittade inga globala övningar. Kördes 0001-migrationen?');
  process.exit(1);
}
const exerciseId = exercises[0].id;

const workoutId = uuid();
const setId = uuid();

// --- A skapar data ---
const wRes = await rest('workouts', A.token, {
  method: 'POST',
  body: JSON.stringify({
    id: workoutId,
    user_id: A.userId,
    started_at: new Date().toISOString(),
    title: 'RLS-testpass (raderas automatiskt)',
  }),
});
check('A kan skapa ett eget pass', wRes.ok, wRes.ok ? '' : `${wRes.status} ${await wRes.text()}`);

const sRes = await rest('logged_sets', A.token, {
  method: 'POST',
  body: JSON.stringify({
    id: setId,
    user_id: A.userId,
    workout_id: workoutId,
    exercise_id: exerciseId,
    set_index: 0,
    weight_kg: 100,
    reps: 5,
    performed_at: new Date().toISOString(),
  }),
});
check('A kan logga ett eget set', sRes.ok, sRes.ok ? '' : `${sRes.status} ${await sRes.text()}`);

// --- Kärnan i testet: B ska inte se A:s data ---
// Det avgörande är NOLL RADER, inte ett felmeddelande. Ett fel hade betytt att
// API:t klagar; noll rader betyder att filtret biter.
const bReadSets = await rest(`logged_sets?select=id&id=eq.${setId}`, B.token);
const bSets = await bReadSets.json();
check(
  'B får noll rader (inte ett fel) när B läser A:s set',
  bReadSets.ok && Array.isArray(bSets) && bSets.length === 0,
  `status ${bReadSets.status}, ${Array.isArray(bSets) ? `${bSets.length} rader` : JSON.stringify(bSets)}`
);

const bReadWorkouts = await rest(`workouts?select=id&id=eq.${workoutId}`, B.token);
const bWorkouts = await bReadWorkouts.json();
check(
  'B får noll rader när B läser A:s pass',
  bReadWorkouts.ok && Array.isArray(bWorkouts) && bWorkouts.length === 0,
  `status ${bReadWorkouts.status}, ${Array.isArray(bWorkouts) ? `${bWorkouts.length} rader` : JSON.stringify(bWorkouts)}`
);

// --- B ska inte kunna skriva åt A ---
const bForge = await rest('logged_sets', B.token, {
  method: 'POST',
  body: JSON.stringify({
    id: uuid(),
    user_id: A.userId, // förfalskad ägare
    workout_id: workoutId,
    exercise_id: exerciseId,
    set_index: 99,
    weight_kg: 1,
    reps: 1,
    performed_at: new Date().toISOString(),
  }),
});
check(
  'B kan INTE skriva ett set märkt med A:s user_id',
  !bForge.ok,
  bForge.ok ? 'SKREVS IGENOM — WITH CHECK saknas eller är fel' : `avvisad med ${bForge.status}`
);

// --- B ska inte kunna ändra A:s rader ---
const bUpdate = await rest(`logged_sets?id=eq.${setId}`, B.token, {
  method: 'PATCH',
  body: JSON.stringify({ reps: 999 }),
});
const bUpdated = bUpdate.ok ? await bUpdate.json() : [];
check(
  'B kan INTE ändra A:s set',
  !bUpdate.ok || (Array.isArray(bUpdated) && bUpdated.length === 0),
  Array.isArray(bUpdated) && bUpdated.length > 0 ? 'RADER ÄNDRADES' : `status ${bUpdate.status}`
);

// --- B ska inte kunna radera A:s rader ---
const bDelete = await rest(`logged_sets?id=eq.${setId}`, B.token, { method: 'DELETE' });
const bDeleted = bDelete.ok ? await bDelete.json() : [];
check(
  'B kan INTE radera A:s set',
  !bDelete.ok || (Array.isArray(bDeleted) && bDeleted.length === 0),
  Array.isArray(bDeleted) && bDeleted.length > 0 ? 'RADER RADERADES' : `status ${bDelete.status}`
);

// --- Den globala katalogen ska vara läsbar men skrivskyddad ---
const bReadGlobal = await rest('exercises?select=id&owner_id=is.null&limit=1', B.token);
const bGlobal = await bReadGlobal.json();
check(
  'B kan läsa den globala övningskatalogen',
  bReadGlobal.ok && Array.isArray(bGlobal) && bGlobal.length === 1
);

const bWriteGlobal = await rest('exercises', B.token, {
  method: 'POST',
  body: JSON.stringify({ id: uuid(), owner_id: null, name: 'Förfalskad global', primary_muscle: 'bröst' }),
});
check(
  'B kan INTE lägga till en global övning',
  !bWriteGlobal.ok,
  bWriteGlobal.ok ? 'SKREVS IGENOM — katalogen är inte skrivskyddad' : `avvisad med ${bWriteGlobal.status}`
);

// --- A ska fortfarande se sitt eget ---
const aRead = await rest(`logged_sets?select=id,reps&id=eq.${setId}`, A.token);
const aSets = await aRead.json();
check(
  'A ser fortfarande sitt eget set, orört',
  Array.isArray(aSets) && aSets.length === 1 && aSets[0].reps === 5,
  JSON.stringify(aSets)
);

// --- Städa ---
await rest(`logged_sets?id=eq.${setId}`, A.token, { method: 'DELETE' });
await rest(`workouts?id=eq.${workoutId}`, A.token, { method: 'DELETE' });
const kvar = await (await rest(`workouts?select=id&id=eq.${workoutId}`, A.token)).json();
check('Testdatan är bortstädad', Array.isArray(kvar) && kvar.length === 0);

// ---------------------------------------------------------------- utfall

console.log('');
if (failures > 0) {
  console.error(`UNDERKÄNT: ${failures} av ${results.length} kontroller misslyckades.`);
  console.error('Grind 2 är INTE passerad. Ingen kod får skriva till Supabase.');
  process.exit(1);
}
console.log(`GODKÄNT: ${results.length} av ${results.length} kontroller.`);
console.log('Uppgift 2.17 klar.\n');
