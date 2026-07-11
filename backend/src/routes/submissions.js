// ראוטים של הגשות.
// הציון מחושב בשרת ולא בלקוח — כך לא ניתן "לרמות" עם DevTools.
// כל הראוטים דורשים הזדהות:
//   POST   — תלמיד בלבד; studentId נלקח מהטוקן (לא מגוף הבקשה).
//   GET    — תלמיד רואה רק את ההגשות שלו; מורה רואה הגשות של בחינה
//            שבבעלותו בלבד (examId חובה).

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

    // תלמיד — רק ההגשות שלו (studentId נכפה לזהות המחוברת).
    if (req.user.role === 'student') {
      return res.json(await submissionsRepo.list({ studentId: req.user.id, examId }));
    }

    // מורה — רק הגשות של בחינה שבבעלותו.
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
      studentId: req.user.id, // סמכותי — מתעלמים מ-studentId שהגיע מהלקוח
      answers,
      score,
      total: exam.questions.length,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

export default router;
