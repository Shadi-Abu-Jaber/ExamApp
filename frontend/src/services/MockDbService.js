class MockDbService {
  constructor() {
    this.storageKey = 'examflow_mock_db';
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  createInitialDb() {
    const now = Date.now();

    return {
      exams: [
        {
          id: 'mock-exam-available-1',
          title: 'Database Fundamentals',
          description: 'Practice exam about databases and SQL basics.',
          lecturer: {
            id: 'mock-lecturer-1',
            fullName: 'Demo Lecturer',
          },
          durationMinutes: 30,
          startTime: new Date(now - 10 * 60 * 1000).toISOString(),
          endTime: new Date(now + 90 * 60 * 1000).toISOString(),
          status: 'PUBLISHED',
          resultsPublished: false,
          questions: [
            {
              id: 'mock-question-1',
              examId: 'mock-exam-available-1',
              questionText: 'Which language is commonly used to query relational databases?',
              questionType: 'MCQ',
              points: 5,
              orderIndex: 1,
              options: [
                {
                  id: 'mock-option-1-a',
                  optionText: 'SQL',
                  isCorrect: true,
                },
                {
                  id: 'mock-option-1-b',
                  optionText: 'HTML',
                  isCorrect: false,
                },
                {
                  id: 'mock-option-1-c',
                  optionText: 'CSS',
                  isCorrect: false,
                },
              ],
            },
            {
              id: 'mock-question-2',
              examId: 'mock-exam-available-1',
              questionText: 'A primary key uniquely identifies a row in a table.',
              questionType: 'TRUE_FALSE',
              points: 5,
              orderIndex: 2,
              options: [
                {
                  id: 'mock-option-2-a',
                  optionText: 'True',
                  isCorrect: true,
                },
                {
                  id: 'mock-option-2-b',
                  optionText: 'False',
                  isCorrect: false,
                },
              ],
            },
            {
              id: 'mock-question-3',
              examId: 'mock-exam-available-1',
              questionText: 'Write one advantage of using a database system.',
              questionType: 'SHORT_TEXT',
              points: 10,
              orderIndex: 3,
              options: [],
            },
          ],
        },
        {
          id: 'mock-exam-result-1',
          title: 'Introduction to Programming',
          description: 'Previously completed demo exam.',
          lecturer: {
            id: 'mock-lecturer-1',
            fullName: 'Demo Lecturer',
          },
          durationMinutes: 20,
          startTime: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(now - 7 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          status: 'CLOSED',
          resultsPublished: true,
          questions: [
            {
              id: 'mock-result-question-1',
              examId: 'mock-exam-result-1',
              questionText: 'JavaScript can run in the browser.',
              questionType: 'TRUE_FALSE',
              points: 10,
              orderIndex: 1,
              options: [
                {
                  id: 'mock-result-option-1-a',
                  optionText: 'True',
                  isCorrect: true,
                },
                {
                  id: 'mock-result-option-1-b',
                  optionText: 'False',
                  isCorrect: false,
                },
              ],
            },
          ],
        },
      ],
      submissions: [
        {
          id: 'mock-submission-result-1',
          examId: 'mock-exam-result-1',
          studentId: 'mock-student-1',
          status: 'GRADED',
          startedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
          submittedAt: new Date(
            now - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000
          ).toISOString(),
          totalScore: 10,
          feedback: 'Excellent work.',
          answers: [
            {
              id: 'mock-answer-result-1',
              submissionId: 'mock-submission-result-1',
              questionId: 'mock-result-question-1',
              selectedOptionId: 'mock-result-option-1-a',
              answerText: '',
              score: 10,
              feedback: 'Correct answer.',
            },
          ],
        },
      ],
    };
  }

  read() {
    const saved = window.localStorage.getItem(this.storageKey);

    if (!saved) {
      const initialDb = this.createInitialDb();
      this.write(initialDb);
      return initialDb;
    }

    return JSON.parse(saved);
  }

  write(db) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  reset() {
    const initialDb = this.createInitialDb();
    this.write(initialDb);
    return this.clone(initialDb);
  }

  listAvailableExams() {
    const db = this.read();

    const exams = db.exams.filter((exam) => {
      const submission = db.submissions.find(
        (item) => item.examId === exam.id
      );

      return exam.status === 'PUBLISHED' && !submission;
    });

    return this.clone(exams);
  }

  getExamQuestions(examId) {
    const db = this.read();
    const exam = db.exams.find((item) => item.id === examId);

    if (!exam) {
      throw new Error('Exam not found.');
    }

    return this.clone(exam.questions || []);
  }

  startExam(examId) {
    const db = this.read();
    const exam = db.exams.find((item) => item.id === examId);

    if (!exam) {
      throw new Error('Exam not found.');
    }

    if (exam.status !== 'PUBLISHED') {
      throw new Error('Exam is not available.');
    }

    const existing = db.submissions.find(
      (submission) => submission.examId === examId
    );

    if (existing) {
      return this.clone(existing);
    }

    const submission = {
      id: `mock-submission-${Date.now()}`,
      examId,
      studentId: 'mock-student-1',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      submittedAt: null,
      totalScore: 0,
      feedback: null,
      answers: [],
    };

    db.submissions.push(submission);
    this.write(db);

    return this.clone(submission);
  }

  getSubmission(submissionId) {
    const db = this.read();
    const submission = db.submissions.find((item) => item.id === submissionId);

    if (!submission) {
      throw new Error('Submission not found.');
    }

    const exam = db.exams.find((item) => item.id === submission.examId);

    return this.clone({
      ...submission,
      exam,
    });
  }

  saveAnswer(submissionId, payload) {
    const db = this.read();
    const submission = db.submissions.find((item) => item.id === submissionId);

    if (!submission) {
      throw new Error('Submission not found.');
    }

    if (submission.status !== 'IN_PROGRESS') {
      throw new Error('Cannot update answers after submission.');
    }

    const existingAnswer = submission.answers.find(
      (answer) => answer.questionId === payload.questionId
    );

    if (existingAnswer) {
      existingAnswer.answerText = payload.answerText || '';
      existingAnswer.selectedOptionId = payload.selectedOptionId || null;
      this.write(db);
      return this.clone(existingAnswer);
    }

    const answer = {
      id: `mock-answer-${Date.now()}`,
      submissionId,
      questionId: payload.questionId,
      answerText: payload.answerText || '',
      selectedOptionId: payload.selectedOptionId || null,
      score: 0,
      feedback: null,
    };

    submission.answers.push(answer);
    this.write(db);

    return this.clone(answer);
  }

  submitExam(submissionId) {
    const db = this.read();
    const submission = db.submissions.find((item) => item.id === submissionId);

    if (!submission) {
      throw new Error('Submission not found.');
    }

    const exam = db.exams.find((item) => item.id === submission.examId);

    if (!exam) {
      throw new Error('Exam not found.');
    }

    let totalScore = 0;
    let hasManualQuestions = false;

    submission.answers.forEach((answer) => {
      const question = exam.questions.find(
        (item) => item.id === answer.questionId
      );

      if (!question) return;

      if (question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE') {
        const correctOption = question.options.find((option) => option.isCorrect);
        answer.score =
          correctOption && answer.selectedOptionId === correctOption.id
            ? question.points
            : 0;

        answer.feedback =
          answer.score > 0 ? 'Auto graded: correct answer.' : 'Auto graded: incorrect answer.';

        totalScore += answer.score;
      } else {
        hasManualQuestions = true;
      }
    });

    submission.status = hasManualQuestions ? 'SUBMITTED' : 'GRADED';
    submission.submittedAt = new Date().toISOString();
    submission.totalScore = totalScore;
    submission.feedback = hasManualQuestions
      ? 'Objective questions were auto graded. Manual review is required.'
      : 'All questions were auto graded.';

    this.write(db);

    return this.clone({
      message: 'Submission received successfully.',
      status: submission.status,
      totalScore: submission.totalScore,
    });
  }

  listResults() {
    const db = this.read();

    const results = db.submissions
      .filter((submission) => {
        const exam = db.exams.find((item) => item.id === submission.examId);

        return (
          exam &&
          exam.resultsPublished &&
          ['SUBMITTED', 'GRADED'].includes(submission.status)
        );
      })
      .map((submission) => {
        const exam = db.exams.find((item) => item.id === submission.examId);

        return {
          ...submission,
          exam,
        };
      });

    return this.clone(results);
  }

  getResult(examId) {
    const results = this.listResults();
    const result = results.find((item) => item.examId === examId);

    if (!result) {
      throw new Error('Result not available.');
    }

    return this.clone(result);
  }
}

const mockDbService = new MockDbService();

export default mockDbService;