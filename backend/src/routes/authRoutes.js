const express = require('express');
const { login, register, me } = require('../controllers/authController');
const { loginValidator, registerValidator } = require('../validators/authValidator');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);
router.get('/me', authMiddleware, me);

module.exports = router;
