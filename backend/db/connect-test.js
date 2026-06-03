// ============================================================================
// בדיקת חיבוריות ל-PostgreSQL + שליפת נתונים + לולאה על JSONB.
// ----------------------------------------------------------------------------
// סקריפט בודד שמדגים את כל הדרישות של המשימה:
//   1) בדיקת חיבוריות לבסיס הנתונים.
//   2) שליפת כל המשתמשים.
//   3) שליפת כל הבחינות (מטא-דאטה + מספר שאלות).
//   4) שליפת בחינה ספציפית והרצת לולאה על השאלות שלה כאובייקטי JSON.
//
// הרצה:  node backend/db/connect-test.js
// ============================================================================

import pg from 'pg';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.PG_HOST     || '127.0.0.1',
  port:     Number(process.env.PG_PORT) || 5432,
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'examapp',
});

function banner(title) {
  console.log('\n' + '='.repeat(72));
  console.log('  ' + title);
  console.log('='.repeat(72));
}

async function main() {
  // ──────────────────────────────────────────────────────────────────────────
  // 1) בדיקת חיבוריות
  // ──────────────────────────────────────────────────────────────────────────
  banner('1) בדיקת חיבוריות לבסיס הנתונים');
  const ping = await pool.query('SELECT version() AS version, NOW() AS server_time');
  console.log('✓ מחובר בהצלחה');
  console.log('  גרסה: ' + ping.rows[0].version.split(',')[0]);
  console.log('  שעת שרת: ' + ping.rows[0].server_time.toISOString());

  // ──────────────────────────────────────────────────────────────────────────
  // 2) כל המשתמשים
  // ──────────────────────────────────────────────────────────────────────────
  banner('2) שליפת כל המשתמשים מטבלת users');
  const users = await pool.query(
    'SELECT id, name, email, role FROM users ORDER BY role, name'
  );
  console.table(users.rows);

  // ──────────────────────────────────────────────────────────────────────────
  // 3) כל הבחינות + מספר השאלות (jsonb_array_length)
  // ──────────────────────────────────────────────────────────────────────────
  banner('3) שליפת כל הבחינות מטבלת exams (כולל ספירת שאלות JSONB)');
  const exams = await pool.query(`
    SELECT id,
           title,
           status,
           created_by,
           jsonb_array_length(questions) AS num_questions
    FROM exams
    ORDER BY created_at DESC
  `);
  console.table(exams.rows);

  // ──────────────────────────────────────────────────────────────────────────
  // 4) שליפת בחינה ספציפית + לולאה על השאלות כאובייקטי JSON
  // ──────────────────────────────────────────────────────────────────────────
  const targetId = 'exam_seed_js';
  banner(`4) שליפת בחינה ספציפית "${targetId}" — לולאה על השאלות`);

  const examRes = await pool.query(
    'SELECT id, title, description, questions FROM exams WHERE id = $1',
    [targetId]
  );

  if (examRes.rowCount === 0) {
    console.log(`✗ בחינה ${targetId} לא נמצאה`);
    return;
  }

  const exam = examRes.rows[0];
  console.log(`כותרת:  ${exam.title}`);
  console.log(`תיאור:  ${exam.description}`);
  console.log(`סה"כ שאלות: ${exam.questions.length}\n`);

  // ה-driver של pg מחזיר עמודת JSONB כ-array של אובייקטי JSON מוכן —
  // אין צורך ב-JSON.parse. כעת לולאה פר שאלה, בדיוק כפי שדורשת המשימה.
  exam.questions.forEach((q, i) => {
    console.log(`  ─── שאלה ${i + 1} ─────────────────────────────────`);
    console.log(`  id:            ${q.id}`);
    console.log(`  text:          ${q.text}`);
    console.log(`  options:`);
    q.options.forEach((opt, idx) => {
      const marker = idx === q.correctAnswer ? '✓' : ' ';
      console.log(`    ${marker} [${idx}] ${opt}`);
    });
    console.log(`  correctAnswer: ${q.correctAnswer}  →  "${q.options[q.correctAnswer]}"`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5) בונוס — אותה לולאה אבל מ-SQL עם jsonb_array_elements
  // ──────────────────────────────────────────────────────────────────────────
  banner('5) אותה לולאה מ-SQL (jsonb_array_elements)');
  const expanded = await pool.query(`
    SELECT q->>'id'                  AS question_id,
           q->>'text'                AS question_text,
           (q->>'correctAnswer')::int AS correct_idx
    FROM exams,
         jsonb_array_elements(questions) AS q
    WHERE id = $1
  `, [targetId]);
  console.table(expanded.rows);

  await pool.end();
  console.log('\n✓ הסקריפט הסתיים בהצלחה.\n');
}

main().catch(err => {
  console.error('\n✗ שגיאה:', err.message);
  pool.end();
  process.exit(1);
});
