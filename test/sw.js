// Minimal servicearbetare. Enda syftet är att finnas registrerad.
//
// Varför den behövs: på iOS går det INTE att visa en notis med `new Notification()`.
// Den vägen är inte implementerad i Safari. Enda fungerande vägen är
// ServiceWorkerRegistration.showNotification(), vilket kräver en registrerad
// servicearbetare. Testar man med Notification-konstruktorn får man ett nej som
// beror på fel sak.
//
// Ingen cachning här — testsidan ska alltid hämtas färsk.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Klick på notisen tar användaren tillbaka till testsidan.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('./feedback-test.html');
    })
  );
});
