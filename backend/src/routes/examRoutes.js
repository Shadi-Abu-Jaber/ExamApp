const express = require('express');

const {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
  closeExam,
  assignStudents,
  monitorExam,
} = require('../controllers/examController');

const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const {
  examCreateValidator,
  examUpdateValidator,
  assignStudentsValidator,
} = require('../validators/examValidator');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  authorize(['LECTURER', 'ADMIN']),
  examCreateValidator,
  createExam
);

router.get('/', listExams);

/*
  Important:
  This route must be BEFORE router.get('/:id', getExam)
  so Express does not treat "monitor" as a normal exam id.
*/
router.get(
  '/:id/monitor',
  authorize(['LECTURER', 'ADMIN']),
  monitorExam
);

router.get('/:id', getExam);

router.patch(
  '/:id',
  authorize(['LECTURER', 'ADMIN']),
  examUpdateValidator,
  updateExam
);

router.delete(
  '/:id',
  authorize(['LECTURER', 'ADMIN']),
  deleteExam
);

router.post(
  '/:id/publish',
  authorize(['LECTURER']),
  publishExam
);

router.post(
  '/:id/close',
  authorize(['LECTURER']),
  closeExam
);

router.post(
  '/:id/assign-students',
  authorize(['LECTURER']),
  assignStudentsValidator,
  assignStudents
);

module.exports = router;