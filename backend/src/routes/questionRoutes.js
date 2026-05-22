const express = require('express');
const { addQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const { questionCreateValidator, questionUpdateValidator } = require('../validators/questionValidator');

const router = express.Router();
router.use(authMiddleware);

router.post('/exams/:examId/questions', authorize(['LECTURER']), questionCreateValidator, addQuestion);
router.get('/exams/:examId/questions', getQuestions);
router.patch('/questions/:id', authorize(['LECTURER']), questionUpdateValidator, updateQuestion);
router.delete('/questions/:id', authorize(['LECTURER']), deleteQuestion);

module.exports = router;
