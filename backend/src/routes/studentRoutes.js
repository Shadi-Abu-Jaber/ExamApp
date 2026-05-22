const express = require('express');
const { fetchStudentExams, startExam, getSubmission, autoSaveAnswer, submitExam, getResults, getResultByExam } = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const { answerAutosaveValidator } = require('../validators/studentValidator');

const router = express.Router();
router.use(authMiddleware, authorize(['STUDENT']));

router.get('/exams', fetchStudentExams);
router.post('/exams/:examId/start', startExam);
router.get('/submissions/:submissionId', getSubmission);
router.post('/submissions/:submissionId/answers/autosave', answerAutosaveValidator, autoSaveAnswer);
router.post('/submissions/:submissionId/submit', submitExam);
router.get('/results', getResults);
router.get('/results/:examId', getResultByExam);

module.exports = router;
