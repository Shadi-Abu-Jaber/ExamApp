const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

const createExam = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    const { title, description, durationMinutes, startTime, endTime } = req.body;

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        lecturerId: req.user.id,
        durationMinutes,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

const listExams = async (req, res, next) => {
  try {
    const user = req.user;
    const where = {};

    if (user.role === 'LECTURER') {
      where.lecturerId = user.id;
    }

    if (user.role === 'STUDENT') {
      const assigned = await prisma.examStudent.findMany({
        where: {
          studentId: user.id,
        },
        select: {
          examId: true,
        },
      });

      where.id = {
        in: assigned.map((item) => item.examId),
      };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(exams);
  } catch (error) {
    next(error);
  }
};

const getExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            submissions: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (req.user.role === 'STUDENT') {
      const assigned = await prisma.examStudent.findFirst({
        where: {
          examId: exam.id,
          studentId: req.user.id,
        },
      });

      if (!assigned) {
        return res.status(403).json({
          message: 'Access denied',
        });
      }
    }

    return res.json(exam);
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const existing = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (existing.lecturerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    const data = { ...req.body };

    if (data.startTime) {
      data.startTime = new Date(data.startTime);
    }

    if (data.endTime) {
      data.endTime = new Date(data.endTime);
    }

    const updated = await prisma.exam.update({
      where: {
        id: req.params.id,
      },
      data,
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const existing = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (existing.lecturerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({
        message: 'Only draft exams can be deleted.',
      });
    }

    const submissionCount = await prisma.submission.count({
      where: {
        examId: existing.id,
      },
    });

    if (submissionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete exam because it already has submissions.',
      });
    }

    await prisma.exam.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const publishExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        _count: {
          select: {
            questions: true,
            assignments: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (exam.lecturerId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (exam.status !== 'DRAFT') {
      return res.status(400).json({
        message: 'Only draft exams can be published.',
      });
    }

    if (exam._count.questions === 0) {
      return res.status(400).json({
        message: 'Cannot publish exam without questions.',
      });
    }

    if (exam._count.assignments === 0) {
      return res.status(400).json({
        message: 'Assign at least one student before publishing.',
      });
    }

    const published = await prisma.exam.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: 'PUBLISHED',
      },
    });

    return res.json(published);
  } catch (error) {
    next(error);
  }
};

const closeExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (exam.lecturerId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (exam.status === 'CLOSED') {
      return res.status(400).json({
        message: 'Exam is already closed.',
      });
    }

    const closed = await prisma.exam.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: 'CLOSED',
      },
    });

    return res.json(closed);
  } catch (error) {
    next(error);
  }
};

const assignStudents = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (exam.lecturerId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    const { studentIds } = req.body;

    const assignments = studentIds.map((studentId) => ({
      examId: exam.id,
      studentId,
    }));

    await prisma.examStudent.deleteMany({
      where: {
        examId: exam.id,
      },
    });

    await prisma.examStudent.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    return res.json({
      message: 'Students assigned',
    });
  } catch (error) {
    next(error);
  }
};

const monitorExam = async (req, res, next) => {
  try {
    const examId = req.params.id;

    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            submissions: true,
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (exam.lecturerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const submissionByStudentId = new Map(
      exam.submissions.map((submission) => [submission.studentId, submission])
    );

    const students = exam.assignments.map((assignment) => {
      const submission = submissionByStudentId.get(assignment.studentId);

      return {
        student: assignment.student,
        status: submission?.status || 'NOT_STARTED',
        submissionId: submission?.id || null,
        startedAt: submission?.startedAt || submission?.createdAt || null,
        submittedAt: submission?.submittedAt || null,
        totalScore:
          submission?.totalScore !== undefined && submission?.totalScore !== null
            ? submission.totalScore
            : null,
      };
    });

    const summary = {
      assigned: exam.assignments.length,
      notStarted: students.filter((item) => item.status === 'NOT_STARTED').length,
      inProgress: students.filter((item) => item.status === 'IN_PROGRESS').length,
      submitted: students.filter((item) => item.status === 'SUBMITTED').length,
      graded: students.filter((item) => item.status === 'GRADED').length,
    };

    return res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime,
        endTime: exam.endTime,
        resultsPublished: exam.resultsPublished,
        lecturer: exam.lecturer,
        counts: exam._count,
      },
      summary,
      students,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
  closeExam,
  assignStudents,
  monitorExam,
};