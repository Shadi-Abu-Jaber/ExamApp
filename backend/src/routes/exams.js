// ראוטים של בחינות — CRUD + שינוי סטטוס.
// הוולידציה זהה לזו שבצד הלקוח (Question.isValid) כדי שתנהג בהתאם
// גם אם הלקוח עוקף את הטופס וקורא ישירות לשרת.

import { Router } from 'express';
import { db } from '../db.js';
import { httpError } from '../middlewares/errorHandler.js';

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

router.get('/', (req, res) => {
  let exams = db.list('exams');
  const { status, teacherId } = req.query;
  if (status) exams = exams.filter(e => e.status === status);
  if (teacherId) exams = exams.filter(e => e.createdBy === teacherId);
  res.json(exams);
});

router.get('/:id', (req, res, next) => {
  const exam = db.findById('exams', req.params.id);
  if (!exam) return next(httpError(404, 'הבחינה לא נמצאה'));
  res.json(exam);
});

router.post('/', (req, res, next) => {
  try {
    const { title, description = '', questions = [], createdBy } = req.body || {};
    if (!title?.trim()) throw httpError(400, 'נדרשת כותרת');
    if (!createdBy) throw httpError(400, 'נדרש מזהה יוצר');
    if (!Array.isArray(questions) || questions.length === 0) throw httpError(400, 'נדרשת לפחות שאלה אחת');
    for (let i = 0; i < questions.length; i += 1) {
      if (!isValidQuestion(questions[i])) throw httpError(400, `שאלה ${i + 1} אינה תקינה`);
    }

    const created = db.insert('exams', {
      title: title.trim(),
      description,
      status: 'draft',
      questions,
      createdBy,
      createdAt: Date.now(),
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
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
    const updated = db.update('exams', req.params.id, patch);
    if (!updated) throw httpError(404, 'הבחינה לא נמצאה');
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!STATUS.has(status)) throw httpError(400, 'סטטוס לא תקין');
    const updated = db.update('exams', req.params.id, { status });
    if (!updated) throw httpError(404, 'הבחינה לא נמצאה');
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  const ok = db.remove('exams', req.params.id);
  if (!ok) return next(httpError(404, 'הבחינה לא נמצאה'));
  res.status(204).end();
});

export default router;
