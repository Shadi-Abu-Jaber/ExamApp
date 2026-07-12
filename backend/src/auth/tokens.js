// Issuing and verifying JWTs. Tokens are signed with JWT_SECRET from the
// environment; if it isn't set we fall back to an insecure development secret
// (with a warning) so local runs aren't blocked. The payload carries the id,
// role, name and email — so authRequired can build req.user without an extra
// DB query on every request.

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
