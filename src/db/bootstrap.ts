import { db } from './db';
import { ensureCatalog } from './repo';

/**
 * Körs en gång vid appstart. Seedar den globala övningskatalogen så att
 * fritextinmatningen fungerar redan vid första start — i en gymkällare, utan
 * nät, innan något konto ens finns.
 */
export const catalogReady: Promise<number> = ensureCatalog(db).catch((err: unknown) => {
  // Luckor ska vara synliga. Utan katalog kan parsern inte matcha någonting,
  // och det ska synas som ett fel — inte som att alla övningar är okända.
  console.error('[db] kunde inte seeda övningskatalogen', err);
  throw err;
});
