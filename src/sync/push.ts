/**
 * Utkorgens sändare. Uppgift 7.4–7.6.
 *
 * Tre regler bär den här filen:
 *
 * 1. **FIFO, alltid.** `apply_mutations` kräver att ett pass kommer före sina
 *    set — annars fäller den sammansatta främmandenyckeln hela batchen.
 * 2. **Hoppa ALDRIG över en post som misslyckats.** Posterna efter kan bero på
 *    den. En kö som glatt fortsätter förbi ett fel skapar hål i molndatan som
 *    ingen upptäcker.
 * 3. **Permanenta fel ska synas.** En post som markeras `failed` försvinner
 *    inte tyst; den räknas av synkindikatorn och visas för användaren.
 */

import type { GymDatabase } from '../db/db';
import type { OutboxEntry } from '../db/types';

const BATCH_SIZE = 50;

export interface PushResult {
  applied: number;
  skipped: number;
  /** Sant när kön stoppades av ett permanent fel. */
  blocked: boolean;
  error: string | null;
}

/** Minsta gemensamma nämnare av supabase-js, så testerna slipper hela klienten. */
export interface RpcCaller {
  rpc(
    fn: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
}

/**
 * Nätfel och utgångna tokens är övergående — posten ligger kvar och försöks
 * igen. Allt annat är ett fel i datan och blir inte bättre av att upprepas.
 */
function isTransient(message: string, code?: string): boolean {
  if (code === 'PGRST301' || code === '401') return true; // JWT utgången
  return /fetch|network|timeout|ECONN|Failed to fetch|offline|503|504/i.test(message);
}

async function sendBatch(
  client: RpcCaller,
  entries: OutboxEntry[]
): Promise<{ ok: true; applied: number; skipped: number } | { ok: false; message: string; transient: boolean }> {
  const batch = entries.map((e) => ({
    mutation_id: e.mutationId,
    table: e.table,
    payload: e.payload,
  }));

  try {
    const { data, error } = await client.rpc('apply_mutations', { batch });
    if (error) {
      return { ok: false, message: error.message, transient: isTransient(error.message, error.code) };
    }
    const result = (data ?? {}) as { applied?: number; skipped?: number };
    return { ok: true, applied: result.applied ?? 0, skipped: result.skipped ?? 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Ett kastat undantag från fetch är nästan alltid nätet.
    return { ok: false, message, transient: isTransient(message) };
  }
}

export async function pushOutbox(client: RpcCaller, db: GymDatabase): Promise<PushResult> {
  let applied = 0;
  let skipped = 0;

  for (;;) {
    const entries = await db.outbox
      .where('status')
      .anyOf('pending')
      .sortBy('seq')
      .then((rows) => rows.slice(0, BATCH_SIZE));

    if (entries.length === 0) return { applied, skipped, blocked: false, error: null };

    const result = await sendBatch(client, entries);

    if (result.ok) {
      applied += result.applied;
      skipped += result.skipped;
      const seqs = entries.map((e) => e.seq).filter((s): s is number => typeof s === 'number');

      // `seq` är Dexies autoinkrementerande primärnyckel och kan inte saknas på
      // en post som just lästs ur tabellen. Men om den ändå gjorde det raderade
      // filtret ovan posten ur raderingslistan i stället för att larma — och då
      // hämtar `for(;;)` samma poster igen. Och igen. Fliken fryser mitt i ett
      // pass, utan felmeddelande.
      //
      // Den defensiva kontrollen skapade alltså ett värre fel än det den skulle
      // skydda mot. Här stoppas kön i stället, via samma `blocked`-väg som
      // permanenta fel — den syns redan i synkindikatorn.
      if (seqs.length !== entries.length) {
        return {
          applied,
          skipped,
          blocked: true,
          error: `utkorgen innehåller ${entries.length - seqs.length} post(er) utan seq. Synken stoppad i stället för att loopa`,
        };
      }

      await db.outbox.bulkDelete(seqs);
      continue;
    }

    if (result.transient) {
      // Nätet är borta eller token är utgången. Posterna ligger kvar orörda.
      return { applied, skipped, blocked: false, error: result.message };
    }

    // Permanent fel. Är batchen större än en post vet vi inte VILKEN som är
    // trasig — hela batchen rullades tillbaka. Kör om en post i taget för att
    // isolera den, annars blockeras kön av ett fel ingen kan felsöka.
    if (entries.length > 1) {
      for (const entry of entries) {
        const single = await sendBatch(client, [entry]);
        if (single.ok) {
          applied += single.applied;
          skipped += single.skipped;
          if (typeof entry.seq === 'number') await db.outbox.delete(entry.seq);
          continue;
        }
        if (single.transient) {
          return { applied, skipped, blocked: false, error: single.message };
        }
        await markFailed(db, entry, single.message);
        return { applied, skipped, blocked: true, error: single.message };
      }
      continue;
    }

    const bad = entries[0];
    if (bad) await markFailed(db, bad, result.message);
    return { applied, skipped, blocked: true, error: result.message };
  }
}

async function markFailed(db: GymDatabase, entry: OutboxEntry, message: string): Promise<void> {
  if (typeof entry.seq !== 'number') return;
  await db.outbox.update(entry.seq, {
    status: 'failed',
    lastError: message,
    attempts: entry.attempts + 1,
  });
}

/** Låter användaren försöka igen efter att ha rättat orsaken. */
export async function retryFailed(db: GymDatabase): Promise<number> {
  const failed = await db.outbox.where('status').equals('failed').toArray();
  await Promise.all(
    failed.map((e) =>
      typeof e.seq === 'number'
        ? db.outbox.update(e.seq, { status: 'pending', lastError: null })
        : Promise.resolve(0)
    )
  );
  return failed.length;
}
