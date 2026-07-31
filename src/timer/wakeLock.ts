/**
 * Wake Lock. Uppgift 6.5.
 *
 * Låset släpps av webbläsaren så fort appen tappar fokus. Ett enda anrop
 * räcker därför inte — det måste **återbegäras** vid varje `visibilitychange`
 * tillbaka till synlig, annars slocknar skärmen mitt i vilan trots att timern
 * går.
 */

type Sentinel = { released: boolean; release(): Promise<void> };

let sentinel: Sentinel | null = null;
let wanted = false;
let listenerAttached = false;

function supported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

async function acquire(): Promise<void> {
  if (!wanted || !supported() || document.hidden) return;
  if (sentinel && !sentinel.released) return;
  try {
    const nav = navigator as Navigator & {
      wakeLock: { request(type: 'screen'): Promise<Sentinel> };
    };
    sentinel = await nav.wakeLock.request('screen');
  } catch (err) {
    // Nekas typiskt vid lågt batteri. Inte ett fel som ska stoppa timern —
    // men det ska synas i konsolen, inte sväljas.
    console.warn('[wakeLock] kunde inte tas', err);
    sentinel = null;
  }
}

function attachListener(): void {
  if (listenerAttached || typeof document === 'undefined') return;
  listenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void acquire();
  });
}

/** Håll skärmen vaken tills `releaseWakeLock` anropas. */
export async function requestWakeLock(): Promise<void> {
  wanted = true;
  attachListener();
  await acquire();
}

export async function releaseWakeLock(): Promise<void> {
  wanted = false;
  if (sentinel && !sentinel.released) {
    try {
      await sentinel.release();
    } catch {
      // Redan släppt av webbläsaren — ingenting att göra.
    }
  }
  sentinel = null;
}

export function wakeLockSupported(): boolean {
  return supported();
}

export function wakeLockActive(): boolean {
  return sentinel !== null && !sentinel.released;
}
