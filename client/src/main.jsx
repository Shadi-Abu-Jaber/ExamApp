// נקודת ההפעלה של האפליקציה.
// סדר הפעולות: יצירת שירותים → עטיפה ב-HashRouter (תואם gh-pages) →
// רינדור של רכיב השורש <App />. StrictMode עוזר לאתר בעיות בפיתוח.

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
