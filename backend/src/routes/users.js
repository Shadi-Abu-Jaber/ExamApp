import { Router } from 'express';
import { db } from '../db.js';
import { httpError } from '../middlewares/errorHandler.js';

const router = Router();

function publicProfile(user) {
  const { password, ...rest } = user;
  return rest;
}

router.get('/', (_req, res) => {
  res.json(db.list('users').map(publicProfile));
});

router.get('/:id', (req, res, next) => {
  const user = db.findById('users', req.params.id);
  if (!user) return next(httpError(404, 'משתמש לא נמצא'));
  res.json(publicProfile(user));
});

export default router;
