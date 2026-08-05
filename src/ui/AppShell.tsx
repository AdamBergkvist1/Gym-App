import { NavLink, Outlet } from 'react-router';
import { UpdatePrompt } from './UpdatePrompt';
import { SyncStatus } from './SyncStatus';
import { TABS } from './nav';

/**
 * Appskalet: innehållsyta + bottennavigering.
 *
 * Navigeringen ligger i botten för att den ska nås med tummen. Varje knapp är
 * minst 48 px hög och navigeringen har `env(safe-area-inset-bottom)` som
 * padding, annars hamnar den bakom iPhones hemindikator och blir oklickbar.
 *
 * Flikarna kommer från `ui/nav.ts`, samma lista som rutterna i `App.tsx` läser.
 * Att lägga till en flik är en rad där, inte två ändringar på två ställen.
 */

export function AppShell() {
  return (
    <div className="flex h-[100dvh] flex-col">
      {/*
        `overflow-x-hidden` är ett skyddsnät, inte en lösning: ingen vy ska
        kunna bli bredare än skärmen. Men när det ändå händer ska sidan inte
        gå att dra i sidled — då blir felet synligt som avklippt innehåll i
        stället för att gömma sig bakom en horisontell scroll.
      */}
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-lg py-4">
          <div className="mb-2 flex justify-end">
            <SyncStatus compact />
          </div>
          <Outlet />
        </div>
      </main>

      <UpdatePrompt />

      {/* Flytande pillernavigering, DESIGN.md §0.5.
          Tidigare en fastsittande list över hela bredden med en textmarkering.
          Referenserna (Apple Watch, MacroFactor, Lifesum) låter navigeringen
          flyta indragen från kanterna — det gör att den läser som en kontroll
          och inte som en kant på skärmen. */}
      <nav
        aria-label="Huvudnavigering"
        className="px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2"
      >
        <ul className="mx-auto flex max-w-lg gap-1 rounded-full bg-[var(--color-surface)] p-1.5">
          {TABS.map((tab) => (
            <li key={tab.path} className="flex-1">
              <NavLink
                to={tab.path}
                /* `end` bara för startsidan: utan det matchar "/" varje rutt
                   och alla flikar ser aktiva ut samtidigt. */
                end={tab.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex h-12 items-center justify-center rounded-full text-meta',
                    isActive
                      ? 'bg-[var(--color-accent)] font-semibold text-[var(--color-bg)]'
                      : 'text-[var(--color-dim)]',
                  ].join(' ')
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
