// ============================================================================
// PostgreSQL connectivity check + data fetch + looping over JSONB.
// ----------------------------------------------------------------------------
// A single script that demonstrates the whole task:
//   1) Check connectivity to the database.
//   2) Fetch all users.
//   3) Fetch all exams (metadata + question count).
//   4) Fetch a specific exam and loop over its questions as JSON objects.
//
// Run:  node backend/db/connect-test.js
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
  // 1) Connectivity
  // ──────────────────────────────────────────────────────────────────────────
  banner('1) Connectivity check');
  const ping = await pool.query('SELECT version() AS version, NOW() AS server_time');
  console.log('✓ connected successfully');
  console.log('  version: ' + ping.rows[0].version.split(',')[0]);
  console.log('  server time: ' + ping.rows[0].server_time.toISOString());

  // ──────────────────────────────────────────────────────────────────────────
  // 2) All users
  // ──────────────────────────────────────────────────────────────────────────
  banner('2) Fetch all users from the users table');
  const users = await pool.query(
    'SELECT id, name, email, role FROM users ORDER BY role, name'
  );
  console.table(users.rows);

  // ──────────────────────────────────────────────────────────────────────────
  // 3) All exams + question count (jsonb_array_length)
  // ──────────────────────────────────────────────────────────────────────────
  banner('3) Fetch all exams (including JSONB question count)');
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
  // 4) Fetch a specific exam + loop over the questions as JSON objects
  // ──────────────────────────────────────────────────────────────────────────
  const targetId = 'exam_seed_js';
  banner(`4) Fetch a specific exam "${targetId}" — loop over the questions`);

  const examRes = await pool.query(
    'SELECT id, title, description, questions FROM exams WHERE id = $1',
    [targetId]
  );

  if (examRes.rowCount === 0) {
    console.log(`✗ exam ${targetId} not found`);
    return;
  }

  const exam = examRes.rows[0];
  console.log(`title:  ${exam.title}`);
  console.log(`description:  ${exam.description}`);
  console.log(`total questions: ${exam.questions.length}\n`);

  // The pg driver returns a JSONB column as a ready-made array of JSON objects —
  // no JSON.parse needed. Now loop per question, exactly as the task requires.
  exam.questions.forEach((q, i) => {
    console.log(`  ─── question ${i + 1} ─────────────────────────────────`);
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
  // 5) Bonus — the same loop, but from SQL with jsonb_array_elements
  // ──────────────────────────────────────────────────────────────────────────
  banner('5) The same loop from SQL (jsonb_array_elements)');
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
  console.log('\n✓ script finished successfully.\n');
}

main().catch(err => {
  console.error('\n✗ error:', err.message);
  pool.end();
  process.exit(1);
});
