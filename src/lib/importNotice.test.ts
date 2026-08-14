import { describe, expect, it } from 'vitest';
import { importedNotice } from './importNotice';

const punkt = (performedAt: string, isImported: boolean) => ({ performedAt, isImported });

describe('13.5 textrad om uppskattade datum', () => {
  it('säger ingenting när övningen saknar importerade set', () => {
    expect(
      importedNotice([punkt('2026-05-01T10:00:00.000Z', false), punkt('2026-06-01T10:00:00.000Z', false)])
    ).toBeNull();
  });

  it('säger ingenting när övningen aldrig gjorts', () => {
    expect(importedNotice([])).toBeNull();
  });

  it('räknar punkterna och sätter gränsen till månaden efter den sista importen', () => {
    // Adams bänkkurva: sju importerade punkter, den sista i april 2024.
    const punkter = [
      punkt('2021-04-05T10:00:00.000Z', true),
      punkt('2023-12-27T10:00:00.000Z', true),
      punkt('2024-03-18T10:00:00.000Z', true),
      punkt('2024-03-21T10:00:00.000Z', true),
      punkt('2024-04-01T10:00:00.000Z', true),
      punkt('2024-04-03T10:00:00.000Z', true),
      punkt('2024-04-04T10:00:00.000Z', true),
      punkt('2026-06-01T10:00:00.000Z', false),
    ];

    expect(importedNotice(punkter)).toBe(
      '7 punkter före maj 2024 är importerade från gamla anteckningar. Datumen är uppskattade.'
    );
  });

  it('böjer meningen i singular när bara en punkt är importerad', () => {
    expect(importedNotice([punkt('2024-04-04T10:00:00.000Z', true)])).toBe(
      '1 punkt före maj 2024 är importerad från gamla anteckningar. Datumet är uppskattat.'
    );
  });

  it('rullar över årsskiftet i stället för att skriva månad 13', () => {
    expect(importedNotice([punkt('2023-12-27T10:00:00.000Z', true)])).toContain('före januari 2024');
  });
});
