// Exam entity — a set of questions with a workflow status.
// Possible statuses: draft, published, closed.
// Methods like publish()/close() encapsulate the status-transition rules.

import { Question } from './Question.js';

export const EXAM_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

export class Exam {
  constructor({
    id,
    title = '',
    description = '',
    status = EXAM_STATUS.DRAFT,
    questions = [],
    createdBy = null,
    createdAt = Date.now(),
  } = {}) {
    this.id = id || `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.title = title;
    this.description = description;
    this.status = status;
    this.questions = questions.map(q => (q instanceof Question ? q : new Question(q)));
    this.createdBy = createdBy;
    this.createdAt = createdAt;
  }

  isPublishable() {
    return (
      this.title.trim().length > 0 &&
      this.questions.length > 0 &&
      this.questions.every(q => q.isValid())
    );
  }

  publish() {
    if (!this.isPublishable()) throw new Error('Exam not publishable');
    this.status = EXAM_STATUS.PUBLISHED;
  }

  close() {
    this.status = EXAM_STATUS.CLOSED;
  }

  toDraft() {
    this.status = EXAM_STATUS.DRAFT;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      questions: this.questions.map(q => q.toJSON()),
      createdBy: this.createdBy,
      createdAt: this.createdAt,
    };
  }

  static from(raw) {
    return new Exam(raw || {});
  }
}
