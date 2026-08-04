import type { ComponentType } from 'react';
import { TodayPage } from './pages/TodayPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Navigeringens enda sanning. Uppgift 11B steg 4.1, krav ur `SPEC.md` §2b.
 *
 * FÖRE: flikarna stod i `AppShell.tsx` och rutterna i `App.tsx` — två listor
 * över samma sak, på två ställen, utan något som höll dem överens. Att lägga
 * till en flik krävde att man kom ihåg båda.
 *
 * NU: båda genereras härifrån. **Att lägga till eller ta bort en flik är en rad**,
 * och att glömma halva ändringen är inte längre möjligt — det är inte en regel
 * man ska minnas utan något strukturen gör omöjligt.
 *
 * `SPEC.md` §2b låser formen till fyra flikar: Pass, Historik, Övningar, Mer.
 * De två sista byggs i steg 4.5 och 4.6 — de läggs till som varsin rad här när
 * sidorna finns.
 *
 * `/ovning/:id` står MEDVETET inte här. Den är en detaljvy som nås från
 * Historik, Statistik och Övningar — inte en flik. Rutten ligger kvar i
 * `App.tsx`.
 */
export interface Tab {
  /** Rutt med inledande snedstreck. `/` är startsidan. */
  path: string;
  label: string;
  Component: ComponentType;
}

export const TABS: Tab[] = [
  { path: '/', label: 'Pass', Component: TodayPage },
  { path: '/historik', label: 'Historik', Component: HistoryPage },
  { path: '/installningar', label: 'Inställningar', Component: SettingsPage },
];
