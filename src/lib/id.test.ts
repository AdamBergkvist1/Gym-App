import { describe, expect, it } from 'vitest';
import { isUuidV4, newId } from './id';

describe('newId', () => {
  it('ger ett giltigt UUIDv4', () => {
    expect(isUuidV4(newId())).toBe(true);
  });

  it('ger unika värden', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});

describe('isUuidV4', () => {
  it('avvisar det som inte är UUIDv4', () => {
    for (const bad of [
      '',
      'inte-ett-uuid',
      '00000000-0000-0000-0000-000000000000', // v-nibble är 0, inte 4
      '9f8e7d6c-5b4a-3928-8716-050403020100', // version 3
    ]) {
      expect(isUuidV4(bad)).toBe(false);
    }
  });
});
