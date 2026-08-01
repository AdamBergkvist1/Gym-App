import Dexie, { type EntityTable } from 'dexie';
import type {
  LocalExercise,
  LocalParseLog,
  LocalSet,
  LocalWorkout,
  MetaRow,
  OutboxEntry,
} from './types';

/**
 * Den lokala databasen. Uppgift 5.1.
 *
 * Detta är appens SANNING. Supabase är en kopia som synken (fas 7) håller i
 * kapp. Ingen läsväg i UI:t får gå till nätet.
 *
 * OM INDEXEN: IndexedDB tillåter bara number, string, Date, binärdata och
 * arrayer som nycklar. **Booleaner går inte att indexera.** `PLAN.md` §2.4
 * listade `isDeleted` som index på `workouts` — det är fel och hade gett ett
 * tyst trasigt index. Raderade rader filtreras i stället i minnet, vilket är
 * gratis i den här storleksordningen (tusentals rader, inte miljoner).
 */
class GymDatabase extends Dexie {
  exercises!: EntityTable<LocalExercise, 'id'>;
  workouts!: EntityTable<LocalWorkout, 'id'>;
  loggedSets!: EntityTable<LocalSet, 'id'>;
  outbox!: EntityTable<OutboxEntry, 'seq'>;
  meta!: EntityTable<MetaRow, 'key'>;
  parseLog!: EntityTable<LocalParseLog, 'id'>;

  constructor(name = 'gym') {
    super(name);
    this.version(1).stores({
      exercises: 'id, normalizedName, *aliases, ownerId',
      workouts: 'id, startedAt',
      // Det sammansatta indexet driver spökdatan: "senaste setet för denna
      // övning" ska vara ett indexuppslag, inte en sortering av historiken.
      loggedSets: 'id, workoutId, [exerciseId+performedAt], performedAt',
      outbox: '++seq, status, mutationId',
      meta: 'key',
    });
    // v2: telemetri för fritextparsningen (uppgift 8.10). Additiv — Dexie
    // migrerar befintliga databaser utan att röra de gamla tabellerna.
    this.version(2).stores({
      parseLog: 'id, createdAt, parser, outcome',
    });
  }
}

export const db = new GymDatabase();

/** Egen instans för tester, så att de inte delar tillstånd. */
export function createTestDb(name: string): GymDatabase {
  return new GymDatabase(name);
}

export type { GymDatabase };
