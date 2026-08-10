import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  CATALOG,
  CATALOG_ALIAS_CHECKSUM,
  CATALOG_ID_CHECKSUM,
  CATALOG_NAME_CHECKSUM,
} from './catalog';

/**
 * Katalogen är transkriberad från databasen för hand. En feltypad UUID skulle
 * inte synas någonstans förrän synken i fas 7 skapade en dubblett — och då är
 * det en tyst datakorruption.
 *
 * Kontrollsummorna nedan hämtas ur Supabase:
 *   select md5(string_agg(id::text, ',' order by id::text collate "C")),
 *          md5(string_agg(name,     ',' order by id::text collate "C")),
 *          md5(string_agg(array_to_string(aliases, '|'),
 *                              ',' order by id::text collate "C"))
 *   from public.exercises where owner_id is null;
 *
 * Aliasen sammanfogas med `|` och inte via `aliases::text`: Postgres citerar
 * arrayer efter egna regler som JavaScript inte delar, så `{a,b}` mot
 * `["a","b"]` hade jämfört formatering i stället för innehåll.
 *
 * `collate "C"` är inte pynt. Sorteringen här nedanför jämför strängar
 * teckenvis, och Postgres standardkollation gör inte det — den kan behandla
 * bindestreck som osynliga. Två sorteringsordningar ger två olika summor av
 * exakt samma katalog, och felet syns först som en röd rad utan orsak.
 *
 * Ändras katalogen i en framtida migration ska summorna uppdateras i SAMMA
 * commit. Går testet sönder betyder det att repot och databasen inte längre
 * är överens — vilket är precis vad det ska fånga.
 *
 * SUMMORNA FÖR 13.2 (46 övningar) ÄR AVLÄSTA UR DATABASEN efter att migration
 * `0005_chins_pullups.sql` körts, 2026-08-10. Alla tre stämmer. De räknades
 * först på ett simulerat läge innan migrationen fanns, och gav då samma värden
 * — men det är körningen som är beviset, inte förhandsräkningen.
 *
 * Läget före ändringen mättes också: 45 rader, id-summa
 * 4e361bd25fa3726585b88318df886e26 — alltså exakt det repot påstod. Repo och
 * databas var överens innan, vilket är förutsättningen för att de ska vara
 * det efteråt.
 */

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex');

describe('övningskatalogen matchar databasen', () => {
  const byId = [...CATALOG].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  it('har 46 övningar', () => {
    expect(CATALOG).toHaveLength(46);
  });

  it('id:na stämmer mot databasens kontrollsumma', () => {
    expect(md5(byId.map((e) => e.id).join(','))).toBe(CATALOG_ID_CHECKSUM);
  });

  it('namnen stämmer mot databasens kontrollsumma', () => {
    expect(md5(byId.map((e) => e.name).join(','))).toBe(CATALOG_NAME_CHECKSUM);
  });

  it('aliasen stämmer mot databasens kontrollsumma', () => {
    // Ordningen inuti varje alias-array är signifikant, precis som i Postgres.
    // Två katalogen med samma alias i olika ordning ÄR olika kataloger så länge
    // jämförelsen mot servern görs på arrayen, och den görs på arrayen.
    expect(md5(byId.map((e) => e.aliases.join('|')).join(','))).toBe(CATALOG_ALIAS_CHECKSUM);
  });

  it('har inga dubblerade id:n', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
  });

  it('har minst två alias per övning — parsern matchar mot dem', () => {
    const tunna = CATALOG.filter((e) => e.aliases.length < 2).map((e) => e.name);
    expect(tunna, `dessa har för få alias: ${tunna.join(', ')}`).toHaveLength(0);
  });
});
