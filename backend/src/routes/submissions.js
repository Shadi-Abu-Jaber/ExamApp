// Submission routes.
// The score is computed on the server, not the client — so it can't be "cheated"
// with DevTools. Every route requires authentication:
//   POST   — student only; studentId is taken from the token (not the body).
//   GET    — a student sees only their own submissions; a teacher sees
//            submissions for an exam they own only (examId required).

import { Router } from 'express';
import * as submissionsRepo from '../repositories/submissionsRepo.js';
import * as examsRepo from '../repositories/examsRepo.js';
import { httpError } from '../middlewares/errorHandler.js';
import { authRequired, requireRole } from '../middlewares/auth.js';
import { genId } from '../ids.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { examId } = req.query;

    // student — only their own submissions (studentId forced to the logged-in id).
    if (req.user.role === 'student') {
      return res.json(await submissionsRepo.list({ studentId: req.user.id, examId }));
    }

    // teacher — only submissions for an exam they own.
    if (!examId) throw httpError(400, 'נדרש examId');
    const exam = await examsRepo.findById(examId);
    if (!exam) throw httpError(404, 'הבחינה לא נמצאה');
    if (exam.createdBy !== req.user.id) throw httpError(403, 'אין הרשאה לבחינה זו');
    return res.json(await submissionsRepo.list({ examId }));
  } catch (err) { next(err); }
});

router.post('/', requireRole('student'), async (req, res, next) => {
  try {
    const { examId, answers } = req.body || {};
    if (!examId || !Array.isArray(answers)) throw httpError(400, 'examId ו-answers נדרשים');

    const exam = await examsRepo.findById(examId);
    if (!exam) throw httpError(404, 'הבחינה לא נמצאה');
    if (exam.status !== 'published') throw httpError(400, 'הבחינה אינה פתוחה להגשה');

    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += 1;
    });

    const created = await submissionsRepo.insert({
      id: genId('sub'),
      examId,
      studentId: req.user.id, // authoritative — ignore any studentId from the client
      answers,
      score,
      total: exam.questions.length,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

export default router;
