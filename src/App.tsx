import { Route, Routes } from 'react-router';
import { AppShell } from './ui/AppShell';
import { TodayPage } from './ui/pages/TodayPage';
import { HistoryPage } from './ui/pages/HistoryPage';
import { ExercisePage } from './ui/pages/ExercisePage';
import { SettingsPage } from './ui/pages/SettingsPage';

/**
 * Rutterna.
 *
 * Ingen `loader` och ingen datahämtning per rutt — data kommer från Dexie via
 * `useLiveQuery` (fas 5), inte från navigeringen. Det är därför navigering
 * fungerar identiskt med och utan nät.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="historik" element={<HistoryPage />} />
        <Route path="ovning/:id" element={<ExercisePage />} />
        <Route path="installningar" element={<SettingsPage />} />
        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  );
}
