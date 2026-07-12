// Server entry point.
// Load environment variables (.env) *first* — before any import that reads them
// (db.js builds the PG pool at import time, and tokens.js reads JWT_SECRET).
import 'dotenv/config';

import { createApp } from './app.js';
import { logger } from './logger.js';
import { ping, closePool } from './db.js';

const port = Number(process.env.PORT) || 4000;

async function start() {
  // Check the DB connection before listening — fail fast with a clear message
  // instead of crashing on the first request.
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

  // Graceful shutdown — close the server and the DB pool.
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
