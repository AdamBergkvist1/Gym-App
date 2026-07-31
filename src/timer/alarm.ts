/**
 * Larmet. Uppgift 6.4 och 6.6.
 *
 * Ordningen kommer från mätningen 2026-07-30 (PLAN.md §2.6), inte från
 * antaganden:
 *
 *   Appen i FÖRGRUNDEN  → visuellt. En notis vore störande när man redan
 *                          tittar på skärmen.
 *   Appen i BAKGRUNDEN  → **lokal notis** från servicearbetaren. Den kom fram
 *                          med iOS eget ljud och vibration trots tyst läge.
 *
 * Det är en LOKAL notis, inte Web Push. Skillnaden avgör om appen fungerar i
 * ett gym: Web Push kräver att en server når telefonen i det ögonblick larmet
 * ska gå, alltså nät. Den lokala notisen har inget nätberoende alls.
 *
 * Vibration och ljud är strukna: `'vibrate' in navigator` är false på iOS, och
 * `AudioContext` går till `interrupted` i bakgrunden. Notisen ger oss båda via
 * operativsystemet i stället.
 */

export type AlarmChannel = 'visual' | 'notification' | 'none';

export async function notificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/**
 * Måste anropas från en användargest — iOS visar annars ingen dialog.
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function showNotification(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    // På iOS finns inte `new Notification()`. Enda fungerande vägen är
    // registreringens showNotification — verifierat i fas 0.
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Vila klar', {
      body: 'Dags för nästa set.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'rest-timer',
      requireInteraction: false,
    });
    return true;
  } catch (err) {
    console.warn('[alarm] notisen gick inte att visa', err);
    return false;
  }
}

/**
 * Utlöser larmet och rapporterar vilken kanal som faktiskt användes.
 * `visual` hanteras av UI:t; här returneras bara valet.
 */
export async function fireAlarm(): Promise<AlarmChannel> {
  const hidden = typeof document !== 'undefined' && document.hidden;
  if (!hidden) return 'visual';
  return (await showNotification()) ? 'notification' : 'none';
}
