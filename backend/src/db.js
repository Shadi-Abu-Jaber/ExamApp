// PostgreSQL connection pool + a tiny query helper.
// Replaces the former in-memory store: every route now reads/writes a real
// database, so data survives server restarts (persistence).
//
// Two ways to connect:
//   • DATABASE_URL — a single connection string (Render / managed cloud). TLS required.
//   • PG_* — discrete variables (local Docker / native, no TLS).
// If DATABASE_URL is set it wins; otherwise we fall back to PG_* with defaults.

import pg from 'pg';
import { logger } from './logger.js';

const log = logger.child('db');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Managed Postgres (Render, etc.) requires TLS, but its certificate chain
      // isn't in the container's trust store — so don't reject it. Set
      // DATABASE_SSL=false only for a local server without TLS.
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX) || 10,
    }
  : {
      host:     process.env.PG_HOST     || '127.0.0.1',
      port:     Number(process.env.PG_PORT) || 5432,
      user:     process.env.PG_USER     || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: process.env.PG_DATABASE || 'examapp',
      max:      Number(process.env.PG_POOL_MAX) || 10,
    };

const pool = new pg.Pool(poolConfig);

// An error on an idle pooled client (e.g. the DB restarted) must not crash the
// process — just log it.
pool.on('error', (err) => log.error('idle client error', err.message));

// Thin wrapper so repositories don't import the pool directly, giving us one
// place to trace/instrument SQL later.
export function query(text, params) {
  return pool.query(text, params);
}

// Connectivity check at startup — so we fail fast with a clear message instead
// of erroring on the first request.
export async function ping() {
  const res = await pool.query('SELECT 1 AS ok');
  return res.rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}

export { pool };
