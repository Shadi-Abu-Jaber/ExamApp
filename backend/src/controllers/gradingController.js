const prisma = require('../config/prisma');

const canManageSubmission = (submission, user) => {
  return submission.exam.lecturerId === user.id || user.role === 'ADMIN';
};

const calculateSubmissionTotal = async (submissionId) => {
  const answers = await prisma.answer.findMany({
    where: {
      submissionId,
    },
    include: {
      question: true,
    },
  });

  const totalScore = answers.reduce((sum, answer) => {
    return sum + Number(answer.score || 0);
  }, 0);

  const totalPossible = answers.reduce((sum, answer) => {
    return sum + Number(answer.question?.points || 0);
  }, 0);

  return {
    totalScore,
    totalPossible,
  };
};

const listSubmissions = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: req.params.examId,
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

    const submissions = await prisma.submission.findMany({
      where: {
        examId: exam.id,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return res.json(submissions);
  } catch (error) {
    next(error);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: {
            question: {
              orderIndex: 'asc',
            },
          },
        },
        exam: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (!canManageSubmission(submission, req.user)) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    return res.json(submission);
  } catch (error) {
    next(error);
  }
};

const gradeAnswer = async (req, res, next) => {
  try {
    const { score, feedback } = req.body;

    const answer = await prisma.answer.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        question: true,
        submission: {
          include: {
            exam: true,
          },
        },
      },
    });

    if (!answer) {
      return res.status(404).json({
        message: 'Answer not found',
      });
    }

    if (!canManageSubmission(answer.submission, req.user)) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) {
      return res.status(400).json({
        message: 'Score must be a valid number',
      });
    }

    if (numericScore < 0) {
      return res.status(400).json({
        message: 'Score cannot be negative',
      });
    }

    const maxPoints = Number(answer.question?.points || 0);

    if (numericScore > maxPoints) {
      return res.status(400).json({
        message: `Score cannot exceed question points (${maxPoints})`,
      });
    }

    const updatedAnswer = await prisma.answer.update({
      where: {
        id: answer.id,
      },
      data: {
        score: numericScore,
        feedback: feedback || null,
      },
    });

    const totals = await calculateSubmissionTotal(answer.submissionId);

    const updatedSubmission = await prisma.submission.update({
      where: {
        id: answer.submissionId,
      },
      data: {
        totalScore: totals.totalScore,
      },
    });

    return res.json({
      answer: updatedAnswer,
      submission: updatedSubmission,
      totalScore: totals.totalScore,
      totalPossible: totals.totalPossible,
    });
  } catch (error) {
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { totalScore, feedback } = req.body;

    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        exam: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (!canManageSubmission(submission, req.user)) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (submission.status !== 'SUBMITTED' && submission.status !== 'GRADED') {
      return res.status(400).json({
        message: 'Only submitted exams can be graded',
      });
    }

    const totalPossible = submission.answers.reduce((sum, answer) => {
      return sum + Number(answer.question?.points || 0);
    }, 0);

    let finalScore;

    if (totalScore !== undefined && totalScore !== null && totalScore !== '') {
      finalScore = Number(totalScore);

      if (Number.isNaN(finalScore)) {
        return res.status(400).json({
          message: 'Total score must be a valid number',
        });
      }

      if (finalScore < 0) {
        return res.status(400).json({
          message: 'Total score cannot be negative',
        });
      }

      if (finalScore > totalPossible) {
        return res.status(400).json({
          message: `Total score cannot exceed total possible points (${totalPossible})`,
        });
      }
    } else {
      const totals = await calculateSubmissionTotal(submission.id);
      finalScore = totals.totalScore;
    }

    const updated = await prisma.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        totalScore: finalScore,
        feedback: feedback || null,
        status: 'GRADED',
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};

const publishGrade = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        exam: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (!canManageSubmission(submission, req.user)) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (submission.status !== 'GRADED') {
      return res.status(400).json({
        message: 'Submission must be graded before publishing results',
      });
    }

    const updatedExam = await prisma.exam.update({
      where: {
        id: submission.examId,
      },
      data: {
        resultsPublished: true,
      },
    });

    return res.json({
      message: 'Results published',
      exam: updatedExam,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSubmissions,
  getSubmission,
  gradeAnswer,
  gradeSubmission,
  publishGrade,
};