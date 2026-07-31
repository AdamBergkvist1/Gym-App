/**
 * Hämtning moln → klient. Uppgift 7.8–7.9.
 *
 * Markörbaserad: varje tabell har en `updated_at`-markör i `meta`, och vi
 * hämtar bara rader som ändrats efter den. RLS ser till att bara egna rader
 * kommer med — klienten skickar inget användarfilter alls.
 *
 * Den viktiga regeln: **en hämtad rad skrivs aldrig över en lokal rad som har
 * en väntande utkorgspost.** Lokalt vinner tills kön är tom. Utan den regeln
 * skulle en hämtning mitt i ett pass kunna rulla tillbaka set som ännu inte
 * hunnit skickas upp.
 */

import type { GymDatabase } from '../db/db';
import { exerciseFromWire, setFromWire, workoutFromWire } from './wire';

const PAGE = 500;
const EPOCH = '1970-01-01T00:00:00.000Z';

export interface SelectCaller {
  from(table: string): {
    select(columns: string): {
      gt(
        column: string,
        value: string
      ): {
        order(
          column: string,
          opts: { ascending: boolean }
        ): {
          limit(n: number): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
}

const TABLES = ['workouts', 'logged_sets', 'exercises'] as const;
type PullTable = (typeof TABLES)[number];

const cursorKey = (t: PullTable) => `lastPulledAt:${t}`;

export interface PullResult {
  written: number;
  skippedLocalWins: number;
  error: string | null;
}

export async function pullChanges(client: SelectCaller, db: GymDatabase): Promise<PullResult> {
  let written = 0;
  let skippedLocalWins = 0;

  for (const table of TABLES) {
    const meta = await db.meta.get(cursorKey(table));
    const cursor = typeof meta?.value === 'string' ? meta.value : EPOCH;

    let rows: unknown[];
    try {
      const { data, error } = await client
        .from(table)
        .select('*')
        .gt('updated_at', cursor)
        .order('updated_at', { ascending: true })
        .limit(PAGE);
      if (error) return { written, skippedLocalWins, error: error.message };
      rows = data ?? [];
    } catch (err) {
      return {
        written,
        skippedLocalWins,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    if (rows.length === 0) continue;

    // Rader med osänd lokal ändring rörs inte.
    const pending = new Set(
      (await db.outbox.toArray()).map((e) => e.rowId)
    );

    let maxUpdatedAt = cursor;
    for (const raw of rows) {
      const row = raw as Record<string, unknown>;
      const id = typeof row['id'] === 'string' ? row['id'] : null;
      const updatedAt = typeof row['updated_at'] === 'string' ? row['updated_at'] : null;
      if (!id || !updatedAt) continue; // hellre hoppa över än skriva skräp
      if (updatedAt > maxUpdatedAt) maxUpdatedAt = updatedAt;

      if (pending.has(id)) {
        skippedLocalWins++;
        continue;
      }

      if (table === 'workouts') await db.workouts.put(workoutFromWire(row));
      else if (table === 'logged_sets') await db.loggedSets.put(setFromWire(row));
      else await db.exercises.put(exerciseFromWire(row));
      written++;
    }

    // Markören flyttas bara om något faktiskt lästes. Annars kan en tom sida
    // råka hoppa förbi rader som kommer in en millisekund senare.
    if (maxUpdatedAt !== cursor) {
      await db.meta.put({ key: cursorKey(table), value: maxUpdatedAt });
    }
  }

  return { written, skippedLocalWins, error: null };
}

/** Nollställer markörerna — nästa hämtning tar om allt. */
export async function resetPullCursors(db: GymDatabase): Promise<void> {
  await Promise.all(TABLES.map((t) => db.meta.delete(cursorKey(t))));
}
