// Application entry point.
// Order of operations: bootstrap the services → wrap in HashRouter (works on
// static hosts without server-side rewrites) → render the root <App />.
// StrictMode helps surface problems during development.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { bootstrapServices } from './services/ServiceRegistry.js';

bootstrapServices();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
