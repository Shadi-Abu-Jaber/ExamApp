// ראוטים של משתמשים (קריאה בלבד). דורשים הזדהות, ומחזירים פרופיל
// ציבורי ללא סיסמה.

import { Router } from 'express';
import * as usersRepo from '../repositories/usersRepo.js';
import { httpError } from '../middlewares/errorHandler.js';
import { authRequired } from '../middlewares/auth.js';

const router = Router();

router.use(authRequired);

function publicProfile(user) {
  const { password, ...rest } = user;
  return rest;
}

router.get('/', async (_req, res, next) => {
  try {
    res.json((await usersRepo.list()).map(publicProfile));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await usersRepo.findById(req.params.id);
    if (!user) throw httpError(404, 'משתמש לא נמצא');
    res.json(publicProfile(user));
  } catch (err) { next(err); }
});

export default router;
