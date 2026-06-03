// שירות בחינות (ExamService) ושירות הגשות (SubmissionService).
// שני השירותים עוטפים את ה-MockDb ומוסיפים:
//   1. סימולציה של השהיית רשת (כדי שהפיתוח ידמה backend אמיתי)
//   2. ולידציה וכללי דומיין (פרסום, חישוב ציון וכו')

import { Exam, EXAM_STATUS } from '../models/Exam.js';
import { Submission } from '../models/Submission.js';

// כלי עזר קטן: ממתין X מילישניות לפני המשך הקוד.
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ExamService {
  constructor({ db, config, logger }) {
    this.db = db;
    this.config = config;
    this.logger = logger?.child('examService');
  }

  async _simulateLatency() {
    await delay(this.config.get('mockLatencyMs'));
  }

  async listAll() {
    await this._simulateLatency();
    return this.db.list('exams');
  }

  async listPublished() {
    await this._simulateLatency();
    return this.db.list('exams').filter(e => e.status === EXAM_STATUS.PUBLISHED);
  }

  async listByTeacher(teacherId) {
    await this._simulateLatency();
    return this.db.list('exams').filter(e => e.createdBy === teacherId);
  }

  async getById(id) {
    await this._simulateLatency();
    const exam = this.db.findById('exams', id);
    if (!exam) throw new Error('הבחינה לא נמצאה');
    return exam;
  }

  async create({ title, description, questions, createdBy }) {
    await this._simulateLatency();
    const exam = new Exam({ title, description, questions, createdBy });
    this.logger?.info('create exam', exam.id, exam.title);
    return this.db.insert('exams', exam);
  }

  async update(id, patch) {
    await this._simulateLatency();
    const updated = this.db.update('exams', id, patch);
    if (!updated) throw new Error('הבחינה לא נמצאה');
    return updated;
  }

  async setStatus(id, status) {
    if (!Object.values(EXAM_STATUS).includes(status)) {
      throw new Error('סטטוס לא תקין');
    }
    return this.update(id, { status });
  }

  async remove(id) {
    await this._simulateLatency();
    return this.db.remove('exams', id);
  }
}

export class SubmissionService {
  constructor({ db, config, logger }) {
    this.db = db;
    this.config = config;
    this.logger = logger?.child('submissionService');
  }

  async _simulateLatency() {
    await delay(this.config.get('mockLatencyMs'));
  }

  async listByStudent(studentId) {
    await this._simulateLatency();
    return this.db.list('submissions').filter(s => s.studentId === studentId);
  }

  async listByExam(examId) {
    await this._simulateLatency();
    return this.db.list('submissions').filter(s => s.examId === examId);
  }

  // הגשת בחינה: מקבל את התשובות, סוגר אותן מול הבחינה ומחשב ציון.
  // הציון מחושב כאן (ולא בלקוח) כדי לרכז את הכלל במקום אחד.
  async submit({ examId, studentId, answers }) {
    await this._simulateLatency();
    const exam = this.db.findById('exams', examId);
    if (!exam) throw new Error('הבחינה לא נמצאה');

    // מעבר על השאלות, נקודה אחת לכל תשובה נכונה.
    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += 1;
    });

    const submission = new Submission({
      examId,
      studentId,
      answers,
      score,
      total: exam.questions.length,
    });
    this.logger?.info('submission saved', submission.id, `${score}/${exam.questions.length}`);
    return this.db.insert('submissions', submission);
  }
}
