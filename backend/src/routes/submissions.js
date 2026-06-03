import { Router } from 'express';
import { db } from '../db.js';
import { httpError } from '../middlewares/errorHandler.js';

const router = Router();

router.get('/', (req, res) => {
  let rows = db.list('submissions');
  const { studentId, examId } = req.query;
  if (studentId) rows = rows.filter(s => s.studentId === studentId);
  if (examId) rows = rows.filter(s => s.examId === examId);
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const { examId, studentId, answers } = req.body || {};
    if (!examId || !studentId || !Array.isArray(answers)) {
      throw httpError(400, 'examId, studentId ו-answers נדרשים');
    }
    const exam = db.findById('exams', examId);
    if (!exam) throw httpError(404, 'הבחינה לא נמצאה');

    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += 1;
    });

    const created = db.insert('submissions', {
      examId,
      studentId,
      answers,
      score,
      total: exam.questions.length,
      submittedAt: Date.now(),
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

export default router;
