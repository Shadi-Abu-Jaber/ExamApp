const prisma = require('../config/prisma');

const fetchStudentExams = async (req, res, next) => {
  try {
    const assigned = await prisma.examStudent.findMany({
      where: {
        studentId: req.user.id,
      },
      include: {
        exam: {
          include: {
            lecturer: {
              select: {
                id: true,
                fullName: true,
              },
            },
            submissions: {
              where: {
                studentId: req.user.id,
              },
              select: {
                id: true,
                status: true,
                submittedAt: true,
                totalScore: true,
              },
            },
          },
        },
      },
    });

    const exams = assigned
      .map((assignment) => {
        const exam = assignment.exam;
        const studentSubmission = exam.submissions?.[0] || null;

        const { submissions, ...examWithoutSubmissions } = exam;

        return {
          ...examWithoutSubmissions,
          studentSubmission,
        };
      })
      .filter((exam) => {
        const submissionStatus = exam.studentSubmission?.status;

        if (exam.status !== 'PUBLISHED') {
          return false;
        }

        if (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED') {
          return false;
        }

        return true;
      });

    return res.json(exams);
  } catch (error) {
    next(error);
  }
};

const startExam = async (req, res, next) => {
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

    if (exam.status !== 'PUBLISHED') {
      return res.status(400).json({
        message: 'Exam is not available',
      });
    }

    const assigned = await prisma.examStudent.findFirst({
      where: {
        examId: exam.id,
        studentId: req.user.id,
      },
    });

    if (!assigned) {
      return res.status(403).json({
        message: 'Not assigned to this exam',
      });
    }

    const existing = await prisma.submission.findFirst({
      where: {
        examId: exam.id,
        studentId: req.user.id,
      },
    });

    if (existing && existing.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        message: 'Exam already submitted',
      });
    }

    if (existing) {
      return res.json(existing);
    }

    const submission = await prisma.submission.create({
      data: {
        examId: exam.id,
        studentId: req.user.id,
      },
    });

    return res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.submissionId,
      },
      include: {
        exam: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (submission.studentId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    return res.json(submission);
  } catch (error) {
    next(error);
  }
};

const autoSaveAnswer = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.submissionId,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (submission.studentId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (submission.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        message: 'Cannot update answers',
      });
    }

    const exam = await prisma.exam.findUnique({
      where: {
        id: submission.examId,
      },
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    const now = new Date();

    if (exam.endTime && now > exam.endTime) {
      return res.status(400).json({
        message: 'Exam time has ended',
      });
    }

    const { questionId, answerText, selectedOptionId } = req.body;

    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      return res.status(404).json({
        message: 'Question not found',
      });
    }

    const answer = await prisma.answer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: submission.id,
          questionId,
        },
      },
      update: {
        answerText,
        selectedOptionId,
      },
      create: {
        submissionId: submission.id,
        questionId,
        answerText,
        selectedOptionId,
      },
    });

    return res.json(answer);
  } catch (error) {
    next(error);
  }
};

const autoGradeSubmission = async (submissionId) => {
  const answers = await prisma.answer.findMany({
    where: {
      submissionId,
    },
    include: {
      question: {
        include: {
          options: true,
        },
      },
    },
  });

  let totalScore = 0;
  let autoGradedCount = 0;
  let manualCount = 0;

  for (const answer of answers) {
    const question = answer.question;
    const questionType = question.questionType;
    const points = Number(question.points || 0);

    if (questionType === 'MCQ' || questionType === 'TRUE_FALSE') {
      const correctOption = question.options.find((option) => option.isCorrect);
      const isCorrect =
        Boolean(correctOption) &&
        Boolean(answer.selectedOptionId) &&
        answer.selectedOptionId === correctOption.id;

      const score = isCorrect ? points : 0;

      await prisma.answer.update({
        where: {
          id: answer.id,
        },
        data: {
          score,
          feedback: isCorrect
            ? 'Auto graded: correct answer.'
            : 'Auto graded: incorrect answer.',
        },
      });

      totalScore += score;
      autoGradedCount += 1;
    } else {
      manualCount += 1;
      totalScore += Number(answer.score || 0);
    }
  }

  return {
    totalScore,
    autoGradedCount,
    manualCount,
    hasManualQuestions: manualCount > 0,
  };
};

const submitExam = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: req.params.submissionId,
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found',
      });
    }

    if (submission.studentId !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (submission.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        message: 'Already submitted',
      });
    }

    const now = new Date();

    const gradingResult = await autoGradeSubmission(submission.id);

    const finalStatus = gradingResult.hasManualQuestions
      ? 'SUBMITTED'
      : 'GRADED';

    await prisma.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: finalStatus,
        submittedAt: now,
        totalScore: gradingResult.totalScore,
        feedback: gradingResult.hasManualQuestions
          ? 'Objective questions were auto graded. Manual questions are waiting for lecturer review.'
          : 'All questions were auto graded.',
      },
    });

    if (submission.exam?.endTime && now > submission.exam.endTime) {
      return res.json({
        message: 'Exam time ended, submission locked and auto graded',
        status: finalStatus,
        totalScore: gradingResult.totalScore,
        autoGradedCount: gradingResult.autoGradedCount,
        manualCount: gradingResult.manualCount,
      });
    }

    return res.json({
      message: gradingResult.hasManualQuestions
        ? 'Submission received. Objective questions were auto graded; manual grading is required.'
        : 'Submission received and fully auto graded.',
      status: finalStatus,
      totalScore: gradingResult.totalScore,
      autoGradedCount: gradingResult.autoGradedCount,
      manualCount: gradingResult.manualCount,
    });
  } catch (error) {
    next(error);
  }
};

const getResults = async (req, res, next) => {
  try {
    const results = await prisma.submission.findMany({
      where: {
        studentId: req.user.id,
        status: {
          in: ['SUBMITTED', 'GRADED'],
        },
        exam: {
          resultsPublished: true,
        },
      },
      include: {
        exam: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return res.json(results);
  } catch (error) {
    next(error);
  }
};

const getResultByExam = async (req, res, next) => {
  try {
    const submission = await prisma.submission.findFirst({
      where: {
        examId: req.params.examId,
        studentId: req.user.id,
        status: {
          in: ['SUBMITTED', 'GRADED'],
        },
      },
      include: {
        exam: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!submission || !submission.exam.resultsPublished) {
      return res.status(404).json({
        message: 'Result not available',
      });
    }

    return res.json(submission);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchStudentExams,
  startExam,
  getSubmission,
  autoSaveAnswer,
  submitExam,
  getResults,
  getResultByExam,
};