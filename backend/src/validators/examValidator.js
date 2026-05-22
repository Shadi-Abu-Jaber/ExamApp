const { body } = require('express-validator');

const examCreateValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('startTime').isISO8601().toDate().withMessage('Valid start time is required'),
  body('endTime').isISO8601().toDate().withMessage('Valid end time is required'),
];

const examUpdateValidator = [
  body('title').optional().notEmpty().withMessage('Title is required'),
  body('description').optional().notEmpty().withMessage('Description is required'),
  body('durationMinutes').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('startTime').optional().isISO8601().toDate().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().toDate().withMessage('Valid end time is required'),
];

const assignStudentsValidator = [
  body('studentIds').isArray({ min: 1 }).withMessage('studentIds must be an array with at least one entry'),
];

module.exports = {
  examCreateValidator,
  examUpdateValidator,
  assignStudentsValidator,
};
