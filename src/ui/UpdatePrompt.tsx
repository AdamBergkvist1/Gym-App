import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Uppgift 3.6 — uppdateringsnotisen.
 *
 * Servicearbetaren är registrerad i 'prompt'-läge, vilket betyder att en ny
 * version ALDRIG aktiveras av sig själv. Den ligger och väntar tills
 * användaren trycker. Att appen inte kan bytas ut mitt i ett pass är därmed
 * en egenskap hos konstruktionen, inte något vi måste komma ihåg att
 * kontrollera.
 *
 * Diskret rad i botten, ingen blockerande dialog — SPEC: "Inga blockerande
 * pop-ups".
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      // Luckor ska vara synliga. En servicearbetare som inte registrerades
      // betyder att appen inte startar offline — det får inte passera tyst.
      console.error('[pwa] servicearbetaren kunde inte registreras', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 mx-auto
                 flex max-w-lg items-center gap-3 rounded-lg border border-[var(--color-line)]
                 bg-[var(--color-surface)] px-4 py-3 text-sm shadow-lg"
    >
      <span className="flex-1">Ny version finns.</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="rounded-md bg-[var(--color-fg)] px-4 text-[var(--color-bg)] font-medium"
      >
        Uppdatera
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Stäng"
        className="rounded-md border border-[var(--color-line)] px-3 text-[var(--color-dim)]"
      >
        Senare
      </button>
    </div>
  );
}
