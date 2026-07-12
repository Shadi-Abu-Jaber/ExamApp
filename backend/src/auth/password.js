// Password hashing (bcrypt). Passwords are never stored or compared in plain
// text — register() hashes, login() compares against the stored hash.

import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
