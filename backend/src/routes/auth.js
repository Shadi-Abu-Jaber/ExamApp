// Authentication routes — login and register.
// Both routes return { token, user }: the client sends the JWT in the
// Authorization header on every protected request. The password is only ever
// stored and compared as a bcrypt hash — never in plain text.

import { Router } from 'express';
import * as usersRepo from '../repositories/usersRepo.js';
import { httpError } from '../middlewares/errorHandler.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/tokens.js';
import { genId } from '../ids.js';

const router = Router();

const ROLES = new Set(['teacher', 'student']);

// Strips the password before returning the user to the client.
function publicProfile(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalized = (email || '').toLowerCase().trim();
    if (!normalized || !password) throw httpError(400, 'אימייל וסיסמה נדרשים');

    const user = await usersRepo.findByEmail(normalized);
    if (!user || !(await verifyPassword(password, user.password))) {
      throw httpError(401, 'אימייל או סיסמה שגויים');
    }
    res.json({ token: signToken(user), user: publicProfile(user) });
  } catch (err) { next(err); }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    const normalized = (email || '').toLowerCase().trim();

    if (!name?.trim()) throw httpError(400, 'יש להזין שם');
    if (!normalized) throw httpError(400, 'יש להזין אימייל');
    if (!password || password.length < 6) throw httpError(400, 'סיסמה חייבת להכיל לפחות 6 תווים');
    if (!ROLES.has(role)) throw httpError(400, 'יש לבחור תפקיד');

    if (await usersRepo.findByEmail(normalized)) {
      throw httpError(409, 'אימייל כבר קיים במערכת');
    }

    const created = await usersRepo.insert({
      id: genId('user'),
      name: name.trim(),
      email: normalized,
      password: await hashPassword(password),
      role,
    });
    res.status(201).json({ token: signToken(created), user: publicProfile(created) });
  } catch (err) { next(err); }
});

export default router;
