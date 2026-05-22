const prisma = require('../config/prisma');

const lecturerExamStats = async (req, res, next) => {
  try {
    const examId = req.params.examId;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.lecturerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const submissions = await prisma.submission.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    const assigned = await prisma.examStudent.count({
      where: { examId },
    });

    const gradedSubmissions = submissions.filter(
      (submission) => submission.status === 'GRADED'
    );

    const submittedSubmissions = submissions.filter(
      (submission) => submission.status === 'SUBMITTED'
    );

    const scoredSubmissions = submissions.filter(
      (submission) =>
        submission.totalScore !== null && submission.totalScore !== undefined
    );

    const scores = scoredSubmissions.map((submission) =>
      Number(submission.totalScore)
    );

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    const totalPossiblePoints = exam.questions.reduce((sum, question) => {
      return sum + Number(question.points || 0);
    }, 0);

    const passThreshold = totalPossiblePoints * 0.6;

    const passedCount = scores.filter((score) => score >= passThreshold).length;

    const passRate =
      scores.length > 0 ? Math.round((passedCount / scores.length) * 100) : 0;

    const scoreDistribution = [
      { range: '0-49', count: scores.filter((score) => score < 50).length },
      {
        range: '50-59',
        count: scores.filter((score) => score >= 50 && score < 60).length,
      },
      {
        range: '60-69',
        count: scores.filter((score) => score >= 60 && score < 70).length,
      },
      {
        range: '70-79',
        count: scores.filter((score) => score >= 70 && score < 80).length,
      },
      {
        range: '80-89',
        count: scores.filter((score) => score >= 80 && score < 90).length,
      },
      {
        range: '90-100',
        count: scores.filter((score) => score >= 90).length,
      },
    ];

    const questionPerformance = exam.questions.map((question) => {
      const answers = submissions.flatMap((submission) =>
        submission.answers.filter((answer) => answer.questionId === question.id)
      );

      const answeredCount = answers.length;

      const totalQuestionScore = answers.reduce((sum, answer) => {
        return sum + Number(answer.score || 0);
      }, 0);

      const maxQuestionScore = answeredCount * Number(question.points || 0);

      const successRate =
        maxQuestionScore > 0
          ? Math.round((totalQuestionScore / maxQuestionScore) * 100)
          : 0;

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        points: question.points,
        answeredCount,
        averageScore:
          answeredCount > 0
            ? Number((totalQuestionScore / answeredCount).toFixed(2))
            : 0,
        successRate,
      };
    });

    const hardestQuestions = [...questionPerformance]
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);

    return res.json({
      examId: exam.id,
      title: exam.title,
      status: exam.status,
      assignedStudents: assigned,
      submissions: submissions.length,
      submitted: submittedSubmissions.length,
      graded: gradedSubmissions.length,
      pendingGrading: submittedSubmissions.length,
      totalPossiblePoints,
      averageScore: Number(averageScore.toFixed(2)),
      highestScore,
      lowestScore,
      passRate,
      scoreDistribution,
      questionPerformance,
      hardestQuestions,
    });
  } catch (error) {
    next(error);
  }
};

const lecturerStatistics = async (req, res, next) => {
  try {
    const lecturerId = req.user.id;

    const exams = await prisma.exam.findMany({
      where: {
        lecturerId,
      },
      include: {
        submissions: true,
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

    const totalExams = exams.length;

    const draftExams = exams.filter((exam) => exam.status === 'DRAFT').length;
    const publishedExams = exams.filter(
      (exam) => exam.status === 'PUBLISHED'
    ).length;
    const closedExams = exams.filter((exam) => exam.status === 'CLOSED').length;

    const allSubmissions = exams.flatMap((exam) => exam.submissions || []);

    const totalSubmissions = allSubmissions.length;

    const inProgressSubmissions = allSubmissions.filter(
      (submission) => submission.status === 'IN_PROGRESS'
    ).length;

    const submittedSubmissions = allSubmissions.filter(
      (submission) => submission.status === 'SUBMITTED'
    ).length;

    const gradedSubmissions = allSubmissions.filter(
      (submission) => submission.status === 'GRADED'
    ).length;

    const pendingGrading = submittedSubmissions;

    const scoredSubmissions = allSubmissions.filter(
      (submission) =>
        submission.totalScore !== null && submission.totalScore !== undefined
    );

    const scores = scoredSubmissions.map((submission) =>
      Number(submission.totalScore)
    );

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    const passRate =
      scores.length > 0
        ? Math.round(
            (scores.filter((score) => score >= 60).length / scores.length) * 100
          )
        : 0;

    const examStatusData = [
      { name: 'Draft', value: draftExams },
      { name: 'Published', value: publishedExams },
      { name: 'Closed', value: closedExams },
    ];

    const submissionStatusData = [
      { name: 'In Progress', value: inProgressSubmissions },
      { name: 'Submitted', value: submittedSubmissions },
      { name: 'Graded', value: gradedSubmissions },
    ];

    const examPerformance = exams.map((exam) => {
      const examScores = exam.submissions
        .filter(
          (submission) =>
            submission.totalScore !== null && submission.totalScore !== undefined
        )
        .map((submission) => Number(submission.totalScore));

      const examAverage =
        examScores.length > 0
          ? examScores.reduce((sum, score) => sum + score, 0) /
            examScores.length
          : 0;

      return {
        examId: exam.id,
        title: exam.title,
        status: exam.status,
        questions: exam._count.questions,
        assignedStudents: exam._count.assignments,
        submissions: exam._count.submissions,
        averageScore: Number(examAverage.toFixed(2)),
      };
    });

    return res.json({
      totalExams,
      draftExams,
      publishedExams,
      closedExams,
      totalSubmissions,
      inProgressSubmissions,
      submittedSubmissions,
      gradedSubmissions,
      pendingGrading,
      averageScore: Number(averageScore.toFixed(2)),
      highestScore,
      lowestScore,
      passRate,
      examStatusData,
      submissionStatusData,
      examPerformance,
    });
  } catch (error) {
    next(error);
  }
};

const adminStatistics = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();

    const totalAdmins = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const totalLecturers = await prisma.user.count({
      where: { role: 'LECTURER' },
    });

    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' },
    });

    const totalExams = await prisma.exam.count();

    const draftExams = await prisma.exam.count({
      where: { status: 'DRAFT' },
    });

    const publishedExams = await prisma.exam.count({
      where: { status: 'PUBLISHED' },
    });

    const closedExams = await prisma.exam.count({
      where: { status: 'CLOSED' },
    });

    const totalSubmissions = await prisma.submission.count();

    const gradedSubmissions = await prisma.submission.count({
      where: { status: 'GRADED' },
    });

    const submittedSubmissions = await prisma.submission.count({
      where: { status: 'SUBMITTED' },
    });

    return res.json({
      totalUsers,
      totalAdmins,
      totalLecturers,
      totalStudents,
      totalExams,
      draftExams,
      publishedExams,
      closedExams,
      totalSubmissions,
      gradedSubmissions,
      submittedSubmissions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  lecturerExamStats,
  lecturerStatistics,
  adminStatistics,
};