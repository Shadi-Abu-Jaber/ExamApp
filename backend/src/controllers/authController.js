const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

const getSafeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    return res.json({
      user: getSafeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { fullName, email, password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    /*
      Security rule:
      Public registration can ONLY create STUDENT accounts.
      ADMIN and LECTURER accounts must be created by an ADMIN from the Users page.
      Do not use req.body.role here.
    */
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'STUDENT',
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      user: getSafeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = req.user;

    return res.json(getSafeUser(user));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  me,
};