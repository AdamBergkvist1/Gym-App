import { Route, Routes } from 'react-router';
import { AppShell } from './ui/AppShell';
import { TABS } from './ui/nav';
import { TodayPage } from './ui/pages/TodayPage';
import { ExercisePage } from './ui/pages/ExercisePage';

/**
 * Rutterna.
 *
 * Ingen `loader` och ingen datahämtning per rutt — data kommer från Dexie via
 * `useLiveQuery` (fas 5), inte från navigeringen. Det är därför navigering
 * fungerar identiskt med och utan nät.
 *
 * Flikarnas rutter genereras ur `ui/nav.ts`, samma lista som bottennavigeringen
 * läser. Tidigare stod de på två ställen och kunde glida isär; nu är det
 * strukturellt omöjligt. Se `SPEC.md` §2b.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {TABS.map(({ path, Component }) =>
          path === '/' ? (
            <Route key={path} index element={<Component />} />
          ) : (
            <Route key={path} path={path.slice(1)} element={<Component />} />
          )
        )}

        {/* Detaljvy, inte en flik — nås från Historik, Statistik och Övningar. */}
        <Route path="ovning/:id" element={<ExercisePage />} />

        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  );
}
