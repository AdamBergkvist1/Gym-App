// @vitest-environment jsdom

/**
 * Regressionstest för hjulets återskrivning. Diagnosticerat 2026-08-25.
 *
 * BUGGEN, MÄTT OCH INTE GISSAD: e2e-sviten failade slumpmässigt, och tracen
 * visade viktsekvensen 2,5 → 5 → 7,5 → **5,5** → 8 när fyra klick på `+2,5`
 * skulle ge 10. Ett tappat klick kan bara ge 5 eller 7,5 — det kan aldrig ge
 * ett värde utanför 2,5-rutnätet. 5,5 uppstår när entalshjulet rapporterar sin
 * GAMLA position 5 medan vikten redan är 7,5: `withDigit(7,5, 'ones', 5)`.
 *
 * Orsaken var att hjulet rapporterade sin egen programmatiska scroll som ett
 * användarval. Spärren mot det var tidsbaserad — den släpptes efter 60 ms
 * medan debouncen som rapporterar väntade 90 ms — så under maskinlast hann
 * spärren falla innan rapporten gick.
 *
 * Testet mäter invarianten som gör tiden ovidkommande: **en scroll som
 * användaren inte startat får aldrig rapporteras som ett val.**
 */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIGIT_VALUES } from '../lib/digits';
import { ITEM_H, ScrollPicker } from './ScrollPicker';

declare global {
  /** Reacts egen flagga. Deklarerad här hellre än framtvingad med `as`. */
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let behållare: HTMLDivElement;
let root: Root;

/**
 * jsdom har ingen layout och därmed varken `scrollTo` eller en `scrollTop` som
 * rör sig. Båda ersätts här, vilket är hela poängen: testet ska kunna hålla
 * hjulet kvar på sin gamla position medan värdet ändras utifrån — precis det
 * läge tracen fångade.
 */
function riggaScroll(el: HTMLElement, start: number) {
  let position = start;
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => position,
    set: (v: number) => (position = v),
  });
  return {
    flytta: (v: number) => (position = v),
  };
}

function hjulet(): HTMLElement {
  const el = behållare.querySelector('[role="listbox"]');
  if (!(el instanceof HTMLElement)) throw new Error('hittade inget hjul');
  return el;
}

/**
 * Monterar entalshjulet — samma värdelista som `SetAdjustSheet` skickar in.
 * Buggen handlade om vilket INDEX i listan hjulet rapporterade, så listan är
 * inte kosmetik här: en egen kopia hade låtit testet påstå att fixen håller
 * för en uppsättning appen inte längre använder.
 */
function rita(value: number, onChange: (v: number) => void) {
  act(() => {
    root.render(
      <ScrollPicker label="Ental kilo" values={DIGIT_VALUES} value={value} onChange={onChange} />
    );
  });
}

beforeEach(() => {
  // React kräver flaggan för att `act()` ska räknas som en testmiljö. Utan den
  // passerar testerna men skriver fyra rader varning per körning — brus som
  // döljer äkta varningar när steg 4 lägger till fler komponenttester.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  // jsdom saknar `Element.scrollTo` helt — utan den kastar redan monteringen.
  // Med flit en no-op: den programmatiska scrollen ska INTE flytta positionen,
  // så att en rapport som ändå går fram bevisligen läste ett gammalt läge.
  HTMLElement.prototype.scrollTo = (() => {}) as HTMLElement['scrollTo'];
  behållare = document.createElement('div');
  document.body.appendChild(behållare);
  root = createRoot(behållare);
});

afterEach(() => {
  act(() => root.unmount());
  behållare.remove();
  vi.useRealTimers();
});

describe('ScrollPicker rapporterar bara val användaren gjort', () => {
  it('rapporterar inte när värdet ändrats utifrån och hjulet ligger kvar på gammal position', () => {
    const onChange = vi.fn();

    rita(5, onChange);
    const el = hjulet();
    riggaScroll(el, 5 * ITEM_H);

    // Vikten ändras utifrån av `+2,5`-knappen: entalssiffran går 5 → 7.
    rita(7, onChange);

    // ⚠️ Så här såg tracen ut: spärren hann släppa (60 ms) INNAN hjulets
    // scrollhändelse dök upp, och hjulet låg fortfarande kvar på 5:ans plats.
    act(() => void vi.advanceTimersByTime(70));
    act(() => el.dispatchEvent(new Event('scroll', { bubbles: true })));
    act(() => void vi.advanceTimersByTime(200));

    // Ingen har rört hjulet. Rapporteras position 5 här skrivs den gamla
    // siffran tillbaka över den nya vikten — det är så 7,5 blev 5,5.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rapporterar när användaren själv dragit i hjulet', () => {
    const onChange = vi.fn();
    rita(5, onChange);

    const el = hjulet();
    const scroll = riggaScroll(el, 5 * ITEM_H);
    // Låt monteringens synk rinna av först, annars mäter testet den och inte
    // användarens drag.
    act(() => void vi.advanceTimersByTime(200));

    // Ankaret: utan det här testet hade fixen kunnat tysta hjulet helt och
    // ändå se grön ut. Ett hjul som aldrig rapporterar är inte lagat.
    act(() => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    scroll.flytta(8 * ITEM_H);
    act(() => el.dispatchEvent(new Event('scroll', { bubbles: true })));
    act(() => void vi.advanceTimersByTime(200));

    expect(onChange).toHaveBeenCalledWith(8);
  });
});
