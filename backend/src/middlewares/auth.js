// מידלוורים להזדהות והרשאה בצד השרת.
// authRequired — קורא "Authorization: Bearer <token>", מאמת, ומצרף
//   את המשתמש המאומת ל-req.user. דוחה בקשות ללא/עם טוקן פסול ב-401.
// requireRole — שומר ראוט לתפקידים מסוימים (חייב לרוץ אחרי authRequired).

import { verifyToken } from '../auth/tokens.js';
import { httpError } from './errorHandler.js';

export function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw httpError(401, 'נדרשת הזדהות');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw httpError(401, 'טוקן לא תקין או שפג תוקפו');
    }
    req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email };
    next();
  } catch (err) { next(err); }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(httpError(401, 'נדרשת הזדהות'));
    if (!roles.includes(req.user.role)) return next(httpError(403, 'אין הרשאה לפעולה זו'));
    next();
  };
}
