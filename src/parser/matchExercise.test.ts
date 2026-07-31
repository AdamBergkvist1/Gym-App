import { describe, expect, it } from 'vitest';
import { matchExercise } from './matchExercise';
import { BENKPRESS_ID, TEST_EXERCISES } from './fixtures';

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
