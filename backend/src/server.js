// נקודת ההפעלה של השרת.
// קוראים ל-createApp כדי לאסוף את כל הראוטים והמידלוורים, ואז מאזינים לפורט.
// משתמשים ב-PORT מסביבת הריצה כדי שיהיה קל לשנות בלי לערוך קוד.

import { createApp } from './app.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  logger.info(`examapp-server listening on http://localhost:${port}`);
});
