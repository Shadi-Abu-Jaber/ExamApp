const { body } = require('express-validator');

const questionCreateValidator = [
  body('questionText').notEmpty().withMessage('Question text is required'),
  body('questionType').isIn(['MCQ', 'TRUE_FALSE', 'SHORT_TEXT', 'ESSAY']).withMessage('Valid question type is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('orderIndex').isInt({ min: 1 }).withMessage('Order index must be a positive integer'),
  body('options').custom((options, { req }) => {
    if (req.body.questionType === 'MCQ' && (!Array.isArray(options) || options.length < 2)) {
      throw new Error('MCQ questions require at least two options');
    }
    return true;
  }),
];

const questionUpdateValidator = [
  body('questionText').optional().notEmpty().withMessage('Question text is required'),
  body('questionType').optional().isIn(['MCQ', 'TRUE_FALSE', 'SHORT_TEXT', 'ESSAY']).withMessage('Valid question type is required'),
  body('points').optional().isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('orderIndex').optional().isInt({ min: 1 }).withMessage('Order index must be a positive integer'),
];

module.exports = {
  questionCreateValidator,
  questionUpdateValidator,
};
