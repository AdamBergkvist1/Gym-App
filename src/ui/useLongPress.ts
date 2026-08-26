import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';

/**
 * Långtryck som andrahandsgest på en knapp som redan har ett kort tryck.
 * Uppgift steg 4.2 del E.
 *
 * Adams beslut 2026-08-26: *"Långtryck är bra allmänt annars."* Det förklarar
 * snittalen utan att kosta permanent yta, vilket är samma skäl som gjorde att
 * form 2B vann. `DESIGN.md` §3.1.
 *
 * ## Varför den är skriven här och inte hämtad — §7.1-redovisning
 *
 * Tre kandidater vägdes 2026-08-26. Ingen av dem är hämtad, och **inget
 * package.json-tillägg gjordes**:
 *
 * | Paket | Licens | Senast | Storlek | Beroenden |
 * |---|---|---|---|---|
 * | `minwork/use-long-press` | MIT | **arkiverat**, 2023-08-20 | 20 kB | 0 |
 * | `@use-gesture/react` | MIT | 10.3.1 | 37 kB | 1 |
 * | `react-aria` (`usePress`) | Apache-2.0 | 3.51.0 | **15,5 MB** | 9 direkta |
 *
 * **Slutsats:** den enda som gör exakt det här är arkiverad och tar därmed inte
 * emot rättningar. `@use-gesture` är byggt för drag, pinch och wheel — långtryck
 * är en bråkdel av dess yta. `react-aria` är ett helt gränssnittsbibliotek.
 * §7.1:s egen regel avgör: *"om alternativet till 40 egna rader är 200 kB i
 * bundlen är de 40 raderna rätt svar"*, och 7.13 (bundlestorlek) är öppen.
 *
 * **Det värdefulla ur sökningen var inte kod utan fällorna**, som är verkliga
 * och som en egen naiv implementation går rakt in i:
 *
 * 1. **iOS visar sin egen callout-meny på långtryck** och markerar text. Det
 *    kräver `-webkit-touch-callout: none` OCH `user-select: none` — den första
 *    ensam gäller bara länkar, inte textmarkering.
 * 2. **`contextmenu` avfyras av långtryck** på mobil och måste stoppas.
 * 3. **Klicket kommer ändå** när fingret lyfts, så knappens korta tryck måste
 *    veta att gesten redan tolkats som ett långtryck.
 * 4. **Rörelse ska avbryta** — annars blir varje scroll som börjar på knappen
 *    ett långtryck.
 *
 * Punkt 3 och 4 är skälet att hooken tar BÅDA callbacks i stället för att bara
 * returnera händelser: den som äger timern är den enda som vet vilken gest det
 * blev.
 */

/** Hur länge fingret ska ligga still. iOS egen callout ligger på ~500 ms. */
const LÅNGTRYCK_MS = 450;

/** Rörelse i px som avbryter. En scroll som börjar på knappen är inte ett tryck. */
const RÖRELSEGRÄNS = 10;

interface Val {
  onLongPress: () => void;
  onTap: () => void;
}

export function useLongPress({ onLongPress, onTap }: Val) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const utlöst = useRef(false);

  const avbryt = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  // En omonterad komponent med en levande timer anropar onLongPress på ett
  // borttaget kort. Kortet försvinner när övningen tas bort mitt i ett tryck.
  useEffect(() => avbryt, [avbryt]);

  return {
    onPointerDown: (e: ReactPointerEvent) => {
      // Bara vänsterknapp/finger. Högerklick har sin egen meny.
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      utlöst.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        utlöst.current = true;
        timer.current = null;
        onLongPress();
      }, LÅNGTRYCK_MS);
    },

    onPointerMove: (e: ReactPointerEvent) => {
      if (start.current === null) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.hypot(dx, dy) > RÖRELSEGRÄNS) avbryt();
    },

    onPointerUp: avbryt,
    onPointerCancel: avbryt,
    onPointerLeave: avbryt,

    // Långtryck avfyrar `contextmenu` på mobil. Utan detta får man systemets
    // meny ovanpå vår egen bricka.
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),

    onClick: () => {
      // Fingret lyfts efter ett långtryck och webbläsaren skickar ett klick
      // ändå. Utan spärren öppnas justeringsarket ovanpå infobrickan.
      if (utlöst.current) {
        utlöst.current = false;
        return;
      }
      onTap();
    },
  };
}
