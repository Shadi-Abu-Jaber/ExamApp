const express = require('express');
const { listSubmissions, getSubmission, gradeAnswer, gradeSubmission, publishGrade } = require('../controllers/gradingController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/lecturer/exams/:examId/submissions', authorize(['LECTURER']), listSubmissions);
router.get('/submissions/:id', authorize(['LECTURER', 'ADMIN']), getSubmission);
router.patch('/answers/:id/grade', authorize(['LECTURER']), gradeAnswer);
router.patch('/submissions/:id/grade', authorize(['LECTURER']), gradeSubmission);
router.post('/submissions/:id/publish-grade', authorize(['LECTURER']), publishGrade);

module.exports = router;
