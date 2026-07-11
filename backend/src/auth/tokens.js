// הנפקה ואימות של JWT. הטוקן נחתם עם JWT_SECRET מהסביבה; אם לא הוגדר,
// נופלים לסוד פיתוח לא-בטוח עם אזהרה (כדי לא לחסום הרצה מקומית).
// ה-payload מכיל מזהה, תפקיד, שם ואימייל — כך ש-authRequired יכול לבנות
// את req.user בלי שאילתת DB נוספת בכל בקשה.

import jwt from 'jsonwebtoken';
import { logger } from '../logger.js';

const log = logger.child('auth');

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  log.warn('JWT_SECRET not set — using an insecure development secret. Set JWT_SECRET in backend/.env before deploying.');
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    SECRET,
    { expiresIn: EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
