// גיבוב סיסמאות (bcrypt). סיסמאות לא נשמרות ולא מושוות בטקסט גלוי —
// register מגבב, login משווה מול ה-hash.

import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
