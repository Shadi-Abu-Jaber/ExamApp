// נקודת ההפעלה של השרת.
// טוענים משתני סביבה (.env) *ראשונים* — לפני כל ייבוא שקורא אותם
// (db.js בונה את בריכת ה-PG בזמן הייבוא, ו-tokens.js קורא JWT_SECRET).
import 'dotenv/config';

import { createApp } from './app.js';
import { logger } from './logger.js';
import { ping, closePool } from './db.js';

const port = Number(process.env.PORT) || 4000;

async function start() {
  // בדיקת חיבור ל-DB לפני האזנה — נכשלים מהר עם הודעה ברורה במקום
  // לקרוס בבקשה הראשונה.
  try {
    await ping();
    logger.info('database connection ok');
  } catch (err) {
    logger.error('cannot connect to PostgreSQL — is it running? (from backend/: npm run db:up)');
    logger.error(err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(port, () => {
    logger.info(`examapp-server listening on http://localhost:${port}`);
  });

  // סגירה מסודרת — סוגרים את השרת ואת בריכת ה-DB.
  const shutdown = (sig) => {
    logger.info(`${sig} received — shutting down`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
