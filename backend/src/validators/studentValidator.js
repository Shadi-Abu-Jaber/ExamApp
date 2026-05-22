const { body } = require('express-validator');

const answerAutosaveValidator = [
  body('answerText').optional().isString(),
  body('selectedOptionId').optional().isString(),
];

module.exports = {
  answerAutosaveValidator,
};
