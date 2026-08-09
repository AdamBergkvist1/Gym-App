/**
 * Ägarinvarianten. Uppgift 13.0, regeln i `PLAN.md` §2.4.
 *
 * Den lokala basen är EN Dexie-bas och raderna bär medvetet inget `user_id` —
 * servern tar alltid ägaren ur JWT:n (`toWire.ts`). Priset är att basen inte
 * själv vet vems data den håller. Den kunskapen ligger här, på ett ställe.
 *
 * BUGGEN SOM GAV UPPHOV TILL FILEN: Adam loggade in på sitt riktiga konto och
 * såg testkontots tio pass ligga kvar som om de var hans. Servern var oskyldig
 * — RLS isolerade korrekt — men klienten hade ingen aning om att ägaren bytts.
 *
 * VARFÖR DET INTE BARA VAR SKRÄPIGT: hämtade rader hamnar aldrig i utkorgen, så
 * ingenting hade läckt. Men rörde han en enda främmande rad skulle en
 * utkorgspost skapas och skickas upp under HANS JWT — `apply_mutations` tar
 * ägaren ur token och hade skrivit den utan att knota. Därför körs `reconcileOwner`
 * före `pushOutbox`, aldrig efter.
 */

import { db as defaultDb, type GymDatabase } from '../db/db';
import { ensureCatalog } from '../db/repo';
import { META_ACTIVE_WORKOUT } from '../db/types';
import { resetPullCursors } from './pull';

export const META_USER_ID = 'userId';

/** Samma nyckel som `ai/context.ts` läser. Kontots inställningar, inte enhetens. */
const META_PROFILE = 'profile';

const CURSOR_PREFIX = 'lastPulledAt:';

export type OwnerAction =
  | 'adopted' // basen var herrelös och genuint lokal — den nya ägaren tar över den
  | 'wiped' // främmande data, rensad
  | 'unchanged'; // samma ägare som förra gången

/**
 * Avgör vem den lokala basen tillhör och åtgärdar avvikelser.
 *
 * Anropas vid varje synkrunda, inte bara vid inloggningsknappen: en session
 * återställs också tyst vid appstart, och Adams bas fanns redan innan filen
 * skrevs. Funktionen är idempotent — `unchanged` är normalfallet.
 */
export async function reconcileOwner(
  userId: string,
  database: GymDatabase = defaultDb
): Promise<OwnerAction> {
  const rad = await database.meta.get(META_USER_ID);
  const tidigare = typeof rad?.value === 'string' ? rad.value : null;

  if (tidigare === userId) return 'unchanged';

  if (tidigare === null) {
    // Ett tomt `userId` betyder två oförenliga saker, och hämtningsmarkören är
    // det som skiljer dem åt utan att gissa: den sätts BARA av `pull.ts`, alltså
    // bara när någon varit inloggad. Ingen markör ⇒ datan är loggad i utloggat
    // läge och tillhör den som nu loggar in. Markör utan ägare ⇒ basen fylldes
    // av ett konto vi inte kan identifiera.
    const markörer = await database.meta.where('key').startsWith(CURSOR_PREFIX).count();
    if (markörer === 0) {
      await database.meta.put({ key: META_USER_ID, value: userId });
      return 'adopted';
    }
  }

  await wipeForeignData(database);
  await database.meta.put({ key: META_USER_ID, value: userId });
  return 'wiped';
}

/**
 * Rensar det som beskriver användaren, behåller det som beskriver enheten.
 *
 * `meta` töms ALDRIG rakt av: `restTimer` är en pågående vilotimer och
 * `timerDiagnostics` är mätunderlaget bakom `PLAN.md` §2.6 — båda handlar om
 * telefonen, inte om vem som håller i den.
 */
async function wipeForeignData(database: GymDatabase): Promise<void> {
  // Arrayformen, inte varargs: Dexie:s typade överlagringar tar max fem
  // tabeller och vi rör sju. Allt eller inget — en halv rensning vore värre
  // än ingen, eftersom den ser färdig ut.
  await database.transaction(
    'rw',
    [
      database.workouts,
      database.loggedSets,
      database.exercises,
      database.plans,
      database.parseLog,
      database.outbox,
      database.meta,
    ],
    async () => {
      await database.workouts.clear();
      await database.loggedSets.clear();
      await database.plans.clear();
      await database.parseLog.clear();
      await database.outbox.clear();
      await database.meta.delete(META_ACTIVE_WORKOUT);
      await database.meta.delete(META_PROFILE);
      await resetPullCursors(database);

      // Markörerna måste med. Blir de kvar hämtas den nya ägarens äldre rader
      // aldrig ner — `pull.ts` frågar efter `updated_at > markören` — och
      // kontot ser tomt ut fast det inte är det.

      // Katalogen är global, inte kontodata, men den ligger i samma tabell som
      // användarens egna övningar och går inte att skilja ut på `ownerId`:
      // `createExercise` sätter den till null lokalt och låter servern fylla
      // den vid synk. Rensa allt och seeda om från den hårdkodade listan är
      // både enklare och exakt. Måste ske i SAMMA transaktion — annars står
      // parsern utan ordförråd i glappet, och `bootstrap.ts` seedar bara vid
      // modulladdning, alltså inte förrän appen startas om.
      await database.exercises.clear();
      await ensureCatalog(database);
    }
  );
}
