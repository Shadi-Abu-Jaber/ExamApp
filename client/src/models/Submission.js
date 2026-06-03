export class Submission {
  constructor({
    id,
    examId,
    studentId,
    answers = [],
    score = 0,
    total = 0,
    submittedAt = Date.now(),
  } = {}) {
    this.id = id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.examId = examId;
    this.studentId = studentId;
    this.answers = answers;
    this.score = score;
    this.total = total;
    this.submittedAt = submittedAt;
  }

  percentage() {
    if (!this.total) return 0;
    return Math.round((this.score / this.total) * 100);
  }

  toJSON() {
    return {
      id: this.id,
      examId: this.examId,
      studentId: this.studentId,
      answers: [...this.answers],
      score: this.score,
      total: this.total,
      submittedAt: this.submittedAt,
    };
  }

  static from(raw) {
    return new Submission(raw || {});
  }
}
