import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CATALOG, CATALOG_ID_CHECKSUM, CATALOG_NAME_CHECKSUM } from './catalog';

/**
 * Katalogen är transkriberad från databasen för hand. En feltypad UUID skulle
 * inte synas någonstans förrän synken i fas 7 skapade en dubblett — och då är
 * det en tyst datakorruption.
 *
 * Kontrollsummorna nedan är tagna direkt ur Supabase:
 *   select md5(string_agg(id::text, ',' order by id::text)),
 *          md5(string_agg(name,     ',' order by id::text))
 *   from public.exercises where owner_id is null;
 *
 * Ändras katalogen i en framtida migration ska summorna uppdateras i SAMMA
 * commit. Går testet sönder betyder det att repot och databasen inte längre
 * är överens — vilket är precis vad det ska fånga.
 */

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex');

describe('övningskatalogen matchar databasen', () => {
  const byId = [...CATALOG].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  it('har 45 övningar', () => {
    expect(CATALOG).toHaveLength(45);
  });

  it('id:na stämmer mot databasens kontrollsumma', () => {
    expect(md5(byId.map((e) => e.id).join(','))).toBe(CATALOG_ID_CHECKSUM);
  });

  it('namnen stämmer mot databasens kontrollsumma', () => {
    expect(md5(byId.map((e) => e.name).join(','))).toBe(CATALOG_NAME_CHECKSUM);
  });

  it('har inga dubblerade id:n', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
  });

  it('har minst två alias per övning — parsern matchar mot dem', () => {
    const tunna = CATALOG.filter((e) => e.aliases.length < 2).map((e) => e.name);
    expect(tunna, `dessa har för få alias: ${tunna.join(', ')}`).toHaveLength(0);
  });
});
