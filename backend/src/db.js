// PostgreSQL connection pool + a tiny query helper.
// מחליף את ה-store שהיה בזיכרון: כל ראוט קורא/כותב עכשיו לבסיס נתונים
// אמיתי, כך שהמידע שורד אתחול מחדש של השרת (persistence).
//
// שתי דרכי חיבור:
//   • DATABASE_URL — מחרוזת חיבור אחת (Render/מנוהל בענן). דורש TLS.
//   • PG_* — משתנים נפרדים (Docker/native לוקאלי, ללא TLS).
// אם DATABASE_URL מוגדר הוא מנצח; אחרת נופלים ל-PG_* עם ברירות מחדל.

import pg from 'pg';
import { logger } from './logger.js';

const log = logger.child('db');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Postgres מנוהל (Render וכו') מחייב TLS, אבל שרשרת האישורים אינה
      // ב-trust store של הקונטיינר — לכן לא דוחים אותה. DATABASE_SSL=false
      // רק לשרת לוקאלי ללא TLS.
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

// שגיאה על client שממתין בבריכה (למשל אם ה-DB עשה restart) לא צריכה
// להפיל את התהליך — רק לרשום ללוג.
pool.on('error', (err) => log.error('idle client error', err.message));

// עטיפה דקה כדי שהריפוזיטוריז לא ייבאו את ה-pool ישירות, ויש לנו מקום
// אחד לתיעוד/מעקב SQL בעתיד.
export function query(text, params) {
  return pool.query(text, params);
}

// בדיקת חיבוריות בעליית השרת — כדי להיכשל מהר עם הודעה ברורה במקום
// לקרוס בבקשה הראשונה.
export async function ping() {
  const res = await pool.query('SELECT 1 AS ok');
  return res.rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}

export { pool };
