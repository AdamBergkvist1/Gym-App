import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const root = document.getElementById('root');
// Luckor ska vara synliga, aldrig tyst ersatta (CLAUDE.md).
if (!root) throw new Error('#root saknas i index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
