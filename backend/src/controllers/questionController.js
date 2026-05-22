const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

const addQuestion = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.examId } });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.lecturerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { questionText, questionType, points, orderIndex, options = [] } = req.body;
    const question = await prisma.question.create({
      data: {
        examId: exam.id,
        questionText,
        questionType,
        points,
        orderIndex,
        options: options.length
          ? { create: options.map((option) => ({ optionText: option.optionText, isCorrect: !!option.isCorrect })) }
          : undefined,
      },
      include: { options: true },
    });
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.examId } });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (req.user.role === 'LECTURER' && exam.lecturerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'STUDENT') {
      const assigned = await prisma.examStudent.findFirst({ where: { examId: exam.id, studentId: req.user.id } });
      if (!assigned) return res.status(403).json({ message: 'Forbidden' });
    }
    const questions = await prisma.question.findMany({
      where: { examId: req.params.examId },
      include: { options: true },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    const exam = await prisma.exam.findUnique({ where: { id: question.examId } });
    if (exam.lecturerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const data = { ...req.body };
    const updated = await prisma.question.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    const exam = await prisma.exam.findUnique({ where: { id: question.examId } });
    if (exam.lecturerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await prisma.question.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
};