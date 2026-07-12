// Access to the `submissions` table. `answers` is stored as JSONB (an array of
// chosen option indices). submitted_at is converted to epoch ms to preserve the
// client contract (numeric sorting).

import { query } from '../db.js';

const SELECT = `
  SELECT id,
         exam_id      AS "examId",
         student_id   AS "studentId",
         answers, score, total,
         submitted_at AS "submittedAt"
  FROM submissions`;

function mapSubmission(row) {
  if (!row) return null;
  return {
    ...row,
    submittedAt: row.submittedAt instanceof Date ? row.submittedAt.getTime() : row.submittedAt,
  };
}

export async function list({ studentId, examId } = {}) {
  const where = [];
  const params = [];
  if (studentId) { params.push(studentId); where.push(`student_id = $${params.length}`); }
  if (examId)    { params.push(examId);    where.push(`exam_id = $${params.length}`); }
  const sql = `${SELECT}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY submitted_at DESC`;
  const res = await query(sql, params);
  return res.rows.map(mapSubmission);
}

export async function insert({ id, examId, studentId, answers, score, total }) {
  const res = await query(
    `INSERT INTO submissions (id, exam_id, student_id, answers, score, total)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     RETURNING id, exam_id AS "examId", student_id AS "studentId",
               answers, score, total, submitted_at AS "submittedAt"`,
    [id, examId, studentId, JSON.stringify(answers), score, total],
  );
  return mapSubmission(res.rows[0]);
}
