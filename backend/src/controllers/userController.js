const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (error) {
    next(error);
  }
};

const listStudents = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
      orderBy: {
        fullName: 'asc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(students);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    const { fullName, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
      },
    });

    return res.status(201).json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    const data = { ...req.body };

    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing && existing.id !== id) {
        return res.status(409).json({
          message: 'Email already registered',
        });
      }
    }

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    } else {
      delete data.password;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUser = req.user;

    if (currentUser.id === targetId) {
      return res.status(400).json({
        message: 'Cannot delete your own account',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot delete the last admin user',
        });
      }
    }

    const ownedExams = await prisma.exam.count({
      where: { lecturerId: targetId },
    });

    if (ownedExams > 0) {
      return res.status(400).json({
        message: 'Cannot delete this user because they own exams',
      });
    }

    const submissionCount = await prisma.submission.count({
      where: { studentId: targetId },
    });

    if (submissionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete this user because they have submissions',
      });
    }

    const assignmentCount = await prisma.examStudent.count({
      where: { studentId: targetId },
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete this user because they are assigned to exams',
      });
    }

    await prisma.user.delete({
      where: { id: targetId },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  listStudents,
  createUser,
  updateUser,
  deleteUser,
};