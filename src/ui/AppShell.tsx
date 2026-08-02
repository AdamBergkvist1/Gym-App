import { NavLink, Outlet } from 'react-router';
import { UpdatePrompt } from './UpdatePrompt';
import { SyncStatus } from './SyncStatus';

/**
 * Appskalet: innehållsyta + bottennavigering.
 *
 * Navigeringen ligger i botten för att den ska nås med tummen. Varje knapp är
 * minst 48 px hög och navigeringen har `env(safe-area-inset-bottom)` som
 * padding, annars hamnar den bakom iPhones hemindikator och blir oklickbar.
 */

const TABS = [
  { to: '/', label: 'Pass', end: true },
  { to: '/historik', label: 'Historik', end: false },
  { to: '/installningar', label: 'Inställningar', end: false },
] as const;

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

      <nav
        aria-label="Huvudnavigering"
        className="border-t border-[var(--color-line)] bg-[var(--color-surface)]
                   pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    'flex h-16 items-center justify-center text-sm',
                    isActive
                      ? 'text-[var(--color-fg)] font-semibold'
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
