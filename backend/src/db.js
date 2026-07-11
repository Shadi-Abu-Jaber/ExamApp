// PostgreSQL connection pool + a tiny query helper.
// מחליף את ה-store שהיה בזיכרון: כל ראוט קורא/כותב עכשיו לבסיס נתונים
// אמיתי, כך שהמידע שורד אתחול מחדש של השרת (persistence).
// פרטי החיבור מגיעים ממשתני PG_* (ראו backend/.env.example), כך שאותו
// קוד מתחבר ל-DB לוקאלי ב-Docker, להתקנה native, או ל-DB מנוהל בענן
// ללא שינוי קוד.

import pg from 'pg';
import { logger } from './logger.js';

const log = logger.child('db');

const pool = new pg.Pool({
  host:     process.env.PG_HOST     || '127.0.0.1',
  port:     Number(process.env.PG_PORT) || 5432,
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'examapp',
  max:      Number(process.env.PG_POOL_MAX) || 10,
});

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
