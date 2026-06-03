import { Router } from 'express';
import { db } from '../db.js';
import { httpError } from '../middlewares/errorHandler.js';

const router = Router();

const ROLES = new Set(['teacher', 'student']);

function publicProfile(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalized = (email || '').toLowerCase().trim();
    if (!normalized || !password) throw httpError(400, 'אימייל וסיסמה נדרשים');

    const user = db.findOne('users', u => u.email === normalized && u.password === password);
    if (!user) throw httpError(401, 'אימייל או סיסמה שגויים');
    res.json(publicProfile(user));
  } catch (err) { next(err); }
});

router.post('/register', (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    const normalized = (email || '').toLowerCase().trim();

    if (!name?.trim()) throw httpError(400, 'יש להזין שם');
    if (!normalized) throw httpError(400, 'יש להזין אימייל');
    if (!password || password.length < 6) throw httpError(400, 'סיסמה חייבת להכיל לפחות 6 תווים');
    if (!ROLES.has(role)) throw httpError(400, 'יש לבחור תפקיד');

    if (db.findOne('users', u => u.email === normalized)) {
      throw httpError(409, 'אימייל כבר קיים במערכת');
    }

    const created = db.insert('users', {
      name: name.trim(),
      email: normalized,
      password,
      role,
    });
    res.status(201).json(publicProfile(created));
  } catch (err) { next(err); }
});

export default router;
