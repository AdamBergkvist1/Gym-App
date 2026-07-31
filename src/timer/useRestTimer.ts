import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { fireAlarm } from './alarm';
import { recordTimerEvent } from './diagnostics';
import { releaseWakeLock, requestWakeLock } from './wakeLock';
import {
  cancelRestTimer,
  getRestTimer,
  hasExpired,
  markFired,
  remainingMs,
  type RestTimerState,
} from './restTimer';

/**
 * Håller ihop vilotimern. Uppgift 6.3.
 *
 * Nedräkningen räknas ALLTID om från `endsAt` — intervallet finns bara för att
 * trigga en omritning, aldrig för att hålla räkningen. Strypes intervallet i
 * bakgrunden blir siffran ändå rätt när appen kommer tillbaka.
 */

export interface RestTimerView {
  state: RestTimerState | null;
  remaining: number;
  expired: boolean;
  cancel: () => void;
}

export function useRestTimer(): RestTimerView {
  const state = useLiveQuery(() => getRestTimer(), [], null);
  const [, forceRender] = useState(0);
  const firing = useRef(false);

  // Ritar om medan timern går. 500 ms räcker för en sekundvisare och kostar
  // nästan ingenting; värdet läses ändå från klockan, inte från räknaren.
  useEffect(() => {
    if (!state || state.firedAt !== null) return;
    const id = setInterval(() => forceRender((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [state]);

  // Skärmen ska vara tänd medan man vilar.
  useEffect(() => {
    if (state && state.firedAt === null) {
      void requestWakeLock();
      return () => {
        void releaseWakeLock();
      };
    }
    return undefined;
  }, [state]);

  // Larmet. Körs både av intervallet och när appen blir synlig igen — det
  // senare är det som fångar fallet där iOS frös timern.
  useEffect(() => {
    if (!state || state.firedAt !== null) return;

    async function checkAndFire(firedOnResume: boolean) {
      if (!state || state.firedAt !== null || firing.current) return;
      if (!hasExpired(state)) return;

      firing.current = true;
      try {
        const wasHidden = typeof document !== 'undefined' && document.hidden;
        await fireAlarm();
        await markFired();

        const due = new Date(state.endsAt).getTime();
        await recordTimerEvent({
          dueAt: state.endsAt,
          firedAt: new Date().toISOString(),
          driftSeconds: Math.round((Date.now() - due) / 1000),
          wasHidden,
          firedOnResume,
          durationSeconds: state.durationSeconds,
        });
      } finally {
        firing.current = false;
      }
    }

    const id = setInterval(() => void checkAndFire(false), 500);
    const onVisible = () => {
      if (!document.hidden) void checkAndFire(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state]);

  return {
    state,
    remaining: state ? remainingMs(state) : 0,
    expired: state ? hasExpired(state) : false,
    cancel: () => void cancelRestTimer(),
  };
}
