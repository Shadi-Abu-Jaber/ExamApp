const express = require('express');

const {
  lecturerExamStats,
  lecturerStatistics,
  adminStatistics,
} = require('../controllers/statisticsController');

const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/lecturer/statistics',
  authorize(['LECTURER']),
  lecturerStatistics
);

router.get(
  '/lecturer/exams/:examId/statistics',
  authorize(['LECTURER']),
  lecturerExamStats
);

router.get(
  '/admin/statistics',
  authorize(['ADMIN']),
  adminStatistics
);

module.exports = router;