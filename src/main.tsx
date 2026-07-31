import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import { App } from './App';
// Seedar övningskatalogen vid start så att fritextinmatningen fungerar redan
// första gången appen öppnas, utan nät och utan konto.
import './db/bootstrap';
import { startSyncEngine } from './sync/engine';

const root = document.getElementById('root');
// Luckor ska vara synliga, aldrig tyst ersatta (CLAUDE.md).
if (!root) throw new Error('#root saknas i index.html');

startSyncEngine();

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
