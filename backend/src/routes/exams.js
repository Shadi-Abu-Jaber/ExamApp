// ראוטים של בחינות — CRUD + שינוי סטטוס.
// כל הראוטים דורשים הזדהות (authRequired). פעולות שינוי דורשות תפקיד
// 'teacher' וגם בעלות על הבחינה (createdBy === המשתמש המחובר), כדי
// שמורה לא יוכל לערוך/למחוק בחינות של מורה אחר. createdBy נלקח מהטוקן
// ולא מגוף הבקשה — הלקוח לא יכול "להתחזות" ליוצר אחר.

import { Router } from 'express';
import * as examsRepo from '../repositories/examsRepo.js';
import { httpError } from '../middlewares/errorHandler.js';
import { authRequired, requireRole } from '../middlewares/auth.js';
import { genId } from '../ids.js';

const router = Router();

const STATUS = new Set(['draft', 'published', 'closed']);

// בודק שהשאלה כוללת טקסט, 2..6 אפשרויות, ותשובה נכונה בטווח תקין.
function isValidQuestion(q) {
  return (
    q &&
    typeof q.text === 'string' && q.text.trim() &&
    Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 6 &&
    q.options.every(o => typeof o === 'string' && o.trim()) &&
    Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < q.options.length
  );
}

// טוען בחינה ומוודא שהמשתמש המחובר הוא הבעלים. משמש כל ראוט משנה.
async function loadOwnedExam(req) {
  const exam = await examsRepo.findById(req.params.id);
  if (!exam) throw httpError(404, 'הבחינה לא נמצאה');
  if (exam.createdBy !== req.user.id) throw httpError(403, 'אין הרשאה לבחינה זו');
  return exam;
}

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { status, teacherId } = req.query;
    res.json(await examsRepo.list({ status, teacherId }));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const exam = await examsRepo.findById(req.params.id);
    if (!exam) throw httpError(404, 'הבחינה לא נמצאה');
    res.json(exam);
  } catch (err) { next(err); }
});

router.post('/', requireRole('teacher'), async (req, res, next) => {
  try {
    const { title, description = '', questions = [] } = req.body || {};
    if (!title?.trim()) throw httpError(400, 'נדרשת כותרת');
    if (!Array.isArray(questions) || questions.length === 0) throw httpError(400, 'נדרשת לפחות שאלה אחת');
    for (let i = 0; i < questions.length; i += 1) {
      if (!isValidQuestion(questions[i])) throw httpError(400, `שאלה ${i + 1} אינה תקינה`);
    }

    const created = await examsRepo.insert({
      id: genId('exam'),
      title: title.trim(),
      description,
      status: 'draft',
      createdBy: req.user.id, // סמכותי — מתעלמים מכל createdBy שהגיע מהלקוח
      questions,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    await loadOwnedExam(req);
    const { title, description, questions } = req.body || {};
    const patch = {};
    if (title != null) patch.title = String(title).trim();
    if (description != null) patch.description = String(description);
    if (questions != null) {
      if (!Array.isArray(questions) || questions.length === 0) throw httpError(400, 'נדרשת לפחות שאלה אחת');
      for (let i = 0; i < questions.length; i += 1) {
        if (!isValidQuestion(questions[i])) throw httpError(400, `שאלה ${i + 1} אינה תקינה`);
      }
      patch.questions = questions;
    }
    res.json(await examsRepo.update(req.params.id, patch));
  } catch (err) { next(err); }
});

router.patch('/:id/status', requireRole('teacher'), async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!STATUS.has(status)) throw httpError(400, 'סטטוס לא תקין');
    await loadOwnedExam(req);
    res.json(await examsRepo.update(req.params.id, { status }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    await loadOwnedExam(req);
    await examsRepo.remove(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
