// Access to the `users` table. Passwords are stored as a bcrypt hash — see
// auth/password.js. The id is generated in the route layer (genId), not by the DB.

import { query } from '../db.js';

const COLS = 'id, name, email, password, role';

export async function findByEmail(email) {
  const res = await query(`SELECT ${COLS} FROM users WHERE email = $1`, [email]);
  return res.rows[0] || null;
}

export async function findById(id) {
  const res = await query(`SELECT ${COLS} FROM users WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

export async function insert({ id, name, email, password, role }) {
  const res = await query(
    `INSERT INTO users (id, name, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLS}`,
    [id, name, email, password, role],
  );
  return res.rows[0];
}

export async function list() {
  const res = await query(`SELECT ${COLS} FROM users ORDER BY role, name`);
  return res.rows;
}
