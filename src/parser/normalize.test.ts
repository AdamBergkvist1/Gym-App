import { describe, expect, it } from 'vitest';
import { normalizeInput, normalizeName } from './normalize';

describe('normalizeName — måste matcha databasens genererade kolumn', () => {
  // exercises.normalized_name är `lower(btrim(name))`. Glider dessa isär
  // hittar parsern inte övningar som finns i katalogen. Testerna nedan är
  // kontraktet mellan JS och SQL.
  it('gör om till gemener', () => {
    expect(normalizeName('Bänkpress')).toBe('bänkpress');
    expect(normalizeName('BÄNKPRESS')).toBe('bänkpress');
  });

  it('trimmar i kanterna', () => {
    expect(normalizeName('  Bänkpress  ')).toBe('bänkpress');
  });

  it('bevarar å, ä och ö — de är egna bokstäver, inte diakriter', () => {
    expect(normalizeName('Knäböj')).toBe('knäböj');
    expect(normalizeName('Höftlyft')).toBe('höftlyft');
  });

  it('rör INTE inre blanksteg — btrim gör det inte heller', () => {
    expect(normalizeName('Fransk  press')).toBe('fransk  press');
  });
});

describe('normalizeInput — förbereder användarens råtext', () => {
  it('gör om till gemener och trimmar', () => {
    expect(normalizeInput('  BÄNK 90x5  ')).toBe('bänk 90x5');
  });

  it('kollapsar inre blanksteg', () => {
    expect(normalizeInput('bänk   90x5')).toBe('bänk 90x5');
  });

  it('gör om * och × till x', () => {
    expect(normalizeInput('bänk 90*5')).toBe('bänk 90x5');
    expect(normalizeInput('bänk 90×5')).toBe('bänk 90x5');
  });

  it('gör svenskt decimalkomma till punkt', () => {
    expect(normalizeInput('bänk 92,5x5')).toBe('bänk 92.5x5');
  });

  it('rör INTE kommat som inleder en anteckning', () => {
    // Detta är hela poängen med att bara konvertera komman mellan siffror.
    // Ett generellt komma→punkt hade förstört varenda anteckning.
    expect(normalizeInput('bänk 90x5, kändes lätt')).toBe('bänk 90x5, kändes lätt');
    expect(normalizeInput('bänk 92,5x5, ont i axeln')).toBe('bänk 92.5x5, ont i axeln');
  });
});
