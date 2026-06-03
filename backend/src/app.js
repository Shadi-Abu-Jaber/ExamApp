// הגדרת אפליקציית Express — CORS, JSON, רישום בקשות, ראוטים, וטיפול בשגיאות.
// CORS מוגדר דרך משתנה סביבה כדי שלא נחשוף את ה-API לדומיינים זרים.

import express from 'express';
import cors from 'cors';
import { logger } from './logger.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import examsRoutes from './routes/exams.js';
import submissionsRoutes from './routes/submissions.js';

const log = logger.child('http');

export function createApp() {
  const app = express();
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app.use(cors({ origin: origin.split(',').map(s => s.trim()) }));
  app.use(express.json({ limit: '256kb' }));

  app.use((req, _res, next) => {
    log.info(`${req.method} ${req.url}`);
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'examapp-server' }));

  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/exams', examsRoutes);
  app.use('/submissions', submissionsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
