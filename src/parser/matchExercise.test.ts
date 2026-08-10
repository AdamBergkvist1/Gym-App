import { describe, expect, it } from 'vitest';
import { matchExercise } from './matchExercise';
import { BENKPRESS_ID, TEST_EXERCISES } from './fixtures';
import { CATALOG } from '../db/catalog';
import { normalizeName } from './normalize';
import type { ExerciseRef } from './types';

const match = (q: string) => matchExercise(q, TEST_EXERCISES);

describe('matchExercise — träffar', () => {
  it('matchar exakt namn', () => {
    expect(match('Bänkpress')?.id).toBe(BENKPRESS_ID);
  });

  it('matchar oavsett versaler', () => {
    expect(match('BÄNKPRESS')?.id).toBe(BENKPRESS_ID);
    expect(match('bänkpress')?.id).toBe(BENKPRESS_ID);
  });

  it('matchar svenskt kortalias', () => {
    expect(match('bänk')?.id).toBe(BENKPRESS_ID);
  });

  it('matchar engelskt alias', () => {
    expect(match('bench')?.id).toBe(BENKPRESS_ID);
    expect(match('bench press')?.id).toBe(BENKPRESS_ID);
  });

  it('matchar trots omgivande blanksteg', () => {
    expect(match('  bänk  ')?.id).toBe(BENKPRESS_ID);
  });

  it('tål en felstavning på en bokstav', () => {
    expect(match('bänkpres')?.id).toBe(BENKPRESS_ID);
    expect(match('marklyf')?.id).toBe('33333333-3333-4333-8333-333333333333');
  });
});

describe('matchExercise — gissar aldrig', () => {
  it('ger null för okänd övning', () => {
    expect(match('blaha')).toBeNull();
    expect(match('cykling')).toBeNull();
  });

  it('ger null för tom sträng', () => {
    expect(match('')).toBeNull();
    expect(match('   ')).toBeNull();
  });

  it('ger null när två kandidater är lika bra', () => {
    // "hantel" är prefix till både Hantelcurl och Hantelpress. Att välja en
    // av dem vore att gissa, och en tyst felgissning skriver fel övning till
    // databasen utan att någon märker det.
    expect(match('hantel')).toBeNull();
  });

  it('ger null för en enda bokstav — för kort för att vara meningsfullt', () => {
    expect(match('b')).toBeNull();
  });
});

/**
 * Uppgift 13.2 — greppet delar övningen i två.
 *
 * Testerna körs mot den RIKTIGA katalogen, inte mot fixturen. Påståendet som
 * ska hållas är inte "matchExercise fungerar" — det täcks ovan — utan att just
 * de alias vi skrivit in i `catalog.ts` pekar dit de ska. En fixtur med
 * påhittade alias hade varit grön oavsett vad katalogen innehöll.
 */
describe('13.2 chins och pullups är två övningar', () => {
  const refs: ExerciseRef[] = CATALOG.map((e) => ({
    id: e.id,
    name: e.name,
    normalizedName: normalizeName(e.name),
    aliases: e.aliases,
  }));
  const iKatalogen = (q: string) => matchExercise(q, refs);

  it('"pullups" ger Pullups — överhandsgrepp', () => {
    expect(iKatalogen('pullups')?.name).toBe('Pullups');
    expect(iKatalogen('pullup')?.name).toBe('Pullups');
    expect(iKatalogen('pull-up')?.name).toBe('Pullups');
    expect(iKatalogen('överhandsgrepp')?.name).toBe('Pullups');
  });

  it('"chins" ger Chins — underhandsgrepp — och behåller sitt id', () => {
    expect(iKatalogen('chins')?.name).toBe('Chins');
    expect(iKatalogen('chin')?.name).toBe('Chins');
    expect(iKatalogen('underhandsgrepp')?.name).toBe('Chins');
    // Id:t får aldrig bytas: redan loggade set pekar på det.
    expect(iKatalogen('chins')?.id).toBe('9f99d443-53a1-47dd-9509-5bf46fa1322b');
  });

  it('"räck" ger null — aliaset är borttaget och får inte gissas', () => {
    // Ordet betydde båda övningarna, och Adam kände inte igen det. Ett alias
    // som pekar på två övningar gör matchningen tvetydig med flit; att det i
    // stället landar på någon tredje övning via felstavningstoleransen vore
    // värre än att fråga.
    expect(iKatalogen('räck')).toBeNull();
  });
});
