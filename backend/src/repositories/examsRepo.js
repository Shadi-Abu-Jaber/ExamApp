// גישה לטבלת exams (HYBRID: מטא-דאטה בעמודות + questions כ-JSONB).
// עמודות snake_case ממופות ל-camelCase (createdBy/createdAt) והחותמת
// מומרת ל-epoch ms — כדי לשמר בדיוק את הצורה שהלקוח כבר צורך.

import { query } from '../db.js';

const SELECT = `
  SELECT id, title, description, status,
         created_by AS "createdBy",
         created_at AS "createdAt",
         questions
  FROM exams`;

const RETURNING = `
  RETURNING id, title, description, status,
            created_by AS "createdBy",
            created_at AS "createdAt",
            questions`;

// node-postgres מחזיר TIMESTAMPTZ כאובייקט Date — ממירים ל-epoch ms
// כדי שהלקוח יקבל מספר (כמו קודם) ו-new Date(...)/מיון ימשיכו לעבוד.
function mapExam(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
  };
}

export async function list({ status, teacherId } = {}) {
  const where = [];
  const params = [];
  if (status)    { params.push(status);    where.push(`status = $${params.length}`); }
  if (teacherId) { params.push(teacherId); where.push(`created_by = $${params.length}`); }
  const sql = `${SELECT}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`;
  const res = await query(sql, params);
  return res.rows.map(mapExam);
}

export async function findById(id) {
  const res = await query(`${SELECT} WHERE id = $1`, [id]);
  return mapExam(res.rows[0]);
}

export async function insert({ id, title, description, status, createdBy, questions }) {
  const res = await query(
    `INSERT INTO exams (id, title, description, status, created_by, questions)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ${RETURNING}`,
    [id, title, description, status, createdBy, JSON.stringify(questions)],
  );
  return mapExam(res.rows[0]);
}

// עדכון חלקי — בונים SET רק מהשדות שהגיעו (title/description/status/questions).
export async function update(id, patch) {
  const sets = [];
  const params = [];
  if (patch.title != null)       { params.push(patch.title);       sets.push(`title = $${params.length}`); }
  if (patch.description != null) { params.push(patch.description); sets.push(`description = $${params.length}`); }
  if (patch.status != null)      { params.push(patch.status);      sets.push(`status = $${params.length}`); }
  if (patch.questions != null)   { params.push(JSON.stringify(patch.questions)); sets.push(`questions = $${params.length}::jsonb`); }
  if (sets.length === 0) return findById(id);
  params.push(id);
  const res = await query(
    `UPDATE exams SET ${sets.join(', ')} WHERE id = $${params.length} ${RETURNING}`,
    params,
  );
  return mapExam(res.rows[0]);
}

export async function remove(id) {
  const res = await query('DELETE FROM exams WHERE id = $1', [id]);
  return res.rowCount > 0;
}
