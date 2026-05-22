const { body } = require('express-validator');

const userCreateValidator = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['ADMIN', 'LECTURER', 'STUDENT']).withMessage('Valid role is required'),
];

const userUpdateValidator = [
  body('fullName').optional().notEmpty().withMessage('Full name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['ADMIN', 'LECTURER', 'STUDENT']).withMessage('Valid role is required'),
];

module.exports = {
  userCreateValidator,
  userUpdateValidator,
};
