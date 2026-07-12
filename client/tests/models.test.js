import { describe, it, expect } from 'vitest';
import { Question } from '../src/models/Question.js';
import { Exam, EXAM_STATUS } from '../src/models/Exam.js';
import { Submission } from '../src/models/Submission.js';
import { User } from '../src/models/User.js';

const validQuestion = { text: 'Q?', options: ['a', 'b'], correctAnswer: 0 };

describe('Question.isValid', () => {
  it('accepts a well-formed question', () => {
    expect(new Question(validQuestion).isValid()).toBe(true);
  });

  it('rejects empty text, too few options, or an out-of-range answer', () => {
    expect(new Question({ ...validQuestion, text: '' }).isValid()).toBe(false);
    expect(new Question({ ...validQuestion, options: ['only-one'] }).isValid()).toBe(false);
    expect(new Question({ ...validQuestion, correctAnswer: 5 }).isValid()).toBe(false);
  });
});

describe('Exam', () => {
  it('isPublishable requires a title and only valid questions', () => {
    expect(new Exam({ title: 'T', questions: [validQuestion] }).isPublishable()).toBe(true);
    expect(new Exam({ title: '', questions: [validQuestion] }).isPublishable()).toBe(false);
    expect(new Exam({ title: 'T', questions: [] }).isPublishable()).toBe(false);
  });

  it('publish() promotes a publishable exam and throws otherwise', () => {
    const exam = new Exam({ title: 'T', questions: [validQuestion] });
    exam.publish();
    expect(exam.status).toBe(EXAM_STATUS.PUBLISHED);
    expect(() => new Exam({ title: '', questions: [] }).publish()).toThrow();
  });

  it('close() and toDraft() move the status', () => {
    const exam = new Exam({ title: 'T', questions: [validQuestion], status: EXAM_STATUS.PUBLISHED });
    exam.close();
    expect(exam.status).toBe(EXAM_STATUS.CLOSED);
    exam.toDraft();
    expect(exam.status).toBe(EXAM_STATUS.DRAFT);
  });
});

describe('Submission.percentage', () => {
  it('rounds score/total to a percentage and handles zero total', () => {
    expect(new Submission({ score: 3, total: 4 }).percentage()).toBe(75);
    expect(new Submission({ score: 0, total: 0 }).percentage()).toBe(0);
  });
});

describe('User', () => {
  it('publicProfile omits the password; role helpers work', () => {
    const user = new User({ name: 'N', email: 'E@x.com', password: 'secret', role: 'teacher' });
    expect(user.publicProfile()).not.toHaveProperty('password');
    expect(user.isTeacher()).toBe(true);
    expect(user.isStudent()).toBe(false);
    expect(user.email).toBe('e@x.com'); // normalized to lowercase
  });
});
