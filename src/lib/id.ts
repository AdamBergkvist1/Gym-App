/**
 * Klientgenererade identiteter.
 *
 * Detta är inte en detalj: hela idempotensmodellen vilar på att raden har samma
 * id lokalt som i molnet (PLAN.md §3.5). Varje insert blir därmed en upsert med
 * konflikt på `id`, och ett omsänt set kan aldrig bli en dubblett.
 */

/** UUIDv4. Kastar hellre än att falla tillbaka på något svagare. */
export function newId(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    // Luckor ska vara synliga, aldrig tyst ersatta (CLAUDE.md). En egen
    // Math.random-baserad reserv här vore tyst svagare och skulle underminera
    // idempotensen utan att någon märkte det.
    throw new Error('crypto.randomUUID saknas — kräver säker kontext (https)');
  }
  return globalThis.crypto.randomUUID();
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string): boolean {
  return UUID_V4.test(value);
}
